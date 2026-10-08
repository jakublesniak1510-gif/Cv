# CV Pod Ogłoszenie

Strona generująca CV i listy motywacyjne dopasowane do konkretnego ogłoszenia (Claude), z płatnością Stripe.

| Pakiet | Cena |
|---|---|
| CV | 39 zł |
| CV + list motywacyjny | 49 zł |
| Każde kolejne ogłoszenie (osobne CV/list) | +20 zł |

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
