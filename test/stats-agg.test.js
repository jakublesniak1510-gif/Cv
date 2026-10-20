import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import express from 'express';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'stats-agg-'));
process.env.DATA_DIR = DIR;
const S = await import('../lib/stats-agg.js');
const FILE = path.join(DIR, 'stats-agg.json');
const NOW = Date.parse('2026-10-15T12:00:00Z');
const reset = () => fs.rmSync(FILE, { force: true });
const read = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));

test('Zawód z tytułu ogłoszenia: warianty „/”, odmiana, polskie znaki, nieznany → inne', () => {
  assert.equal(S.professionOf('Kasjerka'), 'kasjer');
  assert.equal(S.professionOf('KASJER – sklep, Warszawa'), 'kasjer');
  assert.equal(S.professionOf('Magazynier/operator wózka'), 'magazynier');
  assert.equal(S.professionOf('Operator wózka widłowego (UDT)'), 'operator-wozka-widlowego');
  assert.equal(S.professionOf('Kierownik magazynu'), 'kierownik-magazynu');
  assert.equal(S.professionOf('Kierowca kat. C+E – trasy krajowe'), 'kierowca');
  assert.equal(S.professionOf('Kierowca autobusu miejskiego'), 'kierowca-autobusu');
  assert.equal(S.professionOf('Pielęgniarz anestezjologiczny'), 'pielegniarka');
  assert.equal(S.professionOf('Praca na stanowisku magazyniera'), 'magazynier');
  assert.equal(S.professionOf('Astronauta orbitalny'), 'inne');
  assert.equal(S.professionOf(''), 'inne');
});

test('Filtr wymagań: bez adresów, e-maili, telefonów, samych liczb i nazwy firmy', () => {
  const comp = ['Biedronka Sp. z o.o.'].flatMap((c) => S.norm(c).split(' ').filter((w) => w.length >= 3));
  assert.equal(S.cleanKeyword('  Obsługa   Kasy Fiskalnej ', comp), 'obsługa kasy fiskalnej');
  assert.equal(S.cleanKeyword({ keyword: 'Prawo jazdy kat. B' }), 'prawo jazdy kat. b');
  for (const bad of ['https://firma.pl/praca', 'www.example.com', 'aplikuj na praca.pl', 'rekrutacja@firma.pl', 'tel. +48 600 700 800', '600-700-800', '12345', '2026', ' ', 'praca w Biedronka'])
    assert.equal(S.cleanKeyword(bad, comp), null, bad);
  assert.equal(S.cleanKeyword('doświadczenie 2019-2023'), 'doświadczenie 2019-2023');
  assert.equal(S.cleanKeyword('x'.repeat(200)).length, 60);
});

test('Agregacja: n, seen, inCv, miesiąc; bez danych osobowych w pliku', async () => {
  reset();
  const secret = { title: 'Kasjer / Kasjerka – Jan Kowalski', company: 'Żabka Polska', found: ['Obsługa kasy fiskalnej', 'Komunikatywność', 'jan.kowalski@gmail.com'], missing: [{ keyword: 'Prawo jazdy kat. B', hint: 'Dopisz, jeśli masz – SEKRETNA PODPOWIEDŹ' }, 'Zadzwoń: 600 700 800', 'Praca w Żabka', 'https://zabka.pl'], now: NOW };
  await S.recordStats(secret);
  await S.recordStats({ title: 'Kasjerka', found: ['komunikatywność'], missing: ['obsługa kasy fiskalnej', 'Komunikatywność'], now: NOW });
  await S.recordStats({ title: 'Astronauta', found: ['nieważkość'], now: NOW });
  const raw = fs.readFileSync(FILE, 'utf8'), j = JSON.parse(raw);
  assert.deepEqual(Object.keys(j['2026-10']).filter((k) => k !== 'id').sort(), ['inne', 'kasjer']);
  const k = j['2026-10'].kasjer;
  assert.equal(k.n, 2);
  assert.deepEqual(k.keywords['obsługa kasy fiskalnej'], { seen: 2, inCv: 1 });
  assert.deepEqual(k.keywords['komunikatywność'], { seen: 2, inCv: 2 }); // duplikat w jednym ogłoszeniu liczony raz
  assert.deepEqual(k.keywords['prawo jazdy kat. b'], { seen: 1, inCv: 0 });
  assert.deepEqual(Object.keys(k.keywords).sort(), ['komunikatywność', 'obsługa kasy fiskalnej', 'prawo jazdy kat. b']);
  for (const s of ['Kowalski', 'kowalski', 'gmail', '600', 'Żabka', 'żabka', 'zabka', 'SEKRETNA', 'podpowied', 'Kasjerka', 'http']) assert.ok(!raw.includes(s), `w pliku jest „${s}”`);
});

