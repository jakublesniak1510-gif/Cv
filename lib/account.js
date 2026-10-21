import crypto from 'node:crypto';
import express from 'express';
import { homeHtml } from './seo.js';
import { makeStore, allOrders, getOrder } from './store.js';
import { mailEnabled, sendLoginLink, sendInterviewReminder, sendFollowupReminder } from './mail.js';
import { getDraft } from './drafts.js';
import { orderPkgName } from './pricing.js';

// Konto klienta bez hasła: logowanie jednorazowym linkiem z e-maila. Na koncie: zamówienia z ostatnich 30 dni
// i własna lista aplikacji (tracker): gdzie wysłał CV, status, notatka, termin rozmowy z przypomnieniem dzień wcześniej
// i przypomnienie o follow-up w wybranym dniu (usługa ustawiana przez klienta, nie marketing; wypis jednym linkiem).
// Wpisy dodają się też same z opłaconych zamówień (status „przygotowane”) i ze szkicu ogłoszenia z rozszerzenia (?draft).
const accounts = makeStore('accounts.json'), tokens = makeStore('login-tokens.json');
const SECRET = process.env.ACCOUNT_SECRET || process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_MS = 30 * 864e5, TOKEN_MS = 20 * 60e3, INACTIVE_MS = 365 * 864e5;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const accId = (email) => sha(`${process.env.CODE_SALT || 'cvpo'}:acc:${String(email).trim().toLowerCase()}`).slice(0, 32);
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const STATUSES = ['przygotowane', 'wysłane', 'rozmowa', 'oferta', 'odmowa', 'brak odpowiedzi'];
export const MAX_APPS = 500;
const AD_TEXT = 6000, DAY = /^\d{4}-\d{2}-\d{2}$/;
const today = (t = Date.now()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(t);

function readCookie(req, name) {
  const m = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}
function session(req) {
  const [payload, sig] = readCookie(req, 'cvpo_acc').split('.');
  if (!payload || !sig) return null;
  const good = sign(payload);
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  try { const s = JSON.parse(Buffer.from(payload, 'base64url').toString()); return s.exp > Date.now() ? s : null; } catch { return null; }
}
const cleanApp = (b = {}) => {
  const t = Date.parse(b.interviewAt || '');
  return {
    company: str(b.company, 120), position: str(b.position, 140), link: /^https?:\/\//.test(str(b.link, 500)) ? str(b.link, 500) : '',
    status: STATUSES.includes(b.status) ? b.status : 'wysłane', applied: /^\d{4}-\d{2}-\d{2}$/.test(b.applied || '') ? b.applied : new Date().toISOString().slice(0, 10),
    interviewAt: Number.isFinite(t) ? t : null, remind: !!b.remind && Number.isFinite(t), note: str(b.note, 500),
    followAt: DAY.test(b.followAt || '') ? b.followAt : null, adText: str(b.adText, AD_TEXT),
  };
};
// orderId i resultIndex ustawia tylko serwer (import z zamówień); z formularza klienta ich nie przyjmujemy.
const fromOrder = (o, i) => ({ orderId: str(o, 40) || null, resultIndex: Number.isInteger(i) ? i : null });
const newApp = (a) => ({ id: crypto.randomBytes(6).toString('hex'), ...a, created: Date.now() });

// Opłacone zamówienia klienta → wpisy „przygotowane” (raz na zamówienie; zapamiętujemy numery już dodanych).
export function appsFromOrders(acc, orders) {
  const seen = new Set(acc.imported || []), apps = [...(acc.apps || [])], add = [];
  for (const o of orders.filter((x) => x.status === 'done' && !seen.has(x.id)).sort((x, y) => x.created - y.created)) {
    seen.add(o.id);
    (o.results || []).forEach((r, i) => {
      if (apps.length + add.length >= MAX_APPS || apps.some((p) => p.orderId === o.id && p.resultIndex === i)) return;
      add.push(newApp({ ...cleanApp({ company: r.company || '', position: r.position || o.ads?.[i]?.title || '', status: 'przygotowane', applied: today(o.created), adText: o.ads?.[i]?.text || '' }), ...fromOrder(o.id, i) }));
    });
  }
  return { apps: [...add.reverse(), ...apps], imported: [...seen].slice(-200), added: add.length };
}
const csvCell = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const appsCsv = (apps) => '\ufeff' + [['Firma', 'Stanowisko', 'Link', 'Data wysłania', 'Status', 'Notatka', 'Przypomnienie (follow-up)', 'Rozmowa'],
  ...apps.map((a) => [a.company, a.position, a.link, a.applied, a.status, a.note, a.followAt || '', a.interviewAt ? new Date(a.interviewAt).toISOString().slice(0, 16).replace('T', ' ') : ''])].map((r) => r.map(csvCell).join(';')).join('\r\n') + '\r\n';

// Dla innych modułów (karnety): konto zalogowanego klienta, założenie konta i link logowania.
export const accountIdOf = (req) => session(req)?.id || null;
export const accountEmail = async (id) => (id ? (await accounts.get(id))?.email || null : null);
export const accountIdFor = (email) => accId(String(email).trim().toLowerCase());
export const ensureAccount = (email) => { email = String(email).trim().toLowerCase(); return accounts.upsert(accId(email), (p) => ({ email, apps: [], created: Date.now(), ...p, lastSeen: Date.now() })); };
export async function loginLink(email, BASE_URL, ttl = TOKEN_MS) {
  const token = crypto.randomBytes(32).toString('base64url');
  await tokens.save({ id: sha(token), email: String(email).trim().toLowerCase(), exp: Date.now() + ttl });
  return `${BASE_URL}/konto?t=${token}`;
}
export async function startAccountSession(res, email, BASE_URL) {
  const a = await ensureAccount(email);
  const payload = Buffer.from(JSON.stringify({ id: a.id, exp: Date.now() + SESSION_MS })).toString('base64url');
  res.cookie('cvpo_acc', `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: 'lax', secure: BASE_URL.startsWith('https'), maxAge: SESSION_MS, path: '/' });
}

export function accountRoutes(app, { BASE_URL, DEMO }) {
  const api = express.Router(), tries = new Map();
  const startSession = (res, email) => startAccountSession(res, email, BASE_URL);
  const limited = (key, max, ms) => { const now = Date.now(), h = (tries.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; tries.set(key, [...h, now]); return false; };

  app.get('/konto', (_req, res) => res.set('X-Robots-Tag', 'noindex').type('html').send(homeHtml()));
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method !== 'GET' && req.get('X-Acc') !== '1') return res.status(403).json({ error: 'Brak nagłówka X-Acc.' });
    next();
  });

  // Zawsze ta sama odpowiedź: nie zdradzamy, czy adres jest w bazie.
  api.post('/link', async (req, res) => {
    const email = str(req.body?.email, 200).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    if (limited('ip:' + req.ip, 8, 3600e3) || limited('em:' + email, 3, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const token = crypto.randomBytes(32).toString('base64url');
    await tokens.save({ id: sha(token), email, exp: Date.now() + TOKEN_MS });
    await tokens.deleteWhere((t) => t.exp < Date.now());
    const link = `${BASE_URL}/konto?t=${token}`;
    if (!mailEnabled()) return res.json({ ok: true, ...(DEMO ? { demoLink: link } : {}) });
    try { await sendLoginLink(email, link, req.body?.lang); } catch (e) { console.error('Link logowania', e.message); return res.status(502).json({ error: 'Nie udało się wysłać e-maila. Spróbuj za chwilę.' }); }
    res.json({ ok: true });
  });

  // Konto jednym kliknięciem ze strony zamówienia (link do zamówienia jest już tajny i przychodzi na e-mail klienta).
  api.post('/from-order', async (req, res) => {
    const o = await getOrder(str(req.body?.orderId, 40));
    if (!o || o.status !== 'done' || !o.profile?.email) return res.status(409).json({ error: 'Konto założysz po otrzymaniu dokumentów.' });
    await startSession(res, o.profile.email.toLowerCase());
    res.json({ ok: true, email: o.profile.email.toLowerCase() });
  });

  api.post('/login', async (req, res) => {
    const id = sha(str(req.body?.token, 100)), t = await tokens.get(id);
    if (!t || t.exp < Date.now()) return res.status(401).json({ error: 'Link wygasł albo został już użyty. Poproś o nowy.' });
    await tokens.remove(id);
    await startSession(res, t.email);
    res.json({ ok: true });
  });

  // Wszystko poniżej wymaga zalogowania.
  api.use(async (req, res, next) => {
    const s = session(req), a = s && (await accounts.get(s.id));
    if (!a) return res.status(401).json({ error: 'Zaloguj się.' });
    req.acc = a; next();
  });

  api.get('/', async (req, res) => {
    const a = req.acc;
    accounts.update(a.id, { lastSeen: Date.now() }).catch(() => {});
    const mine = Object.values(await allOrders()).filter((o) => o.profile?.email?.toLowerCase() === a.email && o.status !== 'pending');
    if (mine.some((o) => o.status === 'done' && !(a.imported || []).includes(o.id))) {
      const n = await accounts.update(a.id, (x) => ({ ...x, ...appsFromOrders(x, mine) }));
      if (n) a.apps = n.apps;
    }
    const orders = mine.sort((x, y) => y.created - x.created)
      .map((o) => ({ id: o.id, created: o.created, pkg: orderPkgName(o), status: o.status, interview: !!o.addons?.interview, positions: (o.results || []).map((r) => ({ position: r.position, company: r.company || '' })) }));
    res.json({ email: a.email, created: a.created, apps: (a.apps || []).map(({ adText, ...p }) => ({ ...p, hasAd: !!adText })), orders, statuses: STATUSES, max: MAX_APPS, followOff: !!a.followOff });
  });
  api.post('/logout', (_req, res) => { res.clearCookie('cvpo_acc', { path: '/' }); res.json({ ok: true }); });
  api.delete('/', async (req, res) => { await accounts.remove(req.acc.id); res.clearCookie('cvpo_acc', { path: '/' }); res.json({ ok: true }); });

  const full = (req, res) => ((req.acc.apps || []).length >= MAX_APPS ? res.status(400).json({ error: `Masz już ${MAX_APPS} aplikacji. Usuń stare (możesz je wcześniej pobrać w CSV), żeby dodać nowe.` }) : null);
  api.post('/apps', async (req, res) => {
    if (full(req, res)) return;
    const a = cleanApp(req.body);
    if (!a.company && !a.position) return res.status(400).json({ error: 'Podaj firmę lub stanowisko.' });
    // Powiązanie z zamówieniem („+ do aplikacji” na liście zamówień) tylko dla zamówienia z adresem tego konta.
    const o = req.body?.orderId ? await getOrder(str(req.body.orderId, 40)) : null;
    const item = newApp({ ...a, ...(o?.profile?.email?.toLowerCase() === req.acc.email ? fromOrder(o.id, req.body.resultIndex) : fromOrder()) });
    await accounts.update(req.acc.id, (x) => ({ ...x, apps: [item, ...(x.apps || [])] }));
    res.json(item);
  });
  // Ogłoszenie przysłane przez rozszerzenie (?draft=<id>): zapis w aplikacjach z treścią do „Dopasuj CV”.
  api.post('/apps/from-draft', async (req, res) => {
    if (full(req, res)) return;
    const d = getDraft(str(req.body?.draftId, 40));
    if (!d) return res.status(404).json({ error: 'Szkic ogłoszenia wygasł. Otwórz ogłoszenie i kliknij rozszerzenie jeszcze raz.' });
    if ((req.acc.apps || []).some((p) => p.adText && p.adText === d.text.slice(0, AD_TEXT))) return res.json({ ok: true, duplicate: true });
    const item = newApp(cleanApp({ position: d.title || 'Oferta pracy', link: d.url, adText: d.text, status: 'przygotowane' }));
    await accounts.update(req.acc.id, (x) => ({ ...x, apps: [item, ...(x.apps || [])] }));
    res.json(item);
  });
  // Treść ogłoszenia do „Dopasuj CV do tej oferty” (na liście jej nie wysyłamy, żeby nie była ciężka).
  api.get('/apps/:aid/ad', (req, res) => {
    const p = (req.acc.apps || []).find((x) => x.id === req.params.aid);
    if (!p) return res.status(404).json({ error: 'Nie ma takiej aplikacji.' });
    res.json({ title: [p.position, p.company].filter(Boolean).join(' – ').slice(0, 100), url: p.link, text: p.adText || '' });
  });
  api.get('/apps.csv', (req, res) => {
    res.set('Content-Disposition', `attachment; filename="moje-aplikacje-${today()}.csv"`).type('text/csv; charset=utf-8').send(appsCsv(req.acc.apps || []));
  });
  api.post('/follow-off', async (req, res) => { await accounts.update(req.acc.id, (x) => ({ ...x, followOff: !!req.body?.off })); res.json({ ok: true }); });
  api.put('/apps/:aid', async (req, res) => {
    let found = null;
    await accounts.update(req.acc.id, (x) => ({ ...x, apps: (x.apps || []).map((p) => {
      if (p.id !== req.params.aid) return p;
      const n = cleanApp({ ...p, interviewAt: p.interviewAt ? new Date(p.interviewAt).toISOString() : '', ...req.body });
      found = { ...p, ...n, orderId: p.orderId ?? null, resultIndex: p.resultIndex ?? null, reminded: n.interviewAt === p.interviewAt ? p.reminded : false, followSent: n.followAt === p.followAt ? p.followSent : false };
      return found;
    }) }));
    res.status(found ? 200 : 404).json(found || { error: 'Nie ma takiej aplikacji.' });
  });
  api.delete('/apps/:aid', async (req, res) => { await accounts.update(req.acc.id, (x) => ({ ...x, apps: (x.apps || []).filter((p) => p.id !== req.params.aid) })); res.json({ ok: true }); });

  app.use('/api/account', express.json({ limit: '20kb' }), api);

  // Wypis z przypomnień o follow-up linkiem z e-maila (bez logowania): GET pyta, POST wyłącza (też List-Unsubscribe One-Click).
  // Porównanie tokenu w stałym czasie (bez wycieku przez czas odpowiedzi).
  const same = (a, b) => typeof a === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  const byFollowToken = async (t) => (t && t.length >= 20 ? Object.values(await accounts.all()).find((a) => same(a.followToken, t)) || null : null);
  const page = (res, title, body) => res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }).type('html').send(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | CV Pod Ogłoszenie</title><link rel="stylesheet" href="/style.css"></head><body><main class="sec"><div class="inner narrow"><h1>${title}</h1>${body}<p><a href="/konto">Moje konto</a></p></div></main></body></html>`);
  app.get('/konto/przypomnienia/wypisz', async (req, res) => {
    const t = str(req.query.t, 80), a = await byFollowToken(t);
    if (!a) return page(res, 'Link nieaktualny', '<p>Ten link wygasł albo konto zostało usunięte.</p>');
    page(res, 'Wyłączyć przypomnienia o follow-up?', `<p>Nie będziemy wysyłać przypomnień o follow-up z Twojej listy aplikacji. Lista i przypomnienia przed rozmową zostają bez zmian.</p><form method="post" action="/konto/przypomnienia/wypisz?t=${encodeURIComponent(t)}"><button class="btn" type="submit">Wyłącz przypomnienia</button></form>`);
  });
  app.post('/konto/przypomnienia/wypisz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const a = await byFollowToken(str(req.query.t, 80));
    if (a) await accounts.update(a.id, { followOff: true });
    page(res, 'Przypomnienia wyłączone', '<p>Nie wyślemy już przypomnień o follow-up. Możesz je włączyć ponownie na koncie.</p>');
  });
}

