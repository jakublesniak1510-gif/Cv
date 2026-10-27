import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType, TabStopType, VerticalAlign, TableLayoutType } from 'docx';

// Szablony premium Word (D2, 27.10): 10 edytowalnych szablonów CV w DOCX, każdy z innym układem. W polach są podpowiedzi
// (co wpisać), nie fikcyjna osoba – klient nadpisuje je swoimi danymi. Układy proste dla systemów ATS: tekst w akapitach
// i tabelach, bez pól tekstowych i obrazków. Pakiet: ZIP z 10 plikami i instrukcją (pkg → zip po płatności).
const CLAUSE = 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.';
const S = {
  name: 'Imię Nazwisko',
  role: 'Stanowisko, o które się ubiegasz',
  contact: ['+48 600 000 000', 'imie.nazwisko@email.pl', 'Miasto', 'linkedin.com/in/twoj-profil'],
  summary: 'Napisz 2–3 zdania: kim jesteś zawodowo, ile masz doświadczenia i co dasz pracodawcy. Użyj słów z ogłoszenia, na które odpowiadasz.',
  exp: [
    { title: 'Stanowisko', company: 'Nazwa firmy, miasto', period: 'MM.RRRR – obecnie', bullets: ['Najważniejszy obowiązek – opisz go słowami z ogłoszenia.', 'Osiągnięcie z efektem: co zrobiłeś(-aś) i co z tego wyszło (liczby, jeśli je znasz).', 'Program, maszyna albo narzędzie, którego używasz na co dzień.'] },
    { title: 'Poprzednie stanowisko', company: 'Nazwa firmy, miasto', period: 'MM.RRRR – MM.RRRR', bullets: ['Obowiązek związany z ogłoszeniem.', 'Krótko: za co odpowiadałeś(-aś) i z jakim skutkiem.'] },
  ],
  edu: [{ school: 'Nazwa szkoły lub uczelni', degree: 'Kierunek, tytuł lub zawód', period: 'RRRR – RRRR' }],
  skills: ['Umiejętność z ogłoszenia', 'Program lub narzędzie', 'Uprawnienie lub prawo jazdy', 'Umiejętność miękka (z przykładem w doświadczeniu)'],
  langs: ['Angielski – B2', 'Niemiecki – A2'],
  certs: ['Nazwa kursu lub certyfikatu – organizator, RRRR'],
};

// Pomocnicze: tekst, akapit, nagłówki sekcji, tabela bez obramowań.
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const mk = (font, size) => {
  const r = (text, o = {}) => new TextRun({ text: String(text ?? ''), font, size, ...o });
  const p = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: 80 }, ...o });
  const bullet = (t, o = {}) => new Paragraph({ children: [r(t, o)], bullet: { level: 0 }, spacing: { after: 40 } });
  return { r, p, bullet };
};
const cell = (children, o = {}) => new TableCell({ children, margins: { top: 120, bottom: 120, left: 160, right: 160 }, ...o });
const table = (rows, widths) => new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: noBorders });
const shade = (fill) => ({ shading: { type: ShadingType.CLEAR, color: 'auto', fill } });
const rightTab = [{ type: TabStopType.RIGHT, position: 9600 }];

