import crypto from 'node:crypto';

// Program poleceń. Każdy klient po zakupie dostaje kod KOD-…: znajomi płacą z nim 10 zł mniej (każda osoba raz),
// a właściciel kodu za każdego znajomego, który zapłacił, dostaje 10 zł na swoje kolejne zamówienia (saldo do 50 zł).
// Właściciel jest rozpoznawany po skrócie e-maila (ownerHash), więc w pliku kodów nie ma adresów.
export const REF_REWARD = 1000;
export const REF_CAP = 5000;
export const CODE_TTL = 90 * 24 * 3600 * 1000;

export const emailHash = (e) => crypto.createHash('sha256').update(`${process.env.CODE_SALT || 'cvpo'}:${String(e || '').trim().toLowerCase()}`).digest('hex').slice(0, 32);
export const isOwner = (c, email) => !!c?.ownerHash && !!email && c.ownerHash === emailHash(email);

// Rabat z kodu dla danej osoby (grosze): { base, credit } albo { error }.
// Właściciel: −10 zł raz + całe zebrane saldo (saldo może wykorzystać także po pierwszym użyciu kodu).
export function codeDiscount(c, email) {
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

// Po opłaceniu zamówienia z kodem: zapis użycia, zużycie salda właściciela albo nagroda dla polecającego.
export function applyPaidCode(c, { email, creditUsed = 0, now = Date.now() }) {
  const usedBy = [...new Set([...(c.usedBy || []), emailHash(email)])];
  if (!c.ownerHash) return { ...c, usedBy };
  if (isOwner(c, email)) return { ...c, usedBy, credit: Math.max(0, (c.credit || 0) - creditUsed) };
  if ((c.usedBy || []).includes(emailHash(email))) return { ...c, usedBy };
  // Kod żyje co najmniej 90 dni od ostatniego polecenia, żeby saldo nie przepadło od razu.
  return { ...c, usedBy, referrals: (c.referrals || 0) + 1, credit: Math.min(REF_CAP, (c.credit || 0) + REF_REWARD), earned: (c.earned || 0) + REF_REWARD, expires: Math.max(c.expires, now + CODE_TTL) };
}
