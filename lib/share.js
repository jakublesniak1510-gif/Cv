import crypto from 'node:crypto';
import fs from 'node:fs';
import express from 'express';
import { makeStore } from './store.js';
import { peekScan } from './growth.js';
import { ssrPage, escHtml as esc } from './seo.js';
import { decodePng, encodePng } from './png.js';
import { funnelShare } from './analytics.js';
import { TOOL_LANGS, toolUrl } from './tools-i18n.js';

// Karta wyniku skanera do udostępnienia (/wynik/<id>): tylko procent dopasowania (z wyniku zapamiętanego na serwerze, nie z przeglądarki),
// opcjonalna nazwa stanowiska wpisana przez użytkownika i data. Bez treści CV i ogłoszenia. 30 dni, noindex, poza sitemapą.
export const cards = makeStore('share-cards.json');
export const CARD_TTL = 30 * 864e5;
const LANGS = ['pl', 'en', 'uk', 'de'], ID = /^[A-Za-z0-9_-]{16}$/;
const pctOf = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
// Stanowisko: bez adresów WWW, domen, e-maili i numerów telefonów (karta nie może służyć do rozsyłania kontaktów i linków), do 60 znaków.
export const cleanTitle = (v) => String(v ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f<>"`{}\\]/g, ' ')
  .replace(/https?:\/\/\S*|www\.\S*|\S*@\S+/gi, ' ').replace(/[\p{L}\d-]+\.(?:pl|com|net|org|eu|de|ua|uk|io|info|biz|me|co|app|link|ly|ru|xyz|online|site|shop)\b\S*/gu, ' ') // domeny małymi literami (zostaje np. „ASP.NET”)
  .replace(/\+?\d[\d\s().\/-]{5,}\d/g, ' ').replace(/(?:^|\s)(?:tel|telefon|phone|kontakt)[.:]*(?=\s|$)/giu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60).trim();

const L = {
  pl: { locale: 'pl-PL', title: (p) => `Moje CV pasuje do oferty w ${p}%`, desc: 'Sprawdź za darmo, jak Twoje CV pasuje do ogłoszenia o pracę: skaner pokaże, których wymagań z oferty nie widać w CV.',
    eyebrow: 'Wynik skanera CV', pos: 'Stanowisko', date: 'Data sprawdzenia', cta: 'Sprawdź swoje CV za darmo', ctaHint: 'Wgraj CV, wklej ogłoszenie i zobacz, których wymagań z oferty nie widać w Twoim CV. Bez rejestracji.',
    share: 'Udostępnij', copy: 'Kopiuj link', copied: 'Skopiowano link', note: 'Karta pokazuje tylko procent dopasowania, opcjonalną nazwę stanowiska i datę. Zniknie po 30 dniach.',
    text: (p) => `Moje CV pasuje do oferty w ${p}%. Sprawdź swoje za darmo:`, gone: 'Ta karta wyniku wygasła', goneLead: 'Karty wyników są dostępne przez 30 dni.' },
  en: { locale: 'en-GB', title: (p) => `My CV is a ${p}% match for the job offer`, desc: 'Check for free how well your CV matches a job ad: the scanner shows which requirements from the offer are missing from your CV.',
    eyebrow: 'CV scanner result', pos: 'Job title', date: 'Checked on', cta: 'Check your CV for free', ctaHint: 'Upload your CV, paste the job ad and see which requirements are missing from your CV. No sign-up.',
    share: 'Share', copy: 'Copy link', copied: 'Link copied', note: 'This card shows only the match percentage, an optional job title and the date. It disappears after 30 days.',
    text: (p) => `My CV is a ${p}% match for the job offer. Check yours for free:`, gone: 'This result card has expired', goneLead: 'Result cards are available for 30 days.' },
  uk: { locale: 'uk-UA', title: (p) => `Моє резюме відповідає вакансії на ${p}%`, desc: 'Безкоштовно перевірте, як ваше резюме відповідає оголошенню про роботу: сканер покаже, яких вимог з вакансії не видно в резюме.',
    eyebrow: 'Результат сканера резюме', pos: 'Посада', date: 'Дата перевірки', cta: 'Перевірте своє резюме безкоштовно', ctaHint: 'Завантажте резюме, вставте оголошення й подивіться, яких вимог не видно у вашому резюме. Без реєстрації.',
    share: 'Поділитися', copy: 'Копіювати посилання', copied: 'Посилання скопійовано', note: 'Картка показує лише відсоток відповідності, необов’язкову назву посади й дату. Вона зникне через 30 днів.',
    text: (p) => `Моє резюме відповідає вакансії на ${p}%. Перевірте своє безкоштовно:`, gone: 'Термін дії цієї картки минув', goneLead: 'Картки результатів доступні 30 днів.' },
  de: { locale: 'de-DE', title: (p) => `Mein Lebenslauf passt zu ${p} % zur Stelle`, desc: 'Prüfen Sie kostenlos, wie gut Ihr Lebenslauf zu einer Stellenanzeige passt: Der Scanner zeigt, welche Anforderungen im Lebenslauf fehlen.',
    eyebrow: 'Ergebnis des Lebenslauf-Scanners', pos: 'Stelle', date: 'Geprüft am', cta: 'Prüfen Sie Ihren Lebenslauf kostenlos', ctaHint: 'Lebenslauf hochladen, Anzeige einfügen und sehen, welche Anforderungen im Lebenslauf fehlen. Ohne Registrierung.',
    share: 'Teilen', copy: 'Link kopieren', copied: 'Link kopiert', note: 'Diese Karte zeigt nur den Prozentwert, eine optionale Stellenbezeichnung und das Datum. Sie wird nach 30 Tagen gelöscht.',
    text: (p) => `Mein Lebenslauf passt zu ${p} % zur Stelle. Prüfen Sie Ihren kostenlos:`, gone: 'Diese Ergebniskarte ist abgelaufen', goneLead: 'Ergebniskarten sind 30 Tage lang verfügbar.' },
};
export const shareText = (score, l = 'pl') => (L[l] || L.pl).text(pctOf(score));
const scanPath = (l) => (l !== 'pl' && TOOL_LANGS[l]?.data?.['skaner-cv'] ? '/' + toolUrl(l, 'skaner-cv') : '/narzedzia/skaner-cv');

export async function createCard({ score, title, lang }, now = Date.now()) {
  const c = { id: crypto.randomBytes(12).toString('base64url'), score: pctOf(score), title: cleanTitle(title), lang: LANGS.includes(lang) ? lang : 'pl', created: now };
  return cards.save(c);
}
export const cardExpired = (c, now = Date.now()) => now - c.created > CARD_TTL;
export const cleanupShareCards = (now = Date.now()) => cards.deleteWhere((c) => cardExpired(c, now));

// --- Obrazek OG (PNG 1200×630): gotowe tło w języku karty (lib/og-wynik/<lang>.png) + pierścień i cyfry rysowane tutaj ---
const DIR = new URL('./og-wynik/', import.meta.url), tpl = {}, ogCache = new Map(); let glyph = null;
const RING = { cx: 955, cy: 300, r: 185, th: 34, fill: [0xff, 0xe4, 0x5c], track: [255, 255, 255], trackA: 0.22 };
export function ogPng(score, lang = 'pl') {
  const p = pctOf(score), l = LANGS.includes(lang) ? lang : 'pl', key = `${l}:${p}`; // najwyżej 4 × 101 obrazków w pamięci
  if (ogCache.has(key)) return ogCache.get(key);
  const t = (tpl[l] ||= decodePng(fs.readFileSync(new URL(`${l}.png`, DIR))));
  glyph ||= { ...JSON.parse(fs.readFileSync(new URL('digits.json', DIR), 'utf8')), img: decodePng(fs.readFileSync(new URL('digits.png', DIR))) };
  const W = t.width, H = t.height, px = Buffer.alloc(W * H * 3);
  for (let i = 0, j = 0; i < W * H; i++, j += t.channels) { px[i * 3] = t.data[j]; px[i * 3 + 1] = t.data[j + 1]; px[i * 3 + 2] = t.data[j + 2]; }
  const blend = (x, y, c, a) => { if (a <= 0 || x < 0 || y < 0 || x >= W || y >= H) return; a = Math.min(1, a); const o = (y * W + x) * 3; for (let k = 0; k < 3; k++) px[o + k] = Math.round(px[o + k] * (1 - a) + c[k] * a); };
  const { cx, cy, r, th } = RING;
  for (let y = cy - r - 1; y <= cy + r + 1; y++) for (let x = cx - r - 1; x <= cx + r + 1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy), cov = Math.min(1, r - d + 0.5, d - (r - th) + 0.5);
    if (cov <= 0) continue;
    const ang = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI), on = ang / (2 * Math.PI) < p / 100; // od góry, zgodnie z ruchem wskazówek
    on ? blend(x, y, RING.fill, cov) : blend(x, y, RING.track, cov * RING.trackA);
  }
  const g = glyph, s = `${p}%`, idx = [...s].map((ch) => g.chars.indexOf(ch)), width = idx.reduce((a, i) => a + g.advances[i], 0);
  let x0 = Math.round(cx - width / 2); const top = Math.round(cy + g.capHeight / 2 - g.baseline);
  for (const i of idx) {
    for (let y = 0; y < g.height; y++) for (let x = 0; x < g.cell; x++) blend(x0 + x, top + y, [255, 255, 255], g.img.data[(y * g.img.width + i * g.cell + x) * g.img.channels + 3] / 255);
    x0 += g.advances[i];
  }
  const png = encodePng(W, H, px); ogCache.set(key, png); return png;
}

