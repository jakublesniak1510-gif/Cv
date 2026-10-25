// Strony z treścią redakcyjną (poradniki, zawody, wzory, pracodawcy; także EN/UK/DE): adres → dane, z których powstaje treść.
// Skrót (hash) tych danych zapisuje seo-data/content-dates.json razem z datą ostatniej zmiany; test pilnuje, żeby się zgadzały.
import crypto from 'node:crypto';
import { PROFESSIONS, ARTICLES } from './content.js';
import { PROF_LANGS } from './professions-i18n.js';
import { ART_LANGS } from './articles-i18n.js';
import { TEMPLATES } from './templates-content/index.js';
import { EMPLOYERS } from './employers-data.js';
import { OFFICIAL } from './official-content.js';
import { PORTALS, portalPath } from './portals-content.js';
import { extOf } from './content-ext.js';

export const contentHash = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
// [adres, rodzaj, slug (polski), język, dane]
export function contentPages() {
  const out = [];
  for (const p of PROFESSIONS) out.push([`cv/${p.slug}`, 'prof', p.slug, 'pl', p]);
  for (const a of ARTICLES) out.push([`poradnik/${a.slug}`, 'art', a.slug, 'pl', a]);
  // rozszerzenia EN/DE (lib/content-ext.js) wchodzą do skrótu, więc zmieniają datę aktualizacji strony
  const ext = (l, k, d) => (extOf(l, k) ? { ...d, ext: extOf(l, k) } : d);
  for (const [l, x] of Object.entries(PROF_LANGS)) for (const [s, d] of Object.entries(x.prof)) out.push([`${l}/${x.seg}/${d.slugLang}`, 'prof', s, l, ext(l, `prof:${s}`, d)]);
  for (const [l, x] of Object.entries(ART_LANGS)) for (const [s, d] of Object.entries(x.data)) out.push([`${l}/${x.seg}/${d.slugLang}`, 'art', s, l, ext(l, `article:${s}`, d)]);
  for (const t of Object.values(TEMPLATES)) {
    out.push([`wzor-cv/${t.slug}`, 'tpl', t.slug, 'pl', { name: t.name, nameIn: t.nameIn, cv: t.cv }]);
    out.push([`list-motywacyjny/${t.slug}`, 'tpl', t.slug, 'pl', { name: t.name, nameIn: t.nameIn, letter: t.letter, sample: t.cv.sample }]);
  }
  for (const e of EMPLOYERS) out.push([`praca-w/${e.slug}`, 'emp', e.slug, 'pl', e]);
  for (const x of OFFICIAL) out.push([x.slug, 'guide', x.slug, 'pl', x]);
  for (const x of PORTALS) out.push([portalPath(x.slug), 'guide', x.slug, 'pl', x]);
  return out;
}
