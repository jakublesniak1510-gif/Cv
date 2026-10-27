import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { DIGITAL_WAIVER } from './products.js';
import { legalBody } from './legal.js';
import { selectionEnabled, SEL_HEADER, DPA_VERSION } from './selection.js';

// Strona /dla-firm/selekcja-cv (D8) i umowa powierzenia /regulamin/umowa-powierzenia – obie tylko przy SELECTION_ENABLED=1 (inaczej 404).
// public/selekcja.js: wymagania z ogłoszenia → wgrywanie CV → zakup → tabela wymagań (bez rankingu).
const zl = (gr) => `${gr / 100} zł`;
export const DPA_PATH = '/regulamin/umowa-powierzenia';
const FAQ = [
  ['Czy narzędzie wybiera kandydatów?', `Nie. ${SEL_HEADER} Pokazujemy tylko, czy w CV jest informacja potwierdzająca każde wymaganie, z cytatem. Nie układamy rankingu, nie liczymy punktów i nie oceniamy ludzi.`],
  ['Co z danymi o wieku, płci czy zdrowiu?', 'Przed analizą usuwamy z CV linie z takimi danymi (np. data urodzenia, stan cywilny, obywatelstwo) i numery PESEL. Wymagań dotyczących cech chronionych (np. „do 35 lat”, „kobieta”) nie sprawdzamy – pokazujemy je jako pominięte.'],
  ['Kto odpowiada za dane kandydatów?', `Firma jest administratorem danych kandydatów, a my – podmiotem przetwarzającym na podstawie umowy powierzenia (art. 28 RODO), którą akceptujesz przy zakupie (wersja ${DPA_VERSION}).`],
  ['Jak długo przechowujecie CV?', 'Zapisujemy tylko tekst CV (bez plików) z usuniętymi danymi chronionymi. Teksty i wyniki usuwamy po 7 dniach od zakupu, a niezamówione wersje robocze po 48 godzinach. Danych nie używamy do trenowania modeli AI.'],
];

