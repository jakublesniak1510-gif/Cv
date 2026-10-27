import crypto from 'node:crypto';
import { PRICES } from './pricing.js';
import { logEvent } from './events.js';
import { photoPreview, photoFull, PhotoError, BGS, CROPS } from './photo-pro.js';

// Usługi sprzedawane osobno (blok D, 27.10). To zwykłe zamówienia (orders) z polem `product`: ta sama płatność (Stripe / Przelewy24,
// openPayment), faktura, rejestr sprzedaży, zwroty w panelu i usuwanie danych po 30 dniach co przy CV. Realizacja po płatności: applyProduct.
export const PRODUCTS = {
  photo: {
    name: 'Zdjęcie do CV',
    invoice: 'Zdjęcie do CV: jednolite tło, kadr i wyrównanie jasności (bez retuszu twarzy)',
    price: () => PRICES.photo,
    page: '/narzedzia/zdjecie-do-cv',
  },
};
export const isProduct = (o) => !!o?.product && !!PRODUCTS[o.product];
export const productName = (o) => PRODUCTS[o.product]?.name || o.product;
export const productReturn = (o, base) => `${base}${PRODUCTS[o.product].page}?zamowienie=${encodeURIComponent(o.id)}`;

const IMG = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
export const PHOTO_UPLOAD_PATHS = ['/api/photo/preview', '/api/products/photo'];
export const imgBuf = (d) => { const m = IMG.exec(String(d || '')); return m ? Buffer.from(m[2], 'base64') : null; };
const opts = (b = {}) => ({ bg: b.bg in BGS ? b.bg : 'jasne', crop: b.crop in CROPS ? b.crop : '3:4' });
// Pliki do pobrania po płatności (generowane z oryginału przy pobraniu – na serwerze trzymamy tylko oryginał, usuwany po 30 dniach).
export const PHOTO_FILES = { 'zdjecie-cv-3x4.jpg': { crop: '3:4', format: 'jpeg' }, 'zdjecie-cv-3x4.png': { crop: '3:4', format: 'png' }, 'zdjecie-cv-kwadrat.jpg': { crop: '1:1', format: 'jpeg' }, 'zdjecie-cv-kwadrat.png': { crop: '1:1', format: 'png' } };
export const photoFile = (src, bg, name) => photoFull(imgBuf(src), { bg, ...PHOTO_FILES[name] });
// Wersja do wstawienia w CV (600 px, JPEG – mieści się w limicie zdjęcia w profilu).
export const photoForCv = async (src, bg) => `data:image/jpeg;base64,${Buffer.from(await photoFull(imgBuf(src), { bg, crop: '3:4', width: 600, format: 'jpeg' })).toString('base64')}`;