// Co godzinę: przypomnienia dzień przed rozmową, przypomnienia o follow-up (od 8:00 w dniu wybranym przez klienta)
// i usuwanie kont nieużywanych przez rok.
export async function accountHourly(BASE_URL) {
  await accounts.deleteWhere((a) => Date.now() - (a.lastSeen || a.created) > INACTIVE_MS);
  await tokens.deleteWhere((t) => t.exp < Date.now());
  if (!mailEnabled()) return;
  const orders = await allOrders();
  for (const a of Object.values(await accounts.all())) {
    for (const p of a.apps || []) {
      const left = (p.interviewAt || 0) - Date.now();
      if (!p.remind || p.reminded || left <= 0 || left > 26 * 3600e3) continue;
      const o = p.orderId && orders[p.orderId];
      const links = { account: `${BASE_URL}/konto`, prep: o?.addons?.interview && o.status === 'done' ? `${BASE_URL}/?id=${o.id}` : '' };
      try {
        await sendInterviewReminder(a.email, p, links);
        await accounts.update(a.id, (x) => ({ ...x, apps: x.apps.map((q) => (q.id === p.id ? { ...q, reminded: true } : q)) }));
      } catch (e) { console.error('Przypomnienie o rozmowie', e.message); }
    }
  }
  await followupHourly(BASE_URL);
}
export async function followupHourly(BASE_URL, now = Date.now(), send = sendFollowupReminder) {
  const hour = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: 'numeric', hourCycle: 'h23' }).format(now), day = today(now);
  if (hour < 8) return 0;
  let sent = 0;
  for (const a of Object.values(await accounts.all())) {
    if (a.followOff) continue;
    // Jeden token wypisu na konto (kilka przypomnień w jednym przebiegu ma ten sam, działający link).
    const token = a.followToken || crypto.randomBytes(24).toString('base64url');
    for (const p of a.apps || []) {
      if (!p.followAt || p.followSent || p.followAt > day || ['oferta', 'odmowa'].includes(p.status)) continue;
      const days = Math.max(1, Math.round((Date.parse(day) - Date.parse(p.applied)) / 864e5));
      try {
        await send(a.email, p, days, { account: `${BASE_URL}/konto`, unsub: `${BASE_URL}/konto/przypomnienia/wypisz?t=${token}` });
        await accounts.update(a.id, (x) => ({ ...x, followToken: token, apps: x.apps.map((q) => (q.id === p.id ? { ...q, followSent: true } : q)) }));
        sent++;
      } catch (e) { console.error('Przypomnienie o follow-up', e.message); }
    }
  }
  return sent;
}
export const accountCount = async () => Object.keys(await accounts.all()).length;
