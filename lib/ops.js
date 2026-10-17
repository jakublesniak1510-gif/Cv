// Zaplecze właściciela: rejestr sprzedaży (zostaje po skasowaniu zamówień), kopia zapasowa danych,
// powiadomienia o zamówieniach, poranne podsumowanie i ustawienia tych e-maili z panelu.
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { makeStore, allOrders, getOrder, updateOrder, codes, events, reviews } from './store.js';
import { PACKAGES, ADDONS } from './pricing.js';
import { mailEnabled, sendOwnerMail } from './mail.js';

const gzip = promisify(zlib.gzip), gunzip = promisify(zlib.gunzip);
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const PAID = ['generating', 'paid', 'done'];
const zl = (gr) => `${((gr || 0) / 100).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
export const dayKey = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

// --- rejestr sprzedaży: bez danych osobowych, przez 3 lata (statystyki i rozliczenia po skasowaniu zamówień) ---
export const sales = makeStore('sales.json');
const SALES_KEEP = 3 * 365 * 864e5;
const saleOf = (o) => ({
  id: o.id, at: o.paidAt || o.created, day: dayKey(o.paidAt || o.created), pkg: o.pkg, total: o.total || 0, discount: o.discount || 0,
  ads: o.ads?.length || 0, addons: Object.keys(ADDONS).filter((k) => o.addons?.[k]), langs: o.extraLangs || [], code: o.code || null,
  followup: !!o.parentId, uiLang: o.uiLang || 'pl', provider: o.payment?.provider || null, pi: o.payment?.paymentIntent || null, refunded: o.refunded || 0,
});
export async function recordSale(o) {
  if (!o || !PAID.includes(o.status) && !o.paidAt) return;
  await sales.upsert(o.id, (prev) => ({ ...saleOf(o), refunded: Math.max(prev?.refunded || 0, o.refunded || 0) }));
}
// Uzupełnienie rejestru o opłacone zamówienia, których w nim nie ma (np. sprzed wdrożenia rejestru).
export async function syncSales() {
  const have = await sales.all();
  for (const o of Object.values(await allOrders())) if (PAID.includes(o.status) && (!have[o.id] || (o.refunded || 0) !== (have[o.id].refunded || 0))) await recordSale(o);
  await sales.deleteWhere((s) => Date.now() - s.at > SALES_KEEP);
}
export const netOf = (s) => Math.max(0, (s.total || 0) - (s.refunded || 0));

// Statystyki sprzedaży z rejestru: okres 30 dni (dziennie), 90 dni (tygodniowo) albo 12 miesięcy (miesięcznie).
export async function salesReport(range = '30', now = Date.now()) {
  const list = Object.values(await sales.all());
  const r = ['30', '90', '365'].includes(String(range)) ? String(range) : '30';
  const days = +r, from = now - days * 864e5, inRange = list.filter((s) => s.at >= from && s.at <= now);
  let buckets;
  if (r === '30') buckets = Array.from({ length: 30 }, (_, i) => { const d = dayKey(now - (29 - i) * 864e5); return { key: d, label: d, from: d, to: d }; });
  else if (r === '90') buckets = Array.from({ length: 13 }, (_, i) => { const end = now - (12 - i) * 7 * 864e5; return { key: dayKey(end), from: dayKey(end - 6 * 864e5), to: dayKey(end) }; });
  else buckets = Array.from({ length: 12 }, (_, i) => { const d = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'Europe/Warsaw' })); d.setDate(1); d.setMonth(d.getMonth() - (11 - i)); const k = d.toLocaleDateString('sv-SE').slice(0, 7); return { key: k, from: `${k}-01`, to: `${k}-31` }; });
  const series = buckets.map((b) => { const l = list.filter((s) => s.day >= b.from && s.day <= b.to); return { key: b.key, from: b.from, to: b.to, revenue: l.reduce((a, s) => a + netOf(s), 0) / 100, orders: l.length }; });
  const count = (f) => { const m = {}; for (const s of inRange) for (const k of [].concat(f(s)).filter(Boolean)) { m[k] ??= { n: 0, revenue: 0 }; m[k].n++; m[k].revenue += netOf(s) / 100; } return Object.entries(m).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.n - a.n); };
  const revenue = inRange.reduce((a, s) => a + netOf(s), 0) / 100;
  return {
    range: r, unit: r === '30' ? 'day' : r === '90' ? 'week' : 'month', series,
    total: { revenue, orders: inRange.length, avg: inRange.length ? Math.round((100 * revenue) / inRange.length) / 100 : 0, refunded: inRange.reduce((a, s) => a + (s.refunded || 0), 0) / 100 },
    pkgs: count((s) => s.pkg).map((x) => ({ ...x, name: PACKAGES[x.key]?.name || x.key })),
    addons: count((s) => s.addons).map((x) => ({ ...x, name: ADDONS[x.key] || x.key })),
    langs: count((s) => s.uiLang), codes: count((s) => s.code).slice(0, 10),
    followupShare: inRange.length ? Math.round((100 * inRange.filter((s) => s.followup).length) / inRange.length) : 0,
    since: list.length ? Math.min(...list.map((s) => s.at)) : null,
  };
}

// --- ustawienia e-maili do właściciela (panel → Ustawienia) ---
export const settings = makeStore('settings.json');
const DEFAULTS = { orderMail: true, dailyMail: true, backupMail: true, autoInvoice: true };
export const getSettings = async () => ({ ...DEFAULTS, ...((await settings.get('owner')) || {}) });
export async function saveSettings(patch) {
  const s = await getSettings();
  for (const k of Object.keys(DEFAULTS)) if (typeof patch?.[k] === 'boolean') s[k] = patch[k];
  await settings.save({ ...s, id: 'owner' });
  return s;
}
const ownerTo = () => process.env.BACKUP_EMAIL || process.env.CONTACT_EMAIL || '';

// --- kopia zapasowa: wszystkie pliki danych w jednym archiwum .json.gz ---
const SKIP = new Set(['login-tokens.json']); // jednorazowe linki logowania nie są nic warte w kopii
async function dataFiles() {
  const names = (await fs.readdir(DATA_DIR).catch(() => [])).filter((f) => f.endsWith('.json') && !SKIP.has(f));
  return Object.fromEntries(await Promise.all(names.map(async (f) => [f, JSON.parse(await fs.readFile(path.join(DATA_DIR, f), 'utf8').catch(() => '{}') || '{}')])));
}
// light: bez zdjęć klientów (największe pliki) – wersja do e-maila.
export async function makeBackup({ light = false } = {}) {
  const files = await dataFiles();
  if (light && files['orders.json']) for (const o of Object.values(files['orders.json'])) if (o?.profile?.photo) o.profile = { ...o.profile, photo: null, photoRemoved: true };
  const counts = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, Object.keys(v).length]));
  return { buf: await gzip(Buffer.from(JSON.stringify({ app: 'cvpodogloszenie', version: 1, created: Date.now(), light, files }))), counts };
}
export const backupName = (t = Date.now()) => `kopia-cv-${new Date(t).toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).replace(' ', '_').replace(/:/g, '-').slice(0, 16)}.json.gz`;

// Przywrócenie: najpierw kopia obecnego stanu do DATA_DIR/kopie/, potem podmiana plików z archiwum.
export async function restoreBackup(buf) {
  let data; try { data = JSON.parse((await gunzip(buf)).toString('utf8')); } catch { throw new Error('To nie jest plik kopii zapasowej (.json.gz) z tego panelu.'); }
  if (data?.app !== 'cvpodogloszenie' || !data.files || typeof data.files !== 'object') throw new Error('To nie jest plik kopii zapasowej z tego panelu.');
  const names = Object.keys(data.files).filter((f) => /^[a-z0-9-]+\.json$/.test(f) && !SKIP.has(f));
  if (!names.length) throw new Error('Kopia jest pusta.');
  const dir = path.join(DATA_DIR, 'kopie'); await fs.mkdir(dir, { recursive: true });
  const before = path.join(dir, 'przed-przywroceniem-' + backupName());
  await fs.writeFile(before, (await makeBackup()).buf);
  for (const f of names) { const tmp = path.join(DATA_DIR, f + '.tmp'); await fs.writeFile(tmp, JSON.stringify(data.files[f], null, 2)); await fs.rename(tmp, path.join(DATA_DIR, f)); }
  return { restored: names, created: data.created, savedBefore: path.basename(before) };
}

// --- e-maile do właściciela ---
const PKG = (k) => PACKAGES[k]?.name || k;
export async function notifyNewOrder(o, BASE_URL) {
  if (!mailEnabled() || !ownerTo() || !(await getSettings()).orderMail) return;
  const add = Object.keys(ADDONS).filter((k) => o.addons?.[k]).map((k) => ADDONS[k]);
  const lines = [
    `${PKG(o.pkg)}${o.ads?.length > 1 ? ` (${o.ads.length} ogłoszenia)` : ''}: ${zl(o.total)}${o.code ? ` z kodem ${o.code} (−${zl(o.discount)})` : ''}`,
    add.length ? `Dodatki: ${add.join(', ')}` : null, o.extraLangs?.length ? `Dodatkowe języki: ${o.extraLangs.join(', ')}` : null,
    o.invoice ? 'Klient prosi o fakturę: panel → Zamówienia → Do zafakturowania.' : null,
    o.parentId ? 'Kolejne zamówienie stałego klienta.' : null,
    '', `Szczegóły: ${BASE_URL}/admin#orders`, '', 'Te powiadomienia wyłączysz w panelu: Ustawienia.',
  ].filter((x) => x !== null);
  return sendOwnerMail(`Nowe zamówienie: ${PKG(o.pkg)}, ${zl(o.total)}`, lines.join('\n'));
}

