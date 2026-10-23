import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PACKAGES, PRICES, PASSES, B2B_MIN } from '../lib/pricing.js';
import { PROFESSIONS } from '../lib/content.js';
import { PROF_LANGS } from '../lib/professions-i18n.js';
import { profSeo, profName, ART_SEO } from '../lib/seo-titles.js';

// Tytuły i opisy wszystkich stron z mapy strony: długość, unikalność, bez obietnic; dane strukturalne strony głównej.
const port = 4600 + Math.floor(Math.random() * 300), U = `http://localhost:${port}`;
let srv, pages = [];
const dec = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const meta = (h, re) => dec(re.exec(h)?.[1] || '');
const get = async (p) => (await fetch(U + p)).text();
const HOMES = ['/', '/en', '/uk', '/de'];

before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cvpo-titles-'));
  srv = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, BASE_URL: U, ANTHROPIC_API_KEY: '', SMTP_URL: '', STRIPE_SECRET_KEY: '', P24_MERCHANT_ID: '' }, stdio: 'ignore' });
  for (let i = 0; i < 150; i++) { try { await fetch(`${U}/health`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  const urls = [...(await get('/sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(U, '') || '/');
  for (let i = 0; i < urls.length; i += 25) {
    pages.push(...await Promise.all(urls.slice(i, i + 25).map(async (u) => {
      const h = await get(u);
      return { u, h, title: meta(h, /<title>(.*?)<\/title>/), desc: meta(h, /<meta name="description" content="([^"]*)"/) };
    })));
  }
});
after(() => srv?.kill());

test('Wszystkie strony z mapy strony: tytuł ≤ 60 znaków (strony główne ≤ 70), opis ≤ 155, tytuły i opisy unikalne', () => {
  assert.ok(pages.length > 500, `stron: ${pages.length}`);
  for (const p of pages) {
    assert.ok(p.title && p.desc, `${p.u}: brak tytułu lub opisu`);
    assert.ok(p.title.length <= (HOMES.includes(p.u) ? 70 : 60), `${p.u}: tytuł ${p.title.length} znaków „${p.title}”`);
    assert.ok(p.desc.length <= 155, `${p.u}: opis ${p.desc.length} znaków`);
    assert.doesNotMatch(`${p.title} ${p.desc}`, /najlepsz|gwarant|garantiert|guarantee|гарант/i, `${p.u}: bez „najlepszy” i obietnic`);
  }
  const dup = (k) => Object.entries(Object.groupBy(pages, (p) => p[k])).filter(([, v]) => v.length > 1).map(([t, v]) => `${t}: ${v.map((p) => p.u).join(', ')}`);
  assert.deepEqual(dup('title'), [], 'powtórzone tytuły');
  assert.deepEqual(dup('desc'), [], 'powtórzone opisy');
});

test('Strona główna: nowy tytuł i opis, OG i Twitter spójne; darmowy skaner przed ceną, bez „5 minut”', async () => {
  const by = Object.fromEntries(pages.filter((p) => HOMES.includes(p.u)).map((p) => [p.u, p]));
  assert.equal(by['/'].title, 'Dopasuj CV do ogłoszenia – darmowy skaner CV, od 39 zł');
  assert.equal(by['/'].desc, 'Wklej ogłoszenie, dostajesz CV i list motywacyjny ze słowami kluczowymi, których szuka rekruter. PDF w kilka minut. Darmowy skaner sprawdzi Twoje CV.');
  assert.match(by['/'].title, new RegExp(`od ${Math.min(...Object.keys(PACKAGES).map((k) => PRICES[k])) / 100} zł`), 'cena „od” z cennika');
  for (const u of HOMES) {
    const { h, title, desc } = by[u];
    assert.equal(meta(h, /<meta property="og:title" content="([^"]*)"/), title, `${u}: og:title`);
    assert.equal(meta(h, /<meta name="twitter:title" content="([^"]*)"/), title, `${u}: twitter:title`);
    assert.equal(meta(h, /<meta property="og:description" content="([^"]*)"/), desc, `${u}: og:description`);
    assert.equal(meta(h, /<meta name="twitter:description" content="([^"]*)"/), desc, `${u}: twitter:description`);
    assert.doesNotMatch(title, /\b5\b/, `${u}: bez konkretnej liczby minut`); assert.match(title, /skaner|scanner|сканер|Scanner/, `${u}: darmowy skaner w tytule`);
    if (u !== '/') { assert.match(title, /39 (PLN|зл)/); assert.doesNotMatch(`${title} ${desc}`, /ogłosz|Dopasuj/, `${u}: przetłumaczone`); }
  }
  // podstrona: Twitter = OG = treść strony
  const k = pages.find((p) => p.u === '/kontakt');
  assert.equal(meta(k.h, /<meta name="twitter:title" content="([^"]*)"/), meta(k.h, /<meta property="og:title" content="([^"]*)"/));
});

test('Kluczowe podstrony: czasownik + korzyść + konkret (cena, czas, liczba)', () => {
  const t = (u) => pages.find((p) => p.u === u)?.title;
  assert.equal(t('/narzedzia/skaner-cv'), 'Skaner CV za darmo: sprawdź dopasowanie w kilkanaście sekund');
  assert.equal(t('/karnety'), `Kup karnet na CV pod ogłoszenia – od ${Math.min(...Object.values(PASSES).map((x) => x.price)) / 100} zł, bez subskrypcji`);
  assert.equal(t('/dla-firm'), `Zamów CV pod ogłoszenie dla podopiecznych – od ${B2B_MIN} kodów`);
  assert.equal(t('/kontakt'), 'Kontakt: dane firmy, telefon, e-mail | CV Pod Ogłoszenie');
  for (const l of ['en', 'uk', 'de']) assert.ok(JSON.parse(fs.readFileSync(new URL(`../public/i18n/${l}.json`, import.meta.url), 'utf8'))[`Zamów CV pod ogłoszenie dla podopiecznych – od ${B2B_MIN} kodów`], `${l}: tytuł /dla-firm`);
});

test('JSON-LD strony głównej: poprawna składnia, SoftwareApplication z AggregateOffer obok Service, bez ocen i opinii', async () => {
  for (const u of HOMES) {
    const h = pages.find((p) => p.u === u).h;
    const ld = [...h.matchAll(/<script[^>]*type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    for (const x of ld) assert.equal(x['@context'], 'https://schema.org');
    const app = ld.find((x) => x['@type'] === 'SoftwareApplication');
    assert.ok(app, `${u}: SoftwareApplication`);
    assert.equal(app.applicationCategory, 'BusinessApplication'); assert.equal(app.operatingSystem, 'Web'); assert.equal(app.name, 'CV Pod Ogłoszenie');
    assert.deepEqual(app.offers, { '@type': 'AggregateOffer', lowPrice: 39, highPrice: 79, priceCurrency: 'PLN', offerCount: 3 });
    assert.doesNotMatch(h, /AggregateRating|"@type":"Review"|ratingValue/, `${u}: bez ocen, dopóki nie ma prawdziwych opinii na stronie`);
    if (u === '/') assert.ok(ld.some((x) => x['@type'] === 'Service' && x.offers.length === 3), 'Service zostaje');
  }
});

// Odmiana zawodu pochodzi z ręcznie pisanych nagłówków („CV hydraulika: …”). Wyjątki: nazwy obszarów pracy, nie osób.
const NOT_PERSON = ['obsluga-klienta', 'specjalista-kadr-i-plac'];
test('Strony zawodów: tytuł z szablonu z odmianą z danych, opis ze słowami kluczowymi i skanerem, bez błędów odmiany', () => {
  const t = (u) => pages.find((p) => p.u === u)?.title, d = (u) => pages.find((p) => p.u === u)?.desc;
  assert.equal(t('/cv/hydraulik'), 'CV hydraulika pod ogłoszenie – wzór i generator online');
  assert.equal(t(`/uk/${PROF_LANGS.uk.seg}/${PROF_LANGS.uk.prof.hydraulik.slugLang}`), 'Резюме сантехніка під вакансію – зразок і генератор онлайн');
  assert.ok(pages.every((p) => !/5 minut|5 minutes|5 Minuten|5 хвилин/i.test(`${p.title} ${p.desc}`)), 'bez „5 minut” w tytułach i opisach');
  assert.match(d('/cv/hydraulik'), /^Wzór CV hydraulika ze słowami kluczowymi z ogłoszeń: .+\. Wygeneruj CV pod ogłoszenie lub sprawdź swoje darmowym skanerem\.$/);
  assert.equal(t('/en/cv/plumber'), 'Plumber CV for a job ad – template and generator');
  assert.match(t(`/de/lebenslauf/${PROF_LANGS.de.prof.hydraulik.slugLang}`), /^Lebenslauf Installateur zur Stellenanzeige/);
  for (const p of PROFESSIONS) {
    const g = profName(p);
    assert.ok(g, `${p.slug}: odmiana z nagłówka`);
    // dopełniacz ≠ mianownik (np. „hydraulika”, a nie „hydraulik”); wyjątki: obszary pracy („w obsłudze klienta”)
    // co najmniej jedno słowo odmienione względem nazwy zawodu (mianownik), z końcówką dopełniacza
    const gw = g.toLowerCase().split(' '), nw = p.name.split(' / ')[0].toLowerCase().split(' ');
    if (NOT_PERSON.includes(p.slug)) assert.match(g, /^w /, `${p.slug}: wyjątek`);
    else assert.ok(gw.some((w, i) => w !== nw[i] && /(a|y|i|ego|ej|u|ów)$/u.test(w)), `${p.slug}: „${g}” nie wygląda na dopełniacz od „${p.name}”`);
    for (const l of ['pl', 'en', 'uk', 'de']) {
      const x = profSeo(l === 'pl' ? p : { ...p, ...PROF_LANGS[l].prof[p.slug] }, l);
      assert.ok(x.seoTitle && x.seoTitle.length <= 60 && x.metaDescription.length <= 155, `${l}/${p.slug}`);
      assert.doesNotMatch(x.seoTitle + x.metaDescription, /undefined|  |\s[,.]/, `${l}/${p.slug}: puste pola`);
    }
  }
});

test('Poradniki z GSC: czasownik + korzyść, rok z daty treści przy klauzuli RODO', () => {
  const t = (u) => pages.find((p) => p.u === u)?.title, y = /\b20\d\d\b/;
  assert.equal(t('/poradnik/jak-dopasowac-cv-do-ogloszenia'), ART_SEO.pl['jak-dopasowac-cv-do-ogloszenia']);
  assert.match(t('/poradnik/klauzula-rodo-w-cv'), /^Klauzula RODO w CV 20\d\d: /);
  assert.match(t('/de/ratgeber/dsgvo-klausel-im-lebenslauf'), /^DSGVO-Klausel im Lebenslauf 20\d\d: /);
  assert.match(t('/en/guides/gdpr-clause-on-a-cv'), /^GDPR \(RODO\) clause on a CV 20\d\d: /);
  assert.doesNotMatch(t('/poradnik/przerwa-w-zatrudnieniu-w-cv'), y, 'rok tylko przy treści rocznej');
  assert.equal(t('/narzedzia/podziekowanie-po-rozmowie'), 'Napisz podziękowanie po rozmowie kwalifikacyjnej – generator');
  const ch = JSON.parse(fs.readFileSync(new URL('../seo-data/title-changes.json', import.meta.url), 'utf8')).at(-1);
  assert.equal(ch.variantB.title, 'Dopasuj CV do ogłoszenia – darmowy skaner CV i list motywacyjny');
  for (const u of ['/poradnik/cv-dla-studenta', '/poradnik/podsumowanie-zawodowe-w-cv', '/poradnik/zdjecie-w-cv', '/de/tools/dsgvo-klausel-lebenslauf']) assert.ok(ch.pages.includes(u) && t(u).length <= 60, u);
  assert.equal(t('/de/tools/dsgvo-klausel-lebenslauf'), 'DSGVO-Klausel im Lebenslauf (Polen) kostenlos erstellen');
  assert.ok(pages.every((p) => p.title !== ch.variantB.title), 'wariant B nie jest wdrożony');
});
