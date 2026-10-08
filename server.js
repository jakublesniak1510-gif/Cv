import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { calcTotal, MAX_ADS } from './lib/pricing.js';
import { getOrder, saveOrder, updateOrder } from './lib/store.js';
import { generateForAd } from './lib/generate.js';

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const DEMO = !stripe;

const app = express();

// --- Webhook Stripe (musi dostać surowe body, przed express.json) ---
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(404);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return res.sendStatus(400); }
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const id = event.data.object.client_reference_id;
    if (id) markPaidAndGenerate(id).catch(console.error);
  }
  res.sendStatus(200);
});

app.use(express.json({ limit: '200kb' }));
app.use(express.static('public'));

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

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
  };
}

app.get('/api/config', (_req, res) => res.json({ demo: DEMO, maxAds: MAX_ADS }));

app.post('/api/orders', async (req, res) => {
  try {
    const { pkg, profile, ads, consent } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' });
    const cleanAds = arr(ads, MAX_ADS).map((a) => ({ text: str(a?.text, 10000) })).filter((a) => a.text.length >= 80);
    if (!cleanAds.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const p = cleanProfile(profile);
    if (!p.name || !/^\S+@\S+\.\S+$/.test(p.email)) return res.status(400).json({ error: 'Podaj imię i nazwisko oraz poprawny e-mail.' });
    if (!p.experience.length && !p.education.length) return res.status(400).json({ error: 'Dodaj doświadczenie lub wykształcenie.' });

    const total = calcTotal(pkg, cleanAds.length); // cena zawsze liczona po stronie serwera
    const id = crypto.randomUUID();
    const order = {
      id, pkg, total, profile: p, ads: cleanAds, status: 'pending', results: [], created: Date.now(),
    };
    await saveOrder(order);

    if (DEMO) return res.json({ id, url: `/order.html?id=${id}&demo=1` });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: id,
      customer_email: p.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'pln', unit_amount: total,
          product_data: { name: `${pkg === 'cv' ? 'CV' : 'CV + list motywacyjny'} (ogłoszeń: ${cleanAds.length})` },
        },
      }],
      success_url: `${BASE_URL}/order.html?id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/?canceled=1`,
    });
    await updateOrder(id, { stripeSession: session.id });
    res.json({ id, url: session.url });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'Błąd' });
  }
});

// Pobiera stan zamówienia; po powrocie ze Stripe weryfikuje płatność u źródła.
app.get('/api/orders/:id', async (req, res) => {
  let o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  if (o.status === 'pending' && stripe && o.stripeSession) {
    const s = await stripe.checkout.sessions.retrieve(o.stripeSession).catch(() => null);
    if (s?.payment_status === 'paid') { await markPaidAndGenerate(o.id); o = await getOrder(o.id); }
  }
  res.json({ id: o.id, pkg: o.pkg, total: o.total, status: o.status, results: o.results, error: o.error });
});

// Tylko tryb DEMO: symulacja płatności.
app.post('/api/orders/:id/demo-pay', async (req, res) => {
  if (!DEMO) return res.sendStatus(404);
  const o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  await markPaidAndGenerate(o.id);
  res.json({ ok: true });
});

const inFlight = new Set();
async function markPaidAndGenerate(id) {
  const o = await getOrder(id);
  if (!o || o.status !== 'pending' || inFlight.has(id)) return;
  inFlight.add(id);
  try {
    await updateOrder(id, { status: 'generating' });
    const withLetter = o.pkg === 'cv_letter';
    const results = await Promise.all(o.ads.map((ad) => generateForAd({ profile: o.profile, ad, withLetter })));
    await updateOrder(id, { status: 'done', results });
  } catch (e) {
    console.error('Generowanie nie powiodło się', id, e);
    // Płatność zostaje opłacona; status 'paid' pozwala ponowić generowanie.
    await updateOrder(id, { status: 'paid', error: 'Generowanie nie powiodło się. Spróbuj ponownie.' });
  } finally { inFlight.delete(id); }
}

app.post('/api/orders/:id/retry', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'paid') return res.sendStatus(409);
  await updateOrder(o.id, { status: 'pending', error: null });
  markPaidAndGenerate(o.id).catch(console.error);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}  ${DEMO ? '[TRYB DEMO – brak STRIPE_SECRET_KEY]' : ''}`));
