import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-social-'));
Object.assign(process.env, { META_PAGE_TOKEN: 'page-token', META_APP_SECRET: 'app-secret', META_VERIFY_TOKEN: 'verify-me' });
const express = (await import('express')).default;
const { socialRoutes, parseEvents, validSignature, chats } = await import('../lib/social.js');

const sign = (raw) => 'sha256=' + crypto.createHmac('sha256', 'app-secret').update(raw).digest('hex');
const msg = (user, text, extra = {}) => ({ object: 'page', entry: [{ messaging: [{ sender: { id: user }, recipient: { id: 'PAGE' }, timestamp: Date.now(), message: { mid: 'm-' + crypto.randomUUID(), text, ...extra } }] }] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('Bot Meta: weryfikacja webhooka, podpis, odpowiedź AI z informacją o automacie, „człowiek”, ręczna odpowiedź, duplikaty', async () => {
  const sent = [], notes = [], owner = [];
  const app = express();
  socialRoutes(app, { answer: async (h, note) => { notes.push(note); return `Odpowiedź na: ${h.at(-1).content}`; }, send: async (u, t) => sent.push([u, t]), notifyOwner: async (s, t) => owner.push(s + '\n' + t) });
  const srv = app.listen(0), B = `http://127.0.0.1:${srv.address().port}/api/meta/webhook`;
  const post = (body, sig) => { const raw = JSON.stringify(body); return fetch(B, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig ?? sign(raw) }, body: raw }); };
  try {
    assert.equal(await (await fetch(`${B}?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123`)).text(), '123');
    assert.equal((await fetch(`${B}?hub.mode=subscribe&hub.verify_token=zle&hub.challenge=123`)).status, 403);
    assert.equal((await post(msg('U1', 'Ile kosztuje CV?'), 'sha256=00')).status, 403, 'zły podpis');
    assert.equal(sent.length, 0);

    const first = msg('U1', 'Ile kosztuje CV?');
    assert.equal((await post(first)).status, 200);
    await post(first); // Meta ponawia to samo zdarzenie: bez drugiej odpowiedzi
    await wait(150);
    assert.deepEqual(sent, [['U1', 'Odpowiedź na: Ile kosztuje CV?']]);
    assert.match(notes[0], /pierwsza odpowiedź/i);
    await post(msg('U1', 'A list motywacyjny?')); await wait(150);
    assert.equal(sent.length, 2); assert.doesNotMatch(notes[1], /pierwsza odpowiedź/i, 'informacja o automacie tylko raz');
    assert.equal((await chats.get('messenger:U1')).history.length, 4);

    // „człowiek”: bot milknie i powiadamia właściciela
    await post(msg('U1', 'człowiek')); await wait(150);
    assert.match(sent.at(-1)[1], /przekazuję rozmowę/);
    assert.equal(owner.length, 1); assert.match(owner[0], /Ile kosztuje CV/);
    const n = sent.length; await post(msg('U1', 'halo?')); await wait(150);
    assert.equal(sent.length, n, 'po prośbie o człowieka bot nie odpisuje');

    // Ręczna odpowiedź ze skrzynki (echo bez znacznika bota) wycisza bota; echo własnej odpowiedzi nie.
    await post(msg('U2', 'Pytanie')); await wait(150);
    const echoBot = { object: 'page', entry: [{ messaging: [{ sender: { id: 'PAGE' }, recipient: { id: 'U2' }, timestamp: Date.now(), message: { mid: 'e1', text: 'x', is_echo: true, metadata: 'cvpo-bot' } }] }] };
    await post(echoBot); await post(msg('U2', 'Drugie pytanie')); await wait(150);
    assert.equal(sent.filter(([u]) => u === 'U2').length, 2);
    const echoHuman = { object: 'page', entry: [{ messaging: [{ sender: { id: 'PAGE' }, recipient: { id: 'U2' }, timestamp: Date.now(), message: { mid: 'e2', text: 'Odpisuję osobiście', is_echo: true } }] }] };
    await post(echoHuman); await post(msg('U2', 'Trzecie')); await wait(150);
    assert.equal(sent.filter(([u]) => u === 'U2').length, 2, 'po ręcznej odpowiedzi bot milczy');

    // Instagram: osobna rozmowa
    await post({ object: 'instagram', entry: [{ messaging: [{ sender: { id: 'IG1' }, recipient: { id: 'IGPAGE' }, timestamp: Date.now(), message: { mid: 'ig1', text: 'Hej' } }] }] }); await wait(150);
    assert.deepEqual(sent.at(-1), ['IG1', 'Odpowiedź na: Hej']);
    assert.ok(await chats.get('instagram:IG1'));
  } finally { srv.close(); }
});

