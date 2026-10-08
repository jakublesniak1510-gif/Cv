import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { lineItems, calcTotal, MAX_ADS, PRICES } from './lib/pricing.js';
import { getOrder, saveOrder, updateOrder, deleteOlderThan } from './lib/store.js';
import { generateForAd, reviseDoc } from './lib/generate.js';
import { aiEnabled, AiRefusal } from './lib/ai.js';
import { fetchAd, AdError } from './lib/fetchAd.js';
import { importCv, ImportError } from './lib/importCv.js';
import { mailEnabled, sendOrderMail } from './lib/mail.js';
import { cleanDesign } from './lib/designs.js';
import { seoRoutes } from './lib/seo.js';

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const DEMO = !stripe;
const RETENTION_MS = 30 * 24 * 3600 * 1000;
const MAX_REVISIONS = 10;

const app = express();
app.set('trust proxy', 1);

// --- Webhook Stripe (surowe body, przed express.json) ---
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(404);
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); } catch { return res.sendStatus(400); }
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const id = event.data.object.client_reference_id;
    if (id) markPaidAndGenerate(id).catch(console.error);
  }
  res.sendStatus(200);
});

// Prosty limit zapytań na adres IP.
const limiter = (max, windowMs) => { const hits = new Map(); return (req) => { const now = Date.now(), h = (hits.get(req.ip) || []).filter((t) => now - t < windowMs); if (h.length >= max) return false; hits.set(req.ip, [...h, now]); return true; }; };
const importLimit = limiter(10, 600_000), fetchLimit = limiter(20, 600_000);

