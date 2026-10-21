import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-tracker-'));
Object.assign(process.env, { SMTP_URL: 'json' });
const express = (await import('express')).default;
const A = await import('../lib/account.js');
const { saveOrder } = await import('../lib/store.js');
const { saveDraft } = await import('../lib/drafts.js');
const BASE = 'http://example.test', D = 864e5;
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

async function withApp(email, fn) {
  const app = express(); A.accountRoutes(app, { BASE_URL: BASE, DEMO: false });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  let cookie = ''; await A.startAccountSession({ cookie: (n, v) => (cookie = `${n}=${encodeURIComponent(v)}`) }, email, BASE);
  const call = async (p, opts = {}) => { const r = await fetch(U + '/api/account' + p, { ...opts, headers: { cookie, 'X-Acc': '1', 'Content-Type': 'application/json', ...(opts.headers || {}) } }); return { status: r.status, r, j: r.headers.get('content-type')?.includes('json') ? await r.json() : null }; };
  try { await fn({ U, call }); } finally { srv.close(); }
}
const ad = 'Szukamy osoby na stanowisko magazyniera. Wymagamy uprawnień UDT, dokładności i gotowości do pracy zmianowej w magazynie.';

test('Tracker: wpisy z opłaconych zamówień („przygotowane”, raz), statusy, limit 500, treść ogłoszenia do „Dopasuj CV”', async () => {
  await saveOrder({ id: 'ord-1', status: 'done', created: Date.now() - 2 * D, profile: { email: 'k@x.test' }, ads: [{ title: 'Magazynier', text: ad }, { title: 'Kierowca', text: ad }], results: [{ position: 'Magazynier', company: 'Lidl' }, { position: 'Kierowca', company: '' }] });
  await saveOrder({ id: 'ord-2', status: 'pending', created: Date.now(), profile: { email: 'k@x.test' }, ads: [{ title: 'X', text: ad }], results: [] });
  await withApp('k@x.test', async ({ call }) => {
    const a = (await call('')).j;
    assert.deepEqual(a.statuses, A.STATUSES); assert.equal(a.max, 500);
    assert.equal(a.apps.length, 2, 'dwa stanowiska z opłaconego zamówienia, bez nieopłaconego');
    assert.ok(a.apps.every((p) => p.status === 'przygotowane' && p.orderId === 'ord-1' && p.hasAd && p.adText === undefined));
    assert.equal((await call('')).j.apps.length, 2, 'drugie wczytanie nie dubluje wpisów');
    const lidl = a.apps.find((p) => p.company === 'Lidl');
    const adr = (await call(`/apps/${lidl.id}/ad`)).j; assert.equal(adr.text, ad); assert.equal(adr.title, 'Magazynier – Lidl');
    const put = (await call(`/apps/${lidl.id}`, { method: 'PUT', body: JSON.stringify({ status: 'wysłane', followAt: '2026-11-02', note: 'p. Anna, HR' }) })).j;
    assert.equal(put.status, 'wysłane'); assert.equal(put.followAt, '2026-11-02'); assert.equal(put.note, 'p. Anna, HR');
    assert.equal((await call(`/apps/${lidl.id}`, { method: 'PUT', body: JSON.stringify({ followAt: 'jutro' }) })).j.followAt, null, 'zła data → brak przypomnienia');
  });
  // usunięcie wpisu z zamówienia nie wraca przy kolejnym wczytaniu
  await withApp('k@x.test', async ({ call }) => {
    const a = (await call('')).j; await call(`/apps/${a.apps[0].id}`, { method: 'DELETE' });
    assert.equal((await call('')).j.apps.length, 1);
  });
  await withApp('pelny@x.test', async ({ call }) => {
    await call('');
    const many = Array.from({ length: 500 }, (_, i) => ({ id: `a${i}`, company: `F${i}`, position: 'P', status: 'wysłane', applied: '2026-10-01' }));
    // zapis wprost do pliku (moduł konta czyta plik przy każdym żądaniu; drugi magazyn na tym samym pliku ścigałby się z nim)
    const f = path.join(process.env.DATA_DIR, 'accounts.json'), all = JSON.parse(fs.readFileSync(f, 'utf8'));
    all[A.accountIdFor('pelny@x.test')].apps = many; fs.writeFileSync(f, JSON.stringify(all));
    const r = await call('/apps', { method: 'POST', body: JSON.stringify({ company: 'Nowa' }) });
    assert.equal(r.status, 400); assert.match(r.j.error, /500 aplikacji/);
  });
});

