// Nowe zawody: paczka 05 (PL + tłumaczenia EN/UK/DE).

const pl = [
  {
    slug: "scrum-master",
    category: "IT i technologie",
    name: "Scrum Master",
    title: "CV Scrum Mastera: wzór i wskazówki",
    metaDescription: "CV Scrum Mastera pod konkretne ogłoszenie: przykład, frazy z ofert i rady, jak pokazać facylitację, certyfikat PSM lub CSM i realny wpływ na pracę zespołu.",
    intro: "Firmy szukające Scrum Mastera chcą wiedzieć, ilu zespołom pomagałeś i co się w nich zmieniło dzięki twojej pracy. W polskich ogłoszeniach regularnie pojawiają się certyfikaty PSM I lub CSM, znajomość Jiry i Confluence oraz doświadczenie w skalowaniu, na przykład w SAFe lub LeSS. Rekruterzy odróżniają osobę, która tylko prowadzi spotkania, od kogoś, kto usuwa przeszkody i uczy zespół samoorganizacji. Twoje CV powinno pokazać to drugie na przykładach.",
    keywords: [
      "certyfikat PSM I / CSM",
      "prowadzenie wydarzeń Scrum",
      "facylitacja retrospektyw",
      "usuwanie przeszkód (impedimentów)",
      "Jira i Confluence",
      "Kanban",
      "praca z Product Ownerem nad backlogiem",
      "skalowanie zwinności (SAFe, LeSS)",
      "coaching zespołu",
      "metryki zespołu (velocity, lead time)"
    ],
    tips: [
      "Podaj liczbę i wielkość zespołów, z którymi pracowałeś, oraz typ produktu, np. „2 zespoły po 7 osób, aplikacja bankowa”. To od razu ustawia skalę twojego doświadczenia.",
      "Zamiast listy ceremonii opisz zmiany, które wprowadziłeś: skrócenie lead time, mniej przenoszonych zadań między sprintami, stabilniejsze velocity. Liczby z Jiry są tu najlepszym dowodem.",
      "Certyfikat wpisz z pełną nazwą i organizacją, np. „Professional Scrum Master I (Scrum.org)”. Jeśli ogłoszenie wspomina SAFe, a masz szkolenie SAFe, wpisz je osobno.",
      "Jeśli wcześniej byłeś programistą, testerem lub analitykiem, nie ukrywaj tego. Ogłoszenia często cenią Scrum Mastera, który rozumie technikę pracy zespołu deweloperskiego."
    ],
    sample: {
      name: "Karolina Wieczorek",
      headline: "Scrum Master, PSM II",
      contact: ["+48 600 000 141", "karolina.wieczorek@example.com", "Wrocław", "linkedin.com/in/karolina-wieczorek-przyklad"],
      summary: "Scrum Masterka z pięcioletnim doświadczeniem w zespołach tworzących oprogramowanie dla logistyki i fintechu. Wcześniej testerka manualna, dlatego dobrze rozumiem codzienną pracę deweloperów. Pomagam zespołom dowozić przewidywalnie i samodzielnie rozwiązywać problemy.",
      skills: [
        "Professional Scrum Master I i II (Scrum.org)",
        "Facylitacja retrospektyw i warsztatów",
        "Jira, Confluence, Miro",
        "Kanban i zarządzanie przepływem pracy",
        "Wsparcie Product Ownera w refinemencie backlogu",
        "Praca w środowisku SAFe (PI Planning)",
        "Analiza metryk: velocity, lead time, cycle time"
      ],
      languages: ["angielski C1"],
      jobs: [
        {
          title: "Scrum Master",
          company: "Logisoft Systems Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Prowadzę dwa zespoły (14 osób) rozwijające system do zarządzania flotą i magazynem.",
            "Wprowadziłam limity WIP i przegląd przepływu, co skróciło średni lead time z 11 do 6 dni.",
            "Współorganizuję kwartalne PI Planning dla czterech zespołów w modelu SAFe."
          ]
        },
        {
          title: "Testerka oprogramowania / Scrum Master",
          company: "Finexa Tech Sp. z o.o.",
          period: "03.2017 – 05.2020",
          bullets: [
            "Testy manualne aplikacji płatniczej i przygotowanie przypadków testowych w Jirze.",
            "Od 2019 r. pełniłam rolę Scrum Mastera w zespole sześcioosobowym.",
            "Zaproponowałam definicję ukończenia z kryteriami testowymi, co zmniejszyło liczbę błędów zgłaszanych po wdrożeniu."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Ekonomiczny we Wrocławiu",
        degree: "Informatyka w biznesie, studia magisterskie",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Czy bez certyfikatu PSM lub CSM mam szansę na pracę Scrum Mastera?",
        a: "Tak, ale wiele ogłoszeń wymienia certyfikat jako wymaganie lub mocny atut, a filtry ATS szukają tych skrótów. PSM I zdaje się online bez obowiązkowego kursu, więc to stosunkowo tani sposób na uzupełnienie CV. Do tego czasu opisz konkretnie, jak stosowałeś Scrum w praktyce."
      },
      {
        q: "Jak opisać rolę Scrum Mastera łączoną z inną funkcją?",
        a: "Napisz to wprost w nazwie stanowiska, np. „Programista / Scrum Master”, i rozdziel punkty dotyczące obu ról. Pokaż, ile czasu poświęcałeś na rolę Scrum Mastera i co dzięki temu zmieniło się w zespole. To uczciwe i dobrze odbierane przy zmianie ścieżki."
      },
      {
        q: "Jakie liczby podać w CV Scrum Mastera?",
        a: "Najlepiej te, które pokazują zmianę w czasie: lead time, przewidywalność sprintów, liczbę błędów po wdrożeniu czy częstotliwość wydań. Unikaj samego velocity bez kontekstu, bo każdy zespół liczy je inaczej. Wystarczą dwie, trzy mocne liczby."
      }
    ]
  },
  {
    slug: "analityk-biznesowy",
    category: "IT i technologie",
    name: "Analityk biznesowy / Analityczka biznesowa",
    title: "CV analityka biznesowego: wzór i wskazówki",
    metaDescription: "CV analityka biznesowego dopasowane do oferty: przykład, słowa kluczowe z ogłoszeń i rady, jak opisać zbieranie wymagań, BPMN, UML i współpracę z IT.",
    intro: "Analityk biznesowy tłumaczy potrzeby biznesu na wymagania, które zespół IT może zrealizować, i w ogłoszeniach widać to w każdym punkcie. Pracodawcy pytają o warsztaty z interesariuszami, modelowanie procesów w BPMN 2.0, przypadki użycia w UML i pisanie historyjek użytkownika. Coraz częściej oczekują też podstaw SQL i znajomości branży, np. bankowości, ubezpieczeń lub e-commerce. W CV liczą się projekty, które przeprowadziłeś od analizy do wdrożenia.",
    keywords: [
      "zbieranie i dokumentowanie wymagań",
      "modelowanie procesów w BPMN 2.0",
      "diagramy UML",
      "historyjki użytkownika i kryteria akceptacji",
      "warsztaty z interesariuszami",
      "SQL",
      "Jira i Confluence",
      "Enterprise Architect",
      "analiza procesów AS-IS / TO-BE",
      "certyfikat IREB CPRE lub IIBA"
    ],
    tips: [
      "Przy każdym projekcie napisz, jaki problem biznesowy rozwiązywał i jaki był efekt, np. skrócenie czasu obsługi wniosku. Samo „zbierałem wymagania” niczego nie wyróżnia.",
      "Wymień narzędzia i notacje, których faktycznie używasz: BPMN 2.0, UML, Enterprise Architect, Jira, Confluence. Ogłoszenia podają je wprost, a ATS je wyszukuje.",
      "Pokaż branżę. Analityk z doświadczeniem w ubezpieczeniach lub bankowości ma przewagę w ofertach z tych sektorów, bo zna procesy i regulacje.",
      "Jeśli piszesz zapytania SQL, sprawdzasz dane lub przygotowujesz scenariusze testów akceptacyjnych, dodaj to. Wiele ogłoszeń łączy rolę analityka biznesowego z elementami analizy systemowej."
    ],
    sample: {
      name: "Bartosz Michalak",
      headline: "Analityk biznesowy w projektach ubezpieczeniowych",
      contact: ["+48 600 000 142", "bartosz.michalak@example.com", "Łódź", "linkedin.com/in/bartosz-michalak-przyklad"],
      summary: "Analityk biznesowy z sześcioletnim doświadczeniem w projektach dla ubezpieczeń i obsługi klienta. Prowadzę warsztaty z biznesem, modeluję procesy w BPMN i przygotowuję wymagania zrozumiałe dla zespołów deweloperskich. Mam certyfikat IREB CPRE Foundation Level.",
      skills: [
        "Warsztaty i wywiady z interesariuszami",
        "BPMN 2.0, UML (przypadki użycia, diagramy aktywności)",
        "Historyjki użytkownika i kryteria akceptacji",
        "SQL (zapytania analityczne)",
        "Enterprise Architect, Jira, Confluence",
        "Analiza AS-IS / TO-BE",
        "IREB CPRE Foundation Level"
      ],
      languages: ["angielski B2"],
      jobs: [
        {
          title: "Analityk biznesowy",
          company: "Polisa-Tech Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Analiza i opis wymagań dla nowego systemu likwidacji szkód komunikacyjnych.",
            "Zamodelowanie 18 procesów w BPMN 2.0, co pozwoliło wyeliminować dwa zbędne etapy akceptacji.",
            "Współpraca z zespołem deweloperskim i testerami przy odbiorach kolejnych wydań."
          ]
        },
        {
          title: "Młodszy analityk procesów",
          company: "Centrum Obsługi Klienta Kontakt24 Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Mapowanie procesów obsługi reklamacji i przygotowanie rekomendacji usprawnień.",
            "Raporty z danych CRM przygotowywane w SQL i Excelu dla kierownictwa.",
            "Udział we wdrożeniu nowego modułu CRM jako przedstawiciel biznesu."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Łódzki",
        degree: "Informatyka i ekonometria, studia magisterskie",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Czym w CV różni się analityk biznesowy od systemowego?",
        a: "Analityk biznesowy opisuje głównie procesy, potrzeby i wymagania biznesowe, a systemowy schodzi niżej: do integracji, API i modelu danych. Sprawdź, które zadania dominują w ogłoszeniu, i właśnie je wyeksponuj w opisie doświadczenia. Jeśli robisz jedno i drugie, napisz o tym otwarcie."
      },
      {
        q: "Czy warto wpisać certyfikat IREB lub IIBA?",
        a: "Tak, jeśli go masz, bo część ogłoszeń wymienia go jako atut, szczególnie w dużych firmach i bankach. Podaj pełną nazwę i poziom, np. „IREB CPRE Foundation Level”. Brak certyfikatu nie przekreśla kandydatury, jeśli doświadczenie jest dobrze opisane."
      },
      {
        q: "Jak wejść do analizy biznesowej bez doświadczenia w IT?",
        a: "Pokaż w CV sytuacje, w których opisywałeś procesy, zbierałeś wymagania lub uczestniczyłeś we wdrożeniu systemu jako użytkownik kluczowy. To realne doświadczenie analityczne. Dodaj kurs BPMN lub SQL i przykładowy model procesu, który możesz pokazać na rozmowie."
      }
    ]
  },
  {
    slug: "serwisant-komputerowy",
    category: "IT i technologie",
    name: "Serwisant komputerowy / Technik informatyk",
    title: "CV serwisanta komputerowego: wzór i wskazówki",
    metaDescription: "CV serwisanta komputerowego i technika informatyka: wzór, frazy z ogłoszeń i wskazówki, jak opisać diagnostykę sprzętu, naprawy, sieci i obsługę zgłoszeń.",
    intro: "Ogłoszenia dla serwisantów komputerowych i techników informatyków dotyczą zwykle diagnostyki i naprawy laptopów, komputerów stacjonarnych i drukarek, a także instalacji systemów i podstaw sieci. W serwisach terenowych często wymagane jest prawo jazdy kat. B, a niektórzy pracodawcy oczekują uprawnień SEP do 1 kV. Liczy się samodzielność, porządek w dokumentowaniu napraw i kontakt z klientem. Dobrze napisane CV pokazuje, jakie usterki rozwiązujesz i ile zgłoszeń obsługujesz.",
    keywords: [
      "diagnostyka i naprawa sprzętu komputerowego",
      "instalacja i konfiguracja systemów Windows",
      "naprawa laptopów na poziomie podzespołów",
      "serwis drukarek i urządzeń wielofunkcyjnych",
      "konfiguracja sieci LAN i Wi-Fi",
      "obsługa zgłoszeń w systemie ticketowym",
      "Active Directory (podstawy)",
      "prawo jazdy kat. B",
      "uprawnienia SEP do 1 kV",
      "wykształcenie technik informatyk"
    ],
    tips: [
      "Opisz, jakie naprawy robisz samodzielnie: wymiana matryc, czyszczenie układów chłodzenia, odzyskiwanie danych, lutowanie gniazd. Poziom napraw jest dla pracodawcy kluczowy.",
      "Podaj liczby: ile zgłoszeń dziennie lub miesięcznie obsługujesz i ile urządzeń jest pod twoją opieką. To szybko pokazuje skalę pracy.",
      "Jeśli masz kwalifikacje INF.02 i INF.03 lub dyplom technika informatyka, wpisz je w wykształceniu. Certyfikaty jak CompTIA A+ też warto dodać.",
      "Przy pracy w terenie wpisz prawo jazdy i obszar, który obsługiwałeś. Uprawnienia SEP podaj z grupą i datą ważności."
    ],
    sample: {
      name: "Patryk Sowa",
      headline: "Serwisant komputerowy, technik informatyk",
      contact: ["+48 600 000 143", "patryk.sowa@example.com", "Opole", "linkedin.com/in/patryk-sowa-przyklad"],
      summary: "Technik informatyk z pięcioletnim doświadczeniem w serwisie stacjonarnym i terenowym. Naprawiam laptopy, komputery i drukarki, instaluję systemy i konfiguruję małe sieci biurowe. Mam prawo jazdy kat. B i uprawnienia SEP E do 1 kV.",
      skills: [
        "Diagnostyka i naprawa laptopów oraz PC",
        "Wymiana matryc, klawiatur, dysków i pamięci",
        "Instalacja i konfiguracja Windows 10/11",
        "Serwis drukarek laserowych i urządzeń wielofunkcyjnych",
        "Konfiguracja routerów, przełączników i Wi-Fi",
        "Obsługa zgłoszeń w systemie ticketowym",
        "Uprawnienia SEP E do 1 kV, prawo jazdy kat. B"
      ],
      languages: ["angielski B1"],
      jobs: [
        {
          title: "Serwisant terenowy IT",
          company: "Komp-Serwis Opole Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Obsługa około 25 firm klientów w województwie opolskim, średnio 60 zgłoszeń miesięcznie.",
            "Przygotowanie i wdrożenie 140 stanowisk komputerowych przy przeprowadzce biura klienta.",
            "Serwis drukarek i urządzeń wielofunkcyjnych w ramach umów serwisowych."
          ]
        },
        {
          title: "Technik serwisu komputerowego",
          company: "Laptop-Med s.c.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Naprawy laptopów: wymiana matryc, gniazd zasilania i układów chłodzenia.",
            "Odzyskiwanie danych z uszkodzonych dysków i migracja danych klientów.",
            "Przyjmowanie sprzętu od klientów i wycena napraw."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektrycznych w Opolu",
        degree: "Technik informatyk (kwalifikacje INF.02 i INF.03)",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "Czy uprawnienia SEP są potrzebne serwisantowi komputerowemu?",
        a: "Nie zawsze, ale część pracodawców wymaga ich, szczególnie przy pracy z zasilaczami UPS, szafami serwerowymi lub instalacjami w budynkach klientów. Jeśli je masz, wpisz grupę i datę ważności. Jeśli ogłoszenie ich wymaga, a ich nie masz, możesz napisać, że jesteś gotów zdobyć je przed rozpoczęciem pracy."
      },
      {
        q: "Jak opisać naprawy robione w domu lub dla znajomych?",
        a: "Przy braku doświadczenia zawodowego możesz je wpisać jako projekty, ale rzeczowo: jakie urządzenia, jakie usterki, ile napraw. Unikaj ogólników typu „pasjonat komputerów”. Konkretne przykłady napraw są dla serwisu bardziej przekonujące niż deklaracje."
      }
    ]
  },
  {
    slug: "administrator-baz-danych",
    category: "IT i technologie",
    name: "Administrator baz danych / Administratorka baz danych",
    title: "CV administratora baz danych: wzór i wskazówki",
    metaDescription: "CV administratora baz danych (DBA) pod ogłoszenie: przykład, słowa kluczowe z ofert i rady, jak opisać Oracle, PostgreSQL, MS SQL, backupy i strojenie.",
    intro: "Ogłoszenia dla administratorów baz danych są bardzo techniczne: pracodawca od razu wymienia silniki, wersje i środowisko, np. Oracle 19c, PostgreSQL, Microsoft SQL Server czy bazy w chmurze Azure lub AWS. Kluczowe są kopie zapasowe i odtwarzanie, wysoka dostępność, replikacja oraz strojenie wydajności zapytań. Często wymagana jest dobra znajomość Linuksa i skryptów w Bashu lub PowerShellu, a w bankach również dyżury on-call. CV DBA musi pokazać skalę środowiska, którym zarządzasz.",
    keywords: [
      "administracja Oracle Database",
      "PostgreSQL",
      "Microsoft SQL Server",
      "backup i odtwarzanie (RMAN, pgBackRest)",
      "wysoka dostępność (Data Guard, Always On)",
      "replikacja baz danych",
      "strojenie wydajności i optymalizacja zapytań SQL",
      "administracja Linux",
      "skrypty Bash / PowerShell",
      "bazy danych w chmurze (Azure, AWS)"
    ],
    tips: [
      "Podaj skalę: liczbę instancji, rozmiar baz w TB, liczbę transakcji lub użytkowników. „Opieka nad 120 instancjami PostgreSQL o łącznym rozmiarze 30 TB” mówi więcej niż sama nazwa silnika.",
      "Wymień wersje i technologie HA, z którymi pracowałeś, np. Oracle 19c z Data Guard czy SQL Server Always On. Rekruterzy techniczni sprawdzają właśnie takie szczegóły.",
      "Opisz konkretne usprawnienia: skrócenie czasu backupu, przyspieszenie kluczowego raportu, automatyzację rutynowych zadań. Najlepiej z liczbami przed i po.",
      "Certyfikaty, np. Oracle Certified Professional lub Microsoft Azure Database Administrator Associate, wpisz z pełną nazwą. Dyżury on-call też warto wspomnieć, bo wiele ofert o to pyta."
    ],
    sample: {
      name: "Agnieszka Pawlik",
      headline: "Administratorka baz danych Oracle i PostgreSQL",
      contact: ["+48 600 000 144", "agnieszka.pawlik@example.com", "Gliwice", "linkedin.com/in/agnieszka-pawlik-przyklad"],
      summary: "Administratorka baz danych z siedmioletnim doświadczeniem w środowiskach produkcyjnych dla energetyki i handlu. Odpowiadam za kopie zapasowe, wysoką dostępność i wydajność baz Oracle oraz PostgreSQL. Automatyzuję powtarzalne zadania w Bashu i Ansible.",
      skills: [
        "Oracle Database 19c, RMAN, Data Guard",
        "PostgreSQL 13–16, replikacja strumieniowa, pgBackRest",
        "Strojenie wydajności i analiza planów zapytań",
        "Red Hat Enterprise Linux",
        "Bash, Ansible",
        "Monitoring baz w Zabbix i Grafana",
        "Oracle Certified Professional (OCP)"
      ],
      languages: ["angielski B2"],
      jobs: [
        {
          title: "Administratorka baz danych",
          company: "Energo-IT Serwis Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Opieka nad 45 instancjami Oracle i 80 instancjami PostgreSQL o łącznym rozmiarze ok. 25 TB.",
            "Migracja kluczowego systemu rozliczeń z Oracle 12c do 19c z Data Guard, bez utraty danych.",
            "Skrócenie czasu nocnego backupu z 6 do 2,5 godziny dzięki kopiom przyrostowym i kompresji."
          ]
        },
        {
          title: "Młodsza administratorka baz danych",
          company: "Handlowe Centrum Danych Merkury Sp. z o.o.",
          period: "02.2017 – 05.2020",
          bullets: [
            "Codzienna administracja baz Microsoft SQL Server i PostgreSQL dla systemów sprzedażowych.",
            "Optymalizacja zapytań raportowych, które skróciła generowanie raportu dziennego z 40 do 8 minut.",
            "Udział w dyżurach on-call i obsłudze incydentów produkcyjnych."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska w Gliwicach",
        degree: "Informatyka, studia magisterskie",
        period: "2011 – 2016"
      }
    },
    faq: [
      {
        q: "Czy wpisywać w CV silniki baz, które znam tylko trochę?",
        a: "Tak, ale z wyraźnym zaznaczeniem poziomu, np. „MySQL – podstawowa administracja”. Rozmowy techniczne dla DBA bywają szczegółowe, więc przesadzone deklaracje szybko wychodzą. Lepiej pokazać jeden silnik dogłębnie i drugi uczciwie jako pomocniczy."
      },
      {
        q: "Jak pokazać doświadczenie z chmurą, jeśli pracowałem głównie on-premise?",
        a: "Opisz nawet pojedyncze projekty: migrację bazy testowej do Azure SQL lub Amazon RDS, backupy w chmurze czy pilotaż. Dodaj certyfikat chmurowy, jeśli go zdobyłeś. Firmy wiedzą, że wiele środowisk jest hybrydowych, więc solidne podstawy on-premise są nadal cenione."
      }
    ]
  },
  {
    slug: "murarz",
    category: "Budownictwo i rzemiosło",
    name: "Murarz",
    title: "CV murarza: wzór i wskazówki",
    metaDescription: "CV murarza dopasowane do ogłoszenia: wzór, frazy z ofert pracy i wskazówki, jak opisać murowanie z bloczków, klinkier, tynki, czytanie projektu i budowy.",
    intro: "Pracodawcy szukający murarzy chcą wiedzieć, z jakich materiałów murujesz i przy jakich obiektach pracowałeś: domach jednorodzinnych, blokach czy halach. W ogłoszeniach pojawiają się bloczki silikatowe, pustaki ceramiczne, beton komórkowy i cegła klinkierowa, a także czytanie projektu budowlanego. Często wymagane są aktualne badania lekarskie do pracy na wysokości oraz prawo jazdy kat. B. Dobrze, gdy CV pokazuje, że pracujesz samodzielnie i potrafisz poprowadzić mniejszą brygadę.",
    keywords: [
      "murowanie ścian z bloczków silikatowych",
      "murowanie z pustaków ceramicznych",
      "beton komórkowy",
      "murowanie z cegły klinkierowej",
      "czytanie projektu budowlanego",
      "tynkowanie",
      "wykonywanie nadproży i wieńców",
      "praca na rusztowaniach",
      "badania do pracy na wysokości",
      "prawo jazdy kat. B"
    ],
    tips: [
      "Wymień materiały, z którymi pracujesz, i rodzaj murów: nośne, działowe, licowe. Murowanie klinkieru licowego to osobna umiejętność, którą warto wyraźnie zaznaczyć.",
      "Podaj typy budów i skalę, np. „domy jednorodzinne w stanie surowym, ok. 12 budynków rocznie” lub „budynki wielorodzinne do 5 kondygnacji”.",
      "Jeśli kierujesz brygadą, napisz, ilu ludzi i za co odpowiadasz: rozmierzenie, kontrola pionów, zamawianie materiału. To podnosi twoją wartość w ofertach na brygadzistę.",
      "Wpisz badania wysokościowe, szkolenie BHP i prawo jazdy. Jeśli pracowałeś za granicą, dodaj kraj i język, bo agencje często o to pytają."
    ],
    sample: {
      name: "Stanisław Wróbel",
      headline: "Murarz, brygadzista budów domów jednorodzinnych",
      contact: ["+48 600 000 145", "stanislaw.wrobel@example.com", "Siedlce", "linkedin.com/in/stanislaw-wrobel-przyklad"],
      summary: "Murarz z czternastoletnim doświadczeniem przy budowie domów jednorodzinnych i budynków wielorodzinnych. Muruję z silikatów, ceramiki, betonu komórkowego i klinkieru, czytam projekt budowlany i prowadzę trzyosobową brygadę. Mam aktualne badania do pracy na wysokości i prawo jazdy kat. B.",
      skills: [
        "Murowanie ścian nośnych i działowych z silikatów i ceramiki",
        "Murowanie elewacji z cegły klinkierowej",
        "Beton komórkowy na zaprawę cienkowarstwową",
        "Wykonywanie nadproży, wieńców i kominów",
        "Czytanie projektu budowlanego",
        "Kierowanie brygadą murarską",
        "Badania wysokościowe, prawo jazdy kat. B"
      ],
      languages: ["niemiecki A2"],
      jobs: [
        {
          title: "Murarz – brygadzista",
          company: "Dom-Bud Siedlce Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Prowadzenie trzyosobowej brygady przy budowie około 10 domów jednorodzinnych rocznie w stanie surowym.",
            "Rozmierzanie ścian według projektu, kontrola pionów i poziomów oraz odbiory z kierownikiem budowy.",
            "Murowanie elewacji z klinkieru i kominów systemowych."
          ]
        },
        {
          title: "Murarz",
          company: "Przedsiębiorstwo Budowlane Mazowsze-Bud Sp. z o.o.",
          period: "04.2010 – 05.2020",
          bullets: [
            "Murowanie ścian nośnych i działowych w budynkach wielorodzinnych do 5 kondygnacji.",
            "Wykonywanie nadproży, wieńców i zbrojenia wspólnie z ekipą cieśli.",
            "Praca na rusztowaniach z zachowaniem zasad BHP."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych nr 2 w Siedlcach",
        degree: "Murarz-tynkarz",
        period: "2007 – 2010"
      }
    },
    faq: [
      {
        q: "Czy murarz potrzebuje w ogóle CV?",
        a: "Coraz częściej tak, bo firmy budowlane i agencje pracy przyjmują zgłoszenia przez formularze i portale. Wystarczy jedna strona: materiały, typy budów, uprawnienia i telefon. Krótkie CV pozwala też szybciej przejść do rozmowy z kierownikiem budowy."
      },
      {
        q: "Jak wpisać doświadczenie z pracy na własny rachunek lub „na czarno”?",
        a: "Pracę we własnej firmie wpisz normalnie, z nazwą działalności i zakresem robót. Przy pracy bez umowy opisz doświadczenie uczciwie, np. jako „prace murarskie przy budowie domów jednorodzinnych” z przybliżonymi latami, bez wymyślania pracodawcy. Na rozmowie liczą się umiejętności, a te można sprawdzić na budowie."
      },
      {
        q: "Czy warto wpisać zdjęcia swoich realizacji?",
        a: "W samym CV raczej nie, ale możesz dodać link do albumu lub napisać, że pokażesz zdjęcia na rozmowie. Przy pracy z klinkierem i elewacjami zdjęcia realizacji bywają mocnym argumentem. Zadbaj, by nie było na nich danych klientów ani adresów."
      }
    ]
  },
  {
    slug: "stolarz",
    category: "Budownictwo i rzemiosło",
    name: "Stolarz",
    title: "CV stolarza: wzór i wskazówki",
    metaDescription: "CV stolarza pod ogłoszenie: przykład, słowa kluczowe z ofert i rady, jak opisać meble na wymiar, obsługę maszyn CNC, okleiniarki, montaż i czytanie rysunku.",
    intro: "Ogłoszenia dla stolarzy dzielą się na produkcję mebli w zakładzie, stolarkę na wymiar i montaż u klienta, więc CV powinno jasno pokazać, w której z tych ról się odnajdujesz. Pracodawcy pytają o obsługę piły formatowej, okleiniarki i centrów CNC, pracę z płytą laminowaną, MDF i drewnem litym oraz czytanie rysunku technicznego. Przy montażu kuchni i zabudów liczy się dokładność i kontakt z klientem. Doświadczenie w wykończeniu, np. lakierowaniu lub olejowaniu, wyraźnie podnosi wartość kandydata.",
    keywords: [
      "produkcja mebli na wymiar",
      "obsługa piły formatowej",
      "obsługa okleiniarki",
      "obsługa maszyn CNC",
      "praca z płytą laminowaną i MDF",
      "obróbka drewna litego",
      "montaż kuchni i zabudów",
      "czytanie rysunku technicznego",
      "lakierowanie i olejowanie drewna",
      "prawo jazdy kat. B"
    ],
    tips: [
      "Napisz, które maszyny obsługujesz samodzielnie, a przy CNC – czy tylko ładujesz detale, czy także przygotowujesz programy. To duża różnica dla pracodawcy.",
      "Podaj rodzaje wyrobów: kuchnie, szafy wnękowe, schody, drzwi, meble z litego drewna. Stolarz schodowy i stolarz meblowy to w ogłoszeniach często różne stanowiska.",
      "Jeśli montujesz u klientów, dodaj liczbę realizacji i to, czy pracujesz samodzielnie. Prawo jazdy kat. B jest wtedy praktycznie zawsze wymagane.",
      "Programy do projektowania mebli, z których korzystasz, wpisz z nazwą. Umiejętność przygotowania rozkroju to atut w małych zakładach."
    ],
    sample: {
      name: "Jakub Zając",
      headline: "Stolarz meblowy, meble na wymiar i montaż",
      contact: ["+48 600 000 146", "jakub.zajac@example.com", "Nowy Sącz", "linkedin.com/in/jakub-zajac-przyklad"],
      summary: "Stolarz z dziewięcioletnim doświadczeniem w produkcji i montażu mebli na wymiar. Obsługuję piłę formatową, okleiniarkę i centrum CNC, pracuję z płytą laminowaną, MDF i dębem. Samodzielnie montuję kuchnie i zabudowy u klientów.",
      skills: [
        "Piła formatowa, okleiniarka, wiertarka wielowrzecionowa",
        "Obsługa centrum CNC i podstawowe zmiany w programach",
        "Meble z płyty laminowanej, MDF lakierowanego i drewna litego",
        "Montaż kuchni, szaf wnękowych i zabudów",
        "Czytanie rysunku technicznego i przygotowanie rozkroju",
        "Olejowanie i lakierowanie drewna",
        "Prawo jazdy kat. B"
      ],
      languages: ["angielski A2"],
      jobs: [
        {
          title: "Stolarz – montażysta",
          company: "Meble Sądeckie Drewmar Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Produkcja kuchni i szaf na wymiar według projektów, ok. 60 realizacji rocznie.",
            "Samodzielny montaż mebli u klientów, w tym dopasowanie do krzywych ścian i podłączeń.",
            "Obsługa centrum CNC przy wierceniu i frezowaniu frontów MDF."
          ]
        },
        {
          title: "Stolarz",
          company: "Zakład Stolarski Brzoza s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Wykonywanie stołów, schodów i drzwi z drewna litego.",
            "Szlifowanie, bejcowanie i olejowanie gotowych wyrobów.",
            "Rozkrój płyt na pile formatowej i oklejanie krawędzi."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Drzewnych w Nowym Sączu",
        degree: "Stolarz",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Czy w CV stolarza wpisywać doświadczenie z warsztatu przydomowego?",
        a: "Tak, jeśli wykonywałeś realne zlecenia lub większe projekty, np. meble czy schody dla znajomych. Opisz, co zrobiłeś, z jakiego materiału i jakimi narzędziami. Przy braku stażu w zakładzie zdjęcia wyrobów mogą przekonać pracodawcę bardziej niż dyplom."
      },
      {
        q: "Czy pracodawcy wymagają uprawnień na maszyny stolarskie?",
        a: "Do typowych maszyn stolarskich nie ma osobnych państwowych uprawnień, jak przy wózkach widłowych, ale pracodawca musi przeszkolić pracownika na stanowisku. W CV wystarczy wpisać maszyny, które obsługujesz samodzielnie. Osobno warto podać uprawnienia UDT, jeśli obsługujesz np. wózek w magazynie płyt."
      }
    ]
  },
  {
    slug: "dekarz",
    category: "Budownictwo i rzemiosło",
    name: "Dekarz",
    title: "CV dekarza: wzór i wskazówki",
    metaDescription: "CV dekarza dopasowane do oferty pracy: przykład, frazy z ogłoszeń i rady, jak opisać pokrycia dachowe, obróbki blacharskie, papę, membrany i pracę na wysokości.",
    intro: "W ogłoszeniach dla dekarzy pracodawcy wymieniają rodzaje pokryć: dachówkę ceramiczną i betonową, blachodachówkę, blachę na rąbek, papę termozgrzewalną i membrany EPDM lub PVC na dachach płaskich. Ważne są też obróbki blacharskie, rynny i montaż okien dachowych. Praca odbywa się na wysokości, dlatego firmy oczekują aktualnych badań lekarskich i znajomości zasad asekuracji. Często mile widziane są uprawnienia UDT na podesty ruchome oraz prawo jazdy kat. B.",
    keywords: [
      "krycie dachówką ceramiczną i betonową",
      "montaż blachodachówki i blachy na rąbek",
      "papa termozgrzewalna",
      "membrany EPDM / PVC na dachach płaskich",
      "obróbki blacharskie",
      "montaż rynien i okien dachowych",
      "wykonywanie więźby dachowej",
      "badania do pracy na wysokości",
      "uprawnienia UDT na podesty ruchome",
      "prawo jazdy kat. B"
    ],
    tips: [
      "Wymień rodzaje pokryć, które kładziesz samodzielnie. Dekarz od dachów płaskich i papy to w ogłoszeniach często inna osoba niż specjalista od dachówki ceramicznej.",
      "Podaj, czy wykonujesz obróbki blacharskie na zaginarce i czy montujesz okna dachowe. To umiejętności, za które firmy płacą więcej.",
      "Wpisz badania wysokościowe z datą ważności, szkolenie BHP i uprawnienia UDT na podesty, jeśli je masz. Pracodawca od tego zaczyna weryfikację kandydata.",
      "Dodaj skalę: liczbę dachów w sezonie lub metry kwadratowe na obiektach przemysłowych. Szkolenia producentów pokryć też warto wymienić."
    ],
    sample: {
      name: "Mariusz Krawiec",
      headline: "Dekarz-blacharz, pokrycia skośne i płaskie",
      contact: ["+48 600 000 147", "mariusz.krawiec@example.com", "Leszno", "linkedin.com/in/mariusz-krawiec-przyklad"],
      summary: "Dekarz-blacharz z jedenastoletnim doświadczeniem przy dachach domów jednorodzinnych i obiektów przemysłowych. Kładę dachówkę, blachodachówkę, papę i membrany EPDM, wykonuję obróbki blacharskie i montuję okna dachowe. Mam aktualne badania wysokościowe i uprawnienia UDT na podesty ruchome.",
      skills: [
        "Dachówka ceramiczna i betonowa",
        "Blachodachówka i blacha na rąbek stojący",
        "Papa termozgrzewalna i membrany EPDM",
        "Obróbki blacharskie na zaginarce",
        "Montaż okien dachowych i systemów rynnowych",
        "Wykonywanie i naprawa więźby dachowej",
        "Badania wysokościowe, UDT na podesty ruchome"
      ],
      languages: ["niemiecki A2"],
      jobs: [
        {
          title: "Dekarz-blacharz",
          company: "Dach-Mistrz Leszno Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Krycie około 25 dachów jednorodzinnych w sezonie dachówką i blachodachówką.",
            "Wykonywanie obróbek kominów, koszy i attyk oraz montaż okien dachowych.",
            "Renowacja dachów płaskich hal magazynowych membraną EPDM, łącznie ponad 6 000 m²."
          ]
        },
        {
          title: "Pomocnik dekarza, później dekarz",
          company: "Zakład Dekarski Wielkopolanin s.c.",
          period: "03.2013 – 05.2020",
          bullets: [
            "Krycie dachów papą termozgrzewalną na budynkach wielorodzinnych.",
            "Montaż rynien i rur spustowych oraz drobne naprawy więźby.",
            "Praca na wysokości z użyciem szelek i lin asekuracyjnych."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Lesznie",
        degree: "Dekarz",
        period: "2010 – 2013"
      }
    },
    faq: [
      {
        q: "Czy badania wysokościowe trzeba wpisać do CV?",
        a: "Warto, bo to jedno z pierwszych pytań przy rekrutacji dekarza. Wpisz je krótko, np. „aktualne badania do pracy na wysokości, ważne do 2027 r.”. Jeśli wygasły, napisz, że możesz je odnowić przed rozpoczęciem pracy."
      },
      {
        q: "Jak dekarz może się wyróżnić w CV?",
        a: "Najlepiej specjalizacją i konkretami: blacha na rąbek, łupek, dachy zielone czy duże dachy płaskie na halach. Pomagają też szkolenia producentów i umiejętność samodzielnego rozliczania materiału. Ogólne „wszystkie prace dekarskie” mówi rekruterowi niewiele."
      }
    ]
  },
  {
    slug: "malarz-budowlany",
    category: "Budownictwo i rzemiosło",
    name: "Malarz budowlany / Malarka budowlana",
    title: "CV malarza budowlanego: wzór i wskazówki",
    metaDescription: "CV malarza budowlanego pod ogłoszenie: wzór, słowa kluczowe z ofert i wskazówki, jak opisać gładzie, malowanie natryskowe, płyty g-k i prace wykończeniowe.",
    intro: "Ogłoszenia dla malarzy budowlanych rzadko dotyczą samego malowania: pracodawcy szukają osób, które przygotują podłoże, położą gładź, wyszpachlują płyty gipsowo-kartonowe i wykończą ściany na gotowo. Coraz częściej pojawia się malowanie natryskowe agregatem, szczególnie przy dużych obiektach i mieszkaniach deweloperskich. Na elewacjach i w halach liczy się praca na rusztowaniach lub podnośnikach. Firmy wykończeniowe cenią też tapetowanie i techniki dekoracyjne.",
    keywords: [
      "przygotowanie podłoża",
      "gładzie gipsowe",
      "szpachlowanie płyt gipsowo-kartonowych",
      "malowanie natryskowe agregatem",
      "malowanie ścian i sufitów",
      "malowanie elewacji",
      "tapetowanie",
      "tynki i techniki dekoracyjne",
      "praca na rusztowaniach",
      "dokładność i dbałość o czystość"
    ],
    tips: [
      "Opisz cały zakres, który wykonujesz: od gruntowania i szpachlowania po malowanie na gotowo. Pracodawcy szukają ludzi, którzy nie potrzebują osobnego tynkarza do każdej poprawki.",
      "Jeśli malujesz agregatem natryskowym, wpisz to wyraźnie. To umiejętność, o którą coraz częściej pytają firmy pracujące na dużych obiektach.",
      "Podaj typy obiektów i skalę, np. „mieszkania deweloperskie, ok. 2 500 m² ścian miesięcznie w brygadzie” albo „biura i hotele”.",
      "Techniki dekoracyjne, beton architektoniczny czy tapety winylowe dodaj osobno. W ofertach firm wykończeniowych dla klientów prywatnych są dużym atutem."
    ],
    sample: {
      name: "Ewelina Duda",
      headline: "Malarka budowlana, gładzie i malowanie natryskowe",
      contact: ["+48 600 000 148", "ewelina.duda@example.com", "Płock", "linkedin.com/in/ewelina-duda-przyklad"],
      summary: "Malarka budowlana z ośmioletnim doświadczeniem w wykańczaniu mieszkań, biur i obiektów usługowych. Przygotowuję podłoże, kładę gładzie, szpachluję płyty g-k i maluję ręcznie oraz agregatem natryskowym. Wykonuję też tapetowanie i tynki dekoracyjne.",
      skills: [
        "Gruntowanie i przygotowanie podłoża",
        "Gładzie gipsowe, ręcznie i maszynowo",
        "Szpachlowanie spoin płyt g-k",
        "Malowanie natryskowe agregatem airless",
        "Tapetowanie (flizelina, winyl)",
        "Tynki dekoracyjne i beton architektoniczny",
        "Praca na rusztowaniach i podestach"
      ],
      languages: ["angielski A2"],
      jobs: [
        {
          title: "Malarka budowlana",
          company: "Wykończenia Płock Kolor-Dom Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Wykańczanie mieszkań deweloperskich pod klucz, w brygadzie ok. 2 000 m² powierzchni malowanej miesięcznie.",
            "Malowanie natryskowe sufitów i ścian w biurowcach agregatem airless.",
            "Wykonywanie tynków dekoracyjnych i tapetowanie na zlecenie klientów prywatnych."
          ]
        },
        {
          title: "Pomocnik malarza, później malarka",
          company: "Usługi Remontowe Mazur-Rem s.c.",
          period: "05.2016 – 05.2020",
          bullets: [
            "Szlifowanie i gruntowanie ścian oraz zabezpieczanie podłóg i stolarki przed malowaniem.",
            "Kładzenie gładzi i szpachlowanie płyt gipsowo-kartonowych w remontowanych mieszkaniach.",
            "Malowanie klatek schodowych w budynkach wspólnot mieszkaniowych."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Budowlanych w Płocku",
        degree: "Monter zabudowy i robót wykończeniowych w budownictwie",
        period: "2013 – 2016"
      }
    },
    faq: [
      {
        q: "Czy kobieta może skutecznie aplikować na stanowisko malarza budowlanego?",
        a: "Tak, w pracach wykończeniowych pracuje coraz więcej kobiet, a pracodawcy oceniają przede wszystkim jakość i tempo pracy. W CV opisz konkretne realizacje i techniki, tak jak każdy kandydat. Możesz dodać link do zdjęć wykonanych prac."
      },
      {
        q: "Czy wpisywać w CV obsługę agregatu malarskiego, jeśli używałem go rzadko?",
        a: "Tak, ale uczciwie określ poziom, np. „malowanie natryskowe – podstawowe doświadczenie przy sufitach”. Pracodawca może zapytać o rodzaj agregatu i dysze. Lepiej pokazać, że znasz podstawy i chcesz się rozwijać, niż przesadzić."
      },
      {
        q: "Jak opisać krótkie zlecenia remontowe?",
        a: "Zbierz je w jednej pozycji, np. „Prace malarskie na własny rachunek, 2018–2020”, i wymień typowe zlecenia oraz ich liczbę. Dzięki temu CV jest przejrzyste, a doświadczenie nie ginie w długiej liście drobnych prac."
      }
    ]
  },
  {
    slug: "glazurnik",
    category: "Budownictwo i rzemiosło",
    name: "Glazurnik / Płytkarz",
    title: "CV glazurnika: wzór i wskazówki",
    metaDescription: "CV glazurnika i płytkarza dopasowane do ogłoszenia: przykład, frazy z ofert i rady, jak opisać płytki wielkoformatowe, hydroizolację, cięcie 45° i łazienki.",
    intro: "Glazurnik jest jednym z najbardziej poszukiwanych fachowców wykończeniowych, a ogłoszenia coraz częściej wymagają doświadczenia z płytkami wielkoformatowymi, np. 120 × 60 cm i większymi. Pracodawcy pytają o hydroizolację łazienek, montaż odpływów liniowych, cięcie na 45 stopni i fugowanie, także fugą epoksydową. Liczy się równe przygotowanie podłoża i dokładność, bo poprawki przy płytkach są kosztowne. Dobre CV pokazuje zakres prac i rodzaje okładzin, z którymi radzisz sobie samodzielnie.",
    keywords: [
      "układanie płytek ceramicznych i gresu",
      "płytki wielkoformatowe",
      "hydroizolacja łazienek",
      "montaż odpływów liniowych",
      "cięcie płytek na 45 stopni",
      "fugowanie, w tym fugą epoksydową",
      "systemy poziomowania płytek",
      "przygotowanie i wyrównanie podłoża",
      "układanie mozaiki i kamienia naturalnego",
      "wykańczanie łazienek pod klucz"
    ],
    tips: [
      "Podaj największe formaty płytek, z jakimi pracujesz, np. „gres 120 × 280 cm”. Doświadczenie z wielkim formatem jest w ogłoszeniach często osobnym wymaganiem i lepiej płatne.",
      "Opisz hydroizolację: folię w płynie, taśmy uszczelniające, kołnierze. Pracodawca chce mieć pewność, że łazienka nie zacieknie po roku.",
      "Wymień dodatkowe prace, które robisz w ramach łazienki: zabudowy z płyt g-k, montaż stelaży podtynkowych, biały montaż. To zwiększa szanse w firmach wykończeniowych.",
      "Dodaj liczbę realizacji w roku i link do zdjęć prac, jeśli je masz. W tej branży portfolio bywa ważniejsze niż sam opis."
    ],
    sample: {
      name: "Rafał Sadowski",
      headline: "Glazurnik, płytki wielkoformatowe i łazienki pod klucz",
      contact: ["+48 600 000 149", "rafal.sadowski@example.com", "Elbląg", "linkedin.com/in/rafal-sadowski-przyklad"],
      summary: "Glazurnik z dziesięcioletnim doświadczeniem w wykańczaniu łazienek, kuchni i powierzchni komercyjnych. Układam gres wielkoformatowy, mozaikę i kamień naturalny, wykonuję hydroizolację i odpływy liniowe. Pracuję dokładnie i samodzielnie, od przygotowania podłoża po fugowanie.",
      skills: [
        "Gres wielkoformatowy do 120 × 280 cm",
        "Hydroizolacja: folia w płynie, taśmy, kołnierze",
        "Odpływy liniowe i prysznice bez brodzika",
        "Cięcie na 45 stopni i szlifowanie krawędzi",
        "Fugi cementowe i epoksydowe",
        "Mozaika i kamień naturalny",
        "Montaż stelaży podtynkowych i biały montaż"
      ],
      languages: ["angielski A2", "niemiecki A2"],
      jobs: [
        {
          title: "Glazurnik",
          company: "Łazienki Elbląg Ceramik-Pro Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Wykończenie około 30 łazienek rocznie pod klucz, w tym z płytkami wielkoformatowymi.",
            "Wykonywanie hydroizolacji i pryszniców z odpływem liniowym, bez reklamacji szczelności.",
            "Układanie gresu na tarasach i schodach zewnętrznych na systemach drenażowych."
          ]
        },
        {
          title: "Płytkarz",
          company: "Firma Budowlana Żuławy-Bud Sp. z o.o.",
          period: "04.2014 – 05.2020",
          bullets: [
            "Układanie płytek w łazienkach i kuchniach mieszkań deweloperskich.",
            "Przygotowanie podłoży: wylewki samopoziomujące, gruntowanie, wyrównanie ścian.",
            "Okładziny ścienne i posadzkowe w lokalach usługowych."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych w Elblągu",
        degree: "Monter zabudowy i robót wykończeniowych w budownictwie",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Glazurnik czy płytkarz – jak nazwać stanowisko w CV?",
        a: "Oba określenia oznaczają w praktyce to samo, a ogłoszenia używają ich zamiennie. Najlepiej użyj tej nazwy, która jest w ogłoszeniu, a drugą możesz dodać w podsumowaniu. Dzięki temu twoje CV znajdzie się w wynikach wyszukiwania pod oboma hasłami."
      },
      {
        q: "Czy podawać w CV, ile metrów kwadratowych układam dziennie?",
        a: "Można, ale ostrożnie i z kontekstem, bo wydajność zależy od formatu płytek i podłoża. Lepiej napisać np. „ok. 30 łazienek rocznie” lub podać przykładową realizację. Pracodawca bardziej boi się poprawek niż wolniejszego tempa."
      }
    ]
  },
  {
    slug: "monter-fotowoltaiki",
    category: "Budownictwo i rzemiosło",
    name: "Monter instalacji fotowoltaicznych",
    title: "CV montera fotowoltaiki: wzór i wskazówki",
    metaDescription: "CV montera fotowoltaiki pod ofertę pracy: wzór, słowa kluczowe z ogłoszeń i rady, jak opisać montaż paneli, falowniki, uprawnienia SEP i certyfikat UDT OZE.",
    intro: "Monterzy instalacji fotowoltaicznych pracują na dachach domów, budynków firmowych i na farmach gruntowych, a ogłoszenia jasno to rozróżniają. Pracodawcy najczęściej wymagają uprawnień SEP do 1 kV, często w grupie eksploatacji i dozoru, a mile widziany jest certyfikat instalatora OZE wydawany przez UDT. Liczy się montaż konstrukcji i paneli, podłączenie falownika, pomiary elektryczne i przygotowanie dokumentacji do zgłoszenia u operatora sieci. Coraz częściej dochodzą magazyny energii i ładowarki samochodów elektrycznych.",
    keywords: [
      "montaż instalacji fotowoltaicznych",
      "montaż konstrukcji na dachach i gruncie",
      "podłączanie i konfiguracja falowników",
      "uprawnienia SEP do 1 kV",
      "certyfikat instalatora OZE (UDT)",
      "pomiary elektryczne instalacji PV",
      "montaż magazynów energii",
      "praca na wysokości",
      "dokumentacja powykonawcza",
      "prawo jazdy kat. B"
    ],
    tips: [
      "Wpisz uprawnienia SEP z grupą, zakresem (E, D) i datą ważności oraz certyfikat UDT OZE, jeśli go masz. Bez tych informacji wiele ogłoszeń od razu odpada.",
      "Podaj skalę: liczbę instalacji, łączną moc w kWp, typy dachów i obiektów. „Ponad 300 instalacji o mocy 3–50 kWp” od razu pokazuje doświadczenie.",
      "Wymień marki i typy falowników oraz magazynów energii, z którymi pracowałeś, oraz to, czy robisz konfigurację i uruchomienie. Szkolenia producentów też warto dodać.",
      "Jeśli wcześniej byłeś elektrykiem lub dekarzem, opisz to. Firmy cenią monterów, którzy łączą wiedzę elektryczną z bezpieczną pracą na dachu."
    ],
    sample: {
      name: "Adrian Szewczyk",
      headline: "Monter instalacji fotowoltaicznych, SEP E i D do 1 kV",
      contact: ["+48 600 000 150", "adrian.szewczyk@example.com", "Zamość", "linkedin.com/in/adrian-szewczyk-przyklad"],
      summary: "Monter instalacji fotowoltaicznych z sześcioletnim doświadczeniem przy instalacjach domowych i firmowych oraz farmach gruntowych. Montuję konstrukcje i panele, podłączam i uruchamiam falowniki, wykonuję pomiary i dokumentację powykonawczą. Mam uprawnienia SEP E i D do 1 kV oraz certyfikat instalatora OZE.",
      skills: [
        "Montaż konstrukcji na dachach skośnych, płaskich i gruncie",
        "Podłączanie i konfiguracja falowników sieciowych i hybrydowych",
        "Montaż magazynów energii",
        "Pomiary rezystancji izolacji i ciągłości przewodów",
        "Dokumentacja powykonawcza i protokoły odbioru",
        "Uprawnienia SEP E i D do 1 kV, certyfikat instalatora OZE (UDT)",
        "Badania wysokościowe, prawo jazdy kat. B"
      ],
      languages: ["angielski A2"],
      jobs: [
        {
          title: "Monter instalacji fotowoltaicznych – lider ekipy",
          company: "Solar-Wschód Energia Sp. z o.o.",
          period: "06.2020 – obecnie",
          bullets: [
            "Kierowanie trzyosobową ekipą montażową, ponad 250 instalacji o mocy 4–50 kWp.",
            "Udział w budowie dwóch farm gruntowych o łącznej mocy 2 MWp.",
            "Montaż i konfiguracja falowników hybrydowych oraz magazynów energii u klientów indywidualnych."
          ]
        },
        {
          title: "Elektromonter",
          company: "Elektro-Instal Zamość s.c.",
          period: "05.2017 – 05.2020",
          bullets: [
            "Wykonywanie instalacji elektrycznych w domach jednorodzinnych.",
            "Montaż rozdzielnic i zabezpieczeń, także dla pierwszych instalacji PV.",
            "Pomiary elektryczne i przygotowanie protokołów."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 1 w Zamościu",
        degree: "Technik elektryk",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Czy bez uprawnień SEP mogę pracować jako monter fotowoltaiki?",
        a: "Możesz zacząć jako pomocnik montera przy konstrukcjach i panelach, ale do prac przy podłączeniach elektrycznych pracodawcy zwykle wymagają SEP do 1 kV. Egzamin można zdać po krótkim kursie, więc warto go zaplanować. W CV napisz wtedy, kiedy przystępujesz do egzaminu."
      },
      {
        q: "Czy certyfikat instalatora OZE z UDT jest obowiązkowy?",
        a: "Nie jest wymagany do samej pracy przy montażu, ale wiele firm go ceni, a część ogłoszeń wymienia go jako atut. Certyfikat jest ważny przez określony czas i wymaga odnowienia, więc w CV podaj datę ważności. Pokazuje, że znasz instalacje OZE także od strony formalnej."
      },
      {
        q: "Jak opisać doświadczenie z farmami fotowoltaicznymi?",
        a: "Podaj łączną moc farmy, swój zakres prac i czas trwania budowy, np. montaż konstrukcji wbijanych i układanie tras kablowych. Farmy to inna skala niż dachy domów, więc wpisz to osobnym punktem. Firmy z sektora wielkoskalowego szukają właśnie takiego doświadczenia."
      }
    ]
  }
];

const en = {
  "scrum-master": {
    slugLang: "scrum-master",
    name: "Scrum Master",
    title: "Scrum Master CV: example and tips",
    metaDescription: "A Scrum Master CV tailored to a specific job ad: an example, phrases from real offers and tips on showing facilitation, PSM or CSM and your impact on the team.",
    intro: "Companies hiring a Scrum Master want to know how many teams you have supported and what changed in them thanks to your work. Polish job ads regularly mention PSM I or CSM certificates, Jira and Confluence, and experience with scaling frameworks such as SAFe or LeSS. Recruiters can tell the difference between someone who just runs meetings and someone who removes impediments and teaches a team to self-organise. Your CV should show the latter with examples.",
    keywords: [
      "PSM I / CSM certificate",
      "running Scrum events",
      "facilitating retrospectives",
      "removing impediments",
      "Jira and Confluence",
      "Kanban",
      "backlog work with the Product Owner",
      "scaling agile (SAFe, LeSS)",
      "team coaching",
      "team metrics (velocity, lead time)"
    ],
    tips: [
      "State how many teams you have worked with, how big they were and what product they built, e.g. \"2 teams of 7, banking app\". This sets the scale of your experience straight away.",
      "Instead of listing ceremonies, describe the changes you introduced: shorter lead time, fewer tasks carried over between sprints, more stable velocity. Numbers from Jira are the best evidence here.",
      "Write your certificate out in full with the issuing body, e.g. \"Professional Scrum Master I (Scrum.org)\". If the ad mentions SAFe and you have SAFe training, list it separately.",
      "If you used to be a developer, tester or analyst, do not hide it. Job ads often value a Scrum Master who understands the technical side of a development team's work."
    ],
    sample: {
      name: "Karolina Wieczorek",
      headline: "Scrum Master, PSM II",
      contact: ["+48 600 000 141", "karolina.wieczorek@example.com", "Wrocław", "linkedin.com/in/karolina-wieczorek-przyklad"],
      summary: "Scrum Master with five years of experience in teams building software for logistics and fintech. I used to be a manual tester, so I understand developers' day-to-day work well. I help teams deliver predictably and solve problems on their own.",
      skills: [
        "Professional Scrum Master I and II (Scrum.org)",
        "Facilitating retrospectives and workshops",
        "Jira, Confluence, Miro",
        "Kanban and flow management",
        "Supporting the Product Owner in backlog refinement",
        "Working in a SAFe environment (PI Planning)",
        "Metrics analysis: velocity, lead time, cycle time"
      ],
      languages: ["English C1"],
      jobs: [
        {
          title: "Scrum Master",
          company: "Logisoft Systems Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "I support two teams (14 people) developing a fleet and warehouse management system.",
            "Introduced WIP limits and flow reviews, cutting the average lead time from 11 to 6 days.",
            "Co-organise quarterly PI Planning for four teams in a SAFe setup."
          ]
        },
        {
          title: "Software Tester / Scrum Master",
          company: "Finexa Tech Sp. z o.o.",
          period: "03.2017 – 05.2020",
          bullets: [
            "Manual testing of a payment app and writing test cases in Jira.",
            "From 2019, acted as Scrum Master for a six-person team.",
            "Proposed a Definition of Done with testing criteria, which reduced the number of bugs reported after release."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Ekonomiczny we Wrocławiu",
        degree: "Business Informatics, Master's degree",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Can I get a Scrum Master job without a PSM or CSM certificate?",
        a: "Yes, but many ads list a certificate as a requirement or a strong plus, and ATS filters search for these abbreviations. PSM I is taken online with no mandatory course, so it is a relatively cheap way to strengthen your CV. Until then, describe specifically how you have applied Scrum in practice."
      },
      {
        q: "How do I describe a Scrum Master role combined with another job?",
        a: "Say so directly in the job title, e.g. \"Developer / Scrum Master\", and split the bullet points for the two roles. Show how much time you spent on the Scrum Master role and what changed in the team as a result. This is honest and goes down well when changing career paths."
      },
      {
        q: "What numbers should a Scrum Master CV include?",
        a: "Ideally ones that show change over time: lead time, sprint predictability, bugs after release or release frequency. Avoid velocity on its own without context, because every team counts it differently. Two or three strong numbers are enough."
      }
    ]
  },
  "analityk-biznesowy": {
    slugLang: "business-analyst",
    name: "Business Analyst",
    title: "Business Analyst CV: example and tips",
    metaDescription: "A business analyst CV matched to the job offer: an example, keywords from job ads and tips on describing requirements gathering, BPMN, UML and work with IT.",
    intro: "A business analyst translates business needs into requirements an IT team can deliver, and job ads reflect this in every line. Employers ask about stakeholder workshops, process modelling in BPMN 2.0, UML use cases and writing user stories. More and more often they also expect basic SQL and domain knowledge, e.g. banking, insurance or e-commerce. What counts in your CV are the projects you have taken from analysis to rollout.",
    keywords: [
      "gathering and documenting requirements",
      "process modelling in BPMN 2.0",
      "UML diagrams",
      "user stories and acceptance criteria",
      "stakeholder workshops",
      "SQL",
      "Jira and Confluence",
      "Enterprise Architect",
      "AS-IS / TO-BE process analysis",
      "IREB CPRE or IIBA certificate"
    ],
    tips: [
      "For each project, say what business problem it solved and what the result was, e.g. shorter processing time for applications. \"Gathered requirements\" on its own does not stand out.",
      "List the tools and notations you actually use: BPMN 2.0, UML, Enterprise Architect, Jira, Confluence. Job ads name them directly and ATS systems search for them.",
      "Show your industry. An analyst with insurance or banking experience has an edge in ads from those sectors, because they know the processes and regulations.",
      "If you write SQL queries, check data or prepare acceptance test scenarios, add it. Many ads combine the business analyst role with elements of systems analysis."
    ],
    sample: {
      name: "Bartosz Michalak",
      headline: "Business Analyst in insurance projects",
      contact: ["+48 600 000 142", "bartosz.michalak@example.com", "Łódź", "linkedin.com/in/bartosz-michalak-przyklad"],
      summary: "Business analyst with six years of experience in insurance and customer service projects. I run workshops with the business, model processes in BPMN and write requirements that development teams can easily work with. I hold the IREB CPRE Foundation Level certificate.",
      skills: [
        "Stakeholder workshops and interviews",
        "BPMN 2.0, UML (use cases, activity diagrams)",
        "User stories and acceptance criteria",
        "SQL (analytical queries)",
        "Enterprise Architect, Jira, Confluence",
        "AS-IS / TO-BE analysis",
        "IREB CPRE Foundation Level"
      ],
      languages: ["English B2"],
      jobs: [
        {
          title: "Business Analyst",
          company: "Polisa-Tech Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Analysing and documenting requirements for a new motor claims handling system.",
            "Modelled 18 processes in BPMN 2.0, which made it possible to remove two unnecessary approval steps.",
            "Working with developers and testers on acceptance of successive releases."
          ]
        },
        {
          title: "Junior Process Analyst",
          company: "Centrum Obsługi Klienta Kontakt24 Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Mapping complaint handling processes and preparing improvement recommendations.",
            "Reports on CRM data prepared in SQL and Excel for management.",
            "Took part in rolling out a new CRM module as the business representative."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Łódzki",
        degree: "Computer Science and Econometrics, Master's degree",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "How does a business analyst CV differ from a systems analyst CV?",
        a: "A business analyst mainly describes processes, needs and business requirements, while a systems analyst goes deeper into integrations, APIs and the data model. Check which tasks dominate the ad and highlight those in your experience. If you do both, say so openly."
      },
      {
        q: "Is it worth listing an IREB or IIBA certificate?",
        a: "Yes, if you have one, because some ads list it as a plus, especially in large companies and banks. Give the full name and level, e.g. \"IREB CPRE Foundation Level\". Not having a certificate does not rule you out if your experience is well described."
      },
      {
        q: "How can I move into business analysis without IT experience?",
        a: "Show situations in your CV where you described processes, gathered requirements or took part in a system rollout as a key user. That is real analytical experience. Add a BPMN or SQL course and a sample process model you can show at the interview."
      }
    ]
  },
  "serwisant-komputerowy": {
    slugLang: "computer-repair-technician",
    name: "Computer Repair Technician / IT Technician",
    title: "Computer Repair Technician CV: example and tips",
    metaDescription: "A computer repair technician CV: an example, phrases from job ads and tips on describing hardware diagnostics, repairs, networking and handling support tickets.",
    intro: "Job ads for computer repair technicians and IT technicians usually cover diagnosing and repairing laptops, desktops and printers, as well as installing operating systems and basic networking. Field service roles often require a category B driving licence, and some employers expect SEP electrical qualifications up to 1 kV. Independence, tidy repair records and good contact with customers all count. A well-written CV shows which faults you fix and how many tickets you handle.",
    keywords: [
      "computer hardware diagnostics and repair",
      "installing and configuring Windows",
      "component-level laptop repair",
      "printer and multifunction device servicing",
      "LAN and Wi-Fi configuration",
      "handling tickets in a ticketing system",
      "Active Directory (basics)",
      "category B driving licence",
      "SEP qualifications up to 1 kV",
      "IT technician diploma (technik informatyk)"
    ],
    tips: [
      "Describe the repairs you do on your own: replacing screens, cleaning cooling systems, data recovery, soldering sockets. The level of repair work is key for the employer.",
      "Give numbers: how many tickets you handle per day or month and how many devices you look after. This quickly shows the scale of your work.",
      "If you hold the INF.02 and INF.03 qualifications or an IT technician diploma, put them under education. Certificates such as CompTIA A+ are worth adding too.",
      "For field work, add your driving licence and the area you covered. List SEP qualifications with the group and expiry date."
    ],
    sample: {
      name: "Patryk Sowa",
      headline: "Computer repair technician, IT technician",
      contact: ["+48 600 000 143", "patryk.sowa@example.com", "Opole", "linkedin.com/in/patryk-sowa-przyklad"],
      summary: "IT technician with five years of experience in workshop and field service. I repair laptops, computers and printers, install operating systems and set up small office networks. I have a category B driving licence and SEP E qualifications up to 1 kV.",
      skills: [
        "Laptop and PC diagnostics and repair",
        "Replacing screens, keyboards, drives and memory",
        "Installing and configuring Windows 10/11",
        "Servicing laser printers and multifunction devices",
        "Configuring routers, switches and Wi-Fi",
        "Handling tickets in a ticketing system",
        "SEP E qualifications up to 1 kV, category B driving licence"
      ],
      languages: ["English B1"],
      jobs: [
        {
          title: "IT Field Service Technician",
          company: "Komp-Serwis Opole Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Supporting around 25 client companies in the Opole region, about 60 tickets a month on average.",
            "Preparing and deploying 140 workstations when a client moved offices.",
            "Servicing printers and multifunction devices under service contracts."
          ]
        },
        {
          title: "Computer Repair Technician",
          company: "Laptop-Med s.c.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Laptop repairs: replacing screens, power sockets and cooling systems.",
            "Recovering data from damaged drives and migrating customer data.",
            "Taking in equipment from customers and quoting repairs."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektrycznych w Opolu",
        degree: "IT technician (technik informatyk), INF.02 and INF.03 qualifications",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "Does a computer repair technician need SEP qualifications?",
        a: "Not always, but some employers require them, especially for work with UPS units, server racks or installations in client buildings. If you have them, list the group and expiry date. If the ad requires them and you do not have them, you can write that you are ready to obtain them before starting."
      },
      {
        q: "How do I describe repairs done at home or for friends?",
        a: "If you lack professional experience, you can list them as projects, but in a factual way: which devices, which faults, how many repairs. Avoid vague phrases like \"computer enthusiast\". Concrete repair examples convince a service company more than claims."
      }
    ]
  },
  "administrator-baz-danych": {
    slugLang: "database-administrator",
    name: "Database Administrator",
    title: "Database Administrator CV: example and tips",
    metaDescription: "A database administrator (DBA) CV for a specific job ad: an example, keywords from offers and tips on describing Oracle, PostgreSQL, MS SQL, backups and tuning.",
    intro: "Job ads for database administrators are highly technical: employers name the engines, versions and environment straight away, e.g. Oracle 19c, PostgreSQL, Microsoft SQL Server or cloud databases in Azure or AWS. Backup and recovery, high availability, replication and query performance tuning are key. Good Linux skills and scripting in Bash or PowerShell are often required, and banks also expect on-call duty. A DBA CV has to show the scale of the environment you manage.",
    keywords: [
      "Oracle Database administration",
      "PostgreSQL",
      "Microsoft SQL Server",
      "backup and recovery (RMAN, pgBackRest)",
      "high availability (Data Guard, Always On)",
      "database replication",
      "performance tuning and SQL query optimisation",
      "Linux administration",
      "Bash / PowerShell scripting",
      "cloud databases (Azure, AWS)"
    ],
    tips: [
      "Give the scale: number of instances, database size in TB, number of transactions or users. \"Looking after 120 PostgreSQL instances totalling 30 TB\" says more than the engine name alone.",
      "List the versions and HA technologies you have worked with, e.g. Oracle 19c with Data Guard or SQL Server Always On. Technical recruiters check exactly these details.",
      "Describe concrete improvements: shorter backup times, a faster key report, automating routine tasks. Ideally with before and after figures.",
      "Write certificates out in full, e.g. Oracle Certified Professional or Microsoft Azure Database Administrator Associate. On-call duty is also worth mentioning, as many offers ask about it."
    ],
    sample: {
      name: "Agnieszka Pawlik",
      headline: "Oracle and PostgreSQL Database Administrator",
      contact: ["+48 600 000 144", "agnieszka.pawlik@example.com", "Gliwice", "linkedin.com/in/agnieszka-pawlik-przyklad"],
      summary: "Database administrator with seven years of experience in production environments for the energy and retail sectors. I am responsible for backups, high availability and performance of Oracle and PostgreSQL databases. I automate repetitive tasks with Bash and Ansible.",
      skills: [
        "Oracle Database 19c, RMAN, Data Guard",
        "PostgreSQL 13–16, streaming replication, pgBackRest",
        "Performance tuning and query plan analysis",
        "Red Hat Enterprise Linux",
        "Bash, Ansible",
        "Database monitoring in Zabbix and Grafana",
        "Oracle Certified Professional (OCP)"
      ],
      languages: ["English B2"],
      jobs: [
        {
          title: "Database Administrator",
          company: "Energo-IT Serwis Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Looking after 45 Oracle and 80 PostgreSQL instances with a total size of about 25 TB.",
            "Migrated a key billing system from Oracle 12c to 19c with Data Guard, with no data loss.",
            "Cut the nightly backup window from 6 to 2.5 hours using incremental backups and compression."
          ]
        },
        {
          title: "Junior Database Administrator",
          company: "Handlowe Centrum Danych Merkury Sp. z o.o.",
          period: "02.2017 – 05.2020",
          bullets: [
            "Day-to-day administration of Microsoft SQL Server and PostgreSQL databases for sales systems.",
            "Optimised reporting queries, cutting the daily report generation time from 40 to 8 minutes.",
            "Took part in on-call duty and handled production incidents."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska w Gliwicach",
        degree: "Computer Science, Master's degree",
        period: "2011 – 2016"
      }
    },
    faq: [
      {
        q: "Should I list database engines I only know a little?",
        a: "Yes, but clearly state the level, e.g. \"MySQL – basic administration\". DBA technical interviews can be detailed, so exaggerated claims come out quickly. It is better to show one engine in depth and honestly present another as secondary."
      },
      {
        q: "How do I show cloud experience if I have worked mostly on-premise?",
        a: "Describe even single projects: migrating a test database to Azure SQL or Amazon RDS, cloud backups or a pilot. Add a cloud certificate if you have earned one. Companies know many environments are hybrid, so solid on-premise skills are still valued."
      }
    ]
  },
  "murarz": {
    slugLang: "bricklayer",
    name: "Bricklayer",
    title: "Bricklayer CV: example and tips",
    metaDescription: "A bricklayer CV matched to the job ad: an example, phrases from job offers and tips on describing blockwork, facing brick, plastering, reading plans and sites.",
    intro: "Employers looking for bricklayers want to know which materials you lay and what buildings you have worked on: detached houses, blocks of flats or industrial halls. Job ads mention sand-lime blocks, hollow clay blocks, aerated concrete and clinker brick, as well as reading construction drawings. A valid medical certificate for working at height and a category B driving licence are often required. It helps if your CV shows you work independently and can lead a small crew.",
    keywords: [
      "laying sand-lime block walls",
      "laying hollow clay blocks",
      "aerated concrete",
      "clinker brickwork",
      "reading construction drawings",
      "plastering",
      "lintels and ring beams",
      "working on scaffolding",
      "medical clearance for work at height",
      "category B driving licence"
    ],
    tips: [
      "List the materials you work with and the type of walls: load-bearing, partition, facing. Laying facing clinker brick is a separate skill worth highlighting clearly.",
      "Give the types of sites and the scale, e.g. \"shell construction of detached houses, about 12 buildings a year\" or \"blocks of flats up to 5 storeys\".",
      "If you lead a crew, say how many people and what you are responsible for: setting out, checking plumb and level, ordering materials. This raises your value in offers for a foreman.",
      "Add your height work medical, health and safety training and driving licence. If you have worked abroad, add the country and language, as agencies often ask about this."
    ],
    sample: {
      name: "Stanisław Wróbel",
      headline: "Bricklayer, foreman on detached house builds",
      contact: ["+48 600 000 145", "stanislaw.wrobel@example.com", "Siedlce", "linkedin.com/in/stanislaw-wrobel-przyklad"],
      summary: "Bricklayer with fourteen years of experience building detached houses and blocks of flats. I lay sand-lime, clay, aerated concrete and clinker, read construction drawings and lead a three-person crew. I have a valid medical certificate for work at height and a category B driving licence.",
      skills: [
        "Load-bearing and partition walls in sand-lime and clay blocks",
        "Clinker brick facades",
        "Aerated concrete with thin-bed mortar",
        "Lintels, ring beams and chimneys",
        "Reading construction drawings",
        "Leading a bricklaying crew",
        "Height work medical, category B driving licence"
      ],
      languages: ["German A2"],
      jobs: [
        {
          title: "Bricklayer – Foreman",
          company: "Dom-Bud Siedlce Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Leading a three-person crew building the shells of about 10 detached houses a year.",
            "Setting out walls to the drawings, checking plumb and level, and inspections with the site manager.",
            "Building clinker facades and system chimneys."
          ]
        },
        {
          title: "Bricklayer",
          company: "Przedsiębiorstwo Budowlane Mazowsze-Bud Sp. z o.o.",
          period: "04.2010 – 05.2020",
          bullets: [
            "Laying load-bearing and partition walls in blocks of flats up to 5 storeys.",
            "Building lintels, ring beams and reinforcement together with the carpentry crew.",
            "Working on scaffolding in line with health and safety rules."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych nr 2 w Siedlcach",
        degree: "Bricklayer-plasterer (murarz-tynkarz)",
        period: "2007 – 2010"
      }
    },
    faq: [
      {
        q: "Does a bricklayer even need a CV?",
        a: "More and more often, yes, because construction companies and job agencies take applications through forms and job portals. One page is enough: materials, types of sites, qualifications and a phone number. A short CV also gets you to a conversation with the site manager faster."
      },
      {
        q: "How do I list self-employed or off-the-books work?",
        a: "List work in your own business as normal, with the business name and scope of work. For work without a contract, describe your experience honestly, e.g. as \"bricklaying on detached house builds\" with approximate years, without inventing an employer. What counts at the interview is your skill, and that can be checked on site."
      },
      {
        q: "Is it worth including photos of my work?",
        a: "Not in the CV itself, but you can add a link to an album or say you will show photos at the interview. For clinker and facade work, photos of finished jobs can be a strong argument. Make sure they do not show clients' details or addresses."
      }
    ]
  },
  "stolarz": {
    slugLang: "joiner-carpenter",
    name: "Joiner / Carpenter",
    title: "Joiner CV: example and tips",
    metaDescription: "A joiner CV for a job ad: an example, keywords from offers and tips on describing bespoke furniture, CNC machines, edge banders, fitting and reading drawings.",
    intro: "Job ads for joiners fall into furniture production in a workshop, bespoke joinery and on-site fitting, so your CV should clearly show which of these roles suits you. Employers ask about using a panel saw, an edge bander and CNC machining centres, working with laminated board, MDF and solid wood, and reading technical drawings. For fitting kitchens and built-in units, precision and contact with clients count. Finishing experience, e.g. lacquering or oiling, clearly raises a candidate's value.",
    keywords: [
      "bespoke furniture production",
      "operating a panel saw",
      "operating an edge bander",
      "operating CNC machines",
      "working with laminated board and MDF",
      "solid wood machining",
      "fitting kitchens and built-in units",
      "reading technical drawings",
      "lacquering and oiling wood",
      "category B driving licence"
    ],
    tips: [
      "Say which machines you operate on your own and, for CNC, whether you only load parts or also prepare programs. That makes a big difference to an employer.",
      "List the types of products: kitchens, built-in wardrobes, stairs, doors, solid wood furniture. A stair joiner and a furniture joiner are often different jobs in ads.",
      "If you fit furniture at clients' homes, add the number of jobs and whether you work alone. A category B driving licence is then almost always required.",
      "Name the furniture design software you use. Being able to prepare a cutting list is a plus in small workshops."
    ],
    sample: {
      name: "Jakub Zając",
      headline: "Furniture joiner, bespoke furniture and fitting",
      contact: ["+48 600 000 146", "jakub.zajac@example.com", "Nowy Sącz", "linkedin.com/in/jakub-zajac-przyklad"],
      summary: "Joiner with nine years of experience producing and fitting bespoke furniture. I operate a panel saw, an edge bander and a CNC machining centre, and work with laminated board, MDF and oak. I fit kitchens and built-in units at clients' homes on my own.",
      skills: [
        "Panel saw, edge bander, multi-spindle drill",
        "Operating a CNC centre and basic program changes",
        "Furniture in laminated board, lacquered MDF and solid wood",
        "Fitting kitchens, built-in wardrobes and units",
        "Reading technical drawings and preparing cutting lists",
        "Oiling and lacquering wood",
        "Category B driving licence"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "Joiner – Fitter",
          company: "Meble Sądeckie Drewmar Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Producing bespoke kitchens and wardrobes to design, about 60 jobs a year.",
            "Fitting furniture at clients' homes on my own, including adjusting to uneven walls and connections.",
            "Operating a CNC centre for drilling and milling MDF fronts."
          ]
        },
        {
          title: "Joiner",
          company: "Zakład Stolarski Brzoza s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Making tables, stairs and doors from solid wood.",
            "Sanding, staining and oiling finished products.",
            "Cutting boards on a panel saw and edge banding."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Drzewnych w Nowym Sączu",
        degree: "Joiner (stolarz)",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Should a joiner's CV include experience from a home workshop?",
        a: "Yes, if you did real orders or bigger projects, e.g. furniture or stairs for friends. Describe what you made, from what material and with which tools. Without workshop experience, photos of your work can convince an employer more than a diploma."
      },
      {
        q: "Do employers require licences for woodworking machines?",
        a: "There are no separate state licences for typical woodworking machines, as there are for forklifts, but the employer must train you at your workstation. In your CV it is enough to list the machines you operate on your own. It is worth listing UDT licences separately if, for example, you drive a forklift in the board store."
      }
    ]
  },
  "dekarz": {
    slugLang: "roofer",
    name: "Roofer",
    title: "Roofer CV: example and tips",
    metaDescription: "A roofer CV matched to the job offer: an example, phrases from job ads and tips on describing roof coverings, flashings, felt, membranes and work at height.",
    intro: "In job ads for roofers, employers list the types of covering: clay and concrete tiles, metal roofing tiles, standing seam, torch-on felt and EPDM or PVC membranes on flat roofs. Flashings, gutters and fitting roof windows also matter. The work is done at height, so companies expect a valid medical certificate and knowledge of fall protection. UDT licences for mobile elevating platforms and a category B driving licence are often welcome.",
    keywords: [
      "clay and concrete tile roofing",
      "fitting metal roofing tiles and standing seam",
      "torch-on roofing felt",
      "EPDM / PVC membranes on flat roofs",
      "sheet metal flashings",
      "fitting gutters and roof windows",
      "building roof trusses",
      "medical clearance for work at height",
      "UDT licence for mobile platforms",
      "category B driving licence"
    ],
    tips: [
      "List the types of covering you lay on your own. A flat roof and felt roofer is often a different person in job ads from a clay tile specialist.",
      "Say whether you make sheet metal flashings on a folding machine and whether you fit roof windows. These are skills companies pay more for.",
      "Add your height work medical with its expiry date, health and safety training and UDT platform licences if you have them. This is where an employer starts checking a candidate.",
      "Add the scale: number of roofs per season or square metres on industrial buildings. Training from roofing manufacturers is also worth listing."
    ],
    sample: {
      name: "Mariusz Krawiec",
      headline: "Roofer and sheet metal worker, pitched and flat roofs",
      contact: ["+48 600 000 147", "mariusz.krawiec@example.com", "Leszno", "linkedin.com/in/mariusz-krawiec-przyklad"],
      summary: "Roofer and sheet metal worker with eleven years of experience on detached houses and industrial buildings. I lay tiles, metal roofing tiles, felt and EPDM membranes, make flashings and fit roof windows. I have a valid medical certificate for work at height and UDT licences for mobile platforms.",
      skills: [
        "Clay and concrete tiles",
        "Metal roofing tiles and standing seam",
        "Torch-on felt and EPDM membranes",
        "Sheet metal flashings on a folding machine",
        "Fitting roof windows and gutter systems",
        "Building and repairing roof trusses",
        "Height work medical, UDT for mobile platforms"
      ],
      languages: ["German A2"],
      jobs: [
        {
          title: "Roofer and Sheet Metal Worker",
          company: "Dach-Mistrz Leszno Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Roofing about 25 detached houses per season with tiles and metal roofing tiles.",
            "Making flashings for chimneys, valleys and parapets, and fitting roof windows.",
            "Refurbishing flat roofs of warehouses with EPDM membrane, over 6,000 m² in total."
          ]
        },
        {
          title: "Roofer's Mate, later Roofer",
          company: "Zakład Dekarski Wielkopolanin s.c.",
          period: "03.2013 – 05.2020",
          bullets: [
            "Torch-on felt roofing on blocks of flats.",
            "Fitting gutters and downpipes and minor truss repairs.",
            "Working at height using harnesses and safety lines."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Lesznie",
        degree: "Roofer (dekarz)",
        period: "2010 – 2013"
      }
    },
    faq: [
      {
        q: "Should I put my height work medical in my CV?",
        a: "It is worth it, because it is one of the first questions when hiring a roofer. Keep it short, e.g. \"valid medical clearance for work at height until 2027\". If it has expired, write that you can renew it before starting work."
      },
      {
        q: "How can a roofer stand out in a CV?",
        a: "Best through specialisation and specifics: standing seam, slate, green roofs or large flat roofs on halls. Manufacturer training and being able to calculate materials on your own also help. A general \"all roofing work\" tells a recruiter very little."
      }
    ]
  },
  "malarz-budowlany": {
    slugLang: "painter-decorator",
    name: "Painter and Decorator",
    title: "Painter and Decorator CV: example and tips",
    metaDescription: "A painter and decorator CV for a job ad: an example, keywords from offers and tips on describing skim coats, spray painting, plasterboard and finishing work.",
    intro: "Job ads for painters rarely cover painting alone: employers want people who will prepare the surface, apply a skim coat, fill plasterboard joints and finish walls ready for use. Spray painting with an airless sprayer comes up more and more often, especially on large sites and new-build flats. On facades and in halls, working on scaffolding or lifts matters. Finishing companies also value wallpapering and decorative techniques.",
    keywords: [
      "surface preparation",
      "gypsum skim coats",
      "filling plasterboard joints",
      "spray painting with a sprayer",
      "painting walls and ceilings",
      "facade painting",
      "wallpapering",
      "decorative plasters and techniques",
      "working on scaffolding",
      "precision and cleanliness"
    ],
    tips: [
      "Describe the whole scope you cover: from priming and filling to the final coat. Employers look for people who do not need a separate plasterer for every touch-up.",
      "If you spray with an airless sprayer, say so clearly. It is a skill companies working on large sites ask about more and more often.",
      "Give the types of buildings and scale, e.g. \"new-build flats, about 2,500 m² of walls a month as a crew\" or \"offices and hotels\".",
      "List decorative techniques, architectural concrete effect or vinyl wallpaper separately. In offers from finishing companies working for private clients, these are a big plus."
    ],
    sample: {
      name: "Ewelina Duda",
      headline: "Painter and decorator, skim coats and spray painting",
      contact: ["+48 600 000 148", "ewelina.duda@example.com", "Płock", "linkedin.com/in/ewelina-duda-przyklad"],
      summary: "Painter and decorator with eight years of experience finishing flats, offices and commercial premises. I prepare surfaces, apply skim coats, fill plasterboard joints and paint by hand and with an airless sprayer. I also hang wallpaper and apply decorative plasters.",
      skills: [
        "Priming and surface preparation",
        "Gypsum skim coats, by hand and by machine",
        "Filling plasterboard joints",
        "Airless spray painting",
        "Wallpapering (non-woven, vinyl)",
        "Decorative plasters and architectural concrete effect",
        "Working on scaffolding and platforms"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "Painter and Decorator",
          company: "Wykończenia Płock Kolor-Dom Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Finishing new-build flats to turnkey standard, about 2,000 m² of painted surface a month as a crew.",
            "Spray painting ceilings and walls in office buildings with an airless sprayer.",
            "Applying decorative plasters and hanging wallpaper for private clients."
          ]
        },
        {
          title: "Painter's Assistant, later Painter",
          company: "Usługi Remontowe Mazur-Rem s.c.",
          period: "05.2016 – 05.2020",
          bullets: [
            "Sanding and priming walls and protecting floors and joinery before painting.",
            "Applying skim coats and filling plasterboard in renovated flats.",
            "Painting stairwells in residential community buildings."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Budowlanych w Płocku",
        degree: "Interior finishing fitter (monter zabudowy i robót wykończeniowych w budownictwie)",
        period: "2013 – 2016"
      }
    },
    faq: [
      {
        q: "Can a woman successfully apply for a painter and decorator job?",
        a: "Yes, more and more women work in finishing trades, and employers judge mainly the quality and pace of work. In your CV, describe specific jobs and techniques, as any candidate would. You can add a link to photos of your work."
      },
      {
        q: "Should I list using a paint sprayer if I have used one rarely?",
        a: "Yes, but state the level honestly, e.g. \"spray painting – basic experience on ceilings\". An employer may ask about the type of sprayer and tips. It is better to show you know the basics and want to learn than to exaggerate."
      },
      {
        q: "How do I describe short renovation jobs?",
        a: "Group them into one entry, e.g. \"Self-employed painting work, 2018–2020\", and list typical jobs and how many there were. This keeps your CV clear and your experience does not get lost in a long list of small jobs."
      }
    ]
  },
  "glazurnik": {
    slugLang: "tiler",
    name: "Tiler",
    title: "Tiler CV: example and tips",
    metaDescription: "A tiler CV matched to the job ad: an example, phrases from offers and tips on describing large-format tiles, waterproofing, 45-degree mitre cuts and bathrooms.",
    intro: "Tilers are among the most sought-after finishing tradespeople, and job ads increasingly require experience with large-format tiles, e.g. 120 × 60 cm and bigger. Employers ask about bathroom waterproofing, fitting linear drains, 45-degree mitre cuts and grouting, including epoxy grout. A level, well-prepared substrate and precision count, because fixing tile mistakes is expensive. A good CV shows the scope of work and the types of tiling you handle on your own.",
    keywords: [
      "laying ceramic and porcelain tiles",
      "large-format tiles",
      "bathroom waterproofing",
      "fitting linear drains",
      "45-degree mitre cuts",
      "grouting, including epoxy grout",
      "tile levelling systems",
      "substrate preparation and levelling",
      "laying mosaic and natural stone",
      "turnkey bathroom finishing"
    ],
    tips: [
      "Give the largest tile formats you work with, e.g. \"porcelain 120 × 280 cm\". Large-format experience is often a separate requirement in ads and better paid.",
      "Describe waterproofing: liquid membrane, sealing tapes, pipe collars. The employer wants to be sure the bathroom will not leak after a year.",
      "List the extra work you do as part of a bathroom: plasterboard boxing, concealed WC frames, fitting sanitary ware. This improves your chances with finishing companies.",
      "Add the number of jobs a year and a link to photos of your work if you have them. In this trade a portfolio can matter more than the description."
    ],
    sample: {
      name: "Rafał Sadowski",
      headline: "Tiler, large-format tiles and turnkey bathrooms",
      contact: ["+48 600 000 149", "rafal.sadowski@example.com", "Elbląg", "linkedin.com/in/rafal-sadowski-przyklad"],
      summary: "Tiler with ten years of experience finishing bathrooms, kitchens and commercial spaces. I lay large-format porcelain, mosaic and natural stone, and do waterproofing and linear drains. I work precisely and independently, from substrate preparation to grouting.",
      skills: [
        "Large-format porcelain up to 120 × 280 cm",
        "Waterproofing: liquid membrane, tapes, collars",
        "Linear drains and walk-in showers",
        "45-degree mitre cuts and edge grinding",
        "Cement and epoxy grouts",
        "Mosaic and natural stone",
        "Concealed WC frames and fitting sanitary ware"
      ],
      languages: ["English A2", "German A2"],
      jobs: [
        {
          title: "Tiler",
          company: "Łazienki Elbląg Ceramik-Pro Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Finishing about 30 bathrooms a year to turnkey standard, including with large-format tiles.",
            "Waterproofing and building showers with linear drains, with no leak complaints.",
            "Laying porcelain on terraces and outdoor steps on drainage systems."
          ]
        },
        {
          title: "Tiler",
          company: "Firma Budowlana Żuławy-Bud Sp. z o.o.",
          period: "04.2014 – 05.2020",
          bullets: [
            "Tiling bathrooms and kitchens in new-build flats.",
            "Preparing substrates: self-levelling screeds, priming, levelling walls.",
            "Wall and floor tiling in commercial units."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych w Elblągu",
        degree: "Interior finishing fitter (monter zabudowy i robót wykończeniowych w budownictwie)",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Glazurnik or płytkarz – which job title should I use in a Polish CV?",
        a: "Both mean the same thing in practice, and job ads use them interchangeably. It is best to use the term from the ad and add the other one in your summary. That way your CV shows up in searches for both terms."
      },
      {
        q: "Should I say in my CV how many square metres I lay per day?",
        a: "You can, but carefully and with context, because output depends on tile format and substrate. It is better to write e.g. \"about 30 bathrooms a year\" or describe a sample job. Employers worry more about fixing mistakes than about a slower pace."
      }
    ]
  },
  "monter-fotowoltaiki": {
    slugLang: "solar-pv-installer",
    name: "Solar PV Installer",
    title: "Solar PV Installer CV: example and tips",
    metaDescription: "A solar PV installer CV for a job offer: an example, keywords from job ads and tips on panel mounting, inverters, SEP licences and the UDT RES certificate.",
    intro: "Solar PV installers work on the roofs of homes and commercial buildings and on ground-mounted solar farms, and job ads make that distinction clear. Employers most often require SEP electrical qualifications up to 1 kV, often in both the operation and supervision groups, and a renewable energy installer certificate issued by UDT is welcome. Mounting structures and panels, connecting the inverter, electrical testing and preparing paperwork for the grid operator all count. Energy storage and EV chargers are increasingly part of the job.",
    keywords: [
      "installing PV systems",
      "mounting structures on roofs and ground",
      "connecting and configuring inverters",
      "SEP qualifications up to 1 kV",
      "RES installer certificate (UDT)",
      "electrical testing of PV systems",
      "installing energy storage",
      "working at height",
      "as-built documentation",
      "category B driving licence"
    ],
    tips: [
      "List your SEP qualifications with the group, scope (E, D) and expiry date, plus the UDT RES certificate if you have it. Without this information many applications drop out straight away.",
      "Give the scale: number of installations, total capacity in kWp, types of roofs and buildings. \"Over 300 installations of 3–50 kWp\" shows your experience at once.",
      "Name the brands and types of inverters and energy storage you have worked with, and whether you do configuration and commissioning. Manufacturer training is worth adding too.",
      "If you used to be an electrician or roofer, describe it. Companies value installers who combine electrical knowledge with safe work on roofs."
    ],
    sample: {
      name: "Adrian Szewczyk",
      headline: "Solar PV installer, SEP E and D up to 1 kV",
      contact: ["+48 600 000 150", "adrian.szewczyk@example.com", "Zamość", "linkedin.com/in/adrian-szewczyk-przyklad"],
      summary: "Solar PV installer with six years of experience on residential and commercial systems and ground-mounted farms. I mount structures and panels, connect and commission inverters, and carry out testing and as-built documentation. I hold SEP E and D qualifications up to 1 kV and a RES installer certificate.",
      skills: [
        "Mounting structures on pitched roofs, flat roofs and ground",
        "Connecting and configuring grid-tied and hybrid inverters",
        "Installing energy storage",
        "Insulation resistance and continuity testing",
        "As-built documentation and acceptance reports",
        "SEP E and D up to 1 kV, RES installer certificate (UDT)",
        "Height work medical, category B driving licence"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "Solar PV Installer – Team Leader",
          company: "Solar-Wschód Energia Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Leading a three-person installation team, over 250 systems of 4–50 kWp.",
            "Took part in building two ground-mounted farms with a total capacity of 2 MWp.",
            "Installing and configuring hybrid inverters and energy storage for residential customers."
          ]
        },
        {
          title: "Electrical Installer",
          company: "Elektro-Instal Zamość s.c.",
          period: "05.2017 – 05.2020",
          bullets: [
            "Electrical installations in detached houses.",
            "Fitting distribution boards and protection devices, including for the first PV systems.",
            "Electrical testing and preparing test reports."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 1 w Zamościu",
        degree: "Electrical technician (technik elektryk)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Can I work as a PV installer without SEP qualifications?",
        a: "You can start as an installer's mate on structures and panels, but employers usually require SEP up to 1 kV for electrical connection work. The exam can be passed after a short course, so it is worth planning. In that case, write in your CV when you are taking the exam."
      },
      {
        q: "Is the UDT RES installer certificate mandatory?",
        a: "It is not required just to work on installations, but many companies value it and some ads list it as a plus. The certificate is valid for a set period and must be renewed, so give the expiry date in your CV. It shows you also understand the formal side of renewable energy installations."
      },
      {
        q: "How do I describe experience on solar farms?",
        a: "Give the farm's total capacity, your scope of work and how long the build lasted, e.g. installing driven-pile structures and laying cable routes. Farms are a different scale from house roofs, so list this as a separate point. Utility-scale companies look for exactly this kind of experience."
      }
    ]
  }
};

const uk = {
  "scrum-master": {
    slugLang: "skram-maister",
    name: "Скрам-майстер",
    title: "Резюме скрам-майстра: зразок і поради",
    metaDescription: "Резюме скрам-майстра під конкретну вакансію: зразок, фрази з оголошень і поради, як показати фасилітацію, сертифікат PSM або CSM і реальний вплив на команду.",
    intro: "Компанії, які шукають скрам-майстра, хочуть знати, скільком командам ви допомагали і що в них змінилося завдяки вашій роботі. У польських оголошеннях регулярно згадуються сертифікати PSM I або CSM, знання Jira і Confluence, а також досвід масштабування, наприклад SAFe чи LeSS. Рекрутери відрізняють людину, яка лише проводить зустрічі, від тієї, що усуває перешкоди й навчає команду самоорганізації. Ваше резюме має показати друге на прикладах.",
    keywords: [
      "сертифікат PSM I / CSM",
      "проведення подій Scrum",
      "фасилітація ретроспектив",
      "усунення перешкод (імпедиментів)",
      "Jira і Confluence",
      "Kanban",
      "робота з Product Owner над беклогом",
      "масштабування Agile (SAFe, LeSS)",
      "коучинг команди",
      "метрики команди (velocity, lead time)"
    ],
    tips: [
      "Вкажіть кількість і розмір команд, з якими працювали, та тип продукту, наприклад «2 команди по 7 осіб, банківський застосунок». Це одразу показує масштаб вашого досвіду.",
      "Замість переліку церемоній опишіть зміни, які ви запровадили: коротший lead time, менше завдань, перенесених між спринтами, стабільніше velocity. Найкращий доказ тут — цифри з Jira.",
      "Сертифікат пишіть повною назвою з організацією, наприклад «Professional Scrum Master I (Scrum.org)». Якщо в оголошенні згадано SAFe, а ви маєте навчання SAFe, вкажіть його окремо.",
      "Якщо раніше ви були програмістом, тестувальником чи аналітиком, не приховуйте цього. Роботодавці часто цінують скрам-майстра, який розуміє технічну роботу команди розробників."
    ],
    sample: {
      name: "Karolina Wieczorek",
      headline: "Скрам-майстер, PSM II",
      contact: ["+48 600 000 141", "karolina.wieczorek@example.com", "Wrocław", "linkedin.com/in/karolina-wieczorek-przyklad"],
      summary: "Скрам-майстер із п'ятирічним досвідом у командах, що створюють програмне забезпечення для логістики та фінтеху. Раніше працювала мануальною тестувальницею, тому добре розумію щоденну роботу розробників. Допомагаю командам прогнозовано постачати результат і самостійно розв'язувати проблеми.",
      skills: [
        "Professional Scrum Master I і II (Scrum.org)",
        "Фасилітація ретроспектив і воркшопів",
        "Jira, Confluence, Miro",
        "Kanban і управління потоком роботи",
        "Підтримка Product Owner у рефайнменті беклогу",
        "Робота в середовищі SAFe (PI Planning)",
        "Аналіз метрик: velocity, lead time, cycle time"
      ],
      languages: ["англійська C1"],
      jobs: [
        {
          title: "Скрам-майстер",
          company: "Logisoft Systems Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Веду дві команди (14 осіб), які розвивають систему управління автопарком і складом.",
            "Запровадила ліміти WIP і огляд потоку, що скоротило середній lead time з 11 до 6 днів.",
            "Співорганізовую щоквартальне PI Planning для чотирьох команд у моделі SAFe."
          ]
        },
        {
          title: "Тестувальниця ПЗ / скрам-майстер",
          company: "Finexa Tech Sp. z o.o.",
          period: "03.2017 – 05.2020",
          bullets: [
            "Мануальне тестування платіжного застосунку та підготовка тест-кейсів у Jira.",
            "З 2019 року виконувала роль скрам-майстра в команді з шести осіб.",
            "Запропонувала Definition of Done з критеріями тестування, що зменшило кількість помилок після релізу."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Ekonomiczny we Wrocławiu",
        degree: "Інформатика в бізнесі, магістратура",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Чи маю я шанс на роботу скрам-майстра без сертифіката PSM або CSM?",
        a: "Так, але багато оголошень називають сертифікат вимогою або вагомою перевагою, а фільтри ATS шукають ці абревіатури. PSM I складають онлайн без обов'язкового курсу, тож це відносно недорогий спосіб посилити резюме. До того часу конкретно опишіть, як ви застосовували Scrum на практиці."
      },
      {
        q: "Як описати роль скрам-майстра, поєднану з іншою посадою?",
        a: "Напишіть це прямо в назві посади, наприклад «Програміст / скрам-майстер», і розділіть пункти щодо обох ролей. Покажіть, скільки часу ви приділяли ролі скрам-майстра і що завдяки цьому змінилося в команді. Це чесно й добре сприймається при зміні кар'єрного шляху."
      },
      {
        q: "Які цифри вказати в резюме скрам-майстра?",
        a: "Найкраще ті, що показують зміну в часі: lead time, прогнозованість спринтів, кількість помилок після релізу чи частоту випусків. Уникайте самого velocity без контексту, бо кожна команда рахує його по-своєму. Достатньо двох-трьох сильних цифр."
      }
    ]
  },
  "analityk-biznesowy": {
    slugLang: "biznes-analityk",
    name: "Бізнес-аналітик",
    title: "Резюме бізнес-аналітика: зразок і поради",
    metaDescription: "Резюме бізнес-аналітика під вакансію: зразок, ключові слова з оголошень і поради, як описати збір вимог, BPMN, UML і співпрацю з ІТ-командами в Польщі.",
    intro: "Бізнес-аналітик перекладає потреби бізнесу на вимоги, які ІТ-команда може реалізувати, і це видно в кожному пункті оголошень. Роботодавці питають про воркшопи із зацікавленими сторонами, моделювання процесів у BPMN 2.0, варіанти використання в UML і написання користувацьких історій. Дедалі частіше очікують також основ SQL і знання галузі, наприклад банківської справи, страхування чи e-commerce. У резюме важливі проєкти, які ви провели від аналізу до впровадження.",
    keywords: [
      "збір і документування вимог",
      "моделювання процесів у BPMN 2.0",
      "діаграми UML",
      "користувацькі історії та критерії приймання",
      "воркшопи із зацікавленими сторонами",
      "SQL",
      "Jira і Confluence",
      "Enterprise Architect",
      "аналіз процесів AS-IS / TO-BE",
      "сертифікат IREB CPRE або IIBA"
    ],
    tips: [
      "Для кожного проєкту напишіть, яку бізнес-проблему він розв'язував і який був результат, наприклад скорочення часу обробки заявки. Саме «збирав вимоги» нічим не вирізняє.",
      "Перелічіть інструменти й нотації, якими справді користуєтеся: BPMN 2.0, UML, Enterprise Architect, Jira, Confluence. Оголошення називають їх прямо, а ATS їх шукає.",
      "Покажіть галузь. Аналітик із досвідом у страхуванні чи банківській справі має перевагу у вакансіях цих секторів, бо знає процеси й регуляції.",
      "Якщо ви пишете SQL-запити, перевіряєте дані чи готуєте сценарії приймального тестування, додайте це. Багато оголошень поєднують роль бізнес-аналітика з елементами системного аналізу."
    ],
    sample: {
      name: "Bartosz Michalak",
      headline: "Бізнес-аналітик у страхових проєктах",
      contact: ["+48 600 000 142", "bartosz.michalak@example.com", "Łódź", "linkedin.com/in/bartosz-michalak-przyklad"],
      summary: "Бізнес-аналітик із шестирічним досвідом у проєктах для страхування та обслуговування клієнтів. Проводжу воркшопи з бізнесом, моделюю процеси в BPMN і готую вимоги, зрозумілі для команд розробників. Маю сертифікат IREB CPRE Foundation Level.",
      skills: [
        "Воркшопи та інтерв'ю із зацікавленими сторонами",
        "BPMN 2.0, UML (варіанти використання, діаграми діяльності)",
        "Користувацькі історії та критерії приймання",
        "SQL (аналітичні запити)",
        "Enterprise Architect, Jira, Confluence",
        "Аналіз AS-IS / TO-BE",
        "IREB CPRE Foundation Level"
      ],
      languages: ["англійська B2"],
      jobs: [
        {
          title: "Бізнес-аналітик",
          company: "Polisa-Tech Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Аналіз і опис вимог до нової системи врегулювання автомобільних страхових випадків.",
            "Змоделював 18 процесів у BPMN 2.0, що дало змогу прибрати два зайві етапи погодження.",
            "Співпраця з розробниками й тестувальниками під час приймання чергових релізів."
          ]
        },
        {
          title: "Молодший аналітик процесів",
          company: "Centrum Obsługi Klienta Kontakt24 Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Мапування процесів обробки рекламацій і підготовка рекомендацій щодо покращень.",
            "Звіти з даних CRM у SQL та Excel для керівництва.",
            "Участь у впровадженні нового модуля CRM як представник бізнесу."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Łódzki",
        degree: "Інформатика та економетрія, магістратура",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Чим у резюме бізнес-аналітик відрізняється від системного?",
        a: "Бізнес-аналітик описує переважно процеси, потреби та бізнес-вимоги, а системний заходить глибше: в інтеграції, API та модель даних. Перевірте, які завдання переважають в оголошенні, і саме їх підкресліть в описі досвіду. Якщо ви робите і те, і інше, напишіть про це відкрито."
      },
      {
        q: "Чи варто вказувати сертифікат IREB або IIBA?",
        a: "Так, якщо він у вас є, бо частина оголошень називає його перевагою, особливо у великих компаніях і банках. Вкажіть повну назву та рівень, наприклад «IREB CPRE Foundation Level». Відсутність сертифіката не перекреслює кандидатуру, якщо досвід добре описано."
      },
      {
        q: "Як прийти в бізнес-аналіз без досвіду в ІТ?",
        a: "Покажіть у резюме ситуації, коли ви описували процеси, збирали вимоги чи брали участь у впровадженні системи як ключовий користувач. Це реальний аналітичний досвід. Додайте курс BPMN або SQL і приклад моделі процесу, який можна показати на співбесіді."
      }
    ]
  },
  "serwisant-komputerowy": {
    slugLang: "servisnyi-tekhnik-kompiuteriv",
    name: "Сервісний технік комп'ютерів / Технік-інформатик",
    title: "Резюме сервісного техніка комп'ютерів: зразок і поради",
    metaDescription: "Резюме сервісного техніка комп'ютерів: зразок, фрази з оголошень і поради, як описати діагностику обладнання, ремонти, мережі та обробку заявок у Польщі.",
    intro: "Оголошення для сервісних техніків комп'ютерів і техніків-інформатиків зазвичай стосуються діагностики й ремонту ноутбуків, стаціонарних комп'ютерів і принтерів, а також встановлення систем і основ мереж. У виїзному сервісі часто вимагають посвідчення водія категорії B, а деякі роботодавці очікують кваліфікації SEP до 1 кВ. Важливі самостійність, порядок у документуванні ремонтів і контакт із клієнтом. Добре написане резюме показує, які несправності ви усуваєте і скільки заявок обробляєте.",
    keywords: [
      "діагностика та ремонт комп'ютерного обладнання",
      "встановлення та налаштування Windows",
      "ремонт ноутбуків на рівні компонентів",
      "сервіс принтерів і БФП",
      "налаштування мереж LAN і Wi-Fi",
      "обробка заявок у тикет-системі",
      "Active Directory (основи)",
      "посвідчення водія категорії B",
      "кваліфікація SEP до 1 кВ",
      "освіта техніка-інформатика (technik informatyk)"
    ],
    tips: [
      "Опишіть, які ремонти виконуєте самостійно: заміна матриць, чищення систем охолодження, відновлення даних, пайка гнізд. Рівень ремонтів для роботодавця ключовий.",
      "Наведіть цифри: скільки заявок на день чи на місяць ви обробляєте і скільки пристроїв обслуговуєте. Це швидко показує масштаб роботи.",
      "Якщо маєте кваліфікації INF.02 та INF.03 або диплом техніка-інформатика, впишіть їх в освіту. Варто додати й сертифікати на кшталт CompTIA A+.",
      "Для виїзної роботи вкажіть посвідчення водія і регіон, який обслуговували. Кваліфікацію SEP наведіть із групою та строком дії."
    ],
    sample: {
      name: "Patryk Sowa",
      headline: "Сервісний технік комп'ютерів, технік-інформатик",
      contact: ["+48 600 000 143", "patryk.sowa@example.com", "Opole", "linkedin.com/in/patryk-sowa-przyklad"],
      summary: "Технік-інформатик із п'ятирічним досвідом у стаціонарному та виїзному сервісі. Ремонтую ноутбуки, комп'ютери та принтери, встановлюю системи й налаштовую невеликі офісні мережі. Маю посвідчення водія категорії B і кваліфікацію SEP E до 1 кВ.",
      skills: [
        "Діагностика та ремонт ноутбуків і ПК",
        "Заміна матриць, клавіатур, дисків і пам'яті",
        "Встановлення та налаштування Windows 10/11",
        "Сервіс лазерних принтерів і БФП",
        "Налаштування роутерів, комутаторів і Wi-Fi",
        "Обробка заявок у тикет-системі",
        "Кваліфікація SEP E до 1 кВ, посвідчення водія кат. B"
      ],
      languages: ["англійська B1"],
      jobs: [
        {
          title: "Виїзний ІТ-технік",
          company: "Komp-Serwis Opole Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Обслуговування близько 25 компаній-клієнтів в Опольському воєводстві, у середньому 60 заявок на місяць.",
            "Підготовка та розгортання 140 робочих місць під час переїзду офісу клієнта.",
            "Сервіс принтерів і БФП у межах сервісних договорів."
          ]
        },
        {
          title: "Технік комп'ютерного сервісу",
          company: "Laptop-Med s.c.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Ремонт ноутбуків: заміна матриць, гнізд живлення та систем охолодження.",
            "Відновлення даних з пошкоджених дисків і перенесення даних клієнтів.",
            "Приймання техніки від клієнтів і оцінка вартості ремонту."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektrycznych w Opolu",
        degree: "Технік-інформатик (technik informatyk), кваліфікації INF.02 та INF.03",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "Чи потрібна сервісному техніку комп'ютерів кваліфікація SEP?",
        a: "Не завжди, але частина роботодавців її вимагає, особливо при роботі з ДБЖ, серверними шафами чи інсталяціями в будівлях клієнтів. Якщо вона у вас є, вкажіть групу та строк дії. Якщо оголошення її вимагає, а у вас її немає, можна написати, що ви готові отримати її до початку роботи."
      },
      {
        q: "Як описати ремонти, зроблені вдома чи для знайомих?",
        a: "Якщо бракує професійного досвіду, можна вписати їх як проєкти, але по суті: які пристрої, які несправності, скільки ремонтів. Уникайте загальників на кшталт «захоплююся комп'ютерами». Конкретні приклади ремонтів переконують сервіс більше, ніж заяви."
      }
    ]
  },
  "administrator-baz-danych": {
    slugLang: "administrator-baz-danykh",
    name: "Адміністратор баз даних",
    title: "Резюме адміністратора баз даних: зразок і поради",
    metaDescription: "Резюме адміністратора баз даних (DBA) під вакансію: зразок, ключові слова з оголошень і поради, як описати Oracle, PostgreSQL, MS SQL, бекапи та тюнінг.",
    intro: "Оголошення для адміністраторів баз даних дуже технічні: роботодавець одразу називає СУБД, версії та середовище, наприклад Oracle 19c, PostgreSQL, Microsoft SQL Server чи хмарні бази в Azure або AWS. Ключові теми — резервне копіювання й відновлення, висока доступність, реплікація та оптимізація продуктивності запитів. Часто вимагають доброго знання Linux і скриптів на Bash або PowerShell, а в банках ще й чергувань on-call. Резюме DBA має показати масштаб середовища, яким ви керуєте.",
    keywords: [
      "адміністрування Oracle Database",
      "PostgreSQL",
      "Microsoft SQL Server",
      "резервне копіювання та відновлення (RMAN, pgBackRest)",
      "висока доступність (Data Guard, Always On)",
      "реплікація баз даних",
      "тюнінг продуктивності та оптимізація SQL-запитів",
      "адміністрування Linux",
      "скрипти Bash / PowerShell",
      "хмарні бази даних (Azure, AWS)"
    ],
    tips: [
      "Вкажіть масштаб: кількість інстансів, розмір баз у ТБ, кількість транзакцій або користувачів. «Обслуговування 120 інстансів PostgreSQL загальним обсягом 30 ТБ» каже більше, ніж сама назва СУБД.",
      "Перелічіть версії та технології HA, з якими працювали, наприклад Oracle 19c з Data Guard чи SQL Server Always On. Технічні рекрутери перевіряють саме такі деталі.",
      "Опишіть конкретні покращення: коротший час бекапу, швидший ключовий звіт, автоматизацію рутинних завдань. Найкраще з цифрами «до» і «після».",
      "Сертифікати, наприклад Oracle Certified Professional чи Microsoft Azure Database Administrator Associate, пишіть повною назвою. Варто згадати й чергування on-call, бо багато вакансій про це питають."
    ],
    sample: {
      name: "Agnieszka Pawlik",
      headline: "Адміністраторка баз даних Oracle і PostgreSQL",
      contact: ["+48 600 000 144", "agnieszka.pawlik@example.com", "Gliwice", "linkedin.com/in/agnieszka-pawlik-przyklad"],
      summary: "Адміністраторка баз даних із семирічним досвідом у продуктивних середовищах для енергетики та торгівлі. Відповідаю за резервні копії, високу доступність і продуктивність баз Oracle та PostgreSQL. Автоматизую повторювані завдання на Bash і Ansible.",
      skills: [
        "Oracle Database 19c, RMAN, Data Guard",
        "PostgreSQL 13–16, потокова реплікація, pgBackRest",
        "Тюнінг продуктивності та аналіз планів запитів",
        "Red Hat Enterprise Linux",
        "Bash, Ansible",
        "Моніторинг баз у Zabbix і Grafana",
        "Oracle Certified Professional (OCP)"
      ],
      languages: ["англійська B2"],
      jobs: [
        {
          title: "Адміністраторка баз даних",
          company: "Energo-IT Serwis Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Обслуговування 45 інстансів Oracle і 80 інстансів PostgreSQL загальним обсягом близько 25 ТБ.",
            "Міграція ключової білінгової системи з Oracle 12c на 19c з Data Guard без втрати даних.",
            "Скорочення часу нічного бекапу з 6 до 2,5 години завдяки інкрементним копіям і стисненню."
          ]
        },
        {
          title: "Молодша адміністраторка баз даних",
          company: "Handlowe Centrum Danych Merkury Sp. z o.o.",
          period: "02.2017 – 05.2020",
          bullets: [
            "Щоденне адміністрування баз Microsoft SQL Server і PostgreSQL для систем продажів.",
            "Оптимізація звітних запитів, що скоротила формування щоденного звіту з 40 до 8 хвилин.",
            "Участь у чергуваннях on-call та обробці продакшн-інцидентів."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska w Gliwicach",
        degree: "Інформатика, магістратура",
        period: "2011 – 2016"
      }
    },
    faq: [
      {
        q: "Чи вписувати в резюме СУБД, які знаю лише трохи?",
        a: "Так, але з чітким позначенням рівня, наприклад «MySQL — базове адміністрування». Технічні співбесіди для DBA бувають детальними, тож перебільшення швидко виявляються. Краще показати одну СУБД глибоко, а іншу чесно — як допоміжну."
      },
      {
        q: "Як показати досвід із хмарою, якщо я працював переважно on-premise?",
        a: "Опишіть навіть окремі проєкти: міграцію тестової бази до Azure SQL або Amazon RDS, бекапи в хмарі чи пілот. Додайте хмарний сертифікат, якщо ви його отримали. Компанії знають, що багато середовищ гібридні, тож міцні основи on-premise і далі цінуються."
      }
    ]
  },
  "murarz": {
    slugLang: "muliar",
    name: "Муляр",
    title: "Резюме муляра: зразок і поради",
    metaDescription: "Резюме муляра під оголошення: зразок, фрази з вакансій і поради, як описати кладку з блоків, клінкер, штукатурку, читання проєкту та будови в Польщі.",
    intro: "Роботодавці, які шукають мулярів, хочуть знати, з яких матеріалів ви кладете і на яких об'єктах працювали: приватні будинки, багатоквартирні будинки чи цехи. В оголошеннях згадуються силікатні блоки, керамічні блоки, газобетон і клінкерна цегла, а також читання будівельного проєкту. Часто вимагають чинного медичного допуску до роботи на висоті та посвідчення водія категорії B. Добре, коли резюме показує, що ви працюєте самостійно й можете керувати невеликою бригадою.",
    keywords: [
      "кладка стін із силікатних блоків",
      "кладка з керамічних блоків",
      "газобетон",
      "кладка з клінкерної цегли",
      "читання будівельного проєкту",
      "штукатурення",
      "влаштування перемичок і армопоясів",
      "робота на риштуваннях",
      "медичний допуск до роботи на висоті",
      "посвідчення водія категорії B"
    ],
    tips: [
      "Перелічіть матеріали, з якими працюєте, і типи стін: несучі, перегородки, лицьові. Лицьова кладка з клінкеру — окрема навичка, яку варто чітко виділити.",
      "Вкажіть типи об'єктів і масштаб, наприклад «приватні будинки під коробку, близько 12 будинків на рік» або «багатоквартирні будинки до 5 поверхів».",
      "Якщо керуєте бригадою, напишіть, скільки людей і за що відповідаєте: розмітка, контроль вертикалі, замовлення матеріалу. Це підвищує вашу цінність у вакансіях бригадира.",
      "Впишіть медичний допуск до висотних робіт, навчання з охорони праці та посвідчення водія. Якщо працювали за кордоном, додайте країну й мову, бо агенції часто про це питають."
    ],
    sample: {
      name: "Stanisław Wróbel",
      headline: "Муляр, бригадир на будівництві приватних будинків",
      contact: ["+48 600 000 145", "stanislaw.wrobel@example.com", "Siedlce", "linkedin.com/in/stanislaw-wrobel-przyklad"],
      summary: "Муляр із чотирнадцятирічним досвідом на будівництві приватних і багатоквартирних будинків. Кладу із силікату, кераміки, газобетону та клінкеру, читаю будівельний проєкт і керую бригадою з трьох осіб. Маю чинний медичний допуск до роботи на висоті та посвідчення водія категорії B.",
      skills: [
        "Кладка несучих стін і перегородок із силікату та кераміки",
        "Фасади з клінкерної цегли",
        "Газобетон на тонкошаровий розчин",
        "Перемички, армопояси та димарі",
        "Читання будівельного проєкту",
        "Керування бригадою мулярів",
        "Допуск до висотних робіт, посвідчення водія кат. B"
      ],
      languages: ["німецька A2"],
      jobs: [
        {
          title: "Муляр — бригадир",
          company: "Dom-Bud Siedlce Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Керування бригадою з трьох осіб на будівництві близько 10 приватних будинків на рік під коробку.",
            "Розмітка стін за проєктом, контроль вертикалі й горизонталі та приймання з керівником будови.",
            "Кладка клінкерних фасадів і системних димарів."
          ]
        },
        {
          title: "Муляр",
          company: "Przedsiębiorstwo Budowlane Mazowsze-Bud Sp. z o.o.",
          period: "04.2010 – 05.2020",
          bullets: [
            "Кладка несучих стін і перегородок у багатоквартирних будинках до 5 поверхів.",
            "Влаштування перемичок, армопоясів і армування разом із бригадою теслярів.",
            "Робота на риштуваннях із дотриманням правил охорони праці."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych nr 2 w Siedlcach",
        degree: "Муляр-штукатур (murarz-tynkarz)",
        period: "2007 – 2010"
      }
    },
    faq: [
      {
        q: "Чи потрібне муляру резюме взагалі?",
        a: "Дедалі частіше так, бо будівельні фірми та кадрові агенції приймають заявки через форми й портали. Досить однієї сторінки: матеріали, типи об'єктів, допуски й телефон. Коротке резюме також допомагає швидше дійти до розмови з керівником будови."
      },
      {
        q: "Як вписати досвід роботи на себе або без договору?",
        a: "Роботу у власній фірмі вписуйте звичайно, з назвою діяльності та обсягом робіт. Роботу без договору опишіть чесно, наприклад як «мулярські роботи на будівництві приватних будинків» з приблизними роками, не вигадуючи роботодавця. На співбесіді важать навички, а їх можна перевірити на будові."
      },
      {
        q: "Чи варто додавати фото своїх робіт?",
        a: "У саме резюме радше ні, але можна додати посилання на альбом або написати, що покажете фото на співбесіді. Для клінкерних і фасадних робіт фото виконаних об'єктів бувають сильним аргументом. Подбайте, щоб на них не було даних клієнтів чи адрес."
      }
    ]
  },
  "stolarz": {
    slugLang: "stoliar",
    name: "Столяр",
    title: "Резюме столяра: зразок і поради",
    metaDescription: "Резюме столяра під вакансію: зразок, ключові слова з оголошень і поради, як описати меблі на замовлення, роботу на ЧПК, кромкооблицювальному верстаті та монтаж.",
    intro: "Оголошення для столярів поділяються на виробництво меблів у цеху, столярку на замовлення та монтаж у клієнта, тож резюме має чітко показати, у якій із цих ролей ви почуваєтеся найкраще. Роботодавці питають про роботу на форматно-розкрійній пилці, кромкооблицювальному верстаті та центрах ЧПК, роботу з ламінованою плитою, МДФ і масивом, а також читання технічного креслення. При монтажі кухонь і вбудованих меблів важать точність і контакт із клієнтом. Досвід оздоблення, наприклад лакування чи олійного покриття, помітно підвищує цінність кандидата.",
    keywords: [
      "виготовлення меблів на замовлення",
      "робота на форматно-розкрійній пилці",
      "робота на кромкооблицювальному верстаті",
      "робота на верстатах ЧПК",
      "робота з ламінованою плитою і МДФ",
      "обробка масиву деревини",
      "монтаж кухонь і вбудованих меблів",
      "читання технічного креслення",
      "лакування та олійне покриття деревини",
      "посвідчення водія категорії B"
    ],
    tips: [
      "Напишіть, на яких верстатах працюєте самостійно, а щодо ЧПК — чи лише завантажуєте деталі, чи також готуєте програми. Для роботодавця це велика різниця.",
      "Вкажіть види виробів: кухні, вбудовані шафи, сходи, двері, меблі з масиву. Столяр зі сходів і столяр-меблевик в оголошеннях часто різні посади.",
      "Якщо монтуєте в клієнтів, додайте кількість замовлень і те, чи працюєте самостійно. Посвідчення водія категорії B тоді майже завжди обов'язкове.",
      "Програми для проєктування меблів, якими користуєтеся, вкажіть із назвою. Уміння підготувати розкрій — перевага в невеликих цехах."
    ],
    sample: {
      name: "Jakub Zając",
      headline: "Столяр-меблевик, меблі на замовлення та монтаж",
      contact: ["+48 600 000 146", "jakub.zajac@example.com", "Nowy Sącz", "linkedin.com/in/jakub-zajac-przyklad"],
      summary: "Столяр із дев'ятирічним досвідом виготовлення та монтажу меблів на замовлення. Працюю на форматно-розкрійній пилці, кромкооблицювальному верстаті та центрі ЧПК, з ламінованою плитою, МДФ і дубом. Самостійно монтую кухні та вбудовані меблі в клієнтів.",
      skills: [
        "Форматно-розкрійна пилка, кромкооблицювальний верстат, багатошпиндельний свердлильний верстат",
        "Робота на центрі ЧПК і базові зміни в програмах",
        "Меблі з ламінованої плити, лакованого МДФ і масиву",
        "Монтаж кухонь, вбудованих шаф і меблів",
        "Читання технічного креслення та підготовка розкрою",
        "Олійне покриття та лакування деревини",
        "Посвідчення водія категорії B"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Столяр-монтажник",
          company: "Meble Sądeckie Drewmar Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Виготовлення кухонь і шаф на замовлення за проєктами, близько 60 замовлень на рік.",
            "Самостійний монтаж меблів у клієнтів, зокрема підгонка до нерівних стін і підключень.",
            "Робота на центрі ЧПК під час свердління та фрезерування фасадів МДФ."
          ]
        },
        {
          title: "Столяр",
          company: "Zakład Stolarski Brzoza s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Виготовлення столів, сходів і дверей з масиву деревини.",
            "Шліфування, тонування та олійне покриття готових виробів.",
            "Розкрій плит на форматно-розкрійній пилці та облицювання кромок."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Drzewnych w Nowym Sączu",
        degree: "Столяр (stolarz)",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Чи вписувати в резюме столяра досвід із домашньої майстерні?",
        a: "Так, якщо ви виконували реальні замовлення чи більші проєкти, наприклад меблі або сходи для знайомих. Опишіть, що зробили, з якого матеріалу і якими інструментами. Без стажу в цеху фото виробів можуть переконати роботодавця більше, ніж диплом."
      },
      {
        q: "Чи вимагають роботодавці допусків на деревообробні верстати?",
        a: "На типові деревообробні верстати немає окремих державних допусків, як на навантажувачі, але роботодавець має провести навчання на робочому місці. У резюме досить перелічити верстати, на яких ви працюєте самостійно. Окремо варто вказати допуски UDT, якщо, наприклад, ви керуєте навантажувачем на складі плит."
      }
    ]
  },
  "dekarz": {
    slugLang: "pokrivelnyk",
    name: "Покрівельник",
    title: "Резюме покрівельника: зразок і поради",
    metaDescription: "Резюме покрівельника під вакансію: зразок, фрази з оголошень і поради, як описати покрівельні покриття, бляшані обробки, руберойд і роботу на висоті.",
    intro: "В оголошеннях для покрівельників роботодавці перелічують види покриттів: керамічну та бетонну черепицю, металочерепицю, фальцеву покрівлю, наплавлюваний руберойд і мембрани EPDM або PVC на плоских дахах. Важливі також бляшані обробки, ринви та монтаж мансардних вікон. Робота виконується на висоті, тож компанії очікують чинного медичного допуску й знання правил страхування. Часто бажані допуски UDT на мобільні підйомні платформи та посвідчення водія категорії B.",
    keywords: [
      "покриття керамічною та бетонною черепицею",
      "монтаж металочерепиці та фальцевої покрівлі",
      "наплавлюваний руберойд",
      "мембрани EPDM / PVC на плоских дахах",
      "бляшані обробки",
      "монтаж ринв і мансардних вікон",
      "влаштування крокв'яної системи",
      "медичний допуск до роботи на висоті",
      "допуск UDT на мобільні платформи",
      "посвідчення водія категорії B"
    ],
    tips: [
      "Перелічіть види покриттів, які кладете самостійно. Покрівельник для плоских дахів і руберойду в оголошеннях часто інша людина, ніж фахівець із керамічної черепиці.",
      "Вкажіть, чи виконуєте бляшані обробки на листозгинальному верстаті і чи монтуєте мансардні вікна. За ці навички компанії платять більше.",
      "Впишіть допуск до висотних робіт зі строком дії, навчання з охорони праці та допуски UDT на платформи, якщо маєте. З цього роботодавець починає перевірку кандидата.",
      "Додайте масштаб: кількість дахів за сезон або квадратні метри на промислових об'єктах. Варто згадати й навчання від виробників покрівельних матеріалів."
    ],
    sample: {
      name: "Mariusz Krawiec",
      headline: "Покрівельник-бляхар, скатні та плоскі дахи",
      contact: ["+48 600 000 147", "mariusz.krawiec@example.com", "Leszno", "linkedin.com/in/mariusz-krawiec-przyklad"],
      summary: "Покрівельник-бляхар з одинадцятирічним досвідом на дахах приватних будинків і промислових об'єктів. Кладу черепицю, металочерепицю, руберойд і мембрани EPDM, виконую бляшані обробки та монтую мансардні вікна. Маю чинний медичний допуск до роботи на висоті та допуски UDT на мобільні платформи.",
      skills: [
        "Керамічна та бетонна черепиця",
        "Металочерепиця та фальцева покрівля",
        "Наплавлюваний руберойд і мембрани EPDM",
        "Бляшані обробки на листозгинальному верстаті",
        "Монтаж мансардних вікон і водостічних систем",
        "Влаштування та ремонт крокв'яної системи",
        "Допуск до висотних робіт, UDT на мобільні платформи"
      ],
      languages: ["німецька A2"],
      jobs: [
        {
          title: "Покрівельник-бляхар",
          company: "Dach-Mistrz Leszno Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Покриття близько 25 дахів приватних будинків за сезон черепицею та металочерепицею.",
            "Обробки димарів, ендов і парапетів, монтаж мансардних вікон.",
            "Реконструкція плоских дахів складів мембраною EPDM, загалом понад 6 000 м²."
          ]
        },
        {
          title: "Помічник покрівельника, згодом покрівельник",
          company: "Zakład Dekarski Wielkopolanin s.c.",
          period: "03.2013 – 05.2020",
          bullets: [
            "Покриття дахів наплавлюваним руберойдом на багатоквартирних будинках.",
            "Монтаж ринв і водостічних труб, дрібний ремонт крокв'яної системи.",
            "Робота на висоті з використанням страхувальних поясів і тросів."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Lesznie",
        degree: "Покрівельник (dekarz)",
        period: "2010 – 2013"
      }
    },
    faq: [
      {
        q: "Чи треба вписувати медичний допуск до висотних робіт у резюме?",
        a: "Варто, бо це одне з перших запитань під час найму покрівельника. Впишіть коротко, наприклад «чинний медичний допуск до роботи на висоті до 2027 р.». Якщо строк минув, напишіть, що можете оновити його до початку роботи."
      },
      {
        q: "Як покрівельнику вирізнитися в резюме?",
        a: "Найкраще спеціалізацією та конкретикою: фальцева покрівля, сланець, зелені дахи чи великі плоскі дахи на цехах. Допомагають також навчання від виробників і вміння самостійно рахувати матеріал. Загальне «усі покрівельні роботи» рекрутерові мало що каже."
      }
    ]
  },
  "malarz-budowlany": {
    slugLang: "maliar-budivelnyi",
    name: "Будівельний маляр / Будівельна малярка",
    title: "Резюме будівельного маляра: зразок і поради",
    metaDescription: "Резюме будівельного маляра під вакансію: зразок, ключові слова з оголошень і поради, як описати шпаклювання, фарбування розпилювачем, гіпсокартон і оздоблення.",
    intro: "Оголошення для будівельних малярів рідко стосуються лише фарбування: роботодавці шукають людей, які підготують основу, нанесуть фінішну шпаклівку, зашпаклюють гіпсокартон і доведуть стіни до готового стану. Дедалі частіше згадується фарбування безповітряним розпилювачем, особливо на великих об'єктах і в новобудовах. На фасадах і в цехах важить робота на риштуваннях чи підйомниках. Оздоблювальні фірми цінують також поклейку шпалер і декоративні техніки.",
    keywords: [
      "підготовка основи",
      "гіпсова фінішна шпаклівка",
      "шпаклювання гіпсокартону",
      "фарбування розпилювачем (агрегатом)",
      "фарбування стін і стель",
      "фарбування фасадів",
      "поклейка шпалер",
      "декоративні штукатурки та техніки",
      "робота на риштуваннях",
      "точність і охайність"
    ],
    tips: [
      "Опишіть увесь обсяг, який виконуєте: від ґрунтування і шпаклювання до фінішного фарбування. Роботодавці шукають людей, яким не потрібен окремий штукатур для кожної поправки.",
      "Якщо фарбуєте безповітряним розпилювачем, напишіть це чітко. Про цю навичку дедалі частіше питають компанії, що працюють на великих об'єктах.",
      "Вкажіть типи об'єктів і масштаб, наприклад «квартири в новобудовах, близько 2 500 м² стін на місяць у бригаді» або «офіси та готелі».",
      "Декоративні техніки, архітектурний бетон чи вінілові шпалери додайте окремо. У вакансіях оздоблювальних фірм для приватних клієнтів це велика перевага."
    ],
    sample: {
      name: "Ewelina Duda",
      headline: "Будівельна малярка, шпаклювання та фарбування розпилювачем",
      contact: ["+48 600 000 148", "ewelina.duda@example.com", "Płock", "linkedin.com/in/ewelina-duda-przyklad"],
      summary: "Будівельна малярка з восьмирічним досвідом оздоблення квартир, офісів і комерційних приміщень. Готую основу, наношу фінішну шпаклівку, шпаклюю гіпсокартон і фарбую вручну та безповітряним розпилювачем. Також клею шпалери й виконую декоративні штукатурки.",
      skills: [
        "Ґрунтування та підготовка основи",
        "Гіпсова фінішна шпаклівка, вручну та механізовано",
        "Шпаклювання швів гіпсокартону",
        "Фарбування безповітряним розпилювачем",
        "Поклейка шпалер (флізелін, вініл)",
        "Декоративні штукатурки та архітектурний бетон",
        "Робота на риштуваннях і помостах"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Будівельна малярка",
          company: "Wykończenia Płock Kolor-Dom Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Оздоблення квартир у новобудовах під ключ, у бригаді близько 2 000 м² пофарбованої поверхні на місяць.",
            "Фарбування стель і стін в офісних будівлях безповітряним розпилювачем.",
            "Декоративні штукатурки та поклейка шпалер на замовлення приватних клієнтів."
          ]
        },
        {
          title: "Помічниця маляра, згодом малярка",
          company: "Usługi Remontowe Mazur-Rem s.c.",
          period: "05.2016 – 05.2020",
          bullets: [
            "Шліфування та ґрунтування стін, захист підлог і столярки перед фарбуванням.",
            "Нанесення фінішної шпаклівки та шпаклювання гіпсокартону в квартирах під час ремонту.",
            "Фарбування під'їздів у будинках житлових товариств."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Budowlanych w Płocku",
        degree: "Монтажник оздоблювальних робіт у будівництві (monter zabudowy i robót wykończeniowych w budownictwie)",
        period: "2013 – 2016"
      }
    },
    faq: [
      {
        q: "Чи може жінка успішно претендувати на посаду будівельного маляра?",
        a: "Так, в оздоблювальних роботах працює дедалі більше жінок, а роботодавці оцінюють насамперед якість і темп роботи. У резюме опишіть конкретні об'єкти й техніки, як і будь-який кандидат. Можна додати посилання на фото виконаних робіт."
      },
      {
        q: "Чи вписувати роботу з фарборозпилювачем, якщо користувався ним рідко?",
        a: "Так, але чесно вкажіть рівень, наприклад «фарбування розпилювачем — базовий досвід на стелях». Роботодавець може запитати про тип агрегату й сопла. Краще показати, що знаєте основи й хочете розвиватися, ніж перебільшувати."
      },
      {
        q: "Як описати короткі ремонтні замовлення?",
        a: "Об'єднайте їх в одну позицію, наприклад «Малярні роботи як самозайнята особа, 2018–2020», і перелічіть типові замовлення та їх кількість. Так резюме залишається зрозумілим, а досвід не губиться в довгому списку дрібних робіт."
      }
    ]
  },
  "glazurnik": {
    slugLang: "plytochnyk",
    name: "Плиточник / Облицювальник",
    title: "Резюме плиточника: зразок і поради",
    metaDescription: "Резюме плиточника під оголошення: зразок, фрази з вакансій і поради, як описати великоформатну плитку, гідроізоляцію, різання під 45 градусів і ванні кімнати.",
    intro: "Плиточник — один із найзатребуваніших оздоблювальників, а оголошення дедалі частіше вимагають досвіду з великоформатною плиткою, наприклад 120 × 60 см і більшою. Роботодавці питають про гідроізоляцію ванних кімнат, монтаж лінійних трапів, різання під 45 градусів і затирання швів, зокрема епоксидною затиркою. Важать рівна підготовка основи й точність, бо виправлення в плитці коштують дорого. Добре резюме показує обсяг робіт і види облицювання, з якими ви справляєтеся самостійно.",
    keywords: [
      "укладання керамічної плитки та керамограніту",
      "великоформатна плитка",
      "гідроізоляція ванних кімнат",
      "монтаж лінійних трапів",
      "різання плитки під 45 градусів",
      "затирання швів, зокрема епоксидною затиркою",
      "системи вирівнювання плитки",
      "підготовка та вирівнювання основи",
      "укладання мозаїки та натурального каменю",
      "оздоблення ванних кімнат під ключ"
    ],
    tips: [
      "Вкажіть найбільші формати плитки, з якими працюєте, наприклад «керамограніт 120 × 280 см». Досвід із великим форматом в оголошеннях часто окрема вимога і краще оплачується.",
      "Опишіть гідроізоляцію: рідку мембрану, ущільнювальні стрічки, манжети. Роботодавець хоче бути певним, що ванна не протече через рік.",
      "Перелічіть додаткові роботи в межах ванної: короби з гіпсокартону, монтаж інсталяцій, встановлення сантехніки. Це підвищує шанси в оздоблювальних фірмах.",
      "Додайте кількість об'єктів на рік і посилання на фото робіт, якщо вони є. У цій галузі портфоліо буває важливішим за сам опис."
    ],
    sample: {
      name: "Rafał Sadowski",
      headline: "Плиточник, великоформатна плитка та ванні під ключ",
      contact: ["+48 600 000 149", "rafal.sadowski@example.com", "Elbląg", "linkedin.com/in/rafal-sadowski-przyklad"],
      summary: "Плиточник із десятирічним досвідом оздоблення ванних кімнат, кухонь і комерційних приміщень. Укладаю великоформатний керамограніт, мозаїку та натуральний камінь, виконую гідроізоляцію та лінійні трапи. Працюю точно й самостійно, від підготовки основи до затирання швів.",
      skills: [
        "Великоформатний керамограніт до 120 × 280 см",
        "Гідроізоляція: рідка мембрана, стрічки, манжети",
        "Лінійні трапи та душові без піддона",
        "Різання під 45 градусів і шліфування кромок",
        "Цементні та епоксидні затирки",
        "Мозаїка та натуральний камінь",
        "Монтаж інсталяцій і встановлення сантехніки"
      ],
      languages: ["англійська A2", "німецька A2"],
      jobs: [
        {
          title: "Плиточник",
          company: "Łazienki Elbląg Ceramik-Pro Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Оздоблення близько 30 ванних кімнат на рік під ключ, зокрема з великоформатною плиткою.",
            "Гідроізоляція та душові з лінійним трапом без жодних рекламацій щодо протікання.",
            "Укладання керамограніту на терасах і зовнішніх сходах на дренажних системах."
          ]
        },
        {
          title: "Плиточник",
          company: "Firma Budowlana Żuławy-Bud Sp. z o.o.",
          period: "04.2014 – 05.2020",
          bullets: [
            "Укладання плитки у ванних і кухнях квартир у новобудовах.",
            "Підготовка основи: самовирівнювальні стяжки, ґрунтування, вирівнювання стін.",
            "Облицювання стін і підлог у комерційних приміщеннях."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych w Elblągu",
        degree: "Монтажник оздоблювальних робіт у будівництві (monter zabudowy i robót wykończeniowych w budownictwie)",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Glazurnik чи płytkarz — як назвати посаду в польському резюме?",
        a: "Обидва слова на практиці означають те саме, і оголошення вживають їх як синоніми. Найкраще використайте назву з оголошення, а другу можна додати в короткому описі. Так ваше резюме знайдуть за обома запитами."
      },
      {
        q: "Чи вказувати в резюме, скільки квадратних метрів укладаю за день?",
        a: "Можна, але обережно й із контекстом, бо продуктивність залежить від формату плитки й основи. Краще написати, наприклад, «близько 30 ванних кімнат на рік» або описати приклад об'єкта. Роботодавець більше боїться переробок, ніж повільнішого темпу."
      }
    ]
  },
  "monter-fotowoltaiki": {
    slugLang: "montazhnyk-soniachnykh-elektrostantsii",
    name: "Монтажник сонячних електростанцій",
    title: "Резюме монтажника сонячних електростанцій: зразок і поради",
    metaDescription: "Резюме монтажника фотоелектричних систем під вакансію: зразок, ключові слова з оголошень і поради, як описати монтаж панелей, інвертори, SEP і сертифікат UDT.",
    intro: "Монтажники сонячних електростанцій працюють на дахах будинків, комерційних будівель і на наземних сонячних фермах, і оголошення чітко це розрізняють. Роботодавці найчастіше вимагають кваліфікації SEP до 1 кВ, часто в групах експлуатації та нагляду, а бажаним є сертифікат інсталятора ВДЕ, який видає UDT. Важать монтаж конструкцій і панелей, підключення інвертора, електричні вимірювання та підготовка документів для оператора мережі. Дедалі частіше до цього додаються накопичувачі енергії та зарядні станції для електромобілів.",
    keywords: [
      "монтаж фотоелектричних систем",
      "монтаж конструкцій на дахах і на землі",
      "підключення та налаштування інверторів",
      "кваліфікація SEP до 1 кВ",
      "сертифікат інсталятора ВДЕ (UDT)",
      "електричні вимірювання PV-систем",
      "монтаж накопичувачів енергії",
      "робота на висоті",
      "виконавча документація",
      "посвідчення водія категорії B"
    ],
    tips: [
      "Впишіть кваліфікацію SEP із групою, обсягом (E, D) і строком дії, а також сертифікат UDT ВДЕ, якщо маєте. Без цих даних багато кандидатур відпадає одразу.",
      "Вкажіть масштаб: кількість інсталяцій, сумарну потужність у кВт пік, типи дахів і об'єктів. «Понад 300 інсталяцій потужністю 3–50 кВт пік» одразу показує досвід.",
      "Перелічіть марки й типи інверторів і накопичувачів, з якими працювали, та чи виконуєте налаштування й запуск. Варто додати й навчання від виробників.",
      "Якщо раніше ви були електриком чи покрівельником, опишіть це. Компанії цінують монтажників, які поєднують електротехнічні знання з безпечною роботою на даху."
    ],
    sample: {
      name: "Adrian Szewczyk",
      headline: "Монтажник сонячних електростанцій, SEP E і D до 1 кВ",
      contact: ["+48 600 000 150", "adrian.szewczyk@example.com", "Zamość", "linkedin.com/in/adrian-szewczyk-przyklad"],
      summary: "Монтажник сонячних електростанцій із шестирічним досвідом на приватних і комерційних інсталяціях та наземних фермах. Монтую конструкції й панелі, підключаю та запускаю інвертори, виконую вимірювання й виконавчу документацію. Маю кваліфікацію SEP E і D до 1 кВ та сертифікат інсталятора ВДЕ.",
      skills: [
        "Монтаж конструкцій на скатних, плоских дахах і на землі",
        "Підключення та налаштування мережевих і гібридних інверторів",
        "Монтаж накопичувачів енергії",
        "Вимірювання опору ізоляції та безперервності провідників",
        "Виконавча документація та акти приймання",
        "SEP E і D до 1 кВ, сертифікат інсталятора ВДЕ (UDT)",
        "Допуск до висотних робіт, посвідчення водія кат. B"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Монтажник сонячних електростанцій — керівник бригади",
          company: "Solar-Wschód Energia Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Керування монтажною бригадою з трьох осіб, понад 250 інсталяцій потужністю 4–50 кВт пік.",
            "Участь у будівництві двох наземних ферм загальною потужністю 2 МВт пік.",
            "Монтаж і налаштування гібридних інверторів та накопичувачів енергії для приватних клієнтів."
          ]
        },
        {
          title: "Електромонтажник",
          company: "Elektro-Instal Zamość s.c.",
          period: "05.2017 – 05.2020",
          bullets: [
            "Виконання електропроводки в приватних будинках.",
            "Монтаж розподільних щитів і захисту, зокрема для перших PV-інсталяцій.",
            "Електричні вимірювання та підготовка протоколів."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 1 w Zamościu",
        degree: "Технік-електрик (technik elektryk)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Чи можу я працювати монтажником фотовольтаїки без кваліфікації SEP?",
        a: "Можна почати помічником монтажника на конструкціях і панелях, але для електричних підключень роботодавці зазвичай вимагають SEP до 1 кВ. Іспит можна скласти після короткого курсу, тож варто його запланувати. У резюме тоді напишіть, коли складаєте іспит."
      },
      {
        q: "Чи обов'язковий сертифікат інсталятора ВДЕ від UDT?",
        a: "Він не потрібен для самої роботи на монтажі, але багато компаній його цінують, а частина оголошень називає його перевагою. Сертифікат діє певний час і потребує поновлення, тож у резюме вкажіть строк дії. Він показує, що ви знаєте інсталяції ВДЕ і з формального боку."
      },
      {
        q: "Як описати досвід на сонячних фермах?",
        a: "Вкажіть загальну потужність ферми, свій обсяг робіт і тривалість будівництва, наприклад монтаж забивних конструкцій і прокладання кабельних трас. Ферми — це інший масштаб, ніж дахи будинків, тож винесіть це окремим пунктом. Компанії з великомасштабного сектору шукають саме такий досвід."
      }
    ]
  }
};

const de = {
  "scrum-master": {
    slugLang: "scrum-master",
    name: "Scrum Master",
    title: "Lebenslauf Scrum Master: Muster und Tipps",
    metaDescription: "Lebenslauf als Scrum Master für eine konkrete Stelle: Muster, Begriffe aus Anzeigen und Tipps, wie Sie Moderation, PSM oder CSM und Ihre Wirkung im Team zeigen.",
    intro: "Unternehmen, die einen Scrum Master suchen, wollen wissen, wie viele Teams Sie begleitet haben und was sich dort durch Ihre Arbeit verändert hat. In polnischen Stellenanzeigen tauchen regelmäßig die Zertifikate PSM I oder CSM, Jira und Confluence sowie Erfahrung mit Skalierung wie SAFe oder LeSS auf. Recruiter unterscheiden zwischen jemandem, der nur Meetings leitet, und jemandem, der Hindernisse beseitigt und dem Team Selbstorganisation beibringt. Ihr Lebenslauf sollte Letzteres mit Beispielen belegen.",
    keywords: [
      "Zertifikat PSM I / CSM",
      "Durchführung der Scrum-Events",
      "Moderation von Retrospektiven",
      "Beseitigung von Hindernissen (Impediments)",
      "Jira und Confluence",
      "Kanban",
      "Backlog-Arbeit mit dem Product Owner",
      "agile Skalierung (SAFe, LeSS)",
      "Teamcoaching",
      "Teammetriken (Velocity, Lead Time)"
    ],
    tips: [
      "Nennen Sie Anzahl und Größe der Teams sowie die Art des Produkts, z. B. „2 Teams mit je 7 Personen, Banking-App“. So ist der Umfang Ihrer Erfahrung sofort klar.",
      "Beschreiben Sie statt einer Liste von Zeremonien die Veränderungen, die Sie eingeführt haben: kürzere Lead Time, weniger übertragene Aufgaben zwischen Sprints, stabilere Velocity. Zahlen aus Jira sind hier der beste Beleg.",
      "Schreiben Sie das Zertifikat mit vollem Namen und Aussteller aus, z. B. „Professional Scrum Master I (Scrum.org)“. Erwähnt die Anzeige SAFe und haben Sie eine SAFe-Schulung, führen Sie diese separat auf.",
      "Wenn Sie früher Entwickler, Tester oder Analyst waren, verschweigen Sie es nicht. Arbeitgeber schätzen oft einen Scrum Master, der die technische Arbeit eines Entwicklungsteams versteht."
    ],
    sample: {
      name: "Karolina Wieczorek",
      headline: "Scrum Master, PSM II",
      contact: ["+48 600 000 141", "karolina.wieczorek@example.com", "Wrocław", "linkedin.com/in/karolina-wieczorek-przyklad"],
      summary: "Scrum Master mit fünf Jahren Erfahrung in Teams, die Software für Logistik und Fintech entwickeln. Zuvor war ich manuelle Testerin und kenne daher den Arbeitsalltag von Entwicklern gut. Ich helfe Teams, verlässlich zu liefern und Probleme selbstständig zu lösen.",
      skills: [
        "Professional Scrum Master I und II (Scrum.org)",
        "Moderation von Retrospektiven und Workshops",
        "Jira, Confluence, Miro",
        "Kanban und Flow-Management",
        "Unterstützung des Product Owners beim Backlog Refinement",
        "Arbeit in einem SAFe-Umfeld (PI Planning)",
        "Analyse von Metriken: Velocity, Lead Time, Cycle Time"
      ],
      languages: ["Englisch C1"],
      jobs: [
        {
          title: "Scrum Master",
          company: "Logisoft Systems Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Begleitung von zwei Teams (14 Personen), die ein Flotten- und Lagerverwaltungssystem entwickeln.",
            "Einführung von WIP-Limits und Flow-Reviews, wodurch die durchschnittliche Lead Time von 11 auf 6 Tage sank.",
            "Mitorganisation des vierteljährlichen PI Planning für vier Teams nach SAFe."
          ]
        },
        {
          title: "Softwaretesterin / Scrum Master",
          company: "Finexa Tech Sp. z o.o.",
          period: "03.2017 – 05.2020",
          bullets: [
            "Manuelle Tests einer Zahlungs-App und Erstellung von Testfällen in Jira.",
            "Ab 2019 Rolle als Scrum Master in einem sechsköpfigen Team.",
            "Vorschlag einer Definition of Done mit Testkriterien, wodurch weniger Fehler nach dem Release gemeldet wurden."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Ekonomiczny we Wrocławiu",
        degree: "Wirtschaftsinformatik, Master",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Habe ich ohne PSM- oder CSM-Zertifikat eine Chance auf eine Stelle als Scrum Master?",
        a: "Ja, aber viele Anzeigen nennen ein Zertifikat als Voraussetzung oder klares Plus, und ATS-Filter suchen nach diesen Kürzeln. PSM I wird online ohne Pflichtkurs abgelegt und ist daher ein relativ günstiger Weg, den Lebenslauf zu stärken. Bis dahin beschreiben Sie konkret, wie Sie Scrum in der Praxis angewendet haben."
      },
      {
        q: "Wie beschreibe ich eine Scrum-Master-Rolle, die mit einer anderen Funktion kombiniert war?",
        a: "Schreiben Sie es direkt in die Stellenbezeichnung, z. B. „Entwickler / Scrum Master“, und trennen Sie die Punkte für beide Rollen. Zeigen Sie, wie viel Zeit Sie der Scrum-Master-Rolle gewidmet haben und was sich dadurch im Team verändert hat. Das ist ehrlich und kommt bei einem Berufswechsel gut an."
      },
      {
        q: "Welche Zahlen gehören in den Lebenslauf eines Scrum Masters?",
        a: "Am besten solche, die eine Veränderung über die Zeit zeigen: Lead Time, Planbarkeit der Sprints, Fehler nach dem Release oder Release-Häufigkeit. Vermeiden Sie die bloße Velocity ohne Kontext, weil jedes Team sie anders zählt. Zwei, drei starke Zahlen reichen."
      }
    ]
  },
  "analityk-biznesowy": {
    slugLang: "business-analyst",
    name: "Business Analyst / Business Analystin",
    title: "Lebenslauf Business Analyst: Muster und Tipps",
    metaDescription: "Lebenslauf als Business Analyst passend zur Stelle: Muster, Schlüsselbegriffe aus Anzeigen und Tipps zu Anforderungsmanagement, BPMN, UML und Arbeit mit der IT.",
    intro: "Ein Business Analyst übersetzt die Bedürfnisse des Fachbereichs in Anforderungen, die ein IT-Team umsetzen kann, und das spiegelt sich in jedem Punkt der Stellenanzeigen wider. Arbeitgeber fragen nach Workshops mit Stakeholdern, Prozessmodellierung in BPMN 2.0, UML-Anwendungsfällen und dem Schreiben von User Stories. Immer häufiger werden auch SQL-Grundlagen und Branchenkenntnisse erwartet, etwa in Banking, Versicherung oder E-Commerce. Im Lebenslauf zählen Projekte, die Sie von der Analyse bis zur Einführung begleitet haben.",
    keywords: [
      "Erhebung und Dokumentation von Anforderungen",
      "Prozessmodellierung in BPMN 2.0",
      "UML-Diagramme",
      "User Stories und Akzeptanzkriterien",
      "Workshops mit Stakeholdern",
      "SQL",
      "Jira und Confluence",
      "Enterprise Architect",
      "Ist-/Soll-Prozessanalyse",
      "Zertifikat IREB CPRE oder IIBA"
    ],
    tips: [
      "Schreiben Sie bei jedem Projekt, welches fachliche Problem es gelöst hat und mit welchem Ergebnis, z. B. kürzere Bearbeitungszeit für Anträge. Ein bloßes „Anforderungen erhoben“ hebt Sie nicht ab.",
      "Nennen Sie die Werkzeuge und Notationen, die Sie tatsächlich nutzen: BPMN 2.0, UML, Enterprise Architect, Jira, Confluence. Anzeigen führen sie direkt auf, und ATS-Systeme suchen danach.",
      "Zeigen Sie Ihre Branche. Eine Analystin mit Erfahrung in Versicherung oder Banking hat in Anzeigen aus diesen Sektoren einen Vorteil, weil sie Prozesse und Regulierung kennt.",
      "Wenn Sie SQL-Abfragen schreiben, Daten prüfen oder Abnahmetestszenarien erstellen, ergänzen Sie das. Viele Anzeigen verbinden die Rolle mit Elementen der Systemanalyse."
    ],
    sample: {
      name: "Bartosz Michalak",
      headline: "Business Analyst in Versicherungsprojekten",
      contact: ["+48 600 000 142", "bartosz.michalak@example.com", "Łódź", "linkedin.com/in/bartosz-michalak-przyklad"],
      summary: "Business Analyst mit sechs Jahren Erfahrung in Projekten für Versicherungen und Kundenservice. Ich leite Workshops mit dem Fachbereich, modelliere Prozesse in BPMN und formuliere Anforderungen, mit denen Entwicklungsteams gut arbeiten können. Ich habe das Zertifikat IREB CPRE Foundation Level.",
      skills: [
        "Workshops und Interviews mit Stakeholdern",
        "BPMN 2.0, UML (Anwendungsfälle, Aktivitätsdiagramme)",
        "User Stories und Akzeptanzkriterien",
        "SQL (analytische Abfragen)",
        "Enterprise Architect, Jira, Confluence",
        "Ist-/Soll-Analyse",
        "IREB CPRE Foundation Level"
      ],
      languages: ["Englisch B2"],
      jobs: [
        {
          title: "Business Analyst",
          company: "Polisa-Tech Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Analyse und Beschreibung der Anforderungen für ein neues System zur Kfz-Schadenregulierung.",
            "Modellierung von 18 Prozessen in BPMN 2.0, wodurch zwei überflüssige Freigabeschritte entfielen.",
            "Zusammenarbeit mit Entwicklern und Testern bei der Abnahme der einzelnen Releases."
          ]
        },
        {
          title: "Junior-Prozessanalyst",
          company: "Centrum Obsługi Klienta Kontakt24 Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Mapping der Reklamationsprozesse und Erarbeitung von Verbesserungsempfehlungen.",
            "Berichte aus CRM-Daten in SQL und Excel für die Geschäftsleitung.",
            "Mitwirkung an der Einführung eines neuen CRM-Moduls als Vertreter des Fachbereichs."
          ]
        }
      ],
      education: {
        school: "Uniwersytet Łódzki",
        degree: "Informatik und Ökonometrie, Master",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Wie unterscheidet sich im Lebenslauf ein Business Analyst von einem Systemanalysten?",
        a: "Ein Business Analyst beschreibt vor allem Prozesse, Bedürfnisse und fachliche Anforderungen, ein Systemanalyst geht tiefer in Schnittstellen, APIs und das Datenmodell. Prüfen Sie, welche Aufgaben in der Anzeige überwiegen, und heben Sie genau diese hervor. Wenn Sie beides tun, sagen Sie das offen."
      },
      {
        q: "Lohnt es sich, ein IREB- oder IIBA-Zertifikat anzugeben?",
        a: "Ja, wenn Sie eines haben, denn manche Anzeigen nennen es als Plus, besonders in großen Unternehmen und Banken. Geben Sie den vollen Namen und die Stufe an, z. B. „IREB CPRE Foundation Level“. Ohne Zertifikat sind Sie nicht chancenlos, wenn die Erfahrung gut beschrieben ist."
      },
      {
        q: "Wie gelingt der Einstieg in die Business-Analyse ohne IT-Erfahrung?",
        a: "Zeigen Sie Situationen, in denen Sie Prozesse beschrieben, Anforderungen gesammelt oder als Key User an einer Systemeinführung mitgewirkt haben. Das ist echte analytische Erfahrung. Ergänzen Sie einen BPMN- oder SQL-Kurs und ein Beispielmodell, das Sie im Gespräch zeigen können."
      }
    ]
  },
  "serwisant-komputerowy": {
    slugLang: "computertechniker",
    name: "Computertechniker / IT-Techniker",
    title: "Lebenslauf Computertechniker: Muster und Tipps",
    metaDescription: "Lebenslauf als Computertechniker oder IT-Techniker: Muster, Begriffe aus Anzeigen und Tipps zu Hardware-Diagnose, Reparaturen, Netzwerken und Ticketbearbeitung.",
    intro: "Stellenanzeigen für Computertechniker und IT-Techniker betreffen meist Diagnose und Reparatur von Laptops, Desktop-PCs und Druckern sowie die Installation von Betriebssystemen und Netzwerkgrundlagen. Im Außendienst wird oft ein Führerschein der Klasse B verlangt, manche Arbeitgeber erwarten auch eine SEP-Elektroqualifikation bis 1 kV. Es zählen Selbstständigkeit, saubere Dokumentation der Reparaturen und der Umgang mit Kunden. Ein guter Lebenslauf zeigt, welche Fehler Sie beheben und wie viele Tickets Sie bearbeiten.",
    keywords: [
      "Diagnose und Reparatur von Computerhardware",
      "Installation und Konfiguration von Windows",
      "Laptop-Reparatur auf Bauteilebene",
      "Wartung von Druckern und Multifunktionsgeräten",
      "Konfiguration von LAN und WLAN",
      "Ticketbearbeitung im Ticketsystem",
      "Active Directory (Grundlagen)",
      "Führerschein Klasse B",
      "SEP-Qualifikation bis 1 kV",
      "Ausbildung als IT-Techniker (technik informatyk)"
    ],
    tips: [
      "Beschreiben Sie, welche Reparaturen Sie selbstständig ausführen: Displaytausch, Reinigung von Kühlsystemen, Datenrettung, Löten von Buchsen. Das Reparaturniveau ist für Arbeitgeber entscheidend.",
      "Nennen Sie Zahlen: wie viele Tickets Sie pro Tag oder Monat bearbeiten und wie viele Geräte Sie betreuen. Das zeigt schnell den Umfang Ihrer Arbeit.",
      "Wenn Sie die Qualifikationen INF.02 und INF.03 oder einen Abschluss als IT-Techniker haben, tragen Sie sie unter Ausbildung ein. Zertifikate wie CompTIA A+ lohnen sich ebenfalls.",
      "Bei Außendiensttätigkeit nennen Sie Führerschein und betreutes Gebiet. Die SEP-Qualifikation geben Sie mit Gruppe und Gültigkeitsdatum an."
    ],
    sample: {
      name: "Patryk Sowa",
      headline: "Computertechniker, IT-Techniker",
      contact: ["+48 600 000 143", "patryk.sowa@example.com", "Opole", "linkedin.com/in/patryk-sowa-przyklad"],
      summary: "IT-Techniker mit fünf Jahren Erfahrung in Werkstatt und Außendienst. Ich repariere Laptops, Computer und Drucker, installiere Betriebssysteme und richte kleine Büronetzwerke ein. Ich habe einen Führerschein der Klasse B und die Qualifikation SEP E bis 1 kV.",
      skills: [
        "Diagnose und Reparatur von Laptops und PCs",
        "Austausch von Displays, Tastaturen, Laufwerken und Arbeitsspeicher",
        "Installation und Konfiguration von Windows 10/11",
        "Wartung von Laserdruckern und Multifunktionsgeräten",
        "Konfiguration von Routern, Switches und WLAN",
        "Ticketbearbeitung im Ticketsystem",
        "SEP E bis 1 kV, Führerschein Klasse B"
      ],
      languages: ["Englisch B1"],
      jobs: [
        {
          title: "IT-Außendiensttechniker",
          company: "Komp-Serwis Opole Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Betreuung von rund 25 Kundenunternehmen in der Woiwodschaft Oppeln, durchschnittlich 60 Tickets im Monat.",
            "Vorbereitung und Einrichtung von 140 Arbeitsplätzen beim Büroumzug eines Kunden.",
            "Wartung von Druckern und Multifunktionsgeräten im Rahmen von Serviceverträgen."
          ]
        },
        {
          title: "Techniker im Computerservice",
          company: "Laptop-Med s.c.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Laptop-Reparaturen: Austausch von Displays, Ladebuchsen und Kühlsystemen.",
            "Datenrettung von beschädigten Laufwerken und Migration von Kundendaten.",
            "Annahme von Geräten und Erstellung von Kostenvoranschlägen."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektrycznych w Opolu",
        degree: "IT-Techniker (technik informatyk), Qualifikationen INF.02 und INF.03",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "Braucht ein Computertechniker eine SEP-Qualifikation?",
        a: "Nicht immer, aber manche Arbeitgeber verlangen sie, besonders bei Arbeiten an USV-Anlagen, Serverschränken oder Installationen in Kundengebäuden. Wenn Sie sie haben, nennen Sie Gruppe und Gültigkeit. Verlangt die Anzeige sie und Sie haben sie nicht, können Sie schreiben, dass Sie sie vor Arbeitsbeginn erwerben."
      },
      {
        q: "Wie beschreibe ich Reparaturen, die ich privat oder für Bekannte gemacht habe?",
        a: "Ohne Berufserfahrung können Sie sie als Projekte angeben, aber sachlich: welche Geräte, welche Fehler, wie viele Reparaturen. Vermeiden Sie Floskeln wie „Computerenthusiast“. Konkrete Reparaturbeispiele überzeugen einen Servicebetrieb mehr als Behauptungen."
      }
    ]
  },
  "administrator-baz-danych": {
    slugLang: "datenbankadministrator",
    name: "Datenbankadministrator / Datenbankadministratorin",
    title: "Lebenslauf Datenbankadministrator: Muster und Tipps",
    metaDescription: "Lebenslauf als Datenbankadministrator (DBA) für die Stelle: Muster, Schlüsselbegriffe aus Anzeigen und Tipps zu Oracle, PostgreSQL, MS SQL, Backups und Tuning.",
    intro: "Stellenanzeigen für Datenbankadministratoren sind sehr technisch: Der Arbeitgeber nennt sofort Datenbanksysteme, Versionen und Umgebung, etwa Oracle 19c, PostgreSQL, Microsoft SQL Server oder Cloud-Datenbanken in Azure oder AWS. Zentral sind Backup und Wiederherstellung, Hochverfügbarkeit, Replikation und das Tuning der Abfrageleistung. Häufig werden gute Linux-Kenntnisse und Skripting in Bash oder PowerShell verlangt, in Banken auch Rufbereitschaft. Der Lebenslauf eines DBA muss die Größe der betreuten Umgebung zeigen.",
    keywords: [
      "Administration von Oracle Database",
      "PostgreSQL",
      "Microsoft SQL Server",
      "Backup und Recovery (RMAN, pgBackRest)",
      "Hochverfügbarkeit (Data Guard, Always On)",
      "Datenbankreplikation",
      "Performance-Tuning und Optimierung von SQL-Abfragen",
      "Linux-Administration",
      "Skripting in Bash / PowerShell",
      "Cloud-Datenbanken (Azure, AWS)"
    ],
    tips: [
      "Nennen Sie den Umfang: Anzahl der Instanzen, Datenbankgröße in TB, Transaktionen oder Nutzer. „Betreuung von 120 PostgreSQL-Instanzen mit insgesamt 30 TB“ sagt mehr als der Name des Systems.",
      "Führen Sie Versionen und HA-Technologien auf, mit denen Sie gearbeitet haben, z. B. Oracle 19c mit Data Guard oder SQL Server Always On. Technische Recruiter prüfen genau solche Details.",
      "Beschreiben Sie konkrete Verbesserungen: kürzere Backup-Zeiten, ein schnellerer Schlüsselbericht, automatisierte Routineaufgaben. Am besten mit Vorher-Nachher-Zahlen.",
      "Zertifikate wie Oracle Certified Professional oder Microsoft Azure Database Administrator Associate schreiben Sie mit vollem Namen aus. Auch Rufbereitschaft ist erwähnenswert, da viele Anzeigen danach fragen."
    ],
    sample: {
      name: "Agnieszka Pawlik",
      headline: "Datenbankadministratorin für Oracle und PostgreSQL",
      contact: ["+48 600 000 144", "agnieszka.pawlik@example.com", "Gliwice", "linkedin.com/in/agnieszka-pawlik-przyklad"],
      summary: "Datenbankadministratorin mit sieben Jahren Erfahrung in Produktionsumgebungen für Energiewirtschaft und Handel. Ich verantworte Backups, Hochverfügbarkeit und Performance von Oracle- und PostgreSQL-Datenbanken. Wiederkehrende Aufgaben automatisiere ich mit Bash und Ansible.",
      skills: [
        "Oracle Database 19c, RMAN, Data Guard",
        "PostgreSQL 13–16, Streaming-Replikation, pgBackRest",
        "Performance-Tuning und Analyse von Ausführungsplänen",
        "Red Hat Enterprise Linux",
        "Bash, Ansible",
        "Datenbank-Monitoring mit Zabbix und Grafana",
        "Oracle Certified Professional (OCP)"
      ],
      languages: ["Englisch B2"],
      jobs: [
        {
          title: "Datenbankadministratorin",
          company: "Energo-IT Serwis Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Betreuung von 45 Oracle- und 80 PostgreSQL-Instanzen mit einer Gesamtgröße von etwa 25 TB.",
            "Migration eines zentralen Abrechnungssystems von Oracle 12c auf 19c mit Data Guard ohne Datenverlust.",
            "Verkürzung des nächtlichen Backups von 6 auf 2,5 Stunden durch inkrementelle Sicherungen und Komprimierung."
          ]
        },
        {
          title: "Junior-Datenbankadministratorin",
          company: "Handlowe Centrum Danych Merkury Sp. z o.o.",
          period: "02.2017 – 05.2020",
          bullets: [
            "Tägliche Administration von Microsoft SQL Server und PostgreSQL für Vertriebssysteme.",
            "Optimierung von Berichtsabfragen, wodurch der Tagesbericht statt 40 nur noch 8 Minuten brauchte.",
            "Teilnahme an der Rufbereitschaft und Bearbeitung von Produktionsvorfällen."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska w Gliwicach",
        degree: "Informatik, Master",
        period: "2011 – 2016"
      }
    },
    faq: [
      {
        q: "Soll ich Datenbanksysteme angeben, die ich nur ein wenig kenne?",
        a: "Ja, aber mit klarer Angabe des Niveaus, z. B. „MySQL – Grundlagen der Administration“. Technische Gespräche für DBAs sind oft detailliert, Übertreibungen fallen schnell auf. Besser ein System in der Tiefe zeigen und ein zweites ehrlich als ergänzend."
      },
      {
        q: "Wie zeige ich Cloud-Erfahrung, wenn ich überwiegend on-premise gearbeitet habe?",
        a: "Beschreiben Sie auch einzelne Projekte: Migration einer Testdatenbank zu Azure SQL oder Amazon RDS, Backups in der Cloud oder ein Pilotprojekt. Ergänzen Sie ein Cloud-Zertifikat, falls vorhanden. Unternehmen wissen, dass viele Umgebungen hybrid sind, daher sind solide On-Premise-Kenntnisse weiterhin gefragt."
      }
    ]
  },
  "murarz": {
    slugLang: "maurer",
    name: "Maurer",
    title: "Lebenslauf Maurer: Muster und Tipps",
    metaDescription: "Lebenslauf als Maurer passend zur Anzeige: Muster, Begriffe aus Stellenangeboten und Tipps zu Mauerwerk aus Steinen, Klinker, Putz, Bauplänen und Baustellen.",
    intro: "Arbeitgeber, die Maurer suchen, wollen wissen, mit welchen Materialien Sie mauern und auf welchen Objekten Sie gearbeitet haben: Einfamilienhäuser, Mehrfamilienhäuser oder Hallen. In Anzeigen tauchen Kalksandstein, Hochlochziegel, Porenbeton und Klinker auf, ebenso das Lesen von Bauplänen. Oft wird eine gültige arbeitsmedizinische Untersuchung für Arbeiten in der Höhe sowie ein Führerschein der Klasse B verlangt. Gut ist, wenn der Lebenslauf zeigt, dass Sie selbstständig arbeiten und eine kleine Kolonne führen können.",
    keywords: [
      "Mauern von Wänden aus Kalksandstein",
      "Mauern mit Hochlochziegeln",
      "Porenbeton",
      "Klinkermauerwerk",
      "Lesen von Bauplänen",
      "Verputzen",
      "Herstellung von Stürzen und Ringankern",
      "Arbeit auf Gerüsten",
      "Höhentauglichkeitsuntersuchung",
      "Führerschein Klasse B"
    ],
    tips: [
      "Nennen Sie die Materialien, mit denen Sie arbeiten, und die Art des Mauerwerks: tragend, Trennwand, Sichtmauerwerk. Klinker-Sichtmauerwerk ist eine eigene Fertigkeit, die Sie klar hervorheben sollten.",
      "Geben Sie Bauvorhaben und Umfang an, z. B. „Rohbau von Einfamilienhäusern, ca. 12 Gebäude pro Jahr“ oder „Mehrfamilienhäuser bis 5 Geschosse“.",
      "Wenn Sie eine Kolonne führen, schreiben Sie, wie viele Leute und wofür Sie verantwortlich sind: Einmessen, Lot- und Fluchtkontrolle, Materialbestellung. Das steigert Ihren Wert bei Anzeigen für Vorarbeiter.",
      "Tragen Sie die Höhentauglichkeit, Arbeitsschutzschulung und den Führerschein ein. Wenn Sie im Ausland gearbeitet haben, nennen Sie Land und Sprache, denn Agenturen fragen oft danach."
    ],
    sample: {
      name: "Stanisław Wróbel",
      headline: "Maurer, Vorarbeiter im Einfamilienhausbau",
      contact: ["+48 600 000 145", "stanislaw.wrobel@example.com", "Siedlce", "linkedin.com/in/stanislaw-wrobel-przyklad"],
      summary: "Maurer mit vierzehn Jahren Erfahrung im Bau von Einfamilien- und Mehrfamilienhäusern. Ich mauere mit Kalksandstein, Ziegel, Porenbeton und Klinker, lese Baupläne und führe eine dreiköpfige Kolonne. Ich habe eine gültige Höhentauglichkeitsuntersuchung und einen Führerschein der Klasse B.",
      skills: [
        "Tragende Wände und Trennwände aus Kalksandstein und Ziegel",
        "Klinkerfassaden",
        "Porenbeton mit Dünnbettmörtel",
        "Stürze, Ringanker und Schornsteine",
        "Lesen von Bauplänen",
        "Führung einer Maurerkolonne",
        "Höhentauglichkeit, Führerschein Klasse B"
      ],
      languages: ["Deutsch A2"],
      jobs: [
        {
          title: "Maurer – Vorarbeiter",
          company: "Dom-Bud Siedlce Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Leitung einer dreiköpfigen Kolonne beim Rohbau von etwa 10 Einfamilienhäusern pro Jahr.",
            "Einmessen der Wände nach Plan, Kontrolle von Lot und Waage sowie Abnahmen mit dem Bauleiter.",
            "Mauern von Klinkerfassaden und Systemschornsteinen."
          ]
        },
        {
          title: "Maurer",
          company: "Przedsiębiorstwo Budowlane Mazowsze-Bud Sp. z o.o.",
          period: "04.2010 – 05.2020",
          bullets: [
            "Mauern tragender Wände und Trennwände in Mehrfamilienhäusern bis 5 Geschosse.",
            "Herstellung von Stürzen, Ringankern und Bewehrung gemeinsam mit der Zimmererkolonne.",
            "Arbeit auf Gerüsten unter Einhaltung der Arbeitsschutzvorschriften."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych nr 2 w Siedlcach",
        degree: "Maurer und Putzer (murarz-tynkarz)",
        period: "2007 – 2010"
      }
    },
    faq: [
      {
        q: "Braucht ein Maurer überhaupt einen Lebenslauf?",
        a: "Immer häufiger ja, denn Baufirmen und Personalagenturen nehmen Bewerbungen über Formulare und Portale an. Eine Seite reicht: Materialien, Bauvorhaben, Qualifikationen und Telefonnummer. Ein kurzer Lebenslauf bringt Sie auch schneller ins Gespräch mit dem Bauleiter."
      },
      {
        q: "Wie gebe ich selbstständige Arbeit oder Arbeit ohne Vertrag an?",
        a: "Arbeit in der eigenen Firma tragen Sie normal ein, mit Firmenname und Leistungsumfang. Arbeit ohne Vertrag beschreiben Sie ehrlich, z. B. als „Maurerarbeiten im Einfamilienhausbau“ mit ungefähren Jahren, ohne einen Arbeitgeber zu erfinden. Im Gespräch zählt das Können, und das lässt sich auf der Baustelle prüfen."
      },
      {
        q: "Lohnt es sich, Fotos meiner Arbeiten beizufügen?",
        a: "Im Lebenslauf selbst eher nicht, aber Sie können einen Link zu einem Album angeben oder schreiben, dass Sie Fotos im Gespräch zeigen. Bei Klinker- und Fassadenarbeiten sind Fotos fertiger Objekte oft ein starkes Argument. Achten Sie darauf, dass keine Kundendaten oder Adressen zu sehen sind."
      }
    ]
  },
  "stolarz": {
    slugLang: "tischler",
    name: "Tischler / Schreiner",
    title: "Lebenslauf Tischler: Muster und Tipps",
    metaDescription: "Lebenslauf als Tischler für die Stelle: Muster, Schlüsselbegriffe aus Anzeigen und Tipps zu Möbeln nach Maß, CNC-Maschinen, Kantenanleimmaschine und Montage.",
    intro: "Stellenanzeigen für Tischler teilen sich in Möbelproduktion in der Werkstatt, Maßanfertigung und Montage beim Kunden, daher sollte Ihr Lebenslauf klar zeigen, welche dieser Rollen zu Ihnen passt. Arbeitgeber fragen nach Formatkreissäge, Kantenanleimmaschine und CNC-Bearbeitungszentren, der Arbeit mit beschichteten Platten, MDF und Massivholz sowie dem Lesen technischer Zeichnungen. Bei der Montage von Küchen und Einbaumöbeln zählen Genauigkeit und Kundenkontakt. Erfahrung in der Oberflächenbehandlung, etwa Lackieren oder Ölen, erhöht den Wert eines Bewerbers deutlich.",
    keywords: [
      "Möbelbau nach Maß",
      "Bedienung der Formatkreissäge",
      "Bedienung der Kantenanleimmaschine",
      "Bedienung von CNC-Maschinen",
      "Arbeit mit beschichteten Spanplatten und MDF",
      "Massivholzbearbeitung",
      "Montage von Küchen und Einbaumöbeln",
      "Lesen technischer Zeichnungen",
      "Lackieren und Ölen von Holz",
      "Führerschein Klasse B"
    ],
    tips: [
      "Schreiben Sie, welche Maschinen Sie selbstständig bedienen, und bei CNC, ob Sie nur Teile einlegen oder auch Programme vorbereiten. Für Arbeitgeber ist das ein großer Unterschied.",
      "Nennen Sie die Art der Produkte: Küchen, Einbauschränke, Treppen, Türen, Massivholzmöbel. Treppenbauer und Möbeltischler sind in Anzeigen oft verschiedene Stellen.",
      "Wenn Sie beim Kunden montieren, ergänzen Sie die Anzahl der Aufträge und ob Sie allein arbeiten. Ein Führerschein der Klasse B ist dann fast immer Pflicht.",
      "Geben Sie die Möbelplanungssoftware, die Sie nutzen, mit Namen an. Eine Zuschnittliste erstellen zu können, ist in kleinen Betrieben ein Plus."
    ],
    sample: {
      name: "Jakub Zając",
      headline: "Möbeltischler, Maßanfertigung und Montage",
      contact: ["+48 600 000 146", "jakub.zajac@example.com", "Nowy Sącz", "linkedin.com/in/jakub-zajac-przyklad"],
      summary: "Tischler mit neun Jahren Erfahrung in Herstellung und Montage von Möbeln nach Maß. Ich bediene Formatkreissäge, Kantenanleimmaschine und CNC-Zentrum und arbeite mit beschichteten Platten, MDF und Eiche. Küchen und Einbaumöbel montiere ich beim Kunden selbstständig.",
      skills: [
        "Formatkreissäge, Kantenanleimmaschine, Mehrspindelbohrmaschine",
        "Bedienung eines CNC-Zentrums und einfache Programmänderungen",
        "Möbel aus beschichteten Platten, lackiertem MDF und Massivholz",
        "Montage von Küchen, Einbauschränken und Einbaumöbeln",
        "Lesen technischer Zeichnungen und Erstellen von Zuschnittlisten",
        "Ölen und Lackieren von Holz",
        "Führerschein Klasse B"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "Tischler – Monteur",
          company: "Meble Sądeckie Drewmar Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Herstellung von Küchen und Schränken nach Maß gemäß Entwürfen, rund 60 Aufträge pro Jahr.",
            "Selbstständige Montage beim Kunden, einschließlich Anpassung an unebene Wände und Anschlüsse.",
            "Bedienung des CNC-Zentrums beim Bohren und Fräsen von MDF-Fronten."
          ]
        },
        {
          title: "Tischler",
          company: "Zakład Stolarski Brzoza s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Anfertigung von Tischen, Treppen und Türen aus Massivholz.",
            "Schleifen, Beizen und Ölen fertiger Produkte.",
            "Plattenzuschnitt an der Formatkreissäge und Bekanten."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Drzewnych w Nowym Sączu",
        degree: "Tischler (stolarz)",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Soll ich Erfahrung aus der eigenen Hobbywerkstatt in den Lebenslauf schreiben?",
        a: "Ja, wenn Sie echte Aufträge oder größere Projekte umgesetzt haben, z. B. Möbel oder Treppen für Bekannte. Beschreiben Sie, was Sie gebaut haben, aus welchem Material und mit welchen Werkzeugen. Ohne Betriebserfahrung können Fotos Ihrer Arbeiten mehr überzeugen als ein Zeugnis."
      },
      {
        q: "Verlangen Arbeitgeber Berechtigungen für Holzbearbeitungsmaschinen?",
        a: "Für typische Holzbearbeitungsmaschinen gibt es keine gesonderten staatlichen Berechtigungen wie für Gabelstapler, aber der Arbeitgeber muss Sie am Arbeitsplatz einweisen. Im Lebenslauf genügt es, die Maschinen zu nennen, die Sie selbstständig bedienen. UDT-Berechtigungen sollten Sie separat angeben, wenn Sie z. B. im Plattenlager einen Stapler fahren."
      }
    ]
  },
  "dekarz": {
    slugLang: "dachdecker",
    name: "Dachdecker",
    title: "Lebenslauf Dachdecker: Muster und Tipps",
    metaDescription: "Lebenslauf als Dachdecker passend zur Stelle: Muster, Begriffe aus Anzeigen und Tipps zu Dacheindeckungen, Klempnerarbeiten, Bitumen, Folien und Höhenarbeit.",
    intro: "In Anzeigen für Dachdecker nennen Arbeitgeber die Arten der Eindeckung: Ton- und Betondachsteine, Blechdachpfannen, Stehfalz, Schweißbahnen sowie EPDM- oder PVC-Bahnen auf Flachdächern. Wichtig sind auch Klempnerarbeiten, Dachrinnen und der Einbau von Dachfenstern. Gearbeitet wird in der Höhe, daher erwarten Firmen eine gültige arbeitsmedizinische Untersuchung und Kenntnisse der Absturzsicherung. Oft gern gesehen sind UDT-Berechtigungen für Hubarbeitsbühnen und ein Führerschein der Klasse B.",
    keywords: [
      "Eindeckung mit Ton- und Betondachsteinen",
      "Montage von Blechdachpfannen und Stehfalz",
      "Bitumen-Schweißbahnen",
      "EPDM- / PVC-Bahnen auf Flachdächern",
      "Klempnerarbeiten am Dach",
      "Montage von Dachrinnen und Dachfenstern",
      "Herstellung von Dachstühlen",
      "Höhentauglichkeitsuntersuchung",
      "UDT-Berechtigung für Hubarbeitsbühnen",
      "Führerschein Klasse B"
    ],
    tips: [
      "Nennen Sie die Eindeckungen, die Sie selbstständig verlegen. Ein Dachdecker für Flachdach und Bitumen ist in Anzeigen oft eine andere Person als ein Spezialist für Tondachziegel.",
      "Geben Sie an, ob Sie Blechanschlüsse an der Abkantbank anfertigen und Dachfenster einbauen. Für diese Fähigkeiten zahlen Firmen mehr.",
      "Tragen Sie die Höhentauglichkeit mit Gültigkeitsdatum, Arbeitsschutzschulung und UDT-Berechtigungen für Bühnen ein, falls vorhanden. Damit beginnt der Arbeitgeber die Prüfung eines Bewerbers.",
      "Ergänzen Sie den Umfang: Anzahl der Dächer pro Saison oder Quadratmeter auf Industriebauten. Herstellerschulungen sind ebenfalls erwähnenswert."
    ],
    sample: {
      name: "Mariusz Krawiec",
      headline: "Dachdecker und Klempner, Steil- und Flachdach",
      contact: ["+48 600 000 147", "mariusz.krawiec@example.com", "Leszno", "linkedin.com/in/mariusz-krawiec-przyklad"],
      summary: "Dachdecker und Klempner mit elf Jahren Erfahrung auf Einfamilienhäusern und Industriebauten. Ich verlege Dachziegel, Blechdachpfannen, Bitumenbahnen und EPDM-Folien, fertige Blechanschlüsse und baue Dachfenster ein. Ich habe eine gültige Höhentauglichkeitsuntersuchung und UDT-Berechtigungen für Hubarbeitsbühnen.",
      skills: [
        "Ton- und Betondachsteine",
        "Blechdachpfannen und Stehfalzdeckung",
        "Bitumen-Schweißbahnen und EPDM-Folien",
        "Blechanschlüsse an der Abkantbank",
        "Einbau von Dachfenstern und Rinnensystemen",
        "Herstellung und Reparatur von Dachstühlen",
        "Höhentauglichkeit, UDT für Hubarbeitsbühnen"
      ],
      languages: ["Deutsch A2"],
      jobs: [
        {
          title: "Dachdecker und Klempner",
          company: "Dach-Mistrz Leszno Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Eindeckung von rund 25 Einfamilienhausdächern pro Saison mit Dachziegeln und Blechdachpfannen.",
            "Anschlüsse an Schornsteinen, Kehlen und Attiken sowie Einbau von Dachfenstern.",
            "Sanierung von Flachdächern auf Lagerhallen mit EPDM-Folie, insgesamt über 6.000 m²."
          ]
        },
        {
          title: "Dachdeckerhelfer, später Dachdecker",
          company: "Zakład Dekarski Wielkopolanin s.c.",
          period: "03.2013 – 05.2020",
          bullets: [
            "Eindeckung von Dächern mit Schweißbahnen auf Mehrfamilienhäusern.",
            "Montage von Dachrinnen und Fallrohren sowie kleinere Reparaturen am Dachstuhl.",
            "Arbeit in der Höhe mit Auffanggurten und Sicherungsseilen."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Lesznie",
        degree: "Dachdecker (dekarz)",
        period: "2010 – 2013"
      }
    },
    faq: [
      {
        q: "Gehört die Höhentauglichkeitsuntersuchung in den Lebenslauf?",
        a: "Es lohnt sich, denn das ist eine der ersten Fragen bei der Einstellung eines Dachdeckers. Schreiben Sie es kurz, z. B. „gültige Untersuchung für Arbeiten in der Höhe bis 2027“. Ist sie abgelaufen, schreiben Sie, dass Sie sie vor Arbeitsbeginn erneuern können."
      },
      {
        q: "Wie kann sich ein Dachdecker im Lebenslauf abheben?",
        a: "Am besten durch Spezialisierung und konkrete Angaben: Stehfalz, Schiefer, Gründächer oder große Flachdächer auf Hallen. Herstellerschulungen und die Fähigkeit, Material selbst zu berechnen, helfen ebenfalls. Ein allgemeines „alle Dachdeckerarbeiten“ sagt einem Recruiter wenig."
      }
    ]
  },
  "malarz-budowlany": {
    slugLang: "maler-und-lackierer",
    name: "Maler / Malerin",
    title: "Lebenslauf Maler: Muster und Tipps",
    metaDescription: "Lebenslauf als Maler passend zur Anzeige: Muster, Schlüsselbegriffe aus Angeboten und Tipps zu Spachtelarbeiten, Spritzlackieren, Gipskarton und Ausbau.",
    intro: "Stellenanzeigen für Maler im Bau betreffen selten nur das Streichen: Arbeitgeber suchen Leute, die den Untergrund vorbereiten, Flächen spachteln, Gipskartonfugen verspachteln und Wände fertig für die Nutzung machen. Immer häufiger wird das Spritzen mit einem Airless-Gerät genannt, besonders auf großen Baustellen und in Neubauwohnungen. An Fassaden und in Hallen zählt die Arbeit auf Gerüsten oder Hubbühnen. Ausbaufirmen schätzen auch Tapezieren und dekorative Techniken.",
    keywords: [
      "Untergrundvorbereitung",
      "Spachteln mit Gipsspachtelmasse",
      "Verspachteln von Gipskartonplatten",
      "Spritzlackieren mit Airless-Gerät",
      "Streichen von Wänden und Decken",
      "Fassadenanstrich",
      "Tapezieren",
      "Dekorputze und Gestaltungstechniken",
      "Arbeit auf Gerüsten",
      "Genauigkeit und Sauberkeit"
    ],
    tips: [
      "Beschreiben Sie den gesamten Umfang, den Sie ausführen: vom Grundieren und Spachteln bis zum fertigen Anstrich. Arbeitgeber suchen Leute, die nicht für jede Ausbesserung einen eigenen Putzer brauchen.",
      "Wenn Sie mit einem Airless-Gerät spritzen, schreiben Sie das deutlich. Diese Fähigkeit fragen Firmen auf großen Baustellen immer häufiger ab.",
      "Nennen Sie Objektarten und Umfang, z. B. „Neubauwohnungen, ca. 2.500 m² Wandfläche pro Monat im Team“ oder „Büros und Hotels“.",
      "Führen Sie dekorative Techniken, Betonoptik oder Vinyltapeten separat auf. In Anzeigen von Ausbaufirmen für Privatkunden sind sie ein großes Plus."
    ],
    sample: {
      name: "Ewelina Duda",
      headline: "Malerin, Spachtelarbeiten und Spritzlackierung",
      contact: ["+48 600 000 148", "ewelina.duda@example.com", "Płock", "linkedin.com/in/ewelina-duda-przyklad"],
      summary: "Malerin mit acht Jahren Erfahrung im Ausbau von Wohnungen, Büros und Gewerbeflächen. Ich bereite Untergründe vor, spachtle Flächen, verspachtle Gipskarton und streiche von Hand sowie mit dem Airless-Gerät. Außerdem tapeziere ich und trage Dekorputze auf.",
      skills: [
        "Grundieren und Untergrundvorbereitung",
        "Flächenspachtelung, von Hand und maschinell",
        "Verspachteln von Gipskartonfugen",
        "Airless-Spritzverfahren",
        "Tapezieren (Vlies, Vinyl)",
        "Dekorputze und Betonoptik",
        "Arbeit auf Gerüsten und Podesten"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "Malerin",
          company: "Wykończenia Płock Kolor-Dom Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Schlüsselfertiger Ausbau von Neubauwohnungen, im Team rund 2.000 m² gestrichene Fläche pro Monat.",
            "Spritzlackierung von Decken und Wänden in Bürogebäuden mit dem Airless-Gerät.",
            "Dekorputze und Tapezierarbeiten im Auftrag von Privatkunden."
          ]
        },
        {
          title: "Malerhelferin, später Malerin",
          company: "Usługi Remontowe Mazur-Rem s.c.",
          period: "05.2016 – 05.2020",
          bullets: [
            "Schleifen und Grundieren von Wänden sowie Abdecken von Böden und Türen vor dem Streichen.",
            "Spachteln von Flächen und Verspachteln von Gipskarton in renovierten Wohnungen.",
            "Streichen von Treppenhäusern in Gebäuden von Wohnungseigentümergemeinschaften."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Budowlanych w Płocku",
        degree: "Ausbaumonteurin (monter zabudowy i robót wykończeniowych w budownictwie)",
        period: "2013 – 2016"
      }
    },
    faq: [
      {
        q: "Kann sich eine Frau erfolgreich als Malerin im Bau bewerben?",
        a: "Ja, im Ausbau arbeiten immer mehr Frauen, und Arbeitgeber bewerten vor allem Qualität und Arbeitstempo. Beschreiben Sie im Lebenslauf konkrete Aufträge und Techniken wie jede andere Bewerberin. Sie können auch einen Link zu Fotos Ihrer Arbeiten ergänzen."
      },
      {
        q: "Soll ich ein Farbspritzgerät angeben, wenn ich es selten genutzt habe?",
        a: "Ja, aber geben Sie das Niveau ehrlich an, z. B. „Spritzverfahren – Grundkenntnisse bei Decken“. Der Arbeitgeber fragt eventuell nach Gerätetyp und Düsen. Besser zeigen, dass Sie die Grundlagen kennen und dazulernen wollen, als zu übertreiben."
      },
      {
        q: "Wie beschreibe ich kurze Renovierungsaufträge?",
        a: "Fassen Sie sie in einem Eintrag zusammen, z. B. „Selbstständige Malerarbeiten, 2018–2020“, und nennen Sie typische Aufträge und deren Anzahl. So bleibt der Lebenslauf übersichtlich und die Erfahrung geht nicht in einer langen Liste kleiner Jobs unter."
      }
    ]
  },
  "glazurnik": {
    slugLang: "fliesenleger",
    name: "Fliesenleger / Fliesenlegerin",
    title: "Lebenslauf Fliesenleger: Muster und Tipps",
    metaDescription: "Lebenslauf als Fliesenleger passend zur Anzeige: Muster, Begriffe aus Stellenangeboten und Tipps zu Großformatfliesen, Abdichtung, Gehrungsschnitt und Bädern.",
    intro: "Fliesenleger gehören zu den gefragtesten Ausbauhandwerkern, und Anzeigen verlangen immer öfter Erfahrung mit Großformatfliesen, etwa 120 × 60 cm und größer. Arbeitgeber fragen nach Badabdichtung, dem Einbau von Duschrinnen, Gehrungsschnitten auf 45 Grad und dem Verfugen, auch mit Epoxidfuge. Ein ebener, sorgfältig vorbereiteter Untergrund und Genauigkeit zählen, denn Nacharbeiten an Fliesen sind teuer. Ein guter Lebenslauf zeigt den Leistungsumfang und die Beläge, die Sie selbstständig verlegen.",
    keywords: [
      "Verlegen von Keramik- und Feinsteinzeugfliesen",
      "Großformatfliesen",
      "Abdichtung von Bädern",
      "Einbau von Duschrinnen",
      "Gehrungsschnitt auf 45 Grad",
      "Verfugen, auch mit Epoxidfuge",
      "Fliesennivelliersysteme",
      "Vorbereitung und Ausgleich des Untergrunds",
      "Verlegen von Mosaik und Naturstein",
      "schlüsselfertiger Badausbau"
    ],
    tips: [
      "Nennen Sie die größten Fliesenformate, mit denen Sie arbeiten, z. B. „Feinsteinzeug 120 × 280 cm“. Erfahrung mit Großformat ist in Anzeigen oft eine eigene Anforderung und besser bezahlt.",
      "Beschreiben Sie die Abdichtung: Flüssigabdichtung, Dichtbänder, Manschetten. Der Arbeitgeber will sicher sein, dass das Bad nach einem Jahr nicht undicht ist.",
      "Führen Sie Zusatzarbeiten im Bad auf: Verkleidungen aus Gipskarton, Montage von Vorwandelementen, Sanitärmontage. Das erhöht Ihre Chancen bei Ausbaufirmen.",
      "Ergänzen Sie die Zahl der Aufträge pro Jahr und einen Link zu Fotos Ihrer Arbeiten, falls vorhanden. In diesem Handwerk zählt ein Portfolio oft mehr als die Beschreibung."
    ],
    sample: {
      name: "Rafał Sadowski",
      headline: "Fliesenleger, Großformat und schlüsselfertige Bäder",
      contact: ["+48 600 000 149", "rafal.sadowski@example.com", "Elbląg", "linkedin.com/in/rafal-sadowski-przyklad"],
      summary: "Fliesenleger mit zehn Jahren Erfahrung im Ausbau von Bädern, Küchen und Gewerbeflächen. Ich verlege großformatiges Feinsteinzeug, Mosaik und Naturstein und führe Abdichtungen sowie Duschrinnen aus. Ich arbeite genau und selbstständig, von der Untergrundvorbereitung bis zum Verfugen.",
      skills: [
        "Großformatiges Feinsteinzeug bis 120 × 280 cm",
        "Abdichtung: Flüssigabdichtung, Dichtbänder, Manschetten",
        "Duschrinnen und bodengleiche Duschen",
        "Gehrungsschnitt auf 45 Grad und Kantenschliff",
        "Zement- und Epoxidfugen",
        "Mosaik und Naturstein",
        "Montage von Vorwandelementen und Sanitärobjekten"
      ],
      languages: ["Englisch A2", "Deutsch A2"],
      jobs: [
        {
          title: "Fliesenleger",
          company: "Łazienki Elbląg Ceramik-Pro Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Schlüsselfertiger Ausbau von rund 30 Bädern pro Jahr, auch mit Großformatfliesen.",
            "Abdichtungen und Duschen mit Duschrinne, ohne Reklamationen wegen Undichtigkeit.",
            "Verlegen von Feinsteinzeug auf Terrassen und Außentreppen auf Drainagesystemen."
          ]
        },
        {
          title: "Fliesenleger",
          company: "Firma Budowlana Żuławy-Bud Sp. z o.o.",
          period: "04.2014 – 05.2020",
          bullets: [
            "Fliesenarbeiten in Bädern und Küchen von Neubauwohnungen.",
            "Untergrundvorbereitung: Ausgleichsmasse, Grundierung, Begradigung von Wänden.",
            "Wand- und Bodenbeläge in Gewerbeeinheiten."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Zawodowych w Elblągu",
        degree: "Ausbaumonteur (monter zabudowy i robót wykończeniowych w budownictwie)",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Glazurnik oder płytkarz – welche Berufsbezeichnung nutze ich im polnischen Lebenslauf?",
        a: "Beide Begriffe bedeuten in der Praxis dasselbe, und Anzeigen verwenden sie gleichbedeutend. Nutzen Sie am besten den Begriff aus der Anzeige und ergänzen Sie den anderen im Kurzprofil. So wird Ihr Lebenslauf bei beiden Suchbegriffen gefunden."
      },
      {
        q: "Soll ich angeben, wie viele Quadratmeter ich pro Tag verlege?",
        a: "Das geht, aber vorsichtig und mit Kontext, denn die Leistung hängt von Fliesenformat und Untergrund ab. Besser schreiben Sie z. B. „rund 30 Bäder pro Jahr“ oder beschreiben einen Beispielauftrag. Arbeitgeber fürchten Nacharbeiten mehr als ein langsameres Tempo."
      }
    ]
  },
  "monter-fotowoltaiki": {
    slugLang: "pv-monteur",
    name: "PV-Monteur / Solarmonteur",
    title: "Lebenslauf PV-Monteur: Muster und Tipps",
    metaDescription: "Lebenslauf als PV-Monteur für die Stelle: Muster, Schlüsselbegriffe aus Anzeigen und Tipps zu Modulmontage, Wechselrichtern, SEP und UDT-Zertifikat.",
    intro: "PV-Monteure arbeiten auf Dächern von Wohn- und Gewerbegebäuden sowie in Freiflächenanlagen, und Stellenanzeigen unterscheiden das klar. Arbeitgeber verlangen meist die SEP-Elektroqualifikation bis 1 kV, oft für Betrieb und Aufsicht, gern gesehen ist außerdem ein vom UDT ausgestelltes Zertifikat als Installateur für erneuerbare Energien. Es zählen Montage von Unterkonstruktion und Modulen, Anschluss des Wechselrichters, elektrische Messungen und die Unterlagen für die Anmeldung beim Netzbetreiber. Immer öfter kommen Batteriespeicher und Ladestationen für E-Autos hinzu.",
    keywords: [
      "Montage von PV-Anlagen",
      "Montage von Unterkonstruktionen auf Dach und Freifläche",
      "Anschluss und Konfiguration von Wechselrichtern",
      "SEP-Qualifikation bis 1 kV",
      "Installateurzertifikat für erneuerbare Energien (UDT)",
      "elektrische Messungen an PV-Anlagen",
      "Montage von Batteriespeichern",
      "Arbeiten in der Höhe",
      "Ausführungsdokumentation",
      "Führerschein Klasse B"
    ],
    tips: [
      "Tragen Sie die SEP-Qualifikation mit Gruppe, Umfang (E, D) und Gültigkeit ein sowie das UDT-Zertifikat für erneuerbare Energien, falls vorhanden. Ohne diese Angaben scheiden viele Bewerbungen sofort aus.",
      "Nennen Sie den Umfang: Zahl der Anlagen, Gesamtleistung in kWp, Dach- und Gebäudetypen. „Über 300 Anlagen mit 3–50 kWp“ zeigt sofort Ihre Erfahrung.",
      "Führen Sie Marken und Typen von Wechselrichtern und Speichern auf, mit denen Sie gearbeitet haben, und ob Sie Konfiguration und Inbetriebnahme übernehmen. Herstellerschulungen lohnen sich ebenfalls.",
      "Wenn Sie früher Elektriker oder Dachdecker waren, beschreiben Sie das. Firmen schätzen Monteure, die Elektrowissen mit sicherem Arbeiten auf dem Dach verbinden."
    ],
    sample: {
      name: "Adrian Szewczyk",
      headline: "PV-Monteur, SEP E und D bis 1 kV",
      contact: ["+48 600 000 150", "adrian.szewczyk@example.com", "Zamość", "linkedin.com/in/adrian-szewczyk-przyklad"],
      summary: "PV-Monteur mit sechs Jahren Erfahrung bei Anlagen für Privat- und Gewerbekunden sowie Freiflächenanlagen. Ich montiere Unterkonstruktionen und Module, schließe Wechselrichter an und nehme sie in Betrieb, führe Messungen durch und erstelle die Ausführungsdokumentation. Ich habe die SEP-Qualifikation E und D bis 1 kV und ein Installateurzertifikat für erneuerbare Energien.",
      skills: [
        "Unterkonstruktionen auf Steildach, Flachdach und Freifläche",
        "Anschluss und Konfiguration von Netz- und Hybridwechselrichtern",
        "Montage von Batteriespeichern",
        "Isolationswiderstands- und Durchgangsmessungen",
        "Ausführungsdokumentation und Abnahmeprotokolle",
        "SEP E und D bis 1 kV, Installateurzertifikat für erneuerbare Energien (UDT)",
        "Höhentauglichkeit, Führerschein Klasse B"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "PV-Monteur – Teamleiter",
          company: "Solar-Wschód Energia Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Leitung eines dreiköpfigen Montageteams, über 250 Anlagen mit 4–50 kWp.",
            "Mitarbeit am Bau von zwei Freiflächenanlagen mit insgesamt 2 MWp.",
            "Montage und Konfiguration von Hybridwechselrichtern und Batteriespeichern bei Privatkunden."
          ]
        },
        {
          title: "Elektromonteur",
          company: "Elektro-Instal Zamość s.c.",
          period: "05.2017 – 05.2020",
          bullets: [
            "Ausführung von Elektroinstallationen in Einfamilienhäusern.",
            "Montage von Verteilern und Schutzeinrichtungen, auch für die ersten PV-Anlagen.",
            "Elektrische Messungen und Erstellung von Prüfprotokollen."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 1 w Zamościu",
        degree: "Elektrotechniker (technik elektryk)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Kann ich ohne SEP-Qualifikation als PV-Monteur arbeiten?",
        a: "Sie können als Montagehelfer bei Unterkonstruktion und Modulen anfangen, für elektrische Anschlüsse verlangen Arbeitgeber aber meist SEP bis 1 kV. Die Prüfung lässt sich nach einem kurzen Kurs ablegen, daher lohnt es sich, sie einzuplanen. Schreiben Sie dann in den Lebenslauf, wann Sie die Prüfung ablegen."
      },
      {
        q: "Ist das UDT-Zertifikat für erneuerbare Energien Pflicht?",
        a: "Für die reine Montagearbeit ist es nicht erforderlich, aber viele Firmen schätzen es, und manche Anzeigen nennen es als Plus. Das Zertifikat gilt für einen bestimmten Zeitraum und muss erneuert werden, geben Sie daher die Gültigkeit an. Es zeigt, dass Sie Anlagen für erneuerbare Energien auch von der formalen Seite kennen."
      },
      {
        q: "Wie beschreibe ich Erfahrung auf Solarparks?",
        a: "Nennen Sie die Gesamtleistung des Parks, Ihren Arbeitsumfang und die Bauzeit, z. B. Montage gerammter Unterkonstruktionen und Verlegen von Kabeltrassen. Solarparks sind eine andere Größenordnung als Hausdächer, daher gehört das in einen eigenen Punkt. Unternehmen im Großanlagenbereich suchen genau diese Erfahrung."
      }
    ]
  }
};

export const BATCH = { pl, en, uk, de };
