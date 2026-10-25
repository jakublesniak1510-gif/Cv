import crypto from 'node:crypto';
import express from 'express';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { makeStore, codes, leads } from './store.js';
import { PRICES, PACKAGES, B2B_PKGS, B2B_MIN, B2B_MAX, B2B_TIERS, b2bQuote, b2bTable } from './pricing.js';
import { issueB2bInvoice, renderInvoice, invoiceFile, invoices, sellerBank } from './invoice.js';
import { mailEnabled, sendPlainMail, sendOwnerMail } from './mail.js';
import { logEvent } from './events.js';
import { sales, dayKey, addDailySection } from './ops.js';
import { ssrPage, escHtml as esc } from './seo.js';
import { renderOffer } from './offer-pdf.js';
import { contacts, STATUSES, importContacts, csvTemplate, updateContact, sendOffer, unsubscribe, blocklist, lettersFor, enveloFor, bulkStatus } from './crm.js';
import { SEGMENTS } from './b2b-templates.js';
import { embedSnippet } from './growth.js';
import { toolUrl } from './tools-i18n.js';

// Współpraca z instytucjami i partnerami bez ręcznej obsługi:
// 1) instytucja sama kupuje paczkę kodów (karta/BLIK albo faktura z terminem 14 dni) i od razu dostaje kod, fakturę i plakat,
// 2) twórca/doradca zgłasza się do programu partnerskiego, właściciel zatwierdza jednym kliknięciem,
// 3) każdy kod ma prywatną stronę statystyk /raport/<token> (bez danych osobowych klientów) i plakat z kodem QR.
export const b2bOrders = makeStore('b2b-orders.json');
export const partnerApps = makeStore('partner-apps.json');
export const PARTNER_TERMS_VERSION = '2026-10-20';
export const PARTNER_PERCENT = 10;
export const partnerCommission = () => Math.min(50, Math.max(1, parseInt(process.env.PARTNER_COMMISSION, 10) || 20));
const YEAR = 365 * 864e5, DUE_DAYS = 14;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const zl = (gr) => `${((gr || 0) / 100).toLocaleString('pl-PL', { minimumFractionDigits: (gr || 0) % 100 ? 2 : 0, maximumFractionDigits: 2 })} zł`;
const plDate = (t) => new Date(t).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric' });
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const newToken = () => crypto.randomBytes(24).toString('base64url'); // 32 znaki
const ascii = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const hex4 = () => crypto.randomBytes(2).toString('hex').toUpperCase();

// Kod instytucji: pierwsze litery nazwy + losowa końcówka (np. POLITECH-3F9A). Kod partnera: imię + 10 (np. ANNA10).
export async function uniqueCode(base) {
  base = base.replace(/[^A-Z0-9-]/g, '').slice(0, 17) || 'KOD';
  for (let i = 0; i < 50; i++) { const c = i ? `${base}${i + 1}` : base; if (!(await codes.get(c))) return c; }
  return `${base.slice(0, 12)}-${hex4()}`;
}
export const orgCode = (org) => uniqueCode(`${(ascii(org).split(' ').filter((w) => w.length > 2)[0] || 'ORG').slice(0, 10)}-${hex4()}`);
export const partnerCodeBase = (name) => `${(ascii(name).split(' ')[0] || 'PARTNER').slice(0, 10)}${PARTNER_PERCENT}`;

export const reportUrl = (base, c) => (c?.report ? `${base}/raport/${c.report}` : null);
export const codeLink = (base, code) => `${base}/?ref=${encodeURIComponent(code)}`;
export async function codeByReport(token) {
  if (!/^[\w-]{32}$/.test(String(token || ''))) return null;
  return Object.values(await codes.all()).find((c) => c.report && c.report.length === token.length && crypto.timingSafeEqual(Buffer.from(c.report), Buffer.from(token))) || null;
}
// Link do raportu dla starszych kodów (z panelu): token dopisywany przy pierwszym użyciu.
export async function ensureReport(code) {
  const c = await codes.get(code); if (!c) return null;
  if (c.report) return c;
  return codes.update(code, (x) => ({ ...x, report: x.report || newToken() }));
}

// --- 1. Zamówienie paczki kodów ---
// NIP: 10 cyfr z sumą kontrolną (wagi 6,5,7,2,3,4,5,6,7; reszta z dzielenia przez 11 = ostatnia cyfra).
export function nipValid(nip) {
  const d = String(nip || '').replace(/[^0-9]/g, '');
  if (d.length !== 10) return false;
  const sum = [6, 5, 7, 2, 3, 4, 5, 6, 7].reduce((a, w, i) => a + w * +d[i], 0) % 11;
  return sum !== 10 && sum === +d[9];
}
// Faktura z terminem (kod działa przed zapłatą): automatycznie tylko do B2B_AUTO_MAX kodów i przy jednej nieopłaconej
// fakturze na NIP i na e-mail. Inaczej zamówienie czeka na zatwierdzenie w panelu (bez kodu i bez faktury).
export const autoMax = () => Math.max(B2B_MIN, parseInt(process.env.B2B_AUTO_MAX, 10) || 200);
export async function approvalReason(b) {
  if (b.pay !== 'invoice') return null;
  if (b.qty > autoMax()) return `ponad ${autoMax()} kodów na fakturę z terminem`;
  const open = Object.values(await b2bOrders.all()).filter((x) => x.id !== b.id && ['unpaid', 'approval'].includes(x.status) && !x.deactivated);
  if (open.some((x) => x.nip && x.nip === b.nip)) return 'ten NIP ma już nieopłaconą fakturę';
  if (open.some((x) => x.email === b.email)) return 'ten e-mail ma już nieopłaconą fakturę';
  return null;
}
export function validateB2b(b = {}) {
  const o = {
    org: str(b.org, 160), nip: str(b.nip, 20).replace(/[^0-9]/g, ''), address: str(b.address, 250), name: str(b.name, 100),
    email: str(b.email, 160).toLowerCase(), phone: str(b.phone, 40), pkg: b.pkg, qty: Number(b.qty), pay: b.pay === 'invoice' ? 'invoice' : 'now',
  };
  if (o.org.length < 2) throw new Error('Podaj nazwę organizacji.');
  if (o.nip && !nipValid(o.nip)) throw new Error('Sprawdź NIP: powinien mieć 10 cyfr z poprawną sumą kontrolną (albo zostaw pole puste i wybierz płatność od razu).');
  if (o.pay === 'invoice' && !o.nip) throw new Error('Faktura z terminem płatności wymaga NIP organizacji. Bez NIP wybierz „Zapłać teraz”.');
  if (o.address.length < 6) throw new Error('Podaj adres organizacji (do faktury).');
  if (o.name.length < 3) throw new Error('Podaj imię i nazwisko osoby zamawiającej.');
  if (!emailOk(o.email)) throw new Error('Podaj poprawny adres e-mail.');
  if (!b.terms) throw new Error('Zaakceptuj regulamin.');
  return { ...o, ...b2bQuote(o.pkg, o.qty) };
}
export async function createB2bOrder(body, now = Date.now()) {
  const v = validateB2b(body);
  const b = { id: `B2B-${crypto.randomBytes(6).toString('hex').toUpperCase()}`, ...v, status: 'new', created: now, terms: { at: now } };
  const why = await approvalReason(b);
  if (why) Object.assign(b, { status: 'approval', approvalReason: why });
  await b2bOrders.save(b);
  return b;
}

// Realizacja: kod (paczka użyć), faktura, e-mail do zamawiającego i do właściciela. Wywołanie powtórne nic nie zmienia.
// Webhook Stripe i powrót klienta na stronę mogą przyjść naraz: realizacje tego samego zamówienia idą po kolei (inflight),
// a „zajęcie” zamówienia (fulfilling) jest zapisywane atomowo, więc kod, faktura i e-mail powstają dokładnie raz.
const inflight = new Map();
export function fulfillB2b(id, opts = {}) {
  const run = (inflight.get(id) || Promise.resolve()).catch(() => {}).then(() => doFulfill(id, opts));
  inflight.set(id, run);
  run.finally(() => { if (inflight.get(id) === run) inflight.delete(id); }).catch(() => {});
  return run;
}
async function doFulfill(id, { paid = false, provider = null, paymentIntent = null, sessionId = null, now = Date.now(), base = '' } = {}) {
  let claimed = false;
  const b0 = await b2bOrders.update(id, (x) => {
    if (x.code || x.status === 'rejected' || (x.fulfilling && Date.now() - x.fulfilling < 10 * 60e3)) return x;
    claimed = true; return { ...x, fulfilling: Date.now() };
  });
  if (!b0) return null;
  if (!claimed) {
    if (b0.code && paid && b0.status !== 'paid') return markB2bPaid(id, { provider, paymentIntent, sessionId, now });
    return b0;
  }
  const code = await orgCode(b0.org);
  await codes.save({ id: code, amount: 0, percent: 0, voucher: b0.pkg, commission: 0, maxUses: b0.qty, usedBy: [], note: b0.org.slice(0, 100), created: now, expires: now + YEAR, report: newToken(), b2bOrder: id });
  const b = await b2bOrders.update(id, (x) => ({
    ...x, code, fulfilling: null, status: paid ? 'paid' : 'unpaid', paidAt: paid ? now : null, due: paid ? null : now + DUE_DAYS * 864e5,
    payment: paid ? { provider, paymentIntent, sessionId, at: now } : null,
  }));
  if (paid) await recordB2bSale(b);
  const inv = await issueB2bInvoice(b, now).catch((e) => { logEvent('faktura', `B2B ${id}: ${e.message}`); return null; });
  if (inv) await b2bOrders.update(id, { invoiceId: inv.id, invoiceNumber: inv.number });
  const c = await codes.get(code);
  await sendB2bMails({ ...b, invoiceNumber: inv?.number }, c, inv, base).catch((e) => logEvent('e-mail', `B2B ${id}: ${e.message}`));
  return b2bOrders.get(id);
}
export async function markB2bPaid(id, { provider = 'przelew', paymentIntent = null, sessionId = null, now = Date.now() } = {}) {
  const b = await b2bOrders.update(id, (x) => (x.status === 'paid' ? x : { ...x, status: 'paid', paidAt: now, payment: { provider, paymentIntent, sessionId, at: now } }));
  if (b) await recordB2bSale(b);
  return b;
}
// Rejestr sprzedaży (raport w panelu, zestawienia): paczka kodów jako jedna sprzedaż.
async function recordB2bSale(b) {
  if (b.status !== 'paid') return;
  await sales.upsert(b.id, (p) => ({ id: b.id, at: b.paidAt, day: dayKey(b.paidAt), pkg: b.pkg, total: b.total, discount: 0, ads: 0, addons: [], langs: [], code: b.code, followup: false, uiLang: 'pl', provider: b.payment?.provider || null, pi: b.payment?.paymentIntent || null, refunded: p?.refunded || 0, b2b: true, qty: b.qty }));
}
// Zwrot (Stripe charge.refunded): niewykorzystane kody przestają działać proporcjonalnie do zwróconej kwoty.
export async function b2bRefunded(id, refundedTotal) {
  const b = await b2bOrders.get(id); if (!b) return null;
  if (refundedTotal <= (b.refunded || 0)) return b;
  const back = Math.min(b.qty, Math.floor(refundedTotal / b.unit + 1e-9));
  if (b.code) await codes.update(b.code, (c) => ({ ...c, maxUses: Math.max((c.usedBy || []).length, b.qty - back), ...(back >= b.qty ? { disabled: true } : {}) }));
  await sales.update(id, { refunded: refundedTotal });
  logEvent('zwrot', `Zwrot ${zl(refundedTotal)} za paczkę kodów ${b.code || ''} (${b.org})`, { orderId: id });
  return b2bOrders.update(id, { refunded: refundedTotal, status: refundedTotal >= b.total ? 'refunded' : b.status });
}
// Ręczne wyłączenie kodu (np. faktura nieopłacona): zostają tylko już wykorzystane użycia.
export async function deactivateB2b(id) {
  const b = await b2bOrders.get(id); if (!b?.code) return null;
  // maxUses = liczba wykorzystanych użyć; przy 0 to „bez limitu”, dlatego o blokadzie decyduje disabled (checkCode i codeDiscount).
  await codes.update(b.code, (c) => ({ ...c, maxUses: (c.usedBy || []).length || 0, disabled: true }));
  return b2bOrders.update(id, { deactivated: Date.now() });
}

