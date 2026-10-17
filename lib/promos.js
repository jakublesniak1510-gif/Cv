// Kalendarz promocji: w tych terminach kod działa sam (zakładamy go w bazie kodów, więc w panelu widać jego użycia),
// a na stronie pojawia się pasek z rabatem. Każda osoba (adres e-mail) może użyć kodu raz. PROMOS=0 wyłącza kalendarz.
import { codes } from './store.js';
import { PRICES, PACKAGES } from './pricing.js';

// [miesiąc, dzień] według czasu polskiego; "blackWeek" = od poniedziałku przed Black Friday do Cyber Monday.
export const PROMOS = [
  { code: 'NOWYROK', percent: 15, from: [1, 2], to: [1, 18], label: 'Nowy rok, nowa praca' },
  { code: 'ABSOLWENT', percent: 15, from: [6, 16], to: [7, 15], label: 'Dla absolwentów i na wakacyjną pracę' },
  { code: 'WRZESIEN', percent: 15, from: [9, 1], to: [9, 15], label: 'Wrzesień: nowy start' },
  { code: 'BLACKWEEK', percent: 25, blackWeek: true, label: 'Black Week' },
];

const warsaw = (now) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now).map((x) => [x.type, +x.value]));
  return { y: p.year, m: p.month, d: p.day };
};
const key = (m, d) => m * 100 + d;
// Black Friday: piątek po czwartym czwartku listopada.
function blackWeek(y) {
  const first = new Date(Date.UTC(y, 10, 1)).getUTCDay(), thu = 1 + ((4 - first + 7) % 7) + 21, fri = thu + 1;
  const mon = new Date(Date.UTC(y, 10, fri - 4)), cyber = new Date(Date.UTC(y, 10, fri + 3));
  return { from: [mon.getUTCMonth() + 1, mon.getUTCDate()], to: [cyber.getUTCMonth() + 1, cyber.getUTCDate()] };
}

// Zakres promocji w danym roku jako daty (UTC, dni kalendarzowe).
const range = (p, y) => { const r = p.blackWeek ? blackWeek(y) : p; return { from: Date.UTC(y, r.from[0] - 1, r.from[1]), to: Date.UTC(y, r.to[0] - 1, r.to[1]), to_: r.to }; };

// Omnibus: najniższa cena każdego pakietu z 30 dni przed początkiem obniżki. Jeśli w tych 30 dniach trwała inna
// promocja z kalendarza, obowiązuje cena po tamtym (największym) rabacie; inaczej cena regularna z cennika.
export function lowestBefore(promo, y, list = PROMOS) {
  const start = range(promo, y).from, winFrom = start - 30 * 864e5;
  let pct = 0;
  for (const p of list) for (const yy of [y - 1, y]) {
    if (p.code === promo.code && yy === y) continue;
    const r = range(p, yy);
    if (r.from < start && r.to >= winFrom) pct = Math.max(pct, p.percent);
  }
  return Object.fromEntries(Object.keys(PACKAGES).map((k) => [k, (PRICES[k] - Math.round((PRICES[k] * pct) / 100)) / 100]));
}

// Aktywna promocja (albo null). "until" = koniec ostatniego dnia (ok. północy czasu polskiego); "lowest" = ceny do dopisku Omnibus.
export function activePromo(now = process.env.PROMO_DATE ? new Date(process.env.PROMO_DATE) : new Date()) { // PROMO_DATE: podgląd promocji poza terminem (testy)
  if (process.env.PROMOS === '0') return null;
  const { y, m, d } = warsaw(now), today = key(m, d);
  for (const p of PROMOS) {
    const r = p.blackWeek ? blackWeek(y) : p;
    if (today >= key(...r.from) && today <= key(...r.to)) {
      const [tm, td] = r.to;
      return { code: p.code, percent: p.percent, label: p.label, until: Date.UTC(y, tm - 1, td, 22, 59), lowest: lowestBefore(p, y) };
    }
  }
  return null;
}

// Zakłada kod aktywnej promocji w bazie kodów (raz na okres promocji); stare kody znikają same po wygaśnięciu.
export async function ensurePromoCode(now) {
  const p = activePromo(now);
  if (!p) return null;
  const c = await codes.get(p.code);
  if (!c || c.expires < Date.now()) await codes.save({ id: p.code, amount: 0, percent: p.percent, voucher: null, maxUses: 0, usedBy: [], note: `Kalendarz promocji: ${p.label}`, created: Date.now(), expires: p.until });
  return p;
}
