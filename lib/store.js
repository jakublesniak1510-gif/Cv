import fs from 'node:fs/promises';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'data', 'orders.json');
let chain = Promise.resolve();

async function readAll() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return {}; }
}

// Zapisy są serializowane, żeby równoległe żądania nie nadpisywały się nawzajem.
function locked(fn) {
  const run = chain.then(fn);
  chain = run.catch(() => {});
  return run;
}

export const getOrder = async (id) => (await readAll())[id] || null;

export const saveOrder = (order) => locked(async () => {
  const all = await readAll();
  all[order.id] = order;
  const tmp = FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(all, null, 2));
  await fs.rename(tmp, FILE);
  return order;
});

export const updateOrder = (id, patch) => locked(async () => {
  const all = await readAll();
  if (!all[id]) return null;
  all[id] = { ...all[id], ...patch };
  const tmp = FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(all, null, 2));
  await fs.rename(tmp, FILE);
  return all[id];
});
