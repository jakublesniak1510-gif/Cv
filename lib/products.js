import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PRICES } from './pricing.js';
import { logEvent } from './events.js';
import { photoPreview, photoFull, processPhotos, PhotoError, CROPS, imageSize, MAX_SIDE } from './photo-pro.js';
import { premiumZip, PREMIUM_ZIP } from './premium-templates.js';
import { translationFor, TR_BETA } from './translation.js';
import { adCheckFor, renderAdReport } from './ad-check.js';
import { offerDraftFor, offerText, createCode, useCode, codeState, offerCodes } from './offer.js';
import { grantDraftFor, GRANT_FILES, GRANT_REVISIONS, GRANT_TYPES, grantFile, grantDownloadName, reviseGrant } from './grant.js';
import { renderCv } from './pdf.js';
import { renderDocx } from './docx.js';
import { docFile } from './doc-names.js';

// Usługi sprzedawane osobno (blok D, 27.10). To zwykłe zamówienia (orders) z polem `product`: ta sama płatność (Stripe / Przelewy24,
// openPayment), faktura, rejestr sprzedaży, zwroty w panelu i usuwanie danych po 30 dniach co przy CV. Realizacja po płatności: applyProduct.
export const PRODUCTS = {
  photo: {
    name: 'Zdjęcie do CV',
    invoice: 'Zdjęcie do CV: kadr i wyrównanie jasności (bez retuszu twarzy)',
    price: () => PRICES.photo,
    page: '/narzedzia/zdjecie-do-cv',
    files: () => Object.keys(PHOTO_FILES),
  },
  // D2: 10 szablonów CV w Word (lib/premium-templates.js) – treść cyfrowa, ZIP do pobrania i e-mailem.
  templates: {
    name: 'Szablony CV premium (Word)',
    invoice: 'Pakiet 10 szablonów CV w formacie Word (DOCX) – treść cyfrowa',
    price: () => PRICES.templates,
    page: '/szablony-premium',
    files: () => [PREMIUM_ZIP],
  },
  // D3: tłumaczenie CV (lib/translation.js) – dokładnie to tłumaczenie, które klient widział w podglądzie, w PDF i DOCX.
  translation: {
    name: 'Tłumaczenie CV',
    invoice: 'Tłumaczenie CV na wybrany język (PDF i DOCX) – nie jest tłumaczeniem przysięgłym',
    price: () => PRICES.translation,
    page: '/tlumaczenie-cv',
    files: () => TR_FILES,
  },
  // D4: sprawdzenie ogłoszenia o pracę dla pracodawców (lib/ad-check.js) – pełny raport z tego samego wyniku co podgląd, faktura z NIP.
  adcheck: {
    name: 'Sprawdzenie ogłoszenia o pracę',
    invoice: 'Sprawdzenie ogłoszenia o pracę: raport z uwagami i poprawioną wersją ogłoszenia (PDF)',
    price: () => PRICES.adcheck,
    page: '/dla-firm/sprawdz-ogloszenie',
    files: () => [AD_REPORT],
  },
};
export const AD_REPORT = 'raport-ogloszenia.pdf';
// D5: dotacja z urzędu pracy (lib/grant.js) – dwa warianty: biznesplan oraz wniosek z biznesplanem; 3 poprawki w cenie.
PRODUCTS.grantplan = { name: 'Biznesplan do dotacji z urzędu pracy', invoice: 'Biznesplan do wniosku o dotację z urzędu pracy (PDF i DOCX, 3 poprawki) – usługa cyfrowa', price: () => PRICES.grantplan, page: '/uslugi/dotacja-z-urzedu-pracy', files: () => GRANT_FILES.plan };
PRODUCTS.grantfull = { name: 'Wniosek o dotację z urzędu pracy z biznesplanem', invoice: 'Wniosek o dotację z urzędu pracy (pola wniosku DOCX) i biznesplan (PDF i DOCX), 3 poprawki – usługa cyfrowa', price: () => PRICES.grantfull, page: '/uslugi/dotacja-z-urzedu-pracy', files: () => GRANT_FILES.full };
// D6: oferta na zlecenie (lib/offer.js) – jedna oferta albo pakiet 5 ofert (kod ważny 90 dni; oferta z podglądu wchodzi w pakiet).
PRODUCTS.offer = { name: 'Oferta na zlecenie', invoice: 'Oferta na zlecenie: odpowiedź do klienta, wycena w punktach i pytania – usługa cyfrowa', price: () => PRICES.offer, page: '/uslugi/oferta-na-zlecenie', files: () => [OFFER_TXT] };
PRODUCTS.offerpack = { name: 'Pakiet 5 ofert na zlecenie', invoice: 'Pakiet 5 ofert na zlecenie (kod ważny 90 dni) – usługa cyfrowa', price: () => PRICES.offerpack, page: '/uslugi/oferta-na-zlecenie', files: () => [] };
export const OFFER_TXT = 'oferta.txt';
export const isGrant = (o) => o?.product === 'grantplan' || o?.product === 'grantfull';
// Pliki tłumaczenia: krótkie klucze w adresie, w pobraniu i w mailu nazwa „Imię_Nazwisko_CV_Stanowisko_EN”.
export const TR_FILES = ['cv.pdf', 'cv.docx'];
export const trFileName = (r, f) => docFile('cv', r.cv?.name, r.cv?.headline, r.lang, f.split('.')[1]);
const trFile = (r, d, f) => (f === 'cv.pdf' ? renderCv(r, d) : renderDocx(r, 'cv', d));
// Treść cyfrowa (szablony): zgoda na dostarczenie przed upływem terminu odstąpienia (art. 38 pkt 13 ustawy o prawach konsumenta).
export const DIGITAL_WAIVER = 'Chcę otrzymać pliki od razu po płatności. Wiem, że po ich dostarczeniu tracę prawo do odstąpienia od umowy.';
export const isProduct = (o) => !!o?.product && !!PRODUCTS[o.product];
export const productName = (o) => PRODUCTS[o.product]?.name || o.product;
export const productReturn = (o, base) => `${base}${PRODUCTS[o.product].page}?zamowienie=${encodeURIComponent(o.id)}`;

