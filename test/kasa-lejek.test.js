import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Raport 26.10: ostatni krok → płatność 8 → 1. Zdarzenia do pomiaru za tydzień i widoczny błąd walidacji przy przycisku.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-kasa-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, abExpose, funnelRange, funnelText, PAY_BLOCKS } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('summary_view, pay_click (też per wariant checkout), pay_block z powodem, pay_error – raz na osobę; w raporcie lejka', async () => {
  const app = express(); analyticsRoutes(app, 'https://example.test');
  app.get('/expose/:v', async (req, res) => { await abExpose(req, { checkout: req.params.v }); res.end(); });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, body) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(body) });
  try {
    await fetch(U + '/expose/B', { headers: { 'User-Agent': 'Mozilla/5.0 K1' } });
    for (const e of [{ e: 'step', s: 6 }, { e: 'step', s: 6 }, { e: 'payclick' }, { e: 'payclick' }, { e: 'payblock', why: 'consent' }, { e: 'payblock', why: 'consent' }, { e: 'payblock', why: 'waiver' }, { e: 'payerr' }]) await t('Mozilla/5.0 K1', e);
    for (const e of [{ e: 'step', s: 6 }, { e: 'payclick' }, { e: 'payblock', why: '<script>' }, { e: 'step', s: 5 }]) await t('Mozilla/5.0 K2', e);
    await t('HeadlessChrome', { e: 'payclick' });
    await wait(300);
    const d = Object.values(await analyticsDays())[0], ev = d.events;
    assert.equal(ev.summary_view, 2); assert.equal(ev.pay_click, 2, 'raz na osobę, bez botów');
    assert.equal(ev['pay_block:consent'], 1); assert.equal(ev['pay_block:waiver'], 1); assert.equal(ev['pay_block:inne'], 1, 'nieznany powód → inne');
    assert.equal(ev.pay_error, 1); assert.equal(d.ab['checkout:B'].pay_click, 1);
    const f = await funnelRange(d.id, d.id);
    assert.match(funnelText(f), /Ostatni krok: podsumowanie 2, klik „Zapłać” 2, zablokowane walidacją: (consent|waiver|inne) 1, (consent|waiver|inne) 1, (consent|waiver|inne) 1, błąd zamówienia 1\./);
  } finally { srv.close(); }
  assert.deepEqual(PAY_BLOCKS, ['consent', 'waiver', 'invoice', 'alerts', 'ads', 'inne']);
});

test('Klient: klik „Zapłać” i powód blokady liczone tylko na ostatnim kroku; błąd przewija do pola i jest powtórzony nad przyciskiem', () => {
  const app = read('public/app.js'), html = read('public/index.html'), css = read('public/style.css');
  assert.match(app, /const last = ORDER\.indexOf\(step\) === ORDER\.length - 1;\n  if \(last\) track\('payclick'\);/);
  assert.match(app, /if \(err\) \{ if \(last\) track\('payblock', \{ why: payBlockOf\(err\)\[1\] \}\); return showWizErr\(err\); \}/);
  assert.match(app, /catch \(x\) \{ track\('payerr'\); showWizErr\(x\.message\); \}/);
  assert.match(app, /box\.scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/); assert.match(app, /box\.classList\.add\('need'\)/);
  // Mapowanie komunikatów walidacji (validate) na pola – każdy komunikat ostatniego kroku ma swoje pole.
  const src = app.match(/const PAY_BLOCK = (\[.*\]);/)[1], PB = eval(src.replace(/'#\w+'/g, (m) => JSON.stringify(m)));
  const of = (e) => (PB.find(([re]) => re.test(e)) || [null, 'inne'])[1];
  for (const [msg, why] of [['Zaakceptuj Regulamin i Politykę prywatności.', 'consent'], ['Zaznacz zgodę na wykonanie usługi od razu po płatności.', 'waiver'], ['Sprawdź NIP do faktury – powinien mieć 10 cyfr.', 'invoice'], ['Do faktury podaj nazwę (albo imię i nazwisko) oraz adres.', 'invoice'], ['Wpisz zawód do ofert pracy na e-mail albo odznacz tę opcję.', 'alerts'], ['Wybrany pakiet obejmuje jedno ogłoszenie. Usuń dodatkowe ogłoszenia albo wybierz Pakiet 3 za 79 zł.', 'ads']]) {
    assert.ok(app.includes(msg), `komunikat w validate: ${msg}`); assert.equal(of(msg), why, msg);
  }
  assert.match(html, /<div class="wiz-foot"><p class="werr-foot" id="werrFoot" aria-hidden="true" hidden><\/p>/);
  assert.match(css, /label\.need\{outline:2px solid var\(--err\)/);
  // Test „checkout” zostaje (CHECKOUT_B: zgody kompaktowo); 29.10: bez górnej ramki z ceną w obu wariantach.
  assert.match(app, /if \(CHECKOUT_B\) \{\n  for \(const id of \['consent', 'waiver'\]\)/); assert.doesNotMatch(app, /sumTop/);
});
