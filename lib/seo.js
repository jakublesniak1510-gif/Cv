import fs from 'node:fs';
import { PROFESSIONS, ARTICLES, POPULAR_SLUGS } from './content.js';
import { CITIES } from './cities.js';
import { TOOLS } from './tools.js';
import { PRICES, PACKAGES } from './pricing.js';

// Lekki indeks do wyszukiwarki; pełne dane zawodu pobierane dopiero na jego podstronie.
const INDEX = PROFESSIONS.map(({ slug, name, category, keywords }) => ({ slug, name, category, keywords }));
const POPULAR = PROFESSIONS.filter((p) => POPULAR_SLUGS.includes(p.slug));

// Data ostatniej zmiany treści (do mapy strony i artykułów): najnowszy plik z treścią.
const UPDATED = (() => { try { return new Date(Math.max(...['content.js', 'content-a.js', 'content-b.js', 'content-articles.js', 'cities.js', '../public/index.html'].map((f) => fs.statSync(new URL(f, import.meta.url)).mtimeMs))).toISOString().slice(0, 10); } catch { return new Date().toISOString().slice(0, 10); } })();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const INDEX_HTML = new URL('../public/index.html', import.meta.url);
let indexHtml = null;
const index = () => (indexHtml ??= fs.readFileSync(INDEX_HTML, 'utf8'));

// Statyczna treść podstrony (dla wyszukiwarek i bez JavaScriptu); skrypt strony potem ją wzbogaca.
function profHtml(p) {
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#zawody">CV dla zawodów</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.title)}</h1><p class="lead">${esc(p.intro)}</p>
<h2>Słowa kluczowe z ogłoszeń</h2><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
<h2>Wskazówki do CV</h2><ol class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
<h2>Przykładowe CV</h2><p><b>${esc(p.sample.name)}</b>, ${esc(p.sample.headline)}. ${esc(p.sample.summary)}</p>
${p.sample.jobs.map((j) => `<h3>${esc(j.title)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
<h2>Pytania</h2>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<h2>Podobne zawody</h2><div class="more">${PROFESSIONS.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => `<a href="/cv/${x.slug}">${esc(x.name)}</a>`).join('')}</div></div>`;
}
const cityMeta = (p, c) => ({ title: `${p.name} ${c.loc}: CV pod lokalne ogłoszenia`, metaDescription: `Jak napisać CV na stanowisko ${p.name.toLowerCase()} ${c.loc}: słowa kluczowe z ogłoszeń, wskazówki dla rynku pracy ${c.gen} i przykładowe CV. CV pod ogłoszenie od 39 zł.` });
function cityHtml(p, c) {
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/cv/${p.slug}">${esc(p.name)}</a> › <span>${esc(c.name)}</span></nav>
<h1>${esc(cityMeta(p, c).title)}</h1><p class="lead">${esc(c.intro)}</p>
<h2>Szukasz pracy jako ${esc(p.name.toLowerCase())} ${esc(c.loc)}?</h2><p>${esc(p.intro)}</p>
<h2>Wskazówki dla rynku pracy ${esc(c.gen)}</h2><ol class="tips">${c.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
<h2>Słowa kluczowe z ogłoszeń</h2><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
<h2>Wskazówki do CV</h2><ol class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
<h2>${esc(p.name)} w innych miastach</h2><div class="more">${CITIES.filter((x) => x.slug !== c.slug).map((x) => `<a href="/cv/${p.slug}/${x.slug}">${esc(x.name)}</a>`).join('')}</div>
<h2>Inne zawody ${esc(c.loc)}</h2><div class="more">${POPULAR.filter((x) => x.slug !== p.slug).map((x) => `<a href="/cv/${x.slug}/${c.slug}">${esc(x.name)}</a>`).join('')}</div></div>`;
}
function artHtml(a) {
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#poradnik">Poradnik</a> › <span>${esc(a.title)}</span></nav>
<h1>${esc(a.title)}</h1><p class="meta">${a.readMinutes} min czytania</p><p class="lead">${esc(a.lead)}</p>
${a.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((t) => `<p>${esc(t)}</p>`).join('')}`).join('')}
<h2>Przeczytaj też</h2><div class="more">${ARTICLES.filter((x) => x.slug !== a.slug).map((x) => `<a href="/poradnik/${x.slug}">${esc(x.title)}</a>`).join('')}</div></div>`;
}

// --- Dane strukturalne (schema.org, JSON-LD): wyniki rozszerzone w Google (FAQ, okruszki, artykuły, cennik) ---
const NAME = 'CV Pod Ogłoszenie';
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const strip = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const faqLd = (qa) => (qa.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null);
const faqFromHtml = (h) => [...String(h).matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({ q: strip(m[1]), a: strip(m[2]) }));
const crumbsLd = (base, trail) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Strona główna', ''], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) });
function homeLd(base) {
  const faq = /<section class="sec" id="faq">([\s\S]*?)<\/section>/.exec(index())?.[1] || '';
  return [
    { '@context': 'https://schema.org', '@type': 'Organization', name: NAME, url: `${base}/`, logo: `${base}/logo.svg` },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: `${base}/`, inLanguage: ['pl', 'en', 'uk'] },
    { '@context': 'https://schema.org', '@type': 'Service', name: 'CV i list motywacyjny pod konkretne ogłoszenie', serviceType: 'Pisanie CV i listów motywacyjnych', provider: { '@type': 'Organization', name: NAME, url: `${base}/` }, areaServed: 'PL',
      offers: Object.entries(PACKAGES).map(([k, p]) => ({ '@type': 'Offer', name: p.name, price: (PRICES[k] / 100).toFixed(2), priceCurrency: 'PLN', url: `${base}/#cennik` })) },
    faqLd(faqFromHtml(faq)),
  ].filter(Boolean);
}
// Wspólne poprawki nagłówka: pełne adresy w hreflang (Google ich wymaga) i x-default. Podstrony istnieją tylko
// po polsku, więc nie mają wersji językowych (hreflang wskazujący stronę główną byłby błędem).
const head = (html, base, url, langs = true) => html
  .replace('<link rel="alternate" hreflang="pl" href="/"><link rel="alternate" hreflang="en" href="/en"><link rel="alternate" hreflang="uk" href="/uk">',
    langs ? `<link rel="alternate" hreflang="pl" href="${base}/"><link rel="alternate" hreflang="en" href="${base}/en"><link rel="alternate" hreflang="uk" href="${base}/uk"><link rel="alternate" hreflang="x-default" href="${base}/">` : '')
  .replace('<meta name="theme-color"', `<meta property="og:url" content="${esc(url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="${NAME}"><meta property="og:image" content="${base}/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color"`);

