import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';

const read = (f) => fs.readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const dict = (l) => JSON.parse(read(`i18n/${l}.json`));
const LANGS = ['en', 'uk', 'de'];

test('Liczba zawodów w tekstach strony zgadza się z liczbą podstron we wszystkich językach', () => {
  const n = PROFESSIONS.length;
  for (const l of LANGS) assert.equal(Object.keys(PROF_LANGS[l].prof).length, n, `podstrony zawodów: ${l}`);
  const html = read('index.html'), counts = [...html.matchAll(/dla (\d+) zawodów/g)].map((m) => +m[1]);
  assert.ok(counts.length >= 2, 'teksty z liczbą zawodów w index.html');
  assert.deepEqual([...new Set(counts)], [n]);
  for (const l of LANGS) {
    const d = dict(l), keys = Object.keys(d).filter((k) => /dla \d+ zawodów/.test(k));
    assert.equal(keys.length, counts.length, `tłumaczenia: ${l}`);
    for (const k of keys) {
      assert.ok(html.includes(k), `klucz ${l} pasuje do strony: ${k}`);
      assert.match(d[k], new RegExp(`\\b${n}\\b`), `liczba w tłumaczeniu ${l}: ${d[k]}`);
    }
  }
});

test('Przycisk zgody na cookies ma własny klucz tłumaczenia, niezależny od zdania o regulaminie', () => {
  const key = /data-i18n-key="([^"]+)">Akceptuję<\/button>/.exec(read('consent.js'))?.[1];
  assert.ok(key, 'przycisk w consent.js ma data-i18n-key');
  const want = { en: 'Accept', uk: 'Прийняти', de: 'Akzeptieren' };
  for (const l of LANGS) {
    const d = dict(l);
    assert.equal(d[key], want[l]);
    assert.ok(d['Akceptuję'], `zdanie o regulaminie dalej przetłumaczone: ${l}`);
  }
  assert.match(read('i18n.js'), /dataset\.i18nKey/);
});

test('Podstrona „Jak to działa”: tytuł do 60 znaków (też w tłumaczeniach), opis bez „prawdziwego” przykładu', () => {
  const html = read('index.html'), m = /<template id="pg-jak-to-dziala" data-title="([^"]+)" data-desc="([^"]+)">([\s\S]*?)<\/template>/.exec(html);
  assert.ok(m, 'szablon podstrony');
  const [, title, desc, body] = m;
  assert.ok(title.length <= 60, `tytuł: ${title.length} znaków`);
  assert.ok(desc.length <= 160, `opis: ${desc.length} znaków`);
  assert.doesNotMatch(desc + body, /prawdziw/i);
  assert.match(body, /Przykład: Anna/);
  for (const l of LANGS) { const t = dict(l)[title]; assert.ok(t && t.length <= 60, `tytuł ${l}: ${t}`); }
});
