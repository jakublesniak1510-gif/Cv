// Szablon „W układzie Europass” (PDF: lib/pdf.js, podgląd: public/app.js – te same wyrażenia, pilnuje test/europass.test.js):
// kolejność sekcji jak w Europass CV, umiejętności cyfrowe i prawo jazdy wydzielone z umiejętności i certyfikatów klienta.
// Bez logo UE i bez sugerowania, że to oficjalny dokument: dopisek EU_NOTE na końcu dokumentu.
export const DIGITAL = /(^|[^\p{L}])(excel|word|powerpoint|outlook|ms office|microsoft office|office 365|pakiet office|google (docs|sheets|workspace)|sap|wms|erp|crm|photoshop|canva|autocad|python|javascript|sql|html|css|jira|power bi|tableau|wordpress|figma|salesforce|subiekt|optima|symfonia|płatnik|enova|comarch|windows|linux|komputer\p{L}*|computer|programowani\p{L}*|programming)(?![\p{L}])/iu;
export const DRIVING = /prawo jazdy|prawa jazdy|driving licen[cs]e|führerschein|fahrerlaubnis|водійськ|посвідчення водія|permis de conduire|permiso de conducir|carnet de conducir|(^|[^\p{L}])kat\.?\s?[ABCDET](\+E)?(?![\p{L}])/iu;
export function splitEuropass(c = {}) {
  const skills = c.skills || [], certs = c.certificates || [];
  return {
    digital: skills.filter((s) => DIGITAL.test(s) && !DRIVING.test(s)),
    skills: skills.filter((s) => !DIGITAL.test(s) && !DRIVING.test(s)),
    driving: [...skills, ...certs].filter((s) => DRIVING.test(s)),
    certs: certs.filter((s) => !DRIVING.test(s)),
  };
}
export const EU_LBL = {
  pl: { digital: 'Umiejętności cyfrowe', driving: 'Prawo jazdy', note: 'Układ zgodny z Europass, przygotowany w cvpodogloszenie.pl. To nie jest oficjalny dokument Europass.' },
  en: { digital: 'Digital skills', driving: 'Driving licence', note: 'Layout based on the Europass CV, prepared at cvpodogloszenie.pl. This is not an official Europass document.' },
  de: { digital: 'Digitale Kompetenzen', driving: 'Führerschein', note: 'Aufbau nach dem Europass-Lebenslauf, erstellt auf cvpodogloszenie.pl. Dies ist kein offizielles Europass-Dokument.' },
  uk: { digital: 'Цифрові навички', driving: 'Посвідчення водія', note: 'Структура відповідає Europass, підготовлено на cvpodogloszenie.pl. Це не офіційний документ Europass.' },
  es: { digital: 'Competencias digitales', driving: 'Permiso de conducir', note: 'Formato basado en el CV Europass, preparado en cvpodogloszenie.pl. No es un documento oficial de Europass.' },
  fr: { digital: 'Compétences numériques', driving: 'Permis de conduire', note: 'Mise en page conforme à Europass, préparée sur cvpodogloszenie.pl. Ce n’est pas un document officiel Europass.' },
};
