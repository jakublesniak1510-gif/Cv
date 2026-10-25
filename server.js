import 'dotenv/config';
import path from 'node:path';
import fsp from 'node:fs/promises';
import express from 'express';
import crypto from 'node:crypto';
import { activePromo, ensurePromoCode } from './lib/promos.js';
import { checkPhoto, recruiterAnswer, ToolError } from './lib/freeTools.js';
import { alertRoutes, alertsHourly, addAlertFromOrder } from './lib/alerts.js';
import { passRoutes, passesHourly, reservePass, passOrderPaid, releasePassOrder, passRefunded, confirmPassPayment, PassError } from './lib/passes.js';
import { accountIdOf, accountEmail } from './lib/account.js';
import { wizardDraftRoutes, wizardDraftsHourly, draftOrdered, draftPaid } from './lib/wizard-drafts.js';
import { offerRoutes, feedSources } from './lib/jobfeed.js';
import { nextEligible, hasBundle, calcTotal, MAX_ADS, PRICES, LANGS, CODE_DISCOUNT, PACKAGES, ADDONS, BUNDLE_OFF, withLetter as hasLetter, upsellOffers, upsellPlan } from './lib/pricing.js';
import { getOrder, saveOrder, updateOrder, deleteOlderThan, allOrders, codes, reviews, stats, leads, removeOrder } from './lib/store.js';
import { heardInput } from './lib/heard.js';
import { docFile } from './lib/doc-names.js';
import { generateForAd, generateMessages, linkedinChecked, reviseDoc, translateResult, scanCv, assistant } from './lib/generate.js';
import { aiEnabled, AiRefusal } from './lib/ai.js';
import { checkResult, hasCritical, recordQa, QA_LABELS } from './lib/qa.js';
import { renderCv } from './lib/pdf.js';
import { fetchAd, AdError } from './lib/fetchAd.js';
import { adFromImage, AdImageError } from './lib/adImage.js';
import { simTurn, SimError } from './lib/sim.js';
import { samplePdf } from './lib/sample.js';
import { importCv, extractText, ImportError } from './lib/importCv.js';
import { scanFallback } from './lib/tailor.js';
import { adKeywords } from './lib/ad-keywords.js';
import { letterRoutes } from './lib/letter-landing.js';
import { checkCv } from './lib/cv-check.js';
import { profReqs } from './lib/prof-ad.js';
import { landingRoutes } from './lib/landing.js';
import { outcomes, outcomeRoutes, startOutcome, outcomeLinks, anonymizeOutcomes, publicOutcome, OUTCOME_CONSENT, OUTCOME_AFTER, OT } from './lib/outcomes.js';
import { mailEnabled, sendReferralMail, sendOrderMail, sendReminder, sendFollowUp, sendReviewAsk, sendOutcomeAsk, sendPayReminder, sendAdminAlert, sendInvoiceMail, sendOwnerMail } from './lib/mail.js';
import { socialRoutes, cleanupChats, botStatus } from './lib/social.js';
import { b2bRoutes, b2bOrders, fulfillB2b, b2bRefunded, cleanupPartnerApps } from './lib/b2b.js';
import { b2bMonthly } from './lib/b2b-monthly.js';
import { crmHourly } from './lib/crm.js';
import { growthRoutes, welcomeSeries, telegramHourly, rememberScan } from './lib/growth.js';
import { tpCsp } from './lib/trustpilot.js';
import { scannerVariant, scanForVariant } from './lib/ab.js';
import { shareImgRoute } from './lib/share-img.js';
import { shareRoutes, cleanupShareCards } from './lib/share.js';
import { sendPurchase, adContext } from './lib/capi.js';
import { draftRoutes } from './lib/drafts.js';
import { cleanDesign } from './lib/designs.js';
import { usefulExtraLangs } from './lib/lang.js';
import { seoRoutes, sendNotFound } from './lib/seo.js';
import { p24Enabled, p24Register, p24NotificationOk, p24Verify, p24BySession } from './lib/p24.js';
import { stripeEnabled, stripeCheckout, stripeSession, stripeEvent, stripeExpire, stripeMethods, refreshStripeMethods } from './lib/stripe.js';
import { recordSale, notifyNewOrder, setRefunded, commissionBack, ownerDaily, getSettings, DATA_DIR, addDailySection, dayKey } from './lib/ops.js';
import { invoices, issueInvoice, renderInvoice, invoiceFile, cleanupInvoices } from './lib/invoice.js';
import { renderDocx } from './lib/docx.js';
import { adminRoutes, isAdmin } from './lib/admin.js';
import { accountRoutes, accountHourly } from './lib/account.js';
import { templateRoutes } from './lib/templates.js';
import { abroadRoutes } from './lib/abroad.js';
import { officialRoutes } from './lib/official.js';
import { portalRoutes } from './lib/portals.js';
import { employerRoutes } from './lib/employers.js';
import { fairRoutes } from './lib/fairs.js';
import { previewRoutes, previewFor, cleanupPreviews } from './lib/preview.js';
import { analyticsRoutes, cleanupAnalytics, funnelRange, funnelText, visitInfo, funnelPaid, countEvent, funnelOrder, abExpose } from './lib/analytics.js';
import { seoReportRoutes, seoWeekly } from './lib/seo-report.js';
import { logEvent, cleanupEvents } from './lib/events.js';
import { recordStatsSafe } from './lib/stats-agg.js';
import { leadRoutes, cleanupLeads } from './lib/leads.js';
import { emailHash, codeDiscount, applyPaidCode, isOwner, CODE_TTL, REF_CAP, reserveCode, releaseCode, staleReservations, CodeError } from './lib/referral.js';

const PORT = process.env.PORT || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
// Operator płatności: Stripe (gdy jest STRIPE_SECRET_KEY), Przelewy24 albo tryb DEMO. PAY_PROVIDER=p24 wymusza Przelewy24,
// PAY_PROVIDER=both (gdy skonfigurowane są obie bramki) – klient wybiera w kasie: Stripe (domyślnie) albo Przelewy24.
const PROVIDER = process.env.PAY_PROVIDER === 'both' && stripeEnabled() && p24Enabled() ? 'both'
  : process.env.PAY_PROVIDER === 'p24' && p24Enabled() ? 'p24' : stripeEnabled() ? 'stripe' : p24Enabled() ? 'p24' : 'demo';
const DEMO = PROVIDER === 'demo';
const GATEWAYS = PROVIDER === 'both' ? ['stripe', 'p24'] : DEMO ? [] : [PROVIDER];
// Bramka wybrana przez klienta: brak pola → domyślna (pierwsza); nieznana albo niewłączona → błąd (null).
const pickGateway = (g) => (g == null || g === '' ? GATEWAYS[0] || null : GATEWAYS.includes(g) ? g : null);
// Zamówienie zwrócone w całości (Stripe albo Przelewy24): bez kolejnych poprawek i dokupień.
const fullyRefunded = (o) => o.total > 0 && (o.refunded || 0) >= o.total;
const REFUNDED_MSG = 'To zamówienie zostało zwrócone, więc nie można go już poprawiać ani dokupić do niego dodatków.';
const BAD_GATEWAY = 'Nieznana metoda płatności. Odśwież stronę i wybierz ją ponownie.';
// Na produkcji bez Przelewy24 sprzedaż jest zamknięta: zamawiać (w trybie demo) może tylko zalogowany administrator,
// żeby nikt nie dostał dokumentów z AI za darmo. DEMO_OPEN=1 otwiera tryb demo dla wszystkich (np. do prezentacji).
// Klucz testowy Stripe (sk_test_…) na produkcji: płatności próbne tylko dla admina, sprzedaż dla klientów zamknięta.
const STRIPE_TEST = GATEWAYS.includes('stripe') && /^sk_test_/.test(process.env.STRIPE_SECRET_KEY || '');
// Zły rodzaj klucza (np. publiczny pk_…): Stripe odrzuci każdą płatność, więc sprzedaż zostaje zamknięta, a w logach jest ostrzeżenie.
const STRIPE_BAD = GATEWAYS.includes('stripe') && !/^(sk|rk)_(live|test)_/.test(process.env.STRIPE_SECRET_KEY || '');
if (STRIPE_BAD) console.error('STRIPE_SECRET_KEY nie jest kluczem tajnym (sk_live_…): sprzedaż zamknięta.');
const SALES_CLOSED = STRIPE_BAD || ((DEMO || STRIPE_TEST) && process.env.NODE_ENV === 'production' && process.env.DEMO_OPEN !== '1');
const salesClosedFor = (req) => SALES_CLOSED && !isAdmin(req);
const CLOSED_MSG = 'Zamówienia ruszą za kilka dni. Zapisz się do newslettera na dole strony, a damy znać o starcie.';
const RETENTION_MS = 30 * 24 * 3600 * 1000;
const MAX_REVISIONS = 5;
// Limit z chwili zakupu (zamówienia sprzed zmiany regulaminu: 10).
const revLimit = (o) => o.maxRevisions ?? 10;

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
  res.set('Content-Security-Policy', tpCsp(csp(req.path === '/admin' ? "'self'" : `'nonce-${nonce}' 'strict-dynamic'`).replace("frame-ancestors 'none'", embed ? 'frame-ancestors *' : "frame-ancestors 'none'")));
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
const photoLimit = limiter(5, 3600_000), answerLimit = limiter(8, 3600_000), importLimit = limiter(10, 600_000), fetchLimit = limiter(20, 600_000), scanLimit = limiter(6, 3600_000), cvCheckLimit = limiter(12, 3600_000), wizMatchLimit = limiter(60, 600_000), shareImgLimit = limiter(12, 3600_000), chatLimit = limiter(30, 3600_000), adKwLimit = limiter(20, 3600_000);
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
    if (String(ch?.metadata?.orderId || '').startsWith('PASS-')) { passRefunded(ch.metadata.orderId, ch.amount_refunded || 0).catch((e) => logEvent('płatność', `Zwrot karnetu: ${e.message}`)); return; }
    if (String(ch?.metadata?.orderId || '').startsWith('B2B-')) { b2bRefunded(ch.metadata.orderId, ch.amount_refunded || 0).catch((e) => logEvent('płatność', `Zwrot B2B: ${e.message}`)); return; }
    if (ch?.payment_intent) setRefunded({ orderId: ch.metadata?.orderId, paymentIntent: ch.payment_intent, total: ch.amount_refunded || 0, source: 'stripe' })
      .then((r) => r?.changed && r.code && commissionBack(r.code, r.delta, r)).catch((e) => logEvent('płatność', `Zwrot: ${e.message}`));
    return;
  }
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(ev.type)) return;
  if (String(ev.data?.object?.client_reference_id || '').startsWith('PASS-')) { confirmPassPayment(null, ev.data.object, BASE_URL).catch((e) => logEvent('płatność', `Karnet: ${e.message}`)); return; }
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

