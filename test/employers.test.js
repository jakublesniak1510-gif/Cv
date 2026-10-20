import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';
import { employerRoutes, noMoney } from '../lib/employers.js';
import { EMPLOYERS, employersFor } from '../lib/employers-data.js';
import { PROFESSIONS } from '../lib/content.js';

const RAW = JSON.parse(fs.readFileSync(new URL('../data/seo/pracodawcy.json', import.meta.url), 'utf8'));
const base = 'https://example.test';

test('Dane: wszystkie firmy z treścią redakcyjną, istniejące zawody, odmiana „w …”', () => {
  assert.equal(EMPLOYERS.length, RAW.length);
  for (const e of EMPLOYERS) {
    assert.match(e.w, /^(w|na) /, e.slug); assert.ok(e.tips.length >= 5 && e.faq.length >= 2, e.slug);
    for (const z of e.zawody) assert.ok(PROFESSIONS.some((p) => p.slug === z), `${e.slug}: zawód ${z}`);
  }
  assert.ok(employersFor('kasjer').some((e) => e.slug === 'lidl'));
  assert.equal(noMoney('Aplikujesz online. Premia 400 zł brutto. Złożenie CV przez formularz.'), 'Aplikujesz online. Złożenie CV przez formularz.');
});

test('Strony /praca-w: dopisek o braku powiązań z datą, bez kwot i grafik, link do kariery nofollow, FAQPage, mapa strony, linki z zawodów', async () => {
  const app = express(); seoRoutes(app, base); employerRoutes(app, base); app.use((req, res) => sendNotFound(req, res, base));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, get = async (p) => { const r = await fetch(U + p); return { s: r.status, t: await r.text() }; };
  try {
    for (const e of EMPLOYERS) {
      const { s, t } = await get(`/praca-w/${e.slug}`), main = /<section class="page" id="page"[^>]*>([\s\S]*?)<\/section>/.exec(t)?.[1] || '';
      assert.equal(s, 200, e.slug);
      assert.ok(main.includes(`<h1>CV do pracy ${e.w.replace(/'/g, '&#39;')} – jak aplikować i czego wymagają</h1>`), `${e.slug}: H1`);
      const [y, m, d] = e.stan_na.split('-');
      assert.ok(main.includes(`nie jest powiązany z firmą`) && main.includes(`(stan na ${d}.${m}.${y})`), `${e.slug}: dopisek`);
      assert.doesNotMatch(main, /\bPLN\b/, `${e.slug}: PLN`);
      assert.deepEqual(main.match(/\d[\d\s–-]*\s?zł/g)?.filter((x) => !/^39\s?zł$/.test(x.trim())) || [], [], `${e.slug}: bez kwot poza ceną CV`);
      assert.ok(!/<img|<svg/i.test(main), `${e.slug}: bez grafik`);
      assert.ok(main.includes(`href="${e.kariera_url.replace(/&/g, '&amp;')}" rel="nofollow noopener"`), `${e.slug}: strona kariery`);
      assert.ok(main.includes('Aktualne stawki firma podaje w ogłoszeniach'), `${e.slug}: zamiast wynagrodzeń`);
      assert.ok(t.includes('"@type":"FAQPage"') && t.includes('"@type":"BreadcrumbList"'), `${e.slug}: schema`);
    }
    assert.ok((await get('/praca-w/orlen')).t.includes('pracowników zatrudnia zwykle prowadzący stację'));
    assert.equal((await get('/praca-w')).s, 200);
    assert.equal((await get('/praca-w/nie-ma-takiej')).s, 404);
    const sm = (await get('/sitemap.xml')).t; assert.ok(sm.includes(`${base}/praca-w</loc>`) && sm.includes(`${base}/praca-w/lidl</loc>`));
    assert.ok((await get('/cv/kasjer')).t.includes('href="/praca-w/lidl"'), 'link z zawodu');
  } finally { srv.close(); }
});
