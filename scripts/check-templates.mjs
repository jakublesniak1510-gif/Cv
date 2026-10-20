// Sprawdza treści wzorów w lib/templates-content/*.js: kształt, długość (≥ 600 słów na stronę), FAQ, dane przykładowe,
// zakazane obietnice i powtórzenia zdań między plikami. Użycie: node scripts/check-templates.mjs [slug…]
import fs from 'node:fs';
const DIR = new URL('../lib/templates-content/', import.meta.url);
const only = process.argv.slice(2);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== 'index.js' && (!only.length || only.includes(f.replace(/\.js$/, ''))));
const words = (s) => String(s || '').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
const flat = (x) => (typeof x === 'string' ? [x] : Array.isArray(x) ? x.flatMap(flat) : x && typeof x === 'object' ? Object.values(x).flatMap(flat) : []);
const BAD = /gwarant|zagwarant|\d+\s?%|na pewno dostaniesz|zwiększy (twoje )?szanse o|\*\*|^#/im;
const sentences = new Map();
let errors = 0;
const err = (f, m) => { errors++; console.log(`✗ ${f}: ${m}`); };
for (const f of files) {
  const t = (await import(new URL(f, DIR))).default, slug = f.replace(/\.js$/, '');
  if (t.slug !== slug) err(f, `slug ${t.slug} ≠ nazwa pliku`);
  for (const k of ['name', 'nameIn']) if (!t[k]) err(f, `brak ${k}`);
  for (const kind of ['cv', 'letter']) {
    const x = t[kind]; if (!x) { err(f, `brak ${kind}`); continue; }
    for (const k of ['title', 'seoTitle', 'metaDescription', 'intro']) if (!x[k]) err(f, `${kind}.${k} brak`);
    if (x.seoTitle?.length > 65) err(f, `${kind}.seoTitle ${x.seoTitle.length} znaków`);
    if (x.metaDescription && (x.metaDescription.length < 110 || x.metaDescription.length > 160)) err(f, `${kind}.metaDescription ${x.metaDescription.length} znaków`);
    if (!(x.sections?.length >= 4) || x.sections.some((s) => !s.h || !s.p?.length)) err(f, `${kind}.sections: min. 4 z h i p`);
    const body = [x.intro, ...(x.sections || []).flatMap((s) => [s.h, ...(s.p || []), ...(s.list || [])]), ...flat(x.keywords || []), ...flat(x.phrases || {}), ...flat(x.avoid || [])];
    const n = words(body.join(' '));
    if (n < 600) err(f, `${kind}: ${n} słów (min. 600)`);
    if (!(x.faq?.length >= 4) || x.faq.some((q) => !q.q?.endsWith('?') || words(q.a) < 15)) err(f, `${kind}.faq: min. 4 pytania z odpowiedziami`);
    for (const s of [...body, ...flat(x.faq || [])]) if (BAD.test(s)) err(f, `${kind}: zakazane sformułowanie: „${s.slice(0, 80)}”`);
    for (const s of body.join(' ').split(/(?<=[.!?])\s+/).map((z) => z.trim().toLowerCase()).filter((z) => words(z) >= 8)) {
      const prev = sentences.get(s); if (prev && prev !== slug) err(f, `zdanie powtórzone z ${prev}: „${s.slice(0, 70)}”`); else sentences.set(s, slug);
    }
    console.log(`  ${slug} ${kind}: ${n} słów, FAQ ${x.faq?.length || 0}`);
  }
  const s = t.cv?.sample;
  if (!s?.name || !s.headline || !(s.contact?.length >= 2) || !s.summary || !(s.experience?.length >= 2) || !s.education?.length || !(s.skills?.length >= 5)) err(f, 'cv.sample niepełny');
  if (s && !flat(s.contact).every((c) => !/@/.test(c) || /@example\.com$/.test(c))) err(f, 'cv.sample: e-mail musi być @example.com');
  const l = t.letter?.sample;
  if (!l?.text || words(l.text) < 180 || words(l.text) > 340) err(f, `letter.sample.text: ${words(l?.text)} słów (180–340)`);
  if (t.letter?.phrases && !(t.letter.phrases.opening?.length >= 3 && t.letter.phrases.body?.length >= 5 && t.letter.phrases.closing?.length >= 3)) err(f, 'letter.phrases niepełne');
  if (!(t.cv?.keywords?.length >= 10)) err(f, 'cv.keywords < 10');
}
console.log(errors ? `\nBłędy: ${errors}` : `\nOK: ${files.length} plików`);
process.exit(errors ? 1 : 0);
