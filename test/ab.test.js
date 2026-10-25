import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-'));
const { EXPERIMENTS, activeExperiments, variantOf, zTest, abReport, abText } = await import('../lib/ab.js');
const an = await import('../lib/analytics.js');
const { seoRoutes } = await import('../lib/seo.js');

test('EXPERIMENTS: format zmiennej, nieznane i błędne pomijane', () => {
  assert.deepEqual(activeExperiments(''), {});
  assert.deepEqual(activeExperiments('nie json'), {});
  assert.deepEqual(activeExperiments('{"hero":50,"cta":30,"inny":50}'), { hero: 50, cta: 30 });
  assert.deepEqual(activeExperiments('["hero"]'), { hero: 50 });
  assert.deepEqual(activeExperiments('{"hero":true,"cta":false}'), { hero: 50 });
  assert.deepEqual(activeExperiments('{"hero":0,"cta":100}'), {}, '0 i 100% to nie test');
});

test('Przydział: stały dla odwiedzającego, ok. 50/50, niezależny między testami', () => {
  assert.equal(variantOf('hero', 'abc'), variantOf('hero', 'abc'));
  const ids = Array.from({ length: 4000 }, (_, i) => `v${i}`), b = ids.filter((v) => variantOf('hero', v) === 'B').length;
  assert.ok(b > 1800 && b < 2200, `B: ${b}/4000`);
  const both = ids.filter((v) => variantOf('hero', v) === 'B' && variantOf('cta', v) === 'B').length;
  assert.ok(both > 850 && both < 1150, `oba B: ${both}`);
  assert.ok(ids.filter((v) => variantOf('cta', v, 20) === 'B').length < 1000, 'podział 20%');
});

test('Warianty B zmieniają aktualną stronę główną (strażnik na zmiany w index.html)', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const [k, e] of Object.entries(EXPERIMENTS)) if (!e.scope) assert.notEqual(e.apply(html), html, `${k}: wariant B nie znalazł elementu`); // „scanner” zmienia odpowiedź /api/scan, nie HTML
});

test('Test z dwóch proporcji', () => {
  const r = zTest(50, 1000, 80, 1000);
  assert.equal(r.z, 2.72); assert.ok(r.p > 0.005 && r.p < 0.008, String(r.p));
  assert.equal(zTest(5, 100, 5, 100).p, 1);
  assert.deepEqual(zTest(0, 0, 1, 10), { z: null, p: null });
});

test('Strona główna z wariantem, lejek per wariant, wariant w zamówieniu, raport', async () => {
  process.env.EXPERIMENTS = '{"hero":50,"cta":50}';
  const app = express(); app.set('trust proxy', true);
  an.analyticsRoutes(app, 'https://example.test'); seoRoutes(app, 'https://example.test');
  app.get('/visit-info', (req, res) => res.json(an.visitInfo(req)));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  const ua = (i) => ({ 'user-agent': `Mozilla/5.0 test ${i}`, 'x-forwarded-for': `10.0.0.${i}` });
  try {
    const seenB = new Set();
    for (let i = 1; i <= 40; i++) {
      const r = await fetch(U + '/', { headers: ua(i) }), h = await r.text();
      assert.equal(r.headers.get('cache-control'), 'private, no-store');
      if (h.includes('<h1>CV dopasowane do ogłoszenia w kilka minut')) seenB.add('hero');
      if (h.includes('href="#skaner">Sprawdź za darmo, potem zrób CV</a>')) seenB.add('cta');
      assert.ok(h.includes('<link rel="canonical" href="https://example.test/">'));
    }
    assert.deepEqual([...seenB].sort(), ['cta', 'hero'], 'oba warianty B się pojawiają');
    await fetch(U + '/', { headers: ua(1) }); // ponowne wejście tego samego odwiedzającego nie liczy się drugi raz
    await fetch(U + '/', { headers: { 'user-agent': 'Googlebot/2.1' } });
    for (const e of [{ e: 'pv', p: '/' }, { e: 'start' }, { e: 'start' }]) await fetch(U + '/api/t', { method: 'POST', headers: ua(1), body: JSON.stringify(e) });
    const vi = await (await fetch(U + '/visit-info', { headers: ua(1) })).json();
    assert.deepEqual(Object.keys(vi.ab).sort(), ['cta', 'hero']);
    await an.funnelPaid({ visit: vi });
    await new Promise((r) => setTimeout(r, 50));
    const d = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }), f = await an.funnelRange(d, d);
    const visits = (id) => (f.ab[`${id}:A`]?.visit || 0) + (f.ab[`${id}:B`]?.visit || 0);
    assert.equal(visits('hero'), 40); assert.equal(visits('cta'), 40);
    assert.equal(f.ab[`hero:${vi.ab.hero}`].start, 1, 'start raz na odwiedzającego');
    assert.equal(f.ab[`hero:${vi.ab.hero}`].paid, 1); assert.equal(f.ab[`cta:${vi.ab.cta}`].paid, 1);
    const rep = abReport(f.ab, activeExperiments());
    assert.deepEqual(rep.map((e) => e.id).sort(), ['cta', 'hero']);
    const hero = rep.find((e) => e.id === 'hero'); assert.equal(hero.variants[0].visit + hero.variants[1].visit, 40); assert.ok(hero.active);
    assert.match(abText(rep), /Test A\/B „Nagłówek strony głównej”: A \d+ wejść/);
    process.env.EXPERIMENTS = '';
    const plain = await fetch(U + '/', { headers: ua(2) });
    assert.notEqual(plain.headers.get('cache-control'), 'private, no-store');
    const home = await plain.text();
    assert.equal(plain.headers.get('cache-control'), null, 'bez EXPERIMENTS: nagłówki jak dotąd');
    assert.equal(home, (await (await fetch(U + '/', { headers: ua(3) })).text()), 'bez EXPERIMENTS: ta sama strona dla każdego');
    assert.ok(home.includes('<h1>Jedno ogłoszenie. Jedno CV pisane właśnie pod nie.</h1>') && home.includes('<button class="btn lg" data-open>Zamów CV od 39 zł</button>'), 'bez EXPERIMENTS: obecna strona');
  } finally { srv.close(); delete process.env.EXPERIMENTS; }
});
