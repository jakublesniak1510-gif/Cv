// Karnety: jednorazowa płatność (Stripe Checkout), bez subskrypcji i odnowienia. Po opłaceniu karnet jest przypisany do konta
// klienta (konto zakładamy sami i wysyłamy link logowania). W kreatorze zalogowany klient płaci karnetem: każde ogłoszenie zużywa
// 1 dopasowanie, symulator i przygotowanie – swoje limity; reszta (inne dodatki, wyczerpane limity, języki ponad jeden) płatna jak zwykle.
// Zużycie jest atomowe (blokada magazynu): rezerwacja przy złożeniu zamówienia, „used” po opłaceniu, zwolnienie po 24 h bez płatności.
// Limity anty-nadużyciowe: 5 dopasowań na godzinę i 15 na dobę na karnet. Po terminie niewykorzystane dopasowania przepadają.
import crypto from 'node:crypto';
import express from 'express';
import { makeStore, allOrders } from './store.js';
import { PASSES, PASS_LIMITS, PRICES, passCharge, perMatch } from './pricing.js';
import { plural } from './plural.js';
import { stripeEnabled, stripeCheckout, stripeSession, stripeRefund } from './stripe.js';
import { accountIdOf, accountIdFor, ensureAccount, loginLink, startAccountSession } from './account.js';
import { mailEnabled, sendPassMail, sendAdminAlert } from './mail.js';
import { countEvent } from './analytics.js';
import { logEvent } from './events.js';
import { sales, dayKey } from './ops.js';
import { issuePassInvoice, renderInvoice } from './invoice.js';
import { ssrPage, escHtml as esc } from './seo.js';

export const passes = makeStore('passes.json');
export const PASS_TERMS = 'Akceptuję Regulamin (sekcja „Karnety”) i Politykę prywatności. Karnet jest jednorazowy i nie odnawia się; po upływie ważności niewykorzystane dopasowania przepadają.';
export const PASS_START = 'Żądam rozpoczęcia świadczenia usługi przed upływem 14 dni od zakupu. Przyjmuję do wiadomości, że w zakresie wykorzystanych dopasowań tracę prawo odstąpienia od umowy; przy odstąpieniu w terminie otrzymam zwrot proporcjonalny za niewykorzystane dopasowania.';
const RELEASE_AFTER = 24 * 3600e3, PENDING_TTL = 7 * 864e5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zl = (gr) => `${(gr / 100).toLocaleString('pl-PL', { minimumFractionDigits: gr % 100 ? 2 : 0, maximumFractionDigits: 2 })} zł`;
export const newPassId = () => `PASS-${crypto.randomBytes(12).toString('base64url')}`;
const plan = (p) => PASSES[p.kind];
const activeAt = (p, now) => p.status === 'active' && p.expires > now;

// Widok karnetu dla klienta (konto, kreator): bez danych płatności.
export const passView = (p, now = Date.now()) => ({ id: p.id, kind: p.kind, name: plan(p)?.name || p.kind, status: activeAt(p, now) ? 'active' : p.status === 'active' ? 'expired' : p.status, expires: p.expires, left: p.left, plan: { matches: plan(p).matches, sim: plan(p).sim, interview: plan(p).interview, days: plan(p).days },
  used: (p.used || []).filter((u) => u.state !== 'released').map((u) => ({ at: u.at, orderId: u.orderId, matches: u.matches, sim: u.sim, interview: u.interview, state: u.state })) });

export async function createPass({ kind, email, lang = 'pl', invoice = null, consent = {} }, now = Date.now()) {
  if (!PASSES[kind]) throw new Error('Wybierz karnet.');
  email = String(email || '').trim().toLowerCase().slice(0, 160);
  if (!EMAIL.test(email)) throw new Error('Podaj poprawny adres e-mail.');
  if (!consent.terms || !consent.start) throw new Error('Zaznacz obie zgody, żeby kupić karnet.');
  const k = PASSES[kind];
  return passes.save({ id: newPassId(), kind, email, acc: accountIdFor(email), lang: ['en', 'uk', 'de'].includes(lang) ? lang : 'pl', status: 'pending', total: k.price, invoice: invoice || null,
    consent: { terms: PASS_TERMS, start: PASS_START, at: now }, created: now, left: { matches: k.matches, sim: k.sim, interview: k.interview }, used: [], reminders: {} });
}

