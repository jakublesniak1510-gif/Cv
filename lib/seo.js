import { abHome } from './ab.js';
import { TEMPLATE_URLS, templateFor } from './templates-content/index.js';
import { ABROAD_URLS, ABROAD_BY, ABROAD_FOR_ARTICLE } from './abroad-content.js';
import { OFFICIAL_URLS } from './official-content.js';
import { PORTAL_URLS } from './portals-content.js';
import { EMPLOYER_URLS, employersFor } from './employers-data.js';
import { fairUrls } from './fairs.js';
import { baHtml } from './before-after.js';
import { servicesBarHtml } from './services.js';
import { isAdHit, withAdHero, adHeroTemplate } from './ad-hero.js';
import { byline, pageLd, authorLd, dateOf, OLD_AUTHOR_PATH } from './authorship.js';
import { previewImg, previewPath } from './previews.js';
import { p24Enabled } from './p24.js';
import { tpHtml, tpLocale } from './trustpilot.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { PROFESSIONS, ARTICLES, POPULAR_SLUGS } from './content.js';
import { affHtml } from './affiliates.js';
import { CITIES } from './cities.js';
import { TOOLS } from './tools.js';
import { PRICES, PACKAGES, ADDONS, LANGS, B2B_TIERS } from './pricing.js';
import { seller } from './invoice.js';
import { ART_LANGS } from './articles-i18n.js';
import { TOOL_LANGS, TOOL_BY, toolUrl, toolSlugs } from './tools-i18n.js';
import { PROF_LANGS } from './professions-i18n.js';
import { PROF_EN_PLUS } from './prof-en-plus.js';
import { PROF_DE_PLUS } from './prof-de-plus.js';
import { widgetHtml, sourcesHtml } from './widgets.js';
import { withExt } from './content-ext.js';
import { C3_301, C3_CASE_URL } from './articles-c3.js';
import { DUTIES, DUTIES_INDEX, dutiesPath } from './duties.js';
import { twoAds, profGen } from './prof-match.js';
import { profSeo, artSeoTitle, CTR_SEO } from './seo-titles.js';
import { PAGE_T, fillT } from './page-i18n.js';
import { LEGAL_PAGES, LEGAL_BY_PATH, LEGAL_LANGS, legalPath, legalBody, gateLegal } from './legal.js';
import { QA_PATH, QA_SEED, publishedQa } from './reader-qa.js';

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
const versioned = (h) => h.replace(/(src|href)="\/(app\.js|consent\.js|style\.css|i18n\.js|lite\.js)"/g, (_, a, f) => `${a}="/${f}?v=${ver(f)}"`);
// Weryfikacja domeny w Meta Business (META_DOMAIN_VERIFY) i na Pinterest (PINTEREST_VERIFY): metatagi w <head> każdej strony budowanej z index.html.
const VERIFY = [['META_DOMAIN_VERIFY', 'facebook-domain-verification'], ['PINTEREST_VERIFY', 'p:domain_verify']];
const metaVerify = (h) => {
  const tags = VERIFY.filter(([k]) => process.env[k]).map(([k, n]) => `<meta name="${n}" content="${esc(String(process.env[k]).trim().slice(0, 100))}">`).join('');
  return tags ? h.replace('<meta charset="utf-8">', () => `<meta charset="utf-8">${tags}`) : h;
};
const index = () => (indexHtml ??= tpHtml(metaVerify(versioned(withContact(fs.readFileSync(INDEX_HTML, 'utf8'))).replace('<!--przed-po-->', baHtml(PRICES.cv)).replace('<!--inne-uslugi-->', servicesBarHtml()).replace('<!--tp-hero-->', () => `${adHeroTemplate()}<!--tp-hero-->`).replace('<!--dane-firmy-->', contactShortHtml()))));

