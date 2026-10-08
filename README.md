# CV Pod Ogłoszenie

Strona generująca CV i listy motywacyjne dopasowane do konkretnego ogłoszenia (Claude), z płatnością Stripe.

| Pakiet | Cena |
|---|---|
| CV | 39 zł |
| CV + list motywacyjny | 49 zł |
| Pakiet 3: trzy CV pod ten sam zawód + list do każdego | 79 zł |

## Uruchomienie
```
npm install
cp .env.example .env   # uzupełnij klucze
npm start              # http://localhost:3000
```
- Bez `STRIPE_SECRET_KEY` działa **tryb DEMO** (płatność symulowana).
- Bez `ANTHROPIC_API_KEY` CV składa się z podanych danych bez dopasowania AI, a list jest tylko szablonem.
- Produkcja: ustaw `BASE_URL`, a w Stripe dodaj webhook `POST /api/stripe-webhook` (zdarzenie `checkout.session.completed`) i wpisz `STRIPE_WEBHOOK_SECRET`. BLIK włącz w panelu Stripe (metody płatności).

## Struktura
- `server.js` – API, Stripe Checkout, webhook, kolejka generowania
- `lib/pricing.js` – cennik (kwota zawsze liczona po stronie serwera)
- `lib/generate.js` – prompt i wywołanie Claude
- `public/` – strona główna, kreator zamówienia (okno otwierane przyciskiem) i widok wyniku z PDF przez drukowanie
- `lib/tailor.js` – proste dopasowanie bez AI (tryb zapasowy i podgląd)
- `scripts/build-preview.mjs` – składa statyczny podgląd: `node scripts/build-preview.mjs out.html`
- Zamówienia: `data/orders.json` (plik; do produkcji zamień na bazę danych)

## Wdrożenie na Render (najprostsze)
1. Wejdź na render.com → **New → Blueprint** → wybierz to repozytorium (wykryje `render.yaml`).
2. Wpisz zmienne: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `BASE_URL` (adres z Render, potem własna domena).
3. W Stripe: Developers → Webhooks → dodaj `BASE_URL/api/stripe-webhook`, zdarzenie `checkout.session.completed`, skopiuj sekret do `STRIPE_WEBHOOK_SECRET`.
4. Włącz BLIK w Stripe → Settings → Payment methods.
Dane zamówień trwają na dysku `/data` (zmienna `DATA_DIR`).

## Ogłoszenie z linku
`POST /api/fetch-ad {url}` pobiera stronę (`lib/fetchAd.js`), czyta dane `JobPosting` (JSON-LD) albo główny tekst strony i zwraca `{title, company, text}`. Klient widzi wynik i może go poprawić; gdy pobranie się nie uda (np. LinkedIn), wkleja treść ręcznie. Zabezpieczenia: tylko http/https, blokada adresów prywatnych sprawdzana przy łączeniu (SSRF, DNS rebinding), limit 1,5 MB i 10 s, 3 przekierowania, limit 20 pobrań / 10 min na IP.

## Dokumenty prawne
Regulamin i polityka prywatności są w `public/index.html` (widoki `#regulamin`, `#prywatnosc`) jako **wzory**. Przed sprzedażą uzupełnij pola w `[nawiasach]`, usuń ramki `.draft` i skonsultuj tekst z prawnikiem. Kreator wymaga dwóch zgód: akceptacji regulaminu/polityki oraz zgody na wykonanie usługi od razu (utrata prawa odstąpienia dla treści cyfrowych). Dane zamówień nie są jeszcze automatycznie usuwane po okresie podanym w regulaminie.

## Wysyłka dokumentów e-mailem
Po wygenerowaniu serwer renderuje PDF (`lib/pdf.js`, czcionka Inter z `fonts/`) i wysyła je klientowi jako załączniki (`lib/mail.js`, nodemailer). Ustaw `SMTP_URL` i `MAIL_FROM` (nadawca musi mieć skonfigurowaną domenę: SPF/DKIM u dostawcy poczty, inaczej wiadomości trafią do spamu). Bez `SMTP_URL` maile nie są wysyłane, a klient pobiera dokumenty na stronie. Błąd wysyłki nie psuje zamówienia; strona pokazuje komunikat i przycisk „Wyślij ponownie” (`POST /api/orders/:id/resend`, limit raz na minutę).