// Opłacenie (webhook, powrót z płatności albo demo): raz, z rejestrem sprzedaży, fakturą i e-mailem z linkiem logowania.
export async function activatePass(id, { provider = 'stripe', paymentIntent = null, sessionId = null, now = Date.now(), base = '' } = {}) {
  let claimed = false;
  const p = await passes.update(id, (x) => {
    if (x.status !== 'pending') return x;
    claimed = true;
    return { ...x, status: 'active', paidAt: now, expires: now + PASSES[x.kind].days * 864e5, payment: { provider, paymentIntent, sessionId, at: now } };
  });
  if (!p || !claimed) return p;
  await ensureAccount(p.email);
  await sales.upsert(p.id, () => ({ id: p.id, at: now, day: dayKey(now), pkg: `karnet:${p.kind}`, total: p.total, discount: 0, ads: 0, addons: [], langs: [], code: null, followup: false, uiLang: p.lang, provider, pi: paymentIntent, refunded: 0 }));
  countEvent('pass_paid').catch(() => {});
  let inv = null;
  if (p.invoice) inv = await issuePassInvoice(p, now).catch((e) => { logEvent('faktura', `Karnet ${id}: ${e.message}`); return null; });
  if (inv) await passes.update(id, { invoiceId: inv.id, invoiceNumber: inv.number });
  if (mailEnabled()) {
    try { await sendPassMail(p, 'active', { link: await loginLink(p.email, base, 7 * 864e5), terms: `${base}/regulamin`, invoice: inv ? { inv, pdf: await renderInvoice(inv) } : null }); }
    catch (e) { logEvent('e-mail', `Karnet ${id}: ${e.message}`); }
  }
  return passes.get(id);
}

// Aktywny karnet konta z wystarczającą liczbą dopasowań (najbliższy termin ważności pierwszy).
export async function activePassFor(acc, now = Date.now()) {
  if (!acc) return null;
  return Object.values(await passes.all()).filter((p) => p.acc === acc && activeAt(p, now)).sort((a, b) => a.expires - b.expires)[0] || null;
}
const usedSince = (p, t) => (p.used || []).filter((u) => u.state !== 'released' && u.at > t).reduce((s, u) => s + u.matches, 0);

