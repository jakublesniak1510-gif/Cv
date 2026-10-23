import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ATS_ARTICLES } from '../lib/articles-ats.js';
import { ARTICLES } from '../lib/content.js';
import { ART_TOPICS } from '../lib/seo.js';

// PR C2: poradniki o ATS i dopasowaniu CV z elementami interaktywnymi, list pod ogłoszenie, rozbudowa podsumowania.
const SLUGS = ['ats-mity-i-fakty', 'format-cv-pod-ats', 'czy-dopasowywac-cv-do-kazdej-oferty', 'cv-pod-ai', 'slowa-kluczowe-ats-wedlug-zawodu'];
const port = 4500 + Math.floor(Math.random() * 90), U = `http://localhost:${port}`;
let srv;
before(async () => {
  srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-c2-')), BASE_URL: U, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '' }, stdio: 'ignore' });
  for (let i = 0; i < 150; i++) { try { await fetch(`${U}/health`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => srv?.kill());

test('Treść: 5 poradników, w temacie „CV pod ogłoszenie i systemy ATS”, źródła przy liczbach, zasady redakcyjne', () => {
  assert.deepEqual(ATS_ARTICLES.map((a) => a.slug).sort(), [...SLUGS].sort());
  const topic = ART_TOPICS.find(([t]) => t === 'CV pod ogłoszenie i systemy ATS')[1];
  for (const a of ATS_ARTICLES) {
    assert.ok(topic.includes(a.slug), `${a.slug}: temat`);
    assert.ok(a.title.length <= 60 && a.metaDescription.length <= 155 && a.sections.length >= 5 && a.faq.length >= 3 && a.widget, `${a.slug}: części`);
    const txt = JSON.stringify({ ...a, sources: undefined });
    assert.doesNotMatch(txt, /gwarant|najlepsz|https?:\/\//i, `${a.slug}: bez obietnic i adresów w tekście`);
    assert.deepEqual(txt.match(/[a-ząćęłńóśźż]+(łeś|łaś)(?=[\s,.;:!?)–-]|$)/gi), null, `${a.slug}: formy rodzajowe`);
    if (/\d+\s?%/.test(txt)) assert.ok(a.sources?.length, `${a.slug}: liczby procentowe tylko ze źródłami`);
    for (const s of a.sources || []) assert.match(s.u, /^https:\/\//);
  }
  assert.match(JSON.stringify(ATS_ARTICLES.find((a) => a.slug === 'ats-mity-i-fakty')), /75/, 'mit „75%” omówiony');
  const sum = ARTICLES.find((a) => a.slug === 'podsumowanie-zawodowe-w-cv');
  assert.equal(sum.widget, 'summary-gen'); assert.equal(sum.sections.at(-1).p.length, 16, '15 par + wstęp');
});

test('Strony: widżety, źródła, FAQPage; /api/ad-keywords bez zapisu; list pod ogłoszenie; mapa strony', async () => {
  for (const s of SLUGS) {
    const h = await (await fetch(`${U}/poradnik/${s}`)).text();
    assert.match(h, /<section class="widget" data-widget="/, s); assert.match(h, /"@type":"FAQPage"/, s);
  }
  const kw = await (await fetch(`${U}/poradnik/slowa-kluczowe-ats-wedlug-zawodu`)).text();
  assert.match(kw, /<form class="kw-extract paste-ad"/); assert.ok((kw.match(/<h3><a href="\/cv\//g) || []).length === 20, '20 zawodów');
  assert.match(await (await fetch(`${U}/poradnik/czy-dopasowywac-cv-do-kazdej-oferty`)).text(), /<form class="time-calc"/);
  assert.match(await (await fetch(`${U}/poradnik/podsumowanie-zawodowe-w-cv`)).text(), /<form class="sum-gen paste-ad"/);
  const r = await fetch(`${U}/api/ad-keywords`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adText: 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, uprawnienia UDT, znajomość WMS, praca zmianowa. Mile widziane: prawo jazdy kat. B.' }) });
  const j = await r.json(); assert.equal(r.headers.get('cache-control'), 'no-store'); assert.ok(j.keywords.includes('uprawnienia UDT'), JSON.stringify(j));
  assert.equal((await fetch(`${U}/api/ad-keywords`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"adText":"za krótko"}' })).status, 400);
  const l = await (await fetch(`${U}/narzedzia/list-motywacyjny-pod-ogloszenie`)).text();
  assert.match(l, /<title>List motywacyjny pod ofertę pracy – generator online/); assert.match(l, /49 zł/); assert.match(l, /dane fikcyjne/); assert.match(l, /"@type":"FAQPage"/);
  const sm = await (await fetch(`${U}/sitemap.xml`)).text();
  for (const u of [...SLUGS.map((s) => `poradnik/${s}`), 'narzedzia/list-motywacyjny-pod-ogloszenie']) assert.ok(sm.includes(`${U}/${u}</loc>`), u);
  const lite = fs.readFileSync(new URL('../public/lite.js', import.meta.url), 'utf8');
  for (const c of ['form.kw-extract', 'form.sum-gen', 'form.time-calc']) assert.ok(lite.includes(c), c);
});
