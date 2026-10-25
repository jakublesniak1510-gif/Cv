import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Widżet Trustpilot: tylko przy TRUSTPILOT_BUSINESS_UNIT_ID + TRUSTPILOT_SHOW=1. Micro Review Count pod hero (język wg wersji),
// Mini nad przyciskiem płatności; CSP dopuszcza widget.trustpilot.com tylko wtedy. Bez zmiennych – bez zmian w HTML i CSP.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const BU = '5f1e2d3c4b5a69788796a5b4';
async function withServer(env, fn) {
  const port = 5600 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-tp-'));
  const srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SALES_OPEN: '1', TRUSTPILOT_BUSINESS_UNIT_ID: '', TRUSTPILOT_SHOW: '', ...env }, stdio: 'ignore' });
  const U = `http://localhost:${port}`;
  try {
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const get = async (p) => { const r = await fetch(U + p); return { csp: r.headers.get('content-security-policy'), h: await r.text() }; };
    await fn(get);
  } finally { srv.kill(); }
}

test('Bez zmiennych (albo bez TRUSTPILOT_SHOW=1): żadnego widżetu, znacznika ani zmiany CSP', { timeout: 60_000 }, async () => {
  for (const env of [{}, { TRUSTPILOT_BUSINESS_UNIT_ID: BU }, { TRUSTPILOT_SHOW: '1' }, { TRUSTPILOT_BUSINESS_UNIT_ID: 'zly-id', TRUSTPILOT_SHOW: '1' }]) await withServer(env, async (get) => {
    for (const p of ['/', '/en', '/narzedzia/skaner-cv']) {
      const r = await get(p);
      assert.doesNotMatch(r.h, /trustpilot-widget|widget\.trustpilot\.com|tp-hero|tp-mini/, `${JSON.stringify(env)} ${p}`); assert.doesNotMatch(r.csp, /trustpilot/, p);
      // (link do profilu Trustpilot w sameAs JSON-LD był już wcześniej, dlatego sprawdzamy tylko widżet)
    }
  });
});

test('Włączony: Micro pod hero w języku wersji, Mini nad płatnością, skrypt z nonce, CSP z widget.trustpilot.com', { timeout: 60_000 }, async () => {
  await withServer({ TRUSTPILOT_BUSINESS_UNIT_ID: BU, TRUSTPILOT_SHOW: '1' }, async (get) => {
    const r = await get('/');
    const hero = r.h.indexOf('<section class="hero"'), heroEnd = r.h.indexOf('</section>', hero), micro = r.h.indexOf('data-template-id="5419b6a8b0d04a076446a9ad"');
    assert.ok(micro > heroEnd && micro < r.h.indexOf('id="skaner"'), 'Micro Review Count tuż pod hero');
    assert.match(r.h, new RegExp(`<div class="trustpilot-widget tp-micro" data-locale="pl-PL" data-template-id="5419b6a8b0d04a076446a9ad" data-businessunit-id="${BU}"`));
    const s6 = r.h.slice(r.h.indexOf('<section data-step="6"'), r.h.indexOf('<section data-step="7"'));
    assert.match(s6, /<div class="tp-mini-box"><div class="trustpilot-widget tp-mini" data-locale="pl-PL" data-template-id="53aa8807dec7e10d38f59f36"/);
    assert.match(r.h, /<script nonce="[^"]+" src="https:\/\/widget\.trustpilot\.com\/bootstrap\/v5\/tp\.widget\.bootstrap\.min\.js" async><\/script><\/body>/);
    assert.match(r.csp, /script-src [^;]*https:\/\/widget\.trustpilot\.com/); assert.match(r.csp, /frame-src [^;]*https:\/\/widget\.trustpilot\.com/);
    assert.doesNotMatch(r.csp, /img-src [^;]*trustpilot/);
    for (const [p, loc] of [['/en', 'en-GB'], ['/de', 'de-DE'], ['/uk', 'en-GB']]) {
      const x = await get(p); assert.match(x.h, new RegExp(`tp-micro" data-locale="${loc}"`), p); assert.doesNotMatch(x.h, /data-locale="pl-PL"/, p);
    }
  });
});
