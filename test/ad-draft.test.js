import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { draftRoutes, saveDraft, getDraft, extOrigin } from '../lib/drafts.js';

const AD = 'Magazynier. Wymagania: uprawnienia UDT, doświadczenie w kompletacji zamówień, praca zmianowa, dokładność i sumienność.';
const EXT = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';

test('Szkic ogłoszenia: walidacja, wygasanie po 2 h, CORS tylko dla rozszerzenia', () => {
  assert.throws(() => saveDraft({ text: 'krótko' }), /80 znaków/);
  const id = saveDraft({ text: AD, title: 'Magazynier', url: 'javascript:alert(1)' }, 1000);
  assert.equal(getDraft(id, 1000 + 3600e3).url, '', 'tylko adresy http(s)');
  assert.equal(getDraft(id, 1000 + 2 * 3600e3 + 1), null, 'po 2 h szkic znika');
  assert.equal(saveDraft({ text: 'x'.repeat(30000) }).length > 10, true);
  assert.equal(extOrigin(EXT, ''), EXT, 'bez EXT_ID: dowolne rozszerzenie Chrome');
  assert.equal(extOrigin(EXT, 'ponmlkjihgfedcbaponmlkjihgfedcba'), null, 'z EXT_ID: tylko to rozszerzenie');
  assert.equal(extOrigin('https://evil.example', ''), null);
});

test('/api/ad-draft: CORS, limit 20/h, max 20 KB, odczyt przez stronę', async () => {
  const app = express(); draftRoutes(app, { limitPerHour: 3 });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const post = (b, origin = EXT) => fetch(U + '/api/ad-draft', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(b) });
  try {
    const pre = await fetch(U + '/api/ad-draft', { method: 'OPTIONS', headers: { Origin: EXT, 'Access-Control-Request-Method': 'POST' } });
    assert.equal(pre.status, 204); assert.equal(pre.headers.get('access-control-allow-origin'), EXT);
    assert.equal((await fetch(U + '/api/ad-draft', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await post({ text: AD }, 'https://evil.example')).status, 403, 'obca strona');
    const r = await post({ text: AD, title: 'Magazynier', url: 'https://www.pracuj.pl/praca/x', src: 'ext' });
    assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), EXT);
    const { id } = await r.json();
    const g = await (await fetch(`${U}/api/ad-draft/${id}`)).json();
    assert.equal(g.text, AD); assert.equal(g.title, 'Magazynier'); assert.equal(g.url, 'https://www.pracuj.pl/praca/x');
    assert.equal((await fetch(`${U}/api/ad-draft/nie-ma`)).status, 404);
    assert.equal((await post({ text: 'x'.repeat(25 * 1024) })).status, 413, 'ponad 20 KB');
    assert.equal((await post({ text: 'za krótko' })).status, 400);
    assert.equal((await post({ text: AD })).status, 200);
    assert.equal((await post({ text: AD })).status, 429, 'limit (3 w teście) wyczerpany');
  } finally { srv.close(); }
});

test('Rozszerzenie: MV3, tylko activeTab + scripting, bez host_permissions i zdalnego kodu, 4 języki, ikony', () => {
  const m = JSON.parse(fs.readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
  assert.equal(m.manifest_version, 3); assert.deepEqual(m.permissions, ['activeTab', 'scripting']);
  assert.equal(m.host_permissions, undefined); assert.equal(m.content_scripts, undefined); assert.equal(m.background, undefined);
  for (const s of ['16', '32', '48', '128']) assert.ok(fs.existsSync(new URL(`../extension/${m.icons[s]}`, import.meta.url)));
  const keys = Object.keys(JSON.parse(fs.readFileSync(new URL('../extension/_locales/pl/messages.json', import.meta.url), 'utf8')));
  for (const l of ['pl', 'uk', 'en', 'de']) {
    const d = JSON.parse(fs.readFileSync(new URL(`../extension/_locales/${l}/messages.json`, import.meta.url), 'utf8'));
    assert.deepEqual(Object.keys(d).sort(), keys.sort(), `${l}: komplet tekstów`); assert.ok(d.extDesc.message.length <= 132, `${l}: opis do 132 znaków`);
  }
  const js = fs.readFileSync(new URL('../extension/popup.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../extension/popup.html', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /eval\(|new Function|<script src="https?:|importScripts/, 'bez zdalnego kodu');
  assert.match(js, /chrome\.scripting\.executeScript/);
});
