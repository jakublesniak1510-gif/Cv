import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-agencja-'));
const express = (await import('express')).default;
const b2b = await import('../lib/b2b.js');
const { seoRoutes } = await import('../lib/seo.js');
const { SEGMENTS, segmentOf, offerMail } = await import('../lib/b2b-templates.js');
const { letterText } = await import('../lib/letters.js');
const { csvTemplate, CSV_TEMPLATE_COLS, importContacts, parseCsv, contacts } = await import('../lib/crm.js');
const { B2B_TIERS, b2bTable } = await import('../lib/pricing.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// PR Z: /dla-agencji (agencje pracy tymczasowej), segment „agencja” w mini-CRM, szablon CSV z kolumną „zrodlo” – bez danych agencji.
test('Strona /dla-agencji: ceny z progów B2B, formularz zapytania, bez obietnic; sitemap; link z „Dla firm”', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: 'https://example.test', demo: true }); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/dla-agencji`)).text();
    assert.match(h, /<h1>CV pod ogłoszenie dla kandydatów agencji pracy<\/h1>/); assert.match(h, /id="agencyForm"/); assert.match(h, /src="\/b2b\.js"/);
    for (const t of b2b.AGENCY_TYPES) assert.ok(h.includes(`<option>${t}</option>`), t);
    const t = b2bTable();
    for (const [i, tier] of B2B_TIERS.entries()) assert.ok(h.includes(`<b>${t.cv_letter[i]} zł</b> za kod`), `próg ${tier.min}`);
    assert.doesNotMatch(h, /najlepsz|gwarant|<s>|<del>|\d+ ?% (kandydatów|agencji|rekruterów)/i, 'bez obietnic i liczb bez źródła');
    assert.match(h, /href="\/dla-instytucji\/zamow"/); assert.match(h, /href="\/oferta-dla-instytucji\.pdf"/);
    assert.ok((await (await fetch(`${U}/sitemap.xml`)).text()).includes('https://example.test/dla-agencji<'));
  } finally { srv.close(); }
  assert.match(read('public/index.html'), /href="\/dla-agencji">Dla agencji pracy<\/a>/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Dla agencji pracy'], l);
  const js = read('public/b2b.js');
  assert.match(js, /wire\(agency, '\/api\/b2b'/); assert.match(js, /formData\.set\('msg', `\[\$\{e\.formData\.get\('orgType'\)\}\]/, 'rodzaj agencji w treści zapytania (Panel → Firmy)');
});

test('Segment „agencja”: rozpoznanie z CSV, e-mail z ofertą (po zgodzie) i list papierowy z /dla-agencji', () => {
  assert.ok(SEGMENTS.agencja);
  for (const s of ['agencja', 'Agencja pracy tymczasowej', 'agencja rekrutacyjna', 'doradztwo personalne']) assert.equal(segmentOf(s), 'agencja', s);
  assert.equal(segmentOf('urząd pracy'), 'urzad_ngo'); assert.equal(segmentOf('uczelnia'), 'uczelnia');
  const m = offerMail('agencja', { org: 'Praca Tymczasowa Test sp. z o.o.' }, { unsubscribe: 'https://example.test/b2b/wypisz?t=x' });
  assert.match(m.subject, /Praca Tymczasowa Test/); assert.match(m.text, /cvpodogloszenie\.pl\/dla-agencji/); assert.match(m.text, /b2b\/wypisz/);
  assert.doesNotMatch(m.text, /najlepsz|gwarant|\[(NAZWA|KOD)\]/);
  const a = letterText({ segment: 'agencja' });
  assert.match(a, /Dla kandydatów Państwa agencji/); assert.match(a, /cvpodogloszenie\.pl\/dla-agencji/); assert.doesNotMatch(a, /scenariusz zajęć/);
  assert.match(letterText({ segment: 'szkola' }), /cvpodogloszenie\.pl\/dla-doradcow.*\n?/); assert.match(letterText({ segment: 'szkola' }), /scenariusz zajęć/);
});

test('Szablon CSV: nagłówek importu + zrodlo, instrukcja w wierszach #, bez danych; import pomija # i liczy wiersze bez źródła', async () => {
  const csv = csvTemplate(), lines = csv.replace(/^﻿/, '').trim().split('\r\n');
  assert.equal(lines[0], CSV_TEMPLATE_COLS.join(';')); assert.ok(CSV_TEMPLATE_COLS.includes('zrodlo'));
  assert.ok(lines.slice(1).every((l) => l.startsWith('# ')), 'tylko instrukcja, bez wierszy z danymi');
  assert.match(csv, /KRS/); assert.match(csv, /agencja/); assert.match(csv, /art\. 398/); assert.doesNotMatch(csv, /@[a-z]+\.[a-z]/i, 'bez adresów e-mail');
  assert.deepEqual(parseCsv(csv), []);
  const r = await importContacts(`${csv}agencja;Agencja A;Łódź;biuro;biuro@a.test;ogólny;;;KRS 0000000001 + https://a.test;;;;;\r\nagencja;Agencja B;Łódź;biuro;biuro@b.test;ogólny;;;;;;;;\r\n`);
  assert.equal(r.added, 2); assert.equal(r.noSource, 1); assert.equal(r.invalid, 0, 'wiersze instrukcji nie są liczone jako błędne');
  const all = Object.values(await contacts.all());
  assert.equal(all.find((c) => c.org === 'Agencja A').segment, 'agencja'); assert.match(all.find((c) => c.org === 'Agencja A').source, /^KRS/);
  const app = express(), api = express.Router(); b2b.b2bAdmin(api, { BASE_URL: 'https://example.test' }); app.use('/api/admin', api);
  const srv = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${srv.address().port}/api/admin/contacts/szablon.csv`);
    assert.match(res.headers.get('content-type'), /text\/csv/); assert.match(res.headers.get('content-disposition'), /kontakty-szablon\.csv/);
    assert.equal(Buffer.from(await res.arrayBuffer()).toString('utf8'), csv, 'z BOM (Excel)');
  } finally { srv.close(); }
  assert.match(read('public/admin.html'), /href="\/api\/admin\/contacts\/szablon\.csv"/); assert.match(read('public/admin.js'), /Bez źródła danych/);
});
