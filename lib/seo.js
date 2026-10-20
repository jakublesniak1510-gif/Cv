import { TEMPLATE_URLS, templateFor } from './templates-content/index.js';
import { p24Enabled } from './p24.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { PROFESSIONS, ARTICLES, POPULAR_SLUGS } from './content.js';
import { CITIES } from './cities.js';
import { TOOLS } from './tools.js';
import { PRICES, PACKAGES, ADDONS, LANGS, B2B_TIERS } from './pricing.js';
import { seller } from './invoice.js';
import { ART_LANGS } from './articles-i18n.js';
import { TOOL_LANGS, TOOL_BY, toolUrl, toolSlugs } from './tools-i18n.js';
import { PROF_LANGS } from './professions-i18n.js';
import { PAGE_T, fillT } from './page-i18n.js';
import { LEGAL_PAGES, LEGAL_BY_PATH, LEGAL_LANGS, legalPath, legalBody } from './legal.js';

// Lekki indeks do wyszukiwarki; pełne dane zawodu pobierane dopiero na jego podstronie.
const INDEX = PROFESSIONS.map(({ slug, name, category, keywords }) => ({ slug, name, category, keywords }));
const POPULAR = PROFESSIONS.filter((p) => POPULAR_SLUGS.includes(p.slug));

// Data ostatniej zmiany treści (do mapy strony i artykułów): najnowszy plik z treścią.
const UPDATED = (() => { try { return new Date(Math.max(...['content.js', 'content-a.js', 'content-b.js', 'content-articles.js', 'cities.js', '../public/index.html'].map((f) => fs.statSync(new URL(f, import.meta.url)).mtimeMs))).toISOString().slice(0, 10); } catch { return new Date().toISOString().slice(0, 10); } })();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const INDEX_HTML = new URL('../public/index.html', import.meta.url);
let indexHtml = null;
// Adres kontaktowy w regulaminie, polityce i stopce pochodzi z CONTACT_EMAIL (bez niego zostaje znacznik [E-MAIL] do uzupełnienia).
const withContact = (h) => (process.env.CONTACT_EMAIL ? h.replaceAll('[E-MAIL]', esc(process.env.CONTACT_EMAIL)) : h);
// Pliki strony z wersją w adresie (skrót treści): przeglądarka trzyma je w pamięci na stałe, a po zmianie pobiera nowe.
const ver = (f) => { try { return crypto.createHash('sha1').update(fs.readFileSync(new URL(`../public/${f}`, import.meta.url))).digest('hex').slice(0, 10); } catch { return '0'; } };
const versioned = (h) => h.replace(/(src|href)="\/(app\.js|consent\.js|style\.css|i18n\.js)"/g, (_, a, f) => `${a}="/${f}?v=${ver(f)}"`);
const index = () => (indexHtml ??= versioned(withContact(fs.readFileSync(INDEX_HTML, 'utf8'))));

