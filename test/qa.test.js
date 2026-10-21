import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
const { checkResult, hasCritical, sameName, recordQa, qaWeeks, weekOf } = await import('../lib/qa.js');
const { tailor } = await import('../lib/tailor.js');

const PROFILE = { name: 'Anna Nowak', email: 'anna@example.test', experience: [{ title: 'Magazynier', company: 'Logistyka Kowalski Sp. z o.o.', period: '2020 – 2024', desc: 'Kompletacja zamówień, obsługa wózka widłowego.' }], education: [{ school: 'Technikum nr 2 w Poznaniu', degree: 'Technik logistyk', period: '2016 – 2020' }], skills: 'wózek widłowy, WMS, kompletacja' };
const AD = { title: 'Magazynier', text: 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, znajomość systemu WMS, sumienność i dokładność. Oferujemy umowę o pracę.' };
const CLAUSE = 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.';
const good = () => ({ lang: 'pl', keywords: ['wózek widłowy', 'WMS'], match: { found: ['obsługa wózka widłowego', 'system WMS'], missing: [] },
  cv: { name: 'Anna Nowak', headline: 'Magazynier', summary: 'Magazynier z czteroletnim doświadczeniem w kompletacji zamówień i obsłudze wózka widłowego. Pracuję dokładnie i sumiennie, znam system WMS i zasady bezpiecznej pracy w magazynie wysokiego składowania, a także organizację pracy na zmiany.',
    experience: [{ title: 'Magazynier', company: 'Logistyka Kowalski', period: '2020 – 2024', bullets: ['Kompletowałam zamówienia w systemie WMS, dbając o terminowość wysyłek.', 'Obsługiwałam wózek widłowy przy rozładunku i załadunku dostaw.', 'Pilnowałam porządku i zasad bezpieczeństwa na swojej strefie magazynu.'] }],
    education: [{ school: 'Technikum nr 2 w Poznaniu', degree: 'Technik logistyk', period: '2016 – 2020' }], skills: ['wózek widłowy', 'WMS', 'kompletacja'], clause: CLAUSE },
  letter: '' });
const codes = (q) => q.flags.map((f) => f.code).sort();

test('Poprawny wynik: bez uwag, wynik 100', () => {
  const q = checkResult(good(), { profile: PROFILE, ad: AD, pages: 1 });
  assert.deepEqual(q.flags, []); assert.equal(q.score, 100); assert.equal(q.coverage, 100);
});

test('Generator bez AI (tailor) przechodzi kontrolę bez błędów krytycznych (brak fałszywych alarmów)', () => {
  for (const withLetter of [false, true]) {
    const r = tailor({ profile: PROFILE, ad: AD, withLetter });
    const q = checkResult(r, { profile: PROFILE, ad: AD, withLetter, pages: 1 });
    assert.ok(!hasCritical(q), `krytyczne: ${codes(q)}`);
  }
});

test('Błędy krytyczne: placeholder, firma spoza profilu, język, klauzula, puste CV, brak listu', () => {
  const r1 = good(); r1.cv.experience[0].bullets.push('Współpraca z [nazwa firmy klienta].'); r1.letter = 'Z poważaniem, [Imię Nazwisko]'.padEnd(250, ' x');
  assert.ok(codes(checkResult(r1, { profile: PROFILE, ad: AD })).includes('placeholder'));
  const r2 = good(); r2.cv.experience.push({ title: 'Kierownik', company: 'Amazon Fulfillment', bullets: [] });
  const q2 = checkResult(r2, { profile: PROFILE, ad: AD }); assert.deepEqual(q2.flags.find((f) => f.code === 'firma_spoza_profilu'), { code: 'firma_spoza_profilu', level: 'critical', n: 1 });
  assert.ok(!JSON.stringify(q2).includes('Amazon'), 'flagi bez treści CV');
  assert.ok(codes(checkResult(good(), { profile: PROFILE, ad: { ...AD, lang: 'en' } })).includes('jezyk'), 'wybrany angielski, wynik po polsku');
  const r3 = good(); r3.cv.summary = 'Warehouse operative with four years of experience in order picking and forklift operation. I work accurately and reliably, I know the WMS system and the safety rules of high-bay warehouses and shift work organisation.'; r3.cv.experience[0].bullets = ['Picked orders in the WMS system and kept shipments on time.', 'Operated a forklift during loading and unloading of deliveries.'];
  assert.ok(codes(checkResult(r3, { profile: PROFILE, ad: AD })).includes('jezyk'), 'treść po angielsku, lang = pl');
  const r4 = good(); r4.cv.clause = '';
  assert.deepEqual(checkResult(r4, { profile: PROFILE, ad: AD }).flags, [{ code: 'klauzula', level: 'critical' }]);
  assert.deepEqual(checkResult({ ...r4, lang: 'de' }, { profile: PROFILE, ad: { ...AD, lang: 'de' }, }).flags.find((f) => f.code === 'klauzula').level, 'warn', 'poza PL tylko ostrzeżenie');
  assert.ok(codes(checkResult({ lang: 'pl', cv: { clause: CLAUSE } }, { profile: PROFILE, ad: AD })).includes('pusty'));
  assert.ok(codes(checkResult(good(), { profile: PROFILE, ad: AD, withLetter: true })).includes('brak_listu'));
});

test('Ostrzeżenia: szkoła spoza profilu, długość, słowa kluczowe; wynik punktowy', () => {
  const r = good(); r.cv.education[0].school = 'Politechnika Warszawska'; r.keywords = ['SAP', 'Excel', 'zarządzanie zespołem'];
  const q = checkResult(r, { profile: PROFILE, ad: AD, pages: 3 });
  assert.deepEqual(codes(q), ['dlugosc', 'slowa_kluczowe', 'szkola_spoza_profilu']);
  assert.ok(q.flags.every((f) => f.level === 'warn')); assert.equal(q.score, 70); assert.equal(q.coverage, 0);
});

test('Porównanie nazw firm: formy prawne, skróty, nawiasy', () => {
  assert.ok(sameName('Logistyka Kowalski', ['Logistyka Kowalski Sp. z o.o.']));
  assert.ok(sameName('Biedronka', ['Jeronimo Martins Polska (Biedronka)']));
  assert.ok(sameName('DHL Supply Chain', ['DHL']));
  assert.ok(!sameName('Amazon', ['DHL', 'Biedronka']));
  assert.ok(sameName('', []), 'pusta nazwa nie jest błędem');
});

test('Statystyki tygodniowe', async () => {
  const at = Date.parse('2026-10-21T10:00:00Z');
  assert.equal(weekOf(at), '2026-10-19');
  await recordQa([{ score: 100, flags: [] }, { score: 70, flags: [{ code: 'placeholder', level: 'critical' }], retried: true }, { score: 90, flags: [{ code: 'dlugosc', level: 'warn' }], retried: true }], at);
  const [w] = await qaWeeks();
  assert.deepEqual(w, { id: '2026-10-19', docs: 3, avg: 87, critical: 1, retried: 2, fixed: 1, flags: { placeholder: 1, dlugosc: 1 } });
});

test('Zamówienie: kontrola jakości zapisana w zamówieniu i w statystykach, bez flag w odpowiedzi dla klienta', async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const port = 4400 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-qa-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const r = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg: 'cv_letter', consent: true, waiver: true, profile: PROFILE, ads: [{ title: AD.title, text: AD.text.repeat(2) }] }) })).json();
    await fetch(`${U}/api/orders/${r.id}/demo-pay`, { method: 'POST', headers: H, body: '{}' });
    let o; for (let i = 0; i < 60; i++) { o = await (await fetch(`${U}/api/orders/${r.id}`)).json(); if (o.status === 'done') break; await wait(150); }
    assert.equal(o.status, 'done'); assert.equal(o.results[0].qa, undefined, 'bez flag w odpowiedzi dla klienta');
    const saved = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === r.id);
    assert.equal(typeof saved.qa.score, 'number'); assert.ok(Array.isArray(saved.qa.flags)); assert.ok(!saved.qa.flags.length || saved.qa.score < 100);
    assert.equal(typeof saved.results[0].qa.score, 'number');
    await wait(100);
    const stats = JSON.parse(fs.readFileSync(path.join(dir, 'qa-stats.json'), 'utf8'));
    assert.equal(Object.values(stats)[0].docs, 1);
  } finally { srv.kill(); }
});

