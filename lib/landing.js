// Strony pod frazy ogólne (PR C1): /kreator-cv (landing kreatora: wejściem jest ogłoszenie) i case study
// /poradnik/jedno-cv-dwa-ogloszenia. Przykład w case study: jedna fikcyjna osoba, dwa fikcyjne ogłoszenia; procent
// dopasowania liczy nasz skaner słów kluczowych (lib/tailor.js: scanFallback) na dokładnie tych tekstach – liczby się zgadzają.
import { scanFallback } from './tailor.js';
import { scoreOf } from './generate.js';
import { PRICES } from './pricing.js';
import { ssrPage } from './seo.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const plain = (s) => s.replace(/\[\[|\]\]/g, '');
const marked = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
const faqLd = (qa) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = (qa) => `<h2>Pytania</h2>${qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}`;
const crumbs = (base, trail) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Strona główna', ''], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) });
// Klaster: skaner ↔ sprawdzenie CV ↔ test ATS ↔ kreator ↔ case study.
const CLUSTER = [['/narzedzia/skaner-cv', 'Skaner CV z ogłoszeniem'], ['/narzedzia/sprawdz-cv', 'Sprawdź CV bez ogłoszenia'], ['/narzedzia/test-cv-ats', 'Test CV pod ATS'], ['/kreator-cv', 'Kreator CV pod ogłoszenie'], ['/poradnik/jedno-cv-dwa-ogloszenia', 'Jedno CV, dwa ogłoszenia: przykład']];
const cluster = (self) => `<h2>Zobacz też</h2><div class="more">${CLUSTER.filter(([u]) => u !== self).map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join('')}</div>`;

