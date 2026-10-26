// Zapis postępu kreatora na prośbę klienta: „Wyślij mi link do dokończenia” → jeden e-mail z linkiem do szkicu (7 dni, bez zdjęcia),
// a z OSOBNĄ, niezaznaczoną zgodą – jedno przypomnienie po 2 h, jeśli zamówienie nie zostało złożone (z wypisem).
// Szkice zapisane przed 25.10.2026 ze zgodą „po 24 godzinach” dostają przypomnienie po 24 h, zgodnie z treścią tamtej zgody.
// Szkic po wysłaniu linku synchronizuje się z formularzem (PUT), więc link otwiera ostatni stan. Usuwany po 7 dniach albo po opłaceniu.
// W bazie trzymamy skrót tokenu, nie sam token (link działa tylko z e-maila). Lejek: draft_saved, draft_resumed, reminder_sent, reminder_converted.
import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';
import { mailEnabled, sendDraftLink, sendDraftReminder } from './mail.js';
import { countEvent } from './analytics.js';
import { logEvent } from './events.js';

export const wizardDrafts = makeStore('wizard-drafts.json');
export const DRAFT_TTL = 7 * 864e5, REMIND_AFTER = 2 * 3600e3, MAX_DATA = 200 * 1024, MAX_DRAFTS = 5000;
// Globalny limit nowych szkiców (i e-maili z linkiem) na dobę: DRAFT_DAILY, domyślnie 300.
export const draftDaily = (env = process.env) => Math.max(1, parseInt(env.DRAFT_DAILY, 10) || 300);
export const REMIND_CONSENT = 'Przypomnij mi raz, jeśli nie dokończę zamówienia: jeden e-mail po 2 godzinach z linkiem do szkicu. Zgodę mogę wycofać linkiem w e-mailu.';
export const REMIND_CONSENT_24H = 'Przypomnij mi raz, jeśli nie dokończę zamówienia: jeden e-mail po 24 godzinach z linkiem do szkicu. Zgodę mogę wycofać linkiem w e-mailu.';
// Czas przypomnienia wynika z treści zgody zapisanej przy szkicu.
export const remindAfter = (d) => (d.reminder?.consent?.text === REMIND_CONSENT_24H ? 24 * 3600e3 : REMIND_AFTER);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, TOKEN = /^[A-Za-z0-9_-]{32}$/;
const idOf = (token) => crypto.createHash('sha256').update(`draft:${token}`).digest('hex').slice(0, 32);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const langOf = (l) => (['en', 'uk', 'de'].includes(l) ? l : 'pl');

// Dane formularza bez zdjęcia (to samo co szkic w localStorage); za duże albo niepoprawne → błąd.
export function cleanData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Brak danych formularza.');
  const { photo, ...rest } = d;
  const json = JSON.stringify(rest);
  if (json.length > MAX_DATA) throw new Error('Formularz jest za duży, żeby zapisać szkic.');
  return JSON.parse(json);
}
export async function draftByToken(token, now = Date.now()) {
  if (!TOKEN.test(String(token || ''))) return null;
  const d = await wizardDrafts.get(idOf(token));
  return d && now - d.created <= DRAFT_TTL ? d : null;
}

