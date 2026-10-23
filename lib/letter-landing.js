// /narzedzia/list-motywacyjny-pod-ogloszenie (PR C2): czym jest list pod konkretną ofertę, przykład „ten sam kandydat,
// dwa listy” (fikcyjna osoba i ogłoszenia, te same fakty) i lista kontrolna. List powstaje w pakiecie CV + list (cena z cennika).
import { PRICES } from './pricing.js';
import { ssrPage } from './seo.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const marked = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');

export const LETTER_PAGE = { title: 'List motywacyjny pod konkretne ogłoszenie: przykład i lista kontrolna', seoTitle: 'List motywacyjny pod ofertę: przykład i lista kontrolna', metaDescription: `List motywacyjny pod konkretne ogłoszenie: dwa przykładowe listy jednej osoby pod dwie oferty i lista kontrolna. List napiszemy razem z CV – ${zl(PRICES.cv_letter)}.` };
export const LETTERS = {
  facts: 'Anna Przykładowa (dane fikcyjne): od 2021 r. obsługa klienta w sklepie internetowym – czat, e-mail, zwroty i reklamacje, część rozmów telefonicznych, system CRM; wcześniej kasjerka w markecie (praca zmianowa).',
  ads: [
    { title: 'Ogłoszenie A: obsługa klienta przez czat i e-mail', req: ['obsługa klienta przez czat i e-mail', 'reklamacje i zwroty', 'system CRM'],
      letter: ['Szanowni Państwo,', 'odpowiadam na ogłoszenie na stanowisko specjalisty ds. obsługi klienta. Od 2021 roku odpowiadam klientom sklepu internetowego przez [[czat i e-mail]], więc znam tempo i ton tej pracy.', 'Na co dzień prowadzę [[reklamacje i zwroty]] od zgłoszenia do zamknięcia sprawy i zapisuję historię kontaktu w [[systemie CRM]]. Dzięki temu kolejna osoba z zespołu wie, co już ustaliliśmy z klientem.', 'Chętnie opowiem o tym na rozmowie.', 'Z wyrazami szacunku,\nAnna Przykładowa'] },
    { title: 'Ogłoszenie B: konsultant infolinii', req: ['rozmowy telefoniczne z klientami', 'system CRM', 'praca zmianowa'],
      letter: ['Szanowni Państwo,', 'zgłaszam się na stanowisko konsultanta infolinii. W obsłudze klienta sklepu internetowego prowadzę także [[rozmowy telefoniczne z klientami]] w sprawie zamówień, zwrotów i reklamacji.', 'Każdą rozmowę notuję w [[systemie CRM]], żeby sprawa nie ginęła między kanałami. [[Pracę zmianową]] znam z wcześniejszej pracy w markecie.', 'Chętnie opowiem o tym na rozmowie.', 'Z wyrazami szacunku,\nAnna Przykładowa'] },
  ],
};
const CHECK = ['List ma nazwę stanowiska z ogłoszenia i jest skierowany do tej firmy.', 'Odnosi się do co najmniej trzech wymagań z ogłoszenia, każde z przykładem z Twojej pracy.', 'Nie powtarza CV punkt po punkcie – dopowiada, jak i po co wykonywane były zadania z CV.', 'Każde zdanie da się potwierdzić na rozmowie (bez obietnic i ogólników).', 'Mieści się na jednej stronie i kończy prośbą o rozmowę.'];
const FAQ = [
  ['Czy list motywacyjny jest jeszcze potrzebny?', 'Gdy ogłoszenie o niego prosi – tak. Przy zmianie branży, przerwie w pracy albo wysyłce do konkretnej osoby list pozwala wyjaśnić to, czego nie widać w CV. Gdy nie jest wymagany, krótki list też nie zaszkodzi.'],
  ['Co napisać, gdy nie spełniam wszystkich wymagań?', 'Napisz o tych, które spełniasz, z przykładami. Brakujące pomiń albo uczciwie wspomnij, czego się uczysz. Nie dopisuj doświadczenia, którego nie masz.'],
  ['Ile kosztuje list pod ogłoszenie?', `List powstaje razem z CV pod to samo ogłoszenie: CV z listem motywacyjnym kosztuje ${zl(PRICES.cv_letter)}, pakiet trzech CV z listami ${zl(PRICES.pack3)}. Bez abonamentu.`],
];
const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };

function letterHtml() {
  return `<div class="inner narrow article"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/poradnik">Poradnik</a> › <span>List motywacyjny pod ogłoszenie</span></nav>
<h1>${esc(LETTER_PAGE.title)}</h1>
<p class="lead">List pod konkretne ogłoszenie odpowiada na pytanie rekrutera: dlaczego właśnie Ty pasujesz do tych wymagań. Wklejasz ofertę w kreatorze, a list powstaje razem z CV pod to samo ogłoszenie, na podstawie Twoich danych. CV z listem kosztuje ${zl(PRICES.cv_letter)}.</p>
<h2>Ten sam kandydat, dwa listy</h2><p>${esc(LETTERS.facts)} Te same fakty, dwa ogłoszenia – zaznaczyliśmy słowa z oferty.</p>
<div class="two-ads">${LETTERS.ads.map((a) => `<article class="ad-col"><h3>${esc(a.title)}</h3><p class="small">Wymagania: ${esc(a.req.join(', '))}</p>${a.letter.map((p) => `<p>${marked(p).replace(/\n/g, '<br>')}</p>`).join('')}</article>`).join('')}</div>
<p>W obu listach są tylko fakty z doświadczenia kandydatki. Zmienia się to, co jest na pierwszym planie: w A czat, e-mail i reklamacje, w B telefon i praca zmianowa.</p>
<h2>Lista kontrolna: czy list jest pod ogłoszenie?</h2><ul class="checklist">${CHECK.map((c) => `<li><label class="check"><input type="checkbox"> <span>${esc(c)}</span></label></li>`).join('')}</ul>
<p class="prof-cta"><a class="btn ghost" href="/poradnik/jak-napisac-list-motywacyjny">Jak napisać list motywacyjny</a> <a class="btn" href="/?zamow=1&amp;pkg=cv_letter">CV i list pod ogłoszenie – ${zl(PRICES.cv_letter)}</a></p>
<h2>Pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<h2>Zobacz też</h2><div class="more"><a href="/narzedzia/skaner-cv">Skaner CV z ogłoszeniem</a><a href="/poradnik/slowa-kluczowe-ats-wedlug-zawodu">Słowa kluczowe ATS według zawodu</a><a href="/poradnik/czy-dopasowywac-cv-do-kazdej-oferty">Czy dopasowywać CV do każdej oferty</a></div></div>`;
}
export function letterRoutes(app, base) {
  app.get('/narzedzia/list-motywacyjny-pod-ogloszenie', (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, 'narzedzia/list-motywacyjny-pod-ogloszenie', LETTER_PAGE, letterHtml(), { data: [faqLd] }); });
}
