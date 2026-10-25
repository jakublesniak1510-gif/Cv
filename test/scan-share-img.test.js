import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-shimg-')); // karta zapisuje się w share-cards.json
const express = (await import('express')).default;
const { rememberScan, peekScan } = await import('../lib/growth.js');
const { shareImgRoute, shareSvg, shareItems } = await import('../lib/share-img.js');

// Obrazek wyniku skanera do udostępnienia: PNG 1080×1080 / 1080×1920 z wyniku trzymanego godzinę w pamięci,
// procent i po 3 ogólne wymagania, bez danych z CV, adresów, telefonów i nazwy pracodawcy.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const dims = (b) => ({ sig: b.subarray(1, 4).toString(), w: b.readUInt32BE(16), h: b.readUInt32BE(20) });
const result = { score: 72, position: 'Magazynier – Jan Kowalski', found: ['obsługa wózka widłowego', 'jan.kowalski@poczta.pl', 'doświadczenie w magazynie', 'tel. 600 123 456', 'praca w Logistyka Nowak'],
  missing: [{ keyword: 'uprawnienia UDT', hint: 'Jan Kowalski, ul. Polna 1' }, { keyword: 'www.jan-kowalski.pl' }, { keyword: 'SAP' }, { keyword: 'praca zmianowa' }, { keyword: 'prawo jazdy kat. B' }], company: 'Logistyka Nowak Sp. z o.o.' };
let limitOn = true;
const app = express(); shareImgRoute(app, () => limitOn);
const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
test.after(() => srv.close());

test('Pozycje na obrazek: po 3, bez e-maila, telefonu, adresu WWW, nazwy firmy i wskazówek z treścią CV', () => {
  const it = shareItems(result, result.company);
  assert.deepEqual(it, { found: ['obsługa wózka widłowego', 'doświadczenie w magazynie'], missing: ['uprawnienia UDT', 'SAP', 'praca zmianowa'] });
  for (const l of ['pl', 'en', 'de', 'uk']) for (const f of ['square', 'story']) {
    const svg = shareSvg(result, l, f, result.company);
    for (const bad of ['@', 'Kowalski', '600 123', 'jan-kowalski', 'Nowak', 'Polna', 'Magazynier']) assert.ok(!svg.includes(bad), `${l}/${f}: ${bad}`);
    assert.match(svg, /72(&nbsp;| )?%/); assert.match(svg, /cvpodogloszenie\.pl/);
  }
  assert.match(shareSvg(result, 'pl'), /Moje CV pasuje do/); assert.match(shareSvg(result, 'de'), /WAS NOCH FEHLT/);
});

test('GET /api/scan/:id/share.png: PNG 1080×1080 i 1080×1920, no-store; 404 po wygaśnięciu; limit 429', async () => {
  const id = rememberScan(result);
  assert.equal(peekScan(id).company, 'Logistyka Nowak Sp. z o.o.'); assert.equal(peekScan(id).result.company, undefined, 'firma poza wynikiem');
  for (const [q, w, h] of [['', 1080, 1080], ['?f=story&lang=uk', 1080, 1920], ['?f=square&lang=de', 1080, 1080]]) {
    const r = await fetch(`${U}/api/scan/${id}/share.png${q}`), b = Buffer.from(await r.arrayBuffer());
    assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/png'); assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.deepEqual(dims(b), { sig: 'PNG', w, h }, q);
  }
  const old = rememberScan(result, Date.now() - 3601e3);
  const g = await fetch(`${U}/api/scan/${old}/share.png`); assert.equal(g.status, 404); assert.equal(g.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(`${U}/api/scan/nieistnieje/share.png`)).status, 404);
  limitOn = false; assert.equal((await fetch(`${U}/api/scan/${id}/share.png`)).status, 429); limitOn = true;
});

test('Kreator wyniku: przyciski obrazka (Web Share z plikiem, inaczej pobranie), serwer z limitem, tłumaczenia', () => {
  const app = read('public/app.js'), srvJs = read('server.js');
  assert.match(app, /navigator\.canShare\?\.\(\{ files: \[file\] \}\)/); assert.match(app, /download: file\.name/);
  assert.match(app, /\/api\/scan\/\$\{encodeURIComponent\(scanId\)\}\/share\.png\?f=\$\{f\}/);
  assert.match(srvJs, /shareImgLimit = limiter\(12, 3600_000\)/); assert.match(srvJs, /shareImgRoute\(app, shareImgLimit\)/);
  assert.match(srvJs, /rememberScan\(\{ \.\.\.result, company \}\)/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['Pobierz obrazek (post)', 'Udostępnij obrazek (relacja)', 'Obrazek z wynikiem: procent i po 3 wymagania z ogłoszenia, bez danych z Twojego CV.']) assert.ok(d[k], `${l}: ${k}`); }
});

test('Karta /wynik/<id> (30 dni): zapisuje po 3 ogólne wymagania, obrazki 1080×1080 i 1080×1920, OG 1200×630 bez zmian; polityka prywatności (4 języki)', async () => {
  const { shareRoutes, cards } = await import('../lib/share.js');
  let on = true; const a = express(); shareRoutes(a, { BASE_URL: 'https://example.test', imgLimit: () => on });
  const s2 = a.listen(0), V = `http://127.0.0.1:${s2.address().port}`;
  try {
    const id = rememberScan(result);
    const j = await (await fetch(`${V}/api/scan/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scanId: id, title: 'Magazynier', lang: 'pl' }) })).json();
    const c = await cards.get(j.id);
    assert.deepEqual(c.items, { found: ['obsługa wózka widłowego', 'doświadczenie w magazynie'], missing: ['uprawnienia UDT', 'SAP', 'praca zmianowa'] });
    assert.doesNotMatch(JSON.stringify(c), /Kowalski|@|Nowak|600 123|Polna/);
    const page = await (await fetch(`${V}/wynik/${j.id}`)).text();
    assert.match(page, new RegExp(`data-img="/wynik/${j.id}/1080x1080\\.png"`)); assert.match(page, new RegExp(`data-img="/wynik/${j.id}/1080x1920\\.png"`));
    for (const [f, w, h] of [['1080x1080', 1080, 1080], ['1080x1920', 1080, 1920], ['og', 1200, 630]]) {
      const r = await fetch(`${V}/wynik/${j.id}/${f}.png`); assert.equal(r.status, 200, f); assert.deepEqual(dims(Buffer.from(await r.arrayBuffer())), { sig: 'PNG', w, h }, f);
    }
    on = false; assert.equal((await fetch(`${V}/wynik/${j.id}/1080x1920.png`)).status, 429); on = true;
    await cards.save({ ...c, created: Date.now() - 31 * 864e5 }); assert.equal((await fetch(`${V}/wynik/${j.id}/1080x1080.png`)).status, 404, 'po 30 dniach');
  } finally { s2.close(); }
  const pol = read('public/legal/prywatnosc.html');
  for (const re of [/najwyżej po 3 ogólne nazwy wymagań z ogłoszenia/, /höchstens je 3 allgemeine Anforderungen/, /up to 3 general requirements from the job ad each/, /щонайбільше по 3 загальні вимоги/, /<li>25 października 2026 r\. – karta „Udostępnij wynik”/, /Polityka obowiązuje od 25 października 2026/]) assert.match(pol, re);
  assert.match(read('public/wynik.js'), /navigator\.canShare\(\{ files: \[file\] \}\)/);
});
