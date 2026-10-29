import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { withBirth } from '../lib/generate.js';

// Przebudowa kreatora po „Zamów CV” (29.10): większe okno (telefon: pełny ekran), pozostałe dane widoczne od razu,
// opcjonalna data urodzenia (tylko gdy wpisana, bez wysyłania do AI), „Nie mam ogłoszenia” na dole kroku 1,
// krok 3 w kolejności wygląd → podgląd → dopasowanie → dodatki → płatność → kod → jeden blok zgód, faktury i powiadomień.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const html = read('public/index.html'), app = read('public/app.js'), css = read('public/style.css'), gen = read('lib/generate.js'), srv = read('server.js');
const sec = (n) => [...html.matchAll(/<section data-step="(\d)"[\s\S]*?<\/section>/g)].find((m) => m[1] === String(n))[0];

test('Data urodzenia: pole opcjonalne z podpowiedzią, domyślnie puste; w CV tylko gdy wpisana; nie idzie do AI', () => {
  assert.match(sec(2), /<label class="f">Data urodzenia <span class="h">podaj tylko, jeśli pracodawca tego wymaga<\/span><input type="text" id="birth" maxlength="20" placeholder="np\. 14\.05\.1990"><\/label>/);
  assert.doesNotMatch(sec(2), /id="birth"[^>]*value=/);
  const r = (lang, contact = ['+48 600 100 200', 'anna@example.com']) => ({ lang, cv: { contact: [...contact] } });
  assert.deepEqual(withBirth(r('pl'), {}).cv.contact, ['+48 600 100 200', 'anna@example.com'], 'bez daty – bez zmian');
  assert.deepEqual(withBirth(r('pl'), { birth: '14.05.1990' }).cv.contact.at(-1), 'Data urodzenia: 14.05.1990');
  assert.equal(withBirth(r('de'), { birth: '14.05.1990' }).cv.contact.at(-1), 'Geburtsdatum: 14.05.1990');
  assert.deepEqual(withBirth(r('en', ['a@b.pl', 'Date of birth: 1.1.1990']), {}).cv.contact, ['a@b.pl'], 'usunięta, gdy klient ją skasował');
  assert.match(gen, /const forAi = \(profile\) => \{ const \{ photo, birth, \.\.\.rest \} = profile; return rest; \};/, 'data urodzenia nie trafia do AI');
  assert.match(gen, /return withScore\(withBirth\(out, profile\)\);/); assert.match(gen, /withScore\(withBirth\(tailor\(/);
  assert.match(srv, /\.\.\.\(str\(p\.birth, 20\) \? \{ birth: str\(p\.birth, 20\) \} : \{\}\),/);
  for (const k of ['FIELDS = \\[[^\\]]*\'birth\'', 'pvProfile = \\(\\) => \\(\\{ \\.\\.\\.Object\\.fromEntries\\(\\[[^\\]]*\'birth\'']) assert.match(app, new RegExp(k));
  for (const f of ['public/app.js', 'lib/pdf.js']) { const s = read(f); assert.match(s, /BIRTH_RE\.test\(x\) \? 'birth'/, f); assert.match(s, /birth: 'Geburtsdatum'/, f); }
});

test('Krok 2: pozostałe dane widoczne od razu, oznaczone jako opcjonalne (bez „rozwiń”)', () => {
  const s2 = sec(2);
  assert.match(s2, /<div class="optbox more-data" id="moreData"><h3 class="sh">Pozostałe dane <span class="h">\(opcjonalnie\)<\/span><\/h3>/);
  assert.doesNotMatch(s2, /<details/); assert.doesNotMatch(app, /\$\('#moreData'\)\.open/);
});

test('Krok 1: „Nie mam ogłoszenia – wpisz stanowisko” z podpowiedziami na samym dole, pod przykładem CV; zakładka w ogłoszeniu ukryta', () => {
  assert.match(app, /\$\('#profEx'\)\.after\(el\('div', \{ className: 'noad-box', id: 'noAdBox' \}/);
  assert.match(app, /placeholder: 'np\. magazynier, kasjerka', onfocus: profList/); assert.match(app, /\$\('#noAdQ'\)\.setAttribute\('list', 'profList'\);/);
  assert.match(css, /#ads \.modes \[data-mode=prof\]\{display:none\}/);
});

test('Krok 3: kolejność, kod rabatowy pod płatnością, jeden nierozwijany blok zgód (osobne, odznaczone), bez górnej ramki; kwota tylko nad przyciskiem', () => {
  const s6 = sec(6), at = (id) => s6.indexOf(`id="${id}"`);
  const order = ['wizDesign', 'pvBox', 'wizMatch', 'moreOpts', 'sum', 'gwBox', 'payTrustList', 'codeBox', 'consentBox', 'consent', 'waiver', 'wantInv', 'invBox', 'optMail'];
  order.slice(1).forEach((id, i) => assert.ok(at(order[i]) > -1 && at(order[i]) < at(id), `${order[i]} przed ${id}`));
  assert.doesNotMatch(s6, /id="sumTop"|<details class="optbox" id="optMail"/);
  assert.doesNotMatch(s6, /<input type="checkbox" id="(consent|waiver|reviewAsk|reminder|wantAlerts)" checked/, 'zgody i powiadomienia odznaczone');
  assert.match(s6, /<div class="invbox" id="invBox" hidden>/, 'dane do faktury dopiero po zaznaczeniu');
  assert.doesNotMatch(app, /className: 'sumrow' \}, el\('span', \{ textContent: 'Razem' \}\)/, 'bez drugiego „Razem” w liście');
  assert.match(app, /step === 6 \? 'jednorazowo, bez abonamentu' : ''/);
  assert.match(html, /<div class="tot">Razem <strong id="total">/); assert.doesNotMatch(html, /<s>|line-through/);
});

test('Okno: większe na komputerze, pełny ekran na telefonie, większe pola', () => {
  assert.match(css, /\.wiz-box\{width:min\(940px,100%\);height:min\(94vh,1100px\);font-size:17px\}/);
  assert.match(css, /@media\(max-width:640px\)\{\.wiz-box\{width:100%;height:100%;max-height:none;border-radius:0\}\}/);
  assert.match(css, /\.wiz-body \.f input,\.wiz-body \.f textarea,\.wiz-body \.f select\{font-size:17px;padding:13px 14px;min-height:50px\}/);
  assert.ok(Buffer.byteLength(html) <= 90e3, `index.html: ${Buffer.byteLength(html)} B`);
});
