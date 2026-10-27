import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { DIGITAL_WAIVER } from './products.js';
import { PLATFORMS, UNITS, SHORT_MAX, PACK_USES, PACK_DAYS } from './offer.js';

// Strona /uslugi/oferta-na-zlecenie (D6): formularz → podgląd (pierwsze zdanie, rozmyta reszta) → 29 zł, pakiet 5 ofert za 99 zł
// albo kod z pakietu (public/oferta.js → /api/offer/*, /api/products/offer, /api/products/offerpack).
const zl = (gr) => `${gr / 100} zł`;
const FAQ = [
  ['Co dostanę?', `Krótką odpowiedź do wysłania w okienku wiadomości (do ok. ${SHORT_MAX} znaków), dłuższą ofertę, wycenę w punktach i 3–7 pytań, o które warto dopytać klienta. Wszystko na stronie, do skopiowania, i w pliku na e-mail.`],
  ['Skąd biorą się ceny w ofercie?', 'Tylko od Ciebie. Wycenę układamy z pozycji, które wpiszesz. Jeśli ich nie podasz, oferta mówi, że cenę podasz po doprecyzowaniu. Kwoty w tekście, których nie ma w Twoich danych, zamieniamy na „[założenie: …]”.'],
  ['Czy dopiszecie mi doświadczenie albo referencje?', 'Nie. Piszemy o Tobie tylko to, co podasz w polu „O mnie”. Nie wymyślamy opinii, realizacji, certyfikatów ani lat doświadczenia – jeśli tekst wspomni liczbę lat, której nie ma w Twoich danych, zobaczysz „[UZUPEŁNIJ: liczba lat]”.'],
  ['Jak działa pakiet 5 ofert?', `Za ${zl(PRICES.offerpack)} dostajesz kod na ${PACK_USES} ofert ważny ${PACK_DAYS} dni. Oferta z bieżącego podglądu to pierwsza z nich. Przy kolejnym zleceniu wypełniasz formularz, oglądasz podgląd i wpisujesz kod zamiast płacić.`],
  ['Czy gwarantujecie, że dostanę zlecenie?', 'Nie. Pomagamy szybko napisać konkretną, uprzejmą odpowiedź, ale wybór wykonawcy należy do klienta.'],
  ['Co dzieje się z treścią zlecenia?', 'Treść zlecenia i Twoje dane przekazujemy dostawcy AI wyłącznie do przygotowania oferty. Podgląd przechowujemy 48 godzin, a po zakupie – jak dane zamówienia, 30 dni.'],
];