// --- /kreator-cv ---
export const KREATOR = { title: 'Kreator CV online, który pisze CV pod konkretne ogłoszenie', seoTitle: 'Kreator CV online pod ogłoszenie – bez logowania, od 39 zł', metaDescription: 'Kreator CV online, który zaczyna od ogłoszenia: wklejasz ofertę, podajesz swoje doświadczenie i dostajesz CV pod te wymagania. Bez logowania, bez abonamentu.' };
const KREATOR_FAQ = () => [
  ['Czy kreator CV jest darmowy?', `Wypełnienie kreatora i podgląd początku CV są bezpłatne, tak samo jak skaner CV. Płacisz dopiero za gotowe dokumenty: ${zl(PRICES.cv)} za CV pod jedno ogłoszenie, ${zl(PRICES.cv_letter)} za CV z listem motywacyjnym albo ${zl(PRICES.pack3)} za trzy CV z listami. Bez abonamentu.`],
  ['Czy muszę zakładać konto?', 'Nie. Kreator działa bez logowania. Gotowe CV dostajesz na stronie i na e-mail. Konto możesz założyć później, jeśli chcesz mieć zamówienia w jednym miejscu.'],
  ['Czym ten kreator różni się od zwykłego kreatora CV?', 'Zwykły kreator daje szablon i puste pola. Tu zaczynasz od ogłoszenia: z oferty wyciągamy wymagania i słowa kluczowe, a CV układamy z Twoich danych tak, żeby te wymagania było widać. Nie dopisujemy niczego, czego nie podasz.'],
  ['Czy mogę zacząć od starego CV?', 'Tak. W kreatorze możesz wgrać obecne CV (PDF lub Word), a pola wypełnią się same. Potem wklejasz ogłoszenie i sprawdzasz dane.'],
  ['W jakim formacie dostanę CV?', 'W PDF, gotowe do wysłania. Wersję do edycji w Wordzie (.docx) możesz dodać za ' + zl(PRICES.docx) + '.'],
];
function kreatorHtml() {
  const rows = [
    ['Od czego zaczynasz', 'Od pustego szablonu', 'Od ogłoszenia, na które chcesz wysłać CV'],
    ['Słowa kluczowe z oferty', 'Musisz je znaleźć i wpisać sam', 'Wyciągamy je z ogłoszenia i pokazujemy, które masz w CV'],
    ['Treść CV', 'Piszesz każde zdanie sam', 'Układamy Twoje dane pod wymagania, bez dopisywania faktów'],
    ['Cena', 'Często próba za kilka złotych, potem abonament', `${zl(PRICES.cv)}–${zl(PRICES.pack3)} jednorazowo, bez abonamentu`],
    ['Sprawdzenie', 'Brak', 'Raport dopasowania do ogłoszenia przy każdym CV'],
  ];
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <span>Kreator CV</span></nav>
<h1>${esc(KREATOR.title)}</h1>
<p class="lead">Wklej ogłoszenie, na które chcesz aplikować. Kreator przeprowadzi Cię przez dane, doświadczenie i wykształcenie, a CV powstanie pod wymagania z tej oferty. Wypełnianie jest bezpłatne i nie wymaga logowania; gotowe CV kosztuje od ${zl(PRICES.cv)}.</p>
<form class="wiz-ad paste-ad" novalidate><h2>Zacznij od ogłoszenia</h2><label class="f">Treść lub link do ogłoszenia<textarea name="ad" rows="4"></textarea></label><button class="btn" type="submit">Otwórz kreator z tym ogłoszeniem</button>
<p class="hint small">Ogłoszenie przeniesiemy do kreatora w tej przeglądarce. Możesz też zacząć bez ogłoszenia i wkleić je później.</p></form>
<h2>Jak to działa: 3 kroki</h2><ol class="tips"><li>Wklejasz ogłoszenie (link albo treść). Z oferty wyciągamy wymagania i słowa kluczowe.</li><li>Podajesz swoje dane, doświadczenie i wykształcenie albo wgrywasz stare CV, z którego pola wypełnią się same.</li><li>Wybierasz wygląd i płacisz. Dostajesz CV w PDF z raportem dopasowania: które wymagania z ogłoszenia widać w CV, a których brakuje.</li></ol>
<h2>Zwykły kreator CV a kreator pod ogłoszenie</h2><div class="cmp-wrap"><table class="cmp"><thead><tr><th></th><th>Zwykły kreator CV</th><th class="us">CV Pod Ogłoszenie</th></tr></thead><tbody>${rows.map(([a, b, c]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td><td class="us">${esc(c)}</td></tr>`).join('')}</tbody></table></div>
<h2>Ile to kosztuje</h2><p>Skaner CV i wypełnianie kreatora są bezpłatne. Za gotowe dokumenty płacisz raz: ${zl(PRICES.cv)} za CV pod jedno ogłoszenie, ${zl(PRICES.cv_letter)} za CV z listem motywacyjnym, ${zl(PRICES.pack3)} za trzy CV z listami pod ogłoszenia w tym samym zawodzie. Bez abonamentu i bez automatycznego odnawiania.</p>
<p class="prof-cta"><a class="btn ghost" href="/narzedzia/skaner-cv">Najpierw sprawdź obecne CV za darmo</a> <a class="btn" href="/?zamow=1">Otwórz kreator</a></p>
${faqHtml(KREATOR_FAQ())}${cluster('/kreator-cv')}</div>`;
}

// --- /poradnik/jedno-cv-dwa-ogloszenia ---
export const CASE = {
  name: 'Anna Przykładowa',
  facts: ['Od 2021 r. obsługa klienta w sklepie internetowym z artykułami domowymi: e-maile i czat, zwroty i reklamacje, część rozmów telefonicznych.', 'Praca w systemie CRM i w systemie zamówień sklepu.', 'Wcześniej (2018–2021) kasjerka-sprzedawczyni w markecie, praca zmianowa.', 'Szkolenie nowych osób w zespole, język angielski na poziomie B2.'],
  generic: { summary: 'Mam doświadczenie w obsłudze klienta i sprzedaży. Jestem komunikatywna, sumienna i lubię pracę z ludźmi.', bullets: ['Obsługa klientów sklepu internetowego', 'Praca na kasie w markecie', 'Wdrażanie nowych osób'] },
  ads: [
    { key: 'A', title: 'Ogłoszenie A: obsługa klienta w sklepie internetowym (czat i e-mail)', text: 'Specjalista ds. obsługi klienta e-commerce.\nWymagania: obsługa klienta przez czat i e-mail, obsługa reklamacji i zwrotów, praca w systemie CRM, język angielski na poziomie B2, poprawna polszczyzna w piśmie.',
      cv: { summary: 'Specjalistka obsługi klienta e-commerce: od 2021 r. odpowiadam klientom sklepu internetowego przez [[czat i e-mail]], prowadzę [[reklamacje i zwroty]] i pracuję w [[systemie CRM]]. [[Język angielski B2]].', bullets: ['Obsługa klientów przez [[czat i e-mail]] w sklepie internetowym', 'Prowadzenie [[reklamacji i zwrotów]] od zgłoszenia do zamknięcia sprawy', 'Praca w [[systemie CRM]] i w systemie zamówień', 'Wdrażanie nowych osób w zespole obsługi klienta'] } },
    { key: 'B', title: 'Ogłoszenie B: konsultant infolinii', text: 'Konsultant infolinii.\nWymagania: rozmowy telefoniczne z klientami, praca w systemie CRM, wyjaśnianie warunków umów, praca zmianowa, odporność na stres.',
      cv: { summary: 'Konsultantka obsługi klienta z doświadczeniem w [[rozmowach telefonicznych z klientami]] i pracy w [[systemie CRM]]. Znam [[pracę zmianową]] z wcześniejszej pracy w markecie.', bullets: ['[[Rozmowy telefoniczne z klientami]] sklepu internetowego: zamówienia, zwroty, reklamacje', 'Praca w [[systemie CRM]]: notowanie zgłoszeń i historii kontaktu', 'Kasjerka-sprzedawczyni w markecie, [[praca zmianowa]]', 'Wdrażanie nowych osób w zespole'] } },
  ],
};
const cvText = (x) => [CASE.name, 'Podsumowanie', plain(x.summary), 'Doświadczenie', ...x.bullets.map(plain)].join('\n');
export function caseScores() {
  return CASE.ads.map((a) => { const s = (cv) => { const r = scanFallback({ cvText: cvText(cv), adText: a.text }); return { score: scoreOf(r), found: r.found, missing: r.missing.map((m) => m.keyword) }; }; return { key: a.key, generic: s(CASE.generic), tailored: s(a.cv) }; });
}
export const CASE_PAGE = { title: 'Jedno CV, dwa ogłoszenia: zobacz, co się zmienia i dlaczego', seoTitle: 'Jedno CV, dwa ogłoszenia: przykład dopasowania CV', metaDescription: 'Ta sama osoba, te same fakty i dwa różne ogłoszenia: zobacz obok siebie dwie wersje CV, zaznaczone słowa z ofert i wynik skanera przed i po dopasowaniu.' };
const CASE_FAQ = [
  ['Czy dopasowanie CV to dopisywanie doświadczenia?', 'Nie. W obu wersjach są te same fakty. Zmienia się kolejność, słownictwo i to, co trafia do podsumowania. Wymagania, których osoba nie spełnia, zostają w raporcie jako brakujące.'],
  ['Skąd biorą się procenty w przykładzie?', 'Liczy je nasz skaner słów kluczowych na dokładnie tych tekstach, które widać na stronie. Prawdziwe ogłoszenia są dłuższe, ale zasada jest ta sama.'],
  ['Czy trzeba dopasowywać CV do każdej oferty?', 'Opłaca się przy ofertach, na których naprawdę Ci zależy, i przy zmianie rodzaju pracy, np. z czatu na infolinię. Przy bardzo podobnych ofertach wystarczy zwykle drobna zmiana podsumowania.'],
];
function caseHtml() {
  const sc = caseScores(), list = (a) => a.map((x) => `<li>${esc(x)}</li>`).join('');
  const cvCard = (label, cv, score) => `<article class="ad-col"><h3>${esc(label)} <small>· ${score}% dopasowania</small></h3><p><b>Podsumowanie:</b> ${marked(cv.summary)}</p><ul class="ad-lines">${cv.bullets.map((b) => `<li>${marked(b)}</li>`).join('')}</ul></article>`;
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/poradnik">Poradnik</a> › <span>Jedno CV, dwa ogłoszenia</span></nav>
<h1>${esc(CASE_PAGE.title)}</h1>
<p class="lead">Jedna osoba, te same fakty i dwa ogłoszenia z różnymi wymaganiami. Pokazujemy, jak zmienia się CV pod każde z nich, które słowa z oferty trafiają do tekstu i jak zmienia się wynik skanera. Osoba i ogłoszenia są przykładowe.</p>
<h2>Fakty o kandydatce</h2><p>${esc(CASE.name)} (dane fikcyjne). Tylko te informacje mogą trafić do CV:</p><ul>${list(CASE.facts)}</ul>
<h2>Punkt wyjścia: jedno CV na wszystkie oferty</h2>${cvCard('Ogólne CV', CASE.generic, sc[0].generic.score)}
<p>Wynik tego samego CV dla ogłoszenia A: ${sc[0].generic.score}%, dla ogłoszenia B: ${sc[1].generic.score}%. Doświadczenie jest, ale opisane słowami, których nie ma w ofertach.</p>
${CASE.ads.map((a, i) => `<h2>${esc(a.title)}</h2><pre class="ats-text">${esc(a.text)}</pre>
<div class="two-ads">${cvCard('Ogólne CV', CASE.generic, sc[i].generic.score)}${cvCard(`CV pod ogłoszenie ${a.key}`, a.cv, sc[i].tailored.score)}</div>
<p><b>Skaner po dopasowaniu – widać w CV:</b> ${esc(sc[i].tailored.found.join(', ') || '–')}.${sc[i].tailored.missing.length ? ` <b>Nadal brakuje:</b> ${esc(sc[i].tailored.missing.join(', '))} – tego nie ma w faktach o kandydatce, więc nie trafia do CV.` : ''}</p>`).join('')}
<h2>Co się zmieniło i dlaczego</h2><ul><li>Podsumowanie mówi o tym, czego szuka dana oferta: w A o czacie, e-mailu i reklamacjach, w B o telefonie i pracy zmianowej.</li><li>Te same obowiązki są opisane słowami z ogłoszenia, np. „obsługa klientów” zamienia się w „rozmowy telefoniczne z klientami”, bo tak było naprawdę.</li><li>Kolejność punktów zmienia się tak, żeby najważniejsze dla oferty było na górze.</li><li>Niczego nie dopisano: wymagania, których kandydatka nie spełnia, zostają w raporcie jako brakujące.</li></ul>
<p class="prof-cta"><a class="btn ghost" href="/narzedzia/skaner-cv">Sprawdź swoje CV z ogłoszeniem</a> <a class="btn" href="/?zamow=1">Zrób CV pod swoje ogłoszenie – od ${zl(PRICES.cv)}</a></p>
${faqHtml(CASE_FAQ)}${cluster('/poradnik/jedno-cv-dwa-ogloszenia')}</div>`;
}

export function landingRoutes(app, base) {
  app.get('/kreator-cv', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, 'kreator-cv', KREATOR, kreatorHtml(), { data: [crumbs(base, [['Kreator CV', 'kreator-cv']]), faqLd(KREATOR_FAQ())] }); });
  app.get('/poradnik/jedno-cv-dwa-ogloszenia', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, 'poradnik/jedno-cv-dwa-ogloszenia', CASE_PAGE, caseHtml(), { data: [crumbs(base, [['Poradnik', 'poradnik'], ['Jedno CV, dwa ogłoszenia', 'poradnik/jedno-cv-dwa-ogloszenia']]), faqLd(CASE_FAQ)] }); });
}
export const LANDING_URLS = ['kreator-cv', 'poradnik/jedno-cv-dwa-ogloszenia'];
