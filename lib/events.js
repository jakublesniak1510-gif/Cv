import crypto from 'node:crypto';
import { events } from './store.js';

// Dziennik problemów dla panelu administratora. Bez danych osobowych: tylko typ, krótki opis i np. domena.
export function logEvent(type, message, meta = {}) {
  const id = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  events.save({ id, type, message: String(message).slice(0, 300), meta, at: Date.now() }).catch(() => {});
}
export const cleanupEvents = (maxAgeMs) => events.deleteWhere((e) => Date.now() - e.at > maxAgeMs);
