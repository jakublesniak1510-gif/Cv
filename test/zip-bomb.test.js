import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { Document, Packer, Paragraph } from 'docx';
import { extractText, zipCheck, ImportError } from '../lib/importCv.js';

// „Zip bomb” w DOCX: mały plik, który po rozpakowaniu ma setki MB. Mammoth rozpakowuje w całości do pamięci,
// więc extractText musi go odrzucić wcześniej (centralny katalog ZIP + próbne rozpakowanie z limitem).
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function deflateSpaces(mb) {
  const d = zlib.createDeflateRaw({ level: 9 }), out = [], block = Buffer.alloc(1 << 20, 32);
  d.on('data', (c) => out.push(c));
  for (let i = 0; i < mb; i++) if (!d.write(block)) await once(d, 'drain');
  d.end(); await once(d, 'end');
  return Buffer.concat(out);
}

// Minimalny ZIP: wpisy { name, data (skompresowane), usize (deklarowany rozmiar po rozpakowaniu) }.
function zip(entries) {
  const locals = [], central = [];
  let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name), lh = Buffer.alloc(30), ch = Buffer.alloc(46);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(e.data.length, 18); lh.writeUInt32LE(e.usize, 22); lh.writeUInt16LE(name.length, 26);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(e.data.length, 20); ch.writeUInt32LE(e.usize, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, name, e.data); central.push(ch, name);
    off += 30 + name.length + e.data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, end]);
}

const MB = 200, bombData = await deflateSpaces(MB);
const honest = zip([{ name: 'word/document.xml', data: bombData, usize: MB << 20 }]);
const lying = zip([{ name: 'word/document.xml', data: bombData, usize: 1000 }]);

test('Bomba w DOCX odrzucona szybko i bez wzrostu pamięci – także gdy katalog ZIP zaniża rozmiary', async () => {
  assert.ok(honest.length < 400e3, `bomba ma ${honest.length} B`);
  for (const [label, buf] of [['deklarowane 200 MB', honest], ['deklarowane 1000 B', lying]]) {
    const rss = process.memoryUsage().rss, t = Date.now();
    await assert.rejects(extractText(buf), (e) => e instanceof ImportError && e.message === 'Plik Word jest uszkodzony albo za duży.', label);
    assert.ok(Date.now() - t < 1000, `${label}: ${Date.now() - t} ms`);
    assert.ok(process.memoryUsage().rss - rss < 60e6, `${label}: pamięć +${Math.round((process.memoryUsage().rss - rss) / 1e6)} MB`);
  }
  assert.throws(() => zipCheck(Buffer.from('PK\x03\x04 bez katalogu')), ImportError, 'uszkodzony ZIP');
});

test('Zwykły DOCX nadal się wczytuje', async () => {
  const doc = new Document({ sections: [{ children: ['Jan Kowalski', 'Magazynier z doświadczeniem w obsłudze wózka widłowego i inwentaryzacji.', 'Doświadczenie: 2020–2024, magazyn centralny.'].map((t) => new Paragraph(t)) }] });
  const text = await extractText(await Packer.toBuffer(doc));
  assert.match(text, /Magazynier z doświadczeniem w obsłudze wózka widłowego/);
});

test('API: /api/import i /api/scan zwracają 422 na bombę, serwer działa dalej', async () => {
  const port = 4700 + Math.floor(Math.random() * 300), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-zip-'));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: `http://localhost:${port}`, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '' };
  const srv = spawn(process.execPath, ['--max-old-space-size=256', 'server.js'], { env, stdio: 'ignore' });
  try {
    const U = `http://localhost:${port}`;
    for (let i = 0; i < 60; i++) { try { await fetch(U + '/api/config'); break; } catch { await wait(150); } }
    const post = (p, body) => fetch(U + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = lying.toString('base64'), ad = 'Szukamy magazyniera. Wymagania: obsługa wózka widłowego, doświadczenie w magazynie, sumienność. '.repeat(2);
    for (const [p, body] of [['/api/import', { data }], ['/api/scan', { data, adText: ad }]]) {
      const t = Date.now(), r = await post(p, body);
      assert.equal(r.status, 422, p); assert.equal((await r.json()).error, 'Plik Word jest uszkodzony albo za duży.');
      assert.ok(Date.now() - t < 1500, `${p}: ${Date.now() - t} ms`);
    }
    assert.equal((await fetch(U + '/api/config')).status, 200, 'serwer żyje');
  } finally { srv.kill(); }
});
