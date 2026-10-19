import { makeStore, codes } from './store.js';
import { PACKAGES } from './pricing.js';
import { mailEnabled, sendPlainMail, sendOwnerMail } from './mail.js';
import { logEvent } from './events.js';
import { b2bOrders, partnerApps, reportUrl } from './b2b.js';

// 1. dnia miesiąca (po 8:00 czasu polskiego, raz): podsumowania dla partnerów i instytucji (wiadomości w ramach umowy,
// nie marketing) oraz lista wypłat prowizji do zrobienia dla właściciela.
const runs = makeStore('b2b-runs.json');
export const PAYOUT_MIN = 5000;
const zl = (gr) => `${((gr || 0) / 100).toLocaleString('pl-PL', { minimumFractionDigits: (gr || 0) % 100 ? 2 : 0, maximumFractionDigits: 2 })} zł`;
const plDate = (t) => new Date(t).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric' });
const parts = (d) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hourCycle: 'h23' }).formatToParts(d).map((p) => [p.type, p.value]));
const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

export async function b2bMonthly(base, now = new Date(), { force = false } = {}) {
  const p = parts(now), ym = `${p.year}-${p.month}`;
  if (!force && (p.day !== '01' || +p.hour < 8)) return null;
  if (!force && (await runs.get('monthly'))?.ym === ym) return null;
  // Lista już wysłanych w tym miesiącu: po restarcie w trakcie wysyłki kolejny przebieg dokończy resztę bez duplikatów.
  const doneKey = `monthly-${ym}`, done = new Set((await runs.get(doneKey))?.ids || []);
  const mark = async (k) => { done.add(k); await runs.save({ id: doneKey, ids: [...done], at: Date.now() }); };
  const prev = new Date(Date.UTC(+p.year, +p.month - 2, 15)), label = `${MONTHS[prev.getUTCMonth()]} ${prev.getUTCFullYear()}`;
  const t = now.getTime(), all = Object.values(await codes.all()), sent = { partners: 0, institutions: 0, payouts: 0 };
  const mail = async (to, subject, text) => { if (!mailEnabled() || !to) return false; try { await sendPlainMail({ to, subject, text }); return true; } catch (e) { logEvent('e-mail', `Podsumowanie miesiąca: ${e.message}`); return false; } };

  // Partnerzy (także doradcy z darmowym kodem): wynik miesiąca = różnica od poprzedniego podsumowania.
  for (const c of all.filter((x) => x.partnerApp && t < x.expires && !x.disabled)) {
    if (done.has(`p:${c.id}`)) continue;
    const a = await partnerApps.get(c.partnerApp); if (!a || a.status !== 'approved') continue;
    const now0 = { uses: (c.usedBy || []).length, sales: c.sales || 0, revenue: c.revenue || 0, accrued: (c.due || 0) + (c.paidOut || 0) }, last = c.monthSnap || { uses: 0, sales: 0, revenue: 0, accrued: 0 };
    const d = Object.fromEntries(Object.keys(now0).map((k) => [k, Math.max(0, now0[k] - (last[k] || 0))]));
    const lines = c.commission > 0
      ? [`Użycia kodu: ${d.uses}`, `Opłacone zamówienia: ${d.sales}`, `Sprzedaż z kodem: ${zl(d.revenue)}`, `Naliczona prowizja: ${zl(d.accrued)}`, '', `Do wypłaty teraz: ${zl(c.due)}${c.due >= PAYOUT_MIN ? ' (wypłata do 15. dnia miesiąca)' : ` (wypłacamy od ${zl(PAYOUT_MIN)}; saldo przechodzi na kolejny miesiąc)`}`, c.due >= PAYOUT_MIN && !c.bank ? 'Uzupełnij numer rachunku na stronie statystyk, żebyśmy mogli zrobić przelew.' : null]
      : [`Użycia kodu: ${d.uses} (od początku: ${now0.uses})`];
    const ok = await mail(a.email, `Twój kod ${c.id}: podsumowanie, ${label}`, `Dzień dobry,\n\npodsumowanie Twojego kodu ${c.id} za ${label}:\n\n${lines.filter((x) => x !== null).join('\n')}\n\nSzczegóły i historia wypłat: ${reportUrl(base, c)}\nKod ważny do ${plDate(c.expires)}.\n\nTę wiadomość wysyłamy raz w miesiącu w ramach programu partnerskiego.\n\nPozdrawiamy,\nCV Pod Ogłoszenie`);
    if (ok) { sent.partners++; await codes.update(c.id, { monthSnap: now0 }); await mark(`p:${c.id}`); }
  }

  // Instytucje z aktywną paczką kodów.
  for (const c of all.filter((x) => x.voucher && x.b2bOrder && t < x.expires && !x.disabled)) {
    if (done.has(`i:${c.id}`)) continue;
    const b = await b2bOrders.get(c.b2bOrder); if (!b) continue;
    const used = (c.usedBy || []).length, total = c.maxUses || 0, pct = total ? Math.round((100 * used) / total) : 0, soon = c.expires - t < 30 * 864e5;
    const more = pct >= 80 || soon ? `\n\n${pct >= 80 ? `Wykorzystano już ${pct}% kodów.` : ''}${soon ? ` Kod wygasa ${plDate(c.expires)}.` : ''} Dokup kody: ${base}/dla-instytucji/zamow?pkg=${c.voucher}` : '';
    const ok = await mail(b.email, `Kod ${c.id}: wykorzystanie, ${label}`, `Dzień dobry,\n\nstan kodu ${c.id} (${b.org}, ${PACKAGES[c.voucher]?.name}):\n\nWykorzystane kody: ${used} z ${total} (${pct}%)\nPozostało: ${Math.max(0, total - used)}\nWażny do: ${plDate(c.expires)}${more}\n\nRaport na bieżąco (bez danych osobowych uczestników): ${reportUrl(base, c)}\nPlakat z kodem QR: ${reportUrl(base, c)}/plakat.pdf\n\nTę wiadomość wysyłamy raz w miesiącu w ramach zamówionej usługi.\n\nPozdrawiamy,\nCV Pod Ogłoszenie`);
    if (ok) { sent.institutions++; await mark(`i:${c.id}`); }
  }

  // Właściciel: wypłaty prowizji do zrobienia (saldo co najmniej 50 zł).
  const pay = all.filter((c) => c.commission > 0 && (c.due || 0) >= PAYOUT_MIN).sort((a, b) => b.due - a.due);
  sent.payouts = pay.length;
  if (pay.length && mailEnabled() && !done.has('owner')) await sendOwnerMail(`Wypłaty prowizji do 15. dnia: ${pay.length}`, `Partnerzy z saldem co najmniej ${zl(PAYOUT_MIN)} (za ${label}):\n\n${pay.map((c) => `- ${c.id} (${c.note || 'bez nazwy'}): ${zl(c.due)}, konto: ${c.bank || 'BRAK – partner musi uzupełnić na stronie statystyk'}`).join('\n')}\n\nPo przelewie kliknij w panelu → Kody rabatowe przy kodzie: „Wypłacono”.\n${base}/admin`).then(() => mark('owner')).catch((e) => logEvent('e-mail', `Wypłaty: ${e.message}`));
  await runs.save({ id: 'monthly', ym, at: now.getTime() });
  return { ym, ...sent };
}
