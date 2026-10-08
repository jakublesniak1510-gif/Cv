import { PROFESSIONS_A } from './content-a.js';
import { PROFESSIONS_B } from './content-b.js';
import { MORE_ARTICLES } from './content-articles.js';

const BASE_PROFESSIONS = [
  {
    slug: 'kasjer',
    category: 'Handel i obsługa klienta',
    name: 'Kasjer / Kasjerka',
    title: 'CV kasjera: wzór i wskazówki',
    metaDescription: 'CV kasjera lub kasjerki dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert pracy i praktyczne wskazówki, co wpisać w CV.',
    intro: 'W ogłoszeniach dla kasjerów pracodawcy szukają osób dokładnych, uczciwych i uprzejmych wobec klientów. Często liczy się gotowość do pracy w systemie zmianowym i w weekendy. Doświadczenie w handlu jest mile widziane, ale wiele sklepów przyjmuje też osoby bez niego.',
    keywords: [
      'obsługa kasy fiskalnej',
      'obsługa terminala płatniczego',
      'obsługa klienta',
      'praca zmianowa',
      'dbałość o ekspozycję towaru',
      'odpowiedzialność za powierzone mienie',
      'rozliczanie utargu',
      'aktualne orzeczenie do celów sanitarno-epidemiologicznych',
      'komunikatywność',
      'dokładność'
    ],
    tips: [
      'Napisz wprost, że obsługujesz kasę fiskalną i terminal płatniczy. To podstawowe wymagania i rekruter szuka ich w pierwszej kolejności.',
      'Podaj skalę pracy, na przykład liczbę klientów na zmianę albo fakt, że samodzielnie rozliczałaś lub rozliczałeś kasę. Konkretne liczby są bardziej przekonujące niż ogólne zapewnienia.',
      'Jeśli ogłoszenie wymaga orzeczenia sanitarno-epidemiologicznego, a Ty je masz, dopisz to w CV. Oszczędzasz rekruterowi pytania.',
      'Zaznacz dyspozycyjność, jeśli jest prawdziwa: praca w weekendy, święta, na zmiany. W handlu to często decyduje o zaproszeniu na rozmowę.'
    ],
    sample: {
      name: 'Katarzyna Wójcik',
      headline: 'Kasjerka',
      contact: ['+48 600 000 001', 'katarzyna.wojcik@example.com', 'Łódź', 'linkedin.com/in/katarzyna-wojcik-przyklad'],
      summary: 'Od czterech lat pracuję na kasie w sklepach spożywczych i samodzielnie rozliczam utarg po zmianie. Obsługuję kasę fiskalną, terminal płatniczy i kasy samoobsługowe, a w wolnych chwilach dbam o ekspozycję towaru.',
      skills: [
        'Obsługa kasy fiskalnej',
        'Obsługa terminala płatniczego',
        'Nadzór nad kasami samoobsługowymi',
        'Rozliczanie utargu',
        'Obsługa reklamacji i zwrotów',
        'Wykładanie towaru i kontrola dat ważności',
        'Praca zmianowa'
      ],
      languages: ['angielski A2'],
      jobs: [
        {
          title: 'Kasjerka',
          company: 'Market Zielony Koszyk',
          period: '03.2022 – obecnie',
          bullets: [
            'Obsługa średnio 250 klientów na zmianę przy kasie tradycyjnej i terminalu płatniczym.',
            'Rozliczanie kasy i przygotowanie raportu dobowego bez niezgodności w utargu.',
            'Nadzór nad czterema kasami samoobsługowymi i pomoc klientom przy płatnościach.'
          ]
        },
        {
          title: 'Kasjerka-sprzedawczyni',
          company: 'Sklep Spożywczy Pod Lipami',
          period: '06.2020 – 02.2022',
          bullets: [
            'Obsługa kasy fiskalnej i przyjmowanie płatności gotówką oraz kartą.',
            'Przyjmowanie dostaw pieczywa i nabiału oraz kontrola dat ważności.',
            'Przyjmowanie zwrotów i reklamacji zgodnie z regulaminem sklepu.'
          ]
        }
      ],
      education: {
        school: 'Branżowa Szkoła I stopnia w Łodzi',
        degree: 'Sprzedawca',
        period: '2017 – 2020'
      }
    },
    faq: [
      {
        q: 'Czy mogę zostać kasjerem bez doświadczenia?',
        a: 'Tak, wiele sklepów zatrudnia osoby bez doświadczenia i szkoli je na miejscu. W CV podkreśl wtedy dokładność, punktualność i kontakt z ludźmi, na przykład z wolontariatu lub pracy sezonowej. Dodaj też dyspozycyjność, jeśli możesz pracować na zmiany.'
      },
      {
        q: 'Czy wpisywać w CV orzeczenie sanitarno-epidemiologiczne?',
        a: 'Warto, jeśli ogłoszenie o nim wspomina i masz aktualne orzeczenie. Wystarczy jedna linijka w sekcji umiejętności lub dodatkowych informacji. Jeśli go nie masz, nie pisz o tym, bo zwykle można je uzyskać przed rozpoczęciem pracy.'
      }
    ]
  },
  {
    slug: 'magazynier',
    category: 'Logistyka i transport',
    name: 'Magazynier / Magazynierka',
    title: 'CV magazyniera: wzór i wskazówki',
    metaDescription: 'CV magazyniera dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert i wskazówki, jak opisać uprawnienia UDT i obsługę skanera.',
    intro: 'Pracodawcy szukający magazynierów zwykle wymagają uprawnień UDT na wózki widłowe albo chęci ich zdobycia. Liczy się dokładność przy kompletacji zamówień, znajomość skanera i podstaw systemu magazynowego. Ważna jest też gotowość do pracy fizycznej i zmianowej.',
    keywords: [
      'uprawnienia UDT na wózki widłowe',
      'kompletacja zamówień',
      'przyjęcie i wydanie towaru',
      'obsługa skanera',
      'system WMS',
      'inwentaryzacja',
      'praca zmianowa',
      'wózek paletowy',
      'dokładność',
      'przestrzeganie zasad BHP'
    ],
    tips: [
      'Uprawnienia UDT wpisz z dokładnym rodzajem wózka i datą ważności. To jedna z pierwszych rzeczy, które sprawdza rekruter.',
      'Opisz, z jakim towarem pracowałeś: spożywczym, przemysłowym, paczkami z e-commerce. Magazyny różnią się i doświadczenie z podobną branżą jest atutem.',
      'Jeśli znasz system WMS lub pracowałeś ze skanerem, nazwij to wprost. Nie musisz podawać nazwy programu, wystarczy opis czynności.',
      'Podaj normy wydajności, jeśli je znasz, na przykład liczbę kompletowanych pozycji na zmianę. Pokazuje to tempo pracy lepiej niż słowo „sumienny”.'
    ],
    sample: {
      name: 'Marcin Kowalczyk',
      headline: 'Magazynier z uprawnieniami UDT',
      contact: ['+48 600 000 002', 'marcin.kowalczyk@example.com', 'Stryków', 'linkedin.com/in/marcin-kowalczyk-przyklad'],
      summary: 'Pracuję w magazynach od pięciu lat, obecnie przy kompletacji i wydawaniu towaru w centrum dystrybucyjnym. Mam uprawnienia UDT na wózki widłowe czołowe i na co dzień obsługuję skaner oraz system WMS.',
      skills: [
        'Uprawnienia UDT na wózki widłowe czołowe',
        'Kompletacja zamówień ze skanerem',
        'Obsługa systemu WMS',
        'Przyjęcie i kontrola dostaw',
        'Inwentaryzacja',
        'Obsługa wózka paletowego elektrycznego',
        'Zasady BHP w magazynie'
      ],
      languages: ['angielski A2'],
      jobs: [
        {
          title: 'Magazynier – operator wózka widłowego',
          company: 'Centrum Dystrybucyjne Logistyka Plus Sp. z o.o.',
          period: '04.2021 – obecnie',
          bullets: [
            'Kompletacja średnio 180 pozycji na zmianę z użyciem skanera i systemu WMS.',
            'Rozładunek i załadunek naczep wózkiem widłowym czołowym.',
            'Udział w kwartalnych inwentaryzacjach i wyjaśnianiu różnic stanów.'
          ]
        },
        {
          title: 'Pracownik magazynu',
          company: 'Hurtownia Polar Sp. z o.o.',
          period: '02.2019 – 03.2021',
          bullets: [
            'Przyjmowanie dostaw i sprawdzanie zgodności towaru z dokumentami WZ.',
            'Przygotowanie palet do wysyłki i ich foliowanie.',
            'Utrzymanie porządku w strefie składowania zgodnie z zasadami BHP.'
          ]
        }
      ],
      education: {
        school: 'Technikum Logistyczne w Łodzi',
        degree: 'Technik logistyk',
        period: '2014 – 2018'
      }
    },
    faq: [
      {
        q: 'Czy bez uprawnień UDT mam szansę na pracę w magazynie?',
        a: 'Tak, wiele stanowisk przy kompletacji lub pakowaniu nie wymaga uprawnień. Część firm opłaca też kurs nowym pracownikom. W CV możesz napisać, że jesteś gotów zdobyć uprawnienia, jeśli to prawda.'
      },
      {
        q: 'Jak opisać pracę magazyniera, żeby nie brzmiała ogólnie?',
        a: 'Zamiast „praca na magazynie” wymień konkretne czynności: przyjęcie towaru, kompletacja, wydanie, inwentaryzacja. Dodaj sprzęt, którego używałeś, i rodzaj towaru. Jeśli znasz swoją wydajność na zmianę, podaj ją.'
      }
    ]
  },
  {
    slug: 'sprzedawca',
    category: 'Handel i obsługa klienta',
    name: 'Sprzedawca / Sprzedawczyni',
    title: 'CV sprzedawcy: wzór i wskazówki',
    metaDescription: 'CV sprzedawcy dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert pracy w handlu i wskazówki, jak opisać wyniki sprzedaży.',
    intro: 'W ogłoszeniach dla sprzedawców najczęściej powtarza się nastawienie na klienta i umiejętność doradzania przy zakupie. Pracodawcy cenią osoby, które znają towar, dbają o wygląd sklepu i potrafią obsłużyć kasę. W sklepach specjalistycznych liczy się też wiedza o produktach z danej branży.',
    keywords: [
      'doradztwo klientom',
      'obsługa klienta',
      'realizacja celów sprzedażowych',
      'obsługa kasy fiskalnej',
      'merchandising',
      'dbanie o ekspozycję towaru',
      'przyjmowanie dostaw',
      'praca w zespole',
      'komunikatywność',
      'praca zmianowa'
    ],
    tips: [
      'Opisz, w czym doradzasz klientom i jaki towar znasz. Sprzedawczyni z doświadczeniem w obuwiu ma inne atuty niż ktoś z elektroniki.',
      'Jeśli masz wyniki sprzedażowe, podaj je w prostej formie, na przykład realizację miesięcznego planu. Nie zawyżaj liczb, bo rekruter może o nie zapytać.',
      'Wymień czynności poza sprzedażą: przyjmowanie dostaw, układanie towaru, inwentaryzacje. Pokazujesz w ten sposób, że znasz pracę sklepu od zaplecza.',
      'Dopasuj język CV do ogłoszenia. Jeśli firma pisze o „doradcy klienta”, użyj tego określenia przy opisie swoich obowiązków.'
    ],
    sample: {
      name: 'Agnieszka Lewandowska',
      headline: 'Sprzedawczyni w sklepie odzieżowym',
      contact: ['+48 600 000 003', 'agnieszka.lewandowska@example.com', 'Poznań', 'linkedin.com/in/agnieszka-lewandowska-przyklad'],
      summary: 'Od trzech lat pracuję jako sprzedawczyni w sklepie odzieżowym, gdzie doradzam klientkom w doborze rozmiaru i fasonu. Wcześniej pracowałam w sklepie obuwniczym, gdzie przyjmowałam dostawy i układałam ekspozycję.',
      skills: [
        'Doradztwo przy zakupie odzieży i obuwia',
        'Obsługa kasy fiskalnej i terminala',
        'Merchandising i ekspozycja towaru',
        'Przyjmowanie dostaw',
        'Obsługa zwrotów i reklamacji',
        'Inwentaryzacja',
        'Praca w zespole'
      ],
      languages: ['angielski B1'],
      jobs: [
        {
          title: 'Sprzedawczyni',
          company: 'Butik Lniana Nić',
          period: '09.2022 – obecnie',
          bullets: [
            'Doradztwo klientkom w doborze rozmiaru, fasonu i dodatków.',
            'Realizacja miesięcznego planu sprzedaży sklepu w 10 z 12 miesięcy ubiegłego roku.',
            'Zmiana ekspozycji witryny i wieszaków zgodnie z wytycznymi sezonowymi.'
          ]
        },
        {
          title: 'Sprzedawczyni',
          company: 'Sklep Obuwniczy Krok',
          period: '05.2020 – 08.2022',
          bullets: [
            'Obsługa klientów i kasy fiskalnej w sklepie z obuwiem damskim i męskim.',
            'Przyjmowanie dostaw i sprawdzanie ich zgodności z zamówieniem.',
            'Przyjmowanie reklamacji i przekazywanie ich do producenta.'
          ]
        }
      ],
      education: {
        school: 'Technikum Handlowe w Poznaniu',
        degree: 'Technik handlowiec',
        period: '2016 – 2020'
      }
    },
    faq: [
      {
        q: 'Czy w CV sprzedawcy trzeba podawać wyniki sprzedaży?',
        a: 'Nie trzeba, ale pomagają, jeśli są prawdziwe. Wystarczy prosta informacja, na przykład o realizacji planu sklepu. Jeśli nie znasz swoich wyników, opisz zakres obowiązków i rodzaj towaru.'
      },
      {
        q: 'Jak napisać CV sprzedawcy, gdy zmieniam branżę?',
        a: 'Podkreśl umiejętności, które przenoszą się między sklepami: kontakt z klientem, obsługa kasy, dbanie o porządek i ekspozycję. Dodaj, że szybko uczysz się nowego asortymentu, i pokaż to przykładem z poprzedniej pracy.'
      }
    ]
  },
  {
    slug: 'obsluga-klienta',
    category: 'Handel i obsługa klienta',
    name: 'Specjalista ds. obsługi klienta',
    title: 'CV w obsłudze klienta: wzór i wskazówki',
    metaDescription: 'CV specjalisty ds. obsługi klienta dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert i wskazówki dla pracy w biurze i infolinii.',
    intro: 'W ogłoszeniach z obsługi klienta pracodawcy szukają osób, które jasno się komunikują i spokojnie rozwiązują problemy. Często wymagana jest obsługa komputera, praca w systemie CRM i kontakt telefoniczny, mailowy lub przez czat. W wielu firmach liczy się też znajomość języka obcego.',
    keywords: [
      'obsługa klienta telefonicznie i mailowo',
      'obsługa czatu',
      'rozpatrywanie reklamacji',
      'system CRM',
      'praca na infolinii',
      'rozwiązywanie problemów',
      'komunikatywność',
      'znajomość języka angielskiego',
      'obsługa komputera',
      'praca w zespole'
    ],
    tips: [
      'Napisz, jakimi kanałami obsługiwałeś klientów: telefon, mail, czat. Pracodawcy często szukają kogoś do konkretnego kanału.',
      'Podaj skalę pracy, na przykład liczbę zgłoszeń dziennie, jeśli ją znasz. Dodaj, z jakimi sprawami najczęściej się mierzyłeś.',
      'Wymień systemy, w których pracowałeś, opisując je ogólnie: CRM, system zgłoszeń, platforma czatu. Rekruter zrozumie, że szybko nauczysz się nowego narzędzia.',
      'Jeśli znasz język obcy i używałeś go w pracy, napisz o tym przy stanowisku. Sama ocena poziomu w sekcji języków mówi mniej.'
    ],
    sample: {
      name: 'Tomasz Zieliński',
      headline: 'Specjalista ds. obsługi klienta',
      contact: ['+48 600 000 004', 'tomasz.zielinski@example.com', 'Wrocław', 'linkedin.com/in/tomasz-zielinski-przyklad'],
      summary: 'Od czterech lat obsługuję klientów telefonicznie, mailowo i przez czat, obecnie w sklepie internetowym z wyposażeniem domu. Pracuję w systemie CRM, rozpatruję reklamacje i rozmawiam z klientami po polsku i angielsku.',
      skills: [
        'Obsługa klienta przez telefon, mail i czat',
        'Praca w systemie CRM',
        'Rozpatrywanie reklamacji i zwrotów',
        'Obsługa systemu zgłoszeń',
        'Prowadzenie trudnych rozmów',
        'Excel na poziomie podstawowym',
        'Praca w zespole'
      ],
      languages: ['angielski B2'],
      jobs: [
        {
          title: 'Specjalista ds. obsługi klienta',
          company: 'Sklep internetowy Domowy Kąt Sp. z o.o.',
          period: '01.2022 – obecnie',
          bullets: [
            'Obsługa około 60 zgłoszeń dziennie przez telefon, mail i czat.',
            'Rozpatrywanie reklamacji i zwrotów oraz kontakt z magazynem i kurierami.',
            'Prowadzenie korespondencji z klientami z zagranicy w języku angielskim.'
          ]
        },
        {
          title: 'Konsultant infolinii',
          company: 'Centrum Kontaktu Słoneczna Linia',
          period: '03.2020 – 12.2021',
          bullets: [
            'Odbieranie połączeń przychodzących od klientów dostawcy internetu.',
            'Rejestrowanie zgłoszeń awarii w systemie CRM i informowanie o statusie naprawy.',
            'Wprowadzanie nowych konsultantów w procedury infolinii.'
          ]
        }
      ],
      education: {
        school: 'Uniwersytet we Wrocławiu',
        degree: 'Licencjat, filologia angielska',
        period: '2016 – 2019'
      }
    },
    faq: [
      {
        q: 'Czy praca na infolinii liczy się jako doświadczenie w obsłudze klienta?',
        a: 'Tak, to jedno z najczęstszych doświadczeń w tej dziedzinie. W CV opisz, jakie sprawy załatwiałeś i w jakich systemach pracowałeś. Pokaż, że potrafisz rozwiązać problem, a nie tylko przyjąć zgłoszenie.'
      },
      {
        q: 'Jak pokazać w CV umiejętność radzenia sobie z trudnym klientem?',
        a: 'Samo słowo „odporność na stres” niewiele mówi. Lepiej opisać typ spraw, na przykład reklamacje lub reklamacje odrzucone, którymi się zajmowałeś. Na rozmowie przygotuj jeden konkretny przykład takiej sytuacji.'
      }
    ]
  },
  {
    slug: 'kierowca',
    category: 'Logistyka i transport',
    name: 'Kierowca kat. C / C+E',
    title: 'CV kierowcy: wzór i wskazówki',
    metaDescription: 'CV kierowcy kat. C i C+E dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert i wskazówki, jak opisać uprawnienia i trasy.',
    intro: 'W ogłoszeniach dla kierowców zawodowych podstawą jest prawo jazdy kat. C lub C+E, kwalifikacja wstępna lub szkolenie okresowe oraz karta kierowcy. Pracodawcy pytają o doświadczenie w transporcie krajowym lub międzynarodowym i o rodzaj prowadzonych pojazdów. Liczy się też niekaralność i dbałość o powierzony sprzęt.',
    keywords: [
      'prawo jazdy kat. C+E',
      'kwalifikacja wstępna',
      'karta kierowcy',
      'aktualne badania lekarskie i psychotechniczne',
      'transport międzynarodowy',
      'transport krajowy',
      'przewóz ładunków',
      'obsługa tachografu cyfrowego',
      'zestaw z naczepą plandeką',
      'dbałość o powierzony pojazd'
    ],
    tips: [
      'Uprawnienia wypisz na samej górze CV: kategorie prawa jazdy, kwalifikacja, karta kierowcy, badania z datami ważności. Rekruter sprawdza to w pierwszej kolejności.',
      'Opisz trasy i rodzaj transportu: kraj, Europa, dystrybucja, ruch wahadłowy. Dodaj, czy pracowałeś w systemie tygodniowym czy z powrotami do bazy.',
      'Wymień pojazdy i naczepy, którymi jeździłeś: plandeka, chłodnia, cysterna, wywrotka. Doświadczenie z tym samym typem jest dużym atutem.',
      'Jeśli masz uprawnienia ADR lub HDS, dodaj je osobno. Są często wymagane w lepiej płatnych ogłoszeniach.'
    ],
    sample: {
      name: 'Krzysztof Mazur',
      headline: 'Kierowca kat. C+E',
      contact: ['+48 600 000 005', 'krzysztof.mazur@example.com', 'Konin', 'linkedin.com/in/krzysztof-mazur-przyklad'],
      summary: 'Jestem kierowcą kat. C+E z ośmioletnim doświadczeniem, obecnie w transporcie międzynarodowym zestawem z naczepą plandeką. Mam kwalifikację wstępną, kartę kierowcy i aktualne badania, a wcześniej jeździłem w dystrybucji krajowej.',
      skills: [
        'Prawo jazdy kat. B, C, C+E',
        'Kwalifikacja wstępna i szkolenie okresowe',
        'Karta kierowcy',
        'Obsługa tachografu cyfrowego',
        'Zabezpieczanie ładunku',
        'Wypełnianie dokumentów CMR',
        'Codzienna kontrola stanu pojazdu',
        'Uprawnienia ADR podstawowe'
      ],
      languages: ['niemiecki A2'],
      jobs: [
        {
          title: 'Kierowca kat. C+E – transport międzynarodowy',
          company: 'Trans-Wektor Sp. z o.o.',
          period: '05.2020 – obecnie',
          bullets: [
            'Przewóz ładunków paletowych na trasach Polska–Niemcy–Holandia w systemie tygodniowym.',
            'Prowadzenie dokumentacji CMR i rozliczanie czasu pracy z tachografu cyfrowego.',
            'Jazda bez szkód z winy kierowcy przez cały okres zatrudnienia.'
          ]
        },
        {
          title: 'Kierowca kat. C – dystrybucja krajowa',
          company: 'Hurtownia Polar Sp. z o.o.',
          period: '03.2016 – 04.2020',
          bullets: [
            'Dostawy towaru do około 15 sklepów dziennie na terenie województwa wielkopolskiego.',
            'Rozładunek z użyciem windy załadowczej i wózka paletowego.',
            'Codzienna kontrola stanu technicznego pojazdu i zgłaszanie usterek.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół Technicznych w Koninie',
        degree: 'Mechanik pojazdów samochodowych',
        period: '2009 – 2012'
      }
    },
    faq: [
      {
        q: 'Jakie dokumenty kierowca powinien wpisać w CV?',
        a: 'Wpisz kategorie prawa jazdy, kwalifikację wstępną lub ostatnie szkolenie okresowe, kartę kierowcy oraz badania lekarskie i psychotechniczne. Przy każdym dokumencie podaj datę ważności, jeśli ją ma. Dodatkowe uprawnienia, jak ADR czy HDS, dodaj osobno.'
      },
      {
        q: 'Czy warto wpisać znajomość języka obcego w CV kierowcy?',
        a: 'Tak, szczególnie przy transporcie międzynarodowym. Nawet podstawowy niemiecki lub angielski ułatwia kontakt na załadunku i rozładunku. Podaj realny poziom, bo pracodawca może to sprawdzić krótką rozmową.'
      }
    ]
  },
  {
    slug: 'pielegniarka',
    category: 'Zdrowie i opieka',
    name: 'Pielęgniarka / Pielęgniarz',
    title: 'CV pielęgniarki: wzór i wskazówki',
    metaDescription: 'CV pielęgniarki dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert i wskazówki, jak opisać PWZ, oddziały i kursy specjalistyczne.',
    intro: 'W ogłoszeniach dla pielęgniarek podstawowym wymaganiem jest prawo wykonywania zawodu (PWZ). Pracodawcy pytają o doświadczenie na konkretnym oddziale, kursy specjalistyczne i specjalizację. Ważna jest też gotowość do pracy w systemie zmianowym i obsługa dokumentacji medycznej.',
    keywords: [
      'prawo wykonywania zawodu pielęgniarki (PWZ)',
      'wykształcenie wyższe pielęgniarskie',
      'kurs specjalistyczny',
      'specjalizacja',
      'dokumentacja medyczna',
      'elektroniczna dokumentacja medyczna',
      'praca w systemie równoważnym',
      'opieka nad pacjentem',
      'podawanie leków',
      'praca w zespole terapeutycznym'
    ],
    tips: [
      'Wpisz prawo wykonywania zawodu wyraźnie, w osobnej sekcji z uprawnieniami. Nie musisz podawać numeru PWZ w CV, wystarczy informacja, że je posiadasz.',
      'Przy każdym miejscu pracy podaj nazwę oddziału. Doświadczenie na internie, chirurgii czy OIT to dla rekrutera zupełnie różne profile.',
      'Wypisz kursy specjalistyczne i kwalifikacyjne oraz specjalizację z rokiem ukończenia. Dopasuj kolejność do wymagań z ogłoszenia.',
      'Opisz konkretne czynności, które wykonujesz samodzielnie, na przykład kaniulację żył obwodowych czy prowadzenie dokumentacji w systemie elektronicznym.'
    ],
    sample: {
      name: 'Monika Kaczmarek',
      headline: 'Pielęgniarka, oddział chorób wewnętrznych',
      contact: ['+48 600 000 006', 'monika.kaczmarek@example.com', 'Lublin', 'linkedin.com/in/monika-kaczmarek-przyklad'],
      summary: 'Jestem pielęgniarką z prawem wykonywania zawodu i sześcioletnim doświadczeniem, obecnie na oddziale chorób wewnętrznych. Wcześniej pracowałam w przychodni POZ, gdzie prowadziłam szczepienia i edukację pacjentów.',
      skills: [
        'Prawo wykonywania zawodu pielęgniarki (PWZ)',
        'Kurs specjalistyczny: wykonywanie i interpretacja zapisu EKG',
        'Kurs specjalistyczny: szczepienia ochronne',
        'Kaniulacja żył obwodowych',
        'Przygotowanie i podawanie leków',
        'Elektroniczna dokumentacja medyczna',
        'Edukacja zdrowotna pacjentów'
      ],
      languages: ['angielski B1'],
      jobs: [
        {
          title: 'Pielęgniarka odcinkowa',
          company: 'Szpital Wojewódzki w Lublinie, Oddział Chorób Wewnętrznych',
          period: '10.2021 – obecnie',
          bullets: [
            'Opieka nad pacjentami na odcinku 12 łóżek w systemie równoważnym.',
            'Przygotowanie i podawanie leków, kaniulacja, pobieranie krwi do badań.',
            'Prowadzenie elektronicznej dokumentacji medycznej i przekazywanie dyżuru.'
          ]
        },
        {
          title: 'Pielęgniarka POZ',
          company: 'Przychodnia Rodzinna Zdrowie Sp. z o.o.',
          period: '09.2019 – 09.2021',
          bullets: [
            'Wykonywanie szczepień ochronnych u dzieci i dorosłych.',
            'Wykonywanie zapisu EKG i pomiarów parametrów życiowych.',
            'Edukacja pacjentów z cukrzycą i nadciśnieniem w zakresie samokontroli.'
          ]
        }
      ],
      education: {
        school: 'Uniwersytet Medyczny w Lublinie',
        degree: 'Magister pielęgniarstwa',
        period: '2014 – 2019'
      }
    },
    faq: [
      {
        q: 'Czy w CV pielęgniarki trzeba podać numer PWZ?',
        a: 'Nie trzeba. W CV wystarczy informacja, że masz prawo wykonywania zawodu. Pracodawca i tak poprosi o dokument przy zatrudnieniu.'
      },
      {
        q: 'Jak opisać w CV kilka oddziałów w jednym szpitalu?',
        a: 'Możesz podać szpital jako jedno miejsce pracy, a pod nim wymienić oddziały z okresami. Przy każdym oddziale dodaj jedną lub dwie najważniejsze czynności. Dzięki temu rekruter od razu widzi, czy masz doświadczenie, którego szuka.'
      }
    ]
  },
  {
    slug: 'ksiegowa',
    category: 'Biuro, finanse i HR',
    name: 'Księgowa / Księgowy',
    title: 'CV księgowej: wzór i wskazówki',
    metaDescription: 'CV księgowej dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert i wskazówki, jak opisać zakres księgowań, deklaracje i programy.',
    intro: 'Ogłoszenia dla księgowych zwykle określają wymagany zakres: pełna księgowość, księga przychodów i rozchodów lub kadry i płace. Pracodawcy pytają o znajomość przepisów podatkowych, programów finansowo-księgowych i Excela. Często liczy się doświadczenie w biurze rachunkowym lub dziale finansowym podobnej firmy.',
    keywords: [
      'pełna księgowość',
      'księga przychodów i rozchodów',
      'deklaracje VAT i JPK',
      'rozrachunki z kontrahentami',
      'uzgadnianie sald',
      'przygotowanie sprawozdań finansowych',
      'programy finansowo-księgowe',
      'Excel',
      'znajomość przepisów podatkowych',
      'dokładność'
    ],
    tips: [
      'Napisz, jaki zakres księgowości prowadziłaś: pełna księgowość, KPiR, ryczałt. To pierwsze kryterium w większości ogłoszeń.',
      'Podaj liczbę i rodzaj obsługiwanych podmiotów, jeśli pracowałaś w biurze rachunkowym. Spółki, jednoosobowe firmy i fundacje to różne doświadczenia.',
      'Wymień deklaracje i raporty, które przygotowujesz samodzielnie. Odróżnij to wyraźnie od zadań, w których tylko pomagałaś.',
      'Programy opisz ogólnie, jeśli nie chcesz podawać nazw, ale zawsze zaznacz poziom Excela. Tabele przestawne i funkcje wyszukiwania są często wymieniane w ogłoszeniach.'
    ],
    sample: {
      name: 'Ewa Nowicka',
      headline: 'Samodzielna księgowa',
      contact: ['+48 600 000 007', 'ewa.nowicka@example.com', 'Kraków', 'linkedin.com/in/ewa-nowicka-przyklad'],
      summary: 'Od siedmiu lat pracuję w księgowości, obecnie jako samodzielna księgowa w biurze rachunkowym prowadzącym pełną księgowość spółek. Samodzielnie przygotowuję deklaracje VAT, pliki JPK i zamknięcia miesiąca.',
      skills: [
        'Pełna księgowość spółek',
        'Księga przychodów i rozchodów',
        'Deklaracje VAT i pliki JPK',
        'Zamknięcie miesiąca i roku',
        'Uzgadnianie sald i rozrachunków',
        'Programy finansowo-księgowe',
        'Excel: tabele przestawne, funkcje wyszukiwania'
      ],
      languages: ['angielski B1'],
      jobs: [
        {
          title: 'Samodzielna księgowa',
          company: 'Biuro Rachunkowe Bilans i Wspólnicy Sp. z o.o.',
          period: '02.2021 – obecnie',
          bullets: [
            'Prowadzenie pełnej księgowości 12 spółek handlowych i usługowych.',
            'Przygotowanie deklaracji VAT, plików JPK oraz zamknięć miesięcznych.',
            'Udział w przygotowaniu sprawozdań finansowych za rok obrotowy.'
          ]
        },
        {
          title: 'Młodsza księgowa',
          company: 'Przedsiębiorstwo Handlowe Orzech Sp. z o.o.',
          period: '07.2018 – 01.2021',
          bullets: [
            'Księgowanie faktur zakupowych i sprzedażowych w programie finansowo-księgowym.',
            'Uzgadnianie sald z kontrahentami i przygotowanie wezwań do zapłaty.',
            'Przygotowanie zestawień kosztów w Excelu dla kierownika działu.'
          ]
        }
      ],
      education: {
        school: 'Uniwersytet Ekonomiczny w Krakowie',
        degree: 'Magister, finanse i rachunkowość',
        period: '2013 – 2018'
      }
    },
    faq: [
      {
        q: 'Czy w CV księgowej wpisywać nazwy programów księgowych?',
        a: 'Możesz, jeśli ogłoszenie wymienia konkretny program, a Ty go znasz. W innym przypadku wystarczy opis „programy finansowo-księgowe” i zakres prac, które w nich wykonujesz. Rekruter wie, że księgowa szybko uczy się nowego systemu.'
      },
      {
        q: 'Jak pokazać w CV samodzielność w księgowości?',
        a: 'Wypisz zadania, które wykonujesz od początku do końca bez nadzoru, na przykład zamknięcie miesiąca lub deklaracje VAT. Podaj liczbę obsługiwanych podmiotów. To mówi więcej niż samo słowo „samodzielna” w nagłówku.'
      }
    ]
  },
  {
    slug: 'programista',
    category: 'IT i technologie',
    name: 'Programista / Programistka',
    title: 'CV programisty: wzór i wskazówki',
    metaDescription: 'CV programisty dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert IT i wskazówki, jak opisać projekty i stos technologiczny.',
    intro: 'Ogłoszenia dla programistów zaczynają się zwykle od listy technologii, a dopiero potem opisują zadania. Pracodawcy patrzą na doświadczenie z konkretnym językiem i frameworkiem, pracę z Gitem, testami i bazami danych. Coraz częściej liczy się też znajomość chmury, Dockera i praca w metodykach zwinnych.',
    keywords: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'REST API',
      'SQL',
      'Git',
      'Docker',
      'testy jednostkowe',
      'Scrum'
    ],
    tips: [
      'Umieść technologie z ogłoszenia, które naprawdę znasz, w widocznej sekcji umiejętności. Rekruterzy i systemy ATS często wyszukują je po nazwach.',
      'Przy każdym stanowisku opisz, co zbudowałeś lub zmieniłeś, a nie tylko w jakim zespole byłeś. Jeśli możesz, dodaj efekt, na przykład skrócenie czasu ładowania strony.',
      'Dodaj link do GitHuba lub portfolio, jeśli są tam projekty, które chcesz pokazać. Usuń lub ukryj stare repozytoria, z których nie jesteś zadowolony.',
      'Nie wypisuj każdej technologii, z którą miałeś styczność. Lepiej krótka lista narzędzi, o których możesz swobodnie rozmawiać na rozmowie technicznej.'
    ],
    sample: {
      name: 'Paweł Jankowski',
      headline: 'Frontend Developer (React, TypeScript)',
      contact: ['+48 600 000 008', 'pawel.jankowski@example.com', 'Gdańsk', 'linkedin.com/in/pawel-jankowski-przyklad'],
      summary: 'Jestem programistą frontend z czteroletnim doświadczeniem w React i TypeScript, obecnie w zespole rozwijającym system rezerwacji online. Wcześniej tworzyłem strony i panele administracyjne w JavaScript dla klientów software house’u.',
      skills: [
        'TypeScript, JavaScript',
        'React, Redux',
        'HTML, CSS, Sass',
        'REST API',
        'Jest, React Testing Library',
        'Git, GitLab CI',
        'Docker (podstawy)',
        'Scrum'
      ],
      languages: ['angielski B2'],
      jobs: [
        {
          title: 'Frontend Developer',
          company: 'Rezerwacje Online Sp. z o.o.',
          period: '04.2022 – obecnie',
          bullets: [
            'Rozwój aplikacji do rezerwacji wizyt w React i TypeScript, używanej przez kilkaset placówek.',
            'Przepisanie modułu kalendarza z klas na komponenty funkcyjne i hooki.',
            'Wprowadzenie testów jednostkowych w Jest dla kluczowych formularzy.'
          ]
        },
        {
          title: 'Junior Frontend Developer',
          company: 'Software House Kodowa Przystań',
          period: '07.2020 – 03.2022',
          bullets: [
            'Tworzenie stron i paneli administracyjnych w JavaScript i React dla klientów zewnętrznych.',
            'Integracja interfejsów z REST API przygotowanym przez zespół backendu.',
            'Udział w przeglądach kodu i planowaniu sprintów w Scrumie.'
          ]
        }
      ],
      education: {
        school: 'Politechnika Gdańska',
        degree: 'Inżynier, informatyka',
        period: '2016 – 2020'
      }
    },
    faq: [
      {
        q: 'Czy programista powinien mieć CV dłuższe niż jedna strona?',
        a: 'Przy kilku latach doświadczenia zwykle wystarczy jedna strona. Dwie strony mają sens przy długiej karierze i wielu projektach. Ważniejsze od długości jest to, żeby technologie z ogłoszenia były łatwe do znalezienia.'
      },
      {
        q: 'Jak opisać projekty, jeśli są objęte tajemnicą firmy?',
        a: 'Nie podawaj nazw klientów ani szczegółów, których nie wolno ujawniać. Opisz ogólnie rodzaj systemu, technologie i swój wkład, na przykład „aplikacja do obsługi zamówień dla sieci handlowej”. Taki opis wystarczy rekruterowi.'
      }
    ]
  },
  {
    slug: 'przedstawiciel-handlowy',
    category: 'Handel i obsługa klienta',
    name: 'Przedstawiciel handlowy',
    title: 'CV przedstawiciela handlowego: wzór',
    metaDescription: 'CV przedstawiciela handlowego dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert i wskazówki, jak opisać wyniki i region.',
    intro: 'W ogłoszeniach dla przedstawicieli handlowych pracodawcy szukają osób samodzielnych, które pozyskują klientów i dbają o stałe relacje. Prawie zawsze wymagane jest prawo jazdy kat. B i gotowość do podróży po regionie. Liczy się doświadczenie w sprzedaży B2B i realizacja planów sprzedażowych.',
    keywords: [
      'sprzedaż B2B',
      'pozyskiwanie nowych klientów',
      'budowanie relacji z klientami',
      'realizacja planów sprzedażowych',
      'prawo jazdy kat. B',
      'praca w terenie',
      'negocjacje handlowe',
      'raportowanie w systemie CRM',
      'samodzielność',
      'samochód służbowy'
    ],
    tips: [
      'Podaj region, który obsługiwałeś, i rodzaj klientów: sklepy, hurtownie, firmy produkcyjne. Pracodawca chce wiedzieć, czy znasz podobny rynek.',
      'Opisz wyniki liczbami, które możesz uzasadnić: liczbę nowych klientów, realizację planu, wzrost obrotów w regionie. Na rozmowie mogą o nie dopytać.',
      'Wymień, co sprzedawałeś. Doświadczenie z podobnym produktem, na przykład materiałami budowlanymi czy kosmetykami, skraca czas wdrożenia.',
      'Zaznacz prawo jazdy kat. B i gotowość do pracy w terenie. To wymóg w niemal każdym ogłoszeniu dla tego stanowiska.'
    ],
    sample: {
      name: 'Jakub Wiśniewski',
      headline: 'Przedstawiciel handlowy B2B',
      contact: ['+48 600 000 009', 'jakub.wisniewski@example.com', 'Katowice', 'linkedin.com/in/jakub-wisniewski-przyklad'],
      summary: 'Od sześciu lat pracuję w sprzedaży B2B, obecnie jako przedstawiciel handlowy materiałów budowlanych na Śląsku. Pozyskuję nowych klientów wśród hurtowni i składów budowlanych oraz dbam o stałą współpracę z obecnymi.',
      skills: [
        'Sprzedaż B2B',
        'Pozyskiwanie nowych klientów',
        'Negocjacje handlowe',
        'Prowadzenie bazy klientów w systemie CRM',
        'Przygotowanie ofert i prezentacji',
        'Prawo jazdy kat. B',
        'Excel'
      ],
      languages: ['angielski B1', 'niemiecki A2'],
      jobs: [
        {
          title: 'Przedstawiciel handlowy',
          company: 'Budmat Dystrybucja Sp. z o.o.',
          period: '03.2021 – obecnie',
          bullets: [
            'Obsługa około 70 hurtowni i składów budowlanych w województwie śląskim.',
            'Pozyskanie 18 nowych stałych klientów w ciągu ostatnich dwóch lat.',
            'Prowadzenie bazy klientów i raportowanie wizyt w systemie CRM.'
          ]
        },
        {
          title: 'Doradca handlowy',
          company: 'Hurtownia Narzędzi Mocny Chwyt',
          period: '05.2018 – 02.2021',
          bullets: [
            'Sprzedaż narzędzi i elektronarzędzi firmom wykonawczym i warsztatom.',
            'Przygotowanie ofert cenowych i negocjowanie warunków dostaw.',
            'Realizacja kwartalnego planu sprzedaży w każdym kwartale 2020 roku.'
          ]
        }
      ],
      education: {
        school: 'Uniwersytet Ekonomiczny w Katowicach',
        degree: 'Licencjat, zarządzanie',
        period: '2015 – 2018'
      }
    },
    faq: [
      {
        q: 'Czy przedstawiciel handlowy musi podawać w CV wyniki sprzedaży?',
        a: 'Nie musi, ale to jeden z najmocniejszych elementów takiego CV. Podawaj liczby, które znasz i potrafisz wyjaśnić. Jeśli nie możesz ujawniać kwot, użyj liczby klientów lub realizacji planu.'
      },
      {
        q: 'Jak napisać CV przedstawiciela, gdy zmieniam branżę?',
        a: 'Podkreśl umiejętności niezależne od produktu: pozyskiwanie klientów, negocjacje, organizację pracy w terenie. Napisz, jakich klientów obsługiwałeś, bo podobny typ odbiorców ułatwia start. W liście motywacyjnym wyjaśnij, dlaczego interesuje Cię nowa branża.'
      }
    ]
  },
  {
    slug: 'recepcjonistka',
    category: 'Biuro, finanse i HR',
    name: 'Recepcjonistka / Recepcjonista',
    title: 'CV recepcjonistki: wzór i wskazówki',
    metaDescription: 'CV recepcjonistki dopasowane do ogłoszenia. Przykład, słowa kluczowe z ofert pracy w hotelu i biurze oraz praktyczne wskazówki.',
    intro: 'W ogłoszeniach dla recepcjonistek pracodawcy szukają osób uprzejmych, dobrze zorganizowanych i swobodnie posługujących się komputerem. W hotelach liczy się znajomość języka angielskiego i systemu rezerwacji. W biurach i przychodniach ważne są obsługa telefonów, korespondencji i kalendarza spotkań.',
    keywords: [
      'obsługa recepcji',
      'obsługa gości',
      'meldowanie i wymeldowanie gości',
      'system rezerwacyjny',
      'obsługa centrali telefonicznej',
      'obsługa korespondencji',
      'znajomość języka angielskiego',
      'pakiet MS Office',
      'wysoka kultura osobista',
      'praca zmianowa'
    ],
    tips: [
      'Napisz, gdzie pracowałaś: hotel, biuro, przychodnia. Każde z tych miejsc wymaga trochę innych umiejętności i rekruter szuka podobnego doświadczenia.',
      'Języki obce opisz realnie i podaj, w jakich sytuacjach ich używasz. W recepcji hotelowej to często warunek zatrudnienia.',
      'Wymień systemy i narzędzia, z których korzystasz: system rezerwacji, kalendarz, centrala telefoniczna, poczta e-mail. Wystarczy opis ogólny.',
      'Pokaż skalę pracy, na przykład liczbę pokoi w hotelu albo liczbę pracowników w biurze. Pomaga to ocenić, czy poradzisz sobie w nowym miejscu.'
    ],
    sample: {
      name: 'Julia Dąbrowska',
      headline: 'Recepcjonistka hotelowa',
      contact: ['+48 600 000 010', 'julia.dabrowska@example.com', 'Gdynia', 'linkedin.com/in/julia-dabrowska-przyklad'],
      summary: 'Od trzech lat pracuję na recepcji hotelu, gdzie meldowałam gości, obsługiwałam rezerwacje i rozmawiałam z gośćmi po angielsku i niemiecku. Wcześniej pracowałam jako recepcjonistka w biurze, gdzie odpowiadałam za centralę telefoniczną i korespondencję.',
      skills: [
        'Meldowanie i wymeldowanie gości',
        'Obsługa systemu rezerwacyjnego',
        'Przyjmowanie płatności i wystawianie faktur',
        'Obsługa centrali telefonicznej',
        'Obsługa korespondencji i poczty e-mail',
        'Pakiet MS Office',
        'Praca zmianowa'
      ],
      languages: ['angielski B2', 'niemiecki B1'],
      jobs: [
        {
          title: 'Recepcjonistka',
          company: 'Hotel Bursztynowa Fala',
          period: '05.2022 – obecnie',
          bullets: [
            'Meldowanie i wymeldowanie gości w hotelu na 60 pokoi w systemie zmianowym.',
            'Obsługa rezerwacji telefonicznych i mailowych w systemie rezerwacyjnym.',
            'Rozmowy z gośćmi z zagranicy w języku angielskim i niemieckim.'
          ]
        },
        {
          title: 'Recepcjonistka biurowa',
          company: 'Biuro Projektowe Linia Sp. z o.o.',
          period: '09.2020 – 04.2022',
          bullets: [
            'Obsługa centrali telefonicznej i przekazywanie połączeń do 25 pracowników.',
            'Przyjmowanie i wysyłanie korespondencji oraz prowadzenie dziennika pism.',
            'Planowanie sal konferencyjnych i przygotowanie spotkań z klientami.'
          ]
        }
      ],
      education: {
        school: 'Technikum Hotelarskie w Gdyni',
        degree: 'Technik hotelarstwa',
        period: '2016 – 2020'
      }
    },
    faq: [
      {
        q: 'Jaki poziom angielskiego wpisać w CV recepcjonistki?',
        a: 'Wpisz poziom, który odpowiada Twoim realnym umiejętnościom, najlepiej w skali od A1 do C2. W hotelach często wymagany jest poziom co najmniej B1 lub B2. Rekruter może przeprowadzić część rozmowy po angielsku, więc nie zawyżaj oceny.'
      },
      {
        q: 'Czy doświadczenie w recepcji biurowej przyda się w hotelu?',
        a: 'Tak, wiele umiejętności się pokrywa: obsługa telefonów, kontakt z gośćmi, organizacja kalendarza. W CV podkreśl te elementy i dodaj znajomość języków obcych. Hotel nauczy Cię swojego systemu rezerwacji.'
      }
    ]
  }
];

// 10 najpopularniejszych (z miniaturami na stronie głównej) + 40 kolejnych.
export const PROFESSIONS = [...BASE_PROFESSIONS, ...PROFESSIONS_A, ...PROFESSIONS_B];
export const POPULAR_SLUGS = BASE_PROFESSIONS.map((p) => p.slug);

const BASE_ARTICLES = [
  {
    slug: 'jak-dopasowac-cv-do-ogloszenia',
    title: 'Jak dopasować CV do ogłoszenia o pracę',
    metaDescription: 'Jak dopasować CV do konkretnego ogłoszenia: czytanie wymagań, słowa kluczowe, kolejność doświadczenia i uczciwe opisy. Praktyczny poradnik.',
    lead: 'Jedno CV wysyłane na wszystkie oferty zwykle mówi rekruterowi za mało. Dopasowanie dokumentu do ogłoszenia zajmuje kilkanaście minut i pomaga pokazać to, czego pracodawca naprawdę szuka.',
    readMinutes: 5,
    sections: [
      {
        h: 'Przeczytaj ogłoszenie dwa razy',
        p: [
          'Za pierwszym razem przeczytaj ogłoszenie w całości, żeby zrozumieć, czym zajmuje się firma i na czym polega praca. Za drugim razem czytaj z długopisem lub zakreślaczem. Zaznacz wymagania, obowiązki i słowa, które się powtarzają.',
          'Oddziel wymagania konieczne od mile widzianych. Pracodawcy często dzielą je w ogłoszeniu na dwie listy. Jeśli tego nie zrobili, kolejność punktów zwykle podpowiada, co jest najważniejsze.'
        ]
      },
      {
        h: 'Zestaw wymagania ze swoim doświadczeniem',
        p: [
          'Przy każdym zaznaczonym wymaganiu zapisz, gdzie i kiedy wykonywałeś podobne zadanie. Może to być praca, praktyki, wolontariat albo projekt. Tak powstaje lista dowodów, które przeniesiesz do CV.',
          'Jeśli jakiegoś wymagania nie spełniasz, nie dopisuj go na siłę. Zastanów się, czy masz coś bliskiego, na przykład pokrewne narzędzie lub podobny zakres obowiązków. Uczciwie opisane podobieństwo jest lepsze niż umiejętność, której nie obronisz na rozmowie.'
        ]
      },
      {
        h: 'Używaj słów z ogłoszenia, ale zgodnie z prawdą',
        p: [
          'Rekruterzy szukają w CV konkretnych określeń, a część firm przeszukuje aplikacje w systemie po słowach kluczowych. Jeśli w ogłoszeniu jest „obsługa klienta B2B”, a Ty piszesz „kontakt z partnerami biznesowymi”, sens jest ten sam, ale łatwiej go przeoczyć. Warto więc użyć słów pracodawcy.',
          'Zmieniaj nazewnictwo tylko wtedy, gdy opisuje to samo, co robiłeś. Nie dopisuj technologii, uprawnień ani obowiązków, których nie miałeś. Każdy punkt CV może stać się pytaniem na rozmowie.'
        ]
      },
      {
        h: 'Ułóż doświadczenie tak, żeby najważniejsze było na górze',
        p: [
          'W opisie każdego stanowiska przesuń na początek te obowiązki, które pasują do ogłoszenia. Rekruter czyta CV szybko i najwięcej uwagi poświęca pierwszym punktom. Mniej istotne zadania skróć albo usuń.',
          'To samo dotyczy podsumowania zawodowego i listy umiejętności. Podsumowanie napisz pod konkretne stanowisko, w dwóch lub trzech zdaniach. Umiejętności z ogłoszenia, które naprawdę masz, umieść na początku listy.'
        ]
      },
      {
        h: 'Osobne CV na każde ogłoszenie',
        p: [
          'Zapisuj dopasowane CV jako osobne pliki z nazwą firmy lub stanowiska. Dzięki temu wiesz, którą wersję wysłałeś, i możesz do niej wrócić przed rozmową. Unikniesz też wysłania dokumentu z nazwą innej firmy.',
          'Przed wysłaniem przeczytaj CV jeszcze raz i porównaj je z ogłoszeniem. Sprawdź dane kontaktowe, daty i literówki. Jeśli dokument przygotowany na naszej stronie nie pasuje do ogłoszenia, możesz poprosić o bezpłatną poprawkę.'
        ]
      }
    ]
  },
  {
    slug: 'czym-jest-ats',
    title: 'Czym jest ATS i jak przygotować pod niego CV',
    metaDescription: 'Czym jest system ATS, jak rekruterzy wyszukują w nim kandydatów i jak przygotować CV, które system poprawnie odczyta. Proste wskazówki.',
    lead: 'Wiele firm zbiera aplikacje w systemach ATS, zamiast w zwykłej skrzynce mailowej. Warto wiedzieć, jak takie systemy działają, żeby Twoje CV zostało poprawnie odczytane i łatwo się wyszukiwało.',
    readMinutes: 4,
    sections: [
      {
        h: 'Co to jest ATS',
        p: [
          'ATS to skrót od angielskiego applicant tracking system, czyli system do obsługi rekrutacji. Firma publikuje w nim ogłoszenia, zbiera zgłoszenia kandydatów i śledzi, na jakim etapie jest każda osoba. Z takich systemów korzystają zarówno duże firmy, jak i agencje pracy.',
          'Gdy wysyłasz CV przez formularz na stronie firmy lub portalu z ogłoszeniami, dokument często trafia właśnie do ATS. System odczytuje z pliku tekst i zapisuje go w bazie. Później rekruter przegląda te dane, zwykle obok oryginalnego pliku.'
        ]
      },
      {
        h: 'Jak rekruterzy korzystają z ATS',
        p: [
          'Przy dużej liczbie zgłoszeń rekruterzy często filtrują lub przeszukują aplikacje po słowach kluczowych. Mogą wpisać na przykład nazwę technologii, uprawnienia lub stanowiska. Kandydaci, w których CV te słowa występują, łatwiej trafiają na listę do przejrzenia.',
          'To, jak dokładnie działa wyszukiwanie, zależy od systemu i od ustawień firmy. Decyzję o zaproszeniu na rozmowę zwykle podejmuje człowiek. Dlatego CV powinno być czytelne zarówno dla systemu, jak i dla rekrutera.'
        ]
      },
      {
        h: 'Prosty układ jest najbezpieczniejszy',
        p: [
          'Najbezpieczniejszym wyborem jest szablon jednokolumnowy. Tekst w kilku kolumnach, tabelach lub polach tekstowych bywa odczytywany w złej kolejności. Wtedy daty mogą trafić do innego stanowiska, a umiejętności zniknąć z odczytu.',
          'Nie umieszczaj ważnych informacji w obrazkach, ikonach ani nagłówku i stopce dokumentu. Systemy odczytują tekst, a nie grafikę. Wykresy poziomu umiejętności zamień na zwykły opis, na przykład „angielski B2”.'
        ]
      },
      {
        h: 'Standardowe nazwy sekcji',
        p: [
          'Używaj znanych nazw sekcji: Doświadczenie zawodowe, Wykształcenie, Umiejętności, Języki. System i rekruter od razu wiedzą, czego szukać. Pomysłowe nagłówki mogą utrudnić poprawne rozpoznanie treści.',
          'Daty zapisuj w jednym formacie w całym dokumencie, na przykład 03.2022 – obecnie. Przy każdym stanowisku podaj nazwę firmy i miasto lub tryb pracy. Taki porządek ułatwia odczyt.'
        ]
      },
      {
        h: 'Słowa kluczowe z ogłoszenia',
        p: [
          'Przeczytaj ogłoszenie i wypisz z niego nazwy umiejętności, narzędzi, uprawnień i stanowiska. Te, które naprawdę masz, umieść w CV dosłownie w takiej formie, w jakiej występują w ogłoszeniu. Dobrze jest użyć ich zarówno w sekcji umiejętności, jak i w opisie doświadczenia.',
          'Nie wklejaj listy słów kluczowych bez kontekstu ani ukrytym tekstem. Rekruter czyta CV po wyszukaniu i szybko zauważy taki zabieg. Słowa kluczowe mają opisywać Twoje prawdziwe doświadczenie.'
        ]
      },
      {
        h: 'Format pliku',
        p: [
          'Wysyłaj CV w formacie, o który prosi pracodawca. Jeśli nie ma wskazówek, PDF utworzony z edytora tekstu jest zwykle dobrym wyborem. Ważne, żeby tekst dało się zaznaczyć i skopiować, a nie był zeskanowanym obrazem.',
          'Nazwij plik prosto, na przykład imieniem, nazwiskiem i słowem CV. Unikaj polskich znaków w nazwie pliku, jeśli formularz ma z nimi problem. Sama treść dokumentu może oczywiście zawierać polskie litery.'
        ]
      }
    ]
  },
  {
    slug: 'jak-napisac-list-motywacyjny',
    title: 'Jak napisać list motywacyjny pod ogłoszenie',
    metaDescription: 'Jak napisać list motywacyjny dopasowany do ogłoszenia: struktura, długość, konkretne przykłady zamiast ogólników i sprawdzenie przed wysłaniem.',
    lead: 'List motywacyjny uzupełnia CV i pozwala wyjaśnić, dlaczego pasujesz do konkretnego stanowiska. Dobry list jest krótki, odnosi się do ogłoszenia i opiera się na przykładach.',
    readMinutes: 5,
    sections: [
      {
        h: 'Do kogo i jak zacząć',
        p: [
          'Jeśli w ogłoszeniu jest nazwisko osoby prowadzącej rekrutację, zwróć się do niej bezpośrednio, na przykład „Szanowna Pani Anno”. Jeśli go nie ma, użyj formy „Szanowni Państwo”. Unikaj zwrotów, które brzmią jak szablon.',
          'W pierwszym akapicie napisz, na jakie stanowisko aplikujesz i gdzie znalazłeś ogłoszenie. Dodaj jedno zdanie o tym, kim jesteś zawodowo. Rekruter od razu wie, czego dotyczy list.'
        ]
      },
      {
        h: 'Środek listu: wymagania i przykłady',
        p: [
          'W jednym lub dwóch akapitach odnieś się do najważniejszych wymagań z ogłoszenia. Wybierz dwa lub trzy i przy każdym podaj konkretny przykład z pracy. Napisz, co zrobiłeś i z jakim skutkiem.',
          'Nie powtarzaj CV punkt po punkcie. List ma pokazać związek między Twoim doświadczeniem a potrzebami firmy. Możesz też krótko wyjaśnić to, czego nie widać w CV, na przykład zmianę branży lub przerwę w pracy.'
        ]
      },
      {
        h: 'Zakończenie',
        p: [
          'W ostatnim akapicie napisz krótko, dlaczego interesuje Cię ta firma lub to stanowisko. Dodaj, że chętnie porozmawiasz o szczegółach na spotkaniu. Zakończ zwrotem „Z poważaniem” i swoim imieniem i nazwiskiem.',
          'Jeśli ogłoszenie wymaga klauzuli o przetwarzaniu danych osobowych, umieść ją pod listem lub w CV, zgodnie z treścią podaną przez pracodawcę.'
        ]
      },
      {
        h: 'Długość i forma',
        p: [
          'List motywacyjny powinien zmieścić się na jednej stronie. Zwykle wystarczą trzy lub cztery krótkie akapity. Rekruter rzadko czyta dłuższe listy w całości.',
          'Użyj tej samej czcionki i tych samych danych kontaktowych co w CV. Dzięki temu dokumenty wyglądają spójnie. Na górze podaj datę oraz nazwę firmy.'
        ]
      },
      {
        h: 'Unikaj ogólników',
        p: [
          'Zdania typu „jestem osobą komunikatywną i odporną na stres” pojawiają się w wielu listach i niewiele mówią. Zamiast nich opisz sytuację, w której ta cecha się sprawdziła. Jeden przykład przekonuje bardziej niż kilka przymiotników.',
          'Nie kopiuj tego samego listu do różnych firm. Nawet jeśli część treści się powtarza, zmień początek i przykłady tak, żeby pasowały do konkretnego ogłoszenia.'
        ]
      },
      {
        h: 'Sprawdź list przed wysłaniem',
        p: [
          'Przeczytaj list na głos albo poproś kogoś o przeczytanie. Sprawdź nazwę firmy, stanowiska i nazwisko adresata, bo pomyłka w tych miejscach jest bardzo widoczna. Popraw literówki i zbyt długie zdania.',
          'Zapisz list jako PDF, jeśli pracodawca nie prosi o inny format. Jeśli list przygotowany na naszej stronie nie pasuje do ogłoszenia, możesz poprosić o bezpłatną poprawkę.'
        ]
      }
    ]
  }
];
export const ARTICLES = [...BASE_ARTICLES, ...MORE_ARTICLES];
