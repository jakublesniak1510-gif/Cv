import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Regresja wdrożenia #38: obraz Dockera nie miał danych SEO (reguła „data” w .dockerignore), serwer nie startował na Renderze.
// Sprawdzamy reguły .dockerignore tak jak Docker: ostatnia pasująca reguła wygrywa, „!” to wyjątek.
const rules = fs.readFileSync(new URL('../.dockerignore', import.meta.url), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const toRe = (p) => new RegExp(`^${p.replace(/^\//, '').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\0').replace(/\*/g, '[^/]*').replace(/\0/g, '.*').replace(/\?/g, '[^/]')}(/.*)?$`);
const ignored = (file) => { let out = false; for (const r of rules) { const neg = r.startsWith('!'), pat = neg ? r.slice(1) : r; if (toRe(pat).test(file)) out = !neg; } return out; };

test('.dockerignore: dane SEO (seo-data) trafiają do obrazu, dane zamówień (data/*.json) nie', () => {
  for (const f of fs.readdirSync(new URL('../seo-data/', import.meta.url))) assert.equal(ignored(`seo-data/${f}`), false, `seo-data/${f} musi być w obrazie`);
  assert.ok(fs.existsSync(new URL('../seo-data/targi.json', import.meta.url)) && fs.existsSync(new URL('../seo-data/pracodawcy.json', import.meta.url)));
  assert.equal(ignored('data/orders.json'), true, 'zamówienia nie trafiają do obrazu');
  assert.equal(ignored('node_modules/x/index.js'), true); assert.equal(ignored('.env'), true);
  assert.equal(ignored('server.js'), false); assert.equal(ignored('lib/fairs.js'), false);
});