function pageHtml() {
  const one = zl(PRICES.offer), pack = zl(PRICES.offerpack);
  const inp = (id, label, attrs = '') => `<label class="f">${label}<input type="text" id="${id}" ${attrs}></label>`;
  return `<div class="inner narrow ofr"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Oferta na zlecenie</span></nav>
<h1>Oferta na zlecenie dla fachowców – ${one}</h1>
<p class="lead">Wklej zlecenie z Fixly, Oferteo, Useme, OLX albo grupy na Facebooku i napisz kilka słów o sobie. Dostaniesz krótką odpowiedź do wysłania, dłuższą ofertę, wycenę w punktach i pytania do klienta. Ceny podajesz Ty – my ich nie wymyślamy.</p>
<form id="ofForm" class="pass-form" novalidate>
<label class="f">Treść zlecenia<textarea id="ofJob" rows="7" maxlength="5000" placeholder="Wklej ogłoszenie albo wiadomość klienta"></textarea></label>
<div class="grid2">${inp('ofTrade', 'Czym się zajmujesz', 'maxlength="120" placeholder="np. hydraulik, grafik, tłumacz"')}<label class="f">Gdzie odpowiadasz<select id="ofPlatform">${Object.entries(PLATFORMS).map(([k, v]) => `<option value="${k}">${esc(v.charAt(0).toUpperCase() + v.slice(1))}</option>`).join('')}</select></label></div>
<label class="f">O mnie: doświadczenie, uprawnienia, narzędzia (tylko prawdziwe)<textarea id="ofAbout" rows="3" maxlength="2000"></textarea></label>
<div class="grid2">${inp('ofArea', 'Obszar działania', 'maxlength="120" placeholder="np. Kraków i okolice"')}${inp('ofTerm', 'Kiedy możesz zacząć', 'maxlength="200" placeholder="np. od poniedziałku"')}</div>
<div class="grid2">${inp('ofName', 'Podpis (imię albo nazwa firmy)', 'maxlength="120"')}${inp('ofContact', 'Kontakt w podpisie (opcjonalnie)', 'maxlength="200"')}</div>
${inp('ofWarranty', 'Gwarancja (jeśli dajesz)', 'maxlength="200"')}
<h2 class="h3">Wycena (opcjonalnie)</h2>
<p class="hint">Wpisz swoje ceny. Bez cen oferta powie, że wycenę podasz po doprecyzowaniu zlecenia.</p>
<div id="ofItems" class="grt-rows"></div>
<button type="button" class="btn ghost sm" id="ofItemAdd">+ Dodaj pozycję</button>
<label class="f">Ton<select id="ofTone"><option value="uprzejmy">Uprzejmy, rzeczowy</option><option value="swobodny">Swobodny</option></select></label>
<button class="btn lg" type="submit" id="ofGo">Pokaż podgląd oferty</button>
<p class="hint">Podgląd jest bezpłatny (najwyżej 3 dziennie).</p>
<div class="fstatus" id="ofStatus" role="status"></div>
</form>
<div id="ofPrev" class="ofr-prev" hidden></div>
<form id="ofBuy" class="pass-form" novalidate hidden>
<h2 id="kup">Odblokuj ofertę</h2>
<label class="check"><input type="radio" name="ofPkg" value="offer" checked> <span><b>Ta oferta – ${one}</b></span></label>
<label class="check"><input type="radio" name="ofPkg" value="offerpack"> <span><b>Pakiet ${PACK_USES} ofert – ${pack}</b>: kod ważny ${PACK_DAYS} dni, ta oferta to pierwsza z ${PACK_USES}.</span></label>
<label class="f">Adres e-mail (wyślemy na niego ofertę albo kod pakietu)<input type="email" id="ofEmail" autocomplete="email" required maxlength="160"></label>
<label class="check"><input type="checkbox" id="ofInv"> <span>Potrzebuję faktury (bez VAT – sprzedawca jest zwolniony z VAT).</span></label>
<div id="ofInvBox" hidden>${inp('ofInvName', 'Nazwa firmy albo imię i nazwisko', 'maxlength="200"')}${inp('ofInvAddr', 'Adres', 'maxlength="250"')}${inp('ofInvNip', 'NIP (pomiń, jeśli kupujesz prywatnie)', 'inputmode="numeric" maxlength="16"')}</div>
<label class="check"><input type="checkbox" id="ofTerms"> <span>Akceptuję <a href="/regulamin">Regulamin</a> i <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span></label>
<label class="check"><input type="checkbox" id="ofWaiver"> <span>${esc(DIGITAL_WAIVER)}</span></label>
<div class="gw-box" id="ofGw"></div>
<button class="btn lg" type="submit" id="ofPay">Kup ofertę – ${one}</button>
<div class="fstatus" id="ofPayStatus" role="status"></div>
<details id="ofCodeBox"><summary>Masz kod z pakietu?</summary>${inp('ofCode', 'Kod (OF-XXXX-XXXX)', 'maxlength="20" autocomplete="off"')}<button type="button" class="btn ghost" id="ofCodeGo">Użyj kodu</button><div class="fstatus" id="ofCodeStatus" role="status"></div></details>
</form>
<div id="ofOut" class="ofr-out" hidden></div>
<h2>Jak to działa</h2>
<ol class="tips"><li>Wklejasz zlecenie i piszesz kilka słów o sobie, a jeśli chcesz – swoje ceny.</li><li>Oglądasz podgląd: początek odpowiedzi i Twoją wycenę.</li><li>Płacisz ${one} (albo ${pack} za pakiet ${PACK_USES} ofert) lub wpisujesz kod z pakietu.</li><li>Kopiujesz odpowiedź, sprawdzasz ją i wysyłasz klientowi.</li></ol>
<h2>Najczęstsze pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="sub2 small">Ceny końcowe: oferta ${one}, pakiet ${PACK_USES} ofert ${pack}. Sprzedawca zwolniony z VAT. Płatność jednorazowa online.</p>
<template id="ofUnits">${UNITS.map((u) => `<option>${u}</option>`).join('')}</template></div>`;
}

export function offerPageRoutes(app, BASE_URL) {
  app.get('/uslugi/oferta-na-zlecenie', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'uslugi/oferta-na-zlecenie', { title: 'Oferta na zlecenie', seoTitle: `Oferta na zlecenie dla fachowców – odpowiedź, wycena i pytania – ${zl(PRICES.offer)}`, metaDescription: 'Wklej zlecenie z Fixly, Oferteo, Useme albo OLX: krótka odpowiedź, dłuższa oferta, wycena w punktach z Twoich cen i pytania do klienta. Podgląd za darmo.' },
      pageHtml(), { script: '/oferta.js', data: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  });
}