test('Przycinanie do 200 najczęstszych wymagań na zawód i miesiąc', async () => {
  reset();
  const kws = Array.from({ length: 250 }, (_, i) => `umiejętność ${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`);
  await S.recordStats({ title: 'Magazynier', found: kws.slice(0, 20), now: NOW }); // te będą miały seen = 2
  await S.recordStats({ title: 'Magazynier', found: kws, now: NOW });
  const k = read()['2026-10'].magazynier.keywords;
  assert.equal(Object.keys(k).length, 200);
  for (const w of kws.slice(0, 20)) assert.equal(k[w].seen, 2);
  await S.recordStats({ title: 'Magazynier', missing: ['nowe wymaganie'], now: NOW });
  assert.equal(Object.keys(read()['2026-10'].magazynier.keywords).length, 200);
});

const listen = (app) => new Promise((r) => { const s = app.listen(0, () => r(s)); });
test('Panel → Dane: API, okresy, CSV tylko n ≥ 30, BOM i escapowanie', async () => {
  reset();
  for (let i = 0; i < 30; i++) await S.recordStats({ title: 'Kasjer', found: i < 15 ? ['obsługa kasy'] : [], missing: [...(i >= 15 ? ['obsługa kasy'] : []), 'język "angielski"; B2', '=SUMA(A1)'], now: NOW });
  await S.recordStats({ title: 'Kasjer', found: ['obsługa kasy'], now: Date.parse('2026-09-10T12:00:00Z') });
  await S.recordStats({ title: 'Spawacz', found: ['spawanie MIG'], now: NOW });
  const api = express.Router(); S.statsAdmin(api);
  const app = express(); app.use('/api/admin', api);
  const s = await listen(app), base = `http://127.0.0.1:${s.address().port}/api/admin`;
  try {
    const d = await (await fetch(`${base}/stats-agg?month=2026-10`)).json();
    assert.deepEqual(d.months, ['2026-10', '2026-09']);
    const kas = d.professions.find((p) => p.slug === 'kasjer'), sp = d.professions.find((p) => p.slug === 'spawacz');
    assert.equal(kas.n, 30); assert.equal(kas.ok, true); assert.equal(kas.name, 'Kasjer / Kasjerka');
    assert.deepEqual(kas.keywords.find((k) => k.kw === 'obsługa kasy'), { kw: 'obsługa kasy', seen: 30, inCv: 15, pct: 50 });
    assert.equal(sp.ok, false);
    const d3 = await (await fetch(`${base}/stats-agg?month=last3`)).json();
    assert.equal(d3.month, 'last3');
    // okres „ostatnie 3 miesiące” liczony od dziś: dane z 2026-09/10 mieszczą się, gdy test działa w tych miesiącach
    const r = await fetch(`${base}/stats-agg.csv?month=2026-10`), buf = Buffer.from(await r.arrayBuffer()), csv = buf.toString('utf8');
    assert.match(r.headers.get('content-type'), /text\/csv/);
    assert.match(r.headers.get('content-disposition'), /wymagania-2026-10\.csv/);
    assert.deepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    const lines = csv.slice(1).trim().split('\r\n');
    assert.equal(lines[0], 'miesiąc;zawód;n;wymaganie;wystąpienia;odsetek_w_cv');
    assert.ok(lines.includes('2026-10;Kasjer / Kasjerka;30;obsługa kasy;30;50'));
    assert.ok(lines.includes('2026-10;Kasjer / Kasjerka;30;"język ""angielski""; b2";30;0'), csv);
    assert.ok(lines.includes("2026-10;Kasjer / Kasjerka;30;'=suma(a1);30;0"), csv);
    assert.ok(!csv.includes('Spawacz'), 'zawód z n < 30 poza CSV');
    const sep = await (await fetch(`${base}/stats-agg.csv?month=2026-09`)).text();
    assert.equal(sep.trim().split('\r\n').length, 1, 'wrzesień: n < 30, tylko nagłówek');
  } finally { s.close(); }
});