// Raz dziennie po 7:00: podsumowanie wczorajszego dnia i (osobno ustawiana) kopia zapasowa w załączniku.
const runs = makeStore('owner-runs.json');
const warsawHour = (d) => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: 'numeric', hourCycle: 'h23' }).format(d);
// force: wysyłka od razu z panelu (przycisk „Wyślij teraz”), niezależnie od godziny i od tego, czy dziś już wyszło.
export async function ownerDaily(BASE_URL, now = new Date(), { force = false } = {}) {
  await syncSales().catch((e) => console.error('Rejestr sprzedaży', e.message));
  if (!mailEnabled() || !ownerTo() || (!force && warsawHour(now) < 7)) return null;
  const today = dayKey(now), last = await runs.get('daily');
  if (!force && last?.day === today) return null;
  if (!force) await runs.save({ id: 'daily', day: today, at: Date.now() });
  const s = force ? { dailyMail: true, backupMail: true } : await getSettings();
  if (!s.dailyMail && !s.backupMail) return null;
  const yesterday = dayKey(now.getTime() - 864e5), list = Object.values(await sales.all());
  const y = list.filter((x) => x.day === yesterday), m = list.filter((x) => x.day.slice(0, 7) === today.slice(0, 7) && x.day < today);
  const orders = Object.values(await allOrders());
  const problems = orders.filter((o) => o.status === 'paid' || o.mail?.status === 'failed').length;
  const invoices = orders.filter((o) => o.invoice && !o.invoice.issued && PAID.includes(o.status)).length;
  const errs = Object.values(await events.all()).filter((e) => now.getTime() - e.at < 864e5).length;
  const rv = Object.values(await reviews.all()).filter((r) => r.status === 'new' && r.publish && r.text).length;
  const text = [
    s.dailyMail ? [
      `Wczoraj (${yesterday}): ${y.length} zamówień, ${zl(y.reduce((a, x) => a + netOf(x), 0))}.`,
      `Ten miesiąc do wczoraj: ${m.length} zamówień, ${zl(m.reduce((a, x) => a + netOf(x), 0))}.`,
      problems ? `Do sprawdzenia: ${problems} zamówień z problemem (panel → Problemy).` : 'Brak zamówień z problemami.',
      invoices ? `Faktury do wystawienia: ${invoices}.` : null, rv ? `Opinie do zatwierdzenia: ${rv} (panel → Opinie). Na stronie głównej pokazują się od 3 zatwierdzonych.` : null, errs ? `Wpisy w dzienniku błędów z ostatniej doby: ${errs}.` : null,
    ].filter(Boolean).join('\n') : null,
    s.backupMail ? 'W załączniku kopia zapasowa wszystkich danych strony (bez zdjęć klientów). Zachowaj ją: w razie awarii wgrasz ją w panelu → Kopia zapasowa → Przywróć.' : null,
    `Panel: ${BASE_URL}/admin`, 'Te wiadomości ustawisz w panelu: Ustawienia.',
  ].filter(Boolean).join('\n\n');
  const attachments = [];
  if (s.backupMail) {
    const b = await makeBackup({ light: true });
    if (b.buf.length < 20 * 1024 * 1024) attachments.push({ filename: backupName(now.getTime()), content: b.buf, contentType: 'application/gzip' });
  }
  await sendOwnerMail(s.dailyMail ? `Podsumowanie ${yesterday}: ${y.length} zamówień, ${zl(y.reduce((a, x) => a + netOf(x), 0))}` : `Kopia zapasowa ${today}`, text, attachments);
  return { sent: true, backup: attachments.length > 0 };
}

