import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { scanForVariant, abHome, abReport, abText, activeExperiments } from '../lib/ab.js';

// Test A/B „scanner”: w B serwer obcina wynik skanera (3 braki + missingMore, bez wskazówek) w odpowiedzi /api/scan;
// A = dzisiejszy wynik. Lejek per wariant: skan → klik „Zrób CV” → zamówienie → opłacone.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Test', 'Content-Type': 'application/json' }, BEACON = { ...UA, 'Content-Type': 'text/plain;charset=UTF-8' }; // sendBeacon wysyła tekst
const CV = 'Jan Test\njan@test.pl\nMagazynier w Hurtowni ABC 2019-2024: obsługa wózka widłowego, kompletacja zamówień ze skanerem, inwentaryzacja, praca w zespole.';
const AD = 'Magazynier. Wymagania: obsługa wózka widłowego, uprawnienia UDT, znajomość SAP, prawo jazdy kat. B, doświadczenie w logistyce, obsługa systemu WMS, gotowość do pracy zmianowej, język angielski, Excel, certyfikat BHP.';

async function server(EXPERIMENTS, fn) {
  const port = 5700 + Math.floor(Math.random() * 250), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-abs-'));
  const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SALES_OPEN: '1', EXPERIMENTS, STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '' }, stdio: 'ignore' });
  const U = `http://localhost:${port}`;
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const scan = async () => { const r = await fetch(U + '/api/scan', { method: 'POST', headers: UA, body: JSON.stringify({ cvText: CV, adText: AD }) }); const t = await r.text(); return { status: r.status, t, j: JSON.parse(t) }; };
    await fn({ U, scan, ab: () => { try { return Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'analytics.json'), 'utf8')))[0]?.ab || {}; } catch { return {}; } } });
  } finally { srv.kill(); }
}

test('scanForVariant: A bez zmian, B – 3 braki, missingMore, bez wskazówek; strona główna nie przypisuje „scanner”', () => {
  const r = { score: 40, found: ['a'], missing: [1, 2, 3, 4, 5].map((n) => ({ keyword: `k${n}`, hint: 'h' })), tips: ['t1', 't2'] };
  assert.equal(scanForVariant(r, 'A'), r); assert.equal(scanForVariant(r, null), r);
  const b = scanForVariant(r, 'B');
  assert.deepEqual(b.missing.map((m) => m.keyword), ['k1', 'k2', 'k3']); assert.equal(b.missingMore, 2); assert.deepEqual(b.tips, []);
  assert.equal(scanForVariant({ ...r, missing: r.missing.slice(0, 2) }, 'B').missingMore, 0);
  assert.deepEqual(activeExperiments('{"checkout":50,"scanner":50}'), { checkout: 50, scanner: 50 });
  assert.equal(abHome({ ip: '1.1.1.1', get: () => 'Mozilla' }, '<h1>x</h1>', '{"scanner":50}').assign, null, 'strona główna nie liczy „scanner”');
});

