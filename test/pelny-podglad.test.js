import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// C1 (26.10): pełne CV przed płatnością – obrazek strony 1 (40% czytelne, reszta rozmyta), limity, ten sam wynik po płatności.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-c1-'));
const express = (await import('express')).default;
const { fullPreviewRoutes, fullPreviewPng, fullPreviewFor, fullKey, reusesWhole } = await import('../lib/full-preview.js');
const { PROFESSIONS } = await import('../lib/content.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), server = read('server.js'), html = read('public/index.html');
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));

const s = PROFESSIONS[0].sample;
const RESULT = { lang: 'pl', position: s.headline, keywords: ['kasa fiskalna'], cv: { ...s, experience: s.jobs, education: [s.education], certificates: [], interests: '', clause: 'Wyrażam zgodę na przetwarzanie danych.' } };
const AD = { title: 'Kasjer', text: 'Szukamy kasjera do sklepu spożywczego. Wymagania: obsługa kasy fiskalnej, terminala płatniczego, praca zmianowa, uprzejmość wobec klientów.' };
const profile = (n) => ({ name: `Anna ${n}`, email: 'a@example.com', experience: [{ title: 'Kasjerka', company: 'Sklep', from: '2020', to: 'obecnie', description: `Obsługa kasy ${n}` }], education: [] });

function server_(opts = {}) {
  const a = express(), calls = [], events = [];
  a.set('trust proxy', true);
  fullPreviewRoutes(a, {
    cleanProfile: (p) => ({ ...p, experience: p.experience || [], education: p.education || [] }), cleanAds: (xs) => xs.filter((x) => x?.text),
    prices: () => ({ cv: 3900, cv_letter: 4900, pack3: 7900 }), enabled: () => true,
    generate: async (p, ad, mode) => { calls.push([p.name, mode]); if (opts.slow) await new Promise((r) => setTimeout(r, opts.slow)); if (opts.fail) throw new Error('x'); return RESULT; },
    png: async () => Buffer.from('jpeg'), wait: opts.wait ?? 2000, count: async (e) => events.push(e), daily: () => opts.daily ?? 150, ...opts.extra,
  });
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const post = (b, ip = '1.1.1.1') => fetch(U + '/api/preview-full', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify({ ad: AD, ...b }) }).then((r) => r.json());
  return { srv, post, calls, events };
}

test('Obrazek: JPEG strony 1, 1000 px (komputer) i 600 px (telefon)', async () => {
  for (const [narrow, w] of [[false, 1000], [true, 600]]) {
    const b = await fullPreviewPng(RESULT, { tpl: 'nowoczesny', color: 'niebieski' }, { narrow, price: 39 });
    assert.equal(b[0], 0xff); assert.equal(b[1], 0xd8, 'JPEG');
    // szerokość z nagłówka SOF0/SOF2
    let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m === 0xc0 || m === 0xc2) { assert.equal(b.readUInt16BE(i + 7), w); break; } i += 2 + len; }
  }
});

test('Do przeglądarki trafia tylko obrazek; ten sam klucz = pamięć (bez drugiej generacji); zdarzenie full_preview_shown raz', async () => {
  const { srv, post, calls, events } = server_();
  try {
    const r = await post({ sid: 'sesja-aaaa1', profile: profile(1), pkg: 'cv_letter' });
    assert.equal(r.full, true); assert.match(r.image, /^data:image\/jpeg;base64,/);
    assert.ok(!JSON.stringify(r).includes(s.summary.slice(0, 30)), 'bez tekstu CV');
    assert.deepEqual(Object.keys(r).sort(), ['full', 'image', 'key']);
    const r2 = await post({ sid: 'sesja-aaaa1', profile: profile(1), pkg: 'cv_letter' });
    assert.equal(r2.full, true); assert.equal(calls.length, 1); assert.deepEqual(events, ['full_preview_shown']);
    assert.deepEqual(await fullPreviewFor(profile(1), AD, ''), RESULT, 'zapisane do zamówienia');
    assert.equal(await fullPreviewFor(profile(1), AD, 'rewrite'), null, 'inny tryb = inny klucz');
    assert.notEqual(fullKey(profile(1), AD), fullKey({ ...profile(1), name: 'Inna' }, AD), 'imię w kluczu (jest w CV)');
  } finally { srv.close(); }
});

test('Domyślny dzienny limit strony: 60 (PREVIEW_FULL_DAILY)', () => {
  assert.match(read('lib/full-preview.js'), /daily = \(\) => Number\(process\.env\.PREVIEW_FULL_DAILY\) \|\| 60/);
});

test('Limity: 1 nowa generacja na sesję, 2 na IP dziennie, limit dzienny strony → full_preview_limit; błąd nie zużywa limitu', async () => {
  const { srv, post, calls, events } = server_();
  try {
    assert.equal((await post({ sid: 'sesja-bbbb1', profile: profile(2) })).full, true);
    assert.deepEqual(await post({ sid: 'sesja-bbbb1', profile: profile(3) }), { off: true, reason: 'limit' }, 'zmiana danych w tej samej sesji');
    assert.equal((await post({ sid: 'sesja-bbbb2', profile: profile(4) })).full, true);
    assert.deepEqual(await post({ sid: 'sesja-bbbb3', profile: profile(5) }), { off: true, reason: 'limit' }, '3. na to samo IP');
    assert.equal((await post({ sid: 'sesja-bbbb4', profile: profile(5) }, '2.2.2.2')).full, true, 'inne IP');
    assert.equal(calls.length, 3); assert.equal(events.filter((e) => e === 'full_preview_limit').length, 2);
  } finally { srv.close(); }
  const d = server_({ daily: 1 });
  try {
    assert.equal((await d.post({ sid: 'sesja-cccc1', profile: profile(6) })).full, true);
    assert.equal((await d.post({ sid: 'sesja-cccc2', profile: profile(7) }, '3.3.3.3')).reason, 'limit');
  } finally { d.srv.close(); }
  const f = server_({ fail: true });
  try {
    assert.deepEqual(await f.post({ sid: 'sesja-dddd1', profile: profile(8) }), { off: true });
    assert.deepEqual(await f.post({ sid: 'sesja-dddd1', profile: profile(9) }), { off: true }, 'po błędzie sesja może spróbować z innymi danymi (nie „limit”)');
  } finally { f.srv.close(); }
});