// Zwrot zapisany w zamówieniu (jeśli jeszcze istnieje) i w rejestrze sprzedaży. total = łączna zwrócona kwota (gr).
export async function setRefunded({ orderId, paymentIntent, total, refundId, source }) {
  let o = orderId ? await getOrder(orderId) : null;
  if (!o && paymentIntent) o = Object.values(await allOrders()).find((x) => x.payment?.paymentIntent === paymentIntent) || null;
  const sale = o ? await sales.get(o.id) : Object.values(await sales.all()).find((x) => paymentIntent && x.pi === paymentIntent);
  const id = o?.id || sale?.id; if (!id) return null;
  const prev = o?.refunded ?? sale?.refunded ?? 0;
  if (total <= prev) return { id, refunded: prev, changed: false };
  if (o) await updateOrder(id, (x) => ({ ...x, refunded: total, refunds: [...(x.refunds || []), { id: refundId || null, amount: total - prev, at: Date.now(), source }].slice(-20) }));
  if (sale) await sales.update(id, { refunded: total });
  else if (o) await recordSale({ ...o, refunded: total });
  return { id, refunded: total, changed: true, delta: total - prev, code: o?.code || sale?.code || null };
}
// Prowizja partnera liczona od zwróconej części schodzi z kwoty do wypłaty (nie poniżej zera).
export async function commissionBack(code, refundGr) {
  if (!code || !(refundGr > 0)) return;
  await codes.update(code, (c) => (c.commission > 0 ? { ...c, due: Math.max(0, (c.due || 0) - Math.round((refundGr * c.commission) / 100)), revenue: Math.max(0, (c.revenue || 0) - refundGr) } : c));
}
