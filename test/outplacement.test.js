import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// D7 (27.10): Outplacement dla firm (/dla-firm/outplacement). Cena za osobę od liczby osób: 1–4 → 299, 5+ → 269, 10+ → 239, 25+ → 209,
// 50+ → 179 zł. Każda osoba: własny jednorazowy kod (Pakiet 3 + przygotowanie, symulator, LinkedIn, Word), ważny 90 dni od daty przekazania.
// Firma: NIP, faktura od razu albo z terminem 14 dni, panel bez danych pracowników, PDF z instrukcją. Bez coachingu na żywo.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-out-'));
const { outQuote, OUT_TIERS, OUT_ADDONS, lineItems, calcTotal, PRICES, BUNDLE_OFF } = await import('../lib/pricing.js');
const { validateOut, NO_COACHING } = await import('../lib/outplacement.js');
const { legalBody } = await import('../lib/legal.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const day = (d = 0) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const FIRM = { org: 'Fabryka Test sp. z o.o.', nip: '123-456-32-18', address: 'ul. Fabryczna 1, 30-001 Kraków', name: 'Anna HR', email: 'hr@fabryka.pl', qty: 3, start: day(0), pay: 'invoice', terms: true };

test('Ceny za osobę od liczby osób (progi z regulaminu), limity zamówienia', () => {
  for (const [q, unit] of [[1, 29900], [4, 29900], [5, 26900], [9, 26900], [10, 23900], [24, 23900], [25, 20900], [49, 20900], [50, 17900], [500, 17900]]) assert.equal(outQuote(q).unit, unit, `${q} osób`);
  assert.equal(outQuote(12).total, 12 * 23900);
  assert.throws(() => outQuote(0), /od 1 do 500/); assert.throws(() => outQuote(501)); assert.throws(() => outQuote(2.5));
  assert.deepEqual(OUT_TIERS.map((t) => t.min), [1, 5, 10, 25, 50]);
});

test('Kod z dodatkami w cenie: Pakiet 3 i 4 dodatki za 0 zł, płatne tylko to, czego kod nie obejmuje', () => {
  const v = { voucher: true, addons: OUT_ADDONS }, all = { interview: true, sim: true, linkedin: true, docx: true };
  assert.equal(calcTotal('pack3', 3, all, false, [], v), 0);
  assert.equal(calcTotal('pack3', 3, { ...all, messages: true }, false, ['en'], v), PRICES.messages + PRICES.extraLang);
  const items = lineItems('pack3', 2, all, false, [], v);
  assert.ok(items.every((i) => i.amount === 0)); assert.match(items[1].name, /w cenie kodu/);
  assert.equal(calcTotal('cv', 1, {}, false, [], v), 0, 'tańszy pakiet też pokryty');
  assert.equal(calcTotal('pack3', 3, all, false, [], 'voucher'), calcTotal('pack3', 3, all, false, [], 0) - PRICES.pack3, 'zwykły kod instytucji bez zmian');
});

test('Zamówienie firmy: NIP obowiązkowy, data przekazania od dziś do 60 dni, regulamin', () => {
  const v = validateOut(FIRM);
  assert.equal(v.nip, '1234563218'); assert.equal(v.unit, 29900); assert.equal(v.total, 89700); assert.equal(v.pay, 'invoice');
  for (const [bad, re] of [[{ nip: '' }, /NIP/], [{ nip: '1234563219' }, /NIP/], [{ start: day(-2) }, /datę/], [{ start: day(61) }, /datę/], [{ start: 'jutro' }, /datę/], [{ terms: false }, /regulamin/], [{ qty: 0 }, /Liczba osób/], [{ email: 'x' }, /e-mail/]]) assert.throws(() => validateOut({ ...FIRM, ...bad }), re, JSON.stringify(bad));
  assert.match(NO_COACHING, /bez coachingu na żywo/);
});

test('Serwer: zamówienie z fakturą → kody dla każdej osoby, panel bez danych pracowników, PDF; kod pracownika = zamówienie za 0 zł', async () => {
  const port = 6200 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-out-srv-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, post = (p, b) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, j: await r.json() }));
    for (let i = 0; i < 80; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const html = await fetch(U + '/dla-firm/outplacement').then((r) => r.text());
    assert.ok(html.includes('od 179 zł za osobę') && html.includes('Bez coachingu na żywo') && html.includes('src="/outplacement.js"') && html.includes('name="nip"') && html.includes('type="date" name="start"'));
    for (const p of ['299 zł', '269 zł', '239 zł', '209 zł', '179 zł', '50+']) assert.ok(html.includes(p), p);
    assert.match(await fetch(U + '/sitemap.xml').then((r) => r.text()), /\/dla-firm\/outplacement</);
    assert.match(read('public/index.html'), /<template id="pg-dla-firm"[\s\S]*href="\/dla-firm\/outplacement"[\s\S]*<\/template>/);
    assert.equal((await post('/api/outplacement/order', { ...FIRM, nip: '' })).status, 400);
    const o = await post('/api/outplacement/order', FIRM);
    assert.equal(o.status, 200); assert.match(o.j.redirect, /^\/dla-firm\/outplacement\?zam=B2B-[0-9A-F]{12}$/);
    const id = o.j.redirect.split('=')[1], b = JSON.parse(fs.readFileSync(path.join(dir, 'b2b-orders.json'), 'utf8'))[id];
    assert.equal(b.pkg, 'outplacement'); assert.equal(b.status, 'unpaid'); assert.equal(b.codes.length, 3); assert.equal(b.total, 89700); assert.ok(b.invoiceNumber, 'faktura wystawiona');
    const cs = JSON.parse(fs.readFileSync(path.join(dir, 'codes.json'), 'utf8')), c0 = cs[b.codes[0]];
    assert.match(c0.id, /^OUT-[A-Z2-9]{4}-[A-Z2-9]{4}$/); assert.equal(c0.maxUses, 1); assert.equal(c0.voucher, 'pack3'); assert.deepEqual(c0.voucherAddons, OUT_ADDONS);
    assert.ok(Math.abs(c0.expires - (Date.parse(`${FIRM.start}T00:00:00Z`) + 90 * 864e5)) < 864e5, 'ważny 90 dni od daty przekazania');
    assert.match(await fetch(U + o.j.redirect).then((r) => r.text()), /Panel firmy/);
    const panel = `/dla-firm/outplacement/panel/${b.panel}`, ph = await fetch(U + panel).then((r) => r.text());
    assert.match(ph, /<b>0<\/b> z 3/); assert.ok(b.codes.every((k) => ph.includes(k)));
    const pdf = await fetch(`${U}${panel}/instrukcja.pdf`); assert.equal(pdf.status, 200); assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.equal((await fetch(`${U}/dla-firm/outplacement/panel/${'x'.repeat(32)}`)).status, 404);
    // Pracownik: kod daje Pakiet 3 i dodatki bez opłaty; drugi raz ten sam kod nie działa.
    const code = await fetch(`${U}/api/code/${b.codes[0]}?email=jan@x.pl`).then((r) => r.json());
    assert.equal(code.voucher, 'pack3'); assert.deepEqual(code.voucherAddons, OUT_ADDONS); assert.match(code.label, /pracodawcy/);
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const cv = (email) => post('/api/orders', { pkg: 'pack3', addons: { interview: true, sim: true, linkedin: true, docx: true }, consent: true, waiver: true, code: b.codes[0], profile: { name: 'Jan Pracownik', email, experience: [{ title: 'Magazynier', company: 'X' }] }, ads: [{ title: 'Magazynier', text: ad }, { title: 'Magazynier 2', text: ad }] });
    const r1 = await cv('jan@x.pl'); assert.equal(r1.status, 200, JSON.stringify(r1.j)); assert.ok(r1.j.free, 'zamówienie za 0 zł');
    const saved = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === r1.j.id);
    assert.equal(saved.total, 0); assert.equal(saved.discount, PRICES.pack3 + PRICES.interview - BUNDLE_OFF + PRICES.sim + PRICES.linkedin + PRICES.docx);
    assert.equal((await cv('ewa@x.pl')).status, 400, 'kod jednorazowy');
    await wait(300);
    const ph2 = await fetch(U + panel).then((r) => r.text());
    assert.match(ph2, /<b>1<\/b> z 3/); assert.match(ph2, /wykorzystany/); assert.ok(!ph2.includes('jan@x.pl') && !ph2.includes('Jan Pracownik'), 'bez danych pracownika');
  } finally { srv.kill(); }
});