// Przycisk zamówienia w treści strony zawodu (po wstępie i na końcu); lite.js dopisuje do linku kod polecający.
const priceZl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const profCta = (home, slug, t = (x) => x) => `<p class="prof-cta"><a class="btn" href="${home}?zamow=1&amp;zawod=${slug}">${esc(t('Zrób CV pod ogłoszenie – od {X}').replace('{X}', priceZl(PRICES.cv)))}</a></p>`;
// Strony zawodów prowadzą do dopasowania: „Masz ogłoszenie?” (treść przez lite.js do skanera, bez wysyłki na serwer),
// „Jedno CV, dwa ogłoszenia” (lib/prof-match.js) i słowa kluczowe z datą. Kolejność wezwań: darmowy skaner → kreator.
const dmyOf = (iso) => String(iso || '').split('-').reverse().join('.');
const pasteAd = (scan, t) => `<form class="paste-ad" data-scan="${scan}" novalidate><h2>${esc(t('Masz ogłoszenie na to stanowisko?'))}</h2>
<p>${esc(t('Wklej treść albo link. Darmowy skaner porówna ogłoszenie z Twoim CV i pokaże, których wymagań w nim nie widać.'))}</p>
<label class="f">${esc(t('Treść lub link do ogłoszenia'))}<textarea name="ad" rows="4"></textarea></label><button class="btn" type="submit">${esc(t('Sprawdź CV z tym ogłoszeniem'))}</button>
<p class="hint small">${esc(t('Ogłoszenie przekażemy do skanera w tej przeglądarce. CV wgrasz w następnym kroku.'))}</p></form>`;
const twoAdsHtml = (p, t) => `<h2>${esc(t('Jedno CV, dwa ogłoszenia'))}</h2><p>${esc(t('To samo przykładowe CV i dwa ogłoszenia na to stanowisko z innymi wymaganiami. Zaznaczyliśmy, co CV już pokazuje i co trzeba by dopisać – tylko jeśli naprawdę masz takie doświadczenie.'))}</p>
<div class="two-ads">${twoAds(p).map((a, i) => `<div class="ad-col"><h3>${esc(t(i ? 'Ogłoszenie B' : 'Ogłoszenie A'))}</h3><p class="small">${esc(t('Wymagania z ogłoszenia:'))}</p>
<ul class="reqs-list">${a.reqs.map((r) => `<li class="${r.hit ? 'ok' : 'no'}"><span aria-hidden="true">${r.hit ? '✓' : '–'}</span> ${esc(r.k)} <small>${esc(t(r.hit ? 'widać w CV' : 'nie widać w CV'))}</small></li>`).join('')}</ul>
<p class="small">${esc(t('Na górę CV pod to ogłoszenie:'))}</p>${a.lines.length ? `<ul class="ad-lines">${a.lines.map((h) => `<li>${h}</li>`).join('')}</ul>` : `<p>${esc(t('Przykładowe CV nie pokazuje tych wymagań. Dopisz je, jeśli masz takie doświadczenie.'))}</p>`}</div>`).join('')}</div>`;
const kwHtml = (p, t, l, path, small = () => '') => `<h2>${esc(t('Czego szukają rekruterzy w CV {0}').replace('{0}', profGen(p, l)))}</h2>
<p class="small">${esc(t('Słowa kluczowe, które często pojawiają się w ogłoszeniach dla tego zawodu. Lista z aktualizacji strony: {0}.').replace('{0}', dmyOf(dateOf(path) || UPDATED)))}</p>
<div class="kw">${p.keywords.map((k, i) => `<span>${esc(k)}${small(i)}</span>`).join('')}</div>`;
const scanCta = (scan, home, slug, t) => `<p class="prof-cta"><a class="btn ghost" href="${scan}">${esc(t('Sprawdź CV za darmo'))}</a> <a class="btn" href="${home}?zamow=1&amp;zawod=${slug}">${esc(t('Zrób CV pod ogłoszenie – od {X}').replace('{X}', priceZl(PRICES.cv)))}</a></p>
<p class="small prof-nojob">${esc(t('Nie masz jeszcze ogłoszenia?'))} <a href="${home}?zamow=1&amp;pkg=cv&amp;zawod=${slug}&amp;tryb=zawod">${esc(t('Zrób CV pod typowe wymagania tego zawodu – {X}').replace('{X}', priceZl(PRICES.cv)))}</a></p>`;
// Rozbudowane strony zawodów (lib/prof-extra): wymagania z ogłoszeń, przykładowe zdania i najczęstsze błędy (FAQ jest w p.faq).
const profExtraHtml = (p) => (p.extra ? `<h2>Na co zwraca uwagę rekruter</h2><p>${esc(p.extra.rekruter)}</p>
<h2>Typowe wymagania z ogłoszeń i jak je pokazać w CV</h2><dl class="reqs">${p.extra.wymagania.map(([w, h]) => `<dt>${esc(w)}</dt><dd>${esc(h)}</dd>`).join('')}</dl>
<h2>Przykładowe zdania do opisu doświadczenia</h2><p>Zdania możesz dopasować do siebie. Wpisuj tylko to, co naprawdę robiłeś.</p><ul class="phrases">${p.extra.zdania.map((z) => `<li>${esc(z)}</li>`).join('')}</ul>
<h2>Najczęstsze błędy w CV</h2><ul>${p.extra.bledy.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
` : '');
// Statyczna treść podstrony (dla wyszukiwarek i bez JavaScriptu); skrypt strony potem ją wzbogaca.
function profHtml(p) {
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/#zawody">CV dla zawodów</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.title)}</h1>${byline(`cv/${p.slug}`)}<p class="lead">${esc(p.intro)}</p>
${pasteAd('/narzedzia/skaner-cv', (x) => x)}
${kwHtml(p, (x) => x, 'pl', `cv/${p.slug}`)}
<h2>Wskazówki do CV</h2><ol class="tips">${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
${profExtraHtml(p)}<h2>Przykładowe CV</h2>${previewImg(`cv-${p.slug}`, `Przykładowe CV: ${p.name} – podgląd (dane fikcyjne)`, 'prof-img')}<p><b>${esc(p.sample.name)}</b>, ${esc(p.sample.headline)}. ${esc(p.sample.summary)}</p>
${p.sample.jobs.map((j) => `<h3>${esc(j.title)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
${twoAdsHtml(p, (x) => x)}${scanCta('/narzedzia/skaner-cv', '/', p.slug, (x) => x)}
<h2>Pytania</h2>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<h2>Poradniki dla tego zawodu</h2><div class="more">${articlesFor(p.slug).map((a) => `<a href="/poradnik/${a.slug}">${esc(a.title)}</a>`).join('')}</div>
${(() => { const es = employersFor(p.slug); return es.length ? `<h2>Pracodawcy, którzy często szukają</h2><div class="more">${es.map((e) => `<a href="/praca-w/${e.slug}">Praca ${esc(e.w)}</a>`).join('')}</div>` : ''; })()}
<h2>Wzór CV i list</h2><div class="more">${(() => { const t = templateFor(p.slug); return t ? `<a href="/wzor-cv/${t.slug}">Wzór CV ${esc(t.nameIn)} (DOCX)</a><a href="/list-motywacyjny/${t.slug}">List motywacyjny ${esc(t.nameIn)} (DOCX)</a>` : '<a href="/wzor-cv">Darmowe wzory CV (DOCX)</a><a href="/list-motywacyjny">Wzory listów motywacyjnych (DOCX)</a>'; })()}</div>
${affHtml(p.slug, `cv/${p.slug}`)}<h2>Podobne zawody</h2><div class="more">${PROFESSIONS.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => `<a href="/cv/${x.slug}">${esc(x.name)}</a>`).join('')}</div>
${DUTIES[p.slug] ? `<h2>Zobacz też</h2><div class="more"><a href="/${dutiesPath(p.slug)}">Zakres obowiązków ${esc(DUTIES[p.slug].nazwaD)}</a></div>` : ''}
${profCta('/', p.slug)}</div>`;
}
const cityMeta = (p, c) => ({ title: `${p.name} ${c.loc}: CV pod lokalne ogłoszenia`, seoTitle: `${p.name} ${c.loc}: CV pod ogłoszenie`, metaDescription: `Jak napisać CV na stanowisko ${p.name.toLowerCase()} ${c.loc}: słowa kluczowe z ogłoszeń, wskazówki dla rynku pracy ${c.gen} i przykładowe CV. CV pod ogłoszenie od 39 zł.` });
// PR W: linki do wyników wyszukiwania ofert na portalach (zawód i miasto po polsku – portale są polskie), nofollow, nowa karta.
// Format adresów jak w e-mailu z ofertami (lib/alerts.js: searchLinks) + Jooble; CBOP nie ma stałych parametrów w adresie – link do wyszukiwarki.
const plainAscii = (s) => String(s || '').replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function cityJobLinks(job, city) {
  const q = encodeURIComponent(job.toLowerCase()), c = encodeURIComponent(city);
  return [['Pracuj.pl', `https://www.pracuj.pl/praca/${q};kw/${c};wp`], ['OLX Praca', `https://www.olx.pl/praca/${plainAscii(city)}/q-${plainAscii(job)}/`], ['Indeed', `https://pl.indeed.com/jobs?q=${q}&l=${c}`],
    ['Jooble', `https://pl.jooble.org/SearchResult?ukw=${q}&rgns=${c}`], ['Urzędy pracy (CBOP)', 'https://oferty.praca.gov.pl/portal/lista-ofert']];
}
const jobLinksHtml = (p, c, t = (x) => x) => {
  const job = (POPULAR.find((x) => x.slug === p.slug)?.name || p.name).split(' / ')[0], city = CITIES.find((x) => x.slug === c.slug)?.name || c.name;
  return `<div class="more job-links">${cityJobLinks(job, city).map(([n, u]) => `<a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(n)}</a>`).join('')}</div><p class="small">${esc(t('Linki prowadzą do wyników wyszukiwania na portalach z ofertami pracy i otwierają się w nowej karcie. Nie odpowiadamy za treść ogłoszeń.'))}</p>`;
};
function cityHtml(p, c) {
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/cv/${p.slug}">${esc(p.name)}</a> › <span>${esc(c.name)}</span></nav>
<h1>${esc(cityMeta(p, c).title)}</h1><p class="lead">${esc(c.intro)}</p>
<h2>Szukasz pracy jako ${esc(p.name.toLowerCase())} ${esc(c.loc)}?</h2><p>${esc(p.intro)}</p>
<h2>Oferty pracy: ${esc(p.name.toLowerCase())} ${esc(c.loc)}</h2>${jobLinksHtml(p, c)}
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
// Rozszerzone strony EN/DE (lib/content-ext.js): sekcje, źródła i link do skanera w języku strony.
const secHtml = (secs) => (secs || []).map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((x) => `<p>${esc(x)}</p>`).join('')}`).join('');
const srcHtml = (src, t) => (src?.length ? `<h2>${esc(t('Źródła'))}</h2><ul class="sources">${src.map((x) => `<li><a href="${esc(x.u)}" rel="noopener" target="_blank">${esc(x.t)}</a></li>`).join('')}</ul>` : '');
const scanLink = (l, t) => `<p class="prof-cta"><a class="btn ghost" href="/${toolUrl(l, 'skaner-cv')}">${esc(t('Sprawdź swoje CV darmowym skanerem'))}</a></p>`;
const faqHtml = (faq, t = (x) => x) => (faq?.length ? `<h2>${esc(t('Pytania i odpowiedzi'))}</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : '');
const tplHtml = (a, t = (x) => x, l = 'pl') => (a.templates ? `<h2>${esc(t('Wzory CV do pobrania (PDF)'))}</h2><p>${esc(t('Przykładowe CV w każdym szablonie, ze znakiem wodnym PRZYKŁAD. Pobierz, porównaj i wybierz wygląd, a treść dopasujemy do Twojego ogłoszenia.'))}</p><div class="more">${Object.entries(TPL_NAMES).map(([k, n]) => `<a href="/api/sample.pdf?tpl=${k}&amp;lang=${l}" rel="nofollow" download>${esc(t('Wzór CV'))}: ${esc(t(n))}</a>`).join('')}</div>` : '');
const ctaHtml = (home, t = (x) => x) => `<div class="cta-box"><div><b>${esc(t('Zrób CV pod swoje ogłoszenie'))}</b><p class="hint">${esc(t('Wklejasz link, dostajesz CV z raportem dopasowania. Od 39 zł.'))}</p></div><a class="btn" href="${home}?zamow=1">${esc(t('Zamów CV'))}</a></div>`;
// „Przeczytaj też”: 8 artykułów – najpierw o tych samych zawodach, potem kolejne w kolejności poradnika (nie cała lista,
// żeby wspólny tekst nie przeważał nad treścią artykułu).
const relatedArts = (list, a) => { const rest = list.filter((x) => x.slug !== a.slug), i = list.findIndex((x) => x.slug === a.slug), score = (x) => (x.related || []).filter((r) => (a.related || []).includes(r)).length;
  return [...rest].sort((x, y) => score(y) - score(x) || ((list.indexOf(x) - i + list.length) % list.length) - ((list.indexOf(y) - i + list.length) % list.length)).slice(0, 8); };
// Tematy poradnika (hub /poradnik i blok „Powiązane”): każdy artykuł w dokładnie jednym temacie.
export const ART_TOPICS = [
  ['Jak napisać CV', ['jak-napisac-cv-krok-po-kroku', 'wzor-cv-2026', 'podsumowanie-zawodowe-w-cv', 'umiejetnosci-miekkie-i-twarde-w-cv', 'ile-stron-powinno-miec-cv', 'zdjecie-w-cv', 'klauzula-rodo-w-cv', 'cv-po-angielsku', 'jak-opisac-obowiazki-w-cv']],
  ['CV pod ogłoszenie i systemy ATS', ['jak-dopasowac-cv-do-ogloszenia', 'czy-dopasowywac-cv-do-kazdej-oferty', 'slowa-kluczowe-w-cv', 'slowa-kluczowe-ats-wedlug-zawodu', 'czym-jest-ats', 'jak-przejsc-przez-ats', 'ats-mity-i-fakty', 'format-cv-pod-ats', 'cv-pod-ai', 'wyslales-cv-i-nikt-nie-dzwoni']],
  ['Sytuacje szczególne', ['cv-bez-doswiadczenia', 'cv-dla-studenta', 'cv-50-plus', 'cv-po-urlopie-macierzynskim', 'przerwa-w-zatrudnieniu-w-cv', 'cv-przy-zmianie-branzy']],
  ['List motywacyjny i rozmowa', ['jak-napisac-list-motywacyjny', 'email-z-aplikacja-i-podziekowanie-po-rozmowie', 'follow-up-po-wyslaniu-cv', 'jak-przygotowac-sie-do-rozmowy-kwalifikacyjnej', 'pytania-na-rozmowie-kwalifikacyjnej-metoda-star', 'list-motywacyjny-bez-doswiadczenia']],
  ['Praca w Polsce i za granicą', ['cv-do-pracy-w-polsce', 'cv-do-pracy-w-niemczech']],
];
const topicOf = (slug) => ART_TOPICS.find(([, l]) => l.includes(slug));
// „Powiązane” na końcu poradnika: 3–5 linków – 2 poradniki z tego samego tematu, do 2 zawodów i wzór CV.
// Dodatkowe linki na początku „Powiązane” (strony spoza poradnika i nowe artykuły klastra ATS).
const LETTER_LINK = ['/narzedzia/list-motywacyjny-pod-ogloszenie', 'List motywacyjny pod konkretne ogłoszenie: przykład'];
const EXTRA_LINKS = {
  'jak-napisac-list-motywacyjny': [LETTER_LINK],
  'jak-przejsc-przez-ats': ['ats-mity-i-fakty', 'format-cv-pod-ats', 'slowa-kluczowe-ats-wedlug-zawodu'].map((s) => [`/poradnik/${s}`, ARTICLES.find((x) => x.slug === s)?.title]).filter(([, t]) => t),
};
export function relatedFor(a) {
  const out = [...(EXTRA_LINKS[a.slug] || []), ...relatedBase(a)];
  return out.filter(([h], i) => out.findIndex(([x]) => x === h) === i).slice(0, 5);
}
function relatedBase(a) {
  const t = topicOf(a.slug), same = (t ? t[1] : []).filter((x) => x !== a.slug).map((x) => ARTICLES.find((y) => y.slug === x)).filter(Boolean);
  const arts = (same.length >= 2 ? same : [...same, ...ARTICLES.filter((x) => x.slug !== a.slug && !same.includes(x))]).slice(0, 2);
  const profs = a.related.map((x) => PROFESSIONS.find((p) => p.slug === x)).filter(Boolean).slice(0, 2), tpl = a.related.map(templateFor).find(Boolean);
  return [...arts.map((x) => [`/poradnik/${x.slug}`, x.title]), ...profs.map((p) => [`/cv/${p.slug}`, `CV: ${p.name}`]), tpl ? [`/wzor-cv/${tpl.slug}`, `Wzór CV ${tpl.nameIn}`] : ['/wzor-cv', 'Darmowe wzory CV']];
}
const hubHtmlPoradnik = () => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Poradnik</span></nav>
<h1>Poradnik: jak napisać CV, list motywacyjny i przygotować się do rozmowy</h1><p class="lead">Praktyczne artykuły o pisaniu CV pod konkretne ogłoszenie, o systemach ATS, sytuacjach szczególnych (przerwa w pracy, zmiana branży, pierwsze CV) i o rozmowie kwalifikacyjnej.</p>
${ART_TOPICS.map(([t, l]) => `<h2>${esc(t)}</h2><ul class="hub-list">${l.map((x) => ARTICLES.find((y) => y.slug === x)).filter(Boolean).map((x) => `<li><a href="/poradnik/${x.slug}">${esc(x.title)}</a><span>${esc(x.lead.split(/(?<=\.)\s/)[0])}</span></li>`).join('')}</ul>`).join('')}
<h2>Zakresy obowiązków</h2><p>Typowe obowiązki, wymagania niezbędne i mile widziane oraz wskazówki do CV dla wybranych zawodów.</p><div class="more"><a href="/zawod/zakres-obowiazkow">Zakresy obowiązków i wymagania dla wybranych zawodów</a></div>
<h2>Pytania czytelników</h2><ul class="hub-list">${QA_SEED.slice(0, 3).map((x) => `<li><a href="/${QA_PATH}">${esc(x.q)}</a></li>`).join('')}</ul><p><a href="/${QA_PATH}">Wszystkie pytania czytelników</a> · Masz własne? <a href="/kontakt">Napisz</a>, odpowiemy w poradniku.</p>
<h2>Wzory i narzędzia</h2><div class="more"><a href="/wzor-cv">Darmowe wzory CV</a><a href="/list-motywacyjny">Wzory listów motywacyjnych</a><a href="/narzedzia/skaner-cv">Darmowy skaner CV</a><a href="/narzedzia/sprawdz-cv">Sprawdź CV bez ogłoszenia</a><a href="/narzedzia/test-cv-ats">Test CV pod ATS</a><a href="/kreator-cv">Kreator CV pod ogłoszenie</a><a href="/cv-pod-ogloszenie-z">CV pod ogłoszenie z portali pracy</a><a href="/poradnik/jedno-cv-dwa-ogloszenia">Jedno CV, dwa ogłoszenia: przykład</a><a href="/narzedzia/list-motywacyjny-pod-ogloszenie">List motywacyjny pod ogłoszenie</a><a href="/#zawody">CV dla zawodów</a></div>
${ctaHtml('/')}</div>`;
// Adresy własnej domeny w treści poradnika (np. „cvpodogloszenie.pl/narzedzia/skaner-cv”) jako klikalne linki względne.
// Działa na tekście już po esc(), więc „&” w adresie to „&amp;”; kropka lub nawias za adresem nie wchodzą do linku. Inne domeny bez zmian.
export const autoLink = (h) => h.replace(/\bcvpodogloszenie\.pl(\/(?:[\w\-\/?=%]|&amp;)*[\w\/=])?/g, (m, path) => `<a href="${path || '/'}">${m}</a>`);
function artHtml(a) {
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/poradnik">Poradnik</a> › <span>${esc(a.title)}</span></nav>
<h1>${esc(a.title)}</h1>${byline(`poradnik/${a.slug}`)}<p class="meta">${a.readMinutes} min czytania</p><p class="lead">${esc(a.lead)}</p>
${a.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((t) => `<p>${autoLink(esc(t))}</p>`).join('')}`).join('')}
${widgetHtml(a)}${tplHtml(a)}${faqHtml(a.faq)}${ctaHtml('/')}${sourcesHtml(a.sources)}${affHtml(a.related || [], `poradnik/${a.slug}`, { article: a.slug })}
${ABROAD_FOR_ARTICLE[a.slug] ? `<h2>CV do pracy za granicą</h2><div class="more">${ABROAD_FOR_ARTICLE[a.slug].map((s) => `<a href="/${s}">${esc(ABROAD_BY[s].title.split(':')[0])}</a>`).join('')}</div>` : ''}
<h2>Powiązane</h2><div class="more">${relatedFor(a).map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join('')}</div></div>`;
}
// Tłumaczenia artykułów: /<język>/<segment>/<slugLang>, powiązane z polską wersją i ze sobą przez hreflang.
// seoTitle: krótszy polski tytuł nie przechodzi do tłumaczenia (tłumaczenie ma własny albo pełny tytuł).
const BY_LANG = Object.fromEntries(Object.entries(ART_LANGS).map(([l, { data }]) => [l, Object.fromEntries(Object.entries(data).map(([pl, d]) => [d.slugLang, withExt(l, `article:${pl}`, { ...ARTICLES.find((a) => a.slug === pl), seoTitle: undefined, ...d })]))]));
const langUrl = (l, slugLang) => `${l}/${ART_LANGS[l].seg}/${slugLang}`;
const artAlternates = (base, pl) => [`<link rel="alternate" hreflang="pl" href="${base}/poradnik/${pl}">`,
  ...Object.entries(ART_LANGS).filter(([, { data }]) => data[pl]).map(([l, { data }]) => `<link rel="alternate" hreflang="${l}" href="${base}/${langUrl(l, data[pl].slugLang)}">`),
  `<link rel="alternate" hreflang="x-default" href="${base}/poradnik/${pl}">`].join('');
// Wersje językowe narzędzi: /<język>/<segment>/<slugLang> (lib/tools-i18n.js), hreflang do polskiej wersji i do siebie nawzajem.
const toolAlternates = (base, pl) => [`<link rel="alternate" hreflang="pl" href="${base}/narzedzia/${pl}">`,
  ...Object.keys(TOOL_LANGS).filter((l) => TOOL_LANGS[l].data[pl]).map((l) => `<link rel="alternate" hreflang="${l}" href="${base}/${toolUrl(l, pl)}">`),
  `<link rel="alternate" hreflang="x-default" href="${base}/narzedzia/${pl}">`].join('');
// Narzędzia sprawdzające CV linkują do kreatora i case study (klaster „CV pod ogłoszenie”).
const SEE_CV = '<h2>Zobacz też</h2><div class="more"><a href="/kreator-cv">Kreator CV online pod ogłoszenie</a><a href="/poradnik/jedno-cv-dwa-ogloszenia">Jedno CV, dwa ogłoszenia: przykład</a><a href="/narzedzia/skaner-cv">Skaner CV z ogłoszeniem</a></div>';
const TOOL_SEE = { 'sprawdz-cv': SEE_CV, 'test-cv-ats': SEE_CV };
const toolAbout = (t, tr = (x) => x) => (t.about || []).map((x) => `<p>${esc(x)}</p>`).join('') + secHtml(t.sections) + (t.faq?.length ? `<h2>${esc(tr('Pytania'))}</h2>${t.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : '');
function toolHtmlLang(pl, l) {
  const d = dictOf(l), t = (s) => d[s] || s, x = withExt(l, `tool:${pl}`, TOOL_LANGS[l].data[pl]);
  return `<div class="inner narrow" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <span>${esc(t('Darmowe narzędzia'))}</span></nav><h1>${esc(x.title)}</h1><p class="lead">${esc(x.lead)}</p>${toolAbout(x, t)}${x.sources ? scanLink(l, t) + srcHtml(x.sources, t) : ''}<h2>${esc(t('Inne darmowe narzędzia'))}</h2><div class="more">${Object.keys(TOOLS).filter((k) => k !== pl && TOOL_LANGS[l].data[k]).map((k) => `<a href="/${toolUrl(l, k)}">${esc(TOOL_LANGS[l].data[k].title)}</a>`).join('')}</div></div>`;
}
// Tabela w sekcji artykułu (np. „Foto, Unterschrift…” w /de/ratgeber/ats-lebenslauf): { head: [...], rows: [[...]] }.
const tableHtml = (t) => (t?.rows?.length ? `<div class="cmp-wrap"><table class="cmp"><thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((r) => `<tr><th>${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '');
function artHtmlLang(a, l) {
  const d = dictOf(l), t = (s) => d[s] || s, list = Object.values(BY_LANG[l]);
  return `<div class="inner narrow article" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <a href="/${l}#poradnik">${esc(t('Poradnik'))}</a> › <span>${esc(a.title)}</span></nav>
<h1>${esc(a.title)}</h1>${byline(langUrl(l, a.slugLang), t)}<p class="meta">${esc((d['{0} min czytania'] || '{0} min czytania').replace('{0}', a.readMinutes))}</p><p class="lead">${esc(a.lead)}</p>
${a.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((x) => `<p>${esc(x)}</p>`).join('')}${tableHtml(s.table)}`).join('')}
${widgetHtml(a, l)}${tplHtml(a, t, l)}${faqHtml(a.faq, t)}${a.sources ? scanLink(l, t) : ''}${ctaHtml('/' + l, t)}${srcHtml(a.sources, t)}
${a.related?.length ? `<h2>${esc(t('CV dla zawodów'))}</h2><div class="more">${a.related.map((x) => `<a href="/${profUrl(l, x)}">${esc(PROF_LANGS[l].prof[x].name)}</a>`).join('')}</div>` : ''}
<h2>${esc(t('Przeczytaj też'))}</h2><div class="more">${relatedArts(list, a).map((x) => `<a href="/${langUrl(l, x.slugLang)}">${esc(x.title)}</a>`).join('')}</div></div>`;
}

// --- Dane strukturalne (schema.org, JSON-LD): wyniki rozszerzone w Google (FAQ, okruszki, artykuły, cennik) ---
const NAME = 'CV Pod Ogłoszenie';
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const strip = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const faqLd = (qa) => (qa.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) } : null);
const faqFromHtml = (h) => [...String(h).matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({ q: strip(m[1]), a: strip(m[2]) }));
const HOME_NAME = { pl: 'Strona główna', en: 'Home', uk: 'Головна', de: 'Startseite' };
const crumbsLd = (base, trail, l = 'pl') => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [[HOME_NAME[l], l === 'pl' ? '' : l], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) });
const articleLd = (base, a, path, l) => ({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.metaDescription, inLanguage: l, dateModified: dateOf(path) || UPDATED, mainEntityOfPage: `${base}/${path}`, image: `${base}/og.png`, author: authorLd(base), publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: `${base}/logo.svg` } } });
// Google ucina tytuł po ok. 60 znakach i opis po ok. 155: nazwę serwisu dopisujemy tylko, gdy się mieści
// (Google i tak pokazuje ją nad wynikiem), a za długi opis skracamy na granicy zdania lub słowa.
const SUFFIX = ' | CV Pod Ogłoszenie';
// Za długi tytuł (np. artykuł z podtytułem) skracamy do części przed ostatnim „: ” albo „ – ”, która się mieści.
function fitTitle(t) {
  t = String(t || '');
  if (t.length > 60) { const cut = [...t.matchAll(/: | – /g)].map((m) => m.index).filter((i) => i >= 10 && i <= 60).pop(); if (cut) t = t.slice(0, cut); }
  return t.length + SUFFIX.length <= 60 ? t + SUFFIX : t;
}
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
// Organizacja na wszystkich stronach: bez danych właściciela (pełne dane – nazwa prawna, adres, NIP – tylko w contactLd na /kontakt).
const orgLd = (base) => ({ '@context': 'https://schema.org', '@type': 'Organization', '@id': `${base}/#organizacja`, name: NAME, url: `${base}/`, logo: `${base}/logo.svg`, email: contactEmail(), sameAs: sameAs() });
const pkgPrices = () => Object.keys(PACKAGES).map((k) => PRICES[k]);
function homeLd(base, l = 'pl') {
  const faq = /<section class="sec" id="faq">([\s\S]*?)<\/section>/.exec(index())?.[1] || '';
  return [
    orgLd(base),
    { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: `${base}/`, inLanguage: ['pl', 'en', 'uk', 'de'] },
    // Bez AggregateRating/Review, dopóki na stronie nie ma prawdziwych, widocznych opinii (wytyczne Google o danych strukturalnych).
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: NAME, url: `${base}/`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
      offers: { '@type': 'AggregateOffer', lowPrice: Math.min(...pkgPrices()) / 100, highPrice: Math.max(...pkgPrices()) / 100, priceCurrency: 'PLN', offerCount: pkgPrices().length } },
    { '@context': 'https://schema.org', '@type': 'Service', name: 'CV i list motywacyjny pod konkretne ogłoszenie', serviceType: 'Pisanie CV i listów motywacyjnych', provider: { '@type': 'Organization', name: NAME, url: `${base}/` }, areaServed: 'PL',
      offers: Object.entries(PACKAGES).map(([k, p]) => ({ '@type': 'Offer', name: p.name, price: (PRICES[k] / 100).toFixed(2), priceCurrency: 'PLN', url: `${base}/#cennik` })) },
    faqLd(faqFromHtml(faq)),
  ].filter(Boolean).slice(0, l === 'pl' ? 5 : 3); // wersje EN / UA / DE: bez polskich tekstów usługi i FAQ
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
// EN i DE: dla 20 zawodów własny wstęp, tytuł i opis, sekcja o uprawnieniach za granicą i przykładowe zdania
// (lib/prof-en-plus.js, lib/prof-de-plus.js); źródła razem ze źródłami rozszerzeń. Nagłówki sekcji w języku strony.
const PLUS = { en: PROF_EN_PLUS, de: PROF_DE_PLUS };
const PLUS_H = {
  en: { abroad: (n) => `${n} jobs in the UK and Ireland: what to check`, lines: (n) => `CV lines you can adapt: ${n}` },
  de: { abroad: (n) => `${n}: worauf Sie in Deutschland, Österreich und der Schweiz achten sollten`, lines: (n) => `Formulierungen für Ihren Lebenslauf: ${n}` },
};
const withPlus = (l, pl, o) => { const x = PLUS[l]?.[pl]; if (!o || !x) return o; const src = [...(o.sources || []), ...x.sources].filter((s, i, a) => a.findIndex((y) => y.u === s.u) === i); return { ...o, plus: x, sources: src }; };
const profIn = (l, pl) => { const p = PROFESSIONS.find((x) => x.slug === pl), t = PROF_LANGS[l].prof[pl]; return p && t ? withPlus(l, pl, withExt(l, `prof:${pl}`, { ...p, sections: [], ...t, kwPl: p.keywords, lang: l })) : null; };
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
  const d = dictOf(l), t = (s) => d[s] || s, scan = '/' + toolUrl(l, 'skaner-cv');
  return `<div class="inner" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <a href="/${l}#zawody">${esc(t('CV dla zawodów'))}</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.title)}</h1>${byline(profUrl(l, p.slug), t)}<p class="lead">${esc(p.plus?.lead || p.intro)}</p>
${pasteAd(scan, t)}
${kwHtml(p, t, l, profUrl(l, p.slug), (i) => ` <small>${esc(p.kwPl[i] || '')}</small>`)}
<h2>${esc(t('Wskazówki do CV'))}</h2><ol class="tips">${p.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
${p.plus ? `<h2>${esc(PLUS_H[l].abroad(p.name))}</h2><ul>${p.plus.uk.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h2>${esc(PLUS_H[l].lines(p.name))}</h2><ul>${p.plus.lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${secHtml(p.sections)}<h2>${esc(t('Przykładowe CV'))}</h2><p><b>${esc(p.sample.name)}</b>, ${esc(p.sample.headline)}. ${esc(p.sample.summary)}</p>
${p.sample.jobs.map((j) => `<h3>${esc(j.title)}, ${esc(j.company)} (${esc(j.period)})</h3><ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
${twoAdsHtml(p, t)}${scanCta(scan, `/${l}`, p.slug, t)}
<h2>${esc(t('Pytania'))}</h2>${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
${p.sources ? scanLink(l, t) + srcHtml(p.sources, t) : ''}${(() => { const arts = articlesFor(p.slug).map((a) => [a, ART_LANGS[l].data[a.slug]]).filter(([, x]) => x); return arts.length ? `<h2>${esc(t('Poradniki dla tego zawodu'))}</h2><div class="more">${arts.map(([, x]) => `<a href="/${langUrl(l, x.slugLang)}">${esc(x.title)}</a>`).join('')}</div>` : ''; })()}
<h2>${esc(t('Podobne zawody'))}</h2><div class="more">${PROFESSIONS.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 10).map((x) => `<a href="/${profUrl(l, x.slug)}">${esc(PROF_LANGS[l].prof[x.slug].name)}</a>`).join('')}</div>
${profCta(`/${l}`, p.slug, t)}</div>`;
}
function cityHtmlLang(p, c, l) {
  const d = dictOf(l), t = (s) => d[s] || s, T = PAGE_T[l], f = (s) => esc(fillT(s, p, c));
  return `<div class="inner" lang="${l}"><nav class="crumbs"><a href="/${l}">${esc(t('Strona główna'))}</a> › <a href="/${profUrl(l, p.slug)}">${esc(p.name)}</a> › <span>${esc(c.name)}</span></nav>
<h1>${f(T.title)}</h1><p class="lead">${esc(c.intro)}</p>
<h2>${f(T.seek)}</h2><p>${esc(p.intro)}</p>
<h2>${esc(t('Oferty pracy'))}: ${esc(p.name)} – ${esc(c.name)}</h2>${jobLinksHtml(p, c, t)}
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
  const url = `${base}/${route}`, ctr = CTR_SEO[route];
  if (ctr) item = { ...item, ...(ctr.title ? { seoTitle: ctr.title } : {}), metaDescription: ctr.desc };
  let out = langLinks(tpLocale(head(index(), base, url, opts.alternates || ''), opts.lang), opts.lang)
    .replace(/<title>.*?<\/title>/, `<title>${esc(fitTitle(item.seoTitle || item.title))}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(fitDesc(item.metaDescription))}">${opts.notFound || opts.noindex ? '<meta name="robots" content="noindex">' : `${opts.robots ? `<meta name="robots" content="${esc(opts.robots)}">` : ''}<link rel="canonical" href="${esc(opts.canonical || url)}">`}`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(item.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(item.metaDescription)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(item.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(item.metaDescription)}">`)
    .replace('</head>', `${(opts.data || []).filter(Boolean).map(ld).join('')}</head>`)
    .replace('<main id="landing">', '<main id="landing" hidden>')
    // Ukryta strona główna zostaje w kodzie podstrony (powrót do sekcji bez przeładowania), ale bez drugiego <h1>.
    .replace(/(<section class="hero"[\s\S]*?)<h1>([\s\S]*?)<\/h1>/, (_m, a, t) => `${a}<p class="h1">${t}</p>`)
    .replace('<section class="page" id="page" role="main" hidden></section>', () => `<section class="page" id="page" role="main"${opts.ssrOnly ? ' data-ssr="1"' : ''}>${html}</section>`)
    .replace(/<script src="\/app\.js[^"]*" defer><\/script>/, (m) => `<script>window.__ROUTE=${JSON.stringify(opts.ssrOnly ? (opts.route || '') : opts.route || route)}${opts.notFound ? ';window.__NOTFOUND=1' : ''}${opts.ssrOnly ? `;window.__SSRPATH=${JSON.stringify('/' + route)}` : ''}</script>${m}${opts.script ? `<script src="${opts.script}" defer></script>` : ''}`);
  // opts.ogImage: własny obrazek podglądu (PNG 1200×630), np. karta wyniku skanera.
  if (opts.ogImage) out = out.replace(`<meta property="og:image" content="${base}/og.png">`, () => `<meta property="og:image" content="${esc(opts.ogImage)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(item.title)}"><meta name="twitter:image" content="${esc(opts.ogImage)}">`);
  if (opts.lang && opts.lang !== 'pl') out = stripPl(out);
  if (opts.lang && opts.lang !== 'pl') out = out.replace('<html lang="pl">', `<html lang="${opts.lang}">`).replace(/<script src="\/i18n\.js[^"]*"><\/script>/, (m) => `${langBoot(opts.lang)}${m}`);
  if (!opts.full && !opts.notFound) out = lite(out, opts);
  res.type('html').send(out);
}
// Linki i sekcje tylko po polsku (data-pl: wzory CV, pracodawcy, targi, karnety…) znikają z wersji EN/UK/DE.
export const stripPl = (h) => h.replace(/<div data-pl-block>[\s\S]*?<!--\/pl-only--><\/div>\s*/g, '').replace(/<section[^>]*\sdata-pl[\s>][\s\S]*?<\/section>\s*/g, '').replace(/<div data-pl>[\s\S]*?<\/div>/g, '').replace(/<a class="tool-card"[^>]*\sdata-pl[\s>][\s\S]*?<\/a>\s*/g, '').replace(/<a\b[^>]*\sdata-pl[\s>][^<]*<\/a>/g, '');
// Lekka podstrona: nagłówek, treść i stopka bez ukrytej strony głównej, kreatora, wyniku i szablonów innych podstron.
// Wtedy treść strony stanowi większość tekstu w HTML (różne strony nie wyglądają dla wyszukiwarki jak duplikaty).
// Kreator otwiera się na stronie głównej (?zamow=1), obsługę nagłówka i formularza „Dla firm” robi /lite.js.
// opts.full: pełna aplikacja (narzędzia działają w przeglądarce).
function lite(out, opts) {
  const l = opts.lang && opts.lang !== 'pl' ? opts.lang : 'pl', home = l === 'pl' ? '/' : `/${l}`;
  const alt = Object.fromEntries([...String(opts.alternates || '').matchAll(/hreflang="(pl|en|uk|de)" href="https?:\/\/[^/"]+(\/[^"]*)"/g)].map((m) => [m[1], m[2]]));
  let h = out.replace(/<main id="landing"[^>]*>[\s\S]*?<\/main>/, '').replace(/<div id="demoBar"[\s\S]*?<div id="refBanner"[^>]*>[^<]*<\/div>/, '')
    .replace(/<section class="page acct" id="account"[^>]*><\/section>/, '').replace(/<template id="pg-[\s\S]*?<\/template>/g, '')
    .replace(/<!-- Kreator -->[\s\S]*?(?=<script src="\/consent\.js)/, '')
    .replace(/<script>window\.__ROUTE=[^<]*<\/script><script src="\/app\.js[^"]*" defer><\/script>/, `<script src="/lite.js?v=${ver('lite.js')}" defer></script>`)
    .replace(/href="[^"]*" data-lang="(pl|en|uk|de)"/g, (m, k) => (alt[k] ? `href="${alt[k]}" data-lang="${k}"` : m));
  // Kotwice do sekcji strony głównej (#cennik, #skaner…) prowadzą na stronę główną; kotwice z tej strony zostają.
  const ids = new Set([...h.matchAll(/\sid="([\w-]+)"/g)].map((m) => m[1]));
  return h.replace(/href="#([\w-]+)"/g, (m, id) => (ids.has(id) ? m : `href="${home}#${id}"`)).replace(/<a class="skip" href="[^"]*">/, '<a class="skip" href="#page">');
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
// Gotowy HTML strony głównej (PL/EN/UK/DE) liczony raz na proces: treść zależy tylko od plików strony.
// Klucz CSP (nonce) dopisuje server.js przy wysyłce, a wariant testu A/B (abHome) – już po wyjęciu z pamięci.
const homeHtmlCache = new Map();
const homeOnce = (k, f) => { if (!homeHtmlCache.has(k)) homeHtmlCache.set(k, f()); return homeHtmlCache.get(k); };
// Słownik języka: wersja w adresie (pamięć przeglądarki na stałe) i wczesne pobieranie (preload) zamiast czekania na skrypt.
const dictVer = (l) => ver(`i18n/${l}.json`);
const langBoot = (l) => `<link rel="preload" href="/i18n/${l}.json?v=${dictVer(l)}" as="fetch" crossorigin><script>window.__LANG=${JSON.stringify(l)};window.__I18N_V=${JSON.stringify(dictVer(l))}</script>`;
function langHome(res, base, l) {
  res.type('html').send(homeOnce(l, () => langHomeHtml(base, l)));
}
function langHomeHtml(base, l) {
  const d = dictOf(l), t = (s) => d[s] || s;
  // Kafelki narzędzi i linki w stopce prowadzą do wersji w tym języku.
  const toolLinks = (h) => langLinks(h, l);
  const title = /<title>(.*?)<\/title>/.exec(index())[1], desc = /<meta name="description" content="([^"]*)">/.exec(index())[1];
  return (toolLinks(stripPl(tpLocale(head(index(), base, `${base}/${l}`), l)))
    .replace('<html lang="pl">', `<html lang="${l}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(t(title))}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(t(desc))}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(t(title))}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(t(desc))}">`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(t(title))}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(fitDesc(t(desc)))}"><link rel="canonical" href="${base}/${l}">`)
    .replace('</head>', `${homeLd(base, l).map(ld).join('')}</head>`)
    .replace(/<script src="\/i18n\.js[^"]*"><\/script>/, (m) => `${langBoot(l)}${m}`));
}

// --- O serwisie i /llms.txt (opis serwisu dla wyszukiwarek AI): same fakty, ceny zawsze z lib/pricing.js ---
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const PRICE_LIST = () => [...Object.entries(PACKAGES).map(([k, p]) => [p.name, PRICES[k], p.ads === 1 ? 'pod 1 ogłoszenie' : `do ${p.ads} ogłoszeń w tym samym zawodzie`]),
  ...Object.entries(ADDONS).map(([k, n]) => [n, PRICES[k], 'dodatek do zamówienia']), ['Każda dodatkowa wersja językowa dokumentów', PRICES.extraLang, 'dodatek do zamówienia'],
  ['Kolejne CV pod nowe ogłoszenie', PRICES.cv_next, `dla klientów, na stronie dokumentów przez 30 dni od opłacenia zamówienia; z listem motywacyjnym ${(PRICES.cv_next + PRICES.cv_letter - PRICES.cv) / 100} zł; bez kodów rabatowych`]];
const DOC_LANGS = Object.values(LANGS).join(', ');
const b2bNote = () => `paczki od ${B2B_TIERS[0].min} kodów, rabat ${B2B_TIERS.map((t) => `${t.pct}%`).join(' / ')} od ${B2B_TIERS.map((t) => t.min).join(' / ')} kodów`;
const ABOUT = { title: 'O serwisie CV Pod Ogłoszenie', seoTitle: 'O serwisie: kto prowadzi CV Pod Ogłoszenie', metaDescription: 'Kto prowadzi CV Pod Ogłoszenie, jak powstaje CV i list motywacyjny pod konkretne ogłoszenie, ile to kosztuje, w jakich językach działa serwis i co dzieje się z danymi.' };
function aboutHtml() {
  const mail = esc(contactEmail());
  return `<div class="inner narrow legal"><nav class="crumbs"><a href="/">Strona główna</a> › <span>O serwisie</span></nav>
<h1>${esc(ABOUT.title)}</h1><p class="lead">CV Pod Ogłoszenie (cvpodogloszenie.pl) to serwis internetowy, w którym zamawiasz CV i list motywacyjny dopasowane do konkretnego ogłoszenia o pracę. Dokumenty powstają z pomocą narzędzi AI, na podstawie danych, które podajesz, i treści ogłoszenia.</p>
<h2>Kto prowadzi serwis</h2><p>Serwis prowadzi jednoosobowa działalność gospodarcza z siedzibą w Polsce. Pełne dane firmy: <a href="/kontakt">Kontakt</a>.</p>
<h2>Jak to działa</h2><ol><li>Wklejasz link do ogłoszenia albo jego treść (tekst odczytamy też ze zrzutu ekranu).</li><li>W kreatorze podajesz swoje doświadczenie, wykształcenie i umiejętności albo wgrywasz stare CV, z którego kreator się wypełni.</li><li>Z ogłoszenia wyciągamy wymagania i słowa kluczowe i łączymy je z Twoimi danymi. Niczego nie dopisujemy od siebie: czego nie robiłeś, tego nie ma w CV.</li><li>Po opłaceniu zamówienia dostajesz CV (i list, jeśli go wybrałeś) w PDF na e-mail, z raportem dopasowania: które wymagania z ogłoszenia spełniasz i gdzie są w CV, a których brakuje.</li><li>Możesz poprawić tekst w edytorze albo poprosić o darmową poprawkę.</li></ol>
<p>Nie obiecujemy zatrudnienia ani zaproszenia na rozmowę: decyzję zawsze podejmuje pracodawca.</p>
<h2>Ceny</h2><ul>${PRICE_LIST().map(([n, p, d]) => `<li>${esc(n)}: <b>${zl(p)}</b> (${esc(d)})</li>`).join('')}</ul>
<p>Płatności obsługują Stripe (BLIK, karta, Apple Pay, Google Pay) i Przelewy24 (PayPro S.A.) – gdy dostępne są obie bramki, wybierasz jedną przed płatnością.</p>
<p>Płatność jednorazowa, bez abonamentu. Dla firm i instytucji: ${esc(b2bNote())}, szczegóły na stronie <a href="/dla-firm">Dla firm i uczelni</a>. Pełne zasady w <a href="/regulamin">regulaminie</a>.</p>
<h2>Języki</h2><p>Interfejs serwisu działa po polsku, angielsku, ukraińsku i niemiecku (<a href="/">PL</a>, <a href="/en">EN</a>, <a href="/uk">UK</a>, <a href="/de">DE</a>). Dokumenty przygotujemy w jednym z języków: ${esc(DOC_LANGS)}; każda kolejna wersja językowa to ${zl(PRICES.extraLang)}.</p>
<h2>Twoje dane</h2><ul><li>Dane z zamówienia i gotowe dokumenty usuwamy automatycznie po 30 dniach od złożenia zamówienia.</li><li>Do przygotowania dokumentów Twoje dane i treść ogłoszenia trafiają do dostawcy narzędzi AI (Anthropic); zdjęcie do CV tam nie trafia.</li><li>Płatności obsługuje ${p24Enabled() ? 'Stripe i Przelewy24' : 'Stripe'}; danych karty ani logowania do banku nie widzimy.</li><li>Darmowy skaner CV nie zapisuje tekstu CV ani ogłoszenia.</li></ul>
<p>Szczegóły, podstawy prawne i Twoje prawa: <a href="/polityka-prywatnosci">Polityka prywatności</a>.</p>
<h2>Autor i zasady redakcyjne</h2><p>Poradniki, strony zawodów, wzory i opisy pracodawców przygotowuje redakcja serwisu. Jak powstają i są aktualizowane: <a href="/zasady-redakcyjne">zasady redakcyjne</a>.</p>
<h2>Kontakt</h2><p>Napisz na <a href="mailto:${mail}">${mail}</a>. Darmowe narzędzia: <a href="/narzedzia/skaner-cv">skaner CV</a>, <a href="/narzedzia/jaki-zawod-dla-mnie">i inne</a>.</p></div>`;
}
// --- Kontakt: pełne dane firmy (nazwa, NIP, REGON, adres, telefon, e-mail) – wymagane m.in. przez operatora płatności ---
const CONTACT = { title: 'Kontakt', seoTitle: 'Kontakt: dane firmy, telefon, e-mail', metaDescription: 'Kontakt z CV Pod Ogłoszenie: Jakub Leśniak, Winiary 2, 66-010 Nowogród Bobrzański, NIP 9731085406. Telefon, e-mail i formularz kontaktowy.' };
const telHref = (t) => `tel:${String(t).replace(/[^\d+]/g, '')}`;
// Poza /kontakt: sam e-mail i link do pełnych danych (dane właściciela tylko na /kontakt – prośba z 27.10).
export const contactShortHtml = () => { const mail = esc(contactEmail()); return `<p class="firm-short">E-mail: <a href="mailto:${mail}">${mail}</a><br><a href="/kontakt">Dane firmy i kontakt</a></p>`; };
export function contactDataHtml() {
  const s = seller(), mail = esc(contactEmail());
  return `<dl class="firm"><div><dt>Firma</dt><dd>${esc(s.name)} – jednoosobowa działalność gospodarcza, właściciel serwisu „${esc(s.brand)}”</dd></div>
<div><dt>Adres</dt><dd>${esc(s.address)}, Polska</dd></div>
<div><dt>NIP</dt><dd>${esc(s.nip)}</dd></div><div><dt>REGON</dt><dd>${esc(s.regon)}</dd></div>
<div><dt>Telefon</dt><dd><a href="${telHref(s.phone)}">${esc(s.phone)}</a></dd></div>
<div><dt>E-mail</dt><dd><a href="mailto:${mail}">${mail}</a></dd></div></dl>`;
}
const contactHtml = () => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Kontakt</span></nav>
<h1>Kontakt</h1><p class="lead">Masz pytanie o zamówienie, płatność albo współpracę? Napisz albo zadzwoń – odpowiadamy zwykle w ciągu jednego dnia roboczego.</p>
<h2 id="dane-firmy">Dane firmy</h2>${contactDataHtml()}
<h2>Formularz kontaktowy</h2><p>Możesz też napisać przez <a href="/#kontakt">formularz kontaktowy</a> na stronie głównej. Reklamacje i odstąpienie od umowy: zasady w <a href="/regulamin">regulaminie</a>. Dane osobowe: <a href="/polityka-prywatnosci">polityka prywatności</a>.</p></div>`;
const contactLd = (base) => { const s = seller(); return { '@context': 'https://schema.org', '@type': 'ContactPage', name: 'Kontakt', url: `${base}/kontakt`, about: { '@id': `${base}/#organizacja` }, mainEntity: { '@type': 'Organization', name: NAME, legalName: s.name, taxID: s.nip, telephone: s.phone, email: contactEmail(), address: postal(s.address) } }; };

// --- Zasady redakcyjne (E-E-A-T): tylko fakty, które są też na /o-serwisie ---
const EDITORIAL = { title: 'Zasady redakcyjne', seoTitle: 'Zasady redakcyjne: jak tworzymy poradniki i wzory CV', metaDescription: 'Jak powstają i są aktualizowane poradniki, strony zawodów, wzory CV i opisy pracodawców w CV Pod Ogłoszenie: źródła, rola AI, daty aktualizacji i zgłaszanie błędów.' };
function editorialHtml() {
  const mail = esc(contactEmail());
  return `<div class="inner narrow legal"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/o-serwisie">O serwisie</a> › <span>Zasady redakcyjne</span></nav>
<h1>Zasady redakcyjne</h1><p class="lead">Jak tworzymy i aktualizujemy poradniki, strony zawodów, wzory CV i listów motywacyjnych oraz opisy rekrutacji w firmach.</p>
<h2>Kto odpowiada za treści</h2><p>Za treści odpowiada redakcja serwisu CV Pod Ogłoszenie (dane firmy: <a href="/kontakt">Kontakt</a>). Podpis „Redakcja CV Pod Ogłoszenie” i data aktualizacji widnieją przy każdym poradniku, stronie zawodu, wzorze i opisie pracodawcy.</p>
<h2>Źródła</h2><ul><li>Informacje o rekrutacji w firmach pochodzą z ich publicznych stron kariery. Przy każdym opisie podajemy datę, na którą są aktualne, i link do oficjalnej strony.</li><li>Informacje zależne od przepisów (np. wypowiedzenie umowy, wynagrodzenie brutto i netto) opieramy na aktach prawnych i oficjalnych stronach urzędów.</li><li>Typowe wymagania i słowa kluczowe opisujemy na podstawie treści ogłoszeń o pracę. Nie podajemy liczb ani statystyk bez źródła.</li></ul>
<h2>Rola AI</h2><p>Treści przygotowujemy z pomocą narzędzi AI na podstawie oficjalnych źródeł (np. przepisów, stron urzędów i stron kariery pracodawców). Przed publikacją fakty są sprawdzane ze źródłami, a treść jest poprawiana po każdym zgłoszeniu błędu (<a href="mailto:${mail}">${mail}</a>). Za zawartość serwisu odpowiada redakcja serwisu.</p>
<h2>Przykłady i dane</h2><ul><li>Przykładowe CV, listy i ogłoszenia zawierają dane fikcyjne i są tak oznaczone.</li><li>Nie obiecujemy zatrudnienia ani zaproszenia na rozmowę. Procent dopasowania oznacza zgodność słów kluczowych z ogłoszeniem, a nie szansę na pracę.</li><li>Opisy firm nie oznaczają powiązań z tymi firmami ani ich rekomendacji.</li></ul>
<h2>Aktualizacje</h2><p>Przy każdej stronie podajemy datę ostatniej zmiany treści. Treści poprawiamy, gdy zmieniają się przepisy, zasady rekrutacji w firmach albo gdy dostaniemy zgłoszenie błędu.</p>
<h2>Zgłoś błąd</h2><p>Jeśli zauważysz nieaktualną informację lub błąd, napisz na <a href="mailto:${mail}">${mail}</a> i podaj adres strony. Sprawdzimy zgłoszenie i poprawimy treść.</p></div>`;
}
function llmsTxt(base) {
  const L = ['pl', 'en', 'uk', 'de'], NAMES = { pl: 'polski', en: 'English', uk: 'українська', de: 'Deutsch' }, home = (l) => `${base}/${l === 'pl' ? '' : l}`;
  const a = (t, u, d) => `- [${t}](${u})${d ? `: ${d}` : ''}`, gen = 'jak-dopasowac-cv-do-ogloszenia';
  const tool = (l, k) => (l === 'pl' ? `${base}/narzedzia/${k}` : TOOL_LANGS[l]?.data[k] && `${base}/${toolUrl(l, k)}`);
  const tTitle = (l, k) => (l === 'pl' ? TOOLS[k].title : TOOL_LANGS[l].data[k].title);
  return [`# ${NAME}`, '',
    `> Polski serwis internetowy (${base.replace(/^https?:\/\//, '')}), w którym zamawia się CV i list motywacyjny dopasowane do konkretnego ogłoszenia o pracę. Dokumenty powstają z pomocą AI na podstawie danych klienta i treści ogłoszenia. Interfejs: polski, angielski, ukraiński, niemiecki.`, '',
    `Klient wkleja ogłoszenie (link, tekst lub zrzut ekranu) i swoje dane albo stare CV. Serwis wyciąga z ogłoszenia wymagania i słowa kluczowe, łączy je z doświadczeniem klienta (bez dopisywania czegoś, czego klient nie robił) i wysyła CV w PDF z raportem dopasowania. Dokumenty w językach: ${DOC_LANGS}. Dane zamówienia są usuwane po 30 dniach. Serwis nie obiecuje zatrudnienia. Prowadzi go jednoosobowa działalność gospodarcza z siedzibą w Polsce (dane firmy: ${base}/kontakt).`, '',
    '## Ceny (PLN, płatność jednorazowa)', '', ...PRICE_LIST().map(([n, p, d]) => `- ${n}: ${zl(p)} (${d})`), `- Firmy i instytucje: ${b2bNote()}`, '',
    '## Strony główne', '', ...L.map((l) => a(`Strona główna (${NAMES[l]})`, home(l))), a('O serwisie', `${base}/o-serwisie`, 'kto prowadzi serwis, jak działa, ceny, dane'), a('Kontakt i dane firmy', `${base}/kontakt`), a('Zasady redakcyjne', `${base}/zasady-redakcyjne`, 'źródła, rola AI, daty aktualizacji, zgłaszanie błędów'), '',
    '## CV dla zawodów', '', ...L.map((l) => a(`Indeks zawodów (${NAMES[l]})`, `${home(l)}#zawody`)), ...L.map((l) => a(`Przykład: ${l === 'pl' ? 'magazynier' : PROF_LANGS[l].prof.magazynier.name} (${NAMES[l]})`, l === 'pl' ? `${base}/cv/magazynier` : `${base}/${profUrl(l, 'magazynier')}`)), '',
    '## Poradnik', '', ...L.map((l) => a(`Poradnik (${NAMES[l]})`, `${home(l)}#poradnik`)), ...L.map((l) => (l === 'pl' ? a(ARTICLES.find((x) => x.slug === gen).title, `${base}/poradnik/${gen}`) : ART_LANGS[l].data[gen] && a(ART_LANGS[l].data[gen].title, `${base}/${langUrl(l, ART_LANGS[l].data[gen].slugLang)}`))).filter(Boolean), '',
    '## Darmowe narzędzia', '', ...L.map((l) => tool(l, 'skaner-cv') && a(`${tTitle(l, 'skaner-cv')} (${NAMES[l]})`, tool(l, 'skaner-cv'), l === 'pl' ? 'ocena dopasowania CV do ogłoszenia' : '')).filter(Boolean),
    ...Object.keys(TOOLS).filter((k) => k !== 'skaner-cv').map((k) => a(`${tTitle('pl', k)} (${NAMES.pl})`, tool('pl', k))), '',
    '## Dla firm i instytucji (po polsku)', '', a('Dla firm i uczelni', `${base}/dla-firm`), a('Zamówienie kodów dla instytucji', `${base}/dla-instytucji/zamow`), a('Dla doradców zawodowych', `${base}/dla-doradcow`, 'scenariusz zajęć i darmowy kod'), '',
    '## Dokumenty prawne', '', ...L.flatMap((l) => ['prywatnosc', 'regulamin'].map((n) => a(`${LEGAL_PAGES[n][l].title} (${NAMES[l]})`, `${base}/${legalPath(n, l)}`))), '',
    '## Kontakt', '', `- E-mail: ${contactEmail()}`, '',
    '## Optional', '', ...L.filter((l) => l !== 'pl').flatMap((l) => Object.keys(TOOLS).filter((k) => k !== 'skaner-cv' && tool(l, k)).map((k) => a(`${tTitle(l, k)} (${NAMES[l]})`, tool(l, k)))), ''].join('\n');
}

// „Zakres obowiązków <zawodu>”: obowiązki, wymagania, słowa z ogłoszeń; linki do CV pod ogłoszenie i do oferty dla firm.
function dutiesHtml(p, d) {
  const li = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/cv/${p.slug}">${esc(p.name)}</a> › <span>Zakres obowiązków</span></nav>
<h1>Zakres obowiązków ${esc(d.nazwaD)}</h1><p class="lead">${esc(d.intro)}</p>
<h2>Typowe obowiązki</h2>${li(d.obowiazki)}
<h2>Wymagania z ogłoszeń</h2><h3>Najczęściej niezbędne</h3>${li(d.wymagania.niezbedne)}<h3>Mile widziane</h3>${li(d.wymagania.mile_widziane)}
<h2>Słowa kluczowe z ogłoszeń</h2><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
<h2>Warunki pracy</h2>${li(d.warunki)}
<h2>Jak pokazać te obowiązki w CV</h2>${li(d.jak_w_cv)}
<p class="prof-cta"><a class="btn ghost" href="/narzedzia/skaner-cv">Sprawdź CV za darmo</a> <a class="btn" href="/?zamow=1&amp;zawod=${p.slug}">Zrób CV pod ogłoszenie – od ${priceZl(PRICES.cv)}</a></p>
<p><a href="/cv/${p.slug}">${esc(p.title)}</a></p>
<h2>Dla pracodawców</h2><p>${esc(d.dla_firm)}</p><p><a href="/dla-firm">Oferta dla firm i uczelni</a></p></div>`;
}

export function seoRoutes(app, base) {
  // Strona główna: kanoniczny adres i dane strukturalne (firma, cennik, FAQ).
  // Testy A/B (lib/ab.js, EXPERIMENTS): wariant wstawiany na serwerze; wtedy strona nie może leżeć we wspólnej pamięci podręcznej.
  app.get(['/', '/index.html'], (req, res) => {
    const html = homeOnce('pl', () => head(index(), base, `${base}/`)
      .replace(/<meta name="description" content="([^"]*)">/, `<meta name="description" content="$1"><link rel="canonical" href="${base}/">`)
      .replace('</head>', `${homeLd(base).map(ld).join('')}</head>`));
    // Wejście z reklamy (utm_source=google|meta, gclid, fbclid): hero „z reklamy” od razu w HTML, bez testu A/B hero.
    if (isAdHit(req.query)) return res.set('Cache-Control', 'private, no-store').type('html').send(homeOnce('pl-ad', () => withAdHero(html)));
    const ab = abHome(req, html);
    if (ab.assign) res.set('Cache-Control', 'private, no-store');
    res.type('html').send(ab.html);
  });
  app.get('/kontakt', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); page(res, base, 'kontakt', CONTACT, contactHtml(), { ssrOnly: true, data: [crumbsLd(base, [['Kontakt', 'kontakt']]), contactLd(base)] }); });
  app.get('/o-serwisie', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); page(res, base, 'o-serwisie', ABOUT, aboutHtml(), { ssrOnly: true, data: [crumbsLd(base, [['O serwisie', 'o-serwisie']]), orgLd(base), { '@context': 'https://schema.org', '@type': 'AboutPage', name: ABOUT.title, url: `${base}/o-serwisie`, inLanguage: 'pl', about: { '@id': `${base}/#organizacja` } }] }); });
  app.get(`/${OLD_AUTHOR_PATH}`, (_req, res) => res.redirect(301, '/zasady-redakcyjne')); // dawna strona autora (dane właściciela tylko na /kontakt)
  app.get('/zasady-redakcyjne', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); page(res, base, 'zasady-redakcyjne', EDITORIAL, editorialHtml(), { ssrOnly: true, data: [crumbsLd(base, [['O serwisie', 'o-serwisie'], ['Zasady redakcyjne', 'zasady-redakcyjne']])] }); });
  app.get('/llms.txt', (_req, res) => res.set('Cache-Control', 'public, max-age=3600').type('text/plain; charset=utf-8').send(llmsTxt(base)));
  app.get('/:slug', (req, res, next) => {
    const lp = LEGAL_BY_PATH[req.params.slug]; if (lp) return legalPage(res, base, lp.name, lp.lang);
    const sp = STATIC_PAGES[req.params.slug] && staticPage(req.params.slug); if (!sp) return next();
    page(res, base, req.params.slug, sp, sp.html, { data: [crumbsLd(base, [[STATIC_PAGES[req.params.slug], req.params.slug]]), faqLd(faqFromHtml(sp.html))] });
  });
  // /de/ (z ukośnikiem) trafiał tu jako język „de/” – bez słownika, czyli polski tytuł i canonical /de/. Jeden adres: 301 na /de.
  app.get(['/en', '/uk', '/de'], (req, res) => { const l = req.path.replace(/\/+$/, '').slice(1); if (req.path !== `/${l}`) return res.redirect(301, `/${l}${req.url.slice(req.path.length)}`); langHome(res, base, l); });
  app.get('/:lang/:slug', (req, res, next) => { const lp = LEGAL_BY_PATH[`${req.params.lang}/${req.params.slug}`]; if (!lp) return next(); legalPage(res, base, lp.name, lp.lang); });
  // Regulamin i polityka prywatności (4 języki) pobierane dopiero po wejściu w nie: lżejsza strona i brak tych samych tekstów na każdej podstronie.
  const legal = {};
  app.get('/legal/:name.html', (req, res, next) => {
    const n = req.params.name; if (!['regulamin', 'prywatnosc'].includes(n)) return next();
    legal[n] ??= withContact(fs.readFileSync(new URL(`../public/legal/${n}.html`, import.meta.url), 'utf8'));
    res.set({ 'Cache-Control': 'public, max-age=3600', 'X-Robots-Tag': 'noindex' }).type('html').send(gateLegal(legal[n]));
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
  app.get('/content/tools-:lang.json', (req, res, next) => { const x = TOOL_LANGS[req.params.lang]; if (!x) return next(); res.set('Cache-Control', 'public, max-age=3600').json(Object.fromEntries(Object.entries(x.data).map(([k, v]) => [k, withExt(req.params.lang, `tool:${k}`, v)]))); });
  app.get('/content/art/:slug.json', (req, res) => {
    const a = ARTICLES.find((x) => x.slug === req.params.slug); if (!a) return res.sendStatus(404);
    const tr = ART_LANGS[req.query.lang]?.data[a.slug];
    res.set('Cache-Control', 'public, max-age=3600').json(tr ? { ...a, ...tr } : a);
  });
  app.get('/content/cv/:slug.json', (req, res) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return res.sendStatus(404); const l = req.query.lang; res.set('Cache-Control', 'public, max-age=3600').json((PROF_LANGS[l] && profIn(l, p.slug)) || p); });
  // Lista stron „Zakres obowiązków” (link z /dla-firm i ze stron CV); noindex jak same strony do czasu przeglądu.
  app.get('/zawod/zakres-obowiazkow', (_req, res) => {
    if (!DUTIES_INDEX) res.set('X-Robots-Tag', 'noindex, follow');
    const list = Object.entries(DUTIES).map(([s, d]) => `<li><a href="/${dutiesPath(s)}">Zakres obowiązków ${esc(d.nazwaD)}</a></li>`).join('');
    page(res, base, 'zawod/zakres-obowiazkow', { title: 'Zakresy obowiązków i wymagania dla wybranych zawodów', metaDescription: 'Typowe obowiązki, wymagania niezbędne i mile widziane oraz słowa kluczowe z ogłoszeń dla wybranych zawodów – pomoc przy pisaniu ogłoszeń i CV.' },
      `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Zakresy obowiązków</span></nav><h1>Zakresy obowiązków i wymagania dla wybranych zawodów</h1><p class="lead">Typowe obowiązki i wymagania z ogłoszeń. Dla pracodawców – pomoc przy pisaniu ogłoszenia, dla kandydatów – lista tego, co warto pokazać w CV.</p><ul class="hub-list">${list}</ul><p><a href="/dla-firm">Oferta dla firm i uczelni</a></p></div>`,
      { ssrOnly: true, ...(DUTIES_INDEX ? {} : { robots: 'noindex,follow' }) });
  });
  app.get('/zawod/:slug/zakres-obowiazkow', (req, res, next) => {
    const p = PROFESSIONS.find((x) => x.slug === req.params.slug), d = DUTIES[req.params.slug];
    if (!p || !d) return next();
    if (!DUTIES_INDEX) res.set('X-Robots-Tag', 'noindex, follow');
    const title = `Zakres obowiązków ${d.nazwaD}`;
    page(res, base, dutiesPath(p.slug), { title, seoTitle: `Obowiązki i wymagania ${d.nazwaD}`, metaDescription: `Zakres obowiązków ${d.nazwaD}: typowe zadania, wymagania niezbędne i mile widziane, słowa kluczowe z ogłoszeń oraz wskazówki do CV.` }, dutiesHtml(p, d),
      { ssrOnly: true, ...(DUTIES_INDEX ? {} : { robots: 'noindex,follow' }), data: [crumbsLd(base, [[p.name, `cv/${p.slug}`], ['Zakres obowiązków', dutiesPath(p.slug)]])] });
  });
  app.get('/cv/:slug', (req, res, next) => { const p = PROFESSIONS.find((x) => x.slug === req.params.slug); if (!p) return next(); page(res, base, `cv/${p.slug}`, { ...p, ...profSeo(p) }, profHtml(p), { alternates: profAlternates(base, p.slug), data: [crumbsLd(base, [['CV dla zawodów', '#zawody'], [p.name, `cv/${p.slug}`]]), faqLd(p.faq), pageLd(base, `cv/${p.slug}`, p.title)] }); });
  app.get('/cv/:slug/:city', (req, res, next) => {
    const p = POPULAR.find((x) => x.slug === req.params.slug), c = CITIES.find((x) => x.slug === req.params.city);
    if (!p || !c) return next();
    page(res, base, `cv/${p.slug}/${c.slug}`, cityMeta(p, c), cityHtml(p, c), { ...cityOpts(res, base, p.slug, c.slug, `cv/${p.slug}`), data: [crumbsLd(base, [[p.name, `cv/${p.slug}`], [c.name, `cv/${p.slug}/${c.slug}`]])] });
  });
  app.get('/narzedzia/:slug', (req, res, next) => {
    const t = TOOLS[req.params.slug]; if (!t) return next();
    const about = (t.about || []).map((x) => `<p>${esc(x)}</p>`).join('') + (t.faq?.length ? `<h2>Pytania</h2>${t.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : '');
    page(res, base, `narzedzia/${req.params.slug}`, t, `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Darmowe narzędzia</span></nav><h1>${esc(t.title)}</h1><p class="lead">${esc(t.lead)}</p>${about}${TOOL_SEE[req.params.slug] || ''}<h2>Inne darmowe narzędzia</h2><div class="more">${Object.entries(TOOLS).map(([k, x]) => `<a href="/narzedzia/${k}">${esc(x.title)}</a>`).join('')}<a href="${LETTER_LINK[0]}">${esc(LETTER_LINK[1])}</a></div></div>`, { full: true, alternates: toolAlternates(base, req.params.slug), data: [crumbsLd(base, [['Darmowe narzędzia', '#poradnik'], [t.title, `narzedzia/${req.params.slug}`]]), faqLd(t.faq || []), { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.title, description: t.metaDescription, url: `${base}/narzedzia/${req.params.slug}`, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', inLanguage: 'pl', offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' } }] });
  });
  app.get('/poradnik', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); page(res, base, 'poradnik', { title: 'Poradnik o CV, liście motywacyjnym i rozmowie', seoTitle: 'Poradnik: CV, list motywacyjny i rozmowa kwalifikacyjna', metaDescription: 'Artykuły o pisaniu CV pod ogłoszenie, systemach ATS, liście motywacyjnym, rozmowie kwalifikacyjnej i sytuacjach szczególnych, pogrupowane w tematy.' }, hubHtmlPoradnik(), { ssrOnly: true, data: [crumbsLd(base, [['Poradnik', 'poradnik']])] }); });
  // Pytania czytelników (PR X): lista Q&A z FAQPage; nowe dodaje właściciel w panelu, publikacja po zatwierdzeniu.
  app.get(`/${QA_PATH}`, async (_req, res) => {
    const qa = await publishedQa();
    page(res, base, QA_PATH, { title: 'Pytania czytelników o CV i rekrutację', seoTitle: 'Pytania czytelników o CV – krótkie odpowiedzi', metaDescription: 'Krótkie odpowiedzi na pytania czytelników o CV, list motywacyjny i rekrutację. Masz własne pytanie? Napisz, odpowiemy w poradniku.' },
      `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/poradnik">Poradnik</a> › <span>Pytania czytelników</span></nav><h1>Pytania czytelników o CV i rekrutację</h1><p class="lead">Krótkie odpowiedzi na pytania, które dostajemy od czytelników. Publikujemy je bez danych osób, które pytały.</p>${qa.map((x) => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}<div class="cta-box"><div><b>Masz pytanie o CV?</b><p class="hint">Napisz – odpowiemy w poradniku (bez Twoich danych).</p></div><a class="btn" href="/kontakt">Zadaj pytanie</a></div></div>`,
      { ssrOnly: true, data: [crumbsLd(base, [['Poradnik', 'poradnik'], ['Pytania czytelników', QA_PATH]]), faqLd(qa)] });
  });
  app.get('/poradnik/:slug', (req, res, next) => {
    const a = ARTICLES.find((x) => x.slug === req.params.slug); if (!a) return next();
    page(res, base, `poradnik/${a.slug}`, { ...a, seoTitle: artSeoTitle('pl', a.slug, dateOf(`poradnik/${a.slug}`)) || a.seoTitle }, artHtml(a), { alternates: artAlternates(base, a.slug), data: [crumbsLd(base, [['Poradnik', 'poradnik'], [a.title, `poradnik/${a.slug}`]]), faqLd(a.faq || []),
      articleLd(base, a, `poradnik/${a.slug}`, 'pl')] });
  });
  app.get(['/:lang/:seg/:slug', '/:lang/:seg/:slug/:city'], (req, res, next) => {
    const { lang: l, seg, slug, city } = req.params;
    if (PROF_LANGS[l]?.seg !== seg) return next();
    const pl = PROF_BY[l][slug], p = pl && profIn(l, pl); if (!p) return next();
    if (!city) return page(res, base, profUrl(l, pl), { ...p, ...profSeo(p, l), ...(p.plus ? { seoTitle: p.plus.seoTitle, metaDescription: p.plus.metaDescription } : {}) }, profHtmlLang(p, l), { lang: l, route: `cv/${pl}`, alternates: profAlternates(base, pl), data: [faqLd(p.faq || []), pageLd(base, profUrl(l, pl), p.title, l)] });
    const cpl = CITY_BY[l][city], c = cpl && POPULAR.some((x) => x.slug === pl) && cityIn(l, cpl); if (!c) return next();
    page(res, base, profUrl(l, pl, cpl), { title: fillT(PAGE_T[l].title, p, c), seoTitle: fillT(PAGE_T[l].seo, p, c), metaDescription: fillT(PAGE_T[l].desc, p, c) }, cityHtmlLang(p, c, l), { lang: l, route: `cv/${pl}/${cpl}`, ...cityOpts(res, base, pl, cpl, profUrl(l, pl)), data: [crumbsLd(base, [[p.name, profUrl(l, pl)], [c.name, profUrl(l, pl, cpl)]], l)] });
  });
  app.get('/:lang/:seg/:slug', (req, res, next) => {
    const { lang: l, seg, slug } = req.params, pl = TOOL_LANGS[l]?.seg === seg && TOOL_BY[l][slug];
    if (!pl) return next();
    const x = withExt(l, `tool:${pl}`, TOOL_LANGS[l].data[pl]);
    page(res, base, toolUrl(l, pl), x, toolHtmlLang(pl, l), { full: true, lang: l, route: `narzedzia/${pl}`, alternates: toolAlternates(base, pl), data: [crumbsLd(base, [[dictOf(l)['Darmowe narzędzia'] || 'Darmowe narzędzia', `${l}#poradnik`], [x.title, toolUrl(l, pl)]], l), faqLd(x.faq || [])] });
  });
  // Połączone artykuły (C3): stare adresy na nowy, jeden adres na temat.
  app.get(Object.keys(C3_301), (req, res) => res.redirect(301, C3_301[req.path]));
  app.get('/:lang/:seg/:slug', (req, res, next) => {
    const { lang: l, seg, slug } = req.params, a = ART_LANGS[l]?.seg === seg && BY_LANG[l][slug];
    if (!a) return next();
    page(res, base, langUrl(l, slug), { ...a, seoTitle: artSeoTitle(l, a.slug, dateOf(langUrl(l, slug))) || a.seoTitle }, artHtmlLang(a, l), { lang: l, route: `poradnik/${a.slug}`, alternates: artAlternates(base, a.slug), data: [faqLd(a.faq || []), articleLd(base, a, langUrl(l, slug), l)] });
  });
  // /wynik/ (karty wyników skanera) poza wyszukiwarkami, ale boty podglądu linków (Facebook, X, Telegram, WhatsApp) muszą pobrać obrazek i opis.
  const DIS = 'Disallow: /api/\nDisallow: /admin\nDisallow: /konto\nDisallow: /newsletter/\nDisallow: /raport/\nDisallow: /raport-seo/\n';
  app.get('/robots.txt', (_req, res) => res.type('text').send(`User-agent: *\nAllow: /\nAllow: /llms.txt\n${DIS}Disallow: /wynik/\n\nUser-agent: facebookexternalhit\nUser-agent: Facebot\nUser-agent: Twitterbot\nUser-agent: TelegramBot\nUser-agent: WhatsApp\nAllow: /\n${DIS}\nSitemap: ${base}/sitemap.xml\n`));
  // Do mapy strony trafiają tylko indeksowane pary zawód × miasto (cityIndexable).
  const cityPairs = () => POPULAR.flatMap((p) => CITIES.filter((c) => cityIndexable(p.slug, c.slug)).map((c) => [p.slug, c.slug]));
  // lastmod: data ostatniej zmiany treści strony (seo-data/content-dates.json), dla pozostałych stron UPDATED.
  const lastmodOf = (u) => dateOf(u) || UPDATED;
  // Obrazy stron (Google Grafika): podgląd wzoru (/wzor-cv/*, /list-motywacyjny/*) i miniatura przykładowego CV (/cv/<zawód>).
  const imageOf = (u) => { const m = /^(wzor-cv|list-motywacyjny|cv)\/([\w-]+)$/.exec(u); return m ? previewPath(`${m[1]}-${m[2]}`) : null; };
  app.get('/sitemap.xml', (_req, res) => {
    const urls = ['', 'en', 'uk', 'de', ...Object.keys(STATIC_PAGES), ...Object.keys(LEGAL_BY_PATH), 'o-serwisie', 'kontakt', 'zasady-redakcyjne', 'poradnik', QA_PATH, 'dla-instytucji/zamow', 'program-partnerski', 'program-partnerski/regulamin', 'dla-doradcow', 'dla-uczelni', 'dla-agencji', 'kreator-cv', 'poradnik/jedno-cv-dwa-ogloszenia', ...Object.values(C3_CASE_URL), 'narzedzia/list-motywacyjny-pod-ogloszenie', ...(DUTIES_INDEX ? ['zawod/zakres-obowiazkow', ...Object.keys(DUTIES).map(dutiesPath)] : []), 'karnety', 'uslugi', 'szablony-premium', 'tlumaczenie-cv', 'dla-firm/sprawdz-ogloszenie', 'uslugi/dotacja-z-urzedu-pracy', 'uslugi/oferta-na-zlecenie', 'dla-firm/outplacement', ...(process.env.SELECTION_ENABLED === '1' ? ['dla-firm/selekcja-cv'] : []), ...PROFESSIONS.map((p) => `cv/${p.slug}`), ...cityPairs().map(([p, c]) => `cv/${p}/${c}`), ...ARTICLES.map((a) => `poradnik/${a.slug}`), ...Object.entries(BY_LANG).flatMap(([l, m]) => Object.keys(m).map((s) => langUrl(l, s))),
      ...Object.keys(PROF_LANGS).flatMap((l) => [...PROFESSIONS.map((p) => profUrl(l, p.slug)), ...cityPairs().map(([p, c]) => profUrl(l, p, c))]), ...TEMPLATE_URLS, ...ABROAD_URLS, ...OFFICIAL_URLS, ...PORTAL_URLS, ...fairUrls(), ...EMPLOYER_URLS, ...Object.keys(TOOLS).map((k) => `narzedzia/${k}`), ...Object.keys(TOOL_LANGS).flatMap((l) => Object.keys(TOOLS).filter((k) => TOOL_LANGS[l].data[k]).map((k) => toolUrl(l, k)))];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map((u) => `  <url><loc>${base}/${u}</loc><lastmod>${lastmodOf(u)}</lastmod>${imageOf(u) ? `<image:image><image:loc>${base}${imageOf(u)}</image:loc></image:image>` : ''}</url>`).join('\n')}\n</urlset>\n`);
  });
}
