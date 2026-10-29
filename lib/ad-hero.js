import { PRICES } from './pricing.js';

// Hero „z reklamy” (28.10): wejścia z utm_source=google|meta albo z gclid/fbclid (od 29.10 też nasze kanały, niżej). Jedno pole (ogłoszenie albo stanowisko),
// przycisk do kreatora z bezpłatnym podglądem przed płatnością i 3 punkty. Bez nowych liczb, bez presji czasu.
// Elementy #heroRating, #cvCounter i #liveStats zostają (ukryte) – wypełnia je app.js jak w zwykłym hero.
// Serwer wstawia gotową wersję przy wejściu z reklamy (bez mignięcia), a przy dalszych odsłonach tej wizyty
// public/app.js podmienia hero z <template id="adHeroTpl"> (flaga w sessionStorage).
const zl = (gr) => `${gr / 100} zł`;
// 29.10: także ruch z naszych kanałów (utm_source yt/youtube/ig/instagram/fb/facebook/tiktok/pinterest albo utm_campaign „sprzedaz-…”).
// Ten sam warunek jest w public/app.js (AD_HIT).
export const AD_SOURCE_RE = /^(google|meta|yt|youtube|ig|instagram|fb|facebook|tiktok|pinterest)$/i, AD_CAMPAIGN_RE = /^sprzedaz-/i;
export const isAdHit = (q = {}) => AD_SOURCE_RE.test(String(q.utm_source || '')) || AD_CAMPAIGN_RE.test(String(q.utm_campaign || '')) || !!q.gclid || !!q.fbclid;
export const adHeroInner = () => `<h1>CV dopasowane do ogłoszenia w 2 minuty – ${zl(PRICES.cv)}</h1>
<form class="hero-ad ad-hero" id="heroAd" novalidate><textarea id="heroAdIn" rows="2" aria-label="Link albo treść ogłoszenia albo stanowisko" placeholder="Wklej link albo treść ogłoszenia LUB wpisz stanowisko"></textarea><button class="btn lg" type="submit">Pokaż moje CV za darmo</button></form>
<ul class="ticks ad-ticks"><li>Bezpłatny podgląd CV przed zapłatą</li><li><a href="/regulamin#gwarancja">Gwarancja dopasowania (§7a regulaminu)</a></li><li>Płatność BLIK albo kartą, bez abonamentu</li></ul>
<a class="hero-rating" id="heroRating" href="#opinie" hidden></a><p class="counter" id="cvCounter" hidden></p><p class="live-stats" id="liveStats" hidden></p>`;
// Szablon dla app.js – tylko w polskiej wersji (data-pl-block znika z EN/UK/DE).
export const adHeroTemplate = () => `<div data-pl-block><template id="adHeroTpl">${adHeroInner()}</template><!--/pl-only--></div>`;
// Wersja serwerowa: lewa kolumna hero zamieniona na wersję z reklamy.
export const withAdHero = (html) => html.replace(/(<section class="hero" id="top")(><div class="inner hero-grid">\s*<div)>[\s\S]*?<\/div>(\s*<div class="demo")/, (_m, a, b, c) => `${a} data-adhero="1"${b} class="ad-hero-col">${adHeroInner()}</div>${c}`);
