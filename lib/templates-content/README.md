# Treści darmowych wzorów (PR-C)

Jeden plik na zawód: `lib/templates-content/<slug>.js`, `export default { ... }` w poniższym kształcie.
Strony: `/wzor-cv/<slug>` (CV) i `/list-motywacyjny/<slug>` (list). Sprawdzenie: `node scripts/check-templates.mjs`.

```js
export default {
  slug: 'kasjer',                    // adres strony
  name: 'Kasjer / Kasjerka',         // nazwa zawodu (mianownik)
  nameIn: 'kasjera',                 // „wzór CV dla …” (dopełniacz)
  profSlug: 'kasjer',                // istniejąca strona /cv/<profSlug> albo null
  cv: {
    title: 'Wzór CV kasjera – darmowy plik DOCX do pobrania',   // H1
    seoTitle: '…',                   // <title>, do ~60 znaków
    metaDescription: '…',            // 120–155 znaków
    intro: '…',                      // 2–4 zdania pod H1
    sections: [                      // min. 4 sekcje; razem z intro, keywords, phrases i avoid ≥ 600 słów
      { h: 'Co rekruter sprawdza w CV kasjera', p: ['akapit', 'akapit'], list: ['opcjonalne punkty'] },
      { h: 'Typowe wymagania z ogłoszeń', p: [...], list: [...] },
      …
    ],
    keywords: ['obsługa kasy fiskalnej', …],          // 10–15 słów kluczowych z ogłoszeń
    phrases: { summary: ['2–3 przykładowe podsumowania'], experience: ['6–8 zdań do doświadczenia'], skills: ['6–8 pozycji'] },
    avoid: ['4–6 rzeczy, których unikać, każda jednym–dwoma zdaniami'],
    faq: [{ q: '…?', a: '…' }],      // 4–5 pytań, odpowiedzi 2–4 zdania
    sample: {                        // fikcyjna osoba do pliku DOCX i podglądu (oznaczona jako przykład)
      name: 'Anna Przykładowa', headline: 'Kasjerka',
      contact: ['+48 600 000 000', 'anna.przykladowa@example.com', 'Łódź'],
      summary: '…',
      experience: [{ title: '…', company: 'fikcyjna nazwa', period: '03.2022 – obecnie', bullets: ['…', '…', '…'] }],   // 2 stanowiska (student: praktyki, wolontariat, praca dorywcza)
      education: [{ school: '…', degree: '…', period: '…' }],
      skills: ['…'], languages: ['angielski B1'], certificates: ['…'], interests: '…',
    },
  },
  letter: {
    title: 'List motywacyjny kasjera – darmowy wzór DOCX', seoTitle: '…', metaDescription: '…', intro: '…',
    sections: [ … min. 4 sekcje, ≥ 600 słów razem z intro i phrases … ],   // jak zacząć, co podkreślić w tym zawodzie, jak odnieść się do ogłoszenia, zakończenie
    phrases: { opening: ['3 przykładowe pierwsze zdania'], body: ['5–6 zdań do treści'], closing: ['3 zakończenia'] },
    faq: [{ q, a }],                 // 4–5 pytań (inne niż przy CV)
    sample: { recipient: 'Dział Rekrutacji\nfikcyjna firma', subject: 'Dotyczy: …', text: 'pełny list 200–300 słów, akapity rozdzielone pustą linią, bez podpisu i daty' },
  },
};
```

Zasady treści:
- Po polsku, konkretnie i merytorycznie, tylko o tym zawodzie (to, co jest prawdą dla rynku pracy w Polsce: uprawnienia, certyfikaty, badania, typowe programy i urządzenia).
- Bez obietnic zatrudnienia, bez liczb skuteczności („zwiększy szanse o 70%”), bez wymyślonych statystyk i bez kwot wynagrodzeń.
- Nie kopiuj tekstów z `lib/content*.js` ani z innych plików w tym katalogu – treść ma być unikalna.
- Dane przykładowe fikcyjne: adresy `@example.com`, telefony `+48 600 000 0xx`, firmy wymyślone (nie istniejące marki).
- Bez formatowania Markdown w tekstach (zwykłe zdania; listy przez `list`).
