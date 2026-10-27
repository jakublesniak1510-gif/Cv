import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// D8 (27.10): Selekcja CV dla małych firm – 49 zł do 20 CV, 89 zł do 50 CV, za flagą SELECTION_ENABLED (domyślnie wyłączona).
// Tabela wymagań (tak/częściowo/nie + cytat z CV), bez rankingu, dane o cechach chronionych usunięte. „To narzędzie pomocnicze.
// Decyzję o kandydatach podejmuje człowiek.” Umowa powierzenia (art. 28 RODO) akceptowana przy zakupie (wersja i data). 7 dni.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-sel-'));
delete process.env.SELECTION_ENABLED;
const S = await import('../lib/selection.js');
const { PRICES, orderPkgName } = await import('../lib/pricing.js');
const { invoiceLines } = await import('../lib/invoice.js');
const { legalBody } = await import('../lib/legal.js');
const { PRODUCTS, selectionToPurge, selectionPurge } = await import('../lib/products.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CV = 'Anna Nowak\nData urodzenia: 12.03.1990\nPESEL 90031212345\nStan cywilny: zamężna, mam dwoje dzieci\nObywatelstwo: polskie\nMagazynier, Firma X, 2019–2024\nObsługa wózka widłowego, uprawnienia UDT\nPrawo jazdy kat. B\nOrientacja w terenie, przenoszenie obciążeń';
const REQ = [{ text: 'Uprawnienia UDT na wózek widłowy', must: true }, { text: 'Prawo jazdy kat. B', must: true }, { text: 'Znajomość SAP', must: false }];
const spawnSrv = (dir, port, extra = {}) => spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1', ...extra }, stdio: 'ignore' });
const up = async (U) => { for (let i = 0; i < 200; i++) { try { await fetch(U + '/api/config'); return; } catch { await wait(150); } } throw new Error('Serwer nie wystartował w 30 s'); };

test('Ceny 49/89 zł, nazwy, faktura, limity wariantów', () => {
  assert.equal(PRICES.selection20, 4900); assert.equal(PRICES.selection50, 8900);
  assert.equal(orderPkgName({ product: 'selection50' }), 'Selekcja CV (do 50 CV)');
  assert.match(invoiceLines({ product: 'selection20', total: 4900 })[0].name, /do 20 CV – narzędzie pomocnicze/);
  assert.equal(PRODUCTS.selection20.limit, 20); assert.equal(PRODUCTS.selection50.limit, 50); assert.deepEqual(PRODUCTS.selection20.files(), ['selekcja.pdf', 'selekcja.csv']);
  assert.equal(S.SEL_HEADER, 'To narzędzie pomocnicze. Decyzję o kandydatach podejmuje człowiek.');
});

test('Cechy chronione: usuwane z CV i z wymagań; treść zawodowa zostaje', async () => {
  const r = S.redactProtected(CV);
  for (const t of ['12.03.1990', '90031212345', 'zamężna', 'dzieci', 'Obywatelstwo']) assert.ok(!r.includes(t), t);
  for (const t of ['Anna Nowak', 'uprawnienia UDT', 'Prawo jazdy kat. B', 'Orientacja w terenie, przenoszenie obciążeń']) assert.ok(r.includes(t), t);
  assert.deepEqual(S.cleanRequirements(['Wiek do 35 lat', { text: 'Kobieta', must: false }, 'Prawo jazdy B', 'Prawo jazdy b', 'Dobra aparycja', 'Praca z młodzieżą']).map((x) => x.text), ['Prawo jazdy B', 'Praca z młodzieżą']);
  let sys = ''; const x = await S.extractRequirements('x'.repeat(200), { ask: async (s) => { sys = s; return { position: 'Magazynier', requirements: [{ text: 'Wózek widłowy', must: true }, { text: 'Mężczyzna do 40 lat' }, { text: 'SAP', must: false }], excluded: [] }; } });
  assert.match(sys, /cech chronionych/); assert.deepEqual(x.requirements.map((q) => q.text), ['Wózek widłowy', 'SAP']); assert.equal(x.excluded[0].text, 'Mężczyzna do 40 lat');
});

test('Analiza CV: status tak/częściowo/nie, cytat tylko dosłowny z CV, bez danych chronionych; brak rankingu i sum', async () => {
  const cv = S.redactProtected(CV); let sys = '';
  const cells = await S.analyzeCv(REQ, cv, { ask: async (s) => { sys = s; return { rows: [{ i: 0, status: 'tak', quote: '„Obsługa wózka widłowego,  uprawnienia UDT”' }, { i: 1, status: 'częściowo', quote: 'Prawo jazdy kat. C+E' }, { i: 2, status: 'super', quote: 'SAP' }] }; } });
  assert.match(sys, /Nie oceniasz człowieka i nie porównujesz kandydatów/); assert.match(sys, /Bez ocen, punktów, rankingu/);
  assert.deepEqual(cells, [{ status: 'tak', quote: 'Obsługa wózka widłowego, uprawnienia UDT' }, { status: 'częściowo', quote: '' }, { status: 'nie', quote: '' }]);
  assert.equal(S.cleanCvResult({ rows: [{ i: 0, status: 'tak', quote: 'Data urodzenia: 12.03.1990' }] }, REQ.slice(0, 1), CV)[0].quote, '', 'cytat z danymi chronionymi usunięty');
  let busy = 0, max = 0;
  const rows = await S.analyzeAll(REQ, Array.from({ length: 9 }, (_, i) => ({ name: `cv${i}.pdf`, text: cv })), { analyze: async () => { busy++; max = Math.max(max, busy); await wait(20); busy--; if (max && busy === 3) throw new Error('x'); return REQ.map(() => ({ status: 'nie', quote: '' })); } });
  assert.equal(rows.length, 9); assert.ok(max <= 4, 'najwyżej 4 naraz'); assert.deepEqual(rows.map((r) => r.name), Array.from({ length: 9 }, (_, i) => `cv${i}.pdf`), 'kolejność wgrania');
  const csv = S.selectionCsv(REQ, [{ name: 'a.pdf', cells: [{ status: 'tak', quote: 'UDT' }, { status: 'nie', quote: '' }, { status: 'częściowo', quote: '' }] }, { name: 'b.pdf', error: 'Nie udało się.' }]);
  assert.ok(csv.startsWith('﻿"To narzędzie pomocnicze.')); assert.match(csv, /"Kandydat 1 \(a\.pdf\)";"tak – „UDT”";"nie";"częściowo"/); assert.ok(!/ranking|punkt|wynik/i.test(csv.split('\n')[1]), 'bez kolumny wyniku');
  const pdf = await S.selectionPdf(REQ, [{ name: 'a.pdf', cells: [{ status: 'tak', quote: 'UDT' }, { status: 'nie', quote: '' }, { status: 'częściowo', quote: '' }] }], 'Magazynier');
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
});

test('Flaga wyłączona (domyślnie): strona, API, umowa powierzenia i wpisy w regulaminie niewidoczne', async () => {
  for (const l of ['pl', 'en', 'de', 'uk']) { assert.ok(!/§2 ust\. 13|§2\(13\)|§2 Abs\. 13|§2 п\. 13/.test(legalBody('regulamin', l)), l); assert.ok(!legalBody('regulamin', l).includes('<!--sel')); }
  assert.ok(!/Selekcja CV:|CV screening:|Lebenslauf-Vorauswahl:|Відбір резюме:/.test(['pl', 'en', 'de', 'uk'].map((l) => legalBody('prywatnosc', l)).join('')));
  const port = 6600 + Math.floor(Math.random() * 200), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-sel-off-')), srv = spawnSrv(dir, port, { SELECTION_ENABLED: '' });
  try {
    const U = `http://localhost:${port}`; await up(U);
    for (const p of ['/dla-firm/selekcja-cv', '/regulamin/umowa-powierzenia', '/legal/powierzenie.html']) assert.equal((await fetch(U + p)).status, 404, p);
    for (const p of ['/api/selection/requirements', '/api/products/selection']) assert.equal((await fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 404, p);
    assert.ok(!(await fetch(U + '/sitemap.xml').then((r) => r.text())).includes('selekcja-cv'));
    assert.ok(!(await fetch(U + '/legal/regulamin.html').then((r) => r.text())).includes('Selekcja CV'));
  } finally { srv.kill(); }
});

test('Flaga włączona: strona z nagłówkiem, umowa powierzenia, wgrywanie CV (tekst bez danych chronionych), zakup z NIP i umową, tabela, pliki', async () => {
  const port = 6800 + Math.floor(Math.random() * 200), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-sel-on-')), id = 'a'.repeat(32);
  fs.writeFileSync(path.join(dir, 'selection-drafts.json'), JSON.stringify({ [id]: { id, at: Date.now(), position: 'Magazynier', requirements: REQ, excluded: [], cvs: [] } }));
  const srv = spawnSrv(dir, port, { SELECTION_ENABLED: '1' });
  try {
    const U = `http://localhost:${port}`, post = (p, b) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, j: await r.json() })); await up(U);
    const html = await fetch(U + '/dla-firm/selekcja-cv').then((r) => r.text());
    assert.ok(html.includes('To narzędzie pomocnicze. Decyzję o kandydatach podejmuje człowiek.') && html.includes('src="/selekcja.js"') && html.includes('id="selDpa"') && html.includes('wersja 2026-10-27') && html.includes('Do 50 CV – 89 zł'));
    const dpa = await fetch(U + '/regulamin/umowa-powierzenia').then((r) => r.text());
    assert.match(dpa, /art\. 28/); assert.match(dpa, /Wersja 2026-10-27/); assert.match(dpa, /nie są wykorzystywane do trenowania modeli AI/); assert.match(dpa, /English \(translation\)/);
    assert.match(await fetch(U + '/sitemap.xml').then((r) => r.text()), /\/dla-firm\/selekcja-cv</);
    assert.equal((await post('/api/selection/requirements', { ad: 'x'.repeat(200) })).status, 503, 'bez klucza AI');
    const u1 = await post(`/api/selection/${id}/cv`, { name: 'anna<>.txt', data: Buffer.from(CV).toString('base64') });
    assert.equal(u1.status, 200); assert.deepEqual(u1.j.names, ['anna__.txt']);
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'selection-drafts.json'), 'utf8'))[id].cvs[0].text;
    assert.ok(!saved.includes('12.03.1990') && !saved.includes('90031212345') && saved.includes('uprawnienia UDT'), 'zapisany tylko tekst bez danych chronionych');
    for (let i = 0; i < 20; i++) await post(`/api/selection/${id}/cv`, { name: `cv${i}.txt`, data: Buffer.from(CV).toString('base64') });
    const buy = { id, variant: 20, requirements: REQ, email: 'hr@firma.pl', terms: true, waiver: true, dpa: true, invoice: { name: 'Firma Sp. z o.o.', address: 'ul. Testowa 1, Kraków', nip: '1234563218' } };
    assert.match((await post('/api/products/selection', buy)).j.error, /21 CV/);
    const del = await fetch(`${U}/api/selection/${id}/cv/20`, { method: 'DELETE' }).then((r) => r.json()); assert.equal(del.count, 20);
    assert.match((await post('/api/products/selection', { ...buy, dpa: false })).j.error, /umowę powierzenia/);
    assert.match((await post('/api/products/selection', { ...buy, invoice: { ...buy.invoice, nip: '' } })).j.error, /NIP/);
    assert.match((await post('/api/products/selection', { ...buy, requirements: ['Wiek do 30 lat'] })).j.error, /wymaganie/);
    const o = await post('/api/products/selection', buy); assert.equal(o.status, 200); assert.ok(o.j.demo);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'selection-drafts.json'), 'utf8'))[id], undefined, 'wersja robocza usunięta po zamówieniu');
    await post(`/api/orders/${o.j.id}/demo-pay`, {});
    let st; for (let i = 0; i < 60 && st?.status !== 'done'; i++) { await wait(250); st = await fetch(`${U}/api/products/${o.j.id}`).then((r) => r.json()); }
    assert.equal(st.status, 'done'); assert.equal(st.selection.rows.length, 20); assert.deepEqual(st.files, ['selekcja.pdf', 'selekcja.csv']);
    assert.match(st.selection.rows[0].error, /Nie udało się/, 'bez klucza AI: wiersz z informacją, bez wyników');
    for (const f of ['selekcja.pdf', 'selekcja.csv']) assert.equal((await fetch(`${U}/api/products/${o.j.id}/${f}`)).status, 200, f);
    const ord = Object.values(JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'))).find((x) => x.id === o.j.id);
    assert.equal(ord.total, 4900); assert.equal(ord.productData.dpa.version, '2026-10-27'); assert.ok(ord.productData.dpa.at); assert.equal(ord.invoice.nip, '1234563218');
    // Po 7 dniach: teksty CV i wyniki znikają, zostaje zamówienie.
    assert.equal(selectionToPurge(ord), false); assert.equal(selectionToPurge(ord, ord.paidAt + 7 * 864e5 + 1), true);
    const p = selectionPurge(ord); assert.equal(p.productData.cvs, undefined); assert.equal(p.productData.rows, undefined); assert.equal(p.productData.count, 20); assert.equal(p.productData.dpa.version, '2026-10-27');
  } finally { srv.kill(); }
});

