import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { scanFallback } from '../lib/tailor.js';

// Wynik skanera bez AI w EN/DE/UK: nagłówek „Spełniasz X z Y wymagań”, podpowiedzi przy brakach i wskazówki są w słownikach
// (wzorce {0} jak w public/i18n.js), więc na stronach EN/DE/UK nie zostają po polsku.
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
// Ta sama zamiana wzorców co w public/i18n.js (load + tr).
function translator(d) {
  const norm = (s) => s.replace(/\s+/g, ' ').trim(), dict = new Map(Object.entries(d).filter(([k]) => !k.includes('{0}')));
  const pats = Object.entries(d).filter(([k]) => k.includes('{0}')).map(([k, v]) => [new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\d)\}/g, '(.+?)') + '$'), v]);
  return (raw) => { const s = norm(raw); if (dict.has(s)) return dict.get(s); for (const [re, v] of pats) { const m = re.exec(s); if (m) return v.replace(/\{(\d)\}/g, (_, i) => dict.get(m[+i + 1]) ?? m[+i + 1]); } return null; };
}

test('Skaner bez AI: nagłówek, podpowiedzi przy brakach i wskazówki przetłumaczone w EN/DE/UK', () => {
  const r = scanFallback({ cvText: 'Magazynier: obsługa wózka widłowego, inwentaryzacja, praca w zespole.', adText: 'Magazynier. Wymagania: obsługa wózka widłowego, uprawnienia UDT, znajomość SAP, gotowość do pracy zmianowej, certyfikat BHP.' });
  assert.ok(r.missing.length >= 2);
  const tips = (read('lib/generate.js').match(/tips: \[([^\]]+)\]/)[1].match(/'[^']+'/g) || []).map((x) => x.slice(1, -1));
  assert.equal(tips.length, 3);
  const app = read('public/app.js');
  assert.match(app, /textContent: `Spełniasz \$\{j\.found\.length\} z \$\{total\} wymagań\$\{j\.position \? ': ' \+ j\.position : ''\}`/);
  for (const [l, head, hint] of [['en', 'You meet 2 of 6 requirements', 'If you have experience or qualifications in “uprawnienia UDT”'], ['de', 'Sie erfüllen 2 von 6 Anforderungen', 'im Bereich „uprawnienia UDT“'], ['uk', 'Ви відповідаєте 2 з 6 вимог', 'у сфері «uprawnienia UDT»']]) {
    const t = translator(JSON.parse(read(`public/i18n/${l}.json`)));
    assert.equal(t('Spełniasz 2 z 6 wymagań'), head, l); assert.equal(t('Spełniasz 2 z 6 wymagań: Magazynier'), `${head}: Magazynier`, l);
    const m = r.missing.find((x) => x.keyword === 'uprawnienia UDT'); assert.ok(m, 'brak UDT');
    assert.ok(t(m.hint)?.includes(hint), `${l}: ${t(m.hint)}`);
    for (const x of r.missing) assert.ok(t(x.hint), `${l}: ${x.hint}`);
    for (const x of tips) assert.ok(t(x), `${l}: ${x}`);
    assert.ok(t('twoj@email.pl'), `${l}: placeholder`);
  }
});
