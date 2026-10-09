import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';
import { mailEnabled, sendContactNotice, sendNewsletterConfirm, sendNewsletterIssue } from './mail.js';
import { logEvent } from './events.js';

// Wiadomości z formularza kontaktowego i zapytania firm / uczelni (oferta „Dla firm i uczelni”).
// Newsletter tylko z podwójną zgodą: zapis -> e-mail z linkiem -> dopiero kliknięcie potwierdza zapis.
export const messages = makeStore('messages.json');
export const subscribers = makeStore('newsletter.json');
const MESSAGE_TTL = 180 * 864e5, PENDING_TTL = 7 * 864e5;
// Treść zgody zapisywana przy subskrybencie (dowód zgody wymagany przez RODO i prawo komunikacji elektronicznej).
export const NEWSLETTER_CONSENT = 'Chcę otrzymywać newsletter CV Pod Ogłoszenie (porady o CV i rekrutacji, informacje o nowościach i promocjach) na podany adres e-mail. Zgodę mogę wycofać w każdej chwili linkiem w każdej wiadomości.';
export const ORG_TYPES = { uczelnia: 'Uczelnia / biuro karier', szkola: 'Szkoła', urzad: 'Urząd pracy / instytucja publiczna', ngo: 'Fundacja / stowarzyszenie', firma: 'Firma (outplacement, HR, benefity)', agencja: 'Agencja rekrutacyjna / pracy', inne: 'Inne' };

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const subId = (email) => sha(`${process.env.CODE_SALT || 'cvpo'}:nl:${email}`).slice(0, 32);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Prosta strona z komunikatem (potwierdzenie / wypisanie z newslettera).
const notice = (res, title, body, extra = '') => res.type('html').send(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | CV Pod Ogłoszenie</title><link rel="stylesheet" href="/style.css"></head><body><main class="sec"><div class="inner narrow"><h1>${esc(title)}</h1><p class="lead">${esc(body)}</p>${extra}<p><a class="btn ghost" href="/">Wróć na stronę główną</a></p></div></main></body></html>`);

export function leadRoutes(app, { BASE_URL, DEMO }) {
  const hits = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; hits.set(key, [...h, now]); return false; };

  // Formularz kontaktowy i zapytanie firmy / uczelni. Pole "website" to pułapka na boty (ludzie go nie widzą).
  app.post('/api/contact', async (req, res) => {
    const b = req.body || {};
    if (str(b.website, 200)) return res.json({ ok: true });
    if (limited('c:' + req.ip, 5, 3600e3)) return res.status(429).json({ error: 'Za dużo wiadomości w krótkim czasie. Spróbuj za godzinę.' });
    const kind = b.kind === 'firma' ? 'firma' : 'kontakt';
    const m = {
      kind, name: str(b.name, 100), email: str(b.email, 160).toLowerCase(), phone: str(b.phone, 40), message: str(b.message, 4000),
      org: str(b.org, 160), orgType: b.orgType in ORG_TYPES ? b.orgType : '', size: str(b.size, 40), topic: str(b.topic, 60),
    };
    if (!EMAIL.test(m.email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail, żebyśmy mogli odpowiedzieć.' });
    if (kind === 'firma' && !m.org) return res.status(400).json({ error: 'Podaj nazwę firmy lub instytucji.' });
    if (m.message.length < (kind === 'firma' ? 0 : 10)) return res.status(400).json({ error: 'Napisz, w czym możemy pomóc (min. 10 znaków).' });
    if (!b.consent) return res.status(400).json({ error: 'Zaznacz zgodę na kontakt w sprawie tej wiadomości.' });
    const item = { id: `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`, ...m, status: 'new', created: Date.now() };
    await messages.save(item);
    if (mailEnabled() && process.env.CONTACT_EMAIL) sendContactNotice(item).catch((e) => logEvent('e-mail', `Kontakt: ${e.message}`));
    res.json({ ok: true });
  });

  // Zapis do newslettera: zawsze ta sama odpowiedź (nie zdradzamy, czy adres już jest na liście).
  app.post('/api/newsletter', async (req, res) => {
    const b = req.body || {};
    if (str(b.website, 200)) return res.json({ ok: true });
    const email = str(b.email, 160).toLowerCase();
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    if (!b.consent) return res.status(400).json({ error: 'Zaznacz zgodę na otrzymywanie newslettera.' });
    if (limited('n:' + req.ip, 6, 3600e3) || limited('ne:' + email, 2, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const id = subId(email), prev = await subscribers.get(id);
    if (prev?.status === 'confirmed') return res.json({ ok: true });
    const token = crypto.randomBytes(24).toString('base64url');
    await subscribers.save({ id, email, status: 'pending', token, source: str(b.source, 30) || 'strona', lang: ['en', 'uk'].includes(b.lang) ? b.lang : 'pl', consent: { text: NEWSLETTER_CONSENT, at: Date.now() }, created: Date.now() });
    const link = `${BASE_URL}/newsletter/potwierdz?t=${token}`;
    if (!mailEnabled()) return res.json({ ok: true, ...(DEMO ? { demoLink: link } : {}) });
    try { await sendNewsletterConfirm(email, link); } catch (e) { logEvent('e-mail', `Newsletter: ${e.message}`); return res.status(502).json({ error: 'Nie udało się wysłać e-maila. Spróbuj za chwilę.' }); }
    res.json({ ok: true });
  });

  const byToken = async (t) => (t ? Object.values(await subscribers.all()).find((s) => s.token === t) : null);
  app.get('/newsletter/potwierdz', async (req, res) => {
    const s = await byToken(str(req.query.t, 80));
    if (!s) return notice(res, 'Link nieaktualny', 'Ten link wygasł albo zapis został już anulowany. Zapisz się ponownie na stronie głównej.');
    if (s.status !== 'confirmed') await subscribers.update(s.id, { status: 'confirmed', confirmedAt: Date.now() });
    notice(res, 'Zapis potwierdzony', 'Dziękujemy! Od teraz będziesz dostawać nasz newsletter. Wypisać możesz się w każdej chwili linkiem na dole każdej wiadomości.');
  });
  // GET pokazuje przycisk (programy pocztowe otwierają linki automatycznie), POST wypisuje. POST obsługuje też
  // wypisanie jednym kliknięciem z nagłówka List-Unsubscribe-Post (RFC 8058).
  app.get('/newsletter/wypisz', async (req, res) => {
    const t = str(req.query.t, 80), s = await byToken(t);
    if (!s) return notice(res, 'Nie ma Cię na liście', 'Ten adres nie jest zapisany do newslettera.');
    notice(res, 'Wypisać z newslettera?', `Adres ${s.email} przestanie dostawać nasz newsletter.`, `<form method="post" action="/newsletter/wypisz?t=${esc(t)}"><button class="btn" type="submit">Wypisz mnie</button></form><br>`);
  });
  app.post('/newsletter/wypisz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const s = await byToken(str(req.query.t, 80));
    if (s) await subscribers.remove(s.id);
    notice(res, 'Wypisano', 'Nie będziemy już wysyłać newslettera na ten adres. Usunęliśmy go z listy.');
  });
}

export async function cleanupLeads() {
  await messages.deleteWhere((m) => Date.now() - m.created > MESSAGE_TTL);
  await subscribers.deleteWhere((s) => s.status === 'pending' && Date.now() - s.created > PENDING_TTL);
}

// Wysyłka wydania newslettera do potwierdzonych subskrybentów (w tle, po kolei, z linkiem do wypisania).
let sending = null;
export const newsletterBusy = () => sending;
export async function sendNewsletter({ subject, text }, BASE_URL) {
  if (sending) throw new Error('Poprzednia wysyłka jeszcze trwa.');
  const list = Object.values(await subscribers.all()).filter((s) => s.status === 'confirmed');
  sending = { total: list.length, sent: 0, failed: 0, started: Date.now() };
  (async () => {
    for (const s of list) {
      try { await sendNewsletterIssue(s.email, { subject, text }, `${BASE_URL}/newsletter/wypisz?t=${s.token}`); sending.sent++; }
      catch (e) { sending.failed++; logEvent('e-mail', `Newsletter: ${e.message}`); }
    }
  })().finally(() => { sending = null; });
  return { total: list.length };
}
