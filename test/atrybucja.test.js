import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Atrybucja zamówień (2.11): źródło zapisywane w zamówieniu przy jego tworzeniu. Wcześniej tylko z pamięci serwera (dzisiejsze
// odsłony tego IP i przeglądarki), która ginie przy restarcie i o północy – opłacone zamówienia trafiały do „inne” przy 0 wejściach.
// Teraz: pierwsze wejście z 30 dni (tylko przy zgodzie na cookies reklamowe) → źródło pierwszej odsłony wizyty (sessionStorage)
// → pamięć serwera → „inne”.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-attr-'));
const express = (await import('express')).default;
const { visitInfo, analyticsRoutes } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const req = (ua = 'Mozilla/5.0 Nikt', ip = '9.9.9.9') => ({ headers: { 'user-agent': ua, 'x-forwarded-for': ip }, ip, socket: { remoteAddress: ip }, get: (h) => ({ 'user-agent': ua })[h.toLowerCase()] });
const now = Date.now();

test('Bez pamięci serwera (restart, inny dzień): źródło z wizyty albo pierwszego wejścia, nie „inne”', () => {
  assert.equal(visitInfo(req(), {}), null, 'nic nie wiadomo – jak dotąd (null → „inne” w lejku)');
  assert.deepEqual(visitInfo(req(), { session: { u: 'google', r: '' }, l: 'en' }), { src: 'google', srcFrom: 'session', lang: 'en' });
  assert.deepEqual(visitInfo(req(), { session: { u: '', r: 'https://www.facebook.com/' } }), { src: 'facebook', srcFrom: 'session', lang: 'pl' });
  assert.deepEqual(visitInfo(req(), { session: { u: '', r: '' } }), { src: 'direct', srcFrom: 'session', lang: 'pl' }, 'wejście bez źródła to direct, nie inne');
  // pierwsze wejście z 30 dni wygrywa z bieżącą wizytą (first-touch)
  assert.equal(visitInfo(req(), { first: { u: 'yt', r: '', at: now - 5 * 864e5 }, session: { u: '', r: '' } }).src, 'youtube');
  assert.equal(visitInfo(req(), { first: { u: 'yt', r: '', at: now - 31 * 864e5 }, session: { u: 'tiktok', r: '' } }, now).src, 'tiktok', 'starsze niż 30 dni – pomijamy');
  assert.equal(visitInfo(req(), { first: { u: 'yt', at: now + 864e5 }, session: { u: 'tiktok' } }, now).src, 'tiktok', 'data z przyszłości – pomijamy');
  assert.equal(visitInfo(req(), { session: 'x' }), null, 'śmieci w danych klienta ignorowane');
});

test('Pamięć serwera dalej działa, gdy przeglądarka nic nie przysłała; zamówienie zapisuje źródło przy tworzeniu', async () => {
  const app = express(); app.set('trust proxy', true); analyticsRoutes(app, 'https://example.test');
  app.post('/z', express.json(), (rq, rs) => rs.json(visitInfo(rq, rq.body?.src)));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, H = { 'X-Forwarded-For': '2.2.2.2', 'User-Agent': 'Mozilla/5.0 Atr', 'Content-Type': 'application/json' };
  try {
    await fetch(U + '/api/t', { method: 'POST', headers: { ...H, 'Content-Type': 'text/plain' }, body: JSON.stringify({ e: 'pv', u: 'google', p: '/' }) });
    assert.deepEqual(await (await fetch(U + '/z', { method: 'POST', headers: H, body: '{}' })).json(), { src: 'google', srcFrom: 'server', lang: 'pl' });
    assert.equal((await (await fetch(U + '/z', { method: 'POST', headers: H, body: JSON.stringify({ src: { session: { u: 'tiktok' } } }) })).json()).src, 'tiktok', 'dane z wizyty mają pierwszeństwo przed pamięcią serwera');
  } finally { srv.close(); }
  const app2 = read('public/app.js'), srvJs = read('server.js');
  assert.match(srvJs, /visit: visitInfo\(req, req\.body\?\.src\), refCtx/);
  assert.match(app2, /draftToken: srvToken\(\) \|\| undefined, src: visitSrc\(\),/);
  assert.match(app2, /if \(localStorage\.getItem\('cvpo-consent'\) === 'granted'\) \{ const f = JSON\.parse\(localStorage\.getItem\('cvpo-ft'\)/, 'pierwsze wejście z 30 dni tylko przy zgodzie');
  assert.match(app2, /sessionStorage\.setItem\('cvpo-src', JSON\.stringify\(SRC_NOW\)\)/);
});
