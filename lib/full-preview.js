import crypto from 'node:crypto';
import express from 'express';
import { aiEnabled } from './ai.js';
import { makeStore } from './store.js';
import { logEvent } from './events.js';
import { countEvent } from './analytics.js';
import { generateForAd } from './generate.js';
import { renderCv } from './pdf.js';
import { cleanDesign } from './designs.js';

// Pełne CV przed płatnością (blok C1, 26.10): na ostatnim kroku kreatora generujemy całe CV (tym samym generateForAd co po płatności,
// bez listu i dodatków), renderujemy stronę 1 PDF-a (lib/pdf.js → pdfjs → PNG) i pokazujemy: górne 40% czytelne, reszta rozmyta,
// znak wodny i stopka „Odblokuj PDF”. Tekst CV nie trafia do przeglądarki – tylko obrazek. Wynik zapisany pod kluczem danych,
// więc po płatności klient dostaje dokładnie to CV (bez drugiej generacji). Limity: 1 na sesję kreatora, 2 na IP dziennie,
// PREVIEW_FULL_DAILY na całą stronę (domyślnie 150); po limicie – lekki podgląd z lib/preview.js.
export const fullPreviews = makeStore('full-previews.json');
const KEEP = 48 * 3600e3;
const FIELDS = ['name', 'email', 'phone', 'city', 'link', 'headline', 'summary', 'skills', 'languages', 'certificates', 'interests', 'notes', 'experience', 'education', 'career'];
export const fullKey = (profile, ad, mode = '') => crypto.createHash('sha256').update(JSON.stringify({ p: Object.fromEntries(FIELDS.map((k) => [k, profile?.[k] ?? ''])), a: { title: ad?.title || '', text: ad?.text || '', lang: ad?.lang || 'auto', kind: ad?.kind || '' }, m: mode === 'rewrite' ? 'r' : '' })).digest('hex').slice(0, 32);
export const cleanupFullPreviews = () => fullPreviews.deleteWhere((x) => Date.now() - x.at > KEEP);
// Wynik pokazany klientowi dla tych samych danych, pierwszego ogłoszenia i trybu (albo null) – do zamówienia.
export async function fullPreviewFor(profile, ad, mode) { const x = ad && (await fullPreviews.get(fullKey(profile, ad, mode))); return x && Date.now() - x.at < KEEP ? x.result : null; }
// Po płatności: samo CV bez listu i dodatków z treścią = dokładnie wynik z podglądu, bez generowania.
export const reusesWhole = (o) => !!o.fullPreview && !/letter|pack3/.test(o.pkg) && !o.addons?.interview && !o.addons?.messages && !o.addons?.linkedin;

const T = {
  pl: { mark: 'PODGLĄD · cvpodogloszenie.pl', foot: (p) => `Twoje CV jest gotowe. Odblokuj PDF za ${p} zł` },
  en: { mark: 'PREVIEW · cvpodogloszenie.pl', foot: (p) => `Your CV is ready. Unlock the PDF for ${p} zł` },
  uk: { mark: 'ПЕРЕГЛЯД · cvpodogloszenie.pl', foot: (p) => `Ваше резюме готове. Відкрийте PDF за ${p} zł` },
  de: { mark: 'VORSCHAU · cvpodogloszenie.pl', foot: (p) => `Ihr Lebenslauf ist fertig. PDF für ${p} zł freischalten` },
};
const SHARP = 0.4, BLUR = 10;
let libs = null;
async function load() {
  if (libs) return libs;
  const [pdfjs, canvas] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('@napi-rs/canvas')]);
  const F = new URL('../fonts/', import.meta.url).pathname;
  canvas.GlobalFonts.registerFromPath(F + 'Inter-SemiBold.otf', 'InterPv');
  return (libs = { pdfjs, ...canvas });
}
// Strona 1 CV jako PNG: szerokość 1000 px (komputer) albo 600 px (telefon).
export async function fullPreviewPng(result, design, { narrow = false, lang = 'pl', price = 39 } = {}) {
  const { pdfjs, createCanvas } = await load(), W = narrow ? 600 : 1000, t = T[lang] || T.pl;
  const pdf = await renderCv(result, cleanDesign(design));
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdf), isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise;
  try {
    const page = await doc.getPage(1), vp = page.getViewport({ scale: W / page.getViewport({ scale: 1 }).width }), H = Math.round(vp.height);
    const src = createCanvas(W, H), s = src.getContext('2d');
    s.fillStyle = '#fff'; s.fillRect(0, 0, W, H);
    await page.render({ canvasContext: s, viewport: vp }).promise;
    const out = createCanvas(W, H), o = out.getContext('2d'), top = Math.round(H * SHARP);
    o.fillStyle = '#fff'; o.fillRect(0, 0, W, H); // JPEG nie ma przezroczystości: brzegi rozmycia byłyby czarne
    o.drawImage(src, 0, 0, W, top, 0, 0, W, top);
    // Dolne 60%: rozmyte (tekstu nie da się przeczytać), z przejściem na granicy.
    o.save(); o.beginPath(); o.rect(0, top, W, H - top); o.clip(); o.filter = `blur(${BLUR}px)`; o.drawImage(src, -2 * BLUR, -2 * BLUR, W + 4 * BLUR, H + 4 * BLUR); o.restore();
    const g = o.createLinearGradient(0, top - 24, 0, top + 24); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    o.fillStyle = g; o.fillRect(0, top - 24, W, 48);
    // Znak wodny po przekątnej na całej stronie.
    const fs = Math.round(W * 0.03);
    o.save(); o.font = `${fs}px InterPv`; o.fillStyle = 'rgba(37,72,232,.16)'; o.rotate(-Math.PI / 7);
    for (let y = -H; y < H * 1.6; y += fs * 6) for (let x = -W; x < W * 1.6; x += fs * 19) o.fillText(t.mark, x, y);
    o.restore();
    // Stopka na rozmytej części: „Twoje CV jest gotowe. Odblokuj PDF za … zł”.
    const ff = Math.round(W * (narrow ? 0.034 : 0.026)), text = t.foot(price);
    o.font = `${ff}px InterPv`; const tw = o.measureText(text).width, bw = Math.min(W - 32, tw + ff * 2.4), bh = ff * 3, bx = (W - bw) / 2, by = Math.round(H * 0.62);
    o.fillStyle = 'rgba(14,28,52,.92)'; o.beginPath(); o.roundRect(bx, by, bw, bh, bh / 2); o.fill();
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText(text, W / 2, by + bh / 2, bw - ff);
    return out.encode('jpeg', 85); // JPEG: ok. 4× mniej danych niż PNG przy rozmyciu
  } finally { doc.destroy().catch(() => {}); }
}