test('Bez fałszywych alarmów: warianty klauzuli RODO, nawiasy z latami i […], hiszpańskie „todo”, firma przy pustym profilu', () => {
  for (const cl of ['Wyrażam zgodę na przetwarzanie moich danych osobowych w celu rekrutacji zgodnie z RODO.', 'Wyrażam zgodę na przetwarzanie danych osobowych dla potrzeb rekrutacji (art. 6 ust. 1 lit. a RODO).', 'Wyrażam zgodę na przetwarzanie danych w procesie rekrutowania zgodnie z rozporządzeniem z dnia 27 kwietnia 2016 r.']) {
    const r = good(); r.cv.clause = cl; assert.deepEqual(checkResult(r, { profile: PROFILE, ad: AD }).flags, [], cl);
  }
  const r = good(); r.cv.experience[0].bullets.push('Praca zmianowa [2019–2021], inwentaryzacje [...] i […].');
  assert.deepEqual(checkResult(r, { profile: PROFILE, ad: AD }).flags, []);
  assert.ok(!codes(checkResult({ ...good(), lang: 'es', cv: { ...good().cv, summary: 'Tengo experiencia en todo tipo de almacenes.' } }, { profile: PROFILE, ad: { ...AD, lang: 'es' } })).includes('placeholder'));
  for (const t of ['Z poważaniem, [imię]', 'TODO: dopisać', '{{company}}']) { const x = good(); x.letter = t.padEnd(250, ' x'); assert.ok(codes(checkResult(x, { profile: PROFILE, ad: AD })).includes('placeholder'), t); }
  const noFirm = { ...PROFILE, experience: [{ title: 'Magazynier w Logistyka Kowalski', company: '', period: '2020 – 2024' }] };
  const r2 = good(); r2.cv.experience.push({ title: 'Pomocnik', company: 'Hurtownia Nowak', bullets: [] });
  assert.deepEqual(checkResult(r2, { profile: noFirm, ad: AD }).flags, [{ code: 'firma_spoza_profilu', level: 'warn', n: 1 }], 'pusta firma w profilu → ostrzeżenie; firma z tytułu nie jest flagowana');
  assert.equal(checkResult(r2, { profile: PROFILE, ad: AD }).flags[0].level, 'critical', 'firma spoza pełnego profilu → krytyczne');
});
