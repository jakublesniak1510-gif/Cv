import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { seoRoutes, sendNotFound } from '../lib/seo.js';
import { PRICES, PACKAGES, ADDONS } from '../lib/pricing.js';
import { LEGAL_PAGES } from '../lib/legal.js';
import { seller } from '../lib/invoice.js';

// /llms.txt, /o-serwisie i dane firmy (JSON-LD Organization) dla wyszukiwarek i asystentów AI.
const base = 'https://example.test', TP = 'https://pl.trustpilot.com/review/cvpodogloszenie.pl';
let srv, port;
before(() => { const app = express(); seoRoutes(app, base); app.use((req, res) => sendNotFound(req, res, base)); srv = app.listen(0); port = srv.address().port; });
after(() => srv.close());
const get = async (p) => { const r = await fetch(`http://127.0.0.1:${port}${p}`); return { status: r.status, type: r.headers.get('content-type'), text: await r.text() }; };
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const lds = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test('/llms.txt: tekst w formacie llms.txt, ceny z pricing.js, linki w 4 językach, kontakt', async () => {
  const { status, type, text } = await get('/llms.txt');
  assert.equal(status, 200);
  assert.match(type, /^text\/plain; charset=utf-8/);
  assert.match(text, /^# CV Pod Ogłoszenie\n\n> .+/);
  assert.ok((text.match(/^## /gm) || []).length >= 5, 'sekcje ##');
  for (const [k, p] of Object.entries(PACKAGES)) assert.ok(text.includes(`- ${p.name}: ${zl(PRICES[k])} `), `cena ${k}`);
  for (const [k, n] of Object.entries(ADDONS)) assert.ok(text.includes(`- ${n}: ${zl(PRICES[k])} `), `cena ${k}`);
  for (const u of ['/', '/en', '/uk', '/de', '/o-serwisie', '/narzedzia/skaner-cv', '/dla-firm', '/poradnik/jak-dopasowac-cv-do-ogloszenia']) assert.ok(text.includes(`](${base}${u})`), `link ${u}`);
  for (const n of ['prywatnosc', 'regulamin']) for (const x of Object.values(LEGAL_PAGES[n])) assert.ok(text.includes(`](${base}/${x.path})`), `link ${x.path}`);
  for (const l of ['en', 'uk', 'de']) {
    assert.ok(text.includes(`](${base}/${l}#zawody)`) && text.includes(`](${base}/${l}#poradnik)`), `zawody i poradnik ${l}`);
    assert.ok(new RegExp(`\\]\\(${base}/${l}/[a-z-]+/[a-z-]+\\)`).test(text), `podstrony ${l}`);
  }
  assert.ok(text.includes(process.env.CONTACT_EMAIL || 'kontakt@cvpodogloszenie.pl'));
  assert.ok(!/gwarantuj|skuteczno|\d+\s?% (kandydatów|klientów)/i.test(text), 'bez obietnic i wskaźników skuteczności');
});

test('robots.txt nie blokuje /llms.txt', async () => {
  const { text } = await get('/robots.txt');
  assert.ok(text.includes('Allow: /llms.txt'));
  assert.ok(!/^Disallow: \/(llms|$)/m.test(text));
});

test('/o-serwisie: 200, jeden H1, dane firmy, ceny, link do polityki prywatności, indeksowana, w sitemapie i w stopce', async () => {
  const { status, text } = await get('/o-serwisie'), s = seller();
  assert.equal(status, 200);
  const main = /<section class="page" id="page" role="main" data-ssr="1">([\s\S]*?)<\/section>/.exec(text)?.[1] || '';
  assert.equal((main.match(/<h1>/g) || []).length, 1);
  assert.ok(text.includes('<h1>O serwisie CV Pod Ogłoszenie</h1>'));
  assert.ok(text.includes(`NIP: ${s.nip}`) && text.includes(s.address) && text.includes(s.name));
  assert.ok(text.includes('href="/polityka-prywatnosci"'));
  for (const k of Object.keys(PACKAGES)) assert.ok(text.includes(`<b>${zl(PRICES[k])}</b>`), `cena ${k}`);
  assert.ok(text.includes(`<link rel="canonical" href="${base}/o-serwisie">`) && !text.includes('noindex'));
  assert.ok(text.includes('<a href="/o-serwisie">O serwisie</a>'), 'link w stopce');
  assert.ok((await get('/sitemap.xml')).text.includes(`<loc>${base}/o-serwisie</loc>`));
});

test('JSON-LD Organization na stronie głównej i /o-serwisie: jeden, poprawny, z adresem, NIP i sameAs z Trustpilot', async () => {
  for (const p of ['/', '/o-serwisie', '/en']) {
    const orgs = lds((await get(p)).text).filter((x) => x['@type'] === 'Organization');
    assert.equal(orgs.length, 1, `${p}: jedna organizacja`);
    const o = orgs[0];
    assert.equal(o.name, 'CV Pod Ogłoszenie');
    assert.equal(o.url, `${base}/`);
    assert.equal(o.logo, `${base}/logo.svg`);
    assert.equal(o.taxID, seller().nip);
    assert.equal(o.address.postalCode, '66-010');
    assert.equal(o.address.addressCountry, 'PL');
    assert.match(o.email, /@/);
    assert.ok(Array.isArray(o.sameAs) && o.sameAs.includes(TP), `${p}: sameAs`);
    for (const u of ['https://www.youtube.com/@cvpodogloszenie', 'https://www.facebook.com/cvpodogloszenie', 'https://www.instagram.com/cvpodogloszenie']) assert.ok(o.sameAs.includes(u), `${p}: ${u}`);
  }
});

test('/o-serwisie: Przelewy24 tylko przy aktywnym koncie P24', async () => {
  const { text } = await get('/o-serwisie');
  assert.match(text, /<li>Płatności obsługuje Stripe; danych karty/, 'bez aktywnego konta P24 tylko Stripe');
});

test('/o-serwisie: strona tylko z serwera (skrypt nie podmienia jej na stronę główną)', async () => {
  const { text } = await get('/o-serwisie');
  assert.match(text, /<script src="\/lite\.js\?v=[0-9a-f]+" defer><\/script>/); assert.doesNotMatch(text, /<main id="landing"|id="wiz"/);
});