export class PassError extends Error {}
// Wycena zamówienia karnetem (bez rezerwacji): zużycie i pozycje do dopłaty.
export async function passQuote(acc, { ads, addons, extraLangs }, now = Date.now()) {
  const p = await activePassFor(acc, now);
  if (!p) throw new PassError('Nie masz aktywnego karnetu.');
  return { pass: passView(p, now), ...passCharge(p.left, ads, addons, extraLangs) };
}
// Rezerwacja przy złożeniu zamówienia – sprawdzenie i odjęcie w jednej operacji na magazynie (równoległe zamówienia nie zużyją podwójnie).
export async function reservePass(acc, { ads, addons, extraLangs, orderId }, now = Date.now()) {
  const p0 = await activePassFor(acc, now);
  if (!p0) throw new PassError('Nie masz aktywnego karnetu.');
  let out = null, limitHit = null;
  try {
    await passes.update(p0.id, (x) => {
      if (!activeAt(x, now)) throw new PassError('Karnet wygasł albo jest nieaktywny.');
      const q = passCharge(x.left, ads, addons, extraLangs);
      if (usedSince(x, now - 3600e3) + q.use.matches > PASS_LIMITS.hour) { limitHit = 'hour'; throw new PassError(`Limit karnetu: najwyżej ${PASS_LIMITS.hour} dopasowań na godzinę. Spróbuj trochę później.`); }
      if (usedSince(x, now - 864e5) + q.use.matches > PASS_LIMITS.day) { limitHit = 'day'; throw new PassError(`Limit karnetu: najwyżej ${PASS_LIMITS.day} dopasowań na dobę. Spróbuj jutro.`); }
      out = { passId: x.id, ...q };
      return { ...x, left: { matches: x.left.matches - q.use.matches, sim: x.left.sim - q.use.sim, interview: x.left.interview - q.use.interview }, used: [...(x.used || []), { at: now, orderId, ...q.use, state: 'reserved' }] };
    });
  } catch (e) {
    if (limitHit) suspicious(p0, limitHit, now);
    if (e instanceof Error && !(e instanceof PassError)) throw new PassError(e.message);
    throw e;
  }
  return out;
}
// Podejrzane użycie (przekroczony limit): wpis w dzienniku i alert do właściciela, najwyżej raz na dobę na karnet.
function suspicious(p, kind, now) {
  logEvent('karnet', `Limit ${kind === 'hour' ? 'godzinowy' : 'dobowy'} karnetu ${p.id} przekroczony`);
  passes.update(p.id, (x) => {
    if (x.alertedAt && now - x.alertedAt < 864e5) return x;
    if (mailEnabled() && process.env.CONTACT_EMAIL) sendAdminAlert('Karnet: podejrzane użycie', `Karnet ${p.id} (${PASSES[p.kind].name}) przekroczył limit ${kind === 'hour' ? `${PASS_LIMITS.hour} dopasowań na godzinę` : `${PASS_LIMITS.day} dopasowań na dobę`}. Może to oznaczać udostępnianie konta. Sprawdź historię zużycia w panelu → Karnety.`).catch((e) => logEvent('e-mail', `Alert karnetu: ${e.message}`));
    return { ...x, alertedAt: now, flagged: (x.flagged || 0) + 1 };
  }).catch(() => {});
}
const setUse = (passId, orderId, state, restore = false) => passes.update(passId, (x) => {
  const u = (x.used || []).find((y) => y.orderId === orderId && y.state === 'reserved'); if (!u) return x;
  // Po zwrocie albo wygaśnięciu zwolnienie rezerwacji nie przywraca limitów.
  return { ...x, left: restore && x.status === 'active' ? { matches: x.left.matches + u.matches, sim: x.left.sim + u.sim, interview: x.left.interview + u.interview } : x.left, used: x.used.map((y) => (y === u ? { ...y, state, [`${state}At`]: Date.now() } : y)) };
});
// Zamówienie opłacone (albo za 0 zł): rezerwacja staje się zużyciem.
export async function passOrderPaid(o) {
  if (!o?.pass?.id) return;
  const p = await passes.get(o.pass.id); if (!p?.used?.some((u) => u.orderId === o.id && u.state === 'reserved')) return;
  await setUse(o.pass.id, o.id, 'used');
  countEvent('pass_used').catch(() => {});
}
export const releasePassOrder = (o) => (o?.pass?.id ? setUse(o.pass.id, o.id, 'released', true) : null);

