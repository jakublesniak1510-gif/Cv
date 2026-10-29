import { getOrder, updateOrder, codes } from './store.js';
import { sales } from './ops.js';
import { funnelPaid, funnelOrder } from './analytics.js';
import { commissionFor, REF_REWARD, REF_CAP } from './referral.js';
import { logEvent } from './events.js';

// Zamówienia testowe właściciela (28.10). Dwa mechanizmy, ten sam wynik w raportach:
// - kod TEST-… (lib/test-codes.js): zamówienie za 0 zł, które od początku omija rejestr sprzedaży, fakturę, statystyki i lejek;
// - „Oznacz jako test” w panelu (o.testMark) dla prawdziwej płatności właściciela: faktura i wpis w rejestrze sprzedaży zostają
//   (wpis dostaje tylko flagę test), ale zamówienie wypada z lejka sprzedaży i kreatora („Opłacone”), raportu A/B,
//   statystyk przychodu i rozliczeń kodu (prowizja partnera albo nagroda za polecenie). „Cofnij” przywraca dokładnie to, co odjęto.
export const isTestOrder = (o) => !!(o?.testCode || o?.testMark);
const PAID = ['generating', 'paid', 'done'];

// Czy zamówienie było liczone w lejku jako „Opłacone” (server.js: markPaidAndGenerate – zamówienia CV, poza opłaconymi w całości karnetem).
const countedPaid = (o) => !o.product && !o.upsellOf && !!o.paidAt && !(o.pass && !(o.total > 0));

// Odjęcie (sign −1) albo przywrócenie (+1) rozliczenia kodu; zwraca to, co zmieniono (do zapisania w o.testMark).
async function codeShift(o, sign, prev) {
  if (!o.code) return null;
  let done = null;
  await codes.update(o.code, (c) => {
    if (c.commission > 0) {
      const amount = sign < 0 ? Math.max(0, (o.total || 0) - (o.refunded || 0)) : prev?.amount || 0, due = sign < 0 ? commissionFor(c, amount) : prev?.due || 0;
      if (!amount) return c;
      done = { kind: 'commission', amount, due };
      return { ...c, sales: Math.max(0, (c.sales || 0) + sign), revenue: Math.max(0, (c.revenue || 0) + sign * amount), due: Math.max(0, (c.due || 0) + sign * due) };
    }
    if (sign < 0 && (c.rewarded || []).includes(o.id)) {
      done = { kind: 'reward' };
      return { ...c, rewarded: c.rewarded.filter((x) => x !== o.id), referrals: Math.max(0, (c.referrals || 0) - 1), credit: Math.max(0, (c.credit || 0) - REF_REWARD), earned: Math.max(0, (c.earned || 0) - REF_REWARD) };
    }
    if (sign > 0 && prev?.kind === 'reward') {
      done = { kind: 'reward' };
      return { ...c, rewarded: [...(c.rewarded || []), o.id], referrals: (c.referrals || 0) + 1, credit: Math.min(REF_CAP, (c.credit || 0) + REF_REWARD), earned: (c.earned || 0) + REF_REWARD };
    }
    return c;
  });
  return done;
}

// Oznaczenie (on = true) albo cofnięcie (on = false). Zwraca { ok, changed } albo { error }.
export async function setTestMark(id, on, now = Date.now()) {
  const o = await getOrder(id);
  if (!o) return { error: 'Nie ma takiego zamówienia.' };
  if (o.testCode) return { error: 'To zamówienie z kodem testowym – jest już pomijane w statystykach.' };
  if (on && !PAID.includes(o.status) && !o.paidAt) return { error: 'Oznaczyć można tylko opłacone zamówienie.' };
  if (!!o.testMark === on) return { ok: true, changed: false };
  const sign = on ? -1 : 1, prev = o.testMark || {};
  if (countedPaid(o) && (on || prev.funnel)) await funnelPaid(o, o.paidAt, sign);
  if (o.visit?.ab && !o.product && (on || prev.ab)) await funnelOrder(o, o.created, sign);
  if (await sales.get(id)) await sales.update(id, { test: on });
  const code = await codeShift(o, sign, prev.code);
  await updateOrder(id, (x) => { const { testMark, ...rest } = x; return on ? { ...rest, testMark: { at: now, funnel: countedPaid(o), ab: !!(o.visit?.ab && !o.product), ...(code ? { code } : {}) } } : rest; });
  logEvent('zamówienie testowe', on ? `Oznaczono ${id} jako test${code ? ` (kod ${o.code}: cofnięto ${code.kind === 'reward' ? 'nagrodę za polecenie' : 'prowizję partnera'})` : ''}` : `Cofnięto oznaczenie testu ${id}`, { orderId: id });
  return { ok: true, changed: true };
}

// Wpis rejestru sprzedaży (29.10): „Oznacz jako test” także dla wpisów, których zamówienia już nie ma (np. testy właściciela usunięte
// z zakładki Zamówienia). Gdy zamówienie istnieje – setTestMark (oznacza oba). Bez zamówienia: flaga test na wpisie (znika z przychodu
// i raportów), „Opłacone” w lejku −1 w dniu płatności (suma i język; źródła wpis nie ma) i cofnięcie rozliczenia kodu. „Cofnij” przywraca.
const saleCounted = (s) => s.pkg !== 'dodatek' && s.pkg !== 'templates' && !(s.pass && !(s.total > 0));
export async function setSaleTestMark(id, on, now = Date.now()) {
  if (await getOrder(id)) return setTestMark(id, on, now);
  const s = await sales.get(id);
  if (!s) return { error: 'Nie ma takiego wpisu w rejestrze sprzedaży.' };
  if (!!s.test === on) return { ok: true, changed: false };
  const sign = on ? -1 : 1, prev = s.testMark || {};
  if (saleCounted(s) && (on || prev.funnel)) await funnelPaid({ visit: { src: null, lang: s.uiLang } }, s.at, sign);
  const code = await codeShift({ id, code: s.code, total: s.total, refunded: s.refunded }, sign, prev.code);
  await sales.update(id, (x) => { const { testMark, ...rest } = x; return on ? { ...rest, test: true, testMark: { at: now, funnel: saleCounted(s), ...(code ? { code } : {}) } } : { ...rest, test: false }; });
  logEvent('zamówienie testowe', on ? `Oznaczono wpis rejestru ${id} jako test (bez zamówienia)` : `Cofnięto oznaczenie testu wpisu rejestru ${id}`, { orderId: id });
  return { ok: true, changed: true, orphan: true };
}
