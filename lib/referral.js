import crypto from 'node:crypto';

// Program poleceń. Każdy klient po zakupie dostaje kod KOD-…: znajomi płacą z nim 10 zł mniej (każda osoba raz),
// a właściciel kodu za każdego znajomego, który zapłacił, dostaje 10 zł na swoje kolejne zamówienia (saldo do 50 zł).
// Właściciel jest rozpoznawany po skrócie e-maila (ownerHash), więc w pliku kodów nie ma adresów.
export const REF_REWARD = 1000;
export const REF_CAP = 5000;
export const CODE_TTL = 90 * 24 * 3600 * 1000;

export const emailHash = (e) => crypto.createHash('sha256').update(`${process.env.CODE_SALT || 'cvpo'}:${String(e || '').trim().toLowerCase()}`).digest('hex').slice(0, 32);
export const isOwner = (c, email) => !!c?.ownerHash && !!email && c.ownerHash === emailHash(email);

// Rezerwacje (c.reserved: [{ order, hash, credit, at, final }]): kod jest zajęty od złożenia zamówienia do opłacenia,
// żeby kilka równoległych zamówień nie wykorzystało jednego limitu (maxUses, raz na osobę, saldo poleceń).
// Nieopłacone zwalniamy po 24 h; rezerwacja zamówienia za 0 zł jest od razu ostateczna.
// Nowe zamówienie tej samej osoby przejmuje jej wcześniejszą, nieostateczną rezerwację (powrót z płatności i poprawki w formularzu).
export const RESERVE_TTL = 24 * 3600e3;
export class CodeError extends Error {}
function withReserved(c, email) {
  const h = email ? emailHash(email) : '', r = (c.reserved || []).filter((x) => x.final || x.hash !== h);
  if (!r.length) return c;
  return { ...c, usedBy: [...new Set([...(c.usedBy || []), ...r.map((x) => x.hash)])], credit: Math.max(0, (c.credit || 0) - r.reduce((s, x) => s + (x.credit || 0), 0)) };
}

// Rabat z kodu dla danej osoby (grosze): { base, credit } albo { error }.
// Właściciel: −10 zł raz + całe zebrane saldo (saldo może wykorzystać także po pierwszym użyciu kodu).
export function codeDiscount(c0, email) {
  if (c0?.disabled) return { error: 'Ten kod nie jest już aktywny.' }; // np. paczka kodów wyłączona po nieopłaconej fakturze albo zwrocie
  const c = withReserved(c0, email);
  const used = !!email && (c.usedBy || []).includes(emailHash(email));
  if (isOwner(c, email)) {
    const base = used ? 0 : c.amount || 0, credit = c.credit || 0;
    if (!base && !credit) return { error: 'Ten kod został już przez Ciebie wykorzystany. Gdy znajomi zapłacą z Twoim kodem, dostaniesz 10 zł za każdego.' };
    return { base, credit };
  }
  if (used) return { error: 'Ten kod został już przez Ciebie wykorzystany.' };
  if (c.maxUses && (c.usedBy || []).length >= c.maxUses) return { error: 'Limit użyć tego kodu został wyczerpany.' };
  return { base: c.amount || 0, credit: 0 };
}

// Prowizja partnera (twórcy, doradcy kariery) od kwoty zapłaconej z jego kodem, w groszach.
export const commissionFor = (c, total) => (c.commission > 0 && total > 0 ? Math.round((total * c.commission) / 100) : 0);

// Rezerwacja w jednej blokadzie zapisu kodu (codes.update): ponowne sprawdzenie z uwzględnieniem innych rezerwacji.
// expect: rabat policzony przy składaniu zamówienia ({ base, creditUsed }); jeśli jest już niedostępny → CodeError.
export function reserveCode(c, { email, order, expect = {}, final = false, now = Date.now() }) {
  if (!c) throw new CodeError('Ten kod nie istnieje albo wygasł.');
  if (c.disabled || now > c.expires) throw new CodeError('Ten kod nie istnieje albo wygasł.');
  const d = codeDiscount(c, email);
  if (d.error) throw new CodeError(d.error);
  if (d.base < (expect.base || 0) || d.credit < (expect.creditUsed || 0)) throw new CodeError('Ten kod został właśnie wykorzystany w innym zamówieniu. Odśwież stronę i spróbuj ponownie.');
  const h = emailHash(email), rest = (c.reserved || []).filter((x) => x.order !== order && (x.final || x.hash !== h));
  return { ...c, reserved: [...rest, { order, hash: h, credit: expect.creditUsed || 0, at: now, ...(final ? { final: true } : {}) }] };
}
export const releaseCode = (c, orders) => ({ ...c, reserved: (c.reserved || []).filter((x) => !orders.includes(x.order)) });
// Nieopłacone rezerwacje starsze niż 24 h (do zwolnienia, jeśli zamówienie nadal czeka na płatność).
export const staleReservations = (c, now = Date.now()) => (c.reserved || []).filter((x) => !x.final && now - x.at > RESERVE_TTL).map((x) => x.order);

// Po opłaceniu zamówienia z kodem: zapis użycia (rezerwacja → użycie), prowizja partnera, zużycie salda właściciela albo nagroda dla polecającego.
export function applyPaidCode(c0, { email, creditUsed = 0, total = 0, now = Date.now(), order = null, selfRef = false }) {
  const c = order ? releaseCode(c0, [order]) : c0;
  const usedBy = [...new Set([...(c.usedBy || []), emailHash(email)])];
  if (c.commission > 0) return { ...c, usedBy, sales: (c.sales || 0) + 1, revenue: (c.revenue || 0) + total, due: (c.due || 0) + commissionFor(c, total) };
  if (!c.ownerHash) return { ...c, usedBy };
  if (isOwner(c, email)) return { ...c, usedBy, credit: Math.max(0, (c.credit || 0) - creditUsed) };
  if ((c.usedBy || []).includes(emailHash(email))) return { ...c, usedBy };
  // Samopolecenie (to samo konto, IP w ciągu 24 h albo e-mail płatnika co właściciel kodu): rabat zostaje, nagrody nie ma.
  if (selfRef) return { ...c, usedBy, selfRefs: (c.selfRefs || 0) + 1 };
  // Kod żyje co najmniej 90 dni od ostatniego polecenia, żeby saldo nie przepadło od razu.
  return { ...c, usedBy, referrals: (c.referrals || 0) + 1, credit: Math.min(REF_CAP, (c.credit || 0) + REF_REWARD), earned: (c.earned || 0) + REF_REWARD, expires: Math.max(c.expires, now + CODE_TTL) };
}