shareImgRoute(app, shareImgLimit); // obrazek wyniku skanera do udostępnienia (GET /api/scan/:id/share.png)

// Podgląd dopasowania w kreatorze (krok podsumowania): wymagania z każdego ogłoszenia i które z nich widać w danych z formularza.
// Silnik skanera bez AI (scanFallback), tylko na przesłanym tekście; nic nie zapisujemy.
app.post('/api/wizard-match', express.json({ limit: '64kb' }), (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!wizMatchLimit(req)) return res.status(429).json({ error: 'Spróbuj za chwilę.' });
  const cv = str(req.body?.cv, 8000), ads = (Array.isArray(req.body?.ads) ? req.body.ads : []).slice(0, MAX_ADS).map((t) => str(t, 10000));
  res.json({ ads: ads.map((t) => {
    if (t.length < 40) return null;
    const r = scanFallback({ cvText: cv, adText: t });
    return { n: r.found.length + r.missing.length, found: cv ? r.found : [], missing: cv ? r.missing.map((m) => m.keyword) : [] };
  }) });
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
    const { company, ...full } = await scanCv({ cvText, adText });
    // Test A/B „scanner” (lib/ab.js): w wariancie B obcięty wynik już w odpowiedzi i w pamięci (e-mail, karta).
    const variant = scannerVariant(req), result = scanForVariant(full, variant);
    res.json({ ...result, scanId: rememberScan({ ...result, company }), ...(variant ? { variant } : {}) });
    if (variant) abExpose(req, { scanner: variant }, 'scan_done').catch(() => {});
    // Anonimowe liczniki wymagań (bez treści CV i ogłoszenia); firma służy tylko do odfiltrowania jej nazwy.
    recordStatsSafe({ title: `${full.position} | ${adText.split('\n').find((l) => l.trim()) || ''}`.slice(0, 200), company, found: full.found, missing: full.missing });
  } catch (e) { console.error('Skaner', e.message); logEvent('skaner', e.message); res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się ocenić CV. Spróbuj ponownie.' }); }
});

// --- Wyciągacz słów kluczowych z ogłoszenia (poradnik „Słowa kluczowe ATS”, generator podsumowania): bez CV, bez zapisywania ---
const AD_KW_ERR = {
  pl: ['Wykorzystano limit na godzinę. Spróbuj później.', 'Wklej pełną treść ogłoszenia (min. 80 znaków).'],
  en: ['You have reached the hourly limit. Please try again later.', 'Paste the full job ad (at least 80 characters).'],
  de: ['Das Stundenlimit ist erreicht. Bitte versuchen Sie es später erneut.', 'Fügen Sie die vollständige Stellenanzeige ein (mindestens 80 Zeichen).'],
};
app.post('/api/ad-keywords', express.json({ limit: '40kb' }), (req, res) => {
  const lang = ['en', 'de'].includes(req.body?.lang) ? req.body.lang : 'pl', E = AD_KW_ERR[lang];
  if (!adKwLimit(req)) return res.status(429).json({ error: E[0] });
  const adText = typeof req.body?.adText === 'string' ? req.body.adText.trim().slice(0, 10000) : '';
  if (adText.length < 80) return res.status(400).json({ error: E[1] });
  if (lang !== 'pl') return res.set('Cache-Control', 'no-store').json({ keywords: adKeywords(adText, lang) });
  const r = scanFallback({ cvText: '-', adText });
  res.set('Cache-Control', 'no-store').json({ keywords: [...r.found, ...r.missing.map((m) => m.keyword)].slice(0, 20) });
});

