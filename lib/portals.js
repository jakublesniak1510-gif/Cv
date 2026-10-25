// Strony „CV pod ogłoszenie z <portal>” (lib/portals-content.js): 3 kroki „skopiuj – wklej – odbierz”, własna schematyczna grafika
// (bez logotypów i zrzutów cudzych stron), CTA do kreatora i skanera, link do rozszerzenia Chrome (CHROME_EXT_URL), informacja
// o niezależności od portalu. Hub /cv-pod-ogloszenie-z z listą portali.
import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { byline, pageLd } from './authorship.js';
import { PORTALS, PORTAL_BY, PORTAL_HUB, portalPath, portalTitle } from './portals-content.js';
export { PORTALS, PORTAL_URLS, portalPath } from './portals-content.js';

const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const chromeExt = () => (/^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)\/[^\s"'<>]{1,300}$/.test(process.env.CHROME_EXT_URL || '') ? process.env.CHROME_EXT_URL : '');
export const portalDesc = (p) => `Jak skopiować ogłoszenie z ${p.name} i wkleić je w kreatorze: 3 kroki i CV dopasowane do wymagań z oferty od ${zl(PRICES.cv)}. Niezależny serwis.`;

// Schemat: okno przeglądarki z zaznaczonym ogłoszeniem → pole „wklej” → dokument CV (bez nazw i logotypów portali).
const FIG = `<figure class="portal-fig"><svg viewBox="0 0 640 200" role="img" aria-label="Schemat: zaznacz treść ogłoszenia, wklej ją w kreatorze, odbierz CV">
<rect x="10" y="20" width="190" height="160" rx="10" fill="#fff" stroke="#D9E0EC" stroke-width="2"/><rect x="10" y="20" width="190" height="22" rx="10" fill="#E9EEF8"/><circle cx="26" cy="31" r="4" fill="#D9E0EC"/><circle cx="40" cy="31" r="4" fill="#D9E0EC"/>
<rect x="24" y="56" width="120" height="10" rx="3" fill="#0E1C34"/><rect x="24" y="78" width="160" height="56" rx="4" fill="#FFE45C" opacity=".75"/>
<rect x="30" y="86" width="140" height="6" rx="3" fill="#546178"/><rect x="30" y="100" width="120" height="6" rx="3" fill="#546178"/><rect x="30" y="114" width="132" height="6" rx="3" fill="#546178"/><rect x="24" y="146" width="100" height="6" rx="3" fill="#D9E0EC"/>
<path d="M212 100h50" stroke="#2548E8" stroke-width="4" marker-end="url(#ar)"/><defs><marker id="ar" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0 0l8 5-8 5z" fill="#2548E8"/></marker></defs>
<rect x="276" y="40" width="150" height="120" rx="10" fill="#fff" stroke="#2548E8" stroke-width="2"/><rect x="290" y="56" width="80" height="8" rx="3" fill="#0E1C34"/><rect x="290" y="74" width="122" height="54" rx="6" fill="#E8EEFF" stroke="#D9E0EC"/><rect x="298" y="84" width="100" height="5" rx="2" fill="#546178"/><rect x="298" y="96" width="90" height="5" rx="2" fill="#546178"/><rect x="290" y="136" width="70" height="14" rx="5" fill="#2548E8"/>
<path d="M438 100h50" stroke="#2548E8" stroke-width="4" marker-end="url(#ar)"/>
<rect x="502" y="22" width="120" height="156" rx="6" fill="#fff" stroke="#D9E0EC" stroke-width="2"/><rect x="502" y="22" width="34" height="156" rx="6" fill="#2548E8"/><rect x="546" y="38" width="64" height="8" rx="3" fill="#0E1C34"/><rect x="546" y="56" width="66" height="5" rx="2" fill="#546178"/><rect x="546" y="68" width="58" height="5" rx="2" fill="#546178"/><rect x="546" y="88" width="40" height="6" rx="3" fill="#0E1C34"/><rect x="546" y="102" width="66" height="5" rx="2" fill="#FFE45C"/><rect x="546" y="114" width="60" height="5" rx="2" fill="#546178"/><rect x="546" y="126" width="62" height="5" rx="2" fill="#FFE45C"/>
</svg><figcaption>Schemat poglądowy: zaznaczona treść ogłoszenia → kreator → CV z wymaganiami z oferty.</figcaption></figure>`;

const steps = (p) => `<ol class="steps-num">
<li><b>Skopiuj ogłoszenie z ${esc(p.name)}.</b> Otwórz ofertę, zaznacz jej treść (stanowisko, obowiązki, wymagania) i skopiuj (Ctrl+C, na telefonie „Kopiuj”). Możesz też skopiować sam link do oferty.</li>
<li><b>Wklej je w kreatorze.</b> W kroku z ogłoszeniem wybierz „Wklej treść” albo „Wklej link”. Gdy link się nie wczyta (niektóre portale blokują pobieranie), wklej treść – to zawsze działa.</li>
<li><b>Dodaj swoje doświadczenie i odbierz CV.</b> Wpisz doświadczenie albo wgraj obecne CV. Dostajesz CV w PDF z wymaganiami z oferty, raport dopasowania i darmową poprawkę.</li></ol>`;

const ctas = () => {
  const ext = chromeExt();
  return `<div class="cta-box"><div><b>Zrób CV pod to ogłoszenie – od ${zl(PRICES.cv)}</b><p class="hint">Wklejasz ogłoszenie i swoje doświadczenie, dostajesz CV dopasowane do wymagań z oferty. Nie dopisujemy niczego, czego nie podasz.</p></div><a class="btn" href="/?zamow=1">Wklej ogłoszenie</a></div>
<div class="cta-box"><div><b>Najpierw sprawdź obecne CV za darmo</b><p class="hint">Skaner pokaże, których wymagań z ogłoszenia nie widać w Twoim CV. Bez rejestracji.</p></div><a class="btn ghost" href="/narzedzia/skaner-cv">Sprawdź CV za darmo</a></div>
${ext ? `<p class="hint">Masz Chrome? <a href="${esc(ext)}" target="_blank" rel="noopener">Rozszerzenie „CV Pod Ogłoszenie”</a> przenosi treść otwartej oferty do kreatora jednym kliknięciem.</p>` : ''}`;
};
const disclaimer = (names) => `<p class="hint small portal-note">CV Pod Ogłoszenie to niezależny serwis, niepowiązany z ${names}. Nazwy portali są znakami towarowymi ich właścicieli i służą tu tylko do wskazania, skąd kopiujesz ogłoszenie.</p>`;
const others = (slug) => `<h2>Inne portale</h2><div class="more">${PORTALS.filter((x) => x.slug !== slug).map((x) => `<a href="/${portalPath(x.slug)}">CV pod ogłoszenie z ${esc(x.name)}</a>`).join('')}<a href="/${PORTAL_HUB}">Wszystkie portale</a><a href="/poradnik/jak-dopasowac-cv-do-ogloszenia">Jak dopasować CV do ogłoszenia</a></div>`;

export const portalHtml = (p) => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/${PORTAL_HUB}">CV z portali</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(portalTitle(p))}</h1>${byline(portalPath(p.slug))}<p class="lead">${esc(p.lead)}</p>
<h2>Jak to zrobić w 3 krokach</h2>${FIG}${steps(p)}
<h2>Wskazówki do ogłoszeń z ${esc(p.name)}</h2><ul>${p.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
${ctas()}${others(p.slug)}${disclaimer(esc(p.name))}</div>`;

const HUB = { title: 'CV pod ogłoszenie z portali pracy', seoTitle: 'CV pod ogłoszenie z portali pracy – wklej ofertę', metaDescription: `Jak przenieść ogłoszenie z Pracuj.pl, OLX, Indeed, LinkedIn, No Fluff Jobs, Just Join IT i Praca.pl do kreatora CV. Od ${zl(PRICES.cv)}, niezależny serwis.` };
const hubHtml = () => `<div class="inner narrow"><nav class="crumbs"><a href="/">Strona główna</a> › <span>CV z portali</span></nav>
<h1>${esc(HUB.title)}</h1><p class="lead">Ogłoszenie z dowolnego portalu wklejasz tak samo: kopiujesz treść albo link i wklejasz w kreatorze. Poniżej wskazówki do najpopularniejszych serwisów z ofertami pracy.</p>
${FIG}<div class="more">${PORTALS.map((x) => `<a href="/${portalPath(x.slug)}">CV pod ogłoszenie z ${esc(x.name)}</a>`).join('')}</div>
${ctas()}${disclaimer(PORTALS.map((x) => esc(x.name)).join(', '))}</div>`;

const crumbs = (base, items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) });
export function portalRoutes(app, base) {
  app.get(`/${PORTAL_HUB}`, (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, PORTAL_HUB, HUB, hubHtml(), { data: [crumbs(base, [['Strona główna', ''], ['CV z portali', PORTAL_HUB]])] }); });
  app.get(`/${PORTAL_HUB}/:slug`, (req, res, next) => {
    const p = PORTAL_BY[req.params.slug]; if (!p) return next();
    const item = { title: portalTitle(p), seoTitle: portalTitle(p), metaDescription: portalDesc(p) };
    res.set('Cache-Control', 'public, max-age=3600');
    ssrPage(res, base, portalPath(p.slug), item, portalHtml(p), { data: [crumbs(base, [['Strona główna', ''], ['CV z portali', PORTAL_HUB], [p.name, portalPath(p.slug)]]), pageLd(base, portalPath(p.slug), portalTitle(p))] });
  });
}
