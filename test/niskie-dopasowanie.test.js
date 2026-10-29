import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Wskazówka przy niskim dopasowaniu (29.10): w ramce „Dopasowanie do ogłoszenia” (krok 3), gdy pokrycie < 40% i ≥ 3 wymagania;
// maks. 3 brakujące wymagania jako szare chipy, przycisk „Uzupełnij doświadczenie” (krok 2, kursor w opisie ostatniego stanowiska,
// nic nie wpisujemy za klienta); przeliczenie bez AI; bez powtórki przy niezmienionym wyniku; zdarzenia i tabela w panelu.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-lowmatch-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, lowMatchStats } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const app = read('public/app.js');

test('Warunek, treść i wygląd: < 40%, ≥ 3 wymagania, maks. 3 krótkie hasła, ghost-przycisk; bez obietnic i presji', () => {
  assert.match(app, /const LOW_MATCH = 40;/);
  assert.match(app, /if \(!hasExp \|\| hinted \|\| m\.n < 3 \|\| pct >= LOW_MATCH \|\| !m\.missing\.length \|\| \(lowHint\?\.ad === i && pct <= lowHint\.before\)\) return \[\];/, 'warunek i brak powtórki przy niezmienionym wyniku');
  assert.match(app, /m\.missing\.slice\(0, 3\)\.map\(shortKw\)/, 'maks. 3 hasła');
  const shortKw = new Function(`${/const shortKw = [^\n]+/.exec(app)[0]} return shortKw;`)();
  for (const [k, want] of [['praca zmianowa (3 zmiany)', 'praca zmianowa'], ['praca zmianowa (3)', 'praca zmianowa'], ['obsługa wózków widłowych (UDT)', 'obsługa wózków widłowych'], ['dokładność, rzetelność i punktualność', 'dokładność, rzetelność i'], ['praca w magazynie, zmiany', 'praca w magazynie'], ['wózki widłowe, UDT', 'wózki widłowe, UDT'], ['wózki widłowe – UDT', 'wózki widłowe'], ['komunikatywność', 'komunikatywność'], ['(mile widziane) doświadczenie', 'mile widziane doświadczenie']]) assert.equal(shortKw(k), want, k);
  assert.match(app, /'Możesz podnieść dopasowanie\. Ogłoszenie wymaga m\.in\.:'/);
  assert.match(app, /'Jeśli robiłeś\(-aś\) coś podobnego, dopisz to w opisie stanowiska – tylko to, co naprawdę robiłeś\(-aś\)\.'/);
  assert.match(app, /className: 'btn ghost sm', id: 'lowMatchEdit', textContent: 'Uzupełnij doświadczenie'/);
  assert.match(app, /className: 'hint low-hint'/); assert.match(app, /className: 'chip mute'/);
  const block = app.slice(app.indexOf('let lowHint = null;'), app.indexOf('const one = (m, i) =>'));
  const texts = [...block.matchAll(/textContent: '([^']+)'/g)].map((m) => m[1]); assert.equal(texts.length, 3);
  for (const t of texts) assert.doesNotMatch(t, /!|szans|pracę|tylko dziś|zostało|gwarant/i, `bez wykrzykników, obietnic i presji: ${t}`);
  for (const l of ['en', 'uk', 'de']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Uzupełnij doświadczenie'], l);
});

test('Działanie: krok 2, kursor w opisie ostatniego stanowiska, bez wpisywania; przeliczenie tym samym /api/wizard-match (bez AI); płatność bez blokady', () => {
  assert.match(app, /lowHint = \{ ad, before \}; track\('lowedit'\); go\(2\);/);
  assert.match(app, /const ta = \$\$\('#exp \.entry \[data-k=description\]'\)\.at\(-1\);/); assert.match(app, /ta\.focus\(\{ preventScroll: true \}\)/);
  const fn = app.slice(app.indexOf('function lowMatchEdit'), app.indexOf('async function drawWizMatch'));
  assert.doesNotMatch(fn, /\.value =/, 'nic nie wpisujemy za klienta');
  assert.match(app, /const sig = JSON\.stringify\(\[cv, hasExp, ads\.map\(\(a\) => a\.text\), lowHint\]\);/, 'po kliknięciu ramka liczy się od nowa');
  assert.match(read('server.js'), /app\.post\('\/api\/wizard-match'[\s\S]*?scanFallback\(\{ cvText: cv, adText: t \}\)/, 'wynik bez AI');
  assert.doesNotMatch(app, /lowHint[^\n]*(?:disabled|return 'Uzupełnij)/, 'nie blokuje płatności');
});

test('Zdarzenia low_match_hint / edit / gain (raz na osobę, przed i po) i tabela w panelu', async () => {
  const a = express(); analyticsRoutes(a, 'https://example.test');
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, body) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(body) });
  try {
    for (const ua of ['A', 'B', 'C']) { await t(`Mozilla/5.0 ${ua}`, { e: 'lowhint' }); await t(`Mozilla/5.0 ${ua}`, { e: 'lowhint' }); }
    for (const ua of ['A', 'B']) await t(`Mozilla/5.0 ${ua}`, { e: 'lowedit' });
    await t('Mozilla/5.0 A', { e: 'lowgain', b: 27, a: 45 }); await t('Mozilla/5.0 B', { e: 'lowgain', b: 30, a: 35 }); await t('Mozilla/5.0 C', { e: 'lowgain', b: 40, a: 20 });
    await wait(300);
    const ev = Object.values(await analyticsDays()).reduce((o, x) => ({ ...o, ...x.events }), {});
    assert.deepEqual(lowMatchStats(ev), { hint: 3, edit: 2, gain: 2, before: 29, after: 40 }, 'spadek wyniku nie jest „wzrostem”');
  } finally { srv.close(); }
  assert.match(read('public/admin.html'), /<div class="tbl-wrap" id="seoLowMatch"><\/div>/);
  assert.match(read('public/admin.js'), /\['hint', 'Pokazana', 1\], \['edit', 'Kliknięta „Uzupełnij”', 1\], \['gain', 'Wynik wzrósł', 1\]/);
  assert.match(read('lib/seo-report.js'), /lowMatch: lowMatchStats\(ev28\)/);
});
