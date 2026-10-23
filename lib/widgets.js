// Elementy interaktywne poradników (pole „widget” artykułu): HTML z serwera, obsługa w public/lite.js.
// keywords – wyciągacz słów z ogłoszenia (/api/ad-keywords) + listy słów dla 20 zawodów z danych serwisu;
// time-calc – kalkulator czasu dopasowania (wartości wpisuje czytelnik); copy-test / scan – wezwanie do darmowych narzędzi;
// summary-gen – szkic podsumowania ze słów z ogłoszenia (tylko wybrane przez czytelnika słowa, z miejscami do uzupełnienia).
import { PROFESSIONS, POPULAR_SLUGS } from './content.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gen = (p) => /^CV (.+?):/.exec(p.title)?.[1] || p.name;
const adForm = (cls, btn) => `<form class="${cls} paste-ad" novalidate><label class="f">Treść ogłoszenia<textarea name="ad" rows="5"></textarea></label><button class="btn" type="submit">${esc(btn)}</button><p class="fstatus" role="status"></p><div class="w-out"></div></form>`;
const tools = (a, b) => `<p class="prof-cta"><a class="btn ghost" href="${a[0]}">${esc(a[1])}</a> <a class="btn" href="${b[0]}">${esc(b[1])}</a></p>`;

const W = {
  keywords: () => `<h2>Wyciągnij słowa kluczowe z ogłoszenia</h2><p>Wklej treść ogłoszenia, a pokażemy wymagania i słowa, które warto mieć w CV – jeśli są prawdą o Tobie. Ogłoszenia nie zapisujemy.</p>${adForm('kw-extract', 'Pokaż słowa kluczowe')}
<h2>Słowa kluczowe dla 20 zawodów</h2><p>Typowe słowa z ogłoszeń w danych naszych stron zawodów. Kliknij zawód, żeby zobaczyć przykładowe CV i wskazówki.</p>
${[...POPULAR_SLUGS.map((s) => PROFESSIONS.find((p) => p.slug === s)), ...PROFESSIONS].filter((p, i, a) => p && a.indexOf(p) === i).slice(0, 20).map((p) => `<h3><a href="/cv/${p.slug}">CV ${esc(gen(p))}</a></h3><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>`).join('')}`,
  'time-calc': () => `<h2>Policz, ile czasu zajmuje dopasowanie</h2><p>Wpisz swoje wartości: ile ofert wysyłasz w tygodniu i ile minut zajmuje Ci dopasowanie jednego CV ręcznie, a ile po sprawdzeniu skanerem. Wartości w polach są tylko przykładowe.</p>
<form class="time-calc" novalidate><label class="f">Ofert w tygodniu<input type="number" name="n" min="1" max="200" value="10" inputmode="numeric"></label><label class="f">Minut na jedno CV ręcznie<input type="number" name="a" min="1" max="600" value="30" inputmode="numeric"></label><label class="f">Minut na jedno CV ze skanerem<input type="number" name="b" min="1" max="600" value="10" inputmode="numeric"></label><p class="calc-out" role="status"></p></form>`,
  'copy-test': () => `<h2>Sprawdź swój plik: test kopiowania</h2><p>Darmowe narzędzia pokażą tekst, który da się wyciągnąć z Twojego pliku, i ostrzegą o kolumnach, grafice i ikonach. Pliku ani treści CV nie zapisujemy.</p>${tools(['/narzedzia/sprawdz-cv', 'Sprawdź CV (test kopiowania)'], ['/narzedzia/test-cv-ats', 'Test CV pod ATS'])}`,
  scan: () => `<h2>Sprawdź swoje CV z ogłoszeniem</h2><p>Skaner porówna CV z wymaganiami z oferty i pokaże, czego w nim nie widać. Bez rejestracji; pliku ani treści CV nie zapisujemy.</p>${tools(['/narzedzia/skaner-cv', 'Skaner CV za darmo'], ['/narzedzia/test-cv-ats', 'Test CV pod ATS'])}`,
  'summary-gen': () => `<h2>Szkic podsumowania ze słów z ogłoszenia</h2><p>Wklej ogłoszenie, zaznacz słowa, które naprawdę Cię opisują, i dostaniesz szkic trzech zdań do uzupełnienia. Miejsca w nawiasach kwadratowych wypełnij sam. Ogłoszenia nie zapisujemy.</p>${adForm('sum-gen', 'Pokaż słowa z ogłoszenia')}`,
};
export const WIDGETS = Object.keys(W);
export const widgetHtml = (a) => (a.widget && W[a.widget] ? `<section class="widget" data-widget="${a.widget}">${W[a.widget]()}</section>` : '');
// Źródła pod artykułem (fakty i liczby tylko ze źródłami).
export const sourcesHtml = (src) => (src?.length ? `<h2>Źródła</h2><ul class="sources">${src.map((x) => `<li><a href="${esc(x.u)}" rel="noopener" target="_blank">${esc(x.t)}</a></li>`).join('')}</ul>` : '');
