import crypto from 'node:crypto';
import express from 'express';
import { verifyTotp } from './totp.js';
import { logEvent } from './events.js';
import { allOrders, getOrder, updateOrder, removeOrder, codes, events, usage, reviews, stats, leads } from './store.js';
import { usageCost, aiEnabled } from './ai.js';
import { PACKAGES, LANGS, orderPkgName } from './pricing.js';
import { accountCount } from './account.js';
import { analyticsDays } from './analytics.js';
import { messages, subscribers, sendNewsletter, newsletterBusy } from './leads.js';
import { mailEnabled, sendNewsletterIssue } from './mail.js';
import { stripeEnabled, stripeRefund } from './stripe.js';
import { p24Enabled, p24Refund, p24Refunds, p24Sandbox } from './p24.js';
import { invoices, renderInvoice, invoiceFile } from './invoice.js';
import { b2bAdmin, reportUrl } from './b2b.js';
import { seoAdmin } from './seo-report.js';
import { statsAdmin } from './stats-agg.js';
import { passAdmin } from './passes.js';
import { makePreview, previewModel } from './preview.js';
import { qaWeeks, QA_LABELS } from './qa.js';
import { outcomes, outcomeStats, outcomesMin, publicOutcome, outcomeSentence } from './outcomes.js';
import { makeBackup, backupName, restoreBackup, getSettings, saveSettings, salesReport, setRefunded, commissionBack, syncSales, ownerDaily } from './ops.js';

// Przelewy24 pobiera zwroty z salda wpłat przed wypłatą; przy pustym saldzie odpowiada 409 „Insufficient funds available”.
export const P24_NO_FUNDS = 'Zwrot się nie udał: Przelewy24 odrzuciło zwrot – brak środków na saldzie P24 (zwroty są pobierane z wpłat przed wypłatą). Zrób zwrot w panelu P24 (Transakcje → Zwrot) albo przelewem, a potem w panelu kliknij „Oznacz jako zwrócone”.';
// Panel administratora: /admin (strona) + /api/admin/* (dane). Działa tylko, gdy ustawiono ADMIN_PASSWORD.
const SESSION_MS = 12 * 3600 * 1000;
const SECRET = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex'); // bez zmiennej sesje wygasają po restarcie
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const PAID = ['generating', 'paid', 'done'];

function readCookie(req, name) {
  const m = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}
const PREVIEW_SAMPLE = { profile: { headline: '', summary: '', skills: 'obsługa kasy fiskalnej, terminal płatniczy, wykładanie towaru', languages: 'angielski B1', certificates: '', interests: '', notes: '', experience: [{ title: 'Kasjer-sprzedawca', company: 'Sklep spożywczy', period: '2021 – obecnie', desc: 'Obsługa kasy i terminala, przyjmowanie dostaw, dbanie o ekspozycję.' }], education: [{ school: 'Technikum handlowe', degree: 'Technik handlowiec', period: '2017 – 2021' }] }, ad: { title: 'Kasjer', text: 'Zatrudnimy kasjera-sprzedawcę. Wymagania: obsługa kasy fiskalnej i terminala płatniczego, praca zmianowa, komunikatywność, dokładność. Oferujemy umowę o pracę.', lang: 'auto' } };

export function isAdmin(req) {
  const [payload, sig] = readCookie(req, 'cvpo_admin').split('.');
  if (!payload || !sig || sign(payload).length !== sig.length || !crypto.timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(sig))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}

const zl = (gr) => (gr || 0) / 100;
const dayKey = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }); // RRRR-MM-DD w czasie polskim
const paidAt = (o) => o.paidAt || o.created;
const net = (o) => Math.max(0, (o.total || 0) - (o.refunded || 0));
// Zwrot z panelu: Stripe (paymentIntent) albo Przelewy24 (numer transakcji P24), gdy dana bramka jest skonfigurowana.
const canRefund = (o) => (o.payment?.provider === 'stripe' && !!o.payment?.paymentIntent && stripeEnabled()) || (o.payment?.provider === 'przelewy24' && !!o.payment?.orderId && p24Enabled());
const row = (o) => ({
  id: o.id, created: o.created, paidAt: o.paidAt || null, email: o.profile?.email || '', pkg: o.pkg, pkgName: o.upsell ? `Dodatek: ${o.upsell.name}` : orderPkgName(o), prof: (o.ads || []).some((a) => a.kind === 'profession'),
  total: zl(o.total), status: o.status, revisions: o.revisions || 0, mail: o.mail?.status || null,
  ads: o.ads?.length || 0, code: o.code || null, followup: !!o.parentId,
  invoice: o.invoice ? (o.invoice.issued ? 'issued' : 'todo') : null,
});

