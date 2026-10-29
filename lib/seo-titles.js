// Tytuły i opisy stron zawodów do wyników Google: z szablonu i danych zawodu (bez ręcznego pisania 450 tytułów).
// Odmiana pochodzi z ręcznie napisanych nagłówków stron („CV hydraulika: wzór i wskazówki” → „hydraulika”), więc szablon
// nie odmienia słów sam. Tytuł ≤ 60 znaków: pierwszy wariant, który się mieści; opis ≤ 155: tyle słów kluczowych, ile się zmieści.
const T = {
  pl: {
    name: (p) => /^CV (.+?):/.exec(p.title)?.[1],
    titles: (n) => [`CV ${n} pod ogłoszenie – wzór i generator online`, `CV ${n} pod ogłoszenie – wzór i generator`, `CV ${n} pod ogłoszenie – wzór`, `CV ${n} pod ogłoszenie`],
    desc: (n, kw) => `Wzór CV ${n}${kw ? ` ze słowami kluczowymi z ogłoszeń: ${kw}` : ' ze słowami kluczowymi z ogłoszeń'}. Wygeneruj CV pod ogłoszenie lub sprawdź swoje darmowym skanerem.`,
  },
  en: {
    name: (p) => /^(.+?) CV: /.exec(p.title)?.[1],
    titles: (n) => [`${n} CV for a job ad – template and generator`, `${n} CV for a job ad – template`, `${n} CV for a job ad`, `${n} CV template`],
    desc: (n, kw) => `${n} CV template with keywords from job ads${kw ? `: ${kw}` : ''}. Create a CV for the job ad or check yours with the free scanner.`,
  },
  uk: {
    name: (p) => /^Резюме (.+?): /.exec(p.title)?.[1],
    titles: (n) => [`Резюме ${n} під вакансію – зразок і генератор онлайн`, `Резюме ${n} під вакансію – зразок і генератор`, `Резюме ${n} під вакансію – зразок`, `Резюме ${n} під вакансію`, `Резюме ${n}: зразок`],
    desc: (n, kw) => `Зразок резюме ${n} з ключовими словами з оголошень${kw ? `: ${kw}` : ''}. Створіть резюме під вакансію або перевірте його безкоштовно.`,
  },
  de: {
    name: (p) => /^Lebenslauf (.+?): /.exec(p.title)?.[1],
    titles: (n) => [`Lebenslauf ${n} zur Stellenanzeige – Muster und Generator`, `Lebenslauf ${n} zur Stellenanzeige – Muster`, `Lebenslauf ${n} zur Stellenanzeige`, `Lebenslauf ${n}: Muster`, `Lebenslauf ${n}`],
    desc: (n, kw) => `Lebenslauf-Muster ${n} mit Schlüsselwörtern aus Anzeigen${kw ? `: ${kw}` : ''}. Lebenslauf zur Stellenanzeige erstellen oder kostenlos prüfen.`,
  },
};
export const PROF_SEO_LANGS = Object.keys(T);
export const profName = (p, l = 'pl') => T[l]?.name(p) || null;

// EN i DE (raport GSC 26.10: Google łączył podobne strony EN jako duplikaty): najpierw tytuł z pierwszym słowem kluczowym zawodu,
// który się mieści – tytuły różnią się wtedy nie tylko nazwą zawodu. PL i UK bez zmian.
const KW_TITLE = { en: (n, k) => `${n} CV 2026: ${k}`, de: (n, k) => `Lebenslauf ${n} 2026: ${k}` };
export function profSeo(p, l = 'pl') {
  const t = T[l], n = t && t.name(p);
  if (!n) return {};
  const kwTitles = KW_TITLE[l] ? (p.keywords || []).filter((k) => !/[()]/.test(k)).map((k) => KW_TITLE[l](n, k)) : [];
  const seoTitle = [...kwTitles, ...t.titles(n)].find((x) => x.length <= 60);
  // Słowa kluczowe w kolejności z danych zawodu, najwyżej 3; za długie pomijamy.
  const kws = [];
  for (const k of p.keywords || []) if (kws.length < 3 && t.desc(n, [...kws, k].join(', ')).length <= 155) kws.push(k);
  const metaDescription = t.desc(n, kws.join(', '));
  return { ...(seoTitle ? { seoTitle } : {}), ...(metaDescription.length <= 155 ? { metaDescription } : {}) };
}

// Poradniki z GSC na pozycjach 3–20: czasownik + korzyść; „{rok}” tylko przy treści aktualnej na dany rok (klauzula RODO)
// – rok z daty ostatniej zmiany treści strony (seo-data/content-dates.json), a nie z kalendarza.
export const ART_SEO = {
  pl: {
    'jak-dopasowac-cv-do-ogloszenia': 'Dopasuj CV do ogłoszenia: słowa kluczowe krok po kroku',
    'cv-po-urlopie-macierzynskim': 'CV po urlopie macierzyńskim: opisz przerwę na dziecko',
    'przerwa-w-zatrudnieniu-w-cv': 'Opisz przerwę w zatrudnieniu w CV – przykłady zapisu',
    'cv-po-angielsku': 'CV po angielsku (CV in English) 2026 – zasady i zwroty',
    'email-z-aplikacja-i-podziekowanie-po-rozmowie': 'Podziękowanie za przesłanie CV i po rozmowie – wzory 2026',
    'klauzula-rodo-w-cv': 'Klauzula RODO w CV {rok}: aktualna treść do skopiowania',
    'cv-dla-studenta': 'CV studenta i CV dla studenta: praktyki, staż, praca',
    'podsumowanie-zawodowe-w-cv': 'Podsumowanie CV i podsumowanie zawodowe – przykłady, długość',
    'zdjecie-w-cv': 'CV ze zdjęciem czy bez? Zdjęcie w CV – kiedy i jakie',
  },
  de: {
    'cv-do-pracy-w-polsce': 'Lebenslauf für Polen schreiben: Format, Sprache, RODO',
    'klauzula-rodo-w-cv': 'DSGVO-Klausel im Lebenslauf {rok}: Wortlaut zum Kopieren',
  },
  en: {
    'klauzula-rodo-w-cv': 'GDPR clause for a CV in Poland {rok}: copy the wording',
    'cv-po-angielsku': 'Write a CV in English: sections, dates and differences',
  },
};
export const artSeoTitle = (l, slug, date) => ART_SEO[l]?.[slug]?.replace('{rok}', String(date || new Date().toISOString()).slice(0, 4));

