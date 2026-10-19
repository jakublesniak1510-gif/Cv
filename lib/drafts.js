import crypto from 'node:crypto';
import express from 'express';

// Szkic ogłoszenia z rozszerzenia przeglądarki: rozszerzenie wysyła treść ogłoszenia z aktywnej karty (tylko po kliknięciu),
// dostaje id i otwiera stronę z ?draft=<id>, a strona wczytuje treść do kreatora albo skanera. Szkice trzymamy w pamięci 2 h.
const TTL = 2 * 3600e3, MAX_BYTES = 20 * 1024, MAX_TEXT = 15000;
const drafts = new Map();
const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
export function saveDraft(b, now = Date.now()) {
  for (const [k, v] of drafts) if (now - v.at > TTL) drafts.delete(k);
  const text = str(b?.text, MAX_TEXT);
  if (text.length < 80) throw new Error('Za mało tekstu ogłoszenia (min. 80 znaków).');
  let url = str(b?.url, 500); if (url && !/^https?:\/\//i.test(url)) url = '';
  const id = crypto.randomBytes(12).toString('base64url');
  drafts.set(id, { at: now, text, title: str(b?.title, 200), url, src: b?.src === 'ext' ? 'ext' : 'web' });
  return id;
}
export function getDraft(id, now = Date.now()) {
  const d = drafts.get(String(id || ''));
  if (!d) return null;
  if (now - d.at > TTL) { drafts.delete(id); return null; }
  return { text: d.text, title: d.title, url: d.url };
}
// CORS tylko dla rozszerzenia: EXT_ID ustawione → dokładnie ten identyfikator, puste → dowolne chrome-extension://.
export function extOrigin(origin, extId = (process.env.EXT_ID || '').trim()) {
  const m = /^chrome-extension:\/\/([a-p]{32})$/.exec(String(origin || ''));
  if (!m) return null;
  return !extId || m[1] === extId ? origin : null;
}
export function draftRoutes(app, { limitPerHour = 20 } = {}) {
  const hits = new Map();
  const cors = (req, res) => { const o = extOrigin(req.get('origin')); if (o) res.set({ 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', Vary: 'Origin' }); return o; };
  app.options('/api/ad-draft', (req, res) => { if (!cors(req, res)) return res.sendStatus(403); res.sendStatus(204); });
  app.post('/api/ad-draft', express.json({ limit: MAX_BYTES }), (req, res) => {
    const origin = req.get('origin');
    // Z przeglądarki: tylko rozszerzenie (CORS) albo ta sama strona (bez nagłówka Origin z innej domeny).
    if (origin && !cors(req, res) && !origin.startsWith(`${req.protocol}://${req.get('host')}`)) return res.status(403).json({ error: 'Niedozwolone źródło.' });
    const now = Date.now(), h = (hits.get(req.ip) || []).filter((t) => now - t < 3600e3);
    if (h.length >= limitPerHour) return res.status(429).json({ error: 'Za dużo prób. Spróbuj za godzinę.' });
    hits.set(req.ip, [...h, now]);
    try { res.json({ id: saveDraft(req.body, now) }); } catch (e) { res.status(400).json({ error: e.message }); }
  });
  app.get('/api/ad-draft/:id', (req, res) => {
    const d = getDraft(req.params.id);
    res.set('Cache-Control', 'no-store');
    if (!d) return res.status(404).json({ error: 'Szkic wygasł. Otwórz ogłoszenie i kliknij rozszerzenie jeszcze raz.' });
    res.json(d);
  });
  // Za duża treść (express.json) → czytelny błąd zamiast HTML.
  app.use('/api/ad-draft', (err, _req, res, next) => (err?.type === 'entity.too.large' ? res.status(413).json({ error: 'Treść jest za długa (max 20 KB).' }) : next(err)));
}
