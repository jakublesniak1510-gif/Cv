import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Konwersja z reklam (28.10): hero „z reklamy” (utm_source=google|meta, gclid, fbclid; sessionStorage na wizytę),
// prostszy krok 1 („Nie mam ogłoszenia”, „Zmień pakiet”), step1_exit z powodem i źródłem, tabele w panelu.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-adhero-'));
const express = (await import('express')).default;
const { seoRoutes } = await import('../lib/seo.js');
const { isAdHit } = await import('../lib/ad-hero.js');
const { PRICES } = await import('../lib/pricing.js');
const { analyticsRoutes, analyticsDays, step1Exits, sourceOf, funnelText, funnelRange } = await import('../lib/analytics.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('Hero „z reklamy”: tylko przy utm_source=google|meta, gclid albo fbclid; treść, cena z cennika, bez presji; szablon tylko po polsku', async () => {
  for (const q of [{ utm_source: 'google' }, { utm_source: 'Meta' }, { gclid: 'x' }, { fbclid: 'y' }]) assert.ok(isAdHit(q), JSON.stringify(q));
  for (const q of [{}, { utm_source: 'newsletter' }, { utm_source: 'share' }]) assert.ok(!isAdHit(q), JSON.stringify(q));
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, get = (p) => fetch(U + p).then(async (r) => ({ h: await r.text(), cc: r.headers.get('cache-control') }));
  try {
    for (const q of ['?utm_source=google&utm_campaign=x', '?utm_source=meta', '?gclid=abc', '?fbclid=abc']) {
      const { h, cc } = await get('/' + q), hero = /<section class="hero" id="top" data-adhero="1">([\s\S]*?)<\/section>/.exec(h)?.[1];
      assert.ok(hero, q); assert.match(cc || '', /no-store/);
      const col = /<div class="ad-hero-col">([\s\S]*?)<\/div>\s*<div class="demo"/.exec(hero)[1], t = text(col);
      assert.match(col, new RegExp(`<h1>CV dopasowane do ogłoszenia w 2 minuty – ${PRICES.cv / 100} zł</h1>`));
      assert.match(col, /<textarea id="heroAdIn"[^>]*placeholder="Wklej link albo treść ogłoszenia LUB wpisz stanowisko"/);
      assert.match(col, /<button class="btn lg" type="submit">Pokaż moje CV za darmo<\/button>/);
      assert.equal((col.match(/<li>/g) || []).length, 3); assert.match(t, /podgląd CV przed zapłatą/i); assert.match(col, /href="\/regulamin#gwarancja">Gwarancja dopasowania \(§7a/); assert.match(t, /BLIK albo kartą/);
      assert.doesNotMatch(t, /najlepsz|tylko dziś|ostatni|zostało|gwarantujemy pracę|\d+ ?%/i);
      assert.equal((h.replace(/<template[\s\S]*?<\/template>/g, '').match(/<h1[ >]/g) || []).length, 1, 'jeden h1 poza szablonami');
    }
    const plain = (await get('/')).h; assert.doesNotMatch(plain, /data-adhero/); assert.match(plain, /Jedno ogłoszenie\. Jedno CV pisane właśnie pod nie\./);
    assert.match(plain, /<template id="adHeroTpl"><h1>CV dopasowane do ogłoszenia/, 'szablon dla dalszych odsłon wizyty');
    assert.doesNotMatch((await get('/en')).h, /adHeroTpl|data-adhero/);
  } finally { srv.close(); }
  const app2 = read('public/app.js');
  assert.match(app2, /sessionStorage\.setItem\('cvpo-adhero'/); assert.match(app2, /tpl\.content\.cloneNode\(true\)/);
  assert.match(app2, /AD_SRC = AD_Q\.get\('gclid'\) \? 'google' : AD_Q\.get\('fbclid'\) \? 'facebook'/);
  assert.match(app2, /else if \(v\.length < 60 && !\/\\n\/\.test\(v\)\) \{ setMode\(first, 'prof'\); first\.profRun\?\.\(v\); \}/, 'samo stanowisko → CV pod zawód');
  assert.ok(Buffer.byteLength(read('public/index.html')) <= 90e3);
});

test('Krok 1: „Nie mam ogłoszenia – wpisz stanowisko” (29.10: pole z podpowiedziami na dole, pod przykładem CV) i pakiet zwinięty do „Zmień pakiet” (domyślnie Samo CV)', () => {
  const app = read('public/app.js'), html = read('public/index.html');
  assert.match(app, /\$\('#profEx'\)\.after\(el\('div', \{ className: 'noad-box', id: 'noAdBox' \}/); assert.match(app, /textContent: 'Nie mam ogłoszenia – wpisz stanowisko'/);
  assert.match(app, /\$\('#noAdQ'\)\.setAttribute\('list', 'profList'\)/, 'podpowiedzi zawodów');
  assert.match(app, /setMode\(first, 'prof'\); first\.profRun\?\.\(q\);/);
  assert.match(app, /textContent: 'Zmień pakiet', onclick: \(\) => \{ pkgOpen = true; refresh\(\);/);
  assert.match(app, /\$\('#pkgOpts'\)\.hidden = passOn\(\) \|\| !pkgOpen; drawPkgLine\(\);/); assert.match(app, /let pkgOpen = false;/);
  assert.match(html, /<input type="radio" name="pkg" value="cv" checked>/, 'domyślnie CV');
});

test('step1_exit: powód i źródło (google/facebook/direct), raz na osobę; „meta” i fbclid to facebook; tabela i dzienne podsumowanie', async () => {
  assert.equal(sourceOf('', 'meta'), 'facebook'); assert.equal(sourceOf('', 'google'), 'google'); assert.equal(sourceOf('', ''), 'direct');
  const app = express(); analyticsRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const t = (ua, body) => fetch(U + '/api/t', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'User-Agent': ua }, body: JSON.stringify(body) });
  try {
    const who = [['g1', 'google', 'noad'], ['g2', 'google', 'link'], ['f1', 'meta', 'empty'], ['f2', 'facebook', 'noad'], ['d1', '', 'empty'], ['d2', '', 'zle']];
    for (const [ua, u, why] of who) { await t(`Mozilla/5.0 ${ua}`, { e: 'pv', u, p: '/' }); await t(`Mozilla/5.0 ${ua}`, { e: 'step1exit', why, u }); await t(`Mozilla/5.0 ${ua}`, { e: 'step1exit', why: 'other', u }); }
    await wait(300);
    const ev = Object.values(await analyticsDays()).reduce((o, x) => ({ ...o, ...x.events }), {});
    assert.equal(ev.step1_exit, 6, 'raz na osobę dziennie');
    const rows = step1Exits(ev), r = (k) => rows.find((x) => x.key === k);
    assert.deepEqual(rows.map((x) => x.label), ['Brak ogłoszenia', 'Błąd linku', 'Zamknięcie bez wpisania', 'Inne (ogłoszenie wpisane)']);
    assert.deepEqual(r('noad').src, { google: 1, facebook: 1, direct: 0, inne: 0 }); assert.deepEqual(r('link').src, { google: 1, facebook: 0, direct: 0, inne: 0 });
    assert.deepEqual(r('empty').src, { google: 0, facebook: 1, direct: 1, inne: 0 }); assert.equal(r('other').n, 1, 'nieznany powód → inne');
    const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
    assert.match(funnelText(await funnelRange(day, day)), /Wyjścia z kroku 1: brak ogłoszenia 2 \(google 1, facebook 1\); błąd linku 1 \(google 1\)/);
    assert.deepEqual(step1Exits({}), []);
  } finally { srv.close(); }
  const app2 = read('public/app.js');
  for (const [why, re] of [['noad', /if \(e\.dataset\.mode === 'prof'\) return 'noad';/], ['link', /if \(e\.dataset\.linkErr && text\.length < 80\) return 'link';/], ['empty', /if \(!text && !url && !q\) return 'empty';/]]) assert.match(app2, re, why);
  assert.match(app2, /e\.dataset\.linkErr = '1'/); assert.match(app2, /const closeWiz = \(\) => \{ wizExit\(\); step1Exit\(\);/); assert.match(app2, /addEventListener\('pagehide', step1Exit\)/);
});

test('Panel → Lejek kreatora: wyjścia z kroku 1 (powód × źródło) i lejek według źródła z kolumnami „Ostatni krok” i „Opłacone”, przewijane', () => {
  const html = read('public/admin.html'), adm = read('public/admin.js'), rep = read('lib/seo-report.js');
  assert.match(html, /<div class="tbl-wrap" id="seoStep1"><\/div>/); assert.match(html, /<div class="tbl-wrap" id="seoSrc28"><\/div>/);
  assert.match(adm, /\$\('#seoStep1'\)\.replaceChildren\(d\.step1\?\.length \? stackTable\(/); assert.match(adm, /\$\('#seoSrc'\)\.replaceChildren\(f \? stackTable\(/); assert.match(adm, /\['google', 'facebook', 'direct', 'inne'\]/); assert.match(adm, /\$\('#seoSrc28'\)/);
  assert.match(rep, /step1: step1Exits\(ev28\), lowMatch: lowMatchStats\(ev28\), sources: \{ stages: f28\.stages\.map/);
  const labels = read('lib/analytics.js'); assert.match(labels, /\['last', 'Ostatni krok'\], \['checkout', 'Płatność rozpoczęta'\], \['paid', 'Opłacone'\]/);
  assert.match(read('public/admin.css'), /\.tbl-wrap\{overflow-x:auto/);
});
