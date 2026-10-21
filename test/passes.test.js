import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'passes-'));
process.env.SMTP_URL = 'json';
const { PASSES, PRICES, passCharge, perMatch } = await import('../lib/pricing.js');
const P = await import('../lib/passes.js');
const { accountIdFor } = await import('../lib/account.js');
const { sales } = await import('../lib/ops.js');

const consent = { terms: true, start: true };
const buy = async (email, kind = 'aktywny30', now = Date.now()) => { const p = await P.createPass({ kind, email, consent }, now); return P.activatePass(p.id, { provider: 'demo', now, base: 'https://example.test' }); };

test('Cennik karnetów i wycena zamówienia karnetem', () => {
  assert.deepEqual(Object.keys(PASSES), ['start30', 'aktywny30', 'maraton60']);
  assert.equal(perMatch('aktywny30'), 645); assert.equal(PASSES.aktywny30.badge, 'Polecany');
  assert.deepEqual(passCharge({ matches: 5, sim: 1, interview: 1 }, 2, { sim: true, interview: true }, ['en']), { use: { matches: 2, sim: 1, interview: 1 }, items: [], total: 0 }, 'wszystko z karnetu, jeden język w cenie');
  const q = passCharge({ matches: 5, sim: 0, interview: 0 }, 1, { sim: true, interview: true, docx: true }, ['en', 'de']);
  assert.deepEqual(q.use, { matches: 1, sim: 0, interview: 0 });
  assert.equal(q.total, PRICES.interview + PRICES.sim - 1900 + PRICES.docx + PRICES.extraLang, 'wyczerpane limity płatne (z rabatem „Pewna rozmowa”), drugi język płatny');
  assert.throws(() => passCharge({ matches: 1, sim: 0, interview: 0 }, 2, {}, []), /zostało 1 dopasowań/);
});

test('Zakup: zgody wymagane, aktywacja raz (sprzedaż, konto, ważność), widok bez danych płatności', async () => {
  await assert.rejects(P.createPass({ kind: 'aktywny30', email: 'a@example.test', consent: { terms: true } }), /obie zgody/);
  await assert.rejects(P.createPass({ kind: 'x', email: 'a@example.test', consent }), /Wybierz karnet/);
  const now = Date.now(), p0 = await P.createPass({ kind: 'start30', email: 'A@Example.test', consent }, now);
  assert.equal(p0.status, 'pending'); assert.equal(p0.acc, accountIdFor('a@example.test')); assert.equal(p0.consent.start, P.PASS_START);
  const a = await P.activatePass(p0.id, { provider: 'demo', now }), again = await P.activatePass(p0.id, { provider: 'demo', now: now + 1000 });
  assert.equal(a.status, 'active'); assert.equal(a.expires, now + 30 * 864e5); assert.equal(again.paidAt, now, 'druga aktywacja nic nie zmienia');
  assert.equal((await sales.get(p0.id)).total, 9900);
  assert.equal((await P.activePassFor(accountIdFor('a@example.test'))).id, p0.id);
  assert.ok(!('payment' in P.passView(a)) && !('email' in P.passView(a)));
});

test('Zużycie atomowe: równoległe zamówienia nie zużyją więcej, niż zostało', async () => {
  const p = await buy('par@example.test'), acc = p.acc;
  await P.passes.update(p.id, (x) => ({ ...x, left: { ...x.left, matches: 3 } }));
  const r = await Promise.allSettled([1, 2, 3].map((i) => P.reservePass(acc, { ads: 2, addons: {}, extraLangs: [], orderId: `o${i}` })));
  assert.equal(r.filter((x) => x.status === 'fulfilled').length, 1);
  assert.ok(r.filter((x) => x.status === 'rejected').every((x) => x.reason instanceof P.PassError));
  const x = await P.passes.get(p.id); assert.equal(x.left.matches, 1); assert.equal(x.used.length, 1);
});

