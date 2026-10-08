import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { lineItems, calcTotal, MAX_ADS, PRICES, LANGS, CODE_DISCOUNT, withLetter as hasLetter } from './lib/pricing.js';
import { getOrder, saveOrder, updateOrder, deleteOlderThan, allOrders, codes } from './lib/store.js';
import { generateForAd, reviseDoc, translateResult, scanCv, assistant } from './lib/generate.js';
import { aiEnabled, AiRefusal } from './lib/ai.js';
import { fetchAd, AdError } from './lib/fetchAd.js';
import { importCv, extractText, ImportError } from './lib/importCv.js';
import { mailEnabled, sendOrderMail, sendReminder } from './lib/mail.js';
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
const importLimit = limiter(10, 600_000), fetchLimit = limiter(20, 600_000), scanLimit = limiter(6, 3600_000), chatLimit = limiter(30, 3600_000);
const CODE_TTL = 90 * 24 * 3600 * 1000, REMINDER_AFTER = 7 * 24 * 3600 * 1000;

// --- Import starego CV (większy limit body, więc przed globalnym parserem) ---
app.post('/api/import', express.json({ limit: '8mb' }), async (req, res) => {
  if (!importLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut.' });
  const b64 = typeof req.body?.data === 'string' ? req.body.data : '';
  const buf = Buffer.from(b64, 'base64');
  if (!buf.length || buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Plik musi mieć do 5 MB.' });
  try { res.json(await importCv(buf)); }
  catch (e) { console.error('Import CV', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się odczytać pliku. Wpisz dane ręcznie.' }); }
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
  } catch (e) { console.error('Skaner', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się ocenić CV. Spróbuj ponownie.' }); }
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
  return { code, discount: c.amount };
}
const newCode = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6)}`;
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
  demo: DEMO, ai: aiEnabled(), maxAds: MAX_ADS, noPrint: false, maxRevisions: MAX_REVISIONS, langs: LANGS, codeDiscount: CODE_DISCOUNT / 100,
  prices: Object.fromEntries(Object.entries(PRICES).map(([k, v]) => [k, v / 100])),
}));

app.get('/api/code/:code', async (req, res) => {
  const r = await checkCode(req.params.code, req.query.email);
  if (r.error) return res.status(404).json({ error: r.error });
  res.json({ code: r.code, discount: r.discount / 100, label: 'Kod rabatowy' });
});

// Asystent: krótkie odpowiedzi na pytania o CV (limit na IP).
app.post('/api/assistant', async (req, res) => {
  if (!chatLimit(req)) return res.status(429).json({ error: 'Za dużo pytań w krótkim czasie. Spróbuj za chwilę.' });
  const history = arr(req.body?.messages, 12).map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: str(m?.content, 1000) })).filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'Zadaj pytanie.' });
  try { res.json({ answer: await assistant(history) }); }
  catch (e) { console.error('Asystent', e.message); res.status(502).json({ error: 'Asystent jest chwilowo niedostępny. Zajrzyj do FAQ albo poradnika.' }); }
});

app.post('/api/fetch-ad', async (req, res) => {
  if (!fetchLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut lub wklej treść ogłoszenia.' });
  try { res.json(await fetchAd(req.body?.url)); }
  catch (e) { res.status(422).json({ error: e instanceof AdError ? e.message : 'Nie udało się odczytać ogłoszenia.' }); }
});

async function checkout(order) {
  if (DEMO) return { id: order.id, demo: true };
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', client_reference_id: order.id, customer_email: order.profile.email,
    line_items: lineItems(order.pkg, order.ads.length, order.addons, !!order.parentId, order.extraLangs, order.discount).map((i) => ({
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
    const { pkg, profile, ads, consent, design, addons, extraLangs, code, reminder } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' });
    const a = cleanAds(ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const p = cleanProfile(profile);
    if (!p.name || !/^\S+@\S+\.\S+$/.test(p.email)) return res.status(400).json({ error: 'Podaj imię i nazwisko oraz poprawny e-mail.' });
    if (!p.experience.length && !p.education.length) return res.status(400).json({ error: 'Dodaj doświadczenie lub wykształcenie.' });
    const ad = cleanAddons(addons), langs = cleanLangs(extraLangs);
    const c = await checkCode(code, p.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const order = { id: crypto.randomUUID(), pkg, addons: ad, extraLangs: langs, code: c.code || null, discount: c.discount || 0, total: calcTotal(pkg, a.length, ad, false, langs, c.discount || 0), profile: p, ads: a, design: cleanDesign(design), reminder: { consent: !!reminder, sent: false }, status: 'pending', results: [], revisions: 0, created: Date.now() };
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
    const ad = cleanAddons(req.body?.addons), langs = cleanLangs(req.body?.extraLangs);
    const c = await checkCode(req.body?.code, parent.profile.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const pkg = ['cv', 'cv_letter', 'pack3'].includes(req.body?.pkg) ? req.body.pkg : parent.pkg;
    const order = { id: crypto.randomUUID(), parentId: parent.id, rootId: parent.rootId || parent.id, pkg, addons: ad, extraLangs: langs, code: c.code || null, discount: c.discount || 0, total: calcTotal(pkg, a.length, ad, true, langs, c.discount || 0), profile: parent.profile, ads: a, design: parent.design, reminder: { consent: false, sent: false }, status: 'pending', results: [], revisions: 0, created: Date.now() };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

const view = (o, extra = {}) => ({
  ...extra, id: o.id, pkg: o.pkg, addons: o.addons || {}, extraLangs: o.extraLangs || [], total: o.total, status: o.status, results: o.results, error: o.error, mail: o.mail,
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
  // Kod klienta (−10 zł dla niego i znajomych) z liczbą użyć.
  let myCode = null;
  if (o.status === 'done' && o.myCode) {
    const c = await codes.get(o.myCode);
    if (c && Date.now() < c.expires) myCode = { code: c.id, discount: c.amount / 100, expires: c.expires, uses: (c.usedBy || []).length, usedByMe: (c.usedBy || []).includes(emailHash(o.profile.email)) };
  }
  res.json(view(o, { myCode }));
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
    await updateOrder(id, { status: 'generating' });
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

// Dane zamówień (w tym zdjęcia) kasujemy po 30 dniach.
// Co godzinę: kasowanie starych zamówień i kodów oraz jednorazowe przypomnienie po 7 dniach (tylko za zgodą klienta).
async function hourly() {
  try {
    const n = await deleteOlderThan(RETENTION_MS);
    if (n) console.log(`Usunięto ${n} zamówień starszych niż 30 dni`);
    await codes.deleteWhere((c) => Date.now() > c.expires);
    if (!mailEnabled()) return;
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.reminder?.consent || o.reminder.sent || Date.now() - o.created < REMINDER_AFTER) continue;
      try { await sendReminder(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, reminder: { ...x.reminder, sent: true, at: Date.now() } })); }
      catch (e) { console.error('Przypomnienie', o.id, e.message); }
    }
  } catch (e) { console.error('Zadanie cogodzinne', e); }
}
hourly(); setInterval(hourly, 3600_000).unref();

app.listen(PORT, () => console.log(`http://localhost:${PORT}  ${DEMO ? '[TRYB DEMO – brak STRIPE_SECRET_KEY]' : ''}${aiEnabled() ? '' : ' [bez AI – brak ANTHROPIC_API_KEY]'}`));
