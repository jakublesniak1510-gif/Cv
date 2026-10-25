import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { REWRITE_NOTE } from '../lib/generate.js';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// PR T1: tryb „Mam już CV” – import własnego CV, generator zachowuje treść, kolejność i daty, nic nie dopisuje.
test('Zasady generatora: kolejność, daty, firmy, bez nowych faktów, braki tylko w match.missing; przekazywane do zapytania', () => {
  for (const re of [/tej samej kolejności, z tymi samymi datami/, /żadnej pozycji nie usuwaj/, /NIE dodawaj nowych punktów, umiejętności, certyfikatów, liczb ani faktów/, /wyłącznie do match\.missing/, /nigdy do treści CV/]) assert.match(REWRITE_NOTE, re);
  const g = read('lib/generate.js'), s = read('server.js');
  assert.match(g, /\$\{rewrite \? `\\n\$\{REWRITE_NOTE\}\\n` : ''\}/);
  assert.match(s, /rewrite: o\.mode === 'rewrite'/);
});

test('Kreator: przełącznik przy imporcie, wymagane wgrane CV, mode w zamówieniu; serwer zapisuje tryb i zwraca w widoku', async () => {
  const app = read('public/app.js'), html = read('public/index.html');
  assert.match(html, /<input type="checkbox" id="rewriteMode"> <span>Mam już CV – popraw je pod ogłoszenie, zachowując jego treść<\/span>/);
  assert.match(html, /Zachowujemy treść i kolejność Twojego CV; wygląd w naszym szablonie\./);
  assert.match(app, /if \(n === 2 && \$\('#rewriteMode'\)\.checked && !imported\) return/);
  assert.match(app, /\.\.\.\(\$\('#rewriteMode'\)\.checked \? \{ mode: 'rewrite' \} : \{\}\)/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Mam już CV – popraw je pod ogłoszenie, zachowując jego treść'], l);
  const port = 5900 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-rewrite-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const body = (x) => JSON.stringify({ pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', experience: [{ title: 'Magazynier', company: 'Firma', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }], ...x });
    const a = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: body({ mode: 'rewrite' }) })).json();
    const b = await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: body({ mode: 'cokolwiek' }) })).json();
    assert.equal((await (await fetch(`${U}/api/orders/${a.id}`)).json()).mode, 'rewrite');
    assert.equal((await (await fetch(`${U}/api/orders/${b.id}`)).json()).mode, null, 'tylko znana wartość');
    assert.equal((await (await fetch(`${U}/api/orders/${a.id}`)).json()).total, 3900, 'cena jak CV');
  } finally { srv.kill(); }
});