// Zamówienie czekające na zatwierdzenie: „Zatwierdź” = zwykła realizacja (kod, faktura z terminem, e-mail), „Odrzuć” = uprzejmy e-mail.
export async function approveB2b(id, { base = '' } = {}) {
  const b = await b2bOrders.get(id);
  if (!b || b.status !== 'approval') throw new Error('To zamówienie nie czeka na zatwierdzenie.');
  return fulfillB2b(id, { base });
}
export async function rejectB2b(id, { base = 'https://cvpodogloszenie.pl' } = {}) {
  const b = await b2bOrders.get(id);
  if (!b || b.status !== 'approval') throw new Error('To zamówienie nie czeka na zatwierdzenie.');
  if (mailEnabled()) await sendPlainMail({ to: b.email, subject: `Zamówienie kodów dla ${b.org}`, text: `Dzień dobry,\n\ndziękujemy za zamówienie ${b.qty} kodów. Tym razem nie możemy go zrealizować z płatnością przelewem po terminie. Możesz zamówić kody z płatnością od razu (karta, BLIK) na ${base}/dla-instytucji/zamow albo odpisać na tę wiadomość, a ustalimy szczegóły.\n\nPozdrawiamy,\nCV Pod Ogłoszenie` }).catch((e) => logEvent('e-mail', `B2B odmowa: ${e.message}`));
  return b2bOrders.update(id, { status: 'rejected', rejectedAt: Date.now() });
}
async function notifyApproval(b, base) {
  if (!mailEnabled()) return;
  await sendPlainMail({ to: b.email, subject: `Zamówienie ${b.qty} kodów dla ${b.org}: przyjęte`, text: `Dzień dobry,\n\ndziękujemy za zamówienie ${b.qty} kodów (${PACKAGES[b.pkg]?.name}) z fakturą z terminem płatności. Potwierdzimy je ręcznie, zwykle w ciągu jednego dnia roboczego. Kod i fakturę dostaniesz wtedy e-mailem.\n\nJeśli wolisz od razu, możesz zamówić z płatnością kartą lub BLIK: ${base}/dla-instytucji/zamow\n\nPozdrawiamy,\nCV Pod Ogłoszenie` }).catch((e) => logEvent('e-mail', `B2B (czeka): ${e.message}`));
  await sendOwnerMail(`Zamówienie kodów czeka na zatwierdzenie: ${b.org} (${zl(b.total)})`, `${b.org}, NIP ${b.nip}\n${b.name}, ${b.email}${b.phone ? `, ${b.phone}` : ''}\n${b.qty} × ${PACKAGES[b.pkg]?.name} = ${zl(b.total)}, faktura z terminem 14 dni\nPowód: ${b.approvalReason}\n\nZatwierdź (kod + faktura + e-mail) albo odrzuć: ${base}/admin → Firmy`).catch((e) => logEvent('e-mail', `B2B (czeka, właściciel): ${e.message}`));
}

const participantsPl = (code, pkgName, link) => `Instrukcja dla uczestników (możesz ją skopiować):
1. Wejdź na ${link} (kod wpisze się sam) albo na cvpodogloszenie.pl i wpisz kod ${code} w podsumowaniu zamówienia.
2. Wybierz pakiet „${pkgName}”, wklej treść ogłoszenia o pracę i uzupełnij swoje dane.
3. Za pakiet nie płacisz, pokrywa go kod. Gotowe dokumenty przyjdą na Twój e-mail. Dodatki (np. przygotowanie do rozmowy) są płatne osobno.`;
const participantsUk = (code, link) => `Інструкція для учасників (українською):
1. Відкрийте ${link} (код введеться сам) або cvpodogloszenie.pl і введіть код ${code} у підсумку замовлення.
2. Виберіть пакет, вставте текст вакансії та заповніть свої дані. Сайт і документи доступні українською.
3. Пакет оплачено кодом. Готові документи прийдуть на ваш e-mail. Додаткові послуги оплачуються окремо.`;

async function sendB2bMails(b, c, inv, base) {
  const pkgName = PACKAGES[b.pkg]?.name || b.pkg, link = codeLink(base, b.code), rep = reportUrl(base, c);
  const payLine = b.status === 'paid'
    ? `Płatność przyjęta: ${zl(b.total)}. Faktura${inv ? ` ${inv.number}` : ''} w załączniku.`
    : `Faktura${inv ? ` ${inv.number}` : ''} w załączniku. Termin płatności: ${plDate(b.due)}, kwota ${zl(b.total)}, przelew${sellerBank() ? ` na rachunek ${sellerBank()}` : ''}, w tytule numer faktury. Kod działa już teraz.`;
  const text = `Dzień dobry,

dziękujemy za zamówienie paczki kodów w CV Pod Ogłoszenie.

Organizacja: ${b.org}
Pakiet: ${pkgName}, ${b.qty} kodów (jeden kod = jedna osoba)
Kod dla uczestników: ${b.code}
Ważny do: ${plDate(c.expires)}

${payLine}

Link do przekazania uczestnikom (kod wpisze się sam):
${link}

Raport wykorzystania kodów (bez danych osobowych uczestników):
${rep}

Plakat A4 z kodem QR do wydruku:
${rep}/plakat.pdf

${participantsPl(b.code, pkgName, link)}

${participantsUk(b.code, link)}

W razie pytań wystarczy odpowiedzieć na tę wiadomość.

Pozdrawiamy,
CV Pod Ogłoszenie`;
  const attachments = inv ? [{ filename: invoiceFile(inv), content: await renderInvoice(inv), contentType: 'application/pdf' }] : [];
  if (mailEnabled()) {
    await sendPlainMail({ to: b.email, subject: `Kod ${b.code} dla ${b.org}: ${b.qty} × ${pkgName}`, text, attachments });
    await sendOwnerMail(`Nowe zamówienie paczki kodów: ${b.org} (${zl(b.total)})`,
      `${b.org}${b.nip ? `, NIP ${b.nip}` : ''}\n${b.name}, ${b.email}${b.phone ? `, ${b.phone}` : ''}\nPakiet: ${pkgName}, ${b.qty} kodów po ${zl(b.unit)} = ${zl(b.total)}\nPłatność: ${b.status === 'paid' ? 'zapłacono online' : `faktura z terminem ${plDate(b.due)} (do sprawdzenia w panelu → Firmy)`}\nKod: ${b.code}\nFaktura: ${inv?.number || 'nie wystawiono (sprawdź dziennik błędów)'}\nRaport: ${rep}\n\nPanel: ${base}/admin`);
  }
}

// Poranny e-mail: faktury za paczki kodów po terminie.
addDailySection(async (now) => {
  const all = Object.values(await b2bOrders.all());
  const late = all.filter((b) => b.status === 'unpaid' && b.due && b.due < now.getTime() && !b.deactivated);
  const fix = all.filter((b) => b.status === 'unpaid' && b.deactivated && b.invoiceNumber && !b.corrected);
  const wait = all.filter((b) => b.status === 'approval');
  const out = [];
  if (late.length) out.push(`Faktury instytucji po terminie (${late.length}):\n${late.map((b) => `- ${b.org}: ${zl(b.total)}, faktura ${b.invoiceNumber || '?'}, termin ${plDate(b.due)}, ${b.email}`).join('\n')}\nGdy wpłata dotrze: panel → Firmy → „Opłacona”.`);
  if (fix.length) out.push(`Kody wyłączone przy nieopłaconej fakturze (${fix.length}), wystaw fakturę korygującą:\n${fix.map((b) => `- wystaw fakturę korygującą do ${b.invoiceNumber} (${b.org}, ${zl(b.total)})`).join('\n')}\nPo wystawieniu: panel → Firmy → „Korekta wystawiona”.`);
  if (wait.length) out.push(`Zamówienia kodów czekające na zatwierdzenie: ${wait.length} (panel → Firmy).`);
  return out.length ? out.join('\n\n') : null;
});