// --- „Sprawdź CV” i „Test CV pod ATS”: samo CV (bez ogłoszenia) -> tekst odczytany z pliku i sprawdzenie budowy (bez zapisywania) ---
app.post('/api/cv-check', express.json({ limit: '8mb' }), async (req, res) => {
  if (!cvCheckLimit(req)) return res.status(429).json({ error: 'Wykorzystano limit darmowych sprawdzeń na godzinę. Spróbuj później.' });
  const buf = Buffer.from(typeof req.body?.data === 'string' ? req.body.data : '', 'base64');
  if (!buf.length || buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Wgraj CV (PDF, Word lub TXT do 5 MB).' });
  res.set('Cache-Control', 'no-store');
  try { res.json(checkCv(await extractText(buf), buf.length)); }
  catch (e) {
    // Skan albo CV z obrazków: to też jest wynik testu (ATS nie odczyta tekstu), a nie błąd pliku.
    if (e instanceof ImportError && e.code === 'no_text') return res.json({ ...checkCv('', buf.length), issues: ['little_text'], scan: true });
    res.status(422).json({ error: e instanceof ImportError ? e.message : 'Nie udało się odczytać pliku.' }); }
});

// Import kontaktów CSV w panelu może przekraczać ogólny limit 700 KB (parser przed globalnym).
app.use('/api/admin/contacts/import', express.json({ limit: '3mb' }));
// Szkic ogłoszenia z rozszerzenia Chrome (własny limit 20 KB i CORS, więc przed globalnym parserem).
draftRoutes(app);
app.use(express.json({ limit: '700kb' }));
growthRoutes(app, { BASE_URL });
shareRoutes(app, { BASE_URL, imgLimit: shareImgLimit }); // karta wyniku skanera do udostępnienia (/wynik/<id>, 30 dni, obrazki 1080×1080 i 1080×1920)
// Instytucje i partnerzy: zamówienie paczki kodów, zgłoszenie do programu partnerskiego, raporty kodów (przed stronami SEO).
b2bRoutes(app, {
  BASE_URL, demo: DEMO && !SALES_CLOSED, closedFor: (req) => salesClosedFor(req),
  confirm: (b) => confirmB2b(b),
  // Paczki kodów: tylko Stripe (z fakturą przelewową jako alternatywą w formularzu B2B).
  checkout: GATEWAYS.includes('stripe') ? async (b, returnUrl) => {
    const sess = await stripeCheckout({ orderId: b.id, amount: b.total, email: b.email, lang: 'pl', name: `CV Pod Ogłoszenie: paczka ${b.qty} kodów (${PACKAGES[b.pkg]?.name})`, description: `${b.org}: ${b.qty} × ${b.unit / 100} zł`.slice(0, 300), returnUrl });
    await b2bOrders.update(b.id, { stripe: { sessionId: sess.id } });
    return sess.url;
  } : null,
});
seoRoutes(app, BASE_URL);
letterRoutes(app, BASE_URL); // /narzedzia/list-motywacyjny-pod-ogloszenie
landingRoutes(app, BASE_URL); // /kreator-cv i case study „Jedno CV, dwa ogłoszenia”
templateRoutes(app, BASE_URL);
abroadRoutes(app, BASE_URL);
officialRoutes(app, BASE_URL);
portalRoutes(app, BASE_URL); // „CV pod ogłoszenie z <portal>” (lib/portals.js)
employerRoutes(app, BASE_URL);
// Stary adres oferty dla instytucji (z ulotek i wyszukiwarek) → strona dla firm i instytucji.
app.get('/dla-instytucji', (_req, res) => res.redirect(301, '/dla-firm'));
fairRoutes(app, BASE_URL);
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
const cleanAds = (ads) => arr(ads, MAX_ADS).map((a) => ({ title: str(a?.title, 100), text: str(a?.text, 10000), lang: a?.lang in LANGS ? a.lang : 'auto', ...(a?.kind === 'profession' ? { kind: 'profession' } : {}) })).filter((a) => a.text.length >= 80);
// „CV pod zawód” (lib/prof-ad.js): jedno CV bez listu – list motywacyjny i Pakiet 3 mają sens tylko przy prawdziwych ogłoszeniach.
const PROF_ONLY_CV = 'CV pod zawód (bez ogłoszenia) zamawiasz jako jedno CV bez listu. Gdy znajdziesz ogłoszenie, zamów CV z listem pod tę ofertę.';
const profMixError = (a, pkg) => (a.some((x) => x.kind === 'profession') && (a.length > 1 || pkg !== 'cv') ? PROF_ONLY_CV : null);
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
// Rezerwacja kodu przed zapisem zamówienia, w jednej blokadzie zapisu kodów (lib/referral.js: reserveCode).
// Zamówienie za 0 zł (kod od instytucji, saldo) od razu zajmuje kod na stałe; płatne – do opłacenia albo 24 h.
// Rezerwację przejętą od wcześniejszego zamówienia tej osoby zamykamy razem z jego sesją płatności (Stripe),
// a checkout() po utworzeniu płatności sprawdza, czy rezerwacja wciąż należy do zamówienia – rabat nie przejdzie dwa razy.
async function reserveOrderCode(order, base = 0) {
  if (!order.code) return;
  let moved = [];
  const r = await codes.update(order.code, (c) => {
    const h = emailHash(order.profile.email);
    moved = (c.reserved || []).filter((x) => !x.final && x.hash === h && x.order !== order.id).map((x) => x.order);
    return reserveCode(c, { email: order.profile.email, order: order.id, expect: { base, creditUsed: order.creditUsed || 0 }, final: order.total === 0 });
  });
  if (!r) throw new CodeError('Ten kod nie istnieje albo wygasł.');
  for (const id of moved) {
    const o = await getOrder(id).catch(() => null);
    if (o?.status === 'pending' && o.stripe?.sessionId && stripeEnabled()) await stripeExpire(o.stripe.sessionId).catch((e) => logEvent('płatność', `Zamknięcie sesji po przejęciu kodu: ${e.message}`, { orderId: id }));
  }
}
const holdsCode = async (order) => !order.code || order.upsellOf || !!(await codes.get(order.code))?.reserved?.some((x) => x.order === order.id);
// Ślad do wykrycia samopolecenia (lib/referral.js): skrót IP (z solą, bez samego adresu) i konto; usuwany po 48 h (hourly).
const refCtx = (req) => ({ ip: crypto.createHash('sha256').update(`${process.env.CODE_SALT || 'cvpo'}:ip:${req.ip || ''}`).digest('hex').slice(0, 16), acc: accountIdOf(req) || null });
// Zamówienie z kodem polecającym złożone przez właściciela kodu pod innym e-mailem: to samo konto, ten sam e-mail płatnika
// albo to samo konto/IP co zamówienie właściciela w ciągu 24 h → bez nagrody dla właściciela.
async function selfReferral(o) {
  const c = await codes.get(o.code);
  if (!c?.ownerHash || isOwner(c, o.profile.email) || c.commission > 0) return false;
  if (o.payment?.payerHash && o.payment.payerHash === c.ownerHash) return true;
  const ctx = o.refCtx; if (!ctx) return false;
  const acc = await accountEmail(ctx.acc).catch(() => null);
  if (acc && emailHash(acc) === c.ownerHash) return true;
  return Object.values(await allOrders()).some((x) => x.id !== o.id && x.refCtx && emailHash(x.profile?.email) === c.ownerHash && Math.abs((x.created || 0) - (o.created || 0)) < 864e5
    && ((ctx.ip && x.refCtx.ip === ctx.ip) || (ctx.acc && x.refCtx.acc === ctx.acc)));
}
// Ile z salda poleceń faktycznie zeszło w tym zamówieniu (rabat jest przycinany do ceny pakietu).
const creditUsedFor = (c, full, total) => (c.credit ? Math.max(0, Math.min(c.credit, full - total - c.base)) : 0);
// Rabat w groszach: kwotowy albo procentowy (kody akcji promocyjnych z panelu).
// Kod od instytucji (voucher) pokrywa cały pakiet; przy droższym pakiecie klient dopłaca różnicę.
const discountFor = (c, pkg, n, ad, returning, langs) => c.voucher ? (PRICES[pkg] <= PRICES[c.voucher] ? 'voucher' : PRICES[c.voucher]) : (c.percent ? Math.round((calcTotal(pkg, n, ad, returning, langs, 0) * c.percent) / 100) : c.discount || 0);
const discountGr = (disc, pkg) => (disc === 'voucher' ? PRICES[pkg] : disc); // do zapisu w zamówieniu (grosze)
const newCode = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6)}`;
// Zgoda z art. 38 pkt 13 ustawy o prawach konsumenta (ta sama treść w kreatorze i przy dokupieniu dodatku).
const WAIVER = 'Chcę, aby usługa została wykonana od razu po płatności. Wiem, że po jej wykonaniu tracę prawo do odstąpienia od umowy.';
// Test A/B „checkout”: w wariancie B te same dwa osobne pola (zgoda z art. 38 pkt 13 osobno, pełne brzmienie), tylko w układzie kompaktowym; zapisujemy, który formularz widział klient.
const CHECKOUT_FORMS = new Set(['compact']);
// linkedinEn: bezpłatna opcja dodatku „Profil LinkedIn” (profil także po angielsku), tylko razem z nim.
const cleanAddons = (a = {}) => ({ ...Object.fromEntries(Object.keys(ADDONS).map((k) => [k, !!a[k]])), ...(a.linkedin && a.linkedinEn ? { linkedinEn: true } : {}) });
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
  // Oferty w powiadomieniach (Adzuna/Jooble): tylko informacyjnie, bez kluczy e-maile mają same linki do portali.
  checks.oferty_api = feedSources().join(', ') || 'wyłączone';
  const stuck = Object.values(await allOrders().catch(() => ({}))).filter((o) => o.status === 'paid' || (o.status === 'generating' && Date.now() - (o.paidAt || 0) > 30 * 60_000)).length;
  checks.zamowienia = stuck ? `${stuck} czeka na dokumenty` : 'ok';
  const ok = checks.dane === 'ok' && checks.platnosci !== 'błąd' && checks.ai === 'ok' && (DEMO || checks.poczta === 'ok');
  // Bot na Messengerze/Instagramie: tylko informacyjnie, nie wpływa na „ok” (strona działa bez niego).
  const meta = await botStatus().catch(() => ({ bot: 'błąd' }));
  res.status(ok ? 200 : 503).set('Cache-Control', 'no-store').json({ ok, checks, meta, at: new Date().toISOString() });
});
// Metody płatności do linii zaufania w kreatorze: Stripe – włączone w panelu (lib/stripe.js), Przelewy24 – stała lista.
// /api/config to też health check Rendera: lista metod zawsze z pamięci, odświeżana w tle (lib/stripe.js).
// Tryb „both”: gateways = obie bramki (do wyboru w kasie); provider/methods = domyślna (zgodność ze starszym frontem).
const GW_INFO = { stripe: () => ({ id: 'stripe', provider: 'Stripe', methods: stripeMethods() }), p24: () => ({ id: 'p24', provider: 'Przelewy24', methods: ['BLIK', 'przelew online', 'karta'] }) };
const payInfo = () => (DEMO ? null : { ...GW_INFO[GATEWAYS[0]](), gateways: GATEWAYS.map((g) => GW_INFO[g]()), p24Sandbox: GATEWAYS.includes('p24') && process.env.P24_SANDBOX === '1' });
if (GATEWAYS.includes('stripe')) refreshStripeMethods().catch(() => {}); // raz przy starcie
// Typowe wymagania zawodu do „CV pod zawód” (lista do odznaczenia w kreatorze; dane publiczne ze stron zawodów).
app.get('/api/prof-reqs', (req, res) => res.set('Cache-Control', 'public, max-age=3600').json(profReqs(String(req.query.q || '').slice(0, 80))));
app.get('/api/config', (req, res) => res.json({
  pay: payInfo(),
  aiPreview: aiEnabled(), ads: ADS, googleReview: GOOGLE_REVIEW, chromeExt: CHROME_EXT, demo: DEMO, salesClosed: salesClosedFor(req), ai: aiEnabled(), maxAds: MAX_ADS, noPrint: false, maxRevisions: MAX_REVISIONS, langs: LANGS, codeDiscount: CODE_DISCOUNT / 100,
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

// Nowe zamówienie → płatność w wybranej bramce. Gdy bramki nie da się otworzyć (np. błąd rejestracji P24 albo Stripe),
// zwalniamy rezerwację kodu i karnetu i usuwamy nieopłacone zamówienie (klient składa je ponownie) – tak samo dla obu bramek.
// keep: zamówienie zostaje (dokupienie dodatku – kolejna próba używa tej samej pozycji).
class PayOpenError extends Error {}
async function openPayment(order, gateway, { keep = false } = {}) {
  try { return await checkout(order, undefined, gateway); }
  catch (e) {
    if (e instanceof CodeError) throw e;
    logEvent('płatność', `Otwarcie płatności (${pickGateway(gateway) || '?'}): ${e.message}`, { orderId: order.id });
    if (!keep && order.total > 0) {
      if (order.pass) await releasePassOrder(order).catch(() => {});
      if (order.code) await codes.update(order.code, (c) => releaseCode(c, [order.id])).catch(() => {});
      await removeOrder(order.id).catch(() => {});
    }
    throw new PayOpenError('Nie udało się otworzyć płatności. Spróbuj ponownie albo wybierz inną metodę płatności.');
  }
}
// Płatność: Stripe Checkout albo Przelewy24 (gateway: wybór klienta; brak → ostatnio użyta albo domyślna).
// P24: sessionId = numer zamówienia + numer próby, więc wpłatę zawsze da się przypisać do zamówienia; wszystkie sesje
// zamówienia zapamiętujemy (p24Sessions), żeby wpłata ze starszej próby też została rozpoznana.
// Zmiana bramki przy ponownej płatności: otwarta sesja Stripe jest zamykana (bez podwójnej zapłaty), rezerwacje zostają te same.
async function checkout(order, lang, gateway) {
  // Zamówienie za 0 zł (kod od instytucji): bez płatności, dokumenty powstają od razu.
  if (order.total === 0) { await updateOrder(order.id, { payment: order.pass ? { provider: 'karnet', pass: order.pass.id, at: Date.now() } : { provider: 'kod', code: order.code, at: Date.now() } }); markPaidAndGenerate(order.id).catch(console.error); return { id: order.id, free: true }; }
  if (DEMO) return { id: order.id, demo: true };
  // Bez wyboru klienta: ostatnio użyta bramka zamówienia (np. „Dokończ płatność” po porzuconym P24), inaczej domyślna.
  const gw = gateway ? pickGateway(gateway) : (GATEWAYS.includes(order.gateway) ? order.gateway : GATEWAYS[0]);
  if (gw === 'p24' && order.stripe?.sessionId && stripeEnabled()) await stripeExpire(order.stripe.sessionId).catch(() => {});
  if (gw === 'stripe') {
    const l = lang || order.uiLang, n = order.ads?.length || 1;
    const sess = await stripeCheckout({
      orderId: order.id, amount: order.total, email: order.profile.email, lang: l,
      name: `CV Pod Ogłoszenie: ${order.upsell ? `dodatek – ${order.upsell.name}` : PACKAGES[order.pkg]?.name || 'zamówienie'}`,
      description: order.upsell ? `Dodatek do zamówienia ${order.upsellOf.slice(0, 8)}` : [`${n} ${n === 1 ? 'ogłoszenie' : 'ogłoszenia'}`, ...Object.keys(ADDONS).filter((k) => order.addons?.[k]).map((k) => ADDONS[k])].join(', ').slice(0, 300),
      returnUrl: `${BASE_URL}/${['en', 'uk', 'de'].includes(l) ? l : ''}?id=${order.upsellOf || order.id}`, // dodatek: powrót na stronę dokumentów zamówienia
    });
    await updateOrder(order.id, { gateway: 'stripe', payAttempts: (order.payAttempts || 0) + 1, stripe: { sessionId: sess.id } });
    if (!(await holdsCode(order))) { await stripeExpire(sess.id).catch(() => {}); throw new CodeError('Rabat z tego kodu jest już w innym Twoim zamówieniu. Złóż zamówienie ponownie.'); }
    return { id: order.id, url: sess.url };
  }
  const attempt = (order.payAttempts || 0) + 1, sessionId = `${order.id}.${attempt}`;
  const { token, url } = await p24Register({
    sessionId, amount: order.total, email: order.profile.email, language: lang || order.uiLang,
    description: `CV Pod Ogłoszenie, zamówienie ${order.id}`,
    urlReturn: `${BASE_URL}/?id=${order.upsellOf || order.id}`, urlStatus: `${BASE_URL}/api/p24/status`,
  });
  await updateOrder(order.id, (x) => ({ ...x, gateway: 'p24', payAttempts: attempt, p24: { sessionId, token }, p24Sessions: [...(x.p24Sessions || (x.p24?.sessionId ? [x.p24.sessionId] : [])), sessionId].slice(-20) }));
  if (!(await holdsCode(order))) throw new CodeError('Rabat z tego kodu jest już w innym Twoim zamówieniu. Złóż zamówienie ponownie.');
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
  const payment = { provider: 'stripe', sessionId: sess.id, paymentIntent: sess.payment_intent, at: Date.now(), ...(sess.customer_details?.email ? { payerHash: emailHash(sess.customer_details.email) } : {}) };
  if (!(await recordPayment(o, payment))) return false;
  markPaidAndGenerate(o.id).catch(console.error);
  return true;
}
// Zapis płatności tylko do nieopłaconego zamówienia bez zapisanej płatności (w blokadzie zapisu magazynu). Gdy dwa potwierdzenia
// się ścigają (np. Stripe i P24 po zmianie bramki), drugie nie nadpisuje pierwszego: log + alert do zwrotu.
async function recordPayment(o, payment) {
  const x = await updateOrder(o.id, (y) => (y.status === 'pending' && !y.payment ? { ...y, payment } : y));
  if (x?.payment?.provider === payment.provider && x.payment.sessionId === payment.sessionId) return true;
  logEvent('płatność', `Druga płatność (${payment.provider}, ${payment.sessionId}) do zamówienia już opłaconego przez ${x?.payment?.provider || '?'} – niepotwierdzona w serwisie, do zwrotu`, { orderId: o.id });
  alertOwner(`Druga płatność do zamówienia ${o.id}: ${payment.provider} (${payment.sessionId}); zamówienie opłacono już przez ${x?.payment?.provider || '?'}. Zwróć drugą wpłatę w panelu operatora.`);
  return false;
}
// Potwierdzenie wpłaty (z powiadomienia albo po powrocie klienta): verify w Przelewy24, potem generowanie.
async function confirmP24(o, p24OrderId, amount, verified = false, sessionId = o.p24?.sessionId) {
  if (amount !== o.total) { logEvent('płatność', `Kwota ${amount} nie zgadza się z zamówieniem`, { orderId: o.id }); return false; }
  if (!verified && !(await p24Verify({ sessionId, orderId: p24OrderId, amount }))) return false;
  if (!(await recordPayment(o, { provider: 'przelewy24', orderId: p24OrderId, sessionId, at: Date.now() }))) return false;
  markPaidAndGenerate(o.id).catch(console.error);
  return true;
}
app.post('/api/p24/status', async (req, res) => {
  const n = req.body || {};
  if (!p24Enabled() || !p24NotificationOk(n)) return res.sendStatus(400);
  res.sendStatus(200);
  const o = await getOrder(String(n.sessionId).split('.')[0]);
  const ours = o && (o.p24Sessions || [o.p24?.sessionId]).includes(n.sessionId);
  if (!ours) return;
  // Wpłata P24 do zamówienia już opłaconego inną drogą (np. Stripe po zmianie bramki): bez verify, log i alert do zwrotu.
  if (o.status !== 'pending') {
    if (o.payment?.sessionId !== n.sessionId) { logEvent('płatność', `Przelewy24: wpłata ${n.amount / 100} zł (P24 ${n.orderId}) do zamówienia już opłaconego (${o.payment?.provider || '?'}) – niepotwierdzona, do zwrotu`, { orderId: o.id }); alertOwner(`Przelewy24: druga wpłata do opłaconego zamówienia ${o.id} (transakcja ${n.orderId}, ${n.amount / 100} zł). Nie została potwierdzona – sprawdź w panelu P24 i zwróć klientowi.`); }
    return;
  }
  confirmP24(o, n.orderId, n.amount, false, n.sessionId).catch((e) => logEvent('płatność', e.message, { orderId: o.id }));
});
// Klient wrócił bez zapłaty: nowa próba płatności dla tego samego zamówienia.
app.post('/api/orders/:id/pay', async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.status !== 'pending') return res.status(409).json({ error: 'To zamówienie jest już opłacone.' });
  // Rezerwacja kodu mogła wygasnąć (24 h) albo przejść na nowsze zamówienie tej osoby: zajmujemy kod ponownie.
  const gw = pickGateway(req.body?.gateway); if (!gw && !DEMO) return res.status(400).json({ error: BAD_GATEWAY });
  if (!o.upsellOf) try { await reserveOrderCode(o, o.codeBase || 0); } catch (e) { if (e instanceof CodeError) return res.status(409).json({ error: `${e.message} Złóż zamówienie ponownie.` }); throw e; }
  // Bez pola gateway checkout bierze ostatnio użytą bramkę zamówienia.
  try { res.json(await checkout(o, undefined, req.body?.gateway ? gw : undefined)); } catch (e) { logEvent('płatność', e.message, { orderId: o.id }); res.status(502).json({ error: 'Nie udało się otworzyć płatności. Spróbuj za chwilę.' }); }
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

previewRoutes(app, { cleanProfile, cleanAds });

app.post('/api/orders', async (req, res) => {
  if (salesClosedFor(req)) return res.status(503).json({ error: CLOSED_MSG });
  try {
    const { profile, ads, consent, design, addons, extraLangs, code, reminder, followUp, jobAlerts, reviewAsk, outcomeAsk, payReminder, uiLang, createAccount, invoice, adConsent, usePass, draftToken, waiver, consentForm } = req.body || {};
    let { pkg } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Wymagana zgoda na przetwarzanie danych.' });
    if (!DEMO && !pickGateway(req.body?.gateway)) return res.status(400).json({ error: BAD_GATEWAY });
    const a = cleanAds(ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    if (profMixError(a, usePass ? 'cv_letter' : pkg)) return res.status(400).json({ error: PROF_ONLY_CV });
    const p = cleanProfile(profile);
    if (!p.name || !/^\S+@\S+\.\S+$/.test(p.email)) return res.status(400).json({ error: 'Podaj imię i nazwisko oraz poprawny e-mail.' });
    if (!p.experience.length && !p.education.length) return res.status(400).json({ error: 'Dodaj doświadczenie lub wykształcenie.' });
    const ad = cleanAddons(addons), langs = usefulExtraLangs(cleanLangs(extraLangs), a);
    // Karnet (lib/passes.js): każde ogłoszenie = 1 dopasowanie (CV + list), bez kodów rabatowych; dopłata tylko za to, czego karnet nie obejmuje.
    const orderId = crypto.randomUUID();
    let passUse = null;
    if (usePass) {
      if (code) return res.status(400).json({ error: 'Kodu rabatowego nie łączymy z karnetem.' });
      try { passUse = await reservePass(accountIdOf(req), { ads: a.length, addons: ad, extraLangs: langs, orderId }); }
      catch (e) { return res.status(e instanceof PassError ? 400 : 500).json({ error: e instanceof PassError ? e.message : 'Nie udało się użyć karnetu.' }); }
      pkg = a.length > 1 ? 'pack3' : 'cv_letter';
    }
    const c = passUse ? {} : await checkCode(code, p.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const inv = cleanInvoice(invoice);
    if (inv?.error) { if (passUse) await releasePassOrder({ id: orderId, pass: { id: passUse.passId } }).catch(() => {}); return res.status(400).json({ error: inv.error }); }
    const disc = passUse ? 0 : discountFor(c, pkg, a.length, ad, false, langs), total = passUse ? passUse.total : calcTotal(pkg, a.length, ad, false, langs, disc);
    // Art. 38 pkt 13 ustawy o prawach konsumenta: płatne zamówienie tylko ze zgodą na wykonanie od razu (karnet i 0 zł bez blokady).
    if (total > 0 && waiver !== true) { if (passUse) await releasePassOrder({ id: orderId, pass: { id: passUse.passId } }).catch(() => {}); return res.status(400).json({ error: 'Zaznacz zgodę na wykonanie usługi od razu po płatności.' }); }
    const shown = await previewFor(p, a[0]).catch(() => null); // podgląd z ostatniego kroku kreatora, jeśli był
    const order = { preview: shown, visit: visitInfo(req), refCtx: refCtx(req), invoice: total > 0 ? inv : null, id: orderId, ...(passUse ? { pass: { id: passUse.passId, use: passUse.use, items: passUse.items } } : {}), pkg, addons: ad, extraLangs: langs, code: c.code || null, codeBase: c.base || 0, discount: discountGr(disc, pkg), creditUsed: creditUsedFor(c, calcTotal(pkg, a.length, ad, false, langs, 0), total), total, profile: p, ads: a, design: cleanDesign(design), reminder: { consent: !!reminder, sent: false }, followUp: { consent: !!followUp, sent: false }, jobAlerts: jobAlerts && str(jobAlerts.job, 60).length >= 2 ? { job: str(jobAlerts.job, 60), city: str(jobAlerts.city, 40) } : null, reviewAsk: { consent: !!reviewAsk, sent: false }, outcomeAsk: outcomeAsk === true ? { consent: true, text: OUTCOME_CONSENT, at: Date.now(), sent: false } : { consent: false, sent: false }, payReminder: { consent: !!payReminder, sent: false }, uiLang: ['en', 'uk', 'de'].includes(uiLang) ? uiLang : 'pl', createAccount: !!createAccount, ...(waiver === true ? { waiver: { text: WAIVER, at: Date.now(), ...(CHECKOUT_FORMS.has(consentForm) ? { form: consentForm } : {}) } } : {}), status: 'pending', results: [], revisions: 0, maxRevisions: MAX_REVISIONS, created: Date.now(), adConsent: adConsent === true, ...(adConsent === true ? { adCtx: adContext(req, req.body) } : {}) };
    try { await reserveOrderCode(order, c.base); } catch (e) {
      if (passUse) await releasePassOrder({ id: orderId, pass: { id: passUse.passId } }).catch(() => {});
      if (e instanceof CodeError) return res.status(409).json({ error: e.message }); throw e;
    }
    if (draftToken) { const ref = await draftOrdered(String(draftToken)).catch(() => null); if (ref) order.draftRef = ref; } // bez przypomnienia o szkicu po złożeniu zamówienia
    await saveOrder(order);
    funnelOrder(order).catch(() => {}); // test „scanner”: etap „zamówienie” per wariant
    res.json(await openPayment(order, req.body?.gateway));
  } catch (e) { if (!(e instanceof PayOpenError)) console.error(e); res.status(e instanceof PayOpenError ? 502 : 400).json({ error: e.message || 'Błąd' }); }
});

// Kolejne zamówienie klienta, który już kupował: dane są zapisane, wybiera pakiet (1 ogłoszenie albo Pakiet 3).
app.post('/api/orders/:id/followup', async (req, res) => {
  if (salesClosedFor(req)) return res.status(503).json({ error: CLOSED_MSG });
  try {
    const parent = await getOrder(req.params.id);
    if (!parent || parent.status !== 'done') return res.status(409).json({ error: 'Najpierw dokończ poprzednie zamówienie.' });
    if (!DEMO && !pickGateway(req.body?.gateway)) return res.status(400).json({ error: BAD_GATEWAY });
    const a = cleanAds(req.body?.ads);
    if (!a.length) return res.status(400).json({ error: 'Wklej treść ogłoszenia (min. 80 znaków).' });
    const ad = cleanAddons(req.body?.addons), langs = usefulExtraLangs(cleanLangs(req.body?.extraLangs), a);
    const pkg = ['cv', 'cv_letter', 'pack3'].includes(req.body?.pkg) ? req.body.pkg : parent.pkg;
    if (profMixError(a, pkg)) return res.status(400).json({ error: PROF_ONLY_CV });
    // Kolejne CV pod nowe ogłoszenie 19 zł (z listem 29 zł) przez 30 dni od opłacenia poprzedniego zamówienia: tylko CV / CV z listem
    // (nie „Pewna rozmowa”), bez kodów rabatowych i salda poleceń (nie łączy się). Poza tym zwykła cena i kody jak dotąd.
    const isNext = nextEligible(parent) && (pkg === 'cv' || pkg === 'cv_letter') && !hasBundle(pkg, ad), ret = isNext ? 'next' : true;
    const c = isNext ? {} : await checkCode(req.body?.code, parent.profile.email);
    if (c.error) return res.status(400).json({ error: c.error });
    const disc = discountFor(c, pkg, a.length, ad, ret, langs), total = calcTotal(pkg, a.length, ad, ret, langs, disc);
    if (total > 0 && req.body?.waiver !== true) return res.status(400).json({ error: 'Zaznacz zgodę na wykonanie usługi od razu po płatności.' });
    const order = { id: crypto.randomUUID(), ...(req.body?.waiver === true ? { waiver: { text: WAIVER, at: Date.now() } } : {}), refCtx: refCtx(req), uiLang: parent.uiLang, parentId: parent.id, rootId: parent.rootId || parent.id, pkg, addons: ad, extraLangs: langs, code: c.code || null, codeBase: c.base || 0, discount: discountGr(disc, pkg), creditUsed: creditUsedFor(c, calcTotal(pkg, a.length, ad, ret, langs, 0), total), total, ...(isNext ? { next: true } : {}), profile: parent.profile, ads: a, design: parent.design, reminder: { consent: false, sent: false }, status: 'pending', results: [], revisions: 0, maxRevisions: MAX_REVISIONS, created: Date.now() };
    try { await reserveOrderCode(order, c.base); } catch (e) { if (e instanceof CodeError) return res.status(409).json({ error: e.message }); throw e; }
    await saveOrder(order);
    res.json(await openPayment(order, req.body?.gateway));
  } catch (e) { if (!(e instanceof PayOpenError)) console.error(e); res.status(e instanceof PayOpenError ? 502 : 400).json({ error: e.message || 'Błąd' }); }
});

const view = (o, extra = {}) => ({
  ...extra, id: o.id, pkg: o.pkg, addons: o.addons || {}, extraLangs: o.extraLangs || [], total: o.total, status: o.status, results: (o.results || []).map(({ qa, ...r }) => r), error: o.error, mail: o.mail,
  design: cleanDesign(o.design), photo: o.profile.photo || '', email: o.profile.email, parentId: o.parentId || null,
  paidAt: o.paidAt || null, gateway: o.gateway || null, createAccount: !!o.createAccount, canPay: o.status === 'pending' && !DEMO, revisionsLeft: revLimit(o) - (o.revisions || 0), expires: (o.created || 0) + RETENTION_MS,
  invoice: o.invoice?.pdf ? { number: o.invoice.number } : null, heard: !!o.heard,
});

// Faktura PDF dla klienta (link na stronie dokumentów; adres zamówienia jest nie do zgadnięcia, jak przy dokumentach).
app.get('/api/orders/:id/invoice.pdf', async (req, res) => {
  const inv = await invoices.get(req.params.id);
  if (!inv) return res.sendStatus(404);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoiceFile(inv)}"`, 'Cache-Control': 'private, no-store' }).send(await renderInvoice(inv));
});