function pageHtml() {
  const p20 = zl(PRICES.selection20), p50 = zl(PRICES.selection50);
  const inp = (id, label, attrs = '') => `<label class="f">${label}<input type="text" id="${id}" ${attrs}></label>`;
  return `<div class="inner narrow sel"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <a href="/dla-firm">Dla firm i uczelni</a> › <span>Selekcja CV</span></nav>
<h1>Selekcja CV dla małych firm: tabela wymagań – od ${p20}</h1>
<div class="perk sel-head" role="note"><b>${esc(SEL_HEADER)}</b></div>
<p class="lead">Wklej ogłoszenie i wgraj CV kandydatów. Dla każdego CV dostaniesz tabelę: przy każdym wymaganiu „tak”, „częściowo” albo „nie” z cytatem z CV. Bez rankingu i bez oceny ludzi – kandydaci są w kolejności wgrania.</p>
<form id="selForm" class="pass-form" novalidate>
<h2>1. Ogłoszenie</h2>
<label class="f">Treść ogłoszenia z wymaganiami<textarea id="selAd" rows="8" maxlength="15000"></textarea></label>
<button class="btn" type="submit" id="selReqGo">Wypisz wymagania (bezpłatnie)</button>
<div class="fstatus" id="selStatus" role="status"></div>
</form>
<div id="selReq" class="pass-form" hidden>
<h2>2. Wymagania do sprawdzenia</h2>
<p class="hint">Możesz poprawić, usunąć albo dopisać wymaganie. Wymagań dotyczących cech chronionych nie sprawdzamy.</p>
<div id="selReqList" class="sel-req"></div>
<button type="button" class="btn ghost sm" id="selReqAdd">+ Dodaj wymaganie</button>
<div id="selExcluded"></div>
<div class="sel-prev" id="selPrev"></div>
<h2>3. CV kandydatów</h2>
<label class="f">Pliki CV (PDF, Word albo TXT, do 4 MB każdy; najwyżej 50)<input type="file" id="selFiles" accept=".pdf,.docx,.txt" multiple></label>
<p class="hint">Zapisujemy tylko tekst CV, bez plików, i usuwamy z niego dane o cechach chronionych.</p>
<ol id="selCvList" class="sel-cvs"></ol>
<div class="fstatus" id="selCvStatus" role="status"></div>
</div>
<form id="selBuy" class="pass-form" novalidate hidden>
<h2 id="kup">4. Zamówienie</h2>
<label class="check"><input type="radio" name="selVar" value="20" checked> <span><b>Do 20 CV – ${p20}</b></span></label>
<label class="check"><input type="radio" name="selVar" value="50"> <span><b>Do 50 CV – ${p50}</b></span></label>
<label class="f">Adres e-mail (wyślemy tabelę i fakturę)<input type="email" id="selEmail" autocomplete="email" required maxlength="160"></label>
${inp('selInvName', 'Nazwa firmy', 'maxlength="200" autocomplete="organization"')}${inp('selInvAddr', 'Adres firmy', 'maxlength="250"')}${inp('selInvNip', 'NIP', 'inputmode="numeric" maxlength="16"')}
<label class="check"><input type="checkbox" id="selTerms"> <span>Akceptuję <a href="/regulamin">Regulamin</a> i <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span></label>
<label class="check"><input type="checkbox" id="selDpa"> <span>Akceptuję <a href="${DPA_PATH}" target="_blank" rel="noopener">umowę powierzenia przetwarzania danych osobowych</a> (art. 28 RODO, wersja ${DPA_VERSION}). Jestem administratorem danych kandydatów.</span></label>
<label class="check"><input type="checkbox" id="selWaiver"> <span>${esc(DIGITAL_WAIVER)}</span></label>
<div class="gw-box" id="selGw"></div>
<button class="btn lg" type="submit" id="selPay">Zamów tabelę – ${p20}</button>
<div class="fstatus" id="selPayStatus" role="status"></div>
</form>
<div id="selOut" class="sel-out" hidden></div>
<h2>Najczęstsze pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="sub2 small">Ceny końcowe: do 20 CV ${p20}, do 50 CV ${p50}. Sprzedawca zwolniony z VAT. Faktura na firmę z NIP.</p></div>`;
}

export function selectionPageRoutes(app, BASE_URL) {
  app.get('/dla-firm/selekcja-cv', (req, res, next) => {
    if (!selectionEnabled()) return next();
    res.set('Cache-Control', 'no-store');
    ssrPage(res, BASE_URL, 'dla-firm/selekcja-cv', { title: 'Selekcja CV dla małych firm', seoTitle: `Selekcja CV dla małych firm – tabela wymagań od ${zl(PRICES.selection20)}`, metaDescription: 'Wklej ogłoszenie i wgraj CV: tabela wymagań tak/częściowo/nie z cytatem z CV, bez rankingu i bez danych o cechach chronionych. Decyzję podejmuje człowiek.' },
      pageHtml(), { script: '/selekcja.js', data: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  });
  // Umowa powierzenia: wersja polska wiążąca, tłumaczenia pomocnicze (public/legal/powierzenie.html).
  app.get(DPA_PATH, (req, res, next) => {
    if (!selectionEnabled()) return next();
    const tr = ['en', 'uk', 'de'].map((l) => `<details lang="${l}"><summary>${{ en: 'English (translation)', uk: 'Українською (переклад)', de: 'Deutsch (Übersetzung)' }[l]}</summary>${legalBody('powierzenie', l)}</details>`).join('');
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, DPA_PATH.slice(1), { title: 'Umowa powierzenia przetwarzania danych', metaDescription: `Umowa powierzenia przetwarzania danych osobowych (art. 28 RODO) do usługi „Selekcja CV”, wersja ${DPA_VERSION}.` },
      `<div class="inner narrow legal">${legalBody('powierzenie', 'pl')}${tr}</div>`, { noindex: true });
  });
}
