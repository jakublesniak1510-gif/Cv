// Ceny w groszach (PLN). Dodatki są naliczane raz na zamówienie (obejmują wszystkie ogłoszenia).
export const PRICES = {
  cv: 3900, // samo CV
  cv_letter: 4900, // CV + list motywacyjny
  extraAd: 2000, // każde kolejne ogłoszenie (także w zamówieniu uzupełniającym)
  interview: 1500, // przygotowanie do rozmowy
  messages: 900, // wiadomość do rekrutera + e-mail z aplikacją
};
export const MAX_ADS = 5;
export const ADDONS = { interview: 'Przygotowanie do rozmowy', messages: 'Wiadomość do rekrutera i e-mail z aplikacją' };

// Pozycje rachunku; followup = zamówienie pod kolejne ogłoszenia dla istniejącego klienta (dane już są).
export function lineItems(pkg, adsCount, addons = {}, followup = false) {
  if (pkg !== 'cv' && pkg !== 'cv_letter') throw new Error('Nieznany pakiet');
  if (!Number.isInteger(adsCount) || adsCount < 1 || adsCount > MAX_ADS) throw new Error('Nieprawidłowa liczba ogłoszeń');
  const doc = pkg === 'cv' ? 'CV' : 'CV + list motywacyjny';
  const items = followup
    ? [{ name: `${doc} pod kolejne ogłoszenie`, amount: PRICES.extraAd, quantity: adsCount }]
    : [{ name: doc, amount: PRICES[pkg], quantity: 1 }, ...(adsCount > 1 ? [{ name: `${doc} pod kolejne ogłoszenie`, amount: PRICES.extraAd, quantity: adsCount - 1 }] : [])];
  for (const k of Object.keys(ADDONS)) if (addons[k]) items.push({ name: ADDONS[k], amount: PRICES[k], quantity: 1 });
  return items;
}
export const calcTotal = (...a) => lineItems(...a).reduce((s, i) => s + i.amount * i.quantity, 0);
