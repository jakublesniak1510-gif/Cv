// Pracodawcy (strony /praca-w/<slug>): dane z oficjalnych stron kariery (data/seo/pracodawcy.json, aktualizuje koordynator)
// + treści redakcyjne (lib/employers-content.js: odmiana „w Lidlu”, branża, zawody, wstęp, wskazówki do CV, FAQ).
// Moduł bez zależności od seo.js, żeby strony zawodów mogły linkować do pracodawców bez cyklu importów.
import fs from 'node:fs';
import { logEvent } from './events.js';
import { EMPLOYER_EXTRA } from './employers-content.js';

// data/seo jest w obrazie Dockera dzięki wyjątkowi „!data/seo” w .dockerignore (test/dockerignore.test.js). Błąd pliku nie zatrzymuje serwera.
const RAW = (() => { try { return JSON.parse(fs.readFileSync(new URL('../data/seo/pracodawcy.json', import.meta.url), 'utf8')); } catch (e) { console.error('Pracodawcy: nie wczytano data/seo/pracodawcy.json –', e.message); Promise.resolve(logEvent('dane', `Pracodawcy: nie wczytano data/seo/pracodawcy.json – ${e.message}`)).catch(() => {}); return []; } })();
// Firma trafia na stronę tylko z treścią redakcyjną (bez niej strona byłaby za cienka).
export const EMPLOYERS = RAW.filter((e) => /^[a-z0-9-]+$/.test(e.slug) && EMPLOYER_EXTRA[e.slug]).map((e) => ({ ...e, ...EMPLOYER_EXTRA[e.slug] }));
export const EMPLOYER_BY = Object.fromEntries(EMPLOYERS.map((e) => [e.slug, e]));
export const EMPLOYER_URLS = ['praca-w', ...EMPLOYERS.map((e) => `praca-w/${e.slug}`)];
// Strona zawodu → pracodawcy, u których ten zawód jest typowy (np. kasjer → Lidl, Biedronka, Żabka…).
export const employersFor = (profSlug) => EMPLOYERS.filter((e) => (e.zawody || []).includes(profSlug));