// Stan zamówienia; po powrocie z Przelewy24 sprawdza płatność u źródła (gdyby powiadomienie się spóźniło).
// Po powrocie z płatności (gdy powiadomienie jeszcze nie dotarło): sprawdzenie sesji Stripe / transakcji Przelewy24.
async function refreshPayment(o) {
  if (o.status === 'pending' && o.stripe?.sessionId && stripeEnabled()) {
    const sess = await stripeSession(o.stripe.sessionId).catch(() => null);
    if (sess && (await confirmStripe(o, sess).catch(() => false))) o = await getOrder(o.id);
  }
  if (o.status === 'pending' && !DEMO && o.p24?.sessionId) {
    const t = await p24BySession(o.p24.sessionId);
    if (t && (t.status === 1 || t.status === 2) && (await confirmP24(o, t.orderId, t.amount, t.status === 2).catch(() => false))) o = await getOrder(o.id);
  }
  return o;
}
app.get('/api/orders/:id', async (req, res) => {
  let o = await getOrder(req.params.id);
  if (!o) return res.sendStatus(404);
  o = await refreshPayment(o);
  // Dodatki dokupione po zamówieniu: powrót z płatności prowadzi na stronę zamówienia, więc tu potwierdzamy też ich płatność.
  let upsellBusy = false;
  for (const uid of o.upsellIds || []) {
    // W Stripe/P24 sprawdzamy tylko świeże próby (do 24 h); starsze zostają, jak są.
    const u = await getOrder(uid).then((x) => x && (Date.now() - x.created < 864e5 ? refreshPayment(x) : x)).catch(() => null);
    if (u && ['generating', 'paid'].includes(u.status)) upsellBusy = true;
  }
  if (o.upsellIds?.length) o = await getOrder(o.id);
  const offers = upsellBusy || Date.now() - (o.created || 0) > RETENTION_MS - 3 * 864e5 ? [] : upsellOffers(o); // dodatki do ok. 27. dnia (dane znikają po 30)
  if (offers.length && !o.upsellShown) { await updateOrder(o.id, { upsellShown: Date.now() }); countEvent('upsell_shown').catch(() => {}); }
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
  res.json(view(o, { myCode, review: rv ? { rating: rv.rating, text: rv.text } : null, upsells: offers.map(({ key, name, price, includes }) => ({ key, name, price: price / 100, includes })), upsellBusy }));
});

