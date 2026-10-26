import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Blok B (26.10), B1–B3: pasek na telefonie po 40% strony (zamykany na 24 h), baner niedokończonego szkicu, skaner → kreator.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-b13-'));
const express = (await import('express')).default;
const { analyticsRoutes, analyticsDays, funnelRange, funnelText } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), lite = read('public/lite.js'), html = read('public/index.html');
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));

test('B1: pasek „CV pod to ogłoszenie – 39 zł” + „Zamów” + ×; 40% strony; pamięć 24 h; strona główna i strony zawodów', () => {
  assert.match(html, /<div class="mcta" id="mcta" hidden><div><b>CV pod to ogłoszenie – 39 zł<\/b><span>bez abonamentu, PDF na e-mail<\/span><\/div><button class="btn sm" data-open>Zamów<\/button><button type="button" class="mcta-x" id="mctaX" aria-label="Zamknij pasek">×<\/button><\/div>/);
  assert.match(app, /const scrolled40 = \(\) => scrollY >= 0\.4 \* Math\.max\(1, document\.documentElement\.scrollHeight - innerHeight\);/);
  assert.match(app, /mctaShow\(!mctaOff\(\) && scrolled40\(\) && !\$\('#landing'\)\.hidden && \$\('#page'\)\.hidden && \$\('#result'\)\.hidden && \(\$\('#account'\)\?\.hidden \?\? true\) && \$\('#wiz'\)\.hidden/, 'nie w kreatorze, wyniku ani na innych stronach aplikacji');
  assert.match(app, /Date\.now\(\) - Number\(localStorage\.getItem\(MCTA_KEY\) \|\| 0\) < 864e5/);
  const PROF = new RegExp(lite.match(/const PROF = \/(.+?)\/\.test/)[1]);
  for (const u of ['/cv/kasjer', '/cv/kasjer/krakow', '/en/cv/cashier', '/uk/rezyume/kasyr', '/de/lebenslauf/kassierer']) assert.ok(PROF.test(u), u);
  for (const u of ['/poradnik/cv-po-angielsku', '/narzedzia/skaner-cv', '/']) assert.ok(!PROF.test(u), u);
  for (const l of ['en', 'de', 'uk']) for (const k of ['CV pod to ogłoszenie – 39 zł', 'bez abonamentu, PDF na e-mail', 'Zamów', 'Zamknij pasek']) assert.ok(dict(l)[k], `${l}: ${k}`);
});

test('B2: baner szkicu z nazwą stanowiska i krokiem, „Dokończ” otwiera ten krok; B3: przycisk z ceną, podpowiedź braków w kroku 3', () => {
  assert.match(html, /<div id="resumeBar" class="refbar resume-bar" hidden><span id="resumeTxt"><\/span> <button type="button" class="btn sm" id="resumeGo">Dokończ<\/button><\/div>/);
  assert.match(app, /\$\('#resumeGo'\)\.onclick = \(\) => \{ track\('draftresume'\); \$\('#resumeBar'\)\.hidden = true; openWiz\(\); go\(st\); \};/);
  assert.match(app, /tr\('krok \{0\} z \{1\}'\)\.replace\('\{0\}', ORDER\.indexOf\(st\) \+ 1\)\.replace\('\{1\}', ORDER\.length\)/);
  assert.match(app, /el\('span', \{ textContent: 'Zamów CV, które pokryje te wymagania –' \}\), ` \$\{PRICE\.cv\} zł`/);
  assert.match(app, /missing: \(j\.missing \|\| \[\]\)\.map\(\(m\) => m\.keyword\)/); assert.match(app, /missing: \(k\.missing \|\| \[\]\)\.map\(\(m\) => m\.keyword\)/);
  assert.match(html, /<section data-step="3" hidden>\s*<p class="scan-hint" id="scanHint" hidden><\/p>/);
  for (const l of ['en', 'de', 'uk']) for (const k of ['Masz niedokończone CV', 'krok {0} z {1}', 'Dokończ', 'Ogłoszenie wymaga:', 'dopisz, jeśli to prawda o Tobie.', 'Zamów CV, które pokryje te wymagania –']) assert.ok(dict(l)[k], `${l}: ${k}`);
});

test('Zdarzenia draft_resume i scan_to_wiz: raz na osobę, w raporcie lejka', async () => {
  const a = express(); analyticsRoutes(a, 'https://example.test');
  const srv = a.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, b) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(b) });
  try {
    for (const e of ['draftresume', 'draftresume', 'scantowiz']) await t('Mozilla/5.0 Z1', { e });
    await t('Mozilla/5.0 Z2', { e: 'scantowiz' });
    await new Promise((r) => setTimeout(r, 300));
    const d = Object.values(await analyticsDays())[0];
    assert.equal(d.events.draft_resume, 1); assert.equal(d.events.scan_to_wiz, 2);
    const txt = funnelText(await funnelRange(d.id, d.id));
    assert.match(txt, /„Dokończ” z banera 1/); assert.match(txt, /Skaner → kreator: 2\./);
  } finally { srv.close(); }
});
