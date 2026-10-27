import crypto from 'node:crypto';
import { makeStore } from './store.js';
import { logEvent } from './events.js';

// Jednorazowy kod 100% do testów właściciela (27.10): generowany w panelu na jedną wybraną usługę, jedno użycie, ważny 7 dni.
// Działa tylko przy zakupie tej usługi (bez dodatków i innych usług – produkty bloku D nie mają dodatków), zamówienie za 0 zł
// bez płatności i bez faktury. Każde wygenerowanie i użycie trafia do dziennika zdarzeń (panel → Dziennik).
export const testCodes = makeStore('test-codes.json');
export const TEST_DAYS = 7;
export const TEST_PRODUCTS = { photo: 'Zdjęcie do CV', templates: 'Szablony CV premium', translation: 'Tłumaczenie CV', adcheck: 'Sprawdzenie ogłoszenia', grantplan: 'Dotacja: biznesplan', grantfull: 'Dotacja: wniosek + biznesplan', offer: 'Oferta na zlecenie', offerpack: 'Pakiet 5 ofert na zlecenie', selection20: 'Selekcja CV (do 20)', selection50: 'Selekcja CV (do 50)' };
const RE = /^TEST-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
export const normTestCode = (c) => String(c || '').trim().toUpperCase().replace(/\s+/g, '');
export async function createTestCode(product, now = Date.now()) {
  if (!TEST_PRODUCTS[product]) throw new Error('Wybierz usługę.');
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', part = () => Array.from(crypto.randomBytes(4), (b) => A[b % A.length]).join('');
  let id; do id = `TEST-${part()}-${part()}`; while (await testCodes.get(id));
  const c = await testCodes.save({ id, product, created: now, expires: now + TEST_DAYS * 864e5, usedBy: null });
  logEvent('kod testowy', `Wygenerowano ${id} (100%) na usługę: ${TEST_PRODUCTS[product]}, ważny do ${new Date(c.expires).toISOString().slice(0, 10)}`);
  return c;
}
// Użycie przy zakupie: atomowo (blokada zapisu magazynu), tylko ta usługa, raz, przed upływem 7 dni.
export async function useTestCode(code, product, orderId, now = Date.now()) {
  const k = normTestCode(code); if (!RE.test(k)) return { error: 'Nieprawidłowy kod testowy.' };
  let out = null;
  await testCodes.update(k, (c) => {
    if (c.usedBy) { out = { error: 'Ten kod testowy został już wykorzystany.' }; return c; }
    if (now > c.expires) { out = { error: 'Ten kod testowy wygasł.' }; return c; }
    if (c.product !== product) { out = { error: `Ten kod testowy działa tylko na usługę: ${TEST_PRODUCTS[c.product]}.` }; return c; }
    out = { ok: true, code: k }; return { ...c, usedBy: orderId, usedAt: now };
  });
  out ||= { error: 'Nieprawidłowy kod testowy.' };
  logEvent('kod testowy', out.ok ? `Użyto ${k} na usługę: ${TEST_PRODUCTS[product]}` : `Nieudane użycie ${k} (${TEST_PRODUCTS[product] || product}): ${out.error}`, { orderId });
  return out;
}
export const cleanupTestCodes = () => testCodes.deleteWhere((c) => Date.now() - c.expires > 30 * 864e5);
