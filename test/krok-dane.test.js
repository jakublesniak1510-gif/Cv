import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Krok „Dane” (2.11): import CV z pliku albo wklejonego tekstu, autozapis szkicu co 10 s, step2_exit z powodem i źródłem,
// step2_import_used (plik / tekst), tabela w panelu obok wyjść z kroku 1.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-krok2-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, step2Exits, step2Import, STEP2_WHY } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), html = read('public/index.html');

test('Krok 2: „Wklej tekst CV” obok pliku (ten sam import), autozapis co 10 s, powód wyjścia', () => {
  const s2 = html.slice(html.indexOf('<section data-step="2"'), html.indexOf('<section data-step="3"'));
  assert.match(s2, /id="importPaste">Wklej tekst CV<\/button>/);
  assert.match(s2, /<div class="import-paste" id="importPasteBox" hidden><textarea id="importText" rows="5" aria-label="Tekst CV" placeholder="Wklej tutaj treść swojego CV"><\/textarea><button type="button" class="btn sm" id="importTextGo">Uzupełnij pola z tekstu<\/button><\/div>/);
  assert.match(app, /importData\(textB64\(t\), 'text'\);/); assert.match(app, /async function importData\(b64, via = 'file'\)/);
  assert.match(app, /setInterval\(\(\) => \{ if \(!\$\('#wiz'\)\.hidden && step === 2\) saveDraft\(\); \}, 10000\);/);
  assert.match(app, /return filled \? 'close' : importFailed \? 'import_fail' : 'empty';/);
  assert.match(app, /const closeWiz = \(\) => \{ wizExit\(\); step1Exit\(\); step2Exit\(\);/); assert.match(app, /addEventListener\('pagehide', step2Exit\)/);
  assert.match(app, /if \(restoreDraft\(\)\) \$\('#draftNote'\)\.hidden = false;/, 'szkic przywracany po powrocie bez pytania');
  for (const l of ['en', 'uk', 'de']) for (const k of ['Wklej tekst CV', 'Uzupełnij pola z tekstu', 'Wklej tutaj treść swojego CV']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))[k], `${l}: ${k}`);
  assert.ok(Buffer.byteLength(html) <= 90e3);
});

test('Zdarzenia step2_exit (powód × źródło, raz na osobę) i step2_import_used (plik/tekst); panel', async () => {
  const a = express(); analyticsRoutes(a, 'https://example.test');
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, body) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': `Mozilla/5.0 ${ua}` }, body: JSON.stringify(body) });
  try {
    for (const [ua, u, why] of [['a', 'google', 'empty'], ['b', '', 'import_fail'], ['c', 'meta', 'close'], ['d', '', 'xyz']]) { await t(ua, { e: 'pv', u, p: '/' }); await t(ua, { e: 'step2exit', why, u }); await t(ua, { e: 'step2exit', why, u }); }
    await t('e', { e: 'cvimport', via: 'text' }); await t('f', { e: 'cvimport' });
    await new Promise((r) => setTimeout(r, 300));
    const ev = Object.values(await analyticsDays()).reduce((o, x) => ({ ...o, ...x.events }), {});
    assert.equal(ev.step2_exit, 4, 'raz na osobę');
    const rows = step2Exits(ev), r = (k) => rows.find((x) => x.key === k);
    assert.deepEqual(rows.map((x) => x.label), Object.values(STEP2_WHY));
    assert.deepEqual(r('empty').src, { google: 1, facebook: 0, direct: 0, inne: 0 }); assert.equal(r('import_fail').src.direct, 1);
    assert.equal(r('close').n, 2, 'meta → facebook, nieznany powód → close'); assert.equal(r('close').src.facebook, 1);
    assert.deepEqual(step2Import(ev), { n: 2, file: 1, text: 1 }); assert.equal(ev.cv_import_used, 2, 'dotychczasowy licznik bez zmian');
    assert.deepEqual(step2Exits({}), []);
  } finally { srv.close(); }
  assert.match(read('public/admin.html'), /<div class="tbl-wrap" id="seoStep2"><\/div><p class="help" id="seoStep2Import"><\/p>/);
  assert.match(read('public/admin.js'), /\$\('#seoStep2'\)\.replaceChildren\(d\.step2\?\.length \? stackTable\(/);
});