test('Rezerwacja → zużycie po opłaceniu; zwolnienie przywraca limity; limity godzinowe i dobowe z alertem', async () => {
  const p = await buy('lim@example.test'), acc = p.acc, now = Date.now();
  const q = await P.reservePass(acc, { ads: 3, addons: { sim: true, interview: true }, extraLangs: [], orderId: 'A' }, now);
  assert.deepEqual(q.use, { matches: 3, sim: 1, interview: 1 }); assert.equal(q.total, 0);
  await P.passOrderPaid({ id: 'A', pass: { id: p.id } });
  let x = await P.passes.get(p.id); assert.equal(x.used[0].state, 'used'); assert.deepEqual(x.left, { matches: 17, sim: 2, interview: 0 });
  await P.reservePass(acc, { ads: 2, addons: {}, extraLangs: [], orderId: 'B' }, now);
  await assert.rejects(P.reservePass(acc, { ads: 1, addons: {}, extraLangs: [], orderId: 'C' }, now), /5 dopasowań na godzinę/);
  await P.releasePassOrder({ id: 'B', pass: { id: p.id } });
  x = await P.passes.get(p.id); assert.equal(x.left.matches, 17, 'zwolniona rezerwacja wraca'); assert.ok(x.flagged >= 1 && x.alertedAt, 'alert o podejrzanym użyciu');
  for (const [i, t] of [2, 4, 6, 8].entries()) await P.reservePass(acc, { ads: 3, addons: {}, extraLangs: [], orderId: `D${i}` }, now + t * 3600e3);
  await assert.rejects(P.reservePass(acc, { ads: 3, addons: {}, extraLangs: [], orderId: 'E' }, now + 10 * 3600e3), /15 dopasowań na dobę/);
});

test('Wygaśnięcie: przypomnienie 3 dni przed i w dniu wygaśnięcia, potem karnet nieaktywny; rezerwacje bez zamówienia zwalniane', async () => {
  const now = Date.now(), p = await buy('exp@example.test', 'start30', now);
  await P.reservePass(p.acc, { ads: 1, addons: {}, extraLangs: [], orderId: 'brak' }, now);
  await P.passesHourly('https://example.test', now + 28 * 864e5);
  let x = await P.passes.get(p.id); assert.ok(x.reminders.d3); assert.ok(!x.reminders.d0); assert.equal(x.left.matches, 8, 'rezerwacja bez zamówienia zwolniona');
  await P.passesHourly('https://example.test', now + 31 * 864e5);
  x = await P.passes.get(p.id); assert.equal(x.status, 'expired'); assert.ok(x.reminders.d0); assert.equal(x.lostMatches, 8);
  assert.equal(await P.activePassFor(p.acc, now + 31 * 864e5), null);
  await assert.rejects(P.reservePass(p.acc, { ads: 1, addons: {}, extraLangs: [], orderId: 'po' }, now + 31 * 864e5), /Nie masz aktywnego karnetu/);
});

test('Zwrot: proporcjonalnie do ceny według wag z cennika, tylko zużycia (nie rezerwacje); po zwrocie karnet nieaktywny', async () => {
  const p = await buy('ref@example.test', 'start30');
  assert.equal(P.proportionalRefund(p), 9900, 'nic nie wykorzystano – zwrot całości');
  await P.reservePass(p.acc, { ads: 1, addons: { sim: true }, extraLangs: [], orderId: 'R1' });
  assert.equal(P.proportionalRefund(await P.passes.get(p.id)), 9900, 'rezerwacja nie obniża zwrotu');
  await P.passOrderPaid({ id: 'R1', pass: { id: p.id } });
  const W = P.REFUND_WEIGHTS(), all = 8 * W.matches + 1 * W.sim, used = W.matches + W.sim;
  assert.equal(P.proportionalRefund(await P.passes.get(p.id)), Math.round(9900 * (all - used) / all));
  assert.equal(P.proportionalRefund(await P.passes.get(p.id)), 8066, 'przykład z review: 80,66 zł');
  await P.reservePass(p.acc, { ads: 1, addons: {}, extraLangs: [], orderId: 'R2' });
  const r = await P.passRefunded(p.id, 8066);
  assert.equal(r.status, 'refunded'); assert.deepEqual(r.left, { matches: 0, sim: 0, interview: 0 }); assert.equal((await sales.get(p.id)).refunded, 8066);
  await P.releasePassOrder({ id: 'R2', pass: { id: p.id } });
  assert.deepEqual((await P.passes.get(p.id)).left, { matches: 0, sim: 0, interview: 0 }, 'zwolnienie po zwrocie nie przywraca limitów');
  assert.equal(await P.activePassFor(p.acc), null);
});

