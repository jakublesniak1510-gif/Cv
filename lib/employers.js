import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { PROFESSIONS } from './content.js';
import { templateFor } from './templates-content/index.js';
import { EMPLOYERS, EMPLOYER_BY } from './employers-data.js';
import { byline, pageLd } from './authorship.js';

// Strony „CV do pracy w <firmie>” (/praca-w/<slug>) i hub /praca-w: lekki układ z serwera, indeksowane.
// Wymogi: bez logotypów i grafik firm, widoczna informacja o braku powiązań i dacie danych, BEZ wynagrodzeń
// (szybko się dezaktualizują) – zamiast nich odesłanie do ogłoszeń i strony kariery (rel="nofollow noopener").
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
export const BRANZE = { handel: 'Handel i supermarkety', dyskont: 'Sklepy dyskontowe', drogeria: 'Drogerie', moda: 'Moda i obuwie', dom: 'Dom i majsterkowanie', logistyka: 'Magazyny i logistyka', kurier: 'Kurierzy i przesyłki', poczta: 'Poczta', ecommerce: 'E-commerce', gastronomia: 'Gastronomia', kawiarnia: 'Kawiarnie', paliwa: 'Stacje paliw', kolej: 'Kolej' };
const day = (iso) => { const [y, m, d] = String(iso || '').split('-'); return y && m && d ? `${d}.${m}.${y}` : ''; };
const ext = (url, text) => `<a href="${esc(url)}" rel="nofollow noopener" target="_blank">${esc(text)}</a>`;
// Bez kwot: pozycje list i zdania z kwotą w zł (premie, bony, stawki) pomijamy – dane o pieniądzach szybko się dezaktualizują.
const MONEY = /\d\s*(zł|złot|PLN)|zł\s*(brutto|netto)|\bPLN\b/i; // „\b” nie działa z „ł”, a samo „zł” jest też w „złożyć”
export const noMoney = (t) => String(t || '').split(/(?<=[.!?])\s+/).filter((x) => !MONEY.test(x)).join(' ');
const clean = (a) => (a || []).filter((x) => !MONEY.test(x));
const list = (a) => (clean(a).length ? `<ul>${clean(a).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
const knownForeign = (t) => t && !/^Brak informacji\.?$/i.test(String(t).trim());
// Ważne informacje o formie zatrudnienia (z danych koordynatora), pokazane neutralnie, bo pomagają kandydatowi.
const NOTES = {
  orlen: 'Na stacjach paliw ORLEN pracowników zatrudnia zwykle prowadzący stację (przedsiębiorca), a nie ORLEN. Umowa i warunki zależą więc od konkretnej stacji – zapytaj o nie przy rekrutacji.',
  dpd: 'Kurierzy DPD zwykle współpracują na podstawie umowy kurierskiej (własna działalność gospodarcza), a nie umowy o pracę; przy pracy na magazynie częsta jest umowa zlecenia. Sprawdź formę współpracy w ogłoszeniu.',
  amazon: 'Część zatrudnienia w centrach logistycznych Amazon odbywa się na początku przez agencje pracy tymczasowej. W ogłoszeniu sprawdź, kto jest pracodawcą i na jakiej umowie zaczynasz.',
};
export const employerTitle = (e) => `CV do pracy ${e.w} – jak aplikować i czego wymagają`;
const disclaimer = (e) => `<p class="note">Serwis cvpodogloszenie.pl nie jest powiązany z firmą ${esc(e.nazwa)}. Informacje pochodzą z publicznej strony kariery firmy (stan na ${day(e.stan_na)}) i mogą się zmienić – sprawdź aktualne ogłoszenie.</p>`;
const faqOf = (e) => [...(e.faq || []), { q: `Gdzie znaleźć aktualne oferty pracy ${e.w}?`, a: `Aktualne ogłoszenia, wymagania i stawki ${e.nazwa} publikuje na swojej stronie kariery (${e.kariera_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}). Przed wysłaniem CV porównaj je z treścią konkretnego ogłoszenia, bo wymagania różnią się między stanowiskami i lokalizacjami.` }];
const professionsOf = (e) => (e.zawody || []).map((s) => PROFESSIONS.find((p) => p.slug === s)).filter(Boolean);

export function employerHtml(e) {
  const profs = professionsOf(e), others = EMPLOYERS.filter((x) => x.slug !== e.slug && x.branza === e.branza);
  return `<div class="inner narrow"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <a href="/praca-w">Praca w firmach</a> › <span>${esc(e.nazwa)}</span></nav>
<h1>${esc(employerTitle(e))}</h1>${byline('emp', e.slug)}<p class="lead">${esc(e.intro)}</p>
${disclaimer(e)}
<h2>Typowe stanowiska ${esc(e.w)}</h2>${list(e.stanowiska)}
${noMoney(e.proces) ? `<h2>Jak wygląda aplikowanie</h2><p>${esc(noMoney(e.proces))}</p>` : ''}
${clean(e.wymagania).length ? `<h2>Wymagania z ogłoszeń</h2>${list(e.wymagania)}` : ''}
${clean(e.benefity).length ? `<h2>Co firma podaje w ofertach</h2>${list(e.benefity)}` : ''}
<h2>Wynagrodzenie</h2><p>Aktualne stawki firma podaje w ogłoszeniach i na ${ext(e.kariera_url, 'stronie kariery')}. Nie podajemy kwot, bo szybko się zmieniają i różnią między stanowiskami i miastami.</p>
${NOTES[e.slug] ? `<h2>Warto wiedzieć</h2><p>${esc(NOTES[e.slug])}</p>` : ''}
${knownForeign(noMoney(e.obcokrajowcy)) ? `<h2>Kandydaci z zagranicy</h2><p>${esc(noMoney(e.obcokrajowcy))}</p>` : ''}
<p>${ext(e.kariera_url, `Oficjalna strona kariery ${e.nazwa}`)}</p>
<h2>Wskazówki do CV ${esc(e.w)}</h2><ol class="tips">${e.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
<div class="cta-box"><div><b>Dopasuj CV do oferty ${esc(e.nazwa)} – od ${zl(PRICES.cv)}</b><p class="hint">Wklejasz ogłoszenie, a my przygotowujemy CV pod jego wymagania i słowa kluczowe, z raportem dopasowania. Wolisz najpierw sprawdzić obecne CV? Skorzystaj z darmowego skanera.</p></div><div class="cta"><a class="btn" href="/?zamow=1">Dopasuj CV do ogłoszenia</a> <a class="btn ghost" href="/narzedzia/skaner-cv">Darmowy skaner CV</a></div></div>
${profs.length ? `<h2>CV dla tych zawodów</h2><div class="more">${profs.map((p) => `<a href="/cv/${p.slug}">CV: ${esc(p.name)}</a>${templateFor(p.slug) ? `<a href="/wzor-cv/${templateFor(p.slug).slug}">Wzór CV ${esc(templateFor(p.slug).nameIn)}</a>` : ''}`).join('')}</div>` : ''}
<h2>Najczęstsze pytania</h2>${faqOf(e).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
${others.length ? `<h2>${esc(BRANZE[e.branza] || 'Podobni pracodawcy')}</h2><div class="more">${others.map((x) => `<a href="/praca-w/${x.slug}">Praca ${esc(x.w)}</a>`).join('')}</div>` : ''}
<p><a href="/praca-w">Wszyscy pracodawcy</a></p></div>`;
}

export function hubHtml() {
  const groups = Object.entries(BRANZE).map(([k, n]) => [n, EMPLOYERS.filter((e) => e.branza === k)]).filter(([, l]) => l.length);
  return `<div class="inner narrow"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Praca w firmach</span></nav>
<h1>Praca w popularnych firmach – jak aplikować i jak napisać CV</h1>
<p class="lead">Zebraliśmy informacje z oficjalnych stron kariery firm, które najczęściej rekrutują w Polsce: typowe stanowiska, przebieg rekrutacji, wymagania z ogłoszeń i wskazówki, jak przygotować CV pod te oferty.</p>
<p class="note">Serwis cvpodogloszenie.pl nie jest powiązany z wymienionymi firmami. Informacje pochodzą z publicznych stron kariery i mogą się zmienić – zawsze sprawdź aktualne ogłoszenie.</p>
${groups.map(([n, l]) => `<h2>${esc(n)}</h2><div class="more">${l.map((e) => `<a href="/praca-w/${e.slug}">Praca ${esc(e.w)}</a>`).join('')}</div>`).join('')}
<div class="cta-box"><div><b>Masz już ogłoszenie? Dopasuj CV – od ${zl(PRICES.cv)}</b><p class="hint">Wklejasz ogłoszenie, a my przygotowujemy CV pod jego wymagania, z raportem dopasowania.</p></div><div class="cta"><a class="btn" href="/?zamow=1">Dopasuj CV do ogłoszenia</a> <a class="btn ghost" href="/narzedzia/skaner-cv">Darmowy skaner CV</a></div></div></div>`;
}

const crumbs = (base, items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) });
const faqLd = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

export function employerRoutes(app, base) {
  app.get('/praca-w', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, 'praca-w', { title: 'Praca w popularnych firmach: jak aplikować i jak napisać CV', metaDescription: 'Lidl, Biedronka, Żabka, Amazon, IKEA i inne: typowe stanowiska, rekrutacja i wymagania z oficjalnych stron kariery oraz wskazówki do CV.' }, hubHtml(), { data: [crumbs(base, [['Strona główna', ''], ['Praca w firmach', 'praca-w']])] }); });
  app.get('/praca-w/:slug', (req, res, next) => {
    const e = EMPLOYER_BY[req.params.slug]; if (!e) return next();
    res.set('Cache-Control', 'public, max-age=3600');
    const t = employerTitle(e);
    ssrPage(res, base, `praca-w/${e.slug}`, { title: t, seoTitle: t.length > 60 ? `CV do pracy ${e.w}: rekrutacja i wymagania` : t, metaDescription: `Jak aplikować ${e.w}: typowe stanowiska, przebieg rekrutacji i wymagania z oficjalnej strony kariery oraz wskazówki, jak napisać CV pod te oferty.`.slice(0, 155) }, employerHtml(e),
      { data: [crumbs(base, [['Strona główna', ''], ['Praca w firmach', 'praca-w'], [e.nazwa, `praca-w/${e.slug}`]]), faqLd(faqOf(e)), pageLd(base, `praca-w/${e.slug}`, t, 'emp', e.slug)] });
  });
}
