import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { processPhoto, photoPreview, cropBox, PhotoError, BGS } from '../lib/photo-pro.js';
import { PRICES, ADDONS, calcTotal, orderPkgName } from '../lib/pricing.js';
import { invoiceLines } from '../lib/invoice.js';
import { applyProduct, PHOTO_FILES, isProduct, productReturn } from '../lib/products.js';
import { legalBody } from '../lib/legal.js';

// D1 (27.10): Zdjęcie do CV – 10 zł. Tło usuwane lokalnie (MODNet ONNX), kadr 3:4 i kwadrat, jasność; darmowy podgląd 300 px
// ze znakiem wodnym, pliki JPG/PNG po płatności, wstawienie do CV z zamówienia klienta; dodatek w kreatorze; regulamin (4 języki).
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Rysunek „osoby” (głowa, szyja, ramiona) na zielonym tle – model rozpoznaje sylwetkę.
function portrait(w = 600, h = 800) {
  const c = createCanvas(w, h), x = c.getContext('2d'), k = w / 600;
  x.scale(k, h / 800);
  x.fillStyle = '#6a8f5a'; x.fillRect(0, 0, 600, 800);
  x.fillStyle = '#2b3a67'; x.beginPath(); x.ellipse(300, 760, 260, 260, 0, Math.PI, 0); x.fill(); x.fillRect(40, 760, 520, 40);
  x.fillStyle = '#e0b090'; x.fillRect(260, 430, 80, 90); x.beginPath(); x.ellipse(300, 330, 110, 140, 0, 0, 2 * Math.PI); x.fill();
  x.fillStyle = '#3a2a1a'; x.beginPath(); x.ellipse(300, 240, 115, 70, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#222'; x.beginPath(); x.arc(260, 320, 10, 0, 7); x.arc(340, 320, 10, 0, 7); x.fill();
  return c.toBuffer('image/jpeg');
}
const px = (img, x, y) => { const c = createCanvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0); return [...g.getImageData(x, y, 1, 1).data.slice(0, 3)]; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const near = (a, b, d = 14) => a.every((v, i) => Math.abs(v - b[i]) <= d);

test('Cena 10 zł, dodatek w kreatorze, nazwa w raporcie i pozycja faktury', () => {
  assert.equal(PRICES.photo, 1000);
  assert.equal(ADDONS.photo, 'Zdjęcie do CV (tło, kadr, jasność)');
  assert.equal(calcTotal('cv', 1, { photo: true }, false, []), PRICES.cv + 1000);
  assert.equal(orderPkgName({ product: 'photo', pkg: 'photo' }), 'Zdjęcie do CV');
  assert.deepEqual(invoiceLines({ product: 'photo', total: 1000 }), [{ name: 'Zdjęcie do CV: jednolite tło, kadr i wyrównanie jasności (bez retuszu twarzy)', qty: 1, price: 1000, value: 1000 }]);
  assert.ok(isProduct({ product: 'photo' }) && !isProduct({ pkg: 'cv' }));
  assert.equal(productReturn({ id: 'abc', product: 'photo' }, 'https://x.test'), 'https://x.test/narzedzia/zdjecie-do-cv?zamowienie=abc');
});

test('Kadr: głowa ok. połowy wysokości, 10% nad głową, nigdy szerszy niż zdjęcie', () => {
  const w = 60, h = 80, m = new Float32Array(w * h);
  for (let y = 10; y < 80; y++) for (let x = 0; x < w; x++) if ((y < 40 && Math.abs(x - 30) < 8) || (y >= 40 && Math.abs(x - 30) < 25)) m[y * w + x] = 1;
  const b = cropBox({ m, w, h }, [3, 4], 600, 800);
  assert.ok(Math.abs(b.w / b.h - 0.75) < 1e-9, 'proporcje 3:4');
  assert.ok(b.w <= 600 && b.x >= 0 && b.x + b.w <= 600 + 1e-9, 'w granicach zdjęcia');
  assert.ok(Math.abs(b.y - (100 - b.h * 0.1)) < 1e-6, '10% nad czubkiem głowy');
  assert.equal(cropBox({ m: new Float32Array(w * h), w, h }, [3, 4], 600, 800), null, 'brak osoby');
});

test('Przetwarzanie lokalne: pełne pliki 1200×1600 i 1200×1200 z jednolitym tłem, podgląd 300 px ze znakiem wodnym', async () => {
  const src = portrait();
  const full = await loadImage(Buffer.from(await processPhoto(src, { bg: 'niebieskie', crop: '3:4', width: 1200, format: 'png' })));
  assert.deepEqual([full.width, full.height], [1200, 1600]);
  assert.ok(near(px(full, 10, 10), hex(BGS.niebieskie)), `tło niebieskie: ${px(full, 10, 10)}`);
  const sq = await loadImage(Buffer.from(await processPhoto(src, { bg: 'szare', crop: '1:1', width: 1200, format: 'jpeg' })));
  assert.deepEqual([sq.width, sq.height], [1200, 1200]);
  assert.ok(near(px(sq, 5, 600), hex(BGS.szare)), 'kwadrat: tło po bokach');
  const pv = await loadImage(Buffer.from(await photoPreview(src, { bg: 'jasne' })));
  assert.deepEqual([pv.width, pv.height], [300, 400], 'podgląd mały');
  const plain = await loadImage(Buffer.from(await processPhoto(src, { bg: 'jasne', width: 300 })));
  let diff = 0; for (let y = 0; y < 400; y += 10) for (let x = 0; x < 300; x += 10) if (!near(px(pv, x, y), px(plain, x, y), 10)) diff++;
  assert.ok(diff > 20, `znak wodny „PODGLĄD” na podglądzie (${diff} różnic)`);
  await assert.rejects(processPhoto(Buffer.from('nie obraz')), PhotoError);
  await assert.rejects(processPhoto(portrait(150, 200)), /za małe/);
});

test('Po płatności: pliki, wstawienie do CV tego samego klienta (inny e-mail – bez wstawienia), mail; błąd → „paid”', async () => {
  const image = `data:image/jpeg;base64,${portrait().toString('base64')}`;
  const db = { cv1: { id: 'cv1', status: 'done', profile: { email: 'jan@test.pl', photo: '' } }, cv2: { id: 'cv2', status: 'done', profile: { email: 'inny@test.pl' } } };
  const updateOrder = async (id, f) => (db[id] = typeof f === 'function' ? f(db[id]) : { ...db[id], ...f });
  const deps = (sent) => ({ getOrder: async (id) => db[id], updateOrder, paidSteps: () => (db.steps = (db.steps || 0) + 1), sendMail: async (o, files, inserted) => sent.push({ files: Object.keys(files), inserted }) });
  const sent = [];
  db.p1 = { id: 'p1', product: 'photo', status: 'pending', total: 1000, profile: { email: 'jan@test.pl' }, productData: { image, bg: 'jasne', crop: '3:4', forOrder: 'cv1' } };
  await applyProduct(db.p1, deps(sent));
  assert.equal(db.p1.status, 'done'); assert.equal(db.p1.productResult.inserted, true); assert.equal(db.steps, 1, 'faktura, rejestr sprzedaży, powiadomienie');
  assert.match(db.cv1.profile.photo, /^data:image\/jpeg;base64,/);
  assert.deepEqual(sent[0], { files: Object.keys(PHOTO_FILES), inserted: true });
  db.p2 = { id: 'p2', product: 'photo', status: 'pending', total: 1000, profile: { email: 'jan@test.pl' }, productData: { image, bg: 'szare', forOrder: 'cv2' } };
  await applyProduct(db.p2, deps(sent));
  assert.equal(db.p2.productResult.inserted, false, 'cudze zamówienie CV');
  assert.equal(db.cv2.profile.photo, undefined);
  db.p3 = { id: 'p3', product: 'photo', status: 'pending', total: 1000, profile: { email: 'jan@test.pl' }, productData: { image: 'data:image/png;base64,AAAA', bg: 'jasne' } };
  await assert.rejects(applyProduct(db.p3, deps(sent)));
  assert.equal(db.p3.status, 'paid'); assert.equal(db.p3.attempts, 1);
});

test('API: podgląd bez zapisu, zamówienie, pliki dopiero po płatności; dodatek w kreatorze wymaga zdjęcia', async () => {
  const port = 4700 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-photo-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, post = (p, b) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    for (let i = 0; i < 80; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const image = `data:image/jpeg;base64,${portrait().toString('base64')}`;
    const pv = await post('/api/photo/preview', { image, bg: 'szare', crop: '1:1' }).then((r) => r.json());
    assert.match(pv.image, /^data:image\/jpeg;base64,/);
    assert.equal((await post('/api/photo/preview', { image: 'x' })).status, 400);
    assert.equal((await post('/api/products/photo', { image, email: 'jan@test.pl', terms: true })).status, 400, 'bez zgody z art. 38 pkt 13');
    const o = await post('/api/products/photo', { image, email: 'Jan@Test.pl', terms: true, waiver: true, bg: 'niebieskie' }).then((r) => r.json());
    assert.ok(o.id && o.demo);
    assert.equal((await fetch(`${U}/api/products/${o.id}/zdjecie-cv-3x4.png`)).status, 404, 'przed płatnością brak plików');
    assert.equal((await fetch(`${U}/api/products/${o.id}`).then((r) => r.json())).status, 'pending');
    await post(`/api/orders/${o.id}/demo-pay`, {});
    let st; for (let i = 0; i < 60 && st?.status !== 'done'; i++) { await wait(250); st = await fetch(`${U}/api/products/${o.id}`).then((r) => r.json()); }
    assert.equal(st.status, 'done'); assert.deepEqual(st.files, Object.keys(PHOTO_FILES));
    const f = await fetch(`${U}/api/products/${o.id}/zdjecie-cv-kwadrat.png`);
    assert.equal(f.status, 200); assert.equal(f.headers.get('content-type'), 'image/png');
    assert.equal((await fetch(`${U}/api/products/${o.id}/inny.png`)).status, 404);
    const saved = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === o.id);
    assert.equal(saved.profile.email, 'jan@test.pl'); assert.equal(saved.total, 1000); assert.equal(saved.productData.bg, 'niebieskie'); assert.ok(saved.waiver.text);
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const r = await post('/api/orders', { pkg: 'cv', consent: true, waiver: true, addons: { photo: true }, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal(r.status, 400, 'dodatek bez zdjęcia'); assert.match((await r.json()).error, /odznacz „Zdjęcie do CV”/);
  } finally { srv.kill(); }
});

test('Kreator, strona narzędzia, regulamin (4 języki, 27.10.2026) i tłumaczenia', () => {
  const app = read('public/app.js'), srv = read('server.js');
  assert.match(app, /photo: \['#adPhoto', 'Zdjęcie do CV'\]/);
  assert.match(app, /if \(n === 6 && \$\('#adPhoto'\)\.checked && !photo\) return/);
  assert.match(app, /Nie retuszujemy twarzy i nie zmieniamy wyglądu\./);
  assert.match(srv, /if \(isProduct\(o\)\) return await applyProduct\(/);
  for (const [l, re, hist] of [
    ['pl', /Usługodawca nie retuszuje twarzy i nie zmienia wyglądu osoby na zdjęciu\.[\s\S]*Zdjęcie do CV \(§2 ust\. 6\) – 10 zł/, /Regulamin obowiązuje od 27 października 2026 r\. Historia zmian: 27 października 2026 r\. – usługa „Zdjęcie do CV” \(§2 ust\. 6, §4 ust\. 1\);/],
    ['en', /does not retouch the face or change the appearance[\s\S]*CV photo \(§2\(6\)\) – PLN 10/, /effective from 27 October 2026\. Change history: 27 October 2026 – “CV photo” service/],
    ['de', /retuschiert das Gesicht nicht[\s\S]*Bewerbungsfoto \(§2 Abs\. 6\) – 10 PLN/, /gelten ab dem 27\. Oktober 2026\. Änderungshistorie: 27\. Oktober 2026 – Dienstleistung „Bewerbungsfoto“/],
    ['uk', /не ретушує обличчя[\s\S]*Фото для резюме \(§2 п\. 6\) – 10 zł/, /діють з 27 жовтня 2026 р\. Історія змін: 27 жовтня 2026 р\. – послуга «Фото для резюме»/]]) {
    const b = legalBody('regulamin', l); assert.match(b, re, l); assert.match(b, hist, l);
  }
  for (const l of ['en', 'de', 'uk']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const k of ['Zdjęcie gotowe do CV – 10 zł', 'Pokaż podgląd za darmo', 'Kup zdjęcie do CV –', 'Tło zdjęcia', 'Zdjęcie do CV: jednolite tło i kadr, wstawione do tego CV – 10 zł']) assert.ok(d[k], `${l}: ${k}`);
  }
});
