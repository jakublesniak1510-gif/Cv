import { ssrPage, escHtml as esc } from './seo.js';
import { PRICES } from './pricing.js';
import { PREMIUM } from './premium-templates.js';
import { DIGITAL_WAIVER } from './products.js';

// Strona /szablony-premium (D2): galeria 10 szablonów (podglądy ze znakiem wodnym z scripts/build-premium-previews.mjs),
// zakup za 19 zł (public/szablony.js → /api/products/templates), powrót z płatności (?zamowienie=<id>) z linkiem do ZIP.
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const FAQ = [
  ['W jakim programie otworzę szablony?', 'W Microsoft Word, LibreOffice Writer, Pages albo Google Docs (Plik → Otwórz → Prześlij). Wszystkie pliki są w formacie DOCX.'],
  ['Czy szablony są czytelne dla systemów rekrutacyjnych (ATS)?', 'Układy są zbudowane z akapitów i prostych tabel, bez pól tekstowych i grafik, z tekstem, który da się zaznaczyć i skopiować. Nie gwarantujemy, jak dany system pracodawcy odczyta plik – jeśli ogłoszenie prosi o PDF, zapisz CV jako PDF.'],
  ['Czym różnią się od darmowych wzorów CV?', 'Darmowe wzory pod zawody mają jeden układ i przykładowe dane. W paczce premium jest 10 różnych układów (np. pasek boczny, kolorowy nagłówek, tabela technologii, daty po lewej) z podpowiedziami, co wpisać w każdej sekcji.'],
  ['Jak dostanę pliki?', 'Zaraz po płatności pobierzesz plik ZIP na tej stronie i dostaniesz go e-mailem. Link do pobrania działa 30 dni.'],
  ['Czy dostanę fakturę?', 'Tak, jeśli zaznaczysz to przy zakupie. Sprzedawca jest zwolniony z VAT, więc faktura jest bez VAT.'],
  ['Czy mogę zrezygnować po zakupie?', 'Pliki to treść cyfrowa dostarczana od razu po płatności. Przy zakupie potwierdzasz, że chcesz je dostać od razu i że wtedy tracisz prawo do odstąpienia od umowy (szczegóły w Regulaminie).'],
];

function pageHtml() {
  const price = zl(PRICES.templates);
  const cards = PREMIUM.map((t, i) => `<figure class="prem-card"><img src="/media/szablony-premium/${t.slug}.jpg" width="520" height="735" loading="${i < 2 ? 'eager' : 'lazy'}" alt="Szablon CV „${esc(t.name)}” – podgląd ze znakiem wodnym" draggable="false"><figcaption><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></figcaption></figure>`).join('');
  return `<div class="inner prem"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <a href="/wzor-cv">Wzory CV</a> › <span>Szablony premium</span></nav>
<h1>Szablony CV premium w Word – 10 układów za ${price}</h1>
<p class="lead">Dziesięć edytowalnych szablonów CV w formacie DOCX, każdy z innym układem: do biura, na produkcję, do IT, na stanowisko kierownicze, na pierwszą pracę i do pracy za granicą. W każdej sekcji jest podpowiedź, co wpisać – zastępujesz ją swoimi danymi.</p>
<p class="perk"><b>Płacisz raz ${price}, bez subskrypcji.</b> Paczkę ZIP pobierzesz od razu po płatności i dostaniesz e-mailem. Szablony są po polsku.</p>
<p><a class="btn lg" href="#kup">Kup szablony – ${price}</a></p>
<h2>Co jest w paczce</h2>
<div class="prem-grid">${cards}</div>
<ul class="ticks col"><li>10 plików Word (DOCX) – otworzysz je w Word, LibreOffice albo Google Docs</li><li>Podpowiedzi w każdej sekcji: co wpisać i jak opisać doświadczenie</li><li>Klauzula RODO na dole każdego szablonu</li><li>Krótka instrukcja (plik „Jak-korzystac.txt”)</li><li>Faktura bez VAT na życzenie</li></ul>
<p class="hint">Na podglądach jest znak wodny – w plikach po zakupie go nie ma. Szablon to układ do wypełnienia, bez dopasowania do ogłoszenia. <a href="/">CV dopasowane do konkretnego ogłoszenia przygotujesz w kreatorze</a>.</p>
<h2 id="kup">Kup szablony</h2>
<form id="premForm" class="pass-form" novalidate>
<label class="f">Adres e-mail (wyślemy na niego paczkę)<input type="email" id="premEmail" autocomplete="email" required maxlength="160"></label>
<label class="check"><input type="checkbox" id="premInv"> <span>Potrzebuję faktury (bez VAT – sprzedawca jest zwolniony z VAT).</span></label>
<div id="premInvBox" hidden><label class="f">Nazwa firmy albo imię i nazwisko<input id="premInvName" maxlength="200"></label><label class="f">Adres<input id="premInvAddr" maxlength="250"></label><label class="f">NIP (pomiń, jeśli kupujesz prywatnie)<input id="premInvNip" inputmode="numeric" maxlength="16"></label></div>
<label class="check"><input type="checkbox" id="premTerms"> <span>Akceptuję <a href="/regulamin">Regulamin</a> i <a href="/polityka-prywatnosci">Politykę prywatności</a>.</span></label>
<label class="check"><input type="checkbox" id="premWaiver"> <span>${esc(DIGITAL_WAIVER)}</span></label>
<div class="gw-box" id="premGw"></div>
<button class="btn lg" type="submit" id="premBuy">Kup szablony – ${price}</button>
<div class="fstatus" id="premStatus" role="status"></div>
</form>
<h2>Najczęstsze pytania</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="sub2 small">Cena końcowa. Sprzedawca zwolniony z VAT. Płatność jednorazowa online.</p></div>`;
}

export function premiumPageRoutes(app, BASE_URL) {
  app.get('/szablony-premium', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'szablony-premium', { title: 'Szablony CV premium w Word', seoTitle: `Szablony CV w Word (DOCX) – 10 układów za ${zl(PRICES.templates)}`, metaDescription: 'Paczka 10 edytowalnych szablonów CV w Word: pasek boczny, klasyczny, IT, praca fizyczna, pierwsza praca i inne. Podpowiedzi w każdej sekcji, ZIP od razu po płatności.' },
      pageHtml(), { script: '/szablony.js', data: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  });
}