test('/api/scan: bez testu i w A pełny wynik; w B serwer obcina (JSON bez 4. braku i wskazówek); lejek per wariant', { timeout: 90_000 }, async () => {
  let full;
  await server('', async ({ scan }) => { const s = await scan(); assert.equal(s.status, 200); full = s.j; assert.equal(full.variant, undefined); });
  assert.ok(full.missing.length > 3, `pełny wynik ma ${full.missing.length} braków`);
  await server('{"scanner":0.0001}', async ({ scan, ab }) => {
    const s = await scan(); assert.equal(s.j.variant, 'A');
    assert.deepEqual(s.j.missing, full.missing); assert.deepEqual(s.j.tips, full.tips); assert.equal(s.j.missingMore, undefined);
    await wait(200); assert.equal(ab()['scanner:A'].scan_done, 1);
  });
  await server('{"scanner":99.9999}', async ({ U, scan, ab }) => {
    const s = await scan(); assert.equal(s.j.variant, 'B');
    assert.equal(s.j.missing.length, 3); assert.equal(s.j.missingMore, full.missing.length - 3); assert.deepEqual(s.j.tips, []);
    for (const m of full.missing.slice(3)) assert.ok(!s.t.includes(JSON.stringify(m.keyword)), `brak „${m.keyword}” w JSON`);
    for (const t of full.tips) assert.ok(!s.t.includes(t), 'bez wskazówek w JSON');
    await scan(); // drugi skan tego samego dnia: skan liczony raz na odwiedzającego
    await fetch(U + '/api/t', { method: 'POST', headers: BEACON, body: JSON.stringify({ e: 'pv', p: '/narzedzia/skaner-cv' }) });
    await fetch(U + '/api/t', { method: 'POST', headers: BEACON, body: JSON.stringify({ e: 'scancta' }) });
    await fetch(U + '/api/t', { method: 'POST', headers: BEACON, body: JSON.stringify({ e: 'scancta' }) });
    const o = await fetch(U + '/api/orders', { method: 'POST', headers: UA, body: JSON.stringify({ consent: true, waiver: true, pkg: 'cv', profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: AD }] }) });
    assert.equal(o.status, 200, await o.clone().text());
    await wait(400);
    const x = ab()['scanner:B'];
    assert.equal(x.scan_done, 1); assert.equal(x.cta_click, 1); assert.equal(x.order_created, 1);
    assert.equal(ab()['scanner:A'], undefined);
  });
});

test('Raport A/B „scanner”: etapy i konwersje od skanu, tekst do raportu, panel z kolumnami testu', () => {
  const rows = abReport({ 'scanner:A': { scan_done: 200, cta_click: 20, order_created: 10, paid: 6 }, 'scanner:B': { scan_done: 200, cta_click: 40, order_created: 18, paid: 12 } }, { scanner: 50 });
  const e = rows.find((r) => r.id === 'scanner');
  assert.deepEqual(e.stages, ['scan_done', 'cta_click', 'order_created', 'paid']);
  assert.deepEqual(e.variants.map((r) => [r.ctaRate, r.orderRate, r.paidRate]), [[10, 5, 3], [20, 9, 6]]);
  assert.ok(e.cta.p < 0.05); assert.equal(e.splitB, 50);
  assert.match(abText(rows), /Test A\/B „Wynik skanera”: A 200 skanów, klik „Zrób CV” 20 \(10%\), zamówienia 10 \(5%\), opłacone 6 \(3%\); B 200 skanów/);
  const adm = read('public/admin.js');
  assert.match(adm, /\['scan_done', 'Skany', 1\], \['cta_click', 'Klik „Zrób CV”', 1\]/); assert.match(adm, /scanner – wynik darmowego skanera/);
});

test('Widok wyniku: wariant B z dopiskiem o kolejnych wymaganiach i akapitem zamiast wskazówek, klik liczony; tłumaczenia', () => {
  const app = read('public/app.js');
  assert.match(app, /const scanCta = \(\) => \{ track\('scancta'\); track\('scantowiz'\); fromScan\(\); \};/, 'klik liczony (cta_click w teście scanner, scan_to_wiz od B3)');
  assert.match(app, /more \? el\('p', \{ className: 'scan-more' \}, `\+\$\{more\} `, el\('span', \{ textContent: moreReqs\(more\) \}\)\) : null/);
  assert.match(app, /'Wskazówki i gotowe sformułowania dostaniesz razem z CV pod to ogłoszenie – od' \}\), ` \$\{PRICE\.cv\} zł`/);
  assert.doesNotMatch(app, /onclick: fromScan/, 'wszystkie przyciski CTA wyniku liczą klik');
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['Wskazówki i gotowe sformułowania dostaniesz razem z CV pod to ogłoszenie – od', 'kolejne wymaganie uwzględnimy w CV pod to ogłoszenie', 'kolejne wymagania uwzględnimy w CV pod to ogłoszenie', 'kolejnych wymagań uwzględnimy w CV pod to ogłoszenie']) assert.ok(d[k], `${l}: ${k}`); }
});
