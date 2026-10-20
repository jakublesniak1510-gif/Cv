import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { datesOf, split, loadFairs, setFairs, fairRoutes, fairUrls, citySlug, eventsLd } from '../lib/fairs.js';
import fs from 'node:fs';

const RAW = JSON.parse(fs.readFileSync(new URL('../seo-data/targi.json', import.meta.url), 'utf8'));
const at = (iso) => Date.parse(`${iso}T12:00:00Z`);

test('Daty: pojedyncza, zakres i seria DD.MM.RRRR; niepotwierdzone bez dat', () => {
  assert.deepEqual(datesOf({ data: '2026-11-03' }), [{ start: '2026-11-03', end: '2026-11-03' }]);
  assert.deepEqual(datesOf({ data: '2026-11-04 – 2026-11-05' }), [{ start: '2026-11-04', end: '2026-11-05' }]);
  assert.deepEqual(datesOf({ data: 'seria: 17.11.2026, 26.11.2026, 05.2027 (Kalisz)' }).map((x) => x.start), ['2026-11-17', '2026-11-26']);
  assert.ok(loadFairs(RAW).filter((e) => !e.potwierdzona).every((e) => !e.dates.length));
  assert.ok(loadFairs(RAW).filter((e) => e.potwierdzona).every((e) => e.dates.length), 'każde potwierdzone ma datę');
  assert.equal(citySlug('Gdańsk/Trójmiasto'), 'gdansk-trojmiasto'); assert.equal(citySlug('Łódź'), 'lodz');
});

test('Minione wydarzenia znikają z nadchodzących; seria pokazuje tylko przyszłe terminy; Event tylko dla potwierdzonych', () => {
  const list = loadFairs(RAW);
  const a = split(list, at('2026-10-21')), b = split(list, at('2026-11-20'));
  assert.ok(a.up.some((e) => e.nazwa === 'Absolvent Talent Days Poznań'));
  assert.ok(!b.up.some((e) => e.nazwa === 'Absolvent Talent Days Poznań') && b.past.some((e) => e.nazwa === 'Absolvent Talent Days Poznań'), 'po terminie → minione');
  const uam = b.up.find((e) => /UAM/.test(e.nazwa)); assert.ok(uam.next.every((x) => x.end >= '2026-11-20'));
  const ld = eventsLd(a.up, 'https://example.test');
  assert.ok(ld.length && ld.every((x) => x['@type'] === 'Event' && x.startDate && x.location && x.eventAttendanceMode));
  const tbcNames = new Set(a.tbc.map((e) => e.nazwa)); assert.ok(!ld.some((x) => tbcNames.has(x.name) && !a.up.some((u) => u.nazwa === x.name)), 'niepotwierdzone bez Event');
  assert.ok(ld.every((x) => !x.isAccessibleForFree || /^tak/i.test(RAW.find((e) => e.nazwa === x.name).bezplatne)), 'bezpłatność tylko z danych');
});

test('Strony: hub i miasta 200, miasto bez wydarzeń noindex i poza mapą, link do źródła nofollow, bez „nie podano”', async () => {
  setFairs(RAW);
  const app = express(); fairRoutes(app, 'https://example.test'); app.use((_q, r) => r.sendStatus(404));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, get = async (p) => { const r = await fetch(U + p); return { s: r.status, t: await r.text() }; };
  try {
    const hub = await get('/targi-pracy');
    assert.equal(hub.s, 200); assert.ok(hub.t.includes('Jak przygotować CV na targi pracy') && hub.t.includes('rel="nofollow noopener"'));
    assert.ok(!/Wstęp: nie podano/.test(hub.t));
    const by = await get('/targi-pracy/bydgoszcz'); assert.equal(by.s, 200); assert.match(by.t, /name="robots" content="noindex"/);
    const po = await get('/targi-pracy/poznan'); assert.equal(po.s, 200); assert.doesNotMatch(po.t, /noindex/);
    assert.equal((await get('/targi-pracy/nie-ma')).s, 404);
    assert.ok(fairUrls().includes('targi-pracy/poznan') && !fairUrls().includes('targi-pracy/bydgoszcz'));
  } finally { srv.close(); }
});
