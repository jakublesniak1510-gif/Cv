import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-progi-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test' });
const express = (await import('express')).default;
const { B2B_TIERS, b2bTable, b2bQuote } = await import('../lib/pricing.js');
const { leads } = await import('../lib/store.js');
const b2b = await import('../lib/b2b.js');
const BASE = 'https://example.test';

test('Progi B2B 10/25/50/100 z rabatem 10/18/25/35%, bez progu 200+', () => {
  assert.deepEqual(B2B_TIERS, [{ min: 10, pct: 10 }, { min: 25, pct: 18 }, { min: 50, pct: 25 }, { min: 100, pct: 35 }]);
  assert.deepEqual(b2bTable(), { cv: [35, 31, 29, 25], cv_letter: [44, 40, 36, 31], pack3: [71, 64, 59, 51] });
  assert.equal(b2bQuote('cv_letter', 200).pct, 35, '200 kodów to nadal próg 100+');
  assert.equal(b2bQuote('cv_letter', 30).total, 30 * 4000);
});

test('Strona zamówienia: cena za kod i łącznie przy progu, cena z cennika, ?qty= wypełnia pole', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: BASE, demo: true });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const t = await (await fetch(U + '/dla-instytucji/zamow?qty=37')).text();
    for (const h of ['10–24 kodów', '25–49 kodów', '50–99 kodów', '100+ kodów']) assert.ok(t.includes(`<th>${h}</th>`), h);
    assert.ok(!/<th>[^<]*200/.test(t), 'brak progu 200+ w tabeli');
    assert.match(t, /CV \+ list motywacyjny \(49 zł\)<\/td><td><span class="m-tier">10–24 kodów: <\/span><b>44 zł<\/b> za kod<br><small>440 zł za 10<\/small>/);
    assert.match(t, /<b>40 zł<\/b> za kod<br><small>1000 zł za 25<\/small>/);
    assert.match(t, /name="qty"[^>]*value="37"/);
    assert.ok(!/<s>|<del>|line-through|najlepsz|gwarant/i.test(t), 'bez przekreśleń i obietnic');
  } finally { srv.close(); }
});

test('Oferta do zapytania z formularza: treść z progami, przykład dla liczby osób, link z ?qty=, wysyłka tylko raz', async () => {
  const m = b2b.leadOfferMail({ org: 'PUP Testowo', count: 60 }, BASE);
  assert.match(m.subject, /PUP Testowo/);
  assert.match(m.text, /od 10 kodów \(do 24\): CV 35 zł, CV \+ list motywacyjny 44 zł, Pakiet 3 CV \+ listy motywacyjne 71 zł za kod/);
  assert.match(m.text, /od 100 kodów: .*51 zł za kod/);
  assert.match(m.text, /Przykład dla 60 osób \(CV z listem motywacyjnym\): 36 zł za kod, razem 2160 zł/);
  assert.ok(m.text.includes(`${BASE}/dla-instytucji/zamow?qty=60`));
  assert.match(m.text, /14 dni/);
  assert.match(b2b.leadOfferMail({ org: 'X', count: 0 }, BASE).text, /zamow\?qty=10/, 'bez liczby osób: minimum 10');

  await leads.save({ id: 'L1', org: 'PUP Testowo', name: 'Jan Test', email: 'jan@example.test', count: 60, created: 1 });
  const l = await b2b.sendLeadOffer('L1', BASE, 1234);
  assert.equal(l.offerSentAt, 1234); assert.equal((await leads.get('L1')).offerSentAt, 1234);
  await assert.rejects(() => b2b.sendLeadOffer('L1', BASE), /już wysłana/);
  await assert.rejects(() => b2b.sendLeadOffer('nie-ma', BASE), /Nie ma takiego/);
});

test('Panel: POST /leads/:id/offer wysyła ofertę, drugi raz 400', async () => {
  await leads.save({ id: 'L2', org: 'Fundacja Test', name: 'Ola', email: 'ola@example.test', count: 12, created: 1 });
  const app = express(), api = express.Router(); api.use(express.json()); b2b.b2bAdmin(api, { BASE_URL: BASE }); app.use('/api/admin', api);
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}/api/admin/leads/L2/offer`;
  try {
    const r1 = await fetch(U, { method: 'POST' }); assert.equal(r1.status, 200); assert.ok((await r1.json()).lead.offerSentAt);
    assert.equal((await fetch(U, { method: 'POST' })).status, 400);
  } finally { srv.close(); }
});
