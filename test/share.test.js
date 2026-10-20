import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-share-'));
Object.assign(process.env, { SMTP_URL: 'json', CONTACT_EMAIL: 'kontakt@example.test' });
const express = (await import('express')).default;
const g = await import('../lib/growth.js');
const sh = await import('../lib/share.js');
const an = await import('../lib/analytics.js');
const { seoRoutes, sendNotFound } = await import('../lib/seo.js');
const { decodePng } = await import('../lib/png.js');
const BASE = 'https://example.test', D = 864e5;
const main = (html) => /<section class="page" id="page"[^>]*>([\s\S]*?)<\/section>/.exec(html)[1];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

async function boot() {
  const app = express(); app.set('trust proxy', true);
  an.analyticsRoutes(app, BASE); sh.shareRoutes(app, { BASE_URL: BASE }); seoRoutes(app, BASE);
  app.use((req, res) => sendNotFound(req, res, BASE));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const post = (b, ip = '9.9.9.9') => fetch(`${U}/api/scan/share`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip, 'User-Agent': 'Mozilla/5.0 Test' }, body: JSON.stringify(b) });
  const get = async (p) => { const r = await fetch(U + p); return { status: r.status, headers: r.headers, text: await r.text() }; };
  return { srv, U, post, get };
}
// Wynik skanera z treścią z CV i ogłoszenia: nic z tego nie może trafić na kartę.
const R = { score: 64, position: 'Magazynier SEKRET-OGLOSZENIE', found: ['wózek SEKRET-CV'], missing: [{ keyword: 'WMS SEKRET-BRAK', hint: 'dopisz' }], tips: ['SEKRET-RADA'] };

test('Karta wyniku: procent z serwera (nie z przeglądarki), czyszczone stanowisko, bez treści CV i ogłoszenia, noindex, OG 1200×630', async () => {
  const { srv, U, post, get } = await boot();
  try {
    const scanId = g.rememberScan(R);
    const r = await post({ scanId, score: 99, title: 'Magazynier x@spam.pl +48 600 100 200 https://spam.example/a spam.pl', lang: 'en' });
    assert.equal(r.status, 200); const j = await r.json();
    assert.equal(j.score, 64, 'liczba z przeglądarki jest ignorowana'); assert.equal(j.title, 'Magazynier');
    assert.match(j.id, /^[A-Za-z0-9_-]{16}$/, 'losowy id ≥ 12 znaków'); assert.equal(j.url, `${BASE}/wynik/${j.id}`); assert.equal(j.shareUrl, `${j.url}?utm_source=share`);
    assert.equal((await (await post({ scanId, title: 'Magazynier', lang: 'en' })).json()).id, j.id, 'ten sam wynik i podpis: ten sam link');
    assert.equal((await post({ scanId: 'nie-ma', title: 'x' })).status, 410, 'bez wyniku na serwerze nie ma karty');
    assert.ok(g.takeScan(scanId), 'wysyłka na e-mail'); assert.equal(g.takeScan(scanId), null, 'drugi raz nie'); assert.equal((await post({ scanId, title: 'Inny' })).status, 200, 'po wysyłce e-maila wynik da się jeszcze udostępnić');
    assert.equal((await (await post({ scanId: g.rememberScan({ score: 30 }) })).json()).title, '', 'stanowisko domyślnie puste');
    assert.equal((await (await post({ scanId: g.rememberScan({ score: 30 }), title: 'x'.repeat(200) })).json()).title.length, 60);

    const c = await get(`/wynik/${j.id}`);
    assert.equal(c.status, 200); assert.match(c.headers.get('x-robots-tag'), /noindex/); assert.match(c.text, /<meta name="robots" content="noindex">/);
    assert.ok(c.text.includes('<html lang="en">'), 'język karty = język interfejsu przy tworzeniu');
    assert.match(c.text, /64%/); assert.match(c.text, /Magazynier/); assert.doesNotMatch(c.text, /SEKRET/, 'bez treści CV i ogłoszenia'); assert.doesNotMatch(main(c.text), /spam|600 100/, 'bez kontaktów i linków z podpisu');
    assert.ok(c.text.includes(`<meta property="og:image" content="${BASE}/wynik/${j.id}/og.png">`)); assert.match(c.text, /og:image:width" content="1200"/); assert.match(c.text, /og:image:height" content="630"/);
    assert.match(c.text, /<meta name="twitter:card" content="summary_large_image">/); assert.match(c.text, /<meta property="og:title" content="My CV is a 64% match for the job offer">/);
    assert.match(c.text, /href="\/en\/[^"]+\?utm_source=share"/, 'CTA do skanera z utm_source=share'); assert.match(c.text, /wa\.me|t\.me\/share|facebook\.com\/sharer/);
    assert.ok(!c.text.includes('rel="canonical"'));
    const pl = await (await post({ scanId: g.rememberScan(R), lang: 'pl' })).json(), cp = await get(`/wynik/${pl.id}`);
    assert.match(cp.text, /Moje CV pasuje do oferty w 64%/); assert.match(cp.text, /href="\/narzedzia\/skaner-cv\?utm_source=share"/);
    for (const [l, re] of [['uk', /Моє резюме/], ['de', /Mein Lebenslauf/]]) { const x = await (await post({ scanId: g.rememberScan(R), lang: l })).json(), p = await get(`/wynik/${x.id}`); assert.ok(p.text.includes(`<html lang="${l}">`)); assert.match(p.text, re); }

    const og = await fetch(`${U}/wynik/${j.id}/og.png`);
    assert.equal(og.headers.get('content-type'), 'image/png'); assert.match(og.headers.get('x-robots-tag'), /noindex/);
    const b = Buffer.from(await og.arrayBuffer());
    assert.ok(b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'podpis PNG');
    assert.equal(b.toString('latin1', 12, 16), 'IHDR'); assert.equal(b.readUInt32BE(16), 1200); assert.equal(b.readUInt32BE(20), 630);
    const img = decodePng(b), px = (x, y) => [...img.data.subarray((y * 1200 + x) * 3, (y * 1200 + x) * 3 + 3)];
    assert.deepEqual(px(1124, 300), [0xff, 0xe4, 0x5c], 'pierścień wypełniony po prawej (64% > 25%)');
    assert.equal(sh.ogPng(64, 'en'), sh.ogPng(64, 'en'), 'obrazek z pamięci podręcznej');
    assert.equal((await get(`/wynik/${j.id.slice(0, 15)}!`)).status, 404);
  } finally { srv.close(); }
});

