// Oferty pracy z oficjalnych API partnerskich (bez scrapowania): Adzuna (ADZUNA_APP_ID + ADZUNA_APP_KEY, kraj pl)
// i/lub Jooble (JOOBLE_KEY). Bez tych zmiennych moduł jest wyłączony, a powiadomienia wysyłają same linki do portali.
// Do API trafia tylko zawód i miasto z powiadomienia (bez e-maila). Wyniki zapytania trzymamy w pamięci 12 h,
// a oferty wysłane w e-mailu – w job-offers.json przez 21 dni (przycisk „Dopasuj CV do tej oferty” → /?oferta=<id>).
import crypto from 'node:crypto';
import { makeStore } from './store.js';
import { logEvent } from './events.js';

export const offers = makeStore('job-offers.json');
const OFFER_TTL = 21 * 864e5, CACHE_TTL = 12 * 3600e3, FRESH = 7 * 864e5, TIMEOUT = 10000;
const cache = new Map();

export const feedSources = (env = process.env) => [env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY ? 'adzuna' : '', env.JOOBLE_KEY ? 'jooble' : ''].filter(Boolean);
export const feedEnabled = (env = process.env) => feedSources(env).length > 0;

const text = (v, max) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, max);
const httpUrl = (v) => { try { const u = new URL(String(v || '')); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch { return ''; } };
const key = (o) => `${o.title}|${o.company}`.toLowerCase().replace(/[^\p{L}\p{N}|]+/gu, '');
export const offerId = (o) => crypto.createHash('sha256').update(`${o.src}:${o.url}`).digest('base64url').slice(0, 16);

async function getJson(url, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Adzuna: https://developer.adzuna.com/docs/search – oferty z ostatnich 7 dni, najnowsze pierwsze.
export function adzunaUrl({ job, city }, env = process.env) {
  const q = new URLSearchParams({ app_id: env.ADZUNA_APP_ID, app_key: env.ADZUNA_APP_KEY, results_per_page: '20', what: job, max_days_old: '7', sort_by: 'date', 'content-type': 'application/json' });
  if (city) q.set('where', city);
  return `https://api.adzuna.com/v1/api/jobs/pl/search/1?${q}`;
}
export const fromAdzuna = (j) => (j?.results || []).map((r) => ({ src: 'adzuna', title: text(r.title, 140), company: text(r.company?.display_name, 100), city: text(r.location?.display_name, 80), url: httpUrl(r.redirect_url), desc: text(r.description, 1500), at: Date.parse(r.created) || 0 }));

// Jooble: https://jooble.org/api/about – POST z kluczem w adresie; polski indeks domyślnie (JOOBLE_HOST).
export const joobleUrl = (env = process.env) => `https://${env.JOOBLE_HOST || 'pl.jooble.org'}/api/${encodeURIComponent(env.JOOBLE_KEY)}`;
export const fromJooble = (j) => (j?.jobs || []).map((r) => ({ src: 'jooble', title: text(r.title, 140), company: text(r.company, 100), city: text(r.location, 80), url: httpUrl(r.link), desc: text(r.snippet, 1500), at: Date.parse(r.updated) || 0 }));

// Świeże oferty dla zawodu i miasta: oba źródła, bez duplikatów (ten sam tytuł i firma), najnowsze pierwsze.
export async function fetchOffers({ job, city = '' }, { env = process.env, now = Date.now(), get = getJson } = {}) {
  const src = feedSources(env); if (!src.length) return [];
  const ck = `${job.toLowerCase()}|${city.toLowerCase()}`, hit = cache.get(ck);
  if (hit && now - hit.at < CACHE_TTL) return hit.list;
  const lists = await Promise.all(src.map(async (s) => {
    try {
      if (s === 'adzuna') return fromAdzuna(await get(adzunaUrl({ job, city }, env)));
      return fromJooble(await get(joobleUrl(env), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: job, location: city, page: '1' }) }));
    } catch (e) { logEvent('oferty', `${s}: ${e.message}`); return []; }
  }));
  const seen = new Set(), list = [];
  for (const o of lists.flat().sort((a, b) => b.at - a.at)) {
    if (!o.title || !o.url || (o.at && now - o.at > FRESH)) continue;
    const k = key(o); if (seen.has(k)) continue;
    seen.add(k); list.push({ ...o, id: offerId(o) });
  }
  if (cache.size > 2000) cache.clear();
  cache.set(ck, { at: now, list });
  return list;
}

// Oferty do e-maila: 5–10 jeszcze niewysłanych temu powiadomieniu (mniej niż 5 → wysyłamy, co jest, ale nie powtarzamy starych).
export async function offersForAlert(a, opts = {}) {
  const sent = new Set(a.sentOffers || []);
  const pick = (await fetchOffers({ job: a.job, city: a.city || '' }, opts)).filter((o) => !sent.has(o.id)).slice(0, 10);
  const now = opts.now || Date.now();
  for (const o of pick) await offers.save({ id: o.id, src: o.src, title: o.title, company: o.company, city: o.city, url: o.url, desc: o.desc, at: now });
  return pick;
}
export const cleanupOffers = (now = Date.now()) => offers.deleteWhere((o) => now - o.at > OFFER_TTL);

export function offerRoutes(app, { limitPerHour = 60 } = {}) {
  const hits = new Map();
  // Kreator: tytuł, link i opis oferty z e-maila (/?oferta=<id>). Bez danych osobowych – tylko dane ogłoszenia. Limit 60/h na IP.
  app.get('/api/job-offer/:id', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const now = Date.now(), h = (hits.get(req.ip) || []).filter((t) => now - t < 3600e3);
    if (h.length >= limitPerHour) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    if (hits.size > 10000) hits.clear();
    hits.set(req.ip, [...h, now]);
    const o = /^[A-Za-z0-9_-]{16}$/.test(req.params.id) ? await offers.get(req.params.id) : null;
    if (!o) return res.status(404).json({ error: 'Ta oferta wygasła. Wklej link do ogłoszenia w kreatorze.' });
    res.json({ title: o.title, company: o.company, city: o.city, url: o.url, text: o.desc || '' });
  });
}
