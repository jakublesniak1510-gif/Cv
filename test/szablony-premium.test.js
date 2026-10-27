import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import JSZip from 'jszip';
import { PREMIUM, premiumZip, premiumDocx, PREMIUM_ZIP } from '../lib/premium-templates.js';
import { PRICES, orderPkgName } from '../lib/pricing.js';
import { invoiceLines } from '../lib/invoice.js';
import { PRODUCTS, DIGITAL_WAIVER } from '../lib/products.js';
import { legalBody } from '../lib/legal.js';

// D2 (27.10): Szablony CV premium – 10 szablonów Word (DOCX) w ZIP za 19 zł, /szablony-premium. Podglądy ze znakiem wodnym,
// pliki tylko po płatności (pobranie i e-mail), faktura, zgoda na dostarczenie treści cyfrowej, regulamin (4 języki).
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const docXml = async (buf) => (await JSZip.loadAsync(buf)).file('word/document.xml').async('string');

test('Cena 19 zł, nazwa w raporcie, pozycja faktury, produkt z jednym plikiem ZIP', () => {
  assert.equal(PRICES.templates, 1900);
  assert.equal(orderPkgName({ product: 'templates' }), 'Szablony CV premium (Word)');
  assert.deepEqual(invoiceLines({ product: 'templates', total: 1900 }), [{ name: 'Pakiet 10 szablonów CV w formacie Word (DOCX) – treść cyfrowa', qty: 1, price: 1900, value: 1900 }]);
  assert.equal(PRODUCTS.templates.page, '/szablony-premium');
  assert.deepEqual(PRODUCTS.templates.files(), [PREMIUM_ZIP]);
});

test('Paczka: 10 różnych szablonów DOCX i instrukcja; podpowiedzi zamiast fikcyjnej osoby, klauzula RODO, bez znaku wodnego', async () => {
  assert.equal(PREMIUM.length, 10);
  assert.equal(new Set(PREMIUM.map((t) => t.slug)).size, 10);
  const zip = await JSZip.loadAsync(await premiumZip()), names = Object.keys(zip.files).sort();
  assert.equal(names.filter((n) => n.endsWith('.docx')).length, 10);
  assert.ok(names.includes('Jak-korzystac.txt'));
  const xmls = [];
  for (const t of PREMIUM) {
    const x = await docXml(await premiumDocx(t)); xmls.push(x);
    assert.match(x, /Imię Nazwisko/, t.slug); assert.match(x, /Rozporządzenia Parlamentu Europejskiego i Rady \(UE\) 2016\/679/, t.slug);
    assert.doesNotMatch(x, /PODGLĄD|PRZYKŁAD/, `${t.slug}: bez znaku wodnego`);
  }
  assert.equal(new Set(xmls).size, 10, 'każdy układ inny');
  const has = (slug, re) => assert.match(xmls[PREMIUM.findIndex((t) => t.slug === slug)], re, slug);
  has('nowoczesny-pasek', /<w:tbl>/); has('it', /Technologie|TECHNOLOGIE/); has('praca-fizyczna', /UPRAWNIENIA I KWALIFIKACJE/); has('europejski', /Miejsce na zdjęcie/); has('menedzer', /Kluczowe osiągnięcia/);
  for (const t of PREMIUM) assert.ok(fs.existsSync(new URL(`../public/media/szablony-premium/${t.slug}.jpg`, import.meta.url)), `podgląd ${t.slug}`);
});

