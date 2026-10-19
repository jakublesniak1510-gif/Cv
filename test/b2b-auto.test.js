import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-b2b-auto-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test' });
const express = (await import('express')).default;
const crm = await import('../lib/crm.js');
const { renderOffer } = await import('../lib/offer-pdf.js');
const { segmentOf, SEGMENTS, offerMail, reminderMail, fill } = await import('../lib/b2b-templates.js');
const b2b = await import('../lib/b2b.js');
const { b2bMonthly } = await import('../lib/b2b-monthly.js');
const { codes } = await import('../lib/store.js');
const BASE = 'https://example.test';

const CSV = '﻿segment;organizacja;miasto;dzial;email;typ_maila;telefon;strona;zrodlo;uwagi\n'
  + 'Uczelnia;"Politechnika ""Testowa""";Gdańsk;Biuro Karier;BK@pt.example;ogólny;123;https://pt.example;strona www;\n'
  + 'Fundacja UA;Fundacja Razem;Wrocław;;razem@f.example;;;;;pomoc Ukraińcom\n'
  + 'Firma;Bez maila;Łódź;HR;;;;;;\n'
  + 'Urząd;PUP Test;Opole;;bk@pt.example;;;;;duplikat\n';

test('CSV: separator, cudzysłowy, nagłówek z BOM; segmenty', () => {
  const rows = crm.parseCsv(CSV);
  assert.equal(rows.length, 4); assert.equal(rows[0].organizacja, 'Politechnika "Testowa"'); assert.equal(rows[0].dzial, 'Biuro Karier');
  assert.equal(crm.parseCsv('email,organizacja\na@b.pl,"X, Y"').at(0).organizacja, 'X, Y');
  assert.equal(segmentOf('Uczelnia'), 'uczelnia'); assert.equal(segmentOf('Fundacja UA'), 'fundacja_ua'); assert.equal(segmentOf('PUP'), 'urzad_ngo'); assert.equal(segmentOf('Liceum'), 'szkola'); assert.equal(segmentOf('YouTuber'), 'tworca'); assert.equal(segmentOf('tworca_ua'), 'tworca_ua');
  const L = { unsubscribe: 'https://x.test/b2b/wypisz?t=abc' };
  for (const k of Object.keys(SEGMENTS)) {
    const m = offerMail(k, { org: 'Politechnika Testowa', site: 'https://yt.test/@ala', name: '', topic: '' }, L);
    assert.match(m.text, /Nie chcesz kolejnych wiadomości\? https:\/\/x\.test\/b2b\/wypisz\?t=abc$/, `${k}: stopka wypisu`);
    assert.doesNotMatch(m.subject + m.text, /\[(NAZWA|UCZELNIA|KOD|IMIĘ|ІМ'Я|KANAŁ|TEMAT)\]/, `${k}: wszystkie zmienne podstawione`);
    assert.doesNotMatch(m.text, /Cześć ,|Привіт, !/, `${k}: bez pustego imienia`);
  }
  const u = offerMail('uczelnia', { org: 'Politechnika Testowa' }, L);
  assert.equal(u.subject, 'Bezpłatny kod i warsztat „CV pod konkretne ogłoszenie” dla studentów Politechnika Testowa'); assert.match(u.text, /\(np\. POLITECHNI10\)/);
  assert.match(offerMail('tworca', { org: 'Kanał Ali', name: 'Ala', site: 'kanał Ali', topic: 'rozmowach o pracę' }, L).text, /^Cześć Ala,[\s\S]*oglądam kanał Ali i Twoje materiały o rozmowach o pracę[\s\S]*np\. Ala10/);
  assert.match(offerMail('tworca_ua', { name: 'Оля' }, L).text, /^Привіт, Оля!/);
  assert.match(reminderMail({ segment: 'tworca_ua', offer: { subject: 'S' } }, L).text, /Нагадую/);
  assert.equal(reminderMail({ segment: 'szkola', offer: { subject: 'S' } }, L).subject, 'Re: S');
});

test('Kontakty: import, zgoda wymagana do oferty, wysyłka, jedno przypomnienie po 7 dniach, odmowa i wypis → lista blokad', async () => {
  const r = await crm.importContacts(CSV);
  assert.deepEqual({ added: r.added, dupes: r.dupes, invalid: r.invalid }, { added: 2, dupes: 1, invalid: 1 });
  const list = Object.values(await crm.contacts.all()), pt = list.find((c) => c.email === 'bk@pt.example'), ua = list.find((c) => c.segment === 'fundacja_ua');
  assert.equal(pt.segment, 'uczelnia'); assert.equal(pt.status, 'nowy'); assert.equal(pt.token.length, 32);
  await assert.rejects(() => crm.sendOffer(pt.id, BASE), /zgoda na ofertę/);
  await assert.rejects(() => crm.updateContact(pt.id, { status: 'zgoda na ofertę' }), /jak i kiedy/);
  const ok = await crm.updateContact(pt.id, { status: 'zgoda na ofertę', consent: 'telefon 21.10, p. Kowalska' });
  assert.equal(ok.consent.text, 'telefon 21.10, p. Kowalska'); assert.ok(ok.consent.at);
  const sent = await crm.sendOffer(pt.id, BASE);
  assert.equal(sent.status, 'oferta wysłana'); assert.ok(sent.offer.at); assert.match(sent.offer.subject, /dla studentów Politechnika "Testowa"/);
  assert.equal((await crm.crmHourly(BASE, Date.now() + 3 * 864e5)).reminded, 0, 'przed upływem 7 dni bez przypomnienia');
  assert.equal((await crm.crmHourly(BASE, Date.now() + 8 * 864e5)).reminded, 1);
  assert.equal((await crm.contacts.get(pt.id)).status, 'przypomnienie wysłane');
  assert.equal((await crm.crmHourly(BASE, Date.now() + 20 * 864e5)).reminded, 0, 'tylko jedno przypomnienie');
  // odmowa w panelu: kontakt znika, e-mail na liście blokad, ponowny import go pomija
  assert.equal(await crm.updateContact(pt.id, { status: 'odmowa' }), null);
  assert.equal(await crm.contacts.get(pt.id), null); assert.ok(await crm.isBlocked('BK@pt.example'));
  assert.equal((await crm.importContacts(CSV)).blocked, 2, 'zablokowany adres (dwa wiersze) pominięty przy imporcie');
  // wypis z linku
  assert.equal(await crm.unsubscribe('zly'), false);
  assert.equal(await crm.unsubscribe(ua.token), true); assert.ok(await crm.isBlocked('razem@f.example'));
  // RODO: kontakt bez aktywności przez rok znika
  await crm.importContacts('email;organizacja\nstary@x.example;Stara Firma');
  await crm.crmHourly(BASE, Date.now() + 366 * 864e5);
  assert.equal(Object.values(await crm.contacts.all()).length, 0);
});

test('PDF oferty: 1–2 strony A4', async () => {
  const pdf = (await renderOffer(BASE)).toString('latin1');
  assert.ok(pdf.startsWith('%PDF')); const n = (pdf.match(/\/Type \/Page\b/g) || []).length; assert.ok(n >= 1 && n <= 2, `stron: ${n}`);
});

test('Doradca: zgłoszenie i zatwierdzenie dają darmowy kod (10%, bez prowizji)', async () => {
  await assert.rejects(() => b2b.createAdvisorApp({ name: 'Jan Kowal', email: 'jan@szkola.example', terms: true }), /szkoły/);
  const a = await b2b.createAdvisorApp({ name: 'Jan Kowal', email: 'jan@szkola.example', org: 'Liceum nr 5', role: 'Doradca zawodowy', group: '28', terms: true });
  assert.equal(a.kind, 'advisor');
  const r = await b2b.approvePartner(a.id, { base: BASE }), c = await codes.get(r.code);
  assert.equal(r.code, 'LICEUM10'); assert.equal(c.commission, 0); assert.equal(c.percent, 10); assert.equal(c.note, 'Liceum nr 5'); assert.ok(c.report);
});

test('Podsumowania miesiąca: tylko 1. dnia, raz w miesiącu; partner, instytucja, wypłaty dla właściciela', async () => {
  const p = await b2b.createPartnerApp({ name: 'Ewa Twórczyni', email: 'ewa@yt.example', channel: 'https://youtube.com/@ewa', terms: true });
  const { code } = await b2b.approvePartner(p.id, { base: BASE });
  await codes.update(code, (c) => ({ ...c, usedBy: ['h1', 'h2', 'h3'], sales: 3, revenue: 30000, due: 6000, bank: 'PL61 1090 1014 0000 0712 1981 2874' }));
  const o = await b2b.createB2bOrder({ org: 'Urząd Pracy Test', nip: '7740001454', address: 'ul. Długa 1, 00-001 Warszawa', name: 'Ola Nowak', email: 'ola@pup.example', pkg: 'cv', qty: 10, pay: 'invoice', terms: true });
  const b = await b2b.fulfillB2b(o.id, { base: BASE });
  await codes.update(b.code, (c) => ({ ...c, usedBy: Array.from({ length: 9 }, (_, i) => 'u' + i) }));
  assert.equal(await b2bMonthly(BASE, new Date('2026-11-02T10:00:00Z')), null, 'nie 1. dnia miesiąca');
  assert.equal(await b2bMonthly(BASE, new Date('2026-11-01T05:00:00Z')), null, 'przed 8:00 czasu polskiego');
  const r = await b2bMonthly(BASE, new Date('2026-11-01T09:00:00Z'));
  assert.equal(r.ym, '2026-11'); assert.ok(r.partners >= 2, 'partner i doradca'); assert.equal(r.institutions >= 1, true); assert.ok(r.payouts >= 1);
  assert.deepEqual((await codes.get(code)).monthSnap, { uses: 3, sales: 3, revenue: 30000, accrued: 6000 });
  assert.equal(await b2bMonthly(BASE, new Date('2026-11-01T15:00:00Z')), null, 'drugi raz w tym samym miesiącu nic nie wysyła');
});

test('Strony: dla doradców, oferta PDF, wypis, API zgłoszenia doradcy', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: BASE }); app.use((_q, res) => res.sendStatus(404));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const d = await fetch(U + '/dla-doradcow'); const t = await d.text();
    assert.equal(d.status, 200); assert.match(t, /id="advisorForm"/); assert.match(t, /Scenariusz zajęć/); assert.match(t, /href="\/narzedzia\/skaner-cv"/);
    assert.match(t, /Scenariusz zajęć \(45 min\): „CV pod konkretne ogłoszenie”/); assert.match(t, /<a href="\/narzedzia\/klauzula-rodo">/); assert.match(t, /href="\/dla-doradcow\/scenariusz\.pdf"/);
    const sc = await fetch(U + '/dla-doradcow/scenariusz.pdf'); assert.equal(sc.status, 200); assert.match(sc.headers.get('content-type'), /pdf/);
    const pdf = await fetch(U + '/oferta-dla-instytucji.pdf'); assert.equal(pdf.status, 200); assert.match(pdf.headers.get('content-type'), /pdf/);
    const w = await fetch(U + '/b2b/wypisz?t=00'); assert.equal(w.status, 200); assert.match(await w.text(), /Wypisano/);
    const post = (b) => fetch(U + '/api/b2b/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    assert.equal((await post({ name: 'Ala', email: 'x', org: 'S', terms: true })).status, 400);
    assert.equal((await post({ name: 'Ala Nowak', email: 'ala@szkola.example', org: 'Technikum 2', terms: true })).status, 200);
    assert.ok(Object.values(await b2b.partnerApps.all()).some((a) => a.kind === 'advisor' && a.org === 'Technikum 2'));
  } finally { srv.close(); }
});
