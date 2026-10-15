// Nowe zawody: paczka 09 (PL + tłumaczenia EN/UK/DE).
const PL = [
  {
    slug: 'operator-cnc',
    category: 'Produkcja i technika',
    name: 'Operator maszyn CNC',
    title: 'CV operatora CNC: wzór i wskazówki',
    metaDescription: 'CV operatora CNC pod konkretne ogłoszenie: przykład, słowa kluczowe z ofert i wskazówki, jak opisać sterowania, ustawianie maszyn i pomiary detali.',
    intro: 'Zakłady szukające operatorów CNC najpierw sprawdzają, na jakich maszynach i sterowaniach pracowałeś: frezarki czy tokarki, Fanuc, Sinumerik, Heidenhain. Duża różnica jest między osobą, która tylko zakłada detale i wciska start, a kimś, kto samodzielnie ustawia maszynę, wprowadza korekty narzędzi i poprawia program. W ogłoszeniach prawie zawsze pojawia się czytanie rysunku technicznego i pomiary suwmiarką oraz mikrometrem. Pracodawcy zaznaczają też zwykle pracę w systemie zmianowym.',
    keywords: [
      'obsługa maszyn CNC',
      'sterowanie Fanuc',
      'sterowanie Sinumerik',
      'ustawianie maszyny i bazowanie detalu',
      'korekty narzędziowe',
      'czytanie rysunku technicznego',
      'pomiary suwmiarką i mikrometrem',
      'znajomość kodu G',
      'frezowanie CNC',
      'praca w systemie trzyzmianowym'
    ],
    tips: [
      'Nazwij maszyny i sterowania wprost, np. „centrum frezarskie 3-osiowe, sterowanie Heidenhain TNC 640”. Ogólne „obsługa CNC” nic rekruterowi nie mówi o tym, czy szybko wdrożysz się na jego hali.',
      'Rozdziel to, co robisz samodzielnie, od tego, co robi technolog. Jeśli sam ustawiasz punkty zerowe, mierzysz narzędzia i edytujesz program na maszynie, napisz to wyraźnie, bo to podnosi Twoją stawkę.',
      'Podaj materiały i dokładności, z jakimi pracujesz: aluminium, stal nierdzewna, tolerancje ±0,01 mm. Pracodawca z branży lotniczej czy medycznej szuka właśnie takich informacji.',
      'Dopisz przyrządy pomiarowe, które znasz (mikrometr, średnicówka, wysokościomierz, sprawdziany) oraz to, czy wypełniasz karty pomiarowe. To pokazuje, że pilnujesz jakości, a nie tylko wydajności.'
    ],
    sample: {
      name: 'Paweł Wróblewski',
      headline: 'Operator-ustawiacz frezarek CNC',
      contact: ['+48 600 000 181', 'pawel.wroblewski@example.com', 'Mielec', 'linkedin.com/in/pawel-wroblewski-przyklad'],
      summary: 'Od sześciu lat pracuję na centrach frezarskich CNC ze sterowaniem Fanuc i Heidenhain. Samodzielnie ustawiam maszynę pod nową serię, mierzę narzędzia i wprowadzam korekty, a detale sprawdzam według rysunku z tolerancją do ±0,01 mm.',
      skills: [
        'Sterowania Fanuc 0i i Heidenhain TNC 640',
        'Ustawianie maszyny i bazowanie detalu',
        'Pomiar narzędzi i korekty narzędziowe',
        'Edycja programów w kodzie G na maszynie',
        'Czytanie rysunku technicznego i tolerancji',
        'Pomiary mikrometrem, średnicówką i wysokościomierzem',
        'Obróbka aluminium i stali nierdzewnej'
      ],
      languages: ['angielski A2'],
      jobs: [
        {
          title: 'Operator-ustawiacz CNC',
          company: 'Aeromech Precyzja Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Ustawianie 3- i 5-osiowych centrów frezarskich pod serie od 20 do 500 sztuk elementów z aluminium lotniczego.',
            'Skrócenie czasu przezbrojenia jednej z maszyn z około 90 do 60 minut dzięki przygotowaniu narzędzi przed końcem poprzedniej serii.',
            'Kontrola międzyoperacyjna i prowadzenie kart pomiarowych dla klienta z branży lotniczej.'
          ]
        },
        {
          title: 'Operator maszyn CNC',
          company: 'Metal-Tech Mielec Sp. z o.o.',
          period: '03.2018 – 05.2020',
          bullets: [
            'Obsługa frezarek CNC ze sterowaniem Fanuc w systemie trzyzmianowym.',
            'Wymiana zużytych narzędzi i wprowadzanie korekt wymiarowych po pomiarach.',
            'Gratowanie i pomiar detali suwmiarką oraz mikrometrem.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół Technicznych w Mielcu',
        degree: 'Technik mechanik',
        period: '2013 – 2017'
      }
    },
    faq: [
      {
        q: 'Czy jako operator bez programowania mogę pisać w CV, że znam CNC?',
        a: 'Tak, ale opisz uczciwie zakres. Napisz, że obsługujesz maszynę, wymieniasz narzędzia i wprowadzasz korekty, ale nie piszesz programów od zera. Pracodawcy często szukają właśnie takich osób, a rozbieżność wyszłaby na pierwszym dniu przy maszynie.'
      },
      {
        q: 'Czy warto wpisać kurs programowania CNC?',
        a: 'Warto, zwłaszcza jeśli celujesz w stanowisko operatora-ustawiacza. Podaj nazwę kursu, liczbę godzin i sterowanie, którego dotyczył. Jeśli miałeś okazję wykorzystać tę wiedzę w pracy, dopisz to przy danym stanowisku.'
      },
      {
        q: 'Jak opisać pracę na kilku różnych sterowaniach?',
        a: 'Wymień je w umiejętnościach, a przy stanowiskach dopisz, na czym pracowałeś najdłużej. Rekruter szybko zobaczy, że łatwo przestawiasz się między maszynami, a to cenna cecha w zakładach z mieszanym parkiem maszynowym.'
      }
    ]
  },
  {
    slug: 'slusarz',
    category: 'Produkcja i technika',
    name: 'Ślusarz',
    title: 'CV ślusarza: wzór i wskazówki',
    metaDescription: 'CV ślusarza dopasowane do ogłoszenia. Przykład, frazy z ofert pracy i wskazówki, jak opisać obróbkę ręczną, montaż konstrukcji i dodatkowe uprawnienia.',
    intro: 'Pod nazwą „ślusarz” kryją się w ogłoszeniach bardzo różne prace: od montażu konstrukcji stalowych, przez ślusarkę maszynową, po wykonywanie balustrad i bram. Dlatego w CV trzeba jasno pokazać, w której z tych odmian masz doświadczenie. Pracodawcy pytają zwykle o czytanie rysunku, obróbkę ręczną (cięcie, wiercenie, gwintowanie) i obsługę elektronarzędzi. Dodatkowym atutem bywają spawanie MAG oraz uprawnienia UDT na suwnice.',
    keywords: [
      'obróbka ręczna metali',
      'czytanie rysunku technicznego',
      'montaż konstrukcji stalowych',
      'wiercenie i gwintowanie',
      'obsługa elektronarzędzi',
      'spawanie MAG jako atut',
      'uprawnienia UDT na suwnice',
      'pomiary suwmiarką',
      'ślusarstwo maszynowe',
      'przestrzeganie zasad BHP'
    ],
    tips: [
      'Zacznij od tego, co wykonujesz: konstrukcje stalowe, obudowy maszyn, balustrady, przenośniki. Zakład produkujący hale szuka innego ślusarza niż firma serwisująca linie produkcyjne.',
      'Wypisz maszyny i narzędzia, które obsługujesz: piła taśmowa, wiertarka kolumnowa, giętarka, prasa krawędziowa, szlifierka kątowa. To konkret, który odróżnia Cię od innych kandydatów.',
      'Uprawnienia dodatkowe (UDT na suwnice lub wózki, certyfikat spawalniczy, SEP) wpisz w osobnej sekcji z datą ważności. Często decydują o tym, który kandydat dostanie zaproszenie.',
      'Jeśli pracujesz z dokumentacji, napisz, jakiej: rysunki warsztatowe, rysunki złożeniowe, listy materiałowe. Samodzielna praca z rysunku to jedno z najczęstszych wymagań.'
    ],
    sample: {
      name: 'Grzegorz Sikora',
      headline: 'Ślusarz-monter konstrukcji stalowych',
      contact: ['+48 600 000 182', 'grzegorz.sikora@example.com', 'Stalowa Wola', 'linkedin.com/in/grzegorz-sikora-przyklad'],
      summary: 'Od dziesięciu lat wykonuję i montuję konstrukcje stalowe oraz elementy maszyn według rysunków warsztatowych. Spawam metodą MAG, mam uprawnienia UDT na suwnice sterowane z poziomu roboczego i samodzielnie przygotowuję elementy do montażu.',
      skills: [
        'Czytanie rysunków warsztatowych i złożeniowych',
        'Cięcie, wiercenie, gwintowanie i fazowanie',
        'Obsługa piły taśmowej i wiertarki kolumnowej',
        'Spawanie metodą MAG (135)',
        'Montaż konstrukcji stalowych na skręcanych połączeniach',
        'Uprawnienia UDT na suwnice sterowane z poziomu roboczego',
        'Pomiary suwmiarką, kątownikiem i poziomicą'
      ],
      languages: ['angielski A2'],
      jobs: [
        {
          title: 'Ślusarz-monter',
          company: 'Stal-Konstrukt Stalowa Wola Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Wykonywanie podzespołów konstrukcji hal i wiat według rysunków warsztatowych.',
            'Montaż wstępny konstrukcji na hali przed wysyłką do klienta i oznaczanie elementów.',
            'Wdrażanie dwóch nowych pracowników w obsługę piły taśmowej i zasady BHP na stanowisku.'
          ]
        },
        {
          title: 'Ślusarz',
          company: 'Zakład Mechaniczny Sanmet s.c.',
          period: '08.2015 – 05.2020',
          bullets: [
            'Wykonywanie bram, balustrad i elementów ogrodzeń na zamówienie.',
            'Cięcie, wiercenie i gwintowanie elementów oraz przygotowanie ich do spawania.',
            'Montaż gotowych wyrobów u klientów razem z brygadą.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół Ponadpodstawowych nr 2 w Stalowej Woli',
        degree: 'Ślusarz (branżowa szkoła I stopnia)',
        period: '2012 – 2015'
      }
    },
    faq: [
      {
        q: 'Czy ślusarz musi mieć uprawnienia spawalnicze?',
        a: 'Nie zawsze, ale wiele ogłoszeń wymienia spawanie MAG jako wymaganie lub mile widzianą umiejętność. Jeśli spawasz bez certyfikatu, możesz to napisać, określając zakres, np. „spawanie MAG w zakresie prostych połączeń”. Certyfikat warto zdobyć, bo poszerza liczbę ofert.'
      },
      {
        q: 'Jak napisać CV ślusarza po szkole bez doświadczenia?',
        a: 'Opisz praktyki zawodowe: w jakim zakładzie, przy jakich pracach i na jakich maszynach. Dodaj umiejętności ze szkoły, np. obróbkę ręczną i czytanie rysunku, oraz kursy, jeśli je masz. Krótkie, konkretne CV zrobi lepsze wrażenie niż długi opis cech charakteru.'
      }
    ]
  },
  {
    slug: 'tokarz',
    category: 'Produkcja i technika',
    name: 'Tokarz',
    title: 'CV tokarza: wzór i wskazówki',
    metaDescription: 'CV tokarza pod ogłoszenie: wzór, słowa kluczowe z ofert i wskazówki, jak opisać pracę na tokarkach konwencjonalnych i CNC, gwinty oraz tolerancje.',
    intro: 'Ogłoszenia dla tokarzy dzielą się na dwie grupy: praca na tokarkach konwencjonalnych, często przy częściach zamiennych i naprawach, oraz obsługa tokarek CNC w produkcji seryjnej. Wiele zakładów szuka kogoś, kto potrafi jedno i drugie. Pracodawcy pytają o toczenie gwintów, pracę w tolerancjach i samodzielne dobieranie parametrów skrawania. Ważne jest też doświadczenie z pojedynczymi sztukami według rysunku albo z długimi seriami.',
    keywords: [
      'toczenie na tokarce konwencjonalnej',
      'obsługa tokarki CNC',
      'toczenie gwintów',
      'czytanie rysunku technicznego',
      'dobór parametrów skrawania',
      'pomiary mikrometrem',
      'praca w tolerancjach',
      'wykonywanie części zamiennych',
      'ostrzenie noży tokarskich',
      'produkcja jednostkowa i seryjna'
    ],
    tips: [
      'Napisz, na jakich tokarkach pracowałeś i jakie wymiary detali obrabiasz, np. „wałki do 1500 mm długości, średnice do 400 mm”. Zakład od razu oceni, czy poradzisz sobie z jego zleceniami.',
      'Jeśli toczysz gwinty, wymień ich rodzaje: metryczne, calowe, trapezowe. Toczenie gwintu trapezowego na konwencjonalnej tokarce to umiejętność, której szuka wielu pracodawców.',
      'Podaj, w jakich tolerancjach pracujesz i czym mierzysz. Klasy pasowań czy wymagana chropowatość pokazują, że rozumiesz rysunek, a nie tylko obsługujesz maszynę.',
      'Gdy znasz zarówno tokarki konwencjonalne, jak i CNC, rozdziel to w umiejętnościach. Dla wielu zakładów to połączenie jest najcenniejsze, bo taka osoba zrobi i serię, i pilną naprawę.'
    ],
    sample: {
      name: 'Marek Pietrzak',
      headline: 'Tokarz konwencjonalny i CNC',
      contact: ['+48 600 000 183', 'marek.pietrzak@example.com', 'Ostrów Wielkopolski', 'linkedin.com/in/marek-pietrzak-przyklad'],
      summary: 'Od dwunastu lat pracuję jako tokarz, najpierw na tokarkach konwencjonalnych, a od pięciu lat także na tokarkach CNC ze sterowaniem Fanuc. Wykonuję części zamienne z rysunku i z wzoru, toczę gwinty metryczne i trapezowe, pracuję w tolerancjach do 0,02 mm.',
      skills: [
        'Toczenie na tokarkach konwencjonalnych (TUR, TUM)',
        'Obsługa i ustawianie tokarki CNC ze sterowaniem Fanuc',
        'Toczenie gwintów metrycznych, calowych i trapezowych',
        'Wykonywanie części na podstawie wzoru',
        'Dobór narzędzi i parametrów skrawania',
        'Pomiary mikrometrem, średnicówką i sprawdzianami',
        'Ostrzenie noży tokarskich'
      ],
      languages: ['niemiecki A2'],
      jobs: [
        {
          title: 'Tokarz CNC',
          company: 'Wagmech Ostrów Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Toczenie wałków i tulei do podzespołów wagonów w seriach od 50 do 300 sztuk.',
            'Ustawianie tokarki pod nową serię i wykonanie pierwszej sztuki do odbioru przez kontrolę jakości.',
            'Wykonywanie pilnych części zamiennych na tokarce konwencjonalnej dla działu utrzymania ruchu.'
          ]
        },
        {
          title: 'Tokarz',
          company: 'Usługi Ślusarsko-Tokarskie Kalisz-Met s.c.',
          period: '04.2012 – 05.2020',
          bullets: [
            'Wykonywanie części do maszyn rolniczych i przemysłowych na podstawie wzoru dostarczonego przez klienta.',
            'Toczenie gwintów trapezowych do śrub pociągowych i pras.',
            'Pomiar zużytych części i przygotowanie szkiców do wykonania nowych.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół Technicznych w Ostrowie Wielkopolskim',
        degree: 'Operator obrabiarek skrawających',
        period: '2009 – 2012'
      }
    },
    faq: [
      {
        q: 'Czy tokarz konwencjonalny ma szansę na pracę przy CNC?',
        a: 'Tak, wielu pracodawców chętnie przyucza tokarzy konwencjonalnych, bo rozumieją oni skrawanie i rysunek. W CV podkreśl dokładność, z jaką pracujesz, i gotowość do nauki sterowania. Jeśli zrobiłeś kurs CNC, wpisz go nawet bez doświadczenia na produkcji.'
      },
      {
        q: 'Czy wpisywać w CV, że wykonuję części z wzoru?',
        a: 'Zdecydowanie tak. Wykonanie części bez rysunku, na podstawie zużytego elementu, wymaga pomiaru, oceny zużycia i doboru materiału. Takie umiejętności są cenione w działach utrzymania ruchu i w małych warsztatach usługowych.'
      }
    ]
  },
  {
    slug: 'technik-utrzymania-ruchu',
    category: 'Produkcja i technika',
    name: 'Technik utrzymania ruchu',
    title: 'CV technika utrzymania ruchu: wzór i wskazówki',
    metaDescription: 'CV technika utrzymania ruchu: przykład, słowa kluczowe z ofert i wskazówki, jak opisać usuwanie awarii, przeglądy, uprawnienia SEP i pracę z PLC.',
    intro: 'Technik utrzymania ruchu odpowiada za to, żeby linie produkcyjne stały jak najkrócej, dlatego w ogłoszeniach dominuje diagnozowanie i usuwanie awarii mechanicznych, elektrycznych, pneumatycznych i hydraulicznych. Bardzo często wymagane są uprawnienia SEP grupy 1 do 1 kV w zakresie eksploatacji. Coraz więcej firm oczekuje też podstaw PLC, przynajmniej odczytu stanów i diagnostyki w TIA Portal. Do tego dochodzą przeglądy prewencyjne, raportowanie w systemie CMMS i praca zmianowa.',
    keywords: [
      'usuwanie awarii maszyn',
      'diagnostyka usterek mechanicznych i elektrycznych',
      'uprawnienia SEP G1 do 1 kV',
      'pneumatyka i hydraulika',
      'przeglądy prewencyjne',
      'podstawy PLC Siemens',
      'czytanie schematów elektrycznych',
      'TPM',
      'system CMMS',
      'praca w systemie zmianowym'
    ],
    tips: [
      'Opisz, jakie maszyny i linie utrzymywałeś: wtryskarki, prasy, linie pakujące, roboty spawalnicze. Doświadczenie z podobnym parkiem maszynowym skraca wdrożenie i rekruterzy o to pytają.',
      'Uprawnienia SEP wpisz dokładnie: grupa, zakres (eksploatacja, dozór), napięcie i data ważności. „SEP G1 E do 1 kV, ważne do 2028 r.” to dokładnie ta linijka, której szuka pracodawca.',
      'Pokaż wyniki, nie tylko obowiązki. Skrócenie średniego czasu usuwania awarii, spadek liczby przestojów po wdrożeniu przeglądów czy wzrost OEE to argumenty, które zostają w pamięci.',
      'Rozróżnij poziom znajomości PLC: odczyt i diagnostyka online, drobne modyfikacje czy samodzielne programowanie. Uczciwy opis chroni przed niezręczną sytuacją na rozmowie technicznej.'
    ],
    sample: {
      name: 'Łukasz Wawrzyniak',
      headline: 'Technik utrzymania ruchu – mechanik i elektryk',
      contact: ['+48 600 000 184', 'lukasz.wawrzyniak@example.com', 'Legnica', 'linkedin.com/in/lukasz-wawrzyniak-przyklad'],
      summary: 'Od siedmiu lat utrzymuję w ruchu linie produkcyjne w zakładach motoryzacyjnych. Usuwam awarie mechaniczne, elektryczne i pneumatyczne, prowadzę przeglądy prewencyjne i diagnozuję usterki w sterownikach Siemens S7-1500 przez TIA Portal. Mam uprawnienia SEP G1 E do 1 kV.',
      skills: [
        'Diagnostyka i usuwanie awarii linii produkcyjnych',
        'Uprawnienia SEP G1 E do 1 kV',
        'Pneumatyka i elektropneumatyka',
        'Hydraulika siłowa',
        'Diagnostyka PLC Siemens S7 w TIA Portal',
        'Czytanie schematów elektrycznych i pneumatycznych',
        'Raportowanie awarii w systemie CMMS'
      ],
      languages: ['angielski B1'],
      jobs: [
        {
          title: 'Technik utrzymania ruchu',
          company: 'Autoparts Legnica Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Usuwanie awarii na czterech zrobotyzowanych liniach zgrzewania i montażu w systemie trzyzmianowym.',
            'Opracowanie listy kontrolnej przeglądów tygodniowych, po której liczba nieplanowanych przestojów na linii spadła o około 25% w ciągu roku.',
            'Wymiana i regulacja siłowników, zaworów oraz czujników indukcyjnych.'
          ]
        },
        {
          title: 'Elektromechanik',
          company: 'Plastform Polkowice Sp. z o.o.',
          period: '09.2017 – 05.2020',
          bullets: [
            'Obsługa serwisowa wtryskarek i manipulatorów do odbioru wyprasek.',
            'Wymiana grzałek, termopar i styczników w szafach sterowniczych.',
            'Udział w przeglądach rocznych maszyn prowadzonych z serwisem producenta.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół Elektronicznych i Samochodowych w Legnicy',
        degree: 'Technik mechatronik',
        period: '2013 – 2017'
      }
    },
    faq: [
      {
        q: 'Co zrobić, gdy uprawnienia SEP mi wygasły?',
        a: 'Wpisz je z adnotacją, do kiedy były ważne, np. „SEP G1 E do 1 kV (ważne do 03.2024)”, i dodaj, że możesz je odnowić. Egzamin można zdać ponownie stosunkowo szybko, a pracodawca widzi, że masz już za sobą przygotowanie. Nie wpisuj wygasłych uprawnień jako aktualnych.'
      },
      {
        q: 'Mechanik czy elektryk – jak się przedstawić w CV?',
        a: 'Napisz, co jest Twoją mocną stroną, ale pokaż też drugą dziedzinę, jeśli ją znasz. Wiele firm szuka techników „uniwersalnych”, a w nagłówku dobrze działa np. „Technik UR – mechanik z uprawnieniami SEP”. Ogłoszenie zwykle wprost mówi, którego profilu brakuje w zespole.'
      },
      {
        q: 'Czy praca zmianowa i weekendowa powinna być w CV?',
        a: 'Jeśli ogłoszenie o tym wspomina, warto jednym zdaniem potwierdzić gotowość do pracy w systemie trzyzmianowym lub w trybie dyżurów. Dla działu utrzymania ruchu to ważna informacja, bo grafik musi zapewniać obsadę na każdej zmianie.'
      }
    ]
  },
  {
    slug: 'kontroler-jakosci',
    category: 'Produkcja i technika',
    name: 'Kontroler jakości',
    title: 'CV kontrolera jakości: wzór i wskazówki',
    metaDescription: 'CV kontrolera jakości pod ogłoszenie: przykład, słowa kluczowe z ofert i wskazówki, jak opisać pomiary, raporty niezgodności i znajomość norm ISO.',
    intro: 'Kontroler jakości sprawdza wyroby na wejściu, w trakcie produkcji i przed wysyłką, więc w ogłoszeniach liczą się przede wszystkim pomiary i rzetelna dokumentacja. Pracodawcy pytają o przyrządy pomiarowe, czytanie rysunku z tolerancjami, kontrolę wizualną według wzorców i prowadzenie raportów niezgodności. W branży motoryzacyjnej dochodzi znajomość wymagań IATF 16949 i narzędzi jakości, takich jak 8D czy 5 Why. Atutem jest obsługa maszyny współrzędnościowej (CMM).',
    keywords: [
      'kontrola jakości wyrobów',
      'pomiary przyrządami pomiarowymi',
      'czytanie rysunku technicznego',
      'kontrola wizualna',
      'raporty niezgodności',
      'norma ISO 9001',
      'IATF 16949',
      'raport 8D',
      'maszyna współrzędnościowa CMM',
      'kontrola pierwszej sztuki'
    ],
    tips: [
      'Wypisz konkretne przyrządy, z których korzystasz: suwmiarka, mikrometr, wysokościomierz, sprawdziany, CMM, profilometr. Rekruter porównuje tę listę z wyposażeniem swojego działu jakości.',
      'Napisz, na jakim etapie kontrolujesz: kontrola dostaw, międzyoperacyjna, końcowa, audyt wyrobu. Każdy z tych etapów wymaga trochę innych umiejętności.',
      'Pokaż, że nie tylko wykrywasz wady, ale pomagasz je usuwać. Udział w raportach 8D, analizie przyczyn czy reklamacjach klienta to najmocniejsze punkty CV kontrolera.',
      'Podaj branżę i normy, z którymi pracowałeś: ISO 9001, IATF 16949, wymagania klientów. W motoryzacji i lotnictwie to często warunek zaproszenia na rozmowę.'
    ],
    sample: {
      name: 'Katarzyna Mazurek',
      headline: 'Kontroler jakości w branży motoryzacyjnej',
      contact: ['+48 600 000 185', 'katarzyna.mazurek@example.com', 'Tychy', 'linkedin.com/in/katarzyna-mazurek-przyklad'],
      summary: 'Od pięciu lat kontroluję elementy metalowe i z tworzyw dla klientów z branży motoryzacyjnej. Wykonuję pomiary przyrządami ręcznymi i na maszynie współrzędnościowej, prowadzę raporty niezgodności i biorę udział w analizach 8D. Pracuję zgodnie z wymaganiami IATF 16949.',
      skills: [
        'Pomiary suwmiarką, mikrometrem i wysokościomierzem',
        'Obsługa maszyny współrzędnościowej (CMM)',
        'Czytanie rysunku i tolerancji geometrycznych',
        'Kontrola wizualna według wzorców granicznych',
        'Raporty niezgodności i udział w 8D',
        'Znajomość wymagań IATF 16949 i ISO 9001',
        'Kontrola pierwszej sztuki (FAI)'
      ],
      languages: ['angielski B1'],
      jobs: [
        {
          title: 'Kontroler jakości',
          company: 'Silesia Components Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Kontrola pierwszej i ostatniej sztuki dla 12 linii tłoczenia i spawania elementów nadwozia.',
            'Pomiary na maszynie współrzędnościowej i przygotowanie raportów dla klienta.',
            'Udział w siedmiu analizach 8D, w tym przygotowanie instrukcji kontroli wizualnej po reklamacji klienta.'
          ]
        },
        {
          title: 'Kontroler jakości – kontrola dostaw',
          company: 'Plastimex Bieruń Sp. z o.o.',
          period: '04.2019 – 05.2020',
          bullets: [
            'Kontrola wejściowa wyprasek i komponentów od dostawców według planu kontroli.',
            'Blokowanie partii niezgodnych i zgłaszanie reklamacji do dostawców.',
            'Prowadzenie rejestru wyników kontroli w arkuszu Excel.'
          ]
        }
      ],
      education: {
        school: 'Politechnika Śląska, Wydział Mechaniczny Technologiczny',
        degree: 'Inżynier, kierunek: zarządzanie i inżynieria produkcji',
        period: '2015 – 2019'
      }
    },
    faq: [
      {
        q: 'Czy bez doświadczenia na CMM mam szansę na pracę w kontroli jakości?',
        a: 'Tak, wiele stanowisk kontrolera opiera się na przyrządach ręcznych i kontroli wizualnej. W CV pokaż dokładność, znajomość rysunku i doświadczenie z dokumentacją. Jeśli przeszłaś szkolenie z obsługi CMM, wpisz je, nawet jeśli nie pracowałaś jeszcze samodzielnie na maszynie.'
      },
      {
        q: 'Jak opisać szkolenia z narzędzi jakości?',
        a: 'Zrób osobną sekcję „Szkolenia” i podaj nazwę oraz rok, np. „Metodologia 8D i 5 Why, 2023” albo „Wymagania IATF 16949, 2022”. Przy stanowisku dopisz, jak z tej wiedzy korzystasz, bo samo szkolenie bez praktyki waży mniej.'
      }
    ]
  },
  {
    slug: 'automatyk',
    category: 'Produkcja i technika',
    name: 'Automatyk',
    title: 'CV automatyka: wzór i wskazówki',
    metaDescription: 'CV automatyka dopasowane do ogłoszenia. Wzór, słowa kluczowe z ofert i wskazówki, jak opisać programowanie PLC, HMI, uruchomienia i uprawnienia SEP.',
    intro: 'Automatycy pracują zarówno w działach utrzymania ruchu, jak i w firmach integratorskich, które budują i uruchamiają nowe linie. W ogłoszeniach najczęściej powtarzają się sterowniki Siemens S7 z TIA Portal, panele HMI, falowniki, czytanie i tworzenie schematów elektrycznych oraz uprawnienia SEP. Integratorzy pytają dodatkowo o uruchomienia u klienta, często za granicą, i o pracę z robotami przemysłowymi. Warto pokazać, przy jakich projektach brałeś udział i co dokładnie w nich robiłeś.',
    keywords: [
      'programowanie sterowników PLC',
      'Siemens TIA Portal',
      'wizualizacja HMI',
      'systemy SCADA',
      'konfiguracja falowników',
      'uprawnienia SEP E i D do 1 kV',
      'czytanie i tworzenie schematów elektrycznych',
      'uruchomienia maszyn u klienta',
      'robotyka przemysłowa',
      'sieci przemysłowe Profinet'
    ],
    tips: [
      'Podaj platformy, na których programujesz, i poziom: Siemens S7-1200/1500, Allen-Bradley, Beckhoff. Przy każdej możesz dopisać języki (LAD, FBD, SCL), bo rekruterzy techniczni filtrują po nich kandydatów.',
      'Opisuj projekty: rodzaj maszyny lub linii, liczbę wejść/wyjść, Twoją rolę i kraj uruchomienia. „Uruchomienie linii paletyzacji z dwoma robotami w Czechach” mówi więcej niż „uruchomienia maszyn”.',
      'Uprawnienia SEP wpisz z grupą i zakresem (eksploatacja i dozór). W firmach integratorskich ważna jest też gotowość do wyjazdów i prawo jazdy kat. B.',
      'Jeśli znasz EPLAN, bezpieczeństwo maszyn (np. normę PN-EN ISO 13849) lub roboty konkretnego producenta, dodaj to osobno. To rzadsze umiejętności, które wyraźnie podnoszą wartość CV.'
    ],
    sample: {
      name: 'Michał Kaczmarczyk',
      headline: 'Automatyk – programista PLC i HMI',
      contact: ['+48 600 000 186', 'michal.kaczmarczyk@example.com', 'Gliwice', 'linkedin.com/in/michal-kaczmarczyk-przyklad'],
      summary: 'Automatyk z sześcioletnim doświadczeniem w programowaniu sterowników Siemens i uruchamianiu linii montażowych oraz paletyzujących. Tworzę programy PLC w TIA Portal, wizualizacje HMI i konfiguruję falowniki. Uruchamiałem maszyny w Polsce, Czechach i Niemczech.',
      skills: [
        'Siemens S7-1200/1500, TIA Portal (LAD, SCL)',
        'Panele HMI Siemens Comfort i Unified',
        'Konfiguracja falowników i serwonapędów',
        'Sieci Profinet i Profibus',
        'Integracja robotów przemysłowych z PLC',
        'Schematy elektryczne w EPLAN',
        'Uprawnienia SEP G1 E i D do 1 kV'
      ],
      languages: ['angielski B2', 'niemiecki A2'],
      jobs: [
        {
          title: 'Automatyk – programista PLC',
          company: 'Integra-Tech Automation Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Programowanie PLC i HMI dla 14 maszyn i linii, w tym linii paletyzacji z dwoma robotami.',
            'Uruchomienia u klientów w Polsce, Czechach i Niemczech, łącznie około 30 tygodni wyjazdów rocznie.',
            'Przygotowanie biblioteki standardowych bloków funkcyjnych, która skróciła pisanie programu dla typowej maszyny o kilka dni.'
          ]
        },
        {
          title: 'Elektryk-automatyk utrzymania ruchu',
          company: 'Glass-Pak Gliwice Sp. z o.o.',
          period: '07.2018 – 05.2020',
          bullets: [
            'Diagnostyka i usuwanie awarii układów sterowania na liniach pakowania.',
            'Wprowadzanie drobnych zmian w programach PLC po uzgodnieniu z kierownikiem działu.',
            'Wymiana i parametryzacja falowników oraz czujników.'
          ]
        }
      ],
      education: {
        school: 'Politechnika Śląska, Wydział Automatyki, Elektroniki i Informatyki',
        degree: 'Inżynier, kierunek: automatyka i robotyka',
        period: '2014 – 2018'
      }
    },
    faq: [
      {
        q: 'Jak pokazać w CV projekty, które są objęte tajemnicą klienta?',
        a: 'Nie podawaj nazwy klienta, tylko branżę i typ rozwiązania, np. „linia montażu podzespołów dla producenta AGD, 12 stacji, 2 roboty”. To wystarczy, żeby pokazać skalę i Twoją rolę. Szczegóły możesz omówić na rozmowie w zakresie, na który pozwala umowa.'
      },
      {
        q: 'Czy warto wpisywać sterowniki, które znam tylko z kursu?',
        a: 'Tak, ale oznacz poziom, np. „Allen-Bradley – podstawy, kurs 40 h”. Rekruter docenia uczciwość, a umiejętność może przeważyć przy podobnych kandydatach. Nie stawiaj ich jednak na równi z platformą, na której pracujesz na co dzień.'
      },
      {
        q: 'Czy automatyk potrzebuje uprawnień SEP?',
        a: 'W większości ogłoszeń są wymagane lub mile widziane, bo praca obejmuje urządzenia elektryczne. Najczęściej chodzi o grupę 1 do 1 kV, a przy stanowiskach z odpowiedzialnością za innych także o zakres dozoru. Jeśli ich nie masz, napisz, że jesteś gotów je zdobyć.'
      }
    ]
  },
  {
    slug: 'lakiernik',
    category: 'Produkcja i technika',
    name: 'Lakiernik samochodowy',
    title: 'CV lakiernika samochodowego: wzór i wskazówki',
    metaDescription: 'CV lakiernika samochodowego pod ogłoszenie: przykład, słowa kluczowe z ofert serwisów i wskazówki, jak opisać przygotowanie, dobór koloru i cieniowanie.',
    intro: 'Serwisy blacharsko-lakiernicze w ogłoszeniach szukają lakierników, którzy samodzielnie przeprowadzą cały proces: od przygotowania powierzchni i szpachlowania, przez podkład, po lakierowanie w kabinie i polerowanie. Szczególnie cenione jest trafne dobieranie koloru i cieniowanie na sąsiednie elementy, bo od tego zależy, czy klient zauważy naprawę. Coraz częściej pada też wymóg pracy na lakierach wodorozcieńczalnych. Autoryzowane serwisy pytają dodatkowo o szkolenia producentów lakierów.',
    keywords: [
      'lakierowanie samochodowe',
      'przygotowanie powierzchni do lakierowania',
      'szpachlowanie i szlifowanie',
      'komputerowy dobór koloru',
      'cieniowanie lakieru',
      'lakiery wodorozcieńczalne',
      'obsługa kabiny lakierniczej',
      'polerowanie i usuwanie wad lakieru',
      'naprawy powypadkowe',
      'samodzielność na stanowisku'
    ],
    tips: [
      'Opisz cały zakres, który robisz samodzielnie: przygotowanie, podkład, dobór koloru, lakierowanie, polerowanie. Serwis szuka osoby, która nie potrzebuje pomocnika na każdym etapie.',
      'Napisz, w jakich systemach lakierniczych pracujesz i czy znasz lakiery wodne. Jeśli przeszedłeś szkolenia producenta lakierów, wpisz je z rokiem, bo autoryzowane serwisy często tego wymagają.',
      'Podaj skalę pracy, np. „średnio 6–8 elementów dziennie” albo „lakierowanie pełne pojazdów i elementów z tworzyw”. To pomaga ocenić, czy poradzisz sobie z tempem w danym serwisie.',
      'Jeśli znasz naprawy miejscowe (SMART repair), lakierowanie elementów plastikowych lub renowację aut zabytkowych, dodaj to osobno. Te umiejętności wyróżniają w ogłoszeniach z wyższą stawką.'
    ],
    sample: {
      name: 'Sebastian Borowski',
      headline: 'Lakiernik samochodowy – naprawy powypadkowe',
      contact: ['+48 600 000 187', 'sebastian.borowski@example.com', 'Koszalin', 'linkedin.com/in/sebastian-borowski-przyklad'],
      summary: 'Od dziewięciu lat lakieruję samochody osobowe i dostawcze w serwisach blacharsko-lakierniczych. Samodzielnie przygotowuję powierzchnię, dobieram kolor spektrofotometrem i wzornikami, cieniuję na sąsiednie elementy i poleruję. Od pięciu lat pracuję na lakierach wodorozcieńczalnych.',
      skills: [
        'Przygotowanie powierzchni, szpachlowanie i podkładowanie',
        'Komputerowy dobór koloru i praca ze spektrofotometrem',
        'Cieniowanie na elementy sąsiednie',
        'Lakiery wodorozcieńczalne i bezbarwne 2K',
        'Lakierowanie elementów z tworzyw sztucznych',
        'Naprawy miejscowe (SMART repair)',
        'Polerowanie i usuwanie zacieków oraz wtrąceń'
      ],
      languages: ['angielski A2'],
      jobs: [
        {
          title: 'Lakiernik samochodowy',
          company: 'Auto-Lak Koszalin Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Lakierowanie średnio 6–8 elementów dziennie w ramach napraw powypadkowych z ubezpieczenia.',
            'Dobór koloru dla aut po wymianie elementów, z liczbą poprawek kolorystycznych poniżej 3% zleceń.',
            'Przyuczanie pomocnika lakiernika do szlifowania i maskowania pojazdów.'
          ]
        },
        {
          title: 'Lakiernik',
          company: 'Blacharstwo i Lakiernictwo Pomorze s.c.',
          period: '03.2015 – 05.2020',
          bullets: [
            'Lakierowanie elementów samochodów osobowych i dostawczych lakierami rozpuszczalnikowymi i wodnymi.',
            'Przygotowanie elementów: szlifowanie, szpachlowanie, podkład wypełniający.',
            'Polerowanie i przygotowanie aut do wydania klientowi.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół nr 9 w Koszalinie',
        degree: 'Lakiernik samochodowy (branżowa szkoła I stopnia)',
        period: '2011 – 2014'
      }
    },
    faq: [
      {
        q: 'Czy warto załączyć zdjęcia swoich prac do CV lakiernika?',
        a: 'Do samego CV nie, ale możesz dopisać, że masz portfolio zdjęć „przed i po” i pokażesz je na rozmowie. Niektórzy kandydaci dodają link do galerii online. To dobry sposób, by pokazać jakość cieniowania i polerowania, której nie da się opisać słowami.'
      },
      {
        q: 'Jak opisać pracę w małym warsztacie bez nazwy firmy na rynku?',
        a: 'Podaj nazwę warsztatu, miasto i krótko jego profil, np. „serwis blacharsko-lakierniczy, 4 stanowiska”. Najważniejsze jest to, co robiłeś i jak samodzielnie. Wielkość firmy ma mniejsze znaczenie niż zakres Twoich zadań.'
      }
    ]
  },
  {
    slug: 'blacharz-samochodowy',
    category: 'Produkcja i technika',
    name: 'Blacharz samochodowy',
    title: 'CV blacharza samochodowego: wzór i wskazówki',
    metaDescription: 'CV blacharza samochodowego dopasowane do ogłoszenia: wzór, frazy z ofert serwisów i wskazówki, jak opisać naprawy powypadkowe, ramę i spawanie.',
    intro: 'Blacharz samochodowy w serwisie odpowiada za naprawy powypadkowe: demontaż, prostowanie, wymianę elementów nadwozia i przygotowanie auta do lakierni. W ogłoszeniach często wymagana jest praca na ramie naprawczej z systemem pomiarowym, spawanie MIG/MAG i zgrzewanie punktowe. Przy nowszych autach dochodzą naprawy aluminium, klejenie i nitowanie według technologii producenta. Mile widziana bywa umiejętność bezlakierniczego usuwania wgnieceń (PDR) oraz przygotowania wstępnej wyceny szkody.',
    keywords: [
      'naprawy powypadkowe',
      'prostowanie nadwozia na ramie',
      'pomiar geometrii nadwozia',
      'wymiana elementów karoserii',
      'spawanie MIG/MAG',
      'zgrzewanie punktowe',
      'naprawy elementów aluminiowych',
      'bezlakiernicze usuwanie wgnieceń (PDR)',
      'praca według technologii producenta',
      'prawo jazdy kat. B'
    ],
    tips: [
      'Napisz, jakie szkody naprawiasz: drobne wgniecenia, wymiana progów i błotników, ciężkie szkody z prostowaniem podłużnic. Zakres prac pokazuje Twój poziom lepiej niż sama liczba lat doświadczenia.',
      'Wymień sprzęt: rama naprawcza, elektroniczny system pomiarowy, zgrzewarka punktowa, spawarka do aluminium, zestaw PDR. Serwis z podobnym wyposażeniem szybciej Cię wdroży.',
      'Jeśli pracujesz z aluminium, klejeniem strukturalnym albo nitowaniem, wpisz to wyraźnie. Te technologie są coraz częstsze w nowych autach i nie każdy blacharz je zna.',
      'Dodaj wyniki: liczbę napraw miesięcznie, terminowość albo brak reklamacji. Właściciel serwisu myśli kategoriami przepustowości warsztatu, więc konkretne liczby trafiają do niego najlepiej.'
    ],
    sample: {
      name: 'Rafał Jasiński',
      headline: 'Blacharz samochodowy – naprawy powypadkowe',
      contact: ['+48 600 000 188', 'rafal.jasinski@example.com', 'Płock', 'linkedin.com/in/rafal-jasinski-przyklad'],
      summary: 'Od jedenastu lat naprawiam nadwozia samochodów osobowych i dostawczych po szkodach komunikacyjnych. Pracuję na ramie naprawczej z elektronicznym systemem pomiarowym, spawam MIG/MAG, zgrzewam punktowo i naprawiam elementy aluminiowe. Przygotowuję auta tak, by lakiernik mógł od razu zacząć pracę.',
      skills: [
        'Prostowanie nadwozia na ramie naprawczej',
        'Elektroniczny pomiar geometrii nadwozia',
        'Spawanie MIG/MAG i zgrzewanie punktowe',
        'Naprawy aluminium, klejenie i nitowanie',
        'Bezlakiernicze usuwanie wgnieceń (PDR)',
        'Demontaż i montaż elementów oraz osprzętu',
        'Praca według dokumentacji naprawczej producenta'
      ],
      languages: ['angielski A2'],
      jobs: [
        {
          title: 'Blacharz samochodowy',
          company: 'Car-Serwis Mazowsze Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Naprawy powypadkowe średnio 15–20 pojazdów miesięcznie, w tym szkody z prostowaniem podłużnic na ramie.',
            'Naprawy elementów aluminiowych w wydzielonym stanowisku zgodnie z wymaganiami producentów.',
            'Pomoc doradcy serwisowemu przy wstępnej ocenie zakresu szkody.'
          ]
        },
        {
          title: 'Blacharz',
          company: 'Auto-Blach Płock s.c.',
          period: '05.2013 – 05.2020',
          bullets: [
            'Wymiana progów, błotników i poszyć drzwi oraz naprawy korozji.',
            'Spawanie i zgrzewanie elementów nadwozia oraz zabezpieczanie profili zamkniętych.',
            'Przygotowanie pojazdów do lakierowania i ich ponowny montaż po lakierni.'
          ]
        }
      ],
      education: {
        school: 'Zespół Szkół Centrum Kształcenia Rolniczego w Płocku',
        degree: 'Blacharz samochodowy (zasadnicza szkoła zawodowa)',
        period: '2009 – 2012'
      }
    },
    faq: [
      {
        q: 'Czy znajomość programów do kosztorysowania jest potrzebna blacharzowi?',
        a: 'Nie jest wymagana na każdym stanowisku, ale bywa dużym atutem, szczególnie w mniejszych serwisach. Jeśli umiesz przygotować wstępny kosztorys albo pracowałeś z systemami do wyceny szkód, dopisz to. Pokazujesz wtedy, że rozumiesz także stronę rozliczeń z ubezpieczycielem.'
      },
      {
        q: 'Blacharz i lakiernik w jednym – jak to opisać?',
        a: 'Jeśli robisz oba zakresy, napisz w nagłówku „Blacharz-lakiernik” i rozdziel umiejętności na dwie grupy. Mniejsze warsztaty często szukają właśnie takiej osoby. W większych serwisach podkreśl tę specjalizację, na którą jest ogłoszenie.'
      }
    ]
  },
  {
    slug: 'pakowacz',
    category: 'Produkcja i technika',
    name: 'Pakowacz / Pracownik pakowania',
    title: 'CV pakowacza: wzór i wskazówki',
    metaDescription: 'CV pakowacza i pracownika pakowania pod ogłoszenie. Przykład, frazy z ofert i wskazówki, jak opisać tempo pracy, kontrolę jakości i obsługę skanera.',
    intro: 'Pakowacze pracują w zakładach spożywczych, kosmetycznych, w produkcji i w magazynach sklepów internetowych, a ogłoszenia różnią się głównie normą wydajności i rodzajem towaru. Pracodawcy oczekują dokładności, sprawdzania wyrobów przed zapakowaniem i pracy zgodnie z instrukcją, często na zmiany. W magazynach e-commerce dochodzi obsługa skanera i drukowanie etykiet, a w zakładach spożywczych zwykle wymagane jest orzeczenie do celów sanitarno-epidemiologicznych. Doświadczenie nie zawsze jest potrzebne, ale dobrze opisane wyraźnie zwiększa szanse.',
    keywords: [
      'pakowanie produktów',
      'kontrola jakości wizualna',
      'etykietowanie',
      'obsługa skanera',
      'kompletowanie zamówień',
      'paletyzacja i foliowanie',
      'praca w normie wydajności',
      'praca na linii produkcyjnej',
      'orzeczenie sanitarno-epidemiologiczne',
      'praca w systemie zmianowym'
    ],
    tips: [
      'Napisz, co pakowałeś i w jakim tempie, np. „pakowanie kosmetyków do kartonów zbiorczych, ok. 600 sztuk na zmianę”. Liczby pokazują, że poradzisz sobie z normą.',
      'Wspomnij o kontroli jakości: odkładanie wadliwych sztuk, sprawdzanie dat i nadruków, ważenie paczek. Dla pracodawcy to tak samo ważne jak szybkość.',
      'Jeśli obsługiwałeś skaner, drukarkę etykiet, zgrzewarkę lub owijarkę do palet, wpisz to w umiejętnościach. Te drobne rzeczy często decydują, kogo zaprosić w pierwszej kolejności.',
      'Do pracy przy żywności dopisz, że masz aktualne orzeczenie sanitarno-epidemiologiczne. Oszczędzasz pracodawcy czas i możesz zacząć szybciej.'
    ],
    sample: {
      name: 'Monika Szewczyk',
      headline: 'Pracownik pakowania – produkcja spożywcza i e-commerce',
      contact: ['+48 600 000 189', 'monika.szewczyk@example.com', 'Września', 'linkedin.com/in/monika-szewczyk-przyklad'],
      summary: 'Od czterech lat pracuję przy pakowaniu w zakładzie spożywczym i w magazynie sklepu internetowego. Regularnie realizuję normę, sprawdzam produkty przed zapakowaniem i obsługuję skaner oraz drukarkę etykiet. Mam aktualne orzeczenie sanitarno-epidemiologiczne i jestem gotowa do pracy na trzy zmiany.',
      skills: [
        'Pakowanie ręczne i na linii produkcyjnej',
        'Kontrola wizualna produktów i opakowań',
        'Obsługa skanera i drukarki etykiet',
        'Kompletowanie zamówień internetowych',
        'Foliowanie i paletyzacja',
        'Obsługa zgrzewarki do folii',
        'Aktualne orzeczenie sanitarno-epidemiologiczne'
      ],
      languages: ['angielski A1'],
      jobs: [
        {
          title: 'Pracownik pakowania',
          company: 'Wielkopolskie Przetwory Smakon Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Pakowanie słoików i kartonów na linii produkcyjnej, z normą ok. 1200 opakowań na zmianę.',
            'Sprawdzanie dat, kodów partii i szczelności zamknięć przed paletyzacją.',
            'Foliowanie palet i oznaczanie ich etykietami logistycznymi.'
          ]
        },
        {
          title: 'Pakowacz',
          company: 'Sklep-Paka Logistics Sp. z o.o.',
          period: '09.2019 – 05.2020',
          bullets: [
            'Pakowanie zamówień sklepu internetowego z odzieżą, średnio 250 paczek na zmianę.',
            'Skanowanie produktów i drukowanie etykiet przewozowych.',
            'Zgłaszanie braków i uszkodzonego towaru kierownikowi zmiany.'
          ]
        }
      ],
      education: {
        school: 'Liceum Ogólnokształcące we Wrześni',
        degree: 'Wykształcenie średnie',
        period: '2015 – 2018'
      }
    },
    faq: [
      {
        q: 'Czy do pracy na pakowaniu potrzebne jest CV?',
        a: 'Często tak, nawet jeśli ogłoszenie jest proste. Krótkie CV na jedną stronę z doświadczeniem, dostępnością i informacją o orzeczeniu sanitarnym pozwala szybko przejść przez selekcję. Agencje pracy też je zbierają, żeby dopasować Cię do zmiany i zakładu.'
      },
      {
        q: 'Co wpisać, jeśli to moja pierwsza praca?',
        a: 'Opisz prace dorywcze, sezonowe czy pomoc w rodzinnej firmie, w których liczyła się dokładność i tempo. Dodaj gotowość do pracy zmianowej i to, od kiedy możesz zacząć. Krótkie podsumowanie typu „szybko się uczę i pracuję według instrukcji” warto poprzeć konkretnym przykładem.'
      },
      {
        q: 'Jak zdobyć orzeczenie sanitarno-epidemiologiczne?',
        a: 'Orzeczenie wydaje lekarz medycyny pracy na podstawie badań, zwykle po skierowaniu od pracodawcy. Część osób robi je wcześniej, żeby od razu zacząć pracę w zakładzie spożywczym. Jeśli je masz, wpisz to w CV z informacją, że jest aktualne.'
      }
    ]
  },
  {
    slug: 'inzynier-produkcji',
    category: 'Produkcja i technika',
    name: 'Inżynier produkcji',
    title: 'CV inżyniera produkcji: wzór i wskazówki',
    metaDescription: 'CV inżyniera produkcji pod ogłoszenie: wzór, słowa kluczowe z ofert i wskazówki, jak opisać Lean, wdrożenia procesów, OEE i projekty z wynikami.',
    intro: 'Inżynier produkcji odpowiada za to, żeby procesy działały stabilnie, wydajnie i bez zbędnych kosztów. W ogłoszeniach powtarzają się narzędzia Lean (5S, SMED, Kaizen, VSM), praca ze wskaźnikami, takimi jak OEE i scrap, oraz przygotowanie dokumentacji procesowej, np. PFMEA czy instrukcji stanowiskowych. Firmy oczekują też udziału we wdrażaniu nowych produktów i współpracy z jakością oraz utrzymaniem ruchu. Zwykle wymagany jest angielski na poziomie B2, a atutem jest certyfikat Six Sigma Green Belt.',
    keywords: [
      'optymalizacja procesów produkcyjnych',
      'Lean Manufacturing',
      'SMED',
      'wskaźnik OEE',
      'PFMEA',
      'instrukcje stanowiskowe',
      'wdrażanie nowych produktów',
      'Kaizen i ciągłe doskonalenie',
      'Six Sigma Green Belt',
      'angielski B2'
    ],
    tips: [
      'Każdy projekt opisz liczbą: o ile wzrosło OEE, o ile skrócił się czas przezbrojenia, ile zaoszczędzono na scrapie. W tym zawodzie wynik liczbowy jest głównym językiem rozmowy z menedżerem.',
      'Wymień procesy, które znasz od strony technicznej: wtrysk, tłoczenie, montaż, obróbka skrawaniem, spawanie zrobotyzowane. Ogłoszenia często szukają inżyniera do konkretnej technologii.',
      'Pokaż narzędzia, z których korzystasz na co dzień: PFMEA, plan kontroli, VSM, analiza przyczyn źródłowych, a z oprogramowania np. AutoCAD, SolidWorks, Minitab lub moduł produkcyjny ERP.',
      'Opisz współpracę z innymi działami i liderami zmian. Inżynier produkcji wdraża zmiany przez ludzi, więc umiejętność przeprowadzenia warsztatów Kaizen czy szkolenia operatorów jest istotnym atutem.'
    ],
    sample: {
      name: 'Joanna Kwiatkowska',
      headline: 'Inżynier produkcji – Lean i wdrożenia procesów',
      contact: ['+48 600 000 190', 'joanna.kwiatkowska@example.com', 'Bielsko-Biała', 'linkedin.com/in/joanna-kwiatkowska-przyklad'],
      summary: 'Inżynier produkcji z siedmioletnim doświadczeniem w branży motoryzacyjnej i AGD. Prowadzę projekty poprawy wydajności z wykorzystaniem Lean, przygotowuję dokumentację procesową i wdrażam nowe produkty na linie montażowe. Mam certyfikat Six Sigma Green Belt.',
      skills: [
        'Lean Manufacturing: 5S, SMED, VSM, Kaizen',
        'Analiza i poprawa wskaźnika OEE',
        'PFMEA, plany kontroli i instrukcje stanowiskowe',
        'Wdrażanie nowych produktów na linie montażowe',
        'Six Sigma Green Belt, Minitab',
        'AutoCAD i podstawy SolidWorks',
        'Prowadzenie warsztatów i szkoleń operatorów'
      ],
      languages: ['angielski B2', 'niemiecki A2'],
      jobs: [
        {
          title: 'Inżynier produkcji',
          company: 'Beskid Automotive Systems Sp. z o.o.',
          period: '06.2020 – obecnie',
          bullets: [
            'Wzrost OEE na linii montażu foteli z 71% do 80% w ciągu 10 miesięcy dzięki analizie przestojów i warsztatom SMED.',
            'Wdrożenie trzech nowych produktów na linie montażowe, w tym przygotowanie PFMEA i instrukcji stanowiskowych.',
            'Obniżenie poziomu scrapu w procesie zgrzewania o ok. 30% po projekcie Six Sigma.'
          ]
        },
        {
          title: 'Młodszy inżynier procesu',
          company: 'Domtech AGD Sp. z o.o.',
          period: '07.2017 – 05.2020',
          bullets: [
            'Przygotowanie instrukcji stanowiskowych i standardów pracy dla linii montażu pralek.',
            'Udział w projektach 5S i reorganizacji stanowisk, które skróciły czas cyklu na dwóch stacjach.',
            'Zbieranie danych o przestojach i przygotowanie cotygodniowych raportów dla kierownika produkcji.'
          ]
        }
      ],
      education: {
        school: 'Akademia Techniczno-Humanistyczna w Bielsku-Białej',
        degree: 'Magister inżynier, kierunek: zarządzanie i inżynieria produkcji',
        period: '2012 – 2017'
      }
    },
    faq: [
      {
        q: 'Jak pokazać wyniki projektów, jeśli firma nie podaje danych na zewnątrz?',
        a: 'Używaj wartości względnych zamiast kwot, np. „skrócenie czasu przezbrojenia o 35%” albo „spadek scrapu o ok. jedną trzecią”. To pokazuje skalę efektu bez ujawniania danych finansowych. Na rozmowie bądź gotowa opowiedzieć, jak mierzyłaś wynik.'
      },
      {
        q: 'Czy certyfikat Lean lub Six Sigma jest konieczny?',
        a: 'Zwykle nie jest warunkiem koniecznym, ale wyraźnie pomaga, szczególnie w dużych firmach produkcyjnych. Ważniejsze są projekty, które faktycznie przeprowadziłeś. Jeśli masz certyfikat, podaj poziom (Yellow, Green, Black Belt) i opisz projekt, którym go zamknąłeś.'
      }
    ]
  }
];

const EN = {
  "operator-cnc": {
    slugLang: "cnc-machine-operator",
    name: "CNC machine operator",
    title: "CNC operator CV: example and tips",
    metaDescription: "A CNC operator CV tailored to the job ad: an example, keywords from real offers and tips on describing controls, machine setup and part measurement.",
    intro: "Plants hiring CNC operators first check which machines and controls you have worked on: milling machines or lathes, Fanuc, Sinumerik, Heidenhain. There is a big difference between someone who only loads parts and presses start, and someone who sets up the machine, enters tool offsets and corrects the program on their own. Almost every ad mentions reading technical drawings and measuring with callipers and micrometers. Employers usually also point out shift work.",
    keywords: [
      "CNC machine operation",
      "Fanuc control",
      "Sinumerik control",
      "machine setup and part zeroing",
      "tool offsets",
      "reading technical drawings",
      "measuring with callipers and micrometers",
      "G-code knowledge",
      "CNC milling",
      "three-shift work"
    ],
    tips: [
      "Name the machines and controls directly, for example \"3-axis machining centre, Heidenhain TNC 640 control\". A vague \"CNC operation\" tells the recruiter nothing about how quickly you will settle in on their shop floor.",
      "Separate what you do yourself from what the process engineer does. If you set work offsets, measure tools and edit the program at the machine, say so clearly, because it raises your pay level.",
      "Give the materials and accuracy you work with: aluminium, stainless steel, tolerances of ±0.01 mm. Employers in aerospace or medical manufacturing look for exactly this information.",
      "Add the measuring tools you know (micrometer, bore gauge, height gauge, plug and ring gauges) and whether you fill in inspection sheets. It shows you care about quality, not only output."
    ],
    sample: {
      name: "Paweł Wróblewski",
      headline: "CNC milling operator and setter",
      contact: ["+48 600 000 181", "pawel.wroblewski@example.com", "Mielec", "linkedin.com/in/pawel-wroblewski-przyklad"],
      summary: "For six years I have worked on CNC machining centres with Fanuc and Heidenhain controls. I set up the machine for a new batch, measure tools and enter offsets on my own, and I check parts against the drawing to tolerances of ±0.01 mm.",
      skills: [
        "Fanuc 0i and Heidenhain TNC 640 controls",
        "Machine setup and part zeroing",
        "Tool measurement and tool offsets",
        "Editing G-code programs at the machine",
        "Reading technical drawings and tolerances",
        "Measuring with micrometers, bore gauges and height gauges",
        "Machining aluminium and stainless steel"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "CNC operator and setter",
          company: "Aeromech Precyzja Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Setting up 3- and 5-axis machining centres for batches of 20 to 500 aerospace aluminium parts.",
            "Cutting changeover time on one machine from about 90 to 60 minutes by preparing tools before the previous batch ended.",
            "In-process inspection and keeping measurement sheets for an aerospace customer."
          ]
        },
        {
          title: "CNC machine operator",
          company: "Metal-Tech Mielec Sp. z o.o.",
          period: "03.2018 – 05.2020",
          bullets: [
            "Operating CNC milling machines with Fanuc control in a three-shift system.",
            "Replacing worn tools and entering dimensional offsets after measurement.",
            "Deburring and measuring parts with callipers and micrometers."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Mielcu",
        degree: "Mechanical technician (technik mechanik)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "If I am an operator who does not program, can I still say I know CNC?",
        a: "Yes, but describe the scope honestly. Say that you run the machine, change tools and enter offsets, but do not write programs from scratch. Employers often look for exactly such people, and any gap would show up on your first day at the machine."
      },
      {
        q: "Is it worth listing a CNC programming course?",
        a: "It is, especially if you are aiming for an operator-setter role. Give the course name, the number of hours and the control it covered. If you have used that knowledge at work, add it under the relevant job."
      },
      {
        q: "How do I describe work on several different controls?",
        a: "List them under skills and, for each job, add what you worked on longest. The recruiter will quickly see that you switch easily between machines, which is valuable in plants with a mixed machine park."
      }
    ]
  },
  "slusarz": {
    slugLang: "metalworker-fitter",
    name: "Metalworker / Fitter",
    title: "Metalworker CV: example and tips",
    metaDescription: "A metalworker CV tailored to the job ad. An example, phrases from real offers and tips on describing manual metalwork, steel assembly and extra licences.",
    intro: "In Polish job ads the word \"ślusarz\" covers very different work: from assembling steel structures, through machine fitting, to making railings and gates. That is why your CV must show clearly which of these you have experience in. Employers usually ask about reading drawings, manual machining (cutting, drilling, tapping) and using power tools. MAG welding and a UDT crane licence are often an extra advantage.",
    keywords: [
      "manual metalworking",
      "reading technical drawings",
      "steel structure assembly",
      "drilling and tapping",
      "using power tools",
      "MAG welding as an advantage",
      "UDT crane licence",
      "measuring with callipers",
      "machine fitting",
      "health and safety compliance"
    ],
    tips: [
      "Start with what you make: steel structures, machine guards, railings, conveyors. A plant producing steel halls looks for a different metalworker than a company servicing production lines.",
      "List the machines and tools you use: band saw, pillar drill, bending machine, press brake, angle grinder. This is the detail that sets you apart from other candidates.",
      "Put extra licences (UDT for cranes or forklifts, welding certificate, SEP) in a separate section with their expiry dates. They often decide which candidate gets invited.",
      "If you work from documentation, say what kind: workshop drawings, assembly drawings, bills of materials. Working independently from drawings is one of the most common requirements."
    ],
    sample: {
      name: "Grzegorz Sikora",
      headline: "Steel structure fitter",
      contact: ["+48 600 000 182", "grzegorz.sikora@example.com", "Stalowa Wola", "linkedin.com/in/grzegorz-sikora-przyklad"],
      summary: "For ten years I have been making and assembling steel structures and machine parts from workshop drawings. I weld using MAG, hold a UDT licence for floor-operated overhead cranes and prepare parts for assembly on my own.",
      skills: [
        "Reading workshop and assembly drawings",
        "Cutting, drilling, tapping and chamfering",
        "Operating a band saw and pillar drill",
        "MAG welding (135)",
        "Assembling bolted steel structures",
        "UDT licence for floor-operated overhead cranes",
        "Measuring with callipers, squares and spirit levels"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "Metalworker-fitter",
          company: "Stal-Konstrukt Stalowa Wola Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Making subassemblies for steel halls and canopies from workshop drawings.",
            "Trial assembly of structures in the workshop before shipping to the customer, and marking the parts.",
            "Training two new employees on the band saw and on health and safety rules at the workstation."
          ]
        },
        {
          title: "Metalworker",
          company: "Zakład Mechaniczny Sanmet s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Making custom gates, railings and fence elements.",
            "Cutting, drilling and tapping parts and preparing them for welding.",
            "Installing finished products at customers' sites together with the crew."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 2 w Stalowej Woli",
        degree: "Metalworker (ślusarz), vocational school",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Does a metalworker need a welding certificate?",
        a: "Not always, but many ads list MAG welding as a requirement or a nice-to-have. If you weld without a certificate, you can say so and define the scope, for example \"MAG welding of simple joints\". Getting the certificate is worthwhile because it opens up more offers."
      },
      {
        q: "How do I write a metalworker CV straight after school with no experience?",
        a: "Describe your work placements: which plant, what work and which machines. Add skills from school, such as manual machining and reading drawings, plus any courses you have. A short, specific CV makes a better impression than a long list of personal qualities."
      }
    ]
  },
  "tokarz": {
    slugLang: "lathe-turner",
    name: "Turner / Lathe operator",
    title: "Turner CV: example and tips",
    metaDescription: "A turner CV tailored to the job ad: an example, keywords from real offers and tips on describing manual and CNC lathe work, threads and tolerances.",
    intro: "Job ads for turners fall into two groups: work on manual lathes, often making spare parts and repairs, and running CNC lathes in series production. Many plants look for someone who can do both. Employers ask about thread turning, working to tolerances and choosing cutting parameters on your own. Experience with one-off parts from drawings or with long production runs also matters.",
    keywords: [
      "manual lathe turning",
      "CNC lathe operation",
      "thread turning",
      "reading technical drawings",
      "choosing cutting parameters",
      "measuring with micrometers",
      "working to tolerances",
      "making spare parts",
      "grinding lathe tools",
      "one-off and series production"
    ],
    tips: [
      "Say which lathes you have worked on and the size of the parts you machine, for example \"shafts up to 1500 mm long, diameters up to 400 mm\". The plant will see at once whether you can handle its orders.",
      "If you cut threads, list the types: metric, imperial, trapezoidal. Cutting a trapezoidal thread on a manual lathe is a skill many employers are looking for.",
      "State the tolerances you work to and what you measure with. Fit classes or required surface roughness show that you understand the drawing, not just the machine.",
      "If you know both manual and CNC lathes, keep them separate in your skills. For many plants this combination is the most valuable, because such a person can handle both a batch and an urgent repair."
    ],
    sample: {
      name: "Marek Pietrzak",
      headline: "Manual and CNC turner",
      contact: ["+48 600 000 183", "marek.pietrzak@example.com", "Ostrów Wielkopolski", "linkedin.com/in/marek-pietrzak-przyklad"],
      summary: "I have worked as a turner for twelve years, first on manual lathes and for the last five years also on CNC lathes with Fanuc control. I make spare parts from drawings and from samples, cut metric and trapezoidal threads and work to tolerances of 0.02 mm.",
      skills: [
        "Turning on manual lathes (TUR, TUM)",
        "Operating and setting up a CNC lathe with Fanuc control",
        "Cutting metric, imperial and trapezoidal threads",
        "Making parts from a sample",
        "Choosing tools and cutting parameters",
        "Measuring with micrometers, bore gauges and gauges",
        "Grinding lathe tools"
      ],
      languages: ["German A2"],
      jobs: [
        {
          title: "CNC turner",
          company: "Wagmech Ostrów Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Turning shafts and bushings for railway wagon subassemblies in batches of 50 to 300 pieces.",
            "Setting up the lathe for a new batch and producing the first part for quality approval.",
            "Making urgent spare parts on a manual lathe for the maintenance department."
          ]
        },
        {
          title: "Turner",
          company: "Usługi Ślusarsko-Tokarskie Kalisz-Met s.c.",
          period: "04.2012 – 05.2020",
          bullets: [
            "Making parts for agricultural and industrial machinery from samples supplied by customers.",
            "Cutting trapezoidal threads for lead screws and presses.",
            "Measuring worn parts and preparing sketches for making new ones."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Ostrowie Wielkopolskim",
        degree: "Machine tool operator (operator obrabiarek skrawających)",
        period: "2009 – 2012"
      }
    },
    faq: [
      {
        q: "Can a manual turner get a job on CNC machines?",
        a: "Yes, many employers are happy to train manual turners because they understand cutting and drawings. In your CV, stress the accuracy you work to and your willingness to learn the control. If you have done a CNC course, list it even without production experience."
      },
      {
        q: "Should I mention in my CV that I make parts from samples?",
        a: "Definitely. Making a part without a drawing, from a worn component, requires measuring, judging wear and choosing the material. Such skills are valued in maintenance departments and small job shops."
      }
    ]
  },
  "technik-utrzymania-ruchu": {
    slugLang: "maintenance-technician",
    name: "Maintenance technician",
    title: "Maintenance technician CV: example and tips",
    metaDescription: "A maintenance technician CV: an example, keywords from real offers and tips on describing breakdown repair, inspections, SEP licences and PLC work.",
    intro: "A maintenance technician keeps production lines running with as little downtime as possible, so job ads focus on diagnosing and fixing mechanical, electrical, pneumatic and hydraulic faults. A Polish SEP group 1 licence up to 1 kV for operation is very often required. More and more companies also expect basic PLC skills, at least reading signal states and online diagnostics in TIA Portal. On top of that come preventive inspections, reporting in a CMMS and shift work.",
    keywords: [
      "machine breakdown repair",
      "diagnosing mechanical and electrical faults",
      "SEP G1 licence up to 1 kV",
      "pneumatics and hydraulics",
      "preventive maintenance",
      "basic Siemens PLC",
      "reading electrical diagrams",
      "TPM",
      "CMMS",
      "shift work"
    ],
    tips: [
      "Describe the machines and lines you have maintained: injection moulding machines, presses, packing lines, welding robots. Experience with a similar machine park shortens onboarding, and recruiters ask about it.",
      "Give your SEP licence precisely: group, scope (operation, supervision), voltage and expiry date. \"SEP G1 E up to 1 kV, valid until 2028\" is exactly the line the employer is looking for.",
      "Show results, not just duties. Shorter average repair time, fewer stoppages after introducing inspections or higher OEE are arguments that stick.",
      "Make your PLC level clear: reading and online diagnostics, small modifications or independent programming. An honest description saves you from an awkward moment in the technical interview."
    ],
    sample: {
      name: "Łukasz Wawrzyniak",
      headline: "Maintenance technician – mechanical and electrical",
      contact: ["+48 600 000 184", "lukasz.wawrzyniak@example.com", "Legnica", "linkedin.com/in/lukasz-wawrzyniak-przyklad"],
      summary: "For seven years I have kept production lines running in automotive plants. I fix mechanical, electrical and pneumatic breakdowns, carry out preventive inspections and diagnose faults in Siemens S7-1500 controllers via TIA Portal. I hold a SEP G1 E licence up to 1 kV.",
      skills: [
        "Diagnosing and fixing production line breakdowns",
        "SEP G1 E licence up to 1 kV",
        "Pneumatics and electropneumatics",
        "Industrial hydraulics",
        "Siemens S7 PLC diagnostics in TIA Portal",
        "Reading electrical and pneumatic diagrams",
        "Reporting breakdowns in a CMMS"
      ],
      languages: ["English B1"],
      jobs: [
        {
          title: "Maintenance technician",
          company: "Autoparts Legnica Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Fixing breakdowns on four robotic spot-welding and assembly lines in a three-shift system.",
            "Drawing up a weekly inspection checklist, after which unplanned stoppages on the line fell by about 25% within a year.",
            "Replacing and adjusting cylinders, valves and inductive sensors."
          ]
        },
        {
          title: "Electromechanic",
          company: "Plastform Polkowice Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Servicing injection moulding machines and part-removal robots.",
            "Replacing heaters, thermocouples and contactors in control cabinets.",
            "Taking part in annual machine overhauls carried out with the manufacturer's service team."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektronicznych i Samochodowych w Legnicy",
        degree: "Mechatronics technician (technik mechatronik)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "What if my SEP licence has expired?",
        a: "List it with a note on when it was valid, for example \"SEP G1 E up to 1 kV (valid until 03.2024)\", and add that you can renew it. The exam can be retaken fairly quickly, and the employer sees you have already been through the preparation. Do not present an expired licence as current."
      },
      {
        q: "Mechanic or electrician – how should I present myself?",
        a: "Say what your strong side is, but show the other field too if you know it. Many companies look for all-round technicians, and a headline such as \"Maintenance technician – mechanic with SEP licence\" works well. The job ad usually says plainly which profile the team is missing."
      },
      {
        q: "Should shift and weekend work be in my CV?",
        a: "If the ad mentions it, confirm in one sentence that you are ready for three-shift work or on-call duty. For a maintenance department this matters, because the rota has to cover every shift."
      }
    ]
  },
  "kontroler-jakosci": {
    slugLang: "quality-inspector",
    name: "Quality inspector",
    title: "Quality inspector CV: example and tips",
    metaDescription: "A quality inspector CV tailored to the job ad: an example, keywords from real offers and tips on describing measurements, non-conformity reports and ISO.",
    intro: "A quality inspector checks products on arrival, during production and before shipping, so job ads focus above all on measurement and reliable documentation. Employers ask about measuring instruments, reading drawings with tolerances, visual inspection against reference samples and keeping non-conformity reports. In the automotive sector, knowledge of IATF 16949 requirements and quality tools such as 8D or 5 Why is added. Operating a coordinate measuring machine (CMM) is an advantage.",
    keywords: [
      "product quality inspection",
      "measuring with measuring instruments",
      "reading technical drawings",
      "visual inspection",
      "non-conformity reports",
      "ISO 9001",
      "IATF 16949",
      "8D report",
      "coordinate measuring machine (CMM)",
      "first article inspection"
    ],
    tips: [
      "List the specific instruments you use: callipers, micrometer, height gauge, gauges, CMM, profilometer. The recruiter compares this list with the equipment in their quality department.",
      "Say at which stage you inspect: incoming goods, in-process, final, product audit. Each stage calls for slightly different skills.",
      "Show that you do not just find defects but help eliminate them. Taking part in 8D reports, root cause analysis or customer complaints are the strongest points in an inspector's CV.",
      "Give the industry and standards you have worked with: ISO 9001, IATF 16949, customer-specific requirements. In automotive and aerospace this is often a condition for an interview."
    ],
    sample: {
      name: "Katarzyna Mazurek",
      headline: "Quality inspector in the automotive industry",
      contact: ["+48 600 000 185", "katarzyna.mazurek@example.com", "Tychy", "linkedin.com/in/katarzyna-mazurek-przyklad"],
      summary: "For five years I have inspected metal and plastic parts for automotive customers. I measure with hand instruments and on a coordinate measuring machine, keep non-conformity reports and take part in 8D analyses. I work to IATF 16949 requirements.",
      skills: [
        "Measuring with callipers, micrometers and height gauges",
        "Operating a coordinate measuring machine (CMM)",
        "Reading drawings and geometric tolerances",
        "Visual inspection against boundary samples",
        "Non-conformity reports and 8D participation",
        "Knowledge of IATF 16949 and ISO 9001",
        "First article inspection (FAI)"
      ],
      languages: ["English B1"],
      jobs: [
        {
          title: "Quality inspector",
          company: "Silesia Components Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "First- and last-part inspection for 12 lines stamping and welding body parts.",
            "CMM measurements and preparing reports for the customer.",
            "Taking part in seven 8D analyses, including writing a visual inspection instruction after a customer complaint."
          ]
        },
        {
          title: "Quality inspector – incoming inspection",
          company: "Plastimex Bieruń Sp. z o.o.",
          period: "04.2019 – 05.2020",
          bullets: [
            "Incoming inspection of mouldings and components from suppliers according to the control plan.",
            "Blocking non-conforming batches and raising complaints with suppliers.",
            "Keeping a log of inspection results in Excel."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska, Wydział Mechaniczny Technologiczny",
        degree: "Engineer's degree (BEng), production management and engineering",
        period: "2015 – 2019"
      }
    },
    faq: [
      {
        q: "Can I get a quality inspection job without CMM experience?",
        a: "Yes, many inspector roles rely on hand instruments and visual inspection. In your CV, show accuracy, knowledge of drawings and experience with documentation. If you have had CMM training, list it even if you have not yet worked on the machine on your own."
      },
      {
        q: "How should I describe training in quality tools?",
        a: "Create a separate \"Training\" section and give the name and year, for example \"8D and 5 Why methodology, 2023\" or \"IATF 16949 requirements, 2022\". Under the relevant job, add how you use this knowledge, because training without practice carries less weight."
      }
    ]
  },
  "automatyk": {
    slugLang: "automation-technician",
    name: "Automation technician",
    title: "Automation technician CV: example and tips",
    metaDescription: "An automation technician CV tailored to the job ad. An example, keywords from offers and tips on describing PLC and HMI programming, commissioning and SEP.",
    intro: "Automation technicians work both in maintenance departments and at system integrators that build and commission new lines. The most frequent items in job ads are Siemens S7 controllers with TIA Portal, HMI panels, frequency inverters, reading and drawing electrical diagrams, and Polish SEP licences. Integrators also ask about on-site commissioning, often abroad, and working with industrial robots. It pays to show which projects you took part in and what exactly you did.",
    keywords: [
      "PLC programming",
      "Siemens TIA Portal",
      "HMI visualisation",
      "SCADA systems",
      "frequency inverter configuration",
      "SEP E and D licences up to 1 kV",
      "reading and drawing electrical diagrams",
      "on-site machine commissioning",
      "industrial robotics",
      "Profinet industrial networks"
    ],
    tips: [
      "Give the platforms you program and your level: Siemens S7-1200/1500, Allen-Bradley, Beckhoff. For each one you can add the languages (LAD, FBD, SCL), because technical recruiters filter candidates by them.",
      "Describe projects: type of machine or line, number of I/Os, your role and the commissioning country. \"Commissioning a palletising line with two robots in the Czech Republic\" says more than \"machine commissioning\".",
      "List your SEP licences with group and scope (operation and supervision). At integrators, readiness to travel and a category B driving licence also matter.",
      "If you know EPLAN, machine safety (for example PN-EN ISO 13849) or a specific robot brand, add it separately. These are rarer skills that clearly raise the value of your CV."
    ],
    sample: {
      name: "Michał Kaczmarczyk",
      headline: "Automation technician – PLC and HMI programmer",
      contact: ["+48 600 000 186", "michal.kaczmarczyk@example.com", "Gliwice", "linkedin.com/in/michal-kaczmarczyk-przyklad"],
      summary: "Automation technician with six years of experience programming Siemens controllers and commissioning assembly and palletising lines. I write PLC programs in TIA Portal, build HMI screens and configure inverters. I have commissioned machines in Poland, the Czech Republic and Germany.",
      skills: [
        "Siemens S7-1200/1500, TIA Portal (LAD, SCL)",
        "Siemens Comfort and Unified HMI panels",
        "Configuring inverters and servo drives",
        "Profinet and Profibus networks",
        "Integrating industrial robots with PLCs",
        "Electrical diagrams in EPLAN",
        "SEP G1 E and D licences up to 1 kV"
      ],
      languages: ["English B2", "German A2"],
      jobs: [
        {
          title: "Automation technician – PLC programmer",
          company: "Integra-Tech Automation Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "PLC and HMI programming for 14 machines and lines, including a palletising line with two robots.",
            "Commissioning at customers' sites in Poland, the Czech Republic and Germany, about 30 weeks of travel a year in total.",
            "Building a library of standard function blocks that cut programming time for a typical machine by several days."
          ]
        },
        {
          title: "Maintenance electrician and automation technician",
          company: "Glass-Pak Gliwice Sp. z o.o.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Diagnosing and fixing control system faults on packing lines.",
            "Making minor changes to PLC programs after agreeing them with the department manager.",
            "Replacing and setting parameters for inverters and sensors."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska, Wydział Automatyki, Elektroniki i Informatyki",
        degree: "Engineer's degree (BEng), automation and robotics",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "How do I show projects covered by customer confidentiality?",
        a: "Leave out the customer's name and give the industry and type of solution, for example \"subassembly line for a home appliance maker, 12 stations, 2 robots\". That is enough to show the scale and your role. You can discuss details at the interview as far as your contract allows."
      },
      {
        q: "Should I list controllers I only know from a course?",
        a: "Yes, but mark the level, for example \"Allen-Bradley – basics, 40-hour course\". Recruiters appreciate honesty, and the skill may tip the balance between similar candidates. Just do not put it on a par with the platform you use every day."
      },
      {
        q: "Does an automation technician need SEP licences?",
        a: "Most ads require them or list them as an advantage, because the work involves electrical equipment. Usually this means group 1 up to 1 kV, and for roles with responsibility for others also the supervision scope. If you do not have them, say you are ready to get them."
      }
    ]
  },
  "lakiernik": {
    slugLang: "car-painter",
    name: "Car painter",
    title: "Car painter CV: example and tips",
    metaDescription: "A car painter CV tailored to the job ad: an example, keywords from body shop offers and tips on describing preparation, colour matching and blending.",
    intro: "Body and paint shops advertise for painters who can handle the whole process on their own: from surface preparation and filling, through primer, to spraying in the booth and polishing. Accurate colour matching and blending into adjacent panels are especially valued, because they decide whether the customer notices the repair. Working with waterborne paints is increasingly required. Authorised workshops also ask about training from paint manufacturers.",
    keywords: [
      "car painting",
      "surface preparation for painting",
      "filling and sanding",
      "computerised colour matching",
      "blending paint",
      "waterborne paints",
      "operating a spray booth",
      "polishing and paint defect removal",
      "accident repairs",
      "working independently"
    ],
    tips: [
      "Describe the full scope you handle on your own: preparation, primer, colour matching, painting, polishing. The workshop is looking for someone who does not need a helper at every stage.",
      "Say which paint systems you work with and whether you know waterborne paints. If you have had manufacturer training, list it with the year, as authorised workshops often require it.",
      "Give the scale of your work, for example \"6–8 panels a day on average\" or \"full resprays and plastic parts\". It helps the employer judge whether you can keep up with their pace.",
      "If you know spot repairs (SMART repair), painting plastic parts or restoring classic cars, add them separately. These skills stand out in better-paid job ads."
    ],
    sample: {
      name: "Sebastian Borowski",
      headline: "Car painter – accident repairs",
      contact: ["+48 600 000 187", "sebastian.borowski@example.com", "Koszalin", "linkedin.com/in/sebastian-borowski-przyklad"],
      summary: "For nine years I have painted cars and vans in body and paint shops. I prepare surfaces, match colours with a spectrophotometer and colour cards, blend into adjacent panels and polish, all on my own. I have worked with waterborne paints for five years.",
      skills: [
        "Surface preparation, filling and priming",
        "Computerised colour matching and spectrophotometer use",
        "Blending into adjacent panels",
        "Waterborne basecoats and 2K clearcoats",
        "Painting plastic parts",
        "Spot repairs (SMART repair)",
        "Polishing and removing runs and dust nibs"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "Car painter",
          company: "Auto-Lak Koszalin Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Painting 6–8 panels a day on average as part of insurance accident repairs.",
            "Colour matching for cars after panel replacement, with colour rework on fewer than 3% of jobs.",
            "Training a painter's assistant in sanding and masking vehicles."
          ]
        },
        {
          title: "Painter",
          company: "Blacharstwo i Lakiernictwo Pomorze s.c.",
          period: "03.2015 – 05.2020",
          bullets: [
            "Painting car and van panels with solvent-based and waterborne paints.",
            "Preparing panels: sanding, filling, high-build primer.",
            "Polishing and preparing cars for handover to customers."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół nr 9 w Koszalinie",
        degree: "Car painter (lakiernik samochodowy), vocational school",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Should I attach photos of my work to a car painter CV?",
        a: "Not to the CV itself, but you can mention that you have a before-and-after photo portfolio to show at the interview. Some candidates add a link to an online gallery. It is a good way to show the quality of your blending and polishing, which words cannot describe."
      },
      {
        q: "How do I describe work at a small, little-known workshop?",
        a: "Give the workshop's name, town and a short profile, for example \"body and paint shop, 4 bays\". What matters most is what you did and how independently. The size of the company counts less than the scope of your tasks."
      }
    ]
  },
  "blacharz-samochodowy": {
    slugLang: "panel-beater",
    name: "Panel beater / Car body repairer",
    title: "Panel beater CV: example and tips",
    metaDescription: "A panel beater CV tailored to the job ad: an example, phrases from body shop offers and tips on describing accident repairs, jig work and welding.",
    intro: "A panel beater in a workshop handles accident repairs: stripping, straightening, replacing body panels and preparing the car for the paint shop. Job ads often require work on a repair jig with a measuring system, MIG/MAG welding and spot welding. Newer cars add aluminium repairs, bonding and riveting according to the manufacturer's method. Paintless dent removal (PDR) and preparing an initial damage estimate are often welcome.",
    keywords: [
      "accident repairs",
      "body straightening on a jig",
      "body geometry measurement",
      "replacing body panels",
      "MIG/MAG welding",
      "spot welding",
      "aluminium panel repairs",
      "paintless dent removal (PDR)",
      "working to manufacturer repair methods",
      "category B driving licence"
    ],
    tips: [
      "Say what damage you repair: small dents, sill and wing replacement, heavy damage with chassis leg straightening. The scope of work shows your level better than the number of years alone.",
      "List the equipment: repair jig, electronic measuring system, spot welder, aluminium welder, PDR kit. A workshop with similar equipment will get you up to speed faster.",
      "If you work with aluminium, structural bonding or riveting, say so clearly. These technologies are increasingly common in new cars and not every panel beater knows them.",
      "Add results: repairs per month, meeting deadlines or no complaints. A workshop owner thinks in terms of throughput, so concrete figures land best."
    ],
    sample: {
      name: "Rafał Jasiński",
      headline: "Panel beater – accident repairs",
      contact: ["+48 600 000 188", "rafal.jasinski@example.com", "Płock", "linkedin.com/in/rafal-jasinski-przyklad"],
      summary: "For eleven years I have been repairing the bodies of cars and vans after road accidents. I work on a repair jig with an electronic measuring system, weld MIG/MAG, spot weld and repair aluminium panels. I prepare cars so that the painter can start work straight away.",
      skills: [
        "Body straightening on a repair jig",
        "Electronic body geometry measurement",
        "MIG/MAG welding and spot welding",
        "Aluminium repairs, bonding and riveting",
        "Paintless dent removal (PDR)",
        "Stripping and refitting panels and trim",
        "Working to manufacturer repair documentation"
      ],
      languages: ["English A2"],
      jobs: [
        {
          title: "Panel beater",
          company: "Car-Serwis Mazowsze Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Accident repairs on 15–20 vehicles a month on average, including damage requiring chassis leg straightening on the jig.",
            "Repairing aluminium panels in a dedicated bay according to manufacturers' requirements.",
            "Helping the service adviser with the initial assessment of damage."
          ]
        },
        {
          title: "Panel beater",
          company: "Auto-Blach Płock s.c.",
          period: "05.2013 – 05.2020",
          bullets: [
            "Replacing sills, wings and door skins and repairing corrosion.",
            "Welding and spot welding body parts and protecting box sections.",
            "Preparing vehicles for painting and reassembling them after the paint shop."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Centrum Kształcenia Rolniczego w Płocku",
        degree: "Panel beater (blacharz samochodowy), vocational school",
        period: "2009 – 2012"
      }
    },
    faq: [
      {
        q: "Does a panel beater need to know estimating software?",
        a: "It is not required in every role, but it can be a big advantage, especially in smaller workshops. If you can prepare an initial estimate or have worked with damage valuation systems, add it. It shows you also understand the insurance settlement side."
      },
      {
        q: "Panel beater and painter in one – how do I describe it?",
        a: "If you do both, put \"Panel beater and painter\" in your headline and split your skills into two groups. Smaller workshops often look for exactly such a person. In larger workshops, stress the specialism the ad is for."
      }
    ]
  },
  "pakowacz": {
    slugLang: "packer",
    name: "Packer / Packing operative",
    title: "Packer CV: example and tips",
    metaDescription: "A packer and packing operative CV tailored to the job ad. An example, phrases from real offers and tips on describing work pace, quality checks and scanners.",
    intro: "Packers work in food and cosmetics plants, in manufacturing and in online shop warehouses, and job ads differ mainly in output targets and the type of goods. Employers expect accuracy, checking products before packing and following instructions, often on shifts. E-commerce warehouses add scanner use and label printing, while food plants usually require a sanitary-epidemiological medical certificate. Experience is not always needed, but describing it well clearly improves your chances.",
    keywords: [
      "packing products",
      "visual quality checks",
      "labelling",
      "using a scanner",
      "order picking",
      "palletising and stretch wrapping",
      "working to output targets",
      "production line work",
      "sanitary-epidemiological certificate",
      "shift work"
    ],
    tips: [
      "Say what you packed and how fast, for example \"packing cosmetics into shipping cartons, about 600 units per shift\". Numbers show that you can meet the target.",
      "Mention quality checks: setting aside faulty items, checking dates and prints, weighing parcels. For the employer this is as important as speed.",
      "If you have used a scanner, label printer, heat sealer or pallet wrapper, put it in your skills. Such small things often decide who gets invited first.",
      "For food work, add that you hold a valid sanitary-epidemiological certificate. It saves the employer time and lets you start sooner."
    ],
    sample: {
      name: "Monika Szewczyk",
      headline: "Packing operative – food production and e-commerce",
      contact: ["+48 600 000 189", "monika.szewczyk@example.com", "Września", "linkedin.com/in/monika-szewczyk-przyklad"],
      summary: "For four years I have worked in packing at a food plant and in an online shop warehouse. I consistently meet targets, check products before packing and use a scanner and label printer. I hold a valid sanitary-epidemiological certificate and am ready to work three shifts.",
      skills: [
        "Manual and production line packing",
        "Visual checks of products and packaging",
        "Using a scanner and label printer",
        "Picking online orders",
        "Stretch wrapping and palletising",
        "Operating a film heat sealer",
        "Valid sanitary-epidemiological certificate"
      ],
      languages: ["English A1"],
      jobs: [
        {
          title: "Packing operative",
          company: "Wielkopolskie Przetwory Smakon Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Packing jars and cartons on a production line, with a target of about 1,200 packs per shift.",
            "Checking dates, batch codes and lid seals before palletising.",
            "Wrapping pallets and marking them with logistics labels."
          ]
        },
        {
          title: "Packer",
          company: "Sklep-Paka Logistics Sp. z o.o.",
          period: "09.2019 – 05.2020",
          bullets: [
            "Packing orders for an online clothing shop, 250 parcels per shift on average.",
            "Scanning products and printing shipping labels.",
            "Reporting shortages and damaged goods to the shift supervisor."
          ]
        }
      ],
      education: {
        school: "Liceum Ogólnokształcące we Wrześni",
        degree: "Secondary education",
        period: "2015 – 2018"
      }
    },
    faq: [
      {
        q: "Do I need a CV for a packing job?",
        a: "Often yes, even if the ad is simple. A short one-page CV with your experience, availability and sanitary certificate status helps you get through selection quickly. Recruitment agencies collect CVs too, to match you to a shift and a plant."
      },
      {
        q: "What should I write if this is my first job?",
        a: "Describe casual, seasonal or family business work where accuracy and pace mattered. Add your readiness for shift work and when you can start. A short summary like \"I learn quickly and follow instructions\" is worth backing with a concrete example."
      },
      {
        q: "How do I get a sanitary-epidemiological certificate?",
        a: "It is issued by an occupational health doctor after examinations, usually on referral from the employer. Some people get it in advance so they can start work at a food plant straight away. If you have it, put it in your CV and say it is valid."
      }
    ]
  },
  "inzynier-produkcji": {
    slugLang: "production-engineer",
    name: "Production engineer",
    title: "Production engineer CV: example and tips",
    metaDescription: "A production engineer CV tailored to the job ad: an example, keywords from offers and tips on describing Lean, process launches, OEE and projects with results.",
    intro: "A production engineer makes sure processes run stably, efficiently and without unnecessary cost. Job ads repeatedly mention Lean tools (5S, SMED, Kaizen, VSM), working with indicators such as OEE and scrap, and preparing process documentation, for example PFMEA or work instructions. Companies also expect involvement in new product launches and cooperation with quality and maintenance. English at B2 level is usually required, and a Six Sigma Green Belt certificate is an advantage.",
    keywords: [
      "production process optimisation",
      "Lean Manufacturing",
      "SMED",
      "OEE",
      "PFMEA",
      "work instructions",
      "new product introduction",
      "Kaizen and continuous improvement",
      "Six Sigma Green Belt",
      "English B2"
    ],
    tips: [
      "Describe every project with a number: how much OEE rose, how much changeover time fell, how much scrap was saved. In this job, a figure is the main language of conversation with a manager.",
      "List the processes you know technically: injection moulding, stamping, assembly, machining, robotic welding. Ads often look for an engineer for a specific technology.",
      "Show the tools you use every day: PFMEA, control plan, VSM, root cause analysis, and software such as AutoCAD, SolidWorks, Minitab or an ERP production module.",
      "Describe how you work with other departments and team leaders. A production engineer implements change through people, so running Kaizen workshops or training operators is a real asset."
    ],
    sample: {
      name: "Joanna Kwiatkowska",
      headline: "Production engineer – Lean and process launches",
      contact: ["+48 600 000 190", "joanna.kwiatkowska@example.com", "Bielsko-Biała", "linkedin.com/in/joanna-kwiatkowska-przyklad"],
      summary: "Production engineer with seven years of experience in the automotive and home appliance industries. I run Lean efficiency projects, prepare process documentation and launch new products on assembly lines. I hold a Six Sigma Green Belt certificate.",
      skills: [
        "Lean Manufacturing: 5S, SMED, VSM, Kaizen",
        "OEE analysis and improvement",
        "PFMEA, control plans and work instructions",
        "Launching new products on assembly lines",
        "Six Sigma Green Belt, Minitab",
        "AutoCAD and basic SolidWorks",
        "Running workshops and training operators"
      ],
      languages: ["English B2", "German A2"],
      jobs: [
        {
          title: "Production engineer",
          company: "Beskid Automotive Systems Sp. z o.o.",
          period: "06.2020 – present",
          bullets: [
            "Raising OEE on a seat assembly line from 71% to 80% within 10 months through downtime analysis and SMED workshops.",
            "Launching three new products on assembly lines, including preparing PFMEA and work instructions.",
            "Cutting scrap in the spot-welding process by about 30% after a Six Sigma project."
          ]
        },
        {
          title: "Junior process engineer",
          company: "Domtech AGD Sp. z o.o.",
          period: "07.2017 – 05.2020",
          bullets: [
            "Preparing work instructions and standard work for a washing machine assembly line.",
            "Taking part in 5S and workstation layout projects that shortened cycle time at two stations.",
            "Collecting downtime data and preparing weekly reports for the production manager."
          ]
        }
      ],
      education: {
        school: "Akademia Techniczno-Humanistyczna w Bielsku-Białej",
        degree: "Master of Engineering (MEng), production management and engineering",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "How do I show project results if my company does not share data externally?",
        a: "Use relative values instead of amounts, for example \"changeover time cut by 35%\" or \"scrap down by about a third\". This shows the scale of the effect without disclosing financial data. At the interview, be ready to explain how you measured the result."
      },
      {
        q: "Is a Lean or Six Sigma certificate essential?",
        a: "It is usually not a must, but it clearly helps, especially at large manufacturers. The projects you have actually completed matter more. If you have a certificate, give the level (Yellow, Green, Black Belt) and describe the project you completed it with."
      }
    ]
  }
};

const UK = {
  "operator-cnc": {
    slugLang: "operator-verstativ-z-chpk",
    name: "Оператор верстатів з ЧПК",
    title: "Резюме оператора верстатів з ЧПК: зразок і поради",
    metaDescription: "Резюме оператора ЧПК під конкретну вакансію: приклад, ключові слова з оголошень і поради, як описати системи керування, налагодження верстата та вимірювання деталей.",
    intro: "Заводи, які шукають операторів ЧПК, насамперед перевіряють, на яких верстатах і системах керування ви працювали: фрезерні чи токарні, Fanuc, Sinumerik, Heidenhain. Велика різниця між людиною, яка лише встановлює деталь і натискає «пуск», і тим, хто самостійно налагоджує верстат, вводить корекції інструменту та виправляє програму. Майже в кожному оголошенні є читання технічних креслень і вимірювання штангенциркулем та мікрометром. Роботодавці зазвичай також зазначають змінний графік.",
    keywords: [
      "обслуговування верстатів з ЧПК",
      "система керування Fanuc",
      "система керування Sinumerik",
      "налагодження верстата і прив’язка деталі",
      "корекції інструменту",
      "читання технічних креслень",
      "вимірювання штангенциркулем і мікрометром",
      "знання G-коду",
      "фрезерування на ЧПК",
      "робота в три зміни"
    ],
    tips: [
      "Називайте верстати та системи керування прямо, наприклад «3-осьовий фрезерний центр, система Heidenhain TNC 640». Загальне «обслуговування ЧПК» нічого не каже рекрутеру про те, як швидко ви освоїтеся в його цеху.",
      "Розмежуйте те, що робите самі, і те, що робить технолог. Якщо ви самостійно задаєте нульові точки, вимірюєте інструмент і редагуєте програму на верстаті, напишіть це чітко, бо це підвищує вашу ставку.",
      "Вкажіть матеріали та точність, з якими працюєте: алюміній, нержавіюча сталь, допуски ±0,01 мм. Роботодавці з авіаційної чи медичної галузі шукають саме таку інформацію.",
      "Додайте вимірювальні інструменти, які знаєте (мікрометр, нутромір, висотомір, калібри), і чи заповнюєте ви карти вимірювань. Це показує, що вам важлива якість, а не лише продуктивність."
    ],
    sample: {
      name: "Paweł Wróblewski",
      headline: "Оператор-налагоджувальник фрезерних верстатів з ЧПК",
      contact: ["+48 600 000 181", "pawel.wroblewski@example.com", "Mielec", "linkedin.com/in/pawel-wroblewski-przyklad"],
      summary: "Шість років працюю на фрезерних центрах з ЧПК із системами Fanuc і Heidenhain. Самостійно налагоджую верстат під нову партію, вимірюю інструмент і вношу корекції, а деталі перевіряю за кресленням із допуском до ±0,01 мм.",
      skills: [
        "Системи керування Fanuc 0i і Heidenhain TNC 640",
        "Налагодження верстата і прив’язка деталі",
        "Вимірювання інструменту та корекції",
        "Редагування програм у G-коді на верстаті",
        "Читання технічних креслень і допусків",
        "Вимірювання мікрометром, нутроміром і висотоміром",
        "Обробка алюмінію та нержавіючої сталі"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Оператор-налагоджувальник ЧПК",
          company: "Aeromech Precyzja Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Налагодження 3- і 5-осьових фрезерних центрів під партії від 20 до 500 деталей з авіаційного алюмінію.",
            "Скорочення часу переналагодження одного верстата приблизно з 90 до 60 хвилин завдяки підготовці інструменту до завершення попередньої партії.",
            "Міжопераційний контроль і ведення карт вимірювань для клієнта з авіаційної галузі."
          ]
        },
        {
          title: "Оператор верстатів з ЧПК",
          company: "Metal-Tech Mielec Sp. z o.o.",
          period: "03.2018 – 05.2020",
          bullets: [
            "Обслуговування фрезерних верстатів з ЧПК із системою Fanuc у три зміни.",
            "Заміна зношеного інструменту та внесення розмірних корекцій після вимірювань.",
            "Зачищення задирок і вимірювання деталей штангенциркулем та мікрометром."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Mielcu",
        degree: "Технік-механік (technik mechanik)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Чи можу я як оператор без програмування писати в резюме, що знаю ЧПК?",
        a: "Так, але чесно опишіть обсяг. Напишіть, що обслуговуєте верстат, міняєте інструмент і вносите корекції, але не пишете програми з нуля. Роботодавці часто шукають саме таких людей, а розбіжність виявилася б уже першого дня біля верстата."
      },
      {
        q: "Чи варто вписувати курс програмування ЧПК?",
        a: "Варто, особливо якщо ви претендуєте на посаду оператора-налагоджувальника. Вкажіть назву курсу, кількість годин і систему керування, якої він стосувався. Якщо ви вже застосовували ці знання на роботі, допишіть це до відповідної посади."
      },
      {
        q: "Як описати роботу на кількох різних системах керування?",
        a: "Перелічіть їх у навичках, а біля посад допишіть, на чому працювали найдовше. Рекрутер швидко побачить, що ви легко переходите між верстатами, а це цінно на заводах зі змішаним парком обладнання."
      }
    ]
  },
  "slusarz": {
    slugLang: "slesar",
    name: "Слюсар",
    title: "Резюме слюсаря: зразок і поради",
    metaDescription: "Резюме слюсаря під конкретну вакансію. Приклад, фрази з оголошень і поради, як описати ручну обробку металу, монтаж конструкцій і додаткові допуски.",
    intro: "Під словом «ślusarz» у польських оголошеннях ховається дуже різна робота: від монтажу сталевих конструкцій, через механоскладальні роботи, до виготовлення поручнів і воріт. Тому в резюме треба чітко показати, в якому з цих напрямів у вас є досвід. Роботодавці зазвичай питають про читання креслень, ручну обробку (різання, свердління, нарізання різьби) та роботу з електроінструментом. Додатковою перевагою часто є зварювання MAG і допуск UDT на кран-балки.",
    keywords: [
      "ручна обробка металів",
      "читання технічних креслень",
      "монтаж сталевих конструкцій",
      "свердління та нарізання різьби",
      "робота з електроінструментом",
      "зварювання MAG як перевага",
      "допуск UDT на кран-балки",
      "вимірювання штангенциркулем",
      "механоскладальні роботи",
      "дотримання правил охорони праці (BHP)"
    ],
    tips: [
      "Почніть з того, що ви виготовляєте: сталеві конструкції, кожухи машин, поручні, конвеєри. Завод, що виробляє ангари, шукає іншого слюсаря, ніж фірма, яка обслуговує виробничі лінії.",
      "Перелічіть верстати та інструменти, з якими працюєте: стрічкова пила, вертикально-свердлильний верстат, гнучка машина, листозгинальний прес, болгарка. Саме ця конкретика вирізняє вас серед інших кандидатів.",
      "Додаткові допуски (UDT на крани чи навантажувачі, зварювальний сертифікат, SEP) впишіть в окремий розділ із терміном дії. Часто саме вони вирішують, кого запросять.",
      "Якщо працюєте за документацією, вкажіть, за якою: робочі креслення, складальні креслення, специфікації матеріалів. Самостійна робота за кресленням — одна з найчастіших вимог."
    ],
    sample: {
      name: "Grzegorz Sikora",
      headline: "Слюсар-монтажник сталевих конструкцій",
      contact: ["+48 600 000 182", "grzegorz.sikora@example.com", "Stalowa Wola", "linkedin.com/in/grzegorz-sikora-przyklad"],
      summary: "Десять років виготовляю та монтую сталеві конструкції й деталі машин за робочими кресленнями. Зварюю методом MAG, маю допуск UDT на кран-балки з керуванням з підлоги і самостійно готую елементи до монтажу.",
      skills: [
        "Читання робочих і складальних креслень",
        "Різання, свердління, нарізання різьби та зняття фасок",
        "Робота на стрічковій пилі та свердлильному верстаті",
        "Зварювання методом MAG (135)",
        "Монтаж сталевих конструкцій на болтових з’єднаннях",
        "Допуск UDT на кран-балки з керуванням з підлоги",
        "Вимірювання штангенциркулем, кутником і рівнем"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Слюсар-монтажник",
          company: "Stal-Konstrukt Stalowa Wola Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Виготовлення вузлів конструкцій ангарів і навісів за робочими кресленнями.",
            "Попереднє складання конструкцій у цеху перед відправкою клієнту та маркування елементів.",
            "Навчання двох нових працівників роботі на стрічковій пилі та правилам охорони праці на робочому місці."
          ]
        },
        {
          title: "Слюсар",
          company: "Zakład Mechaniczny Sanmet s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Виготовлення воріт, поручнів і елементів огорож на замовлення.",
            "Різання, свердління та нарізання різьби, підготовка елементів до зварювання.",
            "Монтаж готових виробів у клієнтів разом із бригадою."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 2 w Stalowej Woli",
        degree: "Слюсар (ślusarz), професійна школа",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Чи потрібен слюсарю зварювальний сертифікат?",
        a: "Не завжди, але в багатьох оголошеннях зварювання MAG є вимогою або перевагою. Якщо ви зварюєте без сертифіката, можна це написати, уточнивши обсяг, наприклад «зварювання MAG простих з’єднань». Сертифікат варто отримати, бо він розширює вибір вакансій."
      },
      {
        q: "Як написати резюме слюсаря одразу після школи без досвіду?",
        a: "Опишіть виробничу практику: на якому підприємстві, які роботи і на яких верстатах. Додайте навички зі школи, наприклад ручну обробку та читання креслень, а також курси, якщо вони є. Коротке конкретне резюме справить краще враження, ніж довгий опис рис характеру."
      }
    ]
  },
  "tokarz": {
    slugLang: "tokar",
    name: "Токар",
    title: "Резюме токаря: зразок і поради",
    metaDescription: "Резюме токаря під вакансію: зразок, ключові слова з оголошень і поради, як описати роботу на універсальних і ЧПК-верстатах, різьби та допуски.",
    intro: "Оголошення для токарів діляться на дві групи: робота на універсальних токарних верстатах, часто з виготовленням запчастин і ремонтами, та обслуговування токарних верстатів з ЧПК у серійному виробництві. Багато заводів шукають людину, яка вміє і те, і те. Роботодавці питають про нарізання різьби, роботу в допусках і самостійний вибір режимів різання. Важливий також досвід виготовлення поштучних деталей за кресленням або великих серій.",
    keywords: [
      "точіння на універсальному токарному верстаті",
      "обслуговування токарного верстата з ЧПК",
      "нарізання різьби",
      "читання технічних креслень",
      "вибір режимів різання",
      "вимірювання мікрометром",
      "робота в допусках",
      "виготовлення запасних частин",
      "заточування токарних різців",
      "поштучне та серійне виробництво"
    ],
    tips: [
      "Напишіть, на яких токарних верстатах ви працювали і які розміри деталей обробляєте, наприклад «вали довжиною до 1500 мм, діаметри до 400 мм». Завод одразу оцінить, чи впораєтеся ви з його замовленнями.",
      "Якщо нарізаєте різьбу, перелічіть її види: метрична, дюймова, трапецеїдальна. Нарізання трапецеїдальної різьби на універсальному верстаті — навичка, яку шукають багато роботодавців.",
      "Вкажіть, у яких допусках працюєте і чим вимірюєте. Квалітети посадок чи потрібна шорсткість показують, що ви розумієте креслення, а не лише керуєте верстатом.",
      "Якщо знаєте і універсальні верстати, і ЧПК, розділіть це в навичках. Для багатьох заводів таке поєднання найцінніше, бо така людина виконає і серію, і термінову ремонтну деталь."
    ],
    sample: {
      name: "Marek Pietrzak",
      headline: "Токар на універсальних верстатах і ЧПК",
      contact: ["+48 600 000 183", "marek.pietrzak@example.com", "Ostrów Wielkopolski", "linkedin.com/in/marek-pietrzak-przyklad"],
      summary: "Дванадцять років працюю токарем: спочатку на універсальних верстатах, а останні п’ять років також на токарних верстатах з ЧПК із системою Fanuc. Виготовляю запчастини за кресленням і за зразком, нарізаю метричну та трапецеїдальну різьбу, працюю з допусками до 0,02 мм.",
      skills: [
        "Точіння на універсальних верстатах (TUR, TUM)",
        "Обслуговування та налагодження токарного верстата з ЧПК Fanuc",
        "Нарізання метричної, дюймової та трапецеїдальної різьби",
        "Виготовлення деталей за зразком",
        "Вибір інструменту та режимів різання",
        "Вимірювання мікрометром, нутроміром і калібрами",
        "Заточування токарних різців"
      ],
      languages: ["німецька A2"],
      jobs: [
        {
          title: "Токар ЧПК",
          company: "Wagmech Ostrów Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Точіння валів і втулок для вузлів вагонів партіями від 50 до 300 штук.",
            "Налагодження верстата під нову партію та виготовлення першої деталі для приймання відділом якості.",
            "Виготовлення термінових запчастин на універсальному верстаті для служби технічного обслуговування."
          ]
        },
        {
          title: "Токар",
          company: "Usługi Ślusarsko-Tokarskie Kalisz-Met s.c.",
          period: "04.2012 – 05.2020",
          bullets: [
            "Виготовлення деталей для сільськогосподарських і промислових машин за зразками клієнтів.",
            "Нарізання трапецеїдальної різьби для ходових гвинтів і пресів.",
            "Вимірювання зношених деталей і підготовка ескізів для виготовлення нових."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Ostrowie Wielkopolskim",
        degree: "Оператор металорізальних верстатів (operator obrabiarek skrawających)",
        period: "2009 – 2012"
      }
    },
    faq: [
      {
        q: "Чи має токар-універсал шанс на роботу з ЧПК?",
        a: "Так, багато роботодавців охоче навчають токарів-універсалів, бо ті розуміють різання та креслення. У резюме підкресліть точність, з якою працюєте, і готовність освоїти систему керування. Якщо пройшли курс ЧПК, впишіть його навіть без виробничого досвіду."
      },
      {
        q: "Чи вписувати в резюме, що я виготовляю деталі за зразком?",
        a: "Обов’язково. Виготовити деталь без креслення, за зношеним елементом, означає виміряти її, оцінити знос і підібрати матеріал. Такі навички цінують у службах технічного обслуговування та в невеликих сервісних майстернях."
      }
    ]
  },
  "technik-utrzymania-ruchu": {
    slugLang: "tekhnik-z-obsluhovuvannia-obladnannia",
    name: "Технік з обслуговування обладнання",
    title: "Резюме техніка з обслуговування обладнання: зразок і поради",
    metaDescription: "Резюме техніка з обслуговування обладнання: приклад, ключові слова з оголошень і поради, як описати усунення аварій, огляди, допуски SEP і роботу з PLC.",
    intro: "Технік з обслуговування обладнання (utrzymanie ruchu) відповідає за те, щоб виробничі лінії простоювали якомога менше, тому в оголошеннях переважають діагностика й усунення механічних, електричних, пневматичних і гідравлічних несправностей. Дуже часто вимагають польський допуск SEP групи 1 до 1 кВ в обсязі експлуатації. Дедалі більше фірм очікують і основ PLC, принаймні зчитування станів і діагностики в TIA Portal. До цього додаються планово-попереджувальні огляди, звітність у системі CMMS і змінна робота.",
    keywords: [
      "усунення аварій обладнання",
      "діагностика механічних і електричних несправностей",
      "допуск SEP G1 до 1 кВ",
      "пневматика і гідравліка",
      "планово-попереджувальні огляди",
      "основи PLC Siemens",
      "читання електричних схем",
      "TPM",
      "система CMMS",
      "змінна робота"
    ],
    tips: [
      "Опишіть, які машини й лінії ви обслуговували: термопластавтомати, преси, пакувальні лінії, зварювальні роботи. Досвід зі схожим парком обладнання скорочує введення в роботу, і рекрутери про це питають.",
      "Допуск SEP впишіть точно: група, обсяг (експлуатація, нагляд), напруга і термін дії. «SEP G1 E до 1 кВ, чинний до 2028 р.» — саме той рядок, який шукає роботодавець.",
      "Показуйте результати, а не лише обов’язки. Скорочення середнього часу усунення аварії, менше простоїв після запровадження оглядів чи зростання OEE запам’ятовуються.",
      "Розмежуйте рівень знання PLC: зчитування й онлайн-діагностика, дрібні зміни чи самостійне програмування. Чесний опис убереже від незручної ситуації на технічній співбесіді."
    ],
    sample: {
      name: "Łukasz Wawrzyniak",
      headline: "Технік з обслуговування обладнання — механік і електрик",
      contact: ["+48 600 000 184", "lukasz.wawrzyniak@example.com", "Legnica", "linkedin.com/in/lukasz-wawrzyniak-przyklad"],
      summary: "Сім років забезпечую роботу виробничих ліній на автомобільних заводах. Усуваю механічні, електричні та пневматичні аварії, проводжу планові огляди та діагностую несправності в контролерах Siemens S7-1500 через TIA Portal. Маю допуск SEP G1 E до 1 кВ.",
      skills: [
        "Діагностика й усунення аварій виробничих ліній",
        "Допуск SEP G1 E до 1 кВ",
        "Пневматика та електропневматика",
        "Силова гідравліка",
        "Діагностика PLC Siemens S7 у TIA Portal",
        "Читання електричних і пневматичних схем",
        "Звітування про аварії в системі CMMS"
      ],
      languages: ["англійська B1"],
      jobs: [
        {
          title: "Технік з обслуговування обладнання",
          company: "Autoparts Legnica Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Усунення аварій на чотирьох роботизованих лініях контактного зварювання та складання в три зміни.",
            "Розробка чек-листа щотижневих оглядів, після чого кількість непланових простоїв на лінії за рік зменшилася приблизно на 25%.",
            "Заміна та регулювання пневмоциліндрів, клапанів та індуктивних датчиків."
          ]
        },
        {
          title: "Електромеханік",
          company: "Plastform Polkowice Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Сервісне обслуговування термопластавтоматів і маніпуляторів для знімання виливків.",
            "Заміна нагрівачів, термопар і контакторів у шафах керування.",
            "Участь у річних оглядах машин разом із сервісом виробника."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektronicznych i Samochodowych w Legnicy",
        degree: "Технік-мехатронік (technik mechatronik)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Що робити, якщо мій допуск SEP закінчився?",
        a: "Впишіть його з приміткою, до якого часу він діяв, наприклад «SEP G1 E до 1 кВ (чинний до 03.2024)», і додайте, що можете його поновити. Іспит можна скласти повторно досить швидко, а роботодавець бачить, що підготовку ви вже проходили. Не подавайте прострочений допуск як чинний."
      },
      {
        q: "Механік чи електрик — як себе представити в резюме?",
        a: "Напишіть, що є вашою сильною стороною, але покажіть і другу сферу, якщо ви її знаєте. Багато фірм шукають «універсальних» техніків, і в заголовку добре працює, наприклад, «Технік з обслуговування — механік із допуском SEP». Оголошення зазвичай прямо каже, якого профілю бракує в команді."
      },
      {
        q: "Чи згадувати в резюме змінну роботу і роботу у вихідні?",
        a: "Якщо оголошення про це згадує, варто одним реченням підтвердити готовність працювати в три зміни або чергувати. Для служби обслуговування це важливо, бо графік має забезпечити людей на кожній зміні."
      }
    ]
  },
  "kontroler-jakosci": {
    slugLang: "kontroler-yakosti",
    name: "Контролер якості",
    title: "Резюме контролера якості: зразок і поради",
    metaDescription: "Резюме контролера якості під вакансію: приклад, ключові слова з оголошень і поради, як описати вимірювання, звіти про невідповідності та знання стандартів ISO.",
    intro: "Контролер якості перевіряє вироби на вході, під час виробництва та перед відвантаженням, тому в оголошеннях найважливіші вимірювання й сумлінна документація. Роботодавці питають про вимірювальні інструменти, читання креслень з допусками, візуальний контроль за еталонами та ведення звітів про невідповідності. В автомобільній галузі додається знання вимог IATF 16949 та інструментів якості, як-от 8D чи 5 Why. Перевагою є робота на координатно-вимірювальній машині (CMM).",
    keywords: [
      "контроль якості виробів",
      "вимірювання вимірювальними інструментами",
      "читання технічних креслень",
      "візуальний контроль",
      "звіти про невідповідності",
      "стандарт ISO 9001",
      "IATF 16949",
      "звіт 8D",
      "координатно-вимірювальна машина CMM",
      "контроль першої деталі"
    ],
    tips: [
      "Перелічіть конкретні інструменти, якими користуєтеся: штангенциркуль, мікрометр, висотомір, калібри, CMM, профілометр. Рекрутер порівнює цей список з обладнанням свого відділу якості.",
      "Напишіть, на якому етапі контролюєте: вхідний контроль, міжопераційний, кінцевий, аудит продукції. Кожен етап потребує трохи інших навичок.",
      "Покажіть, що ви не лише виявляєте дефекти, а й допомагаєте їх усувати. Участь у звітах 8D, аналізі причин чи рекламаціях клієнтів — найсильніші пункти резюме контролера.",
      "Вкажіть галузь і стандарти, з якими працювали: ISO 9001, IATF 16949, вимоги клієнтів. В автомобільній та авіаційній галузі це часто умова запрошення на співбесіду."
    ],
    sample: {
      name: "Katarzyna Mazurek",
      headline: "Контролер якості в автомобільній галузі",
      contact: ["+48 600 000 185", "katarzyna.mazurek@example.com", "Tychy", "linkedin.com/in/katarzyna-mazurek-przyklad"],
      summary: "П’ять років контролюю металеві та пластикові деталі для клієнтів з автомобільної галузі. Виконую вимірювання ручними інструментами та на координатно-вимірювальній машині, веду звіти про невідповідності й беру участь в аналізах 8D. Працюю відповідно до вимог IATF 16949.",
      skills: [
        "Вимірювання штангенциркулем, мікрометром і висотоміром",
        "Робота на координатно-вимірювальній машині (CMM)",
        "Читання креслень і геометричних допусків",
        "Візуальний контроль за граничними зразками",
        "Звіти про невідповідності та участь у 8D",
        "Знання вимог IATF 16949 та ISO 9001",
        "Контроль першої деталі (FAI)"
      ],
      languages: ["англійська B1"],
      jobs: [
        {
          title: "Контролер якості",
          company: "Silesia Components Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Контроль першої та останньої деталі для 12 ліній штампування та зварювання елементів кузова.",
            "Вимірювання на координатно-вимірювальній машині та підготовка звітів для клієнта.",
            "Участь у семи аналізах 8D, зокрема підготовка інструкції візуального контролю після рекламації клієнта."
          ]
        },
        {
          title: "Контролер якості — вхідний контроль",
          company: "Plastimex Bieruń Sp. z o.o.",
          period: "04.2019 – 05.2020",
          bullets: [
            "Вхідний контроль виливків і компонентів від постачальників згідно з планом контролю.",
            "Блокування невідповідних партій і подання рекламацій постачальникам.",
            "Ведення реєстру результатів контролю в Excel."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska, Wydział Mechaniczny Technologiczny",
        degree: "Інженер (бакалавр), спеціальність: управління та інженерія виробництва",
        period: "2015 – 2019"
      }
    },
    faq: [
      {
        q: "Чи маю я шанс на роботу в контролі якості без досвіду на CMM?",
        a: "Так, багато посад контролера ґрунтуються на ручних інструментах і візуальному контролі. У резюме покажіть точність, знання креслень і досвід роботи з документацією. Якщо проходили навчання з CMM, впишіть його, навіть якщо ще не працювали на машині самостійно."
      },
      {
        q: "Як описати навчання з інструментів якості?",
        a: "Зробіть окремий розділ «Навчання» і вкажіть назву та рік, наприклад «Методологія 8D і 5 Why, 2023» або «Вимоги IATF 16949, 2022». Біля посади допишіть, як ви ці знання застосовуєте, бо саме навчання без практики важить менше."
      }
    ]
  },
  "automatyk": {
    slugLang: "fakhivets-z-avtomatyzatsii",
    name: "Автоматник / Фахівець з автоматизації",
    title: "Резюме фахівця з автоматизації: зразок і поради",
    metaDescription: "Резюме фахівця з автоматизації під вакансію. Зразок, ключові слова з оголошень і поради, як описати програмування PLC, HMI, пусконалагодження і допуски SEP.",
    intro: "Фахівці з автоматизації працюють як у службах технічного обслуговування, так і в фірмах-інтеграторах, які будують і запускають нові лінії. В оголошеннях найчастіше повторюються контролери Siemens S7 з TIA Portal, панелі HMI, частотні перетворювачі, читання й створення електричних схем і польські допуски SEP. Інтегратори додатково питають про пусконалагодження в клієнта, часто за кордоном, і роботу з промисловими роботами. Варто показати, в яких проєктах ви брали участь і що саме робили.",
    keywords: [
      "програмування контролерів PLC",
      "Siemens TIA Portal",
      "візуалізація HMI",
      "системи SCADA",
      "налаштування частотних перетворювачів",
      "допуски SEP E і D до 1 кВ",
      "читання та створення електричних схем",
      "пусконалагодження машин у клієнта",
      "промислова робототехніка",
      "промислові мережі Profinet"
    ],
    tips: [
      "Вкажіть платформи, на яких програмуєте, і рівень: Siemens S7-1200/1500, Allen-Bradley, Beckhoff. Біля кожної можна дописати мови (LAD, FBD, SCL), бо технічні рекрутери фільтрують кандидатів саме за ними.",
      "Описуйте проєкти: тип машини чи лінії, кількість входів/виходів, вашу роль і країну запуску. «Пусконалагодження лінії палетизації з двома роботами в Чехії» каже більше, ніж «запуск машин».",
      "Допуски SEP впишіть із групою та обсягом (експлуатація і нагляд). У фірмах-інтеграторах важлива також готовність до відряджень і посвідчення водія категорії B.",
      "Якщо знаєте EPLAN, безпеку машин (наприклад, стандарт PN-EN ISO 13849) або роботи конкретного виробника, додайте це окремо. Це рідші навички, які помітно підвищують цінність резюме."
    ],
    sample: {
      name: "Michał Kaczmarczyk",
      headline: "Фахівець з автоматизації — програміст PLC і HMI",
      contact: ["+48 600 000 186", "michal.kaczmarczyk@example.com", "Gliwice", "linkedin.com/in/michal-kaczmarczyk-przyklad"],
      summary: "Фахівець з автоматизації з шестирічним досвідом програмування контролерів Siemens і запуску складальних та палетизаційних ліній. Створюю програми PLC у TIA Portal, візуалізації HMI і налаштовую частотні перетворювачі. Запускав машини в Польщі, Чехії та Німеччині.",
      skills: [
        "Siemens S7-1200/1500, TIA Portal (LAD, SCL)",
        "Панелі HMI Siemens Comfort і Unified",
        "Налаштування частотних перетворювачів і сервоприводів",
        "Мережі Profinet і Profibus",
        "Інтеграція промислових роботів з PLC",
        "Електричні схеми в EPLAN",
        "Допуски SEP G1 E і D до 1 кВ"
      ],
      languages: ["англійська B2", "німецька A2"],
      jobs: [
        {
          title: "Фахівець з автоматизації — програміст PLC",
          company: "Integra-Tech Automation Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Програмування PLC і HMI для 14 машин і ліній, зокрема лінії палетизації з двома роботами.",
            "Пусконалагодження в клієнтів у Польщі, Чехії та Німеччині, загалом близько 30 тижнів відряджень на рік.",
            "Створення бібліотеки стандартних функціональних блоків, яка скоротила написання програми для типової машини на кілька днів."
          ]
        },
        {
          title: "Електрик-автоматник служби обслуговування",
          company: "Glass-Pak Gliwice Sp. z o.o.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Діагностика й усунення несправностей систем керування на пакувальних лініях.",
            "Внесення дрібних змін у програми PLC за погодженням із керівником відділу.",
            "Заміна та параметризація частотних перетворювачів і датчиків."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska, Wydział Automatyki, Elektroniki i Informatyki",
        degree: "Інженер (бакалавр), спеціальність: автоматизація та робототехніка",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "Як показати в резюме проєкти, що є комерційною таємницею клієнта?",
        a: "Не вказуйте назву клієнта, лише галузь і тип рішення, наприклад «лінія складання вузлів для виробника побутової техніки, 12 станцій, 2 роботи». Цього достатньо, щоб показати масштаб і вашу роль. Подробиці можна обговорити на співбесіді в межах, які дозволяє договір."
      },
      {
        q: "Чи варто вписувати контролери, які я знаю лише з курсу?",
        a: "Так, але позначте рівень, наприклад «Allen-Bradley — основи, курс 40 год». Рекрутер цінує чесність, а така навичка може переважити при схожих кандидатах. Тільки не ставте її на один рівень із платформою, на якій працюєте щодня."
      },
      {
        q: "Чи потрібні фахівцю з автоматизації допуски SEP?",
        a: "У більшості оголошень вони обов’язкові або бажані, бо робота пов’язана з електрообладнанням. Найчастіше йдеться про групу 1 до 1 кВ, а на посадах з відповідальністю за інших — також про обсяг нагляду. Якщо їх немає, напишіть, що готові їх отримати."
      }
    ]
  },
  "lakiernik": {
    slugLang: "avtomaliar",
    name: "Автомаляр",
    title: "Резюме автомаляра: зразок і поради",
    metaDescription: "Резюме автомаляра під вакансію: приклад, ключові слова з оголошень СТО і поради, як описати підготовку поверхні, підбір кольору та переходи фарби.",
    intro: "Кузовно-малярні СТО в оголошеннях шукають малярів, які самостійно проведуть увесь процес: від підготовки поверхні та шпаклювання, через ґрунт, до фарбування в камері й полірування. Особливо цінують точний підбір кольору та фарбування з переходом на сусідні елементи, бо від цього залежить, чи помітить клієнт ремонт. Дедалі частіше вимагають роботи з фарбами на водній основі. Авторизовані сервіси додатково питають про навчання від виробників фарб.",
    keywords: [
      "фарбування автомобілів",
      "підготовка поверхні до фарбування",
      "шпаклювання та шліфування",
      "комп’ютерний підбір кольору",
      "фарбування з переходом",
      "фарби на водній основі",
      "робота у фарбувальній камері",
      "полірування та усунення дефектів лакофарбового покриття",
      "післяаварійний ремонт",
      "самостійна робота"
    ],
    tips: [
      "Опишіть увесь обсяг, який виконуєте самостійно: підготовка, ґрунт, підбір кольору, фарбування, полірування. Сервіс шукає людину, якій не потрібен помічник на кожному етапі.",
      "Напишіть, з якими лакофарбовими системами працюєте і чи знаєте фарби на водній основі. Якщо проходили навчання від виробника фарб, впишіть його з роком, бо авторизовані сервіси часто цього вимагають.",
      "Вкажіть масштаб роботи, наприклад «у середньому 6–8 елементів на день» або «повне фарбування авто та пластикових деталей». Це допомагає оцінити, чи впораєтеся ви з темпом конкретного сервісу.",
      "Якщо знаєте локальний ремонт (SMART repair), фарбування пластику чи реставрацію ретроавтомобілів, додайте це окремо. Ці навички вирізняють в оголошеннях з вищою ставкою."
    ],
    sample: {
      name: "Sebastian Borowski",
      headline: "Автомаляр — післяаварійний ремонт",
      contact: ["+48 600 000 187", "sebastian.borowski@example.com", "Koszalin", "linkedin.com/in/sebastian-borowski-przyklad"],
      summary: "Дев’ять років фарбую легкові та комерційні автомобілі в кузовно-малярних сервісах. Самостійно готую поверхню, підбираю колір спектрофотометром і за віялами кольорів, фарбую з переходом на сусідні елементи та полірую. П’ять років працюю з фарбами на водній основі.",
      skills: [
        "Підготовка поверхні, шпаклювання та ґрунтування",
        "Комп’ютерний підбір кольору та робота зі спектрофотометром",
        "Фарбування з переходом на сусідні елементи",
        "Базові фарби на водній основі та лаки 2K",
        "Фарбування пластикових деталей",
        "Локальний ремонт (SMART repair)",
        "Полірування та усунення патьоків і включень"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Автомаляр",
          company: "Auto-Lak Koszalin Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Фарбування в середньому 6–8 елементів на день у межах страхових післяаварійних ремонтів.",
            "Підбір кольору для авто після заміни елементів, із переробками за кольором менш ніж у 3% замовлень.",
            "Навчання помічника маляра шліфуванню та маскуванню автомобілів."
          ]
        },
        {
          title: "Маляр",
          company: "Blacharstwo i Lakiernictwo Pomorze s.c.",
          period: "03.2015 – 05.2020",
          bullets: [
            "Фарбування елементів легкових і комерційних авто фарбами на розчинниках і на водній основі.",
            "Підготовка елементів: шліфування, шпаклювання, ґрунт-наповнювач.",
            "Полірування та підготовка авто до видачі клієнту."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół nr 9 w Koszalinie",
        degree: "Автомаляр (lakiernik samochodowy), професійна школа",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Чи варто додавати фото своїх робіт до резюме автомаляра?",
        a: "До самого резюме — ні, але можна дописати, що маєте портфоліо фото «до і після» і покажете його на співбесіді. Деякі кандидати додають посилання на онлайн-галерею. Це добрий спосіб показати якість переходів і полірування, яку важко описати словами."
      },
      {
        q: "Як описати роботу в маленькій майстерні, яку ніхто не знає?",
        a: "Вкажіть назву майстерні, місто і коротко її профіль, наприклад «кузовно-малярний сервіс, 4 пости». Найважливіше — що ви робили і наскільки самостійно. Розмір фірми важить менше, ніж обсяг ваших завдань."
      }
    ]
  },
  "blacharz-samochodowy": {
    slugLang: "avtobliakhar",
    name: "Автобляхар / Рихтувальник",
    title: "Резюме автобляхаря: зразок і поради",
    metaDescription: "Резюме автобляхаря під вакансію: зразок, фрази з оголошень СТО і поради, як описати післяаварійний ремонт, роботу на стапелі та зварювання.",
    intro: "Автобляхар у сервісі відповідає за післяаварійний ремонт: розбирання, рихтування, заміну елементів кузова та підготовку авто до фарбування. В оголошеннях часто вимагають роботи на стапелі з вимірювальною системою, зварювання MIG/MAG і контактного точкового зварювання. На новіших авто додаються ремонт алюмінію, склеювання та клепання за технологією виробника. Бажаним буває вміння видаляти вм’ятини без фарбування (PDR) і готувати попередню оцінку пошкоджень.",
    keywords: [
      "післяаварійний ремонт",
      "рихтування кузова на стапелі",
      "вимірювання геометрії кузова",
      "заміна елементів кузова",
      "зварювання MIG/MAG",
      "контактне точкове зварювання",
      "ремонт алюмінієвих елементів",
      "видалення вм’ятин без фарбування (PDR)",
      "робота за технологією виробника",
      "посвідчення водія категорії B"
    ],
    tips: [
      "Напишіть, які пошкодження ви ремонтуєте: дрібні вм’ятини, заміна порогів і крил, важкі пошкодження з витягуванням лонжеронів. Обсяг робіт показує ваш рівень краще, ніж сама кількість років досвіду.",
      "Перелічіть обладнання: стапель, електронна вимірювальна система, апарат точкового зварювання, зварювальний апарат для алюмінію, набір PDR. Сервіс зі схожим обладнанням швидше введе вас у роботу.",
      "Якщо працюєте з алюмінієм, структурним склеюванням чи клепанням, напишіть це чітко. Ці технології дедалі частіше трапляються в нових авто, і не кожен бляхар їх знає.",
      "Додайте результати: кількість ремонтів на місяць, дотримання термінів чи відсутність рекламацій. Власник сервісу мислить пропускною здатністю майстерні, тож конкретні цифри переконують найкраще."
    ],
    sample: {
      name: "Rafał Jasiński",
      headline: "Автобляхар — післяаварійний ремонт",
      contact: ["+48 600 000 188", "rafal.jasinski@example.com", "Płock", "linkedin.com/in/rafal-jasinski-przyklad"],
      summary: "Одинадцять років ремонтую кузови легкових і комерційних авто після ДТП. Працюю на стапелі з електронною вимірювальною системою, зварюю MIG/MAG, виконую точкове зварювання та ремонтую алюмінієві елементи. Готую авто так, щоб маляр міг одразу почати роботу.",
      skills: [
        "Рихтування кузова на стапелі",
        "Електронне вимірювання геометрії кузова",
        "Зварювання MIG/MAG і точкове зварювання",
        "Ремонт алюмінію, склеювання та клепання",
        "Видалення вм’ятин без фарбування (PDR)",
        "Демонтаж і монтаж елементів та навісного обладнання",
        "Робота за ремонтною документацією виробника"
      ],
      languages: ["англійська A2"],
      jobs: [
        {
          title: "Автобляхар",
          company: "Car-Serwis Mazowsze Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Післяаварійний ремонт у середньому 15–20 авто на місяць, зокрема з витягуванням лонжеронів на стапелі.",
            "Ремонт алюмінієвих елементів на окремому посту відповідно до вимог виробників.",
            "Допомога сервісному консультанту в попередній оцінці обсягу пошкоджень."
          ]
        },
        {
          title: "Бляхар",
          company: "Auto-Blach Płock s.c.",
          period: "05.2013 – 05.2020",
          bullets: [
            "Заміна порогів, крил і зовнішніх панелей дверей, ремонт корозії.",
            "Зварювання й точкове зварювання елементів кузова та антикорозійна обробка прихованих порожнин.",
            "Підготовка авто до фарбування та повторне складання після малярні."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Centrum Kształcenia Rolniczego w Płocku",
        degree: "Автобляхар (blacharz samochodowy), професійна школа",
        period: "2009 – 2012"
      }
    },
    faq: [
      {
        q: "Чи потрібне автобляхарю знання програм для кошторисів?",
        a: "Не на кожній посаді, але це може бути великою перевагою, особливо в менших сервісах. Якщо вмієте скласти попередній кошторис або працювали із системами оцінки збитків, допишіть це. Так ви показуєте, що розумієте й розрахунки зі страховиком."
      },
      {
        q: "Бляхар і маляр в одній особі — як це описати?",
        a: "Якщо виконуєте обидва види робіт, напишіть у заголовку «Бляхар-маляр» і розділіть навички на дві групи. Менші майстерні часто шукають саме таку людину. У великих сервісах підкресліть ту спеціалізацію, на яку відкрита вакансія."
      }
    ]
  },
  "pakowacz": {
    slugLang: "pakuvalnyk",
    name: "Пакувальник / Працівник пакування",
    title: "Резюме пакувальника: зразок і поради",
    metaDescription: "Резюме пакувальника під вакансію. Приклад, фрази з оголошень і поради, як описати темп роботи, контроль якості та роботу зі сканером.",
    intro: "Пакувальники працюють на харчових і косметичних виробництвах, на заводах і в складах інтернет-магазинів, а оголошення відрізняються переважно нормою виробітку та видом товару. Роботодавці очікують акуратності, перевірки виробів перед пакуванням і роботи за інструкцією, часто позмінно. На складах e-commerce додається робота зі сканером і друк етикеток, а на харчових підприємствах зазвичай потрібен санітарно-епідеміологічний висновок (orzeczenie sanitarno-epidemiologiczne). Досвід не завжди обов’язковий, але добре описаний помітно підвищує шанси.",
    keywords: [
      "пакування продукції",
      "візуальний контроль якості",
      "етикетування",
      "робота зі сканером",
      "комплектація замовлень",
      "палетизація та обмотування стрейч-плівкою",
      "робота з нормою виробітку",
      "робота на виробничій лінії",
      "санітарно-епідеміологічний висновок",
      "змінна робота"
    ],
    tips: [
      "Напишіть, що ви пакували і в якому темпі, наприклад «пакування косметики в транспортні коробки, близько 600 штук за зміну». Цифри показують, що ви впораєтеся з нормою.",
      "Згадайте контроль якості: відкладання бракованих виробів, перевірка дат і маркування, зважування посилок. Для роботодавця це так само важливо, як швидкість.",
      "Якщо працювали зі сканером, принтером етикеток, запаювачем чи палетообмотувачем, впишіть це в навички. Такі дрібниці часто вирішують, кого запросять першим.",
      "Для роботи з харчовими продуктами допишіть, що маєте чинний санітарно-епідеміологічний висновок. Ви заощаджуєте час роботодавцю і можете почати швидше."
    ],
    sample: {
      name: "Monika Szewczyk",
      headline: "Працівниця пакування — харчове виробництво та e-commerce",
      contact: ["+48 600 000 189", "monika.szewczyk@example.com", "Września", "linkedin.com/in/monika-szewczyk-przyklad"],
      summary: "Чотири роки працюю на пакуванні на харчовому підприємстві та на складі інтернет-магазину. Регулярно виконую норму, перевіряю продукцію перед пакуванням і працюю зі сканером та принтером етикеток. Маю чинний санітарно-епідеміологічний висновок і готова працювати в три зміни.",
      skills: [
        "Ручне пакування та пакування на виробничій лінії",
        "Візуальний контроль продукції та упаковки",
        "Робота зі сканером і принтером етикеток",
        "Комплектація інтернет-замовлень",
        "Обмотування плівкою та палетизація",
        "Робота із запаювачем плівки",
        "Чинний санітарно-епідеміологічний висновок"
      ],
      languages: ["англійська A1"],
      jobs: [
        {
          title: "Працівниця пакування",
          company: "Wielkopolskie Przetwory Smakon Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Пакування банок і коробок на виробничій лінії з нормою близько 1200 упаковок за зміну.",
            "Перевірка дат, кодів партій і герметичності кришок перед палетизацією.",
            "Обмотування палет плівкою та маркування їх логістичними етикетками."
          ]
        },
        {
          title: "Пакувальниця",
          company: "Sklep-Paka Logistics Sp. z o.o.",
          period: "09.2019 – 05.2020",
          bullets: [
            "Пакування замовлень інтернет-магазину одягу, у середньому 250 посилок за зміну.",
            "Сканування товарів і друк транспортних етикеток.",
            "Повідомлення начальника зміни про нестачі та пошкоджений товар."
          ]
        }
      ],
      education: {
        school: "Liceum Ogólnokształcące we Wrześni",
        degree: "Повна загальна середня освіта",
        period: "2015 – 2018"
      }
    },
    faq: [
      {
        q: "Чи потрібне резюме для роботи на пакуванні?",
        a: "Часто так, навіть якщо оголошення просте. Коротке резюме на одну сторінку з досвідом, доступністю та інформацією про санітарний висновок допомагає швидко пройти відбір. Кадрові агенції теж їх збирають, щоб підібрати вам зміну та підприємство."
      },
      {
        q: "Що писати, якщо це моя перша робота?",
        a: "Опишіть підробітки, сезонну роботу чи допомогу в сімейній фірмі, де важили акуратність і темп. Додайте готовність до змінної роботи та дату, з якої можете почати. Коротке резюме на кшталт «швидко навчаюся і працюю за інструкцією» варто підкріпити конкретним прикладом."
      },
      {
        q: "Як отримати санітарно-епідеміологічний висновок?",
        a: "Його видає лікар з медицини праці на підставі обстежень, зазвичай за направленням від роботодавця. Деякі люди оформлюють його заздалегідь, щоб одразу почати роботу на харчовому підприємстві. Якщо він у вас є, впишіть це в резюме з поміткою, що він чинний."
      }
    ]
  },
  "inzynier-produkcji": {
    slugLang: "inzhener-vyrobnytstva",
    name: "Інженер з виробництва",
    title: "Резюме інженера з виробництва: зразок і поради",
    metaDescription: "Резюме інженера з виробництва під вакансію: зразок, ключові слова з оголошень і поради, як описати Lean, впровадження процесів, OEE і проєкти з результатами.",
    intro: "Інженер з виробництва відповідає за те, щоб процеси працювали стабільно, ефективно і без зайвих витрат. В оголошеннях повторюються інструменти Lean (5S, SMED, Kaizen, VSM), робота з показниками, як-от OEE і брак, та підготовка технологічної документації, наприклад PFMEA чи робочих інструкцій. Фірми також очікують участі у впровадженні нових виробів і співпраці з відділами якості та обслуговування обладнання. Зазвичай потрібна англійська на рівні B2, а перевагою є сертифікат Six Sigma Green Belt.",
    keywords: [
      "оптимізація виробничих процесів",
      "Lean Manufacturing",
      "SMED",
      "показник OEE",
      "PFMEA",
      "робочі інструкції",
      "впровадження нових виробів",
      "Kaizen і безперервне вдосконалення",
      "Six Sigma Green Belt",
      "англійська B2"
    ],
    tips: [
      "Кожен проєкт описуйте цифрою: наскільки зріс OEE, наскільки скоротився час переналагодження, скільки заощадили на браку. У цій професії цифра — головна мова розмови з менеджером.",
      "Перелічіть процеси, які знаєте з технічного боку: лиття під тиском, штампування, складання, механічна обробка, роботизоване зварювання. Оголошення часто шукають інженера під конкретну технологію.",
      "Покажіть інструменти, якими користуєтеся щодня: PFMEA, план контролю, VSM, аналіз першопричин, а з програм — наприклад AutoCAD, SolidWorks, Minitab або виробничий модуль ERP.",
      "Опишіть співпрацю з іншими відділами та бригадирами. Інженер з виробництва впроваджує зміни через людей, тож уміння провести воркшоп Kaizen чи навчити операторів — вагома перевага."
    ],
    sample: {
      name: "Joanna Kwiatkowska",
      headline: "Інженерка з виробництва — Lean і впровадження процесів",
      contact: ["+48 600 000 190", "joanna.kwiatkowska@example.com", "Bielsko-Biała", "linkedin.com/in/joanna-kwiatkowska-przyklad"],
      summary: "Інженерка з виробництва із семирічним досвідом в автомобільній галузі та виробництві побутової техніки. Веду проєкти підвищення ефективності з використанням Lean, готую технологічну документацію та впроваджую нові вироби на складальних лініях. Маю сертифікат Six Sigma Green Belt.",
      skills: [
        "Lean Manufacturing: 5S, SMED, VSM, Kaizen",
        "Аналіз і покращення показника OEE",
        "PFMEA, плани контролю та робочі інструкції",
        "Впровадження нових виробів на складальних лініях",
        "Six Sigma Green Belt, Minitab",
        "AutoCAD і основи SolidWorks",
        "Проведення воркшопів і навчання операторів"
      ],
      languages: ["англійська B2", "німецька A2"],
      jobs: [
        {
          title: "Інженерка з виробництва",
          company: "Beskid Automotive Systems Sp. z o.o.",
          period: "06.2020 – дотепер",
          bullets: [
            "Зростання OEE на лінії складання автомобільних сидінь з 71% до 80% за 10 місяців завдяки аналізу простоїв і воркшопам SMED.",
            "Впровадження трьох нових виробів на складальних лініях, зокрема підготовка PFMEA та робочих інструкцій.",
            "Зниження браку в процесі контактного зварювання приблизно на 30% після проєкту Six Sigma."
          ]
        },
        {
          title: "Молодша інженерка-технологиня",
          company: "Domtech AGD Sp. z o.o.",
          period: "07.2017 – 05.2020",
          bullets: [
            "Підготовка робочих інструкцій і стандартів роботи для лінії складання пральних машин.",
            "Участь у проєктах 5S і реорганізації робочих місць, які скоротили час циклу на двох станціях.",
            "Збір даних про простої та підготовка щотижневих звітів для начальника виробництва."
          ]
        }
      ],
      education: {
        school: "Akademia Techniczno-Humanistyczna w Bielsku-Białej",
        degree: "Магістр-інженер, спеціальність: управління та інженерія виробництва",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Як показати результати проєктів, якщо фірма не розголошує дані?",
        a: "Використовуйте відносні значення замість сум, наприклад «скорочення часу переналагодження на 35%» або «зменшення браку приблизно на третину». Це показує масштаб ефекту без розкриття фінансових даних. На співбесіді будьте готові розповісти, як ви вимірювали результат."
      },
      {
        q: "Чи обов’язковий сертифікат Lean або Six Sigma?",
        a: "Зазвичай це не обов’язкова умова, але він помітно допомагає, особливо у великих виробничих компаніях. Важливіші проєкти, які ви справді провели. Якщо маєте сертифікат, вкажіть рівень (Yellow, Green, Black Belt) і опишіть проєкт, яким його завершили."
      }
    ]
  }
};

const DE = {
  "operator-cnc": {
    slugLang: "cnc-maschinenbediener",
    name: "CNC-Maschinenbediener/in",
    title: "Lebenslauf CNC-Maschinenbediener: Muster und Tipps",
    metaDescription: "Lebenslauf als CNC-Maschinenbediener passend zur Stellenanzeige: Muster, Schlüsselbegriffe aus Angeboten und Tipps zu Steuerungen, Einrichten und Messen.",
    intro: "Betriebe, die CNC-Bediener suchen, prüfen zuerst, an welchen Maschinen und Steuerungen Sie gearbeitet haben: Fräs- oder Drehmaschinen, Fanuc, Sinumerik, Heidenhain. Es ist ein großer Unterschied, ob jemand nur Teile einlegt und auf Start drückt oder die Maschine selbst einrichtet, Werkzeugkorrekturen eingibt und das Programm anpasst. Fast jede Anzeige nennt das Lesen technischer Zeichnungen und Messen mit Messschieber und Bügelmessschraube. Meist wird auch Schichtarbeit erwähnt.",
    keywords: [
      "Bedienung von CNC-Maschinen",
      "Fanuc-Steuerung",
      "Sinumerik-Steuerung",
      "Einrichten der Maschine und Nullpunkt setzen",
      "Werkzeugkorrekturen",
      "Lesen technischer Zeichnungen",
      "Messen mit Messschieber und Bügelmessschraube",
      "G-Code-Kenntnisse",
      "CNC-Fräsen",
      "Arbeit im Dreischichtsystem"
    ],
    tips: [
      "Nennen Sie Maschinen und Steuerungen direkt, etwa „3-Achs-Bearbeitungszentrum, Steuerung Heidenhain TNC 640“. Ein allgemeines „CNC-Bedienung“ sagt dem Personaler nichts darüber, wie schnell Sie sich in seiner Halle einarbeiten.",
      "Trennen Sie, was Sie selbst erledigen und was der Technologe macht. Wenn Sie Nullpunkte setzen, Werkzeuge vermessen und das Programm an der Maschine ändern, schreiben Sie das klar, denn es hebt Ihren Stundenlohn.",
      "Geben Sie Werkstoffe und Genauigkeiten an: Aluminium, Edelstahl, Toleranzen von ±0,01 mm. Arbeitgeber aus Luftfahrt oder Medizintechnik suchen genau diese Angaben.",
      "Ergänzen Sie die Messmittel, die Sie beherrschen (Bügelmessschraube, Innenmessgerät, Höhenmessgerät, Lehren), und ob Sie Messprotokolle führen. Das zeigt, dass Ihnen Qualität wichtig ist, nicht nur Stückzahl."
    ],
    sample: {
      name: "Paweł Wróblewski",
      headline: "CNC-Fräser – Bediener und Einrichter",
      contact: ["+48 600 000 181", "pawel.wroblewski@example.com", "Mielec", "linkedin.com/in/pawel-wroblewski-przyklad"],
      summary: "Seit sechs Jahren arbeite ich an CNC-Bearbeitungszentren mit Fanuc- und Heidenhain-Steuerung. Ich richte die Maschine selbstständig für neue Serien ein, vermesse Werkzeuge, gebe Korrekturen ein und prüfe Teile nach Zeichnung mit Toleranzen bis ±0,01 mm.",
      skills: [
        "Steuerungen Fanuc 0i und Heidenhain TNC 640",
        "Einrichten der Maschine und Nullpunkt setzen",
        "Werkzeugvermessung und Werkzeugkorrekturen",
        "Ändern von G-Code-Programmen an der Maschine",
        "Lesen technischer Zeichnungen und Toleranzen",
        "Messen mit Bügelmessschraube, Innen- und Höhenmessgerät",
        "Bearbeitung von Aluminium und Edelstahl"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "CNC-Bediener und Einrichter",
          company: "Aeromech Precyzja Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Einrichten von 3- und 5-Achs-Bearbeitungszentren für Serien von 20 bis 500 Teilen aus Luftfahrt-Aluminium.",
            "Verkürzung der Rüstzeit an einer Maschine von etwa 90 auf 60 Minuten durch Vorbereitung der Werkzeuge vor Ende der vorherigen Serie.",
            "Zwischenprüfung und Führung von Messprotokollen für einen Kunden aus der Luftfahrt."
          ]
        },
        {
          title: "CNC-Maschinenbediener",
          company: "Metal-Tech Mielec Sp. z o.o.",
          period: "03.2018 – 05.2020",
          bullets: [
            "Bedienung von CNC-Fräsmaschinen mit Fanuc-Steuerung im Dreischichtsystem.",
            "Austausch verschlissener Werkzeuge und Eingabe von Maßkorrekturen nach der Messung.",
            "Entgraten und Messen von Teilen mit Messschieber und Bügelmessschraube."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Mielcu",
        degree: "Maschinenbautechniker (technik mechanik)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Darf ich als Bediener ohne Programmierkenntnisse schreiben, dass ich CNC kann?",
        a: "Ja, aber beschreiben Sie den Umfang ehrlich. Schreiben Sie, dass Sie die Maschine bedienen, Werkzeuge wechseln und Korrekturen eingeben, aber keine Programme von Grund auf schreiben. Arbeitgeber suchen oft genau solche Leute, und eine Abweichung würde am ersten Tag an der Maschine auffallen."
      },
      {
        q: "Lohnt es sich, einen CNC-Programmierkurs anzugeben?",
        a: "Ja, vor allem wenn Sie eine Stelle als Einrichter anstreben. Nennen Sie Kursname, Stundenzahl und die behandelte Steuerung. Wenn Sie das Wissen schon im Job angewendet haben, ergänzen Sie es bei der jeweiligen Stelle."
      },
      {
        q: "Wie beschreibe ich Erfahrung mit mehreren Steuerungen?",
        a: "Führen Sie sie bei den Kenntnissen auf und ergänzen Sie bei den Stellen, woran Sie am längsten gearbeitet haben. Der Personaler sieht so schnell, dass Sie leicht zwischen Maschinen wechseln, was in Betrieben mit gemischtem Maschinenpark viel wert ist."
      }
    ]
  },
  "slusarz": {
    slugLang: "schlosser",
    name: "Schlosser/in",
    title: "Lebenslauf Schlosser: Muster und Tipps",
    metaDescription: "Lebenslauf als Schlosser passend zur Stellenanzeige. Muster, Begriffe aus Angeboten und Tipps zu manueller Metallbearbeitung, Stahlbau und Zusatzscheinen.",
    intro: "Hinter dem Wort „ślusarz“ stecken in polnischen Anzeigen sehr unterschiedliche Tätigkeiten: von der Montage von Stahlkonstruktionen über Maschinenschlosserei bis zur Fertigung von Geländern und Toren. Deshalb muss der Lebenslauf klar zeigen, in welchem dieser Bereiche Sie Erfahrung haben. Arbeitgeber fragen meist nach Zeichnungslesen, manueller Bearbeitung (Sägen, Bohren, Gewindeschneiden) und dem Umgang mit Elektrowerkzeugen. Ein Plus sind oft MAG-Schweißen und ein UDT-Kranschein.",
    keywords: [
      "manuelle Metallbearbeitung",
      "Lesen technischer Zeichnungen",
      "Montage von Stahlkonstruktionen",
      "Bohren und Gewindeschneiden",
      "Umgang mit Elektrowerkzeugen",
      "MAG-Schweißen als Vorteil",
      "UDT-Kranschein",
      "Messen mit dem Messschieber",
      "Maschinenschlosserei",
      "Einhaltung der Arbeitsschutzvorschriften"
    ],
    tips: [
      "Beginnen Sie mit dem, was Sie fertigen: Stahlkonstruktionen, Maschinenverkleidungen, Geländer, Förderbänder. Ein Hallenbauer sucht einen anderen Schlosser als eine Firma, die Produktionslinien wartet.",
      "Zählen Sie Maschinen und Werkzeuge auf: Bandsäge, Säulenbohrmaschine, Biegemaschine, Abkantpresse, Winkelschleifer. Dieses Detail hebt Sie von anderen Bewerbern ab.",
      "Zusatzscheine (UDT für Krane oder Stapler, Schweißzertifikat, SEP) gehören in einen eigenen Abschnitt mit Gültigkeitsdatum. Sie entscheiden oft, wer eingeladen wird.",
      "Wenn Sie nach Unterlagen arbeiten, nennen Sie diese: Werkstattzeichnungen, Zusammenbauzeichnungen, Stücklisten. Selbstständiges Arbeiten nach Zeichnung ist eine der häufigsten Anforderungen."
    ],
    sample: {
      name: "Grzegorz Sikora",
      headline: "Schlosser und Monteur für Stahlkonstruktionen",
      contact: ["+48 600 000 182", "grzegorz.sikora@example.com", "Stalowa Wola", "linkedin.com/in/grzegorz-sikora-przyklad"],
      summary: "Seit zehn Jahren fertige und montiere ich Stahlkonstruktionen und Maschinenteile nach Werkstattzeichnungen. Ich schweiße im MAG-Verfahren, besitze einen UDT-Schein für flurbediente Brückenkrane und bereite Bauteile selbstständig für die Montage vor.",
      skills: [
        "Lesen von Werkstatt- und Zusammenbauzeichnungen",
        "Sägen, Bohren, Gewindeschneiden und Anfasen",
        "Bedienung von Bandsäge und Säulenbohrmaschine",
        "MAG-Schweißen (135)",
        "Montage geschraubter Stahlkonstruktionen",
        "UDT-Schein für flurbediente Brückenkrane",
        "Messen mit Messschieber, Winkel und Wasserwaage"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "Schlosser und Monteur",
          company: "Stal-Konstrukt Stalowa Wola Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Fertigung von Baugruppen für Hallen und Überdachungen nach Werkstattzeichnungen.",
            "Probemontage der Konstruktionen in der Halle vor dem Versand und Kennzeichnung der Teile.",
            "Einarbeitung von zwei neuen Mitarbeitern an der Bandsäge und in den Arbeitsschutz am Arbeitsplatz."
          ]
        },
        {
          title: "Schlosser",
          company: "Zakład Mechaniczny Sanmet s.c.",
          period: "08.2015 – 05.2020",
          bullets: [
            "Fertigung von Toren, Geländern und Zaunelementen nach Kundenauftrag.",
            "Sägen, Bohren und Gewindeschneiden sowie Vorbereitung der Teile zum Schweißen.",
            "Montage fertiger Produkte beim Kunden zusammen mit dem Team."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Ponadpodstawowych nr 2 w Stalowej Woli",
        degree: "Schlosser (ślusarz), Berufsschule",
        period: "2012 – 2015"
      }
    },
    faq: [
      {
        q: "Braucht ein Schlosser ein Schweißzertifikat?",
        a: "Nicht immer, aber viele Anzeigen nennen MAG-Schweißen als Anforderung oder Vorteil. Wenn Sie ohne Zertifikat schweißen, können Sie das angeben und den Umfang eingrenzen, etwa „MAG-Schweißen einfacher Verbindungen“. Das Zertifikat lohnt sich, weil es mehr Angebote eröffnet."
      },
      {
        q: "Wie schreibe ich einen Schlosser-Lebenslauf direkt nach der Schule ohne Erfahrung?",
        a: "Beschreiben Sie Ihre Praktika: in welchem Betrieb, bei welchen Arbeiten und an welchen Maschinen. Ergänzen Sie Fähigkeiten aus der Schule, etwa manuelle Bearbeitung und Zeichnungslesen, sowie Kurse, falls vorhanden. Ein kurzer, konkreter Lebenslauf wirkt besser als eine lange Liste von Charaktereigenschaften."
      }
    ]
  },
  "tokarz": {
    slugLang: "dreher",
    name: "Dreher/in",
    title: "Lebenslauf Dreher: Muster und Tipps",
    metaDescription: "Lebenslauf als Dreher passend zur Stellenanzeige: Muster, Schlüsselbegriffe aus Angeboten und Tipps zu konventionellen und CNC-Drehmaschinen, Gewinden und Toleranzen.",
    intro: "Stellenanzeigen für Dreher teilen sich in zwei Gruppen: Arbeit an konventionellen Drehmaschinen, oft für Ersatzteile und Reparaturen, und die Bedienung von CNC-Drehmaschinen in der Serienfertigung. Viele Betriebe suchen jemanden, der beides kann. Gefragt wird nach Gewindedrehen, Arbeiten in Toleranzen und dem selbstständigen Festlegen der Schnittwerte. Wichtig ist auch, ob Sie Einzelteile nach Zeichnung oder lange Serien gefertigt haben.",
    keywords: [
      "Drehen an konventioneller Drehmaschine",
      "Bedienung einer CNC-Drehmaschine",
      "Gewindedrehen",
      "Lesen technischer Zeichnungen",
      "Festlegen der Schnittwerte",
      "Messen mit der Bügelmessschraube",
      "Arbeiten in Toleranzen",
      "Fertigung von Ersatzteilen",
      "Schleifen von Drehmeißeln",
      "Einzel- und Serienfertigung"
    ],
    tips: [
      "Schreiben Sie, an welchen Drehmaschinen Sie gearbeitet haben und welche Teilegrößen Sie bearbeiten, etwa „Wellen bis 1500 mm Länge, Durchmesser bis 400 mm“. Der Betrieb sieht sofort, ob Sie seine Aufträge bewältigen.",
      "Wenn Sie Gewinde drehen, nennen Sie die Arten: metrisch, zöllig, Trapez. Ein Trapezgewinde auf der konventionellen Drehmaschine zu drehen ist eine Fähigkeit, die viele Arbeitgeber suchen.",
      "Geben Sie an, in welchen Toleranzen Sie arbeiten und womit Sie messen. Passungen oder geforderte Rauheit zeigen, dass Sie die Zeichnung verstehen und nicht nur die Maschine bedienen.",
      "Wenn Sie konventionelle und CNC-Drehmaschinen beherrschen, trennen Sie das bei den Kenntnissen. Für viele Betriebe ist diese Kombination am wertvollsten, weil so jemand sowohl Serien als auch dringende Reparaturteile fertigt."
    ],
    sample: {
      name: "Marek Pietrzak",
      headline: "Dreher – konventionell und CNC",
      contact: ["+48 600 000 183", "marek.pietrzak@example.com", "Ostrów Wielkopolski", "linkedin.com/in/marek-pietrzak-przyklad"],
      summary: "Seit zwölf Jahren arbeite ich als Dreher, zuerst an konventionellen Drehmaschinen und seit fünf Jahren auch an CNC-Drehmaschinen mit Fanuc-Steuerung. Ich fertige Ersatzteile nach Zeichnung und nach Muster, drehe metrische und Trapezgewinde und arbeite mit Toleranzen bis 0,02 mm.",
      skills: [
        "Drehen an konventionellen Drehmaschinen (TUR, TUM)",
        "Bedienen und Einrichten einer CNC-Drehmaschine mit Fanuc",
        "Drehen metrischer, zölliger und Trapezgewinde",
        "Fertigung von Teilen nach Muster",
        "Auswahl von Werkzeugen und Schnittwerten",
        "Messen mit Bügelmessschraube, Innenmessgerät und Lehren",
        "Schleifen von Drehmeißeln"
      ],
      languages: ["Deutsch A2"],
      jobs: [
        {
          title: "CNC-Dreher",
          company: "Wagmech Ostrów Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Drehen von Wellen und Buchsen für Waggonbaugruppen in Serien von 50 bis 300 Stück.",
            "Einrichten der Drehmaschine für neue Serien und Fertigung des Erstteils zur Freigabe durch die Qualitätssicherung.",
            "Fertigung dringender Ersatzteile an der konventionellen Drehmaschine für die Instandhaltung."
          ]
        },
        {
          title: "Dreher",
          company: "Usługi Ślusarsko-Tokarskie Kalisz-Met s.c.",
          period: "04.2012 – 05.2020",
          bullets: [
            "Fertigung von Teilen für Land- und Industriemaschinen nach vom Kunden gelieferten Mustern.",
            "Drehen von Trapezgewinden für Leitspindeln und Pressen.",
            "Vermessen verschlissener Teile und Anfertigen von Skizzen für Neuteile."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Technicznych w Ostrowie Wielkopolskim",
        degree: "Zerspanungsmechaniker (operator obrabiarek skrawających)",
        period: "2009 – 2012"
      }
    },
    faq: [
      {
        q: "Hat ein konventioneller Dreher Chancen auf eine Stelle an CNC-Maschinen?",
        a: "Ja, viele Arbeitgeber lernen konventionelle Dreher gern an, weil sie Zerspanung und Zeichnungen verstehen. Betonen Sie im Lebenslauf Ihre Genauigkeit und die Bereitschaft, die Steuerung zu lernen. Haben Sie einen CNC-Kurs gemacht, nennen Sie ihn auch ohne Produktionserfahrung."
      },
      {
        q: "Soll ich angeben, dass ich Teile nach Muster fertige?",
        a: "Unbedingt. Ein Teil ohne Zeichnung nach einem verschlissenen Bauteil zu fertigen erfordert Messen, Beurteilen des Verschleißes und die Wahl des Werkstoffs. Solche Fähigkeiten schätzen Instandhaltungsabteilungen und kleine Lohnfertiger."
      }
    ]
  },
  "technik-utrzymania-ruchu": {
    slugLang: "instandhaltungstechniker",
    name: "Instandhaltungstechniker/in",
    title: "Lebenslauf Instandhaltungstechniker: Muster und Tipps",
    metaDescription: "Lebenslauf als Instandhaltungstechniker: Muster, Schlüsselbegriffe aus Angeboten und Tipps zu Störungsbehebung, Wartung, SEP-Scheinen und SPS-Kenntnissen.",
    intro: "Ein Instandhaltungstechniker sorgt dafür, dass Produktionslinien so kurz wie möglich stillstehen, daher dominieren in den Anzeigen Diagnose und Behebung mechanischer, elektrischer, pneumatischer und hydraulischer Störungen. Sehr oft wird der polnische SEP-Schein der Gruppe 1 bis 1 kV für den Betrieb verlangt. Immer mehr Firmen erwarten auch SPS-Grundkenntnisse, zumindest das Auslesen von Zuständen und die Online-Diagnose im TIA Portal. Hinzu kommen vorbeugende Wartung, Dokumentation im CMMS und Schichtarbeit.",
    keywords: [
      "Störungsbehebung an Maschinen",
      "Diagnose mechanischer und elektrischer Fehler",
      "SEP-Schein G1 bis 1 kV",
      "Pneumatik und Hydraulik",
      "vorbeugende Wartung",
      "SPS-Grundkenntnisse Siemens",
      "Lesen von Stromlaufplänen",
      "TPM",
      "CMMS-System",
      "Schichtarbeit"
    ],
    tips: [
      "Beschreiben Sie, welche Maschinen und Linien Sie betreut haben: Spritzgießmaschinen, Pressen, Verpackungslinien, Schweißroboter. Erfahrung mit einem ähnlichen Maschinenpark verkürzt die Einarbeitung, und Personaler fragen danach.",
      "Geben Sie den SEP-Schein genau an: Gruppe, Umfang (Betrieb, Aufsicht), Spannung und Gültigkeit. „SEP G1 E bis 1 kV, gültig bis 2028“ ist genau die Zeile, die der Arbeitgeber sucht.",
      "Zeigen Sie Ergebnisse, nicht nur Aufgaben. Kürzere Reparaturzeiten, weniger Stillstände nach Einführung von Inspektionen oder eine höhere OEE bleiben im Gedächtnis.",
      "Grenzen Sie Ihr SPS-Niveau ab: Auslesen und Online-Diagnose, kleine Änderungen oder eigenständiges Programmieren. Eine ehrliche Beschreibung erspart eine unangenehme Situation im Fachgespräch."
    ],
    sample: {
      name: "Łukasz Wawrzyniak",
      headline: "Instandhaltungstechniker – Mechanik und Elektrik",
      contact: ["+48 600 000 184", "lukasz.wawrzyniak@example.com", "Legnica", "linkedin.com/in/lukasz-wawrzyniak-przyklad"],
      summary: "Seit sieben Jahren halte ich Produktionslinien in Automobilwerken am Laufen. Ich behebe mechanische, elektrische und pneumatische Störungen, führe vorbeugende Wartungen durch und diagnostiziere Fehler in Siemens-S7-1500-Steuerungen über das TIA Portal. Ich besitze den SEP-Schein G1 E bis 1 kV.",
      skills: [
        "Diagnose und Behebung von Störungen an Produktionslinien",
        "SEP-Schein G1 E bis 1 kV",
        "Pneumatik und Elektropneumatik",
        "Hydraulik",
        "Diagnose von Siemens-S7-SPS im TIA Portal",
        "Lesen von Stromlauf- und Pneumatikplänen",
        "Störungsdokumentation im CMMS"
      ],
      languages: ["Englisch B1"],
      jobs: [
        {
          title: "Instandhaltungstechniker",
          company: "Autoparts Legnica Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Störungsbehebung an vier robotergestützten Punktschweiß- und Montagelinien im Dreischichtsystem.",
            "Erstellung einer Checkliste für wöchentliche Inspektionen, nach der die ungeplanten Stillstände an der Linie binnen eines Jahres um etwa 25 % sanken.",
            "Austausch und Einstellung von Zylindern, Ventilen und induktiven Sensoren."
          ]
        },
        {
          title: "Elektromechaniker",
          company: "Plastform Polkowice Sp. z o.o.",
          period: "09.2017 – 05.2020",
          bullets: [
            "Service an Spritzgießmaschinen und Entnahmerobotern.",
            "Austausch von Heizbändern, Thermoelementen und Schützen in Schaltschränken.",
            "Mitarbeit bei jährlichen Maschinenrevisionen mit dem Herstellerservice."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Elektronicznych i Samochodowych w Legnicy",
        degree: "Mechatroniker (technik mechatronik)",
        period: "2013 – 2017"
      }
    },
    faq: [
      {
        q: "Was tun, wenn mein SEP-Schein abgelaufen ist?",
        a: "Führen Sie ihn mit dem Gültigkeitszeitraum auf, etwa „SEP G1 E bis 1 kV (gültig bis 03.2024)“, und ergänzen Sie, dass Sie ihn erneuern können. Die Prüfung lässt sich relativ schnell wiederholen, und der Arbeitgeber sieht, dass Sie die Vorbereitung schon kennen. Geben Sie einen abgelaufenen Schein nicht als gültig an."
      },
      {
        q: "Mechaniker oder Elektriker – wie stelle ich mich dar?",
        a: "Nennen Sie Ihre Stärke, zeigen Sie aber auch den anderen Bereich, wenn Sie ihn beherrschen. Viele Firmen suchen vielseitige Techniker, und eine Überschrift wie „Instandhaltungstechniker – Mechaniker mit SEP-Schein“ funktioniert gut. Die Anzeige sagt meist direkt, welches Profil im Team fehlt."
      },
      {
        q: "Gehören Schicht- und Wochenendarbeit in den Lebenslauf?",
        a: "Wenn die Anzeige sie erwähnt, bestätigen Sie in einem Satz Ihre Bereitschaft zum Dreischichtsystem oder zu Bereitschaftsdiensten. Für die Instandhaltung ist das wichtig, weil jede Schicht besetzt sein muss."
      }
    ]
  },
  "kontroler-jakosci": {
    slugLang: "qualitaetspruefer",
    name: "Qualitätsprüfer/in",
    title: "Lebenslauf Qualitätsprüfer: Muster und Tipps",
    metaDescription: "Lebenslauf als Qualitätsprüfer passend zur Stellenanzeige: Muster, Schlüsselbegriffe aus Angeboten und Tipps zu Messungen, Fehlerberichten und ISO-Normen.",
    intro: "Ein Qualitätsprüfer kontrolliert Produkte beim Wareneingang, während der Fertigung und vor dem Versand, daher zählen in den Anzeigen vor allem Messen und saubere Dokumentation. Arbeitgeber fragen nach Messmitteln, dem Lesen von Zeichnungen mit Toleranzen, Sichtprüfung nach Grenzmustern und dem Führen von Abweichungsberichten. In der Automobilindustrie kommen Kenntnisse der IATF 16949 und Qualitätswerkzeuge wie 8D oder 5 Why hinzu. Ein Plus ist die Bedienung einer Koordinatenmessmaschine (KMG/CMM).",
    keywords: [
      "Qualitätsprüfung von Produkten",
      "Messen mit Messmitteln",
      "Lesen technischer Zeichnungen",
      "Sichtprüfung",
      "Abweichungsberichte",
      "Norm ISO 9001",
      "IATF 16949",
      "8D-Report",
      "Koordinatenmessmaschine (CMM)",
      "Erstmusterprüfung"
    ],
    tips: [
      "Nennen Sie die konkreten Messmittel: Messschieber, Bügelmessschraube, Höhenmessgerät, Lehren, KMG, Rauheitsmessgerät. Der Personaler vergleicht diese Liste mit der Ausstattung seiner Qualitätsabteilung.",
      "Schreiben Sie, in welcher Phase Sie prüfen: Wareneingang, Zwischenprüfung, Endprüfung, Produktaudit. Jede Phase verlangt etwas andere Fähigkeiten.",
      "Zeigen Sie, dass Sie Fehler nicht nur finden, sondern bei ihrer Beseitigung helfen. Mitarbeit an 8D-Reports, Ursachenanalysen oder Kundenreklamationen sind die stärksten Punkte im Lebenslauf eines Prüfers.",
      "Geben Sie Branche und Normen an: ISO 9001, IATF 16949, Kundenanforderungen. In Automobil- und Luftfahrtindustrie ist das oft Voraussetzung für eine Einladung."
    ],
    sample: {
      name: "Katarzyna Mazurek",
      headline: "Qualitätsprüferin in der Automobilindustrie",
      contact: ["+48 600 000 185", "katarzyna.mazurek@example.com", "Tychy", "linkedin.com/in/katarzyna-mazurek-przyklad"],
      summary: "Seit fünf Jahren prüfe ich Metall- und Kunststoffteile für Kunden aus der Automobilindustrie. Ich messe mit Handmessmitteln und an der Koordinatenmessmaschine, führe Abweichungsberichte und wirke an 8D-Analysen mit. Ich arbeite nach den Anforderungen der IATF 16949.",
      skills: [
        "Messen mit Messschieber, Bügelmessschraube und Höhenmessgerät",
        "Bedienung einer Koordinatenmessmaschine (CMM)",
        "Lesen von Zeichnungen und Form- und Lagetoleranzen",
        "Sichtprüfung nach Grenzmustern",
        "Abweichungsberichte und Mitarbeit an 8D",
        "Kenntnis der IATF 16949 und ISO 9001",
        "Erstmusterprüfung (FAI)"
      ],
      languages: ["Englisch B1"],
      jobs: [
        {
          title: "Qualitätsprüferin",
          company: "Silesia Components Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Erst- und Letztteilprüfung für 12 Linien zum Stanzen und Schweißen von Karosserieteilen.",
            "Messungen an der Koordinatenmessmaschine und Erstellung von Berichten für den Kunden.",
            "Mitarbeit an sieben 8D-Analysen, darunter Erstellung einer Sichtprüfanweisung nach einer Kundenreklamation."
          ]
        },
        {
          title: "Qualitätsprüferin – Wareneingangsprüfung",
          company: "Plastimex Bieruń Sp. z o.o.",
          period: "04.2019 – 05.2020",
          bullets: [
            "Wareneingangsprüfung von Spritzgussteilen und Komponenten nach Prüfplan.",
            "Sperren fehlerhafter Lose und Reklamationen bei Lieferanten.",
            "Führen eines Prüfregisters in Excel."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska, Wydział Mechaniczny Technologiczny",
        degree: "Ingenieurin (Bachelor), Produktionsmanagement und -technik",
        period: "2015 – 2019"
      }
    },
    faq: [
      {
        q: "Habe ich ohne CMM-Erfahrung Chancen in der Qualitätsprüfung?",
        a: "Ja, viele Prüferstellen beruhen auf Handmessmitteln und Sichtprüfung. Zeigen Sie im Lebenslauf Genauigkeit, Zeichnungskenntnisse und Erfahrung mit Dokumentation. Wenn Sie eine CMM-Schulung besucht haben, nennen Sie sie, auch wenn Sie noch nicht selbstständig an der Maschine gearbeitet haben."
      },
      {
        q: "Wie beschreibe ich Schulungen zu Qualitätswerkzeugen?",
        a: "Legen Sie einen Abschnitt „Schulungen“ an und nennen Sie Titel und Jahr, etwa „8D- und 5-Why-Methodik, 2023“ oder „Anforderungen der IATF 16949, 2022“. Ergänzen Sie bei der Stelle, wie Sie das Wissen nutzen, denn eine Schulung ohne Praxis wiegt weniger."
      }
    ]
  },
  "automatyk": {
    slugLang: "automatisierungstechniker",
    name: "Automatisierungstechniker/in",
    title: "Lebenslauf Automatisierungstechniker: Muster und Tipps",
    metaDescription: "Lebenslauf als Automatisierungstechniker passend zur Anzeige. Muster, Schlüsselbegriffe und Tipps zu SPS- und HMI-Programmierung, Inbetriebnahmen und SEP.",
    intro: "Automatisierungstechniker arbeiten sowohl in der Instandhaltung als auch bei Systemintegratoren, die neue Linien bauen und in Betrieb nehmen. In den Anzeigen tauchen am häufigsten Siemens-S7-Steuerungen mit TIA Portal, HMI-Panels, Frequenzumrichter, das Lesen und Erstellen von Stromlaufplänen sowie polnische SEP-Scheine auf. Integratoren fragen zusätzlich nach Inbetriebnahmen beim Kunden, oft im Ausland, und nach Arbeit mit Industrierobotern. Es lohnt sich zu zeigen, an welchen Projekten Sie beteiligt waren und was genau Sie gemacht haben.",
    keywords: [
      "SPS-Programmierung",
      "Siemens TIA Portal",
      "HMI-Visualisierung",
      "SCADA-Systeme",
      "Parametrierung von Frequenzumrichtern",
      "SEP-Scheine E und D bis 1 kV",
      "Lesen und Erstellen von Stromlaufplänen",
      "Inbetriebnahme von Maschinen beim Kunden",
      "Industrierobotik",
      "Industrienetzwerke Profinet"
    ],
    tips: [
      "Nennen Sie die Plattformen, die Sie programmieren, und Ihr Niveau: Siemens S7-1200/1500, Allen-Bradley, Beckhoff. Ergänzen Sie jeweils die Sprachen (KOP, FUP, SCL), denn technische Recruiter filtern danach.",
      "Beschreiben Sie Projekte: Art der Maschine oder Linie, Anzahl der Ein- und Ausgänge, Ihre Rolle und das Land der Inbetriebnahme. „Inbetriebnahme einer Palettierlinie mit zwei Robotern in Tschechien“ sagt mehr als „Maschineninbetriebnahmen“.",
      "Geben Sie SEP-Scheine mit Gruppe und Umfang (Betrieb und Aufsicht) an. Bei Integratoren zählen außerdem Reisebereitschaft und ein Führerschein Klasse B.",
      "Wenn Sie EPLAN, Maschinensicherheit (zum Beispiel PN-EN ISO 13849) oder Roboter eines bestimmten Herstellers kennen, führen Sie das separat auf. Das sind seltenere Kenntnisse, die den Wert des Lebenslaufs deutlich steigern."
    ],
    sample: {
      name: "Michał Kaczmarczyk",
      headline: "Automatisierungstechniker – SPS- und HMI-Programmierer",
      contact: ["+48 600 000 186", "michal.kaczmarczyk@example.com", "Gliwice", "linkedin.com/in/michal-kaczmarczyk-przyklad"],
      summary: "Automatisierungstechniker mit sechs Jahren Erfahrung in der Programmierung von Siemens-Steuerungen und der Inbetriebnahme von Montage- und Palettierlinien. Ich erstelle SPS-Programme im TIA Portal und HMI-Visualisierungen und parametriere Frequenzumrichter. Inbetriebnahmen habe ich in Polen, Tschechien und Deutschland durchgeführt.",
      skills: [
        "Siemens S7-1200/1500, TIA Portal (KOP, SCL)",
        "HMI-Panels Siemens Comfort und Unified",
        "Parametrierung von Frequenzumrichtern und Servoantrieben",
        "Profinet- und Profibus-Netzwerke",
        "Integration von Industrierobotern in die SPS",
        "Stromlaufpläne in EPLAN",
        "SEP-Scheine G1 E und D bis 1 kV"
      ],
      languages: ["Englisch B2", "Deutsch A2"],
      jobs: [
        {
          title: "Automatisierungstechniker – SPS-Programmierer",
          company: "Integra-Tech Automation Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "SPS- und HMI-Programmierung für 14 Maschinen und Linien, darunter eine Palettierlinie mit zwei Robotern.",
            "Inbetriebnahmen bei Kunden in Polen, Tschechien und Deutschland, insgesamt rund 30 Reisewochen pro Jahr.",
            "Aufbau einer Bibliothek von Standard-Funktionsbausteinen, die die Programmierung einer typischen Maschine um mehrere Tage verkürzte."
          ]
        },
        {
          title: "Elektriker und Automatisierungstechniker in der Instandhaltung",
          company: "Glass-Pak Gliwice Sp. z o.o.",
          period: "07.2018 – 05.2020",
          bullets: [
            "Diagnose und Behebung von Störungen in Steuerungen an Verpackungslinien.",
            "Kleinere Änderungen an SPS-Programmen nach Abstimmung mit dem Abteilungsleiter.",
            "Austausch und Parametrierung von Frequenzumrichtern und Sensoren."
          ]
        }
      ],
      education: {
        school: "Politechnika Śląska, Wydział Automatyki, Elektroniki i Informatyki",
        degree: "Ingenieur (Bachelor), Automatisierungstechnik und Robotik",
        period: "2014 – 2018"
      }
    },
    faq: [
      {
        q: "Wie zeige ich Projekte, die der Geheimhaltung des Kunden unterliegen?",
        a: "Lassen Sie den Kundennamen weg und nennen Sie Branche und Art der Lösung, etwa „Montagelinie für Baugruppen eines Hausgeräteherstellers, 12 Stationen, 2 Roboter“. Das genügt, um Umfang und Ihre Rolle zu zeigen. Details können Sie im Gespräch besprechen, soweit es Ihr Vertrag zulässt."
      },
      {
        q: "Soll ich Steuerungen angeben, die ich nur aus einem Kurs kenne?",
        a: "Ja, aber kennzeichnen Sie das Niveau, etwa „Allen-Bradley – Grundlagen, 40-Stunden-Kurs“. Personaler schätzen Ehrlichkeit, und die Kenntnis kann bei ähnlichen Bewerbern den Ausschlag geben. Stellen Sie sie aber nicht auf eine Stufe mit der Plattform, mit der Sie täglich arbeiten."
      },
      {
        q: "Braucht ein Automatisierungstechniker SEP-Scheine?",
        a: "In den meisten Anzeigen sind sie Pflicht oder erwünscht, weil die Arbeit elektrische Anlagen umfasst. Meist geht es um Gruppe 1 bis 1 kV, bei Stellen mit Verantwortung für andere auch um den Aufsichtsumfang. Wenn Sie sie nicht haben, schreiben Sie, dass Sie bereit sind, sie zu erwerben."
      }
    ]
  },
  "lakiernik": {
    slugLang: "fahrzeuglackierer",
    name: "Fahrzeuglackierer/in",
    title: "Lebenslauf Fahrzeuglackierer: Muster und Tipps",
    metaDescription: "Lebenslauf als Fahrzeuglackierer passend zur Stellenanzeige: Muster, Schlüsselbegriffe aus Werkstattangeboten und Tipps zu Vorbereitung, Farbtonfindung und Beilackieren.",
    intro: "Karosserie- und Lackierbetriebe suchen in ihren Anzeigen Lackierer, die den gesamten Prozess selbstständig durchführen: von der Untergrundvorbereitung und dem Spachteln über die Grundierung bis zum Lackieren in der Kabine und Polieren. Besonders geschätzt werden treffsichere Farbtonfindung und Beilackieren auf angrenzende Teile, denn davon hängt ab, ob der Kunde die Reparatur bemerkt. Immer häufiger wird Erfahrung mit Wasserbasislacken verlangt. Markenwerkstätten fragen zusätzlich nach Schulungen der Lackhersteller.",
    keywords: [
      "Fahrzeuglackierung",
      "Untergrundvorbereitung zum Lackieren",
      "Spachteln und Schleifen",
      "computergestützte Farbtonfindung",
      "Beilackieren",
      "Wasserbasislacke",
      "Bedienung der Lackierkabine",
      "Polieren und Beseitigen von Lackfehlern",
      "Unfallinstandsetzung",
      "selbstständiges Arbeiten"
    ],
    tips: [
      "Beschreiben Sie den gesamten Umfang, den Sie selbstständig erledigen: Vorbereitung, Grundierung, Farbtonfindung, Lackieren, Polieren. Die Werkstatt sucht jemanden, der nicht bei jedem Schritt einen Helfer braucht.",
      "Schreiben Sie, mit welchen Lacksystemen Sie arbeiten und ob Sie Wasserbasislacke kennen. Herstellerschulungen nennen Sie mit Jahr, denn Markenwerkstätten verlangen sie oft.",
      "Geben Sie das Arbeitsvolumen an, etwa „durchschnittlich 6–8 Teile pro Tag“ oder „Komplettlackierungen und Kunststoffteile“. Das hilft einzuschätzen, ob Sie das Tempo des Betriebs halten.",
      "Wenn Sie Spot-Repair (SMART Repair), Kunststofflackierung oder Oldtimer-Restaurierung beherrschen, führen Sie das separat auf. Diese Fähigkeiten heben Sie bei besser bezahlten Angeboten hervor."
    ],
    sample: {
      name: "Sebastian Borowski",
      headline: "Fahrzeuglackierer – Unfallinstandsetzung",
      contact: ["+48 600 000 187", "sebastian.borowski@example.com", "Koszalin", "linkedin.com/in/sebastian-borowski-przyklad"],
      summary: "Seit neun Jahren lackiere ich Pkw und Transporter in Karosserie- und Lackierbetrieben. Ich bereite Untergründe selbstständig vor, finde Farbtöne mit Spektralfotometer und Farbtonfächern, lackiere bei und poliere. Seit fünf Jahren arbeite ich mit Wasserbasislacken.",
      skills: [
        "Untergrundvorbereitung, Spachteln und Grundieren",
        "Computergestützte Farbtonfindung mit Spektralfotometer",
        "Beilackieren auf angrenzende Teile",
        "Wasserbasislacke und 2K-Klarlacke",
        "Lackieren von Kunststoffteilen",
        "Spot-Repair (SMART Repair)",
        "Polieren und Beseitigen von Läufern und Einschlüssen"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "Fahrzeuglackierer",
          company: "Auto-Lak Koszalin Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Lackieren von durchschnittlich 6–8 Teilen pro Tag im Rahmen von Versicherungs-Unfallreparaturen.",
            "Farbtonfindung nach Teiletausch, mit farblichen Nacharbeiten bei weniger als 3 % der Aufträge.",
            "Anlernen eines Lackiererhelfers im Schleifen und Abkleben von Fahrzeugen."
          ]
        },
        {
          title: "Lackierer",
          company: "Blacharstwo i Lakiernictwo Pomorze s.c.",
          period: "03.2015 – 05.2020",
          bullets: [
            "Lackieren von Pkw- und Transporterteilen mit lösemittelhaltigen und wasserbasierten Lacken.",
            "Vorbereitung der Teile: Schleifen, Spachteln, Füller.",
            "Polieren und Vorbereitung der Fahrzeuge zur Übergabe an den Kunden."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół nr 9 w Koszalinie",
        degree: "Fahrzeuglackierer (lakiernik samochodowy), Berufsschule",
        period: "2011 – 2014"
      }
    },
    faq: [
      {
        q: "Soll ich dem Lebenslauf Fotos meiner Arbeiten beilegen?",
        a: "Dem Lebenslauf selbst nicht, aber Sie können erwähnen, dass Sie eine Vorher-nachher-Fotomappe haben und sie im Gespräch zeigen. Manche Bewerber ergänzen einen Link zu einer Online-Galerie. So zeigen Sie die Qualität von Beilackierung und Politur, die sich kaum in Worte fassen lässt."
      },
      {
        q: "Wie beschreibe ich die Arbeit in einer kleinen, unbekannten Werkstatt?",
        a: "Nennen Sie Name, Ort und kurz das Profil der Werkstatt, etwa „Karosserie- und Lackierbetrieb, 4 Arbeitsplätze“. Am wichtigsten ist, was Sie gemacht haben und wie selbstständig. Die Größe des Betriebs zählt weniger als der Umfang Ihrer Aufgaben."
      }
    ]
  },
  "blacharz-samochodowy": {
    slugLang: "karosseriebauer",
    name: "Karosseriebauer/in",
    title: "Lebenslauf Karosseriebauer: Muster und Tipps",
    metaDescription: "Lebenslauf als Karosseriebauer passend zur Stellenanzeige: Muster, Begriffe aus Werkstattangeboten und Tipps zu Unfallinstandsetzung, Richtbank und Schweißen.",
    intro: "Ein Karosseriebauer in der Werkstatt ist für Unfallinstandsetzungen zuständig: Demontage, Richten, Austausch von Karosserieteilen und Vorbereitung des Fahrzeugs für die Lackiererei. Anzeigen verlangen oft Arbeit an der Richtbank mit Messsystem, MIG/MAG-Schweißen und Widerstandspunktschweißen. Bei neueren Fahrzeugen kommen Aluminiumreparaturen, Kleben und Nieten nach Herstellervorgabe hinzu. Gern gesehen sind auch Ausbeulen ohne Lackieren (PDR) und das Erstellen einer ersten Schadenseinschätzung.",
    keywords: [
      "Unfallinstandsetzung",
      "Karosserierichten auf der Richtbank",
      "Karosserievermessung",
      "Austausch von Karosserieteilen",
      "MIG/MAG-Schweißen",
      "Widerstandspunktschweißen",
      "Reparatur von Aluminiumteilen",
      "Ausbeulen ohne Lackieren (PDR)",
      "Arbeit nach Herstellervorgaben",
      "Führerschein Klasse B"
    ],
    tips: [
      "Schreiben Sie, welche Schäden Sie reparieren: kleine Dellen, Austausch von Schwellern und Kotflügeln, schwere Schäden mit Richten der Längsträger. Der Arbeitsumfang zeigt Ihr Niveau besser als die reine Zahl der Berufsjahre.",
      "Nennen Sie die Ausrüstung: Richtbank, elektronisches Messsystem, Punktschweißgerät, Aluminium-Schweißgerät, PDR-Set. Eine Werkstatt mit ähnlicher Ausstattung arbeitet Sie schneller ein.",
      "Wenn Sie mit Aluminium, Strukturkleben oder Nieten arbeiten, schreiben Sie das deutlich. Diese Techniken sind bei neuen Autos immer häufiger, und nicht jeder Karosseriebauer beherrscht sie.",
      "Ergänzen Sie Ergebnisse: Reparaturen pro Monat, Termintreue oder keine Reklamationen. Ein Werkstattinhaber denkt in Durchlauf, daher überzeugen konkrete Zahlen am meisten."
    ],
    sample: {
      name: "Rafał Jasiński",
      headline: "Karosseriebauer – Unfallinstandsetzung",
      contact: ["+48 600 000 188", "rafal.jasinski@example.com", "Płock", "linkedin.com/in/rafal-jasinski-przyklad"],
      summary: "Seit elf Jahren repariere ich Karosserien von Pkw und Transportern nach Verkehrsunfällen. Ich arbeite an der Richtbank mit elektronischem Messsystem, schweiße MIG/MAG, punktschweiße und repariere Aluminiumteile. Ich bereite Fahrzeuge so vor, dass der Lackierer sofort beginnen kann.",
      skills: [
        "Karosserierichten auf der Richtbank",
        "Elektronische Karosserievermessung",
        "MIG/MAG-Schweißen und Punktschweißen",
        "Aluminiumreparatur, Kleben und Nieten",
        "Ausbeulen ohne Lackieren (PDR)",
        "Demontage und Montage von Teilen und Anbauteilen",
        "Arbeit nach Reparaturanleitungen der Hersteller"
      ],
      languages: ["Englisch A2"],
      jobs: [
        {
          title: "Karosseriebauer",
          company: "Car-Serwis Mazowsze Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Unfallinstandsetzung von durchschnittlich 15–20 Fahrzeugen pro Monat, einschließlich Schäden mit Richten der Längsträger auf der Richtbank.",
            "Reparatur von Aluminiumteilen an einem separaten Arbeitsplatz nach Herstellervorgaben.",
            "Unterstützung des Serviceberaters bei der ersten Einschätzung des Schadensumfangs."
          ]
        },
        {
          title: "Karosseriebauer",
          company: "Auto-Blach Płock s.c.",
          period: "05.2013 – 05.2020",
          bullets: [
            "Austausch von Schwellern, Kotflügeln und Türaußenhäuten sowie Korrosionsreparaturen.",
            "Schweißen und Punktschweißen von Karosserieteilen und Hohlraumkonservierung.",
            "Vorbereitung der Fahrzeuge zum Lackieren und Wiedermontage nach der Lackiererei."
          ]
        }
      ],
      education: {
        school: "Zespół Szkół Centrum Kształcenia Rolniczego w Płocku",
        degree: "Karosseriebauer (blacharz samochodowy), Berufsschule",
        period: "2009 – 2012"
      }
    },
    faq: [
      {
        q: "Braucht ein Karosseriebauer Kenntnisse in Kalkulationsprogrammen?",
        a: "Nicht in jeder Stelle, aber sie können ein großer Vorteil sein, vor allem in kleineren Werkstätten. Wenn Sie einen ersten Kostenvoranschlag erstellen können oder mit Schadenkalkulationssystemen gearbeitet haben, ergänzen Sie das. So zeigen Sie, dass Sie auch die Abrechnung mit der Versicherung verstehen."
      },
      {
        q: "Karosseriebauer und Lackierer in einer Person – wie beschreibe ich das?",
        a: "Wenn Sie beides machen, schreiben Sie „Karosseriebauer und Lackierer“ in die Überschrift und teilen Sie Ihre Kenntnisse in zwei Gruppen. Kleinere Werkstätten suchen oft genau so jemanden. In größeren Betrieben betonen Sie die Spezialisierung, für die die Anzeige ausgeschrieben ist."
      }
    ]
  },
  "pakowacz": {
    slugLang: "verpackungsmitarbeiter",
    name: "Verpackungsmitarbeiter/in",
    title: "Lebenslauf Verpackungsmitarbeiter: Muster und Tipps",
    metaDescription: "Lebenslauf als Verpackungsmitarbeiter passend zur Anzeige. Muster, Begriffe aus Angeboten und Tipps zu Arbeitstempo, Qualitätskontrolle und Scannerbedienung.",
    intro: "Verpackungsmitarbeiter arbeiten in Lebensmittel- und Kosmetikbetrieben, in der Produktion und in Lagern von Onlineshops, und die Anzeigen unterscheiden sich vor allem in Leistungsvorgaben und Warenart. Arbeitgeber erwarten Sorgfalt, die Kontrolle der Produkte vor dem Verpacken und Arbeit nach Anweisung, oft im Schichtbetrieb. In E-Commerce-Lagern kommen Scannerbedienung und Etikettendruck hinzu, in Lebensmittelbetrieben wird meist ein ärztliches Zeugnis für sanitär-epidemiologische Zwecke (orzeczenie sanitarno-epidemiologiczne) verlangt. Erfahrung ist nicht immer nötig, gut beschrieben erhöht sie aber deutlich die Chancen.",
    keywords: [
      "Verpacken von Produkten",
      "visuelle Qualitätskontrolle",
      "Etikettieren",
      "Scannerbedienung",
      "Kommissionierung von Bestellungen",
      "Palettieren und Folieren",
      "Arbeiten nach Leistungsvorgabe",
      "Arbeit an der Produktionslinie",
      "sanitär-epidemiologisches Gesundheitszeugnis",
      "Schichtarbeit"
    ],
    tips: [
      "Schreiben Sie, was Sie verpackt haben und in welchem Tempo, etwa „Verpacken von Kosmetik in Versandkartons, ca. 600 Stück pro Schicht“. Zahlen zeigen, dass Sie die Vorgabe schaffen.",
      "Erwähnen Sie die Qualitätskontrolle: Aussortieren fehlerhafter Stücke, Prüfen von Datum und Aufdruck, Wiegen von Paketen. Für den Arbeitgeber ist das genauso wichtig wie Tempo.",
      "Wenn Sie Scanner, Etikettendrucker, Folienschweißgerät oder Palettenwickler bedient haben, gehört das zu den Kenntnissen. Solche Kleinigkeiten entscheiden oft, wer zuerst eingeladen wird.",
      "Für Arbeit mit Lebensmitteln ergänzen Sie, dass Sie ein gültiges sanitär-epidemiologisches Gesundheitszeugnis haben. Das spart dem Arbeitgeber Zeit, und Sie können schneller anfangen."
    ],
    sample: {
      name: "Monika Szewczyk",
      headline: "Verpackungsmitarbeiterin – Lebensmittelproduktion und E-Commerce",
      contact: ["+48 600 000 189", "monika.szewczyk@example.com", "Września", "linkedin.com/in/monika-szewczyk-przyklad"],
      summary: "Seit vier Jahren arbeite ich in der Verpackung in einem Lebensmittelbetrieb und im Lager eines Onlineshops. Ich erfülle regelmäßig die Vorgaben, prüfe Produkte vor dem Verpacken und bediene Scanner und Etikettendrucker. Ich habe ein gültiges sanitär-epidemiologisches Gesundheitszeugnis und bin bereit, in drei Schichten zu arbeiten.",
      skills: [
        "Manuelles Verpacken und Verpacken an der Linie",
        "Visuelle Kontrolle von Produkten und Verpackungen",
        "Bedienung von Scanner und Etikettendrucker",
        "Kommissionierung von Onlinebestellungen",
        "Folieren und Palettieren",
        "Bedienung eines Folienschweißgeräts",
        "Gültiges sanitär-epidemiologisches Gesundheitszeugnis"
      ],
      languages: ["Englisch A1"],
      jobs: [
        {
          title: "Verpackungsmitarbeiterin",
          company: "Wielkopolskie Przetwory Smakon Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Verpacken von Gläsern und Kartons an der Produktionslinie mit einer Vorgabe von ca. 1200 Packungen pro Schicht.",
            "Prüfen von Datum, Chargencode und Dichtheit der Deckel vor dem Palettieren.",
            "Folieren von Paletten und Kennzeichnung mit Logistiketiketten."
          ]
        },
        {
          title: "Packerin",
          company: "Sklep-Paka Logistics Sp. z o.o.",
          period: "09.2019 – 05.2020",
          bullets: [
            "Verpacken von Bestellungen eines Online-Modeshops, durchschnittlich 250 Pakete pro Schicht.",
            "Scannen von Produkten und Drucken von Versandetiketten.",
            "Melden von Fehlmengen und beschädigter Ware an die Schichtleitung."
          ]
        }
      ],
      education: {
        school: "Liceum Ogólnokształcące we Wrześni",
        degree: "Allgemeinbildende Oberschule (wykształcenie średnie)",
        period: "2015 – 2018"
      }
    },
    faq: [
      {
        q: "Brauche ich für einen Job in der Verpackung einen Lebenslauf?",
        a: "Oft ja, auch wenn die Anzeige einfach ist. Ein kurzer einseitiger Lebenslauf mit Erfahrung, Verfügbarkeit und Angabe zum Gesundheitszeugnis hilft, die Auswahl schnell zu passieren. Auch Personalagenturen sammeln Lebensläufe, um Sie einer Schicht und einem Betrieb zuzuordnen."
      },
      {
        q: "Was schreibe ich, wenn es mein erster Job ist?",
        a: "Beschreiben Sie Aushilfs-, Saisonjobs oder Mithilfe im Familienbetrieb, bei denen Sorgfalt und Tempo zählten. Ergänzen Sie Ihre Bereitschaft zur Schichtarbeit und ab wann Sie anfangen können. Ein kurzer Satz wie „Ich lerne schnell und arbeite nach Anweisung“ sollte mit einem konkreten Beispiel belegt sein."
      },
      {
        q: "Wie bekomme ich das sanitär-epidemiologische Gesundheitszeugnis?",
        a: "Es stellt ein Arbeitsmediziner nach Untersuchungen aus, meist auf Überweisung des Arbeitgebers. Manche lassen es vorab machen, um sofort in einem Lebensmittelbetrieb anfangen zu können. Wenn Sie es haben, nennen Sie es im Lebenslauf mit dem Hinweis, dass es gültig ist."
      }
    ]
  },
  "inzynier-produkcji": {
    slugLang: "produktionsingenieur",
    name: "Produktionsingenieur/in",
    title: "Lebenslauf Produktionsingenieur: Muster und Tipps",
    metaDescription: "Lebenslauf als Produktionsingenieur passend zur Anzeige: Muster, Schlüsselbegriffe aus Angeboten und Tipps zu Lean, Prozessanläufen, OEE und Projekten mit Ergebnissen.",
    intro: "Ein Produktionsingenieur sorgt dafür, dass Prozesse stabil, effizient und ohne unnötige Kosten laufen. In den Anzeigen wiederholen sich Lean-Werkzeuge (5S, SMED, Kaizen, VSM), die Arbeit mit Kennzahlen wie OEE und Ausschuss sowie das Erstellen von Prozessdokumentation, etwa PFMEA oder Arbeitsanweisungen. Firmen erwarten außerdem Mitarbeit bei Produktanläufen und Zusammenarbeit mit Qualität und Instandhaltung. Meist wird Englisch auf Niveau B2 verlangt, ein Six Sigma Green Belt ist ein Plus.",
    keywords: [
      "Optimierung von Produktionsprozessen",
      "Lean Manufacturing",
      "SMED",
      "Kennzahl OEE",
      "PFMEA",
      "Arbeitsanweisungen",
      "Einführung neuer Produkte",
      "Kaizen und kontinuierliche Verbesserung",
      "Six Sigma Green Belt",
      "Englisch B2"
    ],
    tips: [
      "Beschreiben Sie jedes Projekt mit einer Zahl: um wie viel die OEE stieg, die Rüstzeit sank oder der Ausschuss zurückging. In diesem Beruf ist die Kennzahl die Hauptsprache im Gespräch mit Vorgesetzten.",
      "Nennen Sie die Prozesse, die Sie technisch kennen: Spritzguss, Stanzen, Montage, Zerspanung, Roboterschweißen. Anzeigen suchen oft einen Ingenieur für eine bestimmte Technologie.",
      "Zeigen Sie die Werkzeuge, die Sie täglich nutzen: PFMEA, Produktionslenkungsplan, VSM, Ursachenanalyse, dazu Software wie AutoCAD, SolidWorks, Minitab oder ein ERP-Produktionsmodul.",
      "Beschreiben Sie die Zusammenarbeit mit anderen Abteilungen und Schichtleitern. Ein Produktionsingenieur setzt Veränderungen über Menschen um, daher sind Kaizen-Workshops oder Bedienerschulungen ein echter Vorteil."
    ],
    sample: {
      name: "Joanna Kwiatkowska",
      headline: "Produktionsingenieurin – Lean und Prozessanläufe",
      contact: ["+48 600 000 190", "joanna.kwiatkowska@example.com", "Bielsko-Biała", "linkedin.com/in/joanna-kwiatkowska-przyklad"],
      summary: "Produktionsingenieurin mit sieben Jahren Erfahrung in der Automobil- und Hausgeräteindustrie. Ich leite Lean-Projekte zur Effizienzsteigerung, erstelle Prozessdokumentation und führe neue Produkte an Montagelinien ein. Ich habe ein Six Sigma Green Belt Zertifikat.",
      skills: [
        "Lean Manufacturing: 5S, SMED, VSM, Kaizen",
        "Analyse und Verbesserung der OEE",
        "PFMEA, Produktionslenkungspläne und Arbeitsanweisungen",
        "Einführung neuer Produkte an Montagelinien",
        "Six Sigma Green Belt, Minitab",
        "AutoCAD und SolidWorks-Grundkenntnisse",
        "Leitung von Workshops und Schulung von Bedienern"
      ],
      languages: ["Englisch B2", "Deutsch A2"],
      jobs: [
        {
          title: "Produktionsingenieurin",
          company: "Beskid Automotive Systems Sp. z o.o.",
          period: "06.2020 – heute",
          bullets: [
            "Steigerung der OEE an einer Sitzmontagelinie von 71 % auf 80 % in 10 Monaten durch Stillstandsanalyse und SMED-Workshops.",
            "Einführung von drei neuen Produkten an Montagelinien, einschließlich PFMEA und Arbeitsanweisungen.",
            "Senkung des Ausschusses im Punktschweißprozess um ca. 30 % nach einem Six-Sigma-Projekt."
          ]
        },
        {
          title: "Junior-Prozessingenieurin",
          company: "Domtech AGD Sp. z o.o.",
          period: "07.2017 – 05.2020",
          bullets: [
            "Erstellen von Arbeitsanweisungen und Standardarbeit für eine Waschmaschinen-Montagelinie.",
            "Mitarbeit an 5S-Projekten und der Neugestaltung von Arbeitsplätzen, die die Taktzeit an zwei Stationen verkürzten.",
            "Erfassung von Stillstandsdaten und wöchentliche Berichte für den Produktionsleiter."
          ]
        }
      ],
      education: {
        school: "Akademia Techniczno-Humanistyczna w Bielsku-Białej",
        degree: "Diplom-Ingenieurin (Master), Produktionsmanagement und -technik",
        period: "2012 – 2017"
      }
    },
    faq: [
      {
        q: "Wie zeige ich Projektergebnisse, wenn meine Firma keine Daten nach außen gibt?",
        a: "Nutzen Sie relative Werte statt Beträge, etwa „Rüstzeit um 35 % verkürzt“ oder „Ausschuss um rund ein Drittel gesenkt“. So zeigen Sie die Größenordnung, ohne Finanzdaten offenzulegen. Seien Sie im Gespräch bereit zu erklären, wie Sie das Ergebnis gemessen haben."
      },
      {
        q: "Ist ein Lean- oder Six-Sigma-Zertifikat Pflicht?",
        a: "Meist nicht, aber es hilft deutlich, besonders bei großen Produktionsunternehmen. Wichtiger sind Projekte, die Sie tatsächlich umgesetzt haben. Wenn Sie ein Zertifikat haben, nennen Sie das Niveau (Yellow, Green, Black Belt) und beschreiben Sie das Projekt, mit dem Sie es abgeschlossen haben."
      }
    ]
  }
};

export const BATCH = { pl: PL, en: EN, uk: UK, de: DE };
