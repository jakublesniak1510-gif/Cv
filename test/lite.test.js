import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('Lekkie podstrony: kod polecający pod tym samym kluczem co app.js, odsłony liczone zawsze, CTA w treści prowadzi do kreatora', () => {
  const lite = read('../public/lite.js'), app = read('../public/app.js');
  const key = /const REF_KEY = '([^']+)'/.exec(app)?.[1];
  assert.ok(key && lite.includes(`REF_KEY = '${key}'`), 'ten sam klucz ?ref');
  assert.match(lite, /localStorage\.setItem\(REF_KEY/);
  assert.match(lite, /ref: ref\(\)/, '?ref doklejany do /?zamow=1');
  assert.doesNotMatch(lite, /c\.preview/, 'bez flagi trybu podglądu z /api/config');
  assert.match(lite, /document\.documentElement\.lang \|\| window\.I18N/, 'język z serwera przed I18N');
  for (const f of ['../lib/seo.js', '../lib/templates.js']) assert.doesNotMatch(read(f).replace(/url: `\$\{base\}\/#cennik`/g, ''), /href="[^"]*#cennik"/, `${f}: CTA bez #cennik`);
});
