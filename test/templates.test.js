import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';
import { templateRoutes, TEMPLATES } from '../lib/templates.js';
import { TEMPLATE_ORDER } from '../lib/templates-content/index.js';
import { unzip } from '../lib/zip.js';

// Darmowe wzory CV i listów (DOCX): 25 zawodów × 2 strony + 2 huby, unikalna treść, FAQPage, CTA, pobieranie bez rejestracji.
const base = 'https://example.test';
let srv, port;
before(() => { const app = express(); seoRoutes(app, base); templateRoutes(app, base); app.use((req, res) => sendNotFound(req, res, base)); srv = app.listen(0); port = srv.address().port; });
after(() => srv.close());
const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}${p}`); return { status: r.status, type: r.headers.get('content-type'), disp: r.headers.get('content-disposition'), buf: Buffer.from(await r.arrayBuffer()) }; };
const main = (html) => /<section class="page" id="page" role="main"[^>]*>([\s\S]*?)<\/section>/.exec(html)?.[1] || '';
const lds = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const docText = (buf) => unzip(buf).find((f) => f.name === 'word/document.xml').data.toString('utf8').replace(/<[^>]+>/g, ' ');

test('Treści wzorów: wszystkie 25 zawodów, ≥ 600 słów na stronę, bez zakazanych obietnic i powtórzeń (scripts/check-templates.mjs)', () => {
  assert.deepEqual(Object.keys(TEMPLATES).sort(), [...TEMPLATE_ORDER].sort());
  execFileSync(process.execPath, ['scripts/check-templates.mjs'], { stdio: 'pipe' });
});

test('Huby /wzor-cv i /list-motywacyjny: linki do 25 zawodów, CTA', async () => {
  for (const [path, kind] of [['wzor-cv', 'wzor-cv'], ['list-motywacyjny', 'list-motywacyjny']]) {
    const r = await get(`/${path}`), h = r.buf.toString();
    assert.equal(r.status, 200);
    for (const s of TEMPLATE_ORDER) assert.ok(h.includes(`href="/${kind}/${s}"`), `${path} → ${s}`);
    assert.equal((main(h).match(/<h1>/g) || []).length, 1);
    assert.match(h, /<link rel="canonical" href="https:\/\/example\.test\/[a-z-]+">/);
  }
});

test('Strony wzorów: H1, unikalny tytuł, FAQPage, CTA z ceną, skaner, DOCX i PDF, newsletter niezaznaczony', async () => {
  const titles = new Set();
  for (const s of TEMPLATE_ORDER) {
    const t = TEMPLATES[s];
    for (const [path, kind] of [['wzor-cv', 'cv'], ['list-motywacyjny', 'letter']]) {
      const r = await get(`/${path}/${s}`), h = r.buf.toString();
      assert.equal(r.status, 200, `${path}/${s}`);
      assert.equal((main(h).match(/<h1>/g) || []).length, 1, `${path}/${s}: jeden H1`);
      const title = h.match(/<title>(.*?)<\/title>/)[1]; assert.ok(!titles.has(title), `tytuł powtórzony: ${title}`); titles.add(title);
      const faq = lds(h).find((x) => x['@type'] === 'FAQPage');
      assert.equal(faq.mainEntity.length, t[kind].faq.length);
      assert.match(h, /Dopasuj ten wzór do konkretnego ogłoszenia – od 39 zł/);
      assert.ok(h.includes('href="/narzedzia/skaner-cv"'));
      assert.ok(h.includes(`href="/${path}/${s}.docx"`) && h.includes(`href="/${path}/${s}.pdf"`));
      assert.match(h, /<input type="checkbox" name="consent">/, 'zgoda na newsletter domyślnie niezaznaczona');
      assert.match(h, /<script src="\/lite\.js\?v=[0-9a-f]+" defer><\/script>/, 'lekka strona tylko z serwera');
      assert.doesNotMatch(h, /gwarant|\d+\s?% (więcej|szans)/i);
    }
  }
});

test('Pliki: DOCX z danymi przykładowymi i dopiskiem PRZYKŁAD, PDF podglądu, nieznany zawód → 404', async () => {
  for (const s of ['kasjer', 'student-bez-doswiadczenia', 'spawacz']) {
    const t = TEMPLATES[s];
    const cv = await get(`/wzor-cv/${s}.docx`);
    assert.equal(cv.status, 200); assert.match(cv.type, /wordprocessingml/); assert.match(cv.disp, new RegExp(`attachment; filename="wzor-cv-${s}\\.docx"`));
    const x = docText(cv.buf); assert.match(x, /PRZYKŁAD/); assert.ok(x.includes(t.cv.sample.name.split(' ')[0])); assert.ok(x.includes(t.cv.sample.experience[0].title.split(' ')[0]));
    const l = await get(`/list-motywacyjny/${s}.docx`); assert.equal(l.status, 200); assert.match(docText(l.buf), /PRZYKŁAD/);
    const pdf = await get(`/wzor-cv/${s}.pdf`); assert.equal(pdf.status, 200); assert.ok(pdf.buf.subarray(0, 4).toString() === '%PDF');
    const lp = await get(`/list-motywacyjny/${s}.pdf`); assert.ok(lp.buf.subarray(0, 4).toString() === '%PDF');
  }
  assert.equal((await get('/wzor-cv/nie-ma-takiego')).status, 404);
  assert.equal((await get('/wzor-cv/nie-ma-takiego.docx')).status, 404);
});

test('Mapa strony i linkowanie: 52 adresy wzorów, link ze strony zawodu i z poradnika', async () => {
  const sm = (await get('/sitemap.xml')).buf.toString();
  const urls = [...sm.matchAll(/<loc>https:\/\/example\.test\/((?:wzor-cv|list-motywacyjny)[^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.equal(urls.length, 52);
  const prof = (await get('/cv/kasjer')).buf.toString();
  assert.ok(prof.includes('href="/wzor-cv/kasjer"') && prof.includes('href="/list-motywacyjny/kasjer"'));
  const art = (await get('/poradnik/jak-dopasowac-cv-do-ogloszenia')).buf.toString();
  assert.ok(art.includes('href="/wzor-cv"'));
});
