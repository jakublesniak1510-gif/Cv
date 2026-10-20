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
  const app = express(); app.set('trust proxy', true); app.use(express.json()); pv.previewRoutes(app, { cleanProfile, cleanAds, ask, enabled: () => on });
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
    // awaria AI i wyłączone AI: krok bez podglądu
    assert.deepEqual(await post({ sid: 'sesja-err-1', profile: { ...PROFILE, skills: 'AWARIA' }, ad: AD }, '3.3.3.3'), { off: true });
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
