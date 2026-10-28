import { PRICES, OUT_TIERS } from './pricing.js';

// Lista usług (28.10): strona /uslugi (lib/services-page.js), pasek „Inne usługi” pod cennikiem strony głównej (seo.js: index()).
// Ceny zawsze z lib/pricing.js. Selekcja CV tylko przy SELECTION_ENABLED=1 (tak jak jej strona i sitemap).
export const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const outFrom = () => Math.min(...OUT_TIERS.map((t) => t.unit));
export const SERVICES = () => [
  { key: 'cv', group: 'job', name: 'CV pod ogłoszenie', url: '/#cennik', price: zl(PRICES.cv), desc: 'CV dopasowane do jednego ogłoszenia, ze słowami kluczowymi z jego treści; list motywacyjny i pakiety w cenniku.' },
  { key: 'photo', group: 'job', name: 'Zdjęcie do CV', url: '/narzedzia/zdjecie-do-cv', price: zl(PRICES.photo), desc: 'Ocena zdjęcia jest bezpłatna, a w płatnej wersji kadrujemy je i wyrównujemy jasność (bez retuszu twarzy).' },
  { key: 'templates', group: 'job', name: 'Szablony CV premium', url: '/szablony-premium', price: zl(PRICES.templates), desc: 'Dziesięć edytowalnych szablonów CV w Word (DOCX) z podpowiedziami, co wpisać w każdej sekcji.' },
  { key: 'translation', group: 'job', name: 'Tłumaczenie CV', url: '/tlumaczenie-cv', price: zl(PRICES.translation), desc: 'Tłumaczenie Twojego CV na wybrany język w PDF i DOCX; pierwszą stronę zobaczysz przed płatnością.' },
  { key: 'grant', group: 'job', name: 'Dotacja z urzędu pracy', url: '/uslugi/dotacja-z-urzedu-pracy', price: `${zl(PRICES.grantplan)} / ${zl(PRICES.grantfull)}`, desc: `Biznesplan według wzoru Twojego urzędu (${zl(PRICES.grantplan)}) albo biznesplan z treścią pól wniosku (${zl(PRICES.grantfull)}), z podglądem przed płatnością.` },
  { key: 'offer', group: 'job', name: 'Oferta na zlecenie', url: '/uslugi/oferta-na-zlecenie', price: `${zl(PRICES.offer)} / 5 za ${zl(PRICES.offerpack)}`, desc: 'Odpowiedź na zlecenie z Fixly, Oferteo czy OLX: krótka wiadomość, dłuższa oferta, wycena w punktach i pytania do klienta.' },
  { key: 'adcheck', group: 'firm', name: 'Sprawdzenie ogłoszenia o pracę', url: '/dla-firm/sprawdz-ogloszenie', price: zl(PRICES.adcheck), desc: 'Raport z uwagami i poprawioną wersją ogłoszenia przed publikacją; wynik i 3 uwagi bezpłatnie.' },
  { key: 'outplacement', group: 'firm', name: 'Outplacement', url: '/dla-firm/outplacement', price: `od ${zl(outFrom())}/os.`, desc: 'Kod dla każdego odchodzącego pracownika: CV i listy pod 3 ogłoszenia, przygotowanie do rozmowy i profil LinkedIn.' },
  ...(process.env.SELECTION_ENABLED === '1' ? [{ key: 'selection', group: 'firm', name: 'Selekcja CV', url: '/dla-firm/selekcja-cv', price: `${zl(PRICES.selection20)} / ${zl(PRICES.selection50)}`, desc: `Tabela wymagań z ogłoszenia dla każdego CV (do 20 CV za ${zl(PRICES.selection20)}, do 50 za ${zl(PRICES.selection50)}), bez rankingu kandydatów.` }] : []),
];
// Pasek pod cennikiem strony głównej: tylko PL (data-pl-block znika z wersji EN/UK/DE – stripPl), bez CV (jest wyżej w cenniku).
const BAR = ['photo', 'templates', 'translation', 'grant', 'offer', 'adcheck'];
export const servicesBarHtml = () => `<div data-pl-block><nav class="svc-bar" aria-label="Inne usługi"><b>Inne usługi:</b>${SERVICES().filter((s) => BAR.includes(s.key)).map((s) => `<a href="${s.url}">${s.name} <span>${s.key === 'grant' || s.key === 'offer' ? `od ${zl(PRICES[s.key === 'grant' ? 'grantplan' : 'offer'])}` : s.price}</span></a>`).join('')}<a href="/uslugi">Wszystkie usługi</a></nav><!--/pl-only--></div>`;
