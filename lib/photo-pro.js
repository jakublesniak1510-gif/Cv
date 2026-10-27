import { fork } from 'node:child_process';

// Zdjęcie do CV (D1, 27.10): kadr wybrany przez klienta (ramka 3:4 na zdjęciu), wyrównanie jasności i pliki w wysokiej
// rozdzielczości. Bez AI i bez zmiany tła: lokalny model do usuwania tła potrzebował ok. 140–220 MB pamięci na proces
// (onnxruntime), a serwer ma 512 MB na całość. Tylko kadr i światło: nie zmieniamy rysów twarzy ani wyglądu.
// Obróbka działa w osobnym procesie (lib/photo-worker.js), który kończy się po każdym pliku – pamięć obrazów
// (natywna, poza stertą JS) wraca do systemu od razu, a nie dopiero po odśmiecaniu w głównym procesie.
// Pomiar pamięci: node scripts/photo-mem.mjs.
export const CROPS = { '3:4': [3, 4], '1:1': [1, 1] };
const WORKER = new URL('./photo-worker.js', import.meta.url).pathname, TIMEOUT = 30_000;
let queue = Promise.resolve();

export class PhotoError extends Error {}

// Ramka 3:4 w ułamkach szerokości i wysokości zdjęcia: { x, y, w } (lewy górny róg i szerokość). Bez ramki – największy
// kadr 3:4 na środku w poziomie, nieco wyżej niż środek w pionie (twarz zwykle jest w górnej części zdjęcia).
export function cleanFrame(f, imgW, imgH) {
  const maxW = Math.min(imgW, (imgH * 3) / 4);
  let w = Number(f?.w) * imgW;
  if (!(w > 0)) w = maxW;
  w = Math.min(maxW, Math.max(Math.min(maxW, 120), w));
  const h = (w * 4) / 3;
  let x = Number(f?.x) * imgW, y = Number(f?.y) * imgH;
  if (!Number.isFinite(x)) x = (imgW - w) / 2;
  if (!Number.isFinite(y)) y = (imgH - h) * 0.3;
  return { x: Math.min(Math.max(0, x), imgW - w), y: Math.min(Math.max(0, y), imgH - h), w, h };
}

// Wymiary z nagłówka JPEG/PNG – bez dekodowania. Zdjęcie większe niż MAX_SIDE odrzucamy przed obróbką: przeglądarka
// i tak wysyła je zmniejszone do 1600 px (pliki mają najwyżej 1200×1600), a duży obraz po zdekodowaniu zająłby dużo pamięci.
export const MAX_SIDE = 2000;
export function imageSize(b) {
  if (!b || b.length < 24) return null;
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}

// Jeden plik = jeden proces potomny (ok. 90 MB PSS, sam się kończy), najwyżej jeden naraz; kolejne czekają w kolejce
// (najwyżej QMAX). Zdjęcie sprawdzamy po nagłówku, zanim trafi do dekodowania.
const QMAX = 20;
let waiting = 0;
function inWorker(buf, frame, job) {
  const s = imageSize(buf);
  if (!s) return Promise.reject(new PhotoError('Nie udało się odczytać zdjęcia. Wgraj JPG lub PNG.'));
  if (Math.min(s.w, s.h) < 200) return Promise.reject(new PhotoError('Zdjęcie jest za małe. Wgraj zdjęcie o boku co najmniej 200 px.'));
  if (Math.max(s.w, s.h) > MAX_SIDE) return Promise.reject(new PhotoError(`Zdjęcie ma za dużą rozdzielczość. Zmniejsz je do ${MAX_SIDE} px na dłuższym boku.`));
  if (waiting >= QMAX) return Promise.reject(new PhotoError('Przygotowujemy teraz dużo zdjęć. Spróbuj za minutę.'));
  waiting++;
  const run = () => new Promise((resolve, reject) => {
    const child = fork(WORKER, [], { serialization: 'advanced', execArgv: ['--max-old-space-size=96'], stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    let done = false;
    const finish = (fn, v) => { if (done) return; done = true; clearTimeout(timer); child.kill(); fn(v); };
    const timer = setTimeout(() => finish(reject, new Error('Przygotowanie zdjęcia trwało za długo.')), TIMEOUT);
    child.on('message', (m) => (m.error ? finish(reject, m.photo ? new PhotoError(m.error) : new Error(m.error)) : finish(resolve, Buffer.from(m.out))));
    child.on('error', (e) => finish(reject, e));
    child.on('exit', (code) => finish(reject, new Error(`Proces zdjęcia zakończył się (kod ${code}).`)));
    child.send({ buf, frame, job });
  });
  const p = queue.then(run, run).finally(() => waiting--);
  queue = p.catch(() => {});
  return p;
}

// Wynik: kadr 3:4 albo kwadrat (górna część kadru 3:4: głowa i ramiona), wyrównana jasność. watermark – darmowy podgląd.
export const processPhoto = (buf, { frame, ...job } = {}) => inWorker(buf, frame, job);
// Kilka plików z jednego zdjęcia i kadru, po kolei: [{ crop, width, format }, …] → [Buffer, …].
export async function processPhotos(buf, frame, list) { const outs = []; for (const job of list) outs.push(await inWorker(buf, frame, job)); return outs; }
// Darmowy podgląd: 300 px szerokości, JPEG, znak wodny.
export const photoPreview = (buf, opts = {}) => processPhoto(buf, { ...opts, width: 300, watermark: 'PODGLĄD', format: 'jpeg' });
// Pełna wersja: do 1200 px szerokości (3:4 → 1200×1600, kwadrat 1200×1200), PNG i JPG.
export const photoFull = (buf, opts = {}) => processPhoto(buf, { ...opts, width: 1200 });
