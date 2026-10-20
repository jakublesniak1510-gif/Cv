// Faktury bez VAT (sprzedawca zwolniony podmiotowo, art. 113 ust. 1 ustawy o VAT) wystawiane automatycznie,
// gdy klient zaznaczył fakturę. Numer: FV <kolejny>/<MM>/<RRRR>, osobna numeracja w każdym miesiącu.
// Dane faktur trzymamy 6 lat (obowiązek przechowywania dokumentów księgowych), osobno od zamówień kasowanych po 30 dniach.
import PDFDocument from 'pdfkit';
import { makeStore } from './store.js';
import { lineItems, PACKAGES, PASSES, orderPkgName } from './pricing.js';

export const invoices = makeStore('invoices.json');
const counters = makeStore('invoice-counters.json');
const KEEP = 6 * 366 * 864e5;
const F = new URL('../fonts/', import.meta.url).pathname;

// Dane sprzedawcy: z regulaminu; można nadpisać zmiennymi SELLER_NAME / SELLER_ADDRESS / SELLER_NIP.
export const seller = () => ({
  name: process.env.SELLER_NAME || 'Jakub Leśniak',
  address: process.env.SELLER_ADDRESS || 'Winiary 2, 66-010 Nowogród Bobrzański',
  nip: process.env.SELLER_NIP || '9731085406',
  brand: 'CV Pod Ogłoszenie',
});
const EXEMPT = 'Sprzedawca zwolniony podmiotowo z podatku VAT na podstawie art. 113 ust. 1 ustawy o podatku od towarów i usług.';
const warsaw = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
const plDate = (t) => new Date(t).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric' });
const money = (gr) => `${(gr / 100).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
const PAY = { stripe: 'karta / BLIK / portfel (Stripe)', przelewy24: 'Przelewy24' };

// Pozycje: cennik bez rabatu, a różnica do zapłaconej kwoty jako osobna pozycja „Rabat”. Suma zawsze = zapłacono.
export function invoiceLines(o) {
  if (o.upsell) return [{ name: `${o.upsell.name} – dodatek do zamówienia ${o.upsellOf.slice(0, 8)}`, qty: 1, price: o.total, value: o.total }];
  if (o.pass) return (o.pass.items || []).map((i) => ({ name: i.name, qty: i.quantity, price: i.amount, value: i.amount * i.quantity }));
  const items = lineItems(o.pkg, o.ads?.length || 1, o.addons || {}, !!o.parentId, o.extraLangs || [], 0)
    .map((i) => ({ name: i.name, qty: i.quantity, price: i.amount, value: i.amount * i.quantity }));
  const sum = items.reduce((a, i) => a + i.value, 0), diff = sum - (o.total || 0);
  if (diff > 0) items.push({ name: `Rabat${o.code ? ` (kod ${o.code})` : ''}`, qty: 1, price: -diff, value: -diff });
  return items;
}

// Kolejny numer w miesiącu wystawienia; wpis faktury zapisany razem z numerem (jedno zamówienie = jedna faktura).
async function issue(id, data, now) {
  const prev = await invoices.get(id);
  if (prev) return prev;
  const ym = warsaw(now).slice(0, 7), [y, m] = ym.split('-');
  const c = await counters.upsert(ym, (p) => ({ n: (p?.n || 0) + 1 }));
  const inv = { id, number: `FV ${c.n}/${m}/${y}`, issued: now, seller: seller(), ...data };
  await invoices.save(inv);
  return inv;
}
export async function issueInvoice(o, now = Date.now()) {
  if (!o?.invoice || !(o.total > 0)) return null;
  return issue(o.id, {
    sold: o.paidAt || now, buyer: { name: o.invoice.name, address: o.invoice.address, nip: o.invoice.nip || '' }, email: o.profile?.email || '',
    lines: invoiceLines(o), total: o.total, paidWith: PAY[o.payment?.provider] || 'płatność online', pkg: o.upsell ? `dodatek: ${o.upsell.name}` : orderPkgName(o),
  }, now);
}
// Faktura za paczkę kodów (zamówienie instytucji/firmy). due: termin płatności (przelew), gdy nie zapłacono od razu.
export const sellerBank = () => (process.env.SELLER_BANK || '').trim();
export async function issueB2bInvoice(b, now = Date.now()) {
  const pkg = PACKAGES[b.pkg]?.name || b.pkg;
  return issue(b.id, {
    sold: b.paidAt || now, buyer: { name: b.org, address: b.address, nip: b.nip || '' }, email: b.email,
    lines: [{ name: `Kod na usługę „${pkg}” w serwisie CV Pod Ogłoszenie – ${b.qty} szt.`, qty: b.qty, price: b.unit, value: b.unit * b.qty }],
    total: b.total, pkg: `${pkg} (paczka ${b.qty} kodów)`,
    ...(b.pay === 'invoice' ? { due: b.due, bank: sellerBank(), paidWith: 'przelew' } : { paidWith: PAY.stripe }),
  }, now);
}
// Faktura za karnet (jednorazowy, bez odnowienia) – na życzenie, z danymi podanymi przy zakupie.
export async function issuePassInvoice(p, now = Date.now()) {
  const k = PASSES[p.kind]; if (!p.invoice || !k) return null;
  return issue(p.id, {
    sold: p.paidAt || now, buyer: { name: p.invoice.name, address: p.invoice.address, nip: p.invoice.nip || '' }, email: p.email,
    lines: [{ name: `Karnet „${k.name}” w serwisie CV Pod Ogłoszenie – ${k.matches} dopasowań, ważny ${k.days} dni`, qty: 1, price: p.total, value: p.total }],
    total: p.total, paidWith: PAY[p.payment?.provider] || 'płatność online', pkg: `karnet ${k.name}`,
  }, now);
}
export const invoiceFile = (inv) => `faktura-${inv.number.replace(/[^0-9A-Za-z]+/g, '-')}.pdf`;
export const cleanupInvoices = () => invoices.deleteWhere((i) => Date.now() - i.issued > KEEP);

export function renderInvoice(inv) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Faktura ${inv.number}` } });
    const chunks = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    doc.registerFont('r', F + 'Inter-Regular.otf'); doc.registerFont('b', F + 'Inter-SemiBold.otf');
    const INK = '#16233A', MUTE = '#546178', LINE = '#D9E0EC', L = 50, R = 545;
    doc.fillColor(INK).font('b').fontSize(20).text(`Faktura ${inv.number}`, L, 50);
    doc.font('r').fontSize(10).fillColor(MUTE).text(`Data wystawienia: ${plDate(inv.issued)}    Data sprzedaży: ${plDate(inv.sold)}`, L, 80);
    const party = (title, p, x) => {
      doc.font('b').fontSize(9).fillColor(MUTE).text(title.toUpperCase(), x, 120, { width: 230 });
      doc.font('b').fontSize(11).fillColor(INK).text(p.name, x, 136, { width: 230 });
      doc.font('r').fontSize(10).text(p.address, { width: 230 });
      if (p.nip) doc.text(`NIP: ${p.nip}`, { width: 230 });
    };
    party('Sprzedawca', inv.seller, L); party('Nabywca', inv.buyer, 310);
    let y = 230;
    const cols = [[L, 'Lp.', 24, 'left'], [L + 26, 'Nazwa usługi', 280, 'left'], [L + 310, 'Ilość', 40, 'right'], [L + 355, 'Cena', 70, 'right'], [L + 425, 'Wartość', 70, 'right']];
    doc.font('b').fontSize(9).fillColor(MUTE); cols.forEach(([x, t, w, a]) => doc.text(t, x, y, { width: w, align: a }));
    y += 16; doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).stroke(); y += 6;
    doc.font('r').fontSize(10).fillColor(INK);
    inv.lines.forEach((l, i) => {
      const h = doc.heightOfString(l.name, { width: 280 });
      [[String(i + 1)], [l.name], [`${l.qty} szt.`], [money(l.price)], [money(l.value)]].forEach(([t], k) => doc.text(t, cols[k][0], y, { width: cols[k][2], align: cols[k][3] }));
      y += Math.max(h, 12) + 6; doc.moveTo(L, y - 3).lineTo(R, y - 3).strokeColor(LINE).stroke();
    });
    y += 6; doc.font('b').fontSize(12).text(`Razem do zapłaty: ${money(inv.total)}`, L, y, { width: R - L, align: 'right' });
    y += 20; doc.font('r').fontSize(10).fillColor(MUTE);
    if (inv.due) {
      doc.text(`Sposób zapłaty: przelew. Termin płatności: ${plDate(inv.due)}.`, L, y, { width: R - L, align: 'right' });
      y += 14; doc.text(inv.bank ? `Numer rachunku: ${inv.bank}. Tytuł przelewu: ${inv.number}.` : `Tytuł przelewu: ${inv.number}. Numer rachunku podamy w wiadomości e-mail.`, L, y, { width: R - L, align: 'right' });
    } else doc.text(`Zapłacono: ${money(inv.total)}, ${inv.paidWith}, ${plDate(inv.sold)}.`, L, y, { width: R - L, align: 'right' });
    y += 34; doc.fillColor(INK).fontSize(10).text(EXEMPT, L, y, { width: R - L });
    doc.moveDown(0.6).fillColor(MUTE).fontSize(9).text(`Usługa: ${inv.pkg}, serwis ${inv.seller.brand}. Faktura wystawiona elektronicznie, bez podpisu.`, { width: R - L });
    doc.end();
  });
}
