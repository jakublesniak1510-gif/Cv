// Przykładowe dane do obejrzenia panelu administratora (NIE uruchamiaj na produkcji – nadpisuje pliki danych).
// Użycie: DATA_DIR=/tmp/cvpo-demo node scripts/admin-seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { calcTotal } from '../lib/pricing.js';

const DIR = process.env.DATA_DIR;
if (!DIR) { console.error('Ustaw DATA_DIR na katalog testowy.'); process.exit(1); }
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const NAMES = ['Anna Kowalska', 'Piotr Nowak', 'Katarzyna Wiśniewska', 'Tomasz Wójcik', 'Magdalena Kamińska', 'Michał Lewandowski', 'Agnieszka Zielińska', 'Paweł Szymański', 'Joanna Woźniak', 'Krzysztof Dąbrowski', 'Natalia Kozłowska', 'Marcin Jankowski'];
const ADS = ['Magazynier – Poznań', 'Księgowa / Księgowy', 'Specjalista ds. obsługi klienta', 'Kierowca kat. C+E', 'Pielęgniarka – oddział internistyczny', 'Junior Frontend Developer', 'Sprzedawca – kasjer', 'Recepcjonistka hotelowa', 'Elektryk przemysłowy', 'Asystentka biura'];
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').toLowerCase();
const now = Date.now(), day = 864e5;
const orders = {}, codes = {}, events = {};

for (let i = 0; i < 70; i++) {
  const ago = Math.floor(rnd() ** 1.25 * 29 * day + rnd() * day * 0.9);
  const created = now - ago, name = pick(NAMES), email = `${ascii(name).replace(' ', '.')}${i % 5 ? '' : i}@example.com`;
  const pkg = pick(['cv', 'cv_letter', 'cv_letter', 'cv_letter', 'pack3', 'pack3']), n = pkg === 'pack3' ? 1 + Math.floor(rnd() * 3) : 1;
  const addons = { interview: rnd() < 0.25, messages: rnd() < 0.15 }, extraLangs = rnd() < 0.15 ? ['en'] : [];
  const code = rnd() < 0.2 ? (rnd() < 0.5 ? 'START10' : `KOD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`) : null;
  const discount = code ? 1000 : 0;
  let status = ago < 40 * 60e3 ? pick(['pending', 'generating']) : rnd() < 0.1 ? 'pending' : 'done';
  if (i === 3) status = 'paid';
  const id = crypto.randomUUID();
  const ads = Array.from({ length: n }, () => ({ title: pick(ADS), lang: 'pl', text: 'x'.repeat(900) }));
  orders[id] = {
    id, pkg, addons, extraLangs, code, discount, total: calcTotal(pkg, n, addons, false, extraLangs, discount),
    profile: { name, email, phone: '+48 600 100 200', photo: rnd() < 0.4 ? 'data:,' : '' }, ads, design: { tpl: pick(['nowoczesny', 'os', 'szwajcarski', 'elegancki']), color: pick(['granat', 'morski', 'bordo']) },
    reminder: { consent: rnd() < 0.5, sent: false }, status, created, paidAt: status === 'pending' ? undefined : created + 90e3,
    revisions: status === 'done' ? Math.floor(rnd() * 3) : 0, myCode: status === 'done' ? `KOD-${id.slice(0, 6).toUpperCase()}` : null,
    results: status === 'done' ? ads.map((a) => ({ position: a.title, lang: 'pl', match: { score: 70 + Math.floor(rnd() * 30) }, variants: Object.fromEntries(extraLangs.map((l) => [l, {}])) })) : [],
    mail: status === 'done' ? { status: i === 8 ? 'failed' : 'sent', to: email, at: created + 150e3 } : undefined,
    error: status === 'paid' ? 'Generowanie nie powiodło się. Spróbuj ponownie.' : undefined,
    refund: i === 12 ? { id: 'demo', amount: calcTotal(pkg, n, addons, false, extraLangs, discount) / 100, reason: 'Klient zrezygnował', at: created + 3 * 3600e3 } : undefined,
  };
}
codes.START10 = { id: 'START10', amount: 1000, percent: 0, maxUses: 100, usedBy: Array.from({ length: 23 }, (_, i) => String(i)), note: 'Start strony – post na Facebooku', created: now - 20 * day, expires: now + 10 * day };
codes.JESIEN20 = { id: 'JESIEN20', amount: 0, percent: 20, maxUses: 0, usedBy: ['a', 'b', 'c', 'd'], note: 'Newsletter wrzesień', created: now - 6 * day, expires: now + 24 * day };
for (const o of Object.values(orders).filter((o) => o.myCode).slice(0, 8)) codes[o.myCode] = { id: o.myCode, amount: 1000, ownerOrderId: o.id, usedBy: [String(Math.floor(rnd() * 3))].slice(0, Math.floor(rnd() * 2)), created: o.created, expires: o.created + 90 * day };
const ev = (type, message, meta, ago) => { const id = `${now - ago}-${crypto.randomBytes(3).toString('hex')}`; events[id] = { id, type, message, meta, at: now - ago }; };
const failed = Object.values(orders).find((o) => o.mail?.status === 'failed'), broken = Object.values(orders).find((o) => o.status === 'paid');
ev('ogłoszenie', 'Serwis odrzucił zapytanie (kod 403).', { host: 'www.linkedin.com' }, 2 * 3600e3);
ev('ogłoszenie', 'Strona nie odpowiedziała na czas.', { host: 'www.olx.pl' }, 26 * 3600e3);
ev('import', 'Plik PDF nie zawiera tekstu (skan).', {}, 3 * day);
if (failed) ev('e-mail', '550 5.1.1 Mailbox does not exist', { orderId: failed.id }, failed ? now - failed.mail.at : 0);
if (broken) ev('generowanie', 'Przekroczono limit czasu odpowiedzi AI.', { orderId: broken.id }, now - broken.created);
const month = new Date().toISOString().slice(0, 7);
const usage = { [month]: { id: month, calls: 214, input: 2_100_000, output: 610_000, cacheRead: 1_400_000, cacheWrite: 90_000 } };

fs.mkdirSync(DIR, { recursive: true });
for (const [f, v] of Object.entries({ 'orders.json': orders, 'codes.json': codes, 'events.json': events, 'usage.json': usage })) fs.writeFileSync(path.join(DIR, f), JSON.stringify(v, null, 2));
console.log(`Zapisano ${Object.keys(orders).length} zamówień do ${DIR}`);
