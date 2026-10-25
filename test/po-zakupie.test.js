import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Po zakupie: w mailu z gotowym CV jedna propozycja (samo CV → list do tego ogłoszenia, CV z listem → przygotowanie do rozmowy),
// propozycja konta dopiero po zakupie (bez pola w kasie), w koncie „Zrób kolejne CV… – dane już są” z prefillem.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-po-'));
process.env.SMTP_URL = 'json';
const { orderMailOffer, sendOrderMail } = await import('../lib/mail.js');
const { PRICES } = await import('../lib/pricing.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const base = { id: 'o1', status: 'done', ads: [{ title: 'Magazynier', text: 'x' }], addons: {}, extraLangs: [], profile: { name: 'Jan Test', email: 'jan@example.test' }, results: [], uiLang: 'pl' };

test('Jedna propozycja z ceną z cennika: samo CV → list, CV z listem → przygotowanie do rozmowy, inaczej brak', () => {
  assert.deepEqual(orderMailOffer({ ...base, pkg: 'cv' }), { key: 'letter', price: (PRICES.cv_letter - PRICES.cv) / 100 });
  assert.deepEqual(orderMailOffer({ ...base, pkg: 'cv_letter' }), { key: 'interview', price: PRICES.interview / 100 });
  assert.equal(orderMailOffer({ ...base, pkg: 'cv_letter', addons: { interview: true } }), null);
  assert.equal(orderMailOffer({ ...base, pkg: 'cv', upsellOf: 'o0' }), null, 'nie dla dokupionego dodatku');
  assert.equal(orderMailOffer({ ...base, pkg: 'cv_letter', pass: { id: 'p' } }), null, 'nie dla zamówienia z karnetu');
});

test('Mail z CV: propozycja i link do dokupienia, propozycja konta (gdy go nie zakładano), 4 języki', async () => {
  const m = JSON.parse((await sendOrderMail({ ...base, pkg: 'cv' }, 'https://example.test')).message);
  assert.match(m.text, /Dodaj list motywacyjny pod to samo ogłoszenie – 10 zł\. Dokupisz na stronie dokumentów: https:\/\/example\.test\/\?id=o1#upsell/);
  assert.match(m.text, /załóż darmowe konto jednym kliknięciem \(opcjonalnie\): https:\/\/example\.test\/\?id=o1#acctOffer/);
  assert.equal((m.text.match(/zł\. Dokupisz/g) || []).length, 1, 'jedna propozycja');
  const i = JSON.parse((await sendOrderMail({ ...base, pkg: 'cv_letter', uiLang: 'en', createAccount: true }, 'https://example.test')).message);
  assert.match(i.text, /Interview preparation for this job ad – PLN 50\. You can add it on your documents page:/); assert.doesNotMatch(i.text, /create a free account/);
  for (const l of ['de', 'uk']) assert.match(JSON.parse((await sendOrderMail({ ...base, pkg: 'cv', uiLang: l }, 'https://example.test')).message).text, l === 'de' ? /Anschreiben für dieselbe Anzeige hinzufügen – 10 PLN/ : /супровідний лист під те саме оголошення – 10 зл/);
});

test('Kasa bez pola „Załóż darmowe konto”; konto po zakupie; w koncie link do kolejnego CV z danymi', () => {
  const h = read('public/index.html'), app = read('public/app.js');
  assert.doesNotMatch(h, /id="createAccount"/); assert.doesNotMatch(app, /\$\('#createAccount'\)/);
  assert.match(app, /async function drawAcctOffer\(\)/, 'propozycja konta na stronie dokumentów po zakupie');
  assert.match(app, /href: `\/\?id=\$\{d\.orders\[0\]\.id\}#kolejne`, textContent: 'Zrób kolejne CV pod nowe ogłoszenie w 2 minuty – dane już są'/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Zrób kolejne CV pod nowe ogłoszenie w 2 minuty – dane już są'], l);
});