// Zwrot: karnet przestaje działać (status refunded, limity zerowane); rejestr sprzedaży z kwotą zwrotu.
export async function passRefunded(id, refundedTotal) {
  const p = await passes.get(id); if (!p) return null;
  if (refundedTotal <= (p.refunded || 0) && p.status === 'refunded') return p;
  await sales.update(id, { refunded: refundedTotal });
  logEvent('zwrot', `Zwrot ${zl(refundedTotal)} za karnet ${PASSES[p.kind]?.name || p.kind}`, { orderId: id });
  return passes.update(id, (x) => ({ ...x, status: 'refunded', refunded: refundedTotal, refundedAt: Date.now(), left: { matches: 0, sim: 0, interview: 0 } }));
}
// Zwrot przy odstąpieniu w terminie (Regulamin §5d ust. 6): proporcjonalnie do ceny karnetu według udziału wykorzystanych
// świadczeń w łącznej wartości karnetu (wagi z cennika: CV + list, symulator, przygotowanie). Liczą się tylko zużycia („used”),
// nie rezerwacje czekające na płatność.
export const REFUND_WEIGHTS = () => ({ matches: PRICES.cv_letter, sim: PRICES.sim, interview: PRICES.interview });
export function refundBreakdown(p) {
  const k = PASSES[p.kind], W = REFUND_WEIGHTS(), used = { matches: 0, sim: 0, interview: 0 };
  for (const u of p.used || []) if (u.state === 'used') for (const f of Object.keys(used)) used[f] += u[f] || 0;
  const all = k.matches * W.matches + k.sim * W.sim + k.interview * W.interview, usedV = used.matches * W.matches + used.sim * W.sim + used.interview * W.interview;
  return { used, all, usedV, refund: Math.max(0, Math.round((p.total * (all - usedV)) / all)) };
}
export const proportionalRefund = (p) => refundBreakdown(p).refund;

// Co godzinę: przypomnienia 3 dni przed i w dniu wygaśnięcia (informacja o usłudze), status „expired”,
// zwolnienie rezerwacji z nieopłaconych zamówień, sprzątanie nieopłaconych karnetów.
export async function passesHourly(BASE_URL, now = Date.now()) {
  await passes.deleteWhere((p) => p.status === 'pending' && now - p.created > PENDING_TTL);
  const orders = await allOrders();
  for (const p of Object.values(await passes.all())) {
    for (const u of p.used || []) {
      if (u.state !== 'reserved') continue;
      const o = orders[u.orderId];
      if (o && o.status !== 'pending') await passOrderPaid(o);
      else if (!o || now - u.at > RELEASE_AFTER) await setUse(p.id, u.orderId, 'released', true);
    }
    if (p.status !== 'active') continue;
    const left = p.expires - now, rem = p.reminders || {};
    let kind = null;
    if (left <= 0) kind = rem.d0 ? null : 'd0';
    else if (left <= 3 * 864e5) kind = rem.d3 ? null : 'd3';
    if (left <= 0) await passes.update(p.id, (x) => ({ ...x, status: 'expired', expiredAt: now, lostMatches: x.left.matches }));
    if (!kind || !mailEnabled()) continue;
    try { await sendPassMail(p, kind, { link: `${BASE_URL}/konto`, prices: `${BASE_URL}/karnety` }); await passes.update(p.id, (x) => ({ ...x, reminders: { ...x.reminders, [kind]: now } })); }
    catch (e) { logEvent('e-mail', `Karnet ${p.id}: ${e.message}`); }
  }
}

