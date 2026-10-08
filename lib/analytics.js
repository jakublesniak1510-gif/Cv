import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';

// Statystyki odwiedzin bez plików cookie i bez zapisywania IP. Unikalnych odwiedzających liczymy skrótem
// (IP + przeglądarka + losowa sól zmieniana codziennie, trzymana tylko w pamięci), więc nie da się nikogo śledzić między dniami.
const days = makeStore('analytics.json');
const dayKey = (t = Date.now()) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
let salt = { day: '', value: '' }, seen = new Set();
const visitor = (req) => {
  const d = dayKey();
  if (salt.day !== d) { salt = { day: d, value: crypto.randomBytes(16).toString('hex') }; seen = new Set(); }
  return crypto.createHash('sha256').update(`${salt.value}|${req.ip}|${req.get('user-agent') || ''}`).digest('hex').slice(0, 16);
};
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|axios/i;
const clean = (s, n) => String(s || '').slice(0, n).replace(/[^\w\-./ąćęłńóśźż]/gi, '');
const inc = (o, k, n = 1) => { if (k) o[k] = (o[k] || 0) + n; };

export function analyticsRoutes(app, BASE_URL) {
  const own = (() => { try { return new URL(BASE_URL).hostname; } catch { return ''; } })();
  app.post('/api/t', express.text({ type: '*/*', limit: '2kb' }), async (req, res) => {
    res.status(204).end();
    if (req.get('DNT') === '1' || req.get('Sec-GPC') === '1' || BOT.test(req.get('user-agent') || '')) return;
    let b; try { b = JSON.parse(req.body || '{}'); } catch { return; }
    const v = visitor(req), d = dayKey(), first = !seen.has(v), ev = ['pv', 'step', 'start'].includes(b.e) ? b.e : null;
    if (!ev) return;
    const stepKey = ev === 'step' ? `${v}:s${parseInt(b.s, 10)}` : ev === 'start' ? `${v}:start` : null;
    if (stepKey && seen.has(stepKey)) return;
    if (stepKey) seen.add(stepKey);
    if (ev === 'pv') seen.add(v);
    let ref = ''; try { ref = b.r ? new URL(b.r).hostname.replace(/^www\./, '') : ''; } catch {}
    if (ref === own) ref = '';
    const utm = clean(b.u, 40);
    await days.upsert(d, (p = {}) => {
      const x = { views: 0, visitors: 0, pages: {}, refs: {}, steps: {}, devices: {}, ...p };
      if (ev === 'pv') {
        x.views++; if (first) { x.visitors++; inc(x.refs, utm ? `kampania: ${utm}` : ref || 'bezpośrednio'); inc(x.devices, /Mobi|Android/i.test(req.get('user-agent') || '') ? 'telefon' : 'komputer'); }
        inc(x.pages, clean(b.p, 80) || '/');
      } else if (ev === 'start') inc(x.steps, 'start');
      else { const s = parseInt(b.s, 10); if (s >= 1 && s <= 7) inc(x.steps, String(s)); }
      return x;
    }).catch(() => {});
  });
}
export const analyticsDays = () => days.all();
export const cleanupAnalytics = () => days.deleteWhere((x) => Date.now() - Date.parse(x.id) > 400 * 864e5);
