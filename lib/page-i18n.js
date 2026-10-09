// Zdania na stronach „zawód w mieście” w językach EN / UA / DE (wzory z polami {name}, {low}, {loc}, {gen}, {city}, {near}).
// Serwer składa z nich strony dla wyszukiwarek, a przeglądarka dostaje je razem z tłumaczeniem zawodów.
export const PAGE_T = {
  en: {
    title: '{name} {loc}: a CV for local job ads', desc: 'How to write a {low} CV for jobs {loc}: keywords from job ads, tips for the {gen} job market and a sample CV. A CV tailored to the job ad from 39 zł.',
    seek: 'Looking for a job as a {low} {loc}?', market: 'Tips for the {gen} job market', near: 'When looking for jobs, also check nearby towns: {near}. If you can commute, say so in your CV.',
    cta: 'Have a job ad {loc}?', otherCities: '{name} in other cities', otherProf: 'Other jobs {loc}', side: 'CV: {name}, {city}', inCity: '{name} in your city',
    kwPl: 'Under each keyword you will find the Polish wording used in job ads in Poland.',
  },
  uk: {
    title: '{name} {loc}: резюме під місцеві вакансії', desc: 'Як написати резюме на посаду «{name}» {loc}: ключові слова з оголошень, поради для ринку праці {gen} і приклад резюме. Резюме під оголошення від 39 zł.',
    seek: 'Шукаєте роботу на посаді «{name}» {loc}?', market: 'Поради для ринку праці {gen}', near: 'Шукаючи вакансії, перевірте також околиці: {near}. Якщо можете доїжджати, напишіть це в резюме.',
    cta: 'Маєте оголошення {loc}?', otherCities: '{name} в інших містах', otherProf: 'Інші професії {loc}', side: 'Резюме: {name}, {city}', inCity: '{name} у вашому місті',
    kwPl: 'Під кожним ключовим словом – польське формулювання, як в оголошеннях у Польщі.',
  },
  de: {
    title: '{name} {loc}: Lebenslauf für lokale Stellenanzeigen', desc: 'So schreiben Sie einen Lebenslauf als {name} {loc}: Schlüsselwörter aus Stellenanzeigen, Tipps für den Arbeitsmarkt in {gen} und ein Musterlebenslauf. Lebenslauf passend zur Anzeige ab 39 zł.',
    seek: 'Sie suchen eine Stelle als {name} {loc}?', market: 'Tipps für den Arbeitsmarkt in {gen}', near: 'Prüfen Sie bei der Suche auch die Umgebung: {near}. Wenn Sie pendeln können, schreiben Sie das in den Lebenslauf.',
    cta: 'Sie haben eine Stellenanzeige {loc}?', otherCities: '{name} in anderen Städten', otherProf: 'Weitere Berufe {loc}', side: 'Lebenslauf: {name}, {city}', inCity: '{name} in Ihrer Stadt',
    kwPl: 'Unter jedem Begriff steht die polnische Formulierung aus Stellenanzeigen in Polen.',
  },
};
export const fillT = (s, p, c) => s.replace(/\{(\w+)\}/g, (_, k) => ({ name: p?.name, low: p?.name?.toLowerCase(), loc: c?.loc, gen: c?.gen, city: c?.name, near: (c?.near || []).join(', ') })[k] ?? '');
