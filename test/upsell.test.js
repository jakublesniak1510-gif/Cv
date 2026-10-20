import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { upsellOffers, upsellPlan, PRICES, BUNDLE_OFF } from '../lib/pricing.js';
import { invoiceLines } from '../lib/invoice.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const zl = (gr) => gr / 100;

test('Dodatki po zakupie: oferty i ceny = różnica cennika (bez zmian cen)', () => {
  const done = (pkg, addons = {}, ads = 1) => ({ status: 'done', pkg, addons, ads: Array(ads).fill({}), extraLangs: [] });
  const m = (o) => Object.fromEntries(upsellOffers(o).map((x) => [x.key, x.price]));
  assert.deepEqual(m(done('cv')), { letter: PRICES.cv_letter - PRICES.cv, interview: PRICES.interview, sim: PRICES.sim, bundle: PRICES.cv_letter - PRICES.cv + PRICES.interview + PRICES.sim - BUNDLE_OFF });
  assert.deepEqual(m(done('cv_letter')), { interview: PRICES.interview, sim: PRICES.sim, bundle: PRICES.interview + PRICES.sim - BUNDLE_OFF });
  assert.deepEqual(m(done('cv_letter', { interview: true })), { sim: PRICES.sim - BUNDLE_OFF }, 'symulator domyka „Pewną rozmowę”, więc jest taniej');
  assert.deepEqual(m(done('pack3', { interview: true, sim: true }, 3)), {}, 'nic do dokupienia');
  assert.deepEqual(m({ ...done('cv'), status: 'pending' }), {}, 'tylko gotowe zamówienia');
  assert.deepEqual(m({ ...done('cv'), upsellOf: 'x' }), {}, 'nie do dodatku');
  assert.deepEqual(upsellPlan(done('cv'), 'bundle'), { key: 'bundle', name: 'Pakiet „Pewna rozmowa”', pkg: 'cv_letter', addons: { interview: true, sim: true }, includes: ['letter', 'interview', 'sim'], price: m(done('cv')).bundle });
  assert.deepEqual(upsellPlan(done('cv_letter', { interview: true }), 'bundle').includes, ['sim'], 'opis pakietu: tylko brakujące części');
  assert.deepEqual(invoiceLines({ upsell: { name: 'List motywacyjny' }, upsellOf: 'abcdef12-3456', total: 1000 }), [{ name: 'List motywacyjny – dodatek do zamówienia abcdef12', qty: 1, price: 1000, value: 1000 }]);
});

test('Dodatki po zakupie: osobna płatność, po opłaceniu dodatek dopisany i wygenerowany w tym samym zamówieniu', async () => {
  const port = 4100 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-upsell-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const post = async (p, b) => { const r = await fetch(U + p, { method: 'POST', headers: H, body: JSON.stringify(b || {}) }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
    const get = async (id) => (await fetch(`${U}/api/orders/${id}`)).json();
    const until = async (id, ok) => { let o; for (let i = 0; i < 60; i++) { o = await get(id); if (ok(o)) return o; await wait(150); } return o; };
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const r = await post('/api/orders', { pkg: 'cv', consent: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal(r.j.demo, true);
    assert.equal((await post('/api/orders/x/upsell', { key: 'letter' })).status, 409, 'nieznane zamówienie');
    assert.equal((await post(`/api/orders/${r.j.id}/upsell`, { key: 'letter' })).status, 409, 'przed opłaceniem nic nie dokupisz');
    await post(`/api/orders/${r.j.id}/demo-pay`);
    let o = await until(r.j.id, (x) => x.status === 'done');
    assert.equal(o.status, 'done'); assert.equal(o.results[0].letter || '', '');
    assert.deepEqual(o.upsells.map((x) => [x.key, x.price]), [['letter', 10], ['interview', 50], ['sim', 29], ['bundle', 70]]);
    assert.equal((await post(`/api/orders/${r.j.id}/upsell`, { key: 'linkedin' })).status, 400);
    // Oczekujący „symulator” utworzony, gdy pakiet był jeszcze bez listu – opłacony później nie może cofnąć pakietu.
    const early = await post(`/api/orders/${r.j.id}/upsell`, { key: 'sim' });
    const u = await post(`/api/orders/${r.j.id}/upsell`, { key: 'letter' });
    assert.equal(u.j.demo, true); assert.notEqual(u.j.id, r.j.id);
    const again = await post(`/api/orders/${r.j.id}/upsell`, { key: 'letter' });
    assert.equal(again.j.id, u.j.id, 'niezapłacona próba tego samego dodatku jest używana ponownie');
    const child = await get(u.j.id); assert.equal(child.total, 1000); assert.equal(child.status, 'pending');
    await post(`/api/orders/${u.j.id}/demo-pay`);
    o = await until(r.j.id, (x) => x.pkg === 'cv_letter' && !x.upsellBusy);
    assert.equal(o.pkg, 'cv_letter'); assert.ok(o.results[0].letter.length > 100, 'list wygenerowany w tym zamówieniu');
    assert.deepEqual(o.upsells.map((x) => [x.key, x.price]), [['interview', 50], ['sim', 29], ['bundle', 60]]);
    assert.equal((await get(u.j.id)).status, 'done');
    const s = await post(`/api/orders/${r.j.id}/upsell`, { key: 'sim' });
    assert.notEqual(s.j.id, early.j.id, 'stara próba z innym pakietem nie jest używana ponownie (inna cena)');
    await post(`/api/orders/${early.j.id}/demo-pay`); // opłacona stara próba
    o = await until(r.j.id, (x) => x.addons.sim);
    assert.equal(o.addons.sim, true); assert.equal(o.pkg, 'cv_letter', 'pakiet nie jest obniżany'); assert.ok(o.results[0].letter.length > 100, 'list zostaje');
    assert.deepEqual(o.upsells.map((x) => x.key), ['interview']);
    assert.equal(o.upsells[0].price, zl(PRICES.interview - BUNDLE_OFF));
  } finally { srv.kill(); }
});
