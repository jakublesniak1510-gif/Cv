import crypto from 'node:crypto';

// Kody jednorazowe z aplikacji (Google Authenticator, Authy itp.) wg RFC 6238.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Decode(s) {
  let bits = '', out = [];
  for (const ch of String(s).toUpperCase().replace(/[^A-Z2-7]/g, '')) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
export function base32Encode(buf) {
  let bits = '', out = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
export function totp(secret, t = Date.now(), step = 30) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(t / 1000 / step)));
  const h = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
}
// Akceptuje kod z bieżącego okna i sąsiednich (różnica zegarów do 30 s).
export const verifyTotp = (secret, code) => [-1, 0, 1].some((w) => totp(secret, Date.now() + w * 30000) === String(code).trim());
