import crypto from 'node:crypto';
import { makeStore } from './store.js';
import { mailEnabled, sendPlainMail } from './mail.js';
import { logEvent } from './events.js';
import { SEGMENTS, offerMail, reminderMail, segmentOf } from './b2b-templates.js';
import { renderOffer } from './offer-pdf.js';
import { renderLetters } from './letters.js';

// Mini-CRM kontaktów B2B (uczelnie, szkoły, urzędy, fundacje, firmy, twórcy) w panelu → Kontakty.
// Pierwszy kontakt to list papierowy (art. 398 PKE obejmuje e-mail i telefon, także B2B) albo kontakt przychodzący.
// Ofertę e-mailem wysyłamy WYŁĄCZNIE po zgodzie (status „zgoda na ofertę” + opis, jak i kiedy ją uzyskano),
// potem najwyżej jedno przypomnienie po 7 dniach. Wypis → lista blokad (sam e-mail), kontakt usuwany.
// Kontakty bez aktywności przez 12 miesięcy kasujemy (RODO).
export const contacts = makeStore('b2b-contacts.json');
export const blocklist = makeStore('b2b-blocklist.json');
export const STATUSES = ['nowy', 'list wysłany', 'zgoda na ofertę', 'oferta wysłana', 'przypomnienie wysłane', 'rozmowa', 'klient', 'odmowa'];
export const CSV_COLS = ['segment', 'organizacja', 'miasto', 'dzial', 'email', 'typ_maila', 'telefon', 'strona', 'zrodlo', 'uwagi']; // opcjonalnie: adres (listy papierowe), imie, temat (dla twórców)
const YEAR = 365 * 864e5, REMIND_AFTER = 7 * 864e5;
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const norm = (e) => str(e, 160).toLowerCase();
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isBlocked = async (email) => !!(await blocklist.get(norm(email)));

