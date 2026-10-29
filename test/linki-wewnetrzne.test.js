import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Audyt linków wewnętrznych (29.10): każda strona zawodu i każdy poradnik PL z mapy strony ma linki z co najmniej 2 innych stron
// (liczymy HTML bez JavaScriptu, bez <template> i <script>). /wzor-cv ma pełną listę zawodów w kategoriach; „Podobne zawody” to
// 10 kolejnych zawodów z kategorii z zawinięciem (każdy zawód dostaje linki od poprzedników).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-inlinks-'));
const express = (await import('express')).default;
const { seoRoutes, similarProfs } = await import('../lib/seo.js');
const { templateRoutes } = await import('../lib/templates.js');
const { PROFESSIONS } = await import('../lib/content.js');

test('Każdy zawód i poradnik PL ma linki wewnętrzne z ≥ 2 innych stron; /wzor-cv linkuje do wszystkich zawodów', { timeout: 300000 }, async () => {
  const app = express(); seoRoutes(app, 'https://example.test'); templateRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const sm = await (await fetch(`${U}/sitemap.xml`)).text();
    const pages = [...sm.matchAll(/<loc>https:\/\/example\.test(\/[^<]*)?<\/loc>/g)].map((m) => m[1] || '/').filter((u) => !/^\/(en|uk|de)(\/|$)/.test(u));
    const inl = new Map();
    for (const u of pages) {
      const r = await fetch(U + u); if (r.status !== 200) continue;
      const h = (await r.text()).replace(/<template[\s\S]*?<\/template>|<script[\s\S]*?<\/script>/g, '');
      for (const t of new Set([...h.matchAll(/href="(\/(?:cv|poradnik)\/[^"#?]+)"/g)].map((m) => m[1]))) if (t !== u) (inl.get(t) || inl.set(t, new Set()).get(t)).add(u);
    }
    const targets = pages.filter((u) => /^\/(cv|poradnik)\/[^/]+$/.test(u));
    assert.ok(targets.filter((u) => u.startsWith('/cv/')).length === PROFESSIONS.length && targets.length > PROFESSIONS.length + 30);
    const weak = targets.filter((t) => (inl.get(t)?.size || 0) < 2).map((t) => `${t} (${inl.get(t)?.size || 0})`);
    assert.deepEqual(weak, [], 'strony z < 2 linkami wewnętrznymi');
    const wz = await (await fetch(`${U}/wzor-cv`)).text();
    for (const p of PROFESSIONS) assert.ok(wz.includes(`href="/cv/${p.slug}"`), `/wzor-cv → ${p.slug}`);
  } finally { srv.close(); }
  // „Podobne zawody”: każdy zawód jest na liście u co najmniej jednego innego zawodu ze swojej kategorii
  const seen = new Set(PROFESSIONS.flatMap((p) => similarProfs(p).map((x) => x.slug)));
  assert.deepEqual(PROFESSIONS.filter((p) => !seen.has(p.slug)).map((p) => p.slug), []);
  assert.ok(PROFESSIONS.every((p) => similarProfs(p).every((x) => x.category === p.category && x.slug !== p.slug)));
});
