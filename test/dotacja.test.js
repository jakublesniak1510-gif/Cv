import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// D5 (27.10): Dotacja z urzędu pracy – biznesplan 349 zł, wniosek + biznesplan 549 zł, /uslugi/dotacja-z-urzedu-pracy. Kreator (urząd,
// PKD, CV, wydatki, prognoza 12/24 mies., wzór wniosku z urzędu) → podgląd (rozmyta strona 1) → zakup → PDF/DOCX (+ pola wniosku)
// z tego samego wyniku; 3 poprawki w cenie. Kwoty tylko od klienta: tabele liczy kod, obce kwoty w tekście → „[założenie: …]”.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-gr-'));
const express = (await import('express')).default;
const JSZip = (await import('jszip')).default;
const G = await import('../lib/grant.js');
const { PRICES, orderPkgName } = await import('../lib/pricing.js');
const { invoiceLines } = await import('../lib/invoice.js');
const { legalBody } = await import('../lib/legal.js');
const { PRODUCTS, DIGITAL_WAIVER, productRoutes } = await import('../lib/products.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const docText = async (buf) => (await (await JSZip.loadAsync(buf)).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');

const IN = { variant: 'full', voiv: 'małopolskie', pup: 'Powiatowy Urząd Pracy w Krakowie', name: 'Anna Kowalska', city: 'Kraków',
  cvText: 'Anna Kowalska\nFryzjerka, Salon Bella, 2016 – 2024\nstrzyżenie, koloryzacja', idea: 'Mobilny salon fryzjerski: dojazd do klientek w domu, głównie osoby starsze i mamy z małymi dziećmi. Cena strzyżenia damskiego 90 zł.',
  pkd: '96.02.z, 47.91.Z', place: 'Kraków, dojazd do klienta', form: 'jdg', start: '2027-01', expenses: [{ item: 'Nożyczki i maszynki', amount: '3 500', why: 'Narzędzia' }, { item: 'Fotel składany', amount: '1200,50', why: 'Praca u klientki' }],
  requested: '4700,50', own: '', months: 24, revenue: { a: '3000', b: '6000', c: '' }, costs: [{ name: 'ZUS', monthly: '450' }, { name: 'Paliwo', monthly: '600' }],
  formText: 'WNIOSEK o przyznanie jednorazowo środków na podjęcie działalności gospodarczej\n1. Imię i nazwisko\n2. PESEL\n3. Rodzaj działalności\n4. Kwota\n5. Uzasadnienie\n'.repeat(3) };
const OUT = { title: 'Biznesplan – mobilny salon fryzjerski', sections: [
  { kind: 'summary', title: 'Streszczenie', text: 'Wnioskuję o 4 700,50 zł. Przychód w pierwszym roku wyniesie 99 000 zł.' },
  { kind: 'applicant', title: 'Wnioskodawca', text: 'Pracowałam jako fryzjerka.\n\n- strzyżenie' },
  { kind: 'business', title: 'Opis działalności', text: 'Strzyżenie za 90 zł, marża 35%.' },
  { kind: 'market', title: 'Rynek', text: 'Osoby starsze.' },
  { kind: 'expenses', title: 'Wydatki', text: 'Razem 4 700,50 zł.' },
  { kind: 'forecast', title: 'Prognoza', text: 'Koszty 1 050,00 zł miesięcznie, wynik roku 1: 50 400,00 zł, zysk 12 tys. zł.' },
  { kind: 'zle', title: 'SWOT', text: 'Mocne strony:\n- doświadczenie' }],
  fields: [{ label: '1. Imię i nazwisko', answer: 'Anna Kowalska' }, { label: '2. PESEL', answer: '[UZUPEŁNIJ: PESEL]' }, { label: '4. Kwota', answer: '4 700,50 zł' }, { label: '5. Uzasadnienie', answer: 'Dostanę 20 000 zł' }] };