test('Długie generowanie: „pending”, ponowne zapytanie nie uruchamia drugiej generacji', async () => {
  const { srv, post, calls } = server_({ slow: 300, wait: 50 });
  try {
    assert.equal((await post({ sid: 'sesja-eeee1', profile: profile(10) })).pending, true);
    assert.equal((await post({ sid: 'sesja-eeee1', profile: profile(10) })).pending, true);
    await new Promise((r) => setTimeout(r, 350));
    assert.equal((await post({ sid: 'sesja-eeee1', profile: profile(10) })).full, true);
    assert.equal(calls.length, 1);
  } finally { srv.close(); }
});

test('Po płatności: samo CV = wynik z podglądu bez generowania; z listem/dodatkami CV podmienione na to z podglądu', () => {
  assert.equal(reusesWhole({ fullPreview: RESULT, pkg: 'cv', addons: { docx: true } }), true);
  for (const o of [{ pkg: 'cv_letter' }, { pkg: 'pack3' }, { pkg: 'cv', addons: { interview: true } }, { pkg: 'cv', addons: { linkedin: true } }, { pkg: 'cv', addons: { messages: true } }]) assert.equal(reusesWhole({ fullPreview: RESULT, addons: {}, ...o }), false, JSON.stringify(o));
  assert.match(server, /const fullShown = await fullPreviewFor\(p, a\[0\], mode\)/);
  assert.match(server, /\.\.\.\(fullShown \? \{ fullPreview: fullShown \} : \{\}\)/);
  assert.match(server, /const gen = full && reusesWhole\(o\) \? async \(\) => structuredClone\(full\)/);
  assert.match(server, /cv: structuredClone\(full\.cv\)/);
  assert.match(server, /if \(hasCritical\(qa\) && aiEnabled\(\) && !full\)/);
});

test('Kreator: podgląd dopiero po kliknięciu „Pokaż moje CV” (notka o AI), ponawia „pending”, po limicie lekki podgląd (A1); przycisk „Odblokuj swoje CV – X zł”', () => {
  assert.match(app, /if \(fullOn\(\)\) drawFull\(fullPv\);\n  else if \(!pvShown && !fullRun\) \{ \$\('#pvOut'\)\.replaceChildren\(\); \$\('#pvBtn'\)\.hidden = false; pvHead\(\); \}/, 'bez automatycznego startu');
  assert.doesNotMatch(app.slice(app.indexOf('function drawSummary'), app.indexOf('function drawSummary') + 800), /fullPreview\(\)/);
  assert.match(app, /\$\('#pvBtn'\)\.onclick = \(\) => \(fullAvail\(\) \? fullPreview\(\) : lightPreview\(\)\);/);
  assert.match(app, /tr\(f \? 'Twoje dane trafią do dostawcy AI tylko po to, żeby przygotować ten podgląd\.' : PV_HEAD\[1\]\)/);
  assert.match(app, /tr\(f \? 'Pokaż moje CV' : 'Pokaż podgląd'\)/);
  assert.match(app, /if \(r\.pending\) \{ await new Promise\(\(ok\) => setTimeout\(ok, 3000\)\); continue; \}/);
  assert.match(app, /if \(!pvShown && step === 6\) lightPreview\(\);/);
  assert.match(app, /fullOn\(\) \? `\$\{tr\('Odblokuj swoje CV –'\)\} \$\{total\(\)\} zł`/);
  assert.match(app, /el\('img', \{ className: 'pv-img', src: r\.image, alt: tr\('Podgląd Twojego CV ze znakiem wodnym, dolna część rozmyta'\), draggable: false \}\)/);
  assert.match(app, /\['copy', 'cut', 'contextmenu', 'dragstart'\]\.forEach\(\(ev\) => \$\('#pvOut'\)\.addEventListener/);
  assert.match(html, /<b id="pvTitle">/); assert.match(html, /<p class="hint" id="pvHint">/);
  for (const l of ['en', 'de', 'uk']) for (const k of ['Odblokuj swoje CV –', 'Twoje CV pod to ogłoszenie', 'Piszemy Twoje CV…', 'Piszemy Twoje CV pod to ogłoszenie, zwykle około minuty. Twoje dane i ogłoszenie trafiają w tym celu do dostawcy AI, tak jak przy zamówieniu.', 'Tak wygląda Twoje CV. Po płatności dostaniesz dokładnie to CV w PDF, bez znaku wodnego i rozmycia.', 'Podgląd Twojego CV ze znakiem wodnym, dolna część rozmyta', 'Zobacz swoje CV przed płatnością', 'Twoje dane trafią do dostawcy AI tylko po to, żeby przygotować ten podgląd.', 'Pokaż moje CV']) assert.ok(dict(l)[k], `${l}: ${k}`);
});
