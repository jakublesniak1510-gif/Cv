import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { emailHash, codeDiscount, reserveCode, applyPaidCode, releaseCode, staleReservations, CodeError, RESERVE_TTL } from '../lib/referral.js';

// Kody z limitem: rezerwacja przy składaniu zamówienia (w jednej blokadzie zapisu), a nie dopiero po wygenerowaniu dokumentów.
const FAR = Date.now() + 864e5 * 30;

test('Rezerwacja: maxUses, raz na osobę, saldo właściciela, przejęcie przez tę samą osobę, zwolnienie po 24 h', () => {
  let c = { id: 'INST1', amount: 0, voucher: 'cv', maxUses: 1, usedBy: [], expires: FAR };
  c = reserveCode(c, { email: 'a@x.pl', order: 'o1', final: true });
  assert.throws(() => reserveCode(c, { email: 'b@x.pl', order: 'o2' }), (e) => e instanceof CodeError && /Limit/.test(e.message));
  assert.throws(() => reserveCode(c, { email: 'a@x.pl', order: 'o3' }), CodeError, 'ostateczna rezerwacja nie jest przejmowana');
  c = applyPaidCode(c, { email: 'a@x.pl', order: 'o1' });
  assert.deepEqual(c.reserved, []); assert.deepEqual(c.usedBy, [emailHash('a@x.pl')]);

  // Kod −10 zł (raz na osobę): ta sama osoba może złożyć zamówienie ponownie (przejęcie), inna osoba nie jest blokowana.
  let k = { id: 'KOD-1', amount: 1000, ownerHash: emailHash('own@x.pl'), usedBy: [], credit: 3000, expires: FAR };
  k = reserveCode(k, { email: 'f@x.pl', order: 'p1', expect: { base: 1000 } });
  assert.match(codeDiscount(k, 'g@x.pl').base + '', /1000/);
  k = reserveCode(k, { email: 'f@x.pl', order: 'p2', expect: { base: 1000 } });
  assert.deepEqual(k.reserved.map((x) => x.order), ['p2'], 'nowsze zamówienie przejmuje rezerwację');

  // Saldo właściciela: zarezerwowane nie jest dostępne dla innego zamówienia; nigdy poniżej 0.
  k = reserveCode(k, { email: 'own@x.pl', order: 'w1', expect: { base: 1000, creditUsed: 2500 }, final: true });
  assert.deepEqual(codeDiscount(k, 'own@x.pl'), { base: 0, credit: 500 });
  assert.throws(() => reserveCode(k, { email: 'own@x.pl', order: 'w2', expect: { base: 1000, creditUsed: 500 } }), /właśnie wykorzystany/);
  k = applyPaidCode(k, { email: 'own@x.pl', order: 'w1', creditUsed: 2500, total: 0 });
  k = applyPaidCode(k, { email: 'own@x.pl', order: 'w1', creditUsed: 2500, total: 0 });
  assert.equal(k.credit, 0, 'saldo nie schodzi poniżej 0');

  // Nieopłacone po 24 h → do zwolnienia; ostateczne zostają.
  const old = { reserved: [{ order: 'a', at: Date.now() - RESERVE_TTL - 1 }, { order: 'b', at: Date.now() - RESERVE_TTL - 1, final: true }, { order: 'c', at: Date.now() }] };
  assert.deepEqual(staleReservations(old), ['a']);
  assert.deepEqual(releaseCode(old, ['a']).reserved.map((x) => x.order), ['b', 'c']);
});

test('Serwer (demo): 5 równoległych zamówień z kodem maxUses 1 → dokładnie 1; rezerwacja salda właściciela', async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const port = 5100 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-codes-'));
  fs.writeFileSync(path.join(dir, 'codes.json'), JSON.stringify({
    INST1: { id: 'INST1', amount: 0, voucher: 'cv', maxUses: 1, usedBy: [], expires: FAR },
    'KOD-OWN1': { id: 'KOD-OWN1', amount: 1000, ownerHash: emailHash('own@x.pl'), usedBy: [], referrals: 0, credit: 5000, expires: FAR },
  }));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const order = (email, code) => fetch(U + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, code, profile: { name: 'Test Osoba', email, experience: [{ title: 'Magazynier', company: 'X' }] }, ads: [{ title: 'Magazynier', text: ad }] }) }).then(async (r) => ({ status: r.status, j: await r.json() }));
    const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => order(`osoba${i}@x.pl`, 'INST1')));
    assert.equal(rs.filter((r) => r.status === 200 && r.j.free).length, 1, JSON.stringify(rs.map((r) => r.j.error || 'ok')));
    assert.ok(rs.filter((r) => r.status !== 200).every((r) => /Limit|wykorzystany/.test(r.j.error)));
    // Właściciel: 10 zł + saldo (pakiet kosztuje co najmniej 2 zł → płatne). Trzy naraz: jedna rezerwacja (ostatnie przejmuje),
    // więc saldo jest zajęte raz: 39 − 2 − 10 = 27 zł, a dla kolejnego zamówienia zostaje 23 zł.
    const ow = await Promise.all([1, 2, 3].map(() => order('own@x.pl', 'KOD-OWN1')));
    assert.ok(ow.every((r) => r.status === 200), JSON.stringify(ow.map((r) => r.j.error || 'ok')));
    let c; for (let i = 0; i < 80; i++) { c = JSON.parse(fs.readFileSync(path.join(dir, 'codes.json'), 'utf8')); if (!c.INST1.reserved?.length) break; await wait(150); }
    assert.equal(c.INST1.usedBy.length, 1, 'zamówienie za 0 zł: rezerwacja zamieniona na użycie');
    const own = c['KOD-OWN1'];
    assert.equal(own.reserved.length, 1); assert.equal(own.reserved[0].credit, 2700);
    assert.deepEqual(codeDiscount(own, 'inna@x.pl'), { base: 1000, credit: 0 });
    const fourth = await order('own@x.pl', 'KOD-OWN1');
    assert.equal(fourth.status, 200);
    const c2 = JSON.parse(fs.readFileSync(path.join(dir, 'codes.json'), 'utf8'))['KOD-OWN1'];
    assert.equal(c2.reserved.length, 1); assert.equal(c2.credit, 5000, 'saldo zmniejsza się dopiero po opłaceniu');
  } finally { srv.kill(); }
});