// Wspólne bloki treści (z różnymi nagłówkami i stylem) – każdy szablon składa je po swojemu.
function blocks(f, { acc, head, compact = false, tab = rightTab }) {
  const { r, p, bullet } = f;
  const job = (e) => [
    new Paragraph({ children: [r(e.title, { bold: true }), r(`, ${e.company}`), r(`\t${e.period}`, { color: '6B7280' })], tabStops: tab, spacing: { before: compact ? 60 : 140, after: 40 } }),
    ...e.bullets.map((b) => bullet(b)),
  ];
  return {
    summary: () => [head('Podsumowanie zawodowe'), p(r(S.summary))],
    exp: (list = S.exp) => [head('Doświadczenie zawodowe'), ...list.flatMap(job)],
    edu: () => [head('Wykształcenie'), ...S.edu.map((e) => new Paragraph({ children: [r(e.school, { bold: true }), r(`, ${e.degree}`), r(`\t${e.period}`, { color: '6B7280' })], tabStops: tab, spacing: { after: 60 } }))],
    skills: () => [head('Umiejętności'), ...S.skills.map((s) => bullet(s))],
    langs: () => [head('Języki obce'), ...S.langs.map((s) => p(r(s)))],
    certs: () => [head('Kursy i certyfikaty'), ...S.certs.map((s) => bullet(s))],
    clause: () => [p(r(CLAUSE, { size: 15, color: '6B7280', italics: true }), { spacing: { before: 360 } })],
    acc,
  };
}
const headRule = (f, acc, o = {}) => (t) => new Paragraph({ children: [f.r(t.toUpperCase(), { bold: true, color: acc, characterSpacing: 20, size: o.size || 20 })], spacing: { before: o.before ?? 260, after: 100 }, border: o.rule === false ? undefined : { bottom: { style: BorderStyle.SINGLE, size: 6, color: o.ruleColor || acc, space: 2 } } });

