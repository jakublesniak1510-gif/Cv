import crypto from 'node:crypto';
import express from 'express';
import PDFDocument from 'pdfkit';
import { codes } from './store.js';
import { OUT_TIERS, OUT_MAX, OUT_PKG, OUT_ADDONS, OUT_DAYS, outQuote } from './pricing.js';
import { b2bOrders, nipValid, approvalReason, newToken } from './b2b.js';
import { issueB2bInvoice, renderInvoice, invoiceFile, sellerBank } from './invoice.js';
import { mailEnabled, sendPlainMail, sendOwnerMail } from './mail.js';
import { logEvent } from './events.js';
import { sales, dayKey } from './ops.js';
import { ssrPage, escHtml as esc } from './seo.js';

// Outplacement dla firm (D7, 27.10, /dla-firm/outplacement): firma kupuje kody dla zwalnianych pracowników. Każda osoba dostaje
// własny kod (jednorazowy, ważny 90 dni od daty przekazania): Pakiet 3 – CV pod 3 ogłoszenia z listami – oraz przygotowanie
// do rozmowy, symulator rozmowy, profil LinkedIn i wersję Word. Cena za osobę zależy od liczby osób (OUT_TIERS).
// Płatność online od razu albo faktura z terminem 14 dni (zamówienia w b2b-orders.json – panel → Firmy, faktury, zatwierdzanie).
// Firma ma prywatny panel z liczbą wykorzystanych kodów (bez danych pracowników) i PDF z instrukcją i kodami do przekazania.
// Bez coachingu na żywo: wszystko działa online, dokumenty przygotowujemy z pomocą AI.
export const OUT_NAME = 'Outplacement – pakiet dla pracownika';
export const NO_COACHING = 'To usługa online bez coachingu na żywo: nie prowadzimy spotkań ani rozmów z doradcą. Dokumenty i symulator rozmowy przygotowujemy z pomocą narzędzi AI.';
export const OUT_INCLUDES = ['CV dopasowane do 3 wybranych ogłoszeń i list motywacyjny do każdego (Pakiet 3)', 'Przygotowanie do rozmowy kwalifikacyjnej', 'Symulator rozmowy kwalifikacyjnej', 'Profil LinkedIn pod stanowisko', 'CV i listy w formacie Word (.docx)'];
const DUE_DAYS = 14;
// Faktura z terminem: kody od razu tylko dla małych zamówień (każdy kod to Pakiet 3 z dodatkami); większe czekają na zatwierdzenie w panelu.
export const outAutoMax = () => Math.max(1, parseInt(process.env.OUT_AUTO_MAX, 10) || 10);
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const zl = (gr) => `${((gr || 0) / 100).toLocaleString('pl-PL', { minimumFractionDigits: (gr || 0) % 100 ? 2 : 0, maximumFractionDigits: 2 })} zł`;
const plDate = (t) => new Date(t).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric' });
const DAY = 864e5;
const startOf = (s) => Date.parse(`${s}T00:00:00Z`);

