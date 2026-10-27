import { ssrPage, escHtml as esc } from './seo.js';
import { renderDocx } from './docx.js';
import { renderCv, renderLetter } from './pdf.js';
import { PRICES } from './pricing.js';
import { ABROAD } from './abroad-content.js';
import { byline, pageLd } from './authorship.js';
import { previewImg } from './previews.js';

// Darmowe wzory CV i listów motywacyjnych w DOCX dla 25 popularnych zawodów: /wzor-cv, /wzor-cv/<zawód>,
// /list-motywacyjny, /list-motywacyjny/<zawód>. Treści w lib/templates-content/<zawód>.js (unikalne, ≥ 600 słów na stronę),
// plik DOCX i podgląd PDF z fikcyjnymi danymi oznaczonymi jako przykład. Pobranie bez rejestracji.
import { TEMPLATE_LIST as loaded, TEMPLATES } from './templates-content/index.js';
export { TEMPLATES, TEMPLATE_URLS, templateFor } from './templates-content/index.js';

const NOTE = 'PRZYKŁAD – dane w tym wzorze są fikcyjne. Zastąp je swoimi, a CV dopasuj do ogłoszenia. Wzór: cvpodogloszenie.pl';
const DESIGN = { tpl: 'nowoczesny', color: 'granat' };
const zl = (gr) => `${gr % 100 ? (gr / 100).toFixed(2).replace('.', ',') : gr / 100} zł`;
const fromPrice = () => zl(Math.min(PRICES.cv, PRICES.cv_letter));
const cvData = (t) => { const s = t.cv.sample; return { lang: 'pl', cv: { name: s.name, headline: s.headline, contact: s.contact, summary: s.summary, experience: s.experience, education: s.education, skills: s.skills, languages: s.languages || [], certificates: s.certificates || [], interests: s.interests || '', clause: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.' } }; };
const letterData = (t) => { const s = t.cv.sample, l = t.letter.sample; return { lang: 'pl', cv: { name: s.name, contact: s.contact }, letter: `${l.recipient}\n\n${l.subject}\n\n${l.text}\n\nZ wyrazami szacunku\n${s.name}` }; };
const fileName = (t, kind) => `${kind === 'cv' ? 'wzor-cv' : 'list-motywacyjny'}-${t.slug}.docx`;

const cache = new Map();
const cached = async (key, fn) => { if (!cache.has(key)) { if (cache.size > 200) cache.clear(); cache.set(key, await fn()); } return cache.get(key); };
export const templateDocx = (t, kind) => cached(`docx|${kind}|${t.slug}`, () => renderDocx(kind === 'cv' ? cvData(t) : letterData(t), kind === 'cv' ? 'cv' : 'letter', DESIGN, { note: NOTE }));
export const templatePdf = (t, kind) => cached(`pdf|${kind}|${t.slug}`, () => (kind === 'cv' ? renderCv(cvData(t), DESIGN, '', 'PRZYKŁAD') : renderLetter(letterData(t), DESIGN)));

const ld = { faq: (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }),
  crumbs: (base, items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}/${path}` })) }) };
const list = (a, tag = 'ul') => (a?.length ? `<${tag}>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</${tag}>` : '');
const sections = (ss) => ss.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((p) => `<p>${esc(p)}</p>`).join('')}${list(s.list)}`).join('');
const faqHtml = (faq) => `<h2>Najczęstsze pytania</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}`;
const cta = (t) => `<div class="cta-box"><div><b>Dopasuj ten wzór do konkretnego ogłoszenia – od ${fromPrice()}</b><p class="hint">Wklejasz ogłoszenie, a my układamy CV ${esc(t.nameIn)} pod jego wymagania i słowa kluczowe, z raportem dopasowania. Wolisz najpierw sprawdzić swoje CV? Skorzystaj z darmowego skanera.</p></div><div class="cta"><a class="btn" href="/?zamow=1">Dopasuj CV do ogłoszenia</a> <a class="btn ghost" href="/narzedzia/skaner-cv">Darmowy skaner CV</a></div></div>`;
const newsletter = (slug) => `<form class="tpl-news card" data-source="wzor-${esc(slug)}" novalidate><b>Chcesz dostawać porady o szukaniu pracy?</b><p class="hint">Nieobowiązkowe – plik pobierzesz bez podawania e-maila.</p><label class="f">E-mail<input type="email" name="email" autocomplete="email" maxlength="160"></label><label class="tpl-chk"><input type="checkbox" name="consent"> Chcę otrzymywać newsletter CV Pod Ogłoszenie (porady i oferty, najwyżej kilka razy w miesiącu). Zapis potwierdzisz linkiem w e-mailu, a wypiszesz się jednym kliknięciem.</label><input type="text" name="website" tabindex="-1" autocomplete="off" hidden><button class="btn ghost sm" type="submit">Zapisz mnie</button><p class="tpl-msg" role="status"></p></form>`;
const preview = (t, kind) => {
  const s = t.cv.sample;
  return kind === 'cv'
    ? `<div class="tpl-preview card" aria-label="Podgląd wzoru"><p class="mute">Podgląd (dane przykładowe)</p><b>${esc(s.name)}</b> · ${esc(s.headline)}<p>${esc(s.summary)}</p>${s.experience.map((e) => `<p><b>${esc(e.title)}</b>, ${esc(e.company)} (${esc(e.period)})</p>${list(e.bullets)}`).join('')}<p><b>Umiejętności:</b> ${esc(s.skills.join(', '))}</p></div>`
    : `<div class="tpl-preview card" aria-label="Podgląd wzoru"><p class="mute">Podgląd (dane przykładowe)</p><p><b>${esc(t.letter.sample.subject)}</b></p>${t.letter.sample.text.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
};
const downloads = (t, kind) => `<div class="tpl-dl"><a class="btn lg" href="/${kind === 'cv' ? 'wzor-cv' : 'list-motywacyjny'}/${t.slug}.docx" download>Pobierz wzór DOCX (Word)</a> <a class="btn ghost" href="/${kind === 'cv' ? 'wzor-cv' : 'list-motywacyjny'}/${t.slug}.pdf" target="_blank" rel="noopener">Podgląd PDF</a><p class="hint">Za darmo i bez rejestracji. Plik otworzysz w Wordzie, LibreOffice albo Dokumentach Google.</p></div>`;
const others = (t, kind) => `<h2>${kind === 'cv' ? 'Wzory CV dla innych zawodów' : 'Listy motywacyjne dla innych zawodów'}</h2><div class="more">${loaded.filter((x) => x.slug !== t.slug).map((x) => `<a href="/${kind === 'cv' ? 'wzor-cv' : 'list-motywacyjny'}/${x.slug}">${esc(x.name)}</a>`).join('')}</div>`;

function cvHtml(t) {
  const c = t.cv;
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/wzor-cv">Wzory CV</a> › <span>${esc(t.name)}</span></nav>
<h1>${esc(c.title)}</h1>${byline(`wzor-cv/${t.slug}`)}<p class="lead">${esc(c.intro)}</p>${downloads(t, 'cv')}${previewImg(`wzor-cv-${t.slug}`, `Wzór CV ${t.nameIn} – podgląd`)}${preview(t, 'cv')}
${sections(c.sections)}
<h2>Słowa kluczowe z ogłoszeń</h2><div class="kw">${c.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
<h2>Przykładowe zdania do CV</h2><h3>Podsumowanie zawodowe</h3>${list(c.phrases.summary)}<h3>Doświadczenie</h3>${list(c.phrases.experience)}<h3>Umiejętności</h3>${list(c.phrases.skills)}
<h2>Czego unikać</h2>${list(c.avoid)}
${cta(t)}${faqHtml(c.faq)}
<h2>Zobacz też</h2><div class="more"><a href="/list-motywacyjny/${t.slug}">List motywacyjny: ${esc(t.name)}</a>${t.profSlug ? `<a href="/cv/${t.profSlug}">CV ${esc(t.nameIn)}: słowa kluczowe i wskazówki</a>` : ''}<a href="/poradnik/jak-dopasowac-cv-do-ogloszenia">Jak dopasować CV do ogłoszenia</a></div>
${others(t, 'cv')}${newsletter(t.slug)}</div>`;
}
function letterHtml(t) {
  const c = t.letter;
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <a href="/list-motywacyjny">Listy motywacyjne</a> › <span>${esc(t.name)}</span></nav>
<h1>${esc(c.title)}</h1>${byline(`list-motywacyjny/${t.slug}`)}<p class="lead">${esc(c.intro)}</p>${downloads(t, 'letter')}${previewImg(`list-motywacyjny-${t.slug}`, `Wzór listu motywacyjnego ${t.nameIn} – podgląd`)}${preview(t, 'letter')}
${sections(c.sections)}
<h2>Przykładowe zdania do listu</h2><h3>Na początek</h3>${list(c.phrases.opening)}<h3>W treści</h3>${list(c.phrases.body)}<h3>Na zakończenie</h3>${list(c.phrases.closing)}
${cta(t)}${faqHtml(c.faq)}
<h2>Zobacz też</h2><div class="more"><a href="/wzor-cv/${t.slug}">Wzór CV: ${esc(t.name)}</a>${t.profSlug ? `<a href="/cv/${t.profSlug}">CV ${esc(t.nameIn)}: słowa kluczowe i wskazówki</a>` : ''}<a href="/poradnik/jak-napisac-list-motywacyjny">Jak napisać list motywacyjny</a></div>
${others(t, 'letter')}${newsletter(t.slug)}</div>`;
}
const HUB = {
  cv: { title: 'Wzory CV do pobrania za darmo (DOCX)', seoTitle: 'Wzory CV do pobrania za darmo w DOCX – 25 zawodów', metaDescription: 'Darmowe wzory CV w formacie Word (DOCX) dla 25 popularnych zawodów: przykładowe dane, słowa kluczowe z ogłoszeń i wskazówki, co sprawdza rekruter.',
    intro: 'Wybierz zawód i pobierz gotowy wzór CV w formacie Word. Każdy wzór jest wypełniony fikcyjnymi danymi, a na stronie zawodu znajdziesz słowa kluczowe z ogłoszeń, przykładowe zdania i listę rzeczy, których lepiej unikać. Pobieranie jest darmowe i nie wymaga rejestracji.' },
  letter: { title: 'Listy motywacyjne – darmowe wzory do pobrania (DOCX)', seoTitle: 'List motywacyjny – darmowe wzory DOCX dla 25 zawodów', metaDescription: 'Darmowe wzory listów motywacyjnych w formacie Word (DOCX) dla 25 zawodów: przykładowy list, gotowe zdania na początek i zakończenie, najczęstsze błędy.',
    intro: 'Pobierz wzór listu motywacyjnego dla swojego zawodu. Każdy zawiera przykładowy list do fikcyjnej firmy, gotowe zdania na początek, do treści i na zakończenie oraz wskazówki, jak odnieść się do wymagań z ogłoszenia. Za darmo i bez rejestracji.' },
};
function hubHtml(kind) {
  const h = HUB[kind], path = kind === 'cv' ? 'wzor-cv' : 'list-motywacyjny';
  return `<div class="inner"><nav class="crumbs"><a href="/">Strona główna</a> › <span>${kind === 'cv' ? 'Wzory CV' : 'Listy motywacyjne'}</span></nav>
<h1>${esc(h.title)}</h1><p class="lead">${esc(h.intro)}</p>
<div class="more tpl-hub">${loaded.map((t) => `<a href="/${path}/${t.slug}">${esc(t.name)}</a>`).join('')}</div>
<h2>${kind === 'cv' ? 'Jak korzystać ze wzoru CV' : 'Jak korzystać ze wzoru listu'}</h2><ol class="tips"><li>Pobierz plik DOCX i otwórz go w Wordzie, LibreOffice albo Dokumentach Google.</li><li>Zamień przykładowe dane na swoje: zostaw tylko doświadczenie, które naprawdę masz.</li><li>Porównaj tekst z ogłoszeniem, na które aplikujesz, i użyj tych samych nazw umiejętności i narzędzi.</li><li>Zapisz gotowy dokument jako PDF i nazwij plik swoim imieniem i nazwiskiem.</li></ol>
${kind === 'cv' ? `<h2>CV za granicę</h2><div class="more">${ABROAD.map((a) => `<a href="/${a.slug}">${esc(a.title.split(':')[0])}</a>`).join('')}</div>` : ''}
${kind === 'cv' ? '<p>Szukasz też listu? Zobacz <a href="/list-motywacyjny">wzory listów motywacyjnych</a>. Potrzebujesz innego układu niż we wzorach pod zawód? <a href="/szablony-premium">Szablony CV premium – 10 układów w Word</a>.</p>' : '<p>Potrzebujesz też CV? Zobacz <a href="/wzor-cv">wzory CV do pobrania</a>.</p>'}
<div class="cta-box"><div><b>Wzór to dopiero początek – dopasuj CV do konkretnego ogłoszenia, od ${fromPrice()}</b><p class="hint">Albo sprawdź za darmo, jak Twoje obecne CV pasuje do ogłoszenia.</p></div><div class="cta"><a class="btn" href="/?zamow=1">Dopasuj CV do ogłoszenia</a> <a class="btn ghost" href="/narzedzia/skaner-cv">Darmowy skaner CV</a></div></div></div>`;
}

export function templateRoutes(app, base) {
  const send = (res, buf, type, name) => res.set({ 'Content-Type': type, 'Content-Disposition': `${name.endsWith('.pdf') ? 'inline' : 'attachment'}; filename="${name}"`, 'Cache-Control': 'public, max-age=86400', 'X-Robots-Tag': 'noindex' }).send(buf);
  for (const [kind, path] of [['cv', 'wzor-cv'], ['letter', 'list-motywacyjny']]) {
    app.get(`/${path}`, (_req, res) => { res.set('Cache-Control', 'public, max-age=3600'); ssrPage(res, base, path, HUB[kind], hubHtml(kind), { script: '/wzory.js', data: [ld.crumbs(base, [[kind === 'cv' ? 'Wzory CV' : 'Listy motywacyjne', path]])] }); });
    app.get(`/${path}/:file`, async (req, res, next) => {
      const m = /^([a-z0-9-]+?)(?:\.(docx|pdf))?$/.exec(req.params.file), t = m && TEMPLATES[m[1]];
      if (!t) return next();
      try {
        if (m[2] === 'docx') return send(res, await templateDocx(t, kind), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileName(t, kind));
        if (m[2] === 'pdf') return send(res, await templatePdf(t, kind), 'application/pdf', fileName(t, kind).replace(/\.docx$/, '.pdf'));
      } catch (e) { return next(e); }
      res.set('Cache-Control', 'public, max-age=3600');
      ssrPage(res, base, `${path}/${t.slug}`, t[kind], kind === 'cv' ? cvHtml(t) : letterHtml(t), { script: '/wzory.js', data: [ld.faq(t[kind].faq), ld.crumbs(base, [[kind === 'cv' ? 'Wzory CV' : 'Listy motywacyjne', path], [t.name, `${path}/${t.slug}`]]), pageLd(base, `${path}/${t.slug}`, t[kind].title)] });
    });
  }
}
