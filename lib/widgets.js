// Elementy interaktywne poradników (pole „widget” artykułu): HTML z serwera, obsługa w public/lite.js.
// keywords – wyciągacz słów z ogłoszenia (/api/ad-keywords) + listy słów dla 20 zawodów z danych serwisu;
// time-calc – kalkulator czasu dopasowania (wartości wpisuje czytelnik); copy-test / scan – wezwanie do darmowych narzędzi;
// summary-gen – szkic podsumowania ze słów z ogłoszenia (tylko wybrane przez czytelnika słowa, z miejscami do uzupełnienia).
import { PROFESSIONS, POPULAR_SLUGS } from './content.js';
import { PROF_LANGS } from './professions-i18n.js';
import { toolUrl } from './tools-i18n.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gen = (p) => /^CV (.+?):/.exec(p.title)?.[1] || p.name;
// method="post" i ukryty przycisk do startu skryptu: bez JS treść ogłoszenia nie trafia do adresu (logi, Referer).
const NOJS = '<noscript><p class="hint small">To narzędzie działa po włączeniu JavaScriptu w przeglądarce.</p></noscript>';
const adForm = (cls, btn) => `<form class="${cls} paste-ad" method="post" novalidate><label class="f">Treść ogłoszenia<textarea name="ad" rows="5"></textarea></label><button class="btn" type="submit" hidden>${esc(btn)}</button>${NOJS}<p class="fstatus" role="status"></p><div class="w-out"></div></form>`;
// Wynik kalkulatora dla wartości przykładowych (SSR; ten sam tekst liczy public/lite.js po zmianie pól).
export const calcText = (n, a, b) => { const h = (m) => (Math.round((m / 60) * 10) / 10).toLocaleString('pl-PL'); return `Ręcznie: ok. ${h(n * a)} godz. tygodniowo. Ze skanerem: ok. ${h(n * b)} godz. Różnica: ok. ${h(Math.max(0, n * a - n * b))} godz. tygodniowo.`; };
const tools = (a, b) => `<p class="prof-cta"><a class="btn ghost" href="${a[0]}">${esc(a[1])}</a> <a class="btn" href="${b[0]}">${esc(b[1])}</a></p>`;

