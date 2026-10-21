import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { templateRoutes } from '../lib/templates.js';
import { TEMPLATES } from '../lib/templates-content/index.js';
import { PROFESSIONS } from '../lib/content.js';

// Podglądy do Google Grafika (scripts/previews.mjs): każdy wzór CV i listu oraz przykładowe CV każdego zawodu.
const SIZES = JSON.parse(fs.readFileSync('seo-data/previews.json', 'utf8'));
// Wymiary z nagłówka WebP (VP8 / VP8L / VP8X).
function webpSize(b) {
  assert.equal(b.toString('latin1', 0, 4), 'RIFF'); assert.equal(b.toString('latin1', 8, 12), 'WEBP');
  const k = b.toString('latin1', 12, 16);
  if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  throw new Error(`nieznany WebP ${k}`);
}

test('Pliki podglądów: 25 wzorów CV, 25 listów (800 px, < 80 KB) i 150 przykładów CV zawodów (480 px, < 40 KB); wymiary jak w manifeście', () => {
  const check = (name, width, maxKb) => {
    const b = fs.readFileSync(`public/podglad/${name}.webp`);
    assert.ok(b.length < maxKb * 1000, `${name}: ${b.length} B`);
    assert.deepEqual(webpSize(b), SIZES[name], `${name}: wymiary`); assert.equal(SIZES[name][0], width);
  };
  const ts = Object.values(TEMPLATES); assert.equal(ts.length, 25);
  for (const t of ts) { check(`wzor-cv-${t.slug}`, 800, 80); check(`list-motywacyjny-${t.slug}`, 800, 80); }
  for (const p of PROFESSIONS) check(`cv-${p.slug}`, 480, 40);
});

test('Podglądy na stronach (lazy, width/height, alt) i w mapie strony (image:image)', async () => {
  const B = 'https://example.test', app = express(); seoRoutes(app, B); templateRoutes(app, B);
  const s = app.listen(0), U = `http://127.0.0.1:${s.address().port}`, get = async (p) => (await fetch(U + p)).text();
  try {
    const t = TEMPLATES.kasjer || Object.values(TEMPLATES)[0], [w, h] = SIZES[`wzor-cv-${t.slug}`];
    assert.ok((await get(`/wzor-cv/${t.slug}`)).includes(`<img src="/podglad/wzor-cv-${t.slug}.webp" alt="Wzór CV ${t.nameIn} – podgląd" width="${w}" height="${h}" loading="lazy" decoding="async">`));
    assert.ok((await get(`/list-motywacyjny/${t.slug}`)).includes(`<img src="/podglad/list-motywacyjny-${t.slug}.webp" alt="Wzór listu motywacyjnego ${t.nameIn} – podgląd"`));
    const p = PROFESSIONS[0];
    assert.ok((await get(`/cv/${p.slug}`)).includes(`<img src="/podglad/cv-${p.slug}.webp" alt="Przykładowe CV: ${p.name} – podgląd (dane fikcyjne)"`));
    const sm = await get('/sitemap.xml');
    assert.match(sm, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
    assert.ok(sm.includes(`<loc>${B}/wzor-cv/${t.slug}</loc><lastmod>`) && sm.includes(`<image:image><image:loc>${B}/podglad/wzor-cv-${t.slug}.webp</image:loc></image:image>`));
    assert.ok(sm.includes(`<image:loc>${B}/podglad/cv-${p.slug}.webp</image:loc>`));
    assert.equal((sm.match(/<image:image>/g) || []).length, 200);
  } finally { s.close(); }
});