const IMG = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/;
export const PHOTO_UPLOAD_PATHS = ['/api/photo/preview', '/api/products/photo'];
export const imgBuf = (d) => { const m = IMG.exec(String(d || '')); return m ? Buffer.from(m[2], 'base64') : null; };
// Ramka kadru z przeglądarki: ułamki 0–1 (x, y, w); serwer i tak ją przycina do granic zdjęcia.
const frameOf = (f) => (f && typeof f === 'object' ? Object.fromEntries(['x', 'y', 'w'].map((k) => [k, Math.min(1, Math.max(0, Number(f[k]) || 0))])) : null);
const opts = (b = {}) => ({ frame: frameOf(b.frame), crop: b.crop in CROPS ? b.crop : '3:4' });
// Zdjęcie zamówienia: osobny plik w DATA_DIR/photos (nie w orders.json – magazyn zamówień czyta cały plik przy każdym odczycie).
// Usuwane po 30 dniach od wgrania (cleanupPhotos, codzienne sprzątanie w server.js) – razem z danymi zamówienia.
const PHOTO_DIR = () => path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'photos');
const photoPath = (id, ext) => path.join(PHOTO_DIR(), `${String(id).replace(/[^\w-]/g, '')}.${ext === 'png' ? 'png' : 'jpg'}`);
export async function savePhoto(id, buf) { await fs.mkdir(PHOTO_DIR(), { recursive: true }); const ext = buf[0] === 0x89 ? 'png' : 'jpg'; await fs.writeFile(photoPath(id, ext), buf); return ext; }
export const readPhoto = (id, ext) => fs.readFile(photoPath(id, ext));
export async function cleanupPhotos(maxAgeMs) {
  let n = 0;
  for (const f of await fs.readdir(PHOTO_DIR()).catch(() => [])) {
    const p = path.join(PHOTO_DIR(), f), st = await fs.stat(p).catch(() => null);
    if (st && Date.now() - st.mtimeMs > maxAgeMs) { await fs.rm(p, { force: true }); n++; }
  }
  return n;
}
// Pliki do pobrania po płatności (generowane ze zdjęcia przy pobraniu – na serwerze trzymamy tylko zdjęcie, usuwane po 30 dniach).
export const PHOTO_FILES = { 'zdjecie-cv-3x4.jpg': { crop: '3:4', format: 'jpeg' }, 'zdjecie-cv-3x4.png': { crop: '3:4', format: 'png' }, 'zdjecie-cv-kwadrat.jpg': { crop: '1:1', format: 'jpeg' }, 'zdjecie-cv-kwadrat.png': { crop: '1:1', format: 'png' } };
export const photoFile = (buf, frame, name) => photoFull(buf, { frame, ...PHOTO_FILES[name] });
// Wersja do wstawienia w CV (600 px, JPEG – mieści się w limicie zdjęcia w profilu).
export const photoForCv = async (buf, frame) => `data:image/jpeg;base64,${Buffer.from(await photoFull(buf, { frame, crop: '3:4', width: 600, format: 'jpeg' })).toString('base64')}`;

