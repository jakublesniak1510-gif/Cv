// Ceny w groszach (PLN). Dodatki są naliczane raz na zamówienie (obejmują wszystkie ogłoszenia).
export const PRICES = {
  cv: 3900, // samo CV pod 1 ogłoszenie
  cv_letter: 4900, // CV + list motywacyjny pod 1 ogłoszenie
  pack3: 7900, // pakiet: 3 CV pod ten sam zawód + list do każdego
  interview: 5000, // przygotowanie do rozmowy
  messages: 900, // wiadomość do rekrutera + e-mail z aplikacją
  linkedin: 1900, // profil LinkedIn pod stanowisko
  sim: 2900, // symulator rozmowy kwalifikacyjnej z AI
  docx: 900, // CV i list w edytowalnym formacie Word
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
export const ADDONS = { interview: 'Przygotowanie do rozmowy', messages: 'Wiadomość do rekrutera i e-mail z aplikacją', linkedin: 'Profil LinkedIn', sim: 'Symulator rozmowy kwalifikacyjnej', docx: 'CV i list w formacie Word (.docx)' };
// Pakiet „Pewna rozmowa”: list motywacyjny + przygotowanie do rozmowy + symulator razem taniej (CV z listem: 128 zł -> 109 zł).
export const BUNDLE_OFF = 1900;
export const hasBundle = (pkg, addons = {}) => !!PACKAGES[pkg]?.letter && !!addons.interview && !!addons.sim;
const MIN_ITEM = 200; // po rabacie pakiet kosztuje co najmniej 2 zł
export const withLetter = (pkg) => !!PACKAGES[pkg]?.letter;

// Pozycje rachunku. returning = klient zamawia ponownie z zapisanymi danymi (cena ta sama, inna nazwa).
export function lineItems(pkg, adsCount, addons = {}, returning = false, extraLangs = [], discount = 0) {
  const p = PACKAGES[pkg];
  if (!p) throw new Error('Nieznany pakiet');
  if (!Number.isInteger(adsCount) || adsCount < 1 || adsCount > p.ads) throw new Error(p.ads === 1 ? 'Ten pakiet obejmuje jedno ogłoszenie. Przy kilku ogłoszeniach wybierz Pakiet 3.' : `Pakiet obejmuje do ${p.ads} ogłoszeń.`);
  const items = [{ name: p.name + (returning ? ' (kolejne zamówienie)' : ''), amount: PRICES[pkg], quantity: 1 }];
  for (const k of Object.keys(ADDONS)) if (addons[k]) items.push({ name: ADDONS[k], amount: PRICES[k], quantity: 1 });
  if (hasBundle(pkg, addons)) { const iv = items.find((i) => i.name === ADDONS.interview); iv.amount -= BUNDLE_OFF; iv.name += ' (pakiet „Pewna rozmowa”)'; }
  for (const l of extraLangs) items.push({ name: `Tłumaczenie na język: ${LANGS[l]}`, amount: PRICES.extraLang, quantity: 1 });
  // Rabat odejmujemy od pierwszej pozycji (pakietu).
  if (discount === 'voucher') { items[0].amount = 0; items[0].name += ' (kod od instytucji)'; }
  else if (discount > 0) { const first = items[0]; const d = Math.min(discount, first.amount - MIN_ITEM); first.amount -= d; first.name += ` (rabat ${d / 100} zł)`; }
  return items;
}
export const calcTotal = (...a) => lineItems(...a).reduce((s, i) => s + i.amount * i.quantity, 0);

// Ceny B2B (paczki kodów dla instytucji i firm): rabat od liczby kodów, liczony od ceny pakietu i zaokrąglany
// w dół do pełnych złotych. Zmiana progów = zmiana tej tabeli. To ceny dla firm, bez informacji Omnibus.
export const B2B_TIERS = [{ min: 10, pct: 15 }, { min: 50, pct: 25 }, { min: 200, pct: 35 }];
export const B2B_MIN = 10, B2B_MAX = 2000;
export const B2B_PKGS = ['cv', 'cv_letter', 'pack3'];
export const b2bTier = (qty) => [...B2B_TIERS].reverse().find((t) => qty >= t.min) || null;
// Cena jednego kodu w groszach (pełne złote).
export function b2bUnit(pkg, qty) {
  const t = b2bTier(qty);
  if (!B2B_PKGS.includes(pkg) || !t) return null;
  return Math.floor((PRICES[pkg] * (100 - t.pct)) / 100 / 100) * 100;
}
export function b2bQuote(pkg, qty) {
  qty = Number(qty);
  if (!B2B_PKGS.includes(pkg)) throw new Error('Wybierz pakiet.');
  if (!Number.isInteger(qty) || qty < B2B_MIN || qty > B2B_MAX) throw new Error(`Liczba kodów: od ${B2B_MIN} do ${B2B_MAX}.`);
  const unit = b2bUnit(pkg, qty);
  return { pkg, qty, unit, total: unit * qty, pct: b2bTier(qty).pct, list: PRICES[pkg] };
}
// Tabela cen do stron i PDF oferty: { pkg: [cena przy progu 1, 2, 3] } w złotych.
export const b2bTable = () => Object.fromEntries(B2B_PKGS.map((p) => [p, B2B_TIERS.map((t) => b2bUnit(p, t.min) / 100)]));

// Dodatki po zakupie: cena = różnica między zamówieniem z dodatkiem i bez (te same ogłoszenia i języki, bez rabatów).
// letter: CV → CV z listem; interview / sim: dodatki; bundle: „Pewna rozmowa” (list + przygotowanie + symulator taniej o BUNDLE_OFF).
export const UPSELLS = { letter: 'List motywacyjny', interview: ADDONS.interview, sim: ADDONS.sim, bundle: 'Pakiet „Pewna rozmowa”' };
export function upsellPlan(o, key) {
  const pkg = (key === 'letter' || key === 'bundle') && o.pkg === 'cv' ? 'cv_letter' : o.pkg;
  const addons = { ...(key === 'interview' || key === 'bundle' ? { interview: true } : {}), ...(key === 'sim' || key === 'bundle' ? { sim: true } : {}) };
  const n = o.ads?.length || 1, langs = o.extraLangs || [];
  const includes = key === 'bundle' ? [!withLetter(o.pkg) && 'letter', !o.addons?.interview && 'interview', !o.addons?.sim && 'sim'].filter(Boolean) : [key];
  return { key, name: UPSELLS[key], pkg, addons, includes, price: calcTotal(pkg, n, { ...o.addons, ...addons }, false, langs) - calcTotal(o.pkg, n, o.addons || {}, false, langs) };
}
export function upsellOffers(o) {
  if (!o || o.status !== 'done' || o.upsellOf || !PACKAGES[o.pkg]) return [];
  const missing = [!withLetter(o.pkg) && 'letter', !o.addons?.interview && 'interview', !o.addons?.sim && 'sim'].filter(Boolean);
  return [...missing, ...(missing.length >= 2 ? ['bundle'] : [])].map((k) => upsellPlan(o, k)).filter((x) => x.price > 0);
}

// Karnety: jednorazowa płatność, bez subskrypcji i odnowienia. Dopasowanie = CV + list pod jedno ogłoszenie
// (z jednym dodatkowym językiem w cenie); symulator i przygotowanie do rozmowy z osobnych limitów karnetu.
export const PASSES = {
  start30: { name: 'Start 30', price: 9900, days: 30, matches: 8, sim: 1, interview: 0 },
  aktywny30: { name: 'Aktywny 30', price: 12900, days: 30, matches: 20, sim: 3, interview: 1, badge: 'Polecany' },
  maraton60: { name: 'Maraton 60', price: 19900, days: 60, matches: 50, sim: 10, interview: 2 },
};
export const PASS_LIMITS = { hour: 5, day: 15 };
// Cena za dopasowanie (fakt matematyczny: cena karnetu / liczba dopasowań), w groszach.
export const perMatch = (k) => Math.round(PASSES[k].price / PASSES[k].matches);
// Zamówienie z karnetem: każde ogłoszenie = 1 dopasowanie; symulator i przygotowanie z limitów karnetu, gdy są;
// pozostałe dodatki, wyczerpane limity i języki ponad jeden – płatne jak zwykle. Zwraca zużycie i pozycje do zapłaty.
export function passCharge(left, adsCount, addons = {}, extraLangs = []) {
  if (!Number.isInteger(adsCount) || adsCount < 1 || adsCount > MAX_ADS) throw new Error(`Jedno zamówienie to od 1 do ${MAX_ADS} ogłoszeń.`);
  if ((left?.matches || 0) < adsCount) throw new Error(`W karnecie zostało ${left?.matches || 0} dopasowań, a zamówienie obejmuje ${adsCount} ${adsCount === 1 ? 'ogłoszenie' : 'ogłoszenia'}.`);
  const use = { matches: adsCount, sim: addons.sim && left.sim > 0 ? 1 : 0, interview: addons.interview && left.interview > 0 ? 1 : 0 };
  const items = [];
  const paidInterview = addons.interview && !use.interview, paidSim = addons.sim && !use.sim;
  for (const k of Object.keys(ADDONS)) {
    if (!addons[k] || (k === 'interview' && !paidInterview) || (k === 'sim' && !paidSim)) continue;
    items.push({ name: ADDONS[k], amount: PRICES[k], quantity: 1 });
  }
  if (paidInterview && paidSim) { const iv = items.find((i) => i.name === ADDONS.interview); iv.amount -= BUNDLE_OFF; iv.name += ' (pakiet „Pewna rozmowa”)'; }
  for (const l of extraLangs.slice(1)) items.push({ name: `Tłumaczenie na język: ${LANGS[l]}`, amount: PRICES.extraLang, quantity: 1 });
  return { use, items, total: items.reduce((s, i) => s + i.amount * i.quantity, 0) };
}
