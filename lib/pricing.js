// Ceny w groszach (PLN)
export const PRICES = {
  cv: 3900, // samo CV
  cv_letter: 4900, // CV + list motywacyjny
  extraAd: 2000, // każde kolejne ogłoszenie
};
export const MAX_ADS = 5;

export function calcTotal(pkg, adsCount) {
  if (!(pkg in PRICES) || pkg === 'extraAd') throw new Error('Nieznany pakiet');
  if (!Number.isInteger(adsCount) || adsCount < 1 || adsCount > MAX_ADS) {
    throw new Error('Nieprawidłowa liczba ogłoszeń');
  }
  return PRICES[pkg] + PRICES.extraAd * (adsCount - 1);
}
