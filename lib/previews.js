// Podglądy obrazkowe wzorów i przykładowych CV zawodów (public/podglad/*.webp, generuje scripts/previews.mjs).
// Wymiary z seo-data/previews.json, żeby <img> miał width/height (bez przesuwania układu); brak pliku → brak obrazka.
import fs from 'node:fs';

const SIZES = (() => { try { return JSON.parse(fs.readFileSync(new URL('../seo-data/previews.json', import.meta.url), 'utf8')); } catch { return {}; } })();
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const previewPath = (name) => (SIZES[name] ? `/podglad/${name}.webp` : null);
export function previewImg(name, alt, cls = 'tpl-img') {
  const s = SIZES[name]; if (!s) return '';
  return `<figure class="${cls}"><img src="/podglad/${name}.webp" alt="${esc(alt)}" width="${s[0]}" height="${s[1]}" loading="lazy" decoding="async"></figure>`;
}
