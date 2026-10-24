import crypto from 'node:crypto';

// Przelewy24 (REST API v1): BLIK, karty, szybkie przelewy, Google Pay i Apple Pay. Pieniądze trafiają na rachunek
// bankowy sprzedawcy, a każda transakcja ma w opisie numer zamówienia (sessionId).
// Zmienne: P24_MERCHANT_ID, P24_POS_ID (domyślnie = merchant), P24_API_KEY (klucz do raportów / API), P24_CRC, P24_SANDBOX=1.
const cfg = () => ({
  merchantId: Number(process.env.P24_MERCHANT_ID), posId: Number(process.env.P24_POS_ID || process.env.P24_MERCHANT_ID),
  apiKey: process.env.P24_API_KEY, crc: process.env.P24_CRC,
  base: process.env.P24_BASE_URL || (process.env.P24_SANDBOX === '1' ? 'https://sandbox.przelewy24.pl' : 'https://secure.przelewy24.pl'),
});
export const p24Enabled = () => { const c = cfg(); return !!(c.merchantId && c.apiKey && c.crc); };
export const p24Sandbox = () => process.env.P24_SANDBOX === '1';

// Podpis: SHA-384 z JSON-a w dokładnie tej kolejności pól (bez spacji, bez escapowania „/” i znaków Unicode).
const sign = (obj) => crypto.createHash('sha384').update(JSON.stringify(obj)).digest('hex');

// Treść błędu P24: error bywa tekstem albo listą pozycji z message (np. 409 przy zwrocie), do tego code i data[0].message.
const p24Reason = (j) => [Array.isArray(j.error) ? j.error.map((x) => x?.message || JSON.stringify(x)).join('; ') : j.error, j.message, Array.isArray(j.data) ? j.data[0]?.message : null, j.code != null ? `kod ${j.code}` : null]
  .filter((x, i, a) => x && a.indexOf(x) === i).join(', ') || 'błąd';
async function call(method, path, body, timeout = 15_000) {
  const c = cfg();
  const r = await fetch(c.base + '/api/v1' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${c.posId}:${c.apiKey}`).toString('base64') },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`Przelewy24 ${r.status}: ${p24Reason(j)}`), { status: r.status, body: j });
  return j.data;
}

// Rejestracja transakcji; zwraca adres strony płatności.
export async function p24Register({ sessionId, amount, description, email, urlReturn, urlStatus, language = 'pl' }) {
  const c = cfg();
  const data = await call('POST', '/transaction/register', {
    merchantId: c.merchantId, posId: c.posId, sessionId, amount, currency: 'PLN', description: description.slice(0, 1024), email,
    country: 'PL', language: language === 'de' ? 'de' : language === 'en' || language === 'uk' ? 'en' : 'pl', urlReturn, urlStatus, timeLimit: 30, waitForResult: true,
    sign: sign({ sessionId, merchantId: c.merchantId, amount, currency: 'PLN', crc: c.crc }),
  });
  return { token: data.token, url: `${c.base}/trnRequest/${data.token}` };
}

// Powiadomienie od Przelewy24 (urlStatus): sprawdzamy podpis, potem potwierdzamy transakcję (verify).
export function p24NotificationOk(n) {
  const c = cfg();
  const expected = sign({ merchantId: n.merchantId, posId: n.posId, sessionId: n.sessionId, amount: n.amount, originAmount: n.originAmount, currency: n.currency, orderId: n.orderId, methodId: n.methodId, statement: n.statement, crc: c.crc });
  return typeof n.sign === 'string' && n.sign.length === expected.length && crypto.timingSafeEqual(Buffer.from(n.sign), Buffer.from(expected)) && n.merchantId === c.merchantId;
}
export async function p24Verify({ sessionId, orderId, amount }) {
  const c = cfg();
  const data = await call('PUT', '/transaction/verify', { merchantId: c.merchantId, posId: c.posId, sessionId, amount, currency: 'PLN', orderId, sign: sign({ sessionId, orderId, amount, currency: 'PLN', crc: c.crc }) });
  return data?.status === 'success';
}
// Stan transakcji po powrocie klienta (gdyby powiadomienie jeszcze nie dotarło). status: 0 brak wpłaty, 1 wpłata do potwierdzenia, 2 potwierdzona, 3 zwrot.
export const p24BySession = (sessionId) => call('GET', `/transaction/by/sessionId/${encodeURIComponent(sessionId)}`).catch(() => null);

// Zwrot (całość albo część) przez API: POST /transaction/refund (dokumentacja P24: requestId ≤ 45 znaków, refundsUuid ≤ 35,
// opis ≤ 35, kwota w groszach). Identyfikatory są losowe przy każdej próbie – P24 pamięta requestId także odrzuconego
// zlecenia, więc ponowienie z tym samym kluczem kończyło się 400 „Request already exists”. Przed ponowieniem panel sprawdza
// listę zwrotów (p24Refunds), żeby nie zlecić tego samego zwrotu dwa razy. Zwraca { id, status }.
export async function p24Refund({ orderId, sessionId, p24OrderId, amount, urlStatus, uuid = crypto.randomUUID().replace(/-/g, '') }) {
  const requestId = crypto.randomUUID().replace(/-/g, '');
  const data = await call('POST', '/transaction/refund', {
    requestId, refundsUuid: uuid, ...(urlStatus ? { urlStatus } : {}),
    refunds: [{ orderId: Number(p24OrderId), sessionId, amount: Math.round(amount), description: `Zwrot zamówienia ${String(orderId).slice(0, 8)}`.slice(0, 35) }],
  }, 30_000);
  const r = Array.isArray(data) ? data[0] : data;
  if (r && r.status === false) throw new Error(`Przelewy24 odrzuciło zwrot: ${r.message || 'brak powodu'}`);
  return { id: uuid, requestId, status: 'requested' };
}
// Zwroty transakcji (GET /refund/by/orderId): status 1 wykonany, 2 w realizacji, 3 czeka na akceptację P24, 4 odrzucony.
// 404 = brak zwrotów dla tej transakcji.
export async function p24Refunds(p24OrderId) {
  try { return (await call('GET', `/refund/by/orderId/${encodeURIComponent(p24OrderId)}`))?.refunds || []; }
  catch (e) { if (e.status === 404) return []; throw e; }
}
