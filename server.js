import 'dotenv/config';
import path from 'node:path';
import fsp from 'node:fs/promises';
import express from 'express';
import crypto from 'node:crypto';
import { activePromo, ensurePromoCode } from './lib/promos.js';
import { checkPhoto, recruiterAnswer, ToolError } from './lib/freeTools.js';
import { alertRoutes, alertsHourly, addAlertFromOrder } from './lib/alerts.js';
import { calcTotal, MAX_ADS, PRICES, LANGS, CODE_DISCOUNT, PACKAGES, ADDONS, BUNDLE_OFF, withLetter as hasLetter } from './lib/pricing.js';
import { getOrder, saveOrder, updateOrder, deleteOlderThan, allOrders, codes, reviews, stats, leads } from './lib/store.js';
import { generateForAd, reviseDoc, translateResult, scanCv, assistant } from './lib/generate.js';
import { aiEnabled, AiRefusal } from './lib/ai.js';
import { fetchAd, AdError } from './lib/fetchAd.js';
import { adFromImage, AdImageError } from './lib/adImage.js';
import { simTurn, SimError } from './lib/sim.js';
import { samplePdf } from './lib/sample.js';
import { importCv, extractText, ImportError } from './lib/importCv.js';
import { mailEnabled, sendOrderMail, sendReminder, sendFollowUp, sendReviewAsk, sendPayReminder, sendAdminAlert, sendInvoiceMail, sendOwnerMail } from './lib/mail.js';
import { socialRoutes, cleanupChats } from './lib/social.js';
import { b2bRoutes, b2bOrders, fulfillB2b, b2bRefunded, cleanupPartnerApps } from './lib/b2b.js';
import { b2bMonthly } from './lib/b2b-monthly.js';
import { crmHourly } from './lib/crm.js';
import { growthRoutes, welcomeSeries, telegramHourly, rememberScan } from './lib/growth.js';
import { sendPurchase, adContext } from './lib/capi.js';
import { draftRoutes } from './lib/drafts.js';
import { cleanDesign } from './lib/designs.js';
import { usefulExtraLangs } from './lib/lang.js';
import { seoRoutes, sendNotFound } from './lib/seo.js';
import { p24Enabled, p24Register, p24NotificationOk, p24Verify, p24BySession } from './lib/p24.js';
import { stripeEnabled, stripeCheckout, stripeSession, stripeEvent } from './lib/stripe.js';
import { recordSale, notifyNewOrder, setRefunded, commissionBack, ownerDaily, getSettings, DATA_DIR } from './lib/ops.js';
import { invoices, issueInvoice, renderInvoice, invoiceFile, cleanupInvoices } from './lib/invoice.js';
import { renderDocx } from './lib/docx.js';
import { adminRoutes, isAdmin } from './lib/admin.js';
import { accountRoutes, accountHourly } from './lib/account.js';
import { analyticsRoutes, cleanupAnalytics } from './lib/analytics.js';
import { logEvent, cleanupEvents } from './lib/events.js';
import { leadRoutes, cleanupLeads } from './lib/leads.js';
import { emailHash, codeDiscount, applyPaidCode, isOwner, CODE_TTL } from './lib/referral.js';

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
// Operator płatności: Stripe (gdy jest STRIPE_SECRET_KEY), Przelewy24 albo tryb DEMO. PAY_PROVIDER=p24 wymusza Przelewy24.
const PROVIDER = process.env.PAY_PROVIDER === 'p24' && p24Enabled() ? 'p24' : stripeEnabled() ? 'stripe' : p24Enabled() ? 'p24' : 'demo';
const DEMO = PROVIDER === 'demo';
// Na produkcji bez Przelewy24 sprzedaż jest zamknięta: zamawiać (w trybie demo) może tylko zalogowany administrator,
// żeby nikt nie dostał dokumentów z AI za darmo. DEMO_OPEN=1 otwiera tryb demo dla wszystkich (np. do prezentacji).
// Klucz testowy Stripe (sk_test_…) na produkcji: płatności próbne tylko dla admina, sprzedaż dla klientów zamknięta.
const STRIPE_TEST = PROVIDER === 'stripe' && /^sk_test_/.test(process.env.STRIPE_SECRET_KEY || '');
// Zły rodzaj klucza (np. publiczny pk_…): Stripe odrzuci każdą płatność, więc sprzedaż zostaje zamknięta, a w logach jest ostrzeżenie.
const STRIPE_BAD = PROVIDER === 'stripe' && !/^(sk|rk)_(live|test)_/.test(process.env.STRIPE_SECRET_KEY || '');
if (STRIPE_BAD) console.error('STRIPE_SECRET_KEY nie jest kluczem tajnym (sk_live_…): sprzedaż zamknięta.');
const SALES_CLOSED = STRIPE_BAD || ((DEMO || STRIPE_TEST) && process.env.NODE_ENV === 'production' && process.env.DEMO_OPEN !== '1');
const salesClosedFor = (req) => SALES_CLOSED && !isAdmin(req);
const CLOSED_MSG = 'Zamówienia ruszą za kilka dni. Zapisz się do newslettera na dole strony, a damy znać o starcie.';
const RETENTION_MS = 30 * 24 * 3600 * 1000;
const MAX_REVISIONS = 10;

