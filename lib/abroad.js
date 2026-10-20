import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES, LANGS } from './pricing.js';
import { ABROAD, ABROAD_ARTICLE } from './abroad-content.js';
export { ABROAD, ABROAD_BY, ABROAD_URLS, ABROAD_FOR_ARTICLE } from './abroad-content.js';

// Strony „Polacy za granicą” (tylko z serwera, indeksowane): CV po niemiecku/angielsku i praca w DE, UK, NL, IE.
// CTA prowadzi do kreatora z ustawionym językiem dokumentów (/?jezyk=de|en, obsługa w public/app.js).
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const LANG_IN = { de: 'po niemiecku', en: 'po angielsku' };
export const wizardUrl = (lang) => `/?jezyk=${lang}#cennik`;
const list = (a) => (a?.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
const sections = (ss) => ss.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((p) => `<p>${esc(p)}</p>`).join('')}${list(s.list)}`).join('');
const faqHtml = (faq) => `<h2>Najczęstsze pytania</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}`;
const cta = (a) => `<div class="cta-box"><div><b>Zrób CV ${LANG_IN[a.lang]} pod konkretne ogłoszenie – od ${zl(PRICES.cv)}</b><p class="hint">Wklejasz ogłoszenie, a my przygotowujemy CV ${LANG_IN[a.lang]} pod jego wymagania i słowa kluczowe, z raportem dopasowania. Język dokumentów (${esc(LANGS[a.lang])}) ustawimy w kreatorze od razu. Wolisz najpierw sprawdzić obecne CV? Skorzystaj z darmowego skanera.</p></div><div class="cta"><a class="btn" href="${wizardUrl(a.lang)}">Zrób CV ${LANG_IN[a.lang]}</a> <a class="btn ghost" href="/narzedzia/skaner-cv">Darmowy skaner CV</a></div></div>`;
const others = (a) => `<h2>CV do pracy za granicą</h2><div class="more">${ABROAD.filter((x) => x.slug !== a.slug).map((x) => `<a href="/${x.slug}">${esc(x.title.split(':')[0])}</a>`).join('')}</div>`;
const seeAlso = (a) => `<h2>Zobacz też</h2><div class="more">${ABROAD_ARTICLE[a.lang] ? `<a href="/poradnik/${ABROAD_ARTICLE[a.lang]}">Poradnik: CV do pracy w Niemczech (Lebenslauf)</a>` : ''}<a href="/wzor-cv">Darmowe wzory CV (DOCX)</a><a href="/poradnik/jak-dopasowac-cv-do-ogloszenia">Jak dopasować CV do ogłoszenia</a><a href="/narzedzia/skaner-cv">Darmowy skaner CV</a></div>`;
export const abroadHtml = (a) => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>CV za granicę</span> › <span>${esc(a.name)}</span></nav>
<h1>${esc(a.title)}</h1><p class="lead">${esc(a.intro)}</p>
${sections(a.sections)}
${cta(a)}${faqHtml(a.faq)}
${others(a)}${seeAlso(a)}</div>`;

const ld = { faq: (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }),
  crumbs: (base, a) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Strona główna', ''], [a.name, a.slug]].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) }) };

export function abroadRoutes(app, base) {
  for (const a of ABROAD) app.get(`/${a.slug}`, (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, a.slug, a, abroadHtml(a), { data: [ld.crumbs(base, a), ld.faq(a.faq)] }); });
}
