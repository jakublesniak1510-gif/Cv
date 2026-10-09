import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import { calcTotal, MAX_ADS, PRICES, LANGS, CODE_DISCOUNT, PACKAGES, ADDONS, withLetter as hasLetter } from './lib/pricing.js';
import { getOrder, saveOrder, updateOrder, deleteOlderThan, allOrders, codes, reviews, stats } from './lib/store.js';
import { generateForAd, reviseDoc, translateResult, scanCv, assistant } from './lib/generate.js';
import { aiEnabled, AiRefusal } from './lib/ai.js';
import { fetchAd, AdError } from './lib/fetchAd.js';
import { adFromImage, AdImageError } from './lib/adImage.js';
import { simTurn, SimError } from './lib/sim.js';
import { importCv, extractText, ImportError } from './lib/importCv.js';
import { mailEnabled, sendOrderMail, sendReminder, sendReviewAsk } from './lib/mail.js';
import { cleanDesign } from './lib/designs.js';
import { usefulExtraLangs } from './lib/lang.js';
import { seoRoutes } from './lib/seo.js';
import { p24Enabled, p24Register, p24NotificationOk, p24Verify, p24BySession } from './lib/p24.js';
import { renderDocx } from './lib/docx.js';
import { adminRoutes } from './lib/admin.js';
import { accountRoutes, accountHourly } from './lib/account.js';
import { analyticsRoutes, cleanupAnalytics } from './lib/analytics.js';
import { logEvent, cleanupEvents } from './lib/events.js';

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DEMO = !p24Enabled();
const RETENTION_MS = 30 * 24 * 3600 * 1000;
const MAX_REVISIONS = 10;

const app = express();
app.set('trust proxy', 1);


// Prosty limit zapytań na adres IP.
const limiter = (max, windowMs) => { const hits = new Map(); return (req) => { const now = Date.now(), h = (hits.get(req.ip) || []).filter((t) => now - t < windowMs); if (h.length >= max) return false; hits.set(req.ip, [...h, now]); return true; }; };
const importLimit = limiter(10, 600_000), fetchLimit = limiter(20, 600_000), scanLimit = limiter(6, 3600_000), chatLimit = limiter(30, 3600_000);
const CODE_TTL = 90 * 24 * 3600 * 1000, REMINDER_AFTER = 7 * 24 * 3600 * 1000, REVIEW_AFTER = 4 * 24 * 3600 * 1000;