export function fullPreviewRoutes(app, { cleanProfile, cleanAds, prices, enabled = aiEnabled, generate = (p, ad, mode) => generateForAd({ profile: p, ad, withLetter: false, addons: {}, rewrite: mode === 'rewrite' }), png = fullPreviewPng, now = () => Date.now(), daily = () => Number(process.env.PREVIEW_FULL_DAILY) || 150, wait = 20_000, count = countEvent } = {}) {
  const byIp = new Map(), bySid = new Map(), running = new Map(), imgs = new Map(); let day = '', dayCount = 0;
  const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
  const limit = (res) => { count('full_preview_limit').catch(() => {}); return res.json({ off: true, reason: 'limit' }); };
  app.post('/api/preview-full', express.json({ limit: '200kb' }), async (req, res) => {
    if (!enabled()) return res.json({ off: true });
    const p = cleanProfile(req.body?.profile || {}), ad = cleanAds([req.body?.ad])[0], sid = String(req.body?.sid || '').slice(0, 40), mode = req.body?.mode === 'rewrite' ? 'rewrite' : '';
    if (!ad || !/^[\w-]{8,40}$/.test(sid) || (!p.experience.length && !p.education.length)) return res.json({ off: true });
    const key = fullKey(p, ad, mode), lang = ['en', 'uk', 'de'].includes(req.body?.lang) ? req.body.lang : 'pl', narrow = !!req.body?.narrow;
    const price = Math.round((prices()[req.body?.pkg] ?? prices().cv) / 100), design = cleanDesign(req.body?.design);
    const out = async (result) => {
      const s = bySid.get(sid); if (s && !s.shown) { s.shown = true; count('full_preview_shown').catch(() => {}); }
      const ik = [key, design.tpl, design.color, narrow, lang, price].join(':');
      if (!imgs.has(ik)) { if (imgs.size > 60) imgs.delete(imgs.keys().next().value); imgs.set(ik, png(result, design, { narrow, lang, price }).then((b) => `data:image/jpeg;base64,${Buffer.from(b).toString('base64')}`)); }
      try { res.json({ key, full: true, image: await imgs.get(ik) }); } catch (e) { imgs.delete(ik); logEvent('podgląd', `Pełny podgląd (obraz): ${e.message}`); res.json({ off: true }); }
    };
    const hit = await fullPreviews.get(key);
    if (hit && now() - hit.at < KEEP) { if (!bySid.has(sid)) bySid.set(sid, { key, at: now(), shown: false }); return out(hit.result); }
    if (!running.has(key)) {
      // Nowa generacja: jedna na sesję kreatora, 2 na IP dziennie, dzienny limit strony. Ponowne zapytanie o ten sam klucz w toku nie liczy się.
      const s = bySid.get(sid); if (s && s.key !== key) return limit(res);
      const t = now(), d = dayOf(t), ip = req.ip || '', ipk = `${d}:${ip}`;
      if (d !== day) { day = d; dayCount = 0; byIp.clear(); }
      if (!s && (byIp.get(ipk) || 0) >= 2) return limit(res);
      if (dayCount >= daily()) return limit(res);
      if (!s) { byIp.set(ipk, (byIp.get(ipk) || 0) + 1); bySid.set(sid, { key, at: t, shown: false }); if (bySid.size > 5000) for (const [k, v] of bySid) if (t - v.at > 6 * 3600e3) bySid.delete(k); }
      dayCount++;
      const job = (async () => {
        const result = await generate(p, ad, mode);
        if (!result?.cv) throw new Error('Brak CV w wyniku');
        await fullPreviews.save({ id: key, at: now(), result });
        return result;
      })();
      job.catch((e) => {
        // Nieudana próba nie zużywa limitów.
        logEvent('podgląd', `Pełny podgląd: ${e.message}`);
        if (!s) { bySid.delete(sid); byIp.set(ipk, Math.max(0, (byIp.get(ipk) || 1) - 1)); }
        if (dayCount > 0) dayCount--;
      }).finally(() => setTimeout(() => running.delete(key), 0));
      running.set(key, job);
    }
    // Generowanie trwa zwykle dłużej niż jedno zapytanie: po `wait` ms odpowiadamy „pending”, przeglądarka pyta ponownie.
    let timer; const r = await Promise.race([running.get(key).then((x) => ({ x }), () => ({ err: true })), new Promise((ok) => (timer = setTimeout(() => ok({ pending: true }), wait)))]).finally(() => clearTimeout(timer));
    if (r.pending) return res.json({ pending: true, key });
    if (r.err) return res.json({ off: true });
    return out(r.x);
  });
}
