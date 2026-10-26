import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-wizfunnel-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, abExpose, wizardFunnel } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// PR N: lejek kreatora krok po kroku – wejścia, wyjścia, % przejść, osobno dla wariantów testów (ten sam visitorId co A/B).
test('Kroki i wyjścia raz na osobę, razem i per wariant; kolejność i nazwy wariantu B testu kolejności', async () => {
  const app = express(); analyticsRoutes(app, 'https://example.test');
  app.get('/expose/:v', async (req, res) => { await abExpose(req, { wizard_order: req.params.v }); res.end(); });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, body) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(body) });
  try {
    await fetch(U + '/expose/A', { headers: { 'User-Agent': 'Mozilla/5.0 A' } }); await fetch(U + '/expose/B', { headers: { 'User-Agent': 'Mozilla/5.0 B' } });
    for (const e of [{ e: 'start' }, { e: 'step', s: 1 }, { e: 'step', s: 2 }, { e: 'step', s: 2 }, { e: 'wizexit', s: 2 }, { e: 'wizexit', s: 2 }]) await t('Mozilla/5.0 A', e);
    for (const e of [{ e: 'start' }, { e: 'step', s: 5 }, { e: 'step', s: 2 }, { e: 'step', s: 3 }, { e: 'wizexit', s: 3 }, { e: 'wizexit', s: 9 }]) await t('Mozilla/5.0 B', e);
    await wait(300);
    const f = wizardFunnel(Object.values(await analyticsDays()));
    assert.deepEqual(f.map((g) => g.group), ['all', 'wizard_order:A', 'wizard_order:B']);
    const row = (g, l) => f.find((x) => x.group === g).rows.find((r) => r.label === l);
    assert.equal(row('all', 'Otwarcie kreatora').n, 2); assert.equal(row('all', '2. Dane').n, 2); assert.equal(row('all', '2. Dane').exits, 2, 'C3: wyjście z dawnego kroku 3 liczy się do „Danych”');
    assert.deepEqual(f.find((x) => x.group === 'all').rows.map((r) => r.label), ['Otwarcie kreatora', '1. Ogłoszenie i pakiet', '2. Dane', '3. Podsumowanie i płatność', 'Płatność rozpoczęta', 'Opłacone'], 'C3: 3 ekrany');
    assert.equal(row('wizard_order:A', '1. Pakiet').n, 1); assert.equal(row('wizard_order:A', '2. Dane').exits, 1, 'wyjście liczone raz');
    const B = f.find((x) => x.group === 'wizard_order:B').rows.map((r) => r.label);
    assert.deepEqual(B, ['Otwarcie kreatora', '1. Ogłoszenie', '2. Dane', '3. Doświadczenie', '4. Wykształcenie', '5. Pakiet, wygląd i podsumowanie', 'Płatność rozpoczęta', 'Opłacone']);
    assert.equal(row('wizard_order:B', '3. Doświadczenie').exits, 1); assert.equal(row('wizard_order:B', '1. Ogłoszenie').rate, 100);
    assert.equal(row('wizard_order:B', '4. Wykształcenie').rate, 0);
  } finally { srv.close(); }
});

test('Klient: wyjście przy zamknięciu i opuszczeniu strony, nie przy przejściu do płatności; panel → SEO, stara tabela → link', () => {
  const app = read('public/app.js'), adm = read('public/admin.js'), html = read('public/admin.html');
  assert.match(app, /const wizExit = \(\) => \{ if \(!\$\('#wiz'\)\.hidden && !leavingToPay && step >= 1 && step <= 6\) track\('wizexit', \{ s: step \}\); \};/);
  assert.match(app, /addEventListener\('pagehide', wizExit\);/); assert.match(app, /const closeWiz = \(\) => \{ wizExit\(\);/);
  assert.match(app, /leavingToPay = true; location\.href = j\.url;/);
  assert.match(html, /<div id="seoWizard"><\/div>/); assert.match(html, /data-go="seo">Panel → SEO → Lejek kreatora/); assert.doesNotMatch(html, /id="trFunnel"/);
  assert.match(adm, /\$\('#seoWizard'\)/); assert.doesNotMatch(adm, /trFunnel/);
});
