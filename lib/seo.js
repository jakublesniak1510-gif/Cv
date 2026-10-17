import fs from 'node:fs';
import crypto from 'node:crypto';
import { PROFESSIONS, ARTICLES, POPULAR_SLUGS } from './content.js';
import { CITIES } from './cities.js';
import { TOOLS } from './tools.js';
import { PRICES, PACKAGES } from './pricing.js';
import { ART_LANGS } from './articles-i18n.js';
import { TOOL_LANGS, TOOL_BY, toolUrl, toolSlugs } from './tools-i18n.js';
import { PROF_LANGS } from './professions-i18n.js';
import { PAGE_T, fillT } from './page-i18n.js';

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
function homeLd(base, l = 'pl') {
  const faq = /<section class="sec" id="faq">([\s\S]*?)<\/section>/.exec(index())?.[1] || '';
  return [
    { '@context': 'https://schema.org', '@type': 'Organization', name: NAME, url: `${base}/`, logo: `${base}/logo.svg` },
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

// Zawody i miasta w językach EN / UA / DE: /<język>/<segment>/<zawód>[/<miasto>], powiązane hreflang z polskimi stronami.
const profIn = (l, pl) => { const p = PROFESSIONS.find((x) => x.slug === pl), t = PROF_LANGS[l].prof[pl]; return p && t ? { ...p, ...t, kwPl: p.keywords, lang: l } : null; };
const cityIn = (l, pl) => { const c = CITIES.find((x) => x.slug === pl), t = PROF_LANGS[l].cities[pl]; return c && t ? { ...c, ...t } : null; };
const PROF_BY = Object.fromEntries(Object.entries(PROF_LANGS).map(([l, x]) => [l, Object.fromEntries(Object.entries(x.prof).map(([pl, t]) => [t.slugLang, pl]))]));
const CITY_BY = Object.fromEntries(Object.entries(PROF_LANGS).map(([l, x]) => [l, Object.fromEntries(Object.entries(x.cities).map(([pl, t]) => [t.slugLang, pl]))]));
const profUrl = (l, pl, city) => `${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[pl].slugLang}${city ? '/' + PROF_LANGS[l].cities[city].slugLang : ''}`;
const profAlternates = (base, pl, city) => [`<link rel="alternate" hreflang="pl" href="${base}/cv/${pl}${city ? '/' + city : ''}">`,
  ...Object.keys(PROF_LANGS).map((l) => `<link rel="alternate" hreflang="${l}" href="${base}/${profUrl(l, pl, city)}">`),
  `<link rel="alternate" hreflang="x-default" href="${base}/cv/${pl}${city ? '/' + city : ''}">`].join('');
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

// opts.lang: język strony (html lang + i18n), opts.alternates: linki hreflang, opts.route: trasa dla skryptu strony, opts.data: JSON-LD.
function page(res, base, route, item, html, opts = {}) {
  const url = `${base}/${route}`;
  let out = head(index(), base, url, opts.alternates || '')
    .replace(/<title>.*?<\/title>/, `<title>${esc(fitTitle(item.seoTitle || item.title))}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(fitDesc(item.metaDescription))}">${opts.notFound ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(item.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(item.metaDescription)}">`)
    .replace('</head>', `${(opts.data || []).filter(Boolean).map(ld).join('')}</head>`)
    .replace('<main id="landing">', '<main id="landing" hidden>')
    .replace('<section class="page" id="page" role="main" hidden></section>', `<section class="page" id="page" role="main">${html}</section>`)
    .replace(/<script src="\/app\.js[^"]*"><\/script>/, (m) => `<script>window.__ROUTE=${JSON.stringify(opts.route || route)}${opts.notFound ? ';window.__NOTFOUND=1' : ''}</script>${m}`);
  if (opts.lang && opts.lang !== 'pl') out = out.replace('<html lang="pl">', `<html lang="${opts.lang}">`).replace(/<script src="\/i18n\.js[^"]*"><\/script>/, (m) => `<script>window.__LANG=${JSON.stringify(opts.lang)}</script>${m}`);
  res.type('html').send(out);
}

// Strona 404 w wyglądzie serwisu (nagłówek, menu, stopka), w języku z adresu (/en, /uk, /de).
// Strona główna (z wersjami plików i kontaktem) dla adresów obsługiwanych przez skrypt strony, np. /konto.
export const homeHtml = () => index();
export function sendNotFound(req, res, base) {
  const l = (/^\/(en|uk|de)(\/|$)/.exec(req.path) || [])[1] || 'pl', home = l === 'pl' ? '/' : '/' + l;
  const html = `<div class="inner narrow nf" data-i18n><p class="eyebrow">404</p><h1>Nie znaleziono strony</h1>
<p class="lead">Ten adres nie istnieje albo strona została przeniesiona. Sprawdź, czy adres jest wpisany poprawnie.</p>
<div class="nf-act"><a class="btn" href="${home}">Strona główna</a><a class="btn ghost" href="${home}#szablony">Zobacz szablony</a><a class="btn ghost" href="${home}#poradnik">Poradnik</a></div></div>`;
  res.status(404);
  page(res, base, '', { title: 'Nie znaleziono strony', metaDescription: 'Ten adres nie istnieje albo strona została przeniesiona.' }, html, { lang: l, notFound: true });
}

// Wersje językowe strony głównej (/en, /uk, /de): ten sam HTML, tytuł i opis z słownika, resztę tłumaczy public/i18n.js.
const dicts = {};
const dictOf = (l) => (dicts[l] ??= (() => { try { return JSON.parse(fs.readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url), 'utf8')); } catch { return {}; } })());
function langHome(res, base, l) {
  const d = dictOf(l), t = (s) => d[s] || s;
  // Kafelki narzędzi i linki w stopce prowadzą do wersji w tym języku.
  const toolLinks = (h) => h.replace(/href="\/narzedzia\/([\w-]+)"/g, (m, k) => (TOOL_LANGS[l].data[k] ? `href="/${toolUrl(l, k)}"` : m));
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

export function seoRoutes(app, base) {
  // Strona główna: kanoniczny adres i dane strukturalne (firma, cennik, FAQ).
  app.get(['/', '/index.html'], (_req, res) => res.type('html').send(head(index(), base, `${base}/`)
    .replace(/<meta name="description" content="([^"]*)">/, `<meta name="description" content="$1"><link rel="canonical" href="${base}/">`)
    .replace('</head>', `${homeLd(base).map(ld).join('')}</head>`)));
  app.get('/:slug', (req, res, next) => {
    const sp = STATIC_PAGES[req.params.slug] && staticPage(req.params.slug); if (!sp) return next();
    page(res, base, req.params.slug, sp, sp.html, { data: [crumbsLd(base, [[STATIC_PAGES[req.params.slug], req.params.slug]]), faqLd(faqFromHtml(sp.html))] });
  });
  app.get(['/en', '/uk', '/de'], (req, res) => langHome(res, base, req.path.slice(1)));
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
    page(res, base, `cv/${p.slug}/${c.slug}`, cityMeta(p, c), cityHtml(p, c), { alternates: profAlternates(base, p.slug, c.slug), data: [crumbsLd(base, [[p.name, `cv/${p.slug}`], [c.name, `cv/${p.slug}/${c.slug}`]])] });
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
    page(res, base, profUrl(l, pl, cpl), { title: fillT(PAGE_T[l].title, p, c), seoTitle: fillT(PAGE_T[l].seo, p, c), metaDescription: fillT(PAGE_T[l].desc, p, c) }, cityHtmlLang(p, c, l), { lang: l, route: `cv/${pl}/${cpl}`, alternates: profAlternates(base, pl, cpl), data: [crumbsLd(base, [[p.name, profUrl(l, pl)], [c.name, profUrl(l, pl, cpl)]], l)] });
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
  app.get('/robots.txt', (_req, res) => res.type('text').send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /konto\nDisallow: /newsletter/\nSitemap: ${base}/sitemap.xml\n`));
  app.get('/sitemap.xml', (_req, res) => {
    const urls = ['', 'en', 'uk', 'de', ...Object.keys(STATIC_PAGES), ...PROFESSIONS.map((p) => `cv/${p.slug}`), ...POPULAR.flatMap((p) => CITIES.map((c) => `cv/${p.slug}/${c.slug}`)), ...ARTICLES.map((a) => `poradnik/${a.slug}`), ...Object.entries(BY_LANG).flatMap(([l, m]) => Object.keys(m).map((s) => langUrl(l, s))),
      ...Object.keys(PROF_LANGS).flatMap((l) => [...PROFESSIONS.map((p) => profUrl(l, p.slug)), ...POPULAR.flatMap((p) => CITIES.map((c) => profUrl(l, p.slug, c.slug)))]), ...Object.keys(TOOLS).map((k) => `narzedzia/${k}`), ...Object.keys(TOOL_LANGS).flatMap((l) => Object.keys(TOOLS).filter((k) => TOOL_LANGS[l].data[k]).map((k) => toolUrl(l, k)))];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}/${u}</loc><lastmod>${UPDATED}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  });
}