// Podstrony z <template id="pg-…"> w index.html (Dla firm i uczelni, Program poleceń).
export const STATIC_PAGES = { 'dla-firm': 'Dla firm i uczelni', 'program-polecen': 'Program poleceń' };
function staticPage(slug) {
  const m = new RegExp(`<template id="pg-${slug}" data-title="([^"]*)" data-desc="([^"]*)">([\\s\\S]*?)</template>`).exec(index());
  return m && { title: m[1], metaDescription: m[2], html: m[3] };
}

function page(res, base, route, item, html, data = []) {
  const url = `${base}/${route}`;
  const out = head(index(), base, url, false)
    .replace(/<title>.*?<\/title>/, `<title>${esc(item.title)} | CV Pod Ogłoszenie</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(item.metaDescription)}"><link rel="canonical" href="${esc(url)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(item.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(item.metaDescription)}">`)
    .replace('</head>', `${data.filter(Boolean).map(ld).join('')}</head>`)
    .replace('<main id="landing">', '<main id="landing" hidden>')
    .replace('<section class="page" id="page" hidden></section>', `<section class="page" id="page">${html}</section>`)
    .replace('<script src="/app.js"></script>', `<script>window.__ROUTE=${JSON.stringify(route)}</script><script src="/app.js"></script>`);
  res.type('html').send(out);
}

// Wersje językowe strony głównej (/en, /uk): ten sam HTML, tytuł i opis z słownika, resztę tłumaczy public/i18n.js.
const dictOf = (l) => { try { return JSON.parse(fs.readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url), 'utf8')); } catch { return {}; } };
function langHome(res, base, l) {
  const d = dictOf(l), t = (s) => d[s] || s;
  const title = /<title>(.*?)<\/title>/.exec(index())[1], desc = /<meta name="description" content="([^"]*)">/.exec(index())[1];
  res.type('html').send(head(index(), base, `${base}/${l}`)
    .replace('<html lang="pl">', `<html lang="${l}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(t(title))}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(t(desc))}">`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(t(title))}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(t(desc))}"><link rel="canonical" href="${base}/${l}">`)
    .replace('<script src="/i18n.js"></script>', `<script>window.__LANG=${JSON.stringify(l)}</script><script src="/i18n.js"></script>`));
}

