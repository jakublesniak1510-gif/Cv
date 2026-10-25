// Strony „CV pod ogłoszenie z <portal>” (PR G): jak skopiować ogłoszenie z popularnego portalu i wkleić je w kreatorze albo skanerze.
// Nazwy portali tylko w tekście (znaki towarowe ich właścicieli), bez logotypów i zrzutów ekranu; na każdej stronie informacja,
// że serwis jest niezależny i niepowiązany z portalem. Bez twierdzeń o działaniu portali, których nie da się sprawdzić z zewnątrz.
export const PORTAL_HUB = 'cv-pod-ogloszenie-z';
export const PORTALS = [
  {
    slug: 'pracuj-pl', name: 'Pracuj.pl',
    lead: 'Ogłoszenia na Pracuj.pl mają zwykle osobne części z obowiązkami, wymaganiami i tym, co pracodawca oferuje. Do CV pod ogłoszenie przydają się przede wszystkim obowiązki i wymagania – to z nich bierzemy słowa kluczowe.',
    tips: ['Skopiuj całą treść od nazwy stanowiska do końca wymagań, łącznie z sekcją „mile widziane”, jeśli jest – te pozycje też mogą trafić do CV, gdy je masz.', 'Część „oferujemy” możesz pominąć: nie wpływa na treść CV.', 'Jeśli aplikujesz na kilka podobnych ofert, wklej każdą osobno – CV pod każde ogłoszenie podkreśla inne wymagania.'],
  },
  {
    slug: 'olx-praca', name: 'OLX Praca',
    lead: 'Ogłoszenia z działu pracy na OLX bywają krótkie i pisane swobodnie, czasem bez wydzielonej listy wymagań. Wtedy wymagania kryją się w zwykłych zdaniach opisu.',
    tips: ['Skopiuj cały opis ogłoszenia, także zdania typu „szukamy osoby, która…” – z nich wyciągamy wymagania.', 'Jeśli ogłoszenie podaje tylko stanowisko i kilka słów, dopisz w kreatorze, czego dotyczy praca (np. „magazyn, praca zmianowa, wózek widłowy”).', 'Podaj w kreatorze miasto i godziny pracy tylko wtedy, gdy ogłoszenie ich wymaga – CV ma odpowiadać na ofertę.'],
  },
  {
    slug: 'indeed', name: 'Indeed',
    lead: 'Na Indeed są zarówno ogłoszenia publikowane bezpośrednio, jak i oferty z innych stron. Opis stanowiska bywa po polsku albo po angielsku.',
    tips: ['Skopiuj pełny opis stanowiska, nie tylko skrót z listy wyników wyszukiwania.', 'Ogłoszenie po angielsku daje CV po angielsku (język ogłoszenia jest w cenie). Wersję w drugim języku dokupisz w kreatorze.', 'Jeśli oferta prowadzi na stronę pracodawcy, możesz skopiować treść stamtąd – bywa pełniejsza.'],
  },
  {
    slug: 'linkedin', name: 'LinkedIn',
    lead: 'Oferty na LinkedIn mają opis stanowiska, a pod nim często listę wymaganych umiejętności. Treść bywa długa i mieszana – część o firmie, część o roli.',
    tips: ['Rozwiń pełny opis oferty i skopiuj go w całości – skrócony podgląd nie zawiera wszystkich wymagań.', 'Część o firmie i kulturze organizacji nie przeszkadza, ale najważniejsze są obowiązki i wymagania.', 'Do profilu LinkedIn możesz dokupić w kreatorze dodatek „Profil LinkedIn”: nagłówek, sekcję „Informacje” i umiejętności spójne z CV.'],
  },
  {
    slug: 'nofluffjobs', name: 'No Fluff Jobs',
    lead: 'Ogłoszenia IT na No Fluff Jobs mają zwykle listę technologii (wymaganych i mile widzianych), widełki wynagrodzenia i opis zadań w projekcie.',
    tips: ['Skopiuj listę technologii razem z opisem zadań – z technologii robimy słowa kluczowe, a z zadań punkty doświadczenia.', 'W kreatorze wpisz technologie, których naprawdę używałeś, z kontekstem (projekt, czas, efekt). Nie dopisujemy niczego, czego nie podasz.', 'Wynagrodzenia nie przenosimy do CV – nie ma tam dla niego miejsca.'],
  },
  {
    slug: 'justjoin-it', name: 'Just Join IT',
    lead: 'Na Just Join IT oferty IT pokazują zwykle stack technologiczny z poziomem znajomości, wynagrodzenie i opis roli.',
    tips: ['Skopiuj opis roli i listę technologii. Poziomy znajomości z ogłoszenia pomagają ustalić, co w CV podkreślić najmocniej.', 'Jeśli technologia z ogłoszenia jest Ci znana tylko trochę, napisz to uczciwie w kreatorze – CV pokaże ją adekwatnie.', 'Przy kilku ofertach z podobnym stackiem rozważ Pakiet 3: trzy CV pod ten sam zawód, każde pod inne ogłoszenie.'],
  },
  {
    slug: 'praca-pl', name: 'Praca.pl',
    lead: 'Ogłoszenia na Praca.pl mają zwykle opis stanowiska, zakres obowiązków i wymagania, czasem w formie listy, czasem w akapitach.',
    tips: ['Skopiuj obowiązki i wymagania w całości – z obu części bierzemy słowa kluczowe.', 'Jeśli ogłoszenie ma numer referencyjny, dopisz go w liście motywacyjnym albo w temacie wiadomości do pracodawcy.', 'Gdy ogłoszenie prosi o klauzulę RODO w konkretnym brzmieniu, wklej ją w kreatorze w uwagach – użyjemy jej w CV.'],
  },
];
export const PORTAL_BY = Object.fromEntries(PORTALS.map((p) => [p.slug, p]));
export const portalPath = (slug) => `${PORTAL_HUB}/${slug}`;
export const PORTAL_URLS = [PORTAL_HUB, ...PORTALS.map((p) => portalPath(p.slug))];
// Tytuł wg szablonu: „CV pod ogłoszenie z Pracuj.pl – wklej ofertę, odbierz CV”.
export const portalTitle = (p) => `CV pod ogłoszenie z ${p.name} – wklej ofertę, odbierz CV`;