test('API i strona: zakup, plik dopiero po płatności, strona z galerią i zgodą na treść cyfrową, sitemap', async () => {
  const port = 5000 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-prem-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, post = (p, b) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    for (let i = 0; i < 80; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const html = await fetch(U + '/szablony-premium').then((r) => r.text());
    assert.equal((html.match(/src="\/media\/szablony-premium\/[\w-]+\.jpg"/g) || []).length, 10, 'galeria 10 podglądów');
    assert.ok(html.includes(DIGITAL_WAIVER) && html.includes('Kup szablony – 19 zł') && html.includes('src="/szablony.js"'));
    assert.match(html, /"@type":"FAQPage"/);
    assert.match(await fetch(U + '/sitemap.xml').then((r) => r.text()), /\/szablony-premium</);
    assert.match(await fetch(U + '/wzor-cv').then((r) => r.text()), /href="\/szablony-premium"/, 'link z darmowych wzorów');
    assert.equal((await post('/api/products/templates', { email: 'jan@test.pl', terms: true })).status, 400, 'bez zgody na treść cyfrową');
    assert.equal((await post('/api/products/templates', { email: 'zly', terms: true, waiver: true })).status, 400);
    const o = await post('/api/products/templates', { email: 'Jan@Test.pl', terms: true, waiver: true, invoice: { name: 'Jan Test', address: 'ul. Testowa 1, Kraków' } }).then((r) => r.json());
    assert.ok(o.id && o.demo);
    assert.equal((await fetch(`${U}/api/products/${o.id}/${PREMIUM_ZIP}`)).status, 404, 'przed płatnością brak pliku');
    await post(`/api/orders/${o.id}/demo-pay`, {});
    let st; for (let i = 0; i < 40 && st?.status !== 'done'; i++) { await wait(200); st = await fetch(`${U}/api/products/${o.id}`).then((r) => r.json()); }
    assert.equal(st.status, 'done'); assert.deepEqual(st.files, [PREMIUM_ZIP]);
    const z = await fetch(`${U}/api/products/${o.id}/${PREMIUM_ZIP}`);
    assert.equal(z.status, 200); assert.equal(z.headers.get('content-type'), 'application/zip');
    assert.equal(Object.keys((await JSZip.loadAsync(Buffer.from(await z.arrayBuffer()))).files).length, 11);
    assert.equal((await fetch(`${U}/api/products/${o.id}/zdjecie-cv-3x4.jpg`)).status, 404, 'tylko pliki tego produktu');
    const saved = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === o.id);
    assert.equal(saved.product, 'templates'); assert.equal(saved.total, 1900); assert.equal(saved.profile.email, 'jan@test.pl');
    assert.equal(saved.waiver.text, DIGITAL_WAIVER); assert.equal(saved.invoice.name, 'Jan Test');
  } finally { srv.kill(); }
});

test('Regulamin (4 języki, 27.10.2026, historia), skrypt strony i tłumaczenia', () => {
  for (const [l, re, hist] of [
    ['pl', /„Szablony CV premium” to pakiet 10 edytowalnych szablonów CV w formacie Word \(DOCX\)[\s\S]*nie może ich odsprzedawać[\s\S]*Szablony CV premium \(§2 ust\. 7\) – 19 zł\./, /Historia zmian: (?:[^;]*; )*27 października 2026 r\. – „Szablony CV premium” \(§2 ust\. 7, §4 ust\. 1\);/],
    ['en', /“Premium CV templates” is a pack of 10 editable CV templates[\s\S]*Premium CV templates \(§2\(7\)\) – PLN 19\./, /Change history: (?:[^;]*; )*27 October 2026 – “Premium CV templates”/],
    ['de', /„Premium-Lebenslaufvorlagen“ sind ein Paket mit 10 bearbeitbaren[\s\S]*Premium-Lebenslaufvorlagen \(§2 Abs\. 7\) – 19 PLN\./, /Änderungshistorie: (?:[^;]*; )*27\. Oktober 2026 – „Premium-Lebenslaufvorlagen“/],
    ['uk', /«Преміум-шаблони резюме» – це пакет із 10[\s\S]*Преміум-шаблони резюме \(§2 п\. 7\) – 19 zł\./, /Історія змін: (?:[^;]*; )*27 жовтня 2026 р\. – «Преміум-шаблони резюме»/]]) {
    const b = legalBody('regulamin', l); assert.match(b, re, l); assert.match(b, hist, l);
  }
  const js = read('public/szablony.js');
  assert.match(js, /fetch\('\/api\/products\/templates'/); assert.match(js, /\/api\/orders\/\$\{j\.id\}\/demo-pay/);
  for (const l of ['en', 'de', 'uk']) {
    const d = JSON.parse(read(`public/i18n/${l}.json`));
    for (const k of ['Szablony CV premium w Word – 10 układów za 19 zł', 'Kup szablony – 19 zł', DIGITAL_WAIVER, 'Pobierz szablony (ZIP)', ...PREMIUM.map((t) => t.name), ...PREMIUM.map((t) => t.desc)]) assert.ok(d[k], `${l}: ${k}`);
  }
});