// Zamówienie: dane firmy z NIP (faktura), liczba osób, data przekazania kodów (dziś … +60 dni), płatność.
export function validateOut(b = {}, now = Date.now()) {
  const o = { org: str(b.org, 160), nip: str(b.nip, 20).replace(/[^0-9]/g, ''), address: str(b.address, 250), name: str(b.name, 100), email: str(b.email, 160).toLowerCase(), phone: str(b.phone, 40), start: str(b.start, 10), pay: b.pay === 'invoice' ? 'invoice' : 'now' };
  if (o.org.length < 2) throw new Error('Podaj nazwę firmy.');
  if (!nipValid(o.nip)) throw new Error('Podaj poprawny NIP firmy (10 cyfr) – wystawimy fakturę.');
  if (o.address.length < 6) throw new Error('Podaj adres firmy (do faktury).');
  if (o.name.length < 3) throw new Error('Podaj imię i nazwisko osoby zamawiającej.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)) throw new Error('Podaj poprawny adres e-mail.');
  const t = /^\d{4}-\d{2}-\d{2}$/.test(o.start) ? startOf(o.start) : NaN, today = startOf(new Date(now).toISOString().slice(0, 10));
  if (!Number.isFinite(t) || t < today || t > today + 60 * DAY) throw new Error('Wybierz datę przekazania kodów pracownikom: od dziś do 60 dni naprzód.');
  if (!b.terms) throw new Error('Zaakceptuj regulamin.');
  return { ...o, ...outQuote(b.qty), startAt: t };
}
export async function createOutOrder(body, now = Date.now()) {
  const v = validateOut(body, now);
  const b = { id: `B2B-${crypto.randomBytes(6).toString('hex').toUpperCase()}`, ...v, pkgName: OUT_NAME, invoiceLine: `${OUT_NAME} (kod na 90 dni) w serwisie CV Pod Ogłoszenie`, status: 'new', created: now, terms: { at: now } };
  const why = b.pay === 'invoice' && b.qty > outAutoMax() ? `ponad ${outAutoMax()} kodów outplacementu na fakturę z terminem` : await approvalReason(b);
  if (why) Object.assign(b, { status: 'approval', approvalReason: why });
  await b2bOrders.save(b);
  return b;
}

// Kod osoby: OUT-XXXX-XXXX, jedno użycie, Pakiet 3 i dodatki w cenie (server.js: discountFor), ważny 90 dni od daty przekazania.
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const part = () => Array.from(crypto.randomBytes(4), (x) => A[x % A.length]).join('');
async function newCode() { let c; do c = `OUT-${part()}-${part()}`; while (await codes.get(c)); return c; }
export const codeUsed = (c) => !!c && ((c.usedBy || []).length > 0 || (c.reserved || []).some((r) => r.final));

const inflight = new Map();
export function fulfillOutplacement(id, opts = {}) {
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
    if (b0.code && paid && b0.status !== 'paid') return markOutPaid(id, { provider, paymentIntent, sessionId, now });
    return b0;
  }
  const expires = Math.max(b0.startAt, now) + OUT_DAYS * DAY, list = [];
  for (let i = 0; i < b0.qty; i++) {
    const code = await newCode(); list.push(code);
    await codes.save({ id: code, amount: 0, percent: 0, voucher: OUT_PKG, voucherAddons: OUT_ADDONS, commission: 0, maxUses: 1, usedBy: [], note: `${b0.org.slice(0, 80)} (outplacement)`, created: now, expires, outplacement: id });
  }
  const panel = newToken();
  const b = await b2bOrders.update(id, (x) => ({ ...x, code: `${b0.qty} × OUT`, codes: list, panel, expires, fulfilling: null, status: paid ? 'paid' : 'unpaid', paidAt: paid ? now : null, due: paid ? null : now + DUE_DAYS * DAY, payment: paid ? { provider, paymentIntent, sessionId, at: now } : null }));
  if (paid) await recordSale(b);
  const inv = await issueB2bInvoice(b, now).catch((e) => { logEvent('faktura', `Outplacement ${id}: ${e.message}`); return null; });
  if (inv) await b2bOrders.update(id, { invoiceId: inv.id, invoiceNumber: inv.number });
  await sendOutMails({ ...b, invoiceNumber: inv?.number }, inv, base).catch((e) => logEvent('e-mail', `Outplacement ${id}: ${e.message}`));
  return b2bOrders.get(id);
}
export async function markOutPaid(id, { provider = 'przelew', paymentIntent = null, sessionId = null, now = Date.now() } = {}) {
  const b = await b2bOrders.update(id, (x) => (x.status === 'paid' ? x : { ...x, status: 'paid', paidAt: now, payment: { provider, paymentIntent, sessionId, at: now } }));
  if (b) await recordSale(b);
  return b;
}
async function recordSale(b) {
  if (b.status !== 'paid') return;
  await sales.upsert(b.id, (p) => ({ id: b.id, at: b.paidAt, day: dayKey(b.paidAt), pkg: 'outplacement', total: b.total, discount: 0, ads: 0, addons: [], langs: [], code: null, followup: false, uiLang: 'pl', provider: b.payment?.provider || null, pi: b.payment?.paymentIntent || null, refunded: p?.refunded || 0, b2b: true, qty: b.qty }));
}
// Wyłączenie (nieopłacona faktura) albo zwrot: niewykorzystane kody przestają działać (przy zwrocie – tyle, ile pokrywa kwota).
export async function disableOutCodes(b, count = Infinity) {
  let n = 0;
  for (const k of b.codes || []) { if (n >= count) break; const c = await codes.get(k); if (c && !codeUsed(c) && !c.disabled) { await codes.update(k, { disabled: true }); n++; } }
  return n;
}

