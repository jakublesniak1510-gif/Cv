// Ceny w groszach (PLN). Dodatki są naliczane raz na zamówienie (obejmują wszystkie ogłoszenia).
export const PRICES = {
  cv: 3900, // samo CV
  cv_letter: 4900, // CV + list motywacyjny
  extraAd: 2000, // każde kolejne ogłoszenie (także w zamówieniu uzupełniającym)
  interview: 1500, // przygotowanie do rozmowy
  messages: 900, // wiadomość do rekrutera + e-mail z aplikacją
  extraLang: 500, // każda dodatkowa wersja językowa dokumentów
};
export const REFERRAL_DISCOUNT = 1000; // rabat dla poleconego i nagroda dla polecającego
export const MAX_ADS = 5;
export const LANGS = { pl: 'polski', en: 'angielski', de: 'niemiecki', uk: 'ukraiński', es: 'hiszpański', fr: 'francuski' };
export const ADDONS = { interview: 'Przygotowanie do rozmowy', messages: 'Wiadomość do rekrutera i e-mail z aplikacją' };
const MIN_ITEM = 200; // Stripe nie przyjmie pozycji tańszej niż ok. 2 zł

// Pozycje rachunku; followup = zamówienie pod kolejne ogłoszenia dla istniejącego klienta (dane już są).
export function lineItems(pkg, adsCount, addons = {}, followup = false, extraLangs = [], discount = 0) {
  if (pkg !== 'cv' && pkg !== 'cv_letter') throw new Error('Nieznany pakiet');
  if (!Number.isInteger(adsCount) || adsCount < 1 || adsCount > MAX_ADS) throw new Error('Nieprawidłowa liczba ogłoszeń');
  const doc = pkg === 'cv' ? 'CV' : 'CV + list motywacyjny';
  const items = followup
    ? [{ name: `${doc} pod kolejne ogłoszenie`, amount: PRICES.extraAd, quantity: adsCount }]
    : [{ name: doc, amount: PRICES[pkg], quantity: 1 }, ...(adsCount > 1 ? [{ name: `${doc} pod kolejne ogłoszenie`, amount: PRICES.extraAd, quantity: adsCount - 1 }] : [])];
  for (const k of Object.keys(ADDONS)) if (addons[k]) items.push({ name: ADDONS[k], amount: PRICES[k], quantity: 1 });
  for (const l of extraLangs) items.push({ name: `Dodatkowa wersja językowa: ${LANGS[l]}`, amount: PRICES.extraLang, quantity: 1 });
  // Rabat odejmujemy od pierwszej pozycji (Stripe Checkout nie przyjmuje ujemnych kwot).
  if (discount > 0) { const first = items[0]; const d = Math.min(discount, first.amount - MIN_ITEM); first.amount -= d; first.name += ` (rabat ${d / 100} zł)`; }
  return items;
}
export const calcTotal = (...a) => lineItems(...a).reduce((s, i) => s + i.amount * i.quantity, 0);