test('Karta wygasa po 30 dniach (410), sprzątanie co godzinę usuwa ją (404)', async () => {
  const { srv, get } = await boot();
  try {
    const old = await sh.createCard({ score: 50, title: 'Kasjer', lang: 'pl' }, Date.now() - 31 * D), young = await sh.createCard({ score: 40 }, Date.now() - 29 * D);
    const e = await get(`/wynik/${old.id}`); assert.equal(e.status, 410); assert.match(e.headers.get('x-robots-tag'), /noindex/); assert.doesNotMatch(main(e.text), /Kasjer/);
    assert.equal((await get(`/wynik/${old.id}/og.png`)).status, 404);
    assert.equal((await get(`/wynik/${young.id}`)).status, 200);
    assert.ok((await sh.cleanupShareCards()) >= 1);
    assert.equal((await get(`/wynik/${old.id}`)).status, 404); assert.equal((await get(`/wynik/${young.id}`)).status, 200);
  } finally { srv.close(); }
});

test('robots.txt blokuje /wynik/ (z wyjątkiem botów podglądu linków), karta poza sitemapą', async () => {
  const { srv, get } = await boot();
  try {
    const t = (await get('/robots.txt')).text, star = t.split('\n\n')[0];
    assert.match(star, /^User-agent: \*$/m); assert.match(star, /^Disallow: \/wynik\/$/m);
    assert.match(t, /User-agent: facebookexternalhit[\s\S]*Allow: \//); assert.match(t, /Sitemap: /);
    assert.doesNotMatch((await get('/sitemap.xml')).text, /\/wynik\//);
  } finally { srv.close(); }
});

test('Lejek: share_created liczy serwer, wejścia z utm_source=share jako źródło „share”, limit 20 kart na godzinę', async () => {
  const { srv, U, post } = await boot();
  try {
    await fetch(`${U}/api/t`, { method: 'POST', headers: { 'X-Forwarded-For': '7.7.7.7', 'User-Agent': 'Mozilla/5.0 Test' }, body: JSON.stringify({ e: 'pv', u: 'share', r: 'https://l.facebook.com/', l: 'pl' }) });
    const before = (await an.funnelRange(today(), today())).shares;
    assert.equal((await post({ scanId: g.rememberScan(R), lang: 'uk' }, '7.7.7.7')).status, 200);
    await new Promise((r) => setTimeout(r, 200));
    const f = await an.funnelRange(today(), today());
    assert.equal(f.shares, before + 1); assert.equal(f.stages[0].src.share, 1, 'wejście z karty');
    const day = Object.values(await an.analyticsDays()).find((x) => x.id === today());
    assert.equal(day.funnel.share_created.src.share, 1); assert.ok(day.funnel.share_created.lang.uk >= 1);
    assert.match(an.funnelText(f), /share: 1/); assert.match(an.funnelText(f), /Udostępnione wyniki skanera: \d+/);
    for (let i = 0; i < 20; i++) assert.equal((await post({ scanId: g.rememberScan(R), title: `t${i}` }, '8.8.8.8')).status, 200);
    assert.equal((await post({ scanId: g.rememberScan(R) }, '8.8.8.8')).status, 429, '21. karta w godzinie z tego IP');
  } finally { srv.close(); }
});