test('Ceny 349/549 zł, nazwy, pozycje faktury, pliki wariantów', () => {
  assert.equal(PRICES.grantplan, 34900); assert.equal(PRICES.grantfull, 54900);
  assert.equal(orderPkgName({ product: 'grantplan' }), 'Biznesplan do dotacji'); assert.equal(orderPkgName({ product: 'grantfull' }), 'Wniosek + biznesplan do dotacji');
  assert.match(invoiceLines({ product: 'grantplan', total: 34900 })[0].name, /^Biznesplan do wniosku o dotację z urzędu pracy \(PDF i DOCX, 3 poprawki\)/);
  assert.equal(invoiceLines({ product: 'grantfull', total: 54900 })[0].value, 54900);
  assert.deepEqual(PRODUCTS.grantplan.files(), ['biznesplan.pdf', 'biznesplan.docx']); assert.deepEqual(PRODUCTS.grantfull.files(), ['biznesplan.pdf', 'biznesplan.docx', 'wniosek-pola.docx']);
  assert.equal(PRODUCTS.grantfull.page, '/uslugi/dotacja-z-urzedu-pracy');
});

test('Kreator: walidacja, kwoty z pól formularza, PKD, wzór wniosku wymagany w wariancie z wnioskiem', () => {
  const d = G.cleanGrant(IN);
  assert.deepEqual(d.pkd, ['96.02.Z', '47.91.Z']); assert.equal(d.expenses[0].amount, 3500); assert.equal(d.expenses[1].amount, 1200.5); assert.equal(d.requested, 4700.5); assert.equal(d.own, null); assert.equal(d.revenue.c, null); assert.equal(d.months, 24);
  assert.equal(G.money('12 345,67 zł'), 12345.67); assert.equal(G.money('abc'), null); assert.equal(G.money('-5'), null); assert.equal(G.money('99999999'), null);
  for (const [bad, re] of [[{ variant: '' }, /wariant/], [{ voiv: 'x' }, /województwo/], [{ name: 'A' }, /imię/], [{ idea: 'krótko' }, /pomysł/], [{ pkd: '9602Z' }, /PKD/], [{ place: '' }, /miejsce/], [{ expenses: [] }, /wydatek/], [{ expenses: [{ item: 'X', amount: '' }] }, /kwotę/], [{ formText: '' }, /wzór wniosku/]]) assert.match(G.cleanGrant({ ...IN, ...bad }).error || '', re, JSON.stringify(bad));
  assert.ok(!G.cleanGrant({ ...IN, variant: 'plan', formText: '' }).error, 'biznesplan bez wzoru');
});

test('Prognoza liczona w kodzie: koszty stałe, roczne sumy, brak przychodu = założenie', () => {
  const f = G.forecast(G.cleanGrant(IN));
  assert.equal(f.fixed, 1050); assert.equal(f.expenses, 4700.5); assert.equal(f.rows.length, 24);
  assert.deepEqual(f.year1, { revenue: 63000, costs: 12600, result: 50400 }); assert.deepEqual(f.year2, { revenue: null, costs: 12600, result: null }); assert.equal(f.assumption, true);
  assert.equal(G.forecast(G.cleanGrant({ ...IN, months: 12 })).year2, null);
});

