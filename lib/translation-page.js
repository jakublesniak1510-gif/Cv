import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { TR_LANGS, TR_BETA, TR_TPLS } from './translation.js';
import { DIGITAL_WAIVER } from './products.js';

// Strona /tlumaczenie-cv (D3): wgranie CV albo tekst, język, szablon → podgląd strony 1 (jak C1) → zakup 19 zł
// (public/tlumaczenie.js → /api/translate/preview, /api/products/translation), powrót z płatności z linkami do PDF i DOCX.
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
export const SWORN_NOTE = 'To nie jest tłumaczenie przysięgłe (uwierzytelnione). Jeśli urząd albo pracodawca wymaga tłumaczenia przysięgłego, potrzebny jest tłumacz przysięgły.';
const TPL_NAMES = { nowoczesny: 'Nowoczesny', klasyczny: 'Klasyczny', szwajcarski: 'Szwajcarski' };
const FAQ = [
  ['Czy tłumaczenie zmienia treść mojego CV?', 'Nie. Tłumaczymy wiernie: te same stanowiska, firmy, szkoły, daty i obowiązki, w tej samej kolejności. Nazwy firm i szkół zostają w oryginale. Niczego nie dopisujemy.'],
  ['Czy to tłumaczenie przysięgłe?', SWORN_NOTE],
  ['Co znaczy „wersja beta” przy niektórych językach?', 'Francuski, niderlandzki, norweski, czeski, włoski i hiszpański tłumaczymy tak samo, ale mamy w nich mniej sprawdzonych przykładów. Najlepiej poproś osobę znającą język, żeby przeczytała CV przed wysłaniem.'],
  ['Co dostanę po zakupie?', 'Przetłumaczone CV w PDF (w wybranym szablonie) i w Word (DOCX), do pobrania na tej stronie i e-mailem. To dokładnie to tłumaczenie, którego pierwszą stronę widzisz w podglądzie.'],
  ['Co dzieje się z moim CV?', 'Tekst CV przekazujemy dostawcy AI wyłącznie do przetłumaczenia. Tłumaczenie z podglądu przechowujemy 48 godzin, a po zakupie – jak dane zamówienia, 30 dni. Szczegóły w polityce prywatności.'],
];

function pageHtml() {
  const price = zl(PRICES.translation);
  const opt = (o) => Object.entries(o).map(([k, v]) => `<option value="${k}">${esc(v)}${TR_BETA[k] ? ' (beta)' : ''}</option>`).join('');
  return `<div class="inner narrow trl"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Tłumaczenie CV</span></nav>
<h1>Tłumaczenie CV na angielski, niemiecki i inne języki – ${price}</h1>
<p class="lead">Wgraj swoje CV (PDF, Word albo tekst) i wybierz język. Przetłumaczymy je wiernie i ułożymy w czytelnym szablonie. Zanim zapłacisz, zobaczysz pierwszą stronę tłumaczenia.</p>
<p class="perk"><b>${esc(SWORN_NOTE)}</b></p>
<form id="trForm" class="pass-form" novalidate>
<label class="f">Plik CV (PDF, DOCX lub TXT, do 5 MB)<input type="file" id="trFile" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"></label>
<details id="trPaste"><summary>albo wklej treść CV</summary><label class="f">Treść CV<textarea id="trText" rows="8" maxlength="30000"></textarea></label></details>
<div class="grid2"><label class="f">Język tłumaczenia<select id="trLang"><optgroup label="Języki">${opt(TR_LANGS)}</optgroup><optgroup label="Wersja beta">${opt(TR_BETA)}</optgroup></select></label>
<label class="f">Szablon<select id="trTpl">${TR_TPLS.map((t) => `<option value="${t}">${esc(TPL_NAMES[t])}</option>`).join('')}</select></label></div>
<p class="hint" id="trBetaNote" hidden>Wersja beta: przed wysłaniem poproś osobę znającą ten język o przeczytanie CV.</p>
<button class="btn lg" type="submit" id="trGo">Pokaż podgląd tłumaczenia</button>
<p class="hint">Podgląd jest bezpłatny (najwyżej 3 dziennie). Tekst CV trafia do dostawcy AI tylko po to, żeby go przetłumaczyć.</p>
<div class="fstatus" id="trStatus" role="status"></div>
</form>
<div class="trl-img" id="trImg"></div>
<form id="trBuy" class="pass-form" novalidate hidden>
<h2 id="kup">Kup tłumaczenie – ${price}</h2>
<p>Dostaniesz to tłumaczenie w PDF i w Word (DOCX), od razu po płatności i e-mailem.</p>
<label class="f">Adres e-mail (wyślemy na niego pliki)<input type="email" id="trEmail" autocomplete="email" required maxlength="160"></label>
<label class="check"><input type="checkbox" id="trInv"> <span>Potrzebuję faktury (bez VAT – sprzedawca jest zwolniony z VAT).</span></label>
<div id="trInvBox" hidden><label class="f">Nazwa firmy albo imię i nazwisko<input id="trInvName" maxlength="200"></label><label class="f">Adres<input id="trInvAddr" maxlength="250"></label><label class="f">NIP (pomiń, jeśli kupujesz prywatnie)<input id="trInvNip" inputmode="numeric" maxlength="16"></label></div>
<label class="check"><input type="checkbox" id="trTerms"> <span>Akceptuję <a href="/regulamin">Regulamin</a> i <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span></label>
<label class="check"><input type="checkbox" id="trWaiver"> <span>${esc(DIGITAL_WAIVER)}</span></label>
<div class="gw-box" id="trGw"></div>
<button class="btn lg" type="submit" id="trPay">Kup tłumaczenie – ${price}</button>
<div class="fstatus" id="trPayStatus" role="status"></div>
</form>
<h2>Jak to działa</h2>
<ol class="tips"><li>Wgrywasz CV albo wklejasz jego treść i wybierasz język.</li><li>Tłumaczymy CV wiernie: te same fakty, daty i kolejność; nazwy firm i szkół zostają w oryginale.</li><li>Oglądasz pierwszą stronę tłumaczenia (reszta jest rozmyta do zakupu).</li><li>Po płatności pobierasz PDF i DOCX i dostajesz je e-mailem.</li></ol>
<p>Chcesz CV dopasowane do konkretnego ogłoszenia za granicą, a nie tylko przetłumaczone? Skorzystaj z <a href="/">kreatora CV pod ogłoszenie</a>.</p>
<h2>Najczęstsze pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="sub2 small">Cena końcowa ${price}. Sprzedawca zwolniony z VAT. Płatność jednorazowa online.</p></div>`;
}

export function translationPageRoutes(app, BASE_URL) {
  app.get('/tlumaczenie-cv', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'tlumaczenie-cv', { title: 'Tłumaczenie CV', seoTitle: `Tłumaczenie CV na angielski, niemiecki i inne – ${zl(PRICES.translation)}`, metaDescription: 'Przetłumacz swoje CV na angielski, niemiecki, ukraiński i inne języki: wierne tłumaczenie w czytelnym szablonie, PDF i Word. Podgląd przed zapłatą.' },
      pageHtml(), { script: '/tlumaczenie.js', data: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  });
}
