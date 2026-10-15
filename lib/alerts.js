// Powiadomienia o ofertach pracy: co poniedziałek e-mail z linkami do świeżych ofert (Pracuj.pl, OLX, Indeed)
// dla wybranego zawodu i miasta. Tylko z podwójną zgodą; wygasają po 12 tygodniach; wypisanie jednym kliknięciem.
import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';
import { mailEnabled, sendAlertConfirm, sendAlertIssue } from './mail.js';
import { logEvent } from './events.js';
import { ARTICLES } from './content.js';

export const alerts = makeStore('alerts.json');
const WEEKS = 12, PENDING_TTL = 7 * 864e5, MAX_PER_EMAIL = 3;
export const ALERT_CONSENT = 'Chcę dostawać raz w tygodniu e-mail z linkami do ofert pracy dla wybranego zawodu i miasta oraz wskazówkami o CV, przez 12 tygodni. Zgodę mogę wycofać w każdej chwili linkiem w każdej wiadomości.';

const str = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
const slug = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Linki do wyszukiwarek ofert (bez pobierania ofert: kierujemy do portali, z filtrem zawodu i miasta).
export function searchLinks(job, city) {
  const q = encodeURIComponent(job), c = encodeURIComponent(city);
  return [
    ['Pracuj.pl', `https://www.pracuj.pl/praca/${q};kw${city ? `/${c};wp` : ''}`],
    ['OLX Praca', `https://www.olx.pl/praca/${city ? slug(city) + '/' : ''}q-${encodeURIComponent(slug(job))}/`],
    ['Indeed (ostatnie 7 dni)', `https://pl.indeed.com/jobs?q=${q}${city ? `&l=${c}` : ''}&fromage=7`],
  ];
}

