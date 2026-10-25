import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-uni-'));
const express = (await import('express')).default;
const b2b = await import('../lib/b2b.js');
const { seoRoutes } = await import('../lib/seo.js');
const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// PR Y: /dla-uczelni – ten sam przepływ co doradcy (kod po zatwierdzeniu), typ „uczelnia”; skaner z ?partner=<KOD>.
test('Strona /dla-uczelni: formularz doradcy z typem „uczelnia” i rolą „Biuro karier”; sitemap; link z /dla-doradcow', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: 'https://example.test', demo: true }); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/dla-uczelni`)).text();
    assert.match(h, /<h1>CV pod ogłoszenie dla studentów i absolwentów<\/h1>/); assert.match(h, /id="advisorForm"/);
    assert.match(h, /<input type="hidden" name="type" value="uczelnia">/); assert.match(h, /<option selected>Biuro karier<\/option>/);
    assert.match(h, /href="\/oferta-dla-instytucji\.pdf"/); assert.doesNotMatch(h, /<img/, 'bez logotypów');
    const d = await (await fetch(`${U}/dla-doradcow`)).text();
    assert.ok(!d.includes('name="type" value="uczelnia"'), 'u doradców bez typu'); assert.match(d, /href="\/dla-uczelni"/);
    assert.ok((await (await fetch(`${U}/sitemap.xml`)).text()).includes('https://example.test/dla-uczelni<'));
  } finally { srv.close(); }
});

test('Zgłoszenie z typem → zatwierdzenie → /api/partner/:kod (nazwa, uni); nieznany, niezatwierdzony i partner-twórca: 404', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: 'https://example.test', demo: true });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const a = await b2b.createAdvisorApp({ name: 'Anna Biuro', email: 'biuro@uczelnia.test', org: 'Politechnika Testowa', role: 'Biuro karier', type: 'uczelnia', terms: true });
    assert.equal(a.type, 'uczelnia'); assert.equal((await b2b.createAdvisorApp({ name: 'Jan Doradca', email: 'j@x.test', org: 'Szkoła', type: 'cokolwiek', terms: true })).type, undefined);
    const ok = await b2b.approvePartner(a.id, { base: 'https://example.test' });
    const r = await (await fetch(`${U}/api/partner/${ok.code}`)).json();
    assert.deepEqual(r, { code: ok.code, org: 'Politechnika Testowa', uni: true });
    assert.equal((await fetch(`${U}/api/partner/NIEMA-123`)).status, 404);
    const p = await b2b.createPartnerApp({ name: 'Ola Twórca', email: 'ola@example.test', channel: 'https://ig.test/ola', terms: true });
    const pc = (await b2b.approvePartner(p.id, { base: 'https://example.test' })).code;
    assert.equal((await fetch(`${U}/api/partner/${pc}`)).status, 404, 'kod twórcy nie pokazuje nazwy');
  } finally { srv.close(); }
  const app2 = read('public/app.js');
  assert.match(app2, /\[partnerHead\(\), scanCtxHint\(C\)\]/); assert.match(app2, /localStorage\.setItem\(REF_KEY, j\.code\)/);
  assert.match(read('lib/b2b.js'), /skaner-cv\?partner=\$\{encodeURIComponent\(c\.id\)\}/); assert.match(read('public/admin.js'), /'uczelnia, kod 0 zł'/);
});
