import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { careerNote } from '../lib/generate.js';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// PR U: „Zmieniam branżę” w kroku doświadczenia – 3 pytania, generator akcentuje umiejętności przenoszalne, link do poradnika.
test('Notatka dla generatora: branże i odpowiedź kandydata, przenoszalne tylko z danych, bez dopisywania doświadczenia', () => {
  const n = careerNote({ from: 'gastronomia', to: 'logistyka', fit: 'planowanie grafików' });
  assert.match(n, /z branży „gastronomia” do branży „logistyka”/); assert.match(n, /„planowanie grafików”/);
  assert.match(n, /tylko te, które wynikają z danych kandydata/); assert.match(n, /Nie przypisuj kandydatowi doświadczenia w nowej branży/);
  assert.equal(careerNote({ from: 'x' }), '', 'bez docelowej branży – nic');
  assert.match(read('lib/generate.js'), /\$\{profile\.career\?\.to \? `\\n\$\{careerNote\(profile\.career\)\}\\n` : ''\}/);
});

test('Kreator: przełącznik i 3 pola w ekranie danych („Więcej danych”, C3), walidacja, profile.career; serwer zapisuje tylko z docelową branżą', async () => {
  const html = read('public/index.html'), app = read('public/app.js');
  assert.match(html, /<input type="checkbox" id="careerOn"> <span>Zmieniam branżę<\/span>/);
  for (const id of ['careerFrom', 'careerTo', 'careerFit']) assert.ok(html.includes(`id="${id}"`), id);
  assert.match(html, /href="\/poradnik\/cv-przy-zmianie-branzy"/);
  const more = html.slice(html.indexOf('<details class="optbox more-data" id="moreData">'), html.indexOf('</details>', html.indexOf('id="moreData"'))); assert.ok(more.includes('careerOn'), 'ekran 2, „Więcej danych”');
  assert.match(app, /if \(n === 2 && \$\('#careerOn'\)\.checked && !v\('careerTo'\)\) \{ \$\('#moreData'\)\.open = true; return/);
  assert.match(app, /career: \{ from: v\('careerFrom'\), to: v\('careerTo'\), fit: v\('careerFit'\) \}/);
  for (const l of ['en', 'de', 'uk']) assert.ok(JSON.parse(read(`public/i18n/${l}.json`))['Zmieniam branżę'], l);
  const port = 6200 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-career-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
  const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`, H = { 'Content-Type': 'application/json' };
    for (let i = 0; i < 50; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność i dokładność. '.repeat(2);
    const make = async (career) => (await (await fetch(U + '/api/orders', { method: 'POST', headers: H, body: JSON.stringify({ pkg: 'cv', consent: true, waiver: true, profile: { name: 'Jan Test', email: 'jan@test.pl', career, experience: [{ title: 'Kelner', company: 'Bistro', period: '2020 – 2024' }] }, ads: [{ title: 'Magazynier', text: ad }] }) })).json()).id;
    const a = await make({ from: 'gastronomia', to: 'logistyka', fit: 'x'.repeat(900) }), b = await make({ from: 'gastronomia' });
    await wait(200);
    const all = JSON.parse(fs.readFileSync(path.join(dir, 'orders.json'), 'utf8'));
    assert.deepEqual(Object.keys(all[a].profile.career), ['from', 'to', 'fit']); assert.equal(all[a].profile.career.fit.length, 600);
    assert.equal(all[b].profile.career, undefined);
  } finally { srv.kill(); }
});