// --- 2. Program partnerski ---
export function validatePartner(b = {}) {
  const a = {
    name: str(b.name, 120), email: str(b.email, 160).toLowerCase(), channel: str(b.channel, 300), platform: str(b.platform, 40),
    followers: Math.max(0, Math.min(1e9, parseInt(b.followers, 10) || 0)), audience: str(b.audience, 1500),
  };
  if (a.name.length < 2) throw new Error('Podaj imię i nazwisko albo nazwę.');
  if (!emailOk(a.email)) throw new Error('Podaj poprawny adres e-mail.');
  if (!/^https?:\/\/\S+\.\S+/.test(a.channel)) throw new Error('Podaj link do kanału lub profilu (zaczynający się od https://).');
  if (!b.terms) throw new Error('Zaakceptuj regulamin programu partnerskiego.');
  return a;
}
// Doradca kariery / nauczyciel: darmowy kod dla uczniów lub studentów (rabat 10%, bez prowizji).
export function validateAdvisor(b = {}) {
  const a = { name: str(b.name, 120), email: str(b.email, 160).toLowerCase(), org: str(b.org, 160), role: str(b.role, 60), group: Math.max(0, Math.min(100000, parseInt(b.group, 10) || 0)) };
  if (a.name.length < 3) throw new Error('Podaj imię i nazwisko.');
  if (!emailOk(a.email)) throw new Error('Podaj poprawny adres e-mail.');
  if (a.org.length < 2) throw new Error('Podaj nazwę szkoły, uczelni lub instytucji.');
  if (!b.terms) throw new Error('Zaakceptuj regulamin i politykę prywatności.');
  return a;
}
export async function createAdvisorApp(body, now = Date.now()) {
  const a = { id: crypto.randomUUID(), kind: 'advisor', ...validateAdvisor(body), status: 'new', created: now, terms: { version: 'regulamin serwisu', at: now } };
  await partnerApps.save(a);
  return a;
}
export async function createPartnerApp(body, now = Date.now()) {
  const a = { id: crypto.randomUUID(), ...validatePartner(body), status: 'new', created: now, terms: { version: PARTNER_TERMS_VERSION, at: now } };
  await partnerApps.save(a);
  return a;
}
export async function approvePartner(id, { base = '', now = Date.now() } = {}) {
  const a = await partnerApps.get(id);
  if (!a) throw new Error('Nie ma takiego zgłoszenia.');
  if (a.code) return a;
  const advisor = a.kind === 'advisor';
  const code = await uniqueCode(advisor ? partnerCodeBase(a.org) : partnerCodeBase(a.name));
  await codes.save({ id: code, amount: 0, percent: PARTNER_PERCENT, voucher: null, commission: advisor ? 0 : partnerCommission(), maxUses: 0, usedBy: [], note: (advisor ? a.org : a.name).slice(0, 100), created: now, expires: now + YEAR, report: newToken(), partnerApp: id });
  const c = await codes.get(code);
  const done = await partnerApps.update(id, { status: 'approved', code, approvedAt: now });
  if (mailEnabled()) await sendPlainMail(advisor
    ? { to: a.email, subject: `Darmowy kod ${code} dla Twoich uczniów i studentów`, text: advisorWelcome(a, c, base) }
    : { to: a.email, subject: `Witamy w programie partnerskim CV Pod Ogłoszenie: Twój kod ${code}`, text: partnerWelcome(a, c, base) }).catch((e) => logEvent('e-mail', `Partner ${code}: ${e.message}`));
  return done;
}
export async function rejectPartner(id) {
  const a = await partnerApps.get(id);
  if (!a) throw new Error('Nie ma takiego zgłoszenia.');
  if (a.status === 'rejected') return a;
  if (mailEnabled()) await sendPlainMail({ to: a.email, subject: 'Twoje zgłoszenie do programu partnerskiego CV Pod Ogłoszenie', text: `Dzień dobry,\n\ndziękujemy za zgłoszenie do programu partnerskiego CV Pod Ogłoszenie. Tym razem nie możemy go przyjąć. Zgłoszenia dobieramy do tematu i odbiorców naszej usługi, więc ta decyzja nie jest oceną Twojej pracy.\n\nJeśli Twój kanał się zmieni, możesz zgłosić się ponownie.\n\nPozdrawiamy,\nCV Pod Ogłoszenie` }).catch((e) => logEvent('e-mail', `Partner (odmowa): ${e.message}`));
  return partnerApps.update(id, { status: 'rejected', rejectedAt: Date.now() });
}
const advisorWelcome = (a, c, base) => `Dzień dobry,

dziękujemy za zgłoszenie. Oto darmowy kod dla Twoich uczniów, studentów lub uczestników (${a.org}):

Kod: ${c.id}
Z kodem każda osoba płaci ${c.percent}% mniej. Kod jest ważny do ${new Date(c.expires).toLocaleDateString('pl-PL')}.

Link, który sam wpisuje kod (możesz go wkleić na tablicę, do dziennika lub newslettera):
${codeLink(base, c.id)}

Plakat A4 z kodem QR do wydrukowania:
${reportUrl(base, c)}/plakat.pdf

Raport wykorzystania kodu (tylko liczby, bez danych osobowych):
${reportUrl(base, c)}

Bezpłatny scenariusz zajęć „CV pod konkretne ogłoszenie” (45 minut) i darmowe narzędzia na zajęcia:
${base}/dla-doradcow

Jeśli Twoja szkoła lub uczelnia chce opłacić dokumenty uczniom w całości, paczkę kodów zamówisz tu: ${base}/dla-instytucji/zamow

Pozdrawiamy,
CV Pod Ogłoszenie`;
const partnerWelcome = (a, c, base) => `Dzień dobry,

Twoje zgłoszenie do programu partnerskiego CV Pod Ogłoszenie zostało przyjęte. Dziękujemy!

Twój kod: ${c.id}
Twoi odbiorcy płacą z nim ${c.percent}% mniej. Ty dostajesz ${c.commission}% od kwoty każdego opłaconego i niezwróconego zamówienia z Twoim kodem.

Link, który sam wpisuje kod:
${codeLink(base, c.id)}

Twoje statystyki (użycia, sprzedaż, prowizja, wypłaty), bez logowania:
${reportUrl(base, c)}
Tam też podasz numer rachunku do wypłat.

Plakat A4 z kodem QR:
${reportUrl(base, c)}/plakat.pdf

Zasady oznaczania (ważne):
- Każdą treść z kodem lub linkiem oznacz jako reklamę lub współpracę, np. „#reklama” albo „współpraca płatna z CV Pod Ogłoszenie”, albo funkcją platformy „partnerstwo płatne”. Oznaczenie ma być widoczne od razu, bez rozwijania opisu.
- Nie obiecuj zatrudnienia ani zaproszenia na rozmowę.
- Nie publikuj kodu w serwisach z kodami rabatowymi i nie wysyłaj go osobom, które o to nie prosiły.

Wypłata raz w miesiącu, do 15. dnia, gdy saldo wynosi co najmniej 50 zł.
Regulamin programu: ${base}/program-partnerski/regulamin (zaakceptowana wersja z ${PARTNER_TERMS_VERSION}).

W razie pytań odpowiedz na tę wiadomość.

Pozdrawiamy,
CV Pod Ogłoszenie`;
// Odrzucone zgłoszenia kasujemy po 90 dniach, nierozpatrzone po 12 miesiącach, zatwierdzone po 6 latach (rozliczenia podatkowe).
export async function cleanupPartnerApps(now = Date.now()) {
  await partnerApps.deleteWhere((a) => (a.status === 'rejected' && now - (a.rejectedAt || a.created) > 90 * 864e5) || (a.status === 'new' && now - a.created > YEAR) || (a.status === 'approved' && now - a.approvedAt > 6 * YEAR));
  // Zamówienia paczek: rok po wygaśnięciu kodów (faktury zostają osobno 6 lat).
  await b2bOrders.deleteWhere((b) => now - (b.created || 0) > 2 * YEAR + 30 * 864e5);
}

// --- 3. Raport kodu (statystyki bez danych osobowych) ---
export function reportData(c, now = Date.now()) {
  const used = (c.usedBy || []).length;
  if (c.commission > 0) return { kind: 'partner', code: c.id, name: c.note || '', percent: c.percent || 0, commission: c.commission, uses: used, sales: c.sales || 0, revenue: c.revenue || 0, due: c.due || 0, paidOut: c.paidOut || 0, accrued: (c.due || 0) + (c.paidOut || 0), payouts: (c.payouts || []).slice(-24), expires: c.expires, bank: c.bank || '' };
  if (c.voucher) return { kind: 'institution', code: c.id, name: c.note || '', pkg: c.voucher, pkgName: PACKAGES[c.voucher]?.name || c.voucher, total: c.maxUses || 0, used, left: Math.max(0, (c.maxUses || 0) - used), expires: c.expires, active: !c.disabled && now < c.expires };
  return { kind: 'code', code: c.id, name: c.note || '', percent: c.percent || 0, amount: c.amount || 0, uses: used, maxUses: c.maxUses || 0, expires: c.expires };
}

function reportHtml(c, base) {
  const r = reportData(c), link = codeLink(base, c.id), rep = reportUrl(base, c), row = (k, v) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`;
  let body;
  if (r.kind === 'partner') {
    body = `<table class="rep">${row('Rabat dla Twoich odbiorców', `${r.percent}%`)}${row('Twoja prowizja', `${r.commission}% od zapłaconej kwoty`)}${row('Użycia kodu', r.uses)}${row('Opłacone zamówienia', r.sales)}${row('Sprzedaż z kodem', zl(r.revenue))}${row('Naliczona prowizja', zl(r.accrued))}${row('Wypłacono', zl(r.paidOut))}${row('Do wypłaty', `<b>${zl(r.due)}</b>`)}</table>
<p class="hint">Prowizję wypłacamy raz w miesiącu, do 15. dnia, gdy saldo wynosi co najmniej 50 zł. Zwrócone zamówienia nie dają prowizji.</p>
<h2>Historia wypłat</h2>${r.payouts.length ? `<table class="rep">${r.payouts.map((p) => row(plDate(p.at), zl(p.amount))).join('')}</table>` : '<p>Jeszcze nie było wypłat.</p>'}
<h2>Numer rachunku do wypłat</h2>
<form class="scan-card lead-form" id="bankForm" data-token="${esc(c.report)}" novalidate><label class="f">Numer rachunku (IBAN) i nazwa odbiorcy<input type="text" name="bank" maxlength="120" value="${esc(r.bank)}" autocomplete="off" placeholder="PL00 0000 0000 0000 0000 0000 0000, Jan Kowalski"></label><button class="btn" type="submit">Zapisz</button><p class="fstatus" role="status"></p></form>`;
  } else if (r.kind === 'institution') {
    const pct = r.total ? Math.round((100 * r.used) / r.total) : 0;
    body = `<table class="rep">${row('Pakiet', esc(r.pkgName))}${row('Wykorzystane kody', `${r.used} z ${r.total} (${pct}%)`)}${row('Pozostało', `<b>${r.left}</b>`)}${row('Ważny do', plDate(r.expires))}${row('Stan', r.active ? 'aktywny' : 'nieaktywny')}</table>
<p><a class="btn" href="/dla-instytucji/zamow?pkg=${esc(r.pkg)}">Dokup kody</a></p>`;
  } else {
    body = `<table class="rep">${row('Rabat', r.percent ? `${r.percent}%` : zl(r.amount))}${row('Użycia kodu', `${r.uses}${r.maxUses ? ` z ${r.maxUses}` : ''}`)}${row('Ważny do', plDate(r.expires))}</table>`;
  }
  return `<div class="inner narrow"><p class="eyebrow">Raport kodu</p><h1>${esc(c.id)}${r.name ? ` <small>${esc(r.name)}</small>` : ''}</h1>
<p class="lead">Liczby aktualizują się na bieżąco. Nie pokazujemy tu żadnych danych osobowych klientów.</p>
${body}
<h2>Link i plakat</h2>
<p>Link, który sam wpisuje kod: <a href="${esc(link)}">${esc(link)}</a></p>
<p><a class="btn ghost" href="${esc(rep)}/plakat.pdf">Pobierz plakat A4 z kodem QR (PDF)</a></p>
<h2>Skaner CV na Twojej stronie</h2>
<p>Wklej ten kod na swoją stronę, blog albo stronę biura karier. Odwiedzający sprawdzą CV za darmo, a przycisk „Zrób CV pod to ogłoszenie” otworzy nasz serwis z Twoim kodem.</p>
<textarea class="embed-code" readonly rows="3" aria-label="Kod do wklejenia na stronę">${esc(embedSnippet(base, c.id))}</textarea>
<p class="hint">Ta strona jest prywatna: nie udostępniaj jej adresu publicznie.</p></div>`;
}

// --- 4. Plakat A4 z kodem QR ---
const F = new URL('../fonts/', import.meta.url).pathname;
// QR: moduły rysowane jako kwadraty (ostro w każdym rozmiarze druku), z marginesem 4 modułów. Generowany lokalnie (qrcode).
function drawQr(doc, qr, x0, y0, size, color) {
  const n = qr.modules.size, cell = size / (n + 8);
  doc.rect(x0, y0, size, size).fill('#fff');
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.modules.get(r, k)) doc.rect(x0 + (k + 4) * cell, y0 + (r + 4) * cell, cell + 0.2, cell + 0.2).fill(color);
}
export async function renderPoster(c, base) {
  const link = codeLink(base, c.id), qr = QRCode.create(link, { errorCorrectionLevel: 'M' });
  const pkgName = c.voucher ? PACKAGES[c.voucher]?.name : null;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Plakat ${c.id}` } });
    const out = []; doc.on('data', (x) => out.push(x)); doc.on('end', () => resolve(Buffer.concat(out))); doc.on('error', reject);
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const INK = '#16233A', BRAND = '#2447D8', MUTE = '#546178', W = 595.28, L = 50, CW = W - 100;
    doc.rect(0, 0, W, 10).fill(BRAND);
    doc.fillColor(BRAND).font('b').fontSize(14).text('CV Pod Ogłoszenie', L, 40);
    doc.fillColor(INK).font('b').fontSize(34).text('Zrób CV pod konkretne ogłoszenie', L, 80, { width: CW });
    doc.font('r').fontSize(14).fillColor(MUTE).text(c.voucher ? `Pakiet „${pkgName}” opłacony kodem: nic nie płacisz.` : `Z kodem zapłacisz ${c.percent ? `${c.percent}%` : `${(c.amount || 0) / 100} zł`} mniej.`, { width: CW });
    let y = doc.y + 24;
    ['Zeskanuj kod QR telefonem albo wejdź na cvpodogloszenie.pl.', 'Wklej ogłoszenie o pracę i uzupełnij swoje dane.', 'Odbierz CV dopasowane do ogłoszenia na e-mail.'].forEach((t, i) => {
      doc.circle(L + 14, y + 12, 14).fill(BRAND); doc.fillColor('#fff').font('b').fontSize(14).text(String(i + 1), L, y + 4, { width: 28, align: 'center' });
      doc.fillColor(INK).font('r').fontSize(15).text(t, L + 40, y + 3, { width: CW - 40 }); y = Math.max(doc.y, y + 28) + 12;
    });
    const size = 230, x0 = (W - size) / 2, y0 = y + 10;
    drawQr(doc, qr, x0, y0, size, INK);
    y = y0 + size + 14;
    doc.fillColor(MUTE).font('r').fontSize(12).text('albo wpisz kod w podsumowaniu zamówienia:', L, y, { width: CW, align: 'center' });
    doc.fillColor(INK).font('b').fontSize(30).text(c.id, L, doc.y + 4, { width: CW, align: 'center' });
    doc.fillColor(MUTE).font('r').fontSize(11).text(`Kod ważny do ${plDate(c.expires)}. ${link.replace(/^https?:\/\//, '')}`, L, doc.y + 6, { width: CW, align: 'center' });
    doc.moveTo(L, 712).lineTo(W - L, 712).strokeColor('#D9E0EC').stroke();
    doc.fillColor(INK).font('b').fontSize(11).text('Українською:', L, 722, { continued: true, width: CW, lineBreak: true }).font('r').text(` резюме під конкретну вакансію. Відскануйте QR-код або введіть код ${c.id} на cvpodogloszenie.pl. Сайт і документи доступні українською.`, { width: CW, height: 60 });
    doc.end();
  });
}

