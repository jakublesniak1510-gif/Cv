import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

process.env.SMTP_URL = 'json';
const { deleteNoticeMail } = await import('../lib/mail.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY = 864e5, NOW = Date.UTC(2026, 9, 25, 10);

// PR V: jeden e-mail w 25. dniu (osobna zgoda): pobierz dokumenty przed usunięciem; kolejne CV 19 zł jeszcze przez 5 dni; wypis.
test('Treść: data usunięcia, link do dokumentów, cena kolejnego CV z cennika tylko gdy się kwalifikuje, link wypisu; EN', () => {
  const o = { id: 'abc', status: 'done', created: NOW - 25 * DAY, paidAt: NOW - 25 * DAY, uiLang: 'pl', profile: { email: 'a@b.pl' } };
  const m = deleteNoticeMail(o, 'https://x.pl', NOW);
  assert.equal(m.subject, 'Za 5 dni usuniemy Twoje dokumenty – pobierz je');
  assert.match(m.text, /za 5 dni \(30 października\) automatycznie usuniemy dane Twojego zamówienia i dokumenty/);
  assert.match(m.text, /https:\/\/x\.pl\/\?id=abc\n/); assert.match(m.text, /kosztuje 19 zł \(z listem 29 zł\) jeszcze przez 5 dni:\nhttps:\/\/x\.pl\/\?id=abc#kolejne/);
  assert.match(m.text, /Wypisz się: https:\/\/x\.pl\/przypomnienie\/wypisz\?o=abc/);
  assert.doesNotMatch(deleteNoticeMail({ ...o, paidAt: NOW - 31 * DAY }, 'https://x.pl', NOW).text, /19 zł/, 'poza oknem 30 dni – bez ceny');
  assert.doesNotMatch(deleteNoticeMail({ ...o, status: 'paid' }, 'https://x.pl', NOW).text, /19 zł/);
  assert.match(deleteNoticeMail({ ...o, uiLang: 'en' }, 'https://x.pl', NOW).text, /in 5 days \(30 October\) we will automatically delete/);
});

test('Kasa: osobna, odznaczona zgoda; zgoda ankiety bez „kodu rabatowego”; harmonogram; polityka w 4 językach', () => {
  const html = read('public/index.html'), app = read('public/app.js'), srv = read('server.js'), pol = read('public/legal/prywatnosc.html');
  // 29.10: obie zgody na stronie dokumentów po zakupie (drawNotify, /api/orders/:id/notify), osobne i odznaczone
  assert.ok(app.includes("['deleteNotice', \"Przypomnijcie mi 5 dni przed usunięciem moich danych i dokumentów (jeden e-mail, opcjonalnie).\"]"));
  assert.ok(app.includes("['followUp', \"Zapytajcie mnie raz po miesiącu, jak poszła rekrutacja (jeden e-mail, opcjonalnie).\"]")); assert.doesNotMatch(html + app, /z kodem rabatowym na kolejne CV, opcjonalnie/);
  assert.match(srv, /if \(key === 'deleteNotice'\) return \{ \.\.\.x, deleteNotice: on \? \{ \.\.\.base, off: false \} : \{ \.\.\.base, off: true, offAt: Date\.now\(\) \} \};/);
  assert.match(srv, /DELETE_NOTICE_AFTER = 25 \* 864e5/); assert.match(srv, /o\.deleteNotice\.off \|\| age < DELETE_NOTICE_AFTER \|\| Date\.now\(\) - o\.created >= RETENTION_MS/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); assert.ok(d['Przypomnijcie mi 5 dni przed usunięciem moich danych i dokumentów (jeden e-mail, opcjonalnie).'] && d['Zapytajcie mnie raz po miesiącu, jak poszła rekrutacja (jeden e-mail, opcjonalnie).'], l); }
  for (const re of [/Jednorazowy e-mail 5 dni przed usunięciem danych zamówienia \(w 25\. dniu od opłacenia\)/, /Einmalige E-Mail 5 Tage vor dem Löschen der Bestelldaten/, /One-time e-mail 5 days before your order data is deleted/, /Одноразовий лист за 5 днів до видалення даних замовлення/,
    /<h2>13\. Historia zmian<\/h2>\n<ul>(?:<li>[^<]*<\/li>)*<li>25 października 2026 r\. – jednorazowy e-mail 5 dni przed usunięciem danych/, /<h2>13\. Change history<\/h2>\n<ul>(?:<li>[^<]*<\/li>)*<li>25 October 2026 – one-time e-mail 5 days before/]) assert.match(pol, re);
});

test('Serwer: zgoda zapisana w zamówieniu; wypis GET (przycisk) i POST (off); bez zgody – brak przypomnienia', async () => {
  const port = 6500 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-dn-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const make = async (deleteNotice) => (await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, deleteNotice, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] }) })).json()).id;
    const a = await make(true), b = await make(false);
    await wait(200);
    const get = () => JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'));
    assert.deepEqual(get()[a].deleteNotice, { consent: true, sent: false }); assert.equal(get()[b].deleteNotice.consent, false);
    const g = await (await fetch(`${U}/przypomnienie/wypisz?o=${a}`)).text(); assert.match(g, /<form method="post" action="\/przypomnienie\/wypisz\?o=/); assert.equal(get()[a].deleteNotice.off, undefined, 'GET nie wypisuje');
    await fetch(`${U}/przypomnienie/wypisz?o=${a}`, { method: 'POST' }); await wait(100);
    assert.equal(get()[a].deleteNotice.off, true);
    assert.match(await (await fetch(`${U}/przypomnienie/wypisz?o=${b}`)).text(), /Brak przypomnienia/);
  } finally { srv.kill(); }
});
