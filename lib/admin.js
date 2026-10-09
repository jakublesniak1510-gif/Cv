import crypto from 'node:crypto';
import express from 'express';
import { verifyTotp } from './totp.js';
import { allOrders, getOrder, updateOrder, removeOrder, codes, events, usage, reviews, stats, leads } from './store.js';
import { usageCost } from './ai.js';
import { PACKAGES, LANGS } from './pricing.js';
import { accountCount } from './account.js';
import { analyticsDays } from './analytics.js';
import { messages, subscribers, sendNewsletter, newsletterBusy } from './leads.js';
import { mailEnabled, sendNewsletterIssue } from './mail.js';

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
function isAdmin(req) {
  const [payload, sig] = readCookie(req, 'cvpo_admin').split('.');
  if (!payload || !sig || sign(payload).length !== sig.length || !crypto.timingSafeEqual(Buffer.from(sign(payload)), Buffer.from(sig))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}

const zl = (gr) => (gr || 0) / 100;
const dayKey = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }); // RRRR-MM-DD w czasie polskim
const paidAt = (o) => o.paidAt || o.created;
const net = (o) => o.total || 0;
const row = (o) => ({
  id: o.id, created: o.created, paidAt: o.paidAt || null, email: o.profile?.email || '', pkg: o.pkg, pkgName: PACKAGES[o.pkg]?.name || o.pkg,
  total: zl(o.total), status: o.status, revisions: o.revisions || 0, mail: o.mail?.status || null,
  ads: o.ads?.length || 0, code: o.code || null, followup: !!o.parentId,
});

async function reviewStats() {
  const all = Object.values(await reviews.all()).filter((r) => r.status !== 'spam');
  return { count: all.length, avg: all.length ? Math.round((10 * all.reduce((s, r) => s + r.rating, 0)) / all.length) / 10 : null, waiting: all.filter((r) => r.status === 'new' && r.publish).length };
}

export function adminRoutes(app, { DEMO, BASE_URL, markPaidAndGenerate, trySend, retentionMs }) {
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
  api.get('/me', (req, res) => res.json({ loggedIn: isAdmin(req), totp: !!totpSecret, demo: DEMO }));

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
    const steps = Object.fromEntries(merge('steps'));
    res.json({
      days: n, visitors: sum('visitors'), views: sum('views'), paid, conversion: sum('visitors') ? Math.round((1000 * paid) / sum('visitors')) / 10 : 0,
      byDay: list.map((x) => ({ day: x.day, visitors: x.visitors || 0, views: x.views || 0 })),
      refs: merge('refs').slice(0, 12), pages: merge('pages').slice(0, 12), devices: merge('devices'),
      funnel: [['Otwarcie kreatora', steps.start || 0], ...[1, 2, 3, 4, 5, 6].map((s) => [['Pakiet', 'Dane', 'Doświadczenie', 'Wykształcenie', 'Ogłoszenia', 'Podsumowanie'][s - 1], steps[s] || 0]), ['Opłacone', paid]],
    });
  });

  api.get('/orders', async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase(), st = String(req.query.status || '');
    let list = Object.values(await allOrders()).sort((a, b) => b.created - a.created).map(row);
    if (st) list = list.filter((o) => o.status === st || (st === 'problem' && (o.status === 'paid' || o.mail === 'failed')));
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
      mailInfo: o.mail || null, error: o.error || null, reminder: o.reminder || null, myCode: o.myCode || null,
      expires: o.created + retentionMs, link: `${BASE_URL}/?id=${o.id}`,
    });
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
      code: c.id, kind: c.ownerOrderId ? 'klient' : c.voucher ? 'instytucja' : 'akcja', voucher: c.voucher || null, amount: c.percent || c.voucher ? null : zl(c.amount), percent: c.percent || null,
      uses: (c.usedBy || []).length, maxUses: c.maxUses || null, created: c.created, expires: c.expires, note: c.note || '',
      referrals: c.referrals || 0, credit: zl(c.credit || 0), earned: zl(c.earned || 0),
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
    if (await codes.get(code)) return res.status(409).json({ error: 'Taki kod już istnieje.' });
    const c = { id: code, amount: voucher ? 0 : amount || 0, percent: voucher ? 0 : percent || 0, voucher, maxUses, usedBy: [], note: String(req.body?.note || '').slice(0, 100), created: Date.now(), expires: Date.now() + days * 864e5 };
    await codes.save(c);
    res.json({ ok: true });
  });
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
    if (!mailEnabled()) return res.status(400).json({ error: 'Wysyłka e-maili jest wyłączona (brak SMTP_URL).' });
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
    res.json({ orders, events: ev });
  });

  // Zestawienie sprzedaży dla księgowej (CSV, separator ";" dla polskiego Excela).
  api.get('/export.csv', async (req, res) => {
    const from = Date.parse(req.query.from || '') || 0, to = (Date.parse(req.query.to || '') || Date.now()) + 864e5;
    const list = Object.values(await allOrders()).filter((o) => PAID.includes(o.status) && paidAt(o) >= from && paidAt(o) < to).sort((a, b) => paidAt(a) - paidAt(b));
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['data', 'id', 'email', 'pakiet', 'kwota_zl', 'rabat_zl', 'kod', 'status', 'id_transakcji_p24', 'sesja_p24'].join(';'),
      ...list.map((o) => [new Date(paidAt(o)).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }), o.id, o.profile.email, PACKAGES[o.pkg]?.name, zl(o.total).toFixed(2).replace('.', ','), zl(o.discount).toFixed(2).replace('.', ','), o.code || '', o.status, o.payment?.orderId || (o.payment ? '' : 'demo'), o.payment?.sessionId || ''].map(q).join(';'))];
    res.type('text/csv').set('Content-Disposition', `attachment; filename="sprzedaz-${new Date().toISOString().slice(0, 10)}.csv"`).send('﻿' + lines.join('\r\n'));
  });

  app.use('/api/admin', express.json({ limit: '50kb' }), api);
}
