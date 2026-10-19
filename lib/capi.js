import crypto from 'node:crypto';

// Meta Conversions API: zdarzenie Purchase z serwera po opłaceniu zamówienia, żeby reklamy optymalizowały się także
// wtedy, gdy przeglądarka zablokuje piksel. TYLKO gdy klient zgodził się na cookies reklamowe (order.adConsent).
// event_id = id zamówienia: ten sam co eventID piksela w przeglądarce, więc Meta liczy zakup raz (deduplikacja).
// Zmienne: META_PIXEL_ID i META_CAPI_TOKEN; bez nich nic nie wysyłamy. META_CAPI_TEST = kod zdarzeń testowych (opcjonalnie).
const sha = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
export const capiEnabled = () => /^\d{6,20}$/.test(process.env.META_PIXEL_ID || '') && !!(process.env.META_CAPI_TOKEN || '').trim();
export function purchaseEvent(o, base) {
  const ctx = o.adCtx || {};
  return {
    event_name: 'Purchase', event_time: Math.floor((o.paidAt || Date.now()) / 1000), event_id: o.id, action_source: 'website', event_source_url: `${base}/`,
    user_data: { em: [sha(o.profile?.email || '')], ...(ctx.ip ? { client_ip_address: ctx.ip } : {}), ...(ctx.ua ? { client_user_agent: ctx.ua } : {}), ...(ctx.fbp ? { fbp: ctx.fbp } : {}), ...(ctx.fbc ? { fbc: ctx.fbc } : {}) },
    custom_data: { currency: 'PLN', value: Math.round(o.total || 0) / 100, order_id: o.id },
  };
}
export async function sendPurchase(o, base, fetchFn = fetch) {
  if (!capiEnabled() || !o?.adConsent || !(o.total > 0) || o.capi?.sent) return null;
  const v = process.env.META_GRAPH_VERSION || 'v21.0';
  const body = { data: [purchaseEvent(o, base)], ...(process.env.META_CAPI_TEST ? { test_event_code: process.env.META_CAPI_TEST } : {}) };
  const r = await fetchFn(`https://graph.facebook.com/${v}/${process.env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(process.env.META_CAPI_TOKEN.trim())}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `Meta CAPI ${r.status}`);
  return { sent: true, at: Date.now(), received: j.events_received ?? null };
}
// Kontekst do dopasowania (tylko za zgodą): IP, przeglądarka i identyfikatory piksela z ciasteczek _fbp/_fbc.
export function adContext(req, body) {
  const ok = (v, re) => (typeof v === 'string' && re.test(v) ? v.slice(0, 200) : null);
  return { ip: req.ip || null, ua: String(req.get('user-agent') || '').slice(0, 400) || null, fbp: ok(body?.fbp, /^fb\.\d\.\d+\.\d+$/), fbc: ok(body?.fbc, /^fb\.\d\.\d+\.[\w-]+$/) };
}
