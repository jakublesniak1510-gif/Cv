import crypto from 'node:crypto';
import { logEvent } from './events.js';

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

async function call(method, path, body) {
  const c = cfg();
  const r = await fetch(c.base + '/api/v1' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${c.posId}:${c.apiKey}`).toString('base64') },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`Przelewy24 ${r.status}: ${j.error || j.message || 'błąd'}`), { status: r.status, body: j });
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

async function existingRefund({ p24OrderId, requestId, amount, uuid, orderId }) {
  let list;
  try { list = await call('GET', `/refund/by/orderId/${encodeURIComponent(p24OrderId)}`); }
  catch (e) {
    if (e.status === 404 || e.status === 403) {
      logEvent('zwrot', 'Przelewy24: zwrot już zlecony wcześniej („Request already exists”), listy zwrotów nie da się pobrać – uznany za zlecony', { orderId });
      return { id: uuid, status: 'requested', existing: true };
    }
    throw new Error(`Przelewy24: zwrot był już zlecany, a sprawdzenie listy zwrotów się nie udało (${e.message}). Sprawdź zwrot w panelu Przelewy24.`);
  }
  const refunds = (Array.isArray(list) ? list : [list]).flatMap((x) => x?.refunds || []);
  if (refunds.some((r) => r.requestId === requestId || Number(r.amount) === amount)) return { id: uuid, status: 'requested', existing: true };
  throw new Error('Przelewy24: zlecenie o tym identyfikatorze już istnieje, ale na liście zwrotów transakcji nie ma zwrotu tej kwoty. Sprawdź zwrot w panelu Przelewy24.');
}
// Zwrot (całość albo część) przez API: POST /transaction/refund. requestId i refundsUuid zależą od zamówienia, kwoty już
// zwróconej i kwoty zwrotu, więc ponowione kliknięcie z tą samą kwotą nie zleci drugiego zwrotu. Zwraca { id, status }.
export async function p24Refund({ orderId, sessionId, p24OrderId, amount, already = 0, urlStatus }) {
  const key = crypto.createHash('sha256').update(`refund:${orderId}:${already}:${amount}`).digest('hex');
  const uuid = `${key.slice(0, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}-${key.slice(16, 20)}-${key.slice(20, 32)}`;
  const requestId = key.slice(0, 32);
  let data;
  try {
    data = await call('POST', '/transaction/refund', {
      requestId, refundsUuid: uuid, ...(urlStatus ? { urlStatus } : {}),
      refunds: [{ orderId: Number(p24OrderId), sessionId, amount, description: `Zwrot – zamówienie ${String(orderId).slice(0, 8)}` }],
    });
  } catch (e) {
    // Ponowione zlecenie (np. pierwsza odpowiedź nie dotarła, drugie kliknięcie): P24 odpowiada 400 „Request already exists”.
    // Identyfikatory są deterministyczne, więc sprawdzamy listę zwrotów transakcji i uznajemy zwrot za zlecony, jeśli jest.
    if (!(e.status === 400 && /already exist/i.test(`${e.body?.error || ''} ${e.body?.message || ''} ${e.message}`))) throw e;
    return existingRefund({ p24OrderId, requestId, amount, uuid, orderId });
  }
  const r = Array.isArray(data) ? data[0] : data;
  if (r && r.status === false) throw new Error(`Przelewy24 odrzuciło zwrot: ${r.message || 'brak powodu'}`);
  return { id: uuid, status: 'requested' };
}
