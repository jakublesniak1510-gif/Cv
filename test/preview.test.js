import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-preview-'));
const express = (await import('express')).default;
const pv = await import('../lib/preview.js');

const cleanProfile = (p = {}) => ({ name: p.name || '', email: p.email || '', phone: p.phone || '', headline: p.headline || '', summary: p.summary || '', skills: p.skills || '', languages: '', certificates: '', interests: '', notes: '', experience: p.experience || [], education: p.education || [], photo: p.photo || '' });
const cleanAds = (ads) => (ads || []).filter((a) => a?.text?.length >= 80).map((a) => ({ title: a.title || '', text: a.text, lang: a.lang || 'auto' }));
const AD = { title: 'Kasjer', text: 'Zatrudnimy kasjera. Wymagania: obsługa kasy fiskalnej, obsługa terminala płatniczego, praca zmianowa, komunikatywność, dokładność.' };
const PROFILE = { name: 'Anna Test', email: 'anna@example.com', phone: '600000000', photo: 'data:image/png;base64,AAAA', skills: 'kasa fiskalna, terminal', experience: [{ title: 'Kasjerka', company: 'Sklep', period: '2022 – obecnie' }] };

test('Podgląd przed płatnością: tani model, bez danych kontaktowych, pamięć podręczna, limity (3/h na IP, 1 na sesję), awaria AI', async () => {
  const calls = [];
  const ask = async (system, user, o) => { calls.push({ system, user, o }); if (/AWARIA/.test(user)) throw new Error('503'); return { headline: 'Kasjerka', summary: 'Od trzech lat obsługuję kasę fiskalną i terminal płatniczy. Pracuję na zmiany.', keywords: ['obsługa kasy fiskalnej', 'obsługa terminala płatniczego', 'praca zmianowa', 'komunikatywność', 'dokładność', 'szósta'] }; };
  let on = true;
  let shown = 0;
  const app = express(); app.set('trust proxy', true); app.use(express.json()); pv.previewRoutes(app, { cleanProfile, cleanAds, ask, enabled: () => on, daily: () => 5, onShown: async () => { shown++; } });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const post = async (body, ip = '1.1.1.1') => (await fetch(`${U}/api/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(body) })).json();
  try {
    const r = await post({ sid: 'sesja-aaaa-1', profile: PROFILE, ad: AD });
    assert.equal(r.headline, 'Kasjerka'); assert.equal(r.keywords.length, 5, 'dokładnie 5 słów kluczowych'); assert.match(r.key, /^[0-9a-f]{32}$/);
    assert.equal(calls.length, 1); assert.equal(calls[0].o.model, 'claude-haiku-5-5'); assert.ok(calls[0].o.maxTokens <= 1000);
    assert.doesNotMatch(calls[0].user, /Anna Test|anna@example\.com|600000000|base64/, 'bez imienia, kontaktu i zdjęcia');
    // te same dane: z pamięci podręcznej, bez nowego zapytania (także z innej sesji)
    assert.equal((await post({ sid: 'sesja-aaaa-1', profile: PROFILE, ad: AD })).headline, 'Kasjerka');
    assert.equal((await post({ sid: 'sesja-bbbb-2', profile: PROFILE, ad: AD }, '9.9.9.9')).headline, 'Kasjerka');
    assert.equal(calls.length, 1);
    // ta sama sesja, zmienione dane: limit 1 na sesję
    assert.deepEqual(await post({ sid: 'sesja-aaaa-1', profile: { ...PROFILE, skills: 'inne' }, ad: AD }), { off: true, reason: 'limit' });
    // 3 nowe podglądy na IP na godzinę (pierwszy już był)
    for (let i = 2; i <= 3; i++) assert.ok((await post({ sid: `sesja-ip-${i}xx`, profile: { ...PROFILE, skills: `s${i}` }, ad: AD })).summary);
    assert.deepEqual(await post({ sid: 'sesja-ip-4xx', profile: { ...PROFILE, skills: 's4' }, ad: AD }), { off: true, reason: 'limit' });
    assert.ok((await post({ sid: 'sesja-ip-5xx', profile: { ...PROFILE, skills: 's5' }, ad: AD }, '2.2.2.2')).summary, 'inne IP');
    // awaria AI: krok bez podglądu, ale nieudana próba nie zużywa limitu sesji, IP ani dziennego
    assert.deepEqual(await post({ sid: 'sesja-err-1', profile: { ...PROFILE, skills: 'AWARIA' }, ad: AD }, '3.3.3.3'), { off: true });
    assert.ok((await post({ sid: 'sesja-err-1', profile: { ...PROFILE, skills: 'po awarii' }, ad: AD }, '3.3.3.3')).summary, 'ta sama sesja może spróbować ponownie');
    // dzienny limit dla całej strony (tu 5 nowych podglądów): kolejny nowy → limit przed wywołaniem AI; z pamięci podręcznej dalej działa
    const before = calls.length;
    assert.deepEqual(await post({ sid: 'sesja-day-1', profile: { ...PROFILE, skills: 'dzień' }, ad: AD }, '6.6.6.6'), { off: true, reason: 'limit' });
    assert.equal(calls.length, before, 'bez wywołania AI');
    assert.equal((await post({ sid: 'sesja-day-2', profile: PROFILE, ad: AD }, '7.7.7.7')).headline, 'Kasjerka');
    assert.equal(shown, 8, 'preview_shown liczony na serwerze po każdym pokazanym podglądzie');
    on = false; assert.deepEqual(await post({ sid: 'sesja-off-1', profile: PROFILE, ad: AD }, '4.4.4.4'), { off: true });
    on = true;
    // złe dane wejściowe
    assert.deepEqual(await post({ sid: 'x', profile: PROFILE, ad: AD }, '5.5.5.5'), { off: true });
    assert.deepEqual(await post({ sid: 'sesja-short', profile: PROFILE, ad: { text: 'krótko' } }, '5.5.5.5'), { off: true });
    // wynik zapamiętany do pełnej generacji po płatności (ten sam skrót danych)
    const saved = await pv.previewFor(cleanProfile(PROFILE), cleanAds([AD])[0]);
    assert.equal(saved.summary, r.summary);
    assert.equal(await pv.previewFor(cleanProfile({ ...PROFILE, headline: 'zmiana' }), cleanAds([AD])[0]), null);
    assert.equal(pv.previewKey(cleanProfile(PROFILE), AD), pv.previewKey(cleanProfile({ ...PROFILE, name: 'Inna', email: 'x@y.z', photo: '' }), AD), 'kontakt i zdjęcie nie zmieniają skrótu');
  } finally { srv.close(); }
});

test('Pełna generacja po płatności dostaje podgląd w poleceniu (spójność)', () => {
  const src = fs.readFileSync(new URL('../lib/generate.js', import.meta.url), 'utf8'), srv = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(src, /<podglad_pokazany_klientowi>/);
  assert.match(srv, /preview: i === 0 \? o\.preview : null/);
  assert.match(srv, /previewFor\(p, a\[0\]\)/);
});

// cfg.preview w public/app.js oznacza tryb podglądu bez serwera (wyłącza statystyki, pobieranie DOCX itd.),
// więc flaga podglądu AI w /api/config musi mieć inną nazwę.
test('/api/config: podgląd AI jako aiPreview, nie preview', () => {
  const srv = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8'), app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(srv, /aiPreview: aiEnabled\(\)/);
  assert.doesNotMatch(srv, /\bpreview: aiEnabled\(\)/);
  assert.match(app, /\$\('#pvBox'\)\.hidden = !cfg\.aiPreview/);
});

test('Podgląd: zapytanie dla Claude Haiku 5.5 bez fallbacks/betas (400) i bez myślenia; powód błędu AI w dzienniku', async () => {
  const { buildRequest } = await import('../lib/ai.js');
  const h = buildRequest('s', 'u', { model: 'claude-haiku-5-5', effort: 'low', maxTokens: 900, thinking: { type: 'disabled' } });
  assert.equal(h.fallbacks, undefined); assert.equal(h.betas, undefined); assert.deepEqual(h.thinking, { type: 'disabled' });
  assert.equal(h.output_config.effort, 'low'); assert.equal(h.max_tokens, 900);
  const d = buildRequest('s', 'u', { model: 'claude-opus-5-5' });
  assert.equal(d.fallbacks, 'default'); assert.equal(d.thinking, undefined);
  let opts; await pv.makePreview(PROFILE, AD, { ask: async (_s, _u, o) => { opts = o; return { summary: 'x', keywords: ['a', 'b', 'c'] }; } });
  assert.deepEqual(opts.thinking, { type: 'disabled' });

  const { events } = await import('../lib/store.js');
  const app = express(); pv.previewRoutes(app, { cleanProfile, cleanAds, enabled: () => true, ask: async () => { throw new Error('400 invalid_request_error: fallbacks'); }, onShown: async () => {} });
  const srv = app.listen(0);
  try {
    const r = await (await fetch(`http://127.0.0.1:${srv.address().port}/api/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: 'sesja-log-1', profile: { ...PROFILE, skills: 'LOG' }, ad: AD }) })).json();
    assert.deepEqual(r, { off: true });
    await new Promise((ok) => setTimeout(ok, 50));
    const ev = Object.values(await events.all()).filter((e) => e.type === 'podgląd');
    assert.ok(ev.some((e) => /400 invalid_request_error: fallbacks/.test(e.message)), 'powód błędu w dzienniku');
    assert.ok(ev.every((e) => !/Anna Test|anna@example\.com|600000000/.test(e.message)), 'bez danych klienta');
  } finally { srv.close(); }
});
