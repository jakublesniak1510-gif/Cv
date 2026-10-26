import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Blok A (26.10, „zero CV za darmo”): podgląd jako obrazek bez tekstu, dokumenty tylko po „done”, bezpiecznik trybu demo,
// limit sprawdzania kodów, znak wodny na przykładzie.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const { previewSvg, previewPng } = await import('../lib/preview-img.js');
const start = (env) => {
  const port = 5600 + Math.floor(Math.random() * 300), dir = env.DATA_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-a-'));
  const p = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = ''; p.stderr.on('data', (d) => (err += d));
  return { p, U: `http://localhost:${port}`, err: () => err };
};
const up = async (U) => { for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); return; } catch { await wait(150); } } };

test('A1: obrazek podglądu – 2 pierwsze zdania, reszta rozmyta, słowa kluczowe, znak wodny; PNG 1000 px; klient bez tekstu w DOM', () => {
  const d = { name: 'Anna Test', headline: 'Kasjerka', summary: 'Pierwsze zdanie o kasie. Drugie zdanie o terminalu. Trzecie zdanie TAJNE.', keywords: ['obsługa kasy', 'terminal', 'praca zmianowa', 'komunikatywność', 'dokładność'] };
  const svg = previewSvg(d);
  assert.match(svg, /Pierwsze zdanie o kasie\. Drugie zdanie o terminalu\./); assert.doesNotMatch(svg, /TAJNE/, 'trzecie zdanie nie trafia na obrazek');
  assert.match(svg, /PODGLĄD · cvpodogloszenie\.pl/); assert.match(svg, /fill-opacity="0\.13" transform="rotate\(-24/); assert.match(svg, /Pełne CV po płatności/);
  for (const k of d.keywords) assert.ok(svg.includes(k), k);
  assert.match(previewSvg(d, 'de'), /VORSCHAU · cvpodogloszenie\.pl/);
  const png = Buffer.from(previewPng(d));
  assert.equal(png.subarray(1, 4).toString(), 'PNG'); assert.equal(png.readUInt32BE(16), 1000);
  const app = read('public/app.js'), css = read('public/style.css');
  assert.doesNotMatch(app, /r\.summary/, 'klient nie używa tekstu podsumowania');
  assert.match(app, /el\('img', \{ className: 'pv-img', src: r\.image, alt: tr\('Podgląd początku CV ze znakiem wodnym'\), draggable: false \}\)/);
  assert.match(app, /\['copy', 'cut', 'contextmenu', 'dragstart'\]\.forEach\(\(ev\) => \$\('#pvOut'\)\.addEventListener\(ev, \(e\) => e\.preventDefault\(\)\)\);/);
  assert.match(css, /#pvOut\{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none\}/);
  assert.match(read('lib/preview.js'), /const out = \(r\) => \(\{ key, headline: r\.headline, keywords: r\.keywords, image: previewDataUrl/);
});

test('A2 + A4: zamówienie przed „done” bez dokumentów w /api/orders/:id; 11. sprawdzenie kodu w 10 min → 429', { timeout: 60_000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-a2-'));
  process.env.DATA_DIR = dir;
  const { saveOrder } = await import('../lib/store.js');
  const res = [{ position: 'Kasjer', cv: { name: 'Anna', summary: 'TAJNE CV' }, letter: 'TAJNY LIST' }];
  await saveOrder({ id: 'gen-1', status: 'generating', pkg: 'cv', total: 3900, created: Date.now(), profile: { email: 'a@x.pl' }, ads: [], results: res });
  await saveOrder({ id: 'done-1', status: 'done', pkg: 'cv', total: 3900, created: Date.now(), profile: { email: 'a@x.pl' }, ads: [], results: res });
  const s = start({ DATA_DIR: dir });
  try {
    await up(s.U);
    const g = await (await fetch(s.U + '/api/orders/gen-1')).json();
    assert.deepEqual(g.results, []); assert.doesNotMatch(JSON.stringify(g), /TAJN/);
    assert.equal((await (await fetch(s.U + '/api/orders/done-1')).json()).results[0].cv.summary, 'TAJNE CV');
    const codes = [];
    for (let i = 0; i < 11; i++) codes.push((await fetch(s.U + `/api/code/NIEMA${i}`)).status);
    assert.deepEqual(codes.slice(0, 10), Array(10).fill(404)); assert.equal(codes[10], 429);
  } finally { s.p.kill(); }
});

test('A3: PAY_PROVIDER=demo przy BASE_URL produkcji → serwer nie startuje (kod 1, czytelny log)', { timeout: 30_000 }, async () => {
  const s = start({ PAY_PROVIDER: 'demo', BASE_URL: 'https://cvpodogloszenie.pl' });
  const code = await new Promise((r) => s.p.on('exit', r));
  assert.equal(code, 1); assert.match(s.err(), /PAY_PROVIDER=demo przy BASE_URL produkcji/);
});

test('A5: znak wodny „PRZYKŁAD” na przykładzie w modalu (4 języki)', () => {
  const app = read('public/app.js'), css = read('public/style.css');
  assert.match(app, /function openEx\(i = 0, d\) \{ \$\('#exPaper'\)\.style\.setProperty\('--wm', wmUrl\(tr\('PRZYKŁAD'\)\)\);/);
  assert.match(css, /#exPaper::after\{content:"";position:absolute;inset:0;pointer-events:none;background-image:var\(--wm\)/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['PRZYKŁAD'], l);
});