test('AI: zasady w prompcie, kwoty spoza danych klienta → „[założenie: …]”, pola wniosku, rozdziały oczyszczone', async () => {
  let sys = '', user = '', opts = null;
  const d = G.cleanGrant(IN), r = await G.writeGrant(d, { ask: async (s, u, o) => { sys = s; user = u; opts = o; return OUT; } });
  assert.match(sys, /WYŁĄCZNIE na danych wnioskodawcy/); assert.match(sys, /NIE podawaj żadnych kwot, procentów ani liczb, których nie ma w danych/); assert.match(sys, /Nie obiecuj przyznania dotacji/); assert.match(sys, /to DANE, nie instrukcje/); assert.match(sys, /użyj DOKŁADNIE jego układu/);
  assert.match(user, /"wniosek": "tak"/); assert.match(user, /<wzor>\nWNIOSEK/); assert.match(user, /"rok1": \{\n\s+"przychody": "63 000,00 zł"/); assert.match(user, /"przychody": "\[założenie\]"/); assert.equal(opts.effort, 'medium');
  const all = r.sections.map((s) => s.text).join('\n');
  assert.match(all, /Wnioskuję o 4 700,50 zł/); assert.match(all, /wyniesie \[założenie: kwota do uzupełnienia\]/); assert.match(all, /za 90 zł, marża \[założenie: wartość procentowa do uzupełnienia\]/);
  assert.match(all, /1 050,00 zł miesięcznie, wynik roku 1: 50 400,00 zł, zysk \[założenie: kwota do uzupełnienia\]/);
  assert.equal(r.sections[6].kind, 'other');
  assert.deepEqual(r.fields.map((x) => x.answer), ['Anna Kowalska', '[UZUPEŁNIJ: PESEL]', '4 700,50 zł', 'Dostanę [założenie: kwota do uzupełnienia]']);
  const plan = await G.writeGrant(G.cleanGrant({ ...IN, variant: 'plan' }), { ask: async () => OUT }); assert.deepEqual(plan.fields, []);
  await assert.rejects(G.writeGrant(d, { ask: async () => ({ ...OUT, fields: [] }) }), /pól wniosku/);
  await assert.rejects(G.writeGrant(d, { ask: async () => ({ sections: OUT.sections.slice(0, 3) }) }), /Niepoprawna/);
  let ru = ''; const rv = await G.reviseGrant(d, r, 'Dopisz, że mam kurs barberski za 1500 zł.', { ask: async (_s, u) => { ru = u; return { ...OUT, sections: [...OUT.sections, { kind: 'other', title: 'Kursy', text: 'Kurs barberski za 1500 zł.' }] }; } });
  assert.match(ru, /<uwagi_klienta>\nDopisz/); assert.match(ru, /<poprzednia_wersja>/); assert.match(rv.sections.at(-1).text, /za 1500 zł/, 'kwota z uwag klienta dozwolona');
});

test('Dokumenty: PDF z tabelami i zastrzeżeniem, DOCX biznesplanu i pól wniosku, podgląd JPEG', async () => {
  const d = G.cleanGrant(IN), r = await G.writeGrant(d, { ask: async () => OUT });
  const pdf = await G.renderGrantPdf(d, r); assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  const docx = await docText(await G.renderGrantDocx(d, r));
  for (const t of ['Biznesplan – mobilny salon fryzjerski', 'Nie gwarantujemy przyznania dotacji', 'Nożyczki i maszynki', '4700,50 zł', 'Razem rok 1', '63 000,00 zł', 'założenie', 'Miesiąc']) assert.ok(docx.includes(t), t);
  const pola = await docText(await G.renderFieldsDocx(d, r)); assert.ok(pola.includes('2. PESEL') && pola.includes('[UZUPEŁNIJ: PESEL]') && pola.includes('Powiatowy Urząd Pracy w Krakowie'));
  const jpg = Buffer.from(await G.grantPreviewJpeg(d, r, { price: 549 })); assert.equal(jpg[0], 0xff); assert.equal(jpg[1], 0xd8);
  assert.equal(G.grantDownloadName(d, 'biznesplan.pdf'), 'Biznesplan_Anna_Kowalska.pdf'); assert.equal(G.grantDownloadName(d, 'wniosek-pola.docx'), 'Wniosek_pola_Anna_Kowalska.docx');
});

test('Podgląd: walidacja, oczekiwanie, limit 2 na IP, błąd nie zużywa limitu, bez AI – 503, odczyt pliku', async () => {
  const app = express(); app.set('trust proxy', true); app.use(express.json({ limit: '1mb' }));
  let fail = false, ai = true, calls = 0;
  G.grantRoutes(app, { enabled: () => ai, write: async (d) => { calls++; await wait(150); if (fail) throw new Error('x'); return G.cleanGrantResult(OUT, d, G.forecast(d)); }, png: async () => Buffer.from('jpg'), extract: async (b) => `tekst:${b.toString()}`, wait: 50, daily: () => 10, count: async () => {} });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const post = (b, ip = '1.1.1.1') => fetch(U + '/api/grant/preview', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(b) });
  try {
    assert.equal((await post({ ...IN, pkd: 'zle' })).status, 400);
    const j = await (await post(IN)).json(); assert.ok(j.pending && /^[0-9a-f]{32}$/.test(j.id));
    await wait(250);
    const r = await (await fetch(`${U}/api/grant/${j.id}`)).json();
    assert.equal(r.image, `data:image/jpeg;base64,${Buffer.from('jpg').toString('base64')}`); assert.equal(r.variant, 'full'); assert.deepEqual(r.sections.slice(0, 2), ['Streszczenie', 'Wnioskodawca']); assert.equal(r.fields[1], '2. PESEL');
    assert.ok(!JSON.stringify(r).includes('Wnioskuję') && !JSON.stringify(r).includes('UZUPEŁNIJ'), 'treść dokumentów nie trafia do przeglądarki przed płatnością');
    assert.equal((await G.grantDrafts.get(j.id)).input.name, 'Anna Kowalska');
    fail = true; const f = await (await post(IN)).json(); await wait(250); assert.equal((await fetch(`${U}/api/grant/${f.id}`)).status, 422); fail = false;
    await post(IN); assert.equal((await post(IN)).status, 429, 'limit 2 na IP (błąd się nie liczy)'); assert.equal(calls, 3);
    ai = false; assert.equal((await post(IN, '2.2.2.2')).status, 503);
    const x = await fetch(U + '/api/grant/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: Buffer.from('wzór').toString('base64') }) }).then((q) => q.json());
    assert.equal(x.text, 'tekst:wzór');
  } finally { srv.close(); }
});

test('Poprawki: 3 w cenie, licznik rośnie po udanej poprawce, nowe pliki e-mailem, nieudana nie zużywa', async () => {
  const orders = new Map(), mails = [];
  const d = G.cleanGrant(IN), result = G.cleanGrantResult(OUT, d, G.forecast(d));
  orders.set('o1', { id: 'o1', product: 'grantfull', status: 'done', profile: { email: 'a@b.pl' }, productData: { input: d, result, revisions: 0 } });
  const app = express(); app.use(express.json()); let fail = false;
  productRoutes(app, { BASE_URL: '', DEMO: true, getOrder: async (id) => orders.get(id), saveOrder: async () => {}, updateOrder: async (id, fn) => { const x = typeof fn === 'function' ? fn(orders.get(id)) : { ...orders.get(id), ...fn }; orders.set(id, x); return x; }, openPayment: async () => ({}), pickGateway: () => true, BAD_GATEWAY: '', cleanInvoice: () => null, WAIVER: '', closed: () => false, CLOSED_MSG: '', PayOpenError: Error,
    sendMail: async (o, files) => { mails.push(Object.keys(files)); }, revise: async (_d, prev, note) => { await wait(50); if (fail) throw new Error('x'); return { ...prev, sections: [...prev.sections, { kind: 'other', title: 'Poprawka', text: note }] }; } });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const rev = (note) => fetch(`${U}/api/products/o1/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
  const state = () => fetch(`${U}/api/products/o1`).then((r) => r.json());
  try {
    assert.equal((await rev('krótko')).status, 400);
    assert.equal((await rev('Dopisz kurs barberski.')).status, 200);
    assert.equal((await rev('Druga naraz.......')).status, 409, 'jedna poprawka naraz');
    const settle = async () => { for (let i = 0; i < 40; i++) { const x = await state(); if (!x.revising) return x; await wait(50); } };
    let s = await settle(); for (let i = 0; i < 20 && !mails.length; i++) await wait(50);
    assert.equal(s.revisionsLeft, 2); assert.equal(s.revising, false); assert.equal(s.sections.at(-1), 'Poprawka');
    assert.deepEqual(mails[0], ['Biznesplan_Anna_Kowalska.pdf', 'Biznesplan_Anna_Kowalska.docx', 'Wniosek_pola_Anna_Kowalska.docx']);
    fail = true; await rev('Ta się nie uda, bo AI.'); s = await settle();
    assert.equal(s.revisionsLeft, 2); assert.match(s.revError, /nie zużyliśmy poprawki/); fail = false;
    for (let i = 0; i < 2; i++) { await rev(`Poprawka numer ${i + 2} do zrobienia.`); await settle(); }
    s = await state(); assert.equal(s.revisionsLeft, 0);
    const last = await rev('Czwarta poprawka – za dużo.'); assert.equal(last.status, 400); assert.match((await last.json()).error, /wszystkie poprawki/);
    assert.equal(orders.get('o1').productData.history.length, 3);
  } finally { srv.close(); }
});

test('Strona i zakup: zgoda „bez gwarancji”, pliki dopiero po płatności (3 w wariancie z wnioskiem), sitemap, link w stopce', async () => {
  const port = 5600 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-gr-srv-')), id = 'd'.repeat(32), d = G.cleanGrant(IN);
  fs.writeFileSync(path.join(dir, 'grant-drafts.json'), JSON.stringify({ [id]: { id, at: Date.now(), input: d, result: G.cleanGrantResult(OUT, d, G.forecast(d)) } }));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, post = (p, b) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    for (let i = 0; i < 80; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const html = await fetch(U + '/uslugi/dotacja-z-urzedu-pracy').then((r) => r.text());
    assert.ok(html.includes('Biznesplan i wniosek o dotację z urzędu pracy – od 349 zł') && html.includes('Wniosek + biznesplan – 549 zł') && html.includes('src="/dotacja.js"') && html.includes(DIGITAL_WAIVER));
    assert.ok(html.includes('Nie gwarantujemy przyznania dotacji') && html.includes('id="grNoGuar"') && html.includes('id="grFormFile"') && html.includes('type="month" id="grStart"'));
    assert.match(html, /"@type":"FAQPage"/); assert.match(html, /href="\/uslugi\/dotacja-z-urzedu-pracy" data-pl>Dotacja z urzędu pracy</);
    assert.match(await fetch(U + '/sitemap.xml').then((r) => r.text()), /\/uslugi\/dotacja-z-urzedu-pracy</);
    assert.equal((await post('/api/grant/preview', IN)).status, 503, 'bez klucza AI');
    const buy = { id, email: 'Anna@Test.pl', terms: true, waiver: true };
    assert.equal((await post('/api/products/grant', { ...buy, noGuarantee: true, id: 'e'.repeat(32) })).status, 404);
    const ng = await post('/api/products/grant', buy); assert.equal(ng.status, 400); assert.match((await ng.json()).error, /nie gwarantujemy/);
    const o = await post('/api/products/grant', { ...buy, noGuarantee: true }).then((r) => r.json()); assert.ok(o.id && o.demo);
    assert.equal((await fetch(`${U}/api/products/${o.id}/biznesplan.pdf`)).status, 404, 'przed płatnością brak plików');
    await post(`/api/orders/${o.id}/demo-pay`, {});
    let st; for (let i = 0; i < 60 && st?.status !== 'done'; i++) { await wait(250); st = await fetch(`${U}/api/products/${o.id}`).then((r) => r.json()); }
    assert.equal(st.status, 'done'); assert.deepEqual(st.files, ['biznesplan.pdf', 'biznesplan.docx', 'wniosek-pola.docx']); assert.equal(st.revisionsLeft, 3);
    for (const [f, type, name] of [['biznesplan.pdf', 'application/pdf', 'Biznesplan_Anna_Kowalska.pdf'], ['wniosek-pola.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Wniosek_pola_Anna_Kowalska.docx']]) {
      const r = await fetch(`${U}/api/products/${o.id}/${f}`); assert.equal(r.status, 200, f); assert.equal(r.headers.get('content-type'), type); assert.match(r.headers.get('content-disposition'), new RegExp(name));
    }
    const saved = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === o.id);
    assert.equal(saved.product, 'grantfull'); assert.equal(saved.total, 54900); assert.ok(saved.productData.noGuaranteeAt); assert.equal(saved.productData.input.pup, 'Powiatowy Urząd Pracy w Krakowie');
  } finally { srv.kill(); }
});

test('Regulamin i polityka prywatności (4 języki, 27.10.2026), skrypt kreatora, tłumaczenia', () => {
  for (const [l, re, hist] of [
    ['pl', /„Dotacja z urzędu pracy” to przygotowanie[\s\S]*Wszystkie kwoty w dokumentach pochodzą od Klienta[\s\S]*do 3 poprawek[\s\S]*nie gwarantuje przyznania środków[\s\S]*Dotacja z urzędu pracy \(§2 ust\. 10\): biznesplan – 349 zł, wniosek z biznesplanem – 549 zł\./, /Historia zmian: (?:[^;]*; )*27 października 2026 r\. – „Dotacja z urzędu pracy” \(§2 ust\. 10, §4 ust\. 1\);/],
    ['en', /“Labour office start-up grant” is the preparation[\s\S]*does not guarantee that funds will be granted[\s\S]*\(§2\(10\)\): business plan – PLN 349, application with business plan – PLN 549\./, /Change history: (?:[^;]*; )*27 October 2026 – “Labour office start-up grant”/],
    ['de', /„Zuschuss vom Arbeitsamt“ ist die[\s\S]*garantiert keine Bewilligung[\s\S]*\(§2 Abs\. 10\): Businessplan – 349 PLN, Antrag mit Businessplan – 549 PLN\./, /Änderungshistorie: (?:[^;]*; )*27\. Oktober 2026 – „Zuschuss vom Arbeitsamt“/],
    ['uk', /«Дотація від центру зайнятості» – це підготовка[\s\S]*не гарантує надання коштів[\s\S]*\(§2 п\. 10\): бізнес-план – 349 zł, заява з бізнес-планом – 549 zł\./, /Історія змін: (?:[^;]*; )*27 жовтня 2026 р\. – «Дотація від центру зайнятості»/]]) {
    const b = legalBody('regulamin', l); assert.match(b, re, l); assert.match(b, hist, l);
  }
  for (const [l, re] of [['pl', /dokumenty do dotacji z urzędu pracy[\s\S]*dostawcy narzędzi AI \(Anthropic\)[\s\S]*48 godzin/], ['en', /labour office start-up grant[\s\S]*48 hours/], ['de', /Zuschuss vom Arbeitsamt[\s\S]*48 Stunden/], ['uk', /дотації від центру зайнятості[\s\S]*48 годин/]]) assert.match(legalBody('prywatnosc', l), re, l);
  const js = read('public/dotacja.js');
  assert.match(js, /fetch\('\/api\/grant\/preview'/); assert.match(js, /fetch\('\/api\/grant\/extract'/); assert.match(js, /fetch\('\/api\/products\/grant'/); assert.match(js, /noGuarantee: true/); assert.match(js, /\/revise`/);
  for (const l of ['en', 'de', 'uk']) {
    const dd = JSON.parse(read(`public/i18n/${l}.json`));
    for (const k of ['Rozdziały biznesplanu', 'Pola wniosku, które wypełniliśmy', 'Zaznacz wszystkie trzy zgody, żeby kupić dokumenty.', 'Wykorzystano wszystkie poprawki w cenie.', 'Dotacja z urzędu pracy', 'Biznesplan (PDF)']) assert.ok(dd[k], `${l}: ${k}`);
  }
});
