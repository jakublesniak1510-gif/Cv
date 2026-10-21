// Strony „CV Europass” i „CV do urzędu” (PR-P5): z serwera, indeksowane, z autorem i datą zmiany (lib/authorship.js).
// CTA prowadzi do kreatora z wybranym szablonem (/?zamow=1&szablon=…, obsługa w public/app.js).
import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { byline, pageLd } from './authorship.js';
import { OFFICIAL, OFFICIAL_ASOF } from './official-content.js';
export { OFFICIAL, OFFICIAL_BY, OFFICIAL_URLS } from './official-content.js';

const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const TPL_NAME = { europass: 'W układzie Europass', klasyczny: 'Klasyczny' };
export const wizardUrl = (tpl) => `/?zamow=1&szablon=${tpl}`;
const list = (a) => (a?.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
const cta = (x) => `<div class="cta-box"><div><b>Zrób CV pod konkretne ogłoszenie – od ${zl(PRICES.cv)}</b><p class="hint">Wklejasz ogłoszenie i swoje doświadczenie, a my przygotowujemy CV w szablonie „${esc(TPL_NAME[x.tpl])}”, z wymaganiami z oferty pokazanymi wprost.</p></div><a class="btn" href="${wizardUrl(x.tpl)}">Zamów CV</a></div>`;
export const officialHtml = (x) => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>${esc(x.name)}</span></nav>
<h1>${esc(x.title)}</h1>${byline(x.slug)}<p class="lead">${esc(x.intro)}</p>
${x.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((p) => `<p>${esc(p)}</p>`).join('')}${list(s.list)}`).join('')}
${cta(x)}
<h2>Najczęstsze pytania</h2>${x.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<h2>Źródła</h2><ul>${x.sources.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>
<p class="hint">Stan na: ${esc(OFFICIAL_ASOF)}. Wymagania w konkretnym naborze zawsze podaje ogłoszenie. Jak przygotowujemy i sprawdzamy treści: <a href="/zasady-redakcyjne">zasady redakcyjne</a>.</p>
<h2>Zobacz też</h2><div class="more">${OFFICIAL.filter((o) => o.slug !== x.slug).map((o) => `<a href="/${o.slug}">${esc(o.name)}</a>`).join('')}<a href="/wzor-cv">Darmowe wzory CV</a><a href="/narzedzia/skaner-cv">Darmowy skaner CV</a><a href="/poradnik">Poradnik</a></div></div>`;

const ld = {
  faq: (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }),
  crumbs: (base, x) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Strona główna', ''], [x.name, x.slug]].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) }),
};
export function officialRoutes(app, base) {
  for (const x of OFFICIAL) app.get(`/${x.slug}`, (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, x.slug, x, officialHtml(x), { data: [ld.crumbs(base, x), ld.faq(x.faq), pageLd(base, x.slug, x.title)] }); });
}
