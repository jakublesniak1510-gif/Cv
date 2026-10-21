// Liczba słów w treści strony zawodu własnej dla tego zawodu (bez wspólnych nagłówków, linków i bloków): node scripts/prof-words.mjs [próg]
const { PROFESSIONS } = await import(new URL('../lib/content.js', import.meta.url));
export const w = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
export const profWords = (p) => [p.intro, ...p.keywords, ...p.tips, p.sample.summary, ...p.sample.jobs.flatMap((j) => j.bullets), ...p.faq.flatMap((f) => [f.q, f.a]),
  ...(p.extra ? [p.extra.rekruter, ...p.extra.wymagania.flat(), ...p.extra.zdania, ...p.extra.bledy] : [])].reduce((n, s) => n + w(s), 0);
if (import.meta.url === `file://${process.argv[1]}`) {
  const min = +process.argv[2] || 600;
  const rows = PROFESSIONS.map((p) => [p.slug, profWords(p), !!p.extra]).sort((a, b) => a[1] - b[1]);
  console.log(rows.filter((r) => r[2]).map((r) => r.join(' ')).join('\n'));
  console.log(`rozbudowane: ${rows.filter((r) => r[2]).length}, poniżej ${min}: ${rows.filter((r) => r[2] && r[1] < min).map((r) => r[0]).join(', ') || 'brak'}`);
}
