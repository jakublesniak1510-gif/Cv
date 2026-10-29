import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// 10 nowych zawodów (29.10, zapytania GSC) tylko po polsku: strona PL z przykładem, podglądem i FAQ; bez hreflang do innych
// języków, poza mapą strony EN/UK/DE; strony w innych językach z tej samej kategorii działają (bez linków do braków).
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-plonly-'));
const express = (await import('express')).default;
const { seoRoutes } = await import('../lib/seo.js');
const { PROFESSIONS } = await import('../lib/content.js');
const { PROF_LANGS } = await import('../lib/professions-i18n.js');
const NEW = ['pracownik-sortowni', 'operator-maszyn', 'pracownik-gospodarczy', 'konduktor', 'instruktor-nauki-jazdy', 'ankieter', 'sprzedawca-w-sklepie-odziezowym', 'pracownik-myjni', 'portier', 'sprzedawca-internetowy'];

test('Nowe zawody tylko po polsku: treść, strona PL, bez hreflang i stron w innych językach; inne języki bez linków do braków', async () => {
  assert.equal(PROFESSIONS.length, 160);
  for (const s of NEW) {
    const p = PROFESSIONS.find((x) => x.slug === s); assert.ok(p, s);
    assert.match(p.title, /^CV .+: wzór i wskazówki$/); assert.ok(p.keywords.length === 10 && p.tips.length === 4 && p.faq.length >= 2 && p.sample.jobs.length === 2, s);
    assert.doesNotMatch(JSON.stringify(p), /\d+\s?%|\d[\d\s]*zł|gwarant|najlepsz|!/i, s);
    for (const l of ['en', 'uk', 'de']) assert.equal(PROF_LANGS[l].prof[s], undefined, `${s}: bez ${l}`);
  }
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const s of NEW) {
      const r = await fetch(`${U}/cv/${s}`), h = await r.text();
      assert.equal(r.status, 200, s); assert.ok(h.includes(`<img src="/podglad/cv-${s}.webp"`), `${s}: podgląd`); assert.match(h, /"@type":"FAQPage"/);
      assert.ok(h.includes(`hreflang="pl" href="https://example.test/cv/${s}"`) && !/<link rel="alternate" hreflang="(en|uk|de)"/.test(h), `${s}: tylko hreflang pl`);
    }
    const sm = await (await fetch(`${U}/sitemap.xml`)).text();
    for (const s of NEW) assert.ok(sm.includes(`/cv/${s}<`), `${s} w mapie strony`);
    assert.doesNotMatch(sm, /\/undefined/);
    // strony EN/UK/DE w kategoriach nowych zawodów działają i nie linkują do zawodów bez tłumaczenia
    for (const l of ['en', 'uk', 'de']) for (const slug of ['kurier', 'sprzedawca', 'fryzjer', 'nauczyciel']) {
      const r = await fetch(`${U}/${l}/${PROF_LANGS[l].seg}/${PROF_LANGS[l].prof[slug].slugLang}`), h = await r.text();
      assert.equal(r.status, 200, `${l}/${slug}`); assert.doesNotMatch(h, /undefined/, `${l}/${slug}`);
    }
  } finally { srv.close(); }
});
