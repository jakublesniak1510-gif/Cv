// Szablony e-maili z ofertą dla kontaktów B2B (mini-CRM w panelu → Kontakty). Treści od koordynatora (Pozyskiwanie klientów).
// Wysyłka tylko do kontaktów ze statusem „zgoda na ofertę”; stopka z linkiem wypisu; PDF oferty w załączniku.
// Zmienne: [NAZWA]/[UCZELNIA] = organizacja, [KOD] = proponowany kod, [IMIĘ] = imię (kolumna „imie”), [KANAŁ] = strona/kanał,
// [TEMAT] = temat materiałów (kolumna „temat”). Brakujące wartości mają bezpieczne zamienniki.
const SIGN = 'Jakub Leśniak\nCV Pod Ogłoszenie\nkontakt@cvpodogloszenie.pl';
const unsub = (L) => `\n\nNie chcesz kolejnych wiadomości? ${L.unsubscribe}`;
const ascii = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
export const proposedCode = (c) => `${(ascii(c.org).split(' ').filter((w) => w.length > 2)[0] || 'KOD').slice(0, 10)}10`;
// Podstawienie zmiennych; „Cześć ,” → „Cześć,” gdy brak imienia.
export function fill(text, c = {}) {
  const v = { NAZWA: c.org || 'Państwa organizacji', UCZELNIA: c.org || 'uczelni', KOD: proposedCode(c), 'IMIĘ': c.name || '', "ІМ'Я": c.name || '', 'KANAŁ': c.site || 'Twój kanał', TEMAT: c.topic || 'szukaniu pracy' };
  return text.replace(/\[(NAZWA|UCZELNIA|KOD|IMIĘ|ІМ'Я|KANAŁ|TEMAT)\]/g, (_m, k) => v[k]).replace(/(Cześć|Привіт),? +([,!])/g, '$1$2').replace(/(Cześć|Привіт) ,/g, '$1,');
}

export const SEGMENTS = {
  uczelnia: { label: 'Uczelnia / biuro karier', subject: 'Bezpłatny kod i warsztat „CV pod konkretne ogłoszenie” dla studentów [NAZWA]',
    body: `Dzień dobry,

dziękuję za kontakt. Krótko:

Co to jest: cvpodogloszenie.pl tworzy CV i list motywacyjny dopasowane do konkretnej oferty pracy. Student wkleja ogłoszenie i swoje dane, a dostaje dokument PDF/DOCX. Darmowe narzędzia, w tym skaner CV pod ogłoszenie, działają bez rejestracji.

Propozycja dla [NAZWA], bez kosztów:
1. Własny kod zniżkowy dla studentów i absolwentów (np. [KOD]) z gotowym opisem i plakatem z kodem QR.
2. Raport online z liczbą użyć kodu. Nie przekazujemy żadnych danych osobowych.
3. Bezpłatny warsztat online (45 min) „CV pod konkretne ogłoszenie”, np. przy okazji targów pracy.

Jeśli biuro chciałoby pokryć koszt usługi za studentów, mamy też paczki opłaconych kodów (faktura bez VAT, ceny w załączniku).

Czy mogę przygotować kod? Wystarczy odpowiedź z proponowaną nazwą kodu.

${SIGN}` },
  szkola: { label: 'Szkoła', subject: 'Bezpłatne materiały na lekcję doradztwa: CV pod konkretne ogłoszenie',
    body: `Dzień dobry,

dziękuję za kontakt i przesyłam informację. Przygotowaliśmy darmowy scenariusz lekcji (45 min) „CV pod konkretne ogłoszenie”: cvpodogloszenie.pl/dla-doradcow. Uczniowie pracują na prawdziwym ogłoszeniu i bezpłatnym skanerze CV, bez zakładania konta.

Dla szkoły możemy też założyć bezpłatny kod zniżkowy dla uczniów i absolwentów, z plakatem z QR do klasy. Jeśli szkoła lub rada rodziców chciałaby opłacić CV np. dla klas przed praktykami, ceny paczek kodów są w załączniku.

${SIGN}` },
  urzad_ngo: { label: 'Urząd pracy / NGO', subject: 'Kody na CV dopasowane do ogłoszenia dla Państwa klientów: oferta',
    body: `Dzień dobry,

dziękuję za kontakt, przesyłam ofertę.

Usługa: CV i list motywacyjny dopasowane do konkretnej oferty pracy, gotowe w kilka minut (PDF/DOCX). Interfejs jest dostępny także po ukraińsku, angielsku i niemiecku. Osoba z Ukrainy może wypełnić dane po ukraińsku i dostać CV po polsku.

Dwa warianty:
– Bez kosztów: kod zniżkowy dla Państwa klientów i raport liczby użyć.
– Opłaca instytucja: paczka kodów, z których każdy daje 1 bezpłatne CV (lub CV + list / pakiet 3 CV). Faktura bez VAT, płatność przelewem 14 dni, kody aktywne od razu. Ceny w załączniku, zamówienie online: cvpodogloszenie.pl/dla-instytucji/zamow

Nie przekazujemy instytucji danych osób korzystających z kodów, tylko liczby. Chętnie odpowiem na zapytanie ofertowe lub przygotuję ofertę do projektu.

${SIGN}` },
  fundacja_ua: { label: 'Fundacja wspierająca Ukraińców', subject: 'Polskie CV dla Waszych podopiecznych – po ukraińsku / Польське резюме для ваших підопічних',
    body: `Dzień dobry,

dziękuję za kontakt i przesyłam informację. Na cvpodogloszenie.pl/uk osoba z Ukrainy wypełnia dane po ukraińsku i dostaje CV po polsku, dopasowane do konkretnej oferty pracy.

Proponujemy bezpłatny kod zniżkowy dla Waszych podopiecznych z plakatem PL/UA z kodem QR. Jeśli fundacja ma budżet projektowy, możemy też przygotować paczkę opłaconych kodów (faktura bez VAT).

—

Добрий день!

На cvpodogloszenie.pl/uk людина заповнює дані українською і отримує резюме польською, адаптоване під конкретну вакансію. Пропонуємо безкоштовний код знижки для ваших підопічних та плакат PL/UA з QR-кодом. Якщо фонд має проєктний бюджет, можемо підготувати пакет оплачених кодів.

Z poważaniem / З повагою
${SIGN}` },
  agencja: { label: 'Agencja pracy', subject: 'CV dopasowane do Państwa ogłoszeń dla kandydatów [NAZWA]',
    body: `Dzień dobry,

dziękuję za kontakt, przesyłam ofertę.

Usługa: kandydat wkleja Państwa ogłoszenie i swoje dane, a dostaje CV i list motywacyjny dopasowane do tej oferty (PDF/DOCX). Formularz jest po polsku, ukraińsku, angielsku i niemiecku; osoba z Ukrainy może wpisać dane po ukraińsku i dostać CV po polsku. Treść powstaje tylko z danych kandydata.

Dwa warianty:
– Bez kosztów: kod zniżkowy dla kandydatów (np. [KOD]) z plakatem QR i raportem liczby użyć.
– Opłaca agencja: paczka kodów, każdy kod to jedno zamówienie bez płatności po stronie kandydata. Faktura bez VAT, przelew 14 dni. Ceny w załączniku, szczegóły: cvpodogloszenie.pl/dla-agencji

Nie przekazujemy agencji danych kandydatów ani ich dokumentów, tylko liczbę użyć kodu.

${SIGN}` },
  firma: { label: 'Firma / dział HR', subject: 'Wsparcie dla odchodzących pracowników: kody na CV pod konkretne ogłoszenie',
    body: `Dzień dobry,

dziękuję za kontakt. Proponujemy prosty element programu outplacement. Każdy pracownik dostaje kod na pakiet 3 CV i listów motywacyjnych dopasowanych do wybranych ofert pracy (PDF/DOCX, także EN/DE/UA).

Firma płaci tylko za liczbę osób (rabaty od 10 szt., faktura bez VAT), a w raporcie online widzi wykorzystanie kodów, bez danych pracowników. Zamówienie zajmuje 2 minuty: cvpodogloszenie.pl/dla-instytucji/zamow. Ceny w załączniku.

${SIGN}` },
  tworca: { label: 'Twórca / doradca kariery', subject: 'Współpraca: program partnerski CV Pod Ogłoszenie (prowizja 20%)',
    body: `Cześć [IMIĘ],

oglądam [KANAŁ] i Twoje materiały o [TEMAT] pasują do tego, co robimy. cvpodogloszenie.pl tworzy CV i list pod konkretne ogłoszenie, w kilka minut.

Proponuję program partnerski:
– własny kod, np. [IMIĘ]10, który daje Twoim widzom −10%,
– 20% prowizji od każdej sprzedaży z kodu, wypłata co miesiąc,
– prywatna strona ze statystykami,
– darmowy dostęp, żebyś sprawdził(a) usługę przed poleceniem.

Jedyny wymóg: oznaczenie materiału jako reklama/współpraca, bez obietnic typu „dostaniesz pracę”. Regulamin i zgłoszenie: cvpodogloszenie.pl/program-partnerski

Jakub, CV Pod Ogłoszenie` },
  tworca_ua: { label: 'Twórca (UA)', subject: 'Співпраця: партнерська програма CV Pod Ogłoszenie (20% комісії)',
    body: `Привіт, [ІМ'Я]!

Мене звати Якуб, я створив сервіс cvpodogloszenie.pl/uk. Людина заповнює дані українською й отримує польське резюме під конкретну вакансію.

Пропоную партнерську програму:
– власний код, наприклад [ІМ'Я]10 (−10% для ваших глядачів),
– 20% комісії з кожного продажу, виплата щомісяця,
– сторінка зі статистикою,
– безкоштовний доступ, щоб ви могли перевірити сервіс.

Єдина умова: позначати матеріал як рекламу/співпрацю і не обіцяти «гарантовану роботу». Деталі: cvpodogloszenie.pl/program-partnerski

Якуб, CV Pod Ogłoszenie` },
};
// Gdy brak imienia, „[IMIĘ]10” zamieniamy na proponowany kod z nazwy.
const noNameCode = (text, c) => (c.name ? text : text.replace(/\[(IMIĘ|ІМ'Я)\]10/g, proposedCode(c)));
export const offerMail = (segment, c, L) => {
  const t = SEGMENTS[segment] || SEGMENTS.firma;
  return { subject: fill(t.subject, c), text: fill(noNameCode(t.body, c), c) + unsub(L) };
};
export const REMINDER = {
  pl: `Dzień dobry,

uprzejmie przypominam o wiadomości sprzed tygodnia. Gdyby propozycja była interesująca, chętnie odpowiem na pytania albo od razu przygotuję kod. Jeśli nie, proszę o krótką informację, a nie będę się więcej kontaktować.

${SIGN}`,
  uk: `Добрий день!

Нагадую про лист тижневої давності. Якщо пропозиція цікава — охоче відповім на питання або одразу підготую код. Якщо ні — просто напишіть, і я більше не турбуватиму.

Якуб, CV Pod Ogłoszenie`,
};
export const reminderMail = (c, L) => ({ subject: `Re: ${c.offer?.subject || 'oferta CV Pod Ogłoszenie'}`, text: (c.segment === 'tworca_ua' ? REMINDER.uk : REMINDER.pl) + unsub(L) });

// Segment z pliku CSV (różne zapisy) → klucz szablonu.
export function segmentOf(s) {
  const t = String(s || '').toLowerCase().trim();
  if (SEGMENTS[t]) return t;
  if (/(tw[oó]rc|influ|bloger|youtub|tiktok).*(ua|ukr)|(ua|ukr).*(tw[oó]rc|influ|bloger|youtub)/.test(t)) return 'tworca_ua';
  if (/ukr|\bua\b/.test(t)) return 'fundacja_ua';
  if (/uczel|uniw|polit|akadem|biuro karier|wyższ|wyzsz/.test(t)) return 'uczelnia';
  if (/szko|liceum|technik|zsz|zsp/.test(t)) return 'szkola';
  if (/agenc|pracy tymczas|rekrutac|personaln|staffing/.test(t)) return 'agencja';
  if (/urz|pup|ngo|stowarz|ops|mops|gops|fundac/.test(t)) return 'urzad_ngo';
  if (/tw[oó]rc|influ|bloger|youtub|tiktok|coach|doradc/.test(t)) return 'tworca';
  return 'firma';
}
