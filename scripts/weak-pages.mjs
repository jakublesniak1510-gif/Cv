// Strony zawodów z najmniejszą liczbą unikalnych słów (6-gramy występujące najwyżej na 2 stronach w danym języku). Użycie: node scripts/weak-pages.mjs
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { pageText, shingles } from './content-uniq.mjs';
const app = express(); seoRoutes(app, 'https://x.pl'); const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
for (const l of ['pl', 'en', 'uk', 'de']) {
  const pages = [];
  for (const p of PROFESSIONS) {
    const url = l === 'pl' ? `/cv/${p.slug}` : PROF_LANGS[l].prof[p.slug] && `/${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[p.slug].slugLang}`; if (!url) continue;
    const t = pageText(await (await fetch(U + url)).text()); pages.push({ url, w: t.main });
  }
  const df = new Map(); for (const p of pages) for (const s of shingles(p.w)) df.set(s, (df.get(s) || 0) + 1);
  // słowa unikalne ≈ liczba 6-gramów strony, które występują najwyżej na 2 stronach tego języka
  const u = pages.map((p) => ({ url: p.url, main: p.w.length, uniq: [...shingles(p.w)].filter((s) => df.get(s) <= 2).length })).sort((a, b) => a.uniq - b.uniq);
  const under = u.filter((x) => x.uniq < 400);
  console.log(`${l}: ${pages.length} stron, unikalne słowa: min ${u[0].uniq}, mediana ${u[Math.floor(u.length / 2)].uniq}, maks ${u.at(-1).uniq}; < 400: ${under.length}`);
  console.log('   najsłabsze:', u.slice(0, 5).map((x) => `${x.url} (${x.uniq})`).join(', '));
}
srv.close();