// --- Import starego CV (większy limit body, więc przed globalnym parserem) ---
app.post('/api/import', express.json({ limit: '8mb' }), async (req, res) => {
  if (!importLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut.' });
  const b64 = typeof req.body?.data === 'string' ? req.body.data : '';
  const buf = Buffer.from(b64, 'base64');
  if (!buf.length || buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Plik musi mieć do 5 MB.' });
  try { res.json(await importCv(buf)); }
  catch (e) { console.error('Import CV', e.message); logEvent('import', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się odczytać pliku. Wpisz dane ręcznie.' }); }
});

// --- Darmowy skaner CV: plik CV + treść ogłoszenia -> raport dopasowania (bez zapisywania) ---
app.post('/api/scan', express.json({ limit: '8mb' }), async (req, res) => {
  if (!scanLimit(req)) return res.status(429).json({ error: 'Wykorzystano limit darmowych skanów na godzinę. Spróbuj później.' });
  const adText = typeof req.body?.adText === 'string' ? req.body.adText.trim().slice(0, 10000) : '';
  if (adText.length < 80) return res.status(400).json({ error: 'Wklej pełną treść ogłoszenia (min. 80 znaków).' });
  try {
    let cvText = typeof req.body?.cvText === 'string' ? req.body.cvText.trim() : '';
    if (!cvText) {
      const buf = Buffer.from(typeof req.body?.data === 'string' ? req.body.data : '', 'base64');
      if (!buf.length || buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Wgraj CV (PDF, Word lub TXT do 5 MB).' });
      cvText = await extractText(buf);
    }
    if (cvText.length < 60) return res.status(400).json({ error: 'CV jest za krótkie, żeby je ocenić.' });
    res.json(await scanCv({ cvText, adText }));
  } catch (e) { console.error('Skaner', e.message); logEvent('skaner', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się ocenić CV. Spróbuj ponownie.' }); }
});

app.use(express.json({ limit: '700kb' }));
seoRoutes(app, BASE_URL);
app.use(express.static('public'));

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);
const PHOTO = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;

function cleanProfile(p = {}) {
  return {
    name: str(p.name, 100), headline: str(p.headline, 120), email: str(p.email, 120),
    phone: str(p.phone, 40), city: str(p.city, 80), link: str(p.link, 200),
    summary: str(p.summary, 1500),
    experience: arr(p.experience, 12).map((e) => ({
      title: str(e?.title, 120), company: str(e?.company, 120), from: str(e?.from, 20),
      to: str(e?.to, 20), description: str(e?.description, 2000),
    })).filter((e) => e.title || e.company),
    education: arr(p.education, 6).map((e) => ({
      school: str(e?.school, 150), degree: str(e?.degree, 150), from: str(e?.from, 20), to: str(e?.to, 20),
    })).filter((e) => e.school),
    skills: str(p.skills, 1500), languages: str(p.languages, 500),
    certificates: str(p.certificates, 1000), interests: str(p.interests, 500),
    notes: str(p.notes, 1500),
    photo: typeof p.photo === 'string' && p.photo.length < 400_000 && PHOTO.test(p.photo) ? p.photo : '',
  };
}
const cleanAds = (ads) => arr(ads, MAX_ADS).map((a) => ({ title: str(a?.title, 100), text: str(a?.text, 10000), lang: a?.lang in LANGS ? a.lang : 'auto' })).filter((a) => a.text.length >= 80);
const cleanLangs = (l) => [...new Set(arr(l, 6).filter((x) => x in LANGS))];
const normCode = (c) => str(c, 20).toUpperCase().replace(/[^A-Z0-9-]/g, '');

// Kod klienta: −10 zł dla niego i dla znajomych, każda osoba (adres e-mail) może go użyć raz.
// Zamiast adresów zapisujemy ich skróty, więc w pliku kodów nie ma danych osobowych.
const emailHash = (e) => crypto.createHash('sha256').update(`${process.env.CODE_SALT || 'cvpo'}:${String(e || '').trim().toLowerCase()}`).digest('hex').slice(0, 32);
async function checkCode(raw, email) {
  const code = normCode(raw);
  if (!code) return { discount: 0 };
  const c = await codes.get(code);
  if (!c || Date.now() > c.expires) return { error: 'Ten kod nie istnieje albo wygasł.' };
  if (email && (c.usedBy || []).includes(emailHash(email))) return { error: 'Ten kod został już przez Ciebie wykorzystany.' };
  if (c.maxUses && (c.usedBy || []).length >= c.maxUses) return { error: 'Limit użyć tego kodu został wyczerpany.' };
  return { code, discount: c.amount || 0, percent: c.percent || 0 };
}
// Rabat w groszach: kwotowy albo procentowy (kody akcji promocyjnych z panelu).
const discountFor = (c, pkg, n, ad, returning, langs) => (c.percent ? Math.round((calcTotal(pkg, n, ad, returning, langs, 0) * c.percent) / 100) : c.discount || 0);
const newCode = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6)}`;
const cleanAddons = (a = {}) => Object.fromEntries(Object.keys(ADDONS).map((k) => [k, !!a[k]]));
// Edytowane przez klienta CV: ten sam kształt co z generatora, przycięte długości.
const cleanCv = (c = {}) => ({
  name: str(c.name, 100), headline: str(c.headline, 140), contact: arr(c.contact, 6).map((x) => str(x, 200)).filter(Boolean),
  summary: str(c.summary, 2000),
  experience: arr(c.experience, 12).map((e) => ({ title: str(e?.title, 140), company: str(e?.company, 140), period: str(e?.period, 60), bullets: arr(e?.bullets, 10).map((b) => str(b, 400)).filter(Boolean) })),
  education: arr(c.education, 6).map((e) => ({ school: str(e?.school, 160), degree: str(e?.degree, 160), period: str(e?.period, 60) })),
  skills: arr(c.skills, 30).map((x) => str(x, 80)).filter(Boolean), languages: arr(c.languages, 10).map((x) => str(x, 80)).filter(Boolean),
  certificates: arr(c.certificates, 15).map((x) => str(x, 160)).filter(Boolean), interests: str(c.interests, 400), clause: str(c.clause, 600),
});

app.get('/api/config', (_req, res) => res.json({
  demo: DEMO, ai: aiEnabled(), maxAds: MAX_ADS, noPrint: false, maxRevisions: MAX_REVISIONS, langs: LANGS, codeDiscount: CODE_DISCOUNT / 100,
  prices: Object.fromEntries(Object.entries(PRICES).map(([k, v]) => [k, v / 100])),
}));

app.get('/api/code/:code', async (req, res) => {
  const r = await checkCode(req.params.code, req.query.email);
  if (r.error) return res.status(404).json({ error: r.error });
  res.json({ code: r.code, discount: r.discount / 100, percent: r.percent || 0, label: 'Kod rabatowy' });
});

// Asystent: krótkie odpowiedzi na pytania o CV (limit na IP).
app.post('/api/assistant', async (req, res) => {
  if (!chatLimit(req)) return res.status(429).json({ error: 'Za dużo pytań w krótkim czasie. Spróbuj za chwilę.' });
  const history = arr(req.body?.messages, 12).map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: str(m?.content, 1000) })).filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'Zadaj pytanie.' });
  try { res.json({ answer: await assistant(history) }); }
  catch (e) { console.error('Asystent', e.message); logEvent('asystent', e.message); res.status(502).json({ error: 'Asystent jest chwilowo niedostępny. Zajrzyj do FAQ albo poradnika.' }); }
});

// Symulator rozmowy (dodatek): jedna tura = pytanie rekrutera i ocena ostatniej odpowiedzi; limit tur na zamówienie.
const SIM_LIMIT = 120;
app.post('/api/orders/:id/sim', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'done' || !o.addons?.sim) return res.status(404).json({ error: 'Symulator nie jest dostępny dla tego zamówienia.' });
  const i = Number(req.body?.i) || 0, r = o.results?.[i];
  if (!r) return res.status(400).json({ error: 'Nie znaleziono ogłoszenia.' });
  if ((o.simTurns || 0) >= SIM_LIMIT) return res.status(429).json({ error: 'Wykorzystano limit rozmów w symulatorze dla tego zamówienia.' });
  try {
    const out = await simTurn({ result: r, ad: o.ads[i] || {}, uiLang: o.uiLang, history: req.body?.history, finish: !!req.body?.finish });
    await updateOrder(o.id, (x) => ({ ...x, simTurns: (x.simTurns || 0) + 1 }));
    res.json(out);
  } catch (e) {
    if (!(e instanceof SimError)) { console.error('Symulator', e.message); logEvent('symulator', e.message, { order: o.id }); }
    res.status(e instanceof SimError ? 400 : 502).json({ error: e instanceof SimError ? e.message : 'Symulator jest chwilowo niedostępny. Spróbuj za chwilę.' });
  }
});

// Ogłoszenie ze zdjęcia: bez AI w trybie DEMO wstawiamy przykład, na prawdziwej stronie odsyłamy do wklejenia treści.
app.post('/api/ad-image', express.json({ limit: '8mb' }), async (req, res) => {
  if (!fetchLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut lub wklej treść ogłoszenia.' });
  if (!aiEnabled()) {
    if (DEMO) return res.json({ demo: true, title: 'Magazynier', company: 'Hurtownia Sigma', text: 'Poszukujemy magazyniera do pracy w hurtowni. Zakres: przyjmowanie i wydawanie towaru, inwentaryzacja, praca z dokumentacją magazynową. Wymagamy rzetelności i gotowości do pracy zmianowej. Mile widziane uprawnienia na wózki widłowe. Oferujemy umowę o pracę.' });
    return res.status(503).json({ error: 'Odczyt zdjęć jest chwilowo niedostępny.' });
  }
  try { res.json(await adFromImage(req.body?.image)); }
  catch (e) {
    logEvent('ogłoszenie-zdjęcie', e.message);
    res.status(422).json({ error: e instanceof AdImageError ? e.message : e instanceof AiRefusal ? 'Nie udało się odczytać tego zdjęcia.' : 'Nie udało się odczytać zdjęcia.' });
  }
});

app.post('/api/fetch-ad', async (req, res) => {
  if (!fetchLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut lub wklej treść ogłoszenia.' });
  try { res.json(await fetchAd(req.body?.url)); }
  catch (e) {
    let host = ''; try { host = new URL(req.body?.url).hostname; } catch {}
    logEvent('ogłoszenie', e.message, { host });
    res.status(422).json({ error: e instanceof AdError ? e.message : 'Nie udało się odczytać ogłoszenia.' });
  }
});

// Płatność przez Przelewy24. sessionId = numer zamówienia + numer próby, więc wpłatę zawsze da się przypisać do zamówienia.
async function checkout(order, lang) {
  if (DEMO) return { id: order.id, demo: true };
  const attempt = (order.payAttempts || 0) + 1, sessionId = `${order.id}.${attempt}`;
  const { token, url } = await p24Register({
    sessionId, amount: order.total, email: order.profile.email, language: lang || order.uiLang,
    description: `CV Pod Ogłoszenie, zamówienie ${order.id}`,
    urlReturn: `${BASE_URL}/?id=${order.id}`, urlStatus: `${BASE_URL}/api/p24/status`,
  });
  await updateOrder(order.id, { payAttempts: attempt, p24: { sessionId, token } });
  return { id: order.id, url };
}
// Potwierdzenie wpłaty (z powiadomienia albo po powrocie klienta): verify w Przelewy24, potem generowanie.
async function confirmP24(o, p24OrderId, amount, verified = false) {
  if (amount !== o.total) { logEvent('płatność', `Kwota ${amount} nie zgadza się z zamówieniem`, { orderId: o.id }); return false; }
  if (!verified && !(await p24Verify({ sessionId: o.p24.sessionId, orderId: p24OrderId, amount }))) return false;
  await updateOrder(o.id, { payment: { provider: 'przelewy24', orderId: p24OrderId, sessionId: o.p24.sessionId, at: Date.now() } });
  markPaidAndGenerate(o.id).catch(console.error);
  return true;
}
app.post('/api/p24/status', async (req, res) => {
  const n = req.body || {};
  if (!p24Enabled() || !p24NotificationOk(n)) return res.sendStatus(400);
  res.sendStatus(200);
  const o = await getOrder(String(n.sessionId).split('.')[0]);
  if (!o || o.status !== 'pending' || o.p24?.sessionId !== n.sessionId) return;
  confirmP24(o, n.orderId, n.amount).catch((e) => logEvent('płatność', e.message, { orderId: o.id }));
});
// Klient wrócił bez zapłaty: nowa próba płatności dla tego samego zamówienia.
app.post('/api/orders/:id/pay', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'pending') return res.status(409).json({ error: 'To zamówienie jest już opłacone.' });
  try { res.json(await checkout(o)); } catch (e) { logEvent('płatność', e.message, { orderId: o.id }); res.status(502).json({ error: 'Nie udało się otworzyć płatności. Spróbuj za chwilę.' }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { pkg, profile, ads, consent, design, addons, extraLangs, code, reminder, reviewAsk, uiLang, createAccount } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' });
    const a = cleanAds(ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const p = cleanProfile(profile);
    if (!p.name || !/^\S+@\S+\.\S+$/.test(p.email)) return res.status(400).json({ error: 'Podaj imię i nazwisko oraz poprawny e-mail.' });
    if (!p.experience.length && !p.education.length) return res.status(400).json({ error: 'Dodaj doświadczenie lub wykształcenie.' });
    const ad = cleanAddons(addons), langs = usefulExtraLangs(cleanLangs(extraLangs), a);
    const c = await checkCode(code, p.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const disc = discountFor(c, pkg, a.length, ad, false, langs);
    const order = { id: crypto.randomUUID(), pkg, addons: ad, extraLangs: langs, code: c.code || null, discount: disc, total: calcTotal(pkg, a.length, ad, false, langs, disc), profile: p, ads: a, design: cleanDesign(design), reminder: { consent: !!reminder, sent: false }, reviewAsk: { consent: !!reviewAsk, sent: false }, uiLang: ['en', 'uk', 'de'].includes(uiLang) ? uiLang : 'pl', createAccount: !!createAccount, status: 'pending', results: [], revisions: 0, created: Date.now() };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

// Kolejne zamówienie klienta, który już kupował: dane są zapisane, wybiera pakiet (1 ogłoszenie albo Pakiet 3).
app.post('/api/orders/:id/followup', async (req, res) => {
  try {
    const parent = await getOrder(req.params.id);
    if (!parent || parent.status !== 'done') return res.status(409).json({ error: 'Najpierw dokończ poprzednie zamówienie.' });
    const a = cleanAds(req.body?.ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const ad = cleanAddons(req.body?.addons), langs = usefulExtraLangs(cleanLangs(req.body?.extraLangs), a);
    const c = await checkCode(req.body?.code, parent.profile.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const pkg = ['cv', 'cv_letter', 'pack3'].includes(req.body?.pkg) ? req.body.pkg : parent.pkg;
    const disc = discountFor(c, pkg, a.length, ad, true, langs);
    const order = { id: crypto.randomUUID(), uiLang: parent.uiLang, parentId: parent.id, rootId: parent.rootId || parent.id, pkg, addons: ad, extraLangs: langs, code: c.code || null, discount: disc, total: calcTotal(pkg, a.length, ad, true, langs, disc), profile: parent.profile, ads: a, design: parent.design, reminder: { consent: false, sent: false }, status: 'pending', results: [], revisions: 0, created: Date.now() };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

const view = (o, extra = {}) => ({
  ...extra, id: o.id, pkg: o.pkg, addons: o.addons || {}, extraLangs: o.extraLangs || [], total: o.total, status: o.status, results: o.results, error: o.error, mail: o.mail,
  design: cleanDesign(o.design), photo: o.profile.photo || '', email: o.profile.email, parentId: o.parentId || null,
  createAccount: !!o.createAccount, canPay: o.status === 'pending' && !DEMO, revisionsLeft: MAX_REVISIONS - (o.revisions || 0), expires: (o.created || 0) + RETENTION_MS,
});

// Stan zamówienia; po powrocie z Przelewy24 sprawdza płatność u źródła (gdyby powiadomienie się spóźniło).
app.get('/api/orders/:id', async (req, res) => {
  let o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  if (o.status === 'pending' && !DEMO && o.p24?.sessionId) {
    const t = await p24BySession(o.p24.sessionId);
    if (t && (t.status === 1 || t.status === 2) && (await confirmP24(o, t.orderId, t.amount, t.status === 2).catch(() => false))) o = await getOrder(o.id);
  }
  // Kod klienta (−10 zł dla niego i znajomych) z liczbą użyć.
  let myCode = null;
  if (o.status === 'done' && o.myCode) {
    const c = await codes.get(o.myCode);
    if (c && Date.now() < c.expires) myCode = { code: c.id, discount: c.amount / 100, expires: c.expires, uses: (c.usedBy || []).length, usedByMe: (c.usedBy || []).includes(emailHash(o.profile.email)) };
  }
  const rv = await reviews.get(o.id);
  res.json(view(o, { myCode, review: rv ? { rating: rv.rating, text: rv.text } : null }));
});

// Opinia klienta: tylko po gotowym zamówieniu, jedna na zamówienie (można ją zmienić).
app.post('/api/orders/:id/review', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'done') return res.status(409).json({ error: 'Opinię wystawisz po otrzymaniu dokumentów.' });
  const rating = Number.parseInt(req.body?.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Wybierz ocenę od 1 do 5 gwiazdek.' });
  const text = str(req.body?.text, 500), name = str(req.body?.name, 40), publish = !!req.body?.publish && !!text;
  await reviews.upsert(o.id, (p) => ({ rating, text, name: name || 'Klient', publish, pkg: o.pkg, status: p && p.text === text && p.publish === publish ? p.status : 'new', created: p?.created || Date.now(), updated: Date.now() }));
  res.json({ ok: true });
});

// Opinie na stronę główną: średnia ze wszystkich ocen, treść tylko zatwierdzonych i za zgodą autora.
app.get('/api/reviews', async (_req, res) => {
  const all = Object.values(await reviews.all()).filter((r) => r.status !== 'spam');
  const shown = all.filter((r) => r.status === 'approved' && r.publish && r.text).sort((a, b) => b.created - a.created).slice(0, 9);
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    count: all.length, avg: all.length ? Math.round((10 * all.reduce((s, r) => s + r.rating, 0)) / all.length) / 10 : null,
    list: shown.map((r) => ({ name: r.name, rating: r.rating, text: r.text, pkg: PACKAGES[r.pkg]?.name || '', date: r.created })),
  });
});

// Licznik na stronę główną: pokazujemy go dopiero od 1000 przygotowanych CV.
const COUNTER_FROM = 1000;
app.get('/api/public-stats', async (_req, res) => {
  const t = (await stats.get('totals')) || {};
  res.set('Cache-Control', 'public, max-age=600').json({ cvs: (t.cvs || 0) >= COUNTER_FROM ? t.cvs : null });
});

// Tylko tryb DEMO: symulacja płatności.
app.post('/api/orders/:id/demo-pay', async (req, res) => {
  if (!DEMO) return res.sendStatus(404);
  const o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  await markPaidAndGenerate(o.id);
  res.json({ ok: true });
});

// Wysyłka e-mailem nigdy nie psuje zamówienia: błąd tylko zapisujemy, a klient pobiera dokumenty na stronie.
async function trySend(order) {
  const to = order.profile.email;
  if (!mailEnabled()) return { status: 'skipped', to };
  try { await sendOrderMail(order, BASE_URL); return { status: 'sent', to, at: Date.now() }; }
  catch (e) { console.error('Wysyłka e-mail nie powiodła się', order.id, e.message); logEvent('e-mail', e.message, { orderId: order.id }); return { status: 'failed', to, at: Date.now() }; }
}

// Po opłaceniu: zapisujemy użycie kodu i dajemy klientowi jego kod (jeden na klienta, także przy kolejnych zamówieniach).
async function afterPaid(o) {
  try {
    if (o.code) await codes.update(o.code, (c) => ({ ...c, usedBy: [...new Set([...(c.usedBy || []), emailHash(o.profile.email)])] }));
    const root = o.rootId || o.parentId || o.id;
    const existing = Object.values(await codes.all()).find((c) => c.ownerOrderId === root);
    if (existing) return existing.id;
    const mine = { id: newCode('KOD'), amount: CODE_DISCOUNT, ownerOrderId: root, usedBy: [], created: Date.now(), expires: Date.now() + CODE_TTL };
    await codes.save(mine);
    return mine.id;
  } catch (e) { console.error('Kody po płatności', o.id, e.message); return null; }
}

const inFlight = new Set();
async function markPaidAndGenerate(id) {
  const o = await getOrder(id);
  if (!o || o.status !== 'pending' || inFlight.has(id)) return;
  inFlight.add(id);
  try {
    await updateOrder(id, (x) => ({ ...x, status: 'generating', paidAt: x.paidAt || Date.now() }));
    const withLetter = hasLetter(o.pkg);
    const results = await Promise.all(o.ads.map(async (ad) => {
      const r = await generateForAd({ profile: o.profile, ad, withLetter, addons: o.addons });
      const langs = (o.extraLangs || []).filter((l) => l !== r.lang);
      if (langs.length) r.variants = Object.fromEntries(await Promise.all(langs.map(async (l) => [l, await translateResult(r, l)])));
      return r;
    }));
    const myCode = await afterPaid(o);
    const mail = await trySend({ ...o, results, myCode });
    await updateOrder(id, { status: 'done', results, mail, myCode });
    stats.upsert('totals', (p = {}) => ({ cvs: (p.cvs || 0) + results.length, orders: (p.orders || 0) + 1 })).catch(() => {});
  } catch (e) {
    console.error('Generowanie nie powiodło się', id, e);
    logEvent('generowanie', e.message, { orderId: id });
    await updateOrder(id, { status: 'paid', error: 'Generowanie nie powiodło się. Spróbuj ponownie.' });
  } finally { inFlight.delete(id); }
}

const doneOrder = async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'done') { res.sendStatus(409); return null; }
  const i = Number.parseInt(req.params.i ?? req.body?.i, 10);
  if (!(i >= 0 && i < o.results.length)) { res.status(400).json({ error: 'Nieznany dokument.' }); return null; }
  return { o, i };
};

// Dodatek „Word”: edytowalne CV lub list (.docx) dla wybranego dokumentu i wersji językowej.
app.get('/api/orders/:id/docx/:i', async (req, res) => {
  const d = await doneOrder(req, res); if (!d) return;
  if (!d.o.addons?.docx) return res.status(403).json({ error: 'Wersja Word nie była zamówiona.' });
  const base = d.o.results[d.i], r = base.variants?.[str(req.query.lang, 5)] || base, doc = req.query.doc === 'letter' && hasLetter(d.o.pkg) ? 'letter' : 'cv';
  const name = `${doc === 'letter' ? 'List-motywacyjny' : 'CV'}-${(r.cv?.name || 'dokument').normalize('NFD').replace(/[^\w ]/g, '').trim().replace(/\s+/g, '-')}${r.lang && r.lang !== 'pl' ? '-' + r.lang.toUpperCase() : ''}.docx`;
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="${name}"` }).send(await renderDocx(r, doc, d.o.design));
});