const W = {
  keywords: () => `<h2>Wyciągnij słowa kluczowe z ogłoszenia</h2><p>Wklej treść ogłoszenia, a pokażemy wymagania i słowa, które warto mieć w CV – jeśli są prawdą o Tobie. Ogłoszenia nie zapisujemy.</p>${adForm('kw-extract', 'Pokaż słowa kluczowe')}
<h2>Słowa kluczowe dla 20 zawodów</h2><p>Typowe słowa z ogłoszeń zebrane na naszych stronach zawodów. Kliknij zawód, żeby zobaczyć przykładowe CV i wskazówki.</p>
${[...POPULAR_SLUGS.map((s) => PROFESSIONS.find((p) => p.slug === s)), ...PROFESSIONS].filter((p, i, a) => p && a.indexOf(p) === i).slice(0, 20).map((p) => `<h3><a href="/cv/${p.slug}">CV ${esc(gen(p))}</a></h3><div class="kw">${p.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>`).join('')}`,
  'time-calc': () => `<h2>Policz, ile czasu zajmuje dopasowanie</h2><p>Wpisz swoje wartości: ile ofert wysyłasz w tygodniu i ile minut zajmuje Ci dopasowanie jednego CV ręcznie, a ile po sprawdzeniu skanerem. Wartości w polach są tylko przykładowe.</p>
<form class="time-calc" method="post" novalidate><label class="f">Ofert w tygodniu<input type="number" name="n" min="1" max="200" value="10" inputmode="numeric"></label><label class="f">Minut na jedno CV ręcznie<input type="number" name="a" min="1" max="600" value="30" inputmode="numeric"></label><label class="f">Minut na jedno CV ze skanerem<input type="number" name="b" min="1" max="600" value="10" inputmode="numeric"></label><p class="calc-out" role="status">${calcText(10, 30, 10)}</p></form>`,
  'copy-test': () => `<h2>Sprawdź swój plik: test kopiowania</h2><p>Darmowe narzędzia pokażą tekst, który da się wyciągnąć z Twojego pliku, i ostrzegą o kolumnach, grafice i ikonach. Pliku ani treści CV nie zapisujemy.</p>${tools(['/narzedzia/sprawdz-cv', 'Sprawdź CV (test kopiowania)'], ['/narzedzia/test-cv-ats', 'Test CV pod ATS'])}`,
  scan: () => `<h2>Sprawdź swoje CV z ogłoszeniem</h2><p>Skaner porówna CV z wymaganiami z oferty i pokaże, czego w nim nie widać. Bez rejestracji; pliku ani treści CV nie zapisujemy.</p>${tools(['/narzedzia/skaner-cv', 'Skaner CV za darmo'], ['/narzedzia/test-cv-ats', 'Test CV pod ATS'])}`,
  'summary-gen': () => `<h2>Szkic podsumowania ze słów z ogłoszenia</h2><p>Wklej ogłoszenie, zaznacz słowa, które naprawdę Cię opisują, i dostaniesz szkic trzech zdań do uzupełnienia. Miejsca w nawiasach kwadratowych wypełnij sam. Ogłoszenia nie zapisujemy.</p>${adForm('sum-gen', 'Pokaż słowa z ogłoszenia')}`,
};
// Wersje EN/DE (poradniki /en/guides, /de/ratgeber): wyciągacz z językiem w data-lang (lib/ad-keywords.js), listy zawodów
// z danych stron zawodów w tym języku (DE: 15, EN: 20) i wezwanie do narzędzi w tym języku.
const POP = [...POPULAR_SLUGS.map((s) => PROFESSIONS.find((p) => p.slug === s)), ...PROFESSIONS].filter((p, i, a) => p && a.indexOf(p) === i);
const plOnly = (k) => k.replace(/\s*\([^)]*[ąćęłńóśźż][^)]*\)/gi, '');
const WT = {
  en: { n: 20, kwH: 'Extract keywords from a job ad', kwP: 'Paste the text of a job ad and we will list the requirements and words worth having in your CV – if they are true for you. We do not store the ad.', label: 'Job ad text', btn: 'Show keywords', none: 'We could not find requirements in this text. Paste the full job ad, including the requirements section.', linkErr: 'Paste the text of the ad instead of the link.', noJs: 'This tool works when JavaScript is enabled in your browser.',
    listH: 'CV keywords for 20 jobs', listP: 'Typical words from job ads, taken from our job pages. Click a job to see an example CV and tips.', scanH: 'Check your CV against a job ad', scanP: 'The scanner compares your CV with the requirements in the ad and shows what is missing. No sign-up; we do not store the file.', scan: 'Free CV scanner', ats: 'ATS CV checker' },
  de: { n: 15, kwH: 'Schlüsselwörter aus einer Stellenanzeige ziehen', kwP: 'Fügen Sie den Text einer Stellenanzeige ein. Wir zeigen die Anforderungen und Begriffe, die in Ihren Lebenslauf gehören – wenn sie auf Sie zutreffen. Die Anzeige wird nicht gespeichert.', label: 'Text der Stellenanzeige', btn: 'Schlüsselwörter zeigen', none: 'In diesem Text haben wir keine Anforderungen gefunden. Fügen Sie die vollständige Anzeige mit dem Abschnitt „Ihr Profil“ oder „Anforderungen“ ein.', linkErr: 'Fügen Sie statt des Links den Text der Anzeige ein.', noJs: 'Dieses Werkzeug funktioniert, wenn JavaScript im Browser aktiviert ist.',
    listH: 'Schlüsselwörter für 15 Berufe', listP: 'Typische Begriffe aus Stellenanzeigen, aus unseren Berufsseiten. Klicken Sie auf einen Beruf, um ein Beispiel und Tipps zu sehen.', scanH: 'Lebenslauf mit einer Stellenanzeige prüfen', scanP: 'Der Scanner vergleicht Ihren Lebenslauf mit den Anforderungen der Anzeige und zeigt, was fehlt. Ohne Registrierung; die Datei wird nicht gespeichert.', scan: 'Kostenloser Lebenslauf-Scanner', ats: 'Lebenslauf-ATS-Test' },
};
const WL = {
  keywords: (l, t) => `<h2>${esc(t.kwH)}</h2><p>${esc(t.kwP)}</p><form class="kw-extract paste-ad" method="post" data-lang="${l}" data-none="${esc(t.none)}" data-linkerr="${esc(t.linkErr)}" novalidate><label class="f">${esc(t.label)}<textarea name="ad" rows="5"></textarea></label><button class="btn" type="submit" hidden>${esc(t.btn)}</button><noscript><p class="hint small">${esc(t.noJs)}</p></noscript><p class="fstatus" role="status"></p><div class="w-out"></div></form>
<h2>${esc(t.listH)}</h2><p>${esc(t.listP)}</p>
${POP.filter((p) => PROF_LANGS[l].prof[p.slug]).slice(0, t.n).map((p) => { const x = PROF_LANGS[l].prof[p.slug]; return `<h3><a href="/${l}/${PROF_LANGS[l].seg}/${x.slugLang}">${esc(x.name)}</a></h3><div class="kw">${x.keywords.map((k) => `<span>${esc(plOnly(k))}</span>`).join('')}</div>`; }).join('')}`,
  scan: (l, t) => `<h2>${esc(t.scanH)}</h2><p>${esc(t.scanP)}</p><p class="prof-cta"><a class="btn ghost" href="/${toolUrl(l, 'skaner-cv')}">${esc(t.scan)}</a> <a class="btn" href="/${toolUrl(l, 'test-cv-ats')}">${esc(t.ats)}</a></p>`,
};
export const WIDGETS = Object.keys(W);
export const widgetHtml = (a, l = 'pl') => {
  if (!a.widget) return '';
  const html = l === 'pl' ? W[a.widget]?.() : WT[l] && WL[a.widget]?.(l, WT[l]);
  return html ? `<section class="widget" data-widget="${a.widget}">${html}</section>` : '';
};
// Źródła pod artykułem (fakty i liczby tylko ze źródłami).
export const sourcesHtml = (src) => (src?.length ? `<h2>Źródła</h2><ul class="sources">${src.map((x) => `<li><a href="${esc(x.u)}" rel="noopener" target="_blank">${esc(x.t)}</a></li>`).join('')}</ul>` : '');
