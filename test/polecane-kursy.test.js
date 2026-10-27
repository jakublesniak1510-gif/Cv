import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { AFFILIATES, AFF_NOTE, coursesFor, affHtml, affSummary } from '../lib/affiliates.js';
import { PROFESSIONS } from '../lib/content.js';
import { stripPl } from '../lib/seo.js';
import { legalBody } from '../lib/legal.js';

// Polecane kursy (afiliacja webePartners, 27.10): seo-data/affiliates.json, najwyżej 2 kursy na polskich stronach zawodu, wzoru CV
// i poradnika, bez cen, z dopiskiem o prowizji, link rel="sponsored nofollow noopener"; zdarzenie aff_click; polityka prywatności.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const section = (h) => /<section class="aff" data-pl[\s\S]*?<\/section>/.exec(h)?.[0] || '';
const links = (h) => [...h.matchAll(/<a [^>]*data-aff="[^"]+"[^>]*>/g)].map((m) => m[0]);

test('Dane: 19 kursów z linkiem webep1.com (także Komunikacja i Menedżerskie), zawody istnieją', () => {
  const raw = JSON.parse(read('seo-data/affiliates.json')).kursy, slugs = new Set(PROFESSIONS.map((p) => p.slug));
  assert.equal(AFFILIATES.length, raw.filter((k) => k.url_partnerski).length);
  assert.equal(AFFILIATES.length, 19, 'wszystkie kursy z potwierdzonymi linkami (bez BHP)');
  for (const k of AFFILIATES) {
    assert.match(k.url_partnerski, /^https:\/\/webep1\.com\/go\/[0-9a-f]{9,10}$/, k.id);
    assert.doesNotMatch(`${k.nazwa} ${k.opis}`, /zł|gwarant|zarobk|zatrudnien/i, `${k.id}: bez cen i obietnic`);
    for (const z of k.zawody) assert.ok(z.endsWith('*') || slugs.has(z), `${k.id}: zawód ${z}`);
  }
  assert.ok(!AFFILIATES.some((k) => /bhp/i.test(k.nazwa)), 'BHP pomijamy');
});

test('Dobór: najwyżej 2 kursy, zawód bez mapowania – brak sekcji; HTML z dopiskiem, bez cen, rel sponsored, nowa karta', () => {
  assert.deepEqual(coursesFor('ksiegowa').map((k) => k.id), ['ksiegowosc', 'excel-zaawansowany']);
  assert.equal(coursesFor('asystentka-biura').length, 2, 'najwyżej 2 mimo 4 pasujących');
  assert.deepEqual(coursesFor('kierownik-magazynu').map((k) => k.id), ['menedzerskie', 'excel-zaawansowany'], 'najbardziej dopasowany pierwszy');
  assert.deepEqual(coursesFor('obsluga-klienta').map((k) => k.id), ['obsluga-klienta', 'komunikacja']);
  assert.deepEqual(coursesFor('kierowca'), []); assert.equal(affHtml('kierowca', 'cv/kierowca'), '');
  const h = affHtml('pracownik-biurowy', 'cv/pracownik-biurowy');
  assert.match(h, /<h2 id="aff-h">Kursy, które mogą przydać się w tym zawodzie<\/h2><p class="aff-note">Linki partnerskie: jeśli kupisz kurs, otrzymamy prowizję\. Cena dla Ciebie się nie zmienia\.<\/p>/);
  assert.equal(links(h).length, 2);
  for (const a of links(h)) { assert.match(a, /rel="sponsored nofollow noopener"/); assert.match(a, /target="_blank"/); assert.match(a, /data-aff-page="cv\/pracownik-biurowy"/); }
  assert.doesNotMatch(h, /\d+\s?zł/);
  assert.equal(section(stripPl(`<p>x</p>${h}`)), '', 'w wersjach EN/UK/DE sekcja jest usuwana');
});

test('Strony: /cv, /wzor-cv i poradnik pokazują sekcję pod treścią; zawód bez kursów i wersje EN/DE/UK – nie; klik liczony bez danych osobowych', async () => {
  const port = 5300 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-aff-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, get = (p) => fetch(U + p).then((r) => r.text());
    for (let i = 0; i < 80; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const cv = await get('/cv/ksiegowa'), s = section(cv);
    assert.ok(s.includes(AFF_NOTE) && s.includes('Kurs Księgowości Online') && s.includes('Zobacz kurs'));
    assert.ok(cv.indexOf('class="aff"') > cv.indexOf('<h2>Pytania</h2>'), 'pod treścią zawodu, nie w hero');
    assert.equal(section(await get('/cv/kierowca')), '', 'zawód bez mapowania');
    assert.ok(section(await get('/wzor-cv/ksiegowa')).includes('Kurs Księgowości Online'));
    assert.ok(section(await get('/poradnik/jak-dopasowac-cv-do-ogloszenia')).length > 0, 'poradnik z zawodem w related');
    assert.equal(section(await get('/')), '', 'nie na stronie głównej ani w kreatorze');
    const sm = await get('/sitemap.xml'), langUrls = [...sm.matchAll(/<loc>https?:\/\/[^/]+(\/(?:en|de|uk)\/[^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => /ksiegow|accountant|buchhalt|бухгалт/i.test(u)).slice(0, 6);
    assert.ok(langUrls.length >= 3, `wersje językowe: ${langUrls}`);
    for (const u of langUrls) { const h = await get(u); assert.doesNotMatch(h, /data-aff=|webep1\.com/, u); }
    for (const p of ['/cv/ksiegowa', '/wzor-cv/ksiegowa', '/cv/asystentka-biura']) for (const a of links(await get(p))) assert.match(a, /rel="sponsored nofollow noopener"/, p);
    // Kliknięcie: id kursu i strona; nieznany kurs pomijany; dwa kliknięcia tej samej osoby w ten sam kurs na tej stronie = 1.
    const t = (b) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130' }, body: JSON.stringify(b) });
    await t({ e: 'aff', t: 'ksiegowosc', g: 'cv/ksiegowa', p: '/cv/ksiegowa' }); await t({ e: 'aff', t: 'ksiegowosc', g: 'cv/ksiegowa', p: '/cv/ksiegowa' }); await t({ e: 'aff', t: 'nie-ma-takiego', g: 'cv/ksiegowa' });
    await t({ e: 'aff', t: 'excel-zaawansowany', g: 'wzor-cv/ksiegowa', email: 'jan@test.pl' });
    await wait(400);
    const ev = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'analytics.json'), 'utf8')))[0].events;
    assert.equal(ev.aff_click, 2); assert.equal(ev['aff_click:ksiegowosc'], 1); assert.equal(ev['aff_page:excel-zaawansowany|wzor-cv/ksiegowa'], 1);
    assert.ok(!Object.keys(ev).some((k) => k.includes('nie-ma-takiego')));
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'analytics.json'), 'utf8'), /jan@test\.pl/, 'bez danych osobowych');
    assert.deepEqual(affSummary(ev).map((r) => [r.id, r.clicks]), [['ksiegowosc', 1], ['excel-zaawansowany', 1]]);
  } finally { srv.kill(); }
});