export function productRoutes(app, { BASE_URL, DEMO, getOrder, saveOrder, updateOrder, openPayment, pickGateway, BAD_GATEWAY, cleanInvoice, WAIVER, closed, CLOSED_MSG, PayOpenError }) {
  const hits = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; if (hits.size > 10000) hits.clear(); hits.set(key, [...h, now]); return false; };

  // Darmowy podgląd: mały obrazek (300 px) ze znakiem wodnym „PODGLĄD”. Zdjęcia nie zapisujemy.
  app.post('/api/photo/preview', async (req, res) => {
    if (limited('pv:' + req.ip, 15, 3600e3)) return res.status(429).json({ error: 'Wykorzystano limit podglądów na godzinę. Spróbuj później.' });
    const buf = imgBuf(req.body?.image);
    if (!buf) return res.status(400).json({ error: 'Wgraj zdjęcie w formacie JPG, PNG lub WebP.' });
    if (buf.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'Zdjęcie jest za duże. Wgraj mniejsze (do 6 MB).' });
    try { res.set('Cache-Control', 'no-store').json({ image: `data:image/jpeg;base64,${Buffer.from(await photoPreview(buf, opts(req.body))).toString('base64')}` }); }
    catch (e) { if (!(e instanceof PhotoError)) logEvent('zdjęcie', e.message); res.status(e instanceof PhotoError ? 422 : 500).json({ error: e instanceof PhotoError ? e.message : 'Nie udało się przygotować podglądu. Spróbuj za chwilę.' }); }
  });

  // Zakup: zamówienie z oryginałem zdjęcia i wybranymi opcjami; płatność jak przy CV. forOrder – zamówienie CV, do którego wstawimy zdjęcie.
  app.post('/api/products/photo', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, email = String(b.email || '').trim().toLowerCase().slice(0, 160), buf = imgBuf(b.image);
    if (!buf || buf.length > 6 * 1024 * 1024) return res.status(400).json({ error: 'Wgraj zdjęcie w formacie JPG, PNG lub WebP (do 6 MB).' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail – wyślemy na niego zdjęcie.' });
    if (b.terms !== true) return res.status(400).json({ error: 'Zaakceptuj Regulamin i Politykę prywatności.' });
    if (b.waiver !== true) return res.status(400).json({ error: 'Zaznacz zgodę na wykonanie usługi od razu po płatności.' });
    if (!DEMO && !pickGateway(b.gateway)) return res.status(400).json({ error: BAD_GATEWAY });
    const inv = b.invoice ? cleanInvoice(b.invoice) : null;
    if (inv?.error) return res.status(400).json({ error: inv.error });
    const forOrder = typeof b.forOrder === 'string' && /^[0-9a-f-]{36}$/.test(b.forOrder) ? b.forOrder : null;
    const o = { id: crypto.randomUUID(), product: 'photo', pkg: 'photo', productData: { image: b.image, ...opts(b), ...(forOrder ? { forOrder } : {}) },
      addons: {}, extraLangs: [], ads: [], total: PRODUCTS.photo.price(), discount: 0, profile: { name: '', email }, invoice: inv,
      uiLang: ['en', 'uk', 'de'].includes(b.uiLang) ? b.uiLang : 'pl', waiver: { text: WAIVER, at: Date.now() }, terms: { at: Date.now() }, status: 'pending', results: [], created: Date.now() };
    await saveOrder(o);
    try { res.json(await openPayment(o, b.gateway)); }
    catch (e) { res.status(e instanceof PayOpenError ? 502 : 400).json({ error: e.message || 'Błąd' }); }
  });

  // Strona powrotu (?zamowienie=<id>): stan zamówienia i lista plików (id zamówienia zna tylko kupujący).
  app.get('/api/products/:id', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const o = await getOrder(String(req.params.id)); if (!o || !o.product) return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
    res.json({ status: o.status, product: o.product, total: o.total, ...(o.status === 'done' ? { files: Object.keys(PHOTO_FILES), inserted: !!o.productResult?.inserted, mailed: o.mail?.status === 'sent' } : {}), ...(DEMO && o.status === 'pending' ? { demo: true } : {}) });
  });
  // Pliki tylko po opłaceniu. Zamówienie CV z dodatkiem „Zdjęcie do CV” – te same pliki z oryginału zdjęcia z kreatora.
  app.get('/api/products/:id/:file', async (req, res) => {
    const o = await getOrder(String(req.params.id)), f = PHOTO_FILES[req.params.file] ? req.params.file : null;
    const src = o?.product === 'photo' ? o.productData?.image : o?.photoPro?.src, bg = o?.product === 'photo' ? o.productData?.bg : o?.photoPro?.bg;
    if (!o || !f || !src || o.status !== 'done') return res.sendStatus(404);
    try { res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${f}"` }).type(f.endsWith('.png') ? 'png' : 'jpeg').send(Buffer.from(await photoFile(src, bg, f))); }
    catch (e) { logEvent('zdjęcie', e.message, { orderId: o.id }); res.sendStatus(500); }
  });
}

// Po płatności: rejestr sprzedaży, powiadomienie i faktura (deps.paidSteps), przetworzenie zdjęcia, wstawienie do zamówienia CV
// (gdy to zamówienie tego samego klienta), e-mail z plikami. Błąd przetwarzania: status „paid” i ponowienie jak przy CV.
export async function applyProduct(o, { getOrder, updateOrder, paidSteps, sendMail }) {
  const paidO = await updateOrder(o.id, (x) => ({ ...x, status: 'generating', paidAt: x.paidAt || Date.now() }));
  if (!o.paidAt) paidSteps(paidO);
  try {
    const d = o.productData || {}, files = {};
    for (const f of Object.keys(PHOTO_FILES)) files[f] = Buffer.from(await photoFile(d.image, d.bg, f));
    let inserted = false;
    const cv = d.forOrder ? await getOrder(d.forOrder) : null;
    if (cv && !cv.product && cv.status === 'done' && String(cv.profile?.email || '').toLowerCase() === o.profile.email) {
      const photo = await photoForCv(d.image, d.bg);
      await updateOrder(cv.id, (x) => ({ ...x, profile: { ...x.profile, photo } })); inserted = true;
    }
    const mail = await sendMail({ ...o, status: 'done' }, files, inserted).then(() => ({ status: 'sent', at: Date.now() }), (e) => { logEvent('e-mail', `Zdjęcie do CV: ${e.message}`, { orderId: o.id }); return { status: 'failed', error: e.message }; });
    await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail, productResult: { inserted } });
  } catch (e) {
    logEvent('zdjęcie', e.message, { orderId: o.id });
    await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować zdjęcia.' }));
    throw e;
  }
}