// --- Strony i API ---
const page = (res, base, path, title, desc, html, opts = {}) => ssrPage(res, base, path, { title, metaDescription: desc }, html, opts);
const crumbs = (items) => `<nav class="crumbs"><a href="/">Strona główna</a> › ${items.map(([t, h]) => (h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`)).join(' › ')}</nav>`;

// Odpowiedź na zapytanie z formularza „Dla firm i uczelni” (/api/b2b, zgoda na kontakt w sprawie zapytania): oferta PDF
// z aktualnymi progami i wycena dla podanej liczby osób; link do zamówienia z wpisaną liczbą kodów. Jedna wysyłka na zapytanie.
export function leadOfferMail(l, base) {
  const qty = Math.min(B2B_MAX, Math.max(B2B_MIN, l.count || B2B_MIN)), q = b2bQuote('cv_letter', qty);
  const tiers = B2B_TIERS.map((t, i) => `- od ${t.min} kodów${B2B_TIERS[i + 1] ? ` (do ${B2B_TIERS[i + 1].min - 1})` : ''}: ${B2B_PKGS.map((p) => `${PACKAGES[p].name} ${b2bTable()[p][i]} zł`).join(', ')} za kod`).join('\n');
  return { subject: `Oferta CV Pod Ogłoszenie dla: ${l.org}`, text: `Dzień dobry,\n\ndziękujemy za zapytanie. W załączniku przesyłamy ofertę w PDF.\n\nCena za jeden kod (każdy kod = jedna osoba, CV pod jej ogłoszenie):\n${tiers}\n\nPrzykład dla ${qty} osób (CV z listem motywacyjnym): ${q.unit / 100} zł za kod, razem ${q.total / 100} zł. Ceny bez VAT (sprzedawca zwolniony podmiotowo, art. 113 ustawy o VAT).\n\nZamówienie online z kartą/BLIK albo fakturą z terminem płatności 14 dni (podmioty publiczne i firmy z NIP): ${base}/dla-instytucji/zamow?qty=${qty}\n\nW razie pytań wystarczy odpowiedzieć na tę wiadomość.\n\nPozdrawiamy,\nCV Pod Ogłoszenie` };
}
export async function sendLeadOffer(id, base, now = Date.now()) {
  const l = await leads.get(id); if (!l) throw new Error('Nie ma takiego zapytania.');
  if (l.offerSentAt) throw new Error('Oferta do tego zapytania została już wysłana.');
  if (!mailEnabled()) throw new Error('Poczta nie jest skonfigurowana (SMTP).');
  const { subject, text } = leadOfferMail(l, base);
  await sendPlainMail({ to: l.email, subject, text, attachments: [{ filename: 'oferta-cv-pod-ogloszenie.pdf', content: await renderOffer(base), contentType: 'application/pdf' }] });
  return leads.save({ ...l, offerSentAt: now });
}

// Tabela cen za kod (progi z lib/pricing.js): zamówienie paczki i strona dla agencji pracy.
function priceTableHtml() {
  const t = b2bTable(), tierName = (i) => `${B2B_TIERS[i].min}${B2B_TIERS[i + 1] ? `–${B2B_TIERS[i + 1].min - 1}` : '+'} kodów`;
  const head = `<tr><th>Pakiet (cena w cenniku)</th>${B2B_TIERS.map((_, i) => `<th>${tierName(i)}</th>`).join('')}</tr>`;
  // Cena za kod i łącznie przy dolnej granicy progu (bez przekreśleń; cena w cenniku w pierwszej kolumnie).
  // Na telefonie wiersz pakietu to siatka 2×2 z nazwą progu w każdej komórce (.m-tier), bez przewijania tabeli.
  const rows = B2B_PKGS.map((p) => `<tr><td>${esc(PACKAGES[p].name)} (${PRICES[p] / 100} zł)</td>${t[p].map((v, i) => `<td><span class="m-tier">${tierName(i)}: </span><b>${v} zł</b> za kod<br><small>${v * B2B_TIERS[i].min} zł za ${B2B_TIERS[i].min}</small></td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap"><table class="rep b2b-prices">${head}${rows}</table></div>`;
}

function orderPageHtml(q, done) {
  const t = b2bTable(), pkg = B2B_PKGS.includes(q.pkg) ? q.pkg : 'cv_letter';
  return `<div class="inner narrow">${crumbs([['Dla firm i uczelni', '/dla-firm'], ['Zamów paczkę kodów', null]])}
<h1>Zamów paczkę kodów dla podopiecznych</h1>
<p class="lead">Każdy kod to jedna osoba: zamawia CV pod swoje ogłoszenie, kiedy chce, i nic nie płaci. Kod, faktura i plakat z kodem QR przychodzą e-mailem od razu po zamówieniu.</p>
${done || ''}
<h2>Cena za jeden kod</h2>
${priceTableHtml()}
<p class="hint">Ceny dla organizacji, bez VAT (sprzedawca zwolniony podmiotowo, art. 113 ustawy o VAT). Minimum ${B2B_MIN} kodów, w jednym zamówieniu do ${B2B_MAX}. Kody ważne 12 miesięcy.</p>
<h2>Zamówienie</h2>
<form class="scan-card lead-form" id="b2bOrder" novalidate data-prices='${JSON.stringify(Object.fromEntries(B2B_PKGS.map((p) => [p, B2B_TIERS.map((x) => ({ min: x.min, unit: t[p][B2B_TIERS.indexOf(x)] }))])))}'>
  <div class="grid2"><label class="f">Nazwa organizacji<input type="text" name="org" maxlength="160" required autocomplete="organization"></label>
  <label class="f">NIP <span class="h">opcjonalnie, np. dla fundacji bez NIP</span><input type="text" name="nip" maxlength="20" inputmode="numeric"></label></div>
  <label class="f">Adres organizacji (do faktury)<input type="text" name="address" maxlength="250" required autocomplete="street-address" placeholder="ulica i numer, kod pocztowy, miejscowość"></label>
  <div class="grid2"><label class="f">Imię i nazwisko<input type="text" name="name" maxlength="100" required autocomplete="name"></label>
  <label class="f">E-mail (tu wyślemy kod i fakturę)<input type="email" name="email" maxlength="160" required autocomplete="email"></label></div>
  <div class="grid2"><label class="f">Telefon <span class="h">opcjonalnie</span><input type="tel" name="phone" maxlength="40" autocomplete="tel"></label>
  <label class="f">Pakiet<select name="pkg">${B2B_PKGS.map((p) => `<option value="${p}"${p === pkg ? ' selected' : ''}>${esc(PACKAGES[p].name)}</option>`).join('')}</select></label></div>
  <label class="f">Liczba kodów (osób)<input type="number" name="qty" min="${B2B_MIN}" max="${B2B_MAX}" value="${Math.min(B2B_MAX, Math.max(B2B_MIN, parseInt(q.qty, 10) || 20))}" required inputmode="numeric"></label>
  <fieldset class="f pay-choice"><legend>Płatność</legend>
    <label class="check"><input type="radio" name="pay" value="now" checked><span>Zapłać teraz (karta, BLIK – płatność online przez Stripe)</span></label>
    <label class="check"><input type="radio" name="pay" value="invoice"><span>Faktura z terminem 14 dni (przelew), kod działa od razu</span></label></fieldset>
  <p class="hint" id="b2bPayNote">Faktura z terminem wymaga NIP. Do ${autoMax()} kodów kod działa od razu, większe zamówienia potwierdzamy ręcznie (zwykle w 1 dzień roboczy).</p>
  <p class="b2b-sum" id="b2bSum" aria-live="polite"></p>
  <label class="hp" aria-hidden="true">Strona www<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  <label class="check"><input type="checkbox" name="terms" required><span>Akceptuję <a href="/regulamin" target="_blank" rel="noopener">regulamin</a> i <a href="/polityka-prywatnosci" target="_blank" rel="noopener">politykę prywatności</a>. Kody przekazujemy uczestnikom, a każdy z nich zamawia sam.</span></label>
  <button class="btn" type="submit">Zamawiam</button>
  <p class="fstatus" role="status"></p>
</form>
<p>Wolisz porozmawiać albo potrzebujesz innej liczby kodów? <a href="/dla-firm#zapytanie">Napisz do nas</a>.</p></div>`;
}

// Strona dla agencji pracy tymczasowej i rekrutacyjnych (PR Z). Bez obietnic i liczb bez źródła; ceny z lib/pricing.js.
// Zapytanie trafia do /api/b2b (Panel → Firmy) z dopiskiem rodzaju organizacji, jak formularz „Dla firm” na stronie głównej.
export const AGENCY_TYPES = ['Agencja pracy tymczasowej', 'Agencja zatrudnienia / rekrutacyjna', 'Agencja doradztwa personalnego'];
function agencyPageHtml() {
  return `<div class="inner narrow">${crumbs([['Dla firm i uczelni', '/dla-firm'], ['Dla agencji pracy', null]])}
<h1>CV pod ogłoszenie dla kandydatów agencji pracy</h1>
<p class="lead">Kandydat wkleja Wasze ogłoszenie i swoje dane, a dostaje CV i list motywacyjny dopasowane do tej oferty, w PDF i DOCX. Treść powstaje wyłącznie z danych, które poda kandydat.</p>
<h2>Co możecie dać kandydatom</h2>
<ul class="tips">
  <li>Paczkę opłaconych kodów: każdy kod to jedna osoba i jedno zamówienie bez płatności po stronie kandydata.</li>
  <li>Formularz po polsku, ukraińsku, angielsku i niemiecku. Kandydat może wpisać dane po ukraińsku i dostać CV po polsku.</li>
  <li>Bezpłatny <a href="/narzedzia/skaner-cv">skaner CV pod ogłoszenie</a> bez rejestracji, do podlinkowania w ogłoszeniach i wiadomościach do kandydatów.</li>
  <li>Plakat z kodem QR do biura i raport online z liczbą użyć kodu.</li>
</ul>
<h2>Dane kandydatów</h2>
<p>Kandydat zamawia sam i to on dostaje dokumenty na e-mail. Agencja nie dostaje od nas danych kandydatów ani ich dokumentów, tylko liczbę użyć kodu w raporcie. Dane zamówień usuwamy automatycznie po 30 dniach (<a href="/polityka-prywatnosci">polityka prywatności</a>).</p>
<h2>Cena za jeden kod</h2>
${priceTableHtml()}
<p class="hint">Ceny bez VAT (sprzedawca zwolniony podmiotowo, art. 113 ustawy o VAT). Minimum ${B2B_MIN} kodów, kody ważne 12 miesięcy. Faktura z terminem 14 dni dla firm z NIP. <a href="/dla-instytucji/zamow">Zamów online</a> albo <a href="/oferta-dla-instytucji.pdf">pobierz ofertę w PDF</a>.</p>
<h2 id="zapytanie">Zapytanie</h2>
<form class="scan-card lead-form" id="agencyForm" novalidate>
  <div class="grid2"><label class="f">Nazwa agencji<input type="text" name="org" maxlength="150" required autocomplete="organization"></label>
  <label class="f">Rodzaj<select name="orgType">${AGENCY_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></label></div>
  <div class="grid2"><label class="f">Imię i nazwisko<input type="text" name="name" maxlength="100" required autocomplete="name"></label>
  <label class="f">Służbowy e-mail<input type="email" name="email" maxlength="150" required autocomplete="email"></label></div>
  <div class="grid2"><label class="f">Telefon <span class="h">opcjonalnie</span><input type="tel" name="phone" maxlength="40" autocomplete="tel"></label>
  <label class="f">Ilu kandydatów miesięcznie <span class="h">w przybliżeniu, opcjonalnie</span><input type="number" name="count" min="1" max="100000" inputmode="numeric"></label></div>
  <label class="f">Czego potrzebujecie? <span class="h">opcjonalnie</span><textarea name="msg" rows="4" maxlength="1800" placeholder="np. kody dla kandydatów z Ukrainy do pracy na magazynie"></textarea></label>
  <label class="hp" aria-hidden="true">Strona www<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  <label class="check"><input type="checkbox" name="consent" required><span>Zgadzam się na kontakt w sprawie tego zapytania. Dane usuwamy po 12 miesiącach. Szczegóły w <a href="/polityka-prywatnosci">polityce prywatności</a>.</span></label>
  <button class="btn" type="submit">Wyślij zapytanie</button>
  <p class="fstatus" role="status"></p>
</form>
<h2>Pytania</h2>
<details><summary>Czy kandydat musi zakładać konto?</summary><p>Nie. Wpisuje kod w podsumowaniu zamówienia i zamawia bez płatności. Dokumenty dostaje na stronie i e-mailem.</p></details>
<details><summary>Czy CV może zawierać doświadczenie, którego kandydat nie ma?</summary><p>Nie. Dopasowujemy opis i kolejność do ogłoszenia, ale korzystamy tylko z informacji od kandydata.</p></details>
<details><summary>Czy jest wersja bez kosztów?</summary><p>Tak: kod zniżkowy dla Waszych kandydatów z raportem użyć. Kandydat płaci wtedy sam, mniej niż w cenniku. Napiszcie w zapytaniu, który wariant Was interesuje.</p></details></div>`;
}

function partnerPageHtml() {
  return `<div class="inner narrow">${crumbs([['Program partnerski', null]])}
<h1>Program partnerski CV Pod Ogłoszenie</h1>
<p class="lead">Dla twórców, blogerów, doradców kariery i coachów. Polecasz CV pisane pod konkretne ogłoszenie, Twoi odbiorcy płacą mniej, a Ty dostajesz prowizję od każdej opłaconej sprzedaży.</p>
<ul class="tips">
  <li>Twoi odbiorcy płacą z Twoim kodem ${PARTNER_PERCENT}% mniej.</li>
  <li>Ty dostajesz ${partnerCommission()}% od kwoty każdego opłaconego i niezwróconego zamówienia z kodem.</li>
  <li>Własny link, który sam wpisuje kod, i plakat z kodem QR.</li>
  <li>Prywatna strona statystyk bez logowania: użycia kodu, sprzedaż, prowizja i wypłaty.</li>
  <li>Wypłata raz w miesiącu przelewem, gdy saldo wynosi co najmniej 50 zł.</li>
</ul>
<h2>Zasady oznaczania reklam</h2>
<p>Każdą treść z kodem lub linkiem oznaczasz jako reklamę lub współpracę, np. „#reklama”, „współpraca płatna z CV Pod Ogłoszenie” albo funkcją platformy „partnerstwo płatne”. Oznaczenie ma być widoczne od razu, bez rozwijania opisu (zgodnie z rekomendacjami UOKiK). Nie obiecujesz zatrudnienia ani zaproszenia na rozmowę.</p>
<h2>Zgłoszenie</h2>
<form class="scan-card lead-form" id="partnerForm" novalidate>
  <div class="grid2"><label class="f">Imię i nazwisko albo nazwa<input type="text" name="name" maxlength="120" required autocomplete="name"></label>
  <label class="f">E-mail<input type="email" name="email" maxlength="160" required autocomplete="email"></label></div>
  <div class="grid2"><label class="f">Link do kanału lub profilu<input type="url" name="channel" maxlength="300" required placeholder="https://"></label>
  <label class="f">Platforma<select name="platform"><option>YouTube</option><option>Instagram</option><option>TikTok</option><option>Facebook</option><option>LinkedIn</option><option>Blog / strona</option><option>Newsletter</option><option>Inna</option></select></label></div>
  <label class="f">Liczba obserwujących <span class="h">w przybliżeniu</span><input type="number" name="followers" min="0" max="1000000000" inputmode="numeric"></label>
  <label class="f">Kim są Twoi odbiorcy? <span class="h">kilka zdań</span><textarea name="audience" rows="4" maxlength="1500" placeholder="np. studenci i absolwenci, osoby szukające pracy w logistyce, Ukraińcy w Polsce"></textarea></label>
  <label class="hp" aria-hidden="true">Strona www<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  <label class="check"><input type="checkbox" name="terms" required><span>Akceptuję <a href="/program-partnerski/regulamin" target="_blank" rel="noopener">regulamin programu partnerskiego</a> (wersja z ${PARTNER_TERMS_VERSION}) i <a href="/polityka-prywatnosci" target="_blank" rel="noopener">politykę prywatności</a>.</span></label>
  <button class="btn" type="submit">Wyślij zgłoszenie</button>
  <p class="fstatus" role="status"></p>
</form></div>`;
}

// Scenariusz zajęć dla doradców (treść od koordynatora). Jedno źródło dla strony /dla-doradcow i PDF do pobrania.
export const LESSON = {
  title: 'Scenariusz zajęć (45 min): „CV pod konkretne ogłoszenie”',
  meta: [
    ['Dla kogo', 'uczniowie szkół ponadpodstawowych (klasy przed praktykami i maturalne), studenci, uczestnicy warsztatów aktywizacji zawodowej.'],
    ['Prowadzący', 'doradca zawodowy, nauczyciel, pracownik biura karier. Nie trzeba znać serwisu.'],
    ['Potrzebne', 'rzutnik, telefony lub komputery uczniów, wydrukowane 2–3 prawdziwe ogłoszenia o pracę (albo linki z dowolnego portalu).'],
    ['Koszt', '0 zł. Wszystkie narzędzia użyte na zajęciach są darmowe i nie wymagają konta.'],
  ],
  goals: ['rozumie, że jedno CV wysyłane wszędzie działa gorzej niż CV dopasowane do oferty;', 'umie wypisać z ogłoszenia wymagania i słowa kluczowe;', 'potrafi przełożyć swoje doświadczenia (szkoła, praktyki, wolontariat, praca dorywcza) na język ogłoszenia;', 'zna podstawowe elementy CV: klauzulę RODO, zdjęcie, kolejność sekcji.'],
  steps: [
    ['Wstęp (5 min): „Dlaczego nikt nie dzwoni?”', 'Pytanie do grupy: ile osób słyszało, że wysłało CV i nie dostało odpowiedzi? Krótko o tym, że rekruter (i często system do selekcji CV) szuka w dokumencie konkretnych wymagań z ogłoszenia.'],
    ['Rozbiór ogłoszenia (10 min)', 'W parach uczniowie podkreślają w ogłoszeniu trzy rzeczy różnymi kolorami: wymagania konieczne („wymagamy”), mile widziane, słowa kluczowe (nazwy umiejętności, programów, uprawnień). Wspólnie wypisujemy na tablicy 8–10 słów kluczowych.'],
    ['Moje doświadczenia (10 min)', 'Każdy wypisuje 5 rzeczy, które robił: szkoła, praktyki, wolontariat, praca sezonowa, hobby, projekty. Potem łączy je strzałkami ze słowami kluczowymi z tablicy. Przykład: „pomagałem w sklepie rodziców” → „obsługa klienta, obsługa kasy”.'],
    ['Skaner CV (10 min)', 'Wejście na cvpodogloszenie.pl/narzedzia/skaner-cv. Uczestnik wkleja ogłoszenie i swoje CV (albo listę z punktu 3). Skaner pokazuje, których słów kluczowych z ogłoszenia brakuje. Uczniowie dopisują brakujące rzeczy, ale tylko prawdziwe: nie wpisujemy umiejętności, których nie mamy.'],
    ['Ostatnie szlify (5 min)', 'Klauzula RODO: /narzedzia/klauzula-rodo (aktualna treść do skopiowania). Zdjęcie: /narzedzia/zdjecie-do-cv (czy potrzebne i jakie). Po rozmowie: /narzedzia/podziekowanie-po-rozmowie.'],
    ['Podsumowanie (5 min)', 'Każdy kończy zdanie: „Przed wysłaniem kolejnego CV sprawdzę…”. Zadanie domowe: przygotować CV pod jedno wybrane prawdziwe ogłoszenie.'],
  ],
  forLeader: 'Szkoła lub biuro karier może bezpłatnie dostać własny kod zniżkowy dla uczniów (plakat z QR do klasy) — formularz poniżej na tej stronie. Zajęcia nie wymagają zakupu żadnej usługi; płatna usługa jest opcjonalna dla osób, które chcą zaoszczędzić czas. Osoby z Ukrainy: interfejs po ukraińsku na cvpodogloszenie.pl/uk — dane można wpisać po ukraińsku, a CV powstaje po polsku.',
};
// Adresy w treści jako linki (cvpodogloszenie.pl/… i /narzedzia/…).
const linkify = (t) => esc(t).replace(/(?:cvpodogloszenie\.pl)?(\/(?:narzedzia\/[a-z-]+|uk|dla-doradcow))(?![\w/-])/g, (m, p) => `<a href="${p}">${m}</a>`);
export const ADVISOR_LESSON_HTML = `<h2>${esc(LESSON.title)}</h2>
${LESSON.meta.map(([k, v]) => `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join('\n')}
<p><b>Cele.</b> Uczestnik:</p><ul class="tips">${LESSON.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
<p><b>Przebieg:</b></p>
<ol class="tips">${LESSON.steps.map(([h, t]) => `<li><b>${esc(h)}.</b> ${linkify(t)}</li>`).join('')}</ol>
<p><b>Dla prowadzącego:</b> ${linkify(LESSON.forLeader)}</p>
<p><a class="btn ghost" href="/dla-doradcow/scenariusz.pdf">Pobierz scenariusz (PDF)</a></p>`;

export function renderLesson() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: LESSON.title } });
    const out = []; doc.on('data', (x) => out.push(x)); doc.on('end', () => resolve(Buffer.concat(out))); doc.on('error', reject);
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const INK = '#16233A', BRAND = '#2447D8', L = 50, W = 495;
    doc.rect(0, 0, 595.28, 8).fill(BRAND);
    doc.fillColor(BRAND).font('b').fontSize(11).text('CV Pod Ogłoszenie · cvpodogloszenie.pl/dla-doradcow', L, 30);
    doc.fillColor(INK).font('b').fontSize(18).text(LESSON.title, L, 50, { width: W }); doc.moveDown(0.5);
    const para = (bold, text) => { doc.font('b').fontSize(10.5).fillColor(INK).text(`${bold} `, L, doc.y, { width: W, continued: true, lineGap: 2 }).font('r').text(text, { width: W, lineGap: 2 }); doc.moveDown(0.3); };
    LESSON.meta.forEach(([k, v]) => para(`${k}:`, v));
    para('Cele.', 'Uczestnik:'); LESSON.goals.forEach((g) => { doc.font('r').fontSize(10.5).text(`• ${g}`, L + 10, doc.y, { width: W - 10, lineGap: 2 }); });
    doc.moveDown(0.5); doc.font('b').fontSize(12).text('Przebieg', L, doc.y); doc.moveDown(0.3);
    LESSON.steps.forEach(([h, t], i) => para(`${i + 1}. ${h}.`, t));
    doc.moveDown(0.3); para('Dla prowadzącego:', LESSON.forLeader);
    doc.end();
  });
}

// Materiały, które doradca przekazuje klientowi (PR I): wiadomość do skopiowania lub PDF i ulotka A5 z QR do skanera.
// Linki z utm_source=doradca (w panelu: „kampania: doradca”). Bez obietnic: tylko co robi darmowe narzędzie.
const advisorUrl = (base, path, medium) => `${base}/${path}?utm_source=doradca&utm_medium=${medium}`;
// print: wersja do wydruku – krótkie adresy bez utm (nikt ich nie przepisuje), UTM niesie kod QR w PDF.
export function advisorClientText(base, print = false) {
  const host = base.replace(/^https?:\/\//, ''), link = (path) => (print ? `${host}/${path}` : advisorUrl(base, path, 'wiadomosc')), u = (t) => link(`narzedzia/${t}`);
  return {
    subject: 'Sprawdź swoje CV przed wysłaniem – darmowe narzędzie',
    text: `Dzień dobry,

zgodnie z tym, o czym rozmawialiśmy: zanim wyślesz CV, warto sprawdzić, czy odpowiada na wymagania z ogłoszenia. Można to zrobić za darmo, bez zakładania konta:

1. Wejdź na ${u('skaner-cv')}
2. Wklej treść ogłoszenia o pracę i swoje CV (albo listę tego, co robiłeś/robiłaś: szkoła, praktyki, praca, wolontariat).
3. Skaner pokaże, które wymagania z ogłoszenia widać w CV, a których nie. Dopisz tylko to, co jest prawdą o Tobie.

Mogą się też przydać:
- aktualna klauzula RODO do CV: ${u('klauzula-rodo')}
- podziękowanie po rozmowie kwalifikacyjnej: ${u('podziekowanie-po-rozmowie')}

Narzędzia są bezpłatne. Serwis ma też płatną usługę przygotowania CV pod ogłoszenie, ale nie trzeba z niej korzystać.
Інтерфейс українською: ${link(toolUrl('uk', 'skaner-cv'))}

Pozdrawiam
[imię i nazwisko, instytucja]`,
  };
}
const pdfDoc = (size, title, resolve, reject) => {
  const doc = new PDFDocument({ size, margin: 40, info: { Title: title } }), out = [];
  doc.on('data', (x) => out.push(x)); doc.on('end', () => resolve(Buffer.concat(out))); doc.on('error', reject);
  doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
  return doc;
};
// Wiadomość do klienta w PDF (A4) – do wydruku albo załącznika.
export function renderAdvisorLetter(base) {
  const { subject, text } = advisorClientText(base, true), qr = QRCode.create(advisorUrl(base, 'narzedzia/skaner-cv', 'wiadomosc-pdf'), { errorCorrectionLevel: 'M' });
  return new Promise((resolve, reject) => {
    const doc = pdfDoc('A4', subject, resolve, reject), L = 50, W = 495;
    doc.rect(0, 0, 595.28, 8).fill('#2447D8');
    doc.fillColor('#2447D8').font('b').fontSize(11).text('CV Pod Ogłoszenie · materiał dla klienta doradcy', L, 30);
    doc.fillColor('#16233A').font('b').fontSize(16).text(subject, L, 52, { width: W }); doc.moveDown(0.8);
    doc.font('r').fontSize(11).text(text, L, doc.y, { width: W, lineGap: 3 });
    const y = doc.y + 24; drawQr(doc, qr, L, y, 110, '#16233A');
    doc.fillColor('#546178').font('r').fontSize(10).text('Kod QR prowadzi do darmowego skanera CV.', L + 124, y + 46, { width: W - 124 });
    doc.end();
  });
}
// Ulotka A5 „Sprawdź CV za darmo przed wysłaniem” z kodem QR do skanera.
export function renderLeaflet(base) {
  const link = advisorUrl(base, 'narzedzia/skaner-cv', 'ulotka'), qr = QRCode.create(link, { errorCorrectionLevel: 'M' });
  return new Promise((resolve, reject) => {
    const doc = pdfDoc('A5', 'Sprawdź CV za darmo przed wysłaniem', resolve, reject);
    const INK = '#16233A', BRAND = '#2447D8', MUTE = '#546178', W = 419.53, L = 36, CW = W - 72;
    doc.rect(0, 0, W, 8).fill(BRAND);
    doc.fillColor(BRAND).font('b').fontSize(11).text('CV Pod Ogłoszenie', L, 28);
    doc.fillColor(INK).font('b').fontSize(24).text('Sprawdź CV za darmo przed wysłaniem', L, 50, { width: CW });
    doc.font('r').fontSize(12).fillColor(MUTE).text('Darmowy skaner porówna Twoje CV z ogłoszeniem o pracę i pokaże, których wymagań z ogłoszenia nie widać w CV. Bez zakładania konta.', L, doc.y + 6, { width: CW, lineGap: 2 });
    let y = doc.y + 16;
    ['Zeskanuj kod QR telefonem.', 'Wklej treść ogłoszenia i swoje CV.', 'Dopisz w CV to, czego brakuje – tylko jeśli to prawda.'].forEach((t, i) => {
      doc.circle(L + 11, y + 10, 11).fill(BRAND); doc.fillColor('#fff').font('b').fontSize(12).text(String(i + 1), L, y + 3, { width: 22, align: 'center' });
      doc.fillColor(INK).font('r').fontSize(12.5).text(t, L + 32, y + 3, { width: CW - 32 }); y = Math.max(doc.y, y + 22) + 8;
    });
    const size = 180; drawQr(doc, qr, (W - size) / 2, y + 6, size, INK); y += size + 14;
    doc.fillColor(MUTE).font('r').fontSize(10.5).text('cvpodogloszenie.pl/narzedzia/skaner-cv', L, y, { width: CW, align: 'center' });
    doc.moveTo(L, 505).lineTo(W - L, 505).strokeColor('#D9E0EC').stroke();
    doc.fillColor(INK).font('b').fontSize(10).text('Українською:', L, 515, { continued: true, width: CW }).font('r').text(` безкоштовна перевірка резюме на cvpodogloszenie.pl/${toolUrl('uk', 'skaner-cv')}`);
    doc.end();
  });
}
const ADVISOR_MATERIALS_HTML = (base) => `<h2>Materiały do przekazania klientowi</h2>
<p>Gotowa wiadomość dla osoby, z którą pracujesz: co sprawdzić w CV przed wysłaniem i gdzie zrobić to za darmo. Skopiuj ją do e-maila albo wydrukuj PDF. Do gabinetu lub na tablicę ogłoszeń: ulotka A5 z kodem QR do darmowego skanera.</p>
<textarea class="embed-code" readonly rows="12" aria-label="Wiadomość do klienta do skopiowania">${esc(`Temat: ${advisorClientText(base).subject}\n\n${advisorClientText(base).text}`)}</textarea>
<p><a class="btn ghost" href="/dla-doradcow/wiadomosc-do-klienta.pdf">Wiadomość do klienta (PDF)</a> <a class="btn ghost" href="/dla-doradcow/ulotka-a5.pdf">Ulotka A5 z kodem QR (PDF)</a></p>
`;

function advisorPageHtml(BASE_URL_FOR_PAGES = 'https://cvpodogloszenie.pl') {
  const tools = [['skaner-cv', 'Skaner CV: dopasowanie CV do ogłoszenia'], ['klauzula-rodo', 'Generator klauzuli RODO do CV'], ['jaki-zawod-dla-mnie', 'Quiz „Jaki zawód do mnie pasuje?”'], ['odpowiedzi-na-pytania-rekrutera', 'Odpowiedzi na pytania rekrutera'], ['podziekowanie-po-rozmowie', 'Podziękowanie po rozmowie kwalifikacyjnej']];
  return `<div class="inner narrow">${crumbs([['Dla firm i uczelni', '/dla-firm'], ['Dla doradców kariery', null]])}
<h1>Materiały dla doradców kariery i nauczycieli</h1>
<p class="lead">Bezpłatny scenariusz zajęć, darmowe narzędzia do pracy z uczniami i studentami oraz darmowy kod zniżkowy dla Twojej grupy z plakatem do wydrukowania.</p>
${ADVISOR_LESSON_HTML}
<h2>Darmowe narzędzia na zajęcia (bez rejestracji)</h2>
<ul class="tips">${tools.map(([k, t]) => `<li><a href="/narzedzia/${k}">${esc(t)}</a></li>`).join('')}<li><a href="/#poradnik">Poradnik: jak napisać CV dla 150 zawodów</a></li></ul>
${ADVISOR_MATERIALS_HTML(BASE_URL_FOR_PAGES)}<h2>Skaner CV na stronie szkoły lub biura karier</h2>
<p>Darmowy skaner można osadzić na swojej stronie. Wklej ten kod (z własnym kodem zniżkowym dostaniesz go w raporcie kodu):</p>
<textarea class="embed-code" readonly rows="3" aria-label="Kod do wklejenia na stronę">${esc(embedSnippet(BASE_URL_FOR_PAGES))}</textarea>
<h2>Załóż darmowy kod dla swoich uczniów lub studentów</h2>
<p>Z kodem każda osoba płaci ${PARTNER_PERCENT}% mniej. Dostaniesz link, plakat A4 z kodem QR i prywatny raport wykorzystania (tylko liczby, bez danych osobowych). Bez opłat i bez zobowiązań.</p>
<form class="scan-card lead-form" id="advisorForm" novalidate>
  <div class="grid2"><label class="f">Imię i nazwisko<input type="text" name="name" maxlength="120" required autocomplete="name"></label>
  <label class="f">E-mail (służbowy)<input type="email" name="email" maxlength="160" required autocomplete="email"></label></div>
  <label class="f">Szkoła, uczelnia lub instytucja<input type="text" name="org" maxlength="160" required autocomplete="organization"></label>
  <div class="grid2"><label class="f">Rola<select name="role"><option>Doradca zawodowy</option><option>Biuro karier</option><option>Nauczyciel</option><option>Pracownik urzędu pracy / NGO</option><option>Inna</option></select></label>
  <label class="f">Liczba osób w grupie <span class="h">w przybliżeniu</span><input type="number" name="group" min="0" max="100000" inputmode="numeric"></label></div>
  <label class="hp" aria-hidden="true">Strona www<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  <label class="check"><input type="checkbox" name="terms" required><span>Akceptuję <a href="/regulamin" target="_blank" rel="noopener">regulamin</a> i <a href="/polityka-prywatnosci" target="_blank" rel="noopener">politykę prywatności</a>.</span></label>
  <button class="btn" type="submit">Załóż darmowy kod</button>
  <p class="fstatus" role="status"></p>
</form>
<p>Chcecie opłacić dokumenty uczniom w całości? <a href="/dla-instytucji/zamow">Zamów paczkę kodów</a> albo pobierz <a href="/oferta-dla-instytucji.pdf">ofertę w PDF</a>.</p></div>`;
}

export const PARTNER_TERMS_HTML = `<h1>Regulamin Programu Partnerskiego CV Pod Ogłoszenie</h1>
<p>Obowiązuje od: 20 października 2026 r. (wersja ${PARTNER_TERMS_VERSION})</p>
<h2>§1. Organizator</h2>
<ol><li>Organizatorem Programu Partnerskiego („Program”) jest Jakub Leśniak, prowadzący działalność pod marką CV Pod Ogłoszenie, Winiary 2, 66-010 Nowogród Bobrzański, NIP 9731085406 („Organizator”).</li>
<li>Kontakt: kontakt@cvpodogloszenie.pl.</li></ol>
<h2>§2. Na czym polega Program</h2>
<ol><li>Partner poleca usługi serwisu cvpodogloszenie.pl własnym kodem rabatowym i linkiem partnerskim.</li>
<li>Klient, który użyje kodu Partnera, dostaje rabat określony przy kodzie (np. 10%).</li>
<li>Partner dostaje prowizję od każdej opłaconej i niezwróconej sprzedaży z jego kodu. Prowizja to procent kwoty faktycznie zapłaconej przez klienta. Domyślnie wynosi 20%, a wysokość przypisaną do kodu Partner widzi na swojej stronie statystyk.</li></ol>
<h2>§3. Przystąpienie</h2>
<ol><li>Do Programu może przystąpić pełnoletnia osoba fizyczna, osoba prowadząca działalność gospodarczą albo organizacja.</li>
<li>Partner wypełnia formularz zgłoszeniowy i akceptuje Regulamin. Umowa zostaje zawarta, gdy Organizator zatwierdzi zgłoszenie i wyśle Partnerowi kod.</li>
<li>Organizator może odmówić przyjęcia zgłoszenia bez podania przyczyny, w szczególności gdy kanał Partnera zawiera treści bezprawne, wprowadzające w błąd lub sprzeczne z dobrymi obyczajami.</li></ol>
<h2>§4. Zasady promocji</h2>
<ol><li>Partner oznacza każdą treść z kodem lub linkiem jako reklamę lub współpracę, np. „#reklama”, „współpraca płatna z CV Pod Ogłoszenie” albo funkcją platformy „treść promowana / partnerstwo płatne”. Oznaczenie ma być widoczne od razu, bez rozwijania opisu.</li>
<li>Partner nie może:<ol type="a"><li>obiecywać klientom zatrudnienia, zaproszenia na rozmowę ani określonych efektów rekrutacji;</li><li>podawać nieprawdziwych informacji o cenie, rabacie lub działaniu usługi;</li><li>wysyłać niezamówionych informacji handlowych (spam: e-mail, SMS, wiadomości prywatne do osób, które się na to nie zgodziły);</li><li>kupować reklam na hasła zawierające nazwę „CV Pod Ogłoszenie” lub „cvpodogloszenie”;</li><li>publikować kodu w serwisach z kodami rabatowymi;</li><li>używać kodu do własnych zakupów w celu uzyskania prowizji.</li></ol></li>
<li>Partner korzysta z nazwy i grafik serwisu tylko w celu promocji w Programie.</li></ol>
<h2>§5. Prowizja i wypłata</h2>
<ol><li>Prowizję nalicza się od kwoty zapłaconej przez klienta za zamówienie z kodem Partnera.</li>
<li>Prowizja od zamówienia zwróconego (np. odstąpienie od umowy, reklamacja) jest anulowana. Jeśli została już wypłacona, Organizator potrąca ją z kolejnej wypłaty.</li>
<li>Wypłata następuje raz w miesiącu, do 15. dnia miesiąca, za poprzedni miesiąc, gdy saldo wynosi co najmniej 50 zł. Mniejsze saldo przechodzi na kolejny miesiąc.</li>
<li>Wypłata następuje przelewem na rachunek wskazany przez Partnera:<ol type="a"><li>Partner prowadzący działalność gospodarczą wystawia fakturę lub rachunek;</li><li>Partner niebędący przedsiębiorcą otrzymuje wypłatę na podstawie umowy, a Organizator dopełnia obowiązków podatkowych wynikających z przepisów.</li></ol></li>
<li>Partner widzi liczbę użyć kodu, sprzedaż, naliczoną i wypłaconą prowizję na prywatnej stronie statystyk (link wysłany e-mailem). Partner nie otrzymuje danych osobowych klientów.</li></ol>
<h2>§6. Dane osobowe</h2>
<ol><li>Administratorem danych Partnera jest Organizator. Dane (imię i nazwisko lub nazwa, e-mail, link do kanału, dane do wypłaty) są przetwarzane w celu wykonania umowy i rozliczeń (art. 6 ust. 1 lit. b i c RODO), przez czas trwania umowy i okres wymagany przepisami podatkowymi.</li>
<li>Szczegóły: <a href="/polityka-prywatnosci">Polityka prywatności</a> na cvpodogloszenie.pl/polityka-prywatnosci.</li></ol>
<h2>§7. Czas trwania i wypowiedzenie</h2>
<ol><li>Umowa jest zawarta na czas nieokreślony.</li>
<li>Każda ze stron może ją wypowiedzieć e-mailem ze skutkiem na koniec miesiąca. Organizator wypłaca należną prowizję za sprzedaż sprzed końca umowy.</li>
<li>Przy rażącym naruszeniu §4 Organizator może rozwiązać umowę ze skutkiem natychmiastowym i dezaktywować kod. Prowizja od sprzedaży uzyskanej z naruszeniem Regulaminu nie przysługuje.</li></ol>
<h2>§8. Zmiany Regulaminu</h2>
<ol><li>Organizator informuje Partnerów e-mailem o zmianie Regulaminu co najmniej 14 dni przed jej wejściem w życie. Partner, który się nie zgadza, może wypowiedzieć umowę przed tą datą.</li>
<li>W sprawach nieuregulowanych stosuje się Kodeks cywilny.</li></ol>`;

export function b2bRoutes(app, { BASE_URL, checkout = null, confirm = null, demo = false, closedFor = () => false } = {}) {
  const hits = new Map();
  const limited = (req, max, kind) => { const k = `${kind}:${req.ip}`, now = Date.now(), h = (hits.get(k) || []).filter((t) => now - t < 3600e3); if (h.length >= max) return true; hits.set(k, [...h, now]); return false; };
  const SCRIPT = '/b2b.js';

  app.get('/dla-instytucji/zamow', async (req, res) => {
    let done = '';
    const id = typeof req.query.b2b === 'string' && /^B2B-[0-9A-F]{12}$/.test(req.query.b2b) ? req.query.b2b : null;
    if (id) {
      let b = await b2bOrders.get(id);
      if (b && !b.code && b.stripe && confirm) b = (await confirm(b).catch(() => null)) || (await b2bOrders.get(id));
      if (b?.code) { const c = await codes.get(b.code); done = `<div class="msgbox ok" role="status"><b>Dziękujemy! Zamówienie przyjęte.</b> Kod dla uczestników: <b>${esc(b.code)}</b>. Wysłaliśmy go razem z fakturą na ${esc(b.email)}.${c?.report ? ` <a href="/raport/${esc(c.report)}">Raport i plakat z kodem QR</a>.` : ''}</div>`; }
      else if (b?.status === 'approval') done = `<div class="msgbox ok" role="status"><b>Dziękujemy! Zamówienie przyjęte.</b> Potwierdzimy je ręcznie, zwykle w ciągu jednego dnia roboczego. Kod i fakturę wyślemy na ${esc(b.email)}.</div>`;
      else if (b?.status === 'rejected') done = '<div class="msgbox" role="status">To zamówienie nie zostało przyjęte. Szczegóły wysłaliśmy e-mailem.</div>';
      else if (b) done = '<div class="msgbox" role="status">Płatność nie jest jeszcze potwierdzona. Jeśli ją przerwano, możesz zamówić ponownie poniżej. Gdy płatność dotrze, kod i faktura przyjdą e-mailem.</div>';
    }
    res.set('Cache-Control', 'no-store');
    page(res, BASE_URL, 'dla-instytucji/zamow', 'Paczka kodów CV dla instytucji: zamówienie online', 'Kup paczkę kodów na CV pod ogłoszenie dla studentów, uczestników i pracowników: od 10 kodów, rabat do 35%, faktura bez VAT, kod od razu na e-mail.', orderPageHtml(req.query, done), { script: SCRIPT, noindex: !!id });
  });
  app.get('/program-partnerski', (_req, res) => page(res, BASE_URL, 'program-partnerski', 'Program partnerski: prowizja za polecanie CV', `Polecaj CV pod konkretne ogłoszenie: Twoi odbiorcy płacą ${PARTNER_PERCENT}% mniej, a Ty dostajesz ${partnerCommission()}% od każdej opłaconej sprzedaży. Zgłoszenie online.`, partnerPageHtml(), { script: SCRIPT }));
  app.get('/dla-agencji', (_req, res) => page(res, BASE_URL, 'dla-agencji', 'CV pod ogłoszenie dla kandydatów agencji pracy', 'Paczki kodów na CV i list dopasowane do ogłoszenia dla kandydatów agencji pracy tymczasowej: formularz po polsku, ukraińsku, angielsku i niemiecku, faktura bez VAT.', agencyPageHtml(), { script: SCRIPT }));
  app.get('/program-partnerski/regulamin', (_req, res) => page(res, BASE_URL, 'program-partnerski/regulamin', 'Regulamin Programu Partnerskiego', 'Regulamin Programu Partnerskiego CV Pod Ogłoszenie: zasady polecania, oznaczania reklam, prowizji, wypłat i ochrony danych.', `<div class="inner narrow legal">${crumbs([['Program partnerski', '/program-partnerski'], ['Regulamin', null]])}${PARTNER_TERMS_HTML}</div>`));

  const pdfRoute = (path, file, render) => app.get(path, async (_req, res) => res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${file}"`, 'Cache-Control': 'public, max-age=3600' }).send(await render(BASE_URL)));
  pdfRoute('/dla-doradcow/wiadomosc-do-klienta.pdf', 'sprawdz-cv-przed-wyslaniem.pdf', renderAdvisorLetter);
  pdfRoute('/dla-doradcow/ulotka-a5.pdf', 'ulotka-sprawdz-cv.pdf', renderLeaflet);
  app.get('/dla-doradcow/scenariusz.pdf', async (_req, res) => res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="scenariusz-cv-pod-konkretne-ogloszenie.pdf"', 'Cache-Control': 'public, max-age=3600' }).send(await renderLesson()));
  app.get('/dla-doradcow', (_req, res) => page(res, BASE_URL, 'dla-doradcow', 'Scenariusz zajęć o CV i darmowy kod dla uczniów', 'Bezpłatny scenariusz 45-minutowych zajęć „CV pod konkretne ogłoszenie”, darmowe narzędzia i darmowy kod zniżkowy z plakatem QR dla uczniów i studentów.', advisorPageHtml(BASE_URL), { script: SCRIPT }));
  app.get('/oferta-dla-instytucji.pdf', async (_req, res) => res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="oferta-cv-pod-ogloszenie.pdf"', 'Cache-Control': 'public, max-age=3600' }).send(await renderOffer(BASE_URL)));
  // Wypis z wiadomości z ofertą (mini-CRM): e-mail trafia na listę blokad, kontakt jest usuwany.
  // GET pokazuje tylko przycisk (skanery linków w pocztach firmowych, np. Safe Links, otwierają linki automatycznie),
  // wypisuje dopiero POST: przycisk na stronie albo „One-Click” z nagłówka List-Unsubscribe-Post (RFC 8058).
  const unsubPage = (res, title, html) => { res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }); page(res, BASE_URL, 'b2b/wypisz', title, 'Wypis z wiadomości CV Pod Ogłoszenie.', `<div class="inner narrow">${html}</div>`, { noindex: true }); };
  app.get('/b2b/wypisz', (req, res) => {
    const t = /^[0-9a-f]{32}$/.test(String(req.query.t || '')) ? req.query.t : '';
    if (!t) return unsubPage(res, 'Link nieaktualny', '<h1>Link nieaktualny</h1><p class="lead">Ten link do wypisu jest niepełny. Napisz do nas na kontakt@cvpodogloszenie.pl, a usuniemy adres ręcznie.</p>');
    unsubPage(res, 'Wypisać z wiadomości?', `<h1>Wypisać z wiadomości?</h1><p class="lead">Po kliknięciu nie wyślemy na ten adres kolejnych wiadomości z ofertą, a jego dane usuniemy (zostanie sam adres na liście blokad, żebyśmy więcej nie pisali).</p><form method="post" action="/b2b/wypisz?t=${t}"><button class="btn" type="submit">Wypisz mnie</button></form>`);
  });
  app.post('/b2b/wypisz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    await unsubscribe(req.query.t).catch(() => false);
    if (req.body?.['List-Unsubscribe'] === 'One-Click') return res.sendStatus(200);
    unsubPage(res, 'Wypisano', '<h1>Wypisano</h1><p class="lead">Nie będziemy wysyłać na ten adres kolejnych wiadomości z ofertą. Przepraszamy za kłopot.</p><p><a class="btn ghost" href="/">Strona główna</a></p>');
  });
  app.get('/raport/:token', async (req, res, next) => {
    const c = await codeByReport(req.params.token); if (!c) return next();
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    page(res, BASE_URL, `raport/${c.report}`, `Raport kodu ${c.id}`, 'Prywatny raport wykorzystania kodu.', reportHtml(c, BASE_URL), { noindex: true, script: SCRIPT });
  });
  app.get('/raport/:token/plakat.pdf', async (req, res, next) => {
    const c = await codeByReport(req.params.token); if (!c) return next();
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="plakat-${c.id}.pdf"`, 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' }).send(await renderPoster(c, BASE_URL));
  });

  const api = express.Router();
  api.use(express.json({ limit: '30kb' }));
  api.get('/quote', (req, res) => { try { res.json(b2bQuote(req.query.pkg, Number(req.query.qty))); } catch (e) { res.status(400).json({ error: e.message }); } });
  api.post('/order', async (req, res) => {
    if (limited(req, 6, 'order')) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za godzinę albo napisz do nas.' });
    if (closedFor(req)) return res.status(503).json({ error: 'Zamówienia ruszą za kilka dni. Napisz do nas, przygotujemy kody ręcznie.' });
    if (req.body?.website) return res.status(400).json({ error: 'Nie udało się przyjąć zamówienia.' }); // pułapka na boty
    let b; try { b = await createB2bOrder(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
    const back = `/dla-instytucji/zamow?b2b=${b.id}`;
    if (b.status === 'approval') { await notifyApproval(b, BASE_URL); return res.json({ ok: true, redirect: back }); }
    try {
      if (b.pay === 'invoice') { await fulfillB2b(b.id, { base: BASE_URL }); return res.json({ ok: true, redirect: back }); }
      if (checkout) return res.json({ ok: true, url: await checkout(b, `${BASE_URL}${back}`) });
      if (demo) { await fulfillB2b(b.id, { paid: true, provider: 'demo', base: BASE_URL }); return res.json({ ok: true, redirect: back }); }
      return res.status(409).json({ error: 'Płatność online jest chwilowo niedostępna. Wybierz fakturę z terminem 14 dni.' });
    } catch (e) { logEvent('b2b', `Zamówienie ${b.id}: ${e.message}`); res.status(502).json({ error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie albo wybierz fakturę.' }); }
  });
  api.post('/partner', async (req, res) => {
    if (limited(req, 4, 'partner')) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za godzinę.' });
    if (req.body?.website) return res.json({ ok: true }); // pułapka na boty
    let a; try { a = await createPartnerApp(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
    if (mailEnabled()) sendOwnerMail(`Zgłoszenie do programu partnerskiego: ${a.name}`, `${a.name}, ${a.email}\n${a.platform}: ${a.channel}\nObserwujący: ${a.followers || 'nie podano'}\nOdbiorcy: ${a.audience || '-'}\n\nZatwierdź albo odrzuć jednym kliknięciem: ${BASE_URL}/admin (Partnerzy)`).catch((e) => logEvent('e-mail', `Zgłoszenie partnera: ${e.message}`));
    res.json({ ok: true });
  });
  api.post('/advisor', async (req, res) => {
    if (limited(req, 4, 'advisor')) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za godzinę.' });
    if (req.body?.website) return res.json({ ok: true });
    let a; try { a = await createAdvisorApp(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
    if (mailEnabled()) sendOwnerMail(`Doradca prosi o darmowy kod: ${a.org}`, `${a.name} (${a.role || 'rola nie podana'}), ${a.email}
${a.org}, grupa: ${a.group || 'nie podano'}

Zatwierdź jednym kliknięciem: ${BASE_URL}/admin (Partnerzy)`).catch((e) => logEvent('e-mail', `Zgłoszenie doradcy: ${e.message}`));
    res.json({ ok: true });
  });
  // Numer rachunku do wypłat: wpisuje partner na swojej stronie statystyk.
  api.post('/report/:token/bank', async (req, res) => {
    if (limited(req, 20, 'bank')) return res.status(429).json({ error: 'Zbyt wiele prób.' });
    const c = await codeByReport(req.params.token); if (!c?.commission) return res.status(404).json({ error: 'Nie ma takiego raportu.' });
    const bank = str(req.body?.bank, 120);
    if (bank && !/\d{2}[\s\d]{20,}/.test(bank.replace(/^PL/i, ''))) return res.status(400).json({ error: 'Wpisz numer rachunku (26 cyfr) i nazwę odbiorcy.' });
    await codes.update(c.id, { bank, bankAt: Date.now() });
    res.json({ ok: true });
  });
  app.use('/api/b2b', api);
}

// Panel administratora: zamówienia instytucji i zgłoszenia partnerów (wywoływane z lib/admin.js po zalogowaniu).
export function b2bAdmin(api, { BASE_URL }) {
  api.get('/b2b', async (_req, res) => {
    const all = Object.values(await b2bOrders.all()).sort((a, b) => b.created - a.created), cs = await codes.all();
    res.json(all.map((b) => ({ ...b, pkgName: PACKAGES[b.pkg]?.name || b.pkg, used: (cs[b.code]?.usedBy || []).length, report: reportUrl(BASE_URL, cs[b.code]), overdue: b.status === 'unpaid' && b.due < Date.now() })));
  });
  api.post('/b2b/:id/paid', async (req, res) => { const b = await markB2bPaid(req.params.id); res.status(b ? 200 : 404).json({ ok: !!b }); });
  api.post('/b2b/:id/deactivate', async (req, res) => { const b = await deactivateB2b(req.params.id); res.status(b ? 200 : 404).json({ ok: !!b }); });
  api.post('/b2b/:id/approve', async (req, res) => { try { const b = await approveB2b(req.params.id, { base: BASE_URL }); res.json({ ok: true, code: b.code }); } catch (e) { res.status(409).json({ error: e.message }); } });
  api.post('/b2b/:id/reject', async (req, res) => { try { await rejectB2b(req.params.id, { base: BASE_URL }); res.json({ ok: true }); } catch (e) { res.status(409).json({ error: e.message }); } });
  api.post('/b2b/:id/corrected', async (req, res) => { const b = await b2bOrders.update(req.params.id, { corrected: Date.now() }); res.status(b ? 200 : 404).json({ ok: !!b }); });
  api.get('/b2b/:id/invoice.pdf', async (req, res) => {
    const inv = await invoices.get(req.params.id); if (!inv) return res.status(404).json({ error: 'Brak faktury.' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoiceFile(inv)}"` }).send(await renderInvoice(inv));
  });
  api.get('/partners', async (_req, res) => res.json(Object.values(await partnerApps.all()).sort((a, b) => b.created - a.created)));
  api.post('/partners/:id/approve', async (req, res) => { try { res.json({ ok: true, ...(await approvePartner(req.params.id, { base: BASE_URL })) }); } catch (e) { res.status(404).json({ error: e.message }); } });
  api.post('/partners/:id/reject', async (req, res) => { try { await rejectPartner(req.params.id); res.json({ ok: true }); } catch (e) { res.status(404).json({ error: e.message }); } });
  // Mini-CRM kontaktów B2B.
  api.get('/contacts', async (_req, res) => res.json({ statuses: STATUSES, segments: Object.fromEntries(Object.entries(SEGMENTS).map(([k, v]) => [k, v.label])), blocked: Object.keys(await blocklist.all()).length, list: Object.values(await contacts.all()).sort((a, b) => (b.activity || 0) - (a.activity || 0)).map(({ token, ...c }) => c) }));
  api.get('/contacts/szablon.csv', (_req, res) => res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="kontakty-szablon.csv"' }).send(csvTemplate()));
  api.post('/contacts/import', async (req, res) => { try { res.json(await importContacts(String(req.body?.csv || ''))); } catch (e) { res.status(400).json({ error: e.message }); } });
  api.post('/contacts/letters', async (req, res) => {
    try { const r = await lettersFor(req.body?.ids, BASE_URL); res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="listy-${new Date().toISOString().slice(0, 10)}.pdf"`, 'X-Letters': String(r.count), 'X-No-Address': String(r.noAddress) }).send(r.pdf); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
  api.post('/contacts/bulk-status', async (req, res) => { try { res.json(await bulkStatus(req.body?.ids, String(req.body?.status || ''))); } catch (e) { res.status(400).json({ error: e.message }); } });
  api.post('/contacts/envelo', async (req, res) => {
    try { const r = await enveloFor(req.body?.ids, BASE_URL); res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="envelo-${r.day}.zip"`, 'X-Letters': String(r.count), 'X-No-Address': String(r.noAddress), 'X-Skipped': encodeURIComponent(JSON.stringify(r.skipped)) }).send(r.zip); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
  api.post('/contacts/:id', async (req, res) => { try { res.json({ ok: true, contact: await updateContact(req.params.id, req.body || {}) }); } catch (e) { res.status(400).json({ error: e.message }); } });
  api.post('/leads/:id/offer', async (req, res) => { try { res.json({ ok: true, lead: await sendLeadOffer(req.params.id, BASE_URL) }); } catch (e) { res.status(400).json({ error: e.message }); } });
  api.post('/contacts/:id/offer', async (req, res) => { try { await sendOffer(req.params.id, BASE_URL); res.json({ ok: true }); } catch (e) { res.status(400).json({ error: e.message }); } });
  api.delete('/contacts/:id', async (req, res) => { const ok = await contacts.remove(req.params.id); res.status(ok ? 200 : 404).json({ ok }); });
  api.post('/codes/:code/report', async (req, res) => { const c = await ensureReport(req.params.code); if (!c) return res.status(404).json({ error: 'Nie ma takiego kodu.' }); res.json({ ok: true, url: reportUrl(BASE_URL, c) }); });
}
