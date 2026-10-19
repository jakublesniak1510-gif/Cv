import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Osobny katalog danych i poczta w trybie testowym (bez wysyłki, ale z pełnym składaniem wiadomości i PDF).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-b2b-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test', SELLER_BANK: 'PL 12 3456 0000 0000 0000 0000 0000' });
const express = (await import('express')).default;
const { b2bTable, b2bQuote } = await import('../lib/pricing.js');
const { codes } = await import('../lib/store.js');
const { invoices } = await import('../lib/invoice.js');
const { sales } = await import('../lib/ops.js');
const b2b = await import('../lib/b2b.js');
const { seoRoutes } = await import('../lib/seo.js');

const BASE = 'https://example.test';
const body = (x = {}) => ({ org: 'Politechnika Testowa', nip: '123-456-32-18', address: 'ul. Prosta 1, 00-001 Warszawa', name: 'Anna Nowak', email: 'Biuro@Example.test', phone: '', pkg: 'cv_letter', qty: 50, pay: 'invoice', terms: true, ...x });

test('Ceny B2B: progi 15/25/35% od ceny pakietu, w dół do pełnych złotych', () => {
  assert.deepEqual(b2bTable(), { cv: [33, 29, 25], cv_letter: [41, 36, 31], pack3: [67, 59, 51] });
  assert.equal(b2bQuote('cv', 10).unit, 3300); assert.equal(b2bQuote('cv', 49).unit, 3300); assert.equal(b2bQuote('cv', 50).unit, 2900); assert.equal(b2bQuote('pack3', 2000).total, 2000 * 5100);
  assert.throws(() => b2bQuote('cv', 9), /od 10/); assert.throws(() => b2bQuote('cv', 2001), /2000/); assert.throws(() => b2bQuote('interview', 20), /pakiet/i);
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes(`<div class="amt">od ${Math.min(...Object.values(b2bTable()).flat())} zł</div>`), 'cena „od” na stronie zgodna z tabelą');
});

test('Zamówienie z fakturą 14 dni: kod od razu aktywny, faktura z terminem i rachunkiem, „opłacona”, rejestr sprzedaży', async () => {
  assert.rejects(() => b2b.createB2bOrder(body({ terms: false })), /regulamin/);
  await assert.rejects(() => b2b.createB2bOrder(body({ nip: '123' })), /NIP/);
  const o = await b2b.createB2bOrder(body());
  assert.equal(o.email, 'biuro@example.test'); assert.equal(o.nip, '1234563218'); assert.equal(o.unit, 3600); assert.equal(o.total, 180000);
  const b = await b2b.fulfillB2b(o.id, { base: BASE });
  assert.equal(b.status, 'unpaid'); assert.ok(b.due > Date.now() + 13 * 864e5);
  const c = await codes.get(b.code);
  assert.match(b.code, /^POLITECHNI-[0-9A-F]{4}$/);
  assert.equal(c.voucher, 'cv_letter'); assert.equal(c.maxUses, 50); assert.equal(c.report.length, 32); assert.ok(c.expires > Date.now() + 360 * 864e5);
  const inv = await invoices.get(o.id);
  assert.equal(inv.total, 180000); assert.equal(inv.lines[0].qty, 50); assert.equal(inv.lines[0].price, 3600); assert.ok(inv.due); assert.match(inv.bank, /PL 12/);
  assert.equal(inv.buyer.nip, '1234563218');
  assert.equal(await sales.get(o.id), null, 'nieopłacona faktura nie jest jeszcze sprzedażą');
  assert.equal((await b2b.fulfillB2b(o.id, { base: BASE })).code, b.code, 'ponowne wywołanie nie tworzy drugiego kodu');
  const paid = await b2b.markB2bPaid(o.id);
  assert.equal(paid.status, 'paid'); assert.equal((await sales.get(o.id)).total, 180000);
  // Wyłączenie kodu zostawia tylko wykorzystane użycia.
  await codes.update(b.code, (x) => ({ ...x, usedBy: ['a', 'b'] }));
  await b2b.deactivateB2b(o.id);
  const off = await codes.get(b.code); assert.equal(off.maxUses, 2); assert.equal(off.disabled, true);
});

