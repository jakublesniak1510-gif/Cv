import { ssrPage, escHtml as esc } from './seo.js';
import { SERVICES } from './services.js';

// Strona /uslugi (28.10, tylko PL): wszystkie usługi w jednym miejscu – karta z ceną z lib/pricing.js i jednym zdaniem opisu.
const card = (s) => `<a class="svc-card" href="${s.url}"><h3>${esc(s.name)}</h3><p class="svc-price">${esc(s.price)}</p><p>${esc(s.desc)}</p><span class="svc-more">Szczegóły</span></a>`;
function pageHtml() {
  const all = SERVICES(), grid = (g) => `<div class="svc-grid">${all.filter((s) => s.group === g).map(card).join('')}</div>`;
  return `<div class="inner svc"><nav class="crumbs" aria-label="Ścieżka"><a href="/">Strona główna</a> › <span>Usługi</span></nav>
<h1>Usługi CV Pod Ogłoszenie</h1>
<p class="lead">Oprócz CV pod ogłoszenie przygotujemy zdjęcie do CV, tłumaczenie, szablony w Word, dokumenty do dotacji z urzędu pracy i oferty na zlecenia. Firmom pomagamy w ogłoszeniach o pracę i outplacemencie. Każdą usługę kupujesz osobno, jednorazowo i bez abonamentu.</p>
<h2>Dla osób szukających pracy</h2>${grid('job')}
<h2>Dla firm</h2>${grid('firm')}
<p class="sub2 small">Ceny końcowe. Sprzedawca zwolniony z VAT – na życzenie wystawiamy fakturę bez VAT. Szczegóły każdej usługi i zasady odstąpienia od umowy znajdziesz na jej stronie i w <a href="/regulamin">Regulaminie</a>.</p>
<p><a href="/dla-firm">Pakiety kodów dla instytucji, uczelni i firm</a></p></div>`;
}

export function servicesPageRoutes(app, BASE_URL) {
  app.get('/uslugi', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=600');
    ssrPage(res, BASE_URL, 'uslugi', { title: 'Usługi', seoTitle: 'Usługi: CV, zdjęcie, tłumaczenie, dotacja i usługi dla firm', metaDescription: 'Wszystkie usługi CV Pod Ogłoszenie z cenami: CV pod ogłoszenie, zdjęcie do CV, szablony Word, tłumaczenie CV, dotacja z urzędu pracy, oferty na zlecenie, usługi dla firm.' },
      pageHtml(), { data: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Strona główna', item: `${BASE_URL}/` }, { '@type': 'ListItem', position: 2, name: 'Usługi', item: `${BASE_URL}/uslugi` }] }] });
  });
}