test('Klik w lite.js, panel SEO, polityka prywatności (4 języki, 27.10.2026, historia)', () => {
  assert.match(read('public/lite.js'), /closest\('a\[data-aff\]'\)[\s\S]*sendBeacon\('\/api\/t', JSON\.stringify\(\{ e: 'aff', t: a\.dataset\.aff, g: a\.dataset\.affPage/);
  assert.match(read('public/admin.js'), /\$\('#seoAff'\)\.replaceChildren/); assert.match(read('lib/seo-report.js'), /affiliates, /);
  for (const [l, re, date, hist] of [
    ['pl', /przechodzisz przez serwis webePartners \(webep1\.com\), który może zapisać plik cookie[\s\S]*Nie przekazujemy webePartners ani organizatorowi kursu Twoich danych osobowych/, /Polityka obowiązuje od 27 października 2026 r\./, /<li>27 października 2026 r\. – linki partnerskie do polecanych kursów \(pkt 8\)\.<\/li>/],
    ['en', /you pass through the webePartners service \(webep1\.com\), which may store a cookie/, /effective from 27 October 2026/, /<li>27 October 2026 – affiliate links/],
    ['de', /über den Dienst webePartners \(webep1\.com\) weitergeleitet, der ein Cookie speichern kann/, /gilt ab dem 27\. Oktober 2026/, /<li>27\. Oktober 2026 – Partnerlinks/],
    ['uk', /через сервіс webePartners \(webep1\.com\), який може зберегти файл cookie/, /діє з 27 жовтня 2026/, /<li>27 жовтня 2026 р\. – партнерські посилання/]]) {
    const b = legalBody('prywatnosc', l); assert.match(b, re, l); assert.match(b, date, l); assert.match(b, hist, l);
  }
});