// --- Strona /karnety i API ---
export const passCards = (cta = (k) => `<a class="btn${PASSES[k].badge ? '' : ' ghost'}" href="/karnety#kup-${k}">Wybierz ${esc(PASSES[k].name)}</a>`) => Object.entries(PASSES).map(([k, x]) => `<div class="price-card${x.badge ? ' feat' : ''}" id="karnet-${k}">${x.badge ? `<span class="badge">${esc(x.badge)}</span>` : ''}<h3>${esc(x.name)}</h3><div class="amt">${zl(x.price)}</div><ul><li><b>${x.matches} ${plural(x.matches, 'dopasowanie', 'dopasowania', 'dopasowań')}</b> (CV + list pod jedno ogłoszenie)</li><li>${x.sim} ${plural(x.sim, 'symulator', 'symulatory', 'symulatorów')} rozmowy${x.interview ? `, ${x.interview} ${plural(x.interview, 'przygotowanie', 'przygotowania', 'przygotowań')} do rozmowy` : ''}</li><li>Ważny ${x.days} dni od zakupu</li><li>Ok. ${zl(perMatch(k))} za CV + list</li></ul>${cta(k)}</div>`).join('');
export const PASS_NOTE = 'Płacisz raz. Brak subskrypcji – po 30 albo 60 dniach karnet po prostu wygasa, nic się nie odnawia. Niewykorzystane dopasowania przepadają po terminie ważności.';
function pageHtml() {
  const opts = Object.entries(PASSES).map(([k, x]) => `<label class="opt"><input type="radio" name="kind" value="${k}"${x.badge ? ' checked' : ''}><span class="o-t">${esc(x.name)}<b>${zl(x.price)}</b></span><span class="o-d">${x.matches} dopasowań, ${x.sim} sym.${x.interview ? `, ${x.interview} przyg.` : ''} · ${x.days} dni</span></label>`).join('');
  return `<div class="inner"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Karnety</span></nav>
<h1>Karnety: kilka CV pod różne ogłoszenia w jednej cenie</h1>
<p class="lead">Szukasz pracy i wysyłasz wiele aplikacji? Kup karnet raz i przez 30 albo 60 dni rób CV z listem motywacyjnym pod kolejne ogłoszenia bez płacenia za każde osobno.</p>
<p class="perk"><b>${esc(PASS_NOTE)}</b></p>
<h2>Wybierz karnet</h2>
<div class="prices">${passCards()}</div>
<p class="single-cv"><a href="/?zamow=1">albo zamów pojedyncze CV</a> (od ${zl(PRICES.cv)}, bez karnetu)</p>
<h2>Jak to działa</h2>
<ul class="ticks col"><li>Po zakupie karnet trafia na Twoje konto (zakładamy je automatycznie i wysyłamy link logowania).</li><li>W formularzu zamówienia zaznaczasz „Użyj karnetu”: każde ogłoszenie zużywa 1 dopasowanie (CV + list, z jednym dodatkowym językiem w cenie).</li><li>Symulator i przygotowanie do rozmowy zużywają swoje limity; gdy się skończą, te dodatki są płatne jak zwykle.</li><li>Na koncie widzisz, ile zostało i do kiedy karnet jest ważny. Przypomnimy e-mailem 3 dni przed końcem.</li><li>Limit: ${PASS_LIMITS.hour} dopasowań na godzinę i ${PASS_LIMITS.day} na dobę (ochrona przed udostępnianiem konta).</li></ul>
<h2 id="kup">Kup karnet</h2>
<form id="passForm" class="pass-form" novalidate>
<div class="opts">${opts}</div>
<label class="f">Adres e-mail (na nim będzie konto z karnetem)<input type="email" id="passEmail" autocomplete="email" required></label>
<label class="check"><input type="checkbox" id="passInv"> <span>Potrzebuję faktury (bez VAT)</span></label>
<div id="passInvBox" hidden><label class="f">Nazwa / imię i nazwisko<input id="pInvName"></label><label class="f">Adres<input id="pInvAddress"></label><label class="f">NIP (opcjonalnie)<input id="pInvNip" inputmode="numeric"></label></div>
<label class="check"><input type="checkbox" id="passTerms"> <span>${esc(PASS_TERMS).replace('Regulamin', '<a href="/regulamin#karnety">Regulamin</a>').replace('Politykę prywatności', '<a href="/polityka-prywatnosci">Politykę prywatności</a>')}</span></label>
<label class="check"><input type="checkbox" id="passStart"> <span>${esc(PASS_START)}</span></label>
<p class="hint">Karnet opłacisz online przez Stripe (BLIK, karta, Apple Pay / Google Pay). Przelewy24 są dostępne przy zwykłych zamówieniach CV.</p>
<button class="btn lg" type="submit" id="passBuy">Przejdź do płatności</button>
<div class="fstatus" id="passStatus" role="status"></div>
</form>
<p class="sub2 small">Ceny końcowe. Sprzedawca zwolniony z VAT – na życzenie wystawiamy fakturę bez VAT. Płatność jednorazowa przez Stripe (BLIK, karta, Google Pay, Apple Pay).</p></div>`;
}

