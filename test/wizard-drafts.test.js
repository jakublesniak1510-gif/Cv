import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wdraft-'));
process.env.SMTP_URL = 'json';
const W = await import('../lib/wizard-drafts.js');
const an = await import('../lib/analytics.js');

const app = express(); app.use(express.json({ limit: '1mb' })); W.wizardDraftRoutes(app, { BASE_URL: 'https://example.test', DEMO: false });
const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
const call = async (m, p, body) => { const r = await fetch(U + p, { method: m, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) }); return { status: r.status, j: await r.json().catch(() => null) }; };
const DATA = { pkg: 'cv', photo: 'data:image/jpeg;base64,AAAA', f: { name: 'Anna', email: 'anna@example.test' }, exp: [], edu: [], ads: [{ text: 'Ogłoszenie' }] };
const events = async () => { const d = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }); return (await an.funnelRange(d, d)).events; };
const wait = () => new Promise((r) => setTimeout(r, 30));
test.after(() => srv.close());

test('Zapis szkicu: walidacja, bez zdjęcia, skrót tokenu w bazie, wczytanie i aktualizacja', async () => {
  assert.equal((await call('POST', '/api/wizard-draft', { email: 'zly', data: DATA })).status, 400);
  assert.equal((await call('POST', '/api/wizard-draft', { email: 'a@example.test', data: { x: 'y'.repeat(W.MAX_DATA + 10) } })).status, 400, 'limit rozmiaru');
  const r = await call('POST', '/api/wizard-draft', { email: 'A@example.test', data: DATA, lang: 'de' });
  assert.equal(r.status, 200); assert.match(r.j.token, /^[A-Za-z0-9_-]{32}$/);
  const raw = fs.readFileSync(path.join(process.env.DATA_DIR, 'wizard-drafts.json'), 'utf8');
  assert.ok(!raw.includes(r.j.token), 'token nie leży w bazie'); assert.ok(!raw.includes('base64,AAAA'), 'bez zdjęcia');
  const d = await W.draftByToken(r.j.token);
  assert.equal(d.email, 'a@example.test'); assert.equal(d.lang, 'de'); assert.equal(d.reminder, null, 'bez zaznaczonego pola – bez przypomnienia');
  const g = await call('GET', `/api/wizard-draft/${r.j.token}`); assert.equal(g.j.data.f.name, 'Anna'); assert.equal(g.j.data.photo, undefined);
  await call('GET', `/api/wizard-draft/${r.j.token}`);
  assert.equal((await call('PUT', `/api/wizard-draft/${r.j.token}`, { data: { ...DATA, f: { name: 'Anna K.' } } })).status, 200);
  assert.equal((await call('GET', `/api/wizard-draft/${r.j.token}`)).j.data.f.name, 'Anna K.');
  assert.equal((await call('GET', '/api/wizard-draft/zly')).status, 404);
  await wait(); const ev = await events(); assert.equal(ev.draft_saved, 1); assert.equal(ev.draft_resumed, 1, 'wznowienie liczone raz na szkic');
});

test('Przypomnienie: tylko ze zgodą (treść i czas), jedno, po 24 h, nie po złożeniu zamówienia; nowy link', async () => {
  const withC = await call('POST', '/api/wizard-draft', { email: 'b@example.test', data: DATA, remind: true });
  const noC = await call('POST', '/api/wizard-draft', { email: 'c@example.test', data: DATA, remind: 'tak' });
  const ordered = await call('POST', '/api/wizard-draft', { email: 'd@example.test', data: DATA, remind: true });
  const d = await W.draftByToken(withC.j.token);
  assert.equal(d.reminder.consent.text, W.REMIND_CONSENT); assert.ok(d.reminder.consent.at);
  assert.equal((await W.draftByToken(noC.j.token)).reminder, null, 'tylko remind === true');
  const ref = await W.draftOrdered(ordered.j.token); assert.ok(ref);
  const now = Date.now();
  await W.wizardDraftsHourly('https://example.test', now + 3600e3); // za wcześnie
  assert.equal((await W.draftByToken(withC.j.token)).reminder.sent, false);
  await W.wizardDraftsHourly('https://example.test', now + 25 * 3600e3);
  assert.equal(await W.draftByToken(withC.j.token, now + 25 * 3600e3), null, 'stary link przestaje działać');
  const all = Object.values(await W.wizardDrafts.all());
  const sent = all.filter((x) => x.reminder?.sent);
  assert.equal(sent.length, 1); assert.equal(sent[0].email, 'b@example.test');
  await W.wizardDraftsHourly('https://example.test', now + 26 * 3600e3);
  assert.equal(Object.values(await W.wizardDrafts.all()).filter((x) => x.reminder?.sent).length, 1, 'jedno przypomnienie');
  await W.draftPaid(sent[0].id);
  assert.equal(await W.wizardDrafts.get(sent[0].id), null, 'po opłaceniu szkic usunięty');
  await wait(); const ev = await events(); assert.equal(ev.reminder_sent, 1); assert.equal(ev.reminder_converted, 1);
});

test('Limit: 5 szkiców na godzinę z jednego adresu IP', async () => {
  assert.equal((await call('POST', '/api/wizard-draft', { email: 'f@example.test', data: DATA })).status, 429);
});

test('Wypis: wyłączenie przypomnienia i usunięcie szkicu; sprzątanie po 7 dniach', async () => {
  const app2 = express(); W.wizardDraftRoutes(app2, { BASE_URL: 'https://example.test' }); const s2 = app2.listen(0), U = `http://127.0.0.1:${s2.address().port}`;
  test.after(() => s2.close());
  const r = { j: await (await fetch(U + '/api/wizard-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'e@example.test', data: DATA, remind: true }) })).json() };
  const page = await (await fetch(`${U}/szkic/wypisz?t=${r.j.token}`)).text();
  assert.ok(page.includes('Wyłącz przypomnienie') && page.includes('Usuń szkic'));
  await fetch(`${U}/szkic/wypisz?t=${r.j.token}&a=stop`, { method: 'POST' });
  const d = await W.draftByToken(r.j.token); assert.equal(d.reminder.consent, null); assert.ok(d.reminder.withdrawn);
  await W.wizardDraftsHourly('https://example.test', Date.now() + 25 * 3600e3);
  assert.equal((await W.wizardDrafts.get(d.id))?.reminder.sent, false, 'po wycofaniu zgody brak przypomnienia');
  await fetch(`${U}/szkic/wypisz?t=${r.j.token}&a=delete`, { method: 'POST' });
  assert.equal(await W.draftByToken(r.j.token), null);
  await W.wizardDraftsHourly('https://example.test', Date.now() + 8 * 864e5);
  assert.equal(Object.keys(await W.wizardDrafts.all()).length, 0, 'wszystko starsze niż 7 dni usunięte');
});
