import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Kreator i kasa: podgląd dopasowania (silnik skanera bez AI, /api/wizard-match), podgląd początku CV w podsumowaniu,
// blok zaufania przy płatności (oba warianty testu checkout), „Polecany” przy CV + list. Bez liczników czasu i wymyślonych liczb.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const AD = 'Magazynier. Wymagania: obsługa wózka widłowego, uprawnienia UDT, znajomość SAP, gotowość do pracy zmianowej, certyfikat BHP.';

test('/api/wizard-match: wymagania z ogłoszenia i pokrycie z danych formularza; bez doświadczenia sama liczba; nic nie zapisuje', { timeout: 60_000 }, async () => {
  const port = 5900 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-wm-'));
  const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '' }, stdio: 'ignore' });
  const U = `http://localhost:${port}`, post = (b) => fetch(U + '/api/wizard-match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    // Raport SEO zapisywany przez harmonogram przy starcie serwera (seo-reports.json, także *.tmp) pomijamy – liczy się, czy endpoint coś zapisał.
    const files = () => fs.readdirSync(dir).filter((f) => !/^seo-reports\.json/.test(f)).sort();
    const before = files();
    const r = await post({ cv: 'Magazynier: obsługa wózka widłowego, inwentaryzacja', ads: [AD, 'za krótkie'] }), j = await r.json();
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.equal(j.ads[0].n, 5); assert.deepEqual(j.ads[0].found, ['obsługa wózka widłowego']); assert.equal(j.ads[0].missing.length, 4); assert.equal(j.ads[1], null);
    const e = await (await post({ cv: '', ads: [AD] })).json();
    assert.deepEqual(e.ads[0], { n: 5, found: [], missing: [] });
    assert.deepEqual(files(), before, 'bez zapisu');
  } finally { srv.kill(); }
});

test('Kreator: panel dopasowania w podsumowaniu (per ogłoszenie zwinięty), podgląd CV 2–3 zdania, bez błędu gdy AI niedostępne', () => {
  const h = read('public/index.html'), app = read('public/app.js');
  const s6 = h.slice(h.indexOf('<section data-step="6"'), h.indexOf('<section data-step="7"'));
  assert.ok(s6.indexOf('id="wizMatch"') < s6.indexOf('id="pvBox"') && s6.indexOf('id="pvBox"') < s6.indexOf('id="sum"'), 'dopasowanie i podgląd nad podsumowaniem');
  assert.match(s6, /<b>Tak zacznie się Twoje CV pod to ogłoszenie<\/b>/);
  assert.match(app, /fetch\('\/api\/wizard-match'/); assert.match(app, /el\('details', \{ className: 'optbox' \}/);
  assert.match(app, /Z ogłoszenia wyciągnęliśmy \$\{m\.n\} \$\{plural\(m\.n, 'wymaganie', 'wymagania', 'wymagań'\)\}/);
  assert.match(app, /textContent: firstSentences\(r\.summary, 3\) \}\), \/\/ 2–3 zdania/, 'podgląd: 3 pierwsze zdania (test/podglad-zdania.test.js)');
  assert.match(app, /if \(r\.off \|\| !r\.summary\) \{ pvOff = true; \$\('#pvBox'\)\.hidden = true; \$\('#pvEx'\)\.hidden = false; return; \}/);
  assert.match(app, /PV_FAKE/, 'rozmyty fragment to przykładowa treść, nie dane klienta');
});

test('Kasa: blok zaufania w obu wariantach testu checkout, bez wymyślonych liczb; „Polecany” przy CV + list z dopłatą z cennika', () => {
  const h = read('public/index.html'), app = read('public/app.js');
  const pt = app.slice(app.indexOf('// Blok zaufania nad przyciskiem płatności'), app.indexOf("'Faktura na życzenie'") + 40);
  assert.doesNotMatch(pt, /CHECKOUT_B/, 'ten sam blok w A i B');
  for (const t of ["'Gotowe zwykle w kilka minut – e-mailem i na stronie'", "'Dane usuwane automatycznie po 30 dniach'", "'Faktura na życzenie'", "plural(rev, 'poprawka w cenie', 'poprawki w cenie', 'poprawek w cenie')", 'cfg.maxRevisions']) assert.ok(pt.includes(t), t);
  assert.match(read('server.js'), /const MAX_REVISIONS = 5;/);
  assert.doesNotMatch(app + h, /gotowe w 5[–-]10 minut|najczęściej wybierany|odliczani|countdown/i);
  assert.match(h, /<label class="opt rec"><input type="radio" name="pkg" value="cv_letter" checked>.*<span class="badge-rec">Polecany<\/span>.*<span>list motywacyjny pod to samo ogłoszenie za<\/span> <span id="letterDiff">10 zł<\/span> <span>więcej<\/span>/);
  assert.equal((h.match(/badge-rec/g) || []).length, 1);
  assert.match(app, /\$\('#letterDiff'\)\.textContent = `\$\{PRICE\.cv_letter - PRICE\.cv\} zł`/);
  assert.equal((h.match(/<!--tp-mini-->/g) || []).length, 1, 'jedno miejsce na TrustBox Mini');
  for (const l of ['en', 'de', 'uk']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const k of ['Tak zacznie się Twoje CV pod to ogłoszenie', 'Z ogłoszenia wyciągnęliśmy {0} wymagań.', 'Z ogłoszenia wyciągnęliśmy {0} wymaganie, z którym dopasujemy CV.', 'Twoje doświadczenie pokrywa {0} z nich:', 'W CV ujmiemy też:', 'poprawek w cenie', 'Gotowe zwykle w kilka minut – e-mailem i na stronie', 'Dane usuwane automatycznie po 30 dniach', 'Faktura na życzenie', 'list motywacyjny pod to samo ogłoszenie za', 'więcej', 'Polecany']) assert.ok(d[k], `${l}: ${k}`);
  }
});
