import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { DIGITAL_WAIVER } from './products.js';

// Strona /dla-firm/sprawdz-ogloszenie (D4): wklejenie ogłoszenia → bezpłatnie wynik i 3 najważniejsze uwagi → zakup 19 zł z fakturą
// na firmę (NIP) → pełny raport na stronie i w PDF (public/ogloszenie.js → /api/ad-check/preview, /api/products/adcheck).
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
export const AD_DISCLAIMER = 'Raport ma charakter pomocniczy i nie jest poradą prawną. Decyzję o treści ogłoszenia podejmuje pracodawca.';
const FAQ = [
  ['Co sprawdzacie w ogłoszeniu?', 'Czytamy ogłoszenie tak jak kandydat: czy tytuł stanowiska jest jasny, czy obowiązki i wymagania są konkretne, czy jest informacja o wynagrodzeniu i warunkach pracy, jak aplikować, czy język jest neutralny i czy ogłoszenie nie prosi o niepotrzebne dane osobowe.'],
  ['Co dostanę bezpłatnie, a co po zakupie?', 'Bezpłatnie: ocenę 0–100, krótkie podsumowanie i 3 najważniejsze uwagi. Po zakupie: wszystkie uwagi z konkretnymi poprawkami, poprawioną wersję całego ogłoszenia i listę do sprawdzenia przed publikacją – na stronie i w PDF.'],
  ['Czy dopiszecie coś, czego nie ma w ogłoszeniu?', 'Nie. Opieramy się tylko na treści ogłoszenia. Tam, gdzie brakuje informacji (np. widełek wynagrodzenia), w poprawionej wersji wstawiamy znacznik [UZUPEŁNIJ: …], który uzupełniasz sam.'],
  ['Czy to porada prawna?', `Nie. Wskazujemy sformułowania, które mogą być odebrane jako dyskryminujące, i proponujemy neutralne brzmienie, ale ${AD_DISCLAIMER.charAt(0).toLowerCase()}${AD_DISCLAIMER.slice(1)}`],
  ['Jak wygląda faktura?', 'Usługa jest dla firm, więc fakturę wystawiamy na dane z NIP podane przy zakupie. Sprzedawca jest zwolniony z VAT – faktura bez VAT.'],
  ['Co dzieje się z treścią ogłoszenia?', 'Tekst ogłoszenia przekazujemy dostawcy AI wyłącznie do sprawdzenia. Wynik z podglądu przechowujemy 48 godzin, a po zakupie – jak dane zamówienia, 30 dni. Nie wklejaj danych osobowych kandydatów. Szczegóły w polityce prywatności.'],
];

function pageHtml() {
  const price = zl(PRICES.adcheck);
  return `<div class="inner narrow adc"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <a href="/dla-firm">Dla firm i uczelni</a> › <span>Sprawdzenie ogłoszenia</span></nav>
<h1>Sprawdzenie ogłoszenia o pracę – ${price}</h1>
<p class="lead">Wklej ogłoszenie, zanim je opublikujesz. Ocenimy je z perspektywy kandydata i pokażemy, co poprawić, żeby było jasne, konkretne i napisane neutralnym językiem. Wynik i 3 najważniejsze uwagi zobaczysz bezpłatnie.</p>
<form id="adForm" class="pass-form" novalidate>
<label class="f">Treść ogłoszenia<textarea id="adText" rows="12" maxlength="20000" placeholder="Stanowisko, obowiązki, wymagania, oferta, sposób aplikowania…"></textarea></label>
<p class="hint">Nie wklejaj danych osobowych kandydatów. Tekst trafia do dostawcy AI tylko po to, żeby sprawdzić ogłoszenie. Bezpłatnie najwyżej 3 sprawdzenia dziennie.</p>
<button class="btn lg" type="submit" id="adGo">Sprawdź ogłoszenie bezpłatnie</button>
<div class="fstatus" id="adStatus" role="status"></div>
</form>
<div id="adResult" class="adc-res" hidden></div>
<form id="adBuy" class="pass-form" novalidate hidden>
<h2 id="kup">Pełny raport – ${price}</h2>
<p>Wszystkie uwagi z poprawkami, poprawiona wersja ogłoszenia i lista do sprawdzenia przed publikacją – na tej stronie i w PDF na e-mail. Faktura na firmę (bez VAT – sprzedawca jest zwolniony z VAT).</p>
<label class="f">Adres e-mail (wyślemy na niego raport i fakturę)<input type="email" id="adEmail" autocomplete="email" required maxlength="160"></label>
<label class="f">Nazwa firmy<input type="text" id="adInvName" autocomplete="organization" maxlength="200" required></label>
<label class="f">Adres firmy<input type="text" id="adInvAddr" maxlength="250" required></label>
<label class="f">NIP<input type="text" id="adInvNip" inputmode="numeric" maxlength="16" required></label>
<label class="check"><input type="checkbox" id="adTerms"> <span>Akceptuję <a href="/regulamin">Regulamin</a> i <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span></label>
<label class="check"><input type="checkbox" id="adWaiver"> <span>${esc(DIGITAL_WAIVER)}</span></label>
<div class="gw-box" id="adGw"></div>
<button class="btn lg" type="submit" id="adPay">Kup pełny raport – ${price}</button>
<div class="fstatus" id="adPayStatus" role="status"></div>
</form>
<h2>Jak to działa</h2>
<ol class="tips"><li>Wklejasz treść ogłoszenia.</li><li>Dostajesz bezpłatnie ocenę 0–100 i 3 najważniejsze uwagi.</li><li>Jeśli chcesz, kupujesz pełny raport: wszystkie uwagi z poprawkami i poprawioną wersję ogłoszenia.</li><li>Uzupełniasz miejsca oznaczone [UZUPEŁNIJ: …] i publikujesz ogłoszenie.</li></ol>
<p>Potrzebujesz typowych obowiązków i wymagań dla stanowiska? Zobacz <a href="/zawod/zakres-obowiazkow">zakresy obowiązków dla wybranych zawodów</a>.</p>
<p class="perk">${esc(AD_DISCLAIMER)}</p>
<h2>Najczęstsze pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="sub2 small">Cena końcowa ${price}. Sprzedawca zwolniony z VAT. Płatność jednorazowa online.</p></div>`;
}

export function adCheckPageRoutes(app, BASE_URL) {
  app.get('/dla-firm/sprawdz-ogloszenie', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'dla-firm/sprawdz-ogloszenie', { title: 'Sprawdzenie ogłoszenia o pracę', seoTitle: `Sprawdzenie ogłoszenia o pracę dla pracodawców – ${zl(PRICES.adcheck)}`, metaDescription: 'Wklej ogłoszenie o pracę i sprawdź je przed publikacją: ocena, uwagi z poprawkami, neutralny język i poprawiona wersja ogłoszenia. Wynik i 3 uwagi bezpłatnie, faktura z NIP.' },
      pageHtml(), { script: '/ogloszenie.js', data: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  });
}
