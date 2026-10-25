import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRICES, calcTotal, lineItems, nextEligible, NEXT_WINDOW } from '../lib/pricing.js';
import { legalBody } from '../lib/legal.js';

// „Kolejne CV pod nowe ogłoszenie – 19 zł” (z listem 29 zł): stała pozycja cennika, tylko z opłaconego zamówienia
// przez 30 dni od opłacenia (strona dokumentów, dane z zamówienia). Regulamin (4 języki), cennik na stronie, raport sprzedaży.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('Cena: CV 19 zł, CV z listem 29 zł, Pakiet 3 bez zmian; zwykłe zamówienie bez zmian; okno 30 dni', () => {
  assert.equal(PRICES.cv_next, 1900);
  assert.equal(calcTotal('cv', 1, {}, 'next', []), 1900);
  assert.equal(calcTotal('cv_letter', 1, {}, 'next', []), 1900 + PRICES.cv_letter - PRICES.cv);
  assert.equal(calcTotal('pack3', 2, {}, 'next', []), PRICES.pack3);
  assert.equal(calcTotal('cv', 1, {}, true, []), PRICES.cv, 'po 30 dniach – zwykła cena');
  assert.equal(calcTotal('cv', 1, {}, false, []), PRICES.cv);
  assert.equal(lineItems('cv', 1, {}, 'next', [])[0].name, 'Kolejne CV pod nowe ogłoszenie');
  assert.equal(calcTotal('cv', 1, { docx: true }, 'next', ['en']), 1900 + PRICES.docx + PRICES.extraLang, 'dodatki według cennika');
  const now = Date.now();
  assert.equal(nextEligible({ status: 'done', paidAt: now - NEXT_WINDOW + 1000 }, now), true);
  assert.equal(nextEligible({ status: 'done', paidAt: now - NEXT_WINDOW - 1000 }, now), false);
  assert.equal(nextEligible({ status: 'pending', paidAt: now }, now), false);
  assert.equal(nextEligible({ status: 'done', paidAt: now, upsellOf: 'x' }, now), false);
});

test('Serwer, strona dokumentów, cennik, raport sprzedaży i regulamin (4 języki, data, historia)', () => {
  const srv = read('server.js'), app = read('public/app.js'), h = read('public/index.html');
  assert.match(srv, /const ret = nextEligible\(parent\) \? 'next' : true/); assert.match(srv, /\.\.\.\(isNext \? \{ next: true \} : \{\}\)/);
  assert.match(app, /const fuNext = \(\) => !!data\?\.paidAt && Date\.now\(\) - data\.paidAt <= 30 \* 864e5/);
  assert.match(h, /<span>Kolejne CV pod nowe ogłoszenie dla klientów:<\/span> <span id="nextPrice">19 zł<\/span> <span>\(z listem motywacyjnym<\/span> <span id="nextLetterPrice">29 zł<\/span>/);
  assert.match(read('lib/ops.js'), /x\.key === 'cv_next' \? 'Kolejne CV pod nowe ogłoszenie'/);
  for (const [l, re] of [['pl', /Kolejne CV pod nowe ogłoszenie – 19 zł \(z listem motywacyjnym – 29 zł\): stała pozycja cennika/], ['en', /Another CV for a new job advertisement – PLN 19 \(with a cover letter – PLN 29\): a standard price-list item/], ['de', /Weiterer Lebenslauf für eine neue Stellenanzeige – 19 PLN \(mit Anschreiben – 29 PLN\)/], ['uk', /Наступне резюме під нове оголошення — 19 zł \(із супровідним листом — 29 zł\)/]]) assert.match(legalBody('regulamin', l), re, l);
  assert.match(legalBody('regulamin', 'pl'), /Historia zmian: 25 października 2026 r\. – nowa pozycja cennika „Kolejne CV pod nowe ogłoszenie” \(§4 ust\. 1\)/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Kolejne CV pod nowe ogłoszenie dla klientów:'], l);
});
