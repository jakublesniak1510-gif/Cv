// Stanowisko z treści ogłoszenia (C6): pierwsza sensowna linia, bez „Ogłoszenie:”, „Oferta pracy:”, nazw portali i „Szukamy…”,
// najwyżej 60 znaków. Ta sama funkcja jest w public/app.js (kreator wypełnia pole, serwer uzupełnia puste stanowisko w zamówieniu).
export function guessTitle(text) {
  const PORTALS = /\b(?:pracuj\.pl|olx praca|olx(?:\.pl)?|indeed(?:\.com)?|linkedin|jooble|gowork(?:\.pl)?|aplikuj\.pl|praca\.pl|infopraca(?:\.pl)?|nofluffjobs|justjoin\.it|theprotocol\.it|facebook)\b/gi;
  const PREFIX = /^(?:ogłoszenie|oferta pracy|oferta|praca|stanowisko|nazwa stanowiska|job title|position|stelle)\s*[:–-]\s*/i;
  for (const raw of String(text || '').split(/\r?\n/)) {
    let line = raw.replace(PORTALS, '').replace(/^[\s|•·:–-]+|[\s|•·:–-]+$/g, '').replace(PREFIX, '').replace(/^(?:poszukujemy|szukamy|zatrudnimy|zatrudni[mę]?|zatrudni)\s+/i, '').trim();
    line = line.split(/[.!?](?=\s+\p{Lu}\p{Ll})|[.!?]$/u)[0].trim(); // koniec zdania, nie skrót („ds. obsługi”, „kat. C”)
    if (line.length >= 3 && /\p{L}{2}/u.test(line)) return (line.charAt(0).toUpperCase() + line.slice(1)).slice(0, 60).trim();
  }
  return '';
}
