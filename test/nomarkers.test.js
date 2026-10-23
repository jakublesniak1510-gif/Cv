import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Po scaleniach gałęzi: żaden plik źródłowy nie może zawierać znaczników konfliktu gita.
test('Brak znaczników konfliktu (<<<<<<<, =======, >>>>>>>) w plikach źródłowych', () => {
  const root = new URL('..', import.meta.url).pathname, bad = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|mjs|json|css|html|md)$/.test(e.name) && /^(<<<<<<< |=======$|>>>>>>> )/m.test(fs.readFileSync(p, 'utf8'))) bad.push(path.relative(root, p));
  } };
  for (const d of ['lib', 'public', 'seo-data', 'scripts', 'test']) if (fs.existsSync(path.join(root, d))) walk(path.join(root, d));
  for (const f of ['server.js']) if (/^(<<<<<<< |>>>>>>> )/m.test(fs.readFileSync(path.join(root, f), 'utf8'))) bad.push(f);
  assert.deepEqual(bad, []);
});