const notice = (res, title, body, extra = '') => res.type('html').set('Cache-Control', 'no-store').send(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | CV Pod Ogłoszenie</title><link rel="stylesheet" href="/style.css"></head><body><main class="sec"><div class="inner narrow"><h1>${esc(title)}</h1><p class="lead">${esc(body)}</p>${extra}<p><a class="btn ghost" href="/">Wróć na stronę główną</a></p></div></main></body></html>`);

export function wizardDraftRoutes(app, { BASE_URL, DEMO }) {
  const hits = new Map();
  const limited = (key, max, ms) => { const now = Date.now(), h = (hits.get(key) || []).filter((t) => now - t < ms); if (h.length >= max) return true; if (hits.size > 10000) hits.clear(); hits.set(key, [...h, now]); return false; };
  const json = express.json({ limit: MAX_DATA + 20 * 1024 });
  const link = (token, lang) => `${BASE_URL}/${lang === 'pl' ? '' : lang}?szkic=${token}`;

  app.post('/api/wizard-draft', json, async (req, res) => {
    const b = req.body || {}, email = String(b.email || '').trim().toLowerCase().slice(0, 160), lang = langOf(b.lang);
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    if (limited('d:' + req.ip, 5, 3600e3) || limited('de:' + email, 3, 864e5)) return res.status(429).json({ error: 'Za dużo prób. Spróbuj później.' });
    const all = Object.values(await wizardDrafts.all()), day = Date.now() - 864e5;
    if (all.length >= MAX_DRAFTS || all.filter((x) => x.created > day).length >= draftDaily()) { logEvent('e-mail', 'Szkice kreatora: dzienny limit wyczerpany'); return res.status(429).json({ error: 'Chwilowo nie możemy zapisać szkicu. Spróbuj jutro albo dokończ zamówienie teraz.' }); }
    let data; try { data = cleanData(b.data); } catch (e) { return res.status(400).json({ error: e.message }); }
    const token = crypto.randomBytes(24).toString('base64url'), now = Date.now();
    const d = { id: idOf(token), email, lang, data, created: now, updated: now, reminder: b.remind === true ? { consent: { text: REMIND_CONSENT, at: now }, sent: false } : null };
    await wizardDrafts.save(d);
    countEvent('draft_saved').catch(() => {});
    if (d.reminder) countEvent('reminder_optin').catch(() => {}); // B9: zgoda na jedno przypomnienie po 2 h
    if (!mailEnabled()) return res.json({ ok: true, token, ...(DEMO ? { demoLink: link(token, lang) } : {}) });
    try { await sendDraftLink(d, { link: link(token, lang), stop: `${BASE_URL}/szkic/wypisz?t=${token}`, until: now + DRAFT_TTL }); }
    catch (e) { logEvent('e-mail', `Szkic: ${e.message}`); await wizardDrafts.remove(d.id); return res.status(502).json({ error: 'Nie udało się wysłać e-maila. Spróbuj za chwilę.' }); }
    res.json({ ok: true, token });
  });
  // Formularz po wysłaniu linku: bieżący stan szkicu (bez zdjęcia).
  app.put('/api/wizard-draft/:token', json, async (req, res) => {
    if (limited('p:' + String(req.params.token).slice(0, 40), 120, 3600e3)) return res.status(429).json({ error: 'Za dużo zapisów. Spróbuj za chwilę.' });
    const d = await draftByToken(req.params.token);
    if (!d || d.ordered) return res.status(404).json({ error: 'Szkic wygasł.' });
    let data; try { data = cleanData(req.body?.data); } catch (e) { return res.status(400).json({ error: e.message }); }
    await wizardDrafts.update(d.id, { data, updated: Date.now() });
    res.json({ ok: true });
  });
  app.get('/api/wizard-draft/:token', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const d = await draftByToken(req.params.token);
    if (!d) return res.status(404).json({ error: 'Link do szkicu wygasł (szkice przechowujemy 7 dni). Wypełnij formularz od nowa.' });
    if (!d.resumedAt) { await wizardDrafts.update(d.id, { resumedAt: Date.now() }); countEvent('draft_resumed').catch(() => {}); }
    res.json({ data: d.data, email: d.email });
  });

  // Wypis z przypomnienia i usunięcie szkicu (link w każdym e-mailu): GET pokazuje pytanie, POST wykonuje.
  app.get('/szkic/wypisz', async (req, res) => {
    const t = String(req.query.t || ''), d = await draftByToken(t);
    if (!d) return notice(res, 'Szkic nieaktywny', 'Ten szkic wygasł albo został usunięty.');
    const form = (a, label, cls = 'btn') => `<form method="post" action="/szkic/wypisz?t=${esc(t)}&amp;a=${a}" style="display:inline-block;margin:0 8px 8px 0"><button class="${cls}" type="submit">${label}</button></form>`;
    notice(res, 'Przypomnienie i szkic', d.reminder?.consent ? 'Możesz wyłączyć przypomnienie albo od razu usunąć szkic formularza.' : 'Przypomnienie jest wyłączone. Możesz też od razu usunąć szkic formularza.', `<p>${d.reminder?.consent ? form('stop', 'Wyłącz przypomnienie') : ''}${form('delete', 'Usuń szkic', 'btn ghost')}</p>`);
  });
  app.post('/szkic/wypisz', express.urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const d = await draftByToken(String(req.query.t || ''));
    if (!d) return notice(res, 'Szkic nieaktywny', 'Ten szkic wygasł albo został usunięty.');
    if (req.query.a === 'delete') { await wizardDrafts.remove(d.id); return notice(res, 'Szkic usunięty', 'Usunęliśmy szkic formularza i nie wyślemy już żadnej wiadomości.'); }
    if (d.reminder) await wizardDrafts.update(d.id, { reminder: { ...d.reminder, consent: null, withdrawn: Date.now() } });
    notice(res, 'Przypomnienie wyłączone', 'Nie wyślemy przypomnienia. Szkic zostanie usunięty automatycznie po 7 dniach od zapisania.');
  });
  return { link };
}

// Zamówienie złożone ze szkicu: bez przypomnienia; zapamiętujemy id szkicu (nie token) w zamówieniu.
export async function draftOrdered(token) {
  const d = await draftByToken(token); if (!d) return null;
  await wizardDrafts.update(d.id, { ordered: Date.now() });
  return d.id;
}
// Zamówienie opłacone: szkic usuwamy; jeśli wcześniej poszło przypomnienie → reminder_converted.
export async function draftPaid(draftId) {
  if (!draftId) return;
  const d = await wizardDrafts.get(draftId); if (!d) return;
  if (d.reminder?.sent) await countEvent('reminder_converted').catch(() => {});
  await wizardDrafts.remove(d.id);
}

// Co godzinę: jedno przypomnienie (tylko ze zgodą, 2 h po zapisaniu – albo 24 h przy starej zgodzie – bez złożonego zamówienia), sprzątanie po 7 dniach.
// Token do linku generujemy wtedy na nowo (w bazie jest tylko skrót), więc stary link z pierwszego e-maila przestaje działać.
export async function wizardDraftsHourly(BASE_URL, now = Date.now()) {
  await wizardDrafts.deleteWhere((d) => now - d.created > DRAFT_TTL);
  if (!mailEnabled()) return;
  for (const d of Object.values(await wizardDrafts.all())) {
    if (!d.reminder?.consent || d.reminder.sent || d.ordered || now - d.created < remindAfter(d)) continue;
    const token = crypto.randomBytes(24).toString('base64url'), id = idOf(token), link = `${BASE_URL}/${d.lang === 'pl' ? '' : d.lang}?szkic=${token}`;
    try {
      await wizardDrafts.save({ ...d, id, reminder: { ...d.reminder, sent: true, at: now } }); await wizardDrafts.remove(d.id);
      await sendDraftReminder({ ...d, id }, { link, stop: `${BASE_URL}/szkic/wypisz?t=${token}`, until: d.created + DRAFT_TTL });
      countEvent('reminder_sent').catch(() => {});
    } catch (e) { logEvent('e-mail', `Przypomnienie o szkicu: ${e.message}`); }
  }
}