test('Płatność online i zwrot: część zwrotu zmniejsza pulę kodów, całość wyłącza kod', async () => {
  const o = await b2b.createB2bOrder(body({ pay: 'now', qty: 20, pkg: 'cv' }));
  const b = await b2b.fulfillB2b(o.id, { paid: true, provider: 'stripe', paymentIntent: 'pi_1', base: BASE });
  assert.equal(b.status, 'paid'); assert.equal((await invoices.get(o.id)).due, undefined);
  await b2b.b2bRefunded(o.id, 5 * 3300);
  assert.equal((await codes.get(b.code)).maxUses, 15);
  await b2b.b2bRefunded(o.id, 20 * 3300);
  assert.equal((await codes.get(b.code)).disabled, true); assert.equal((await b2b.b2bOrders.get(o.id)).status, 'refunded');
  assert.equal((await sales.get(o.id)).refunded, 20 * 3300);
});

test('Program partnerski: zgłoszenie, zatwierdzenie tworzy unikalny kod z prowizją, odrzucenie', async () => {
  await assert.rejects(() => b2b.createPartnerApp({ name: 'Anna', email: 'a@b.pl', channel: 'kanał', terms: true }), /link/);
  const a1 = await b2b.createPartnerApp({ name: 'Anna Łąka', email: 'anna@example.test', channel: 'https://youtube.com/@anna', platform: 'YouTube', followers: '1200', terms: true });
  assert.equal(a1.terms.version, b2b.PARTNER_TERMS_VERSION); assert.ok(a1.terms.at);
  const a2 = await b2b.createPartnerApp({ name: 'Anna Inna', email: 'anna2@example.test', channel: 'https://tiktok.com/@a', terms: true });
  const r1 = await b2b.approvePartner(a1.id, { base: BASE }), r2 = await b2b.approvePartner(a2.id, { base: BASE });
  assert.equal(r1.code, 'ANNA10'); assert.equal(r2.code, 'ANNA102');
  const c = await codes.get('ANNA10');
  assert.equal(c.percent, 10); assert.equal(c.commission, 20); assert.equal(c.report.length, 32); assert.ok(!JSON.stringify(c).includes('anna@'), 'kod bez e-maila partnera');
  const a3 = await b2b.createPartnerApp({ name: 'X', email: 'x@example.test', channel: 'https://x.test', terms: true }).catch(() => null);
  assert.equal(a3, null, 'za krótka nazwa');
  const a4 = await b2b.createPartnerApp({ name: 'Ola', email: 'ola@example.test', channel: 'https://ig.test/ola', terms: true });
  assert.equal((await b2b.rejectPartner(a4.id)).status, 'rejected');
});

