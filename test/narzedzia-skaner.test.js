import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-toolscan-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, funnelRange, funnelText } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// PR H: blok „Sprawdź też swoje CV” na narzędziach, kontekst zawodu z quizu, podpowiedź w skanerze, zbiorczy beacon.
test('Narzędzia: blok poza skanerem i narzędziami do CV, zawód z quizu, ?zawod= w skanerze, tłumaczenia', () => {
  const app = read('public/app.js');
  assert.match(app, /const NO_SCAN_BLOCK = new Set\(\['skaner-cv', 'sprawdz-cv', 'test-cv-ats'\]\);/);
  assert.match(app, /\.\.\.\(NO_SCAN_BLOCK\.has\(slug\) \? \[\] : \[toolScanBlock\(slug\)\]\)/);
  assert.match(app, /onclick: \(\) => track\('toolscan', \{ t: slug \}\)/);
  assert.match(app, /\?zawod=\$\{encodeURIComponent\(p\.slug\)\}/);
  assert.match(app, /window\.__toolCtx\?\.\(ranked\[0\]\?\.p\)/, 'najlepszy zawód z quizu');
  assert.match(app, /slug === 'skaner-cv' \? \[partnerHead\(\), scanCtxHint\(C\)\]/, 'podpowiedź zawodu (i nagłówek uczelni z PR Y)');
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['Sprawdź też swoje CV', 'CV dla zawodu: {0}', 'Skanujesz CV na:', 'Jak napisać CV dla tego zawodu']) assert.ok(d[k], `${l}: ${k}`); }
});

test('Beacon „toolscan”: raz na odwiedzającego, z nazwą narzędzia, w raporcie lejka', async () => {
  const app = express(); analyticsRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}/api/t`;
  const send = (ua, body) => fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(body) });
  try {
    await send('Mozilla/5.0 A', { e: 'toolscan', t: 'kalkulator-wynagrodzen' }); await send('Mozilla/5.0 A', { e: 'toolscan', t: 'kalkulator-wynagrodzen' });
    await send('Mozilla/5.0 B', { e: 'toolscan', t: '<script>' }); await wait(300);
    const all = await analyticsDays(), ev = (Array.isArray(all) ? all : Object.values(all)).find((x) => x.events?.tool_scanner)?.events || {};
    assert.equal(ev.tool_scanner, 2); assert.equal(ev['tool_scanner:kalkulator-wynagrodzen'], 1); assert.equal(ev['tool_scanner:inne'], 1);
    const d = new Date().toISOString().slice(0, 10);
    assert.match(funnelText(await funnelRange(d, d)), /Narzędzia → skaner: 2 \(kalkulator-wynagrodzen 1, inne 1\)\./);
  } finally { srv.close(); }
});
