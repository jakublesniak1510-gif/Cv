import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

process.env.SMTP_URL = 'json';
const { cvToText } = await import('../lib/cv-text.js');
const { sendOrderMail } = await import('../lib/mail.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const cv = { name: 'Jan Kowalski', headline: 'Magazynier', contact: ['500 600 700', 'jan@x.pl'], summary: 'Magazynier z doświadczeniem.', experience: [{ title: 'Magazynier', company: 'ABC', period: '2019–2024', bullets: ['Obsługa wózka', 'Inwentaryzacja'] }, { title: 'Kasjer', company: 'XYZ', period: '2017–2019', bullets: [] }], education: [{ school: 'ZSZ', degree: 'Technik logistyk', period: '2013–2017' }], skills: ['WMS', 'wózek widłowy'], languages: ['angielski B1'], certificates: [], interests: '', clause: 'Wyrażam zgodę.' };

// PR Q: wersja ATS .txt – czysty tekst CV (sekcje, bez tabel) w mailu i do pobrania, bez dopłaty; regulamin w 4 językach.
test('cvToText: standardowe sekcje w języku CV, myślniki, puste sekcje pominięte, CRLF, bez tabulatorów', () => {
  const t = cvToText({ lang: 'pl', cv });
  assert.match(t, /^JAN KOWALSKI\r\nMagazynier\r\n500 600 700 \| jan@x\.pl\r\n\r\nPROFIL ZAWODOWY\r\n/);
  assert.match(t, /DOŚWIADCZENIE ZAWODOWE\r\nMagazynier, ABC \(2019–2024\)\r\n- Obsługa wózka\r\n- Inwentaryzacja\r\n\r\nKasjer, XYZ \(2017–2019\)\r\n/);
  assert.match(t, /WYKSZTAŁCENIE\r\nTechnik logistyk, ZSZ \(2013–2017\)/); assert.match(t, /UMIEJĘTNOŚCI\r\nWMS, wózek widłowy/);
  assert.doesNotMatch(t, /CERTYFIKATY|ZAINTERESOWANIA|\t|\|\s*\|/); assert.ok(t.endsWith('Wyrażam zgodę.\r\n'));
  assert.match(cvToText({ lang: 'en', cv }), /\r\nWORK EXPERIENCE\r\n/); assert.match(cvToText({ lang: 'uk', cv }), /\r\nДОСВІД РОБОТИ\r\n/);
});

test('Mail: .txt przy każdym CV z nazwą jak PDF i zdanie o formularzach portali', async () => {
  const r = { position: 'Magazynier', lang: 'pl', letter: '', cv };
  const m = JSON.parse((await sendOrderMail({ id: 'abc', pkg: 'cv', profile: { name: 'Jan Kowalski', email: 'j@x.pl' }, results: [r], uiLang: 'pl' }, 'https://x.pl')).message);
  assert.deepEqual(m.attachments.map((a) => a.filename), ['Jan_Kowalski_CV_Magazynier.pdf', 'Jan_Kowalski_CV_Magazynier.txt']);
  assert.match(m.text, /CV w czystym tekście \(\.txt\) – do formularzy portali, w których PDF się nie wczytuje\./);
  const en = JSON.parse((await sendOrderMail({ id: 'abc', pkg: 'cv', profile: { name: 'Jan Kowalski', email: 'j@x.pl' }, results: [r], uiLang: 'en' }, 'https://x.pl')).message);
  assert.match(en.text, /plain text \(\.txt\) – for job portal forms/);
});

test('Pobieranie /api/orders/:id/txt/:i, przycisk przy CV, regulamin §5 i historia w 4 językach', async () => {
  const port = 5000 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-txt-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const o = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] }) })).json();
    assert.equal((await fetch(`${U}/api/orders/${o.id}/txt/0`)).status >= 400, true, 'przed płatnością nie');
    await fetch(`${U}/api/orders/${o.id}/demo-pay`, { method: 'POST' });
    for (let i = 0; i < 40; i++) { if ((await (await fetch(`${U}/api/orders/${o.id}`)).json()).status === 'done') break; await wait(200); }
    const r = await fetch(`${U}/api/orders/${o.id}/txt/0`), t = await r.text();
    assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /text\/plain; charset=utf-8/); assert.match(r.headers.get('content-disposition'), /filename="Jan_Test_CV_Magazynier\.txt"/);
    assert.match(t, /^JAN TEST\r\n/);
  } finally { srv.kill(); }
  assert.match(read('public/index.html'), /id="txtBtn"[^>]*>Pobierz \.txt \(ATS\)<\/a>/); assert.match(read('public/app.js'), /\$\('#txtBtn'\)\.hidden = curDoc !== 'cv';/);
  const reg = read('public/legal/regulamin.html');
  for (const re of [/Do każdego CV Klient otrzymuje bezpłatnie także wersję w czystym tekście \(\.txt\)/, /auch eine Fassung als reinen Text \(\.txt\)/, /a plain-text version \(\.txt\) for job portal forms/, /версію простим текстом \(\.txt\)/,
    /Historia zmian: 25 października 2026 r\. – wersja CV w czystym tekście \(\.txt\) bez dopłaty \(§5 ust\. 1\)/, /Änderungshistorie: 25\. Oktober 2026 – Lebenslauf als reiner Text/, /Change history: 25 October 2026 – plain-text CV version/, /Історія змін: 25 жовтня 2026 р\. – версія резюме простим текстом/]) assert.match(reg, re);
});
