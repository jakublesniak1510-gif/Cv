// Generuje sekret do logowania kodem z aplikacji: node scripts/admin-secret.mjs
import crypto from 'node:crypto';
import { base32Encode } from '../lib/totp.js';
const secret = base32Encode(crypto.randomBytes(20));
console.log(`ADMIN_TOTP_SECRET=${secret}`);
console.log(`ADMIN_SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log(`\nDodaj konto w aplikacji (Google Authenticator / Authy): wpisz ręcznie sekret powyżej albo użyj adresu:`);
console.log(`otpauth://totp/CV%20Pod%20Og%C5%82oszenie:admin?secret=${secret}&issuer=CV%20Pod%20Og%C5%82oszenie`);
