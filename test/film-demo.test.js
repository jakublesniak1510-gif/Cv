import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Film demo na stronie głównej („Jak to działa”): plik ≤ 3 MB bez dźwięku, <video> z miniaturą i preload="none", bez autoodtwarzania.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url));
test('Film demo: pliki w public/media, <video> z poster i preload="none", bez autoplay; link i notka w 4 językach', () => {
  const mp4 = read('public/media/demo-16x9.mp4'), jpg = read('public/media/demo-16x9.jpg');
  assert.ok(mp4.length > 100e3 && mp4.length <= 3 * 1024 * 1024, `mp4 ${mp4.length} B`); assert.equal(mp4.subarray(4, 8).toString(), 'ftyp');
  assert.ok(!mp4.includes(Buffer.from('soun')), 'bez ścieżki dźwiękowej');
  assert.ok(jpg.length < 200e3); assert.equal(jpg[0], 0xff); assert.equal(jpg[1], 0xd8);
  const html = read('public/index.html').toString(), v = html.match(/<video[^>]*>/)[0];
  for (const a of ['id="demoFilm"', 'controls', 'muted', 'playsinline', 'preload="none"', 'poster="/media/demo-16x9.jpg"', 'width="1280"', 'height="720"']) assert.ok(v.includes(a), a);
  assert.doesNotMatch(v, /autoplay|loop/); assert.match(html, /<source src="\/media\/demo-16x9\.mp4" type="video\/mp4">/);
  assert.ok(html.indexOf('id="demoFilm"') > html.indexOf('<section class="sec" id="jak">'), 'w sekcji „Jak to działa”');
  assert.match(html, /<a href="#demoFilm" id="demoFilmLink">Zobacz, jak to działa \(film, 20 s\)<\/a> <span class="nopl">Napisy w filmie są po polsku\.<\/span>/);
  assert.match(read('public/style.css').toString(), /html\[lang="pl"\] \.demo-film \.nopl\{display:none\}/);
  for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); for (const k of ['Zobacz, jak to działa (film, 20 s)', 'Napisy w filmie są po polsku.', 'Film: zamówienie CV pod ogłoszenie krok po kroku']) assert.ok(d[k], `${l}: ${k}`); }
});
