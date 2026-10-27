import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { DIGITAL_WAIVER } from './products.js';
import { GRANT_DISCLAIMER, VOIV, FORMS, GRANT_REVISIONS } from './grant.js';

// Strona /uslugi/dotacja-z-urzedu-pracy (D5): kreator w 6 krokach → podgląd (rozmyta strona 1 i lista rozdziałów) → zakup
// (349 zł biznesplan, 549 zł wniosek + biznesplan) → pliki i poprawki na tej stronie (public/dotacja.js → /api/grant/*, /api/products/grant).
const zl = (gr) => `${gr / 100} zł`;
const FAQ = [
  ['Czy gwarantujecie przyznanie dotacji?', 'Nie. O przyznaniu środków decyduje urząd pracy według swoich zasad i budżetu. Przygotowujemy dokumenty na podstawie Twoich danych, ale nie składamy wniosku w Twoim imieniu i nie wpływamy na decyzję urzędu.'],
  ['Skąd biorą się kwoty w biznesplanie?', 'Tylko od Ciebie: wydatki, koszty i przychody wpisujesz w kreatorze, a tabele liczymy z tych liczb. Jeśli czegoś nie podasz, oznaczamy to jako „założenie” do uzupełnienia. Kwoty w tekście, których nie ma w Twoich danych, automatycznie zamieniamy na „[założenie: …]”.'],
  ['Po co wgrywać wzór wniosku z urzędu?', 'Każdy urząd pracy ma własny wzór wniosku i biznesplanu. Gdy go wgrasz, układamy biznesplan według punktów z Twojego urzędu, a w wariancie z wnioskiem przygotowujemy treść jego pól. Wzór znajdziesz na stronie swojego urzędu pracy albo dostaniesz go w urzędzie.'],
  ['Co dostanę po zakupie?', 'Biznesplan w PDF i w Word (DOCX), a w wariancie z wnioskiem także plik Word z polami wniosku i treścią do przepisania do wzoru urzędu. Pliki pobierzesz na tej stronie i dostaniesz e-mailem.'],
  ['Na czym polegają poprawki?', `W cenie są ${GRANT_REVISIONS} poprawki: na stronie zamówienia piszesz, co zmienić (np. „dopisz, że mam kurs barberski”), a my przygotowujemy nową wersję dokumentów. Poprawka obejmuje treść; nowe kwoty podaj w uwagach.`],
  ['Co dzieje się z moimi danymi?', 'Dane z kreatora, tekst CV i wzoru wniosku przekazujemy dostawcy AI wyłącznie do przygotowania dokumentów. Podgląd przechowujemy 48 godzin, a po zakupie – jak dane zamówienia, 30 dni. Nie wpisuj PESEL ani numeru konta – zostawiamy na nie miejsce do uzupełnienia.'],
];