export function productRoutes(app, { BASE_URL, DEMO, getOrder, saveOrder, updateOrder, openPayment, pickGateway, BAD_GATEWAY, cleanInvoice, WAIVER, closed, CLOSED_MSG, PayOpenError, sendMail = async () => {}, revise = reviseGrant }) {
  const hits = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; if (hits.size > 10000) hits.clear(); hits.set(key, [...h, now]); return false; };

  // Darmowy podgląd: mały obrazek (300 px) ze znakiem wodnym „PODGLĄD”. Zdjęcia nie zapisujemy.
  app.post('/api/photo/preview', async (req, res) => {
    if (limited('pv:' + req.ip, 15, 3600e3)) return res.status(429).json({ error: 'Wykorzystano limit podglądów na godzinę. Spróbuj później.' });
    const buf = imgBuf(req.body?.image);
    if (!buf) return res.status(400).json({ error: 'Wgraj zdjęcie w formacie JPG lub PNG.' });
    if (buf.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Zdjęcie jest za duże. Wgraj mniejsze (do 4 MB).' });
    try { res.set('Cache-Control', 'no-store').json({ image: `data:image/jpeg;base64,${Buffer.from(await photoPreview(buf, opts(req.body))).toString('base64')}` }); }
    catch (e) { if (!(e instanceof PhotoError)) logEvent('zdjęcie', e.message); res.status(e instanceof PhotoError ? 422 : 500).json({ error: e instanceof PhotoError ? e.message : 'Nie udało się przygotować podglądu. Spróbuj za chwilę.' }); }
  });

  // Wspólne dla zakupów: e-mail, zgody, bramka, faktura → zamówienie i płatność (jak przy CV).
  const buyer = (b) => {
    const email = String(b.email || '').trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Podaj poprawny adres e-mail – wyślemy na niego pliki.' };
    if (b.terms !== true) return { error: 'Zaakceptuj Regulamin i Politykę prywatności.' };
    if (b.waiver !== true) return { error: 'Zaznacz zgodę na wykonanie usługi od razu po płatności.' };
    if (!DEMO && !pickGateway(b.gateway)) return { error: BAD_GATEWAY };
    const inv = b.invoice ? cleanInvoice(b.invoice) : null;
    if (inv?.error) return { error: inv.error };
    return { email, inv };
  };
  const order = async (res, b, id, product, productData, { email, inv }, waiver) => {
    const o = { id, product, pkg: product, productData, addons: {}, extraLangs: [], ads: [], total: PRODUCTS[product].price(), discount: 0, profile: { name: '', email }, invoice: inv,
      uiLang: ['en', 'uk', 'de'].includes(b.uiLang) ? b.uiLang : 'pl', waiver: { text: waiver, at: Date.now() }, terms: { at: Date.now() }, status: 'pending', results: [], created: Date.now() };
    await saveOrder(o);
    try { res.json(await openPayment(o, b.gateway)); }
    catch (e) { res.status(e instanceof PayOpenError ? 502 : 400).json({ error: e.message || 'Błąd' }); }
  };

  // Zakup: zamówienie ze zdjęciem i ramką kadru (sprawdzone przed płatnością: format i rozdzielczość); płatność jak przy CV. forOrder – zamówienie CV, do którego wstawimy zdjęcie.
  app.post('/api/products/photo', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, buf = imgBuf(b.image);
    if (!buf || buf.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Wgraj zdjęcie w formacie JPG lub PNG (do 4 MB).' });
    const sz = imageSize(buf); // płatność tylko za zdjęcie, które da się przygotować
    if (!sz || Math.min(sz.w, sz.h) < 200 || Math.max(sz.w, sz.h) > MAX_SIDE) return res.status(400).json({ error: `Wgraj zdjęcie JPG lub PNG o boku od 200 do ${MAX_SIDE} px.` });
    const who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    const forOrder = typeof b.forOrder === 'string' && /^[0-9a-f-]{36}$/.test(b.forOrder) ? b.forOrder : null;
    const id = crypto.randomUUID(), ext = await savePhoto(id, buf);
    await order(res, b, id, 'photo', { photo: ext, frame: opts(b).frame, ...(forOrder ? { forOrder } : {}) }, who, WAIVER);
  });

  // Zakup tłumaczenia (D3): tłumaczenie z podglądu (48 h) trafia do zamówienia – po płatności bez drugiego zapytania do AI.
  app.post('/api/products/translation', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, tr = await translationFor(b.id);
    if (!tr) return res.status(404).json({ error: 'Podgląd wygasł. Wgraj CV jeszcze raz.' });
    const who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    await order(res, b, crypto.randomUUID(), 'translation', { translationId: tr.id, lang: tr.lang, beta: !!TR_BETA[tr.lang], design: tr.design, result: tr.result }, who, DIGITAL_WAIVER);
  });

  // Zakup sprawdzenia ogłoszenia (D4): tylko dla firm – faktura z NIP obowiązkowa; wynik z podglądu (48 h) trafia do zamówienia.
  app.post('/api/products/adcheck', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, x = await adCheckFor(b.id);
    if (!x) return res.status(404).json({ error: 'Wynik sprawdzenia wygasł. Wklej ogłoszenie jeszcze raz.' });
    const who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    if (!who.inv?.nip) return res.status(400).json({ error: 'Podaj dane firmy z NIP – wystawimy fakturę.' });
    await order(res, b, crypto.randomUUID(), 'adcheck', { checkId: x.id, result: x.result }, who, DIGITAL_WAIVER);
  });

  // Zakup dokumentów do dotacji (D5): dane z kreatora i wynik z podglądu (48 h) trafiają do zamówienia – po płatności bez drugiego zapytania do AI.
  app.post('/api/products/grant', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, x = await grantDraftFor(b.id);
    if (!x) return res.status(404).json({ error: 'Podgląd wygasł. Wypełnij kreator jeszcze raz.' });
    const who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    if (b.noGuarantee !== true) return res.status(400).json({ error: 'Potwierdź, że rozumiesz, że nie gwarantujemy przyznania dotacji.' });
    await order(res, b, crypto.randomUUID(), x.input.variant === 'full' ? 'grantfull' : 'grantplan', { draftId: x.id, input: x.input, result: x.result, revisions: 0, noGuaranteeAt: Date.now() }, who, DIGITAL_WAIVER);
  });
  // Poprawka (3 w cenie): uwagi klienta → nowa wersja dokumentów (strona i e-mail). Licznik rośnie tylko po udanej poprawce.
  app.post('/api/products/:id/revise', async (req, res) => {
    const o = await getOrder(String(req.params.id));
    if (!isGrant(o) || o.status !== 'done') return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
    const note = String(req.body?.note || '').trim().slice(0, 2000), pd = o.productData || {};
    if (note.length < 10) return res.status(400).json({ error: 'Napisz, co poprawić (co najmniej jedno zdanie).' });
    if ((pd.revisions || 0) >= GRANT_REVISIONS) return res.status(400).json({ error: 'Wykorzystano wszystkie poprawki w cenie (3).' });
    if (pd.revising) return res.status(409).json({ error: 'Poprawka jest w toku.' });
    await updateOrder(o.id, (x) => ({ ...x, productData: { ...x.productData, revising: true, revError: '' } }));
    res.json({ ok: true });
    (async () => {
      try {
        const result = await revise(pd.input, pd.result, note);
        const files = {}; for (const f of PRODUCTS[o.product].files()) files[grantDownloadName(pd.input, f)] = Buffer.from(await grantFile(pd.input, result, f));
        const o2 = await updateOrder(o.id, (x) => ({ ...x, productData: { ...x.productData, result, revisions: (x.productData.revisions || 0) + 1, revising: false, history: [...(x.productData.history || []), { at: Date.now(), note }] } }));
        await sendMail(o2, files, false).catch((e) => logEvent('e-mail', `${productName(o)} (poprawka): ${e.message}`, { orderId: o.id }));
      } catch (e) { logEvent('dotacja', `Poprawka: ${e.message}`, { orderId: o.id }); await updateOrder(o.id, (x) => ({ ...x, productData: { ...x.productData, revising: false, revError: 'Nie udało się przygotować poprawki. Spróbuj jeszcze raz – nie zużyliśmy poprawki.' } })); }
    })();
  });

  // Zakup oferty (D6): wynik z podglądu (48 h) trafia do zamówienia. Pakiet: kod na 5 ofert (90 dni), oferta z podglądu (jeśli jest) wchodzi w pakiet.
  app.post('/api/products/offer', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, x = await offerDraftFor(b.id);
    if (!x) return res.status(404).json({ error: 'Podgląd wygasł. Wypełnij formularz jeszcze raz.' });
    const who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    await order(res, b, crypto.randomUUID(), 'offer', { draftId: x.id, result: x.result }, who, DIGITAL_WAIVER);
  });
  app.post('/api/products/offerpack', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, x = b.id ? await offerDraftFor(b.id) : null;
    const who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    await order(res, b, crypto.randomUUID(), 'offerpack', x ? { draftId: x.id, result: x.result } : {}, who, DIGITAL_WAIVER);
  });

  // Zakup szablonów premium (D2): bez danych poza e-mailem; pliki po płatności.
  app.post('/api/products/templates', async (req, res) => {
    if (closed(req)) return res.status(503).json({ error: CLOSED_MSG });
    if (limited('po:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, who = buyer(b); if (who.error) return res.status(400).json({ error: who.error });
    await order(res, b, crypto.randomUUID(), 'templates', {}, who, DIGITAL_WAIVER);
  });

  // Strona powrotu (?zamowienie=<id>): stan zamówienia i lista plików (id zamówienia zna tylko kupujący).
  app.get('/api/products/:id', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const o = await getOrder(String(req.params.id)); if (!isProduct(o)) return res.status(404).json({ error: 'Nie znaleziono zamówienia.' });
    res.json({ status: o.status, product: o.product, total: o.total, ...(o.status === 'done' ? { files: PRODUCTS[o.product].files(), inserted: !!o.productResult?.inserted, mailed: o.mail?.status === 'sent', ...(o.product === 'adcheck' ? { report: o.productData?.result } : {}), ...(o.product === 'offer' || (o.product === 'offerpack' && o.productData?.result) ? { offer: o.productData.result, text: offerText(o.productData.result) } : {}), ...(o.product === 'offerpack' && o.productResult?.code ? codeState(await offerCodes.get(o.productResult.code) || { id: o.productResult.code, uses: 0, used: [], expires: 0 }) : {}), ...(isGrant(o) ? { revisionsLeft: GRANT_REVISIONS - (o.productData?.revisions || 0), revising: !!o.productData?.revising, revError: o.productData?.revError || '', sections: o.productData?.result?.sections?.map((s) => s.title) } : {}) } : {}), ...(DEMO && o.status === 'pending' ? { demo: true } : {}) });
  });
  // Pliki tylko po opłaceniu.
  app.get('/api/products/:id/:file', async (req, res) => {
    const o = await getOrder(String(req.params.id));
    if (o?.product === 'templates' && req.params.file === PREMIUM_ZIP && o.status === 'done') {
      try { return res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${PREMIUM_ZIP}"` }).type('application/zip').send(await premiumZip()); }
      catch (e) { logEvent('szablony', e.message, { orderId: o.id }); return res.sendStatus(500); }
    }
    if (o?.product === 'translation' && TR_FILES.includes(req.params.file) && o.status === 'done' && o.productData?.result) {
      const r = o.productData.result, f = req.params.file;
      try { return res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${trFileName(r, f)}"` }).type(f.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').send(Buffer.from(await trFile(r, o.productData.design, f))); }
      catch (e) { logEvent('tłumaczenie', e.message, { orderId: o.id }); return res.sendStatus(500); }
    }
    if ((o?.product === 'offer' || o?.product === 'offerpack') && req.params.file === OFFER_TXT && o.status === 'done' && o.productData?.result) {
      return res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${OFFER_TXT}"` }).type('text/plain; charset=utf-8').send(offerText(o.productData.result));
    }
    if (isGrant(o) && PRODUCTS[o.product].files().includes(req.params.file) && o.status === 'done' && o.productData?.result) {
      const f = req.params.file, d = o.productData.input;
      try { return res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${grantDownloadName(d, f)}"` }).type(GRANT_TYPES[f.split('.')[1]]).send(Buffer.from(await grantFile(d, o.productData.result, f))); }
      catch (e) { logEvent('dotacja', e.message, { orderId: o.id }); return res.sendStatus(500); }
    }
    if (o?.product === 'adcheck' && req.params.file === AD_REPORT && o.status === 'done' && o.productData?.result) {
      try { return res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${AD_REPORT}"` }).type('application/pdf').send(await renderAdReport(o.productData.result)); }
      catch (e) { logEvent('ogłoszenie', e.message, { orderId: o.id }); return res.sendStatus(500); }
    }
    const f = PHOTO_FILES[req.params.file] ? req.params.file : null;
    if (!o || o.product !== 'photo' || !f || !o.productData?.photo || o.status !== 'done') return res.sendStatus(404);
    const src = await readPhoto(o.id, o.productData.photo).catch(() => null); if (!src) return res.sendStatus(404); // po 30 dniach zdjęcia już nie ma
    try { res.set({ 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${f}"` }).type(f.endsWith('.png') ? 'png' : 'jpeg').send(await photoFile(src, o.productData.frame, f)); }
    catch (e) { logEvent('zdjęcie', e.message, { orderId: o.id }); res.sendStatus(500); }
  });
}

// Po płatności: rejestr sprzedaży, powiadomienie i faktura (deps.paidSteps), przygotowanie plików, e-mail z plikami.
// Zdjęcie: też wstawienie do zamówienia CV (gdy to zamówienie tego samego klienta). Błąd: status „paid” i ponowienie jak przy CV.
export async function applyProduct(o, { getOrder, updateOrder, paidSteps, sendMail }) {
  const paidO = await updateOrder(o.id, (x) => ({ ...x, status: 'generating', paidAt: x.paidAt || Date.now() }));
  if (!o.paidAt) paidSteps(paidO);
  const mailed = (files, inserted, productResult) => sendMail({ ...o, status: 'done', ...(productResult ? { productResult } : {}) }, files, inserted).then(() => ({ status: 'sent', at: Date.now() }), (e) => { logEvent('e-mail', `${productName(o)}: ${e.message}`, { orderId: o.id }); return { status: 'failed', error: e.message }; });
  if (o.product === 'translation') {
    try {
      const r = o.productData?.result; if (!r?.cv) throw new Error('Brak tłumaczenia w zamówieniu');
      const files = {}; for (const f of TR_FILES) files[trFileName(r, f)] = Buffer.from(await trFile(r, o.productData.design, f));
      const mail = await mailed(files, false); return void (await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail }));
    } catch (e) { logEvent('tłumaczenie', e.message, { orderId: o.id }); await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować plików.' })); throw e; }
  }
  if (o.product === 'offer' || o.product === 'offerpack') {
    try {
      const r = o.productData?.result; if (o.product === 'offer' && !r) throw new Error('Brak oferty w zamówieniu');
      let productResult = o.productResult;
      if (o.product === 'offerpack' && !productResult?.code) { // kod raz na zamówienie (ponowienie po błędzie nie tworzy drugiego)
        const c = await createCode(o.id, o.profile.email); productResult = { code: c.id };
        await updateOrder(o.id, { productResult });
        if (o.productData?.draftId) await useCode(c.id, o.productData.draftId);
      }
      const mail = await mailed(r ? { [OFFER_TXT]: Buffer.from(offerText(r)) } : {}, false, productResult);
      return void (await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail, ...(productResult ? { productResult } : {}) }));
    } catch (e) { logEvent('oferta', e.message, { orderId: o.id }); await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować oferty.' })); throw e; }
  }
  if (isGrant(o)) {
    try {
      const d = o.productData?.input, r = o.productData?.result; if (!r?.sections) throw new Error('Brak dokumentów w zamówieniu');
      const files = {}; for (const f of PRODUCTS[o.product].files()) files[grantDownloadName(d, f)] = Buffer.from(await grantFile(d, r, f));
      const mail = await mailed(files, false); return void (await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail }));
    } catch (e) { logEvent('dotacja', e.message, { orderId: o.id }); await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować dokumentów.' })); throw e; }
  }
  if (o.product === 'adcheck') {
    try {
      const r = o.productData?.result; if (!r?.remarks) throw new Error('Brak wyniku sprawdzenia w zamówieniu');
      const mail = await mailed({ [AD_REPORT]: await renderAdReport(r) }, false); return void (await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail }));
    } catch (e) { logEvent('ogłoszenie', e.message, { orderId: o.id }); await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować raportu.' })); throw e; }
  }
  if (o.product === 'templates') {
    try { const mail = await mailed({ [PREMIUM_ZIP]: await premiumZip() }, false); return void (await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail })); }
    catch (e) { logEvent('szablony', e.message, { orderId: o.id }); await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować plików.' })); throw e; }
  }
  try {
    const d = o.productData || {}, names = Object.keys(PHOTO_FILES), src = await readPhoto(o.id, d.photo);
    const outs = await processPhotos(src, d.frame, names.map((f) => ({ width: 1200, ...PHOTO_FILES[f] })));
    const files = Object.fromEntries(names.map((f, i) => [f, outs[i]]));
    let inserted = false;
    const cv = d.forOrder ? await getOrder(d.forOrder) : null;
    if (cv && !cv.product && cv.status === 'done' && String(cv.profile?.email || '').toLowerCase() === o.profile.email) {
      const photo = await photoForCv(src, d.frame);
      await updateOrder(cv.id, (x) => ({ ...x, profile: { ...x.profile, photo } })); inserted = true;
    }
    const mail = await mailed(files, inserted);
    await updateOrder(o.id, { status: 'done', doneAt: Date.now(), mail, productResult: { inserted } });
  } catch (e) {
    logEvent('zdjęcie', e.message, { orderId: o.id });
    await updateOrder(o.id, (x) => ({ ...x, status: 'paid', attempts: (x.attempts || 0) + 1, error: 'Nie udało się przygotować zdjęcia.' }));
    throw e;
  }
}