// 10 szablonów: slug, nazwa, opis (strona sprzedaży), budowa dokumentu.
export const PREMIUM = [
  {
    slug: 'nowoczesny-pasek', name: 'Nowoczesny z paskiem bocznym', desc: 'Kontakt, umiejętności i języki w kolorowym pasku po lewej, doświadczenie po prawej. Dobry do większości ofert biurowych i handlowych.',
    build() {
      const f = mk('Calibri', 21), acc = '2548E8', B = blocks(f, { acc, head: headRule(f, acc), tab: [{ type: TabStopType.RIGHT, position: 6300 }] });
      const side = (t) => new Paragraph({ children: [f.r(t.toUpperCase(), { bold: true, color: acc, size: 18, characterSpacing: 20 })], spacing: { before: 240, after: 80 } });
      const left = [f.p(f.r(S.name, { bold: true, size: 34 }), { spacing: { after: 40 } }), f.p(f.r(S.role, { color: acc, size: 22 })),
        side('Kontakt'), ...S.contact.map((c) => f.p(f.r(c, { size: 19 }))), side('Umiejętności'), ...S.skills.map((s) => f.bullet(s, { size: 19 })),
        side('Języki'), ...S.langs.map((s) => f.p(f.r(s, { size: 19 }))), side('Certyfikaty'), ...S.certs.map((s) => f.p(f.r(s, { size: 19 })))];
      const right = [...B.summary(), ...B.exp(), ...B.edu(), ...B.clause()];
      return [table([new TableRow({ children: [cell(left, { width: { size: 32, type: WidthType.PERCENTAGE }, ...shade('EEF2FF') }), cell(right, { width: { size: 68, type: WidthType.PERCENTAGE } })] })], [3300, 7000])];
    },
  },
  {
    slug: 'klasyczny', name: 'Klasyczny', desc: 'Wyśrodkowane imię i dane kontaktowe, szeryfowa czcionka, cienkie linie. Do administracji, finansów, prawa i urzędów.',
    build() {
      const f = mk('Cambria', 22), acc = '1E3A5F', B = blocks(f, { acc, head: headRule(f, acc, { ruleColor: '9CA3AF' }) });
      return [f.p(f.r(S.name, { bold: true, size: 40, color: acc }), { alignment: AlignmentType.CENTER, spacing: { after: 40 } }), f.p(f.r(S.role, { italics: true, size: 24 }), { alignment: AlignmentType.CENTER }),
        f.p(f.r(S.contact.join('  ·  '), { size: 19, color: '4B5563' }), { alignment: AlignmentType.CENTER, spacing: { after: 160 } }),
        ...B.summary(), ...B.exp(), ...B.edu(), ...B.skills(), ...B.langs(), ...B.certs(), ...B.clause()];
    },
  },
  {
    slug: 'minimalistyczny', name: 'Minimalistyczny', desc: 'Dużo światła, szare nagłówki bez linii i kolorów. Czytelny na ekranie i po wydruku, dobrze przechodzi przez systemy ATS.',
    build() {
      const f = mk('Arial', 20), acc = '374151', B = blocks(f, { acc, head: (t) => new Paragraph({ children: [f.r(t, { bold: true, color: '6B7280', size: 22 })], spacing: { before: 320, after: 120 } }) });
      return [f.p(f.r(S.name, { size: 44 }), { spacing: { after: 20 } }), f.p(f.r(S.role, { color: '6B7280', size: 22 })), f.p(f.r(S.contact.join('   '), { size: 18, color: '6B7280' }), { spacing: { after: 120 } }),
        ...B.summary(), ...B.exp(), ...B.edu(), ...B.skills(), ...B.langs(), ...B.clause()];
    },
  },
  {
    slug: 'kolorowy-naglowek', name: 'Kolorowy nagłówek', desc: 'Imię i kontakt na kolorowym pasie u góry strony. Wyróżnia się w stosie CV, a treść zostaje prosta i czytelna.',
    build() {
      const f = mk('Calibri', 21), acc = '0F766E', B = blocks(f, { acc, head: headRule(f, acc) });
      const top = table([new TableRow({ children: [cell([f.p(f.r(S.name, { bold: true, size: 40, color: 'FFFFFF' }), { spacing: { after: 20 } }), f.p(f.r(S.role, { size: 24, color: 'D1FAE5' })), f.p(f.r(S.contact.join('  •  '), { size: 19, color: 'FFFFFF' }))], { ...shade(acc), margins: { top: 240, bottom: 240, left: 280, right: 280 } })] })], [10300]);
      return [top, ...B.summary(), ...B.exp(), ...B.edu(), ...B.skills(), ...B.langs(), ...B.certs(), ...B.clause()];
    },
  },
  {
    slug: 'kompaktowy', name: 'Kompaktowy – jedna strona', desc: 'Mniejsza czcionka i umiejętności w trzech kolumnach: dużo treści na jednej stronie. Gdy masz bogate doświadczenie, a ogłoszenie prosi o CV na 1 stronę.',
    build() {
      const f = mk('Calibri', 19), acc = '1D4ED8', B = blocks(f, { acc, head: headRule(f, acc, { size: 18, before: 180 }), compact: true });
      const sk = [...S.skills, ...S.langs];
      const grid = table([0, 1].map((row) => new TableRow({ children: [0, 1, 2].map((c) => cell([f.p(f.r(sk[row * 3 + c] ? `• ${sk[row * 3 + c]}` : ''))], { margins: { top: 40, bottom: 40, left: 0, right: 80 } })) })), [3430, 3430, 3430]);
      return [new Paragraph({ children: [f.r(S.name, { bold: true, size: 32 }), f.r(`   ${S.role}`, { color: acc, size: 22 })], spacing: { after: 40 } }), f.p(f.r(S.contact.join('  |  '), { size: 17, color: '4B5563' })),
        ...B.summary(), ...B.exp(), ...B.edu(), new Paragraph({ children: [f.r('UMIEJĘTNOŚCI I JĘZYKI', { bold: true, color: acc, size: 18, characterSpacing: 20 })], spacing: { before: 180, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: acc, space: 2 } } }), grid, ...B.clause()];
    },
  },
  {
    slug: 'menedzer', name: 'Menedżer', desc: 'Ramka „Kluczowe osiągnięcia” na górze, potem doświadczenie. Na stanowiska kierownicze i samodzielne, gdzie liczą się wyniki.',
    build() {
      const f = mk('Georgia', 21), acc = '9F1239', B = blocks(f, { acc, head: headRule(f, acc) });
      const box = table([new TableRow({ children: [cell([f.p(f.r('Kluczowe osiągnięcia', { bold: true, color: acc, size: 22 })), ...['Wynik, za który odpowiadałeś(-aś): o ile, w jakim czasie, dla ilu osób lub klientów.', 'Zespół lub budżet, którym kierowałeś(-aś) – jego wielkość i efekt.', 'Zmiana, którą wprowadziłeś(-aś), i co dzięki niej się poprawiło.'].map((t) => f.bullet(t))], { ...shade('FFF1F2'), borders: { left: { style: BorderStyle.SINGLE, size: 24, color: acc } } })] })], [10300]);
      return [f.p(f.r(S.name, { bold: true, size: 40 }), { spacing: { after: 20 } }), f.p(f.r(S.role, { color: acc, size: 24 })), f.p(f.r(S.contact.join('  ·  '), { size: 19, color: '4B5563' }), { spacing: { after: 200 } }),
        box, ...B.summary(), ...B.exp(), ...B.edu(), ...B.langs(), ...B.certs(), ...B.clause()];
    },
  },
  {
    slug: 'it', name: 'Specjalista IT', desc: 'Tabela technologii (języki, frameworki, bazy, narzędzia) i sekcja projektów z linkami. Do ofert IT, analityki i e-commerce.',
    build() {
      const f = mk('Calibri', 21), acc = '6D28D9', B = blocks(f, { acc, head: headRule(f, acc) });
      const tech = [['Języki programowania', 'np. JavaScript, Python – te z ogłoszenia na początku'], ['Frameworki i biblioteki', 'np. React, Node.js, Django'], ['Bazy danych', 'np. PostgreSQL, MongoDB'], ['Narzędzia i chmura', 'np. Git, Docker, AWS, Jira']];
      const grid = table(tech.map(([k, v], i) => new TableRow({ children: [cell([f.p(f.r(k, { bold: true, size: 19 }))], { width: { size: 32, type: WidthType.PERCENTAGE }, ...shade(i % 2 ? 'FFFFFF' : 'F5F3FF') }), cell([f.p(f.r(v, { font: 'Consolas', size: 19 }))], { ...shade(i % 2 ? 'FFFFFF' : 'F5F3FF') })] })), [3300, 7000]);
      const proj = [new Paragraph({ children: [f.r('Nazwa projektu', { bold: true }), f.r(' – github.com/twoj-login/projekt', { color: acc })], spacing: { before: 120, after: 40 } }), f.bullet('Co robi projekt i jaki problem rozwiązuje (1 zdanie).'), f.bullet('Twoja rola i technologie; wynik, np. czas odpowiedzi, liczba użytkowników.')];
      return [f.p(f.r(S.name, { bold: true, size: 40 }), { spacing: { after: 20 } }), f.p(f.r(S.role, { color: acc, size: 24 })), f.p(f.r([...S.contact.slice(0, 3), 'github.com/twoj-login'].join('  •  '), { size: 19, color: '4B5563' }), { spacing: { after: 120 } }),
        ...B.summary(), headRule(f, acc)('Technologie'), grid, ...B.exp(), headRule(f, acc)('Projekty'), ...proj, ...B.edu(), ...B.langs(), ...B.clause()];
    },
  },
  {
    slug: 'pierwsza-praca', name: 'Pierwsza praca i student', desc: 'Wykształcenie na początku, potem praktyki, projekty i wolontariat. Gdy nie masz jeszcze dużego doświadczenia zawodowego.',
    build() {
      const f = mk('Calibri', 21), acc = '0369A1', B = blocks(f, { acc, head: headRule(f, acc) });
      const prac = [{ title: 'Praktyki, staż albo praca dorywcza', company: 'Nazwa firmy lub organizacji', period: 'MM.RRRR – MM.RRRR', bullets: ['Czego się nauczyłeś(-aś) i co robiłeś(-aś) samodzielnie.', 'Efekt, z którego jesteś zadowolony(-a) – nawet mały.'] }, { title: 'Wolontariat, projekt szkolny albo koło naukowe', company: 'Organizacja', period: 'RRRR', bullets: ['Twoja rola i to, co z niej wynika dla pracodawcy (np. organizacja, kontakt z ludźmi).'] }];
      return [f.p(f.r(S.name, { bold: true, size: 40 }), { spacing: { after: 20 } }), f.p(f.r(S.role, { color: acc, size: 24 })), f.p(f.r(S.contact.join('  •  '), { size: 19, color: '4B5563' }), { spacing: { after: 120 } }),
        ...B.summary(), headRule(f, acc)('Wykształcenie'), ...S.edu.map((e) => f.p([f.r(e.school, { bold: true }), f.r(`, ${e.degree}`), f.r(`\t${e.period}`, { color: '6B7280' })], { tabStops: rightTab })), f.bullet('Przedmioty, praca dyplomowa albo osiągnięcia związane z ofertą.'),
        headRule(f, acc)('Praktyki, projekty i wolontariat'), ...prac.flatMap((e) => [new Paragraph({ children: [f.r(e.title, { bold: true }), f.r(`, ${e.company}`), f.r(`\t${e.period}`, { color: '6B7280' })], tabStops: rightTab, spacing: { before: 120, after: 40 } }), ...e.bullets.map((b) => f.bullet(b))]),
        ...B.skills(), ...B.langs(), headRule(f, acc)('Zainteresowania'), f.p(f.r('2–3 konkretne zainteresowania, najlepiej związane z pracą (np. „montaż filmów na YouTube”, a nie „film”).')), ...B.clause()];
    },
  },
  {
    slug: 'praca-fizyczna', name: 'Praca fizyczna i produkcja', desc: 'Uprawnienia (UDT, SEP, prawo jazdy) i dyspozycyjność na samej górze, krótkie punkty w doświadczeniu. Do magazynu, produkcji, budowy i transportu.',
    build() {
      const f = mk('Calibri', 22), acc = 'C2410C', B = blocks(f, { acc, head: headRule(f, acc) });
      const perm = ['Prawo jazdy kat. B (C, C+E – jeśli masz)', 'Uprawnienia UDT, np. wózki widłowe – numer i data ważności', 'Świadectwo SEP do 1 kV albo inne kwalifikacje', 'Aktualne badania lekarskie (sanepid, jeśli praca z żywnością)'];
      const avail = table([new TableRow({ children: [['Praca zmianowa', 'tak / nie'], ['Nadgodziny i soboty', 'tak / nie'], ['Od kiedy mogę zacząć', 'DD.MM.RRRR']].map(([k, v]) => cell([f.p(f.r(k, { bold: true, size: 19 })), f.p(f.r(v, { size: 19, color: '4B5563' }))], { ...shade('FFF7ED') })) })], [3430, 3430, 3430]);
      return [f.p(f.r(S.name, { bold: true, size: 40 }), { spacing: { after: 20 } }), f.p(f.r(S.role, { color: acc, size: 24 })), f.p(f.r(S.contact.slice(0, 3).join('  •  '), { size: 20, color: '4B5563' }), { spacing: { after: 120 } }),
        headRule(f, acc)('Uprawnienia i kwalifikacje'), ...perm.map((t) => f.bullet(t)), headRule(f, acc)('Dyspozycyjność'), avail,
        ...B.exp([{ ...S.exp[0], bullets: ['Co robiłeś(-aś): np. kompletacja zamówień skanerem, obsługa maszyny, załadunek.', 'Wynik albo norma: np. „ok. 120 zamówień na zmianę, bez reklamacji”.'] }, { ...S.exp[1], bullets: ['Najważniejsze zadania w 1–2 punktach.'] }]),
        ...B.edu(), ...B.langs(), ...B.clause()];
    },
  },
  {
    slug: 'europejski', name: 'Europejski – daty po lewej', desc: 'Daty w lewej kolumnie, opis w prawej i miejsce na zdjęcie przy nagłówku – układ tabelaryczny, jak w CV Europass i niemieckim Lebenslauf.',
    build() {
      const f = mk('Calibri', 21), acc = '1E3A5F', B = blocks(f, { acc, head: headRule(f, acc) });
      const rowOf = (left, right) => new TableRow({ children: [cell([f.p(f.r(left, { color: '4B5563', size: 19 }))], { width: { size: 24, type: WidthType.PERCENTAGE } }), cell(right, { width: { size: 76, type: WidthType.PERCENTAGE } })] });
      const head = table([new TableRow({ children: [cell([f.p(f.r(S.name, { bold: true, size: 40, color: acc }), { spacing: { after: 20 } }), f.p(f.r(S.role, { size: 24 })), ...S.contact.map((c) => f.p(f.r(c, { size: 19, color: '4B5563' })))], { width: { size: 76, type: WidthType.PERCENTAGE } }),
        cell([f.p(f.r('Miejsce na zdjęcie (opcjonalnie). Wstaw: Wstawianie → Obrazy.', { size: 16, color: '9CA3AF', italics: true }), { alignment: AlignmentType.CENTER })], { width: { size: 24, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.DASHED, size: 6, color: '9CA3AF' }, bottom: { style: BorderStyle.DASHED, size: 6, color: '9CA3AF' }, left: { style: BorderStyle.DASHED, size: 6, color: '9CA3AF' }, right: { style: BorderStyle.DASHED, size: 6, color: '9CA3AF' } } })] })], [7830, 2470]);
      const exp = table(S.exp.map((e) => rowOf(e.period, [f.p([f.r(e.title, { bold: true }), f.r(`, ${e.company}`)]), ...e.bullets.map((b) => f.bullet(b))])), [2470, 7830]);
      const edu = table(S.edu.map((e) => rowOf(e.period, [f.p([f.r(e.school, { bold: true }), f.r(`, ${e.degree}`)])])), [2470, 7830]);
      const more = table([rowOf('Umiejętności', [f.p(f.r(S.skills.join(', ')))]), rowOf('Języki', [f.p(f.r(S.langs.join(', ')))]), rowOf('Certyfikaty', S.certs.map((c) => f.p(f.r(c))))], [2470, 7830]);
      return [head, ...B.summary(), headRule(f, acc)('Doświadczenie zawodowe'), exp, headRule(f, acc)('Wykształcenie'), edu, headRule(f, acc)('Umiejętności i języki'), more, ...B.clause()];
    },
  },
];

