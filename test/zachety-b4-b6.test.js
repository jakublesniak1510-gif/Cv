import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// B4–B6 (26.10): liczby tylko z prawdziwych zamówień i ukryte poniżej progów; odznaka z danych; cena za CV w Pakiecie 3.
const { liveStats, LIVE_MIN_CVS, LIVE_MAX_MEDIAN, POPULAR_MIN } = await import('../lib/live-stats.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-10-26T12:00:00Z'), MIN = 60000, DAY = 864e5;
const order = (i, o = {}) => ({ id: `o${i}`, status: 'done', pkg: 'cv_letter', total: 4900, paidAt: NOW - DAY - 10 * MIN, doneAt: NOW - DAY, results: [{}], ...o });

test('B4: N ≥ 20 CV z 7 dni i mediana ≤ 15 min; poniżej progów null; stare zamówienia bez doneAt nie liczą się', () => {
  assert.deepEqual([LIVE_MIN_CVS, LIVE_MAX_MEDIAN, POPULAR_MIN], [20, 15, 10]);
  const ok = Array.from({ length: 20 }, (_, i) => order(i));
  assert.deepEqual(liveStats(ok, NOW).week, { cvs: 20, minutes: 10 });
  assert.equal(liveStats(ok.slice(0, 19), NOW).week, null, '19 CV – za mało');
  assert.equal(liveStats(ok.map((o) => ({ ...o, paidAt: o.doneAt - 20 * MIN })), NOW).week, null, 'mediana 20 min – za długo');
  assert.equal(liveStats(ok.map((o) => ({ ...o, doneAt: NOW - 8 * DAY, paidAt: NOW - 8 * DAY - MIN })), NOW).week, null, 'starsze niż 7 dni');
  assert.equal(liveStats(ok.map(({ doneAt, ...o }) => o), NOW).week, null, 'bez doneAt');
  assert.equal(liveStats([...ok.slice(0, 10), ...ok.slice(10).map((o) => ({ ...o, upsellOf: 'x' }))], NOW).week, null, 'dodatki dokupione później się nie liczą');
  const pack = Array.from({ length: 7 }, (_, i) => order(i, { pkg: 'pack3', results: [{}, {}, {}] }));
  assert.equal(liveStats(pack, NOW).week.cvs, 21, 'CV, nie zamówienia');
  assert.equal(liveStats([...ok, order(99, { status: 'generating', doneAt: undefined })], NOW).week.cvs, 20);
});

test('B5: najczęściej wybierany pakiet z ≥ 10 opłaconych zamówień z 30 dni; remis albo za mało → brak odznaki', () => {
  const mk = (n, pkg, o = {}) => Array.from({ length: n }, (_, i) => order(`${pkg}${i}`, { pkg, ...o }));
  assert.equal(liveStats([...mk(6, 'cv_letter'), ...mk(4, 'cv')], NOW).popular, 'cv_letter');
  assert.equal(liveStats([...mk(5, 'cv_letter'), ...mk(4, 'cv')], NOW).popular, null, '9 zamówień');
  assert.equal(liveStats([...mk(5, 'cv_letter'), ...mk(5, 'pack3')], NOW).popular, null, 'remis');
  assert.equal(liveStats([...mk(6, 'cv_letter', { paidAt: NOW - 40 * DAY }), ...mk(4, 'cv')], NOW).popular, null, 'starsze niż 30 dni');
  assert.equal(liveStats([...mk(6, 'cv_letter', { total: 0 }), ...mk(10, 'cv')], NOW).popular, 'cv', 'zamówienia za 0 zł (kody instytucji) nie są wyborem klienta');
  const app = read('public/app.js'), html = read('public/index.html');
  assert.doesNotMatch(html, /badge-rec|Najczęściej wybierany/);
  assert.match(app, /lab\.classList\.add\('rec'\); \$\('\.o-t', lab\)\.after\(el\('span', \{ className: 'badge-rec', textContent: tr\('Najczęściej wybierany'\) \}\)\);/);
});

test('B4 w HTML i B6: miejsca na liczby (hero, krok 6), cena za CV w Pakiecie 3 z cennika; tłumaczenia', () => {
  const app = read('public/app.js'), html = read('public/index.html');
  assert.match(html, /<p class="counter" id="cvCounter" hidden><\/p>\n\s*<p class="live-stats" id="liveStats" hidden><\/p>/);
  assert.match(html, /<p class="live-stats" id="liveStats6" hidden><\/p>/);
  assert.equal((html.match(/<span class="pack3Unit">79 zł = 26,33 zł<\/span> <span>za CV<\/span>/g) || []).length, 2, 'kreator i cennik');
  assert.match(app, /x\.textContent = `\$\{PRICE\.pack3\} zł = \$\{\(PRICE\.pack3 \/ 3\)\.toFixed\(2\)\.replace\('\.', ','\)\} zł`/);
  assert.equal((79 / 3).toFixed(2).replace('.', ','), '26,33');
  assert.doesNotMatch(html, /<s>|<del>|line-through/);
  assert.match(read('public/style.css'), /\.opt \.o-d\.unit\{grid-column:2;font-size:13px\}[\s\S]*|\.live-stats\{/, 'style dla liczb i ceny za CV');
  assert.ok(read('public/style.css').includes('.opt .o-d.unit{grid-column:2;font-size:13px}') && read('public/style.css').includes('.live-stats{'));
  for (const l of ['en', 'de', 'uk']) for (const k of ['CV przygotowanych w ostatnich 7 dniach:', 'Typowy czas dostarczenia:', 'Najczęściej wybierany', 'za CV']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))[k], `${l}: ${k}`);
});

test('/api/public-stats: week i popular z zamówień w magazynie (serwer)', { timeout: 60_000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-b46-'));
  process.env.DATA_DIR = dir;
  const { saveOrder } = await import('../lib/store.js');
  const now = Date.now();
  for (let i = 0; i < 20; i++) await saveOrder({ id: `w${i}`, status: 'done', pkg: i < 12 ? 'cv_letter' : 'cv', total: 4900, created: now - 3600e3, paidAt: now - 3600e3, doneAt: now - 3600e3 + 4 * 60000, profile: { email: 'a@b.pl' }, ads: [], results: [{}] });
  const port = 5950 + Math.floor(Math.random() * 40);
  const p = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '' }, stdio: 'ignore' });
  try {
    let j; for (let i = 0; i < 60; i++) { try { j = await (await fetch(`http://localhost:${port}/api/public-stats`)).json(); break; } catch { await new Promise((r) => setTimeout(r, 150)); } }
    assert.deepEqual(j.week, { cvs: 20, minutes: 4 }); assert.equal(j.popular, 'cv_letter'); assert.equal(j.cvs, null, 'licznik całkowity nadal od 1000');
  } finally { p.kill(); }
});
