// Podgląd panelu administratora w jednym pliku: zrzut odpowiedzi API z działającego serwera (z danymi z admin-seed.mjs) + atrapa fetch.
// Użycie: node scripts/build-admin-preview.mjs http://localhost:3000 HASLO wynik.html
import fs from 'node:fs';
const [base, password, out] = process.argv.slice(2);
const r = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const login = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin': '1' }, body: JSON.stringify({ password }) });
const cookie = login.headers.get('set-cookie').split(';')[0];
const get = async (p) => (await fetch(`${base}/api/admin${p}`, { headers: { cookie } })).json();
const snap = { stats: await get('/stats'), codes: await get('/codes'), problems: await get('/problems'), reviews: await get('/reviews'), rows: [], details: {} };
for (let page = 0; ; page++) { const x = await get(`/orders?page=${page}`); snap.rows.push(...x.rows); if ((page + 1) * 50 >= x.total) break; }
for (const o of snap.rows) snap.details[o.id] = await get(`/orders/${o.id}`);
const html = r('public/admin.html');
const fonts = [...html.matchAll(/<link rel="stylesheet" href="(https:\/\/fonts[^"]+)">/g)].map((m) => `<link rel="stylesheet" href="${m[1]}">`).join('\n');
const body = /<body>([\s\S]*)<\/body>/.exec(html)[1].replace('<script src="/admin.js"></script>', '')
  .replace('<button class="btn" type="submit">Zaloguj</button>', '<p class="mute" style="margin:0;font-size:14px">Podgląd: wpisz dowolne hasło.</p><button class="btn" type="submit">Zaloguj</button>');
fs.writeFileSync(out, `<title>Panel administratora</title>\n${fonts}\n<style>\n${r('public/admin.css')}\n</style>\n${body}\n<script>\nwindow.SNAP = ${JSON.stringify(snap)};\n${r('scripts/admin-preview-stub.js')}\n${r('public/admin.js')}\n</script>\n`);
console.log('OK', out, snap.rows.length, 'zamówień');