export function passRoutes(app, { BASE_URL, DEMO = false, cleanInvoice = () => null, closedFor = () => false }) {
  const hits = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; if (hits.size > 10000) hits.clear(); hits.set(key, [...h, now]); return false; };
  const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python/i;

  app.get('/karnety', (req, res) => {
    if (!BOT.test(req.get('user-agent') || '')) countEvent('pass_view').catch(() => {});
    ssrPage(res, BASE_URL, 'karnety', { title: 'Karnety: wiele CV pod ogłoszenia w jednej cenie', metaDescription: 'Karnet na 30 lub 60 dni: 8, 20 albo 50 dopasowań (CV + list pod jedno ogłoszenie). Płacisz raz, bez subskrypcji – karnet po prostu wygasa.' }, pageHtml(), { script: '/karnety.js' });
  });

  app.post('/api/passes', express.json({ limit: '20kb' }), async (req, res) => {
    if (closedFor(req)) return res.status(503).json({ error: 'Sprzedaż chwilowo wstrzymana.' });
    if (!DEMO && !stripeEnabled()) return res.status(503).json({ error: 'Płatności chwilowo niedostępne.' });
    if (limited('p:' + req.ip, 10, 3600e3)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    const b = req.body || {}, inv = b.invoice ? cleanInvoice(b.invoice) : null;
    if (inv?.error) return res.status(400).json({ error: inv.error });
    let p; try { p = await createPass({ kind: b.kind, email: b.email, lang: b.lang, invoice: inv, consent: { terms: b.terms === true, start: b.start === true } }); } catch (e) { return res.status(400).json({ error: e.message }); }
    countEvent('pass_checkout').catch(() => {});
    if (DEMO) { await activatePass(p.id, { provider: 'demo', base: BASE_URL }); return res.json({ id: p.id, url: `/konto?karnet=${p.id}` }); }
    try {
      const k = PASSES[p.kind], sess = await stripeCheckout({ orderId: p.id, amount: p.total, email: p.email, lang: p.lang, name: `Karnet ${k.name} – CV Pod Ogłoszenie`, description: `${k.matches} dopasowań (CV + list), ważny ${k.days} dni. Płatność jednorazowa, bez odnowienia.`, returnUrl: `${BASE_URL}/konto?karnet=${p.id}` });
      await passes.update(p.id, { stripe: { sessionId: sess.id } });
      res.json({ id: p.id, url: sess.url });
    } catch (e) { logEvent('płatność', `Karnet: ${e.message}`, { orderId: p.id }); res.status(502).json({ error: 'Nie udało się otworzyć płatności. Spróbuj za chwilę.' }); }
  });

  // Powrót z płatności (/konto?karnet=<id>): sprawdzamy sesję Stripe, a opłacony karnet loguje na konto (id karnetu zna tylko kupujący).
  app.post('/api/passes/:id/login', async (req, res) => {
    let p = /^PASS-[A-Za-z0-9_-]{16}$/.test(req.params.id) ? await passes.get(req.params.id) : null;
    if (!p) return res.status(404).json({ error: 'Nie znaleźliśmy karnetu.' });
    if (p.status === 'pending' && p.stripe?.sessionId) p = (await confirmPassPayment(p, null, BASE_URL)) || p;
    if (p.status === 'pending') return res.status(409).json({ pending: true, error: 'Płatność jeszcze nie dotarła. Odśwież za chwilę.' });
    if (p.status !== 'active' || p.expires < Date.now()) return res.status(409).json({ error: 'Ten karnet jest nieaktywny.' });
    // Jednorazowo i najwyżej 2 h po zapłacie (link powrotu z płatności nie może działać jak stałe hasło).
    let first = false;
    if (!(p.paidAt && Date.now() - p.paidAt <= 2 * 3600e3)) return res.status(409).json({ error: 'Zaloguj się linkiem z e-maila.' });
    await passes.update(p.id, (x) => { if (x.loginUsedAt) return x; first = true; return { ...x, loginUsedAt: Date.now() }; });
    if (!first) return res.status(409).json({ error: 'Zaloguj się linkiem z e-maila.' });
    await startAccountSession(res, p.email, BASE_URL);
    res.json({ ok: true });
  });

  const needAcc = (req, res) => { const a = accountIdOf(req); if (!a) res.status(401).json({ error: 'Zaloguj się na konto, żeby użyć karnetu.' }); return a; };
  app.get('/api/passes/mine', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const a = accountIdOf(req); if (!a) return res.json({ active: null, all: [] });
    const now = Date.now(), mine = Object.values(await passes.all()).filter((p) => p.acc === a && p.status !== 'pending').sort((x, y) => y.created - x.created);
    const act = mine.find((p) => activeAt(p, now)) ? passView(await activePassFor(a, now), now) : null;
    res.json({ active: act, all: mine.map((p) => passView(p, now)) });
  });
  app.post('/api/passes/quote', express.json({ limit: '5kb' }), async (req, res) => {
    const a = needAcc(req, res); if (!a) return;
    const b = req.body || {};
    try { res.json(await passQuote(a, { ads: Number(b.ads) || 1, addons: b.addons || {}, extraLangs: Array.isArray(b.extraLangs) ? b.extraLangs : [] })); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
}

// Stripe: płatność potwierdzona tylko, gdy sesja jest opłacona, dotyczy tego karnetu i kwota się zgadza.
export async function confirmPassPayment(p, sess, base) {
  p ||= await passes.get(sess?.client_reference_id);
  if (!p || p.status !== 'pending') return p;
  sess ||= p.stripe?.sessionId ? await stripeSession(p.stripe.sessionId).catch(() => null) : null;
  if (!sess || sess.payment_status !== 'paid' || sess.client_reference_id !== p.id) return null;
  if (sess.amount_total !== p.total || sess.currency !== 'pln') { logEvent('płatność', `Stripe: kwota ${sess.amount_total} ${sess.currency} nie zgadza się z karnetem`, { orderId: p.id }); return null; }
  return activatePass(p.id, { provider: 'stripe', paymentIntent: sess.payment_intent, sessionId: sess.id, base });
}

// Panel → Karnety: lista i zwrot (domyślnie proporcjonalny za niewykorzystane dopasowania).
export function passAdmin(api) {
  api.get('/passes', async (_req, res) => {
    const now = Date.now();
    res.json(Object.values(await passes.all()).filter((p) => p.status !== 'pending').sort((a, b) => b.created - a.created).slice(0, 300)
      .map((p) => ({ ...passView(p, now), email: p.email, total: p.total, paidAt: p.paidAt, refunded: p.refunded || 0, flagged: p.flagged || 0, proportional: p.status === 'active' ? proportionalRefund(p) : 0, refundCalc: refundBreakdown(p), provider: p.payment?.provider || null })));
  });
  api.post('/passes/:id/refund', express.json(), async (req, res) => {
    const p = await passes.get(req.params.id);
    if (!p || !['active', 'expired'].includes(p.status)) return res.status(404).json({ error: 'Nie ma takiego opłaconego karnetu.' });
    const amount = Math.round(Number(req.body?.amount ?? proportionalRefund(p) / 100) * 100);
    if (!(amount >= 0 && amount <= p.total - (p.refunded || 0))) return res.status(400).json({ error: 'Niepoprawna kwota zwrotu.' });
    try {
      if (amount > 0 && p.payment?.provider === 'stripe') await stripeRefund({ paymentIntent: p.payment.paymentIntent, amount, orderId: p.id, already: p.refunded || 0 });
      res.json(passView(await passRefunded(p.id, (p.refunded || 0) + amount)));
    } catch (e) { logEvent('płatność', `Zwrot karnetu: ${e.message}`, { orderId: p.id }); res.status(502).json({ error: e.message }); }
  });
}
