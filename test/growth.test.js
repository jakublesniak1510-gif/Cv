import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-growth-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test' });
const express = (await import('express')).default;
const g = await import('../lib/growth.js');
const { subscribers } = await import('../lib/leads.js');
const { welcomeCode } = await import('../lib/welcome.js');
const { saveOrder, codes } = await import('../lib/store.js');
const capi = await import('../lib/capi.js');
const BASE = 'https://example.test', D = 864e5;
const sub = (email, confirmedAgoDays, lang = 'pl', now = Date.now()) => subscribers.save({ id: crypto.randomUUID(), email, status: 'confirmed', token: crypto.randomBytes(8).toString('hex'), lang, confirmedAt: now - confirmedAgoDays * D, created: now - confirmedAgoDays * D });

test('Seria powitalna: dzień 2, 5 i 9 (tylko z nieużytym kodem), pomija kupujących i stare zapisy, PL/UK', async () => {
  const now = Date.now();
  await sub('d2@x.test', 2.2); await sub('uk@x.test', 2.1, 'uk'); await sub('stary@x.test', 40); await sub('kupil@x.test', 2.5);
  await saveOrder({ id: 'o1', status: 'done', profile: { email: 'kupil@x.test' }, created: now });
  await sub('d9@x.test', 9.1); await welcomeCode('d9@x.test', 'newsletter');
  await sub('d9uzyty@x.test', 9.2); const w = await welcomeCode('d9uzyty@x.test', 'newsletter'); await codes.update(w.code, (c) => ({ ...c, usedBy: ['h'] }));
  const r = await g.welcomeSeries(BASE, now);
  assert.equal(r.sent, 3, 'd2 PL, d2 UK, d9 z kodem');
  const all = Object.values(await subscribers.all()), by = (e) => all.find((s) => s.email === e);
  assert.ok(by('d2@x.test').series.d2); assert.ok(by('uk@x.test').series.d2); assert.equal(by('stary@x.test').series, undefined); assert.equal(by('kupil@x.test').series, undefined);
  assert.ok(by('d9@x.test').series.d9 > 0); assert.ok(by('d9uzyty@x.test').series.d9 < 0, 'użyty kod: krok pominięty, bez maila');
  assert.equal((await g.welcomeSeries(BASE, now)).sent, 0, 'ten sam krok nie idzie drugi raz');
  assert.equal((await g.welcomeSeries(BASE, now + 3 * D)).sent, 2, 'dzień 5 dla zapisów z dnia 2');
  // treści: wypis dodaje sendNewsletterIssue; bez obietnic zatrudnienia
  const pl = g.SERIES[0].pl(BASE), uk = g.SERIES[0].uk(BASE);
  assert.match(pl.text, /\/narzedzia\/skaner-cv/); assert.match(uk.text, /\/uk\/instrumenty\/skaner-rezyume/); assert.match(g.SERIES[1].uk(BASE).text, /\/uk\/porady\//);
  for (const s of g.SERIES) for (const l of ['pl', 'uk']) assert.doesNotMatch(s[l](BASE, { code: 'WITAJ-1', amount: 10, expires: now + 2 * D, days: 2 }).text, /gwarant|zatrudnienie gwar|\d+% skutecz/i);
});

test('Wynik skanera na e-mail: tylko po id wyniku, limit 3/h, newsletter tylko po zaznaczeniu', async () => {
  const app = express(); g.growthRoutes(app, { BASE_URL: BASE });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const post = (b) => fetch(U + '/api/scan/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
  try {
    const id = g.rememberScan({ score: 64, position: 'Magazynier', found: ['wózek widłowy'], missing: [{ keyword: 'WMS', hint: 'dopisz system' }], tips: ['Dodaj liczby'] });
    assert.equal((await post({ scanId: 'zly', email: 'a@x.test' })).status, 410);
    const r1 = await post({ scanId: id, email: 'wynik@x.test' }); assert.equal(r1.status, 200); assert.equal((await r1.json()).newsletter, false);
    assert.ok(!Object.values(await subscribers.all()).some((s) => s.email === 'wynik@x.test'), 'bez zaznaczenia nie zapisujemy adresu');
    const r2 = await post({ scanId: id, email: 'nl@x.test', newsletter: true, lang: 'uk' }); assert.equal((await r2.json()).newsletter, true);
    const s = Object.values(await subscribers.all()).find((x) => x.email === 'nl@x.test'); assert.equal(s.status, 'pending', 'podwójna zgoda'); assert.equal(s.source, 'skaner'); assert.equal(s.lang, 'uk');
    assert.equal((await post({ scanId: id, email: 'x3@x.test' })).status, 429, 'czwarta próba w godzinie');
    const text = g.scanMailText({ score: 64, position: 'Magazynier', found: ['a'], missing: [{ keyword: 'WMS', hint: 'h' }], tips: ['t'] }, 'pl', BASE);
    assert.match(text, /64%/); assert.match(text, /WMS: h/); assert.equal((text.match(/https?:\/\//g) || []).length, 1, 'jeden neutralny link');
  } finally { srv.close(); }
});

test('Meta CAPI: tylko za zgodą i ze zmiennymi, event_id = id zamówienia, e-mail jako SHA-256', async () => {
  const o = { id: 'ord-1', total: 4900, paidAt: 1700000000000, profile: { email: ' Anna@Example.com ' }, adConsent: true, adCtx: { ip: '1.2.3.4', ua: 'UA', fbp: 'fb.1.1.2', fbc: null } };
  const calls = []; const fake = async (u, opt) => { calls.push([u, JSON.parse(opt.body)]); return { ok: true, json: async () => ({ events_received: 1 }) }; };
  assert.equal(await capi.sendPurchase(o, BASE, fake), null, 'bez zmiennych wyłączone');
  Object.assign(process.env, { META_PIXEL_ID: '1234567890', META_CAPI_TOKEN: 'tok' });
  assert.equal(await capi.sendPurchase({ ...o, adConsent: false }, BASE, fake), null, 'bez zgody nic nie wysyłamy');
  const r = await capi.sendPurchase(o, BASE, fake);
  assert.equal(r.sent, true); assert.equal(calls.length, 1);
  const ev = calls[0][1].data[0];
  assert.match(calls[0][0], /\/1234567890\/events\?access_token=tok$/);
  assert.equal(ev.event_name, 'Purchase'); assert.equal(ev.event_id, 'ord-1'); assert.equal(ev.custom_data.value, 49);
  assert.equal(ev.user_data.em[0], crypto.createHash('sha256').update('anna@example.com').digest('hex'));
  assert.equal(ev.user_data.client_ip_address, '1.2.3.4'); assert.equal(ev.user_data.fbc, undefined);
  assert.equal(await capi.sendPurchase({ ...o, capi: { sent: true } }, BASE, fake), null, 'drugi raz nie');
  const ctx = capi.adContext({ ip: '5.6.7.8', get: () => 'Mozilla' }, { fbp: 'fb.1.123.456', fbc: '<script>' });
  assert.deepEqual(ctx, { ip: '5.6.7.8', ua: 'Mozilla', fbp: 'fb.1.123.456', fbc: null });
  delete process.env.META_PIXEL_ID; delete process.env.META_CAPI_TOKEN;
});

test('Widżet skanera: /embed/skaner z kodem partnera, noindex, link w nowej karcie; kod iframe', async () => {
  const app = express(); g.growthRoutes(app, { BASE_URL: BASE });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const r = await fetch(U + '/embed/skaner?ref=anna10'), t = await r.text();
    assert.equal(r.status, 200); assert.match(r.headers.get('x-robots-tag'), /noindex/); assert.match(t, /"https:\/\/example\.test\/\?ref=ANNA10"/); assert.match(t, /a\.target='_blank'/);
    assert.doesNotMatch(t, /fbq|gtag|consent\.js/, 'bez skryptów reklamowych');
    assert.doesNotMatch(await (await fetch(U + '/embed/skaner?ref=%3Cx%3E')).text(), /<x>/);
    assert.equal(g.embedSnippet(BASE, 'ANNA10'), '<iframe src="https://example.test/embed/skaner?ref=ANNA10" width="100%" height="760" style="border:0;max-width:720px" loading="lazy" title="Skaner CV – CV Pod Ogłoszenie"></iframe>');
  } finally { srv.close(); }
});

test('Telegram: pn/śr/pt o 18:00 czasu polskiego, raz dziennie, rotacja porad; bez zmiennych wyłączone', async () => {
  assert.ok(g.TELEGRAM_TIPS.length >= 30);
  const sent = []; const fake = async (u, opt) => { sent.push([u, JSON.parse(opt.body)]); return { ok: true, json: async () => ({ ok: true }) }; };
  const mon18 = new Date('2026-10-19T16:30:00Z'); // poniedziałek 18:30 w Warszawie (CEST)
  assert.equal(await g.telegramHourly(BASE, mon18, fake), null, 'bez zmiennych');
  Object.assign(process.env, { TELEGRAM_BOT_TOKEN: '123:abc', TELEGRAM_CHANNEL: '@kanal' });
  assert.deepEqual(await g.telegramHourly(BASE, mon18, fake), { idx: 0 });
  assert.equal(await g.telegramHourly(BASE, new Date('2026-10-19T16:50:00Z'), fake), null, 'raz dziennie');
  assert.equal(await g.telegramHourly(BASE, new Date('2026-10-20T16:30:00Z'), fake), null, 'wtorek');
  assert.equal(await g.telegramHourly(BASE, new Date('2026-10-21T15:30:00Z'), fake), null, 'środa 17:30');
  assert.deepEqual(await g.telegramHourly(BASE, new Date('2026-10-21T16:10:00Z'), fake), { idx: 1 });
  assert.equal(sent.length, 2); assert.equal(sent[0][1].chat_id, '@kanal'); assert.match(sent[0][0], /bot123:abc\/sendMessage/); assert.match(sent[1][1].text, /https:\/\/example\.test\/uk/);
  delete process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_CHANNEL;
});

test('Prośba o opinię: REVIEW_URL i REVIEW_SITE_NAME', async () => {
  const { sendReviewAsk } = await import('../lib/mail.js');
  process.env.REVIEW_URL = 'https://www.trustpilot.com/review/cvpodogloszenie.pl';
  const info = await sendReviewAsk({ id: 'o9', profile: { email: 'k@x.test' } }, BASE);
  const m = JSON.parse(info.message);
  assert.match(m.text, /Możesz też wystawić opinię na Trustpilot: https:\/\/www\.trustpilot\.com/); assert.match(m.html, /oceń nas na Trustpilot/);
  process.env.REVIEW_SITE_NAME = 'Opineo'; assert.match(JSON.parse((await sendReviewAsk({ id: 'o9', profile: { email: 'k@x.test' } }, BASE)).message).text, /na Opineo:/);
  process.env.REVIEW_URL = 'javascript:alert(1)'; assert.doesNotMatch(JSON.parse((await sendReviewAsk({ id: 'o9', profile: { email: 'k@x.test' } }, BASE)).message).text, /Możesz też wystawić opinię na/);
  delete process.env.REVIEW_URL; delete process.env.REVIEW_SITE_NAME;
});