// CSV z Excela (separator ; albo ,), cudzysłowy, nagłówek w pierwszym wierszu.
export function parseCsv(text) {
  text = String(text || '').replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '', sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; continue; }
    if (ch === '"') q = true; else if (ch === sep) { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/\s+/g, '_'));
  return rows.filter((r) => r.some((c) => c.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}

export async function importContacts(text, now = Date.now()) {
  const rows = parseCsv(text), have = new Set(Object.values(await contacts.all()).map((c) => c.email));
  let added = 0, dupes = 0, blocked = 0, invalid = 0;
  for (const r of rows.slice(0, 5000)) {
    const email = norm(r.email);
    if (!emailOk(email)) { invalid++; continue; }
    if (have.has(email)) { dupes++; continue; }
    if (await isBlocked(email)) { blocked++; continue; }
    have.add(email);
    await contacts.save({ id: crypto.randomUUID(), segment: segmentOf(r.segment), segmentRaw: str(r.segment, 60), org: str(r.organizacja, 200), city: str(r.miasto, 80), dept: str(r.dzial, 120), email, emailType: str(r.typ_maila, 40), phone: str(r.telefon, 40), site: str(r.strona, 200), source: str(r.zrodlo, 200), note: str(r.uwagi, 1000), name: str(r.imie, 60), topic: str(r.temat, 120), address: str(r.adres, 250), status: 'nowy', created: now, activity: now, token: crypto.randomBytes(16).toString('hex'), log: [] });
    added++;
  }
  return { added, dupes, blocked, invalid, rows: rows.length };
}

// Zmiana statusu / notatki / zgody. „odmowa” = wpis na listę blokad i usunięcie kontaktu.
export async function updateContact(id, patch = {}, now = Date.now()) {
  const c = await contacts.get(id); if (!c) throw new Error('Nie ma takiego kontaktu.');
  const status = patch.status && STATUSES.includes(patch.status) ? patch.status : c.status;
  const consentText = patch.consent != null ? str(patch.consent, 500) : c.consent?.text || '';
  if (status === 'zgoda na ofertę' && consentText.length < 5) throw new Error('Wpisz, jak i kiedy uzyskano zgodę na przesłanie oferty (np. „odpisali na list 28.10 mailem”).');
  if (status === 'odmowa') { await refuse(c, 'panel'); return null; }
  const next = { ...c, status, note: patch.note != null ? str(patch.note, 1000) : c.note, segment: patch.segment && SEGMENTS[patch.segment] ? patch.segment : c.segment, activity: now,
    consent: consentText ? { text: consentText, at: c.consent?.text === consentText ? c.consent.at : now } : null,
    log: status !== c.status ? [...(c.log || []), { at: now, status }].slice(-30) : c.log };
  return contacts.save(next);
}
async function refuse(c, how) {
  await blocklist.save({ id: c.email, at: Date.now(), how });
  await contacts.remove(c.id);
  logEvent('kontakty', `Odmowa/wypis: kontakt usunięty, e-mail na liście blokad (${how})`);
}
const links = (base, c) => ({ order: `${base}/dla-instytucji/zamow`, offerPdf: `${base}/oferta-dla-instytucji.pdf`, advisors: `${base}/dla-doradcow`, partner: `${base}/program-partnerski`, unsubscribe: `${base}/b2b/wypisz?t=${c.token}` });
const offerFrom = () => process.env.OFFER_FROM || undefined;

export async function sendOffer(id, base, now = Date.now()) {
  const c = await contacts.get(id); if (!c) throw new Error('Nie ma takiego kontaktu.');
  if (c.status !== 'zgoda na ofertę' || !c.consent?.text) throw new Error('Ofertę można wysłać tylko przy statusie „zgoda na ofertę” z opisem zgody.');
  if (await isBlocked(c.email)) throw new Error('Ten adres jest na liście blokad.');
  if (!mailEnabled()) throw new Error('Poczta nie jest skonfigurowana (SMTP).');
  const L = links(base, c), { subject, text } = offerMail(c.segment, c, L);
  await sendPlainMail({ to: c.email, subject, text, fromAddr: offerFrom(), attachments: [{ filename: 'oferta-cv-pod-ogloszenie.pdf', content: await renderOffer(base), contentType: 'application/pdf' }],
    headers: { 'List-Unsubscribe': `<${L.unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
  return contacts.save({ ...c, status: 'oferta wysłana', offer: { at: now, subject, segment: c.segment }, activity: now, log: [...(c.log || []), { at: now, status: 'oferta wysłana' }].slice(-30) });
}

// Co godzinę: jedno przypomnienie po 7 dniach od oferty (gdy status się nie zmienił) i kasowanie nieaktywnych kontaktów.
export async function crmHourly(base, now = Date.now()) {
  await contacts.deleteWhere((c) => now - (c.activity || c.created) > YEAR);
  if (!mailEnabled()) return { reminded: 0 };
  let reminded = 0;
  for (const c of Object.values(await contacts.all())) {
    if (c.status !== 'oferta wysłana' || c.reminder || !c.offer?.at || now - c.offer.at < REMIND_AFTER) continue;
    if (await isBlocked(c.email)) continue;
    try {
      const L = links(base, c);
      const m = reminderMail(c, L);
      await sendPlainMail({ to: c.email, subject: m.subject, text: m.text, fromAddr: offerFrom(), headers: { 'List-Unsubscribe': `<${L.unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
      await contacts.update(c.id, (x) => ({ ...x, status: 'przypomnienie wysłane', reminder: { at: now }, activity: now, log: [...(x.log || []), { at: now, status: 'przypomnienie wysłane' }].slice(-30) }));
      reminded++;
    } catch (e) { logEvent('kontakty', `Przypomnienie: ${e.message}`); }
  }
  return { reminded };
}

// Wypis z linku w stopce: bez logowania, po tokenie kontaktu.
export async function unsubscribe(token) {
  if (!/^[0-9a-f]{32}$/.test(String(token || ''))) return false;
  const c = Object.values(await contacts.all()).find((x) => x.token === token);
  if (!c) return false;
  await refuse(c, 'link wypisu');
  return true;
}

// Listy papierowe dla zaznaczonych kontaktów: jeden PDF, potem status „list wysłany” z datą (kontakt w statusie „nowy”).
export async function lettersFor(ids, base, now = Date.now()) {
  const all = await contacts.all(), list = [...new Set(ids || [])].map((id) => all[id]).filter(Boolean).slice(0, 500);
  if (!list.length) throw new Error('Zaznacz kontakty, do których mają pójść listy.');
  const pdf = await renderLetters(list, { base, now });
  for (const c of list) await contacts.update(c.id, (x) => ({ ...x, letter: { at: now }, activity: now, ...(x.status === 'nowy' ? { status: 'list wysłany', log: [...(x.log || []), { at: now, status: 'list wysłany' }].slice(-30) } : {}) }));
  return { pdf, count: list.length, noAddress: list.filter((c) => !c.address).length };
}
