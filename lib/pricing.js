// Ceny w groszach (PLN). Dodatki są naliczane raz na zamówienie (obejmują wszystkie ogłoszenia).
export const PRICES = {
  cv: 3900, // samo CV pod 1 ogłoszenie
  cv_letter: 4900, // CV + list motywacyjny pod 1 ogłoszenie
  pack3: 7900, // pakiet: 3 CV pod ten sam zawód + list do każdego
  interview: 1500, // przygotowanie do rozmowy
  messages: 900, // wiadomość do rekrutera + e-mail z aplikacją
  extraLang: 500, // każda dodatkowa wersja językowa dokumentów
};
export const PACKAGES = {
  cv: { name: 'CV', ads: 1, letter: false },
  cv_letter: { name: 'CV + list motywacyjny', ads: 1, letter: true },
  pack3: { name: 'Pakiet 3 CV + listy motywacyjne', ads: 3, letter: true },
};
// Po zakupie klient dostaje jeden kod: −10 zł dla siebie na kolejne zamówienie i dla znajomych (każda osoba raz).
export const CODE_DISCOUNT = 1000;
export const MAX_ADS = 3;
export const LANGS = { pl: 'polski', en: 'angielski', de: 'niemiecki', uk: 'ukraiński', es: 'hiszpański', fr: 'francuski' };
export const ADDONS = { interview: 'Przygotowanie do rozmowy', messages: 'Wiadomość do rekrutera i e-mail z aplikacją' };
const MIN_ITEM = 200; // Stripe nie przyjmie pozycji tańszej niż ok. 2 zł
export const withLetter = (pkg) => !!PACKAGES[pkg]?.letter;

// Pozycje rachunku. returning = klient zamawia ponownie z zapisanymi danymi (cena ta sama, inna nazwa).
export function lineItems(pkg, adsCount, addons = {}, returning = false, extraLangs = [], discount = 0) {
  const p = PACKAGES[pkg];
  if (!p) throw new Error('Nieznany pakiet');
  if (!Number.isInteger(adsCount) || adsCount < 1 || adsCount > p.ads) throw new Error(p.ads === 1 ? 'Ten pakiet obejmuje jedno ogłoszenie. Przy kilku ogłoszeniach wybierz Pakiet 3.' : `Pakiet obejmuje do ${p.ads} ogłoszeń.`);
  const items = [{ name: p.name + (returning ? ' (kolejne zamówienie)' : ''), amount: PRICES[pkg], quantity: 1 }];
  for (const k of Object.keys(ADDONS)) if (addons[k]) items.push({ name: ADDONS[k], amount: PRICES[k], quantity: 1 });
  for (const l of extraLangs) items.push({ name: `Dodatkowa wersja językowa: ${LANGS[l]}`, amount: PRICES.extraLang, quantity: 1 });
  // Rabat odejmujemy od pierwszej pozycji (Stripe Checkout nie przyjmuje ujemnych kwot).
  if (discount > 0) { const first = items[0]; const d = Math.min(discount, first.amount - MIN_ITEM); first.amount -= d; first.name += ` (rabat ${d / 100} zł)`; }
  return items;
}
export const calcTotal = (...a) => lineItems(...a).reduce((s, i) => s + i.amount * i.quantity, 0);