test('Bot Meta: parsowanie zdarzeń i podpis', () => {
  assert.equal(parseEvents({ object: 'other' }).length, 0);
  const ev = parseEvents({ object: 'page', entry: [{ messaging: [{ sender: { id: 'A' }, recipient: { id: 'P' }, timestamp: 1, message: { mid: 'x', attachments: [{}] } }, { sender: { id: 'A' }, read: {} }] }] });
  assert.equal(ev.length, 1); assert.equal(ev[0].attachments, true); assert.equal(ev[0].text, '');
  assert.ok(validSignature('abc', sign('abc'))); assert.ok(!validSignature('abd', sign('abc'))); assert.ok(!validSignature('abc', undefined));
});

test('Bot Meta: diagnostyka do /health bez sekretów', async () => {
  const { botStatus } = await import('../lib/social.js');
  const resp = (ok, j) => ({ ok, json: async () => j });
  const good = async (u) => (u.includes('subscribed_apps') ? resp(true, { data: [{ subscribed_fields: ['messages', 'messaging_postbacks'] }] }) : resp(true, { id: '1', name: 'CV Pod Ogłoszenie', instagram_business_account: { id: '2' } }));
  const st = await botStatus({ fetchFn: good, now: 1 });
  assert.deepEqual({ bot: st.bot, strona: st.strona, instagram: st.instagram }, { bot: 'ok', strona: 'CV Pod Ogłoszenie', instagram: 'połączony' });
  assert.match(st.ostatni_webhook, /^\d{4}-/, 'czas ostatniego webhooka'); assert.match(st.ostatnia_odpowiedz, /^\d{4}-/);
  assert.ok(!JSON.stringify(st).includes('Dzień dobry'), 'bez treści wiadomości');
  const noSubs = async (u, o = {}) => (o.method === 'POST' ? resp(false, { error: { message: '(#200) Permissions error' } }) : u.includes('subscribed_apps') ? resp(true, { data: [] }) : resp(true, { id: '1', name: 'X' }));
  const ns = await botStatus({ fetchFn: noSubs, now: 1e9 });
  assert.match(ns.bot, /brak subskrypcji/); assert.match(ns.szczegol, /Permissions error/);
  const posted = [];
  const autoSub = async (u, o = {}) => (o.method === 'POST' ? (posted.push(u), resp(true, { success: true })) : u.includes('subscribed_apps') ? resp(true, { data: [] }) : resp(true, { id: '1', name: 'X' }));
  assert.equal((await botStatus({ fetchFn: autoSub, now: 1.5e9 })).bot, 'ok', 'brak subskrypcji → włączamy ją sami');
  assert.match(posted[0], /me\/subscribed_apps\?subscribed_fields=messages,messaging_postbacks,message_echoes&access_token=/);
  const bad = async () => resp(false, { error: { message: 'Error validating access token: Session has expired' } });
  const r = await botStatus({ fetchFn: bad, now: 2e9 });
  assert.match(r.bot, /token/); assert.ok(!JSON.stringify(r).includes('page-token'));
});