const app = express();
const AD_HOSTS = 'https://*.google.com https://*.google.pl https://*.googleadservices.com https://*.doubleclick.net https://*.googletagmanager.com https://*.google-analytics.com https://*.facebook.com https://*.facebook.net';
const csp = (scripts) => [
  "default-src 'self'", `script-src ${scripts} 'self' https://www.googletagmanager.com https://connect.facebook.net`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com", `img-src 'self' data: blob: ${AD_HOSTS}`, `connect-src 'self' ${AD_HOSTS}`, `frame-src ${AD_HOSTS}`,
  "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
].join('; ');
app.disable('x-powered-by');
// Podstawowe nagłówki bezpieczeństwa: bez osadzania strony w cudzych ramkach (np. podszywanie się pod panel),
// bez zgadywania typu plików, ograniczony Referer, a na https wymuszenie bezpiecznego połączenia.
app.use((req, res, next) => {
  const embed = req.path.startsWith('/embed/'); // widżet skanera można osadzić na stronach partnerów (iframe)
  res.set({ ...(embed ? {} : { 'X-Frame-Options': 'DENY' }), 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' });
  if (BASE_URL.startsWith('https')) res.set('Strict-Transport-Security', 'max-age=15552000');
  // CSP: skrypty tylko z jednorazowym kluczem (nonce) dopisywanym do każdego <script> w HTML z serwera; skrypty, które one
  // dołączą (Google Ads i Meta po zgodzie na cookies), dziedziczą zaufanie ('strict-dynamic'). Panel ma tylko własny plik admin.js.
  const nonce = crypto.randomBytes(16).toString('base64');
  res.set('Content-Security-Policy', csp(req.path === '/admin' ? "'self'" : `'nonce-${nonce}' 'strict-dynamic'`).replace("frame-ancestors 'none'", embed ? 'frame-ancestors *' : "frame-ancestors 'none'"));
  const send = res.send.bind(res);
  res.send = (body) => {
    if (typeof body === 'string' && (/text\/html/.test(res.get('Content-Type') || '') || (!res.get('Content-Type') && body.trimStart().startsWith('<')))) body = body.replace(/<script(?=[\s>])/g, `<script nonce="${nonce}"`);
    return send(body);
  };
  next();
});
app.set('trust proxy', 1);
// Pozostałe domeny serwisu (z „ł” i bez, z www i bez) przekierowują na główny adres z BASE_URL, żeby Google widział jedną stronę.
// Zmiana głównej domeny to tylko zmiana BASE_URL: jej host nigdy nie przekierowuje sam na siebie.
const BASE_HOST = (() => { try { return new URL(BASE_URL).hostname; } catch { return ''; } })();
const ALIAS_HOSTS = new Set((process.env.ALIAS_HOSTS || 'cvpodogloszenie.pl,www.cvpodogloszenie.pl,xn--cvpodogoszenie-mnc.pl,www.xn--cvpodogoszenie-mnc.pl').split(',').map((h) => h.trim().toLowerCase()).filter((h) => h && h !== BASE_HOST));
// Tylko GET/HEAD: webhooki płatności (POST) zapisane w panelach Stripe/P24 pod starym adresem dalej trafiają do serwera.
app.use((req, res, next) => (ALIAS_HOSTS.has(req.hostname) && BASE_URL.startsWith('http') && (req.method === 'GET' || req.method === 'HEAD') ? res.redirect(301, BASE_URL + req.originalUrl) : next()));


// Prosty limit zapytań na adres IP.
const limiter = (max, windowMs) => { const hits = new Map(); return (req) => { const now = Date.now(), h = (hits.get(req.ip) || []).filter((t) => now - t < windowMs); if (h.length >= max) return false; hits.set(req.ip, [...h, now]); return true; }; };
const photoLimit = limiter(5, 3600_000), answerLimit = limiter(8, 3600_000), importLimit = limiter(10, 600_000), fetchLimit = limiter(20, 600_000), scanLimit = limiter(6, 3600_000), chatLimit = limiter(30, 3600_000);
const FOLLOWUP_AFTER = 29 * 24 * 3600 * 1000, REMINDER_AFTER = 7 * 24 * 3600 * 1000, REVIEW_AFTER = 4 * 24 * 3600 * 1000;

// Bot AI na Messengerze i Instagramie (podpis Meta wymaga surowej treści, więc przed globalnym parserem JSON).
socialRoutes(app, {
  answer: assistant,
  notifyOwner: (subject, text) => (mailEnabled() ? sendOwnerMail(subject, text).catch((e) => logEvent('e-mail', `Bot: ${e.message}`)) : null),
});
// --- Import starego CV (większy limit body, więc przed globalnym parserem) ---
// Powiadomienie ze Stripe o płatności (surowa treść potrzebna do sprawdzenia podpisu, więc przed globalnym parserem JSON).
app.post('/api/stripe/webhook', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  const ev = stripeEvent(req.body?.toString('utf8') || '', req.get('stripe-signature'));
  if (!ev) return res.sendStatus(400);
  res.sendStatus(200);
  // Zwrot zrobiony w panelu Stripe (albo z naszego panelu): zapis w zamówieniu i w rejestrze sprzedaży.
  if (ev.type === 'charge.refunded') {
    const ch = ev.data?.object;
    if (String(ch?.metadata?.orderId || '').startsWith('B2B-')) { b2bRefunded(ch.metadata.orderId, ch.amount_refunded || 0).catch((e) => logEvent('płatność', `Zwrot B2B: ${e.message}`)); return; }
    if (ch?.payment_intent) setRefunded({ orderId: ch.metadata?.orderId, paymentIntent: ch.payment_intent, total: ch.amount_refunded || 0, source: 'stripe' })
      .then((r) => r?.changed && r.code && commissionBack(r.code, r.delta)).catch((e) => logEvent('płatność', `Zwrot: ${e.message}`));
    return;
  }
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(ev.type)) return;
  if (String(ev.data?.object?.client_reference_id || '').startsWith('B2B-')) { confirmB2b(null, ev.data.object).catch((e) => logEvent('płatność', `B2B: ${e.message}`)); return; }
  const sess = ev.data?.object, o = sess && (await getOrder(sess.client_reference_id));
  if (o) confirmStripe(o, sess).catch((e) => logEvent('płatność', e.message, { orderId: o.id }));
});
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
    const result = await scanCv({ cvText, adText });
    res.json({ ...result, scanId: rememberScan(result) });
  } catch (e) { console.error('Skaner', e.message); logEvent('skaner', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się ocenić CV. Spróbuj ponownie.' }); }
});

