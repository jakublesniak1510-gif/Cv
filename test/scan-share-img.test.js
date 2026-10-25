import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { rememberScan, peekScan } from '../lib/growth.js';
import { shareImgRoute, shareSvg, shareItems } from '../lib/share-img.js';

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