// Panel firmy: liczby i stan kodów, bez danych pracowników.
export async function panelData(b, now = Date.now()) {
  const list = await Promise.all((b.codes || []).map(async (k) => { const c = await codes.get(k); return { code: k, used: codeUsed(c), active: !!c && !c.disabled && now < c.expires }; }));
  const used = list.filter((x) => x.used).length;
  return { org: b.org, qty: b.qty, used, left: list.filter((x) => !x.used && x.active).length, expires: b.expires, start: b.startAt, status: b.status, codes: list };
}
export async function orderByPanel(token) {
  if (!/^[\w-]{32}$/.test(String(token || ''))) return null;
  return Object.values(await b2bOrders.all()).find((b) => b.panel && b.panel.length === token.length && crypto.timingSafeEqual(Buffer.from(b.panel), Buffer.from(token))) || null;
}

// PDF: strona dla działu HR (zasady, panel) i karty z kodami do przekazania (2 na stronę A4).
const F = new URL('../fonts/', import.meta.url).pathname;
export function renderOutPdf(b, base) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Outplacement – instrukcja i kody (${b.org})` } });
    const out = []; doc.on('data', (x) => out.push(x)); doc.on('end', () => resolve(Buffer.concat(out))); doc.on('error', reject);
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const INK = '#16233A', BRAND = '#2447D8', MUTE = '#546178', L = 50, W = 495;
    const p = (t, o = {}) => doc.fillColor(o.color || INK).font(o.bold ? 'b' : 'r').fontSize(o.size || 10.5).text(t, o.x ?? L, o.y ?? doc.y, { width: o.w || W, lineGap: 2 });
    doc.rect(0, 0, 595.28, 8).fill(BRAND);
    p('CV Pod Ogłoszenie', { bold: true, color: BRAND, size: 12, y: 34 });
    p(`Outplacement: instrukcja dla działu HR – ${b.org}`, { bold: true, size: 18, y: 56 });
    doc.moveDown(0.6);
    p(`Liczba kodów: ${b.qty} (jeden kod = jedna osoba). Kody działają od razu i są ważne do ${plDate(b.expires)} (90 dni od daty przekazania ${plDate(b.startAt)}).`);
    doc.moveDown(0.5); p('Każdy kod obejmuje:', { bold: true });
    OUT_INCLUDES.forEach((x) => p(`•  ${x}`));
    doc.moveDown(0.5); p(NO_COACHING, { bold: true });
    doc.moveDown(0.5); p('Jak przekazać kody', { bold: true, size: 13 });
    ['Wytnij kartę z kodem (kolejne strony) i przekaż ją pracownikowi albo wyślij mu kod w wiadomości.', 'Pracownik wchodzi na cvpodogloszenie.pl, wkleja ogłoszenie, uzupełnia dane i w podsumowaniu wpisuje kod – za pakiet i dodatki nie płaci.', 'Każdy kod można wykorzystać raz. Wykorzystanie sprawdzisz w panelu firmy.'].forEach((x, i) => p(`${i + 1}. ${x}`));
    doc.moveDown(0.5); p('Panel firmy (liczba wykorzystanych kodów, bez danych pracowników):', { bold: true });
    p(`${base}/dla-firm/outplacement/panel/${b.panel}`, { color: BRAND });
    doc.moveDown(0.5); p('Nie przekazujemy firmie żadnych danych pracowników ani ich dokumentów. Pracownik zamawia sam i sam decyduje, gdzie wysłać CV.', { color: MUTE, size: 9.5 });
    const card = (code, y) => {
      doc.save().dash(4, { space: 4 }).rect(L, y, W, 360).lineWidth(0.8).strokeColor('#9AA4B2').stroke().restore();
      p('CV Pod Ogłoszenie · kod od pracodawcy', { bold: true, color: BRAND, size: 11, x: L + 20, y: y + 18, w: W - 40 });
      p(code, { bold: true, size: 26, x: L + 20, y: y + 40, w: W - 40 });
      p(`Ważny do ${plDate(b.expires)}. Jednorazowy – nie przekazuj go innym osobom.`, { color: MUTE, size: 9.5, x: L + 20, y: y + 78, w: W - 40 });
      p('Co obejmuje kod:', { bold: true, x: L + 20, y: y + 100, w: W - 40 });
      OUT_INCLUDES.forEach((x) => p(`•  ${x}`, { x: L + 20, w: W - 40, size: 10 }));
      p('Jak skorzystać:', { bold: true, x: L + 20, y: doc.y + 6, w: W - 40 });
      ['Wejdź na cvpodogloszenie.pl i wklej ogłoszenie o pracę (możesz dodać do 3 ogłoszeń).', 'Uzupełnij swoje dane albo wgraj stare CV.', 'W podsumowaniu wpisz kod – pakiet i dodatki są bez opłaty.'].forEach((x, i) => p(`${i + 1}. ${x}`, { x: L + 20, w: W - 40, size: 10 }));
      p(NO_COACHING, { color: MUTE, size: 8.5, x: L + 20, y: doc.y + 6, w: W - 40 });
    };
    (b.codes || []).forEach((code, i) => { if (i % 2 === 0) doc.addPage(); card(code, i % 2 === 0 ? 40 : 430); });
    doc.end();
  });
}

async function sendOutMails(b, inv, base) {
  const panel = `${base}/dla-firm/outplacement/panel/${b.panel}`;
  const payLine = b.status === 'paid' ? `Płatność przyjęta: ${zl(b.total)}. Faktura${inv ? ` ${inv.number}` : ''} w załączniku.` : `Faktura${inv ? ` ${inv.number}` : ''} w załączniku. Termin płatności: ${plDate(b.due)}, kwota ${zl(b.total)}, przelew${sellerBank() ? ` na rachunek ${sellerBank()}` : ''}, w tytule numer faktury. Kody działają już teraz.`;
  const text = `Dzień dobry,\n\ndziękujemy za zamówienie outplacementu w CV Pod Ogłoszenie.\n\nFirma: ${b.org}\nLiczba kodów: ${b.qty} (po ${zl(b.unit)} za osobę)\nKody ważne do: ${plDate(b.expires)}\n\n${payLine}\n\nW załączniku jest PDF z instrukcją dla działu HR i kartami z kodami do przekazania pracownikom.\n\nPanel firmy (liczba wykorzystanych kodów, bez danych pracowników):\n${panel}\n\n${NO_COACHING}\n\nW razie pytań wystarczy odpowiedzieć na tę wiadomość.\n\nPozdrawiamy,\nCV Pod Ogłoszenie`;
  const attachments = [{ filename: `outplacement-kody-${b.id}.pdf`, content: await renderOutPdf(b, base), contentType: 'application/pdf' }, ...(inv ? [{ filename: invoiceFile(inv), content: await renderInvoice(inv), contentType: 'application/pdf' }] : [])];
  if (!mailEnabled()) return;
  await sendPlainMail({ to: b.email, subject: `Outplacement: ${b.qty} kodów dla ${b.org}`, text, attachments });
  await sendOwnerMail(`Nowe zamówienie outplacementu: ${b.org} (${zl(b.total)})`, `${b.org}, NIP ${b.nip}\n${b.name}, ${b.email}${b.phone ? `, ${b.phone}` : ''}\n${b.qty} osób po ${zl(b.unit)} = ${zl(b.total)}\nPłatność: ${b.status === 'paid' ? 'zapłacono online' : `faktura z terminem ${plDate(b.due)}`}\nFaktura: ${inv?.number || 'nie wystawiono (sprawdź dziennik błędów)'}\nPanel firmy: ${panel}\n\nPanel: ${base}/admin → Firmy`);
}
async function notifyApproval(b, base) {
  if (!mailEnabled()) return;
  await sendPlainMail({ to: b.email, subject: `Zamówienie outplacementu dla ${b.org}: przyjęte`, text: `Dzień dobry,\n\ndziękujemy za zamówienie ${b.qty} kodów outplacementowych z fakturą z terminem płatności. Potwierdzimy je ręcznie, zwykle w ciągu jednego dnia roboczego. Kody i fakturę dostaniesz wtedy e-mailem.\n\nPozdrawiamy,\nCV Pod Ogłoszenie` }).catch((e) => logEvent('e-mail', `Outplacement (czeka): ${e.message}`));
  await sendOwnerMail(`Outplacement czeka na zatwierdzenie: ${b.org} (${zl(b.total)})`, `${b.org}, NIP ${b.nip}\n${b.name}, ${b.email}\n${b.qty} osób = ${zl(b.total)}, faktura z terminem 14 dni\nPowód: ${b.approvalReason}\n\nZatwierdź albo odrzuć: ${base}/admin → Firmy`).catch((e) => logEvent('e-mail', `Outplacement (czeka, właściciel): ${e.message}`));
}

// ——— Strony ———
const crumbs = (last) => `<nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <a href="/dla-firm">Dla firm i uczelni</a> › <span>${esc(last)}</span></nav>`;
const tierLabel = (i) => (OUT_TIERS[i + 1] ? `${OUT_TIERS[i].min}–${OUT_TIERS[i + 1].min - 1}` : `${OUT_TIERS[i].min}+`);
function pageHtml(done, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10), max = new Date(now + 60 * DAY).toISOString().slice(0, 10);
  return `<div class="inner narrow outp">${crumbs('Outplacement')}
