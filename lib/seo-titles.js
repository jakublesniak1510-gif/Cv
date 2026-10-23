// Tytuły i opisy stron zawodów do wyników Google: z szablonu i danych zawodu (bez ręcznego pisania 450 tytułów).
// Odmiana pochodzi z ręcznie napisanych nagłówków stron („CV hydraulika: wzór i wskazówki” → „hydraulika”), więc szablon
// nie odmienia słów sam. Tytuł ≤ 60 znaków: pierwszy wariant, który się mieści; opis ≤ 155: tyle słów kluczowych, ile się zmieści.
const T = {
  pl: {
    name: (p) => /^CV (.+?):/.exec(p.title)?.[1],
    titles: (n) => [`CV ${n} pod ogłoszenie – wzór i generator`, `CV ${n} pod ogłoszenie – wzór`, `CV ${n} pod ogłoszenie`],
    desc: (n, kw) => `Wzór CV ${n}${kw ? ` ze słowami kluczowymi z ogłoszeń: ${kw}` : ' ze słowami kluczowymi z ogłoszeń'}. Wygeneruj CV pod ogłoszenie lub sprawdź swoje darmowym skanerem.`,
  },
  en: {
    name: (p) => /^(.+?) CV: /.exec(p.title)?.[1],
    titles: (n) => [`${n} CV for a job ad – template and generator`, `${n} CV for a job ad – template`, `${n} CV for a job ad`, `${n} CV template`],
    desc: (n, kw) => `${n} CV template with keywords from job ads${kw ? `: ${kw}` : ''}. Create a CV for the job ad or check yours with the free scanner.`,
  },
  de: {
    name: (p) => /^Lebenslauf (.+?): /.exec(p.title)?.[1],
    titles: (n) => [`Lebenslauf ${n} zur Stellenanzeige – Muster und Generator`, `Lebenslauf ${n} zur Stellenanzeige – Muster`, `Lebenslauf ${n} zur Stellenanzeige`, `Lebenslauf ${n}: Muster`, `Lebenslauf ${n}`],
    desc: (n, kw) => `Lebenslauf-Muster ${n} mit Schlüsselwörtern aus Anzeigen${kw ? `: ${kw}` : ''}. Lebenslauf zur Stellenanzeige erstellen oder kostenlos prüfen.`,
  },
};
export const PROF_SEO_LANGS = Object.keys(T);
export const profName = (p, l = 'pl') => T[l]?.name(p) || null;

export function profSeo(p, l = 'pl') {
  const t = T[l], n = t && t.name(p);
  if (!n) return {};
  const seoTitle = t.titles(n).find((x) => x.length <= 60);
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
    'cv-po-angielsku': 'Napisz CV po angielsku: sekcje, daty i różnice',
    'email-z-aplikacja-i-podziekowanie-po-rozmowie': 'Napisz e-mail z CV i podziękowanie po rozmowie – wzory',
    'klauzula-rodo-w-cv': 'Klauzula RODO w CV {rok}: aktualna treść do skopiowania',
    'cv-dla-studenta': 'Napisz CV dla studenta: praktyki, staż i praca dorywcza',
    'podsumowanie-zawodowe-w-cv': 'Napisz podsumowanie zawodowe w CV – przykłady i długość',
    'zdjecie-w-cv': 'Zdjęcie w CV: sprawdź, czy je dodać i jakie wybrać',
  },
  de: {
    'cv-do-pracy-w-polsce': 'Lebenslauf für Polen schreiben: Format, Sprache, RODO',
    'klauzula-rodo-w-cv': 'DSGVO-Klausel im Lebenslauf {rok}: Wortlaut zum Kopieren',
  },
  en: {
    'klauzula-rodo-w-cv': 'GDPR (RODO) clause on a CV {rok}: wording to copy',
    'cv-po-angielsku': 'Write a CV in English: sections, dates and differences',
  },
};
export const artSeoTitle = (l, slug, date) => ART_SEO[l]?.[slug]?.replace('{rok}', String(date || new Date().toISOString()).slice(0, 4));