// --- Import starego CV (większy limit body, więc przed globalnym parserem) ---
app.post('/api/import', express.json({ limit: '8mb' }), async (req, res) => {
  if (!importLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut.' });
  const b64 = typeof req.body?.data === 'string' ? req.body.data : '';
  const buf = Buffer.from(b64, 'base64');
  if (!buf.length || buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Plik musi mieć do 5 MB.' });
  try { res.json(await importCv(buf)); }
  catch (e) { console.error('Import CV', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się odczytać pliku. Wpisz dane ręcznie.' }); }
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
const cleanAds = (ads) => arr(ads, MAX_ADS).map((a) => ({ title: str(a?.title, 100), text: str(a?.text, 10000), lang: ['pl', 'en'].includes(a?.lang) ? a.lang : 'auto' })).filter((a) => a.text.length >= 80);
const cleanAddons = (a = {}) => ({ interview: !!a.interview, messages: !!a.messages });
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
  demo: DEMO, ai: aiEnabled(), maxAds: MAX_ADS, noPrint: false, maxRevisions: MAX_REVISIONS,
  prices: Object.fromEntries(Object.entries(PRICES).map(([k, v]) => [k, v / 100])),
}));

app.post('/api/fetch-ad', async (req, res) => {
  if (!fetchLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut lub wklej treść ogłoszenia.' });
  try { res.json(await fetchAd(req.body?.url)); }
  catch (e) { res.status(422).json({ error: e instanceof AdError ? e.message : 'Nie udało się odczytać ogłoszenia.' }); }
});

async function checkout(order) {
  if (DEMO) return { id: order.id, demo: true };
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', client_reference_id: order.id, customer_email: order.profile.email,
    line_items: lineItems(order.pkg, order.ads.length, order.addons, !!order.parentId).map((i) => ({
      quantity: i.quantity, price_data: { currency: 'pln', unit_amount: i.amount, product_data: { name: i.name } },
    })),
    success_url: `${BASE_URL}/?id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: order.parentId ? `${BASE_URL}/?id=${order.parentId}` : `${BASE_URL}/?canceled=1`,
  });
  await updateOrder(order.id, { stripeSession: session.id });
  return { id: order.id, url: session.url };
}

app.post('/api/orders', async (req, res) => {
  try {
    const { pkg, profile, ads, consent, design, addons } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' });
    const a = cleanAds(ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const p = cleanProfile(profile);
    if (!p.name || !/^\S+@\S+\.\S+$/.test(p.email)) return res.status(400).json({ error: 'Podaj imię i nazwisko oraz poprawny e-mail.' });
    if (!p.experience.length && !p.education.length) return res.status(400).json({ error: 'Dodaj doświadczenie lub wykształcenie.' });
    const ad = cleanAddons(addons);
    const order = { id: crypto.randomUUID(), pkg, addons: ad, total: calcTotal(pkg, a.length, ad), profile: p, ads: a, design: cleanDesign(design), status: 'pending', results: [], revisions: 0, created: Date.now() };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

// Kolejne ogłoszenia dla klienta, który już zamówił: dane są zapisane, płaci 20 zł za ogłoszenie.
app.post('/api/orders/:id/followup', async (req, res) => {
  try {
    const parent = await getOrder(req.params.id);
    if (!parent || parent.status !== 'done') return res.status(409).json({ error: 'Najpierw dokończ poprzednie zamówienie.' });
    const a = cleanAds(req.body?.ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const ad = cleanAddons(req.body?.addons);
    const order = { id: crypto.randomUUID(), parentId: parent.id, pkg: parent.pkg, addons: ad, total: calcTotal(parent.pkg, a.length, ad, true), profile: parent.profile, ads: a, design: parent.design, status: 'pending', results: [], revisions: 0, created: Date.now() };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

const view = (o) => ({
  id: o.id, pkg: o.pkg, addons: o.addons || {}, total: o.total, status: o.status, results: o.results, error: o.error, mail: o.mail,
  design: cleanDesign(o.design), photo: o.profile.photo || '', email: o.profile.email, parentId: o.parentId || null,
  revisionsLeft: MAX_REVISIONS - (o.revisions || 0), expires: (o.created || 0) + RETENTION_MS,
});

// Stan zamówienia; po powrocie ze Stripe weryfikuje płatność u źródła.
app.get('/api/orders/:id', async (req, res) => {
  let o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  if (o.status === 'pending' && stripe && o.stripeSession) {
    const s = await stripe.checkout.sessions.retrieve(o.stripeSession).catch(() => null);
    if (s?.payment_status === 'paid') { await markPaidAndGenerate(o.id); o = await getOrder(o.id); }
  }
  res.json(view(o));
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
  catch (e) { console.error('Wysyłka e-mail nie powiodła się', order.id, e.message); return { status: 'failed', to, at: Date.now() }; }
}

const inFlight = new Set();
async function markPaidAndGenerate(id) {
  const o = await getOrder(id);
  if (!o || o.status !== 'pending' || inFlight.has(id)) return;
  inFlight.add(id);
  try {
    await updateOrder(id, { status: 'generating' });
    const withLetter = o.pkg === 'cv_letter';
    const results = await Promise.all(o.ads.map((ad) => generateForAd({ profile: o.profile, ad, withLetter, addons: o.addons })));
    const mail = await trySend({ ...o, results });
    await updateOrder(id, { status: 'done', results, mail });
  } catch (e) {
    console.error('Generowanie nie powiodło się', id, e);
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

// Ręczna edycja treści przez klienta.
app.put('/api/orders/:id/results/:i', async (req, res) => {
  const d = await doneOrder(req, res); if (!d) return;
  const r = { ...d.o.results[d.i] };
  if (req.body?.cv) r.cv = cleanCv(req.body.cv);
  if (typeof req.body?.letter === 'string' && d.o.pkg === 'cv_letter') r.letter = str(req.body.letter, 8000);
  const results = d.o.results.map((x, k) => (k === d.i ? r : x));
  await updateOrder(d.o.id, { results });
  res.json({ result: r });
});

// Darmowa poprawka: klient opisuje zmianę, AI poprawia dokument (limit na zamówienie).
app.post('/api/orders/:id/revise', async (req, res) => {
  const d = await doneOrder(req, res); if (!d) return;
  const { o, i } = d;
  if ((o.revisions || 0) >= MAX_REVISIONS) return res.status(429).json({ error: 'Wykorzystano limit poprawek. Napisz do nas, jeśli dokument nadal wymaga zmian.' });
  const doc = req.body?.doc === 'letter' && o.pkg === 'cv_letter' ? 'letter' : 'cv';
  const instruction = str(req.body?.instruction, 500);
  if (instruction.length < 3) return res.status(400).json({ error: 'Opisz, co zmienić.' });
  try {
    const out = await reviseDoc({ profile: o.profile, ad: o.ads[i], result: o.results[i], doc, instruction });
    const r = { ...o.results[i], ...(doc === 'letter' ? { letter: str(out.letter, 8000) } : { cv: cleanCv(out.cv) }) };
    // Klient dopisał brakujące wymaganie: przenosimy je w raporcie do spełnionych.
    const resolves = str(req.body?.resolves, 120);
    if (resolves && r.match?.missing?.some((m) => m.keyword === resolves)) {
      const found = [...r.match.found, resolves], missing = r.match.missing.filter((m) => m.keyword !== resolves);
      r.match = { found, missing, score: Math.round((100 * found.length) / (found.length + missing.length)) };
    }
    const results = o.results.map((x, k) => (k === i ? r : x));
    await updateOrder(o.id, { results, revisions: (o.revisions || 0) + 1 });
    res.json({ result: r, note: str(out.note, 300), revisionsLeft: MAX_REVISIONS - (o.revisions || 0) - 1 });
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

// Dane zamówień (w tym zdjęcia) kasujemy po 30 dniach.
const cleanup = () => deleteOlderThan(RETENTION_MS).then((n) => n && console.log(`Usunięto ${n} zamówień starszych niż 30 dni`)).catch(console.error);
cleanup(); setInterval(cleanup, 3600_000).unref();

app.listen(PORT, () => console.log(`http://localhost:${PORT}  ${DEMO ? '[TRYB DEMO – brak STRIPE_SECRET_KEY]' : ''}${aiEnabled() ? '' : ' [bez AI – brak ANTHROPIC_API_KEY]'}`));
