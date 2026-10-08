import crypto from 'node:crypto';
import express from 'express';
import { makeStore, allOrders } from './store.js';
import { mailEnabled, sendLoginLink, sendInterviewReminder } from './mail.js';
import { PACKAGES } from './pricing.js';

// Konto klienta bez hasła: logowanie jednorazowym linkiem z e-maila. Na koncie: zamówienia z ostatnich 30 dni
// i własna lista aplikacji (gdzie wysłał CV, status, termin rozmowy z przypomnieniem dzień wcześniej).
const accounts = makeStore('accounts.json'), tokens = makeStore('login-tokens.json');
const SECRET = process.env.ACCOUNT_SECRET || process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_MS = 30 * 864e5, TOKEN_MS = 20 * 60e3, INACTIVE_MS = 365 * 864e5;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const accId = (email) => sha(`${process.env.CODE_SALT || 'cvpo'}:acc:${String(email).trim().toLowerCase()}`).slice(0, 32);
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const STATUSES = ['wysłane', 'rozmowa', 'oferta', 'odmowa', 'brak odpowiedzi'];

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
    orderId: str(b.orderId, 40) || null, resultIndex: Number.isInteger(b.resultIndex) ? b.resultIndex : null,
  };
};

export function accountRoutes(app, { BASE_URL, DEMO }) {
  const api = express.Router(), tries = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (tries.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; tries.set(key, [...h, now]); return false; };

  app.get('/konto', (_req, res) => res.sendFile('index.html', { root: 'public' }));
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

  api.post('/login', async (req, res) => {
    const id = sha(str(req.body?.token, 100)), t = await tokens.get(id);
    if (!t || t.exp < Date.now()) return res.status(401).json({ error: 'Link wygasł albo został już użyty. Poproś o nowy.' });
    await tokens.remove(id);
    const aid = accId(t.email);
    await accounts.upsert(aid, (p) => ({ email: t.email, apps: [], created: Date.now(), ...p, lastSeen: Date.now() }));
    const payload = Buffer.from(JSON.stringify({ id: aid, exp: Date.now() + SESSION_MS })).toString('base64url');
    res.cookie('cvpo_acc', `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: 'lax', secure: BASE_URL.startsWith('https'), maxAge: SESSION_MS, path: '/' });
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
    const orders = Object.values(await allOrders()).filter((o) => o.profile?.email?.toLowerCase() === a.email && o.status !== 'pending').sort((x, y) => y.created - x.created)
      .map((o) => ({ id: o.id, created: o.created, pkg: PACKAGES[o.pkg]?.name || o.pkg, status: o.status, interview: !!o.addons?.interview, positions: (o.results || []).map((r) => ({ position: r.position, company: r.company || '' })) }));
    res.json({ email: a.email, created: a.created, apps: a.apps || [], orders, statuses: STATUSES });
  });
  api.post('/logout', (_req, res) => { res.clearCookie('cvpo_acc', { path: '/' }); res.json({ ok: true }); });
  api.delete('/', async (req, res) => { await accounts.remove(req.acc.id); res.clearCookie('cvpo_acc', { path: '/' }); res.json({ ok: true }); });

  api.post('/apps', async (req, res) => {
    if ((req.acc.apps || []).length >= 300) return res.status(400).json({ error: 'Masz już 300 aplikacji. Usuń stare, żeby dodać nowe.' });
    const a = cleanApp(req.body);
    if (!a.company && !a.position) return res.status(400).json({ error: 'Podaj firmę lub stanowisko.' });
    const item = { id: crypto.randomBytes(6).toString('hex'), ...a, created: Date.now() };
    await accounts.update(req.acc.id, (x) => ({ ...x, apps: [item, ...(x.apps || [])] }));
    res.json(item);
  });
  api.put('/apps/:aid', async (req, res) => {
    let found = null;
    await accounts.update(req.acc.id, (x) => ({ ...x, apps: (x.apps || []).map((p) => {
      if (p.id !== req.params.aid) return p;
      const n = cleanApp({ ...p, interviewAt: p.interviewAt ? new Date(p.interviewAt).toISOString() : '', ...req.body });
      found = { ...p, ...n, reminded: n.interviewAt === p.interviewAt ? p.reminded : false };
      return found;
    }) }));
    res.status(found ? 200 : 404).json(found || { error: 'Nie ma takiej aplikacji.' });
  });
  api.delete('/apps/:aid', async (req, res) => { await accounts.update(req.acc.id, (x) => ({ ...x, apps: (x.apps || []).filter((p) => p.id !== req.params.aid) })); res.json({ ok: true }); });

  app.use('/api/account', express.json({ limit: '20kb' }), api);
}

// Co godzinę: przypomnienia dzień przed rozmową i usuwanie kont nieużywanych przez rok.
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
}
export const accountCount = async () => Object.keys(await accounts.all()).length;