<h1>Outplacement dla firm: CV, rozmowa i LinkedIn dla każdego pracownika – od ${zl(OUT_TIERS.at(-1).unit)} za osobę</h1>
<p class="lead">Rozstajecie się z pracownikami i chcecie pomóc im szybko szukać nowej pracy? Każda osoba dostaje własny kod: CV i listy dopasowane do 3 ogłoszeń, przygotowanie do rozmowy, symulator rozmowy, profil LinkedIn i wersje Word. Kody ważne 90 dni.</p>
${done || ''}
<div class="perk outp-warn"><b>Bez coachingu na żywo.</b> ${esc(NO_COACHING.replace(/^To usługa online bez coachingu na żywo: n/, 'N'))}</div>
<h2>Co dostaje każdy pracownik</h2>
<ul class="tips">${OUT_INCLUDES.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Cena za osobę</h2>
<div class="table-wrap"><table class="rep outp-prices"><tr><th scope="col">Liczba osób</th>${OUT_TIERS.map((_, i) => `<th scope="col">${tierLabel(i)}</th>`).join('')}</tr><tr><th scope="row">Cena za osobę</th>${OUT_TIERS.map((t) => `<td><b>${zl(t.unit)}</b></td>`).join('')}</tr></table></div>
<p class="hint">Ceny dla firm, bez VAT (sprzedawca zwolniony podmiotowo, art. 113 ustawy o VAT). Cena za osobę zależy od liczby osób w jednym zamówieniu. Do ${OUT_MAX} osób w zamówieniu.</p>
<h2>Jak to działa</h2>
<ol class="tips"><li>Zamawiacie kody: dane firmy z NIP, liczba osób i data przekazania kodów.</li><li>Płacicie online albo przelewem po fakturze z terminem 14 dni.</li><li>Dostajecie PDF z instrukcją dla HR i kartami z kodami oraz link do panelu firmy.</li><li>Pracownicy korzystają sami, kiedy chcą; w panelu widzicie, ile kodów wykorzystano – bez danych pracowników.</li></ol>
<h2>Zamówienie</h2>
<form class="scan-card lead-form" id="outOrder" novalidate data-tiers='${JSON.stringify(OUT_TIERS)}'>
  <div class="grid2"><label class="f">Nazwa firmy<input type="text" name="org" maxlength="160" required autocomplete="organization"></label>
  <label class="f">NIP<input type="text" name="nip" maxlength="20" inputmode="numeric" required></label></div>
  <label class="f">Adres firmy (do faktury)<input type="text" name="address" maxlength="250" required autocomplete="street-address" placeholder="ulica i numer, kod pocztowy, miejscowość"></label>
  <div class="grid2"><label class="f">Imię i nazwisko<input type="text" name="name" maxlength="100" required autocomplete="name"></label>
  <label class="f">E-mail (tu wyślemy kody i fakturę)<input type="email" name="email" maxlength="160" required autocomplete="email"></label></div>
  <div class="grid2"><label class="f">Telefon <span class="h">opcjonalnie</span><input type="tel" name="phone" maxlength="40" autocomplete="tel"></label>
  <label class="f">Liczba osób<input type="number" name="qty" min="1" max="${OUT_MAX}" value="10" required inputmode="numeric"></label></div>
  <label class="f">Data przekazania kodów pracownikom (od niej liczymy 90 dni)<input type="date" name="start" min="${today}" max="${max}" value="${today}" required></label>
  <fieldset class="f pay-choice"><legend>Płatność</legend>
    <label class="check"><input type="radio" name="pay" value="now" checked><span>Zapłać teraz (karta, BLIK – płatność online)</span></label>
    <label class="check"><input type="radio" name="pay" value="invoice"><span>Faktura z terminem 14 dni (przelew), kody od razu</span></label></fieldset>
  <p class="hint">Faktura z terminem: do ${outAutoMax()} osób kody od razu, większe zamówienia potwierdzamy w ciągu 1 dnia roboczego. Przy płatności online kody od razu.</p>
  <p class="b2b-sum" id="outSum" aria-live="polite"></p>
  <label class="hp" aria-hidden="true">Strona www<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  <label class="check"><input type="checkbox" name="terms" required><span>Akceptuję <a href="/regulamin" target="_blank" rel="noopener">regulamin</a> i <a href="/polityka-prywatnosci" target="_blank" rel="noopener">politykę prywatności</a>. Rozumiem, że usługa nie obejmuje coachingu na żywo.</span></label>
  <button class="btn" type="submit">Zamawiam</button>
  <p class="fstatus" role="status"></p>
</form>
<p>Potrzebujecie innej formy współpracy? <a href="/dla-firm#zapytanie">Napiszcie do nas</a>.</p></div>`;
}
function panelHtml(d, b) {
  const row = (k, v) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`;
  return `<div class="inner narrow outp"><p class="eyebrow">Panel firmy · outplacement</p><h1>${esc(d.org)}</h1>
<p class="lead">Stan kodów aktualizuje się na bieżąco. Nie pokazujemy tu żadnych danych pracowników ani ich dokumentów.</p>
<table class="rep">${row('Kody', d.qty)}${row('Wykorzystane', `<b>${d.used}</b> z ${d.qty}`)}${row('Do wykorzystania', d.left)}${row('Ważne do', plDate(d.expires))}${row('Płatność', d.status === 'paid' ? 'opłacone' : d.status === 'unpaid' ? 'faktura z terminem' : esc(d.status))}</table>
<p><a class="btn" href="/dla-firm/outplacement/panel/${esc(b.panel)}/instrukcja.pdf">Pobierz PDF z instrukcją i kodami</a></p>
<h2>Kody</h2>
<div class="table-wrap"><table class="rep outp-codes"><tr><th scope="col">Kod</th><th scope="col">Stan</th></tr>${d.codes.map((c) => `<tr><td><code>${esc(c.code)}</code></td><td>${c.used ? 'wykorzystany' : c.active ? 'do wykorzystania' : 'nieaktywny'}</td></tr>`).join('')}</table></div>
<p class="perk">${esc(NO_COACHING)}</p>
<p class="hint">Ta strona jest prywatna: nie udostępniaj jej adresu pracownikom.</p></div>`;
}