test('Serwer (demo): samopolecenie bez nagrody (to samo IP co zamówienie właściciela w 24 h), polecenie z innego IP z nagrodą; poprawki: limit 5, tożsamość z oryginału', async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const port = 5500 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-self-'));
  fs.writeFileSync(path.join(dir, 'codes.json'), JSON.stringify({ 'KOD-OWN2': { id: 'KOD-OWN2', amount: 1000, ownerHash: emailHash('own@x.pl'), usedBy: [], referrals: 0, credit: 0, expires: FAR } }));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const call = (p, body, ip) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, j: await r.json().catch(() => ({})) }));
    const order = (email, code, ip) => call('/api/orders', { pkg: 'cv', consent: true, waiver: true, code, profile: { name: `Osoba ${email}`, email, experience: [{ title: 'Magazynier', company: 'X' }] }, ads: [{ title: 'Magazynier', text: ad }] }, ip);
    const payDone = async (id, ip) => { await call(`/api/orders/${id}/demo-pay`, {}, ip); let o; for (let i = 0; i < 80; i++) { o = await (await fetch(`${U}/api/orders/${id}`)).json(); if (o.status === 'done') return o; await wait(150); } return o; };
    const code = () => JSON.parse(fs.readFileSync(path.join(dir, 'codes.json'), 'utf8'))['KOD-OWN2'];

    await order('own@x.pl', '', '10.0.0.1'); // właściciel złożył zamówienie z tego IP
    const self = await order('drugi-adres@x.pl', 'KOD-OWN2', '10.0.0.1');
    assert.equal(self.status, 200); await payDone(self.j.id, '10.0.0.1');
    assert.equal(code().credit, 0, 'samopolecenie: bez nagrody'); assert.equal(code().selfRefs, 1);
    const friend = await order('znajomy@x.pl', 'KOD-OWN2', '10.0.0.2');
    const done = await payDone(friend.j.id, '10.0.0.2');
    assert.equal(code().credit, 1000, 'prawdziwe polecenie: +10 zł'); assert.equal(code().referrals, 1);

    // Poprawki: 5 na zamówienie; imię i kontakt zawsze z oryginału.
    assert.equal(done.revisionsLeft, 5);
    for (let i = 4; i >= 0; i--) {
      const r = await call(`/api/orders/${friend.j.id}/revise`, { i: 0, doc: 'cv', instruction: 'Skróć opis doświadczenia.' }, '10.0.0.2');
      assert.equal(r.status, 200); assert.equal(r.j.revisionsLeft, i); assert.equal(r.j.result.cv.name, done.results[0].cv.name);
    }
    assert.equal((await call(`/api/orders/${friend.j.id}/revise`, { i: 0, doc: 'cv', instruction: 'Skróć.' }, '10.0.0.2')).status, 429);
  } finally { srv.kill(); }
});

test('Poprawka tylko pod to ogłoszenie, tożsamość z oryginału; asystent bez pisania całych dokumentów i z krótką odpowiedzią', async () => {
  const gen = fs.readFileSync('lib/generate.js', 'utf8'), srv = fs.readFileSync('server.js', 'utf8');
  assert.match(gen, /Poprawka dotyczy dopasowania do TEGO ogłoszenia[\s\S]*nowe ogłoszenie to nowe zamówienie \(z kodem −10 zł\)/);
  assert.match(srv, /cv: \{ \.\.\.cleanCv\(out\.cv\), name: target\.cv\?\.name \|\| '', contact: target\.cv\?\.contact \|\| \[\] \}/);
  assert.match(srv, /const MAX_REVISIONS = 5;/);
  assert.match(gen, /Nie piszesz całych CV, listów motywacyjnych ani ich dużych fragmentów/);
  assert.match(gen, /maxTokens: 900 \}\);\n  return clipAnswer/);
  const { clipAnswer, ASSIST_MAX } = await import('../lib/generate.js');
  const long = clipAnswer('Pierwsze zdanie listu motywacyjnego. '.repeat(60));
  assert.ok(long.length <= ASSIST_MAX && /\.$/.test(long), 'ucięte na końcu zdania');
  assert.equal(clipAnswer('Krótko.'), 'Krótko.');
});

test('Limit poprawek z chwili zakupu (stare zamówienia: 10) i polityka prywatności o skrócie IP (4 języki)', () => {
  const s = fs.readFileSync('server.js', 'utf8'), pp = fs.readFileSync('public/legal/prywatnosc.html', 'utf8');
  assert.match(s, /const revLimit = \(o\) => o\.maxRevisions \?\? 10;/);
  assert.equal((s.match(/maxRevisions: MAX_REVISIONS, created/g) || []).length, 2, 'nowe zamówienia i kolejne zamówienia zapisują limit');
  assert.ok(!/MAX_REVISIONS - \(o\.revisions/.test(s), 'licznik z zamówienia, nie globalny');
  for (const t of ['skrót adresu IP', 'Hashwert der IP-Adresse', 'hash of the IP address', 'хеш IP-адреси']) assert.ok(pp.includes(t), t);
});