test('Strony: zamówienie, program partnerski, regulamin, raport bez danych osobowych, plakat PDF, API zamówienia i zgłoszeń', async () => {
  const app = express();
  b2b.b2bRoutes(app, { BASE_URL: BASE, demo: true });
  seoRoutes(app, BASE);
  app.use((_req, res) => res.sendStatus(404));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const get = async (p) => { const r = await fetch(U + p); return { status: r.status, text: await r.text(), type: r.headers.get('content-type'), robots: r.headers.get('x-robots-tag') }; };
  const post = async (p, b) => { const r = await fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); return { status: r.status, json: await r.json() }; };
  try {
    const order = await get('/dla-instytucji/zamow?pkg=pack3');
    assert.equal(order.status, 200); assert.match(order.text, /<option value="pack3" selected>/); assert.match(order.text, /<td>51 zł<\/td>/); assert.match(order.text, /src="\/b2b\.js"/);
    assert.match(order.text, /window\.__SSRPATH="\/dla-instytucji\/zamow"/); assert.match(order.text, /rel="canonical"/);
    const pp = await get('/program-partnerski'); assert.equal(pp.status, 200); assert.match(pp.text, /id="partnerForm"/);
    const reg = await get('/program-partnerski/regulamin'); assert.equal(reg.status, 200); assert.match(reg.text, /§8\. Zmiany Regulaminu/);
    const sm = (await get('/sitemap.xml')).text; for (const p of ['dla-instytucji/zamow', 'program-partnerski', 'program-partnerski/regulamin']) assert.ok(sm.includes(`${BASE}/${p}<`), p);
    assert.match((await get('/robots.txt')).text, /Disallow: \/raport\//);

    // Zamówienie z fakturą przez API → przekierowanie na stronę z kodem
    const r = await post('/api/b2b/order', body({ qty: 10, pkg: 'cv', email: 'zamow@example.test' }));
    assert.equal(r.status, 200); assert.match(r.json.redirect, /^\/dla-instytucji\/zamow\?b2b=B2B-[0-9A-F]{12}$/);
    const done = await get(r.json.redirect); assert.match(done.text, /Dziękujemy! Zamówienie przyjęte/); assert.match(done.text, /name="robots" content="noindex"/);
    assert.equal((await post('/api/b2b/order', body({ qty: 5 }))).status, 400);
    // Płatność online w trybie demo
    const d = await post('/api/b2b/order', body({ pay: 'now', qty: 12 })); assert.equal(d.status, 200);
    const id = d.json.redirect.split('=')[1], bd = await b2b.b2bOrders.get(id); assert.equal(bd.status, 'paid');

    // Raport instytucji: liczby, bez e-maila i nazwiska zamawiającego
    const c = await codes.get(bd.code), rep = await get(`/raport/${c.report}`);
    assert.equal(rep.status, 200); assert.match(rep.robots, /noindex/); assert.match(rep.text, /Wykorzystane kody/); assert.match(rep.text, /0 z 12/);
    const repSec = /<section class="page" id="page"[^>]*>([\s\S]*?)<\/section>/.exec(rep.text)[1];
    for (const pii of ['Anna Nowak', 'biuro@example.test', '1234563218']) assert.ok(!repSec.includes(pii), 'raport bez danych osobowych: ' + pii);
    assert.match(rep.text, /href="\/dla-instytucji\/zamow\?pkg=cv_letter">Dokup kody/);
    const pdf = await get(`/raport/${c.report}/plakat.pdf`); assert.equal(pdf.status, 200); assert.match(pdf.type, /pdf/); assert.ok(pdf.text.startsWith('%PDF'));
    assert.equal((pdf.text.match(/\/Type \/Page\b/g) || []).length, 1, 'plakat na jednej stronie A4');
    assert.equal((await get('/raport/' + 'x'.repeat(32))).status, 404);
    assert.equal((await get('/raport/krotki')).status, 404);

    // Raport partnera i numer rachunku
    const pc = await codes.get('ANNA10'), prep = await get(`/raport/${pc.report}`);
    assert.match(prep.text, /Twoja prowizja/); assert.match(prep.text, /id="bankForm"/);
    assert.equal((await post(`/api/b2b/report/${pc.report}/bank`, { bank: 'zle' })).status, 400);
    assert.equal((await post(`/api/b2b/report/${pc.report}/bank`, { bank: 'PL61 1090 1014 0000 0712 1981 2874, Anna Łąka' })).status, 200);
    assert.match((await codes.get('ANNA10')).bank, /^PL61/);

    // Zgłoszenie partnera przez API + pułapka na boty
    assert.equal((await post('/api/b2b/partner', { name: 'Kasia Test', email: 'k@example.test', channel: 'https://k.test', terms: true })).status, 200);
    const before = Object.keys(await b2b.partnerApps.all()).length;
    assert.equal((await post('/api/b2b/partner', { name: 'Bot Bot', email: 'b@example.test', channel: 'https://b.test', terms: true, website: 'spam' })).status, 200);
    assert.equal(Object.keys(await b2b.partnerApps.all()).length, before);
  } finally { srv.close(); }
});

test('Poranny e-mail: faktury instytucji po terminie', async () => {
  const o = await b2b.createB2bOrder(body({ org: 'Fundacja Spóźniona', qty: 10, pkg: 'cv' }));
  await b2b.fulfillB2b(o.id, { base: BASE });
  await b2b.b2bOrders.update(o.id, { due: Date.now() - 864e5 });
  const ops = await import('../lib/ops.js');
  const r = await ops.ownerDaily(BASE, new Date(), { force: true });
  assert.ok(r !== null);
});

test('Przegląd #15: równoległa realizacja daje jeden kod, jedną fakturę i jedną sprzedaż', async () => {
  const o = await b2b.createB2bOrder(body({ pay: 'now', qty: 20, pkg: 'cv', org: 'Wyścig Sp. z o.o.', email: 'race@example.test' }));
  const before = Object.keys(await codes.all()).length;
  const [a, b] = await Promise.all([
    b2b.fulfillB2b(o.id, { paid: true, provider: 'stripe', paymentIntent: 'pi_r', base: BASE }),
    b2b.fulfillB2b(o.id, { paid: true, provider: 'stripe', paymentIntent: 'pi_r', base: BASE }),
  ]);
  assert.equal(a.code, b.code);
  assert.equal(Object.keys(await codes.all()).length, before + 1, 'dokładnie jeden nowy kod');
  assert.equal(Object.values(await invoices.all()).filter((i) => i.id === o.id).length, 1);
  assert.equal((await b2b.b2bOrders.get(o.id)).fulfilling, null);
});