test('Regulamin i polityka prywatności przy włączonej fladze (4 języki, 27.10.2026), skrypt, tłumaczenia', () => {
  process.env.SELECTION_ENABLED = '1';
  try {
    for (const [l, re, hist] of [
      ['pl', /„Selekcja CV” to narzędzie pomocnicze[\s\S]*nie tworzy rankingu[\s\S]*decyzję o kandydatach podejmuje człowiek[\s\S]*Załącznik nr 1 do Regulaminu \(art\. 28 RODO\)[\s\S]*po 7 dniach[\s\S]*Selekcja CV \(§2 ust\. 13\): do 20 CV – 49 zł, do 50 CV – 89 zł\./, /Historia zmian: (?:[^;]*; )*27 października 2026 r\. – „Selekcja CV” i Załącznik nr 1/],
      ['en', /“CV screening” is a support tool[\s\S]*Annex 1[\s\S]*CV screening \(§2\(13\)\): up to 20 CVs – PLN 49, up to 50 CVs – PLN 89\./, /Change history: (?:[^;]*; )*27 October 2026 – “CV screening”/],
      ['de', /„Lebenslauf-Vorauswahl“ ist ein Hilfswerkzeug[\s\S]*Anhang 1[\s\S]*bis zu 50 – 89 PLN\./, /Änderungshistorie: (?:[^;]*; )*27\. Oktober 2026 – „Lebenslauf-Vorauswahl“/],
      ['uk', /«Відбір резюме» – це допоміжний інструмент[\s\S]*Додатком 1[\s\S]*до 50 резюме – 89 zł\./, /Історія змін: (?:[^;]*; )*27 жовтня 2026 р\. – «Відбір резюме»/]]) {
      const b = legalBody('regulamin', l); assert.match(b, re, l); assert.match(b, hist, l);
    }
    for (const [l, re] of [['pl', /Selekcja CV: dane kandydatów[\s\S]*podmiot przetwarzający[\s\S]*po 7 dniach/], ['en', /CV screening: we process[\s\S]*7 days/], ['de', /Lebenslauf-Vorauswahl: Bewerberdaten[\s\S]*7 Tage/], ['uk', /Відбір резюме: дані кандидатів[\s\S]*7 днів/]]) assert.match(legalBody('prywatnosc', l), re, l);
    for (const l of ['pl', 'en', 'de', 'uk']) assert.match(legalBody('powierzenie', l), /2026-10-27/, `umowa powierzenia ${l}`);
  } finally { delete process.env.SELECTION_ENABLED; }
  const js = read('public/selekcja.js');
  assert.match(js, /fetch\('\/api\/selection\/requirements'/); assert.match(js, /dpa: true/); assert.ok(!/sort\(/.test(js), 'bez sortowania kandydatów');
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['To narzędzie pomocnicze. Decyzję o kandydatach podejmuje człowiek.', 'Pominięte (nie sprawdzamy cech chronionych):', 'Zamów tabelę', 'częściowo']) assert.ok(d[k], `${l}: ${k}`); }
});
