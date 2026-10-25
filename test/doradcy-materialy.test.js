import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-doradcy-'));
const express = (await import('express')).default;
const b2b = await import('../lib/b2b.js');
const BASE = 'https://example.test';
const PROMISE = /gwarant|najlepsz|na pewno|zatrudni|\d+\s?%/i;

test('Materiały dla klienta doradcy: wiadomość z utm_source=doradca, wersja do druku bez utm, bez obietnic', () => {
  const m = b2b.advisorClientText(BASE);
  assert.ok(m.text.includes(`${BASE}/narzedzia/skaner-cv?utm_source=doradca&utm_medium=wiadomosc`));
  assert.ok(m.text.includes(`${BASE}/uk/`) && m.text.includes('utm_source=doradca'));
  for (const u of m.text.match(/https:\/\/\S+/g)) assert.match(u, /utm_source=doradca/, u);
  const p = b2b.advisorClientText(BASE, true);
  assert.ok(p.text.includes('example.test/narzedzia/skaner-cv\n') && !p.text.includes('utm_'), 'druk: krótkie adresy');
  assert.doesNotMatch(m.subject + m.text, PROMISE);
});

test('/dla-doradcow: sekcja „Materiały do przekazania klientowi”, PDF wiadomości (A4) i ulotka A5, każda na 1 stronie', async () => {
  const app = express(); b2b.b2bRoutes(app, { BASE_URL: BASE, demo: true });
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/dla-doradcow`)).text();
    assert.match(h, /<h2>Materiały do przekazania klientowi<\/h2>/);
    assert.ok(h.includes('href="/dla-doradcow/wiadomosc-do-klienta.pdf"') && h.includes('href="/dla-doradcow/ulotka-a5.pdf"'));
    assert.ok(h.includes('skaner-cv?utm_source=doradca&amp;utm_medium=wiadomosc'), 'tekst do skopiowania z UTM');
    for (const [p, size] of [['/dla-doradcow/wiadomosc-do-klienta.pdf', /595\.\d+ 841\.\d+/], ['/dla-doradcow/ulotka-a5.pdf', /419\.\d+ 595\.\d+/]]) {
      const r = await fetch(U + p), t = Buffer.from(await r.arrayBuffer()).toString('latin1');
      assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /pdf/); assert.ok(t.startsWith('%PDF'));
      assert.equal((t.match(/\/Type \/Page\b/g) || []).length, 1, `${p}: jedna strona`); assert.match(t, new RegExp(`/MediaBox \\[0 0 ${size.source}\\]`), p);
    }
  } finally { srv.close(); }
});