// Szkic ogłoszenia z rozszerzenia Chrome (własny limit 20 KB i CORS, więc przed globalnym parserem).
draftRoutes(app);
app.use(express.json({ limit: '700kb' }));
growthRoutes(app, { BASE_URL });
// Instytucje i partnerzy: zamówienie paczki kodów, zgłoszenie do programu partnerskiego, raporty kodów (przed stronami SEO).
b2bRoutes(app, {
  BASE_URL, demo: DEMO && !SALES_CLOSED, closedFor: (req) => salesClosedFor(req),
  confirm: (b) => confirmB2b(b),
  checkout: PROVIDER === 'stripe' ? async (b, returnUrl) => {
    const sess = await stripeCheckout({ orderId: b.id, amount: b.total, email: b.email, lang: 'pl', name: `CV Pod Ogłoszenie: paczka ${b.qty} kodów (${PACKAGES[b.pkg]?.name})`, description: `${b.org}: ${b.qty} × ${b.unit / 100} zł`.slice(0, 300), returnUrl });
    await b2bOrders.update(b.id, { stripe: { sessionId: sess.id } });
    return sess.url;
  } : null,
});
seoRoutes(app, BASE_URL);
// Pliki z wersją w adresie (?v=…, wstawiana przez lib/seo.js) i czcionki można trzymać w pamięci przeglądarki na stałe.
app.use(express.static('public', { setHeaders: (res, path) => { if (res.req.query.v || /\/fonts\//.test(path)) res.set('Cache-Control', 'public, max-age=31536000, immutable'); } }));

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

// Kod klienta (program poleceń, lib/referral.js): −10 zł dla znajomych, każda osoba (adres e-mail) może go użyć raz,
// a właściciel zbiera 10 zł za każdego znajomego, który zapłacił. Zamiast adresów zapisujemy ich skróty.
async function checkCode(raw, email) {
  const code = normCode(raw);
  if (!code) return { discount: 0 };
  if (code === activePromo()?.code) await ensurePromoCode();
  const c = await codes.get(code);
  if (!c || c.disabled || Date.now() > c.expires) return { error: 'Ten kod nie istnieje albo wygasł.' };
  const d = codeDiscount(c, email);
  if (d.error) return d;
  return { code, discount: d.base + d.credit, base: d.base, credit: d.credit, owner: isOwner(c, email), percent: c.percent || 0, voucher: c.voucher || null };
}
// Ile z salda poleceń faktycznie zeszło w tym zamówieniu (rabat jest przycinany do ceny pakietu).
const creditUsedFor = (c, full, total) => (c.credit ? Math.max(0, Math.min(c.credit, full - total - c.base)) : 0);
// Rabat w groszach: kwotowy albo procentowy (kody akcji promocyjnych z panelu).
// Kod od instytucji (voucher) pokrywa cały pakiet; przy droższym pakiecie klient dopłaca różnicę.
const discountFor = (c, pkg, n, ad, returning, langs) => c.voucher ? (PRICES[pkg] <= PRICES[c.voucher] ? 'voucher' : PRICES[c.voucher]) : (c.percent ? Math.round((calcTotal(pkg, n, ad, returning, langs, 0) * c.percent) / 100) : c.discount || 0);
const discountGr = (disc, pkg) => (disc === 'voucher' ? PRICES[pkg] : disc); // do zapisu w zamówieniu (grosze)
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

// Reklamy: identyfikatory Google Ads i Meta Pixel (skrypty ładują się w przeglądarce dopiero po zgodzie na cookie).
const env = (k, re) => (re.test(process.env[k] || '') ? process.env[k] : '');
const ADS = { gads: env('GADS_ID', /^AW-\d{6,15}$/), label: env('GADS_PURCHASE_LABEL', /^[\w-]{4,64}$/), pixel: env('META_PIXEL_ID', /^\d{6,20}$/) };
// Link do opinii w Profilu Firmy w Google (pokazywany każdemu klientowi, bez względu na ocenę).
// Link do rozszerzenia w Chrome Web Store: bez niego przycisk „Dodaj do Chrome” jest ukryty.
const CHROME_EXT = env('CHROME_EXT_URL', /^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)\/[^\s"'<>]{1,300}$/);
const GOOGLE_REVIEW = env('GOOGLE_REVIEW_URL', /^https:\/\/(g\.page|search\.google\.com|www\.google\.com|maps\.app\.goo\.gl|g\.co)\/[^\s"'<>]{1,300}$/);
// Stan strony dla monitoringu (np. UptimeRobot co 5 minut): 200 = sprzedaż działa, 503 = coś blokuje zamówienia.
// Bez szczegółów konfiguracji: tylko nazwy sprawdzeń i ok / błąd.
app.get('/health', async (_req, res) => {
  const checks = {};
  try { const f = path.join(DATA_DIR, '.health'); await fsp.writeFile(f, String(Date.now())); await fsp.readFile(f); checks.dane = 'ok'; } catch { checks.dane = 'błąd'; }
  checks.platnosci = SALES_CLOSED ? 'błąd' : DEMO ? 'demo' : 'ok';
  checks.ai = aiEnabled() ? 'ok' : 'błąd';
  checks.poczta = mailEnabled() ? 'ok' : 'brak';
  const stuck = Object.values(await allOrders().catch(() => ({}))).filter((o) => o.status === 'paid' || (o.status === 'generating' && Date.now() - (o.paidAt || 0) > 30 * 60_000)).length;
  checks.zamowienia = stuck ? `${stuck} czeka na dokumenty` : 'ok';
  const ok = checks.dane === 'ok' && checks.platnosci !== 'błąd' && checks.ai === 'ok' && (DEMO || checks.poczta === 'ok');
  res.status(ok ? 200 : 503).set('Cache-Control', 'no-store').json({ ok, checks, at: new Date().toISOString() });
});
app.get('/api/config', (req, res) => res.json({
  ads: ADS, googleReview: GOOGLE_REVIEW, chromeExt: CHROME_EXT, demo: DEMO, salesClosed: salesClosedFor(req), ai: aiEnabled(), maxAds: MAX_ADS, noPrint: false, maxRevisions: MAX_REVISIONS, langs: LANGS, codeDiscount: CODE_DISCOUNT / 100,
  promo: salesClosedFor(req) ? null : activePromo(),
  prices: { ...Object.fromEntries(Object.entries(PRICES).map(([k, v]) => [k, v / 100])), bundleOff: BUNDLE_OFF / 100 },
}));

app.get('/api/code/:code', async (req, res) => {
  const r = await checkCode(req.params.code, req.query.email);
  if (r.error) return res.status(404).json({ error: r.error });
  // Kod promocji z kalendarza: do podsumowania zamówienia dołączamy najniższą cenę z 30 dni przed obniżką (Omnibus).
  const promo = activePromo();
  res.json({ code: r.code, discount: r.discount / 100, percent: r.percent || 0, voucher: r.voucher, label: r.voucher ? 'Kod od instytucji' : r.owner ? 'Twój kod z saldem poleceń' : 'Kod rabatowy', ...(promo && promo.code === r.code ? { calendar: true, lowest: promo.lowest } : {}) });
});

// Darmowe narzędzia z AI (lib/freeTools.js): ocena zdjęcia do CV (zdjęcia nie zapisujemy) i odpowiedź na pytanie rekrutera.
const toolLang = (l) => (['en', 'uk', 'de'].includes(l) ? l : 'pl');
app.post('/api/tools/photo', express.json({ limit: '8mb' }), async (req, res) => {
  if (!photoLimit(req)) return res.status(429).json({ error: 'Wykorzystano limit ocen zdjęć na godzinę. Spróbuj później.' });
  try { res.json(await checkPhoto(req.body?.image, toolLang(req.body?.lang))); }
  catch (e) { if (!(e instanceof ToolError)) { console.error('Ocena zdjęcia', e.message); logEvent('zdjęcie-cv', e.message); } res.status(e instanceof ToolError ? 422 : 502).json({ error: e instanceof ToolError ? e.message : e instanceof AiRefusal ? 'Nie udało się ocenić tego zdjęcia.' : 'Ocena jest chwilowo niedostępna. Spróbuj za chwilę.' }); }
});
app.post('/api/tools/answer', async (req, res) => {
  if (!answerLimit(req)) return res.status(429).json({ error: 'Wykorzystano limit odpowiedzi na godzinę. Spróbuj później.' });
  try { res.json(await recruiterAnswer({ ...req.body, lang: toolLang(req.body?.lang) })); }
  catch (e) { if (!(e instanceof ToolError)) { console.error('Odpowiedź rekruterowi', e.message); logEvent('pytanie-rekrutera', e.message); } res.status(e instanceof ToolError ? 400 : 502).json({ error: e instanceof ToolError ? e.message : 'Generator jest chwilowo niedostępny. Spróbuj za chwilę.' }); }
});

// Asystent: krótkie odpowiedzi na pytania o CV (limit na IP).
app.post('/api/assistant', async (req, res) => {
  if (!chatLimit(req)) return res.status(429).json({ error: 'Za dużo pytań w krótkim czasie. Spróbuj za chwilę.' });
  const history = arr(req.body?.messages, 12).map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: str(m?.content, 1000) })).filter((m) => m.content);
  if (!history.length || history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'Zadaj pytanie.' });
  try { res.json({ answer: await assistant(history) }); }
  catch (e) { console.error('Asystent', e.message); logEvent('asystent', e.message); res.status(502).json({ error: 'Asystent jest chwilowo niedostępny. Zajrzyj do FAQ albo poradnika.' }); }
});

// Zapytanie od firmy lub instytucji (paczka kodów dla podopiecznych, pracowników, absolwentów).
app.post('/api/b2b', async (req, res) => {
  if (!fetchLimit(req)) return res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj za kilka minut.' });
  const b = req.body || {}, s = (v, n) => String(v || '').trim().slice(0, n);
  const lead = { id: crypto.randomUUID(), org: s(b.org, 150), name: s(b.name, 100), email: s(b.email, 150), phone: s(b.phone, 40), count: Math.max(0, Math.min(100000, parseInt(b.count, 10) || 0)), msg: s(b.msg, 2000), uiLang: s(b.uiLang, 2), created: Date.now() };
  if (!lead.org || !lead.name || !/^\S+@\S+\.\S+$/.test(lead.email)) return res.status(400).json({ error: 'Podaj nazwę instytucji, imię i nazwisko oraz poprawny e-mail.' });
  if (!b.consent) return res.status(400).json({ error: 'Zaznacz zgodę na kontakt w sprawie zapytania.' });
  await leads.save(lead);
  logEvent('firma', `Zapytanie: ${lead.org} (${lead.count || '?'} osób)`, { email: lead.email });
  res.json({ ok: true });
});

// Przykładowe CV w PDF (fikcyjna osoba, znak wodny „PRZYKŁAD”) w wybranym szablonie i kolorze.
app.get('/api/sample.pdf', async (req, res) => {
  try {
    const l = String(req.query.lang || 'pl'), pdf = await samplePdf(l, { tpl: String(req.query.tpl || ''), color: String(req.query.color || '') });
    const name = { en: 'sample-cv', uk: 'zrazok-reziume', de: 'muster-lebenslauf' }[l] || 'przykladowe-cv';
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}.pdf"`, 'Cache-Control': 'public, max-age=86400' }).send(pdf);
  } catch (e) { console.error('Przykładowy PDF', e.message); res.status(500).json({ error: 'Nie udało się przygotować przykładu.' }); }
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
  // Zamówienie za 0 zł (kod od instytucji): bez płatności, dokumenty powstają od razu.
  if (order.total === 0) { await updateOrder(order.id, { payment: { provider: 'kod', code: order.code, at: Date.now() } }); markPaidAndGenerate(order.id).catch(console.error); return { id: order.id, free: true }; }
  if (DEMO) return { id: order.id, demo: true };
  if (PROVIDER === 'stripe') {
    const l = lang || order.uiLang, n = order.ads?.length || 1;
    const sess = await stripeCheckout({
      orderId: order.id, amount: order.total, email: order.profile.email, lang: l,
      name: `CV Pod Ogłoszenie: ${PACKAGES[order.pkg]?.name || 'zamówienie'}`,
      description: [`${n} ${n === 1 ? 'ogłoszenie' : 'ogłoszenia'}`, ...Object.keys(ADDONS).filter((k) => order.addons?.[k]).map((k) => ADDONS[k])].join(', ').slice(0, 300),
      returnUrl: `${BASE_URL}/${['en', 'uk', 'de'].includes(l) ? l : ''}?id=${order.id}`,
    });
    await updateOrder(order.id, { payAttempts: (order.payAttempts || 0) + 1, stripe: { sessionId: sess.id } });
    return { id: order.id, url: sess.url };
  }
  const attempt = (order.payAttempts || 0) + 1, sessionId = `${order.id}.${attempt}`;
  const { token, url } = await p24Register({
    sessionId, amount: order.total, email: order.profile.email, language: lang || order.uiLang,
    description: `CV Pod Ogłoszenie, zamówienie ${order.id}`,
    urlReturn: `${BASE_URL}/?id=${order.id}`, urlStatus: `${BASE_URL}/api/p24/status`,
  });
  await updateOrder(order.id, { payAttempts: attempt, p24: { sessionId, token } });
  return { id: order.id, url };
}
// Stripe: płatność potwierdzona tylko, gdy sesja jest opłacona, dotyczy tego zamówienia i kwota się zgadza.
// Paczka kodów dla instytucji: płatność potwierdzona przez webhook albo po powrocie na stronę zamówienia.
async function confirmB2b(b, sess) {
  b ||= await b2bOrders.get(sess?.client_reference_id);
  if (!b || b.code && b.status === 'paid') return b;
  sess ||= b.stripe?.sessionId ? await stripeSession(b.stripe.sessionId).catch(() => null) : null;
  if (!sess || sess.payment_status !== 'paid' || sess.client_reference_id !== b.id) return null;
  if (sess.amount_total !== b.total || sess.currency !== 'pln') { logEvent('płatność', `Stripe: kwota ${sess.amount_total} ${sess.currency} nie zgadza się z paczką kodów`, { orderId: b.id }); return null; }
  return fulfillB2b(b.id, { paid: true, provider: 'stripe', paymentIntent: sess.payment_intent, sessionId: sess.id, base: BASE_URL });
}
async function confirmStripe(o, sess) {
  if (o.status !== 'pending' || sess.payment_status !== 'paid' || sess.client_reference_id !== o.id) return false;
  if (sess.amount_total !== o.total || sess.currency !== 'pln') { logEvent('płatność', `Stripe: kwota ${sess.amount_total} ${sess.currency} nie zgadza się z zamówieniem`, { orderId: o.id }); return false; }
  await updateOrder(o.id, { payment: { provider: 'stripe', sessionId: sess.id, paymentIntent: sess.payment_intent, at: Date.now() } });
  markPaidAndGenerate(o.id).catch(console.error);
  return true;
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

// Dane do faktury (na życzenie klienta, faktura bez VAT). NIP jest opcjonalny (osoba prywatna), ale jeśli jest, musi być poprawny.
const nipOk = (n) => /^\d{10}$/.test(n) && [6, 5, 7, 2, 3, 4, 5, 6, 7].reduce((s, w, i) => s + w * +n[i], 0) % 11 === +n[9];
function cleanInvoice(v) {
  if (!v || typeof v !== 'object') return null;
  const nip = str(v.nip, 20).replace(/^PL/i, '').replace(/[\s-]/g, ''), name = str(v.name, 200), address = str(v.address, 250);
  if (name.length < 3 || address.length < 5) return { error: 'Do faktury podaj nazwę (albo imię i nazwisko) oraz adres.' };
  if (nip && !nipOk(nip)) return { error: 'Sprawdź NIP do faktury – powinien mieć 10 cyfr.' };
  return { nip, name, address, issued: false };
}

app.post('/api/orders', async (req, res) => {
  if (salesClosedFor(req)) return res.status(503).json({ error: CLOSED_MSG });
  try {
    const { pkg, profile, ads, consent, design, addons, extraLangs, code, reminder, followUp, jobAlerts, reviewAsk, payReminder, uiLang, createAccount, invoice, adConsent } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' });
    const a = cleanAds(ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const p = cleanProfile(profile);
    if (!p.name || !/^\S+@\S+\.\S+$/.test(p.email)) return res.status(400).json({ error: 'Podaj imię i nazwisko oraz poprawny e-mail.' });
    if (!p.experience.length && !p.education.length) return res.status(400).json({ error: 'Dodaj doświadczenie lub wykształcenie.' });
    const ad = cleanAddons(addons), langs = usefulExtraLangs(cleanLangs(extraLangs), a);
    const c = await checkCode(code, p.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const inv = cleanInvoice(invoice);
    if (inv?.error) return res.status(400).json({ error: inv.error });
    const disc = discountFor(c, pkg, a.length, ad, false, langs), total = calcTotal(pkg, a.length, ad, false, langs, disc);
    const order = { invoice: total > 0 ? inv : null, id: crypto.randomUUID(), pkg, addons: ad, extraLangs: langs, code: c.code || null, discount: discountGr(disc, pkg), creditUsed: creditUsedFor(c, calcTotal(pkg, a.length, ad, false, langs, 0), total), total, profile: p, ads: a, design: cleanDesign(design), reminder: { consent: !!reminder, sent: false }, followUp: { consent: !!followUp, sent: false }, jobAlerts: jobAlerts && str(jobAlerts.job, 60).length >= 2 ? { job: str(jobAlerts.job, 60), city: str(jobAlerts.city, 40) } : null, reviewAsk: { consent: !!reviewAsk, sent: false }, payReminder: { consent: !!payReminder, sent: false }, uiLang: ['en', 'uk', 'de'].includes(uiLang) ? uiLang : 'pl', createAccount: !!createAccount, status: 'pending', results: [], revisions: 0, created: Date.now(), adConsent: adConsent === true, ...(adConsent === true ? { adCtx: adContext(req, req.body) } : {}) };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

// Kolejne zamówienie klienta, który już kupował: dane są zapisane, wybiera pakiet (1 ogłoszenie albo Pakiet 3).
app.post('/api/orders/:id/followup', async (req, res) => {
  if (salesClosedFor(req)) return res.status(503).json({ error: CLOSED_MSG });
  try {
    const parent = await getOrder(req.params.id);
    if (!parent || parent.status !== 'done') return res.status(409).json({ error: 'Najpierw dokończ poprzednie zamówienie.' });
    const a = cleanAds(req.body?.ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const ad = cleanAddons(req.body?.addons), langs = usefulExtraLangs(cleanLangs(req.body?.extraLangs), a);
    const c = await checkCode(req.body?.code, parent.profile.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const pkg = ['cv', 'cv_letter', 'pack3'].includes(req.body?.pkg) ? req.body.pkg : parent.pkg;
    const disc = discountFor(c, pkg, a.length, ad, true, langs), total = calcTotal(pkg, a.length, ad, true, langs, disc);
    const order = { id: crypto.randomUUID(), uiLang: parent.uiLang, parentId: parent.id, rootId: parent.rootId || parent.id, pkg, addons: ad, extraLangs: langs, code: c.code || null, discount: discountGr(disc, pkg), creditUsed: creditUsedFor(c, calcTotal(pkg, a.length, ad, true, langs, 0), total), total, profile: parent.profile, ads: a, design: parent.design, reminder: { consent: false, sent: false }, status: 'pending', results: [], revisions: 0, created: Date.now() };
    await saveOrder(order);
    res.json(await checkout(order));
  } catch (e) { console.error(e); res.status(400).json({ error: e.message || 'Błąd' }); }
});

const view = (o, extra = {}) => ({
  ...extra, id: o.id, pkg: o.pkg, addons: o.addons || {}, extraLangs: o.extraLangs || [], total: o.total, status: o.status, results: o.results, error: o.error, mail: o.mail,
  design: cleanDesign(o.design), photo: o.profile.photo || '', email: o.profile.email, parentId: o.parentId || null,
  paidAt: o.paidAt || null, createAccount: !!o.createAccount, canPay: o.status === 'pending' && !DEMO, revisionsLeft: MAX_REVISIONS - (o.revisions || 0), expires: (o.created || 0) + RETENTION_MS,
  invoice: o.invoice?.pdf ? { number: o.invoice.number } : null,
});

// Faktura PDF dla klienta (link na stronie dokumentów; adres zamówienia jest nie do zgadnięcia, jak przy dokumentach).
app.get('/api/orders/:id/invoice.pdf', async (req, res) => {
  const inv = await invoices.get(req.params.id);
  if (!inv) return res.sendStatus(404);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoiceFile(inv)}"`, 'Cache-Control': 'private, no-store' }).send(await renderInvoice(inv));
});

// Stan zamówienia; po powrocie z Przelewy24 sprawdza płatność u źródła (gdyby powiadomienie się spóźniło).
app.get('/api/orders/:id', async (req, res) => {
  let o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  if (o.status === 'pending' && o.stripe?.sessionId && stripeEnabled()) {
    const sess = await stripeSession(o.stripe.sessionId).catch(() => null);
    if (sess && (await confirmStripe(o, sess).catch(() => false))) o = await getOrder(o.id);
  }
  if (o.status === 'pending' && !DEMO && o.p24?.sessionId) {
    const t = await p24BySession(o.p24.sessionId);
    if (t && (t.status === 1 || t.status === 2) && (await confirmP24(o, t.orderId, t.amount, t.status === 2).catch(() => false))) o = await getOrder(o.id);
  }
  // Kod klienta (program poleceń): rabat dla znajomych, liczba poleceń i saldo do wykorzystania przez właściciela.
  let myCode = null;
  if (o.status === 'done' && o.myCode) {
    const c = await codes.get(o.myCode);
    if (c && Date.now() < c.expires) {
      const d = codeDiscount(c, o.profile.email), mine = d.error ? 0 : (d.base + d.credit) / 100;
      myCode = { code: c.id, discount: c.amount / 100, expires: c.expires, uses: (c.usedBy || []).length, referrals: c.referrals || 0, credit: (c.credit || 0) / 100, earned: (c.earned || 0) / 100, mine, usedByMe: !mine };
    }
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
  // Sekcja opinii pokazuje się od REVIEWS_MIN opublikowanych opinii (domyślnie 3), żeby nie świeciła jedną recenzją.
  if (shown.length < (Number(process.env.REVIEWS_MIN) || 3)) return res.json({ count: 0, avg: null, list: [] });
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
  if (!DEMO || salesClosedFor(req)) return res.sendStatus(404);
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
    if (o.code) await codes.update(o.code, (c) => applyPaidCode(c, { email: o.profile.email, creditUsed: o.creditUsed || 0, total: o.total || 0 }));
    const root = o.rootId || o.parentId || o.id;
    const existing = Object.values(await codes.all()).find((c) => c.ownerOrderId === root);
    if (existing) {
      if (!existing.ownerHash) await codes.update(existing.id, (c) => ({ ...c, ownerHash: emailHash(o.profile.email) }));
      return existing.id;
    }
    const mine = { id: newCode('KOD'), amount: CODE_DISCOUNT, ownerOrderId: root, ownerHash: emailHash(o.profile.email), usedBy: [], referrals: 0, credit: 0, created: Date.now(), expires: Date.now() + CODE_TTL };
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
    const paidO = await updateOrder(id, (x) => ({ ...x, status: 'generating', paidAt: x.paidAt || Date.now() }));
    if (!o.paidAt) { recordSale(paidO).catch((e) => console.error('Rejestr sprzedaży', e.message)); notifyNewOrder(paidO, BASE_URL).catch((e) => logEvent('e-mail', `Powiadomienie o zamówieniu: ${e.message}`)); }
    if (!o.paidAt && paidO.invoice) autoInvoice(paidO).catch((e) => logEvent('faktura', e.message, { orderId: id }));
    if (!o.paidAt && paidO.adConsent) sendPurchase(paidO, BASE_URL).then((r) => r && updateOrder(id, { capi: r })).catch((e) => logEvent('reklamy', `Meta CAPI: ${e.message}`, { orderId: id }));
    const withLetter = hasLetter(o.pkg);
    const results = await Promise.all(o.ads.map(async (ad) => {
      const r = await generateForAd({ profile: o.profile, ad, withLetter, addons: o.addons });
      const langs = (o.extraLangs || []).filter((l) => l !== r.lang);
      if (langs.length) r.variants = Object.fromEntries(await Promise.all(langs.map(async (l) => [l, await translateResult(r, l)])));
      return r;
    }));
    const myCode = await afterPaid(o);
    if (o.jobAlerts) addAlertFromOrder({ email: o.profile.email, ...o.jobAlerts, lang: o.uiLang }).catch((e) => logEvent('oferty', e.message, { orderId: id }));
    const mail = await trySend({ ...o, results, myCode });
    await updateOrder(id, { status: 'done', results, mail, myCode });
    stats.upsert('totals', (p = {}) => ({ cvs: (p.cvs || 0) + results.length, orders: (p.orders || 0) + 1 })).catch(() => {});
  } catch (e) {
    console.error('Generowanie nie powiodło się', id, e);
    logEvent('generowanie', e.message, { orderId: id });
    // Płatność zostaje; strona sama ponawia generowanie (retryFailed), a gotowe dokumenty idą e-mailem.
    await updateOrder(id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Generowanie nie powiodło się.' }));
    alertOwner(`Zamówienie ${id} jest opłacone, ale nie udało się wygenerować dokumentów.\n\nBłąd: ${e.message}\n\nStrona ponawia generowanie co 15 minut przez 3 dni, a klient dostanie dokumenty e-mailem. Jeśli błąd mówi o środkach (credit balance / billing), doładuj konto na console.anthropic.com. Szczegóły: panel → Problemy.`);
  } finally { inFlight.delete(id); }
}

// Faktura bez VAT na życzenie klienta: numer, PDF w e-mailu i na stronie dokumentów (wyłączane w panelu → Ustawienia).
async function autoInvoice(o, { force = false } = {}) {
  if (!force && !(await getSettings()).autoInvoice) return null;
  const inv = await issueInvoice(o);
  if (!inv) return null;
  await updateOrder(o.id, (x) => ({ ...x, invoice: { ...x.invoice, issued: true, pdf: true, number: inv.number, issuedAt: inv.issued } }));
  if (mailEnabled()) await sendInvoiceMail(o, inv, await renderInvoice(inv), BASE_URL).catch((e) => logEvent('e-mail', `Faktura ${inv.number}: ${e.message}`, { orderId: o.id }));
  return inv;
}

// Mail do właściciela najwyżej raz na godzinę, żeby przy awarii nie zasypać skrzynki.
let lastAlert = 0;
function alertOwner(text) {
  if (!mailEnabled() || !process.env.CONTACT_EMAIL || Date.now() - lastAlert < 3600_000) return;
  lastAlert = Date.now();
  sendAdminAlert('Problem z generowaniem dokumentów', text).catch((e) => logEvent('e-mail', `Ostrzeżenie: ${e.message}`));
}

// Automatyczne ponawianie: opłacone zamówienia z błędem (np. brak środków na koncie AI) – co 15 minut, przez 3 dni.
const RETRY_FOR = 3 * 864e5, RETRY_MAX = 300;
async function retryFailed() {
  try {
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'paid' || inFlight.has(o.id) || (o.attempts || 0) >= RETRY_MAX || Date.now() - (o.paidAt || o.created) > RETRY_FOR) continue;
      await updateOrder(o.id, { status: 'pending', error: null });
      await markPaidAndGenerate(o.id);
    }
  } catch (e) { console.error('Ponawianie', e); }
}
setInterval(retryFailed, (Number(process.env.RETRY_MINUTES) || 15) * 60_000).unref();

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

// Linki logowania/potwierdzenia na ekranie (bez e-maila) tylko w lokalnym demo, nigdy na produkcji.
accountRoutes(app, { BASE_URL, DEMO: DEMO && !SALES_CLOSED });
leadRoutes(app, { BASE_URL, DEMO: DEMO && !SALES_CLOSED });
alertRoutes(app, { BASE_URL, DEMO: DEMO && !SALES_CLOSED });
analyticsRoutes(app, BASE_URL);
adminRoutes(app, { DEMO, BASE_URL, markPaidAndGenerate, trySend, retentionMs: RETENTION_MS, autoInvoice });

// Dane zamówień (w tym zdjęcia) kasujemy po 30 dniach.
// Co godzinę: kasowanie starych zamówień i kodów oraz jednorazowe przypomnienie po 7 dniach (tylko za zgodą klienta).
const PAY_REMINDER_AFTER = 3 * 3600_000;
async function hourly() {
  try {
    const n = await deleteOlderThan(RETENTION_MS);
    if (n) console.log(`Usunięto ${n} zamówień starszych niż 30 dni`);
    await codes.deleteWhere((c) => Date.now() > c.expires && !(c.due > 0)); // kod partnera z niewypłaconą prowizją zostaje do rozliczenia
    // Starsze kody klientów nie miały skrótu e-maila właściciela: uzupełniamy go, póki zamówienie jeszcze istnieje.
    for (const c of Object.values(await codes.all())) {
      const o = !c.ownerHash && c.ownerOrderId && (await getOrder(c.ownerOrderId));
      if (o?.profile?.email) await codes.update(c.id, (x) => ({ ...x, ownerHash: emailHash(o.profile.email) }));
    }
    await cleanupEvents(RETENTION_MS);
    await cleanupChats().catch(() => {});
    await cleanupPartnerApps().catch(() => {});
    await crmHourly(BASE_URL).catch((e) => logEvent('kontakty', e.message));
    await b2bMonthly(BASE_URL).catch((e) => logEvent('e-mail', `Podsumowania miesiąca: ${e.message}`));
    await welcomeSeries(BASE_URL).catch((e) => logEvent('e-mail', `Seria powitalna: ${e.message}`));
    await telegramHourly(BASE_URL).catch((e) => logEvent('telegram', e.message));
    await cleanupLeads().catch(() => {});
    await cleanupInvoices().catch(() => {});
    await leads.deleteWhere((l) => Date.now() - l.created > 365 * 864e5);
    await cleanupAnalytics().catch(() => {});
    await ensurePromoCode().catch((e) => console.error('Promocja', e.message));
    await alertsHourly(BASE_URL).catch((e) => console.error('Powiadomienia o ofertach', e.message));
    await accountHourly(BASE_URL).catch((e) => console.error('Konta', e.message));
    await ownerDaily(BASE_URL).catch((e) => logEvent('e-mail', `Podsumowanie dnia / kopia: ${e.message}`));
    if (!mailEnabled()) return;
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.reminder?.consent || o.reminder.sent || Date.now() - o.created < REMINDER_AFTER) continue;
      try { await sendReminder(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, reminder: { ...x.reminder, sent: true, at: Date.now() } })); }
      catch (e) { console.error('Przypomnienie', o.id, e.message); }
    }
    // Po miesiącu (dzień przed usunięciem danych): jak poszła rekrutacja + kod rabatowy (jeden e-mail, za zgodą).
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.followUp?.consent || o.followUp.sent || Date.now() - o.created < FOLLOWUP_AFTER) continue;
      try { await sendFollowUp(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, followUp: { ...x.followUp, sent: true, at: Date.now() } })); }
      catch (e) { console.error('E-mail po miesiącu', o.id, e.message); }
    }
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.reviewAsk?.consent || o.reviewAsk.sent || Date.now() - o.created < REVIEW_AFTER || (await reviews.get(o.id))) continue;
      try { await sendReviewAsk(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, reviewAsk: { ...x.reviewAsk, sent: true, at: Date.now() } })); }
      catch (e) { console.error('Prośba o opinię', o.id, e.message); }
    }
    // Niedokończona płatność: jeden e-mail po ok. 3 h (za zgodą), o ile klient nie zapłacił w międzyczasie za inne zamówienie.
    const all = Object.values(await allOrders());
    for (const o of all) {
      const age = Date.now() - o.created;
      if (o.status !== 'pending' || !o.payReminder?.consent || o.payReminder.sent || age < PAY_REMINDER_AFTER || age > 48 * 3600_000) continue;
      if (all.some((x) => x.status === 'done' && x.profile?.email === o.profile.email && x.created > o.created)) continue;
      try { await sendPayReminder(o, BASE_URL); await updateOrder(o.id, (x) => ({ ...x, payReminder: { ...x.payReminder, sent: true, at: Date.now() } })); }
      catch (e) { console.error('Przypomnienie o płatności', o.id, e.message); }
    }
  } catch (e) { console.error('Zadanie cogodzinne', e); }
}
hourly(); setInterval(hourly, 3600_000).unref();

// Nieznane adresy: API odpowiada JSON-em, a strony – stroną 404 w wyglądzie serwisu.
app.use((req, res) => (req.path.startsWith('/api/') || req.method !== 'GET' ? res.status(404).json({ error: 'Nie ma takiego adresu.' }) : sendNotFound(req, res, BASE_URL)));

app.listen(PORT, () => console.log(`http://localhost:${PORT}  ${DEMO ? '[TRYB DEMO – brak konfiguracji płatności]' : `[płatności: ${PROVIDER}]`}${aiEnabled() ? '' : ' [bez AI – brak ANTHROPIC_API_KEY]'}`));
