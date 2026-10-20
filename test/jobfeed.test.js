import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'jobfeed-'));
process.env.SMTP_URL = 'json';
const jf = await import('../lib/jobfeed.js');
const { alerts, alertsHourly } = await import('../lib/alerts.js');
const { sendAlertIssue } = await import('../lib/mail.js');

const NOW = Date.parse('2026-10-19T08:00:00Z'); // poniedziałek, 10:00 w Warszawie
const ENV = { ADZUNA_APP_ID: 'id', ADZUNA_APP_KEY: 'key', JOOBLE_KEY: 'jk' };
const iso = (d) => new Date(NOW - d * 864e5).toISOString();
const ADZ = { results: [
  { title: '<strong>Magazynier</strong> – zmiana dzienna', company: { display_name: 'Firma A' }, location: { display_name: 'Poznań, wielkopolskie' }, redirect_url: 'https://www.adzuna.pl/land/ad/1?se=x', description: 'Opis <b>oferty</b> A', created: iso(1) },
  { title: 'Magazynier', company: { display_name: 'Firma B' }, location: { display_name: 'Poznań' }, redirect_url: 'https://www.adzuna.pl/land/ad/2', description: 'B', created: iso(10) }, // za stara
  { title: 'Bez linku', company: { display_name: 'C' }, redirect_url: 'javascript:alert(1)', created: iso(1) },
] };
const JOO = { jobs: [
  { title: 'Magazynier – zmiana dzienna', company: 'Firma A', location: 'Poznań', link: 'https://pl.jooble.org/desc/1', snippet: 'dubel', updated: iso(2) }, // ten sam tytuł i firma co w Adzunie
  { title: 'Operator wózka', company: 'Firma D', location: 'Poznań', link: 'https://pl.jooble.org/desc/2', snippet: '&nbsp;Wózki widłowe…', updated: iso(3) },
] };
const calls = [];
const get = async (url, init) => { calls.push({ url, init }); return url.includes('adzuna') ? ADZ : JOO; };

test('Bez kluczy API moduł jest wyłączony i niczego nie pobiera', async () => {
  assert.equal(jf.feedEnabled({}), false);
  assert.deepEqual(await jf.fetchOffers({ job: 'x' }, { env: {}, get: () => assert.fail('bez zapytań') }), []);
  assert.deepEqual(jf.feedSources({ ADZUNA_APP_ID: 'a' }), [], 'Adzuna wymaga obu kluczy');
  assert.deepEqual(jf.feedSources(ENV), ['adzuna', 'jooble']);
});

test('Oficjalne API: do Adzuny i Jooble idzie tylko zawód i miasto; świeże oferty bez duplikatów i bez złych linków', async () => {
  const list = await jf.fetchOffers({ job: 'Magazynier', city: 'Poznań' }, { env: ENV, now: NOW, get });
  const u = new URL(calls.find((c) => c.url.includes('adzuna')).url);
  assert.equal(u.origin + u.pathname, 'https://api.adzuna.com/v1/api/jobs/pl/search/1');
  assert.equal(u.searchParams.get('what'), 'Magazynier'); assert.equal(u.searchParams.get('where'), 'Poznań'); assert.equal(u.searchParams.get('max_days_old'), '7');
  const j = calls.find((c) => c.url.includes('jooble'));
  assert.equal(j.url, 'https://pl.jooble.org/api/jk'); assert.deepEqual(JSON.parse(j.init.body), { keywords: 'Magazynier', location: 'Poznań', page: '1' });
  assert.deepEqual(list.map((o) => [o.src, o.title, o.company]), [['adzuna', 'Magazynier – zmiana dzienna', 'Firma A'], ['jooble', 'Operator wózka', 'Firma D']]);
  assert.equal(list[0].desc, 'Opis oferty A'); assert.equal(list[1].desc, 'Wózki widłowe…');
  const n = calls.length; await jf.fetchOffers({ job: 'magazynier', city: 'poznań' }, { env: ENV, now: NOW + 3600e3, get });
  assert.equal(calls.length, n, 'wynik z pamięci (12 h), bez ponownego zapytania');
});

test('Błąd jednego API nie blokuje drugiego', async () => {
  const list = await jf.fetchOffers({ job: 'Kierowca' }, { env: ENV, now: NOW, get: async (url) => { if (url.includes('adzuna')) throw new Error('HTTP 500'); return JOO; } });
  assert.equal(list.length, 2); assert.ok(list.every((o) => o.src === 'jooble'));
});

