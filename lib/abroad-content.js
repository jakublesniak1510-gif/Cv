// Treści stron „Polacy za granicą” (/cv-po-niemiecku, /praca-w-niemczech-cv, /cv-po-angielsku, /praca-w-uk-cv,
// /praca-w-holandii-cv, /praca-w-irlandii-cv). Renderuje lib/abroad.js. lang = język dokumentów ustawiany w kreatorze (?jezyk=).
// Zasady: fakty ostrożnie („zwykle”, „często”), bez kwot, procentów i obietnic zatrudnienia; sprawdza test/abroad.test.js.
export const ABROAD = [
  {
    slug: 'praca-w-niemczech-cv', lang: 'de', name: 'Praca w Niemczech', short: false,
    title: 'CV do pracy w Niemczech: jak przygotować Bewerbung',
    seoTitle: 'Praca w Niemczech: CV, Anschreiben i załączniki',
    metaDescription: 'Jak przygotować aplikację do pracy w Niemczech: Lebenslauf, Anschreiben, Zeugnisse w załącznikach, zdjęcie, uznawanie kwalifikacji i poziom niemieckiego.',
    intro: 'Niemiecki rekruter rzadko ocenia samo CV. Zwykle dostaje komplet: Lebenslauf, list motywacyjny i załączniki z dokumentami. Poniżej opisujemy, jak taki komplet wygląda dziś, które zwyczaje są nadal żywe, a które stały się opcjonalne, i co sprawdzić, zanim wyślesz pierwszą aplikację z Polski.',
    sections: [
      { h: 'Z czego składa się niemiecka aplikacja (Bewerbung)', p: [
        'W Niemczech mówi się o Bewerbung, czyli o całej aplikacji, a nie tylko o CV. Klasyczny komplet to Anschreiben (list motywacyjny), Lebenslauf (CV) oraz Anlagen, czyli załączniki: świadectwa, dyplomy, opinie z pracy i certyfikaty. Dawniej wysyłano to w papierowej teczce nazywanej Bewerbungsmappe, dziś niemal zawsze przez formularz na stronie firmy albo e-mailem, ale kolejność dokumentów została podobna.',
        'Coraz więcej firm, zwłaszcza dużych i międzynarodowych, przyjmuje aplikacje przez portal kandydata, gdzie wgrywasz osobno CV i załączniki. Część ogłoszeń wprost pisze, że list motywacyjny nie jest potrzebny. Zanim zaczniesz, przeczytaj sekcję ogłoszenia zatytułowaną zwykle „Ihre Bewerbung” albo „So bewerben Sie sich” i dostosuj komplet do tego, o co prosi pracodawca.'
      ] },
      { h: 'Lebenslauf: układ tabelaryczny i długość', p: [
        'Standardem jest tabellarischer Lebenslauf: po lewej stronie okresy, po prawej stanowisko, firma, miejscowość i kilka punktów o obowiązkach. Najnowsze doświadczenie wpisuje się na górze. Przy kilku latach pracy Lebenslauf ma zwykle jedną lub dwie strony, a dłuższy dokument rekruter odbiera jako brak selekcji.',
        'Niemieccy rekruterzy zwracają uwagę na ciągłość. Dłuższe przerwy lepiej krótko opisać, na przykład „Elternzeit”, „Weiterbildung” albo „Arbeitssuche”, niż zostawić bez słowa. Pod każdym stanowiskiem wystarczą trzy do pięciu konkretnych punktów, najlepiej takich, które odpowiadają wymaganiom z ogłoszenia.'
      ], list: ['Persönliche Daten: imię i nazwisko, adres, telefon, e-mail', 'Berufserfahrung: doświadczenie od najnowszego', 'Ausbildung: szkoły i studia', 'Weiterbildung: kursy i szkolenia', 'Sprachkenntnisse: języki z poziomem', 'EDV-Kenntnisse: programy i systemy', 'Führerschein: kategorie prawa jazdy, jeśli są ważne dla stanowiska'] },
      { h: 'Zdjęcie, data urodzenia i podpis: zwyczaj, a nie obowiązek', p: [
        'Zdjęcie w Lebenslauf jest w Niemczech nadal często spotykane, ale nie jest wymagane prawem. Ustawa o równym traktowaniu (AGG) chroni kandydatów przed dyskryminacją, dlatego pracodawca nie powinien uzależniać rozpatrzenia aplikacji od zdjęcia, a niektóre firmy same proszą o dokumenty bez niego. Jeśli dodajesz zdjęcie, niech będzie aktualne, portretowe i wykonane w spokojnym świetle.',
        'Podobnie jest z datą urodzenia, stanem cywilnym i obywatelstwem. Wielu kandydatów nadal je podaje, ale nie musisz. Przy przeprowadzce z Polski przydatne bywa krótkie zdanie o prawie do pracy: jako obywatel UE możesz pracować w Niemczech bez osobnego zezwolenia.',
        'Na dole Lebenslauf tradycyjnie umieszcza się miejscowość, datę i podpis, na przykład „Wrocław, 05.10.2026”. W aplikacjach wysyłanych online ten element jest dziś opcjonalny i wiele osób go pomija. Jeśli go dodajesz, pilnuj, żeby data była aktualna przy każdej wysyłce.'
      ] },
      { h: 'Anschreiben: list pod konkretne ogłoszenie', p: [
        'Anschreiben ma zwykle jedną stronę i odnosi się do jednej oferty. W nagłówku są Twoje dane, adres firmy, miejscowość z datą i temat (Betreff) z nazwą stanowiska. Jeśli w ogłoszeniu jest nazwisko osoby kontaktowej, zwróć się do niej imiennie.',
        'W treści pokaż dwa lub trzy powody, dla których pasujesz do stanowiska, i odnieś je do wymagań z ogłoszenia. Kandydaci z Polski powinni też napisać, od kiedy mogą zacząć pracę i czy przeprowadzka jest już zaplanowana, bo to jedno z pierwszych pytań, jakie pada przy aplikacjach z zagranicy.'
      ] },
      { h: 'Załączniki: Zeugnisse, Arbeitszeugnisse i certyfikaty', p: [
        'W Anlagen umieszcza się kopie dokumentów, które potwierdzają to, co piszesz w CV: świadectwo dojrzałości, dyplom, świadectwa zawodowe, certyfikaty językowe i kursy. Arbeitszeugnis to niemiecka opisowa opinia od pracodawcy. Polskie świadectwo pracy nie zawiera oceny, więc dobrym uzupełnieniem bywa referencja od przełożonego.',
        'Polskie dokumenty warto dołączyć w tłumaczeniu na niemiecki. Przy zwykłej rekrutacji często wystarcza tłumaczenie zwykłe, a tłumaczenie przysięgłe bywa potrzebne przy uznawaniu kwalifikacji lub na prośbę pracodawcy. Wszystkie załączniki najlepiej połączyć w jeden plik PDF w kolejności: list, CV, świadectwa pracy, dyplomy, certyfikaty.'
      ] },
      { h: 'Uznawanie kwalifikacji (Anerkennung)', p: [
        'W zawodach regulowanych, takich jak pielęgniarka, lekarz, nauczyciel, wychowawca czy niektóre zawody rzemieślnicze, do pracy na danym stanowisku potrzebne jest formalne uznanie kwalifikacji. Dla dyplomów z krajów UE procedura jest zwykle prostsza, ale nadal trzeba złożyć wniosek we właściwym urzędzie.',
        'Na portalu anerkennung-in-deutschland.de znajdziesz wyszukiwarkę, która pokazuje, czy Twój zawód jest regulowany i który urząd się nim zajmuje. W zawodach nieregulowanych uznanie nie jest wymagane, ale ocena dyplomu może ułatwić pracodawcy zrozumienie Twojego wykształcenia. W CV możesz dopisać, że wniosek o uznanie jest złożony lub w toku.'
      ] },
      { h: 'Język niemiecki w CV: poziomy według GER', p: [
        'Poziom języka opisuj według europejskiej skali, którą w Niemczech nazywa się GER (A1–C2), na przykład „Deutsch – B1 (GER)”. Jeśli masz certyfikat, na przykład Goethe-Zertifikat albo telc, dopisz jego nazwę. Ogólne określenia typu „gut” lub „fließend” bez poziomu mówią rekruterowi niewiele.',
        'Nie zawyżaj poziomu. Rozmowa telefoniczna często odbywa się po niemiecku i szybko pokazuje różnicę między B1 a C1. Jeśli uczysz się intensywnie, napisz to wprost, na przykład „Deutschkurs B2, Abschluss voraussichtlich 03/2027”.'
      ] },
      { h: 'Wysyłka i sprawy formalne', p: [
        'Oferty znajdziesz między innymi w wyszukiwarce Bundesagentur für Arbeit, w europejskim portalu EURES i na stronach firm. Plik nazwij czytelnie, na przykład „Bewerbung_Nowak_Lageristin.pdf”, i wysyłaj z adresu e-mail zawierającego imię i nazwisko.',
        'Po przyjeździe czekają Cię zwykle meldunek w urzędzie (Anmeldung), numer identyfikacji podatkowej, numer ubezpieczenia społecznego i wybór kasy chorych. Tych danych nie wpisuje się do CV: pracodawca poprosi o nie dopiero przy podpisywaniu umowy.'
      ] },
    ],
    faq: [
      { q: 'Czy w Niemczech muszę dodać zdjęcie do CV?', a: 'Nie. Zdjęcie jest częstym zwyczajem, ale nie obowiązkiem, a pracodawca nie powinien uzależniać rozpatrzenia aplikacji od zdjęcia. Jeśli je dodajesz, wybierz aktualne zdjęcie portretowe.' },
      { q: 'Czy Lebenslauf trzeba podpisać?', a: 'Podpis z miejscowością i datą to tradycyjny element, ale w aplikacjach online jest dziś opcjonalny. Jeśli go dodajesz, aktualizuj datę przy każdej wysyłce.' },
      { q: 'Czy muszę tłumaczyć polskie świadectwa i dyplomy?', a: 'Warto dołączyć tłumaczenie na niemiecki, bo rekruter zwykle nie zna polskich dokumentów. Tłumaczenie przysięgłe bywa wymagane przy uznawaniu kwalifikacji albo na wyraźną prośbę pracodawcy.' },
      { q: 'Skąd mam wiedzieć, czy mój zawód wymaga uznania kwalifikacji?', a: 'Sprawdź swój zawód w wyszukiwarce na portalu anerkennung-in-deutschland.de. Pokaże, czy zawód jest regulowany i który urząd przyjmuje wnioski w danym kraju związkowym.' },
      { q: 'Czy wystarczy samo CV bez listu motywacyjnego?', a: 'Zależy od ogłoszenia. Wiele firm nadal oczekuje Anschreiben, ale część pisze, że list nie jest potrzebny. Jeśli ogłoszenie nic o tym nie mówi, krótki list pod konkretną ofertę zwykle pomaga.' },
    ],
  },
  {
    slug: 'cv-po-niemiecku', lang: 'de', name: 'CV po niemiecku', short: false,
    title: 'CV po niemiecku: tłumaczenie stanowisk, szkół i zwrotów',
    seoTitle: 'CV po niemiecku: stanowiska, szkoły, daty i zwroty',
    metaDescription: 'Jak napisać CV po niemiecku: nazwy sekcji, tłumaczenie stanowisk i polskich szkół, format dat, poziomy języka, gotowe zwroty i najczęstsze błędy.',
    intro: 'Dobre CV po niemiecku to nie przetłumaczone słowo w słowo polskie CV. Nazwy stanowisk, szkół i umiejętności muszą brzmieć tak, jak w niemieckich ogłoszeniach, a przy tym nie mogą niczego zawyżać. Ten poradnik pokazuje, jak przenieść polskie doświadczenie i wykształcenie na niemiecki i jakich błędów unikać.',
    sections: [
      { h: 'Nazwy sekcji po niemiecku', p: [
        'Niemiecki Lebenslauf ma przewidywalny układ i rekruter szuka informacji w znanych miejscach. Używaj standardowych nagłówków, a nie ich kreatywnych wersji. Jeśli CV trafia do systemu rekrutacyjnego, typowe nazwy sekcji ułatwiają też poprawne odczytanie dokumentu.'
      ], list: ['Profil zawodowy → Profil lub Kurzprofil', 'Doświadczenie zawodowe → Berufserfahrung', 'Wykształcenie → Ausbildung (szkoły zawodowe) albo Schulbildung i Studium', 'Kursy i szkolenia → Weiterbildung', 'Języki → Sprachkenntnisse', 'Umiejętności komputerowe → EDV-Kenntnisse lub IT-Kenntnisse', 'Prawo jazdy → Führerschein', 'Zainteresowania → Interessen'] },
      { h: 'Krótki profil na początek (Kurzprofil)', p: [
        'Coraz więcej niemieckich CV zaczyna się od dwóch lub trzech zdań o kandydacie. Nie jest to obowiązkowe, ale pomaga, gdy zmieniasz kraj i rekruter nie zna polskich firm. Profil piszesz bez „ich”, w stylu notatki, na przykład: „Erfahrene Lagerfachkraft mit Staplerschein, sicher im Umgang mit Handscannern und SAP. Bereit für Schichtarbeit, Umzug nach Bayern geplant.”',
        'Profil powinien powtarzać dwa lub trzy najważniejsze wymagania z ogłoszenia, ale tylko te, które naprawdę spełniasz. Jeśli zmieniasz go pod każdą ofertę, rekruter od razu widzi, że aplikacja nie jest masowa.'
      ] },
      { h: 'Jak tłumaczyć nazwy stanowisk', p: [
        'Najprostsza metoda: znajdź trzy lub cztery niemieckie ogłoszenia na podobne stanowisko i sprawdź, jak pracodawcy je nazywają. Jeśli w Polsce byłaś „specjalistką ds. obsługi klienta”, w Niemczech pasować może „Kundenberaterin” albo „Sachbearbeiterin Kundenservice”, zależnie od zakresu obowiązków.',
        'W niemieckich ogłoszeniach zobaczysz dopisek (m/w/d), który oznacza, że oferta jest skierowana do wszystkich płci. W swoim CV użyj formy pasującej do Ciebie, na przykład „Lageristin” albo „Lagerist”, i trzymaj się jej konsekwentnie w całym dokumencie.',
        'Uważaj na tytuły, które w Niemczech mają określone znaczenie. „Meister” oznacza konkretne kwalifikacje mistrzowskie w rzemiośle, a „Ingenieur” w wielu krajach związkowych jest tytułem chronionym. Jeśli nie masz odpowiedniego dyplomu, opisz zakres pracy zamiast używać takiej nazwy.'
      ], list: ['Magazynier → Lagerist / Lagermitarbeiter', 'Operator wózka widłowego → Staplerfahrer', 'Kierowca kat. C+E → Berufskraftfahrer (Führerschein CE)', 'Opiekunka osób starszych → Betreuungskraft lub Seniorenbetreuerin', 'Kierownik zmiany → Schichtleiter', 'Pracownik produkcji → Produktionsmitarbeiter', 'Księgowa → Buchhalterin', 'Sprzedawca → Verkäufer / Fachverkäufer'] },
      { h: 'Polskie wykształcenie po niemiecku', p: [
        'Polskie szkoły nie mają dokładnych odpowiedników w niemieckim systemie, dlatego najbezpieczniej podać oryginalną nazwę i krótkie wyjaśnienie. Rekruter zrozumie więcej z opisu niż z nazwy, którą sam musi tłumaczyć.',
        'Nie zamieniaj polskich tytułów na niemieckie tytuły akademickie. Polski inżynier to nie „Dipl.-Ing.”, a magister to nie automatycznie „Diplom”. Bezpieczny zapis to stopień w ogólnie zrozumiałej formie z polską nazwą w nawiasie, na przykład „Bachelor (poln. Licencjat)”. Jeśli chcesz mieć pewność co do statusu dyplomu, ocenę wykształcenia wydaje urząd ZAB.'
      ], list: ['Liceum ogólnokształcące → Allgemeinbildendes Lyzeum, Abschluss: Matura (Hochschulreife)', 'Technikum → Technikum (berufsbildende Oberschule), Abschluss: Matura und Berufsqualifikation, np. Techniker für Logistik', 'Szkoła branżowa → Berufsschule (Branżowa szkoła), Berufsabschluss', 'Studia I stopnia (licencjat) → Bachelor (poln. Licencjat)', 'Studia I stopnia (inżynier) → Bachelor (poln. Inżynier)', 'Studia II stopnia lub jednolite magisterskie → Master (poln. Magister)'] },
      { h: 'Daty, adres i dane kontaktowe', p: [
        'Okresy zatrudnienia zapisuje się zwykle w formacie MM/JJJJ, na przykład „03/2021 – 08/2024”, a obecną pracę jako „seit 09/2024”. W liście i przy podpisie stosuje się format z kropkami: „15.10.2026”.',
        'Numer telefonu podaj z kierunkowym „+48”, jeśli jeszcze nie masz niemieckiego numeru. Przy adresie w Polsce dopisz „Polen”. Jeśli przeprowadzka jest zaplanowana, możesz dodać zdanie „Umzug nach München ab 01/2027 geplant”.'
      ] },
      { h: 'Typowe zwroty do opisu obowiązków', p: [
        'Niemieckie CV opisuje obowiązki rzeczowo, najczęściej w formie rzeczowników lub krótkich równoważników zdań. Unikaj pierwszej osoby i długich zdań. Lepiej podać konkret, na przykład rodzaj maszyn, systemu lub towaru, niż ogólne określenia.'
      ], list: ['Verantwortlich für die Warenannahme und Qualitätskontrolle', 'Kommissionierung und Verpackung mit Handscanner', 'Bedienung von CNC-Maschinen im Schichtbetrieb', 'Betreuung von Stammkunden und Bearbeitung von Reklamationen', 'Einarbeitung neuer Mitarbeiter', 'Erstellung von Monatsberichten in Excel', 'Grundpflege und Begleitung im Alltag'] },
      { h: 'Języki i umiejętności', p: [
        'Przy językach podawaj poziom według skali GER: „Polnisch – Muttersprache”, „Deutsch – B2 (GER)”, „Englisch – B1 (GER)”. Określenia „verhandlungssicher” i „fließend” spotyka się w ogłoszeniach, ale bez poziomu i certyfikatu są mało precyzyjne, więc dodawaj je najwyżej jako uzupełnienie.',
        'Umiejętności techniczne zapisz tak, jak brzmią w ogłoszeniu: nazwy programów, maszyn i uprawnień. Uprawnienia zdobyte w Polsce, na przykład UDT na wózki, opisz w nawiasie, bo niemiecki pracodawca może poprosić o dodatkowe szkolenie lub potwierdzenie.'
      ] },
      { h: 'Najczęstsze błędy w CV po niemiecku', p: [
        'Większość problemów bierze się z dosłownego tłumaczenia i z przenoszenia polskich zwyczajów. Zanim wyślesz dokument, daj go do przeczytania komuś, kto zna niemiecki, albo porównaj słownictwo z treścią ogłoszenia.'
      ], list: ['Klauzula RODO z polskiego CV, której w Niemczech się nie stosuje', 'Tłumaczenie „praktyka” jako „Ausbildung”, choć Ausbildung to pełna nauka zawodu, a staż to „Praktikum”', 'Mieszanie form żeńskich i męskich w nazwach stanowisk', 'Zawyżony poziom języka bez certyfikatu', 'Polskie skróty i nazwy urzędów bez wyjaśnienia', 'Zapis dat raz z kropkami, raz z ukośnikami'] },
      { h: 'Kiedy CV po niemiecku, a kiedy po angielsku', p: [
        'Zasada jest prosta: odpowiadaj w języku ogłoszenia. Jeśli oferta jest po niemiecku, CV i list też powinny być po niemiecku, nawet gdy Twój niemiecki nie jest jeszcze biegły. W międzynarodowych firmach, zwłaszcza w IT, ogłoszenia bywają po angielsku i wtedy angielskie CV jest w pełni akceptowane.'
      ] },
    ],
    faq: [
      { q: 'Jak przetłumaczyć technikum na niemiecki?', a: 'Najlepiej zostawić nazwę „Technikum” i dodać krótkie wyjaśnienie, na przykład berufsbildende Oberschule z maturą i tytułem technika w danym zawodzie. Nie zamieniaj go na niemiecki tytuł Techniker, który oznacza inny rodzaj kwalifikacji.' },
      { q: 'Czy polski magister to w Niemczech Master?', a: 'Zwykle opisuje się go jako stopień na poziomie Master, ale bezpieczniej dopisać polską nazwę, na przykład „Master (poln. Magister)”. Oficjalną ocenę dyplomu można uzyskać w urzędzie ZAB.' },
      { q: 'Jak zapisywać daty w CV po niemiecku?', a: 'W Lebenslauf najczęściej stosuje się format MM/JJJJ, a obecną pracę opisuje się słowem „seit”, na przykład „seit 09/2024”. Pełną datę z kropkami podaje się w liście i przy podpisie.' },
      { q: 'Czy mogę użyć tłumacza automatycznego?', a: 'Możesz zacząć od tłumaczenia automatycznego, ale potem sprawdź nazwy stanowisk i zwroty w niemieckich ogłoszeniach. Dosłowne tłumaczenia szkół i stanowisk są częstą przyczyną niezrozumiałych dokumentów.' },
      { q: 'Co wpisać, jeśli dopiero uczę się niemieckiego?', a: 'Podaj obecny poziom według GER i informację o kursie, na przykład „Deutschkurs B1, laufend”. Uczciwy opis jest lepszy niż zawyżony poziom, który wyjdzie przy pierwszej rozmowie.' },
    ],
  },
  {
    slug: 'praca-w-uk-cv', lang: 'en', name: 'Praca w Wielkiej Brytanii', short: false,
    title: 'CV do pracy w Wielkiej Brytanii: zasady brytyjskiego CV',
    seoTitle: 'Praca w UK: brytyjskie CV, cover letter i prawo do pracy',
    metaDescription: 'Jak napisać CV do pracy w Wielkiej Brytanii: bez zdjęcia i daty urodzenia, personal statement, cover letter, referencje i prawo do pracy po Brexicie.',
    intro: 'Brytyjskie CV jest krótsze i bardziej rzeczowe niż wiele polskich. Nie ma w nim zdjęcia ani danych, które mogłyby prowadzić do dyskryminacji, a na górze zwykle stoi kilka zdań o tym, co kandydat wnosi do firmy. Po Brexicie kluczowe stało się też jasne opisanie prawa do pracy.',
    sections: [
      { h: 'Brytyjskie CV w skrócie', p: [
        'W Wielkiej Brytanii mówi się „CV”, a nie „resume”. Typowe CV ma do dwóch stron A4, układ odwrotnie chronologiczny i prostą formę bez grafik, tabel i kolumn, które utrudniają odczyt w systemach rekrutacyjnych. Przy krótkim doświadczeniu jedna strona w zupełności wystarcza.',
        'Kolejność sekcji jest zwykle taka: dane kontaktowe, personal statement, key skills, employment history, education, a na końcu dodatkowe informacje, na przykład prawo jazdy lub certyfikaty. Pisz brytyjską odmianą angielskiego, na przykład „organised” zamiast „organized”.'
      ] },
      { h: 'Czego nie umieszczać: zdjęcie, wiek, stan cywilny', p: [
        'Brytyjskie przepisy o równym traktowaniu (Equality Act 2010) chronią kandydatów między innymi ze względu na wiek, płeć, stan cywilny, pochodzenie czy religię. Dlatego w CV nie podaje się zdjęcia, daty urodzenia, stanu cywilnego, liczby dzieci ani narodowości, a rekruterzy często wolą dokumenty bez tych danych.',
        'W danych kontaktowych wystarczą imię i nazwisko, miejscowość lub region, numer telefonu, e-mail i ewentualnie link do profilu LinkedIn. Pełny adres nie jest potrzebny. Polskiej klauzuli o przetwarzaniu danych osobowych również się nie dodaje.'
      ] },
      { h: 'Personal statement: kilka zdań na początek', p: [
        'Personal statement to trzy do pięciu zdań na górze CV. Mówią, kim jesteś zawodowo, w czym masz doświadczenie i jakiej pracy szukasz. To pierwsze, co czyta rekruter, więc warto dopasować je do każdego ogłoszenia.',
        'Przykład: „Reliable warehouse operative with five years of experience in picking, packing and forklift operation in high-volume distribution centres. Comfortable with RF scanners and night shifts. Looking for a permanent role in the Midlands.” Taki tekst jest konkretny i pokazuje słowa kluczowe z ogłoszenia.'
      ] },
      { h: 'Doświadczenie i osiągnięcia', p: [
        'W sekcji employment history podaj stanowisko, firmę, miejscowość i okres, a pod spodem trzy do sześciu punktów. Zaczynaj je od czasowników w czasie przeszłym, na przykład „managed”, „trained”, „reduced”, „handled”, a obecną pracę opisuj w czasie teraźniejszym.',
        'Brytyjscy rekruterzy lubią konkret: liczbę osób w zespole, rodzaj obsługiwanych maszyn, systemy, z których korzystasz. Podawaj tylko liczby, które możesz potwierdzić na rozmowie. Polskie nazwy firm zostaw w oryginale i dopisz krótko branżę, na przykład „logistics company, Poznań, Poland”.'
      ] },
      { h: 'Key skills: umiejętności pod ogłoszenie', p: [
        'Pod profilem wiele brytyjskich CV ma krótką listę kluczowych umiejętności, zwykle sześć do dziesięciu pozycji. Wpisuj konkretne rzeczy: obsługę wózka widłowego, systemy magazynowe, programy biurowe, uprawnienia czy znajomość procedur bezpieczeństwa. Ogólniki typu „hard-working” lub „team player” lepiej pokazać przykładem w doświadczeniu.',
        'Nazwy umiejętności przepisuj w tej samej formie, w jakiej występują w ogłoszeniu. Brytyjskie firmy często korzystają z systemów, które porównują CV z wymaganiami oferty, a różnica między „forklift licence” i „FLT licence” może mieć znaczenie przy wstępnej selekcji.'
      ] },
      { h: 'Prawo do pracy po Brexicie', p: [
        'Od zakończenia okresu przejściowego obywatele UE nie mają już automatycznego prawa do pracy w Wielkiej Brytanii. Osoby, które mieszkały tam wcześniej i uzyskały settled lub pre-settled status w ramach EU Settlement Scheme, zwykle mogą pracować, a pozostałe potrzebują odpowiedniej wizy, na przykład wizy pracowniczej ze sponsorem.',
        'Pracodawca ma obowiązek sprawdzić prawo do pracy przed zatrudnieniem, najczęściej przez kod udostępniany w serwisie rządowym. W CV wystarczy jedna linijka, na przykład „Right to work: UK settled status”. Aktualne zasady sprawdzaj na stronie gov.uk, bo przepisy imigracyjne się zmieniają.'
      ] },
      { h: 'Cover letter', p: [
        'List motywacyjny (cover letter) jest w Wielkiej Brytanii często oczekiwany, nawet jeśli ogłoszenie nie mówi o nim wprost. Ma zwykle trzy lub cztery akapity: dlaczego aplikujesz, co wnosisz w odniesieniu do wymagań oferty i kiedy możesz zacząć.',
        'Przy aplikacji e-mailowej treść listu możesz wkleić w wiadomość, a CV dołączyć jako PDF lub plik Word, jeśli firma o to prosi. Część pracodawców zamiast listu ma formularz z pytaniami, wtedy odpowiedzi warto przygotować z równą starannością.'
      ] },
      { h: 'Referencje', p: [
        'Referencje to w Wielkiej Brytanii ważny etap rekrutacji: pracodawca kontaktuje się zwykle z jednym lub dwoma poprzednimi przełożonymi. W CV nie trzeba podawać ich danych. Wystarczy zdanie „References available on request”, a coraz częściej pomija się nawet je.',
        'Przygotuj wcześniej kontakty do osób, które mogą potwierdzić Twoją pracę, najlepiej po angielsku. Jeśli Twoi przełożeni w Polsce nie mówią po angielsku, uprzedź o tym rekrutera lub dołącz przetłumaczoną referencję.'
      ] },
      { h: 'Jak wysłać aplikację', p: [
        'CV zapisuj jako PDF, chyba że ogłoszenie prosi o plik Word, i nazwij plik swoim imieniem i nazwiskiem. Wiele ofert w Wielkiej Brytanii publikują agencje rekrutacyjne. To normalna droga, ale przed wysłaniem dokumentów sprawdź, dla jakiej firmy agencja rekrutuje i jakie dane naprawdę są potrzebne na tym etapie.',
        'Na rozmowę telefoniczną lub wideo przygotuj krótkie wyjaśnienie, dlaczego chcesz pracować w Wielkiej Brytanii, jaki masz status i od kiedy możesz zacząć.'
      ] },
      { h: 'Kwalifikacje z Polski w Wielkiej Brytanii', p: [
        'W wielu zawodach polskie wykształcenie wystarczy opisać w CV. Jeśli chcesz pokazać pracodawcy, jak ma się Twój dyplom do brytyjskiego systemu, możesz zamówić porównanie kwalifikacji w UK ENIC. W zawodach regulowanych, na przykład w pielęgniarstwie, potrzebna jest rejestracja w odpowiednim brytyjskim organie, a niektóre uprawnienia, na przykład zawodowe prawo jazdy, mogą wymagać dodatkowych formalności.'
      ] },
    ],
    faq: [
      { q: 'Czy w brytyjskim CV dodaje się zdjęcie?', a: 'Zwykle nie. Brytyjscy rekruterzy wolą CV bez zdjęcia, daty urodzenia i stanu cywilnego, bo te informacje nie są potrzebne do oceny kwalifikacji i mogą rodzić zarzut dyskryminacji.' },
      { q: 'Jak długie powinno być CV do pracy w UK?', a: 'Najczęściej do dwóch stron A4. Przy krótkim doświadczeniu lepiej zmieścić się na jednej stronie niż sztucznie wydłużać dokument.' },
      { q: 'Czy jako obywatel Polski mogę pracować w UK bez wizy?', a: 'Zależy od Twojego statusu. Osoby z settled lub pre-settled status w ramach EU Settlement Scheme zwykle mogą pracować, pozostałe potrzebują odpowiedniej wizy. Aktualne zasady sprawdzisz na stronie gov.uk.' },
      { q: 'Czy w CV trzeba podać dane osób polecających?', a: 'Nie. Wystarczy zdanie „References available on request” albo całkowite pominięcie tej sekcji. Dane osób polecających podasz, gdy pracodawca o nie poprosi.' },
      { q: 'Czym jest personal statement?', a: 'To krótki akapit na górze CV, w którym w kilku zdaniach opisujesz swoje doświadczenie, mocne strony i rodzaj pracy, której szukasz. Najlepiej dopasować go do każdego ogłoszenia.' },
    ],
  },
  {
    slug: 'cv-po-angielsku', lang: 'en', name: 'CV po angielsku', short: false,
    title: 'CV po angielsku: tłumaczenie stanowisk, szkół i zwrotów',
    seoTitle: 'CV po angielsku: stanowiska, szkoły, daty i zwroty',
    metaDescription: 'Jak napisać CV po angielsku: nazwy sekcji, tłumaczenie stanowisk i polskich szkół, formaty dat, czasowniki do opisu obowiązków i najczęstsze błędy.',
    intro: 'CV po angielsku przyda się przy pracy w Wielkiej Brytanii, Irlandii, Holandii, a także w międzynarodowych firmach w Polsce. Kluczem jest naturalny język ogłoszeń, a nie dosłowne tłumaczenie polskiego dokumentu. Poniżej znajdziesz nazwy sekcji, przykłady stanowisk i szkół, formaty dat i błędy, które najczęściej zdradzają tłumaczenie z polskiego.',
    sections: [
      { h: 'CV czy resume, brytyjski czy amerykański angielski', p: [
        'W Europie mówi się „CV” i tak warto nazwać plik oraz dokument. „Resume” to określenie amerykańskie, w USA ma też trochę inną formę. Wybierz jedną odmianę języka i trzymaj się jej: przy pracy w Wielkiej Brytanii i Irlandii brytyjską pisownię, na przykład „organised”, „centre”, „licence”.',
        'Na górze dokumentu nie pisz „Curriculum Vitae” ani „CV”. Największym napisem powinno być Twoje imię i nazwisko, a pod nim krótki tytuł zawodowy, na przykład „Warehouse Team Leader”.'
      ] },
      { h: 'Nazwy sekcji po angielsku', p: [
        'Standardowe nagłówki ułatwiają czytanie rekruterowi i systemom rekrutacyjnym. Unikaj kreatywnych nazw sekcji i trzymaj się tych, które zna każdy rekruter.'
      ], list: ['Profil zawodowy → Profile lub Personal Statement', 'Doświadczenie zawodowe → Work Experience lub Employment History', 'Wykształcenie → Education', 'Umiejętności → Key Skills', 'Kursy i certyfikaty → Certifications and Training', 'Języki → Languages', 'Zainteresowania → Interests'] },
      { h: 'Profil po angielsku: jak zacząć CV', p: [
        'Na górze angielskiego CV zwykle stoi kilka zdań profilu. Pisze się je bez podmiotu albo w pierwszej osobie bez „I” na początku każdego zdania. Przykład: „Experienced care assistant with a background in home care for elderly clients. Patient, reliable and trained in moving and handling. Available for live-in and day shifts.”',
        'Unikaj przymiotników, których nie da się sprawdzić, takich jak „ambitious” czy „passionate”, jeśli nic za nimi nie stoi. Lepiej wpisać jedną konkretną umiejętność z ogłoszenia niż trzy ogólne cechy charakteru.',
        'Profil zmieniaj pod każdą ofertę. Wystarczy podmienić nazwę stanowiska i jedną lub dwie umiejętności, żeby rekruter od razu zobaczył, że CV dotyczy właśnie jego ogłoszenia.'
      ] },
      { h: 'Jak tłumaczyć nazwy stanowisk', p: [
        'Sprawdź, jak podobne stanowisko nazywają anglojęzyczne ogłoszenia w kraju, do którego aplikujesz. Ta sama praca bywa w Wielkiej Brytanii „Warehouse Operative”, a w innej firmie „Picker Packer”. Wybierz nazwę, która najlepiej opisuje to, co faktycznie robiłeś.',
        'Uważaj na słowa, które po angielsku znaczą więcej niż w Polsce. „Accountant” w Wielkiej Brytanii często kojarzy się z kwalifikacjami zawodowymi księgowego, więc jeśli wprowadzałaś dokumenty, trafniejsze może być „Accounts Assistant” albo „Bookkeeper”. „Manager” sugeruje zarządzanie ludźmi lub budżetem, a polski „specjalista ds.” to zwykle „Specialist”, „Coordinator” albo „Officer”, zależnie od zakresu pracy.'
      ], list: ['Magazynier → Warehouse Operative', 'Operator wózka widłowego → Forklift Operator (FLT Driver)', 'Kierowca kat. C+E → HGV Driver (Class 1 / C+E)', 'Opiekunka osób starszych → Care Assistant lub Carer', 'Kierownik zmiany → Shift Supervisor', 'Pracownik produkcji → Production Operative', 'Sprzedawca → Sales Assistant', 'Pokojowa → Room Attendant lub Housekeeper'] },
      { h: 'Polskie wykształcenie po angielsku', p: [
        'Najbezpieczniej podać przetłumaczoną nazwę szkoły i rodzaj świadectwa, a polską nazwę zostawić w nawiasie. Nie podnoś poziomu wykształcenia: polski licencjat to stopień na poziomie Bachelor, ale nie warto dopisywać „BA (Hons)”, bo to konkretny brytyjski stopień.',
        'Jeśli rekruter potrzebuje oficjalnego porównania, w Wielkiej Brytanii wydaje je UK ENIC, a w innych krajach odpowiednie krajowe ośrodki uznawania wykształcenia. W CV wystarczy uczciwy opis.'
      ], list: ['Liceum ogólnokształcące → General Secondary School, Matura (secondary school leaving exam)', 'Technikum → Technical Secondary School, Matura and vocational qualification as Logistics Technician', 'Szkoła branżowa → Vocational School, vocational qualification', 'Licencjat → Bachelor’s degree (Licencjat)', 'Inżynier → Bachelor’s degree in Engineering (Inżynier)', 'Magister → Master’s degree (Magister)'] },
      { h: 'Daty i formaty', p: [
        'W CV po angielsku najczytelniej zapisywać miesiące słownie, na przykład „Mar 2021 – Aug 2024” albo „March 2021 – Present”. Zapis cyfrowy typu „03/04/2021” jest niejednoznaczny, bo w Wielkiej Brytanii oznacza czwarty marca, a w USA trzeci kwietnia.',
        'Numer telefonu podaj w formacie międzynarodowym z „+48”, a miejscowość z nazwą kraju, na przykład „Gdańsk, Poland”. Jeśli przeprowadzasz się, dopisz „Relocating to Dublin in January 2027”.'
      ] },
      { h: 'Czasowniki i zwroty do opisu obowiązków', p: [
        'Angielskie CV opisuje obowiązki krótko i zaczyna punkty od czasownika, bez „I”. Przy poprzednich stanowiskach używaj czasu przeszłego, przy obecnym teraźniejszego. Zamiast „I was responsible for” napisz po prostu, co robiłeś.'
      ], list: ['Managed a team of six on a rotating shift pattern', 'Trained new starters in health and safety procedures', 'Picked and packed orders using RF scanners', 'Handled customer complaints and processed refunds', 'Prepared monthly reports in Excel', 'Provided personal care and companionship to elderly clients', 'Maintained accurate stock records'] },
      { h: 'Języki i umiejętności', p: [
        'Poziom języka opisuj według skali CEFR, na przykład „Polish – native”, „English – B2 (CEFR)”. Słowo „fluent” jest popularne, ale bez poziomu bywa różnie rozumiane. Jeśli masz certyfikat, na przykład IELTS lub egzamin Cambridge, podaj jego nazwę.',
        'W umiejętnościach wymień konkretne narzędzia, systemy i uprawnienia, najlepiej tymi samymi słowami co w ogłoszeniu. Polskie uprawnienia, na przykład UDT, opisz w nawiasie, bo zagraniczny pracodawca może wymagać lokalnego szkolenia.'
      ] },
      { h: 'Najczęstsze błędy w CV po angielsku', p: [
        'Wiele błędów to fałszywi przyjaciele i polskie zwyczaje przeniesione do angielskiego dokumentu. Przeczytaj CV na głos albo daj je do sprawdzenia osobie, która dobrze zna angielski.'
      ], list: ['„Practice” zamiast „work placement” lub „internship” na określenie praktyk', '„Actual” w znaczeniu „aktualny” zamiast „current”', '„Eventually” w znaczeniu „ewentualnie” zamiast „if needed”', 'Polska klauzula RODO, której nie stosuje się w anglojęzycznych CV', 'Zdjęcie i data urodzenia w CV do Wielkiej Brytanii lub Irlandii', 'Mieszanie pisowni brytyjskiej i amerykańskiej'] },
    ],
    faq: [
      { q: 'Jak przetłumaczyć licencjat i magistra na angielski?', a: 'Najczęściej jako Bachelor’s degree i Master’s degree, z polską nazwą w nawiasie. Nie dopisuj skrótów brytyjskich stopni, takich jak BA (Hons), których formalnie nie masz.' },
      { q: 'Jak zapisać daty w CV po angielsku?', a: 'Najczytelniej słownie, na przykład „Mar 2021 – Present”. Zapis samymi cyframi jest niejednoznaczny, bo kolejność dnia i miesiąca różni się między krajami.' },
      { q: 'Czy w CV po angielsku pisać w pierwszej osobie?', a: 'Nie. Punkty zaczyna się od czasownika, bez „I”, na przykład „Managed”, „Trained”, „Handled”. Pierwsza osoba może pojawić się najwyżej w krótkim profilu na górze.' },
      { q: 'Czy mogę wysłać to samo CV do UK i do Holandii?', a: 'Możesz zacząć od jednej wersji, ale dopasuj ją do kraju i ogłoszenia. W UK i Irlandii lepiej usunąć zdjęcie i datę urodzenia, w Holandii zdjęcie jest dopuszczalne.' },
      { q: 'Jak opisać poziom angielskiego?', a: 'Podaj poziom według skali CEFR, na przykład B2, i nazwę certyfikatu, jeśli go masz. Ogólne słowa typu „good” czy „fluent” bez poziomu mówią rekruterowi niewiele.' },
    ],
  },
  {
    slug: 'praca-w-holandii-cv', lang: 'en', name: 'Praca w Holandii', short: true,
    title: 'CV do pracy w Holandii: zasady i dokumenty',
    seoTitle: 'Praca w Holandii: CV, motivatiebrief i BSN',
    metaDescription: 'Jak przygotować CV do pracy w Holandii: krótki profil, zdjęcie opcjonalnie, motivatiebrief, CV po angielsku w firmach międzynarodowych i numer BSN.',
    intro: 'Holenderskie CV jest zwięzłe i rzeczowe, a rekruterzy cenią bezpośredniość. W wielu firmach, zwłaszcza międzynarodowych, angielskie CV jest w pełni akceptowane. Poniżej opisujemy, co zwykle zawiera CV w Holandii i jakie formalności czekają po przyjeździe.',
    sections: [
      { h: 'Jak wygląda CV w Holandii', p: [
        'Typowe CV ma jedną lub dwie strony i układ odwrotnie chronologiczny. Na górze często znajduje się krótki profil (profiel), czyli kilka zdań o tym, kim jesteś zawodowo i jakiej pracy szukasz. Dalej doświadczenie, wykształcenie, umiejętności i języki z poziomem według skali CEFR.',
        'Zdjęcie jest w Holandii dopuszczalne i wciąż dość często spotykane, ale nie jest wymagane. Datę urodzenia i stan cywilny możesz pominąć. Holenderscy rekruterzy lubią konkret, więc zamiast ogólnych przymiotników opisz, co dokładnie robiłeś i z jakim efektem.'
      ] },
      { h: 'Doświadczenie i umiejętności', p: [
        'Pod każdym stanowiskiem wypisz kilka krótkich punktów: co robiłeś, z jakimi maszynami, systemami lub klientami pracowałeś i za co odpowiadałeś. Polskie nazwy firm zostaw w oryginale i dopisz branżę oraz miasto. W sekcji umiejętności wpisz konkretne uprawnienia, prawo jazdy i programy, najlepiej tymi samymi słowami, których użyto w ogłoszeniu.',
        'Holenderscy pracodawcy zwracają uwagę na to, czy kandydat potrafi pracować samodzielnie i jasno się komunikować. Jeśli masz doświadczenie w pracy w międzynarodowym zespole albo z klientami z zagranicy, napisz o tym wprost.'
      ] },
      { h: 'Po angielsku czy po niderlandzku', p: [
        'Odpowiadaj w języku ogłoszenia. Jeśli oferta jest po angielsku, angielskie CV jest w porządku i wiele międzynarodowych firm pracuje na co dzień w tym języku. Przy ofertach po niderlandzku, zwłaszcza w usługach, opiece czy administracji, znajomość niderlandzkiego bywa wymagana, a CV po niderlandzku zwiększa czytelność aplikacji.',
        'Jeśli uczysz się niderlandzkiego, wpisz poziom i kurs, na przykład „Dutch – A2 (CEFR), course in progress”.'
      ] },
      { h: 'Motivatiebrief', p: [
        'List motywacyjny (motivatiebrief) jest w Holandii często oczekiwany. Powinien być krótki i bezpośredni: dlaczego ta firma, dlaczego to stanowisko i co konkretnie wnosisz. Holenderski styl jest mniej formalny niż niemiecki, ale nadal uprzejmy.',
        'Zamiast powtarzać treść CV, wybierz dwa przykłady z doświadczenia, które najlepiej odpowiadają wymaganiom oferty, i opisz je w kilku zdaniach. Na końcu napisz, od kiedy możesz zacząć pracę i czy planujesz przeprowadzkę, bo przy kandydatach z zagranicy to jedno z pierwszych pytań rekrutera. Jedna strona w zupełności wystarczy.'
      ] },
      { h: 'Polskie wykształcenie w Holandii', p: [
        'Polskie szkoły i dyplomy opisz po angielsku lub po niderlandzku z oryginalną nazwą w nawiasie, na przykład „Bachelor’s degree (Licencjat)”. Jeśli pracodawca chce wiedzieć, jak Twój dyplom ma się do holenderskiego systemu, ocenę wykształcenia można zwykle uzyskać w holenderskim ośrodku uznawania dyplomów. W zawodach regulowanych, na przykład w opiece zdrowotnej, potrzebna jest osobna rejestracja.'
      ] },
      { h: 'Agencje pracy i umowa', p: [
        'Część ofert dla osób z Polski publikują agencje pracy (uitzendbureau). Przed wyjazdem przeczytaj dokładnie umowę i warunki zakwaterowania, jeśli agencja je organizuje, i sprawdź opinie o firmie. W CV do agencji wypisz konkretne uprawnienia, na przykład obsługę wózka widłowego, oraz gotowość do pracy zmianowej.'
      ] },
      { h: 'BSN i sprawy formalne', p: [
        'Do legalnej pracy w Holandii potrzebny jest numer BSN (burgerservicenummer). Zwykle otrzymuje się go przy rejestracji w gminie (gemeente), a przy krótszym pobycie w rejestrze osób niemieszkających na stałe. Numeru BSN nie wpisujesz do CV: pracodawca poprosi o niego przy podpisywaniu umowy. Jako obywatel UE nie potrzebujesz zezwolenia na pracę.'
      ] },
    ],
    faq: [
      { q: 'Czy w holenderskim CV dodaje się zdjęcie?', a: 'Można, zdjęcie jest w Holandii dość często spotykane, ale nie jest wymagane. Jeśli je dodajesz, wybierz aktualne, profesjonalne zdjęcie portretowe.' },
      { q: 'Czy mogę aplikować z CV po angielsku?', a: 'Tak, jeśli ogłoszenie jest po angielsku lub firma działa międzynarodowo. Przy ofertach napisanych po niderlandzku lepiej sprawdzić, czy znajomość tego języka jest wymagana.' },
      { q: 'Czy numer BSN wpisuje się do CV?', a: 'Nie. BSN to numer potrzebny do zatrudnienia i spraw urzędowych, podajesz go pracodawcy dopiero przy podpisywaniu umowy. W CV nie umieszcza się numerów identyfikacyjnych.' },
      { q: 'Czy w Holandii trzeba pisać list motywacyjny?', a: 'Często tak, motivatiebrief jest w Holandii popularny. Powinien być krótki, konkretny i odnosić się do wymagań z ogłoszenia.' },
    ],
  },
  {
    slug: 'praca-w-irlandii-cv', lang: 'en', name: 'Praca w Irlandii', short: true,
    title: 'CV do pracy w Irlandii: zasady i dokumenty',
    seoTitle: 'Praca w Irlandii: CV, cover letter i numer PPS',
    metaDescription: 'Jak napisać CV do pracy w Irlandii: format podobny do brytyjskiego, bez zdjęcia, cover letter, referencje oraz numer PPS jako krok formalny.',
    intro: 'Irlandzkie CV przypomina brytyjskie: jest krótkie, bez zdjęcia i bez danych osobistych, które nie są potrzebne do oceny kwalifikacji. Jako obywatel UE możesz pracować w Irlandii bez zezwolenia, więc najważniejsze jest dobre dopasowanie dokumentów do ogłoszenia.',
    sections: [
      { h: 'Jak wygląda CV w Irlandii', p: [
        'Typowe CV ma do dwóch stron A4, zaczyna się od danych kontaktowych i krótkiego profilu, a dalej zawiera doświadczenie od najnowszego, wykształcenie, kluczowe umiejętności i dodatkowe informacje, na przykład prawo jazdy. Pisz brytyjską odmianą angielskiego.',
        'Nie dodawaj zdjęcia, daty urodzenia ani stanu cywilnego. Irlandzkie przepisy o równości w zatrudnieniu chronią kandydatów przed dyskryminacją między innymi ze względu na wiek, płeć, stan cywilny i rodzinny czy pochodzenie, więc rekruterzy zwykle wolą CV bez tych danych.'
      ] },
      { h: 'Profil i doświadczenie', p: [
        'Profil na górze CV to trzy lub cztery zdania o Twoim doświadczeniu i rodzaju pracy, której szukasz. Pisz konkretnie i odnoś się do ogłoszenia: jeśli oferta dotyczy pracy w hotelu, wspomnij o doświadczeniu w obsłudze gości, a jeśli w magazynie, o uprawnieniach i systemach.',
        'W doświadczeniu podaj stanowisko, firmę, miejscowość i okres, a pod spodem kilka punktów zaczynających się od czasownika. Polskie firmy opisz krótko, na przykład „retail chain, Kraków, Poland”, bo irlandzki rekruter zwykle ich nie zna. Daty zapisuj słownie, na przykład „Jun 2022 – Present”.'
      ] },
      { h: 'Cover letter i referencje', p: [
        'Cover letter jest w Irlandii często oczekiwany. Wystarczą trzy lub cztery akapity: dlaczego aplikujesz, które wymagania z ogłoszenia spełniasz i od kiedy możesz zacząć. Jeśli dopiero planujesz przeprowadzkę, napisz, kiedy będziesz na miejscu.',
        'Referencje od poprzednich pracodawców są zwykle sprawdzane przed zatrudnieniem. W CV wystarczy zdanie „References available on request”, ale przygotuj wcześniej kontakty do przełożonych, którzy mogą potwierdzić Twoją pracę po angielsku.'
      ] },
      { h: 'Kwalifikacje z Polski', p: [
        'Polskie wykształcenie opisz po angielsku z oryginalną nazwą w nawiasie, na przykład „Master’s degree (Magister)”. W zawodach regulowanych, na przykład w ochronie zdrowia, potrzebna jest rejestracja w odpowiednim irlandzkim organie, a porównanie poziomu dyplomu z irlandzkim systemem kwalifikacji można zwykle uzyskać w krajowym ośrodku uznawania wykształcenia.'
      ] },
      { h: 'Gdzie szukać i jak aplikować', p: [
        'Oferty znajdziesz na irlandzkich portalach z ogłoszeniami, na stronach firm, w europejskim portalu EURES i w agencjach rekrutacyjnych. Wiele aplikacji wysyła się przez formularz online, w którym trzeba wgrać CV i czasem odpowiedzieć na kilka pytań. Odpowiedzi traktuj jak krótki list motywacyjny.',
        'CV zapisz jako PDF z imieniem i nazwiskiem w nazwie pliku. Przy rozmowach zdalnych z Polski przygotuj się na pytanie o termin przyjazdu i o to, czy masz już zaplanowane zakwaterowanie.'
      ] },
      { h: 'Numer PPS i sprawy formalne', p: [
        'Do pracy i rozliczeń podatkowych potrzebny jest numer PPS (Personal Public Service Number). Wniosek składa się zwykle po przyjeździe, a do jego rozpatrzenia potrzebne są dokument tożsamości i potwierdzenie adresu. Aktualną procedurę sprawdzisz na stronach rządowych gov.ie.',
        'Numeru PPS nie wpisujesz do CV. Pracodawca poprosi o niego przy zatrudnieniu, żeby poprawnie rozliczać podatek. Warto też założyć konto w irlandzkim systemie podatkowym, żeby uniknąć tymczasowego, wyższego opodatkowania.',
        'Jeśli wykonujesz zawód, w którym potrzebne jest sprawdzenie niekaralności, na przykład w opiece nad dziećmi lub osobami starszymi, pracodawca może poprosić o dodatkowe zaświadczenia, także z Polski. Przygotuj się na to wcześniej, bo uzyskanie dokumentów może potrwać.'
      ] },
    ],
    faq: [
      { q: 'Czy w irlandzkim CV dodaje się zdjęcie?', a: 'Zwykle nie. Irlandzkie CV przypomina brytyjskie i rekruterzy wolą dokumenty bez zdjęcia, daty urodzenia i stanu cywilnego.' },
      { q: 'Czy potrzebuję zezwolenia na pracę w Irlandii?', a: 'Jako obywatel Polski i UE nie potrzebujesz zezwolenia na pracę w Irlandii. Do zatrudnienia i rozliczeń podatkowych potrzebny będzie natomiast numer PPS.' },
      { q: 'Czy numer PPS trzeba mieć przed wysłaniem CV?', a: 'Nie. Możesz aplikować bez numeru PPS, a wniosek złożyć po przyjeździe. Pracodawca poprosi o numer przy zatrudnieniu, nie wpisuje się go do CV.' },
      { q: 'Czy irlandzkie CV różni się od brytyjskiego?', a: 'Zasady są bardzo podobne: do dwóch stron, krótki profil, doświadczenie od najnowszego, bez zdjęcia. Różnice dotyczą głównie lokalnych nazw kwalifikacji i instytucji.' },
    ],
  },
];
export const ABROAD_BY = Object.fromEntries(ABROAD.map((a) => [a.slug, a]));
export const ABROAD_URLS = ABROAD.map((a) => a.slug);
// Linki z artykułów poradnika do stron „za granicą” (blok w lib/seo.js artHtml).
export const ABROAD_FOR_ARTICLE = { 'cv-do-pracy-w-niemczech': ['praca-w-niemczech-cv', 'cv-po-niemiecku', 'cv-po-angielsku', 'praca-w-uk-cv', 'praca-w-holandii-cv', 'praca-w-irlandii-cv'] };
// Poradnik powiązany ze stroną (link w „Zobacz też”).
export const ABROAD_ARTICLE = { de: 'cv-do-pracy-w-niemczech' };
