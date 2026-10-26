import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Raport GSC 26.10: dla /en/cv/construction-worker, recruiter, data-analyst, marketing-specialist Google wybrał inny kanoniczny
// (/en/cv/packer) – strony EN były zbyt podobne. 20 zawodów EN z własną treścią, unikalne tytuły EN/DE, self-canonical i hreflang.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-en-plus-'));
const express = (await import('express')).default;
const { PROF_EN_PLUS } = await import('../lib/prof-en-plus.js');
const { PROF_LANGS } = await import('../lib/professions-i18n.js');
const { profSeo } = await import('../lib/seo-titles.js');
const { seoRoutes } = await import('../lib/seo.js');
const words = (s) => s.split(/\s+/).filter(Boolean).length;

test('20 zawodów EN: wstęp ≥ 80 słów, tytuł ≤ 60, opis ≤ 155, sekcja UK/IE, 3 zdania do CV, źródła https; wszystko unikalne', () => {
  const keys = Object.keys(PROF_EN_PLUS);
  assert.equal(keys.length, 20);
  for (const k of ['pracownik-budowlany', 'rekruter', 'analityk-danych', 'specjalista-marketingu']) assert.ok(PROF_EN_PLUS[k], `zawód z raportu GSC: ${k}`);
  const seen = new Set();
  for (const [k, x] of Object.entries(PROF_EN_PLUS)) {
    assert.ok(PROF_LANGS.en.prof[k], `istnieje strona EN: ${k}`);
    assert.ok(words(x.lead) >= 80, `${k}: wstęp ${words(x.lead)} słów`); assert.notEqual(x.lead, PROF_LANGS.en.prof[k].intro);
    assert.ok(x.seoTitle.length <= 60, `${k}: tytuł ${x.seoTitle.length}`); assert.ok(x.metaDescription.length <= 155, `${k}: opis ${x.metaDescription.length}`);
    assert.ok(x.uk.length >= 2 && x.lines.length === 3 && x.sources.length >= 1, k);
    for (const s of x.sources) assert.match(s.u, /^https:\/\/[\w.-]+\.(gov\.uk|org\.uk|co\.uk|gov\.ie|ie|org|com)\//, `${k}: ${s.u}`);
    for (const t of [x.lead, x.seoTitle, x.metaDescription, ...x.lines]) { assert.ok(!seen.has(t), `powtórzony tekst: ${t.slice(0, 40)}`); seen.add(t); }
    assert.doesNotMatch([x.lead, ...x.uk, ...x.lines, x.metaDescription].join(' '), /\bguarantee|\bthe best\b|\d+\s?%/i, `${k}: bez obietnic i procentów`);
  }
});

test('Tytuły zawodów EN i DE unikalne (słowo kluczowe zawodu), PL bez zmian', () => {
  for (const l of ['en', 'de']) {
    const ts = Object.values(PROF_LANGS[l].prof).map((p) => profSeo(p, l).seoTitle);
    assert.equal(new Set(ts).size, ts.length, `${l}: unikalne tytuły`); assert.ok(ts.every((t) => t && t.length <= 60), l);
  }
  assert.equal(profSeo({ title: 'CV hydraulika: wzór i wskazówki', keywords: ['instalacje'] }, 'pl').seoTitle, 'CV hydraulika pod ogłoszenie – wzór i generator online');
});

test('Strona /en/cv/recruiter: nowy wstęp, sekcje, źródła, tytuł; self-canonical i hreflang; /en/cv/packer bez sekcji', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/en/cv/recruiter`)).text(), x = PROF_EN_PLUS.rekruter;
    assert.ok(h.includes(`<title>${x.seoTitle}`)); assert.ok(h.includes(`<p class="lead">${x.lead}</p>`));
    assert.match(h, /<link rel="canonical" href="https:\/\/example\.test\/en\/cv\/recruiter">/);
    for (const [l, u] of [['pl', 'cv/rekruter'], ['en', 'en/cv/recruiter'], ['uk', 'uk/rezyume/rekruter'], ['de', 'de/lebenslauf/recruiter'], ['x-default', 'cv/rekruter']]) assert.ok(h.includes(`hreflang="${l}" href="https://example.test/${u}"`), l);
    assert.match(h, /<h2>Recruiter jobs in the UK and Ireland: what to check<\/h2>/); assert.match(h, /<h2>CV lines you can adapt: Recruiter<\/h2>/);
    assert.ok(h.includes('href="https://www.rec.uk.com/"'), 'źródła na stronie');
    const p = await (await fetch(`${U}/en/cv/packer`)).text();
    assert.doesNotMatch(p, /in the UK and Ireland: what to check/); assert.match(p, /<link rel="canonical" href="https:\/\/example\.test\/en\/cv\/packer">/);
  } finally { srv.close(); }
});
