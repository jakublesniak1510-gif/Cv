import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Kontakty B2B (2.11): status „zapytanie wysłane” (formularz WWW z pytaniem o zgodę), data ostatniego kontaktu, kolumna WWW.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-kontakty-zap-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test' });
const crm = await import('../lib/crm.js');
const read = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('status „zapytanie wysłane” między „nowy” a „zgoda na ofertę”', () => {
  const S = crm.STATUSES, i = S.indexOf('zapytanie wysłane');
  assert.ok(i > S.indexOf('nowy') && i < S.indexOf('zgoda na ofertę'));
  assert.equal(new Set(S).size, S.length);
});

test('import: kolumna www albo strona → site', async () => {
  const csv = 'segment;organizacja;miasto;email;www;zrodlo\nFirma;Alfa;Łódź;biuro@alfa.example;https://alfa.example;KRS\n'
    + 'Firma;Beta;Opole;biuro@beta.example;;KRS\n';
  const r = await crm.importContacts(csv);
  assert.equal(r.added, 2);
  const all = Object.values(await crm.contacts.all());
  assert.equal(all.find((c) => c.org === 'Alfa').site, 'https://alfa.example');
  assert.equal(all.find((c) => c.org === 'Beta').site, '');
  await crm.importContacts('segment;organizacja;email;strona\nFirma;Gamma;biuro@gamma.example;https://gamma.example\n');
  assert.equal(Object.values(await crm.contacts.all()).find((c) => c.org === 'Gamma').site, 'https://gamma.example');
  assert.match(crm.csvTemplate(), /strona \(albo www\)/);
  assert.match(crm.csvTemplate(), /formularz WWW z pytaniem o zgodę/);
});

test('data ostatniego kontaktu: ustawiana przy zmianie statusu, bez zmiany statusu zostaje', async () => {
  const c = Object.values(await crm.contacts.all()).find((x) => x.org === 'Alfa');
  assert.equal(c.lastContact, undefined);
  const t1 = Date.UTC(2026, 10, 2, 10), t2 = t1 + 3 * 864e5;
  let x = await crm.updateContact(c.id, { status: 'zapytanie wysłane' }, t1);
  assert.equal(x.status, 'zapytanie wysłane'); assert.equal(x.lastContact, t1);
  x = await crm.updateContact(c.id, { status: 'zapytanie wysłane', note: 'formularz na stronie' }, t2);
  assert.equal(x.lastContact, t1); assert.equal(x.note, 'formularz na stronie');
  x = await crm.updateContact(c.id, { status: 'zgoda na ofertę', consent: 'odpowiedź z formularza 4.11, zgoda na ofertę e-mailem' }, t2);
  assert.equal(x.lastContact, t2);
  const b = Object.values(await crm.contacts.all()).find((y) => y.org === 'Beta');
  await crm.bulkStatus([b.id], 'zapytanie wysłane', t2);
  assert.equal((await crm.contacts.get(b.id)).lastContact, t2);
});

test('panel: zasada pierwszego kontaktu, kolumna WWW i ostatni kontakt', () => {
  const html = read('public/admin.html'), js = read('public/admin.js');
  assert.match(html, /formularz WWW z pytaniem o zgodę/);
  assert.match(html, /list papierowy/);
  assert.match(js, /'WWW'/);
  assert.match(js, /ostatni kontakt/);
});
