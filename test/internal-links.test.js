import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes, ART_TOPICS, relatedFor } from '../lib/seo.js';
import { ARTICLES, PROFESSIONS } from '../lib/content.js';
import { templateFor } from '../lib/templates-content/index.js';
import { employersFor } from '../lib/employers-data.js';

// Linkowanie wewnętrzne: „Powiązane” w poradnikach (3–5 linków), sekcje na stronach zawodów, hub /poradnik w tematach, spójne okruszki.
test('Tematy poradnika: każdy artykuł w dokładnie jednym temacie; „Powiązane” ma 3–5 działających linków', () => {
  const all = ART_TOPICS.flatMap(([, l]) => l);
  assert.equal(new Set(all).size, all.length, 'bez powtórzeń');
  assert.deepEqual([...all].sort(), ARTICLES.map((a) => a.slug).sort(), 'wszystkie artykuły');
  for (const a of ARTICLES) {
    const r = relatedFor(a), hrefs = r.map(([h]) => h);
    assert.ok(r.length >= 3 && r.length <= 5, `${a.slug}: ${r.length}`);
    assert.equal(new Set(hrefs).size, hrefs.length);
    assert.ok(!hrefs.includes(`/poradnik/${a.slug}`), 'bez linku do siebie');
    for (const h of hrefs) assert.match(h, /^\/(poradnik\/[\w-]+|cv\/[\w-]+|wzor-cv(\/[\w-]+)?|narzedzia\/[\w-]+)$/);
  }
});

test('Strony: poradnik z blokiem „Powiązane”, zawód z trzema sekcjami, hub /poradnik, okruszki zgodne z BreadcrumbList', async () => {
  const B = 'https://example.test', app = express(); seoRoutes(app, B);
  const s = app.listen(0), U = `http://127.0.0.1:${s.address().port}`, get = async (p) => (await fetch(U + p)).text();
  const ld = (h, type) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === type);
  try {
    const a = ARTICLES[0], h = await get(`/poradnik/${a.slug}`);
    assert.ok(h.includes('<h2>Powiązane</h2>')); assert.ok(!h.includes('<h2>Przeczytaj też</h2>') && !h.includes('<h2>CV dla zawodów</h2>'));
    assert.match(h, /<nav class="crumbs"><a href="\/">Strona główna<\/a> › <a href="\/poradnik">Poradnik<\/a> › /);
    assert.deepEqual(ld(h, 'BreadcrumbList').itemListElement.map((x) => x.item), [`${B}/`, `${B}/poradnik`, `${B}/poradnik/${a.slug}`]);

    const hub = await get('/poradnik');
    for (const [t, l] of ART_TOPICS) { assert.ok(hub.includes(`<h2>${t}</h2>`), t); for (const x of l) assert.ok(hub.includes(`href="/poradnik/${x}"`), x); }

    const p = PROFESSIONS.find((x) => employersFor(x.slug).length && templateFor(x.slug)), ph = await get(`/cv/${p.slug}`);
    for (const t of ['Poradniki dla tego zawodu', 'Pracodawcy, którzy często szukają', 'Wzór CV i list']) assert.ok(ph.includes(`<h2>${t}</h2>`), t);
    assert.ok(ph.includes(`href="/wzor-cv/${templateFor(p.slug).slug}"`));
    assert.deepEqual(ld(ph, 'BreadcrumbList').itemListElement.map((x) => x.name), ['Strona główna', 'CV dla zawodów', p.name]);
    const q = PROFESSIONS.find((x) => !templateFor(x.slug)), qh = await get(`/cv/${q.slug}`);
    assert.ok(qh.includes('<h2>Wzór CV i list</h2><div class="more"><a href="/wzor-cv">'), 'bez własnego wzoru: link do wzorów');
    assert.match(await get('/sitemap.xml'), /<loc>https:\/\/example\.test\/poradnik<\/loc>/);
  } finally { s.close(); }
});