// Statyczna treść podstrony (dla wyszukiwarek i bez JavaScriptu); skrypt strony potem ją wzbogaca.
function profHtml(p) {
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#zawody">CV dla zawodów</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.title)}</h1><p class="lead">${esc(p.intro)}</p>
<h2>Słowa kluczowe z ogłoszeń</h2><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
<h2>Wskazówki do CV</h2><ol class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
<h2>Przykładowe CV</h2><p><b>${esc(p.sample.name)}</b>, ${esc(p.sample.headline)}. ${esc(p.sample.summary)}</p>
${p.sample.jobs.map((j) => `<h3>${esc(j.title)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
${(() => { const t = templateFor(p.slug); return t ? `<h2>Darmowy wzór do pobrania</h2><div class="more"><a href="/wzor-cv/${t.slug}">Wzór CV ${esc(t.nameIn)} (DOCX)</a><a href="/list-motywacyjny/${t.slug}">List motywacyjny ${esc(t.nameIn)} (DOCX)</a></div>` : ''; })()}
<h2>Pytania</h2>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<h2>Przeczytaj w poradniku</h2><div class="more">${articlesFor(p.slug).map((a) => `<a href="/poradnik/${a.slug}">${esc(a.title)}</a>`).join('')}</div>
<h2>Podobne zawody</h2><div class="more">${PROFESSIONS.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => `<a href="/cv/${x.slug}">${esc(x.name)}</a>`).join('')}</div></div>`;
}
const cityMeta = (p, c) => ({ title: `${p.name} ${c.loc}: CV pod lokalne ogłoszenia`, seoTitle: `${p.name} ${c.loc}: CV pod ogłoszenie`, metaDescription: `Jak napisać CV na stanowisko ${p.name.toLowerCase()} ${c.loc}: słowa kluczowe z ogłoszeń, wskazówki dla rynku pracy ${c.gen} i przykładowe CV. CV pod ogłoszenie od 39 zł.` });
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
// Linkowanie wewnętrzne: artykuły ↔ zawody, FAQ artykułu, wzory CV do pobrania, zachęta do kreatora.
const TPL_NAMES = { nowoczesny: 'Nowoczesny', os: 'Oś czasu', szwajcarski: 'Szwajcarski', geometria: 'Geometria', elegancki: 'Elegancki', klasyczny: 'Klasyczny', monogram: 'Monogram', kreatywny: 'Kreatywny', kompetencje: 'Kompetencje', wstega: 'Wstęga', lebenslauf: 'Lebenslauf', europass: 'Europass' };
const GENERIC_ARTS = ['jak-dopasowac-cv-do-ogloszenia', 'czym-jest-ats', 'jak-napisac-list-motywacyjny'];
export const articlesFor = (slug) => { const own = ARTICLES.filter((a) => a.related.includes(slug)); return [...own, ...ARTICLES.filter((a) => GENERIC_ARTS.includes(a.slug) && !own.includes(a))].slice(0, 5); };
const faqHtml = (faq, t = (x) => x) => (faq?.length ? `<h2>${esc(t('Pytania i odpowiedzi'))}</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : '');
const tplHtml = (a, t = (x) => x, l = 'pl') => (a.templates ? `<h2>${esc(t('Wzory CV do pobrania (PDF)'))}</h2><p>${esc(t('Przykładowe CV w każdym szablonie, ze znakiem wodnym PRZYKŁAD. Pobierz, porównaj i wybierz wygląd, a treść dopasujemy do Twojego ogłoszenia.'))}</p><div class="more">${Object.entries(TPL_NAMES).map(([k, n]) => `<a href="/api/sample.pdf?tpl=${k}&amp;lang=${l}" rel="nofollow" download>${esc(t('Wzór CV'))}: ${esc(t(n))}</a>`).join('')}</div>` : '');
const ctaHtml = (home, t = (x) => x) => `<div class="cta-box"><div><b>${esc(t('Zrób CV pod swoje ogłoszenie'))}</b><p class="hint">${esc(t('Wklejasz link, dostajesz CV z raportem dopasowania. Od 39 zł.'))}</p></div><a class="btn" href="${home}#cennik">${esc(t('Zamów CV'))}</a></div>`;
function artHtml(a) {
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#poradnik">Poradnik</a> › <span>${esc(a.title)}</span></nav>
<h1>${esc(a.title)}</h1><p class="meta">${a.readMinutes} min czytania</p><p class="lead">${esc(a.lead)}</p>
${a.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((t) => `<p>${esc(t)}</p>`).join('')}`).join('')}
${tplHtml(a)}${faqHtml(a.faq)}${ctaHtml('/')}
${(() => { const ts = a.related.map(templateFor).filter(Boolean).slice(0, 6); return TEMPLATE_URLS.length ? `<h2>Darmowe wzory do pobrania</h2><div class="more">${ts.map((t) => `<a href="/wzor-cv/${t.slug}">Wzór CV ${esc(t.nameIn)}</a>`).join('')}<a href="/wzor-cv">Wszystkie wzory CV (DOCX)</a><a href="/list-motywacyjny">Wzory listów motywacyjnych</a></div>` : ''; })()}
${a.related.length ? `<h2>CV dla zawodów</h2><div class="more">${a.related.map((x) => PROFESSIONS.find((p) => p.slug === x)).map((p) => `<a href="/cv/${p.slug}">${esc(p.name)}</a>`).join('')}</div>` : ''}
<h2>Przeczytaj też</h2><div class="more">${ARTICLES.filter((x) => x.slug !== a.slug).map((x) => `<a href="/poradnik/${x.slug}">${esc(x.title)}</a>`).join('')}</div></div>`;
}
// Tłumaczenia artykułów: /<język>/<segment>/<slugLang>, powiązane z polską wersją i ze sobą przez hreflang.
const BY_LANG = Object.fromEntries(Object.entries(ART_LANGS).map(([l, { data }]) => [l, Object.fromEntries(Object.entries(data).map(([pl, d]) => [d.slugLang, { ...ARTICLES.find((a) => a.slug === pl), ...d }]))]));
const langUrl = (l, slugLang) => `${l}/${ART_LANGS[l].seg}/${slugLang}`;
const artAlternates = (base, pl) => [`<link rel="alternate" hreflang="pl" href="${base}/poradnik/${pl}">`,
  ...Object.entries(ART_LANGS).filter(([, { data }]) => data[pl]).map(([l, { data }]) => `<link rel="alternate" hreflang="${l}" href="${base}/${langUrl(l, data[pl].slugLang)}">`),
  `<link rel="alternate" hreflang="x-default" href="${base}/poradnik/${pl}">`].join('');
// Wersje językowe narzędzi: /<język>/<segment>/<slugLang> (lib/tools-i18n.js), hreflang do polskiej wersji i do siebie nawzajem.
const toolAlternates = (base, pl) => [`<link rel="alternate" hreflang="pl" href="${base}/narzedzia/${pl}">`,
  ...Object.keys(TOOL_LANGS).filter((l) => TOOL_LANGS[l].data[pl]).map((l) => `<link rel="alternate" hreflang="${l}" href="${base}/${toolUrl(l, pl)}">`),
  `<link rel="alternate" hreflang="x-default" href="${base}/narzedzia/${pl}">`].join('');
const toolAbout = (t, tr = (x) => x) => (t.about || []).map((x) => `<p>${esc(x)}</p>`).join('') + (t.faq?.length ? `<h2>${esc(tr('Pytania'))}</h2>${t.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : '');
function toolHtmlLang(pl, l) {
  const d = dictOf(l), t = (s) => d[s] || s, x = TOOL_LANGS[l].data[pl];
  return `<div class="inner narrow" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <span>${esc(t('Darmowe narzędzia'))}</span></nav><h1>${esc(x.title)}</h1><p class="lead">${esc(x.lead)}</p>${toolAbout(x, t)}<h2>${esc(t('Inne darmowe narzędzia'))}</h2><div class="more">${Object.keys(TOOLS).filter((k) => k !== pl && TOOL_LANGS[l].data[k]).map((k) => `<a href="/${toolUrl(l, k)}">${esc(TOOL_LANGS[l].data[k].title)}</a>`).join('')}</div></div>`;
}
function artHtmlLang(a, l) {
  const d = dictOf(l), t = (s) => d[s] || s, list = Object.values(BY_LANG[l]);
  return `<div class="inner narrow article" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <a href="/${l}#poradnik">${esc(t('Poradnik'))}</a> › <span>${esc(a.title)}</span></nav>
<h1>${esc(a.title)}</h1><p class="meta">${esc((d['{0} min czytania'] || '{0} min czytania').replace('{0}', a.readMinutes))}</p><p class="lead">${esc(a.lead)}</p>
${a.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((x) => `<p>${esc(x)}</p>`).join('')}`).join('')}
${tplHtml(a, t, l)}${faqHtml(a.faq, t)}${ctaHtml('/' + l, t)}
${a.related?.length ? `<h2>${esc(t('CV dla zawodów'))}</h2><div class="more">${a.related.map((x) => `<a href="/${profUrl(l, x)}">${esc(PROF_LANGS[l].prof[x].name)}</a>`).join('')}</div>` : ''}
<h2>${esc(t('Przeczytaj też'))}</h2><div class="more">${list.filter((x) => x.slug !== a.slug).map((x) => `<a href="/${langUrl(l, x.slugLang)}">${esc(x.title)}</a>`).join('')}</div></div>`;
}

// --- Dane strukturalne (schema.org, JSON-LD): wyniki rozszerzone w Google (FAQ, okruszki, artykuły, cennik) ---
const NAME = 'CV Pod Ogłoszenie';
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const strip = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const faqLd = (qa) => (qa.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null);
const faqFromHtml = (h) => [...String(h).matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({ q: strip(m[1]), a: strip(m[2]) }));
const HOME_NAME = { pl: 'Strona główna', en: 'Home', uk: 'Головна', de: 'Startseite' };
const crumbsLd = (base, trail, l = 'pl') => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [[HOME_NAME[l], l === 'pl' ? '' : l], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) });
const articleLd = (base, a, path, l) => ({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.metaDescription, inLanguage: l, dateModified: UPDATED, mainEntityOfPage: `${base}/${path}`, image: `${base}/og.png`, author: { '@type': 'Organization', name: NAME, url: `${base}/` }, publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: `${base}/logo.svg` } } });
// Google ucina tytuł po ok. 60 znakach i opis po ok. 155: nazwę serwisu dopisujemy tylko, gdy się mieści
// (Google i tak pokazuje ją nad wynikiem), a za długi opis skracamy na granicy zdania lub słowa.
const SUFFIX = ' | CV Pod Ogłoszenie';
const fitTitle = (t) => (t.length + SUFFIX.length <= 60 ? t + SUFFIX : t);
function fitDesc(d, max = 155) {
  d = String(d || '').replace(/\s+/g, ' ').trim();
  if (d.length <= max) return d;
  const cut = d.slice(0, max), dot = cut.lastIndexOf('. ');
  return dot > 90 ? cut.slice(0, dot + 1) : cut.slice(0, cut.lastIndexOf(' ')).replace(/[,:;–-]+$/, '') + '…';
}
// Firma (strona główna i /o-serwisie): dane sprzedawcy z lib/invoice.js (te same co na fakturach), profile w innych serwisach w sameAs.
// Profile w serwisach społecznościowych i opinie (sameAs): domyślna lista poniżej, zmienna SOCIAL_PROFILES ją zastępuje.
const TRUSTPILOT = 'https://pl.trustpilot.com/review/cvpodogloszenie.pl';
export const contactEmail = () => process.env.CONTACT_EMAIL || 'kontakt@cvpodogloszenie.pl';
const SOCIAL = ['https://www.youtube.com/@cvpodogloszenie', 'https://www.facebook.com/cvpodogloszenie', 'https://www.instagram.com/cvpodogloszenie', TRUSTPILOT];
// SOCIAL_PROFILES (adresy https po przecinku) zastępuje domyślną listę profili.
const sameAs = () => { const env = String(process.env.SOCIAL_PROFILES || '').split(',').map((x) => x.trim()).filter((x) => /^https:\/\/[^\s"'<>]{4,300}$/.test(x)); return [...new Set(env.length ? env : SOCIAL)]; };
const postal = (a) => { const m = /^(.*?),\s*(\d{2}-\d{3})\s+(.+)$/.exec(a); return { '@type': 'PostalAddress', ...(m ? { streetAddress: m[1], postalCode: m[2], addressLocality: m[3] } : { streetAddress: a }), addressCountry: 'PL' }; };
const orgLd = (base) => { const s = seller(); return { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${base}/#organizacja`, name: NAME, legalName: s.name, url: `${base}/`, logo: `${base}/logo.svg`, email: contactEmail(), address: postal(s.address), taxID: s.nip, founder: { '@type': 'Person', name: s.name }, sameAs: sameAs() }; };
function homeLd(base, l = 'pl') {
  const faq = /<section class="sec" id="faq">([\s\S]*?)<\/section>/.exec(index())?.[1] || '';
  return [
    orgLd(base),
    { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: `${base}/`, inLanguage: ['pl', 'en', 'uk', 'de'] },
    { '@context': 'https://schema.org', '@type': 'Service', name: 'CV i list motywacyjny pod konkretne ogłoszenie', serviceType: 'Pisanie CV i listów motywacyjnych', provider: { '@type': 'Organization', name: NAME, url: `${base}/` }, areaServed: 'PL',
      offers: Object.entries(PACKAGES).map(([k, p]) => ({ '@type': 'Offer', name: p.name, price: (PRICES[k] / 100).toFixed(2), priceCurrency: 'PLN', url: `${base}/#cennik` })) },
    faqLd(faqFromHtml(faq)),
  ].filter(Boolean).slice(0, l === 'pl' ? 4 : 2); // wersje EN / UA / DE: bez polskich tekstów usługi i FAQ
}
// Wspólne poprawki nagłówka: hreflang z pełnymi adresami (Google ich wymaga) i x-default. alternates: własne linki
// hreflang (np. przetłumaczony artykuł) albo '' dla podstron tylko po polsku (hreflang do strony głównej byłby błędem).
const ALT = /(<link rel="alternate" hreflang="[^"]+" href="[^"]*">)+/;
const homeAlternates = (base) => `${index().match(ALT)[0].replace(/href="\/([^"]*)"/g, (_, p) => `href="${base}/${p}"`)}<link rel="alternate" hreflang="x-default" href="${base}/">`;
const head = (html, base, url, alternates = homeAlternates(base)) => html
  .replace(ALT, alternates)
  .replace('<meta name="theme-color"', `<meta property="og:url" content="${esc(url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="${NAME}"><meta property="og:image" content="${base}/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color"`);

