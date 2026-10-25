import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// PR T2: tryb „Mam już CV” w regulaminie (§2 ust. 4, 4 języki, historia) i w FAQ strony głównej (z FAQPage).
test('Regulamin §2 ust. 4 i historia zmian w 4 językach', () => {
  const r = read('public/legal/regulamin.html');
  for (const re of [/W trybie „Mam już CV” Klient wgrywa własne CV, a Usługodawca przeredagowuje je pod ogłoszenie, zachowując jego treść, kolejność pozycji i daty; nie dopisuje nowych informacji/,
    /Im Modus „Ich habe schon einen Lebenslauf“ lädt der Kunde seinen eigenen Lebenslauf hoch/, /In “I already have a CV” mode the Client uploads their own CV/, /У режимі «У мене вже є резюме» Клієнт завантажує власне резюме/,
    /Historia zmian: 25 października 2026 r\. – tryb „Mam już CV” \(§2 ust\. 4\)/, /Änderungshistorie: 25\. Oktober 2026 – Modus „Ich habe schon einen Lebenslauf“ \(§2 Abs\. 4\)/,
    /Change history: 25 October 2026 – “I already have a CV” mode \(§2\(4\)\)/, /Історія змін: 25 жовтня 2026 р\. – режим «У мене вже є резюме» \(§2 п\. 4\)/]) assert.match(r, re);
});

test('FAQ strony głównej: pytanie o tryb w HTML i FAQPage, tłumaczenia EN/DE/UK', async () => {
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    const h = await (await fetch(`${U}/`)).text(), Q = 'Mam już CV. Czy możecie je tylko poprawić pod ogłoszenie?';
    assert.ok(h.includes(`<summary>${Q}</summary>`));
    const ld = [...h.matchAll(/<script[^>]*type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'FAQPage');
    assert.ok(ld.mainEntity.some((x) => x.name === Q), 'w FAQPage');
    const A = new RegExp(`<summary>${Q.replace(/[.?]/g, '\\$&')}</summary><p>([^<]+)</p>`).exec(h)[1];
    for (const l of ['en', 'de', 'uk']) { const d = JSON.parse(read(`public/i18n/${l}.json`)); assert.ok(d[Q] && d[A], l); }
  } finally { srv.close(); }
});