test('Przegląd #15: faktura z terminem tylko z poprawnym NIP, do 200 kodów, jedna nieopłacona na NIP/e-mail; reszta czeka na zatwierdzenie', async () => {
  assert.ok(b2b.nipValid('123-456-32-18')); assert.ok(!b2b.nipValid('1234563217')); assert.ok(!b2b.nipValid('123'));
  await assert.rejects(() => b2b.createB2bOrder(body({ nip: '', pay: 'invoice' })), /wymaga NIP/);
  await assert.rejects(() => b2b.createB2bOrder(body({ nip: '1234563217' })), /sumą kontrolną/);
  // bez NIP można zapłacić od razu
  assert.equal((await b2b.createB2bOrder(body({ nip: '', pay: 'now', email: 'bezNip@example.test' }))).status, 'new');
  const big = await b2b.createB2bOrder(body({ nip: '5260250274', email: 'duzo@example.test', qty: 201 }));
  assert.equal(big.status, 'approval'); assert.match(big.approvalReason, /200/);
  const nBefore = Object.keys(await codes.all()).length, iBefore = Object.keys(await invoices.all()).length;
  const first = await b2b.createB2bOrder(body({ nip: '7740001454', email: 'pierwsza@example.test', qty: 20 }));
  assert.equal(first.status, 'new'); await b2b.fulfillB2b(first.id, { base: BASE });
  const sameNip = await b2b.createB2bOrder(body({ nip: '7740001454', email: 'inna@example.test', qty: 20 }));
  const sameMail = await b2b.createB2bOrder(body({ nip: '5213017228', email: 'pierwsza@example.test', qty: 20 }));
  assert.equal(sameNip.status, 'approval'); assert.match(sameNip.approvalReason, /NIP/);
  assert.equal(sameMail.status, 'approval'); assert.match(sameMail.approvalReason, /e-mail/);
  assert.equal(Object.keys(await codes.all()).length, nBefore + 1, 'czekające zamówienia nie mają kodu');
  assert.equal(Object.keys(await invoices.all()).length, iBefore + 1, 'ani faktury');
  const ok = await b2b.approveB2b(big.id, { base: BASE });
  assert.equal(ok.status, 'unpaid'); assert.ok(ok.code); assert.ok(await invoices.get(big.id));
  assert.equal((await b2b.rejectB2b(sameNip.id)).status, 'rejected');
  await assert.rejects(() => b2b.approveB2b(sameNip.id), /nie czeka/);
  assert.equal((await b2b.fulfillB2b(sameNip.id, { base: BASE })).code, undefined, 'odrzucone nie dostaje kodu');
});

test('Przegląd #15: wyłączony kod nie przechodzi, korekta faktury w porannym e-mailu', async () => {
  const { codeDiscount } = await import('../lib/referral.js');
  const o = await b2b.createB2bOrder(body({ nip: '9542751368', email: 'korekta@example.test', qty: 10, pkg: 'cv' }));
  const b = await b2b.fulfillB2b(o.id, { base: BASE });
  assert.equal(codeDiscount(await codes.get(b.code), 'x@example.test').error, undefined);
  await b2b.deactivateB2b(o.id);
  const c = await codes.get(b.code);
  assert.equal(c.maxUses, 0); assert.match(codeDiscount(c, 'x@example.test').error, /nie jest już aktywny/);
});

test('Przegląd #15: jeden <h1> na stronach z serwera, pułapka na boty w zamówieniu', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: BASE, demo: true }); app.use((_q, res) => res.sendStatus(404));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const c = Object.values(await codes.all()).find((x) => x.report && x.voucher);
    for (const p of [`/raport/${c.report}`, '/dla-instytucji/zamow', '/program-partnerski']) {
      const html = (await (await fetch(U + p)).text()).replace(/<template[\s\S]*?<\/template>/g, '');
      assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${p}: jeden <h1>`);
      assert.match(html, /<p class="h1">/, `${p}: nagłówek strony głównej jako akapit`);
    }
    const r = await fetch(U + '/api/b2b/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body({ email: 'bot@example.test' }), website: 'http://spam' }) });
    assert.equal(r.status, 400);
    assert.ok(!Object.values(await b2b.b2bOrders.all()).some((b) => b.email === 'bot@example.test'));
  } finally { srv.close(); }
});