export const premiumFile = (t, i) => `${String(i + 1).padStart(2, '0')}-szablon-cv-${t.slug}.docx`;
export async function premiumDocx(t) {
  const d = new Document({
    creator: 'CV Pod Ogłoszenie', title: `Szablon CV – ${t.name}`, description: 'Szablon CV do edycji w Word, LibreOffice albo Google Docs. cvpodogloszenie.pl',
    sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 950, right: 950 } } }, children: t.build() }],
  });
  return Packer.toBuffer(d);
}
const README = `Szablony CV premium – CV Pod Ogłoszenie (cvpodogloszenie.pl)

W paczce jest 10 szablonów CV w formacie Word (DOCX). Otworzysz je w Microsoft Word, LibreOffice, Pages albo Google Docs.

Jak korzystać:
1. Wybierz układ pasujący do oferty (opisy na stronie cvpodogloszenie.pl/szablony-premium).
2. Zastąp tekst w polach swoimi danymi. Podpowiedzi w nawiasach i zdania „Opisz…” usuń.
3. Słowa kluczowe z ogłoszenia wpisz w podsumowaniu, doświadczeniu i umiejętnościach.
4. Zapisz CV jako PDF (Plik → Zapisz jako → PDF) i wyślij pracodawcy.
5. Klauzulę RODO na dole zostaw albo usuń – zależnie od ogłoszenia.

Szablony są do Twojego użytku przy szukaniu pracy. Nie wolno ich odsprzedawać ani udostępniać innym w całości.
CV dopasowane do konkretnego ogłoszenia przygotujemy na cvpodogloszenie.pl.
`;
export const PREMIUM_ZIP = 'szablony-cv-premium.zip';
export async function premiumZip() {
  const zip = new JSZip();
  for (const [i, t] of PREMIUM.entries()) zip.file(premiumFile(t, i), await premiumDocx(t));
  zip.file('Jak-korzystac.txt', README);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
