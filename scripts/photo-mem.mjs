// Pomiar pamięci usługi „Zdjęcie do CV” (D1): serwer z NODE_OPTIONS=--max-old-space-size=300 (tryb demo, bez płatności),
// 5 zdjęć po kolei (podgląd, zamówienie, płatność demo, przygotowanie plików, pobranie 4 plików). Wynik: RSS procesu serwera
// i jego procesów potomnych od obróbki zdjęcia (z /proc, co 10 ms) – RSS i PSS (PSS dzieli współdzielone strony kodu node
// i bibliotek między procesy, więc suma PSS to faktyczna pamięć kontenera), baza po starcie, szczyty i przyrost, czas na zdjęcie. Uruchom: node scripts/photo-mem.mjs [zdjęcie.jpg]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createCanvas } from '@napi-rs/canvas';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rss = (pid) => { try { return Number(/VmRSS:\s+(\d+)/.exec(fs.readFileSync(`/proc/${pid}/status`, 'utf8'))[1]) * 1024; } catch { return 0; } };
const pss = (pid) => { try { return Number(/Pss:\s+(\d+)/.exec(fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8'))[1]) * 1024; } catch { return 0; } };
const kids = (pid) => { try { return fs.readFileSync(`/proc/${pid}/task/${pid}/children`, 'utf8').trim().split(/\s+/).filter(Boolean).map(Number); } catch { return []; } };
const mb = (b) => Math.round(b / 1048576);
// Zdjęcie testowe: plik z argumentu albo wygenerowany obraz 1200×1600 z szumem (najgorszy przypadek dla JPEG: duży plik).
function testImage() {
  if (process.argv[2]) return fs.readFileSync(process.argv[2]);
  const W = 1200, H = 1600, c = createCanvas(W, H), x = c.getContext('2d'), d = x.createImageData(W, H);
  for (let i = 0; i < d.data.length; i += 4) { const v = (i * 2654435761) >>> 24; d.data[i] = v; d.data[i + 1] = (v * 3) & 255; d.data[i + 2] = (v * 7) & 255; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0);
  return c.toBuffer('image/jpeg');
}

const port = 4900 + Math.floor(Math.random() * 90), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-photomem-'));
const env = { ...process.env, NODE_OPTIONS: '--max-old-space-size=300', PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '', SALES_OPEN: '1' };
const srv = spawn(process.execPath, ['server.js'], { env, stdio: 'ignore', cwd: new URL('..', import.meta.url).pathname });
const U = `http://localhost:${port}`, post = (p, b) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
let peak = 0, kidPeak = 0, sumPeak = 0, pPeak = 0, pKid = 0, pSum = 0;
const timer = setInterval(() => {
  const ks = kids(srv.pid), m = rss(srv.pid), k = ks.reduce((s, p) => s + rss(p), 0), pm = pss(srv.pid), pk = ks.reduce((s, p) => s + pss(p), 0);
  peak = Math.max(peak, m); kidPeak = Math.max(kidPeak, k); sumPeak = Math.max(sumPeak, m + k); pPeak = Math.max(pPeak, pm); pKid = Math.max(pKid, pk); pSum = Math.max(pSum, pm + pk);
}, 10);
try {
  for (let i = 0; i < 100; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
  await fetch(U + '/narzedzia/zdjecie-do-cv'); await wait(1500);
  const base = rss(srv.pid), pBase = pss(srv.pid); peak = sumPeak = base; pPeak = pSum = pBase; kidPeak = pKid = 0;
  const image = `data:image/jpeg;base64,${testImage().toString('base64')}`, times = [];
  for (let n = 1; n <= 5; n++) {
    const t = Date.now();
    const pv = await post('/api/photo/preview', { image, frame: { x: 0.1, y: 0.05, w: 0.7 }, crop: '3:4' });
    if (!pv.ok) throw new Error(`podgląd: ${pv.status} ${(await pv.json()).error}`);
    const o = await post('/api/products/photo', { image, email: 'test@example.com', terms: true, waiver: true, frame: { x: 0.1, y: 0.05, w: 0.7 } }).then((r) => r.json());
    await post(`/api/orders/${o.id}/demo-pay`, {});
    let st; for (let k = 0; k < 200 && st?.status !== 'done'; k++) { await wait(100); st = await fetch(`${U}/api/products/${o.id}`).then((r) => r.json()); }
    if (st?.status !== 'done') throw new Error(`zamówienie ${n}: ${st?.status}`);
    for (const f of st.files) { const r = await fetch(`${U}/api/products/${o.id}/${f}`); if (!r.ok) throw new Error(`${f}: ${r.status}`); await r.arrayBuffer(); }
    times.push(Date.now() - t);
    console.log(`zdjęcie ${n}: ${times.at(-1)} ms; RSS główny ${mb(rss(srv.pid))} MB (szczyt ${mb(peak)}), potomny szczyt ${mb(kidPeak)}, razem ${mb(sumPeak)}; PSS razem szczyt ${mb(pSum)} MB`);
  }
  await wait(2000);
  console.log(`\nRSS: baza ${mb(base)} MB; szczyt główny ${mb(peak)} MB, potomny ${mb(kidPeak)} MB, razem ${mb(sumPeak)} MB – przyrost ponad bazę ${mb(sumPeak - base)} MB; po 2 s spokoju ${mb(rss(srv.pid))} MB (potomny zakończony: ${kids(srv.pid).length === 0 ? 'tak' : 'nie'})`);
  console.log(`PSS: baza ${mb(pBase)} MB; szczyt główny ${mb(pPeak)} MB, potomny ${mb(pKid)} MB, razem ${mb(pSum)} MB – przyrost ponad bazę ${mb(pSum - pBase)} MB; po 2 s spokoju ${mb(pss(srv.pid))} MB`);
  console.log(`Czas na zdjęcie (podgląd + zakup + 4 pliki w mailu + 4 pobrania): średnio ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms`);
} finally { clearInterval(timer); srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