// Karta „Dodaj do zamówienia”: osobna płatność tylko za dodatek (różnica ceny), po opłaceniu dodatek trafia do tego zamówienia.
app.post('/api/orders/:id/upsell', async (req, res) => {
  if (salesClosedFor(req)) return res.status(503).json({ error: CLOSED_MSG });
  try {
    const p = await getOrder(req.params.id);
    if (!p || p.status !== 'done' || p.upsellOf) return res.status(409).json({ error: 'Dodatki można dokupić do gotowego zamówienia.' });
    if (fullyRefunded(p)) return res.status(409).json({ error: REFUNDED_MSG });
    const plan = upsellOffers(p).find((x) => x.key === req.body?.key);
    if (!plan) return res.status(400).json({ error: 'Ten dodatek nie jest już dostępny dla tego zamówienia.' });
    // Art. 38 pkt 13 ustawy o prawach konsumenta: zgoda na wykonanie od razu po płatności, jak przy zamówieniu (zapis treści i czasu).
    if (req.body?.waiver !== true) return res.status(400).json({ error: 'Zaznacz zgodę na wykonanie usługi od razu po płatności.' });
    if (!DEMO && !pickGateway(req.body?.gateway)) return res.status(400).json({ error: BAD_GATEWAY });
    // Niezapłacona wcześniejsza próba tego samego dodatku: używamy jej ponownie (bez mnożenia zamówień).
    let u = null;
    for (const uid of p.upsellIds || []) { const x = await getOrder(uid); if (x?.status === 'pending' && x.upsell?.key === plan.key) u = x; }
    if (u && !(u.upsell.pkg === plan.pkg && u.total === plan.price)) u = null;
    if (!u) {
      u = { id: crypto.randomUUID(), upsellOf: p.id, waiver: { text: WAIVER, at: Date.now() }, upsell: { key: plan.key, name: plan.name, pkg: plan.pkg, addons: plan.addons }, pkg: p.pkg, addons: {}, extraLangs: [], ads: [], total: plan.price, discount: 0,
        profile: { name: p.profile.name, email: p.profile.email }, invoice: p.invoice ? { name: p.invoice.name, address: p.invoice.address, nip: p.invoice.nip || '' } : null, uiLang: p.uiLang, status: 'pending', results: [], created: Date.now() };
      await saveOrder(u);
      await updateOrder(p.id, (x) => ({ ...x, upsellIds: [...(x.upsellIds || []), u.id].slice(-20) }));
    }
    res.json(await openPayment(u, req.body?.gateway, { keep: true }));
  } catch (e) { if (!(e instanceof PayOpenError)) console.error(e); res.status(e instanceof PayOpenError ? 502 : 400).json({ error: e.message || 'Błąd' }); }
});

