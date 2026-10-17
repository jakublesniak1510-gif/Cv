import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activePromo, lowestBefore, PROMOS } from '../lib/promos.js';
import { PRICES, PACKAGES } from '../lib/pricing.js';

const at = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12));

test('Omnibus: w czasie promocji z kalendarza odpowiedź zawiera najniższą cenę z 30 dni przed obniżką', () => {
  const bw = activePromo(at(2026, 11, 27)); // Black Friday 2026
  assert.equal(bw.code, 'BLACKWEEK');
  assert.deepEqual(Object.keys(bw.lowest).sort(), Object.keys(PACKAGES).sort());
  for (const k of Object.keys(PACKAGES)) assert.equal(bw.lowest[k], PRICES[k] / 100, `bez wcześniejszej promocji: cena regularna ${k}`);
  for (const [date, code] of [[[2027, 1, 10], 'NOWYROK'], [[2026, 6, 20], 'ABSOLWENT'], [[2026, 9, 5], 'WRZESIEN']]) {
    const p = activePromo(at(...date)); assert.equal(p.code, code); assert.ok(p.lowest.cv > 0);
  }
  assert.equal(activePromo(at(2026, 10, 17)), null, 'poza promocją brak dopisku');
});

test('Omnibus: gdy w 30 dniach przed obniżką trwała inna promocja, najniższa cena to cena po tamtym rabacie', () => {
  const list = [{ code: 'A', percent: 20, from: [3, 1], to: [3, 10] }, { code: 'B', percent: 15, from: [3, 25], to: [3, 31] }, { code: 'C', percent: 30, from: [1, 1], to: [1, 5] }];
  const low = lowestBefore(list[1], 2026, list);
  assert.equal(low.cv, (PRICES.cv - Math.round(PRICES.cv * 0.2)) / 100, 'promocja A (20%) mieści się w 30 dniach przed B');
  assert.equal(lowestBefore(list[0], 2026, list).cv, PRICES.cv / 100, 'C skończyła się ponad 30 dni wcześniej');
  // Promocja z poprzedniego roku tuż przed styczniową: liczona.
  const dec = [{ code: 'X', percent: 25, from: [12, 20], to: [12, 31] }, { code: 'Y', percent: 10, from: [1, 2], to: [1, 18] }];
  assert.equal(lowestBefore(dec[1], 2027, dec).cv_letter, (PRICES.cv_letter - Math.round(PRICES.cv_letter * 0.25)) / 100);
  assert.ok(PROMOS.length >= 4);
});