test('Tracker: ogłoszenie z rozszerzenia (?draft) trafia na listę raz; eksport CSV bez wstrzykiwania formuł', async () => {
  const id = saveDraft({ title: 'Kasjer – Żabka', url: 'https://example.test/oferta', text: ad });
  await withApp('d@x.test', async ({ U, call }) => {
    const r = (await call('/apps/from-draft', { method: 'POST', body: JSON.stringify({ draftId: id }) })).j;
    assert.equal(r.status, 'przygotowane'); assert.equal(r.link, 'https://example.test/oferta'); assert.equal(r.position, 'Kasjer – Żabka');
    assert.equal((await call('/apps/from-draft', { method: 'POST', body: JSON.stringify({ draftId: id }) })).j.duplicate, true);
    assert.equal((await call('/apps/from-draft', { method: 'POST', body: JSON.stringify({ draftId: 'brak' }) })).status, 404);
    await call('/apps', { method: 'POST', body: JSON.stringify({ company: '=HYPERLINK("x")', position: 'Sprzedawca; zmiana "B"', note: 'linia1\nlinia2' }) });
    const c = await call('/apps.csv', { method: 'GET', headers: { 'X-Acc': '' } });
    assert.equal(c.status, 200); assert.match(c.r.headers.get('content-disposition'), /attachment; filename="moje-aplikacje-\d{4}-\d{2}-\d{2}\.csv"/);
    const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await c.r.arrayBuffer());
    assert.ok(csv.startsWith('﻿Firma;Stanowisko;Link;Data wysłania;Status'));
    assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`), 'formuła poprzedzona apostrofem'); assert.ok(csv.includes('"Sprzedawca; zmiana ""B"""'));
    const anon = await fetch(U + '/api/account/apps.csv'); assert.equal(anon.status, 401, 'bez logowania brak eksportu');
  });
});

test('Przypomnienie o follow-up: tylko ustawione, od 8:00 w wybranym dniu, raz; wypis linkiem (GET pyta, POST wyłącza)', async () => {
  await withApp('f@x.test', async ({ U, call }) => {
    await call('');
    const mk = async (b) => (await call('/apps', { method: 'POST', body: JSON.stringify(b) })).j;
    const due = await mk({ company: 'Biedronka', position: 'Kasjer', applied: '2026-10-10', followAt: '2026-10-17', status: 'wysłane' });
    await mk({ company: 'Bez przypomnienia', applied: '2026-10-10' });
    await mk({ company: 'Przyszłe', applied: '2026-10-10', followAt: '2026-10-30' });
    await mk({ company: 'Odmowa', applied: '2026-10-10', followAt: '2026-10-12', status: 'odmowa' });
    const at = (h) => Date.parse(`2026-10-17T${String(h - 2).padStart(2, '0')}:30:00Z`); // CEST = UTC+2
    assert.equal(await A.followupHourly(BASE, at(7)), 0, 'przed 8:00 nic');
    assert.equal(await A.followupHourly(BASE, at(9)), 1, 'tylko należne i ustawione');
    assert.equal(await A.followupHourly(BASE, at(10)), 0, 'drugi raz nie wysyłamy');
    const me = (await call('')).j, a = me.apps.find((p) => p.id === due.id);
    assert.equal(a.followSent, true);
    const put = (await call(`/apps/${due.id}`, { method: 'PUT', body: JSON.stringify({ followAt: '2026-10-24' }) })).j;
    assert.equal(put.followSent, false, 'nowa data → nowe przypomnienie');
    const { makeStore } = await import('../lib/store.js');
    const acc = Object.values(await makeStore('accounts.json').all()).find((x) => x.email === 'f@x.test');
    assert.ok(acc.followToken?.length >= 20);
    assert.match(await (await fetch(`${U}/konto/przypomnienia/wypisz?t=${acc.followToken}`)).text(), /Wyłączyć przypomnienia/);
    assert.equal((await call('')).j.followOff, false, 'samo otwarcie linku nie wypisuje');
    await fetch(`${U}/konto/przypomnienia/wypisz?t=${acc.followToken}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
    assert.equal((await call('')).j.followOff, true);
    assert.equal(await A.followupHourly(BASE, Date.parse('2026-10-24T08:00:00Z')), 0, 'po wypisie brak przypomnień');
    await call('/follow-off', { method: 'POST', body: JSON.stringify({ off: false }) }); assert.equal((await call('')).j.followOff, false, 'włączenie z powrotem na koncie');
    // usunięcie konta usuwa listę
    await call('', { method: 'DELETE' });
    assert.equal(Object.values(await makeStore('accounts.json').all()).find((x) => x.email === 'f@x.test'), undefined);
  });
});

test('E-mail follow-up i polityka prywatności', async () => {
  const { sendFollowupReminder } = await import('../lib/mail.js');
  const m = JSON.parse((await sendFollowupReminder('k@x.test', { company: 'Lidl', position: 'Magazynier' }, 7, { account: `${BASE}/konto`, unsub: `${BASE}/konto/przypomnienia/wypisz?t=abc` })).message);
  assert.equal(m.subject, 'Minęło 7 dni od wysłania CV do Lidl – czas na follow-up?');
  assert.ok(m.text.includes('/konto/przypomnienia/wypisz?t=abc')); assert.equal(m.list.unsubscribe.url, `${BASE}/konto/przypomnienia/wypisz?t=abc`);
  const pp = read('public/legal/prywatnosc.html');
  for (const t of ['przypomnienie o follow-up w wybranym przez Ciebie dniu', 'Follow-up-Erinnerung an einem von Ihnen gewählten Tag', 'a follow-up reminder on a day you choose', 'нагадування про follow-up у вибраний вами день', 'rozszerzono listę aplikacji na koncie', 'Bewerbungsliste im Konto erweitert', 'extended the list of applications', 'розширено список заявок']) assert.ok(pp.includes(t), t);
  const app = read('public/app.js');
  assert.match(app, /Dopasuj CV do tej oferty/); assert.match(app, /\/api\/account\/apps\.csv/); assert.match(app, /\/apps\/from-draft/);
});
