import fs from 'node:fs/promises';
import path from 'node:path';

const DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Prosty magazyn JSON w pliku; zapisy serializowane, żeby równoległe żądania się nie nadpisywały.
export function makeStore(name) {
  const FILE = path.join(DIR, name);
  let chain = Promise.resolve();
  const readAll = async () => { try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return {}; } };
  const writeAll = async (all) => { await fs.mkdir(DIR, { recursive: true }); const tmp = FILE + '.tmp'; await fs.writeFile(tmp, JSON.stringify(all, null, 2)); await fs.rename(tmp, FILE); };
  const locked = (fn) => { const run = chain.then(fn); chain = run.catch(() => {}); return run; };
  return {
    all: readAll,
    get: async (id) => (await readAll())[id] || null,
    save: (item) => locked(async () => { const all = await readAll(); all[item.id] = item; await writeAll(all); return item; }),
    // Tworzy wpis, jeśli go nie ma (fn dostaje poprzednią wartość albo undefined).
    upsert: (id, fn) => locked(async () => { const all = await readAll(); all[id] = { ...fn(all[id]), id }; await writeAll(all); return all[id]; }),
    remove: (id) => locked(async () => { const all = await readAll(); if (!all[id]) return false; delete all[id]; await writeAll(all); return true; }),
    update: (id, patch) => locked(async () => { const all = await readAll(); if (!all[id]) return null; all[id] = typeof patch === 'function' ? patch(all[id]) : { ...all[id], ...patch }; await writeAll(all); return all[id]; }),
    // Usuwa wpisy spełniające warunek; zwraca liczbę usuniętych.
    deleteWhere: (pred) => locked(async () => { const all = await readAll(); let n = 0; for (const [id, v] of Object.entries(all)) if (pred(v)) { delete all[id]; n++; } if (n) await writeAll(all); return n; }),
  };
}

const orders = makeStore('orders.json');
export const getOrder = orders.get, saveOrder = orders.save, updateOrder = orders.update, allOrders = orders.all;
export const deleteOlderThan = (maxAgeMs) => { const now = Date.now(); return orders.deleteWhere((o) => now - (o.created || 0) > maxAgeMs); };
// Kody rabatowe i polecające (oddzielnie od zamówień, bo żyją dłużej: 90 dni).
export const codes = makeStore('codes.json');
// Zużycie AI (miesięcznie) i dziennik problemów do panelu administratora.
export const usage = makeStore('usage.json');
export const events = makeStore('events.json');
// Opinie klientów (osobno od zamówień: zostają po skasowaniu zamówienia, zawierają tylko imię podane do publikacji).
export const reviews = makeStore('reviews.json');
// Trwałe liczniki (np. ile CV przygotowaliśmy) – bez danych osobowych, nie znikają z zamówieniami.
export const stats = makeStore('stats.json');
// Zapytania od firm i instytucji (formularz „Dla firm”), usuwane po 12 miesiącach.
export const leads = makeStore('leads.json');
export const removeOrder = orders.remove;