// Ręczna edycja treści przez klienta.
app.put('/api/orders/:id/results/:i', async (req, res) => {
  const d = await doneOrder(req, res); if (!d) return;
  const lang = str(req.body?.lang, 5), base = d.o.results[d.i];
  const r = { ...(base.variants?.[lang] || base) };
  if (req.body?.cv) r.cv = cleanCv(req.body.cv);
  if (typeof req.body?.letter === 'string' && hasLetter(d.o.pkg)) r.letter = str(req.body.letter, 8000);
  const merged = base.variants?.[lang] ? { ...base, variants: { ...base.variants, [lang]: r } } : { ...r, variants: base.variants };
  const results = d.o.results.map((x, k) => (k === d.i ? merged : x));
  await updateOrder(d.o.id, { results });
  res.json({ result: merged });
});

// Darmowa poprawka: klient opisuje zmianę, AI poprawia dokument (limit na zamówienie).
app.post('/api/orders/:id/revise', async (req, res) => {
  const d = await doneOrder(req, res); if (!d) return;
  const { o, i } = d;
  if ((o.revisions || 0) >= MAX_REVISIONS) return res.status(429).json({ error: 'Wykorzystano limit poprawek. Napisz do nas, jeśli dokument nadal wymaga zmian.' });
  const doc = req.body?.doc === 'letter' && hasLetter(o.pkg) ? 'letter' : 'cv';
  const instruction = str(req.body?.instruction, 500);
  if (instruction.length < 3) return res.status(400).json({ error: 'Opisz, co zmienić.' });
  try {
    const lang = str(req.body?.lang, 5), base = o.results[i], target = base.variants?.[lang] || base;
    const out = await reviseDoc({ profile: o.profile, ad: o.ads[i], result: target, doc, instruction });
    const r = { ...target, ...(doc === 'letter' ? { letter: str(out.letter, 8000) } : { cv: cleanCv(out.cv) }) };
    // Klient dopisał brakujące wymaganie: przenosimy je w raporcie do spełnionych.
    const resolves = str(req.body?.resolves, 120);
    if (resolves && r.match?.missing?.some((m) => m.keyword === resolves)) {
      const found = [...r.match.found, resolves], missing = r.match.missing.filter((m) => m.keyword !== resolves);
      r.match = { found, missing, score: Math.round((100 * found.length) / (found.length + missing.length)) };
    }
    const merged = base.variants?.[lang] ? { ...base, variants: { ...base.variants, [lang]: r } } : { ...r, variants: base.variants };
    const results = o.results.map((x, k) => (k === i ? merged : x));
    await updateOrder(o.id, { results, revisions: (o.revisions || 0) + 1 });
    res.json({ result: merged, note: str(out.note, 300), revisionsLeft: MAX_REVISIONS - (o.revisions || 0) - 1 });
  } catch (e) {
    console.error('Poprawka', o.id, e.message);
    res.status(502).json({ error: e instanceof AiRefusal ? 'Nie możemy wprowadzić tej zmiany. Spróbuj opisać ją inaczej.' : 'Poprawka się nie udała. Spróbuj ponownie za chwilę.' });
  }
});

