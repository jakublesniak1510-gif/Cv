import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes } from '../lib/seo.js';
import { ARTICLES } from '../lib/content.js';
import { ARTICLE_FAQ } from '../lib/articles-faq.js';

// FAQ pod poradnikami (część 1): 10 poradników bez FAQ dostaje 3–5 pytań; FAQ widoczne w HTML i tylko wtedy FAQPage w JSON-LD.
const PROMISE = /gwarant|najlepsz|na pewno dostaniesz|zatrudnieni[ae] w|\d+\s?%/i;

test('10 poradników: 3–5 pytań, krótkie odpowiedzi, widoczne w HTML i w FAQPage; poradnik bez FAQ – bez FAQPage', async () => {
  assert.equal(Object.keys(ARTICLE_FAQ).length, 10);
  for (const [slug, faq] of Object.entries(ARTICLE_FAQ)) {
    const a = ARTICLES.find((x) => x.slug === slug); assert.ok(a, slug);
    assert.deepEqual(a.faq, faq, `${slug}: FAQ w danych poradnika`);
    assert.ok(faq.length >= 3 && faq.length <= 5, slug);
    for (const f of faq) { assert.ok(f.q.endsWith('?'), f.q); assert.ok(f.a.length <= 320, `${slug}: odpowiedź za długa`); assert.doesNotMatch(f.q + f.a, PROMISE, f.q); }
  }
  const app = express(); seoRoutes(app, 'https://example.test');
  const srv = app.listen(0), U = `http://127.0.0.1:${srv.address().port}`;
  try {
    for (const slug of Object.keys(ARTICLE_FAQ)) {
      const h = await (await fetch(`${U}/poradnik/${slug}`)).text();
      assert.ok(h.includes(`<summary>${ARTICLE_FAQ[slug][0].q}</summary>`), `${slug}: FAQ widoczne`);
      assert.match(h, /"@type":"FAQPage"/, `${slug}: FAQPage`);
    }
    const bez = ARTICLES.find((a) => !a.faq?.length);
    if (bez) assert.doesNotMatch(await (await fetch(`${U}/poradnik/${bez.slug}`)).text(), /"@type":"FAQPage"/, `${bez.slug}: bez FAQ bez FAQPage`);
  } finally { srv.close(); }
});