async function reviewStats() {
  const all = Object.values(await reviews.all()).filter((r) => r.status !== 'spam');
  return { count: all.length, avg: all.length ? Math.round((10 * all.reduce((s, r) => s + r.rating, 0)) / all.length) / 10 : null, waiting: all.filter((r) => r.status === 'new' && r.publish).length };
}

export function adminRoutes(app, { DEMO, BASE_URL, markPaidAndGenerate, trySend, retentionMs, autoInvoice }) {
  const enabled = !!process.env.ADMIN_PASSWORD;
  const totpSecret = process.env.ADMIN_TOTP_SECRET || '';
  const api = express.Router();
  const tries = new Map();

  app.get('/admin', (req, res, next) => (enabled ? res.sendFile('admin.html', { root: 'public' }) : next()));

  api.use((req, res, next) => {
    if (!enabled) return res.status(404).json({ error: 'Panel jest wyłączony. Ustaw ADMIN_PASSWORD.' });
    res.set('Cache-Control', 'no-store');
    // Ochrona przed CSRF: zmiany wymagają nagłówka, którego zwykły formularz z innej strony nie wyśle.
    if (req.method !== 'GET' && req.get('X-Admin') !== '1') return res.status(403).json({ error: 'Brak nagłówka X-Admin.' });
    next();
  });

  api.post('/login', (req, res) => {
    const now = Date.now(), h = (tries.get(req.ip) || []).filter((t) => now - t < 15 * 60_000);
    if (h.length >= 5) return res.status(429).json({ error: 'Za dużo prób logowania. Spróbuj za 15 minut.' });
    const okPass = crypto.timingSafeEqual(sha(req.body?.password || ''), sha(process.env.ADMIN_PASSWORD));
    const okCode = !totpSecret || verifyTotp(totpSecret, req.body?.code || '');
    if (!okPass || !okCode) { tries.set(req.ip, [...h, now]); return res.status(401).json({ error: totpSecret ? 'Nieprawidłowe hasło lub kod z aplikacji.' : 'Nieprawidłowe hasło.' }); }
    tries.delete(req.ip);
    const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_MS })).toString('base64url');
    res.cookie('cvpo_admin', `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: 'strict', secure: BASE_URL.startsWith('https'), maxAge: SESSION_MS, path: '/' });
    res.json({ ok: true });
  });
  api.get('/me', (req, res) => res.json({ loggedIn: isAdmin(req), totp: !!totpSecret, demo: DEMO, p24Sandbox: isAdmin(req) && p24Enabled() && p24Sandbox() }));

  // Wszystko poniżej wymaga zalogowania.
  api.use((req, res, next) => (isAdmin(req) ? next() : res.status(401).json({ error: 'Zaloguj się.' })));
  api.post('/logout', (req, res) => { res.clearCookie('cvpo_admin', { path: '/' }); res.json({ ok: true }); });

  api.get('/stats', async (_req, res) => {
    const orders = Object.values(await allOrders()), now = Date.now();
    const paid = orders.filter((o) => PAID.includes(o.status));
    const since = (days) => paid.filter((o) => now - paidAt(o) < days * 864e5);
    const today = paid.filter((o) => dayKey(paidAt(o)) === dayKey(now));
    const sum = (list) => zl(list.reduce((s, o) => s + net(o), 0));
    const byDay = Array.from({ length: 30 }, (_, i) => { const d = dayKey(now - (29 - i) * 864e5); const l = paid.filter((o) => dayKey(paidAt(o)) === d); return { day: d, revenue: sum(l), orders: l.length }; });
    const m30 = since(30);
    const month = new Date().toISOString().slice(0, 7), u = (await usage.get(month)) || {};
    res.json({
      today: { revenue: sum(today), orders: today.length },
      d7: { revenue: sum(since(7)), orders: since(7).length },
      d30: { revenue: sum(m30), orders: m30.length, avg: m30.length ? Math.round(sum(m30) / m30.length) : 0 },
      byDay,
      byPkg: Object.fromEntries(Object.keys(PACKAGES).map((k) => [k, m30.filter((o) => o.pkg === k).length])),
      addonsShare: m30.length ? Math.round((100 * m30.filter((o) => Object.values(o.addons || {}).some(Boolean) || o.extraLangs?.length).length) / m30.length) : 0,
      codesShare: m30.length ? Math.round((100 * m30.filter((o) => o.code).length) / m30.length) : 0,
      pending: orders.filter((o) => o.status === 'pending').length,
      problems: orders.filter((o) => o.status === 'paid' || o.mail?.status === 'failed').length,
      invoicesTodo: orders.filter((o) => o.invoice && !o.invoice.issued && PAID.includes(o.status)).length,
      reviews: await reviewStats(),
      newMessages: Object.values(await messages.all()).filter((m) => m.status === 'new').length,
      totals: (await stats.get('totals')) || { cvs: 0, orders: 0 },
      accounts: await accountCount(),
      ai: { month, calls: u.calls || 0, usd: Math.round(usageCost(u) * 100) / 100 },
      retentionDays: Math.round(retentionMs / 864e5),
    });
  });

  // Ruch na stronie: dzienne odwiedziny, źródła, strony i lejek kreatora (bez danych osobowych).
  api.get('/traffic', async (req, res) => {
    const n = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30)), all = await analyticsDays(), now = Date.now();
    const list = Array.from({ length: n }, (_, i) => { const d = dayKey(now - (n - 1 - i) * 864e5); return { day: d, ...(all[d] || {}) }; });
    const sum = (k) => list.reduce((s, x) => s + (x[k] || 0), 0);
    const merge = (k) => Object.entries(list.reduce((o, x) => { for (const [a, b] of Object.entries(x[k] || {})) o[a] = (o[a] || 0) + b; return o; }, {})).sort((a, b) => b[1] - a[1]);
    const paid = Object.values(await allOrders()).filter((o) => PAID.includes(o.status) && now - paidAt(o) < n * 864e5).length;
    res.json({
      days: n, visitors: sum('visitors'), views: sum('views'), paid, conversion: sum('visitors') ? Math.round((1000 * paid) / sum('visitors')) / 10 : 0,
      byDay: list.map((x) => ({ day: x.day, visitors: x.visitors || 0, views: x.views || 0 })),
      refs: merge('refs').slice(0, 12), pages: merge('pages').slice(0, 12), devices: merge('devices'),
    });
  });

  api.get('/orders', async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase(), st = String(req.query.status || '');
    let list = Object.values(await allOrders()).sort((a, b) => b.created - a.created).map(row);
    if (st === 'invoice') list = list.filter((o) => o.invoice === 'todo' && PAID.includes(o.status));
    else if (st) list = list.filter((o) => o.status === st || (st === 'problem' && (o.status === 'paid' || o.mail === 'failed')));
    if (q) list = list.filter((o) => o.email.toLowerCase().includes(q) || o.id.startsWith(q) || (o.code || '').toLowerCase().includes(q));
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    res.json({ total: list.length, page, rows: list.slice(page * 50, page * 50 + 50) });
  });

  const load = async (req, res) => { const o = await getOrder(req.params.id); if (!o) res.status(404).json({ error: 'Nie ma takiego zamówienia.' }); return o; };

  api.get('/orders/:id', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    res.json({
      ...row(o), name: o.profile.name, phone: o.profile.phone, hasPhoto: !!o.profile.photo, design: o.design,
      addons: o.addons || {}, extraLangs: (o.extraLangs || []).map((l) => LANGS[l]), discount: zl(o.discount), parentId: o.parentId || null,
      adsList: o.ads.map((a) => ({ title: a.title, lang: a.lang, chars: a.text.length })),
      results: (o.results || []).map((r) => ({ position: r.position, lang: r.lang, score: r.match?.score ?? null, variants: Object.keys(r.variants || {}) })),
      mailInfo: o.mail || null, error: o.error || null, invoiceData: o.invoice || null, reminder: o.reminder || null, myCode: o.myCode || null,
      expires: o.created + retentionMs, link: `${BASE_URL}/?id=${o.id}`,
      provider: o.payment?.provider || null, refunded: zl(o.refunded), refunds: (o.refunds || []).map((r) => ({ amount: zl(r.amount), at: r.at, source: r.source })),
      refundable: canRefund(o) ? zl((o.total || 0) - (o.refunded || 0)) : 0,
      manualLeft: o.payment?.provider === 'przelewy24' ? zl(Math.max(0, (o.total || 0) - (o.refunded || 0))) : 0,
    });
  });

  // Faktura PDF: wystawienie teraz (gdy automatyczne są wyłączone albo klient poprosił później), pobranie i lista.
  api.post('/orders/:id/invoice/issue', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    if (!o.invoice) return res.status(409).json({ error: 'Klient nie prosił o fakturę.' });
    if (!PAID.includes(o.status)) return res.status(409).json({ error: 'Zamówienie nie jest opłacone.' });
    try { const inv = await autoInvoice(o, { force: true }); if (!inv) throw new Error('Nie da się wystawić faktury dla zamówienia za 0 zł.'); res.json({ ok: true, number: inv.number }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
  api.get('/invoices/:id.pdf', async (req, res) => {
    const inv = await invoices.get(req.params.id); if (!inv) return res.status(404).json({ error: 'Nie ma takiej faktury.' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoiceFile(inv)}"` }).send(await renderInvoice(inv));
  });
  const invList = async (q) => {
    const from = Date.parse(q.from || '') || 0, to = (Date.parse(q.to || '') || Date.now()) + 864e5;
    return Object.values(await invoices.all()).filter((i) => i.issued >= from && i.issued < to).sort((a, b) => a.issued - b.issued);
  };
  api.get('/invoices', async (req, res) => res.json((await invList(req.query)).map((i) => ({ id: i.id, number: i.number, issued: i.issued, buyer: i.buyer.name, nip: i.buyer.nip, total: zl(i.total) }))));
  api.get('/invoices.csv', async (req, res) => {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['numer', 'data_wystawienia', 'data_sprzedazy', 'nabywca', 'nip', 'adres', 'kwota_zl', 'zamowienie'].join(';'),
      ...(await invList(req.query)).map((i) => [i.number, new Date(i.issued).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }), new Date(i.sold).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }), i.buyer.name, i.buyer.nip, i.buyer.address, zl(i.total).toFixed(2).replace('.', ','), i.id].map(q).join(';'))];
    res.type('text/csv').set('Content-Disposition', `attachment; filename="faktury-${new Date().toISOString().slice(0, 10)}.csv"`).send('\uFEFF' + lines.join('\r\n'));
  });

  // Zwrot pieniędzy przez Stripe albo Przelewy24 (całość albo część), z panelu.
  api.post('/orders/:id/refund', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    if (o.payment?.provider === 'przelewy24') return refundP24(o, req, res);
    if (o.payment?.provider !== 'stripe' || !o.payment?.paymentIntent) return res.status(409).json({ error: 'To zamówienie nie ma płatności Stripe, więc nie ma czego zwracać.' });
    if (!stripeEnabled()) return res.status(409).json({ error: 'Brak klucza Stripe (STRIPE_SECRET_KEY).' });
    const left = (o.total || 0) - (o.refunded || 0), amount = req.body?.amount == null || req.body.amount === '' ? left : Math.round(Number(String(req.body.amount).replace(',', '.')) * 100);
    if (!(left > 0)) return res.status(409).json({ error: 'To zamówienie jest już w całości zwrócone.' });
    if (!(amount >= 100) || amount > left) return res.status(400).json({ error: `Kwota zwrotu: od 1 zł do ${zl(left).toFixed(2).replace('.', ',')} zł.` });
    try {
      const r = await stripeRefund({ paymentIntent: o.payment.paymentIntent, amount, orderId: o.id, already: o.refunded || 0 });
      if (r.status === 'failed' || r.status === 'canceled') throw new Error(`Stripe odrzucił zwrot (${r.status}).`);
      const s = await setRefunded({ orderId: o.id, total: (o.refunded || 0) + amount, refundId: r.id, source: 'panel' });
      if (s?.changed) await commissionBack(o.code, s.delta, s);
      logEvent('zwrot', `Zwrot ${zl(amount).toFixed(2).replace('.', ',')} zł z panelu (Stripe: ${r.status})`, { orderId: o.id });
      res.json({ ok: true, amount: zl(amount), status: r.status });
    } catch (e) { res.status(502).json({ error: `Zwrot się nie udał: ${e.message}` }); }
  });

  // Zwrot zrobiony poza panelem (w panelu Przelewy24 albo przelewem): tylko zapis w zamówieniu, bez wywołania P24.
  api.post('/orders/:id/refund-manual', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    if (o.payment?.provider !== 'przelewy24') return res.status(409).json({ error: 'Ręczne oznaczenie zwrotu dotyczy zamówień opłaconych przez Przelewy24.' });
    const left = (o.total || 0) - (o.refunded || 0), amount = req.body?.amount == null || req.body.amount === '' ? left : Math.round(Number(String(req.body.amount).replace(',', '.')) * 100);
    if (!(left > 0)) return res.status(409).json({ error: 'To zamówienie jest już w całości zwrócone.' });
    if (!(amount >= 100) || amount > left) return res.status(400).json({ error: `Kwota: od 1 zł do ${zl(left).toFixed(2).replace('.', ',')} zł.` });
    const s = await setRefunded({ orderId: o.id, total: (o.refunded || 0) + amount, refundId: null, source: 'manual' });
    if (s?.changed) await commissionBack(o.code, s.delta, s);
    await updateOrder(o.id, (x) => ({ ...x, refundAttempt: null }));
    logEvent('zwrot', `Zwrot ${zl(amount).toFixed(2).replace('.', ',')} zł oznaczony ręcznie (zrobiony poza panelem)`, { orderId: o.id });
    res.json({ ok: true, amount: zl(amount) });
  });

  async function refundP24(o, req, res) {
    if (!p24Enabled()) return res.status(409).json({ error: 'Brak konfiguracji Przelewy24 (P24_MERCHANT_ID, P24_API_KEY, P24_CRC).' });
    if (!o.payment?.orderId || !o.payment?.sessionId) return res.status(409).json({ error: 'Brak numeru transakcji Przelewy24 przy tym zamówieniu – zwrot zrób w panelu P24.' });
    const left = (o.total || 0) - (o.refunded || 0), amount = req.body?.amount == null || req.body.amount === '' ? left : Math.round(Number(String(req.body.amount).replace(',', '.')) * 100);
    if (!(left > 0)) return res.status(409).json({ error: 'To zamówienie jest już w całości zwrócone.' });
    if (!(amount >= 100) || amount > left) return res.status(400).json({ error: `Kwota zwrotu: od 1 zł do ${zl(left).toFixed(2).replace('.', ',')} zł.` });
    const done = async (id, note) => {
      const s = await setRefunded({ orderId: o.id, total: (o.refunded || 0) + amount, refundId: id, source: 'panel-p24' });
      if (s?.changed) await commissionBack(o.code, s.delta, s);
      await updateOrder(o.id, (x) => ({ ...x, refundAttempt: null }));
      logEvent('zwrot', `Zwrot ${zl(amount).toFixed(2).replace('.', ',')} zł z panelu (Przelewy24: ${note})`, { orderId: o.id });
      res.json({ ok: true, amount: zl(amount), status: 'requested' });
    };
    try {
      // Poprzednia próba sprzed < 10 min bez rozstrzygnięcia (np. przekroczony czas odpowiedzi): najpierw lista zwrotów w P24,
      // żeby nie zlecić tego samego zwrotu drugi raz.
      const a = o.refundAttempt;
      if (a && Date.now() - a.at < 10 * 60_000 && a.amount === amount) {
        const hit = (await p24Refunds(o.payment.orderId)).find((r) => Number(r.amount) === amount && Number(r.status) !== 4);
        if (hit) return await done(a.uuid, 'zlecony przy poprzedniej próbie, potwierdzony na liście zwrotów');
      }
      const uuid = crypto.randomUUID().replace(/-/g, '');
      await updateOrder(o.id, (x) => ({ ...x, refundAttempt: { uuid, amount, at: Date.now() } }));
      const r = await p24Refund({ orderId: o.id, sessionId: o.payment.sessionId, p24OrderId: o.payment.orderId, amount, uuid });
      await done(r.id, 'zlecony');
    } catch (e) {
      // Odpowiedź P24 z błędem rozstrzyga próbę; brak odpowiedzi (czas, sieć) zostawia ją do sprawdzenia przy ponownym kliknięciu.
      if (e.status || /odrzuciło zwrot/.test(e.message)) await updateOrder(o.id, (x) => ({ ...x, refundAttempt: null })).catch(() => {});
      logEvent('zwrot', `Zwrot nieudany (Przelewy24): ${e.message}`, { orderId: o.id });
      res.status(502).json({ error: e.status === 409 && /insufficient funds/i.test(e.message) ? P24_NO_FUNDS : `Zwrot się nie udał: ${e.message}` });
    }
  }

  // Kopia zapasowa: pobranie wszystkich danych (ze zdjęciami) i przywrócenie z pliku.
  api.get('/backup', async (_req, res) => {
    const b = await makeBackup();
    res.set({ 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="${backupName()}"` }).send(b.buf);
  });
  api.post('/restore', express.raw({ type: '*/*', limit: '300mb' }), async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Wybierz plik kopii (.json.gz).' });
    try { res.json({ ok: true, ...(await restoreBackup(req.body)) }); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  api.get('/settings', async (_req, res) => res.json({ ...(await getSettings()), mail: mailEnabled(), to: process.env.BACKUP_EMAIL || process.env.CONTACT_EMAIL || '' }));
  api.post('/settings', async (req, res) => res.json(await saveSettings(req.body || {})));
  // Wysyłka porannego e-maila teraz (do sprawdzenia, czy kopia dochodzi).
  api.post('/settings/test-daily', async (_req, res) => {
    if (!mailEnabled() || !(process.env.BACKUP_EMAIL || process.env.CONTACT_EMAIL)) return res.status(400).json({ error: 'Ustaw pocztę (SMTP_USER/SMTP_PASS) i CONTACT_EMAIL.' });
    try { const r = await ownerDaily(BASE_URL, new Date(), { force: true }); res.json({ ok: true, ...r }); } catch (e) { res.status(502).json({ error: e.message }); }
  });

  // Test podglądu przed płatnością na fikcyjnych danych (bez danych klientów): czy model odpowiada i zwraca poprawny wynik.
  api.post('/preview-test', async (_req, res) => {
    if (!aiEnabled()) return res.status(400).json({ error: 'AI wyłączone: brak ANTHROPIC_API_KEY w Render.' });
    const t = Date.now();
    try { const r = await makePreview(PREVIEW_SAMPLE.profile, PREVIEW_SAMPLE.ad); res.json({ ok: true, model: previewModel(), ms: Date.now() - t, ...r }); }
    catch (e) { logEvent('podgląd', `Test podglądu: ${e.message}`); res.status(502).json({ error: e.message, model: previewModel() }); }
  });

  // Sprzedaż z rejestru (zostaje po skasowaniu zamówień): 30 dni, 90 dni albo 12 miesięcy.
  api.get('/sales', async (req, res) => { await syncSales().catch(() => {}); res.json(await salesReport(req.query.range)); });

  // Faktura bez VAT na życzenie klienta: wystawiasz ją w programie do faktur, tu tylko odhaczasz (z numerem).
  api.post('/orders/:id/invoice', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    if (!o.invoice) return res.status(409).json({ error: 'Klient nie prosił o fakturę.' });
    const issued = !!req.body?.issued, number = String(req.body?.number || '').trim().slice(0, 60);
    await updateOrder(o.id, (x) => ({ ...x, invoice: { ...x.invoice, issued, number: issued ? number : '', issuedAt: issued ? Date.now() : null } }));
    res.json({ ok: true });
  });

  api.post('/orders/:id/resend', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    if (o.status !== 'done') return res.status(409).json({ error: 'Dokumenty nie są jeszcze gotowe.' });
    const mail = await trySend(o); await updateOrder(o.id, { mail });
    res.json({ ok: mail.status === 'sent', mail });
  });

  api.post('/orders/:id/regenerate', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    if (!['paid', 'done'].includes(o.status)) return res.status(409).json({ error: 'Można wygenerować ponownie tylko opłacone zamówienie.' });
    await updateOrder(o.id, { status: 'pending', error: null });
    markPaidAndGenerate(o.id).catch(console.error);
    res.json({ ok: true });
  });

  // Wyniki klientów (ankieta po 14 dniach): tylko liczby zbiorcze; na stronie od OUTCOMES_MIN odpowiedzi osób, które wysłały CV.
  api.get('/outcomes', async (_req, res) => {
    const s = outcomeStats(Object.values(await outcomes.all())), pub = await publicOutcome();
    res.json({ ...s, min: outcomesMin(), published: pub ? outcomeSentence(pub) : null, consents: Object.values(await allOrders()).filter((o) => o.outcomeAsk?.consent && !o.outcomeAsk.sent).length });
  });

  // Opinie: moderacja treści przed publikacją (średnia ocen liczy wszystkie oprócz spamu).
  api.get('/reviews', async (_req, res) => {
    res.json(Object.entries(await reviews.all()).map(([id, r]) => ({ id, ...r, pkgName: PACKAGES[r.pkg]?.name || r.pkg })).sort((a, b) => b.created - a.created));
  });
  api.post('/reviews/:id', async (req, res) => {
    const status = ['approved', 'hidden', 'spam', 'new'].includes(req.body?.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: 'Nieznany status.' });
    const r = await reviews.update(req.params.id, { status });
    res.status(r ? 200 : 404).json({ ok: !!r });
  });
  api.delete('/reviews/:id', async (req, res) => { const ok = await reviews.remove(req.params.id); res.status(ok ? 200 : 404).json({ ok }); });

  // Usunięcie danych na żądanie klienta (RODO), zanim minie 30 dni.
  api.delete('/orders/:id', async (req, res) => {
    const o = await load(req, res); if (!o) return;
    await removeOrder(o.id);
    res.json({ ok: true });
  });

  api.get('/codes', async (_req, res) => {
    const list = Object.values(await codes.all()).sort((a, b) => b.created - a.created).map((c) => ({
      code: c.id, kind: c.ownerOrderId ? 'klient' : c.voucher ? 'instytucja' : c.commission ? 'partner' : 'akcja', voucher: c.voucher || null, amount: c.percent || c.voucher ? null : zl(c.amount), percent: c.percent || null,
      uses: (c.usedBy || []).length, maxUses: c.maxUses || null, created: c.created, expires: c.expires, note: c.note || '',
      referrals: c.referrals || 0, credit: zl(c.credit || 0), earned: zl(c.earned || 0), invoice: c.invoice || null,
      commission: c.commission || 0, sales: c.sales || 0, revenue: zl(c.revenue), due: zl(c.due), paidOut: zl(c.paidOut),
      report: reportUrl(BASE_URL, c), bank: c.bank || '', disabled: !!c.disabled, b2b: !!c.b2bOrder,
    }));
    res.json(list);
  });
  api.post('/codes', async (req, res) => {
    const code = String(req.body?.code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
    const amount = Math.round(Number(req.body?.amount || 0) * 100), percent = Math.round(Number(req.body?.percent || 0));
    const days = Math.min(365, Math.max(1, parseInt(req.body?.days, 10) || 30)), maxUses = Math.max(0, parseInt(req.body?.maxUses, 10) || 0);
    if (code.length < 3) return res.status(400).json({ error: 'Kod musi mieć co najmniej 3 znaki (litery, cyfry, myślnik).' });
    const voucher = ['cv', 'cv_letter', 'pack3'].includes(req.body?.voucher) ? req.body.voucher : null;
    if (voucher && !maxUses) return res.status(400).json({ error: 'Przy kodzie dla instytucji podaj limit użyć (liczbę osób).' });
    if (!voucher && !!amount === !!percent) return res.status(400).json({ error: 'Podaj rabat kwotowy albo procentowy (jedno z dwóch).' });
    if (percent && (percent < 1 || percent > 90)) return res.status(400).json({ error: 'Rabat procentowy: od 1 do 90%.' });
    if (amount && (amount < 100 || amount > 7000)) return res.status(400).json({ error: 'Rabat kwotowy: od 1 do 70 zł.' });
    const commission = voucher ? 0 : Math.round(Number(req.body?.commission || 0));
    if (commission && (commission < 1 || commission > 50)) return res.status(400).json({ error: 'Prowizja partnera: od 1 do 50%.' });
    if (await codes.get(code)) return res.status(409).json({ error: 'Taki kod już istnieje.' });
    const c = { id: code, amount: voucher ? 0 : amount || 0, percent: voucher ? 0 : percent || 0, voucher, commission, maxUses, usedBy: [], note: String(req.body?.note || '').slice(0, 100), created: Date.now(), expires: Date.now() + days * 864e5 };
    await codes.save(c);
    res.json({ ok: true });
  });
  // Kod-pakiet od organizacji: faktura (bez VAT) wystawiona organizacji za cały pakiet, nie osobom, które z niego zamawiają.
  api.post('/codes/:code/invoice', async (req, res) => {
    const c = await codes.get(req.params.code);
    if (!c?.voucher) return res.status(404).json({ error: 'Nie ma takiego kodu od organizacji.' });
    const issued = !!req.body?.issued, number = String(req.body?.number || '').trim().slice(0, 60);
    await codes.save({ ...c, invoice: issued ? { number, at: Date.now() } : null });
    res.json({ ok: true });
  });
  // Kod partnera: wypłata zebranej prowizji (przelew robi właściciel; tu tylko zapis, że rozliczone).
  api.post('/codes/:code/payout', async (req, res) => {
    const c = await codes.get(req.params.code);
    if (!c?.commission) return res.status(404).json({ error: 'Nie ma takiego kodu partnera.' });
    if (!(c.due > 0)) return res.status(400).json({ error: 'Brak prowizji do wypłaty.' });
    await codes.save({ ...c, paidOut: (c.paidOut || 0) + c.due, due: 0, payouts: [...(c.payouts || []), { amount: c.due, at: Date.now() }].slice(-50) });
    res.json({ ok: true });
  });
  b2bAdmin(api, { BASE_URL });
  seoAdmin(api, { BASE_URL });
  statsAdmin(api);
  passAdmin(api);
  api.delete('/codes/:code', async (req, res) => { const ok = await codes.remove(req.params.code); res.status(ok ? 200 : 404).json({ ok }); });

  // Wiadomości z formularza kontaktowego (kasowane po 180 dniach).
  api.get('/messages', async (_req, res) => {
    res.json(Object.values(await messages.all()).sort((a, b) => b.created - a.created));
  });
  api.post('/messages/:id', async (req, res) => {
    const status = ['new', 'done'].includes(req.body?.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: 'Nieznany status.' });
    const m = await messages.update(req.params.id, { status });
    res.status(m ? 200 : 404).json({ ok: !!m });
  });
  api.delete('/messages/:id', async (req, res) => { const ok = await messages.remove(req.params.id); res.status(ok ? 200 : 404).json({ ok }); });

  // Newsletter: tylko adresy z potwierdzoną zgodą (podwójny zapis). Wysyłka w tle, z linkiem do wypisania.
  api.get('/newsletter', async (_req, res) => {
    const all = Object.values(await subscribers.all());
    res.json({
      confirmed: all.filter((s) => s.status === 'confirmed').length, pending: all.filter((s) => s.status === 'pending').length,
      mail: mailEnabled(), testTo: process.env.CONTACT_EMAIL || '', sending: newsletterBusy(),
      list: all.sort((a, b) => b.created - a.created).slice(0, 500).map((s) => ({ id: s.id, email: s.email, status: s.status, source: s.source, created: s.created, confirmedAt: s.confirmedAt || null })),
    });
  });
  api.delete('/newsletter/:id', async (req, res) => { const ok = await subscribers.remove(req.params.id); res.status(ok ? 200 : 404).json({ ok }); });
  api.get('/newsletter.csv', async (_req, res) => {
    const rows = Object.values(await subscribers.all()).filter((s) => s.status === 'confirmed').map((s) => [s.email, new Date(s.consent?.at || s.created).toISOString(), new Date(s.confirmedAt || s.created).toISOString(), s.source || '']);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="newsletter.csv"' })
      .send('\uFEFF' + [['e-mail', 'zgoda', 'potwierdzenie', 'źródło'], ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n'));
  });
  api.post('/newsletter/send', async (req, res) => {
    const subject = String(req.body?.subject || '').trim().slice(0, 150), text = String(req.body?.text || '').trim().slice(0, 20000);
    if (subject.length < 3 || text.length < 20) return res.status(400).json({ error: 'Podaj temat i treść (min. 20 znaków).' });
    if (!mailEnabled()) return res.status(400).json({ error: 'Wysyłka e-maili jest wyłączona (brak ustawień poczty SMTP_USER/SMTP_PASS).' });
    try {
      if (req.body?.test) {
        if (!process.env.CONTACT_EMAIL) return res.status(400).json({ error: 'Ustaw CONTACT_EMAIL, żeby wysłać wiadomość testową.' });
        await sendNewsletterIssue(process.env.CONTACT_EMAIL, { subject: `[TEST] ${subject}`, text }, `${BASE_URL}/newsletter/wypisz?t=test`);
        return res.json({ ok: true, test: true });
      }
      res.json({ ok: true, ...(await sendNewsletter({ subject, text }, BASE_URL)) });
    } catch (e) { res.status(409).json({ error: e.message }); }
  });
  api.get('/leads', async (_req, res) => res.json(Object.values(await leads.all()).sort((a, b) => b.created - a.created)));
  api.delete('/leads/:id', async (req, res) => { const ok = await leads.remove(req.params.id); res.status(ok ? 200 : 404).json({ ok }); });

  api.get('/problems', async (_req, res) => {
    const orders = Object.values(await allOrders()).filter((o) => o.status === 'paid' || o.mail?.status === 'failed').sort((a, b) => b.created - a.created).map(row);
    const ev = Object.values(await events.all()).sort((a, b) => b.at - a.at).slice(0, 200);
    // Kontrola jakości dokumentów (lib/qa.js): ostatnie 12 tygodni + zamówienia z flagami krytycznymi (same kody, bez treści).
    const qaOrders = Object.values(await allOrders()).filter((o) => o.qa?.flags?.length && o.qa.score < 70).sort((a, b) => b.created - a.created).slice(0, 30).map((o) => ({ id: o.id, created: o.created, score: o.qa.score, flags: o.qa.flags, retried: !!o.qa.retried }));
    res.json({ orders, events: ev, qa: { weeks: await qaWeeks(), labels: QA_LABELS, orders: qaOrders } });
  });

  // Zestawienie sprzedaży dla księgowej (CSV, separator ";" dla polskiego Excela).
  api.get('/export.csv', async (req, res) => {
    const from = Date.parse(req.query.from || '') || 0, to = (Date.parse(req.query.to || '') || Date.now()) + 864e5;
    const list = Object.values(await allOrders()).filter((o) => PAID.includes(o.status) && paidAt(o) >= from && paidAt(o) < to).sort((a, b) => paidAt(a) - paidAt(b));
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['data', 'id', 'email', 'pakiet', 'kwota_zl', 'rabat_zl', 'zwrot_zl', 'kod', 'status', 'platnosc', 'id_platnosci', 'sesja', 'faktura', 'nr_faktury', 'nabywca', 'nip', 'adres_nabywcy'].join(';'),
      ...list.map((o) => [new Date(paidAt(o)).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }), o.id, o.profile.email, orderPkgName(o), zl(o.total).toFixed(2).replace('.', ','), zl(o.discount).toFixed(2).replace('.', ','), zl(o.refunded).toFixed(2).replace('.', ','), o.code || '', o.status, o.payment?.provider || 'demo', o.payment?.paymentIntent || o.payment?.orderId || '', o.payment?.sessionId || '', o.invoice ? (o.invoice.issued ? 'wystawiona' : 'do wystawienia') : 'nie', o.invoice?.number || '', o.invoice?.name || '', o.invoice?.nip || '', o.invoice?.address || ''].map(q).join(';'))];
    res.type('text/csv').set('Content-Disposition', `attachment; filename="sprzedaz-${new Date().toISOString().slice(0, 10)}.csv"`).send('﻿' + lines.join('\r\n'));
  });

  app.use('/api/admin', express.json({ limit: '3mb' }), api); // import kontaktów CSV
}
