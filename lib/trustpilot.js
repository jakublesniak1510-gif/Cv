// Widżet opinii Trustpilot (TrustBox): tylko gdy ustawione TRUSTPILOT_BUSINESS_UNIT_ID (z panelu Trustpilot) i TRUSTPILOT_SHOW=1
// (włączamy, gdy profil ma co najmniej 5 opinii). Bez tych zmiennych strona i nagłówek CSP są takie jak wcześniej.
// „Micro Review Count” pod hero strony głównej, „Mini” nad przyciskiem płatności w kasie (krok 6 kreatora).
export const TP_HOST = 'https://widget.trustpilot.com';
const TPL = { micro: '5419b6a8b0d04a076446a9ad', mini: '53aa8807dec7e10d38f59f36' };
// Trustpilot nie ma interfejsu po ukraińsku – wersja UK dostaje angielski.
export const TP_LOCALE = { pl: 'pl-PL', en: 'en-GB', de: 'de-DE', uk: 'en-GB' };
export const tpId = () => { const v = String(process.env.TRUSTPILOT_BUSINESS_UNIT_ID || '').trim(); return /^[a-f0-9]{24}$/i.test(v) ? v : ''; };
export const tpOn = () => process.env.TRUSTPILOT_SHOW === '1' && !!tpId();

const box = (kind) => {
  const size = kind === 'micro' ? 'data-style-height="24px" data-style-width="100%"' : 'data-style-height="150px" data-style-width="100%"';
  return `<div class="trustpilot-widget tp-${kind}" data-locale="${TP_LOCALE.pl}" data-template-id="${TPL[kind]}" data-businessunit-id="${tpId()}" ${size} data-theme="light"><a href="https://pl.trustpilot.com/review/cvpodogloszenie.pl" target="_blank" rel="noopener">Trustpilot</a></div>`;
};
const SCRIPT = `<script src="${TP_HOST}/bootstrap/v5/tp.widget.bootstrap.min.js" async></script>`;
// Znaczniki <!--tp-hero--> i <!--tp-mini--> w public/index.html: widżety albo nic.
export function tpHtml(html) {
  if (!tpOn()) return html.replace('<!--tp-hero-->', '').replace('<!--tp-mini-->', '');
  return html.replace('<!--tp-hero-->', () => `<div class="inner tp-hero">${box('micro')}</div>`).replace('<!--tp-mini-->', () => `<div class="tp-mini-box">${box('mini')}</div>`)
    .replace('</body>', () => `${SCRIPT}</body>`);
}
// Język widżetu wg wersji strony (EN/DE/UK).
export const tpLocale = (html, l) => (l && l !== 'pl' && tpOn() ? html.replaceAll(`data-locale="${TP_LOCALE.pl}"`, `data-locale="${TP_LOCALE[l] || TP_LOCALE.en}"`) : html);
// CSP: skrypt i ramki widżetu tylko przy włączonym widżecie.
export const tpCsp = (policy) => (tpOn() ? policy.replace(/script-src ([^;]*)/, `script-src $1 ${TP_HOST}`).replace(/frame-src ([^;]*)/, `frame-src $1 ${TP_HOST}`) : policy);
