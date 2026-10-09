import { PROFESSIONS } from './content.js';
import { PROF_LANGS } from './professions-i18n.js';
import { renderCv } from './pdf.js';
import { cleanDesign } from './designs.js';

// Darmowe przykładowe CV w PDF (fikcyjna osoba, znak wodny na każdej stronie), w języku strony.
const WATERMARK = { pl: 'PRZYKŁAD', en: 'SAMPLE', uk: 'ЗРАЗОК', de: 'MUSTER' };
const CLAUSE = {
  pl: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.',
  en: 'I hereby consent to the processing of my personal data for the purposes of the recruitment process in accordance with Art. 6(1)(a) of Regulation (EU) 2016/679 (GDPR).',
  uk: 'Я даю згоду на обробку моїх персональних даних для цілей процесу рекрутингу відповідно до ст. 6 ч. 1 п. a Регламенту (ЄС) 2016/679 (GDPR).',
  de: 'Ich willige in die Verarbeitung meiner personenbezogenen Daten für die Zwecke des Bewerbungsverfahrens gemäß Art. 6 Abs. 1 lit. a der Verordnung (EU) 2016/679 (DSGVO) ein.',
};
const cache = new Map();
export async function samplePdf(lang, design) {
  const l = WATERMARK[lang] ? lang : 'pl', d = cleanDesign(design), key = `${l}|${d.tpl}|${d.color}`;
  if (cache.has(key)) return cache.get(key);
  const base = PROFESSIONS.find((x) => x.slug === 'kasjer'), p = l === 'pl' ? base : { ...base, ...PROF_LANGS[l].prof.kasjer }, s = p.sample;
  const cv = { name: s.name, headline: s.headline, contact: s.contact, summary: s.summary, experience: s.jobs.map((j) => ({ title: j.title, company: j.company, period: j.period, bullets: j.bullets })),
    education: [s.education], skills: s.skills, languages: s.languages || [], certificates: [], interests: '', clause: CLAUSE[l] };
  const buf = await renderCv({ lang: l, cv }, d, '', WATERMARK[l]);
  if (cache.size > 300) cache.clear();
  cache.set(key, buf);
  return buf;
}