test('E-mail z ofertami: tytuł, firma, miasto, link partnerski, „Dopasuj CV do tej oferty”, źródła i wypis', async () => {
  const jobs = [{ title: 'Magazynier', company: 'Firma A', city: 'Poznań', url: 'https://www.adzuna.pl/land/ad/1', src: 'adzuna', fit: 'https://example.test/?oferta=abc&utm_source=oferty' }];
  const info = await sendAlertIssue({ email: 'a@example.test', job: 'Magazynier', city: 'Poznań', lang: 'pl' }, { jobs, links: [['Pracuj.pl', 'https://www.pracuj.pl/']], order: 'https://example.test/', stop: 'https://example.test/oferty/wypisz?t=t', left: 3 });
  const m = JSON.parse(info.message);
  for (const s of ['Magazynier – Firma A, Poznań', 'https://www.adzuna.pl/land/ad/1', 'Dopasuj CV do tej oferty: https://example.test/?oferta=abc&utm_source=oferty', 'Oferty pochodzą z serwisów partnerskich: Adzuna.', 'Wyłącz powiadomienia: https://example.test/oferty/wypisz?t=t']) assert.ok(m.text.includes(s), s);
  assert.ok(m.html.includes('href="https://example.test/?oferta=abc&amp;utm_source=oferty"'));
  assert.ok(m.headers['List-Unsubscribe-Post']);
  const plain = JSON.parse((await sendAlertIssue({ email: 'a@example.test', job: 'X', lang: 'en' }, { links: [['Indeed', 'https://pl.indeed.com/']], order: 'o', stop: 's', left: 0 })).message);
  assert.ok(plain.text.includes('Each one opens search results') && !plain.text.includes('partner services'), 'bez ofert z API: dotychczasowy e-mail');
});

test('Wysyłka w poniedziałek: oferty zapisane do /api/job-offer, bez powtórek w kolejnym tygodniu, dzienny limit', async () => {
  const base = { status: 'confirmed', lang: 'pl', token: 't', created: NOW - 864e5, until: NOW + 30 * 864e5 };
  await alerts.save({ ...base, id: 'a1', email: 'x1@example.test', job: 'Magazynier', city: 'Poznań' });
  await alerts.save({ ...base, id: 'a2', email: 'x2@example.test', job: 'Magazynier', city: 'Poznań' });
  await alerts.save({ ...base, id: 'a3', email: 'x3@example.test', job: 'Magazynier', city: 'Poznań', status: 'pending' });
  await alertsHourly('https://example.test', new Date(NOW), { env: { ...ENV, ALERTS_DAILY_MAX: '1' }, fetchOpts: { get } });
  const sent = Object.values(await alerts.all()).filter((a) => a.lastSent);
  assert.equal(sent.length, 1, 'limit 1 e-mail dziennie');
  assert.equal(sent[0].offersSent, 2); assert.equal(sent[0].sentOffers.length, 2);
  const o = await jf.offers.get(sent[0].sentOffers[0]); assert.equal(o.url, 'https://www.adzuna.pl/land/ad/1?se=x'); assert.ok(!('email' in o), 'oferta bez danych osobowych');
  await alertsHourly('https://example.test', new Date(NOW + 3600e3), { env: { ...ENV, ALERTS_DAILY_MAX: '1' }, fetchOpts: { get } });
  assert.equal(Object.values(await alerts.all()).filter((a) => a.lastSent).length, 1, 'limit liczy się na cały dzień');
  await alertsHourly('https://example.test', new Date(NOW + 864e5), { env: ENV, fetchOpts: { get } });
  const all = await alerts.all();
  assert.ok(all.a1.lastSent && all.a2.lastSent && !all.a3.lastSent, 'wtorek: reszta wysłana, niepotwierdzone pominięte');
  const again = await jf.offersForAlert(all.a1, { env: ENV, now: NOW + 7 * 864e5, get });
  assert.deepEqual(again, [], 'te same oferty nie wracają w kolejnym wydaniu');
});

test('Wysyłka tylko od poniedziałku 7:00 do środy', async () => {
  await alerts.save({ id: 'b1', email: 'y@example.test', job: 'Kucharz', city: '', status: 'confirmed', lang: 'pl', token: 'u', created: NOW, until: NOW + 30 * 864e5 });
  await alertsHourly('https://example.test', new Date(Date.parse('2026-10-19T04:00:00Z')), { env: ENV, fetchOpts: { get } }); // pon. 6:00
  await alertsHourly('https://example.test', new Date(Date.parse('2026-10-23T10:00:00Z')), { env: ENV, fetchOpts: { get } }); // piątek
  assert.equal((await alerts.get('b1')).lastSent, undefined);
});
