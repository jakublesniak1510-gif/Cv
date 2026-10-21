// Sekcja „Przed i po” na stronie głównej: fikcyjne ogłoszenie i dwa fragmenty CV tej samej fikcyjnej osoby.
// Procent dopasowania liczymy naszym skanerem słów kluczowych (lib/tailor.js: scanFallback) na dokładnie tych tekstach,
// więc liczby na stronie zawsze zgadzają się z wynikiem skanera. Treść statyczna – bez zapytań do AI.
import { scanFallback } from './tailor.js';
import { scoreOf } from './generate.js';

export const BA = {
  adTitle: 'Magazynier z obsługą wózka widłowego – Poznań',
  ad: 'Magazynier z obsługą wózka widłowego – Poznań.\nWymagania: uprawnienia UDT, obsługa skanera, gotowość do pracy zmianowej, znajomość systemu WMS.\nMile widziane: doświadczenie w e-commerce.',
  name: 'Tomasz Przykładowy',
  role: 'Magazynier · Sklep internetowy „Paczuszka” · 2021 – obecnie',
  before: {
    summary: 'Jestem osobą sumienną i pracowitą. Szukam stabilnej pracy w dobrej firmie.',
    bullets: ['Praca na magazynie', 'Rozładunek dostaw i układanie towaru na regałach', 'Pakowanie paczek do wysyłki'],
  },
  // [[…]] = słowo z ogłoszenia (zaznaczone na stronie).
  after: {
    summary: 'Magazynier z [[uprawnieniami UDT]] na wózki widłowe i 3-letnim [[doświadczeniem w e-commerce]]. Na co dzień pracuję ze [[skanerem]] i jestem gotowy do [[pracy zmianowej]].',
    bullets: ['Kompletacja zamówień sklepu internetowego ([[e-commerce]]) z użyciem [[skanera]] – ok. 250 paczek na zmianę', 'Rozładunek dostaw wózkiem widłowym ([[uprawnienia UDT]])', 'Praca w trybie [[zmianowym]] (3 zmiany)'],
  },
};
const plain = (s) => s.replace(/\[\[|\]\]/g, '');
// Tekst fragmentu CV dokładnie tak, jak widać go na stronie (z nagłówkami sekcji).
export const baText = (side) => [BA.name, BA.role, 'Podsumowanie', plain(BA[side].summary), 'Zadania', ...BA[side].bullets.map(plain)].join('\n');
export function baScores() {
  const s = (side) => { const r = scanFallback({ cvText: baText(side), adText: BA.ad }); return { score: scoreOf(r), found: r.found, missing: r.missing.map((m) => m.keyword) }; };
  return { before: s('before'), after: s('after') };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const marked = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
const card = (side, label, score) => `<article class="ba-card ba-${side}" id="ba-${side}" role="tabpanel" aria-labelledby="ba-t-${side}">
<div class="ba-tag${side === 'after' ? ' good' : ''}"><span>${label}</span> · ${score}%</div>
<div class="ba-name">${esc(BA.name)}</div><div class="ba-role">${esc(BA.role)}</div>
<div class="ba-h">Podsumowanie</div><p>${marked(BA[side].summary)}</p>
<div class="ba-h">Zadania</div><ul>${BA[side].bullets.map((b) => `<li>${marked(b)}</li>`).join('')}</ul></article>`;

// Sekcja wstawiana w miejsce <!--przed-po--> w public/index.html (lib/seo.js). price: cena CV w groszach.
export function baHtml(price) {
  const s = baScores(), zl = `${price % 100 ? (price / 100).toFixed(2).replace('.', ',') : price / 100} zł`;
  const [, req, nice] = BA.ad.split('\n');
  return `<section class="sec" id="przed-po"><div class="inner">
  <h2>Przed i po: to samo doświadczenie, inne CV</h2>
  <p class="sub2">To samo doświadczenie opisane ogólnie i językiem ogłoszenia. Zaznaczone są słowa z ogłoszenia, a procent to wynik naszego skanera dla tych tekstów.</p>
  <p class="ba-fict">Przykład – dane fikcyjne</p>
  <div class="ba-ad"><div class="ba-k">Ogłoszenie</div><b>${esc(BA.adTitle)}</b><p>${esc(req)}</p><p>${esc(nice)}</p></div>
  <div class="ba-tabs" role="tablist" aria-label="Porównanie CV"><button type="button" role="tab" id="ba-t-before" aria-controls="ba-before" aria-selected="false">Przed</button><button type="button" role="tab" id="ba-t-after" aria-controls="ba-after" aria-selected="true">Po</button></div>
  <div class="ba2" data-show="after">${card('before', 'Przed', s.before.score)}${card('after', 'Po', s.after.score)}</div>
  <p class="ba-score"><span>Dopasowanie do ogłoszenia</span>: <span>przed</span> <b>${s.before.score}%</b>, <span>po</span> <b>${s.after.score}%</b></p>
  <p class="ba-note">Przykład z fikcyjnymi danymi. Procent to dopasowanie słów kluczowych do ogłoszenia, nie gwarancja zaproszenia na rozmowę.</p>
  ${s.after.missing.length ? `<p class="hint ba-miss"><span>Wymagania, których ta osoba nie spełnia, nie dopisujemy – zostają w raporcie jako brak:</span> ${s.after.missing.map(esc).join(', ')}.</p>` : ''}
  <p class="ba-cta"><button class="btn" data-open><span>Zrób takie CV pod swoje ogłoszenie – od</span> ${zl}</button> <a class="btn ghost" href="/narzedzia/skaner-cv">Sprawdź za darmo, ile pasujesz</a></p>
</div></section>`;
}
