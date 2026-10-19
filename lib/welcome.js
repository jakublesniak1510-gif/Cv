// Kod powitalny −10 zł po potwierdzeniu zapisu na newsletter albo na powiadomienia o ofertach (podwójna zgoda).
// Jeden kod na adres e-mail (niezależnie od tego, gdzie się zapisał), jednorazowy, ważny 30 dni.
import crypto from 'node:crypto';
import { makeStore, codes } from './store.js';

const issued = makeStore('welcome-codes.json');
export const WELCOME_AMOUNT = 1000, WELCOME_DAYS = 30;
const key = (email) => crypto.createHash('sha256').update(`${process.env.CODE_SALT || 'cvpo'}:welcome:${String(email).toLowerCase()}`).digest('hex').slice(0, 32);

export async function welcomeCode(email, source) {
  if (process.env.WELCOME_CODE === '0' || !email) return null;
  const id = key(email), prev = await issued.get(id);
  if (prev) { const c = await codes.get(prev.code); return c && Date.now() < c.expires && !(c.usedBy || []).length ? { code: c.id, amount: c.amount / 100, expires: c.expires } : null; }
  const code = `WITAJ-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, now = Date.now(), expires = now + WELCOME_DAYS * 864e5;
  await codes.save({ id: code, amount: WELCOME_AMOUNT, percent: 0, voucher: null, maxUses: 1, usedBy: [], note: `Powitalny (${source})`, created: now, expires, welcome: true });
  await issued.save({ id, code, source, created: now }); // zostaje po wygaśnięciu kodu: drugi kod dla tego samego adresu nie powstanie
  return { code, amount: WELCOME_AMOUNT / 100, expires };
}

// Fragment strony potwierdzenia z kodem i przyciskiem do zamówienia (kod wpisze się sam, jak przy linku polecającym).
export const welcomeHtml = (w, BASE_URL, esc) => (w ? `<div class="perk" style="margin:18px 0"><b>Twój kod −${w.amount} zł: ${esc(w.code)}</b><br>Do wykorzystania przy zamówieniu CV, ważny do ${new Date(w.expires).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' })}. Wpisze się sam w podsumowaniu zamówienia.</div><p><a class="btn" href="${BASE_URL}/?ref=${encodeURIComponent(w.code)}">Zamów CV z kodem</a></p>` : '');

// Stan kodu powitalnego dla adresu (seria powitalna newslettera): czy jest, do kiedy ważny i czy został użyty.
export async function welcomeStatus(email) {
  const prev = email && (await issued.get(key(email)));
  if (!prev) return null;
  const c = await codes.get(prev.code);
  return c ? { code: c.id, amount: c.amount / 100, expires: c.expires, used: (c.usedBy || []).length > 0 } : null;
}
