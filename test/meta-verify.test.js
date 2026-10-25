import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import express from 'express';

// META_DOMAIN_VERIFY: metatag weryfikacji domeny Meta w <head> stron (strona główna, strony zawodów, lekkie podstrony);
// bez zmiennej – brak tagu. Wartość escapowana.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TAG = /<meta name="facebook-domain-verification" content="abc123xyz&quot;&gt;">/;

test('Z META_DOMAIN_VERIFY: tag na /, /cv/kierowca i /kreator-cv (escapowany), tylko raz', async () => {
  process.env.META_DOMAIN_VERIFY = 'abc123xyz">';
  const { seoRoutes } = await import('../lib/seo.js'), { landingRoutes } = await import('../lib/landing.js');
  const app = express(); seoRoutes(app, 'https://example.test'); landingRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const p of ['/', '/cv/kierowca', '/kreator-cv', '/en']) {
      const h = await (await fetch(U + p)).text();
      assert.match(h, TAG, p); assert.equal(h.match(/facebook-domain-verification/g).length, 1, p);
      assert.ok(h.indexOf('facebook-domain-verification') < h.indexOf('</head>'), `${p}: w <head>`);
    }
  } finally { srv.close(); delete process.env.META_DOMAIN_VERIFY; }
  assert.match(fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8'), /META_DOMAIN_VERIFY=[\s\S]*PINTEREST_VERIFY=/);
});

test('Bez META_DOMAIN_VERIFY: brak tagu', { timeout: 60_000 }, async () => {
  const port = 5400 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-meta-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', META_DOMAIN_VERIFY: '' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    for (const p of ['/', '/cv/kierowca']) assert.doesNotMatch(await (await fetch(U + p)).text(), /facebook-domain-verification|p:domain_verify/, p);
  } finally { srv.kill(); }
});

test('Z PINTEREST_VERIFY (osobny proces, bo index.html jest w pamięci): <meta name="p:domain_verify"> w <head>, escapowany, raz; obok tagu Meta', { timeout: 60_000 }, async () => {
  const port = 5500 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-pin-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', META_DOMAIN_VERIFY: 'fb1', PINTEREST_VERIFY: ' 9f8e7d6c5b4a"> ' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    for (const p of ['/', '/cv/kierowca', '/kreator-cv', '/de']) {
      const h = await (await fetch(U + p)).text();
      assert.match(h, /<meta charset="utf-8"><meta name="facebook-domain-verification" content="fb1"><meta name="p:domain_verify" content="9f8e7d6c5b4a&quot;&gt;">/, p);
      assert.equal(h.match(/p:domain_verify/g).length, 1, p); assert.ok(h.indexOf('p:domain_verify') < h.indexOf('</head>'), p);
    }
  } finally { srv.kill(); }
});