// Klient może zmienić szablon i kolor po zakupie (bez dopłaty); kolejne maile idą w nowym wyglądzie.
app.post('/api/orders/:id/design', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  const design = cleanDesign(req.body);
  await updateOrder(o.id, { design });
  res.json({ design });
});

app.post('/api/orders/:id/resend', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'done') return res.sendStatus(409);
  if (o.mail?.at && Date.now() - o.mail.at < 60_000) return res.status(429).json({ error: 'Poczekaj minutę przed ponowną wysyłką.' });
  const mail = await trySend(o);
  await updateOrder(o.id, { mail });
  res.json({ mail });
});

app.post('/api/orders/:id/retry', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'paid') return res.sendStatus(409);
  await updateOrder(o.id, { status: 'pending', error: null });
  markPaidAndGenerate(o.id).catch(console.error);
  res.json({ ok: true });
});

accountRoutes(app, { BASE_URL, DEMO });
analyticsRoutes(app, BASE_URL);
adminRoutes(app, { DEMO, BASE_URL, markPaidAndGenerate, trySend, retentionMs: RETENTION_MS });

// Dane zamówień (w tym zdjęcia) kasujemy po 30 dniach.
// Co godzinę: kasowanie starych zamówień i kodów oraz jednorazowe przypomnienie po 7 dniach (tylko za zgodą klienta).
async function hourly() {
  try {
    const n = await deleteOlderThan(RETENTION_MS);
    if (n) console.log(`Usunięto ${n} zamówień starszych niż 30 dni`);
    await codes.deleteWhere((c) => Date.now() > c.expires);
    await cleanupEvents(RETENTION_MS);
    await cleanupAnalytics().catch(() => {});
    await accountHourly(BASE_URL).catch((e) => console.error('Konta', e.message));
    if (!mailEnabled()) return;
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.reminder?.consent || o.reminder.sent || Date.now() - o.created < REMINDER_AFTER) continue;
      try { await sendReminder(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, reminder: { ...x.reminder, sent: true, at: Date.now() } })); }
      catch (e) { console.error('Przypomnienie', o.id, e.message); }
    }
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.reviewAsk?.consent || o.reviewAsk.sent || Date.now() - o.created < REVIEW_AFTER || (await reviews.get(o.id))) continue;
      try { await sendReviewAsk(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, reviewAsk: { ...x.reviewAsk, sent: true, at: Date.now() } })); }
      catch (e) { console.error('Prośba o opinię', o.id, e.message); }
    }
  } catch (e) { console.error('Zadanie cogodzinne', e); }
}
hourly(); setInterval(hourly, 3600_000).unref();

app.listen(PORT, () => console.log(`http://localhost:${PORT}  ${DEMO ? '[TRYB DEMO – brak konfiguracji Przelewy24]' : ''}${aiEnabled() ? '' : ' [bez AI – brak ANTHROPIC_API_KEY]'}`));