function pageHtml() {
  const plan = zl(PRICES.grantplan), full = zl(PRICES.grantfull);
  const inp = (id, label, attrs = '') => `<label class="f">${label}<input type="text" id="${id}" ${attrs}></label>`;
  const area = (id, label, rows = 4, max = 3000, ph = '') => `<label class="f">${label}<textarea id="${id}" rows="${rows}" maxlength="${max}"${ph ? ` placeholder="${esc(ph)}"` : ''}></textarea></label>`;
  return `<div class="inner narrow grt"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Dotacja z urzędu pracy</span></nav>
<h1>Biznesplan i wniosek o dotację z urzędu pracy – od ${plan}</h1>
<p class="lead">Chcesz założyć firmę ze środków z powiatowego urzędu pracy? Wypełnij kreator: pomysł, kody PKD, Twoje doświadczenie, wydatki i prognozę. Przygotujemy biznesplan według wzoru Twojego urzędu, a w wariancie z wnioskiem – treść pól wniosku. Zanim zapłacisz, zobaczysz podgląd.</p>
<div class="perk grt-warn"><b>Ważne:</b> ${esc(GRANT_DISCLAIMER)}</div>
<div class="grt-steps" aria-hidden="true">${['Wariant', 'O Tobie', 'Firma', 'Wydatki', 'Prognoza', 'Wzór wniosku'].map((t, i) => `<span data-s="${i}">${i + 1}. ${t}</span>`).join('')}</div>
<form id="grForm" class="pass-form" novalidate>
<fieldset class="grt-step" data-step="0"><legend>1. Wariant i urząd pracy</legend>
<label class="check"><input type="radio" name="grVar" value="plan" checked> <span><b>Biznesplan – ${plan}</b>: biznesplan w PDF i Word, ${GRANT_REVISIONS} poprawki.</span></label>
<label class="check"><input type="radio" name="grVar" value="full"> <span><b>Wniosek + biznesplan – ${full}</b>: biznesplan i treść pól wniosku z Twojego urzędu (Word), ${GRANT_REVISIONS} poprawki.</span></label>
<label class="f">Województwo<select id="grVoiv"><option value="">– wybierz –</option>${VOIV.map((v) => `<option>${v}</option>`).join('')}</select></label>
${inp('grPup', 'Urząd pracy', 'maxlength="160" placeholder="np. Powiatowy Urząd Pracy w Krakowie"')}
</fieldset>
<fieldset class="grt-step" data-step="1" hidden><legend>2. O Tobie</legend>
${inp('grName', 'Imię i nazwisko', 'maxlength="120" autocomplete="name"')}
${inp('grCity', 'Miejscowość', 'maxlength="120"')}
<label class="f">Twoje CV (PDF albo Word) – wykształcenie i doświadczenie do biznesplanu<input type="file" id="grCvFile" accept=".pdf,.docx,.txt"></label>
${area('grCv', 'Treść CV (możesz też wkleić albo poprawić)', 6, 15000)}
${area('grExtra', 'Kursy, uprawnienia i inne kwalifikacje, których nie ma w CV', 3)}
</fieldset>
<fieldset class="grt-step" data-step="2" hidden><legend>3. Planowana firma</legend>
${area('grIdea', 'Pomysł na firmę: co będziesz robić, dla kogo, jak, ceny (jeśli znasz)', 6, 4000)}
${inp('grPkd', 'Kody PKD (pierwszy – działalność główna)', 'maxlength="80" placeholder="np. 96.02.Z, 47.91.Z"')}
<p class="hint">Kod PKD ma format 00.00.Z. Sprawdź go w wyszukiwarce PKD przed złożeniem wniosku.</p>
${inp('grBiz', 'Nazwa firmy (jeśli już wiesz)', 'maxlength="160"')}
${inp('grPlace', 'Miejsce prowadzenia działalności', 'maxlength="160" placeholder="np. Kraków, lokal przy ul. … albo dojazd do klienta"')}
<div class="grid2"><label class="f">Forma<select id="grForm2">${Object.entries(FORMS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
<label class="f">Planowany start<input type="month" id="grStart"></label></div>
${area('grCust', 'Klienci: kto kupi i skąd się o Tobie dowie')}
${area('grComp', 'Konkurencja: kto robi podobnie w okolicy, czym się wyróżnisz')}
${area('grMkt', 'Reklama i sprzedaż: jak dotrzesz do klientów')}
</fieldset>
<fieldset class="grt-step" data-step="3" hidden><legend>4. Wydatki z dotacji</legend>
<p class="hint">Wpisz, co chcesz kupić ze środków z urzędu. Kwoty podajesz Ty – nie dopisujemy własnych.</p>
<div id="grExp" class="grt-rows"></div>
<button type="button" class="btn ghost sm" id="grExpAdd">+ Dodaj wydatek</button>
<div class="grid2">${inp('grReq', 'Wnioskowana kwota (zł)', 'inputmode="decimal" maxlength="14"')}${inp('grOwn', 'Wkład własny (zł, jeśli masz)', 'inputmode="decimal" maxlength="14"')}</div>
</fieldset>
<fieldset class="grt-step" data-step="4" hidden><legend>5. Prognoza przychodów i kosztów</legend>
<label class="f">Okres prognozy<select id="grMonths"><option value="12">12 miesięcy</option><option value="24">24 miesiące</option></select></label>
<p class="hint">Średni przychód miesięcznie (zł). Puste pole oznaczymy jako „założenie”.</p>
<div class="grid2">${inp('grRevA', 'Miesiące 1–3', 'inputmode="decimal" maxlength="14"')}${inp('grRevB', 'Miesiące 4–12', 'inputmode="decimal" maxlength="14"')}</div>
<div id="grRevCBox" hidden>${inp('grRevC', 'Miesiące 13–24', 'inputmode="decimal" maxlength="14"')}</div>
<p class="hint">Stałe koszty miesięczne (np. ZUS, księgowość, najem, paliwo, telefon) – kwoty według Twojej wiedzy.</p>
<div id="grCost" class="grt-rows"></div>
<button type="button" class="btn ghost sm" id="grCostAdd">+ Dodaj koszt</button>
</fieldset>
<fieldset class="grt-step" data-step="5" hidden><legend>6. Wzór wniosku z Twojego urzędu</legend>
<p id="grFormNote">Wgraj wzór wniosku albo biznesplanu ze strony swojego urzędu pracy (PDF z tekstem albo Word). Ułożymy dokumenty według jego punktów. <b id="grFormReq" hidden>W wariancie z wnioskiem wzór jest wymagany.</b></p>
<label class="f">Wzór wniosku (PDF albo Word, do 5 MB)<input type="file" id="grFormFile" accept=".pdf,.docx"></label>
<p class="hint" id="grFormInfo"></p>
</fieldset>
<div class="grt-nav"><button type="button" class="btn ghost" id="grBack" hidden>Wstecz</button><button type="button" class="btn" id="grNext">Dalej</button><button type="submit" class="btn lg" id="grGo" hidden>Pokaż podgląd dokumentów</button></div>
<p class="hint">Podgląd jest bezpłatny (najwyżej 2 dziennie). Przygotowanie trwa zwykle 1–3 minuty.</p>
<div class="fstatus" id="grStatus" role="status"></div>
</form>
<div id="grPrev" class="grt-prev" hidden><div id="grImg" class="trl-img"></div><div id="grToc"></div></div>
<form id="grBuy" class="pass-form" novalidate hidden>
<h2 id="kup">Kup dokumenty – <span id="grPrice">${plan}</span></h2>
<p>Dostaniesz dokładnie te dokumenty w PDF i Word – od razu po płatności, na tej stronie i e-mailem. W cenie ${GRANT_REVISIONS} poprawki.</p>
<label class="f">Adres e-mail (wyślemy na niego dokumenty)<input type="email" id="grEmail" autocomplete="email" required maxlength="160"></label>
<label class="check"><input type="checkbox" id="grInv"> <span>Potrzebuję faktury (bez VAT – sprzedawca jest zwolniony z VAT).</span></label>
<div id="grInvBox" hidden>${inp('grInvName', 'Nazwa firmy albo imię i nazwisko', 'maxlength="200"')}${inp('grInvAddr', 'Adres', 'maxlength="250"')}${inp('grInvNip', 'NIP (pomiń, jeśli kupujesz prywatnie)', 'inputmode="numeric" maxlength="16"')}</div>
<label class="check"><input type="checkbox" id="grTerms"> <span>Akceptuję <a href="/regulamin">Regulamin</a> i <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span></label>
<label class="check"><input type="checkbox" id="grWaiver"> <span>${esc(DIGITAL_WAIVER)}</span></label>
<label class="check"><input type="checkbox" id="grNoGuar"> <span>Rozumiem, że nie gwarantujecie przyznania dotacji, a dokumenty muszę przeczytać i uzupełnić przed złożeniem.</span></label>
<div class="gw-box" id="grGw"></div>
<button class="btn lg" type="submit" id="grPay">Kup dokumenty</button>
<div class="fstatus" id="grPayStatus" role="status"></div>
</form>
<div id="grDone" class="pass-form" hidden>
<h2>Poprawki (zostało: <span id="grRevLeft">${GRANT_REVISIONS}</span>)</h2>
<label class="f">Co poprawić?<textarea id="grRevNote" rows="4" maxlength="2000" placeholder="np. Dopisz, że mam kurs barberski z 2023 r. Rozdział o konkurencji jest za krótki."></textarea></label>
<button class="btn" type="button" id="grRevGo">Poproś o poprawkę</button>
<div class="fstatus" id="grRevStatus" role="status"></div>
</div>
<h2>Jak to działa</h2>
<ol class="tips"><li>Wypełniasz kreator: urząd, pomysł, PKD, doświadczenie, wydatki i prognozę.</li><li>Wgrywasz wzór wniosku z urzędu – dokumenty dostosujemy do jego punktów.</li><li>Oglądasz podgląd pierwszej strony i spis rozdziałów.</li><li>Po płatności pobierasz biznesplan (i pola wniosku), czytasz, uzupełniasz założenia i składasz wniosek w urzędzie.</li></ol>
<h2>Najczęstsze pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="sub2 small">Ceny końcowe: biznesplan ${plan}, wniosek z biznesplanem ${full}. Sprzedawca zwolniony z VAT. Płatność jednorazowa online.</p></div>`;
}

export function grantPageRoutes(app, BASE_URL) {
  app.get('/uslugi/dotacja-z-urzedu-pracy', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'uslugi/dotacja-z-urzedu-pracy', { title: 'Dotacja z urzędu pracy', seoTitle: `Biznesplan i wniosek o dotację z urzędu pracy – od ${zl(PRICES.grantplan)}`, metaDescription: 'Biznesplan i treść wniosku o dotację z urzędu pracy na podstawie Twoich danych i wzoru Twojego urzędu. Kwoty tylko od Ciebie, podgląd przed zapłatą, 3 poprawki w cenie.' },
      pageHtml(), { script: '/dotacja.js', data: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  });
}
