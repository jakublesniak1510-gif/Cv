import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// C2 (26.10): „Masz już CV? Wgraj plik” na górze kroku danych (istniejący import /api/import → importCv), „Nie mam CV – wpiszę ręcznie”, zdarzenie cv_import_used.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-c2-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, funnelRange, funnelText } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), html = read('public/index.html');
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));

test('Duże pole importu na górze kroku danych, upuszczenie pliku, „Nie mam CV – wpiszę ręcznie”', () => {
  const s2 = html.slice(html.indexOf('<section data-step="2"'), html.indexOf('<section data-step="3"'));
  assert.match(s2, /^<section data-step="2" hidden>\s*<div class="import big" id="importBox"><div><b>Masz już CV\? Wgraj plik \(PDF\/Word\), uzupełnimy pola za Ciebie<\/b>/, 'pierwszy element kroku');
  assert.match(s2, /<input type="file" id="importFile" accept="\.pdf,\.docx,\.txt" hidden>/);
  assert.match(s2, /<button type="button" class="link" id="importManual">Nie mam CV – wpiszę ręcznie<\/button>/);
  assert.match(app, /box\.addEventListener\('drop', async \(e\) => \{/);
  assert.match(app, /\$\('#importManual'\)\.onclick = \(\) => \{ box\.classList\.add\('small'\); \$\('#name'\)\.focus\(\); \};/);
  assert.match(app, /fetch\('\/api\/import'/, 'istniejący import (importCv)');
  assert.match(app, /if \(p\.experience\?\.length && empty\('exp'\)\)/); assert.match(app, /if \(p\.education\?\.length && empty\('edu'\)\)/);
  assert.match(app, /saveDraft\(\); imported = true; \$\('#importBox'\)\.classList\.add\('small'\); \$\('#moreData'\)\.open = true; track\('cvimport'\);/);
  for (const l of ['en', 'de', 'uk']) for (const k of ['Masz już CV? Wgraj plik (PDF/Word), uzupełnimy pola za Ciebie', 'Ty tylko sprawdzasz. Pliku nie zapisujemy.', 'Nie mam CV – wpiszę ręcznie', 'Wgraj plik PDF, Word (.docx) albo TXT.']) assert.ok(dict(l)[k], `${l}: ${k}`);
});

test('Zdarzenie cv_import_used: raz na osobę, w raporcie lejka', async () => {
  const a = express(); analyticsRoutes(a, 'https://example.test');
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify({ e: 'cvimport' }) });
  try {
    await t('Mozilla/5.0 I1'); await t('Mozilla/5.0 I1'); await t('Mozilla/5.0 I2');
    await new Promise((r) => setTimeout(r, 300));
    const d = Object.values(await analyticsDays())[0];
    assert.equal(d.events.cv_import_used, 2);
    assert.match(funnelText(await funnelRange(d.id, d.id)), /Kreator: dane z wgranego CV 2\./);
  } finally { srv.close(); }
});