const notice = (res, title, body, extra = '') => res.type('html').send(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | CV Pod Ogłoszenie</title><link rel="stylesheet" href="/style.css"></head><body><main class="sec"><div class="inner narrow"><h1>${esc(title)}</h1><p class="lead">${esc(body)}</p>${extra}<p><a class="btn ghost" href="/">Wróć na stronę główną</a></p></div></main></body></html>`);

export function alertRoutes(app, { BASE_URL, DEMO }) {
  const hits = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; hits.set(key, [...h, now]); return false; };

  app.post('/api/alerts', async (req, res) => {
    const b = req.body || {};
    if (str(b.website, 200)) return res.json({ ok: true });
    const email = str(b.email, 160).toLowerCase(), job = str(b.job, 60), city = str(b.city, 40);
    if (job.length < 2) return res.status(400).json({ error: 'Wpisz zawód albo stanowisko.' });
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    if (!b.consent) return res.status(400).json({ error: 'Zaznacz zgodę na cotygodniowe e-maile z ofertami.' });
    if (limited('a:' + req.ip, 6, 3600e3) || limited('ae:' + email, 3, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const id = sha(`${process.env.CODE_SALT || 'cvpo'}:alert:${email}:${job.toLowerCase()}:${city.toLowerCase()}`).slice(0, 32), prev = await alerts.get(id);
    if (prev?.status === 'confirmed') return res.json({ ok: true });
    const mine = Object.values(await alerts.all()).filter((a) => a.email === email && a.status === 'confirmed').length;
    if (mine >= MAX_PER_EMAIL) return res.status(400).json({ error: `Masz już ${MAX_PER_EMAIL} aktywne powiadomienia. Wypisz się z jednego (link w e-mailu), żeby dodać nowe.` });
    const token = crypto.randomBytes(24).toString('base64url'), lang = ['en', 'uk', 'de'].includes(b.lang) ? b.lang : 'pl';
    await alerts.save({ id, email, job, city, lang, status: 'pending', token, consent: { text: ALERT_CONSENT, at: Date.now() }, created: Date.now() });
    const link = `${BASE_URL}/oferty/potwierdz?t=${token}`;
    if (!mailEnabled()) return res.json({ ok: true, ...(DEMO ? { demoLink: link } : {}) });
    try { await sendAlertConfirm(email, { job, city, lang }, link); } catch (e) { logEvent('e-mail', `Oferty: ${e.message}`); return res.status(502).json({ error: 'Nie udało się wysłać e-maila. Spróbuj za chwilę.' }); }
    res.json({ ok: true });
  });

  const byToken = async (t) => (t ? Object.values(await alerts.all()).find((a) => a.token === t) : null);
  app.get('/oferty/potwierdz', async (req, res) => {
    const a = await byToken(str(req.query.t, 80));
    if (!a) return notice(res, 'Link nieaktualny', 'Ten link wygasł albo powiadomienie zostało już usunięte. Zapisz się ponownie na stronie.');
    if (a.status !== 'confirmed') await alerts.update(a.id, { status: 'confirmed', confirmedAt: Date.now(), until: Date.now() + WEEKS * 7 * 864e5 });
    notice(res, 'Powiadomienia włączone', `Co poniedziałek dostaniesz linki do nowych ofert: ${a.job}${a.city ? ', ' + a.city : ''}. Powiadomienia wygasną same po ${WEEKS} tygodniach, a wypisać możesz się linkiem w każdej wiadomości.`);
  });
  app.get('/oferty/wypisz', async (req, res) => {
    const t = str(req.query.t, 80), a = await byToken(t);
    if (!a) return notice(res, 'Powiadomienie nieaktywne', 'To powiadomienie zostało już usunięte.');
    notice(res, 'Wyłączyć powiadomienia?', `Przestaniemy wysyłać oferty: ${a.job}${a.city ? ', ' + a.city : ''} na adres ${a.email}.`, `<form method="post" action="/oferty/wypisz?t=${esc(t)}"><button class="btn" type="submit">Wyłącz powiadomienia</button></form><br>`);
  });
  app.post('/oferty/wypisz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const a = await byToken(str(req.query.t, 80));
    if (a) await alerts.remove(a.id);
    notice(res, 'Powiadomienia wyłączone', 'Nie będziemy już wysyłać ofert na ten adres. Usunęliśmy powiadomienie.');
  });
}

// Powiadomienie zamówione przy zakupie CV (zgoda zaznaczona w opłaconym zamówieniu, e-mail ten sam, na który idą dokumenty).
export async function addAlertFromOrder({ email, job, city, lang }) {
  email = str(email, 160).toLowerCase(); job = str(job, 60); city = str(city, 40);
  if (job.length < 2 || !EMAIL.test(email)) return null;
  const id = sha(`${process.env.CODE_SALT || 'cvpo'}:alert:${email}:${job.toLowerCase()}:${city.toLowerCase()}`).slice(0, 32);
  if ((await alerts.get(id))?.status === 'confirmed') return id;
  if (Object.values(await alerts.all()).filter((a) => a.email === email && a.status === 'confirmed').length >= MAX_PER_EMAIL) return null;
  await alerts.save({ id, email, job, city, lang: ['en', 'uk', 'de'].includes(lang) ? lang : 'pl', status: 'confirmed', token: crypto.randomBytes(24).toString('base64url'), consent: { text: ALERT_CONSENT, at: Date.now(), source: 'zamówienie' }, created: Date.now(), confirmedAt: Date.now(), until: Date.now() + WEEKS * 7 * 864e5 });
  return id;
}

// Co godzinę (server.js): w poniedziałek od 7:00 czasu polskiego wysyłamy wydanie tygodnia; sprzątanie wygasłych.
const warsaw = (d) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
export async function alertsHourly(BASE_URL, now = new Date()) {
  await alerts.deleteWhere((a) => (a.status === 'pending' && Date.now() - a.created > PENDING_TTL) || (a.until && Date.now() > a.until));
  const w = warsaw(now);
  if (!mailEnabled() || w.weekday !== 'Mon' || +w.hour < 7) return;
  const week = Math.floor(now.getTime() / (7 * 864e5)), tip = ARTICLES[week % ARTICLES.length];
  for (const a of Object.values(await alerts.all())) {
    if (a.status !== 'confirmed' || (a.lastSent && now.getTime() - a.lastSent < 5 * 864e5)) continue;
    try {
      const left = Math.max(0, Math.ceil((a.until - now.getTime()) / (7 * 864e5)) - 1);
      await sendAlertIssue(a, { links: searchLinks(a.job, a.city), tip: tip && { title: tip.title, url: `${BASE_URL}/poradnik/${tip.slug}` }, order: `${BASE_URL}/?utm_source=oferty`, stop: `${BASE_URL}/oferty/wypisz?t=${a.token}`, left });
      await alerts.update(a.id, { lastSent: now.getTime(), sent: (a.sent || 0) + 1 });
    } catch (e) { logEvent('e-mail', `Oferty: ${e.message}`); }
  }
}
