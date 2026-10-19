// Szablony e-maili z ofertą dla kontaktów B2B (mini-CRM w panelu). SZKICE do podmiany: treści dostarczy koordynator.
// Każdy szablon dostaje: c (kontakt: organizacja, miasto, dział), L (linki: order, offerPdf, advisors, partner, unsubscribe).
// Wysyłka tylko do kontaktów ze statusem „zgoda na ofertę” (art. 398 Prawa komunikacji elektronicznej), stopka z linkiem wypisu.
const hello = (c) => 'Dzień dobry,';
const foot = (L) => `Pozdrawiam,
Jakub Leśniak
CV Pod Ogłoszenie, https://cvpodogloszenie.pl

Ofertę w PDF dołączam w załączniku. Jeśli nie chcą Państwo otrzymywać od nas wiadomości: ${L.unsubscribe}`;
const core = (L) => `Każda osoba dostaje kod i sama zamawia CV (oraz opcjonalnie list motywacyjny) dopasowane do konkretnego ogłoszenia, kiedy go potrzebuje. Organizacja płaci tylko za kupione kody, od 25 zł za osobę, z fakturą bez VAT. Kody i plakat z kodem QR przychodzą od razu po zamówieniu: ${L.order}
Można też zacząć bez kosztów: bezpłatny kod zniżkowy dla podopiecznych i prywatny raport wykorzystania (bez danych osobowych).`;

export const SEGMENTS = {
  uczelnia: { label: 'Uczelnia / biuro karier', subject: (c) => `CV pod konkretne ogłoszenie dla studentów${c.org ? ` – ${c.org}` : ''}`,
    body: (c, L) => `${hello(c)}

dziękuję za rozmowę i zgodę na przesłanie oferty. Zgodnie z ustaleniem przesyłam informacje o współpracy z biurem karier.

${core(L)}
Dla doradców kariery przygotowaliśmy bezpłatny scenariusz zajęć „CV pod konkretne ogłoszenie” (45 minut): ${L.advisors}

${foot(L)}` },
  szkola: { label: 'Szkoła', subject: () => 'Pierwsze CV absolwenta pod konkretną ofertę – oferta dla szkoły',
    body: (c, L) => `${hello(c)}

dziękuję za rozmowę i zgodę na przesłanie oferty. Przesyłam informacje dla szkoły i doradcy zawodowego.

${core(L)}
Bezpłatny scenariusz lekcji (45 minut) dla doradcy zawodowego: ${L.advisors}

${foot(L)}` },
  urzad: { label: 'Urząd pracy / NGO', subject: () => 'Dokumenty aplikacyjne dla uczestników projektu – oferta',
    body: (c, L) => `${hello(c)}

dziękuję za rozmowę i zgodę na przesłanie oferty. Przesyłam propozycję wsparcia uczestników w przygotowaniu dokumentów aplikacyjnych.

${core(L)}
Strona i dokumenty są dostępne także po ukraińsku, angielsku i niemiecku.

${foot(L)}` },
  'fundacja-ua': { label: 'Fundacja wspierająca Ukraińców', subject: () => 'CV po polsku i ukraińsku pod konkretne ogłoszenie – oferta',
    body: (c, L) => `${hello(c)}

dziękuję za rozmowę i zgodę na przesłanie oferty. Przesyłam informacje o wsparciu dla osób z Ukrainy szukających pracy w Polsce.

${core(L)}
Uczestnicy mogą korzystać ze strony po ukraińsku, a dokumenty przygotujemy po polsku (i dodatkowo w innym języku, jeśli trzeba). Na plakacie z kodem jest instrukcja po ukraińsku.

${foot(L)}` },
  firma: { label: 'Firma / dział HR', subject: () => 'Wsparcie przy outplacemencie: CV pod konkretne ogłoszenie',
    body: (c, L) => `${hello(c)}

dziękuję za rozmowę i zgodę na przesłanie oferty. Przesyłam propozycję dla działu HR: wsparcie pracowników przy zmianie pracy (outplacement) albo benefit.

${core(L)}

${foot(L)}` },
  tworca: { label: 'Twórca / doradca kariery', subject: () => 'Program partnerski CV Pod Ogłoszenie',
    body: (c, L) => `${hello(c)}

dziękuję za kontakt i zgodę na przesłanie informacji. Zapraszam do programu partnerskiego: Twoi odbiorcy płacą z Twoim kodem 10% mniej, a Ty dostajesz prowizję od każdej opłaconej sprzedaży. Masz prywatną stronę statystyk i plakat z kodem QR.

Zgłoszenie zajmuje 2 minuty: ${L.partner}

${foot(L)}` },
};
export const REMINDER = {
  subject: (c, first) => `Re: ${first}`,
  body: (c, L) => `Dzień dobry,

uprzejmie przypominam o ofercie przesłanej tydzień temu. Jeśli to dobry moment, chętnie odpowiem na pytania albo przygotuję kody na próbę. Zamówienie online: ${L.order}

Jeśli temat nie jest aktualny, wystarczy krótka odpowiedź, a nie będę więcej pisać.

Pozdrawiam,
Jakub Leśniak
CV Pod Ogłoszenie

Wypis z wiadomości: ${L.unsubscribe}`,
};
// Segment z pliku CSV (różne zapisy) → klucz szablonu.
export function segmentOf(s) {
  const t = String(s || '').toLowerCase();
  if (/ukr|ua\b/.test(t)) return 'fundacja-ua';
  if (/uczel|uniw|polit|akadem|biuro karier|wyższ|wyzsz/.test(t)) return 'uczelnia';
  if (/szko|liceum|technik|zsz|zsp/.test(t)) return 'szkola';
  if (/urz|pup|ngo|stowarz|ops|mops|gops|fundac/.test(t)) return 'urzad';
  if (/tw[oó]rc|influ|bloger|youtub|coach|doradc/.test(t)) return 'tworca';
  if (/firm|hr|sp\. ?z|spółk|spolk|agencj/.test(t)) return 'firma';
  return SEGMENTS[t] ? t : 'firma';
}
