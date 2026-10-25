import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-qa-')); process.env.SMTP_URL = 'json';
const express = (await import('express')).default;
const { seoRoutes } = await import('../lib/seo.js');
const { QA_SEED, readerQaAdmin } = await import('../lib/reader-qa.js');
const { sendOrderMail } = await import('../lib/mail.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const PROMISE = /gwarant|najlepsz|na pewno|\d+\s?%/i;

// PR X: „Pytania czytelników” – 10 pytań redakcji, nowe z panelu (szkic → publikacja, bez danych osobowych), strona z FAQPage.
test('10 pytań redakcji: krótkie, bez obietnic i danych osób', () => {
  assert.equal(QA_SEED.length, 10);
  for (const x of QA_SEED) { assert.ok(x.q.endsWith('?') && x.a.length <= 320, x.q); assert.doesNotMatch(x.q + x.a, PROMISE); assert.doesNotMatch(x.q + x.a, /@|\d{3}[\s-]?\d{3}/); }
});

test('Panel: szkic niewidoczny, publikacja na górze listy, odrzucenie e-maili i telefonów; strona, FAQPage, hub, sitemap', async () => {
  const app = express(), api = express.Router(); api.use(express.json()); readerQaAdmin(api); app.use('/api/admin', api); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, H = { 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(`${U}/api/admin/reader-qa`, { method: 'POST', headers: H, body: JSON.stringify({ q: 'Pisze Jan, mail jan@x.pl – co z CV?', a: 'Odpowiedź wystarczająco długa do zapisania.' }) })).status, 400);
    const d = await (await fetch(`${U}/api/admin/reader-qa`, { method: 'POST', headers: H, body: JSON.stringify({ q: 'Czy w CV wpisać wolontariat?', a: 'Tak, jeśli ma związek z ogłoszeniem – opisz go jak pracę.' }) })).json();
    assert.equal(d.status, 'draft');
    let h = await (await fetch(`${U}/poradnik/pytania-czytelnikow`)).text();
    assert.ok(!h.includes('wpisać wolontariat'), 'szkic niewidoczny'); assert.ok(h.includes(`<summary>${QA_SEED[0].q}</summary>`));
    await fetch(`${U}/api/admin/reader-qa/${d.id}`, { method: 'POST', headers: H, body: JSON.stringify({ status: 'published' }) });
    h = await (await fetch(`${U}/poradnik/pytania-czytelnikow`)).text();
    assert.ok(h.indexOf('wpisać wolontariat') < h.indexOf(QA_SEED[0].q), 'opublikowane nad pytaniami redakcji');
    const ld = [...h.matchAll(/<script[^>]*type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'FAQPage');
    assert.equal(ld.mainEntity.length, 11); assert.match(h, /href="\/kontakt">Zadaj pytanie/);
    assert.match(await (await fetch(`${U}/poradnik`)).text(), /<h2>Pytania czytelników<\/h2>/);
    assert.ok((await (await fetch(`${U}/sitemap.xml`)).text()).includes('https://example.test/poradnik/pytania-czytelnikow<'));
    assert.match(await (await fetch(`${U}/poradnik/czym-jest-ats`)).text(), /<h1>/, 'zwykłe poradniki działają dalej');
  } finally { srv.close(); }
});

test('Mail z CV: stopka „Masz pytanie o CV?” z linkiem do kontaktu; formularz ma temat „Pytanie o CV do poradnika”', async () => {
  const cv = { name: 'Jan', headline: '', contact: [], summary: '', experience: [], education: [], skills: [] };
  const m = JSON.parse((await sendOrderMail({ id: 'abc', pkg: 'cv', addons: {}, profile: { name: 'Jan', email: 'j@x.pl' }, results: [{ position: 'Kasjer', lang: 'pl', letter: '', cv }], uiLang: 'pl' }, 'https://x.pl')).message);
  assert.match(m.text, /Masz pytanie o CV\? Napisz, odpowiemy w poradniku: https:\/\/x\.pl\/kontakt\n\nPowodzenia/); assert.match(m.html, /href="https:\/\/x\.pl\/kontakt"/);
  assert.match(read('public/index.html'), /<option>Pytanie o CV do poradnika<\/option>/);
  assert.match(read('public/admin.js'), /m\.topic === 'Pytanie o CV do poradnika' \? el\('button'/);
});
