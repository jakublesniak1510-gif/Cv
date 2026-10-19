# Chrome Web Store: teksty do zgłoszenia rozszerzenia

Paczka: `npm run build:extension` → `extension.zip` (bez folderu `store/` i tego pliku).
Zrzuty 1280×800: `extension/store/1-ogloszenie.png`, `2-kreator.png`, `3-skaner.png`.
Ikona sklepu 128×128: `extension/icons/128.png`.
Kategoria: **Productivity → Tools** (Produktywność → Narzędzia). Język domyślny: polski (dodatkowo uk, en, de).
Strona: https://cvpodogloszenie.pl · Polityka prywatności: https://cvpodogloszenie.pl/polityka-prywatnosci (punkt 12) · Kontakt: kontakt@cvpodogloszenie.pl

---

## PL

**Nazwa:** CV Pod Ogłoszenie – dopasuj CV do tej oferty

**Krótki opis (do 132 znaków):**
Jedno kliknięcie na stronie ogłoszenia o pracę: zrób CV pod tę ofertę albo sprawdź swoje CV darmowym skanerem.

**Pełny opis:**
Szukasz pracy i wysyłasz CV na konkretne ogłoszenia? To rozszerzenie oszczędza kopiowanie.

Jak działa:
1. Otwórz ogłoszenie o pracę (np. pracuj.pl, OLX Praca, justjoin.it, No Fluff Jobs, Indeed, LinkedIn albo dowolną inną stronę z ofertą).
2. Kliknij ikonę CV Pod Ogłoszenie.
3. Wybierz „Zrób CV pod to ogłoszenie” albo „Sprawdź moje CV (skaner)”.

Treść ogłoszenia trafia od razu do kreatora CV albo do darmowego skanera na cvpodogloszenie.pl. Skaner pokazuje, które wymagania z ogłoszenia widać w Twoim CV, a których brakuje. Kreator przygotowuje CV i list motywacyjny dopasowane do tej oferty (usługa płatna, skaner jest bezpłatny).

Prywatność:
- Rozszerzenie czyta stronę tylko wtedy, gdy klikniesz przycisk, i tylko w aktywnej karcie.
- Wysyłamy wyłącznie treść ogłoszenia, jego tytuł i adres strony, żeby otworzyć kreator lub skaner.
- Nie zbieramy historii przeglądania, nie śledzimy, nie wyświetlamy reklam.
- Szkic ogłoszenia jest kasowany z serwera po 2 godzinach.

Interfejs po polsku, ukraińsku, angielsku i niemiecku.

**Single purpose (jedno przeznaczenie):**
Przeniesienie treści ogłoszenia o pracę z aktywnej karty do kreatora CV lub skanera CV na cvpodogloszenie.pl po kliknięciu użytkownika.

**Uzasadnienie uprawnień:**
- `activeTab`: dostęp do aktywnej karty wyłącznie po kliknięciu ikony rozszerzenia, aby odczytać treść ogłoszenia, które użytkownik właśnie ogląda. Bez stałego dostępu do stron.
- `scripting`: jednorazowe uruchomienie w aktywnej karcie funkcji odczytującej tekst ogłoszenia (chrome.scripting.executeScript) po kliknięciu przycisku w okienku rozszerzenia. Kod jest w paczce rozszerzenia; nie pobieramy kodu z zewnątrz.
- Brak `host_permissions`, brak skryptów działających w tle, brak skryptów treści wstrzykiwanych automatycznie.

**Kod zdalny:** Nie. Cały kod jest w paczce.

**Privacy practices (praktyki dotyczące danych):**
- Zbierane dane: „Website content” (treść ogłoszenia z aktywnej karty, tytuł strony, adres URL) – tylko po kliknięciu, wyłącznie w celu działania funkcji.
- Nie zbieramy: danych osobowych, danych uwierzytelniających, finansowych, zdrowotnych, lokalizacji, historii przeglądania, aktywności użytkownika.
- Oświadczenia: nie sprzedajemy danych osobom trzecim; nie używamy ani nie przekazujemy danych w celach niezwiązanych z jedynym przeznaczeniem rozszerzenia; nie używamy ani nie przekazujemy danych do oceny zdolności kredytowej ani udzielania pożyczek.

---

## EN

**Name:** CV Pod Ogłoszenie – tailor your CV to this job

**Short description (max 132 characters):**
One click on a job ad page: get a CV tailored to this offer or check your CV with the free scanner.

**Full description:**
Looking for a job in Poland and sending your CV to specific job ads? This extension saves you the copying.

How it works:
1. Open a job ad (e.g. pracuj.pl, OLX Praca, justjoin.it, No Fluff Jobs, Indeed, LinkedIn or any other page with an offer).
2. Click the CV Pod Ogłoszenie icon.
3. Choose “Make a CV for this job ad” or “Check my CV (scanner)”.

The job ad text goes straight to the CV builder or to the free scanner on cvpodogloszenie.pl. The scanner shows which requirements from the ad are visible in your CV and which are missing. The builder prepares a CV and cover letter tailored to this offer (paid service; the scanner is free).

Privacy:
- The extension reads the page only when you click a button, and only in the active tab.
- We send only the job ad text, its title and the page address, to open the builder or the scanner.
- No browsing history, no tracking, no ads.
- The ad draft is deleted from our server after 2 hours.

Interface in Polish, Ukrainian, English and German.

**Single purpose:**
Transfer the text of a job ad from the active tab to the CV builder or CV scanner on cvpodogloszenie.pl when the user clicks.

**Permission justification:**
- `activeTab`: access to the active tab only after the user clicks the extension icon, to read the job ad the user is viewing. No persistent access to websites.
- `scripting`: a one-time run of a function that reads the job ad text in the active tab (chrome.scripting.executeScript) after the user clicks a button in the popup. The code ships with the extension; no remote code is loaded.
- No `host_permissions`, no background scripts, no automatically injected content scripts.

**Remote code:** No. All code is included in the package.

**Privacy practices:**
- Data collected: “Website content” (job ad text from the active tab, page title, URL) – only after a click, solely to provide the feature.
- Not collected: personally identifiable information, authentication, financial or health information, location, web history, user activity.
- Certifications: we do not sell data to third parties; we do not use or transfer data for purposes unrelated to the extension’s single purpose; we do not use or transfer data to determine creditworthiness or for lending purposes.
