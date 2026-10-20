import crypto from 'node:crypto';

// Google Search Console przez konto serwisowe, bez googleapis: JWT RS256 podpisany node:crypto → token OAuth.
// GSC_SA_JSON = cała treść klucza JSON konta serwisowego, GSC_SITE = właściwość (np. „sc-domain:cvpodogloszenie.pl”).
// Konto serwisowe trzeba dodać w Search Console jako użytkownika właściwości (wystarczy „Ograniczony”).
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const API = 'https://searchconsole.googleapis.com';
export const gscSite = () => String(process.env.GSC_SITE || '').trim();
function account() {
  try { const a = JSON.parse(process.env.GSC_SA_JSON || ''); return a.client_email && a.private_key ? a : null; } catch { return null; }
}
export const gscEnabled = () => !!(account() && gscSite());
const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');

export function signJwt(a, now = Date.now()) {
  const iat = Math.floor(now / 1000), head = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({ iss: a.client_email, scope: SCOPE, aud: a.token_uri || 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(a.private_key).toString('base64url');
  return `${head}.${claim}.${sig}`;
}

let cached = null;
async function token(fetchFn) {
  if (cached && cached.exp > Date.now() + 60e3) return cached.value;
  const a = account(); if (!a) throw new Error('Brak GSC_SA_JSON.');
  const r = await fetchFn(a.token_uri || 'https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signJwt(a) }), signal: AbortSignal.timeout(15e3) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Token Google: ${j.error_description || j.error || r.status}`);
  cached = { value: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.value;
}
export const resetGscToken = () => { cached = null; };

async function call(path, body, fetchFn) {
  const r = await fetchFn(`${API}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${await token(fetchFn)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30e3) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Search Console: ${j.error?.message || r.status}`);
  return j;
}

// Wiersze searchAnalytics: [{ keys, clicks, impressions, ctr, position }].
export async function searchAnalytics({ startDate, endDate, dimensions = [], rowLimit = 1000 }, fetchFn = fetch) {
  const j = await call(`/webmasters/v3/sites/${encodeURIComponent(gscSite())}/searchAnalytics/query`, { startDate, endDate, dimensions, rowLimit, dataState: 'final' }, fetchFn);
  return j.rows || [];
}

// Stan indeksowania adresu (np. „Submitted and indexed”, „Crawled - currently not indexed”).
export async function inspectUrl(url, fetchFn = fetch) {
  const j = await call('/v1/urlInspection/index:inspect', { inspectionUrl: url, siteUrl: gscSite(), languageCode: 'en-US' }, fetchFn);
  const s = j.inspectionResult?.indexStatusResult || {};
  return { url, coverage: s.coverageState || s.verdict || 'nieznany', verdict: s.verdict || '', lastCrawl: s.lastCrawlTime || null };
}