export function seoRoutes(app, base) {
  // Strona główna: kanoniczny adres i dane strukturalne (firma, cennik, FAQ).
  app.get(['/', '/index.html'], (_req, res) => res.type('html').send(head(index(), base, `${base}/`)
    .replace(/<meta name="description" content="([^"]*)">/, `<meta name="description" content="$1"><link rel="canonical" href="${base}/">`)
    .replace('</head>', `${homeLd(base).map(ld).join('')}</head>`)));
  app.get('/:slug', (req, res, next) => {
    const sp = STATIC_PAGES[req.params.slug] && staticPage(req.params.slug); if (!sp) return next();
    page(res, base, req.params.slug, sp, sp.html, [crumbsLd(base, [[STATIC_PAGES[req.params.slug], req.params.slug]]), faqLd(faqFromHtml(sp.html))]);
  });
  app.get(['/en', '/uk'], (req, res) => langHome(res, base, req.path.slice(1)));
  app.get('/content.json', (_req, res) => res.set('Cache-Control', 'public, max-age=3600').json({ INDEX, POPULAR, ARTICLES, CITIES, TOOLS }));
  app.get('/content/cv/:slug.json', (req, res) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return res.sendStatus(404); res.set('Cache-Control', 'public, max-age=3600').json(p); });
  app.get('/cv/:slug', (req, res, next) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return next(); page(res, base, `cv/${p.slug}`, p, profHtml(p), [crumbsLd(base, [[p.name, `cv/${p.slug}`]]), faqLd(p.faq)]); });
  app.get('/cv/:slug/:city', (req, res, next) => {
    const p = POPULAR.find((x) => x.slug === req.params.slug), c = CITIES.find((x) => x.slug === req.params.city);
    if (!p || !c) return next();
    page(res, base, `cv/${p.slug}/${c.slug}`, cityMeta(p, c), cityHtml(p, c), [crumbsLd(base, [[p.name, `cv/${p.slug}`], [c.name, `cv/${p.slug}/${c.slug}`]])]);
  });
  app.get('/narzedzia/:slug', (req, res, next) => {
    const t = TOOLS[req.params.slug]; if (!t) return next();
    page(res, base, `narzedzia/${req.params.slug}`, t, `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Darmowe narzędzia</span></nav><h1>${esc(t.title)}</h1><p class="lead">${esc(t.lead)}</p><div class="more">${Object.entries(TOOLS).map(([k, x]) => `<a href="/narzedzia/${k}">${esc(x.title)}</a>`).join('')}</div></div>`);
  });
  app.get('/poradnik/:slug', (req, res, next) => {
    const a = ARTICLES.find((x) => x.slug === req.params.slug); if (!a) return next();
    page(res, base, `poradnik/${a.slug}`, a, artHtml(a), [crumbsLd(base, [['Poradnik', '#poradnik'], [a.title, `poradnik/${a.slug}`]]),
      { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.metaDescription, inLanguage: 'pl', dateModified: UPDATED, mainEntityOfPage: `${base}/poradnik/${a.slug}`, author: { '@type': 'Organization', name: NAME }, publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: `${base}/logo.svg` } } }]);
  });
  app.get('/robots.txt', (_req, res) => res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /konto\nDisallow: /newsletter/\nSitemap: ${base}/sitemap.xml\n`));
  app.get('/sitemap.xml', (_req, res) => {
    const urls = ['', 'en', 'uk', ...Object.keys(STATIC_PAGES), ...PROFESSIONS.map((p) => `cv/${p.slug}`), ...POPULAR.flatMap((p) => CITIES.map((c) => `cv/${p.slug}/${c.slug}`)), ...ARTICLES.map((a) => `poradnik/${a.slug}`), ...Object.keys(TOOLS).map((k) => `narzedzia/${k}`)];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}/${u}</loc><lastmod>${UPDATED}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  });
}
