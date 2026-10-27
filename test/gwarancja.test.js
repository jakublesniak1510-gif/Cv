import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// C5 (26.10): gwarancja dopasowania – §7a regulaminu (4 języki), zdanie z linkiem na stronie i w mailu, zwrot z powodem „gwarancja” w panelu.
const { legalBody } = await import('../lib/legal.js');
const { guarantee } = await import('../lib/mail.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const app = read('public/app.js'), html = read('public/index.html'), adm = read('public/admin.js');
const dict = (l) => JSON.parse(read(`public/i18n/${l}.json`));
const G = 'Nie pasuje po poprawkach? Zwracamy pieniądze.';

test('Regulamin §7a „Gwarancja dopasowania” (4 języki), data 26.10.2026 w historii; §6 i reklamacje bez zmian', () => {
  const pl = legalBody('regulamin', 'pl');
  assert.ok(pl.includes('<h2 id="gwarancja">§7a Gwarancja dopasowania</h2>'));
  assert.ok(pl.includes('Gwarancja dopasowania: jeśli po wykorzystaniu poprawek w cenie CV nadal nie odpowiada ogłoszeniu, które podałeś, zwracamy pełną zapłaconą kwotę. Wystarczy napisać na') && pl.includes('w ciągu 14 dni od dostarczenia dokumentów i podać numer zamówienia. Zwrot wykonujemy tą samą metodą płatności w ciągu 14 dni od zgłoszenia. Gwarancja nie ogranicza uprawnień wynikających z przepisów.'));
  assert.match(pl, /Regulamin obowiązuje od 2[67] października 2026 r\. Historia zmian: (?:[^;]*; )*26 października 2026 r\. – gwarancja dopasowania \(§7a\);/);
  assert.match(pl, /art\. 38 pkt 13 ustawy o prawach konsumenta/, '§6 bez zmian');
  for (const [l, h, hist] of [['de', '§7a Passgenauigkeitsgarantie', /gelten ab dem 2[67]\. Oktober 2026\. Änderungshistorie: (?:[^;]*; )*26\. Oktober 2026 – Passgenauigkeitsgarantie \(§7a\)/], ['en', '§7a Match guarantee', /effective from 2[67] October 2026\. Change history: (?:[^;]*; )*26 October 2026 – match guarantee \(§7a\)/], ['uk', '§7a Гарантія відповідності', /діють з 2[67] жовтня 2026 р\. Історія змін: (?:[^;]*; )*26 жовтня 2026 р\. – гарантія відповідності \(§7a\)/]]) {
    const b = legalBody('regulamin', l); assert.ok(b.includes(`<h2 id="gwarancja">${h}</h2>`), l); assert.match(b, hist, l);
  }
  assert.doesNotMatch(pl, /gwarantujemy (zatrudnienie|pracę)/i, 'bez obietnic zatrudnienia');
});

test('Strona: zdanie z linkiem do §7a w hero, FAQ, kroku 1 (pasek zaufania) i nad płatnością („Dostajesz”); i18n', () => {
  const link = `<a href="/regulamin#gwarancja">${G}</a>`;
  const hero = html.slice(html.indexOf('<section class="hero"'), html.indexOf('</section>', html.indexOf('<section class="hero"')));
  assert.ok(hero.includes(`<p class="hero-line">39 zł jednorazowo · bez abonamentu · BLIK w 10 sekund · 5 poprawek w cenie<br>${link}</p>`), 'hero');
  assert.match(html, new RegExp(`<details><summary>Co jeśli CV mi się nie spodoba\\?</summary><p>Masz darmową poprawkę:[^<]+${link.replace(/[?.]/g, (c) => `\\${c}`)}</p></details>`), 'FAQ');
  assert.match(app, /const guarLink = \(\) => el\('a', \{ href: `\$\{legalUrl\('regulamin', window\.I18N\?\.lang \|\| 'pl'\)\}#gwarancja`, textContent: tr\('Nie pasuje po poprawkach\? Zwracamy pieniądze\.'\) \}\);/);
  assert.match(app, /textContent: 'Dane firmy' \}\), guarLink\(\)\]\.filter\(Boolean\);/, 'krok 1: pasek zaufania');
  assert.match(app, /\$\{parts\[3\]\}\. `, guarLink\(\)\);/, '„Dostajesz” nad przyciskiem płatności');
  assert.match(app, /a\[href\^="\/regulamin#"\]:not\(\[data-lang\]\)/, 'link w wersjach EN/UK/DE z kotwicą');
  for (const l of ['en', 'de', 'uk']) for (const k of [G, 'Co jeśli CV mi się nie spodoba?']) assert.ok(dict(l)[k], `${l}: ${k}`);
});

test('Mail z dokumentami: jedno zdanie z linkiem do gwarancji w języku klienta', () => {
  assert.deepEqual(guarantee('pl', 'https://x.test'), { t: 'Nie pasuje po poprawkach? Zwracamy pieniądze – zasady gwarancji:', href: 'https://x.test/regulamin#gwarancja' });
  assert.equal(guarantee('de', 'https://x.test').href, 'https://x.test/de/agb#gwarancja');
  assert.equal(guarantee('en', 'https://x.test').href, 'https://x.test/en/terms#gwarancja');
  assert.equal(guarantee('uk', 'https://x.test').href, 'https://x.test/uk/pravyla#gwarancja');
  const mail = read('lib/mail.js');
  assert.match(mail, /\$\{L\.del\}\\n\$\{gu\.t\} \$\{gu\.href\}/); assert.match(mail, /<br>\$\{esc\(gu\.t\)\} <a href="\$\{esc\(gu\.href\)\}">/);
});

test('Panel: „Zwrot z gwarancji” przy zwrocie (Stripe/P24/ręczny), powód w historii, statystyka 30 dni; szablony odpowiedzi', () => {
  assert.match(adm, /' Zwrot z gwarancji dopasowania \(§7a regulaminu\)'/);
  assert.match(adm, /post\(`\/orders\/\$\{o\.id\}\/refund`, reasonBody\(g, v\)\)/); assert.match(adm, /post\(`\/orders\/\$\{o\.id\}\/refund-manual`, reasonBody\(g, v\)\)/);
  assert.match(adm, /\['Zwroty z gwarancji \(30 dni\)', String\(s\.guaranteeRefunds30 \|\| 0\)\]/);
  const a = read('lib/admin.js');
  assert.equal((a.match(/reason: reasonOf\(req\)/g) || []).length, 3, 'Stripe, Przelewy24, ręczny');
  const d = read('docs/gwarancja-odpowiedzi.md');
  assert.match(d, /## Wersja A – zwrot wykonany/); assert.match(d, /## Wersja B – prośba o doprecyzowanie/);
});