test('Błąd zapisu statystyk nie psuje skanera (/api/scan)', { timeout: 30000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stats-scan-'));
  fs.mkdirSync(path.join(dir, 'stats-agg.json')); fs.writeFileSync(path.join(dir, 'stats-agg.json', 'x'), '1'); // katalog zamiast pliku: zapis zawsze się nie uda
  const port = await new Promise((r) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
  const env = { ...process.env, DATA_DIR: dir, PORT: String(port), ANTHROPIC_API_KEY: '', ADMIN_PASSWORD: '' };
  const child = spawn(process.execPath, ['server.js'], { cwd: new URL('..', import.meta.url), env, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('serwer nie wstał')), 20000); child.stdout.on('data', (b) => { if (String(b).includes('localhost')) { clearTimeout(t); res(); } }); child.on('exit', () => rej(new Error('serwer padł'))); });
    const body = { cvText: 'Kasjer w sklepie spożywczym, obsługa kasy fiskalnej, komunikatywność, praca w zespole, 3 lata doświadczenia.', adText: 'Kasjer / Kasjerka\nZatrudnimy kasjera. Wymagania: obsługa kasy fiskalnej, komunikatywność, dyspozycyjność, prawo jazdy kat. B, znajomość Excela.' };
    for (let i = 0; i < 2; i++) {
      const r = await fetch(`http://127.0.0.1:${port}/api/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal(r.status, 200);
      const j = await r.json();
      assert.ok(Array.isArray(j.found) && typeof j.score === 'number' && j.scanId);
      assert.ok(!('company' in j));
    }
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(fs.statSync(path.join(dir, 'stats-agg.json')).isDirectory());
    assert.match(fs.readFileSync(path.join(dir, 'events.json'), 'utf8'), /"type": "statystyki"/, 'błąd zapisu trafił do dziennika problemów');
  } finally { child.kill(); }
});

test('Zamówienie: liczniki po wygenerowaniu dokumentów (bez numeru zamówienia)', () => {
  const srv = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(srv, /results\.forEach\(\(r, i\) => recordStatsSafe\(\{ title: .*found: r\.match\?\.found, missing: r\.match\?\.missing \}\)\)/);
  assert.ok(!/recordStatsSafe\([^)]*\bid\b/.test(srv));
});

test('Polityka prywatności: statystyki zbiorcze w 4 językach z podstawą prawną', () => {
  const h = fs.readFileSync(new URL('../public/legal/prywatnosc.html', import.meta.url), 'utf8');
  for (const s of ['Anonimowe, zbiorcze statystyki wymagań z ogłoszeń o pracę', 'Anonyme, aggregierte Statistiken über Anforderungen aus Stellenanzeigen', 'Anonymous, aggregated statistics on requirements from job ads', 'Анонімна зведена статистика вимог з оголошень про роботу'])
    assert.ok(h.includes(s), s);
  assert.equal((h.match(/statystyki wymagań[^<]*art\. 6 ust\. 1 lit\. f RODO|Statistiken[^<]*Art\. 6 Abs\. 1 lit\. f DSGVO|statistics on requirements[^<]*Article 6\(1\)\(f\) GDPR|статистика вимог[^<]*ст\. 6 ч\. 1 п\. f/g) || []).length, 4);
});
