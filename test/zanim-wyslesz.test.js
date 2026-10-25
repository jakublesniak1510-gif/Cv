import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

process.env.SMTP_URL = 'json';
const { docFile } = await import('../lib/doc-names.js');
const { sendOrderMail, beforeSendItems } = await import('../lib/mail.js');

const cv = (name) => ({ name, headline: '', contact: [], summary: '', experience: [], education: [], skills: [] });
const res = (x = {}) => ({ position: 'Specjalista ds. zakupów', company: 'Sigma', lang: 'pl', letter: 'List', cv: cv('Żaneta Łącka'), ...x });
const order = (x = {}) => ({ id: 'abc', pkg: 'cv_letter', addons: {}, profile: { name: 'Żaneta Łącka', email: 'z@x.pl', phone: '500 600 700' }, results: [res()], uiLang: 'pl', ...x });

test('Nazwy plików: Imię_Nazwisko_CV_Stanowisko, ASCII, maks. 80 znaków, cyrylica transliterowana', () => {
  assert.equal(docFile('cv', 'Żaneta Łącka', 'Specjalista ds. zakupów'), 'Zaneta_Lacka_CV_Specjalista_ds_zakupow.pdf');
  assert.equal(docFile('letter', 'Олександр Шевченко', 'Водій', 'uk', 'docx'), 'Oleksandr_Shevchenko_List_motywacyjny_Vodii_UK.docx');
  const long = docFile('cv', 'Jan Kowalski', 'Stanowisko '.repeat(20));
  assert.ok(long.length <= 80 && /^[A-Za-z0-9_.]+$/.test(long) && long.endsWith('.pdf'), long);
  // Kopia w public/app.js (tytuł strony = nazwa pliku przy „Zapisz jako PDF”) daje to samo.
  const src = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8'), a = src.indexOf('const UK_LAT'), b = src.indexOf('function drawUpsell');
  const ctx = {}; vm.runInNewContext(`${src.slice(a, b)}; this.docBase = docBase;`, ctx);
  for (const [k, n, p, l] of [['cv', 'Żaneta Łącka', 'Specjalista ds. zakupów'], ['letter', 'Олександр Шевченко', 'Водій', 'uk'], ['interview', 'Jan Kowalski', 'Stanowisko '.repeat(20)]]) assert.equal(`${ctx.docBase(k, n, p, l)}.pdf`, docFile(k, n, p, l));
});

test('„Zanim wyślesz”: nazwa jak załącznik, temat, 3 zdania z danych bez AI, link do dokupienia wiadomości', async () => {
  const [x] = beforeSendItems(order());
  assert.equal(x.subject, 'Aplikacja: Specjalista ds. zakupów – Żaneta Łącka');
  const mid = x.body.split('\n\n')[1];
  assert.equal(beforeSendItems(order({ results: [res({ position: 'Kupiec' })] }))[0].body.split('\n\n')[1].match(/[.!?](\s|$)/g).length, 3, 'trzy zdania');
  assert.match(mid, /stanowisko Specjalista ds\. zakupów w firmie Sigma przesyłam swoje CV i list motywacyjny\./); assert.match(mid, /\(500 600 700\)/);
  assert.match(beforeSendItems(order({ profile: { name: 'A B', email: 'a@b.pl' }, results: [res({ company: '' })] }))[0].body, /stanowisko Specjalista ds\. zakupów przesyłam[\s\S]*kontaktu e-mailowego\./, 'bez firmy i telefonu: bez wymyślania');
  assert.match(beforeSendItems(order({ results: [res({ lang: 'en' })] }))[0].subject, /^Application: /, 'język CV');
  const m = JSON.parse((await sendOrderMail(order(), 'https://x.pl')).message);
  assert.equal(m.attachments[0].filename, x.file); assert.match(m.text, /ZANIM WYŚLESZ\nNazwa pliku z CV \(tak nazwaliśmy załącznik\): Zaneta_Lacka_CV_Specjalista_ds_zakupow\.pdf/);
  assert.match(m.text, /e-mail pisany pod to ogłoszenie – 9 zł: https:\/\/x\.pl\/\?id=abc#upsell/);
  assert.ok(m.text.indexOf('Przygotowanie do rozmowy pod to ogłoszenie') < m.text.indexOf('ZANIM WYŚLESZ'), 'główna propozycja zostaje nad sekcją');
  assert.match(m.html, /<b>Zanim wyślesz<\/b>/);
  const en = JSON.parse((await sendOrderMail(order({ uiLang: 'en' }), 'https://x.pl')).message);
  assert.match(en.text, /BEFORE YOU SEND\nCV file name/);
});

test('Z dodatkiem „Wiadomość do rekrutera”: jego e-mail zamiast szablonu, bez linku do dokupienia i bez dubla', async () => {
  const msg = { linkedin: 'Cześć, aplikuję…', email: { subject: 'Aplikacja – kupiec', body: 'Dzień dobry, treść z dodatku.' } };
  const o = order({ addons: { messages: true }, results: [res({ messages: msg })] }), [x] = beforeSendItems(o);
  assert.equal(x.own, true); assert.equal(x.subject, 'Aplikacja – kupiec'); assert.equal(x.body, 'Dzień dobry, treść z dodatku.');
  const m = JSON.parse((await sendOrderMail(o, 'https://x.pl')).message);
  assert.doesNotMatch(m.text, /– 9 zł:/); assert.match(m.text, /Twój e-mail z aplikacją \(z dodatku\):/);
  assert.equal(m.text.split('treść z dodatku').length - 1, 1, 'e-mail tylko w sekcji'); assert.match(m.text, /Wiadomość na LinkedIn:\nCześć, aplikuję/);
});