export function outplacementRoutes(app, { BASE_URL, checkout = null, confirm = null, demo = false, closedFor = () => false, now = () => Date.now() } = {}) {
  const hits = new Map();
  const limited = (req) => { const k = req.ip, t = Date.now(), h = (hits.get(k) || []).filter((x) => t - x < 3600e3); if (h.length >= 6) return true; hits.set(k, [...h, t]); return false; };
  app.get('/dla-firm/outplacement', async (req, res) => {
    let done = '';
    const id = typeof req.query.zam === 'string' && /^B2B-[0-9A-F]{12}$/.test(req.query.zam) ? req.query.zam : null;
    if (id) {
      let b = await b2bOrders.get(id);
      if (b && b.pkg !== 'outplacement') b = null;
      if (b && !b.codes && b.stripe && confirm) b = (await confirm(b).catch(() => null)) || (await b2bOrders.get(id));
      if (b?.codes) done = `<div class="msgbox ok" role="status"><b>Dziękujemy! Zamówienie przyjęte.</b> PDF z instrukcją i ${b.qty} kodami oraz fakturę wysłaliśmy na ${esc(b.email)}. <a href="/dla-firm/outplacement/panel/${esc(b.panel)}">Panel firmy</a>.</div>`;
      else if (b?.status === 'approval') done = `<div class="msgbox ok" role="status"><b>Dziękujemy! Zamówienie przyjęte.</b> Potwierdzimy je ręcznie, zwykle w ciągu jednego dnia roboczego. Kody i fakturę wyślemy na ${esc(b.email)}.</div>`;
      else if (b) done = '<div class="msgbox" role="status">Płatność nie jest jeszcze potwierdzona. Gdy dotrze, kody i faktura przyjdą e-mailem.</div>';
    }
    res.set('Cache-Control', id ? 'no-store' : 'public, max-age=600');
    ssrPage(res, BASE_URL, 'dla-firm/outplacement', { title: 'Outplacement dla firm', seoTitle: `Outplacement dla firm – CV, rozmowa i LinkedIn dla pracowników od ${zl(OUT_TIERS.at(-1).unit)}`, metaDescription: 'Kody dla zwalnianych pracowników: CV i listy pod 3 ogłoszenia, przygotowanie do rozmowy, symulator, LinkedIn i Word. Faktura z NIP, panel bez danych pracowników.' },
      pageHtml(done, now()), { script: '/outplacement.js', noindex: !!id });
  });
  app.get('/dla-firm/outplacement/panel/:token', async (req, res, next) => {
    const b = await orderByPanel(req.params.token); if (!b) return next();
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    ssrPage(res, BASE_URL, `dla-firm/outplacement/panel/${b.panel}`, { title: `Panel firmy: ${b.org}`, metaDescription: 'Prywatny panel wykorzystania kodów outplacementowych.' }, panelHtml(await panelData(b, now()), b), { noindex: true });
  });
  app.get('/dla-firm/outplacement/panel/:token/instrukcja.pdf', async (req, res, next) => {
    const b = await orderByPanel(req.params.token); if (!b?.codes) return next();
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="outplacement-kody-${b.id}.pdf"`, 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' }).send(await renderOutPdf(b, BASE_URL));
  });
  app.get('/api/outplacement/quote', (req, res) => { try { res.json(outQuote(Number(req.query.qty))); } catch (e) { res.status(400).json({ error: e.message }); } });
  app.post('/api/outplacement/order', express.json({ limit: '30kb' }), async (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za godzinę albo napisz do nas.' });
    if (closedFor(req)) return res.status(503).json({ error: 'Zamówienia ruszą za kilka dni. Napisz do nas, przygotujemy kody ręcznie.' });
    if (req.body?.website) return res.status(400).json({ error: 'Nie udało się przyjąć zamówienia.' });
    let b; try { b = await createOutOrder(req.body, now()); } catch (e) { return res.status(400).json({ error: e.message }); }
    const back = `/dla-firm/outplacement?zam=${b.id}`;
    if (b.status === 'approval') { await notifyApproval(b, BASE_URL); return res.json({ ok: true, redirect: back }); }
    try {
      if (b.pay === 'invoice') { await fulfillOutplacement(b.id, { base: BASE_URL }); return res.json({ ok: true, redirect: back }); }
      if (checkout) return res.json({ ok: true, url: await checkout(b, `${BASE_URL}${back}`) });
      if (demo) { await fulfillOutplacement(b.id, { paid: true, provider: 'demo', base: BASE_URL }); return res.json({ ok: true, redirect: back }); }
      return res.status(409).json({ error: 'Płatność online jest chwilowo niedostępna. Wybierz fakturę z terminem 14 dni.' });
    } catch (e) { logEvent('b2b', `Outplacement ${b.id}: ${e.message}`); res.status(502).json({ error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie albo wybierz fakturę.' }); }
  });
}