test('Serwer (demo): /karnety, zakup, logowanie po płatności, zamówienie z karnetem za 0 zł i z dopłatą', async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const port = 4700 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-pass-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`; let cookie = '';
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const call = async (m, p, b) => { const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json', cookie }, body: b && JSON.stringify(b) }); const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]; return { status: r.status, j: await r.json().catch(() => ({})) }; };
    const page = await (await fetch(U + '/karnety')).text();
    assert.ok(page.includes('Płacisz raz. Brak subskrypcji') && page.includes('Ok. 6,45 zł za CV + list') && page.includes('id="passForm"'));
    assert.ok(!/przekreśl|<s>|<del>|wartość katalogowa/i.test(page), 'bez przekreślonych cen i wartości katalogowej');
    assert.deepEqual((await call('GET', '/api/passes/mine')).j, { active: null, all: [] });
    assert.equal((await call('POST', '/api/passes', { kind: 'aktywny30', email: 'k@example.test', terms: true })).status, 400, 'bez zgody na rozpoczęcie świadczenia');
    const b = await call('POST', '/api/passes', { kind: 'aktywny30', email: 'k@example.test', terms: true, start: true });
    assert.equal(b.j.url, `/konto?karnet=${b.j.id}`);
    assert.equal((await call('POST', `/api/passes/${b.j.id}/login`)).status, 200);
    const keep = cookie; cookie = '';
    assert.equal((await call('POST', `/api/passes/${b.j.id}/login`)).status, 409, 'logowanie z powrotu z płatności tylko raz');
    cookie = keep;
    const mine = (await call('GET', '/api/passes/mine')).j;
    assert.equal(mine.active.left.matches, 20);
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const prof = { name: 'Kasia Test', email: 'k@example.test', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] };
    assert.equal((await call('POST', '/api/orders', { usePass: true, code: 'KOD-1', pkg: 'cv', consent: true, waiver: true, profile: prof, ads: [{ title: 'Magazynier', text: ad }] })).status, 400, 'kod rabatowy nie z karnetem');
    // karnet pokrywający całość (0 zł): bez zgody z art. 38 nie blokujemy
    const o1 = await call('POST', '/api/orders', { usePass: true, pkg: 'cv', consent: true, profile: prof, addons: { sim: true }, ads: [{ title: 'Magazynier', text: ad }, { title: 'Kierowca', text: ad }] });
    assert.equal(o1.j.free, true, 'karnet pokrywa całość');
    let o; for (let i = 0; i < 60; i++) { o = (await call('GET', `/api/orders/${o1.j.id}`)).j; if (o.status === 'done') break; await wait(150); }
    assert.equal(o.status, 'done'); assert.equal(o.pkg, 'pack3');
    const acct = (await (await fetch(U + '/api/account', { headers: { cookie, 'X-Acc': '1' } })).json()).orders.find((x) => x.id === o1.j.id);
    assert.equal(acct.pkg, 'Karnet: 2 × CV + list');
    assert.ok(!JSON.parse(fs.readFileSync(path.join(dir, 'sales.json'), 'utf8'))[o1.j.id], 'zamówienie za 0 zł z karnetu nie jest sprzedażą'); assert.ok(o.results.every((r) => r.letter), 'list w cenie dopasowania');
    let m = (await call('GET', '/api/passes/mine')).j.active;
    assert.deepEqual(m.left, { matches: 18, sim: 2, interview: 1 }); assert.equal(m.used[0].state, 'used');
    const nw = await call('POST', '/api/orders', { usePass: true, consent: true, profile: prof, addons: { docx: true }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal(nw.status, 400, 'dopłata do karnetu bez zgody z art. 38 – 400');
    assert.equal((await call('GET', '/api/passes/mine')).j.active.left.matches, 18, 'odrzucone zamówienie zwalnia rezerwację karnetu');
    const o2 = await call('POST', '/api/orders', { usePass: true, consent: true, waiver: true, profile: prof, addons: { docx: true }, ads: [{ title: 'Magazynier', text: ad }] });
    assert.equal(o2.j.demo, true, 'dopłata za Word → płatność');
    m = (await call('GET', '/api/passes/mine')).j.active; assert.equal(m.left.matches, 17); assert.equal(m.used.at(-1).state, 'reserved');
    await call('POST', `/api/orders/${o2.j.id}/demo-pay`);
    for (let i = 0; i < 60; i++) { o = (await call('GET', `/api/orders/${o2.j.id}`)).j; if (o.status === 'done') break; await wait(150); }
    assert.equal(o.total, PRICES.docx);
    m = (await call('GET', '/api/passes/mine')).j.active; assert.equal(m.used.at(-1).state, 'used');
    cookie = '';
    assert.equal((await call('POST', '/api/orders', { usePass: true, consent: true, waiver: true, profile: prof, ads: [{ title: 'Magazynier', text: ad }] })).status, 400, 'bez logowania nie ma karnetu');
  } finally { srv.kill(); }
});