// Podstrony z <template id="pg-…"> w index.html (Jak to działa, Dla firm i uczelni, Program poleceń).
export const STATIC_PAGES = { 'jak-to-dziala': 'Jak to działa', 'dla-firm': 'Dla firm i uczelni', 'program-polecen': 'Program poleceń' };
function staticPage(slug) {
  const m = new RegExp(`<template id="pg-${slug}" data-title="([^"]*)" data-desc="([^"]*)">([\\s\\S]*?)</template>`).exec(index());
  return m && { title: m[1], metaDescription: m[2], html: m[3] };
}

// Regulamin i polityka prywatności: pełne strony w 4 językach (/regulamin, /en/terms, /uk/pravyla, /de/agb …), indeksowane, z hreflang.
const legalAlternates = (base, name) => [...LEGAL_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${base}/${legalPath(name, l)}">`), `<link rel="alternate" hreflang="x-default" href="${base}/${legalPath(name, 'pl')}">`].join('');
function legalPage(res, base, name, l) {
  const x = LEGAL_PAGES[name][l], d = dictOf(l), t = (s) => d[s] || s, home = l === 'pl' ? '/' : '/' + l;
  const html = `<div class="inner narrow legal" lang="${l}"><nav class="crumbs"><a href="${home}">${esc(t('Strona główna'))}</a> › <span>${esc(x.title)}</span></nav>
${withContact(legalBody(name, l))}</div>`;
  res.set('Cache-Control', 'public, max-age=3600');
  page(res, base, x.path, { title: x.title, metaDescription: x.desc }, html, { lang: l, ssrOnly: true, route: `legal/${name}`, alternates: legalAlternates(base, name), data: [crumbsLd(base, [[x.title, x.path]], l)] });
}

// Zawody i miasta w językach EN / UA / DE: /<język>/<segment>/<zawód>[/<miasto>], powiązane hreflang z polskimi stronami.
const profIn = (l, pl) => { const p = PROFESSIONS.find((x) => x.slug === pl), t = PROF_LANGS[l].prof[pl]; return p && t ? { ...p, ...t, kwPl: p.keywords, lang: l } : null; };
const cityIn = (l, pl) => { const c = CITIES.find((x) => x.slug === pl), t = PROF_LANGS[l].cities[pl]; return c && t ? { ...c, ...t } : null; };
const PROF_BY = Object.fromEntries(Object.entries(PROF_LANGS).map(([l, x]) => [l, Object.fromEntries(Object.entries(x.prof).map(([pl, t]) => [t.slugLang, pl]))]));
const CITY_BY = Object.fromEntries(Object.entries(PROF_LANGS).map(([l, x]) => [l, Object.fromEntries(Object.entries(x.cities).map(([pl, t]) => [t.slugLang, pl]))]));
const profUrl = (l, pl, city) => `${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[pl].slugLang}${city ? '/' + PROF_LANGS[l].cities[city].slugLang : ''}`;
const profAlternates = (base, pl, city) => [`<link rel="alternate" hreflang="pl" href="${base}/cv/${pl}${city ? '/' + city : ''}">`,
  ...Object.keys(PROF_LANGS).map((l) => `<link rel="alternate" hreflang="${l}" href="${base}/${profUrl(l, pl, city)}">`),
  `<link rel="alternate" hreflang="x-default" href="${base}/cv/${pl}${city ? '/' + city : ''}">`].join('');
// Strony zawód × miasto: indeksujemy tylko pary z prawdziwymi danymi lokalnymi (lib/cities.js: local[<zawód>] = { salary: { min, max, source }, employers: [...] }:
// widełki płac z wiarygodnym źródłem albo co najmniej 3 typowych lokalnych pracodawców; szablon strony musi je wtedy pokazać).
// Reszta (dziś wszystkie) to ten sam tekst co strona zawodu plus wspólny opis miasta: noindex,follow, canonical do strony zawodu
// w tym samym języku, bez hreflang i poza mapą strony. Dla ludzi strony działają (200), linki do nich zostają.
export const cityIndexable = (pl, cpl) => { const x = CITIES.find((c) => c.slug === cpl)?.local?.[pl]; return Boolean(x && ((x.salary?.source && x.salary.min) || x.employers?.length >= 3)); };
const cityOpts = (res, base, pl, cpl, profPath) => (cityIndexable(pl, cpl) ? { alternates: profAlternates(base, pl, cpl) } : (res.set('X-Robots-Tag', 'noindex, follow'), { robots: 'noindex,follow', canonical: `${base}/${profPath}` }));
function profHtmlLang(p, l) {
  const d = dictOf(l), t = (s) => d[s] || s;
  return `<div class="inner" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <a href="/${l}#zawody">${esc(t('CV dla zawodów'))}</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.title)}</h1><p class="lead">${esc(p.intro)}</p>
<h2>${esc(t('Słowa kluczowe z ogłoszeń'))}</h2><div class="kw">${p.keywords.map((k, i) => `<span>${esc(k)} <small>${esc(p.kwPl[i] || '')}</small></span>`).join('')}</div>
<h2>${esc(t('Wskazówki do CV'))}</h2><ol class="tips">${p.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
<h2>${esc(t('Przykładowe CV'))}</h2><p><b>${esc(p.sample.name)}</b>, ${esc(p.sample.headline)}. ${esc(p.sample.summary)}</p>
${p.sample.jobs.map((j) => `<h3>${esc(j.title)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
<h2>${esc(t('Pytania'))}</h2>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
${(() => { const arts = articlesFor(p.slug).map((a) => [a, ART_LANGS[l].data[a.slug]]).filter(([, x]) => x); return arts.length ? `<h2>${esc(t('Przeczytaj w poradniku'))}</h2><div class="more">${arts.map(([, x]) => `<a href="/${langUrl(l, x.slugLang)}">${esc(x.title)}</a>`).join('')}</div>` : ''; })()}
<h2>${esc(t('Podobne zawody'))}</h2><div class="more">${PROFESSIONS.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => `<a href="/${profUrl(l, x.slug)}">${esc(PROF_LANGS[l].prof[x.slug].name)}</a>`).join('')}</div></div>`;
}
function cityHtmlLang(p, c, l) {
  const d = dictOf(l), t = (s) => d[s] || s, T = PAGE_T[l], f = (s) => esc(fillT(s, p, c));
  return `<div class="inner" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <a href="/${profUrl(l, p.slug)}">${esc(p.name)}</a> › <span>${esc(c.name)}</span></nav>
<h1>${f(T.title)}</h1><p class="lead">${esc(c.intro)}</p>
<h2>${f(T.seek)}</h2><p>${esc(p.intro)}</p>
<h2>${f(T.market)}</h2><ol class="tips">${c.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
<h2>${esc(t('Słowa kluczowe z ogłoszeń'))}</h2><div class="kw">${p.keywords.map((k, i) => `<span>${esc(k)} <small>${esc(p.kwPl[i] || '')}</small></span>`).join('')}</div>
<h2>${esc(t('Wskazówki do CV'))}</h2><ol class="tips">${p.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
<h2>${f(T.otherCities)}</h2><div class="more">${CITIES.filter((x) => x.slug !== c.slug).map((x) => `<a href="/${profUrl(l, p.slug, x.slug)}">${esc(PROF_LANGS[l].cities[x.slug].name)}</a>`).join('')}</div>
<h2>${f(T.otherProf)}</h2><div class="more">${POPULAR.filter((x) => x.slug !== p.slug).map((x) => `<a href="/${profUrl(l, x.slug, c.slug)}">${esc(PROF_LANGS[l].prof[x.slug].name)}</a>`).join('')}</div></div>`;
}

// Linki do narzędzi, regulaminu i polityki prywatności (stopka, kafelki) w wersji językowej strony.
const langLinks = (h, l) => (!l || l === 'pl' || !TOOL_LANGS[l] ? h : h.replace(/href="\/narzedzia\/([\w-]+)"/g, (m, k) => (TOOL_LANGS[l].data[k] ? `href="/${toolUrl(l, k)}"` : m))
  .replace(/href="\/regulamin"/g, `href="/${legalPath('regulamin', l)}"`).replace(/href="\/polityka-prywatnosci"/g, `href="/${legalPath('prywatnosc', l)}"`));

// opts.lang: język strony (html lang + i18n), opts.alternates: linki hreflang, opts.route: trasa dla skryptu strony, opts.data: JSON-LD,
// opts.robots: treść meta robots przy stronie z canonical (np. 'noindex,follow'), opts.canonical: inny adres kanoniczny niż własny.
function page(res, base, route, item, html, opts = {}) {
  const url = `${base}/${route}`;
  let out = langLinks(head(index(), base, url, opts.alternates || ''), opts.lang)
    .replace(/<title>.*?<\/title>/, `<title>${esc(fitTitle(item.seoTitle || item.title))}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(fitDesc(item.metaDescription))}">${opts.notFound || opts.noindex ? '<meta name="robots" content="noindex">' : `${opts.robots ? `<meta name="robots" content="${esc(opts.robots)}">` : ''}<link rel="canonical" href="${esc(opts.canonical || url)}">`}`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(item.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(item.metaDescription)}">`)
    .replace('</head>', `${(opts.data || []).filter(Boolean).map(ld).join('')}</head>`)
    .replace('<main id="landing">', '<main id="landing" hidden>')
    // Ukryta strona główna zostaje w kodzie podstrony (powrót do sekcji bez przeładowania), ale bez drugiego <h1>.
    .replace(/(<section class="hero"[\s\S]*?)<h1>([\s\S]*?)<\/h1>/, (_m, a, t) => `${a}<p class="h1">${t}</p>`)
    .replace('<section class="page" id="page" role="main" hidden></section>', () => `<section class="page" id="page" role="main"${opts.ssrOnly ? ' data-ssr="1"' : ''}>${html}</section>`)
    .replace(/<script src="\/app\.js[^"]*"><\/script>/, (m) => `<script>window.__ROUTE=${JSON.stringify(opts.ssrOnly ? (opts.route || '') : opts.route || route)}${opts.notFound ? ';window.__NOTFOUND=1' : ''}${opts.ssrOnly ? `;window.__SSRPATH=${JSON.stringify('/' + route)}` : ''}</script>${m}${opts.script ? `<script src="${opts.script}" defer></script>` : ''}`);
  // opts.ogImage: własny obrazek podglądu (PNG 1200×630), np. karta wyniku skanera.
  if (opts.ogImage) out = out.replace(`<meta property="og:image" content="${base}/og.png">`, () => `<meta property="og:image" content="${esc(opts.ogImage)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(item.title)}"><meta name="twitter:image" content="${esc(opts.ogImage)}">`);
  if (opts.lang && opts.lang !== 'pl') out = out.replace('<html lang="pl">', `<html lang="${opts.lang}">`).replace(/<script src="\/i18n\.js[^"]*"><\/script>/, (m) => `<script>window.__LANG=${JSON.stringify(opts.lang)}</script>${m}`);
  res.type('html').send(out);
}

// Strona tylko z serwera (formularze B2B, program partnerski, raporty): skrypt strony jej nie podmienia.
// opts: noindex, script (dodatkowy plik JS z /public), data (JSON-LD).
export const ssrPage = (res, base, path, item, html, opts = {}) => page(res, base, path, item, html, { ...opts, ssrOnly: true });
export { esc as escHtml };

// Strona 404 w wyglądzie serwisu (nagłówek, menu, stopka), w języku z adresu (/en, /uk, /de).
// Strona główna (z wersjami plików i kontaktem) dla adresów obsługiwanych przez skrypt strony, np. /konto.
export const homeHtml = () => index();
export function sendNotFound(req, res, base) {
  const l = (/^\/(en|uk|de)(\/|$)/.exec(req.path) || [])[1] || 'pl', home = l === 'pl' ? '/' : '/' + l;
  const d = dictOf(l), t = (s) => d[s] || s, scan = l === 'pl' ? '/narzedzia/skaner-cv' : '/' + toolUrl(l, 'skaner-cv');
  const html = `<div class="inner narrow nf" data-i18n><p class="eyebrow">404</p><h1>${esc(t('Nie znaleziono strony'))}</h1>
<p class="lead">${esc(t('Ten adres nie istnieje albo strona została przeniesiona. Sprawdź, czy adres jest wpisany poprawnie.'))}</p>
<p>${esc(t('Masz już CV? Sprawdź za darmo, jak pasuje do ogłoszenia:'))} <a href="${scan}">${esc(t('Darmowy skaner CV'))}</a></p>
<div class="nf-act"><a class="btn" href="${home}">${esc(t('Strona główna'))}</a><a class="btn ghost" href="${home}#szablony">${esc(t('Zobacz szablony'))}</a><a class="btn ghost" href="${home}#poradnik">${esc(t('Poradnik'))}</a></div></div>`;
  res.status(404);
  page(res, base, '', { title: t('Nie znaleziono strony'), metaDescription: t('Ten adres nie istnieje albo strona została przeniesiona.') }, html, { lang: l, notFound: true });
}

// Wersje językowe strony głównej (/en, /uk, /de): ten sam HTML, tytuł i opis z słownika, resztę tłumaczy public/i18n.js.
const dicts = {};
const dictOf = (l) => (dicts[l] ??= (() => { try { return JSON.parse(fs.readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url), 'utf8')); } catch { return {}; } })());
function langHome(res, base, l) {
  const d = dictOf(l), t = (s) => d[s] || s;
  // Kafelki narzędzi i linki w stopce prowadzą do wersji w tym języku.
  const toolLinks = (h) => langLinks(h, l);
  const title = /<title>(.*?)<\/title>/.exec(index())[1], desc = /<meta name="description" content="([^"]*)">/.exec(index())[1];
  res.type('html').send(toolLinks(head(index(), base, `${base}/${l}`))
    .replace('<html lang="pl">', `<html lang="${l}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(t(title))}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(t(desc))}">`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(t(title))}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(fitDesc(t(desc)))}"><link rel="canonical" href="${base}/${l}">`)
    .replace('</head>', `${homeLd(base, l).map(ld).join('')}</head>`)
    .replace(/<script src="\/i18n\.js[^"]*"><\/script>/, (m) => `<script>window.__LANG=${JSON.stringify(l)}</script>${m}`));
}

// --- O serwisie i /llms.txt (opis serwisu dla wyszukiwarek AI): same fakty, ceny zawsze z lib/pricing.js ---
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const PRICE_LIST = () => [...Object.entries(PACKAGES).map(([k, p]) => [p.name, PRICES[k], p.ads === 1 ? 'pod 1 ogłoszenie' : `do ${p.ads} ogłoszeń w tym samym zawodzie`]),
  ...Object.entries(ADDONS).map(([k, n]) => [n, PRICES[k], 'dodatek do zamówienia']), ['Każda dodatkowa wersja językowa dokumentów', PRICES.extraLang, 'dodatek do zamówienia']];
const DOC_LANGS = Object.values(LANGS).join(', ');
const b2bNote = () => `paczki od ${B2B_TIERS[0].min} kodów, rabat ${B2B_TIERS.map((t) => `${t.pct}%`).join(' / ')} od ${B2B_TIERS.map((t) => t.min).join(' / ')} kodów`;
const ABOUT = { title: 'O serwisie CV Pod Ogłoszenie', seoTitle: 'O serwisie: kto prowadzi CV Pod Ogłoszenie', metaDescription: 'Kto prowadzi CV Pod Ogłoszenie, jak powstaje CV i list motywacyjny pod konkretne ogłoszenie, ile to kosztuje, w jakich językach działa serwis i co dzieje się z danymi.' };
function aboutHtml() {
  const s = seller(), mail = esc(contactEmail());
  return `<div class="inner narrow legal"><nav class="crumbs"><a href="/">Strona główna</a> › <span>O serwisie</span></nav>
<h1>${esc(ABOUT.title)}</h1><p class="lead">CV Pod Ogłoszenie (cvpodogloszenie.pl) to serwis internetowy, w którym zamawiasz CV i list motywacyjny dopasowane do konkretnego ogłoszenia o pracę. Dokumenty powstają z pomocą narzędzi AI, na podstawie danych, które podajesz, i treści ogłoszenia.</p>
<h2>Kto prowadzi serwis</h2><p>Serwis prowadzi ${esc(s.name)} w ramach jednoosobowej działalności gospodarczej.</p>
<ul><li>Adres: ${esc(s.address)}, Polska</li><li>NIP: ${esc(s.nip)}</li><li>E-mail: <a href="mailto:${mail}">${mail}</a></li></ul>
<h2>Jak to działa</h2><ol><li>Wklejasz link do ogłoszenia albo jego treść (tekst odczytamy też ze zrzutu ekranu).</li><li>W kreatorze podajesz swoje doświadczenie, wykształcenie i umiejętności albo wgrywasz stare CV, z którego kreator się wypełni.</li><li>Z ogłoszenia wyciągamy wymagania i słowa kluczowe i łączymy je z Twoimi danymi. Niczego nie dopisujemy od siebie: czego nie robiłeś, tego nie ma w CV.</li><li>Po opłaceniu zamówienia dostajesz CV (i list, jeśli go wybrałeś) w PDF na e-mail, z raportem dopasowania: które wymagania z ogłoszenia spełniasz i gdzie są w CV, a których brakuje.</li><li>Możesz poprawić tekst w edytorze albo poprosić o darmową poprawkę.</li></ol>
<p>Nie obiecujemy zatrudnienia ani zaproszenia na rozmowę: decyzję zawsze podejmuje pracodawca.</p>
<h2>Ceny</h2><ul>${PRICE_LIST().map(([n, p, d]) => `<li>${esc(n)}: <b>${zl(p)}</b> (${esc(d)})</li>`).join('')}</ul>
<p>Płatność jednorazowa, bez abonamentu. Dla firm i instytucji: ${esc(b2bNote())}, szczegóły na stronie <a href="/dla-firm">Dla firm i uczelni</a>. Pełne zasady w <a href="/regulamin">regulaminie</a>.</p>
<h2>Języki</h2><p>Interfejs serwisu działa po polsku, angielsku, ukraińsku i niemiecku (<a href="/">PL</a>, <a href="/en">EN</a>, <a href="/uk">UK</a>, <a href="/de">DE</a>). Dokumenty przygotujemy w jednym z języków: ${esc(DOC_LANGS)}; każda kolejna wersja językowa to ${zl(PRICES.extraLang)}.</p>
<h2>Twoje dane</h2><ul><li>Dane z zamówienia i gotowe dokumenty usuwamy automatycznie po 30 dniach od złożenia zamówienia.</li><li>Do przygotowania dokumentów Twoje dane i treść ogłoszenia trafiają do dostawcy narzędzi AI (Anthropic); zdjęcie do CV tam nie trafia.</li><li>Płatności obsługuje ${p24Enabled() ? 'Stripe i Przelewy24' : 'Stripe'}; danych karty ani logowania do banku nie widzimy.</li><li>Darmowy skaner CV nie zapisuje tekstu CV ani ogłoszenia.</li></ul>
<p>Szczegóły, podstawy prawne i Twoje prawa: <a href="/polityka-prywatnosci">Polityka prywatności</a>.</p>
<h2>Kontakt</h2><p>Napisz na <a href="mailto:${mail}">${mail}</a>. Darmowe narzędzia: <a href="/narzedzia/skaner-cv">skaner CV</a>, <a href="/narzedzia/jaki-zawod-dla-mnie">i inne</a>.</p></div>`;
}
function llmsTxt(base) {
  const L = ['pl', 'en', 'uk', 'de'], NAMES = { pl: 'polski', en: 'English', uk: 'українська', de: 'Deutsch' }, home = (l) => `${base}/${l === 'pl' ? '' : l}`;
  const a = (t, u, d) => `- [${t}](${u})${d ? `: ${d}` : ''}`, gen = 'jak-dopasowac-cv-do-ogloszenia';
  const tool = (l, k) => (l === 'pl' ? `${base}/narzedzia/${k}` : TOOL_LANGS[l]?.data[k] && `${base}/${toolUrl(l, k)}`);
  const tTitle = (l, k) => (l === 'pl' ? TOOLS[k].title : TOOL_LANGS[l].data[k].title);
  return [`# ${NAME}`, '',
    `> Polski serwis internetowy (${base.replace(/^https?:\/\//, '')}), w którym zamawia się CV i list motywacyjny dopasowane do konkretnego ogłoszenia o pracę. Dokumenty powstają z pomocą AI na podstawie danych klienta i treści ogłoszenia. Interfejs: polski, angielski, ukraiński, niemiecki.`, '',
    `Klient wkleja ogłoszenie (link, tekst lub zrzut ekranu) i swoje dane albo stare CV. Serwis wyciąga z ogłoszenia wymagania i słowa kluczowe, łączy je z doświadczeniem klienta (bez dopisywania czegoś, czego klient nie robił) i wysyła CV w PDF z raportem dopasowania. Dokumenty w językach: ${DOC_LANGS}. Dane zamówienia są usuwane po 30 dniach. Serwis nie obiecuje zatrudnienia. Prowadzi go ${seller().name} (jednoosobowa działalność gospodarcza, NIP ${seller().nip}).`, '',
    '## Ceny (PLN, płatność jednorazowa)', '', ...PRICE_LIST().map(([n, p, d]) => `- ${n}: ${zl(p)} (${d})`), `- Firmy i instytucje: ${b2bNote()}`, '',
    '## Strony główne', '', ...L.map((l) => a(`Strona główna (${NAMES[l]})`, home(l))), a('O serwisie', `${base}/o-serwisie`, 'kto prowadzi serwis, jak działa, ceny, dane'), '',
    '## CV dla zawodów', '', ...L.map((l) => a(`Indeks zawodów (${NAMES[l]})`, `${home(l)}#zawody`)), ...L.map((l) => a(`Przykład: ${l === 'pl' ? 'magazynier' : PROF_LANGS[l].prof.magazynier.name} (${NAMES[l]})`, l === 'pl' ? `${base}/cv/magazynier` : `${base}/${profUrl(l, 'magazynier')}`)), '',
    '## Poradnik', '', ...L.map((l) => a(`Poradnik (${NAMES[l]})`, `${home(l)}#poradnik`)), ...L.map((l) => (l === 'pl' ? a(ARTICLES.find((x) => x.slug === gen).title, `${base}/poradnik/${gen}`) : ART_LANGS[l].data[gen] && a(ART_LANGS[l].data[gen].title, `${base}/${langUrl(l, ART_LANGS[l].data[gen].slugLang)}`))).filter(Boolean), '',
    '## Darmowe narzędzia', '', ...L.map((l) => tool(l, 'skaner-cv') && a(`${tTitle(l, 'skaner-cv')} (${NAMES[l]})`, tool(l, 'skaner-cv'), l === 'pl' ? 'ocena dopasowania CV do ogłoszenia' : '')).filter(Boolean),
    ...Object.keys(TOOLS).filter((k) => k !== 'skaner-cv').map((k) => a(`${tTitle('pl', k)} (${NAMES.pl})`, tool('pl', k))), '',
    '## Dla firm i instytucji (po polsku)', '', a('Dla firm i uczelni', `${base}/dla-firm`), a('Zamówienie kodów dla instytucji', `${base}/dla-instytucji/zamow`), a('Dla doradców zawodowych', `${base}/dla-doradcow`, 'scenariusz zajęć i darmowy kod'), '',
    '## Dokumenty prawne', '', ...L.flatMap((l) => ['prywatnosc', 'regulamin'].map((n) => a(`${LEGAL_PAGES[n][l].title} (${NAMES[l]})`, `${base}/${legalPath(n, l)}`))), '',
    '## Kontakt', '', `- E-mail: ${contactEmail()}`, '',
    '## Optional', '', ...L.filter((l) => l !== 'pl').flatMap((l) => Object.keys(TOOLS).filter((k) => k !== 'skaner-cv' && tool(l, k)).map((k) => a(`${tTitle(l, k)} (${NAMES[l]})`, tool(l, k)))), ''].join('\n');
}

export function seoRoutes(app, base) {
  // Strona główna: kanoniczny adres i dane strukturalne (firma, cennik, FAQ).
  app.get(['/', '/index.html'], (_req, res) => res.type('html').send(head(index(), base, `${base}/`)
    .replace(/<meta name="description" content="([^"]*)">/, `<meta name="description" content="$1"><link rel="canonical" href="${base}/">`)
    .replace('</head>', `${homeLd(base).map(ld).join('')}</head>`)));
  app.get('/o-serwisie', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); page(res, base, 'o-serwisie', ABOUT, aboutHtml(), { ssrOnly: true, data: [crumbsLd(base, [['O serwisie', 'o-serwisie']]), orgLd(base), { '@context': 'https://schema.org', '@type': 'AboutPage', name: ABOUT.title, url: `${base}/o-serwisie`, inLanguage: 'pl', about: { '@id': `${base}/#organizacja` } }] }); });
  app.get('/llms.txt', (_req, res) => res.set('Cache-Control', 'public, max-age=3600').type('text/plain; charset=utf-8').send(llmsTxt(base)));
  app.get('/:slug', (req, res, next) => {
    const lp = LEGAL_BY_PATH[req.params.slug]; if (lp) return legalPage(res, base, lp.name, lp.lang);
    const sp = STATIC_PAGES[req.params.slug] && staticPage(req.params.slug); if (!sp) return next();
    page(res, base, req.params.slug, sp, sp.html, { data: [crumbsLd(base, [[STATIC_PAGES[req.params.slug], req.params.slug]]), faqLd(faqFromHtml(sp.html))] });
  });
  app.get(['/en', '/uk', '/de'], (req, res) => langHome(res, base, req.path.slice(1)));
  app.get('/:lang/:slug', (req, res, next) => { const lp = LEGAL_BY_PATH[`${req.params.lang}/${req.params.slug}`]; if (!lp) return next(); legalPage(res, base, lp.name, lp.lang); });
  // Regulamin i polityka prywatności (4 języki) pobierane dopiero po wejściu w nie: lżejsza strona i brak tych samych tekstów na każdej podstronie.
  const legal = {};
  app.get('/legal/:name.html', (req, res, next) => {
    const n = req.params.name; if (!['regulamin', 'prywatnosc'].includes(n)) return next();
    legal[n] ??= withContact(fs.readFileSync(new URL(`../public/legal/${n}.html`, import.meta.url), 'utf8'));
    res.set({ 'Cache-Control': 'public, max-age=3600', 'X-Robots-Tag': 'noindex' }).type('html').send(legal[n]);
  });
  // Zawody w języku strony: skrócony indeks (adresy, nazwy), pełne dane popularnych zawodów, miasta i wzory zdań.
  app.get('/content/prof-:lang.json', (req, res, next) => {
    const l = req.params.lang, x = PROF_LANGS[l]; if (!x) return next();
    res.set('Cache-Control', 'public, max-age=3600').json({ seg: x.seg, tpl: PAGE_T[l], index: Object.fromEntries(Object.entries(x.prof).map(([pl, t]) => [pl, { slugLang: t.slugLang, name: t.name }])),
      popular: Object.fromEntries(POPULAR.map((p) => [p.slug, profIn(l, p.slug)])), cities: Object.fromEntries(CITIES.map((c) => [c.slug, cityIn(l, c.slug)])) });
  });
  app.get('/content/articles-:lang.json', (req, res, next) => { const x = ART_LANGS[req.params.lang]; if (!x) return next(); res.set('Cache-Control', 'public, max-age=3600').json(Object.fromEntries(Object.entries(x.data).map(([k, { slugLang, title, metaDescription, lead }]) => [k, { slugLang, title, metaDescription, lead }]))); });
  // Lista artykułów bez treści (treść pobiera dopiero strona artykułu: /content/art/<slug>.json).
  const ART_META = ARTICLES.map(({ slug, title, metaDescription, lead, readMinutes, related, templates }) => ({ slug, title, metaDescription, lead, readMinutes, related, templates }));
  const TOOLS_META = Object.fromEntries(Object.entries(TOOLS).map(([k, t]) => [k, { ...t, slugs: toolSlugs(k) }]));
  app.get('/content.json', (_req, res) => res.set('Cache-Control', 'public, max-age=3600').json({ INDEX, POPULAR, ARTICLES: ART_META, CITIES, TOOLS: TOOLS_META }));
  app.get('/content/tools-:lang.json', (req, res, next) => { const x = TOOL_LANGS[req.params.lang]; if (!x) return next(); res.set('Cache-Control', 'public, max-age=3600').json(x.data); });
  app.get('/content/art/:slug.json', (req, res) => {
    const a = ARTICLES.find((x) => x.slug === req.params.slug); if (!a) return res.sendStatus(404);
    const tr = ART_LANGS[req.query.lang]?.data[a.slug];
    res.set('Cache-Control', 'public, max-age=3600').json(tr ? { ...a, ...tr } : a);
  });
  app.get('/content/cv/:slug.json', (req, res) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return res.sendStatus(404); const l = req.query.lang; res.set('Cache-Control', 'public, max-age=3600').json((PROF_LANGS[l] && profIn(l, p.slug)) || p); });
  app.get('/cv/:slug', (req, res, next) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return next(); page(res, base, `cv/${p.slug}`, p, profHtml(p), { alternates: profAlternates(base, p.slug), data: [crumbsLd(base, [[p.name, `cv/${p.slug}`]]), faqLd(p.faq)] }); });
  app.get('/cv/:slug/:city', (req, res, next) => {
    const p = POPULAR.find((x) => x.slug === req.params.slug), c = CITIES.find((x) => x.slug === req.params.city);
    if (!p || !c) return next();
    page(res, base, `cv/${p.slug}/${c.slug}`, cityMeta(p, c), cityHtml(p, c), { ...cityOpts(res, base, p.slug, c.slug, `cv/${p.slug}`), data: [crumbsLd(base, [[p.name, `cv/${p.slug}`], [c.name, `cv/${p.slug}/${c.slug}`]])] });
  });
  app.get('/narzedzia/:slug', (req, res, next) => {
    const t = TOOLS[req.params.slug]; if (!t) return next();
    const about = (t.about || []).map((x) => `<p>${esc(x)}</p>`).join('') + (t.faq?.length ? `<h2>Pytania</h2>${t.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : '');
    page(res, base, `narzedzia/${req.params.slug}`, t, `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Darmowe narzędzia</span></nav><h1>${esc(t.title)}</h1><p class="lead">${esc(t.lead)}</p>${about}<h2>Inne darmowe narzędzia</h2><div class="more">${Object.entries(TOOLS).map(([k, x]) => `<a href="/narzedzia/${k}">${esc(x.title)}</a>`).join('')}</div></div>`, { alternates: toolAlternates(base, req.params.slug), data: [crumbsLd(base, [['Darmowe narzędzia', '#poradnik'], [t.title, `narzedzia/${req.params.slug}`]]), faqLd(t.faq || []), { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.title, description: t.metaDescription, url: `${base}/narzedzia/${req.params.slug}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', inLanguage: 'pl', offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' } }] });
  });
  app.get('/poradnik/:slug', (req, res, next) => {
    const a = ARTICLES.find((x) => x.slug === req.params.slug); if (!a) return next();
    page(res, base, `poradnik/${a.slug}`, a, artHtml(a), { alternates: artAlternates(base, a.slug), data: [crumbsLd(base, [['Poradnik', '#poradnik'], [a.title, `poradnik/${a.slug}`]]), faqLd(a.faq || []),
      articleLd(base, a, `poradnik/${a.slug}`, 'pl')] });
  });
  app.get(['/:lang/:seg/:slug', '/:lang/:seg/:slug/:city'], (req, res, next) => {
    const { lang: l, seg, slug, city } = req.params;
    if (PROF_LANGS[l]?.seg !== seg) return next();
    const pl = PROF_BY[l][slug], p = pl && profIn(l, pl); if (!p) return next();
    if (!city) return page(res, base, profUrl(l, pl), p, profHtmlLang(p, l), { lang: l, route: `cv/${pl}`, alternates: profAlternates(base, pl), data: [faqLd(p.faq || [])] });
    const cpl = CITY_BY[l][city], c = cpl && POPULAR.some((x) => x.slug === pl) && cityIn(l, cpl); if (!c) return next();
    page(res, base, profUrl(l, pl, cpl), { title: fillT(PAGE_T[l].title, p, c), seoTitle: fillT(PAGE_T[l].seo, p, c), metaDescription: fillT(PAGE_T[l].desc, p, c) }, cityHtmlLang(p, c, l), { lang: l, route: `cv/${pl}/${cpl}`, ...cityOpts(res, base, pl, cpl, profUrl(l, pl)), data: [crumbsLd(base, [[p.name, profUrl(l, pl)], [c.name, profUrl(l, pl, cpl)]], l)] });
  });
  app.get('/:lang/:seg/:slug', (req, res, next) => {
    const { lang: l, seg, slug } = req.params, pl = TOOL_LANGS[l]?.seg === seg && TOOL_BY[l][slug];
    if (!pl) return next();
    const x = TOOL_LANGS[l].data[pl];
    page(res, base, toolUrl(l, pl), x, toolHtmlLang(pl, l), { lang: l, route: `narzedzia/${pl}`, alternates: toolAlternates(base, pl), data: [crumbsLd(base, [[dictOf(l)['Darmowe narzędzia'] || 'Darmowe narzędzia', `${l}#poradnik`], [x.title, toolUrl(l, pl)]], l), faqLd(x.faq || [])] });
  });
  app.get('/:lang/:seg/:slug', (req, res, next) => {
    const { lang: l, seg, slug } = req.params, a = ART_LANGS[l]?.seg === seg && BY_LANG[l][slug];
    if (!a) return next();
    page(res, base, langUrl(l, slug), a, artHtmlLang(a, l), { lang: l, route: `poradnik/${a.slug}`, alternates: artAlternates(base, a.slug), data: [faqLd(a.faq || []), articleLd(base, a, langUrl(l, slug), l)] });
  });
  // /wynik/ (karty wyników skanera) poza wyszukiwarkami, ale boty podglądu linków (Facebook, X, Telegram, WhatsApp) muszą pobrać obrazek i opis.
  const DIS = 'Disallow: /api/\nDisallow: /admin\nDisallow: /konto\nDisallow: /newsletter/\nDisallow: /raport/\nDisallow: /raport-seo/\n';
  app.get('/robots.txt', (_req, res) => res.type('text').send(`User-agent: *\nAllow: /\nAllow: /llms.txt\n${DIS}Disallow: /wynik/\n\nUser-agent: facebookexternalhit\nUser-agent: Facebot\nUser-agent: Twitterbot\nUser-agent: TelegramBot\nUser-agent: WhatsApp\nAllow: /\n${DIS}\nSitemap: ${base}/sitemap.xml\n`));
  // Do mapy strony trafiają tylko indeksowane pary zawód × miasto (cityIndexable).
  const cityPairs = () => POPULAR.flatMap((p) => CITIES.filter((c) => cityIndexable(p.slug, c.slug)).map((c) => [p.slug, c.slug]));
  app.get('/sitemap.xml', (_req, res) => {
    const urls = ['', 'en', 'uk', 'de', ...Object.keys(STATIC_PAGES), ...Object.keys(LEGAL_BY_PATH), 'o-serwisie', 'dla-instytucji/zamow', 'program-partnerski', 'program-partnerski/regulamin', 'dla-doradcow', ...PROFESSIONS.map((p) => `cv/${p.slug}`), ...cityPairs().map(([p, c]) => `cv/${p}/${c}`), ...ARTICLES.map((a) => `poradnik/${a.slug}`), ...Object.entries(BY_LANG).flatMap(([l, m]) => Object.keys(m).map((s) => langUrl(l, s))),
      ...Object.keys(PROF_LANGS).flatMap((l) => [...PROFESSIONS.map((p) => profUrl(l, p.slug)), ...cityPairs().map(([p, c]) => profUrl(l, p, c))]), ...TEMPLATE_URLS, ...Object.keys(TOOLS).map((k) => `narzedzia/${k}`), ...Object.keys(TOOL_LANGS).flatMap((l) => Object.keys(TOOLS).filter((k) => TOOL_LANGS[l].data[k]).map((k) => toolUrl(l, k)))];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}/${u}</loc><lastmod>${UPDATED}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  });
}