test('Regulamin i polityka prywatności (4 języki, 27.10.2026), skrypt strony, tłumaczenia', () => {
  for (const [l, re, hist] of [
    ['pl', /„Outplacement” to usługa dla przedsiębiorców[\s\S]*ważny 90 dni[\s\S]*NIP[\s\S]*nie obejmuje coachingu, doradztwa ani spotkań na żywo[\s\S]*Outplacement \(§2 ust\. 12\), cena za osobę[\s\S]*1–4 osoby – 299 zł, 5–9 – 269 zł, 10–24 – 239 zł, 25–49 – 209 zł, 50 i więcej – 179 zł\./, /Historia zmian: (?:[^;]*; )*27 października 2026 r\. – „Outplacement” dla firm \(§2 ust\. 12, §4 ust\. 1\);/],
    ['en', /“Outplacement” is a service for businesses[\s\S]*does not include coaching[\s\S]*50 or more – PLN 179\./, /Change history: (?:[^;]*; )*27 October 2026 – “Outplacement”/],
    ['de', /„Outplacement“ ist ein Dienst für Unternehmer[\s\S]*kein Coaching[\s\S]*ab 50 – 179 PLN\./, /Änderungshistorie: (?:[^;]*; )*27\. Oktober 2026 – „Outplacement“/],
    ['uk', /«Аутплейсмент» – це послуга для підприємців[\s\S]*не включає коучингу[\s\S]*50 і більше – 179 zł\./, /Історія змін: (?:[^;]*; )*27 жовтня 2026 р\. – «Аутплейсмент»/]]) {
    const b = legalBody('regulamin', l); assert.match(b, re, l); assert.match(b, hist, l);
  }
  for (const [l, re] of [['pl', /outplacementu[\s\S]*nie przekazujemy mu danych osób korzystających z kodów/], ['en', /outplacement order[\s\S]*do not share with them any data/], ['de', /Outplacement-Bestellung[\s\S]*keine Daten der Personen/], ['uk', /аутплейсменту[\s\S]*не передаємо йому даних осіб/]]) assert.match(legalBody('prywatnosc', l), re, l);
  assert.match(read('public/outplacement.js'), /fetch\('\/api\/outplacement\/order'/);
  assert.match(read('public/app.js'), /voucherAddonsOff/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['Liczba osób', 'Kod od pracodawcy (outplacement): {0} i dodatki bez opłaty', 'Zwolnienia w firmie?', 'Outplacement od 179 zł za osobę']) assert.ok(d[k], `${l}: ${k}`); }
});
