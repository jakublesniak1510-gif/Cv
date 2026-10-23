import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Wersje językowe w SSR (Google indeksuje HTML z serwera): tytuł, opis, og/twitter i <html lang> w języku z adresu.
const port = 4900 + Math.floor(Math.random() * 90), U = `http://localhost:${port}`;
let srv;
const get = async (p) => { const r = await fetch(U + p, { redirect: 'manual' }); return { r, h: await r.text() }; };
const meta = (h, re) => re.exec(h)?.[1];
before(async () => {
  srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-lang-')), BASE_URL: U, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '' }, stdio: 'ignore' });
  for (let i = 0; i < 150; i++) { try { await fetch(`${U}/health`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => srv?.kill());

test('Strony główne /en, /uk, /de: tytuł, opis, og:*, twitter:* z i18n, lang, canonical i hreflang; /de/ → 301 /de', async () => {
  const pl = (await get('/')).h, plTitle = meta(pl, /<title>(.*?)<\/title>/), plDesc = meta(pl, /<meta name="description" content="([^"]*)"/);
  for (const l of ['en', 'uk', 'de']) {
    const d = JSON.parse(fs.readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url), 'utf8'));
    const { r, h } = await get(`/${l}`);
    assert.equal(r.status, 200);
    assert.match(h, new RegExp(`<html lang="${l}"`));
    assert.equal(meta(h, /<title>(.*?)<\/title>/), d[plTitle], `${l}: tytuł`);
    assert.equal(meta(h, /<meta name="description" content="([^"]*)"/), d[plDesc], `${l}: opis`);
    for (const k of ['property="og:title"', 'name="twitter:title"']) assert.equal(meta(h, new RegExp(`<meta ${k} content="([^"]*)"`)), d[plTitle], `${l}: ${k}`);
    assert.match(h, new RegExp(`<link rel="canonical" href="${U}/${l}">`));
    for (const x of ['pl', 'en', 'uk', 'de', 'x-default']) assert.match(h, new RegExp(`<link rel="alternate" hreflang="${x}" href="${U}/`), `${l}: hreflang ${x}`);
    const s = await get(`/${l}/`); assert.equal(s.r.status, 301); assert.equal(s.r.headers.get('location'), `/${l}`);
    assert.equal((await get(`/${l}/?utm_source=x`)).r.headers.get('location'), `/${l}?utm_source=x`, 'parametry zostają');
  }
});

test('Żadna strona z mapy strony pod prefiksem /en, /uk, /de nie ma polskiego tytułu ani lang="pl"', async () => {
  const urls = [...(await get('/sitemap.xml')).h.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(U, '') || '/');
  const title = async (u) => { const { h } = await get(u); return { u, lang: meta(h, /<html lang="(\w+)"/), t: meta(h, /<title>(.*?)<\/title>/) }; };
  const all = [];
  for (let i = 0; i < urls.length; i += 25) all.push(...await Promise.all(urls.slice(i, i + 25).map(title)));
  const plTitles = new Set(all.filter((x) => !/^\/(en|uk|de)(\/|$)/.test(x.u)).map((x) => x.t));
  const lang = all.filter((x) => /^\/(en|uk|de)(\/|$)/.test(x.u));
  assert.ok(lang.length > 300, `stron: ${lang.length}`);
  for (const x of lang) {
    const l = x.u.slice(1, 3);
    assert.equal(x.lang, l, `${x.u}: lang`);
    assert.ok(!plTitles.has(x.t), `${x.u}: polski tytuł „${x.t}”`);
  }
});
