import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { HEARD, heardInput, heardSummary } from '../lib/heard.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// PR O: „Skąd nas znasz?” po płatności – opcjonalne, raz na zamówienie, licznik w statystykach, zestawienie w panelu → SEO.
test('Odpowiedzi: 6 opcji, walidacja, dopisek skrócony; zestawienie z udziałami i dopiskami bez danych osobowych', () => {
  assert.deepEqual(Object.keys(HEARD), ['google', 'reklama', 'tiktok_youtube', 'znajomy', 'pinterest', 'inne']);
  assert.throws(() => heardInput({ src: 'x' }), /Wybierz/);
  assert.equal(heardInput({ src: 'inne', text: ` ${'a'.repeat(200)} ` }).text.length, 80);
  const s = heardSummary({ 'heard:google': 3, 'heard:znajomy': 1 }, [{ heard: { src: 'inne', text: 'grupa na FB', at: 2 }, profile: { email: 'x@y.pl' } }, { heard: { src: 'google', text: '', at: 1 } }]);
  assert.equal(s.total, 4); assert.equal(s.counts.find((x) => x.k === 'google').pct, 75);
  assert.deepEqual(s.texts, [{ at: 2, label: 'Inne', text: 'grupa na FB' }]); assert.ok(!JSON.stringify(s).includes('x@y.pl'));
});

test('API: tylko opłacone zamówienie, raz, licznik w statystykach; widok zamówienia z heard; UI i panel', async () => {
  const port = 4700 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-heard-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const post = async (p, b) => { const r = await fetch(U + p, { method: 'POST', headers: H, body: JSON.stringify(b || {}) }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const r = await post('/api/orders', { pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal((await post(`/api/orders/${r.j.id}/heard`, { src: 'google' })).status, 404, 'przed płatnością nie');
    await post(`/api/orders/${r.j.id}/demo-pay`);
    assert.equal((await post(`/api/orders/${r.j.id}/heard`, { src: 'zly' })).status, 400);
    assert.equal((await (await fetch(`${U}/api/orders/${r.j.id}`)).json()).heard, false);
    assert.equal((await post(`/api/orders/${r.j.id}/heard`, { src: 'znajomy', text: 'kolega z pracy' })).status, 200);
    assert.equal((await post(`/api/orders/${r.j.id}/heard`, { src: 'google' })).status, 200, 'drugi raz bez zmian');
    assert.equal((await (await fetch(`${U}/api/orders/${r.j.id}`)).json()).heard, true);
    await wait(300);
    const o = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))[r.j.id];
    assert.equal(o.heard.src, 'znajomy'); assert.equal(o.heard.text, 'kolega z pracy');
    const days = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'analytics.json'), 'utf8')));
    assert.equal(days.reduce((s, d) => s + (d.events?.['heard:znajomy'] || 0), 0), 1); assert.ok(!days.some((d) => d.events?.['heard:google']));
  } finally { srv.kill(); }
  const app = read('public/app.js'), adm = read('public/admin.js'), html = read('public/index.html');
  assert.match(html, /<div id="heardGen" class="heard" hidden><\/div>/); assert.match(html, /id="heardRes"/);
  assert.match(app, /drawHeard\(\$\('#heardGen'\)\)/); assert.match(app, /Date\.now\(\) - data\.paidAt < 864e5\) drawHeard\(\$\('#heardRes'\)\)/);
  assert.match(adm, /\$\('#seoHeard'\)/); assert.match(read('public/admin.html'), /Skąd nas znasz\? \(odpowiedzi po płatności\)/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['Skąd nas znasz?', 'Od znajomego', 'Dziękujemy za odpowiedź!']) assert.ok(d[k], `${l}: ${k}`); }
});