// Opinia klienta: tylko po gotowym zamówieniu, jedna na zamówienie (można ją zmienić).
// „Skąd nas znasz?” po płatności (lib/heard.js): raz na zamówienie, opcjonalne.
app.post('/api/orders/:id/heard', async (req, res) => {
  const o = await getOrder(String(req.params.id)); if (!o || o.status === 'pending' || o.upsellOf) return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
  let h; try { h = heardInput(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
  if (o.heard) return res.json({ ok: true });
  await updateOrder(o.id, { heard: { ...h, at: Date.now() } });
  countEvent(`heard:${h.src}`).catch(() => {});
  res.json({ ok: true });
});
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
  res.set('Cache-Control', 'public, max-age=600').json({ cvs: (t.cvs || 0) >= COUNTER_FROM ? t.cvs : null, outcome: await publicOutcome().catch(() => null) });
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

// Mail do polecającego przy naliczeniu 10 zł: adres z zamówienia, przy którym dostał kod (kody trzymają tylko skrót e-maila);
// gdy to zamówienie jest już usunięte (po 30 dniach), maila nie wysyłamy – saldo i tak widać na stronie dokumentów i przy zamówieniu.
async function referralMail(c) {
  if (!mailEnabled() || !c.ownerOrderId) return;
  const owner = await getOrder(c.ownerOrderId);
  if (!owner?.profile?.email || !isOwner(c, owner.profile.email)) return;
  await sendReferralMail(owner.profile.email, c, owner.uiLang || 'pl', BASE_URL, REF_CAP);
}
// Po opłaceniu: zapisujemy użycie kodu i dajemy klientowi jego kod (jeden na klienta, także przy kolejnych zamówieniach).
async function afterPaid(o) {
  try {
    if (o.code) {
      // Zamówienie z kodem opłacone bez rezerwacji (np. stary link Przelewy24 po przejęciu kodu przez nowsze zamówienie).
      if (!o.upsellOf && !(await holdsCode(o).catch(() => true)) && o.maxRevisions != null) { // starsze zamówienia (bez maxRevisions) nie miały rezerwacji
        logEvent('kody', `Opłacone bez rezerwacji kodu ${o.code}`, { orderId: o.id });
        alertOwner(`Zamówienie ${o.id} z kodem ${o.code} zostało opłacone bez rezerwacji kodu (np. stary link do płatności po złożeniu nowszego zamówienia). Rabat mógł zostać użyty dwa razy – sprawdź w panelu → Zamówienia.`);
      }
      const selfRef = await selfReferral(o).catch(() => false);
      if (selfRef) logEvent('kody', `Samopolecenie: kod ${o.code} bez nagrody`, { orderId: o.id });
      const before = await codes.get(o.code);
      const after = await codes.update(o.code, (c) => applyPaidCode(c, { email: o.profile.email, creditUsed: o.creditUsed || 0, total: o.total || 0, order: o.id, selfRef }));
      if (after && (after.referrals || 0) > (before?.referrals || 0)) referralMail(after).catch((e) => logEvent('e-mail', `Polecenie: ${e.message}`));
    }
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
    if (o.upsellOf) return await applyUpsell(o);
    const paidO = await updateOrder(id, (x) => ({ ...x, status: 'generating', paidAt: x.paidAt || Date.now() }));
    const passFree = !!o.pass && !(o.total > 0); // zamówienie w całości z karnetu: przychód był przy zakupie karnetu
    if (!o.paidAt && !passFree) funnelPaid(paidO).catch(() => {}); // etap „Opłacone” w lejku liczy serwer, raz na zamówienie
    if (o.pass) passOrderPaid(paidO).catch((e) => logEvent('karnet', e.message, { orderId: id })); // rezerwacja karnetu → zużycie
    if (!o.paidAt && o.draftRef) draftPaid(o.draftRef).catch(() => {}); // szkic z „Wyślij mi link” usuwamy po opłaceniu
    if (!o.paidAt) { if (!passFree) recordSale(paidO).catch((e) => console.error('Rejestr sprzedaży', e.message)); notifyNewOrder(paidO, BASE_URL).catch((e) => logEvent('e-mail', `Powiadomienie o zamówieniu: ${e.message}`)); }
    if (!o.paidAt && paidO.invoice) autoInvoice(paidO).catch((e) => logEvent('faktura', e.message, { orderId: id }));
    if (!o.paidAt && paidO.adConsent) sendPurchase(paidO, BASE_URL).then((r) => r && updateOrder(id, { capi: r })).catch((e) => logEvent('reklamy', `Meta CAPI: ${e.message}`, { orderId: id }));
    const withLetter = hasLetter(o.pkg);
    const results = await Promise.all(o.ads.map(async (ad, i) => {
      const gen = () => generateForAd({ profile: o.profile, ad, withLetter, addons: o.addons, preview: i === 0 ? o.preview : null });
      let r = await gen(), qa = await qaOf(r, o, ad, withLetter);
      // Błąd krytyczny (placeholder, firma spoza profilu, zły język, klauzula…): jedna ponowna generacja, zostaje lepsza wersja.
      if (hasCritical(qa) && aiEnabled()) {
        const r2 = await gen().catch(() => null), qa2 = r2 && (await qaOf(r2, o, ad, withLetter));
        if (r2 && crit(qa2) <= crit(qa)) { r = r2; qa = qa2; }
        qa = { ...qa, retried: true };
      }
      r.qa = qa;
      const langs = (o.extraLangs || []).filter((l) => l !== r.lang);
      if (langs.length) r.variants = Object.fromEntries(await Promise.all(langs.map(async (l) => [l, await translateResult(r, l)])));
      return r;
    }));
    const qaScores = results.map((r) => r.qa.score).filter((x) => x != null);
    const qaSum = { score: qaScores.length ? Math.min(...qaScores) : null, flags: [...new Set(results.flatMap((r) => r.qa.flags.map((f) => f.code)))], retried: results.some((r) => r.qa.retried) };
    recordQa(results.map((r) => r.qa)).catch(() => {});
    if (results.some((r) => hasCritical(r.qa))) qaAlert(id, results);
    const myCode = await afterPaid(o);
    if (o.jobAlerts) addAlertFromOrder({ email: o.profile.email, ...o.jobAlerts, lang: o.uiLang }).catch((e) => logEvent('oferty', e.message, { orderId: id }));
    const mail = await trySend({ ...o, results, myCode });
    await updateOrder(id, { status: 'done', results, mail, myCode, qa: qaSum });
    results.forEach((r, i) => recordStatsSafe({ title: `${o.ads[i]?.title || ''} | ${r.position || ''}`, company: [r.company, o.ads[i]?.company], found: r.match?.found, missing: r.match?.missing }));
    stats.upsert('totals', (p = {}) => ({ cvs: (p.cvs || 0) + results.length, orders: (p.orders || 0) + 1 })).catch(() => {});
  } catch (e) {
    console.error('Generowanie nie powiodło się', id, e);
    logEvent('generowanie', e.message, { orderId: id });
    // Płatność zostaje; strona sama ponawia generowanie (retryFailed), a gotowe dokumenty idą e-mailem.
    await updateOrder(id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Generowanie nie powiodło się.' }));
    alertOwner(`Zamówienie ${id} jest opłacone, ale nie udało się wygenerować dokumentów.\n\nBłąd: ${e.message}\n\nStrona ponawia generowanie co 15 minut przez 3 dni, a klient dostanie dokumenty e-mailem. Jeśli błąd mówi o środkach (credit balance / billing), doładuj konto na console.anthropic.com. Szczegóły: panel → Problemy.`);
  } finally { inFlight.delete(id); }
}

// Opłacony dodatek: rejestr sprzedaży, faktura, a w zamówieniu nowy pakiet/dodatki i wygenerowane brakujące części
// (list motywacyjny, przygotowanie do rozmowy). CV, które klient mógł już poprawić, zostaje bez zmian.
async function applyUpsell(o) {
  const p = await getOrder(o.upsellOf);
  if (!p) {
    // Główne zamówienie już nie istnieje (np. usunięte po 30 dniach): bez ponawiania, właściciel robi zwrot.
    await updateOrder(o.id, (x) => ({ ...x, status: 'failed', paidAt: x.paidAt || Date.now(), error: 'Brak zamówienia, do którego kupiono dodatek.' }));
    logEvent('płatność', 'Opłacony dodatek bez zamówienia głównego – zwrot', { orderId: o.id });
    alertOwner(`Opłacony dodatek ${o.id} (${o.upsell?.name}) dotyczy zamówienia, którego już nie ma. Zrób zwrot w panelu → Zamówienia.`);
    return;
  }
  const paidO = await updateOrder(o.id, (x) => ({ ...x, status: 'generating', paidAt: x.paidAt || Date.now() }));
  if (!o.paidAt) {
    recordSale(paidO).catch((e) => console.error('Rejestr sprzedaży', e.message));
    notifyNewOrder(paidO, BASE_URL).catch((e) => logEvent('e-mail', `Powiadomienie o zamówieniu: ${e.message}`));
    if (paidO.invoice) autoInvoice(paidO).catch((e) => logEvent('faktura', e.message, { orderId: o.id }));
    countEvent('upsell_paid').catch(() => {});
  }
  const u = o.upsell, letter = hasLetter(u.pkg) && !hasLetter(p.pkg), interview = !!u.addons.interview && !p.addons?.interview, linkedin = !!u.addons.linkedin && !p.addons?.linkedin, messages = !!u.addons.messages && !p.addons?.messages;
  // Generujemy tylko nowe części; tłumaczymy też tylko je (CV w innych językach zostaje bez zmian).
  const parts = (letter || interview) ? await Promise.all(p.ads.map(async (ad, i) => {
    const r = await generateForAd({ profile: p.profile, ad, withLetter: hasLetter(u.pkg), addons: u.addons });
    const add = { ...(letter ? { letter: r.letter } : {}), ...(interview ? { interview: r.interview, prep: r.prep } : {}) };
    const langs = Object.keys(p.results?.[i]?.variants || {}), tr = {};
    for (const l of langs) { const t = await translateResult({ lang: r.lang, cv: { name: p.results[i].cv?.name || '' }, ...add }, l); tr[l] = Object.fromEntries(Object.keys(add).map((k) => [k, t[k]])); }
    return { add, tr };
  })) : [];
  // Profil LinkedIn dokupiony po zakupie: tylko profil, na podstawie gotowego CV (bez generowania CV od nowa).
  // Kontrola jakości jak przy zamówieniu: przy krytycznej fladze li_* jedna ponowna generacja, potem alert do właściciela.
  // Profil trafia też do każdej wersji językowej CV (tłumaczony jak list), żeby zakładka nie znikała po zmianie języka.
  if (linkedin) {
    const bad = [];
    await Promise.all(p.ads.map(async (ad, i) => {
      const r = p.results?.[i]; if (!r) return;
      const { li, qa, bad: failed } = await linkedinChecked({ profile: p.profile, ad, result: r });
      if (failed) bad.push({ ...r, qa });
      const tr = { ...(parts[i]?.tr || {}) };
      for (const l of Object.keys(r.variants || {})) { const t = await translateResult({ lang: r.lang, cv: { name: r.cv?.name || '' }, linkedin: li }, l); tr[l] = { ...(tr[l] || {}), linkedin: t.linkedin }; }
      parts[i] = { add: { ...(parts[i]?.add || {}), linkedin: li }, tr };
    }));
    if (bad.length) qaAlert(p.id, bad);
  }
  // Wiadomości do rekrutera dokupione po zakupie: na podstawie gotowego CV, tłumaczone do każdej wersji językowej.
  if (messages) {
    await Promise.all(p.ads.map(async (ad, i) => {
      const r = p.results?.[i]; if (!r) return;
      const m = await generateMessages({ profile: p.profile, ad, result: r });
      const tr = { ...(parts[i]?.tr || {}) };
      for (const l of Object.keys(r.variants || {})) { const t = await translateResult({ lang: r.lang, cv: { name: r.cv?.name || '' }, messages: m }, l); tr[l] = { ...(tr[l] || {}), messages: t.messages }; }
      parts[i] = { add: { ...(parts[i]?.add || {}), messages: m }, tr };
    }));
  }
  // Scalanie na aktualnym stanie zamówienia (poprawki klienta i równoległy drugi dodatek zostają); pakietu nigdy nie obniżamy.
  const next = await updateOrder(p.id, (x) => ({ ...x, pkg: hasLetter(x.pkg) ? x.pkg : u.pkg, addons: { ...x.addons, ...u.addons },
    results: parts.some(Boolean) ? (x.results || []).map((r, i) => (parts[i] ? { ...r, ...parts[i].add, ...(r.variants ? { variants: Object.fromEntries(Object.entries(r.variants).map(([l, v]) => [l, { ...v, ...(parts[i].tr[l] || {}) }])) } : {}) } : r)) : x.results }));
  await updateOrder(o.id, { status: 'done' });
  if (letter || interview || linkedin || messages) trySend({ ...next, myCode: next.myCode }).then((mail) => updateOrder(p.id, { mail })).catch((e) => logEvent('e-mail', `Dodatek: ${e.message}`, { orderId: p.id }));
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

// Kontrola jakości (lib/qa.js): liczba stron z PDF-u, który i tak dostanie klient.
const crit = (qa) => qa.flags.filter((f) => f.level === 'critical').length;
async function qaOf(r, o, ad, withLetter) {
  let pages = null; try { pages = (await renderCv(r, o.design, o.profile?.photo)).pages; } catch {}
  try { return checkResult(r, { profile: o.profile, ad, withLetter, pages, linkedin: !!o.addons?.linkedin, linkedinEn: !!o.addons?.linkedinEn }); } catch (e) { logEvent('generowanie', `Kontrola jakości: ${e.message}`); return { score: null, flags: [] }; }
}
// Dalej źle po ponownej generacji: alert do właściciela bez treści CV – tylko id zamówienia i kody flag (osobny limit: raz na godzinę).
let lastQaAlert = 0;
function qaAlert(id, results) {
  logEvent('generowanie', 'Kontrola jakości: błędy krytyczne po ponownej generacji', { orderId: id });
  if (!mailEnabled() || !process.env.CONTACT_EMAIL || Date.now() - lastQaAlert < 3600_000) return;
  lastQaAlert = Date.now();
  const lines = results.map((r, i) => `Ogłoszenie ${i + 1}: wynik ${r.qa.score}/100; ${r.qa.flags.map((f) => `${QA_LABELS[f.code] || f.code}${f.level === 'critical' ? ' (krytyczne)' : ''}`).join(', ') || 'bez uwag'}`);
  sendAdminAlert('Kontrola jakości: dokumenty do sprawdzenia', `Zamówienie ${id}: po jednej ponownej generacji dokumenty nadal mają błędy krytyczne.\n\n${lines.join('\n')}\n\nSprawdź je w panelu → Zamówienia (możesz poprawić i wysłać ponownie).`).catch((e) => logEvent('e-mail', `Ostrzeżenie QA: ${e.message}`));
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
  const name = docFile(doc, r.cv?.name || d.o.profile?.name, base.position, r.lang, 'docx');
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
  if (fullyRefunded(o)) return res.status(409).json({ error: REFUNDED_MSG });
  if ((o.revisions || 0) >= revLimit(o)) return res.status(429).json({ error: 'Wykorzystano limit poprawek. Napisz do nas, jeśli dokument nadal wymaga zmian.' });
  const doc = req.body?.doc === 'letter' && hasLetter(o.pkg) ? 'letter' : 'cv';
  const instruction = str(req.body?.instruction, 500);
  if (instruction.length < 3) return res.status(400).json({ error: 'Opisz, co zmienić.' });
  try {
    const lang = str(req.body?.lang, 5), base = o.results[i], target = base.variants?.[lang] || base;
    const out = await reviseDoc({ profile: o.profile, ad: o.ads[i], result: target, doc, instruction });
    // Tożsamość zostaje z oryginału (imię i nazwisko, kontakt; zdjęcie jest w profilu): poprawka nie zrobi CV dla innej osoby.
    const r = { ...target, ...(doc === 'letter' ? { letter: str(out.letter, 8000) } : { cv: { ...cleanCv(out.cv), name: target.cv?.name || '', contact: target.cv?.contact || [] } }) };
    // Klient dopisał brakujące wymaganie: przenosimy je w raporcie do spełnionych.
    const resolves = str(req.body?.resolves, 120);
    if (resolves && r.match?.missing?.some((m) => m.keyword === resolves)) {
      const found = [...r.match.found, resolves], missing = r.match.missing.filter((m) => m.keyword !== resolves);
      r.match = { found, missing, score: Math.round((100 * found.length) / (found.length + missing.length)) };
    }
    const merged = base.variants?.[lang] ? { ...base, variants: { ...base.variants, [lang]: r } } : { ...r, variants: base.variants };
    const results = o.results.map((x, k) => (k === i ? merged : x));
    await updateOrder(o.id, { results, revisions: (o.revisions || 0) + 1 });
    res.json({ result: merged, note: str(out.note, 300), revisionsLeft: revLimit(o) - (o.revisions || 0) - 1 });
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
outcomeRoutes(app, { BASE_URL });
passRoutes(app, { BASE_URL, DEMO: DEMO && !SALES_CLOSED, cleanInvoice, closedFor: salesClosedFor });
wizardDraftRoutes(app, { BASE_URL, DEMO: DEMO && !SALES_CLOSED });
offerRoutes(app);
analyticsRoutes(app, BASE_URL);
seoReportRoutes(app);
// Lejek z wczoraj w porannym podsumowaniu (same liczby).
addDailySection(async (now) => { const y = dayKey(now.getTime() - 864e5); return funnelText(await funnelRange(y, y)); });
adminRoutes(app, { DEMO, BASE_URL, markPaidAndGenerate, trySend, retentionMs: RETENTION_MS, autoInvoice });

// Dane zamówień (w tym zdjęcia) kasujemy po 30 dniach.
// Co godzinę: kasowanie starych zamówień i kodów oraz jednorazowe przypomnienie po 7 dniach (tylko za zgodą klienta).
const PAY_REMINDER_AFTER = 3 * 3600_000;
// Rezerwacje kodów z zamówień nieopłaconych przez 24 h (albo usuniętych) wracają do puli.
async function releaseStaleCodes() {
  for (const c of Object.values(await codes.all())) {
    const free = [];
    for (const id of staleReservations(c)) { const o = await getOrder(id); if (!o || o.status === 'pending') free.push(id); }
    if (free.length) await codes.update(c.id, (x) => releaseCode(x, free));
  }
}
async function hourly() {
  try {
    const n = await deleteOlderThan(RETENTION_MS);
    if (n) console.log(`Usunięto ${n} zamówień starszych niż 30 dni`);
    await codes.deleteWhere((c) => Date.now() > c.expires && !(c.due > 0)); // kod partnera z niewypłaconą prowizją zostaje do rozliczenia
    await releaseStaleCodes();
    for (const x of Object.values(await allOrders())) if (x.refCtx && Date.now() - (x.created || 0) > 48 * 3600e3) await updateOrder(x.id, (y) => { const { refCtx: _r, ...rest } = y; return rest; });
    // Starsze kody klientów nie miały skrótu e-maila właściciela: uzupełniamy go, póki zamówienie jeszcze istnieje.
    for (const c of Object.values(await codes.all())) {
      const o = !c.ownerHash && c.ownerOrderId && (await getOrder(c.ownerOrderId));
      if (o?.profile?.email) await codes.update(c.id, (x) => ({ ...x, ownerHash: emailHash(o.profile.email) }));
    }
    await cleanupEvents(RETENTION_MS);
    await cleanupChats().catch(() => {});
    await cleanupPreviews().catch(() => {});
    await cleanupShareCards().catch(() => {});
    await cleanupPartnerApps().catch(() => {});
    await crmHourly(BASE_URL).catch((e) => logEvent('kontakty', e.message));
    await b2bMonthly(BASE_URL).catch((e) => logEvent('e-mail', `Podsumowania miesiąca: ${e.message}`));
    await welcomeSeries(BASE_URL).catch((e) => logEvent('e-mail', `Seria powitalna: ${e.message}`));
    await telegramHourly(BASE_URL).catch((e) => logEvent('telegram', e.message));
    await cleanupLeads().catch(() => {});
    await anonymizeOutcomes().catch((e) => console.error('Anonimizacja ankiet', e.message));
    await cleanupInvoices().catch(() => {});
    await leads.deleteWhere((l) => Date.now() - l.created > 365 * 864e5);
    await cleanupAnalytics().catch(() => {});
    await ensurePromoCode().catch((e) => console.error('Promocja', e.message));
    await alertsHourly(BASE_URL).catch((e) => console.error('Powiadomienia o ofertach', e.message));
    await passesHourly(BASE_URL).catch((e) => console.error('Karnety', e.message));
    await wizardDraftsHourly(BASE_URL).catch((e) => console.error('Szkice kreatora', e.message));
    await accountHourly(BASE_URL).catch((e) => console.error('Konta', e.message));
    await ownerDaily(BASE_URL).catch((e) => logEvent('e-mail', `Podsumowanie dnia / kopia: ${e.message}`));
    seoWeekly(BASE_URL).catch((e) => logEvent('seo', `Raport SEO: ${e.message}`)); // bez czekania: sprawdzanie adresów w Search Console trwa długo
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
    // Wyniki klientów: po 14 dniach jedno pytanie o zaproszenie na rozmowę (osobna zgoda z zamówienia, lib/outcomes.js).
    for (const o of Object.values(await allOrders())) {
      if (o.status !== 'done' || !o.outcomeAsk?.consent || o.outcomeAsk.sent || Date.now() - o.created < OUTCOME_AFTER) continue;
      const rec = await startOutcome(o);
      try { await sendOutcomeAsk(o.profile.email, OT[rec.lang], outcomeLinks(BASE_URL, rec)); await updateOrder(o.id, (x) => ({ ...x, outcomeAsk: { ...x.outcomeAsk, sent: true, sentAt: Date.now() } })); }
      catch (e) { await outcomes.remove(rec.id); console.error('Ankieta wyników', o.id, e.message); }
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