// Strony z wyświetleniami na pozycjach 8–20 i zerem kliknięć (raport GSC 26.10): tytuł ≤ 60 znaków z korzyścią (rok tam, gdzie
// treść jest aktualna na ten rok), opis ≤ 155 z wezwaniem do działania. Klucz = ścieżka strony (route w lib/seo.js: page).
// Tytuł poradnika EN o klauzuli RODO jest w ART_SEO (rok z daty treści), tu tylko opis.
export const CTR_SEO = {
  'poradnik/email-z-aplikacja-i-podziekowanie-po-rozmowie': { title: 'Podziękowanie za przesłanie CV i po rozmowie – wzory 2026', desc: 'Gotowe wzory: e-mail z CV, podziękowanie za przesłanie CV i po rozmowie kwalifikacyjnej. Temat, treść i kiedy wysłać – skopiuj i dopasuj do siebie.' },
  'cv/social-media-manager': { title: 'CV social media managera 2026 – wzór i słowa z ogłoszeń', desc: 'Wzór CV social media managera: harmonogram publikacji, Meta Ads, TikTok, community management. Sprawdź swoje CV za darmo albo zrób je pod ogłoszenie.' },
  'cv/lakiernik': { title: 'CV lakiernika samochodowego 2026 – wzór i słowa kluczowe', desc: 'Wzór CV lakiernika: przygotowanie powierzchni, dobór koloru, cieniowanie i kabina lakiernicza. Sprawdź swoje CV za darmo lub zrób je pod ogłoszenie.' },
  'narzedzia/podziekowanie-po-rozmowie': { title: 'Podziękowanie po rozmowie kwalifikacyjnej – darmowy wzór', desc: 'Wpisz stanowisko i firmę, a generator przygotuje krótki e-mail z podziękowaniem po rozmowie kwalifikacyjnej. Za darmo, bez konta – skopiuj i wyślij.' },
  'poradnik/cv-po-angielsku': { title: 'CV po angielsku (CV in English) 2026 – zasady i zwroty', desc: 'CV in English krok po kroku: nazwy sekcji, zapis dat, wykształcenie, zdjęcie i dane osobowe. Zobacz różnice wobec polskiego CV i sprawdź swoje za darmo.' },
  'cv/hydraulik': { title: 'CV hydraulika 2026 – wzór, uprawnienia i słowa z ogłoszeń', desc: 'Wzór CV hydraulika: instalacje wod-kan, c.o. i gazowe, uprawnienia SEP G3, usuwanie awarii. Sprawdź swoje CV za darmo albo zrób je pod ogłoszenie.' },
  // Zapytania GSC innym słowem niż nazwa strony (29.10): synonim na początku tytułu; stare adresy synonimów → 301 (PROF_301 w lib/seo.js).
  'cv/pracownik-sprzatajacy': { title: 'CV sprzątaczki 2026 – wzór dla pracownika sprzątającego', desc: 'Wzór CV sprzątaczki i pracownika utrzymania czystości: obiekty, maszyny czyszczące, dezynfekcja. Sprawdź CV za darmo albo zrób je pod ogłoszenie.' },
  'cv/przedstawiciel-handlowy': { title: 'CV handlowca 2026 – wzór dla przedstawiciela handlowego', desc: 'Wzór CV handlowca i przedstawiciela handlowego: sprzedaż B2B, pozyskiwanie klientów, wyniki i region. Sprawdź CV za darmo albo zrób je pod ogłoszenie.' },
  'cv/pracownik-budowlany': { title: 'CV budowlańca 2026 – wzór dla pracownika budowlanego', desc: 'Wzór CV budowlańca i pracownika budowlanego: murowanie, tynki, szalunki, wykończenia i BHP. Sprawdź CV za darmo albo zrób je pod ogłoszenie.' },
  'cv/nauczyciel-przedszkola': { title: 'CV przedszkolanki 2026 – wzór dla nauczyciela przedszkola', desc: 'Wzór CV przedszkolanki i nauczyciela przedszkola: kwalifikacje, podstawa programowa, praca z rodzicami. Sprawdź CV za darmo lub zrób je pod ogłoszenie.' },
  'cv/cukiernik': { title: 'CV cukiernika 2026 – wzór i słowa kluczowe z ogłoszeń', desc: 'Wzór CV cukiernika: produkcja wyrobów cukierniczych, dekorowanie tortów, praca z masą cukrową, HACCP. Sprawdź swoje CV za darmo lub zrób je pod ogłoszenie.' },
  'en/guides/gdpr-clause-on-a-cv': { desc: 'Copy the current GDPR (RODO) clause for a CV sent to Polish employers and the version for future recruitment. See when you need it and when to skip it.' },
};
