import fs from 'node:fs';
import { PROFESSIONS, ARTICLES } from './content.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const INDEX = new URL('../public/index.html', import.meta.url);
let indexHtml = null;
const index = () => (indexHtml ??= fs.readFileSync(INDEX, 'utf8'));

// Statyczna treść podstrony (dla wyszukiwarek i bez JavaScriptu); skrypt strony potem ją wzbogaca.
function profHtml(p) {
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#zawody">CV dla zawodów</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.title)}</h1><p class="lead">${esc(p.intro)}</p>
<h2>Słowa kluczowe z ogłoszeń</h2><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
<h2>Wskazówki do CV</h2><ol class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
<h2>Przykładowe CV</h2><p><b>${esc(p.sample.name)}</b>, ${esc(p.sample.headline)}. ${esc(p.sample.summary)}</p>
${p.sample.jobs.map((j) => `<h3>${esc(j.title)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
<h2>Pytania</h2>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<h2>Inne zawody</h2><div class="more">${PROFESSIONS.filter((x) => x.slug !== p.slug).map((x) => `<a href="/cv/${x.slug}">${esc(x.name)}</a>`).join('')}</div></div>`;
}
function artHtml(a) {
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#poradnik">Poradnik</a> › <span>${esc(a.title)}</span></nav>
<h1>${esc(a.title)}</h1><p class="meta">${a.readMinutes} min czytania</p><p class="lead">${esc(a.lead)}</p>
${a.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((t) => `<p>${esc(t)}</p>`).join('')}`).join('')}
<h2>Przeczytaj też</h2><div class="more">${ARTICLES.filter((x) => x.slug !== a.slug).map((x) => `<a href="/poradnik/${x.slug}">${esc(x.title)}</a>`).join('')}</div></div>`;
}

function page(res, base, route, item, html) {
  const url = `${base}/${route}`;
  const out = index()
    .replace(/<title>.*?<\/title>/, `<title>${esc(item.title)} | CV Pod Ogłoszenie</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(item.metaDescription)}"><link rel="canonical" href="${esc(url)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(item.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(item.metaDescription)}">`)
    
    .replace('<main id="landing">', '<main id="landing" hidden>')
    .replace('<section class="page" id="page" hidden></section>', `<section class="page" id="page">${html}</section>`)
    .replace('<script src="/app.js"></script>', `<script>window.__ROUTE=${JSON.stringify(route)}</script><script src="/app.js"></script>`);
  res.type('html').send(out);
}

export function seoRoutes(app, base) {
  app.get('/content.json', (_req, res) => res.set('Cache-Control', 'public, max-age=3600').json({ PROFESSIONS, ARTICLES }));
  app.get('/cv/:slug', (req, res, next) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return next(); page(res, base, `cv/${p.slug}`, p, profHtml(p)); });
  app.get('/poradnik/:slug', (req, res, next) => { const a = ARTICLES.find((x) => x.slug === req.params.slug); if (!a) return next(); page(res, base, `poradnik/${a.slug}`, a, artHtml(a)); });
  app.get('/robots.txt', (_req, res) => res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`));
  app.get('/sitemap.xml', (_req, res) => {
    const urls = ['', ...PROFESSIONS.map((p) => `cv/${p.slug}`), ...ARTICLES.map((a) => `poradnik/${a.slug}`)];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  });
}