## Szablony CV
6 szablonów (`nowoczesny`, `os` – oś czasu, `szwajcarski`, `geometria`, `elegancki`, `klasyczny` – ATS) × 6 kolorów, zdefiniowane w `lib/designs.js` i zduplikowane w `public/app.js` (TPLS, COLORS). Na stronie wygląd robi CSS (`.paper.t-*`, zmienna `--acc`), w e-mailu `lib/pdf.js` (pdfkit; czcionki Inter i Caladea w `fonts/`). Klient wybiera wygląd w kreatorze, a po zakupie może go zmienić (`POST /api/orders/:id/design`); kolejne wysyłki e-mail idą w nowym wyglądzie.

## Funkcje dodatkowe
- **Raport dopasowania** – przy każdym CV: spełnione i brakujące wymagania z ogłoszenia (`match` w wyniku). Brakujące można dopisać jednym kliknięciem (poprawka z `resolves`).
- **Edycja i darmowa poprawka** – `PUT /api/orders/:id/results/:i` (ręczna edycja) i `POST /api/orders/:id/revise` (AI, maks. 10 na zamówienie).
- **Import starego CV** – `POST /api/import` (PDF/DOCX/TXT do 5 MB; `lib/importCv.js`); plik nie jest zapisywany.
- **Zdjęcie** – przycinane w przeglądarce do 480×480 JPEG, pokazywane we wszystkich szablonach (na stronie i w PDF); nie trafia do AI.
- **Wersja angielska** – język dokumentów per ogłoszenie (`auto`/`pl`/`en`), bez dopłaty.
- **Dodatki** – przygotowanie do rozmowy (15 zł) i wiadomość do rekrutera + e-mail (9 zł); ceny w `lib/pricing.js`.
- **Kolejne zamówienie** – `POST /api/orders/:id/followup`: klient wybiera pakiet (CV / CV + list / Pakiet 3), dane z poprzedniego zamówienia.
- **Kod zniżkowy dla kupującego** – po każdym opłaconym zamówieniu kod `ZNIZKA-…` na 10 zł (90 dni), zapowiadany przed zakupem (cennik, kreator, FAQ).
- **Usuwanie danych po 30 dniach** – automatycznie co godzinę (`deleteOlderThan` w `lib/store.js`).
- **Podstrony SEO** – `/cv/:zawod`, `/poradnik/:artykul`, `/sitemap.xml`, `/robots.txt`; treści w `lib/content.js`.
- Model AI: `claude-opus-5-5` (zmiana przez `ANTHROPIC_MODEL`), z automatycznym przejściem na model zapasowy przy odmowie.

## Własna domena
Kup domenę (np. w OVH, home.pl, nazwa.pl), w panelu Render dodaj ją w Settings → Custom Domains i ustaw rekordy DNS według instrukcji Render. Potem zmień `BASE_URL` na nowy adres i zaktualizuj adres webhooka w Stripe.

## Skaner, polecenia, przypomnienia, języki, asystent
- **Darmowy skaner CV** – `POST /api/scan` (plik CV + treść ogłoszenia → wynik, spełnione/brakujące wymagania, 3 rady). Nic nie jest zapisywane; limit 6 skanów/godz. na IP. Z wyniku jednym kliknięciem przechodzi się do kreatora z zaimportowanym CV i ogłoszeniem.
- **50 zawodów** – `lib/content.js` (+ `content-a.js`, `content-b.js`), wyszukiwarka na stronie głównej; gdy zawodu brak, klient tworzy CV samodzielnie w kreatorze.
- **Program poleceń** – po zamówieniu klient dostaje kod `POLEC-…` (90 dni). Polecony płaci 10 zł mniej; polecający dostaje kupon `NAGRODA-…` na 10 zł (e-mail + strona dokumentów). Kody w `data/codes.json`, kasowane po 90 dniach.
- **Przypomnienie po 7 dniach** – jednorazowy e-mail tylko za zgodą zaznaczoną w zamówieniu.
- **Języki** – główny język (pl/en/de/uk/es/fr) w cenie; dodatkowe wersje po 5 zł za język (tłumaczenie gotowych dokumentów, warianty w `result.variants`).
- **Asystent** – `POST /api/assistant`, krótkie odpowiedzi o CV (limit 30 pytań/godz. na IP); bez klucza AI odpowiada z małej bazy wiedzy.