function cardHtml(c, base) {
  const t = L[c.lang] || L.pl, url = `${base}/wynik/${c.id}`, shareUrl = `${url}?utm_source=share`, text = t.text(c.score), u = encodeURIComponent(shareUrl);
  const day = new Date(c.created), iso = day.toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }), shown = day.toLocaleDateString(t.locale, { timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long', year: 'numeric' });
  return `<div class="inner narrow share-page"><div class="share-card">
<p class="eyebrow">${esc(t.eyebrow)}</p>
<div class="ring big" style="--p:${c.score}"><b>${c.score}%</b></div>
<h1>${esc(t.title(c.score))}</h1>
${c.title ? `<p class="sc-pos">${esc(t.pos)}: <b>${esc(c.title)}</b></p>` : ''}<p class="hint">${esc(t.date)}: <time datetime="${iso}">${esc(shown)}</time></p>
<div class="share-btns" data-url="${esc(shareUrl)}" data-text="${esc(text)}" data-copied="${esc(t.copied)}">
<button type="button" class="btn sm" data-native hidden>${esc(t.share)}</button>
<a class="btn ghost sm" href="https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}" target="_blank" rel="noopener">WhatsApp</a>
<a class="btn ghost sm" href="https://t.me/share/url?url=${u}&amp;text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Telegram</a>
<a class="btn ghost sm" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener">Facebook</a>
<button type="button" class="btn ghost sm" data-copy>${esc(t.copy)}</button><span class="hint small" role="status" data-status></span></div>
<div class="cta-box"><div><b>${esc(t.cta)}</b><p class="hint">${esc(t.ctaHint)}</p></div><a class="btn" href="${scanPath(c.lang)}?utm_source=share">${esc(t.cta)}</a></div>
<p class="hint small">${esc(t.note)}</p></div></div>`;
}

export function shareRoutes(app, { BASE_URL }) {
  const hits = new Map();
  const limited = (req) => { const now = Date.now(), h = (hits.get(req.ip) || []).filter((x) => now - x < 3600e3); if (h.length >= 20) return true; hits.set(req.ip, [...h, now]); return false; };
  app.post('/api/scan/share', express.json({ limit: '5kb' }), async (req, res) => {
    if (limited(req)) return res.status(429).json({ error: 'Limit: 20 kart wyniku na godzinę. Spróbuj później.' });
    // Procent bierzemy z wyniku zapamiętanego na serwerze po skanie (rememberScan), nigdy z liczby przysłanej przez przeglądarkę.
    const s = peekScan(req.body?.scanId);
    if (!s) return res.status(410).json({ error: 'Wynik wygasł. Sprawdź CV jeszcze raz.' });
    const lang = LANGS.includes(req.body?.lang) ? req.body.lang : 'pl', title = cleanTitle(req.body?.title);
    let c = s.share && s.share.title === title && s.share.lang === lang ? await cards.get(s.share.id) : null; // ten sam wynik i podpis: ten sam link
    if (!c) { c = await createCard({ score: s.result.score, title, lang }); s.share = { id: c.id, title, lang }; await funnelShare(req, lang).catch(() => {}); }
    const url = `${BASE_URL}/wynik/${c.id}`;
    res.json({ id: c.id, url, shareUrl: `${url}?utm_source=share`, score: c.score, title: c.title, text: shareText(c.score, c.lang) });
  });
  const find = async (req) => { const id = String(req.params.id); return ID.test(id) ? cards.get(id) : null; };
  app.get('/wynik/:id', async (req, res, next) => {
    const c = await find(req); if (!c) return next();
    res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
    const t = L[c.lang] || L.pl;
    if (cardExpired(c)) {
      res.status(410);
      return ssrPage(res, BASE_URL, `wynik/${c.id}`, { title: t.gone, metaDescription: t.goneLead }, `<div class="inner narrow share-page"><div class="share-card"><h1>${esc(t.gone)}</h1><p class="lead">${esc(t.goneLead)}</p><p><a class="btn" href="${scanPath(c.lang)}?utm_source=share">${esc(t.cta)}</a></p></div></div>`, { noindex: true, lang: c.lang });
    }
    ssrPage(res, BASE_URL, `wynik/${c.id}`, { title: t.title(c.score), metaDescription: t.desc }, cardHtml(c, BASE_URL), { noindex: true, lang: c.lang, script: '/wynik.js', ogImage: `${BASE_URL}/wynik/${c.id}/og.png` });
  });
  app.get('/wynik/:id/og.png', async (req, res, next) => {
    const c = await find(req); if (!c || cardExpired(c)) return next();
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400', 'X-Robots-Tag': 'noindex' }).send(ogPng(c.score, c.lang));
  });
}
