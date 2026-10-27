import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Dane właściciela tylko w kontakcie (prośba z 27.10): imię i nazwisko, adres, NIP, REGON i telefon na /kontakt oraz tam,
// gdzie wymaga prawo (regulamin, polityka prywatności, faktury, e-maile z zamówieniem, dokumenty B2B). Nigdzie indziej.
const OWNER = [/Leśniak|Lesniak/, /9731085406/, /522084292/, /Winiary/, /Nowogród Bobrzański/, /577 ?151 ?435/];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

test('Strony publiczne bez danych właściciela; /kontakt, /regulamin, /polityka-prywatnosci z pełnymi danymi', async () => {
  const port = 5600 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-own-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, get = (p) => fetch(U + p).then((r) => r.text());
    for (let i = 0; i < 80; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    for (const p of ['/', '/cv/magazynier', '/poradnik/jak-dopasowac-cv-do-ogloszenia', '/narzedzia/skaner-cv', '/o-serwisie', '/zasady-redakcyjne', '/wzor-cv/magazynier', '/en', '/uk', '/de', '/szablony-premium', '/karnety', '/llms.txt', '/api/config']) {
      const h = await get(p);
      for (const re of OWNER) assert.doesNotMatch(h, re, `${p}: ${re}`);
    }
    const home = await get('/');
    assert.ok(home.includes('<a href="/kontakt">Dane firmy i kontakt</a>'), 'strona główna: link do danych firmy');
    for (const p of ['/kontakt', '/regulamin', '/polityka-prywatnosci']) {
      const h = await get(p);
      for (const re of OWNER.slice(0, 5)) assert.match(h, re, `${p}: ${re}`);
    }
    assert.match(await get('/kontakt'), /577 151 435/, 'telefon na /kontakt');
    const r = await fetch(U + '/autor/jakub-lesniak', { redirect: 'manual' });
    assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/zasady-redakcyjne');
    assert.doesNotMatch(await get('/sitemap.xml'), /autor\/jakub-lesniak/);
  } finally { srv.kill(); }
});

test('Kod i treści: dane właściciela tylko w dozwolonych plikach (dokumenty prawne, faktury, B2B, listy)', () => {
  const ALLOWED = new Set(['lib/invoice.js', 'lib/b2b.js', 'lib/b2b-templates.js', 'lib/letters.js', 'lib/authorship.js', 'lib/seo.js', 'public/legal/regulamin.html', 'public/legal/prywatnosc.html']);
  const root = new URL('..', import.meta.url).pathname;
  const files = [...walk(path.join(root, 'public')), ...walk(path.join(root, 'lib')), ...walk(path.join(root, 'seo-data'))].filter((f) => /\.(js|json|html|txt|md)$/.test(f));
  for (const f of files) {
    const rel = path.relative(root, f), t = fs.readFileSync(f, 'utf8');
    if (OWNER.some((re) => re.test(t))) assert.ok(ALLOWED.has(rel), `${rel}: dane właściciela poza dozwolonymi miejscami`);
  }
  // lib/seo.js: tylko /kontakt (meta opis i dane strony kontaktu); lib/authorship.js: tylko stary adres do przekierowania.
  const seo = fs.readFileSync(path.join(root, 'lib/seo.js'), 'utf8');
  assert.deepEqual([...seo.matchAll(/Leśniak|9731085406|Winiary/g)].length, 3, 'tylko meta opis /kontakt');
  assert.match(seo, /const CONTACT = \{ title: 'Kontakt', seoTitle: 'Kontakt: dane firmy, telefon, e-mail', metaDescription: 'Kontakt z CV Pod Ogłoszenie: Jakub Leśniak, Winiary 2/);
  assert.match(fs.readFileSync(path.join(root, 'lib/authorship.js'), 'utf8'), /export const OLD_AUTHOR_PATH = 'autor\/jakub-lesniak';/);
});
