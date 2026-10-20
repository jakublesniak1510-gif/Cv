// Unikalność treści podstron: ile tekstu ma strona (bez script/style/nagłówka/stopki/nawigacji), ile z tego to treść
// główna (#page) i jak bardzo strony tego samego typu pokrywają się ciągami 6 słów (6-gramy). Użycie:
//   node scripts/content-uniq.mjs            → raport dla próbek wszystkich typów stron
// Funkcje są też używane w test/content-uniq.test.js (próg regresji).
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';
import { templateRoutes } from '../lib/templates.js';
import { PROFESSIONS, ARTICLES } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { ART_LANGS } from '../lib/articles-i18n.js';
import { TEMPLATE_LIST } from '../lib/templates-content/index.js';
import { abroadRoutes, ABROAD } from '../lib/abroad.js';
import { employerRoutes } from '../lib/employers.js';
import { EMPLOYERS } from '../lib/employers-data.js';

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<template[\s\S]*?<\/template>/gi, ' ');
const textOf = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
export const words = (t) => t.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
// Tekst widoczny dla wyszukiwarki: bez skryptów, stylów, szablonów, nagłówka, stopki i nawigacji (jak w pomiarze koordynatora).
export function pageText(html) {
  const b = strip(html).replace(/<header[\s\S]*?<\/header>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ').replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(b)?.[1] || b;
  const main = /<section class="page" id="page"[^>]*>([\s\S]*?)<\/section>/.exec(b)?.[1] || '';
  return { all: words(textOf(body)), main: words(textOf(main.replace(/<nav[\s\S]*?<\/nav>/gi, ' '))) };
}
export const shingles = (w, n = 6) => { const s = new Set(); for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' ')); return s; };
// Pokrycie: jaka część 6-gramów strony A występuje też na stronie B (maks. z obu kierunków).
export const overlap = (a, b) => { const A = shingles(a), B = shingles(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; let m = 0; for (const x of B) if (A.has(x)) m++; return Math.max(n / A.size, m / B.size); };

export const SAMPLE = () => {
  const pick = (arr, n) => arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / n)) === 0).slice(0, n);
  const prof = pick(PROFESSIONS, 6).map((p) => p.slug), arts = pick(ARTICLES, 5).map((a) => a.slug);
  const lang = (l) => ({ [`zawody-${l}`]: prof.filter((s) => PROF_LANGS[l].prof[s]).map((s) => `/${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[s].slugLang}`), [`poradnik-${l}`]: arts.filter((s) => ART_LANGS[l].data[s]).map((s) => `/${l}/${ART_LANGS[l].seg}/${ART_LANGS[l].data[s].slugLang}`) });
  return {
    'zawody-pl': prof.map((s) => `/cv/${s}`), 'poradnik-pl': arts.map((s) => `/poradnik/${s}`), ...lang('en'), ...lang('uk'), ...lang('de'),
    narzedzia: ['/narzedzia/skaner-cv', '/narzedzia/klauzula-rodo', '/narzedzia/jaki-zawod-dla-mnie', '/narzedzia/kalkulator-wynagrodzen'],
    wzory: pick(TEMPLATE_LIST, 5).map((t) => `/wzor-cv/${t.slug}`), listy: pick(TEMPLATE_LIST, 4).map((t) => `/list-motywacyjny/${t.slug}`),
    zagranica: ABROAD.map((a) => `/${a.slug}`),
    pracodawcy: EMPLOYERS.map((e) => `/praca-w/${e.slug}`),
    statyczne: ['/o-serwisie', '/jak-to-dziala', '/dla-firm', '/program-polecen'],
  };
};

export async function measure(base = 'https://cvpodogloszenie.pl', sample = SAMPLE()) {
  const app = express(); seoRoutes(app, base); templateRoutes(app, base); abroadRoutes(app, base); employerRoutes(app, base); app.use((req, res) => sendNotFound(req, res, base));
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`, out = {};
  try {
    for (const [type, urls] of Object.entries(sample)) {
      const pages = [];
      for (const u of urls) { const r = await fetch(U + u); if (r.status !== 200) continue; const t = pageText(await r.text()); pages.push({ u, all: t.all.length, main: t.main.length, share: t.all.length ? t.main.length / t.all.length : 0, w: t.all }); }
      const pairs = []; for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) pairs.push({ a: pages[i].u, b: pages[j].u, ov: overlap(pages[i].w, pages[j].w) });
      out[type] = { pages: pages.map(({ w, ...p }) => p), maxOverlap: Math.max(0, ...pairs.map((p) => p.ov)), avgOverlap: pairs.length ? pairs.reduce((s, p) => s + p.ov, 0) / pairs.length : 0, minShare: Math.min(...pages.map((p) => p.share)) };
    }
  } finally { srv.close(); }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await measure(), pct = (x) => `${Math.round(x * 100)}%`;
  for (const [t, x] of Object.entries(r)) {
    console.log(`\n${t}: pokrycie par śr. ${pct(x.avgOverlap)}, maks. ${pct(x.maxOverlap)}; udział treści głównej min. ${pct(x.minShare)}`);
    for (const p of x.pages) console.log(`  ${p.u}: ${p.all} słów, treść główna ${p.main} (${pct(p.share)})`);
  }
}
