// Sprawdzenie CV bez ogłoszenia („Sprawdź CV”, „Test CV pod ATS”): tylko to, co da się ocenić z samego tekstu odczytanego
// z pliku – długość, rozpoznane sekcje, dane kontaktowe, daty, klauzula RODO i typowe problemy z odczytem.
// Bez AI i bez zapisywania: tekst wraca do przeglądarki (test kopiowania) i nigdzie nie zostaje.
const SECTIONS = [
  ['summary', /^(podsumowanie|profil( zawodowy)?|o mnie|summary|profile|about me|profil|kurzprofil|про мене|профіль)\b/i],
  ['experience', /^(doświadczenie( zawodowe)?|historia zatrudnienia|przebieg pracy|experience|work experience|employment( history)?|berufserfahrung|beruflicher werdegang|досвід( роботи)?)\b/i],
  ['education', /^(wykształcenie|edukacja|education|ausbildung|bildung|освіта)\b/i],
  ['skills', /^(umiejętności|kompetencje|skills|kenntnisse|fähigkeiten|навички|вміння)\b/i],
  ['languages', /^(języki( obce)?|znajomość języków|languages|sprachen|sprachkenntnisse|мови|знання мов)\b/i],
];
const ICONS = /[☀-➿\u{1F300}-\u{1FAFF}-★☆●○◆◇■□▪▫]/gu;
const DATE = /\b((0?[1-9]|1[0-2])[./](19|20)\d\d|(19|20)\d\d\s?[-–]\s?((19|20)\d\d|obecnie|nadal|teraz|present|now|heute|dato|досі|тепер))\b/gi;

export function checkCv(text, fileSize = 0) {
  const t = String(text || ''), lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
  const words = (t.match(/[\p{L}\d][\p{L}\d'’-]*/gu) || []).length;
  const heads = lines.filter((l) => l.length <= 40).map((l) => l.replace(/[:•\-–|]+$/, '').trim());
  const sections = SECTIONS.map(([key, re]) => ({ key, found: heads.some((h) => re.test(h)) }));
  const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(t), phone = /(\+?\d{2}[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/.test(t);
  const rodo = /RODO|przetwarzanie moich danych|Rozporządzenia \(UE\) 2016\/679|2016\/679/i.test(t);
  const dates = (t.match(DATE) || []).length, icons = (t.match(ICONS) || []).length;
  const short = lines.length ? lines.filter((l) => l.split(/\s+/).length <= 2).length / lines.length : 0;
  const issues = [];
  if (fileSize > 150e3 && t.length < fileSize / 400) issues.push('little_text'); // dużo bajtów, mało tekstu: skan lub obrazki
  if (lines.length >= 20 && short > 0.45) issues.push('columns');
  if (!email) issues.push('no_email');
  if (!phone) issues.push('no_phone');
  if (icons >= 3) issues.push('icons');
  if (!sections.find((s) => s.key === 'experience').found) issues.push('no_experience');
  if (dates < 2) issues.push('few_dates');
  if (words < 150) issues.push('too_short');
  if (words > 1400) issues.push('too_long');
  return { words, sections, email, phone, rodo, dates, issues, text: t.slice(0, 20000) };
}
