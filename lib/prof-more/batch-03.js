// Nowe zawody: paczka 03 (PL + tłumaczenia EN/UK/DE).
export const BATCH = {
  pl: [
    {
      slug: 'weterynarz',
      category: 'Zdrowie i opieka',
      name: 'Lekarz weterynarii',
      title: 'CV lekarza weterynarii: wzór i wskazówki',
      metaDescription: 'CV lekarza weterynarii pod ogłoszenie: wzór, słowa kluczowe z ofert lecznic i rady, jak opisać prawo wykonywania zawodu, specjalizację i zabiegi.',
      intro: 'Lecznice i kliniki weterynaryjne w ogłoszeniach zaczynają zwykle od prawa wykonywania zawodu lekarza weterynarii i informacji, czy kandydat ma pracować z psami i kotami, zwierzętami gospodarskimi czy egzotycznymi. Dalej pojawiają się konkretne umiejętności: diagnostyka obrazowa, zabiegi chirurgiczne, znieczulenie i gotowość do dyżurów. W praktykach terenowych liczy się też prawo jazdy kat. B i doświadczenie w pracy w gospodarstwach. Dobrze napisane CV pokazuje, co robisz samodzielnie, a co jeszcze pod nadzorem.',
      keywords: [
        'prawo wykonywania zawodu lekarza weterynarii',
        'leczenie małych zwierząt',
        'diagnostyka USG i RTG',
        'zabiegi chirurgiczne tkanek miękkich',
        'znieczulenie wziewne',
        'interna psów i kotów',
        'dyżury nocne i weekendowe',
        'praca ze zwierzętami gospodarskimi',
        'prowadzenie dokumentacji leczenia',
        'prawo jazdy kat. B'
      ],
      tips: [
        'Na samej górze podaj prawo wykonywania zawodu i izbę, w której jesteś zarejestrowany, a także rozpoczętą lub ukończoną specjalizację. To pierwsze, czego szuka kierownik lecznicy.',
        'Wypisz zabiegi, które wykonujesz samodzielnie, na przykład kastracje, sterylizacje, ekstrakcje zębów czy zszywanie ran, i oddziel je od tych, przy których asystujesz. Uczciwy podział buduje zaufanie.',
        'Wpisz sprzęt i badania: USG jamy brzusznej, RTG, analizatory krwi, endoskopia. Jeśli samodzielnie oceniasz zdjęcia RTG, zaznacz to wprost.',
        'Pokaż skalę pracy liczbami: ile wizyt dziennie przyjmujesz, ile dyżurów w miesiącu bierzesz, ile gospodarstw obsługujesz. Dla lecznicy całodobowej to ważniejsze niż lista kursów.'
      ],
      sample: {
        name: 'Karolina Pawlak',
        headline: 'Lekarz weterynarii – małe zwierzęta, chirurgia tkanek miękkich',
        contact: ['+48 600 000 121', 'karolina.pawlak@example.com', 'Zamość', 'linkedin.com/in/karolina-pawlak-przyklad'],
        summary: 'Lekarz weterynarii z ośmioletnim doświadczeniem w leczeniu psów i kotów. Samodzielnie prowadzę przyjęcia internistyczne, wykonuję badania USG i zabiegi chirurgii tkanek miękkich. Jestem w trakcie specjalizacji z chorób psów i kotów i regularnie biorę dyżury w lecznicy całodobowej.',
        skills: [
          'Prawo wykonywania zawodu lekarza weterynarii',
          'Badanie USG jamy brzusznej',
          'Wykonywanie i ocena zdjęć RTG',
          'Kastracje, sterylizacje i zabiegi tkanek miękkich',
          'Znieczulenie wziewne i monitorowanie pacjenta',
          'Stomatologia: skaling i ekstrakcje',
          'Rozmowa z opiekunami zwierząt'
        ],
        languages: ['angielski B2'],
        jobs: [
          {
            title: 'Lekarz weterynarii',
            company: 'Całodobowa Lecznica dla Zwierząt Animed Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Przyjmowanie średnio 18–22 pacjentów dziennie w gabinecie internistycznym.',
              'Samodzielne wykonywanie około 40 zabiegów chirurgicznych miesięcznie, głównie kastracji i usunięć guzów skóry.',
              'Pełnienie 4–5 dyżurów nocnych w miesiącu, w tym przyjmowanie przypadków nagłych.'
            ]
          },
          {
            title: 'Młodszy lekarz weterynarii',
            company: 'Gabinet Weterynaryjny Pod Lipami s.c.',
            period: '10.2018 – 05.2020',
            bullets: [
              'Prowadzenie wizyt profilaktycznych: szczepienia, odrobaczanie, czipowanie.',
              'Asysta przy zabiegach i przygotowanie pacjentów do znieczulenia.',
              'Pobieranie materiału do badań i interpretacja wyników morfologii i biochemii krwi.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet Przyrodniczy w Lublinie',
          degree: 'Weterynaria (jednolite studia magisterskie)',
          period: '2012 – 2018'
        }
      },
      faq: [
        {
          q: 'Czy w CV wpisywać numer prawa wykonywania zawodu?',
          a: 'Wystarczy informacja, że masz prawo wykonywania zawodu i w której okręgowej izbie lekarsko-weterynaryjnej jesteś zarejestrowany. Pracodawca i tak sprawdzi dokument przy zatrudnieniu. Podanie numeru nie jest błędem, ale nie jest konieczne.'
        },
        {
          q: 'Jak opisać specjalizację, której jeszcze nie ukończyłem?',
          a: 'Napisz „w trakcie specjalizacji” z nazwą dziedziny i przewidywanym rokiem egzaminu. Lecznice cenią lekarzy, którzy się rozwijają, więc to atut jeszcze przed uzyskaniem tytułu specjalisty.'
        },
        {
          q: 'Czy po kilku latach z małymi zwierzętami mogę aplikować do praktyki z bydłem?',
          a: 'Tak, ale wyraźnie pokaż wszystko, co łączy się z dużymi zwierzętami: praktyki studenckie w gospodarstwach, pomoc przy porodach, badania rozrodu. W podsumowaniu napisz wprost, że chcesz rozwijać się w tym kierunku, i podkreśl prawo jazdy.'
        }
      ]
    },
    {
      slug: 'terapeuta-zajeciowy',
      category: 'Zdrowie i opieka',
      name: 'Terapeuta zajęciowy',
      title: 'CV terapeuty zajęciowego: wzór i wskazówki',
      metaDescription: 'CV terapeuty zajęciowego dopasowane do ogłoszenia z DPS, ŚDS lub WTZ. Wzór, słowa kluczowe i wskazówki, jak opisać pracownie, metody i plany terapii.',
      intro: 'Terapeutów zajęciowych zatrudniają głównie domy pomocy społecznej, środowiskowe domy samopomocy, warsztaty terapii zajęciowej, zakłady opiekuńczo-lecznicze i oddziały rehabilitacji. W ogłoszeniach pracodawcy pytają o wykształcenie kierunkowe, czyli szkołę policealną lub studia z terapii zajęciowej, oraz o doświadczenie z konkretną grupą: osobami starszymi, z niepełnosprawnością intelektualną albo po udarze. Liczy się też prowadzenie dokumentacji, w tym indywidualnych planów terapii. W CV warto pokazać pracownie i metody, które znasz z praktyki, a nie tylko z zajęć w szkole.',
      keywords: [
        'wykształcenie kierunkowe: terapia zajęciowa',
        'prowadzenie zajęć grupowych i indywidualnych',
        'indywidualny plan terapii',
        'trening umiejętności społecznych',
        'trening czynności dnia codziennego',
        'arteterapia',
        'praca z osobami z niepełnosprawnością intelektualną',
        'praca z osobami starszymi',
        'prowadzenie dokumentacji uczestnika',
        'organizacja wyjść i imprez integracyjnych'
      ],
      tips: [
        'Napisz, z jaką grupą pracowałeś i ilu uczestników miałeś pod opieką. Praca z seniorami z otępieniem w DPS wymaga innych umiejętności niż prowadzenie pracowni w WTZ dla młodych dorosłych.',
        'Wymień pracownie, które prowadzisz: plastyczną, ceramiczną, kulinarną, stolarską, komputerową czy ogrodniczą. Placówka często szuka osoby do konkretnej pracowni.',
        'Pokaż, że umiesz pracować na dokumentach: diagnoza funkcjonalna, indywidualny plan terapii, ocena postępów, sprawozdania. W wielu placówkach to warunek konieczny.',
        'Dodaj kursy, które przekładasz na zajęcia, na przykład Metodę Ruchu Rozwijającego Weroniki Sherborne, muzykoterapię czy trening pamięci. Krótko napisz, jak z nich korzystasz.'
      ],
      sample: {
        name: 'Tomasz Wróblewski',
        headline: 'Terapeuta zajęciowy – praca z osobami z niepełnosprawnością intelektualną',
        contact: ['+48 600 000 122', 'tomasz.wroblewski@example.com', 'Elbląg', 'linkedin.com/in/tomasz-wroblewski-przyklad'],
        summary: 'Terapeuta zajęciowy z ośmioletnim doświadczeniem w warsztacie terapii zajęciowej i domu pomocy społecznej. Prowadzę pracownię stolarsko-ceramiczną i treningi samodzielności, przygotowuję indywidualne plany terapii i oceny postępów. Współpracuję z psychologiem, fizjoterapeutą i rodzinami uczestników.',
        skills: [
          'Indywidualne plany terapii i ocena postępów',
          'Trening czynności dnia codziennego',
          'Trening umiejętności społecznych',
          'Prowadzenie pracowni ceramicznej i stolarskiej',
          'Arteterapia i muzykoterapia w grupie',
          'Metoda Ruchu Rozwijającego Weroniki Sherborne',
          'Współpraca z rodzinami i zespołem terapeutycznym'
        ],
        languages: ['angielski A2'],
        jobs: [
          {
            title: 'Terapeuta zajęciowy – instruktor pracowni',
            company: 'Warsztat Terapii Zajęciowej Stowarzyszenia Krok Dalej',
            period: '06.2020 – obecnie',
            bullets: [
              'Prowadzenie pracowni stolarsko-ceramicznej dla grupy 6 uczestników.',
              'Opracowywanie i aktualizacja indywidualnych planów terapii oraz półrocznych ocen postępów.',
              'Przygotowanie uczestników i ich prac do 3 kiermaszy rocznie organizowanych w mieście.'
            ]
          },
          {
            title: 'Terapeuta zajęciowy',
            company: 'Dom Pomocy Społecznej Przystań',
            period: '09.2017 – 05.2020',
            bullets: [
              'Prowadzenie zajęć grupowych dla mieszkańców w wieku senioralnym, w tym treningu pamięci.',
              'Trening czynności dnia codziennego z osobami po udarze we współpracy z fizjoterapeutą.',
              'Organizacja wyjść kulturalnych i uroczystości dla około 60 mieszkańców.'
            ]
          }
        ],
        education: {
          school: 'Medyczna Szkoła Policealna w Elblągu',
          degree: 'Terapeuta zajęciowy',
          period: '2015 – 2017'
        }
      },
      faq: [
        {
          q: 'Czy po krótkim kursie terapii zajęciowej mogę pracować jako terapeuta?',
          a: 'W ogłoszeniach z DPS, ŚDS i WTZ zwykle wymagane jest wykształcenie kierunkowe, czyli ukończona szkoła policealna lub studia z terapii zajęciowej. Krótki kurs może być atutem, ale rzadko je zastępuje. W CV wpisz go w sekcji kursów, a nie jako wykształcenie, żeby nie wprowadzać rekrutera w błąd.'
        },
        {
          q: 'Jak opisać pracę z uczestnikami, nie naruszając ich prywatności?',
          a: 'Pisz ogólnie: grupa wiekowa, rodzaj niepełnosprawności, liczba osób i efekty pracy. Nie podawaj imion, diagnoz konkretnych osób ani zdjęć z zajęć. Takie podejście samo w sobie pokazuje, że rozumiesz zasady poufności.'
        }
      ]
    },
    {
      slug: 'pracownik-biurowy',
      category: 'Biuro, finanse i HR',
      name: 'Pracownik biurowy',
      title: 'CV pracownika biurowego: wzór i wskazówki',
      metaDescription: 'CV pracownika biurowego pod konkretne ogłoszenie. Wzór, słowa kluczowe z ofert i rady, jak opisać obieg dokumentów, Excel i obsługę korespondencji.',
      intro: 'Ogłoszenia na stanowisko pracownika biurowego bywają bardzo różne: od obsługi sekretariatu w małej firmie po wprowadzanie danych w dziale sprzedaży czy logistyki. Prawie zawsze powtarzają się jednak te same wymagania: dobra znajomość pakietu MS Office, zwłaszcza Excela, dokładność, obsługa korespondencji i obieg dokumentów. Część pracodawców dopisuje znajomość programu do fakturowania lub systemu ERP. W CV najważniejsze jest więc pokazanie konkretnych zadań i narzędzi, a nie ogólnych cech charakteru.',
      keywords: [
        'obsługa pakietu MS Office',
        'Excel: tabele przestawne i WYSZUKAJ.PIONOWO',
        'obieg dokumentów',
        'obsługa korespondencji przychodzącej i wychodzącej',
        'wprowadzanie danych do systemu',
        'wystawianie faktur',
        'archiwizacja dokumentów',
        'obsługa telefoniczna i mailowa klientów',
        'przygotowywanie zestawień i raportów',
        'dokładność i dobra organizacja pracy'
      ],
      tips: [
        'Zamiast pisać „biegła znajomość MS Office”, podaj, co robisz w Excelu: tabele przestawne, WYSZUKAJ.PIONOWO, filtry, proste wykresy. Na rozmowie możesz dostać krótkie zadanie praktyczne, więc pisz zgodnie z prawdą.',
        'Wymień programy, w których pracowałeś, na przykład systemy do fakturowania, ERP czy CRM. Nawet jeśli firma ma inny system, doświadczenie z podobnym narzędziem skraca wdrożenie.',
        'Opisz skalę obowiązków: ile dokumentów dziennie wprowadzasz, ile faktur miesięcznie wystawiasz, ilu kontrahentów obsługujesz. Liczby odróżniają cię od kandydatów z ogólnikowym CV.',
        'Jeśli ogłoszenie dotyczy konkretnego działu, na przykład logistyki lub kadr, podkreśl zadania z tego obszaru. Pracownik biurowy w spedycji robi zupełnie co innego niż w biurze rachunkowym.'
      ],
      sample: {
        name: 'Natalia Zając',
        headline: 'Pracownik biurowy – obsługa dokumentów i klientów',
        contact: ['+48 600 000 123', 'natalia.zajac@example.com', 'Opole', 'linkedin.com/in/natalia-zajac-przyklad'],
        summary: 'Od ośmiu lat pracuję w administracji biurowej firm handlowych i usługowych. Prowadzę obieg dokumentów, wystawiam faktury, przygotowuję zestawienia w Excelu i obsługuję korespondencję z klientami. Lubię porządek w dokumentach i szybko uczę się nowych systemów.',
        skills: [
          'Excel: tabele przestawne, WYSZUKAJ.PIONOWO, formatowanie warunkowe',
          'Word i Outlook',
          'Fakturowanie i korekty faktur',
          'Obsługa systemu ERP (moduł sprzedaży)',
          'Obieg i archiwizacja dokumentów',
          'Obsługa klienta telefonicznie i mailowo',
          'Prawo jazdy kat. B'
        ],
        languages: ['angielski B1'],
        jobs: [
          {
            title: 'Pracownik biurowy',
            company: 'Hurtownia Materiałów Budowlanych Opal-Bud Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Wystawianie około 350 faktur miesięcznie i przygotowywanie korekt.',
              'Prowadzenie rejestru umów i archiwizacja dokumentacji handlowej.',
              'Przygotowywanie cotygodniowych zestawień sprzedaży w Excelu dla kierownika oddziału.'
            ]
          },
          {
            title: 'Asystentka biura',
            company: 'Biuro Rachunkowe Bilans-Plus s.c.',
            period: '03.2018 – 05.2020',
            bullets: [
              'Przyjmowanie i rejestrowanie dokumentów od około 40 klientów biura.',
              'Obsługa centrali telefonicznej i poczty elektronicznej.',
              'Wprowadzanie danych do programu księgowego pod nadzorem księgowej.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet Opolski',
          degree: 'Administracja (licencjat)',
          period: '2014 – 2017'
        }
      },
      faq: [
        {
          q: 'Czy bez doświadczenia mogę napisać dobre CV pracownika biurowego?',
          a: 'Tak. Opisz praktyki, staże, pracę w samorządzie studenckim czy wolontariat, jeśli wymagały pracy z dokumentami, Excelem lub kontaktu z ludźmi. Dodaj kursy, na przykład z Excela, i napisz konkretnie, czego się nauczyłeś. Na stanowiska biurowe pracodawcy często szukają osób dokładnych i chętnych do nauki, a nie tylko tych z długim stażem.'
        },
        {
          q: 'Jak opisać znajomość Excela, żeby nie przesadzić?',
          a: 'Wypisz konkretne funkcje i zadania, które wykonujesz bez pomocy, zamiast ogólnego poziomu. Jeśli makra lub Power Query znasz tylko z kursu, napisz „podstawy”. Rekruterzy coraz częściej sprawdzają Excela krótkim testem.'
        }
      ]
    },
    {
      slug: 'office-manager',
      category: 'Biuro, finanse i HR',
      name: 'Office Manager',
      title: 'CV Office Managera: wzór i wskazówki',
      metaDescription: 'CV Office Managera pod ogłoszenie: wzór, słowa kluczowe z ofert i rady, jak opisać budżet biura, pracę z dostawcami i organizację wydarzeń firmowych.',
      intro: 'Office Manager odpowiada za to, żeby biuro po prostu działało: od zamówień i umów z dostawcami, przez recepcję i podróże służbowe, po organizację spotkań i wydarzeń firmowych. W ogłoszeniach pracodawcy często łączą to z elementami administracji kadrowej, wsparciem zarządu i kontrolą kosztów biura. Bardzo często wymagany jest angielski na poziomie komunikatywnym lub wyższym, bo wiele takich ofert pochodzi z firm międzynarodowych. Dobre CV pokazuje zakres odpowiedzialności i oszczędności, a nie tylko listę czynności.',
      keywords: [
        'zarządzanie biurem',
        'współpraca z dostawcami i negocjowanie umów',
        'kontrola budżetu biura',
        'organizacja wydarzeń firmowych',
        'organizacja podróży służbowych',
        'wsparcie zarządu',
        'obsługa recepcji',
        'wdrażanie nowych pracowników (onboarding)',
        'zamawianie materiałów biurowych',
        'język angielski komunikatywny'
      ],
      tips: [
        'Podaj wielkość biura i zespołu, którym się zajmujesz, na przykład „biuro na 80 osób, dwa piętra, recepcja i sala konferencyjna”. To od razu pokazuje poziom stanowiska.',
        'Pokaż pieniądze: jakim budżetem zarządzasz i co udało się zaoszczędzić, na przykład po zmianie firmy sprzątającej czy renegocjacji umowy na catering. Office Manager z wynikami finansowymi wyróżnia się na tle innych kandydatów.',
        'Opisz wydarzenia, które organizowałeś: liczba uczestników, budżet, miejsce. Wyjazd integracyjny dla 120 osób to konkretne doświadczenie projektowe.',
        'Jeśli zajmowałeś się przeprowadzką biura, wdrożeniem systemu rezerwacji sal czy procesem onboardingu, wpisz to osobno. Takie projekty są dla rekrutera dowodem samodzielności.'
      ],
      sample: {
        name: 'Agnieszka Kubiak',
        headline: 'Office Manager – biuro firmy IT na 90 osób',
        contact: ['+48 600 000 124', 'agnieszka.kubiak@example.com', 'Wrocław', 'linkedin.com/in/agnieszka-kubiak-przyklad'],
        summary: 'Od dziewięciu lat pracuję w administracji biurowej, w tym sześć lat jako Office Manager w firmie technologicznej. Odpowiadam za budżet administracyjny, umowy z dostawcami, recepcję i organizację wydarzeń. Przeprowadziłam przeprowadzkę biura i wdrożyłam proces onboardingu, z którego korzysta cały dział HR.',
        skills: [
          'Zarządzanie budżetem biura',
          'Negocjacje z dostawcami usług',
          'Organizacja wydarzeń i wyjazdów firmowych',
          'Rezerwacje podróży służbowych',
          'Onboarding nowych pracowników',
          'MS Office i Google Workspace',
          'Angielski w codziennej pracy'
        ],
        languages: ['angielski C1', 'niemiecki A2'],
        jobs: [
          {
            title: 'Office Manager',
            company: 'Codera Solutions Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Zarządzanie biurem na 90 osób i rocznym budżetem administracyjnym około 600 tys. zł.',
              'Renegocjacja umów na sprzątanie i catering, która obniżyła te koszty o 14% rocznie.',
              'Organizacja 2 wyjazdów integracyjnych rocznie dla ponad 100 uczestników.'
            ]
          },
          {
            title: 'Asystentka zarządu',
            company: 'Fiskus-Pro Doradztwo Podatkowe Sp. z o.o.',
            period: '02.2017 – 05.2020',
            bullets: [
              'Prowadzenie kalendarzy dwóch członków zarządu i organizacja spotkań z klientami.',
              'Obsługa recepcji, poczty i rezerwacji sal konferencyjnych.',
              'Zamawianie materiałów biurowych i kontrola faktur od dostawców.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet Ekonomiczny we Wrocławiu',
          degree: 'Zarządzanie (magister)',
          period: '2012 – 2017'
        }
      },
      faq: [
        {
          q: 'Czym różni się CV Office Managera od CV asystentki?',
          a: 'W CV Office Managera powinna być widoczna odpowiedzialność: budżet, decyzje o dostawcach, projekty i ludzie, za których odpowiadasz. Asystentka opisuje głównie wsparcie konkretnej osoby. Jeśli przechodzisz z asystentury na stanowisko Office Managera, wyciągnij na pierwszy plan zadania, w których decydowałaś samodzielnie.'
        },
        {
          q: 'Czy pisać CV po angielsku, jeśli ogłoszenie jest po angielsku?',
          a: 'Zwykle tak. Ogłoszenie po angielsku to sygnał, że w biurze ten język jest używany na co dzień, a rekruter może nie mówić po polsku. Jeśli ogłoszenie jest po polsku, ale wymaga angielskiego, wystarczy polskie CV z dokładnie opisanym poziomem języka.'
        }
      ]
    },
    {
      slug: 'analityk-finansowy',
      category: 'Biuro, finanse i HR',
      name: 'Analityk finansowy',
      title: 'CV analityka finansowego: wzór i wskazówki',
      metaDescription: 'CV analityka finansowego pod ogłoszenie. Wzór, słowa kluczowe z ofert i rady, jak opisać modele finansowe, Excel, SQL, Power BI i certyfikat CFA.',
      intro: 'Analityk finansowy przygotowuje budżety, prognozy i analizy, na podstawie których zarząd podejmuje decyzje. W ogłoszeniach firm produkcyjnych, centrów usług wspólnych i banków powtarzają się te same wymagania: zaawansowany Excel, budowanie modeli finansowych, raportowanie wyników i dobra znajomość angielskiego. Coraz częściej pojawia się też SQL i narzędzia BI, na przykład Power BI. Certyfikaty CFA lub ACCA zwykle nie są obowiązkowe, ale wyraźnie podnoszą wartość kandydata.',
      keywords: [
        'analiza finansowa',
        'budżetowanie i prognozowanie (forecast)',
        'modelowanie finansowe',
        'zaawansowana znajomość Excela',
        'raportowanie zarządcze',
        'analiza odchyleń',
        'Power BI',
        'SQL',
        'znajomość SAP',
        'angielski biegły'
      ],
      tips: [
        'Opisz analizy, które przygotowujesz, i to, czemu służą: prognoza przepływów pieniężnych, analiza rentowności produktów, model opłacalności inwestycji. Sama nazwa stanowiska nie mówi rekruterowi, czym się zajmowałeś.',
        'Pokaż efekt swojej pracy: skrócony czas raportowania, zautomatyzowany raport, decyzja zarządu oparta na twojej analizie. Liczby i procenty są tu naturalne.',
        'Wpisz narzędzia razem z tym, co w nich robisz: Excel (modele, Power Query), SQL (zapytania, złączenia), Power BI (dashboardy). Ogłoszenia w finansach są filtrowane właśnie po tych słowach.',
        'Jeśli zdajesz CFA lub ACCA, podaj zdane poziomy lub egzaminy i planowany termin kolejnego. To pokazuje, że rozwijasz się systematycznie.'
      ],
      sample: {
        name: 'Michał Sobczak',
        headline: 'Analityk finansowy – FP&A',
        contact: ['+48 600 000 125', 'michal.sobczak@example.com', 'Kraków', 'linkedin.com/in/michal-sobczak-przyklad'],
        summary: 'Analityk finansowy z ośmioletnim doświadczeniem, od sześciu lat w zespole FP&A firmy produkcyjnej. Przygotowuję budżety, prognozy kwartalne i analizy rentowności, buduję modele w Excelu i dashboardy w Power BI. Zdałem egzamin CFA Level II.',
        skills: [
          'Budżetowanie i prognozowanie',
          'Modelowanie finansowe w Excelu',
          'Power Query i Power BI',
          'SQL: zapytania i złączenia',
          'SAP FI/CO (raporty)',
          'Analiza rentowności produktów i klientów',
          'Prezentowanie wyników kadrze zarządzającej'
        ],
        languages: ['angielski C1'],
        jobs: [
          {
            title: 'Analityk finansowy (FP&A)',
            company: 'Kartonex Opakowania Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Przygotowanie rocznego budżetu i prognoz kwartalnych dla 3 zakładów produkcyjnych.',
              'Budowa dashboardu w Power BI, który skrócił miesięczne raportowanie z 4 do 2 dni.',
              'Analiza rentowności 200 indeksów produktowych, na której oparto zmiany w cenniku.'
            ]
          },
          {
            title: 'Młodszy analityk finansowy',
            company: 'Finexa Centrum Usług Księgowych Sp. z o.o.',
            period: '07.2018 – 05.2020',
            bullets: [
              'Przygotowywanie miesięcznych raportów wyników dla klientów z Wielkiej Brytanii i Niemiec.',
              'Analiza odchyleń kosztów od budżetu i przygotowanie komentarzy dla kontrolera.',
              'Uzgadnianie danych między SAP a raportami w Excelu.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet Ekonomiczny w Krakowie',
          degree: 'Finanse i rachunkowość (magister)',
          period: '2013 – 2018'
        }
      },
      faq: [
        {
          q: 'Czy bez CFA mam szanse na stanowisko analityka finansowego?',
          a: 'Tak, większość ogłoszeń traktuje CFA lub ACCA jako atut, a nie wymóg. Ważniejsze są umiejętności praktyczne: Excel, rozumienie sprawozdań finansowych i umiejętność wyjaśnienia liczb osobom spoza finansów. Jeśli myślisz o certyfikacie, wpisz w CV, że przygotowujesz się do egzaminu.'
        },
        {
          q: 'Jak pokazać wyniki w CV, skoro obowiązuje mnie tajemnica firmy?',
          a: 'Podawaj skalę i efekt w przybliżeniu albo procentowo, zamiast konkretnych kwot i nazw klientów. Na przykład: „budżet kosztów o wartości kilkudziesięciu milionów złotych” lub „skrócenie raportowania o połowę”. To wystarczy, żeby pokazać poziom odpowiedzialności.'
        }
      ]
    },
    {
      slug: 'kontroler-finansowy',
      category: 'Biuro, finanse i HR',
      name: 'Kontroler finansowy',
      title: 'CV kontrolera finansowego: wzór i wskazówki',
      metaDescription: 'CV kontrolera finansowego pod ogłoszenie. Wzór, słowa kluczowe z ofert i rady, jak opisać controlling, zamknięcie miesiąca, budżety i ACCA lub CIMA.',
      intro: 'Kontroler finansowy pilnuje, żeby liczby w firmie były wiarygodne i żeby zarząd wiedział, skąd biorą się odchylenia od planu. W ogłoszeniach zwykle pojawia się kontrola kosztów, udział w zamknięciu miesiąca, budżetowanie, raportowanie do centrali oraz współpraca z księgowością i audytorami. Pracodawcy pytają o znajomość ustawy o rachunkowości, a gdy firma należy do zagranicznej grupy, także MSSF lub US GAAP. Przy samodzielnych stanowiskach częstym oczekiwaniem jest kilkuletnie doświadczenie w controllingu lub audycie i certyfikat ACCA albo CIMA.',
      keywords: [
        'controlling finansowy',
        'zamknięcie miesiąca i roku',
        'budżetowanie i kontrola kosztów',
        'analiza odchyleń plan a wykonanie',
        'raportowanie do grupy kapitałowej',
        'znajomość MSSF',
        'ustawa o rachunkowości',
        'współpraca z audytorem',
        'controlling kosztów produkcji',
        'ACCA lub CIMA'
      ],
      tips: [
        'Napisz, w jakim środowisku pracujesz: spółka polska czy część zagranicznej grupy, jakie standardy raportowania, jaki system ERP. Kontrolera z doświadczeniem w raportowaniu do grupy szuka się częściej niż kogoś, kto zna tylko polskie przepisy.',
        'Opisz swój udział w zamknięciu miesiąca: termin, obszary, za które odpowiadasz, uzgodnienia, które przygotowujesz. Skrócenie zamknięcia z dziesięciu do pięciu dni roboczych to mocny punkt.',
        'Pokaż wpływ na koszty: wdrożone kontrole, wykryte nieprawidłowości, zmiany w procesie zakupów. Kontrolera ocenia się po tym, czy jego analizy przekładają się na decyzje.',
        'Jeśli przeszedłeś z audytu, nazwij branże i typy spółek, które badałeś. To pokazuje, że znasz różne modele biznesowe i wiesz, czego oczekuje biegły rewident.'
      ],
      sample: {
        name: 'Joanna Mazurek',
        headline: 'Kontroler finansowy – raportowanie grupowe i controlling kosztów',
        contact: ['+48 600 000 126', 'joanna.mazurek@example.com', 'Bielsko-Biała', 'linkedin.com/in/joanna-mazurek-przyklad'],
        summary: 'Kontroler finansowy z jedenastoletnim doświadczeniem, w tym prawie pięć lat w audycie. Odpowiadam za zamknięcie miesiąca, raportowanie do grupy według MSSF i controlling kosztów produkcji w spółce z niemieckim kapitałem. Mam kwalifikację ACCA.',
        skills: [
          'Zamknięcie miesiąca i roku',
          'Raportowanie według MSSF i ustawy o rachunkowości',
          'Controlling kosztów produkcji',
          'Budżetowanie i analiza odchyleń',
          'SAP FI/CO',
          'Współpraca z biegłym rewidentem',
          'Zaawansowany Excel i Power Query'
        ],
        languages: ['angielski C1', 'niemiecki B1'],
        jobs: [
          {
            title: 'Kontroler finansowy',
            company: 'Beskid Komponenty Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Koordynacja zamknięcia miesiąca i skrócenie go z 8 do 5 dni roboczych.',
              'Przygotowanie pakietów raportowych według MSSF dla niemieckiej spółki matki.',
              'Wdrożenie miesięcznej analizy zużycia materiałów, która zmniejszyła odchylenia od norm o 18%.'
            ]
          },
          {
            title: 'Starszy asystent w dziale audytu',
            company: 'Rewident-Konsult Sp. z o.o.',
            period: '09.2015 – 05.2020',
            bullets: [
              'Badanie sprawozdań finansowych spółek produkcyjnych i handlowych.',
              'Prowadzenie zespołu 2–3 asystentów podczas prac u klienta.',
              'Przygotowywanie listów do zarządu z rekomendacjami dotyczącymi kontroli wewnętrznej.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet Ekonomiczny w Katowicach',
          degree: 'Finanse i rachunkowość (magister)',
          period: '2010 – 2015'
        }
      },
      faq: [
        {
          q: 'Czy kontroler finansowy musi mieć uprawnienia księgowe?',
          a: 'Nie ma takiego wymogu w przepisach, ale pracodawcy oczekują dobrej znajomości rachunkowości i często doświadczenia w księgowości lub audycie. Certyfikaty ACCA, CIMA czy certyfikat księgowy są dobrze widziane. W CV podaj je z rokiem uzyskania albo listą zdanych egzaminów.'
        },
        {
          q: 'Jak opisać w CV przejście z audytu do controllingu?',
          a: 'Pokaż, że znasz procesy od środka: wymień obszary, które badałeś najczęściej, na przykład zapasy, przychody czy środki trwałe. Dodaj projekty doradcze lub wsparcie przy zamknięciach u klientów. W podsumowaniu napisz wprost, dlaczego chcesz pracować po stronie firmy.'
        }
      ]
    },
    {
      slug: 'agent-ubezpieczeniowy',
      category: 'Biuro, finanse i HR',
      name: 'Agent ubezpieczeniowy',
      title: 'CV agenta ubezpieczeniowego: wzór i wskazówki',
      metaDescription: 'CV agenta ubezpieczeniowego pod ogłoszenie. Wzór, słowa kluczowe z ofert i rady, jak opisać wyniki sprzedaży, portfel klientów i wpis do rejestru KNF.',
      intro: 'Agentów ubezpieczeniowych szukają zarówno towarzystwa ubezpieczeniowe, jak i multiagencje, a oferty dotyczą najczęściej sprzedaży ubezpieczeń komunikacyjnych, majątkowych i na życie. Kandydat bez doświadczenia przechodzi zwykle szkolenie i egzamin, a potem zostaje wpisany do rejestru agentów prowadzonego przez KNF. Pracodawcy pytają o doświadczenie w sprzedaży, własną bazę klientów i gotowość do pracy na prowizji lub w modelu B2B. W CV najlepiej działają konkretne wyniki: liczba polis, wartość składki i utrzymanie klientów.',
      keywords: [
        'sprzedaż ubezpieczeń komunikacyjnych OC i AC',
        'ubezpieczenia na życie',
        'ubezpieczenia majątkowe',
        'wpis do rejestru agentów ubezpieczeniowych',
        'pozyskiwanie nowych klientów',
        'obsługa portfela klientów',
        'analiza potrzeb klienta',
        'realizacja planów sprzedażowych',
        'współpraca na podstawie umowy agencyjnej',
        'prawo jazdy kat. B'
      ],
      tips: [
        'Podaj wyniki: liczbę sprzedanych polis, wartość składki w skali roku, miejsce w rankingu sieci. Agenta ocenia się po liczbach i rekruter oczekuje ich w CV.',
        'Napisz, czy pracowałeś jako agent wyłączny jednego towarzystwa, czy w multiagencji, i jakie produkty sprzedajesz. Doświadczenie z ubezpieczeniami na życie i firmowymi jest cenione wyżej niż sama sprzedaż OC.',
        'Wpisz, że masz aktualny wpis do rejestru agentów i odbywasz coroczne szkolenia zawodowe. Jeśli jeszcze nie masz wpisu, napisz, że jesteś gotów przejść szkolenie i egzamin.',
        'Pokaż, jak dbasz o klientów: odsetek wznowień, polecenia, pomoc przy szkodach. Agent, który utrzymuje portfel, jest dla agencji cenniejszy niż ktoś, kto tylko sprzedaje nowe polisy.'
      ],
      sample: {
        name: 'Robert Kaczmarczyk',
        headline: 'Agent ubezpieczeniowy – ubezpieczenia komunikacyjne i na życie',
        contact: ['+48 600 000 127', 'robert.kaczmarczyk@example.com', 'Siedlce', 'linkedin.com/in/robert-kaczmarczyk-przyklad'],
        summary: 'Od ośmiu lat sprzedaję ubezpieczenia komunikacyjne, majątkowe i na życie, najpierw jako agent wyłączny, a obecnie w multiagencji. Obsługuję portfel ponad 900 klientów indywidualnych i małych firm, a co roku ponad 80% z nich wznawia u mnie polisy. Mam aktualny wpis do rejestru agentów ubezpieczeniowych.',
        skills: [
          'Sprzedaż ubezpieczeń OC, AC i NNW',
          'Ubezpieczenia na życie i ochronne',
          'Ubezpieczenia mieszkań i małych firm',
          'Analiza potrzeb i porównywanie ofert',
          'Obsługa kalkulatorów kilku towarzystw',
          'Pozyskiwanie klientów z poleceń',
          'Prawo jazdy kat. B'
        ],
        languages: ['angielski A2'],
        jobs: [
          {
            title: 'Agent ubezpieczeniowy',
            company: 'Multiagencja Ubezpieczeniowa Bezpieczny Dom s.c.',
            period: '06.2020 – obecnie',
            bullets: [
              'Sprzedaż średnio 70 polis miesięcznie, głównie komunikacyjnych i mieszkaniowych.',
              'Zwiększenie udziału ubezpieczeń na życie w moim portfelu z 5% do 22% składki.',
              'Pomoc klientom przy zgłaszaniu szkód i kontakt z likwidatorami.'
            ]
          },
          {
            title: 'Agent wyłączny',
            company: 'Polisa-Serwis Agencja Ubezpieczeniowa Sp. z o.o.',
            period: '04.2018 – 05.2020',
            bullets: [
              'Pozyskiwanie klientów indywidualnych na ubezpieczenia na życie.',
              'Realizacja kwartalnych planów sprzedaży średnio na poziomie 110%.',
              'Spotkania z klientami w biurze i u klientów na terenie powiatu.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet w Siedlcach',
          degree: 'Ekonomia (licencjat)',
          period: '2013 – 2016'
        }
      },
      faq: [
        {
          q: 'Czy muszę mieć doświadczenie w ubezpieczeniach, żeby zostać agentem?',
          a: 'Nie, wiele agencji szkoli osoby z doświadczeniem w innej sprzedaży lub obsłudze klienta. Przed rozpoczęciem pracy trzeba przejść szkolenie i zdać egzamin, a potem uzyskać wpis do rejestru agentów. W CV pokaż wyniki z poprzedniej sprzedaży i łatwość nawiązywania kontaktów.'
        },
        {
          q: 'Czy wpisywać w CV wyniki sprzedaży, jeśli nie były najlepsze?',
          a: 'Podaj te dane, które dobrze pokazują twoją pracę, na przykład utrzymanie klientów albo wzrost w konkretnym produkcie. Nie musisz wymieniać wyników z każdego miesiąca. Pamiętaj, że na rozmowie możesz zostać zapytany o szczegóły, więc liczby muszą być prawdziwe.'
        }
      ]
    },
    {
      slug: 'specjalista-ds-windykacji',
      category: 'Biuro, finanse i HR',
      name: 'Specjalista ds. windykacji',
      title: 'CV specjalisty ds. windykacji: wzór i wskazówki',
      metaDescription: 'CV specjalisty ds. windykacji pod ogłoszenie. Wzór, słowa kluczowe z ofert i rady, jak opisać windykację polubowną i sądową, ugody i skuteczność odzysku.',
      intro: 'Specjaliści ds. windykacji pracują w firmach windykacyjnych, bankach, firmach leasingowych, u dostawców mediów i w działach finansowych zwykłych przedsiębiorstw. Ogłoszenia rozróżniają windykację polubowną, czyli telefoniczną i listowną, terenową oraz sądowo-egzekucyjną. Pracodawcy pytają o odporność na stres, umiejętność negocjacji i znajomość procedur: wezwań do zapłaty, ugód, postępowania upominawczego i współpracy z komornikiem. W CV najważniejsze są skuteczność odzysku i wielkość portfela, który obsługujesz.',
      keywords: [
        'windykacja polubowna',
        'windykacja telefoniczna',
        'negocjowanie ugód i harmonogramów spłat',
        'wezwania do zapłaty',
        'monitoring należności',
        'windykacja sądowa i egzekucyjna',
        'elektroniczne postępowanie upominawcze (EPU)',
        'współpraca z kancelariami i komornikami',
        'realizacja celów odzysku',
        'odporność na stres'
      ],
      tips: [
        'Napisz, jaki typ windykacji prowadzisz: konsumencką czy B2B, polubowną czy sądową. To zupełnie inne stanowiska i rekruter musi od razu wiedzieć, do którego pasujesz.',
        'Podaj skalę i skuteczność: liczbę spraw w portfelu, wartość należności, odsetek odzysku lub realizację celu. Te liczby są podstawą oceny pracy w windykacji.',
        'Wymień procedury, które znasz z praktyki: wezwania do zapłaty, ugody, pozwy w EPU, wnioski egzekucyjne, wpisy do biur informacji gospodarczej. Pracownik, który zna cały proces, szybciej się wdraża.',
        'Pokaż kulturę rozmowy z dłużnikiem: brak skarg, szkolenia z negocjacji, praca z klientami w trudnej sytuacji. Firmy dbają o reputację i wybierają osoby, które odzyskują pieniądze bez eskalowania konfliktów.'
      ],
      sample: {
        name: 'Ewelina Górska',
        headline: 'Specjalistka ds. windykacji – należności B2B',
        contact: ['+48 600 000 128', 'ewelina.gorska@example.com', 'Gorzów Wielkopolski', 'linkedin.com/in/ewelina-gorska-przyklad'],
        summary: 'Od ośmiu lat zajmuję się windykacją należności, najpierw konsumenckich, a obecnie od firm. Prowadzę sprawy od pierwszego monitu do skierowania pozwu, negocjuję ugody i harmonogramy spłat, współpracuję z kancelarią i komornikami. Regularnie przekraczam cel odzysku ustalony dla działu.',
        skills: [
          'Windykacja polubowna B2B i konsumencka',
          'Negocjowanie ugód i harmonogramów spłat',
          'Wezwania do zapłaty i noty odsetkowe',
          'Pozwy w elektronicznym postępowaniu upominawczym',
          'Monitoring należności w systemie ERP',
          'Współpraca z kancelarią prawną i komornikami',
          'Excel: raporty wiekowania należności'
        ],
        languages: ['angielski B1'],
        jobs: [
          {
            title: 'Specjalistka ds. windykacji',
            company: 'Lubuskie Smaki Hurtownia Spożywcza Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Obsługa portfela około 450 kontrahentów z należnościami o łącznej wartości około 6 mln zł.',
              'Obniżenie udziału należności przeterminowanych powyżej 60 dni z 11% do 6%.',
              'Przygotowanie dokumentacji do około 30 pozwów rocznie i współpraca z kancelarią.'
            ]
          },
          {
            title: 'Konsultantka ds. windykacji telefonicznej',
            company: 'Spłata-Plus Windykacja Sp. z o.o.',
            period: '02.2018 – 05.2020',
            bullets: [
              'Prowadzenie średnio 80 rozmów dziennie z dłużnikami konsumenckimi.',
              'Zawieranie ugód ratalnych i realizacja miesięcznego celu odzysku średnio w 105%.',
              'Aktualizacja danych dłużników i dokumentowanie ustaleń w systemie.'
            ]
          }
        ],
        education: {
          school: 'Akademia im. Jakuba z Paradyża w Gorzowie Wielkopolskim',
          degree: 'Ekonomia (licencjat)',
          period: '2013 – 2016'
        }
      },
      faq: [
        {
          q: 'Czy do pracy w windykacji potrzebna jest licencja?',
          a: 'Do pracy na stanowisku specjalisty ds. windykacji nie jest wymagana osobna państwowa licencja. Pracodawcy cenią za to znajomość podstaw prawa cywilnego i procedur oraz szkolenia z negocjacji. Jeśli masz takie kursy, wpisz je w CV z nazwą i rokiem.'
        },
        {
          q: 'Jak opisać w CV pracę w call center windykacyjnym?',
          a: 'Podaj liczbę rozmów dziennie, rodzaj portfela i wynik w stosunku do celu. Dodaj, czy prowadziłeś negocjacje samodzielnie i jakie ugody mogłeś zawierać. To dobra podstawa do przejścia na stanowisko specjalisty w windykacji B2B lub sądowej.'
        }
      ]
    },
    {
      slug: 'prawnik',
      category: 'Biuro, finanse i HR',
      name: 'Prawnik / Aplikant',
      title: 'CV prawnika i aplikanta: wzór i wskazówki',
      metaDescription: 'CV prawnika lub aplikanta pod ogłoszenie kancelarii. Wzór, słowa kluczowe z ofert i rady, jak opisać aplikację, specjalizację, pisma procesowe i angielski.',
      intro: 'Kancelarie i działy prawne w ogłoszeniach zaznaczają przede wszystkim, czy szukają aplikanta adwokackiego lub radcowskiego, czy osoby już wpisanej na listę. Wymagania obejmują zwykle ukończone studia prawnicze, doświadczenie w określonej dziedzinie, na przykład w prawie gospodarczym, prawie pracy czy postępowaniu cywilnym, umiejętność sporządzania pism i bardzo dobry angielski. Kancelarie obsługujące klientów zagranicznych często oczekują znajomości angielskiego prawniczego. W CV liczy się konkret: rodzaje spraw, umów i postępowań, a nie ogólne „zainteresowanie prawem”.',
      keywords: [
        'aplikacja radcowska lub adwokacka',
        'sporządzanie pism procesowych',
        'przygotowywanie i opiniowanie umów',
        'prawo gospodarcze i handlowe',
        'postępowanie cywilne',
        'prawo pracy',
        'reprezentowanie klientów przed sądami',
        'research w systemach informacji prawnej',
        'angielski prawniczy',
        'ochrona danych osobowych (RODO)'
      ],
      tips: [
        'Napisz wyraźnie, na którym etapie jesteś: rok aplikacji i izba, a po egzaminie zawodowym wpis na listę radców prawnych lub adwokatów. Od tego kancelaria zaczyna ocenę kandydatury.',
        'Wypisz rodzaje spraw i dokumentów, z którymi pracujesz: pozwy, apelacje, umowy dystrybucyjne, due diligence spółek, sprawy pracownicze. Specjalizacja jest dla kancelarii ważniejsza niż ogólna lista dziedzin prawa.',
        'Pokaż samodzielność: na ilu rozprawach występowałeś w zastępstwie, czy przygotowujesz projekty pism do akceptacji, czy masz bezpośredni kontakt z klientem. Takie informacje odróżniają aplikantów tego samego roku.',
        'Podaj poziom angielskiego i, jeśli go masz, certyfikat z języka prawniczego, na przykład TOLES. Dopisz publikacje, konkursy krasomówcze i działalność w kołach naukowych, jeśli wiążą się ze specjalizacją.'
      ],
      sample: {
        name: 'Piotr Malinowski',
        headline: 'Aplikant radcowski – prawo gospodarcze i spory sądowe',
        contact: ['+48 600 000 129', 'piotr.malinowski@example.com', 'Toruń', 'linkedin.com/in/piotr-malinowski-przyklad'],
        summary: 'Aplikant radcowski trzeciego roku, od 2018 roku pracuję w kancelariach obsługujących przedsiębiorców. Przygotowuję projekty pism procesowych i umów, prowadzę research prawny i występuję na rozprawach w zastępstwie radcy prawnego. Specjalizuję się w sporach gospodarczych i prawie umów.',
        skills: [
          'Pisma procesowe w sprawach gospodarczych',
          'Projektowanie i opiniowanie umów handlowych',
          'Występowanie na rozprawach w zastępstwie radcy prawnego',
          'Research w systemach informacji prawnej',
          'Due diligence spółek z o.o.',
          'Prawo pracy w obsłudze firm',
          'Angielski prawniczy'
        ],
        languages: ['angielski C1', 'niemiecki A2'],
        jobs: [
          {
            title: 'Aplikant radcowski (wcześniej asystent prawny)',
            company: 'Kancelaria Prawna Nowicki i Wspólnicy sp.k.',
            period: '06.2020 – obecnie',
            bullets: [
              'Przygotowywanie projektów pozwów, odpowiedzi na pozew i apelacji w sporach gospodarczych.',
              'Występowanie na około 10 rozprawach miesięcznie w zastępstwie radcy prawnego.',
              'Udział w 6 badaniach due diligence spółek przed transakcjami przejęcia.'
            ]
          },
          {
            title: 'Asystent prawny',
            company: 'Kancelaria Adwokacka Kowal i Partnerzy',
            period: '10.2018 – 05.2020',
            bullets: [
              'Research orzecznictwa i literatury do spraw cywilnych i rodzinnych.',
              'Przygotowywanie projektów prostych pism i korespondencji z klientami.',
              'Prowadzenie kalendarza terminów procesowych dla 3 adwokatów.'
            ]
          }
        ],
        education: {
          school: 'Uniwersytet Mikołaja Kopernika w Toruniu',
          degree: 'Prawo (jednolite studia magisterskie)',
          period: '2015 – 2020'
        }
      },
      faq: [
        {
          q: 'Czy aplikant powinien wpisać w CV wynik egzaminu wstępnego na aplikację?',
          a: 'Nie jest to konieczne, ale wysoki wynik może być atutem na początku aplikacji, gdy masz mało praktyki. Ważniejsze są rok aplikacji, izba i doświadczenie w kancelarii. Po kilku latach wynik egzaminu wstępnego przestaje mieć znaczenie.'
        },
        {
          q: 'Jak opisać sprawy, jeśli obowiązuje mnie tajemnica zawodowa?',
          a: 'Nie podawaj nazw klientów ani szczegółów spraw. Opisuj typ sprawy, branżę, przybliżoną wartość przedmiotu sporu i swoją rolę, na przykład „spory z umów o roboty budowlane o wartości do kilku milionów złotych”. Kancelaria doceni, że od początku przestrzegasz zasad poufności.'
        },
        {
          q: 'Czy do kancelarii międzynarodowej pisać CV po angielsku?',
          a: 'Jeśli ogłoszenie jest po angielsku albo kancelaria pracuje głównie dla klientów zagranicznych, przygotuj CV po angielsku lub w dwóch wersjach. Zadbaj o poprawne tłumaczenie nazw aplikacji i tytułów, na przykład „trainee attorney-at-law (aplikant radcowski)”.'
        }
      ]
    },
    {
      slug: 'specjalista-bhp',
      category: 'Biuro, finanse i HR',
      name: 'Specjalista BHP',
      title: 'CV specjalisty BHP: wzór i wskazówki',
      metaDescription: 'CV specjalisty BHP pod ogłoszenie. Wzór, słowa kluczowe z ofert i rady, jak opisać kwalifikacje, ocenę ryzyka zawodowego, szkolenia i wypadki przy pracy.',
      intro: 'Wymagania wobec służby BHP wynikają z przepisów, dlatego pracodawcy często podają je w ogłoszeniach bardzo dokładnie: wykształcenie wyższe na kierunku lub studia podyplomowe z zakresu BHP oraz staż pracy w służbie BHP odpowiedni do stanowiska. Na stanowisko inspektora często wystarcza dyplom technika BHP. Wśród obowiązków powtarzają się kontrole warunków pracy, ocena ryzyka zawodowego, szkolenia wstępne i okresowe oraz postępowanie powypadkowe. W zakładach przemysłowych dochodzi znajomość normy ISO 45001 i udział w audytach.',
      keywords: [
        'wykształcenie wyższe z zakresu BHP',
        'ocena ryzyka zawodowego',
        'szkolenia wstępne i okresowe BHP',
        'postępowanie powypadkowe',
        'kontrole warunków pracy',
        'instrukcje stanowiskowe',
        'ISO 45001',
        'ochrona przeciwpożarowa',
        'współpraca z PIP i Sanepidem',
        'raportowanie wskaźników bezpieczeństwa'
      ],
      tips: [
        'Podaj kwalifikacje w taki sposób, jak opisują je przepisy: kierunek studiów lub studia podyplomowe z BHP oraz lata stażu w służbie BHP. Od tego zależy, czy możesz zostać zatrudniony jako inspektor, specjalista czy starszy specjalista.',
        'Napisz, w jakich branżach i przy jakich zagrożeniach pracowałeś: hałas, praca na wysokości, maszyny, substancje chemiczne, magazyn z wózkami widłowymi. Zakład produkcyjny szuka kogoś, kto zna jego realne ryzyka.',
        'Pokaż efekty: spadek liczby wypadków, liczbę przeszkolonych osób, zaktualizowane oceny ryzyka, zamknięte niezgodności po audycie. Sam zakres obowiązków nie wyróżni cię wśród kandydatów.',
        'Wymień dodatkowe uprawnienia i kursy: inspektor ochrony przeciwpożarowej, metodyka szkoleń, audytor wewnętrzny ISO 45001, instruktor pierwszej pomocy. W wielu firmach specjalista BHP pełni też te funkcje.'
      ],
      sample: {
        name: 'Sebastian Wawrzyniak',
        headline: 'Specjalista BHP – zakład produkcyjny',
        contact: ['+48 600 000 130', 'sebastian.wawrzyniak@example.com', 'Płock', 'linkedin.com/in/sebastian-wawrzyniak-przyklad'],
        summary: 'Specjalista BHP z ośmioletnim stażem w służbie BHP w zakładach produkcyjnych i logistycznych. Prowadzę ocenę ryzyka zawodowego, szkolenia, kontrole stanowisk i postępowania powypadkowe. Jestem audytorem wewnętrznym ISO 45001 i inspektorem ochrony przeciwpożarowej.',
        skills: [
          'Ocena ryzyka zawodowego',
          'Szkolenia wstępne i okresowe BHP',
          'Postępowanie powypadkowe i dokumentacja',
          'Audyt wewnętrzny ISO 45001',
          'Inspektor ochrony przeciwpożarowej',
          'Ocena maszyn pod kątem minimalnych wymagań BHP',
          'Prawo jazdy kat. B'
        ],
        languages: ['angielski B1'],
        jobs: [
          {
            title: 'Specjalista ds. BHP',
            company: 'Zakłady Tworzyw Mazowsze Sp. z o.o.',
            period: '06.2020 – obecnie',
            bullets: [
              'Nadzór nad bezpieczeństwem pracy w zakładzie zatrudniającym około 450 osób w systemie trzyzmianowym.',
              'Aktualizacja 60 ocen ryzyka zawodowego i instrukcji stanowiskowych po modernizacji linii produkcyjnych.',
              'Zmniejszenie liczby wypadków przy pracy z 9 do 3 rocznie dzięki programowi obserwacji zachowań.'
            ]
          },
          {
            title: 'Inspektor ds. BHP',
            company: 'Wisła-Log Centrum Logistyczne Sp. z o.o.',
            period: '04.2018 – 05.2020',
            bullets: [
              'Prowadzenie instruktażu ogólnego dla około 300 nowych pracowników rocznie.',
              'Kontrole stanu technicznego regałów i zasad ruchu wózków widłowych.',
              'Udział w zespole powypadkowym i przygotowywanie dokumentacji.'
            ]
          }
        ],
        education: {
          school: 'Politechnika Łódzka',
          degree: 'Inżynieria bezpieczeństwa (inżynier)',
          period: '2013 – 2017'
        }
      },
      faq: [
        {
          q: 'Czy po studiach podyplomowych z BHP mogę od razu zostać specjalistą?',
          a: 'Studia podyplomowe z zakresu BHP to jedna z dróg do kwalifikacji, ale na stanowisko specjalisty przepisy wymagają też stażu pracy w służbie BHP. Jeśli go nie masz, szukaj ofert na stanowisko inspektora albo w firmie, w której zdobędziesz wymagany staż. W CV podaj datę ukończenia studiów i każdy okres pracy w służbie BHP.'
        },
        {
          q: 'Jak wpisać w CV pracę w zewnętrznej firmie BHP?',
          a: 'Opisz ją jak zwykłe zatrudnienie i wymień branże oraz wielkość obsługiwanych zakładów, bez nazw klientów, jeśli nie masz na to zgody. Podaj, ile zakładów obsługiwałeś i jakie zadania wykonywałeś. Dla pracodawcy to dowód, że znasz wiele różnych środowisk pracy.'
        }
      ]
    }
  ],

  en: {
    "weterynarz": {
      slugLang: "veterinarian",
      name: "Veterinarian",
      title: "Veterinarian CV: example and tips",
      metaDescription: "A veterinarian CV tailored to the job ad: an example, keywords from vet clinic offers and tips on describing your licence to practise, specialisation and procedures.",
      intro: "Veterinary clinics usually open their job ads with the licence to practise veterinary medicine and with whether the candidate will treat dogs and cats, farm animals or exotic species. Then come specific skills: diagnostic imaging, surgery, anaesthesia and readiness for on-call shifts. In ambulatory practices a category B driving licence and experience on farms also count. A well-written CV shows what you do on your own and what you still do under supervision.",
      keywords: [
        "licence to practise veterinary medicine",
        "small animal medicine",
        "ultrasound and X-ray diagnostics",
        "soft tissue surgery",
        "inhalation anaesthesia",
        "canine and feline internal medicine",
        "night and weekend on-call shifts",
        "work with farm animals",
        "keeping treatment records",
        "category B driving licence"
      ],
      tips: [
        "Put your licence to practise and the chamber you are registered with at the very top, along with any specialisation you have started or completed. That is the first thing a clinic manager looks for.",
        "List the procedures you perform on your own, such as neutering, spaying, tooth extractions or wound suturing, and keep them separate from those you assist with. An honest split builds trust.",
        "Name the equipment and tests you use: abdominal ultrasound, X-ray, blood analysers, endoscopy. If you interpret radiographs yourself, say so clearly.",
        "Show the scale of your work in numbers: how many consultations a day, how many on-call shifts a month, how many farms you look after. For a 24-hour clinic this matters more than a list of courses."
      ],
      sample: {
        name: "Karolina Pawlak",
        headline: "Veterinarian – small animals, soft tissue surgery",
        contact: ["+48 600 000 121", "karolina.pawlak@example.com", "Zamość", "linkedin.com/in/karolina-pawlak-przyklad"],
        summary: "Veterinarian with eight years of experience treating dogs and cats. I run internal medicine consultations on my own, perform abdominal ultrasound and soft tissue surgery. I am currently specialising in canine and feline diseases and regularly take on-call shifts at a 24-hour clinic.",
        skills: [
          "Licence to practise veterinary medicine",
          "Abdominal ultrasound",
          "Taking and interpreting X-rays",
          "Neutering, spaying and soft tissue surgery",
          "Inhalation anaesthesia and patient monitoring",
          "Dentistry: scaling and extractions",
          "Communicating with pet owners"
        ],
        languages: ["English B2"],
        jobs: [
          {
            title: "Veterinarian",
            company: "Całodobowa Lecznica dla Zwierząt Animed Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Seeing an average of 18–22 patients a day in internal medicine consultations.",
              "Performing about 40 surgical procedures a month on my own, mainly neutering and skin tumour removal.",
              "Covering 4–5 night shifts a month, including emergency cases."
            ]
          },
          {
            title: "Junior veterinarian",
            company: "Gabinet Weterynaryjny Pod Lipami s.c.",
            period: "10.2018 – 05.2020",
            bullets: [
              "Running preventive visits: vaccinations, deworming, microchipping.",
              "Assisting with surgery and preparing patients for anaesthesia.",
              "Collecting samples and interpreting blood count and biochemistry results."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Przyrodniczy w Lublinie",
          degree: "Veterinary medicine (5.5-year master's programme)",
          period: "2012 – 2018"
        }
      },
      faq: [
        {
          q: "Should I put my licence number on my CV?",
          a: "It is enough to state that you hold a licence to practise and which regional veterinary chamber you are registered with. The employer will check the document when hiring you anyway. Giving the number is not a mistake, but it is not necessary."
        },
        {
          q: "How do I describe a specialisation I have not finished yet?",
          a: "Write ‘specialisation in progress’ with the field and the year you expect to take the exam. Clinics value vets who keep developing, so it counts in your favour even before you get the specialist title."
        },
        {
          q: "After a few years with small animals, can I apply to a cattle practice?",
          a: "Yes, but clearly show everything linked to large animals: student placements on farms, help with calvings, reproduction checks. Say directly in your summary that you want to develop in this direction, and highlight your driving licence."
        }
      ]
    },
    "terapeuta-zajeciowy": {
      slugLang: "occupational-therapist",
      name: "Occupational therapist",
      title: "Occupational therapist CV: example and tips",
      metaDescription: "An occupational therapist CV tailored to job ads from care homes, day centres and workshops. An example, keywords and tips on describing workshops, methods and therapy plans.",
      intro: "Occupational therapists in Poland are hired mainly by social care homes (DPS), community self-help centres (ŚDS), occupational therapy workshops (WTZ), long-term care facilities and rehabilitation wards. Employers ask for a relevant qualification, meaning a post-secondary school or a degree in occupational therapy, and for experience with a specific group: older people, people with intellectual disabilities or stroke survivors. Keeping records, including individual therapy plans, matters too. In your CV, show the workshops and methods you know from real practice, not just from school.",
      keywords: [
        "relevant qualification: occupational therapy",
        "running group and individual sessions",
        "individual therapy plan",
        "social skills training",
        "activities of daily living training",
        "art therapy",
        "work with people with intellectual disabilities",
        "work with older people",
        "keeping participant records",
        "organising outings and social events"
      ],
      tips: [
        "Say which group you have worked with and how many participants you looked after. Working with seniors with dementia in a care home takes different skills from running a workshop for young adults.",
        "List the workshops you run: art, ceramics, cooking, woodwork, computers or gardening. Facilities often look for someone for a specific workshop.",
        "Show that you can handle paperwork: functional assessment, individual therapy plan, progress reviews, reports. In many facilities this is a must.",
        "Add courses you actually use in sessions, such as Veronica Sherborne Developmental Movement, music therapy or memory training. Briefly say how you use them."
      ],
      sample: {
        name: "Tomasz Wróblewski",
        headline: "Occupational therapist – work with people with intellectual disabilities",
        contact: ["+48 600 000 122", "tomasz.wroblewski@example.com", "Elbląg", "linkedin.com/in/tomasz-wroblewski-przyklad"],
        summary: "Occupational therapist with eight years of experience in an occupational therapy workshop and a social care home. I run a woodwork and ceramics workshop and independence training, and I prepare individual therapy plans and progress reviews. I work closely with the psychologist, the physiotherapist and participants' families.",
        skills: [
          "Individual therapy plans and progress reviews",
          "Activities of daily living training",
          "Social skills training",
          "Running ceramics and woodwork workshops",
          "Group art therapy and music therapy",
          "Veronica Sherborne Developmental Movement",
          "Working with families and the therapy team"
        ],
        languages: ["English A2"],
        jobs: [
          {
            title: "Occupational therapist – workshop instructor",
            company: "Warsztat Terapii Zajęciowej Stowarzyszenia Krok Dalej",
            period: "06.2020 – present",
            bullets: [
              "Running a woodwork and ceramics workshop for a group of 6 participants.",
              "Preparing and updating individual therapy plans and six-monthly progress reviews.",
              "Preparing participants and their work for 3 local craft fairs a year."
            ]
          },
          {
            title: "Occupational therapist",
            company: "Dom Pomocy Społecznej Przystań",
            period: "09.2017 – 05.2020",
            bullets: [
              "Running group sessions for older residents, including memory training.",
              "Activities of daily living training with stroke survivors together with the physiotherapist.",
              "Organising cultural outings and celebrations for about 60 residents."
            ]
          }
        ],
        education: {
          school: "Medyczna Szkoła Policealna w Elblągu",
          degree: "Occupational therapist (terapeuta zajęciowy)",
          period: "2015 – 2017"
        }
      },
      faq: [
        {
          q: "Can I work as an occupational therapist after a short course?",
          a: "Job ads from care homes, day centres and workshops usually require a relevant qualification, meaning a completed post-secondary school or a degree in occupational therapy. A short course can be a plus, but it rarely replaces that. List it under courses, not education, so you do not mislead the recruiter."
        },
        {
          q: "How do I describe my work with participants without breaching their privacy?",
          a: "Keep it general: age group, type of disability, number of people and the results of your work. Do not give names, individual diagnoses or photos from sessions. This approach in itself shows that you understand confidentiality."
        }
      ]
    },
    "pracownik-biurowy": {
      slugLang: "office-worker",
      name: "Office worker",
      title: "Office worker CV: example and tips",
      metaDescription: "An office worker CV tailored to a specific job ad. An example, keywords from job offers and tips on describing document flow, Excel and handling correspondence.",
      intro: "Job ads for office workers vary a lot: from running the front office of a small company to data entry in a sales or logistics department. Yet the same requirements come up almost every time: good command of MS Office, especially Excel, accuracy, handling correspondence and document flow. Some employers add experience with invoicing software or an ERP system. That is why the key in your CV is to show specific tasks and tools rather than general personality traits.",
      keywords: [
        "MS Office",
        "Excel: pivot tables and VLOOKUP",
        "document flow",
        "handling incoming and outgoing correspondence",
        "data entry",
        "issuing invoices",
        "document archiving",
        "customer service by phone and email",
        "preparing summaries and reports",
        "accuracy and good work organisation"
      ],
      tips: [
        "Instead of writing ‘advanced MS Office’, say what you do in Excel: pivot tables, VLOOKUP, filters, simple charts. You may get a short practical task at the interview, so be truthful.",
        "List the software you have used, such as invoicing tools, ERP or CRM systems. Even if the company uses a different system, experience with a similar tool shortens onboarding.",
        "Describe the scale of your duties: how many documents a day you enter, how many invoices a month you issue, how many business partners you handle. Numbers set you apart from candidates with vague CVs.",
        "If the ad is for a specific department, such as logistics or HR, highlight tasks from that area. An office worker at a freight forwarder does completely different things from one at an accounting firm."
      ],
      sample: {
        name: "Natalia Zając",
        headline: "Office worker – documents and customer service",
        contact: ["+48 600 000 123", "natalia.zajac@example.com", "Opole", "linkedin.com/in/natalia-zajac-przyklad"],
        summary: "For eight years I have worked in office administration at trading and service companies. I manage document flow, issue invoices, prepare Excel summaries and handle correspondence with customers. I like well-organised paperwork and learn new systems quickly.",
        skills: [
          "Excel: pivot tables, VLOOKUP, conditional formatting",
          "Word and Outlook",
          "Invoicing and credit notes",
          "ERP system (sales module)",
          "Document flow and archiving",
          "Customer service by phone and email",
          "Category B driving licence"
        ],
        languages: ["English B1"],
        jobs: [
          {
            title: "Office worker",
            company: "Hurtownia Materiałów Budowlanych Opal-Bud Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Issuing about 350 invoices a month and preparing credit notes.",
              "Keeping the contract register and archiving sales documents.",
              "Preparing weekly sales summaries in Excel for the branch manager."
            ]
          },
          {
            title: "Office assistant",
            company: "Biuro Rachunkowe Bilans-Plus s.c.",
            period: "03.2018 – 05.2020",
            bullets: [
              "Receiving and logging documents from about 40 clients of the firm.",
              "Handling the switchboard and email.",
              "Entering data into the accounting software under an accountant's supervision."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Opolski",
          degree: "Administration (bachelor's degree)",
          period: "2014 – 2017"
        }
      },
      faq: [
        {
          q: "Can I write a good office worker CV with no experience?",
          a: "Yes. Describe placements, internships, student council work or volunteering if they involved paperwork, Excel or dealing with people. Add courses, for example in Excel, and say specifically what you learned. For office roles, employers often look for accurate people who are keen to learn, not only those with long experience."
        },
        {
          q: "How do I describe my Excel skills without overstating them?",
          a: "List the specific functions and tasks you can do without help rather than a general level. If you only know macros or Power Query from a course, write ‘basics’. Recruiters increasingly check Excel with a short test."
        }
      ]
    },
    "office-manager": {
      slugLang: "office-manager",
      name: "Office Manager",
      title: "Office Manager CV: example and tips",
      metaDescription: "An Office Manager CV tailored to the job ad: an example, keywords from job offers and tips on describing the office budget, supplier management and company events.",
      intro: "An Office Manager makes sure the office simply works: from orders and supplier contracts, through reception and business travel, to organising meetings and company events. In job ads, employers often combine this with some HR administration, support for the management board and control of office costs. English at a communicative level or higher is very often required, as many of these offers come from international companies. A good CV shows the scope of responsibility and savings, not just a list of tasks.",
      keywords: [
        "office management",
        "working with suppliers and negotiating contracts",
        "office budget control",
        "organising company events",
        "arranging business travel",
        "management board support",
        "reception",
        "onboarding new employees",
        "ordering office supplies",
        "communicative English"
      ],
      tips: [
        "State the size of the office and team you look after, for example ‘office for 80 people, two floors, reception and a conference room’. That immediately shows the level of the role.",
        "Show the money: what budget you manage and what you saved, for example after changing the cleaning company or renegotiating the catering contract. An Office Manager with financial results stands out from other candidates.",
        "Describe the events you organised: number of participants, budget, venue. A team-building trip for 120 people is real project experience.",
        "If you handled an office move, rolled out a meeting room booking system or built an onboarding process, list it separately. Projects like these prove to the recruiter that you work independently."
      ],
      sample: {
        name: "Agnieszka Kubiak",
        headline: "Office Manager – IT company office for 90 people",
        contact: ["+48 600 000 124", "agnieszka.kubiak@example.com", "Wrocław", "linkedin.com/in/agnieszka-kubiak-przyklad"],
        summary: "I have worked in office administration for nine years, including six years as Office Manager at a technology company. I am responsible for the administrative budget, supplier contracts, reception and organising events. I managed an office move and introduced an onboarding process that the whole HR team now uses.",
        skills: [
          "Office budget management",
          "Negotiating with service suppliers",
          "Organising company events and trips",
          "Booking business travel",
          "Onboarding new employees",
          "MS Office and Google Workspace",
          "English in daily work"
        ],
        languages: ["English C1", "German A2"],
        jobs: [
          {
            title: "Office Manager",
            company: "Codera Solutions Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Managing an office for 90 people with an annual administrative budget of about PLN 600,000.",
              "Renegotiating cleaning and catering contracts, cutting those costs by 14% a year.",
              "Organising 2 team-building trips a year for more than 100 participants."
            ]
          },
          {
            title: "Executive assistant",
            company: "Fiskus-Pro Doradztwo Podatkowe Sp. z o.o.",
            period: "02.2017 – 05.2020",
            bullets: [
              "Managing the calendars of two board members and arranging client meetings.",
              "Running reception, post and conference room bookings.",
              "Ordering office supplies and checking supplier invoices."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny we Wrocławiu",
          degree: "Management (master's degree)",
          period: "2012 – 2017"
        }
      },
      faq: [
        {
          q: "How is an Office Manager CV different from an assistant's CV?",
          a: "An Office Manager CV should show responsibility: budget, supplier decisions, projects and the people you are in charge of. An assistant mainly describes supporting a particular person. If you are moving from an assistant role to Office Manager, put the tasks where you made decisions yourself in the foreground."
        },
        {
          q: "Should I write my CV in English if the job ad is in English?",
          a: "Usually yes. An ad in English signals that the language is used every day in the office, and the recruiter may not speak Polish. If the ad is in Polish but requires English, a Polish CV with a clearly stated language level is enough."
        }
      ]
    },
    "analityk-finansowy": {
      slugLang: "financial-analyst",
      name: "Financial analyst",
      title: "Financial analyst CV: example and tips",
      metaDescription: "A financial analyst CV tailored to the job ad. An example, keywords from job offers and tips on describing financial models, Excel, SQL, Power BI and the CFA.",
      intro: "A financial analyst prepares budgets, forecasts and analyses that the management board bases its decisions on. Job ads from manufacturers, shared service centres and banks repeat the same requirements: advanced Excel, building financial models, reporting results and good English. SQL and BI tools such as Power BI appear more and more often. CFA or ACCA qualifications are usually not mandatory, but they clearly raise a candidate's value.",
      keywords: [
        "financial analysis",
        "budgeting and forecasting",
        "financial modelling",
        "advanced Excel",
        "management reporting",
        "variance analysis",
        "Power BI",
        "SQL",
        "SAP",
        "fluent English"
      ],
      tips: [
        "Describe the analyses you prepare and what they are for: cash flow forecast, product profitability analysis, investment appraisal model. A job title alone does not tell the recruiter what you actually did.",
        "Show the effect of your work: shorter reporting time, an automated report, a board decision based on your analysis. Numbers and percentages come naturally here.",
        "List tools together with what you do in them: Excel (models, Power Query), SQL (queries, joins), Power BI (dashboards). Finance job ads are filtered by exactly these words.",
        "If you are taking the CFA or ACCA, give the levels or exams you have passed and when you plan to sit the next one. It shows steady development."
      ],
      sample: {
        name: "Michał Sobczak",
        headline: "Financial analyst – FP&A",
        contact: ["+48 600 000 125", "michal.sobczak@example.com", "Kraków", "linkedin.com/in/michal-sobczak-przyklad"],
        summary: "Financial analyst with eight years of experience, the last six in the FP&A team of a manufacturing company. I prepare budgets, quarterly forecasts and profitability analyses, build models in Excel and dashboards in Power BI. I have passed CFA Level II.",
        skills: [
          "Budgeting and forecasting",
          "Financial modelling in Excel",
          "Power Query and Power BI",
          "SQL: queries and joins",
          "SAP FI/CO (reporting)",
          "Product and customer profitability analysis",
          "Presenting results to senior management"
        ],
        languages: ["English C1"],
        jobs: [
          {
            title: "Financial analyst (FP&A)",
            company: "Kartonex Opakowania Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Preparing the annual budget and quarterly forecasts for 3 production plants.",
              "Building a Power BI dashboard that cut monthly reporting from 4 days to 2.",
              "Profitability analysis of 200 product codes that formed the basis for price list changes."
            ]
          },
          {
            title: "Junior financial analyst",
            company: "Finexa Centrum Usług Księgowych Sp. z o.o.",
            period: "07.2018 – 05.2020",
            bullets: [
              "Preparing monthly results reports for clients in the UK and Germany.",
              "Analysing cost variances against budget and drafting comments for the controller.",
              "Reconciling data between SAP and Excel reports."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny w Krakowie",
          degree: "Finance and accounting (master's degree)",
          period: "2013 – 2018"
        }
      },
      faq: [
        {
          q: "Do I stand a chance as a financial analyst without the CFA?",
          a: "Yes, most job ads treat the CFA or ACCA as a plus rather than a requirement. Practical skills matter more: Excel, understanding financial statements and being able to explain numbers to people outside finance. If you are considering a qualification, say in your CV that you are preparing for the exam."
        },
        {
          q: "How do I show results in my CV when I am bound by company confidentiality?",
          a: "Give scale and effect approximately or in percentages instead of exact amounts and client names. For example: ‘cost budget worth tens of millions of zlotys’ or ‘reporting time cut by half’. That is enough to show your level of responsibility."
        }
      ]
    },
    "kontroler-finansowy": {
      slugLang: "financial-controller",
      name: "Financial controller",
      title: "Financial controller CV: example and tips",
      metaDescription: "A financial controller CV tailored to the job ad. An example, keywords from job offers and tips on describing controlling, month-end close, budgets and ACCA or CIMA.",
      intro: "A financial controller makes sure the company's numbers are reliable and that the board knows where deviations from the plan come from. Job ads usually mention cost control, month-end close, budgeting, reporting to headquarters and working with accounting and auditors. Employers ask for knowledge of the Polish Accounting Act and, when the company belongs to a foreign group, IFRS or US GAAP as well. For senior roles, several years in controlling or audit and an ACCA or CIMA qualification are common expectations.",
      keywords: [
        "financial controlling",
        "month-end and year-end close",
        "budgeting and cost control",
        "plan vs actual variance analysis",
        "group reporting",
        "IFRS",
        "Polish Accounting Act",
        "working with auditors",
        "production cost controlling",
        "ACCA or CIMA"
      ],
      tips: [
        "Say what environment you work in: a Polish company or part of a foreign group, which reporting standards, which ERP system. Controllers with group reporting experience are in higher demand than those who only know Polish rules.",
        "Describe your part in the month-end close: deadline, areas you own, reconciliations you prepare. Cutting the close from ten to five working days is a strong point.",
        "Show your impact on costs: controls introduced, irregularities found, changes to the purchasing process. A controller is judged by whether their analyses lead to decisions.",
        "If you moved from audit, name the industries and types of companies you audited. It shows you know different business models and what the statutory auditor expects."
      ],
      sample: {
        name: "Joanna Mazurek",
        headline: "Financial controller – group reporting and cost controlling",
        contact: ["+48 600 000 126", "joanna.mazurek@example.com", "Bielsko-Biała", "linkedin.com/in/joanna-mazurek-przyklad"],
        summary: "Financial controller with eleven years of experience, including almost five in audit. I am responsible for month-end close, IFRS group reporting and production cost controlling at a German-owned company. I am ACCA qualified.",
        skills: [
          "Month-end and year-end close",
          "Reporting under IFRS and the Polish Accounting Act",
          "Production cost controlling",
          "Budgeting and variance analysis",
          "SAP FI/CO",
          "Working with the statutory auditor",
          "Advanced Excel and Power Query"
        ],
        languages: ["English C1", "German B1"],
        jobs: [
          {
            title: "Financial controller",
            company: "Beskid Komponenty Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Coordinating the month-end close and shortening it from 8 to 5 working days.",
              "Preparing IFRS reporting packages for the German parent company.",
              "Introducing a monthly material usage analysis that reduced deviations from standards by 18%."
            ]
          },
          {
            title: "Audit senior",
            company: "Rewident-Konsult Sp. z o.o.",
            period: "09.2015 – 05.2020",
            bullets: [
              "Auditing the financial statements of manufacturing and trading companies.",
              "Leading a team of 2–3 assistants during fieldwork at client sites.",
              "Drafting management letters with internal control recommendations."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny w Katowicach",
          degree: "Finance and accounting (master's degree)",
          period: "2010 – 2015"
        }
      },
      faq: [
        {
          q: "Does a financial controller need an accounting qualification?",
          a: "There is no legal requirement, but employers expect solid accounting knowledge and often experience in accounting or audit. ACCA, CIMA or a Polish accounting certificate are well regarded. List them in your CV with the year obtained or the exams passed."
        },
        {
          q: "How do I describe a move from audit to controlling in my CV?",
          a: "Show that you know processes from the inside: name the areas you audited most often, such as inventory, revenue or fixed assets. Add advisory projects or help with clients' closes. In your summary, say directly why you want to work on the company side."
        }
      ]
    },
    "agent-ubezpieczeniowy": {
      slugLang: "insurance-agent",
      name: "Insurance agent",
      title: "Insurance agent CV: example and tips",
      metaDescription: "An insurance agent CV tailored to the job ad. An example, keywords from job offers and tips on describing sales results, your client portfolio and KNF registration.",
      intro: "Insurance agents are recruited both by insurance companies and by multi-agencies, and most offers involve selling motor, property and life insurance. A candidate without experience usually completes training and an exam and is then entered in the register of agents kept by the Polish Financial Supervision Authority (KNF). Employers ask about sales experience, your own client base and willingness to work on commission or as a contractor (B2B). Specific results work best in a CV: number of policies, premium value and client retention.",
      keywords: [
        "selling motor insurance (OC and AC)",
        "life insurance",
        "property insurance",
        "entry in the register of insurance agents",
        "acquiring new clients",
        "managing a client portfolio",
        "needs analysis",
        "meeting sales targets",
        "working under an agency agreement",
        "category B driving licence"
      ],
      tips: [
        "Give results: number of policies sold, annual premium value, your place in the network ranking. Agents are judged by numbers and recruiters expect them in the CV.",
        "Say whether you worked as a tied agent of one insurer or in a multi-agency, and which products you sell. Experience with life and business insurance is valued more than motor liability sales alone.",
        "State that you are currently registered as an agent and complete the required annual professional training. If you are not registered yet, say that you are ready to take the training and exam.",
        "Show how you look after clients: renewal rate, referrals, help with claims. An agent who keeps a portfolio is worth more to an agency than one who only sells new policies."
      ],
      sample: {
        name: "Robert Kaczmarczyk",
        headline: "Insurance agent – motor and life insurance",
        contact: ["+48 600 000 127", "robert.kaczmarczyk@example.com", "Siedlce", "linkedin.com/in/robert-kaczmarczyk-przyklad"],
        summary: "For eight years I have sold motor, property and life insurance, first as a tied agent and now in a multi-agency. I manage a portfolio of more than 900 individual and small business clients, and every year over 80% of them renew their policies with me. I am currently entered in the register of insurance agents.",
        skills: [
          "Selling OC, AC and personal accident insurance",
          "Life and protection insurance",
          "Home and small business insurance",
          "Needs analysis and comparing offers",
          "Using several insurers' quoting tools",
          "Winning clients through referrals",
          "Category B driving licence"
        ],
        languages: ["English A2"],
        jobs: [
          {
            title: "Insurance agent",
            company: "Multiagencja Ubezpieczeniowa Bezpieczny Dom s.c.",
            period: "06.2020 – present",
            bullets: [
              "Selling an average of 70 policies a month, mainly motor and home insurance.",
              "Raising the share of life insurance in my portfolio from 5% to 22% of premium.",
              "Helping clients report claims and liaising with loss adjusters."
            ]
          },
          {
            title: "Tied agent",
            company: "Polisa-Serwis Agencja Ubezpieczeniowa Sp. z o.o.",
            period: "04.2018 – 05.2020",
            bullets: [
              "Acquiring individual clients for life insurance.",
              "Meeting quarterly sales targets at an average of 110%.",
              "Meeting clients at the office and at their homes across the district."
            ]
          }
        ],
        education: {
          school: "Uniwersytet w Siedlcach",
          degree: "Economics (bachelor's degree)",
          period: "2013 – 2016"
        }
      },
      faq: [
        {
          q: "Do I need insurance experience to become an agent?",
          a: "No, many agencies train people with experience in other sales or customer service. Before starting, you need to complete training, pass an exam and then be entered in the register of agents. In your CV, show your previous sales results and how easily you build relationships."
        },
        {
          q: "Should I include sales results in my CV if they were not the best?",
          a: "Give the figures that show your work well, such as client retention or growth in a particular product. You do not have to list every month. Remember you may be asked for details at the interview, so the numbers must be true."
        }
      ]
    },
    "specjalista-ds-windykacji": {
      slugLang: "debt-collection-specialist",
      name: "Debt collection specialist",
      title: "Debt collection specialist CV: example and tips",
      metaDescription: "A debt collection specialist CV tailored to the job ad. An example, keywords from job offers and tips on describing amicable and court collection, settlements and recovery rates.",
      intro: "Debt collection specialists work at collection agencies, banks, leasing companies, utility providers and in the finance departments of ordinary businesses. Job ads distinguish amicable collection by phone and letter, field collection and court and enforcement collection. Employers ask about stress resilience, negotiation skills and knowledge of procedures: payment demands, settlements, the order for payment procedure and working with bailiffs. What matters most in your CV is your recovery rate and the size of the portfolio you handle.",
      keywords: [
        "amicable debt collection",
        "telephone debt collection",
        "negotiating settlements and repayment schedules",
        "payment demands",
        "receivables monitoring",
        "court and enforcement collection",
        "electronic writ-of-payment procedure (EPU)",
        "working with law firms and bailiffs",
        "meeting recovery targets",
        "stress resilience"
      ],
      tips: [
        "Say which type of collection you do: consumer or B2B, amicable or court. These are completely different jobs and the recruiter needs to see at once which one you fit.",
        "Give scale and effectiveness: number of cases in your portfolio, value of receivables, recovery rate or target achievement. These numbers are the basis for judging work in collections.",
        "List the procedures you know from practice: payment demands, settlements, EPU claims, enforcement applications, entries in business credit registers. Someone who knows the whole process gets up to speed faster.",
        "Show how you talk to debtors: no complaints, negotiation training, working with clients in difficult situations. Companies care about their reputation and choose people who recover money without escalating conflicts."
      ],
      sample: {
        name: "Ewelina Górska",
        headline: "Debt collection specialist – B2B receivables",
        contact: ["+48 600 000 128", "ewelina.gorska@example.com", "Gorzów Wielkopolski", "linkedin.com/in/ewelina-gorska-przyklad"],
        summary: "For eight years I have worked in debt collection, first with consumer debts and now with business receivables. I handle cases from the first reminder to filing a claim, negotiate settlements and repayment schedules, and work with the law firm and bailiffs. I regularly exceed the department's recovery target.",
        skills: [
          "Amicable B2B and consumer collection",
          "Negotiating settlements and repayment schedules",
          "Payment demands and interest notes",
          "Claims in the electronic writ-of-payment procedure",
          "Receivables monitoring in an ERP system",
          "Working with a law firm and bailiffs",
          "Excel: receivables ageing reports"
        ],
        languages: ["English B1"],
        jobs: [
          {
            title: "Debt collection specialist",
            company: "Lubuskie Smaki Hurtownia Spożywcza Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Managing a portfolio of about 450 business customers with receivables totalling about PLN 6 million.",
              "Reducing receivables more than 60 days overdue from 11% to 6%.",
              "Preparing documents for about 30 court claims a year and working with the law firm."
            ]
          },
          {
            title: "Telephone collection consultant",
            company: "Spłata-Plus Windykacja Sp. z o.o.",
            period: "02.2018 – 05.2020",
            bullets: [
              "Making an average of 80 calls a day to consumer debtors.",
              "Agreeing instalment settlements and reaching an average of 105% of the monthly recovery target.",
              "Updating debtor data and recording agreements in the system."
            ]
          }
        ],
        education: {
          school: "Akademia im. Jakuba z Paradyża w Gorzowie Wielkopolskim",
          degree: "Economics (bachelor's degree)",
          period: "2013 – 2016"
        }
      },
      faq: [
        {
          q: "Do I need a licence to work in debt collection?",
          a: "No separate state licence is required to work as a debt collection specialist. Employers do value knowledge of basic civil law and procedures, as well as negotiation training. If you have such courses, list them in your CV with the name and year."
        },
        {
          q: "How do I describe work in a collection call centre in my CV?",
          a: "Give the number of calls a day, the type of portfolio and your result against target. Add whether you negotiated on your own and what settlements you were allowed to agree. It is a good basis for moving to a specialist role in B2B or court collection."
        }
      ]
    },
    "prawnik": {
      slugLang: "lawyer",
      name: "Lawyer / Trainee lawyer",
      title: "Lawyer CV: example and tips",
      metaDescription: "A lawyer or trainee lawyer CV tailored to a law firm job ad. An example, keywords from job offers and tips on describing your traineeship, specialisation, pleadings and English.",
      intro: "Law firms and in-house legal teams state first of all whether they are looking for a trainee advocate or trainee attorney-at-law, or someone already admitted to the bar. Requirements usually include a law degree, experience in a specific area such as commercial law, employment law or civil procedure, drafting skills and very good English. Firms serving foreign clients often expect legal English. In your CV, specifics count: types of cases, contracts and proceedings, not a general ‘interest in law’.",
      keywords: [
        "attorney-at-law or advocate traineeship",
        "drafting pleadings",
        "drafting and reviewing contracts",
        "commercial and corporate law",
        "civil procedure",
        "employment law",
        "representing clients in court",
        "research in legal information systems",
        "legal English",
        "data protection (GDPR)"
      ],
      tips: [
        "State clearly where you are: year of traineeship and bar chamber, and after the bar exam, admission to the roll of attorneys-at-law or advocates. That is where a firm starts assessing you.",
        "List the types of cases and documents you work on: statements of claim, appeals, distribution agreements, company due diligence, employment cases. A specialisation matters more to a firm than a general list of legal fields.",
        "Show independence: how many hearings you attended as a substitute, whether you draft documents for approval, whether you deal with clients directly. This sets you apart from trainees in the same year.",
        "Give your level of English and, if you have one, a legal English certificate such as TOLES. Add publications, moot court competitions and student research groups if they relate to your specialisation."
      ],
      sample: {
        name: "Piotr Malinowski",
        headline: "Trainee attorney-at-law – commercial law and litigation",
        contact: ["+48 600 000 129", "piotr.malinowski@example.com", "Toruń", "linkedin.com/in/piotr-malinowski-przyklad"],
        summary: "Third-year trainee attorney-at-law, working at law firms that serve businesses since 2018. I draft pleadings and contracts, do legal research and appear at hearings as a substitute for an attorney-at-law. I specialise in commercial disputes and contract law.",
        skills: [
          "Pleadings in commercial cases",
          "Drafting and reviewing commercial contracts",
          "Appearing at hearings as a substitute for an attorney-at-law",
          "Research in legal information systems",
          "Due diligence of limited liability companies",
          "Employment law for business clients",
          "Legal English"
        ],
        languages: ["English C1", "German A2"],
        jobs: [
          {
            title: "Trainee attorney-at-law (previously legal assistant)",
            company: "Kancelaria Prawna Nowicki i Wspólnicy sp.k.",
            period: "06.2020 – present",
            bullets: [
              "Drafting statements of claim, statements of defence and appeals in commercial disputes.",
              "Appearing at about 10 hearings a month as a substitute for an attorney-at-law.",
              "Taking part in 6 due diligence reviews of companies ahead of acquisitions."
            ]
          },
          {
            title: "Legal assistant",
            company: "Kancelaria Adwokacka Kowal i Partnerzy",
            period: "10.2018 – 05.2020",
            bullets: [
              "Researching case law and legal literature for civil and family cases.",
              "Drafting simple documents and correspondence with clients.",
              "Keeping the court deadline calendar for 3 advocates."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Mikołaja Kopernika w Toruniu",
          degree: "Law (5-year master's programme)",
          period: "2015 – 2020"
        }
      },
      faq: [
        {
          q: "Should a trainee lawyer include the traineeship entrance exam score in their CV?",
          a: "It is not necessary, but a high score can help at the start of the traineeship, when you have little practice. Your year of traineeship, bar chamber and law firm experience matter more. After a few years the entrance exam score stops being relevant."
        },
        {
          q: "How do I describe cases when I am bound by professional secrecy?",
          a: "Do not give client names or case details. Describe the type of case, the industry, the approximate value in dispute and your role, for example ‘disputes under construction contracts worth up to several million zlotys’. The firm will appreciate that you respect confidentiality from the start."
        },
        {
          q: "Should I write my CV in English for an international law firm?",
          a: "If the ad is in English or the firm works mainly for foreign clients, prepare an English CV or two versions. Make sure the names of traineeships and titles are translated correctly, for example ‘trainee attorney-at-law (aplikant radcowski)’."
        }
      ]
    },
    "specjalista-bhp": {
      slugLang: "health-and-safety-specialist",
      name: "Health and safety specialist",
      title: "Health and safety specialist CV: example and tips",
      metaDescription: "A health and safety (BHP) specialist CV tailored to the job ad. An example, keywords and tips on describing qualifications, risk assessment, training and accidents at work.",
      intro: "Requirements for the occupational health and safety (BHP) service in Poland are set by regulations, so employers often state them very precisely in job ads: a degree in health and safety or postgraduate studies in the field, plus a length of service in the BHP function appropriate to the role. For an inspector position, a health and safety technician diploma is often enough. Duties typically include workplace inspections, occupational risk assessment, induction and refresher training, and accident investigations. In industrial plants, knowledge of ISO 45001 and taking part in audits are added.",
      keywords: [
        "degree in occupational health and safety",
        "occupational risk assessment",
        "induction and refresher BHP training",
        "accident investigation",
        "workplace inspections",
        "workstation instructions",
        "ISO 45001",
        "fire protection",
        "working with the labour inspectorate (PIP) and Sanepid",
        "reporting safety KPIs"
      ],
      tips: [
        "Describe your qualifications the way the regulations do: degree or postgraduate studies in health and safety plus years of service in the BHP function. This determines whether you can be hired as an inspector, specialist or senior specialist.",
        "Say which industries and hazards you have worked with: noise, work at height, machinery, chemicals, warehouses with forklifts. A manufacturing plant looks for someone who knows its real risks.",
        "Show results: fewer accidents, number of people trained, updated risk assessments, non-conformities closed after audits. A list of duties alone will not make you stand out.",
        "List extra qualifications and courses: fire protection inspector, training methodology, ISO 45001 internal auditor, first aid instructor. In many companies the BHP specialist covers these roles too."
      ],
      sample: {
        name: "Sebastian Wawrzyniak",
        headline: "Health and safety specialist – manufacturing plant",
        contact: ["+48 600 000 130", "sebastian.wawrzyniak@example.com", "Płock", "linkedin.com/in/sebastian-wawrzyniak-przyklad"],
        summary: "Health and safety specialist with eight years of service in the BHP function at manufacturing and logistics sites. I carry out occupational risk assessments, training, workstation inspections and accident investigations. I am an ISO 45001 internal auditor and a fire protection inspector.",
        skills: [
          "Occupational risk assessment",
          "Induction and refresher BHP training",
          "Accident investigation and documentation",
          "ISO 45001 internal audit",
          "Fire protection inspector",
          "Assessing machinery against minimum safety requirements",
          "Category B driving licence"
        ],
        languages: ["English B1"],
        jobs: [
          {
            title: "Health and safety specialist",
            company: "Zakłady Tworzyw Mazowsze Sp. z o.o.",
            period: "06.2020 – present",
            bullets: [
              "Overseeing safety at a plant employing about 450 people on three shifts.",
              "Updating 60 occupational risk assessments and workstation instructions after production line upgrades.",
              "Reducing accidents at work from 9 to 3 a year through a behaviour-based safety programme."
            ]
          },
          {
            title: "Health and safety inspector",
            company: "Wisła-Log Centrum Logistyczne Sp. z o.o.",
            period: "04.2018 – 05.2020",
            bullets: [
              "Delivering general induction training to about 300 new employees a year.",
              "Inspecting racking condition and forklift traffic rules.",
              "Serving on the accident investigation team and preparing documentation."
            ]
          }
        ],
        education: {
          school: "Politechnika Łódzka",
          degree: "Safety engineering (engineer's degree)",
          period: "2013 – 2017"
        }
      },
      faq: [
        {
          q: "Can I become a health and safety specialist straight after postgraduate BHP studies?",
          a: "Postgraduate health and safety studies are one route to the qualification, but for a specialist role the regulations also require service in the BHP function. If you do not have it yet, look for inspector roles or a company where you can gain the required service. In your CV, give the date you finished your studies and every period of work in the BHP function."
        },
        {
          q: "How do I list work for an external health and safety firm in my CV?",
          a: "Describe it like any other job and list the industries and size of the sites you served, without client names unless you have permission. Say how many sites you covered and what tasks you did. For an employer, this proves you know many different work environments."
        }
      ]
    }
  },

  uk: {
    "weterynarz": {
      slugLang: "likar-veterynarii",
      name: "Лікар ветеринарної медицини",
      title: "Резюме лікаря ветеринарної медицини: зразок і поради",
      metaDescription: "Резюме лікаря ветеринарної медицини під вакансію: зразок, ключові слова з оголошень клінік і поради, як описати право на практику, спеціалізацію та операції.",
      intro: "Ветеринарні клініки в оголошеннях зазвичай починають з права на практику лікаря ветеринарної медицини та з того, чи кандидат працюватиме з собаками й котами, сільськогосподарськими чи екзотичними тваринами. Далі йдуть конкретні навички: візуальна діагностика, хірургічні втручання, анестезія та готовність до чергувань. У виїзній практиці важать також посвідчення водія категорії B і досвід роботи у господарствах. Добре написане резюме показує, що ви робите самостійно, а що поки під наглядом.",
      keywords: [
        "право на практику лікаря ветеринарної медицини",
        "лікування дрібних тварин",
        "УЗД і рентгенодіагностика",
        "хірургія м'яких тканин",
        "інгаляційна анестезія",
        "внутрішні хвороби собак і котів",
        "нічні та вихідні чергування",
        "робота з сільськогосподарськими тваринами",
        "ведення медичної документації",
        "посвідчення водія кат. B"
      ],
      tips: [
        "На самому початку вкажіть право на практику та палату, в якій ви зареєстровані, а також розпочату або завершену спеціалізацію. Саме це керівник клініки шукає насамперед.",
        "Перелічіть втручання, які виконуєте самостійно, наприклад кастрації, стерилізації, видалення зубів чи зашивання ран, і відокремте їх від тих, у яких асистуєте. Чесний поділ викликає довіру.",
        "Вкажіть обладнання та дослідження: УЗД черевної порожнини, рентген, аналізатори крові, ендоскопія. Якщо ви самостійно оцінюєте рентгенівські знімки, напишіть про це прямо.",
        "Покажіть обсяг роботи цифрами: скільки прийомів на день, скільки чергувань на місяць, скільки господарств обслуговуєте. Для цілодобової клініки це важливіше за перелік курсів."
      ],
      sample: {
        name: "Karolina Pawlak",
        headline: "Лікар ветеринарної медицини – дрібні тварини, хірургія м'яких тканин",
        contact: ["+48 600 000 121", "karolina.pawlak@example.com", "Zamość", "linkedin.com/in/karolina-pawlak-przyklad"],
        summary: "Лікар ветеринарної медицини з восьмирічним досвідом лікування собак і котів. Самостійно веду терапевтичні прийоми, роблю УЗД і операції на м'яких тканинах. Проходжу спеціалізацію з хвороб собак і котів та регулярно чергую в цілодобовій клініці.",
        skills: [
          "Право на практику лікаря ветеринарної медицини",
          "УЗД черевної порожнини",
          "Виконання та оцінка рентгенівських знімків",
          "Кастрації, стерилізації та операції на м'яких тканинах",
          "Інгаляційна анестезія та моніторинг пацієнта",
          "Стоматологія: скейлінг і видалення зубів",
          "Спілкування з власниками тварин"
        ],
        languages: ["англійська B2"],
        jobs: [
          {
            title: "Лікар ветеринарної медицини",
            company: "Całodobowa Lecznica dla Zwierząt Animed Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Прийом у середньому 18–22 пацієнтів на день у терапевтичному кабінеті.",
              "Самостійне виконання близько 40 операцій на місяць, переважно кастрацій і видалення пухлин шкіри.",
              "4–5 нічних чергувань на місяць, зокрема прийом невідкладних випадків."
            ]
          },
          {
            title: "Молодший лікар ветеринарної медицини",
            company: "Gabinet Weterynaryjny Pod Lipami s.c.",
            period: "10.2018 – 05.2020",
            bullets: [
              "Профілактичні прийоми: вакцинація, дегельмінтизація, чипування.",
              "Асистування під час операцій і підготовка пацієнтів до анестезії.",
              "Забір матеріалу для аналізів та інтерпретація загального і біохімічного аналізу крові."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Przyrodniczy w Lublinie",
          degree: "Ветеринарна медицина (єдина магістерська програма)",
          period: "2012 – 2018"
        }
      },
      faq: [
        {
          q: "Чи вписувати в резюме номер права на практику?",
          a: "Достатньо зазначити, що ви маєте право на практику і в якій окружній лікарсько-ветеринарній палаті зареєстровані. Роботодавець однаково перевірить документ під час працевлаштування. Вказати номер не помилка, але й не обов'язково."
        },
        {
          q: "Як описати спеціалізацію, яку я ще не завершив?",
          a: "Напишіть «спеціалізація в процесі» з назвою галузі та очікуваним роком іспиту. Клініки цінують лікарів, які розвиваються, тож це перевага ще до отримання звання спеціаліста."
        },
        {
          q: "Чи можу я після кількох років із дрібними тваринами податися в практику з великою рогатою худобою?",
          a: "Так, але чітко покажіть усе, що пов'язане з великими тваринами: студентські практики в господарствах, допомогу під час отелень, обстеження репродукції. У підсумку прямо напишіть, що хочете розвиватися в цьому напрямі, і підкресліть наявність посвідчення водія."
        }
      ]
    },
    "terapeuta-zajeciowy": {
      slugLang: "erhoterapevt",
      name: "Ерготерапевт",
      title: "Резюме ерготерапевта: зразок і поради",
      metaDescription: "Резюме ерготерапевта під вакансію в будинку соціальної допомоги, денному центрі чи майстерні. Зразок, ключові слова та поради, як описати майстерні, методи й плани терапії.",
      intro: "У Польщі ерготерапевтів (терапевтів зайнятості) наймають переважно будинки соціальної допомоги (DPS), центри самодопомоги (ŚDS), майстерні трудової терапії (WTZ), заклади довготривалого догляду та реабілітаційні відділення. В оголошеннях роботодавці запитують про профільну освіту, тобто післясередню школу або навчання в університеті за напрямом трудової терапії, і про досвід роботи з конкретною групою: людьми похилого віку, з інтелектуальною інвалідністю або після інсульту. Важить і ведення документації, зокрема індивідуальних планів терапії. У резюме варто показати майстерні та методи, які ви знаєте з практики, а не лише з навчання.",
      keywords: [
        "профільна освіта: трудова терапія",
        "проведення групових та індивідуальних занять",
        "індивідуальний план терапії",
        "тренування соціальних навичок",
        "тренування повсякденної діяльності",
        "арттерапія",
        "робота з людьми з інтелектуальною інвалідністю",
        "робота з людьми похилого віку",
        "ведення документації учасника",
        "організація виходів та інтеграційних заходів"
      ],
      tips: [
        "Напишіть, з якою групою ви працювали і скількох учасників мали під опікою. Робота з літніми людьми з деменцією в DPS вимагає інших навичок, ніж ведення майстерні у WTZ для молодих дорослих.",
        "Перелічіть майстерні, які ви ведете: художню, керамічну, кулінарну, столярну, комп'ютерну чи садівничу. Заклад часто шукає людину саме до конкретної майстерні.",
        "Покажіть, що вмієте працювати з документами: функціональна діагностика, індивідуальний план терапії, оцінка прогресу, звіти. У багатьох закладах це обов'язкова умова.",
        "Додайте курси, які застосовуєте на заняттях, наприклад метод розвивального руху Вероніки Шерборн, музикотерапію чи тренування пам'яті. Коротко напишіть, як ви їх використовуєте."
      ],
      sample: {
        name: "Tomasz Wróblewski",
        headline: "Ерготерапевт – робота з людьми з інтелектуальною інвалідністю",
        contact: ["+48 600 000 122", "tomasz.wroblewski@example.com", "Elbląg", "linkedin.com/in/tomasz-wroblewski-przyklad"],
        summary: "Ерготерапевт із восьмирічним досвідом роботи в майстерні трудової терапії та будинку соціальної допомоги. Веду столярно-керамічну майстерню і тренування самостійності, готую індивідуальні плани терапії та оцінки прогресу. Співпрацюю з психологом, фізіотерапевтом і родинами учасників.",
        skills: [
          "Індивідуальні плани терапії та оцінка прогресу",
          "Тренування повсякденної діяльності",
          "Тренування соціальних навичок",
          "Ведення керамічної та столярної майстерні",
          "Групова арттерапія і музикотерапія",
          "Метод розвивального руху Вероніки Шерборн",
          "Співпраця з родинами та терапевтичною командою"
        ],
        languages: ["англійська A2"],
        jobs: [
          {
            title: "Ерготерапевт – інструктор майстерні",
            company: "Warsztat Terapii Zajęciowej Stowarzyszenia Krok Dalej",
            period: "06.2020 – дотепер",
            bullets: [
              "Ведення столярно-керамічної майстерні для групи з 6 учасників.",
              "Розроблення та оновлення індивідуальних планів терапії і піврічних оцінок прогресу.",
              "Підготовка учасників та їхніх робіт до 3 міських ярмарків на рік."
            ]
          },
          {
            title: "Ерготерапевт",
            company: "Dom Pomocy Społecznej Przystań",
            period: "09.2017 – 05.2020",
            bullets: [
              "Проведення групових занять для мешканців похилого віку, зокрема тренування пам'яті.",
              "Тренування повсякденної діяльності з людьми після інсульту разом із фізіотерапевтом.",
              "Організація культурних виходів і свят для близько 60 мешканців."
            ]
          }
        ],
        education: {
          school: "Medyczna Szkoła Policealna w Elblągu",
          degree: "Ерготерапевт (terapeuta zajęciowy)",
          period: "2015 – 2017"
        }
      },
      faq: [
        {
          q: "Чи можу я працювати ерготерапевтом після короткого курсу?",
          a: "В оголошеннях від DPS, ŚDS і WTZ зазвичай вимагають профільну освіту, тобто закінчену післясередню школу або навчання в університеті з трудової терапії. Короткий курс може бути перевагою, але рідко її замінює. Впишіть його в розділ курсів, а не освіти, щоб не вводити рекрутера в оману."
        },
        {
          q: "Як описати роботу з учасниками, не порушуючи їхньої приватності?",
          a: "Пишіть загально: вікова група, вид інвалідності, кількість людей і результати роботи. Не вказуйте імен, діагнозів конкретних осіб і не додавайте фото із занять. Такий підхід сам по собі показує, що ви розумієте принципи конфіденційності."
        }
      ]
    },
    "pracownik-biurowy": {
      slugLang: "ofisnyi-pratsivnyk",
      name: "Офісний працівник",
      title: "Резюме офісного працівника: зразок і поради",
      metaDescription: "Резюме офісного працівника під конкретну вакансію. Зразок, ключові слова з оголошень і поради, як описати документообіг, Excel і роботу з кореспонденцією.",
      intro: "Оголошення на посаду офісного працівника бувають дуже різними: від роботи в секретаріаті невеликої фірми до введення даних у відділі продажу чи логістики. Проте майже завжди повторюються ті самі вимоги: добре знання пакета MS Office, особливо Excel, уважність, робота з кореспонденцією та документообіг. Частина роботодавців додає знання програми для виставлення рахунків або системи ERP. Тому в резюме найважливіше показати конкретні завдання та інструменти, а не загальні риси характеру.",
      keywords: [
        "робота з пакетом MS Office",
        "Excel: зведені таблиці та ВПР (VLOOKUP)",
        "документообіг",
        "обробка вхідної та вихідної кореспонденції",
        "введення даних у систему",
        "виставлення рахунків-фактур",
        "архівування документів",
        "обслуговування клієнтів телефоном та електронною поштою",
        "підготовка зведень і звітів",
        "уважність і добра організація роботи"
      ],
      tips: [
        "Замість «вільне володіння MS Office» напишіть, що саме ви робите в Excel: зведені таблиці, ВПР, фільтри, прості діаграми. На співбесіді можуть дати коротке практичне завдання, тож пишіть правду.",
        "Перелічіть програми, з якими працювали, наприклад системи для виставлення рахунків, ERP чи CRM. Навіть якщо у фірмі інша система, досвід зі схожим інструментом скорочує введення в роботу.",
        "Опишіть обсяг обов'язків: скільки документів на день вводите, скільки рахунків на місяць виставляєте, скількох контрагентів обслуговуєте. Цифри вирізняють вас серед кандидатів із загальниковим резюме.",
        "Якщо оголошення стосується конкретного відділу, наприклад логістики чи кадрів, підкресліть завдання з цієї сфери. Офісний працівник в експедиторській фірмі робить зовсім інше, ніж у бухгалтерському бюро."
      ],
      sample: {
        name: "Natalia Zając",
        headline: "Офісний працівник – документи та обслуговування клієнтів",
        contact: ["+48 600 000 123", "natalia.zajac@example.com", "Opole", "linkedin.com/in/natalia-zajac-przyklad"],
        summary: "Вісім років працюю в офісній адміністрації торговельних і сервісних компаній. Веду документообіг, виставляю рахунки, готую зведення в Excel і веду листування з клієнтами. Люблю порядок у документах і швидко освоюю нові системи.",
        skills: [
          "Excel: зведені таблиці, ВПР, умовне форматування",
          "Word і Outlook",
          "Виставлення рахунків і коригувальних рахунків",
          "Робота із системою ERP (модуль продажу)",
          "Документообіг і архівування",
          "Обслуговування клієнтів телефоном та електронною поштою",
          "Посвідчення водія кат. B"
        ],
        languages: ["англійська B1"],
        jobs: [
          {
            title: "Офісний працівник",
            company: "Hurtownia Materiałów Budowlanych Opal-Bud Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Виставлення близько 350 рахунків на місяць і підготовка коригувань.",
              "Ведення реєстру договорів і архівування комерційної документації.",
              "Підготовка щотижневих зведень продажу в Excel для керівника філії."
            ]
          },
          {
            title: "Асистентка офісу",
            company: "Biuro Rachunkowe Bilans-Plus s.c.",
            period: "03.2018 – 05.2020",
            bullets: [
              "Приймання та реєстрація документів від близько 40 клієнтів бюро.",
              "Обслуговування телефонної станції та електронної пошти.",
              "Введення даних у бухгалтерську програму під наглядом бухгалтера."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Opolski",
          degree: "Адміністрування (бакалавр)",
          period: "2014 – 2017"
        }
      },
      faq: [
        {
          q: "Чи можна без досвіду написати добре резюме офісного працівника?",
          a: "Так. Опишіть практики, стажування, роботу в студентському самоврядуванні чи волонтерство, якщо вони були пов'язані з документами, Excel або спілкуванням з людьми. Додайте курси, наприклад з Excel, і конкретно напишіть, чого навчилися. На офісні посади роботодавці часто шукають уважних людей, готових вчитися, а не лише тих, хто має довгий стаж."
        },
        {
          q: "Як описати знання Excel, щоб не перебільшити?",
          a: "Перелічіть конкретні функції та завдання, які виконуєте без сторонньої допомоги, замість загального рівня. Якщо макроси чи Power Query знаєте лише з курсу, напишіть «базовий рівень». Рекрутери дедалі частіше перевіряють Excel коротким тестом."
        }
      ]
    },
    "office-manager": {
      slugLang: "ofis-menedzher",
      name: "Офіс-менеджер",
      title: "Резюме офіс-менеджера: зразок і поради",
      metaDescription: "Резюме офіс-менеджера під вакансію: зразок, ключові слова з оголошень і поради, як описати бюджет офісу, роботу з постачальниками та організацію корпоративних заходів.",
      intro: "Офіс-менеджер відповідає за те, щоб офіс просто працював: від замовлень і договорів з постачальниками, через рецепцію та службові поїздки, до організації зустрічей і корпоративних заходів. В оголошеннях роботодавці часто поєднують це з елементами кадрової адміністрації, підтримкою правління та контролем витрат офісу. Дуже часто вимагають англійську на комунікативному рівні або вище, бо багато таких вакансій пропонують міжнародні компанії. Добре резюме показує обсяг відповідальності й заощадження, а не лише перелік дій.",
      keywords: [
        "управління офісом",
        "співпраця з постачальниками та переговори щодо договорів",
        "контроль бюджету офісу",
        "організація корпоративних заходів",
        "організація службових поїздок",
        "підтримка правління",
        "робота на рецепції",
        "адаптація нових працівників (онбординг)",
        "замовлення канцтоварів",
        "англійська на комунікативному рівні"
      ],
      tips: [
        "Вкажіть розмір офісу та команди, якими опікуєтеся, наприклад «офіс на 80 осіб, два поверхи, рецепція і конференц-зал». Це одразу показує рівень посади.",
        "Покажіть гроші: яким бюджетом керуєте і що вдалося заощадити, наприклад після зміни клінінгової компанії чи перегляду договору на кейтеринг. Офіс-менеджер із фінансовими результатами вирізняється серед інших кандидатів.",
        "Опишіть заходи, які ви організовували: кількість учасників, бюджет, місце. Корпоративний виїзд на 120 осіб – це конкретний проєктний досвід.",
        "Якщо ви займалися переїздом офісу, впровадженням системи бронювання переговорних чи процесом онбордингу, впишіть це окремо. Такі проєкти доводять рекрутеру вашу самостійність."
      ],
      sample: {
        name: "Agnieszka Kubiak",
        headline: "Офіс-менеджер – офіс ІТ-компанії на 90 осіб",
        contact: ["+48 600 000 124", "agnieszka.kubiak@example.com", "Wrocław", "linkedin.com/in/agnieszka-kubiak-przyklad"],
        summary: "Дев'ять років працюю в офісній адміністрації, з них шість – офіс-менеджеркою в технологічній компанії. Відповідаю за адміністративний бюджет, договори з постачальниками, рецепцію та організацію заходів. Провела переїзд офісу і впровадила процес онбордингу, яким користується весь відділ HR.",
        skills: [
          "Управління бюджетом офісу",
          "Переговори з постачальниками послуг",
          "Організація корпоративних заходів і виїздів",
          "Бронювання службових поїздок",
          "Онбординг нових працівників",
          "MS Office і Google Workspace",
          "Англійська в щоденній роботі"
        ],
        languages: ["англійська C1", "німецька A2"],
        jobs: [
          {
            title: "Офіс-менеджер",
            company: "Codera Solutions Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Управління офісом на 90 осіб із річним адміністративним бюджетом близько 600 тис. злотих.",
              "Перегляд договорів на прибирання і кейтеринг, що знизило ці витрати на 14% на рік.",
              "Організація 2 корпоративних виїздів на рік для понад 100 учасників."
            ]
          },
          {
            title: "Асистентка правління",
            company: "Fiskus-Pro Doradztwo Podatkowe Sp. z o.o.",
            period: "02.2017 – 05.2020",
            bullets: [
              "Ведення календарів двох членів правління та організація зустрічей із клієнтами.",
              "Робота на рецепції, з поштою і бронюванням конференц-залів.",
              "Замовлення канцтоварів і перевірка рахунків від постачальників."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny we Wrocławiu",
          degree: "Менеджмент (магістр)",
          period: "2012 – 2017"
        }
      },
      faq: [
        {
          q: "Чим резюме офіс-менеджера відрізняється від резюме асистентки?",
          a: "У резюме офіс-менеджера має бути видно відповідальність: бюджет, рішення щодо постачальників, проєкти та людей, за яких ви відповідаєте. Асистентка описує переважно підтримку конкретної особи. Якщо ви переходите з посади асистентки на офіс-менеджера, винесіть на перший план завдання, де ухвалювали рішення самостійно."
        },
        {
          q: "Чи писати резюме англійською, якщо оголошення англійською?",
          a: "Зазвичай так. Оголошення англійською – це сигнал, що в офісі ця мова використовується щодня, а рекрутер може не говорити польською. Якщо оголошення польською, але вимагає англійської, достатньо польського резюме з точно вказаним рівнем мови."
        }
      ]
    },
    "analityk-finansowy": {
      slugLang: "finansovyi-analityk",
      name: "Фінансовий аналітик",
      title: "Резюме фінансового аналітика: зразок і поради",
      metaDescription: "Резюме фінансового аналітика під вакансію. Зразок, ключові слова з оголошень і поради, як описати фінансові моделі, Excel, SQL, Power BI та сертифікат CFA.",
      intro: "Фінансовий аналітик готує бюджети, прогнози та аналізи, на основі яких правління ухвалює рішення. В оголошеннях виробничих компаній, центрів спільного обслуговування та банків повторюються ті самі вимоги: просунутий Excel, побудова фінансових моделей, звітування про результати і добра англійська. Дедалі частіше з'являються SQL та BI-інструменти, наприклад Power BI. Сертифікати CFA чи ACCA зазвичай не обов'язкові, але помітно підвищують цінність кандидата.",
      keywords: [
        "фінансовий аналіз",
        "бюджетування і прогнозування (forecast)",
        "фінансове моделювання",
        "просунуте знання Excel",
        "управлінська звітність",
        "аналіз відхилень",
        "Power BI",
        "SQL",
        "знання SAP",
        "вільна англійська"
      ],
      tips: [
        "Опишіть аналізи, які ви готуєте, і для чого вони: прогноз грошових потоків, аналіз рентабельності продуктів, модель окупності інвестицій. Сама назва посади не каже рекрутеру, чим ви займалися.",
        "Покажіть результат своєї роботи: скорочений час звітування, автоматизований звіт, рішення правління на основі вашого аналізу. Цифри та відсотки тут цілком доречні.",
        "Вказуйте інструменти разом з тим, що ви в них робите: Excel (моделі, Power Query), SQL (запити, об'єднання), Power BI (дашборди). Вакансії у фінансах фільтрують саме за цими словами.",
        "Якщо складаєте CFA чи ACCA, вкажіть складені рівні чи іспити та запланований термін наступного. Це показує, що ви розвиваєтеся систематично."
      ],
      sample: {
        name: "Michał Sobczak",
        headline: "Фінансовий аналітик – FP&A",
        contact: ["+48 600 000 125", "michal.sobczak@example.com", "Kraków", "linkedin.com/in/michal-sobczak-przyklad"],
        summary: "Фінансовий аналітик із восьмирічним досвідом, останні шість років – у команді FP&A виробничої компанії. Готую бюджети, квартальні прогнози та аналізи рентабельності, будую моделі в Excel і дашборди в Power BI. Склав іспит CFA Level II.",
        skills: [
          "Бюджетування і прогнозування",
          "Фінансове моделювання в Excel",
          "Power Query і Power BI",
          "SQL: запити та об'єднання",
          "SAP FI/CO (звіти)",
          "Аналіз рентабельності продуктів і клієнтів",
          "Презентація результатів керівництву"
        ],
        languages: ["англійська C1"],
        jobs: [
          {
            title: "Фінансовий аналітик (FP&A)",
            company: "Kartonex Opakowania Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Підготовка річного бюджету і квартальних прогнозів для 3 виробничих заводів.",
              "Створення дашборду в Power BI, що скоротило щомісячне звітування з 4 до 2 днів.",
              "Аналіз рентабельності 200 товарних позицій, на якому ґрунтувалися зміни в прайс-листі."
            ]
          },
          {
            title: "Молодший фінансовий аналітик",
            company: "Finexa Centrum Usług Księgowych Sp. z o.o.",
            period: "07.2018 – 05.2020",
            bullets: [
              "Підготовка щомісячних звітів про результати для клієнтів із Великої Британії та Німеччини.",
              "Аналіз відхилень витрат від бюджету і підготовка коментарів для контролера.",
              "Звірка даних між SAP і звітами в Excel."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny w Krakowie",
          degree: "Фінанси та облік (магістр)",
          period: "2013 – 2018"
        }
      },
      faq: [
        {
          q: "Чи маю я шанси на посаду фінансового аналітика без CFA?",
          a: "Так, більшість оголошень розглядає CFA чи ACCA як перевагу, а не вимогу. Важливіші практичні навички: Excel, розуміння фінансової звітності та вміння пояснити цифри людям поза фінансами. Якщо думаєте про сертифікат, напишіть у резюме, що готуєтеся до іспиту."
        },
        {
          q: "Як показати результати в резюме, якщо мене зобов'язує комерційна таємниця?",
          a: "Вказуйте масштаб і ефект приблизно або у відсотках замість точних сум і назв клієнтів. Наприклад: «бюджет витрат на кілька десятків мільйонів злотих» або «скорочення звітування вдвічі». Цього достатньо, щоб показати рівень відповідальності."
        }
      ]
    },
    "kontroler-finansowy": {
      slugLang: "finansovyi-kontroler",
      name: "Фінансовий контролер",
      title: "Резюме фінансового контролера: зразок і поради",
      metaDescription: "Резюме фінансового контролера під вакансію. Зразок, ключові слова з оголошень і поради, як описати контролінг, закриття місяця, бюджети та кваліфікацію ACCA чи CIMA.",
      intro: "Фінансовий контролер стежить, щоб цифри в компанії були достовірними і щоб правління знало, звідки беруться відхилення від плану. В оголошеннях зазвичай згадують контроль витрат, участь у закритті місяця, бюджетування, звітування до головного офісу та співпрацю з бухгалтерією й аудиторами. Роботодавці запитують про знання польського закону про бухгалтерський облік, а якщо компанія входить до іноземної групи, то й МСФЗ чи US GAAP. Для самостійних посад часто очікують кількох років досвіду в контролінгу чи аудиті та кваліфікації ACCA або CIMA.",
      keywords: [
        "фінансовий контролінг",
        "закриття місяця і року",
        "бюджетування і контроль витрат",
        "аналіз відхилень план/факт",
        "звітування для групи компаній",
        "знання МСФЗ",
        "закон про бухгалтерський облік",
        "співпраця з аудитором",
        "контролінг виробничих витрат",
        "ACCA або CIMA"
      ],
      tips: [
        "Напишіть, у якому середовищі ви працюєте: польська компанія чи частина іноземної групи, які стандарти звітності, яка система ERP. Контролера з досвідом звітування для групи шукають частіше, ніж того, хто знає лише польські правила.",
        "Опишіть свою участь у закритті місяця: термін, ділянки, за які відповідаєте, звірки, які готуєте. Скорочення закриття з десяти до п'яти робочих днів – сильний аргумент.",
        "Покажіть вплив на витрати: запроваджені контролі, виявлені порушення, зміни в процесі закупівель. Контролера оцінюють за тим, чи його аналізи перетворюються на рішення.",
        "Якщо ви перейшли з аудиту, назвіть галузі та типи компаній, які перевіряли. Це показує, що ви знаєте різні бізнес-моделі і розумієте очікування аудитора."
      ],
      sample: {
        name: "Joanna Mazurek",
        headline: "Фінансовий контролер – групова звітність і контролінг витрат",
        contact: ["+48 600 000 126", "joanna.mazurek@example.com", "Bielsko-Biała", "linkedin.com/in/joanna-mazurek-przyklad"],
        summary: "Фінансова контролерка з одинадцятирічним досвідом, з них майже п'ять років в аудиті. Відповідаю за закриття місяця, звітування для групи за МСФЗ і контролінг виробничих витрат у компанії з німецьким капіталом. Маю кваліфікацію ACCA.",
        skills: [
          "Закриття місяця і року",
          "Звітність за МСФЗ і польським законом про облік",
          "Контролінг виробничих витрат",
          "Бюджетування і аналіз відхилень",
          "SAP FI/CO",
          "Співпраця з аудитором",
          "Просунутий Excel і Power Query"
        ],
        languages: ["англійська C1", "німецька B1"],
        jobs: [
          {
            title: "Фінансовий контролер",
            company: "Beskid Komponenty Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Координація закриття місяця та його скорочення з 8 до 5 робочих днів.",
              "Підготовка звітних пакетів за МСФЗ для німецької материнської компанії.",
              "Запровадження щомісячного аналізу витрат матеріалів, що зменшило відхилення від норм на 18%."
            ]
          },
          {
            title: "Старший асистент аудитора",
            company: "Rewident-Konsult Sp. z o.o.",
            period: "09.2015 – 05.2020",
            bullets: [
              "Аудит фінансової звітності виробничих і торговельних компаній.",
              "Керування командою з 2–3 асистентів під час роботи на об'єкті клієнта.",
              "Підготовка листів до правління з рекомендаціями щодо внутрішнього контролю."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny w Katowicach",
          degree: "Фінанси та облік (магістр)",
          period: "2010 – 2015"
        }
      },
      faq: [
        {
          q: "Чи потрібна фінансовому контролеру бухгалтерська кваліфікація?",
          a: "Законодавчої вимоги немає, але роботодавці очікують доброго знання обліку і часто досвіду в бухгалтерії чи аудиті. Сертифікати ACCA, CIMA або польський бухгалтерський сертифікат добре сприймаються. Вкажіть їх у резюме з роком отримання або переліком складених іспитів."
        },
        {
          q: "Як описати в резюме перехід з аудиту в контролінг?",
          a: "Покажіть, що знаєте процеси зсередини: назвіть ділянки, які перевіряли найчастіше, наприклад запаси, доходи чи основні засоби. Додайте консультаційні проєкти або допомогу клієнтам під час закриття періоду. У підсумку прямо напишіть, чому хочете працювати на боці компанії."
        }
      ]
    },
    "agent-ubezpieczeniowy": {
      slugLang: "strakhovyi-ahent",
      name: "Страховий агент",
      title: "Резюме страхового агента: зразок і поради",
      metaDescription: "Резюме страхового агента під вакансію. Зразок, ключові слова з оголошень і поради, як описати результати продажу, портфель клієнтів і внесення до реєстру KNF.",
      intro: "Страхових агентів шукають як страхові компанії, так і мультиагенції, а вакансії найчастіше стосуються продажу автострахування, страхування майна та життя. Кандидат без досвіду зазвичай проходить навчання та іспит, після чого його вносять до реєстру агентів, який веде Комісія фінансового нагляду (KNF). Роботодавці запитують про досвід у продажах, власну базу клієнтів і готовність працювати за комісію або у форматі B2B. У резюме найкраще працюють конкретні результати: кількість полісів, сума премій і утримання клієнтів.",
      keywords: [
        "продаж автострахування OC і AC",
        "страхування життя",
        "страхування майна",
        "внесення до реєстру страхових агентів",
        "залучення нових клієнтів",
        "обслуговування портфеля клієнтів",
        "аналіз потреб клієнта",
        "виконання планів продажу",
        "співпраця на підставі агентського договору",
        "посвідчення водія кат. B"
      ],
      tips: [
        "Вкажіть результати: кількість проданих полісів, суму премій за рік, місце в рейтингу мережі. Агента оцінюють за цифрами, і рекрутер очікує побачити їх у резюме.",
        "Напишіть, чи працювали ви ексклюзивним агентом однієї компанії чи в мультиагенції, і які продукти продаєте. Досвід зі страхуванням життя та бізнесу цінують вище, ніж лише продаж OC.",
        "Зазначте, що маєте чинний запис у реєстрі агентів і проходите щорічне професійне навчання. Якщо запису ще немає, напишіть, що готові пройти навчання та іспит.",
        "Покажіть, як ви дбаєте про клієнтів: частка поновлень, рекомендації, допомога при врегулюванні збитків. Агент, який утримує портфель, для агенції цінніший за того, хто лише продає нові поліси."
      ],
      sample: {
        name: "Robert Kaczmarczyk",
        headline: "Страховий агент – автострахування і страхування життя",
        contact: ["+48 600 000 127", "robert.kaczmarczyk@example.com", "Siedlce", "linkedin.com/in/robert-kaczmarczyk-przyklad"],
        summary: "Вісім років продаю автострахування, страхування майна та життя: спершу як ексклюзивний агент, тепер у мультиагенції. Обслуговую портфель понад 900 приватних клієнтів і малих фірм, і щороку понад 80% із них поновлюють поліси в мене. Маю чинний запис у реєстрі страхових агентів.",
        skills: [
          "Продаж страхування OC, AC і NNW",
          "Страхування життя та ризикові продукти",
          "Страхування житла і малого бізнесу",
          "Аналіз потреб і порівняння пропозицій",
          "Робота з калькуляторами кількох страховиків",
          "Залучення клієнтів за рекомендаціями",
          "Посвідчення водія кат. B"
        ],
        languages: ["англійська A2"],
        jobs: [
          {
            title: "Страховий агент",
            company: "Multiagencja Ubezpieczeniowa Bezpieczny Dom s.c.",
            period: "06.2020 – дотепер",
            bullets: [
              "Продаж у середньому 70 полісів на місяць, переважно автострахування і страхування житла.",
              "Збільшення частки страхування життя в моєму портфелі з 5% до 22% премій.",
              "Допомога клієнтам у заявленні страхових випадків і контакт з аджастерами."
            ]
          },
          {
            title: "Ексклюзивний агент",
            company: "Polisa-Serwis Agencja Ubezpieczeniowa Sp. z o.o.",
            period: "04.2018 – 05.2020",
            bullets: [
              "Залучення приватних клієнтів до страхування життя.",
              "Виконання квартальних планів продажу в середньому на 110%.",
              "Зустрічі з клієнтами в офісі та за місцем проживання в межах повіту."
            ]
          }
        ],
        education: {
          school: "Uniwersytet w Siedlcach",
          degree: "Економіка (бакалавр)",
          period: "2013 – 2016"
        }
      },
      faq: [
        {
          q: "Чи потрібен досвід у страхуванні, щоб стати агентом?",
          a: "Ні, багато агенцій навчають людей із досвідом в інших продажах або обслуговуванні клієнтів. Перед початком роботи треба пройти навчання, скласти іспит і отримати запис у реєстрі агентів. У резюме покажіть результати попередніх продажів і вміння легко встановлювати контакт."
        },
        {
          q: "Чи вписувати в резюме результати продажу, якщо вони були не найкращими?",
          a: "Наведіть ті дані, які добре показують вашу роботу, наприклад утримання клієнтів або зростання за конкретним продуктом. Не обов'язково перелічувати кожен місяць. Пам'ятайте, що на співбесіді можуть запитати деталі, тож цифри мають бути правдивими."
        }
      ]
    },
    "specjalista-ds-windykacji": {
      slugLang: "fakhivets-zi-stiahnennia-borhiv",
      name: "Фахівець зі стягнення боргів",
      title: "Резюме фахівця зі стягнення боргів: зразок і поради",
      metaDescription: "Резюме фахівця зі стягнення боргів під вакансію. Зразок, ключові слова з оголошень і поради, як описати досудове і судове стягнення, мирові угоди та ефективність повернення.",
      intro: "Фахівці зі стягнення боргів працюють у колекторських компаніях, банках, лізингових фірмах, у постачальників комунальних послуг і у фінансових відділах звичайних підприємств. Оголошення розрізняють досудове стягнення (телефоном і листами), виїзне та судово-виконавче. Роботодавці запитують про стресостійкість, уміння вести переговори і знання процедур: вимог про оплату, мирових угод, наказного провадження та співпраці з судовим виконавцем. У резюме найважливіші ефективність повернення і розмір портфеля, який ви ведете.",
      keywords: [
        "досудове стягнення боргів",
        "телефонне стягнення",
        "переговори щодо угод і графіків погашення",
        "вимоги про оплату",
        "моніторинг дебіторської заборгованості",
        "судове та виконавче стягнення",
        "електронне наказне провадження (EPU)",
        "співпраця з юридичними фірмами та судовими виконавцями",
        "виконання цілей повернення",
        "стресостійкість"
      ],
      tips: [
        "Напишіть, яке стягнення ви ведете: споживче чи B2B, досудове чи судове. Це зовсім різні посади, і рекрутер має одразу побачити, до якої ви підходите.",
        "Вкажіть масштаб і ефективність: кількість справ у портфелі, суму заборгованості, відсоток повернення або виконання цілі. Саме за цими цифрами оцінюють роботу у стягненні.",
        "Перелічіть процедури, які знаєте з практики: вимоги про оплату, угоди, позови в EPU, заяви про примусове виконання, внесення до бюро кредитної інформації. Працівник, який знає весь процес, швидше входить у роботу.",
        "Покажіть культуру розмови з боржником: відсутність скарг, тренінги з переговорів, робота з клієнтами у складній ситуації. Компанії дбають про репутацію і обирають людей, які повертають гроші без загострення конфліктів."
      ],
      sample: {
        name: "Ewelina Górska",
        headline: "Фахівчиня зі стягнення боргів – дебіторська заборгованість B2B",
        contact: ["+48 600 000 128", "ewelina.gorska@example.com", "Gorzów Wielkopolski", "linkedin.com/in/ewelina-gorska-przyklad"],
        summary: "Вісім років займаюся стягненням заборгованості: спершу споживчої, тепер від компаній. Веду справи від першого нагадування до подання позову, домовляюся про угоди та графіки погашення, співпрацюю з юридичною фірмою і судовими виконавцями. Регулярно перевищую ціль повернення, встановлену для відділу.",
        skills: [
          "Досудове стягнення B2B і споживчих боргів",
          "Переговори щодо угод і графіків погашення",
          "Вимоги про оплату і нарахування відсотків",
          "Позови в електронному наказному провадженні",
          "Моніторинг дебіторки в системі ERP",
          "Співпраця з юридичною фірмою і судовими виконавцями",
          "Excel: звіти про вікову структуру заборгованості"
        ],
        languages: ["англійська B1"],
        jobs: [
          {
            title: "Фахівчиня зі стягнення боргів",
            company: "Lubuskie Smaki Hurtownia Spożywcza Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Ведення портфеля близько 450 контрагентів із заборгованістю на загальну суму близько 6 млн злотих.",
              "Зниження частки боргів, прострочених понад 60 днів, з 11% до 6%.",
              "Підготовка документів до близько 30 позовів на рік і співпраця з юридичною фірмою."
            ]
          },
          {
            title: "Консультантка з телефонного стягнення",
            company: "Spłata-Plus Windykacja Sp. z o.o.",
            period: "02.2018 – 05.2020",
            bullets: [
              "У середньому 80 розмов на день зі споживчими боржниками.",
              "Укладання угод про розстрочку і виконання місячної цілі повернення в середньому на 105%.",
              "Оновлення даних боржників і фіксація домовленостей у системі."
            ]
          }
        ],
        education: {
          school: "Akademia im. Jakuba z Paradyża w Gorzowie Wielkopolskim",
          degree: "Економіка (бакалавр)",
          period: "2013 – 2016"
        }
      },
      faq: [
        {
          q: "Чи потрібна ліцензія для роботи у стягненні боргів?",
          a: "Для роботи на посаді фахівця зі стягнення окрема державна ліцензія не потрібна. Натомість роботодавці цінують знання основ цивільного права і процедур, а також тренінги з переговорів. Якщо маєте такі курси, впишіть їх у резюме з назвою і роком."
        },
        {
          q: "Як описати в резюме роботу в колекторському колл-центрі?",
          a: "Вкажіть кількість розмов на день, тип портфеля і результат щодо цілі. Додайте, чи вели ви переговори самостійно і які угоди могли укладати. Це добра основа для переходу на посаду фахівця у стягненні B2B або судовому стягненні."
        }
      ]
    },
    "prawnik": {
      slugLang: "yuryst",
      name: "Юрист / Помічник адвоката",
      title: "Резюме юриста: зразок і поради",
      metaDescription: "Резюме юриста або стажиста-апліканта під вакансію юридичної фірми. Зразок, ключові слова з оголошень і поради, як описати аплікацію, спеціалізацію, процесуальні документи та англійську.",
      intro: "Юридичні фірми та юридичні відділи в оголошеннях насамперед зазначають, кого шукають: апліканта (стажиста) адвокатської чи радцівської аплікації або людину, вже внесену до списку адвокатів чи юрисконсультів. Вимоги зазвичай охоплюють юридичну освіту, досвід у певній галузі, наприклад у господарському праві, трудовому праві чи цивільному процесі, вміння складати процесуальні документи та дуже добру англійську. Фірми, що обслуговують іноземних клієнтів, часто очікують знання юридичної англійської. У резюме важить конкретика: види справ, договорів і проваджень, а не загальний «інтерес до права».",
      keywords: [
        "радцівська або адвокатська аплікація",
        "складання процесуальних документів",
        "підготовка та експертиза договорів",
        "господарське і комерційне право",
        "цивільний процес",
        "трудове право",
        "представництво клієнтів у судах",
        "пошук у правових інформаційних системах",
        "юридична англійська",
        "захист персональних даних (GDPR)"
      ],
      tips: [
        "Чітко напишіть, на якому ви етапі: рік аплікації і палата, а після професійного іспиту – внесення до списку юрисконсультів (radca prawny) чи адвокатів. З цього фірма починає оцінку кандидатури.",
        "Перелічіть види справ і документів, з якими працюєте: позови, апеляції, дистриб'юторські договори, due diligence компаній, трудові спори. Спеціалізація для фірми важливіша за загальний перелік галузей права.",
        "Покажіть самостійність: на скількох засіданнях ви виступали як заступник, чи готуєте проєкти документів на затвердження, чи маєте прямий контакт із клієнтом. Такі дані вирізняють вас серед аплікантів того самого року.",
        "Вкажіть рівень англійської та, якщо маєте, сертифікат з юридичної англійської, наприклад TOLES. Додайте публікації, конкурси ораторського мистецтва та наукові гуртки, якщо вони пов'язані зі спеціалізацією."
      ],
      sample: {
        name: "Piotr Malinowski",
        headline: "Аплікант радцівської аплікації – господарське право і судові спори",
        contact: ["+48 600 000 129", "piotr.malinowski@example.com", "Toruń", "linkedin.com/in/piotr-malinowski-przyklad"],
        summary: "Аплікант третього року радцівської аплікації, з 2018 року працюю в юридичних фірмах, що обслуговують підприємців. Готую проєкти процесуальних документів і договорів, проводжу правовий пошук і виступаю на засіданнях як заступник юрисконсульта. Спеціалізуюся на господарських спорах і договірному праві.",
        skills: [
          "Процесуальні документи в господарських справах",
          "Складання та експертиза комерційних договорів",
          "Виступи на засіданнях як заступник юрисконсульта",
          "Пошук у правових інформаційних системах",
          "Due diligence товариств з обмеженою відповідальністю",
          "Трудове право в обслуговуванні бізнесу",
          "Юридична англійська"
        ],
        languages: ["англійська C1", "німецька A2"],
        jobs: [
          {
            title: "Аплікант радцівської аплікації (раніше юридичний асистент)",
            company: "Kancelaria Prawna Nowicki i Wspólnicy sp.k.",
            period: "06.2020 – дотепер",
            bullets: [
              "Підготовка проєктів позовів, відзивів на позов і апеляцій у господарських спорах.",
              "Участь у близько 10 засіданнях на місяць як заступник юрисконсульта.",
              "Участь у 6 перевірках due diligence компаній перед угодами з придбання."
            ]
          },
          {
            title: "Юридичний асистент",
            company: "Kancelaria Adwokacka Kowal i Partnerzy",
            period: "10.2018 – 05.2020",
            bullets: [
              "Пошук судової практики і літератури для цивільних і сімейних справ.",
              "Підготовка проєктів простих документів і листування з клієнтами.",
              "Ведення календаря процесуальних строків для 3 адвокатів."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Mikołaja Kopernika w Toruniu",
          degree: "Право (єдина магістерська програма)",
          period: "2015 – 2020"
        }
      },
      faq: [
        {
          q: "Чи варто апліканту вписувати в резюме результат вступного іспиту на аплікацію?",
          a: "Це не обов'язково, але високий результат може бути перевагою на початку аплікації, коли практики ще мало. Важливіші рік аплікації, палата і досвід у фірмі. Через кілька років результат вступного іспиту втрачає значення."
        },
        {
          q: "Як описувати справи, якщо мене зобов'язує професійна таємниця?",
          a: "Не вказуйте назв клієнтів і деталей справ. Описуйте тип справи, галузь, приблизну ціну позову і свою роль, наприклад «спори з договорів будівельного підряду вартістю до кількох мільйонів злотих». Фірма оцінить, що ви від початку дотримуєтеся конфіденційності."
        },
        {
          q: "Чи писати резюме англійською для міжнародної юридичної фірми?",
          a: "Якщо оголошення англійською або фірма працює переважно для іноземних клієнтів, підготуйте резюме англійською або у двох версіях. Подбайте про правильний переклад назв аплікації та звань, наприклад «trainee attorney-at-law (aplikant radcowski)»."
        }
      ]
    },
    "specjalista-bhp": {
      slugLang: "fakhivets-z-okhorony-pratsi",
      name: "Фахівець з охорони праці",
      title: "Резюме фахівця з охорони праці: зразок і поради",
      metaDescription: "Резюме фахівця з охорони праці (BHP) під вакансію. Зразок, ключові слова та поради, як описати кваліфікацію, оцінку професійного ризику, інструктажі та нещасні випадки.",
      intro: "Вимоги до служби охорони праці (BHP) у Польщі визначені законодавством, тому роботодавці часто дуже точно вказують їх в оголошеннях: вища освіта за напрямом охорони праці або післядипломне навчання в цій сфері та стаж у службі BHP, відповідний посаді. На посаду інспектора часто достатньо диплома техніка з охорони праці. Серед обов'язків повторюються перевірки умов праці, оцінка професійного ризику, вступні та періодичні навчання і розслідування нещасних випадків. На промислових підприємствах додається знання стандарту ISO 45001 та участь в аудитах.",
      keywords: [
        "вища освіта у сфері охорони праці",
        "оцінка професійного ризику",
        "вступні та періодичні навчання з охорони праці",
        "розслідування нещасних випадків",
        "перевірки умов праці",
        "інструкції для робочих місць",
        "ISO 45001",
        "пожежна безпека",
        "співпраця з PIP і санепідемстанцією",
        "звітування показників безпеки"
      ],
      tips: [
        "Опишіть кваліфікацію так, як її визначають правила: напрям навчання або післядипломні студії з охорони праці та роки стажу в службі BHP. Від цього залежить, чи вас можуть найняти інспектором, фахівцем чи старшим фахівцем.",
        "Напишіть, у яких галузях і з якими небезпеками ви працювали: шум, робота на висоті, машини, хімічні речовини, склад із навантажувачами. Виробниче підприємство шукає людину, яка знає його реальні ризики.",
        "Покажіть результати: менше нещасних випадків, кількість навчених людей, оновлені оцінки ризику, закриті невідповідності після аудиту. Сам перелік обов'язків не вирізнить вас серед кандидатів.",
        "Перелічіть додаткові повноваження та курси: інспектор пожежної безпеки, методика навчання, внутрішній аудитор ISO 45001, інструктор з першої допомоги. У багатьох компаніях фахівець BHP виконує і ці функції."
      ],
      sample: {
        name: "Sebastian Wawrzyniak",
        headline: "Фахівець з охорони праці – виробниче підприємство",
        contact: ["+48 600 000 130", "sebastian.wawrzyniak@example.com", "Płock", "linkedin.com/in/sebastian-wawrzyniak-przyklad"],
        summary: "Фахівець з охорони праці з восьмирічним стажем у службі BHP на виробничих і логістичних підприємствах. Проводжу оцінку професійного ризику, навчання, перевірки робочих місць і розслідування нещасних випадків. Внутрішній аудитор ISO 45001 та інспектор пожежної безпеки.",
        skills: [
          "Оцінка професійного ризику",
          "Вступні та періодичні навчання з охорони праці",
          "Розслідування нещасних випадків і документація",
          "Внутрішній аудит ISO 45001",
          "Інспектор пожежної безпеки",
          "Оцінка машин на відповідність мінімальним вимогам безпеки",
          "Посвідчення водія кат. B"
        ],
        languages: ["англійська B1"],
        jobs: [
          {
            title: "Фахівець з охорони праці",
            company: "Zakłady Tworzyw Mazowsze Sp. z o.o.",
            period: "06.2020 – дотепер",
            bullets: [
              "Нагляд за безпекою праці на підприємстві з близько 450 працівниками у три зміни.",
              "Оновлення 60 оцінок професійного ризику та інструкцій для робочих місць після модернізації виробничих ліній.",
              "Зниження кількості нещасних випадків з 9 до 3 на рік завдяки програмі спостереження за поведінкою."
            ]
          },
          {
            title: "Інспектор з охорони праці",
            company: "Wisła-Log Centrum Logistyczne Sp. z o.o.",
            period: "04.2018 – 05.2020",
            bullets: [
              "Проведення вступного інструктажу для близько 300 нових працівників на рік.",
              "Перевірки технічного стану стелажів і правил руху навантажувачів.",
              "Участь у комісії з розслідування нещасних випадків і підготовка документації."
            ]
          }
        ],
        education: {
          school: "Politechnika Łódzka",
          degree: "Інженерія безпеки (інженер)",
          period: "2013 – 2017"
        }
      },
      faq: [
        {
          q: "Чи можу я одразу після післядипломних студій з охорони праці стати фахівцем?",
          a: "Післядипломні студії з охорони праці – один зі шляхів до кваліфікації, але для посади фахівця правила вимагають ще й стажу в службі BHP. Якщо його немає, шукайте вакансії інспектора або компанію, де здобудете потрібний стаж. У резюме вкажіть дату закінчення навчання і кожен період роботи в службі BHP."
        },
        {
          q: "Як вписати в резюме роботу в зовнішній фірмі з охорони праці?",
          a: "Опишіть її як звичайну роботу і назвіть галузі та розмір підприємств, які обслуговували, без назв клієнтів, якщо немає їхньої згоди. Вкажіть, скільки підприємств ви вели і які завдання виконували. Для роботодавця це доказ, що ви знаєте багато різних робочих середовищ."
        }
      ]
    }
  },

  de: {
    "weterynarz": {
      slugLang: "tierarzt",
      name: "Tierarzt / Tierärztin",
      title: "Lebenslauf Tierarzt: Muster und Tipps",
      metaDescription: "Lebenslauf als Tierarzt passend zur Stellenanzeige: Muster, Schlüsselwörter aus Angeboten von Tierkliniken und Tipps zu Approbation, Fachtierarztweiterbildung und Eingriffen.",
      intro: "Tierarztpraxen und Tierkliniken nennen in Stellenanzeigen meist zuerst die Berufserlaubnis als Tierarzt und ob Hunde und Katzen, Nutztiere oder Exoten behandelt werden. Danach folgen konkrete Fähigkeiten: bildgebende Diagnostik, chirurgische Eingriffe, Anästhesie und die Bereitschaft zu Notdiensten. In der Fahrpraxis zählen außerdem der Führerschein Klasse B und Erfahrung auf landwirtschaftlichen Betrieben. Ein gut geschriebener Lebenslauf zeigt, was Sie selbstständig machen und was noch unter Aufsicht.",
      keywords: [
        "Berufserlaubnis als Tierarzt",
        "Kleintiermedizin",
        "Ultraschall- und Röntgendiagnostik",
        "Weichteilchirurgie",
        "Inhalationsnarkose",
        "Innere Medizin bei Hund und Katze",
        "Nacht- und Wochenenddienste",
        "Arbeit mit Nutztieren",
        "Führen der Behandlungsdokumentation",
        "Führerschein Klasse B"
      ],
      tips: [
        "Nennen Sie ganz oben Ihre Berufserlaubnis und die Kammer, bei der Sie registriert sind, sowie eine begonnene oder abgeschlossene Fachtierarztweiterbildung. Danach sucht die Praxisleitung zuerst.",
        "Listen Sie die Eingriffe auf, die Sie selbstständig durchführen, etwa Kastrationen, Zahnextraktionen oder Wundversorgung, und trennen Sie sie von denen, bei denen Sie assistieren. Eine ehrliche Trennung schafft Vertrauen.",
        "Nennen Sie Geräte und Untersuchungen: Abdomen-Ultraschall, Röntgen, Blutanalysegeräte, Endoskopie. Wenn Sie Röntgenbilder selbst befunden, schreiben Sie das ausdrücklich.",
        "Zeigen Sie den Umfang Ihrer Arbeit in Zahlen: Patienten pro Tag, Notdienste pro Monat, betreute Betriebe. Für eine 24-Stunden-Klinik ist das wichtiger als eine Liste von Kursen."
      ],
      sample: {
        name: "Karolina Pawlak",
        headline: "Tierärztin – Kleintiere, Weichteilchirurgie",
        contact: ["+48 600 000 121", "karolina.pawlak@example.com", "Zamość", "linkedin.com/in/karolina-pawlak-przyklad"],
        summary: "Tierärztin mit acht Jahren Erfahrung in der Behandlung von Hunden und Katzen. Ich führe internistische Sprechstunden selbstständig durch, mache Ultraschalluntersuchungen und Weichteiloperationen. Derzeit absolviere ich die Fachtierarztweiterbildung für Kleintiere und übernehme regelmäßig Dienste in einer 24-Stunden-Klinik.",
        skills: [
          "Berufserlaubnis als Tierärztin",
          "Abdomen-Ultraschall",
          "Anfertigen und Befunden von Röntgenbildern",
          "Kastrationen und Weichteilchirurgie",
          "Inhalationsnarkose und Patientenüberwachung",
          "Zahnheilkunde: Zahnsteinentfernung und Extraktionen",
          "Kommunikation mit Tierhaltern"
        ],
        languages: ["Englisch B2"],
        jobs: [
          {
            title: "Tierärztin",
            company: "Całodobowa Lecznica dla Zwierząt Animed Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Behandlung von durchschnittlich 18–22 Patienten pro Tag in der internistischen Sprechstunde.",
              "Selbstständige Durchführung von etwa 40 Operationen pro Monat, vor allem Kastrationen und Entfernung von Hauttumoren.",
              "4–5 Nachtdienste pro Monat einschließlich Notfallversorgung."
            ]
          },
          {
            title: "Assistenztierärztin",
            company: "Gabinet Weterynaryjny Pod Lipami s.c.",
            period: "10.2018 – 05.2020",
            bullets: [
              "Vorsorgetermine: Impfungen, Entwurmung, Chippen.",
              "Assistenz bei Operationen und Vorbereitung der Patienten auf die Narkose.",
              "Probenentnahme und Auswertung von Blutbild und Blutchemie."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Przyrodniczy w Lublinie",
          degree: "Tiermedizin (einheitlicher Masterstudiengang)",
          period: "2012 – 2018"
        }
      },
      faq: [
        {
          q: "Gehört die Nummer der Berufserlaubnis in den Lebenslauf?",
          a: "Es reicht anzugeben, dass Sie die Berufserlaubnis besitzen und bei welcher regionalen Tierärztekammer Sie registriert sind. Der Arbeitgeber prüft das Dokument bei der Einstellung ohnehin. Die Nummer anzugeben ist kein Fehler, aber nicht nötig."
        },
        {
          q: "Wie beschreibe ich eine Weiterbildung, die ich noch nicht abgeschlossen habe?",
          a: "Schreiben Sie „Fachtierarztweiterbildung laufend“ mit dem Fachgebiet und dem voraussichtlichen Prüfungsjahr. Praxen schätzen Tierärzte, die sich weiterentwickeln, daher ist das schon vor dem Abschluss ein Pluspunkt."
        },
        {
          q: "Kann ich mich nach einigen Jahren Kleintierpraxis bei einer Rinderpraxis bewerben?",
          a: "Ja, aber zeigen Sie deutlich alles, was mit Großtieren zu tun hat: Praktika auf Höfen, Geburtshilfe, Fruchtbarkeitsuntersuchungen. Schreiben Sie im Profil direkt, dass Sie sich in diese Richtung entwickeln möchten, und heben Sie Ihren Führerschein hervor."
        }
      ]
    },
    "terapeuta-zajeciowy": {
      slugLang: "ergotherapeut",
      name: "Ergotherapeut / Ergotherapeutin",
      title: "Lebenslauf Ergotherapeut: Muster und Tipps",
      metaDescription: "Lebenslauf als Ergotherapeut passend zu Stellen in Pflegeheimen, Tagesstätten und Werkstätten. Muster, Schlüsselwörter und Tipps zu Werkstätten, Methoden und Therapieplänen.",
      intro: "In Polen stellen vor allem Sozialpflegeheime (DPS), Selbsthilfe-Tagesstätten (ŚDS), Werkstätten für Beschäftigungstherapie (WTZ), Langzeitpflegeeinrichtungen und Reha-Stationen Ergotherapeuten ein. In den Anzeigen fragen Arbeitgeber nach einer einschlägigen Ausbildung, also einer postsekundären Schule oder einem Studium der Beschäftigungstherapie, und nach Erfahrung mit einer bestimmten Gruppe: älteren Menschen, Menschen mit geistiger Behinderung oder nach einem Schlaganfall. Auch die Dokumentation, darunter individuelle Therapiepläne, spielt eine Rolle. Im Lebenslauf sollten Sie Werkstätten und Methoden zeigen, die Sie aus der Praxis kennen und nicht nur aus dem Unterricht.",
      keywords: [
        "einschlägige Ausbildung: Ergotherapie",
        "Leitung von Gruppen- und Einzelangeboten",
        "individueller Therapieplan",
        "Training sozialer Kompetenzen",
        "Training von Alltagsaktivitäten (ADL)",
        "Kunsttherapie",
        "Arbeit mit Menschen mit geistiger Behinderung",
        "Arbeit mit älteren Menschen",
        "Führen der Teilnehmerdokumentation",
        "Organisation von Ausflügen und Festen"
      ],
      tips: [
        "Schreiben Sie, mit welcher Gruppe Sie gearbeitet haben und wie viele Teilnehmende Sie betreut haben. Die Arbeit mit demenzkranken Senioren im Pflegeheim erfordert andere Fähigkeiten als eine Werkstatt für junge Erwachsene.",
        "Nennen Sie die Werkstätten, die Sie leiten: Kunst, Keramik, Kochen, Holz, Computer oder Garten. Einrichtungen suchen oft jemanden für eine bestimmte Werkstatt.",
        "Zeigen Sie, dass Sie mit Dokumentation umgehen können: Funktionsdiagnostik, individueller Therapieplan, Fortschrittsberichte, Berichte. In vielen Einrichtungen ist das Voraussetzung.",
        "Ergänzen Sie Kurse, die Sie in der Praxis nutzen, etwa die Bewegungspädagogik nach Veronica Sherborne, Musiktherapie oder Gedächtnistraining. Schreiben Sie kurz, wie Sie sie einsetzen."
      ],
      sample: {
        name: "Tomasz Wróblewski",
        headline: "Ergotherapeut – Arbeit mit Menschen mit geistiger Behinderung",
        contact: ["+48 600 000 122", "tomasz.wroblewski@example.com", "Elbląg", "linkedin.com/in/tomasz-wroblewski-przyklad"],
        summary: "Ergotherapeut mit acht Jahren Erfahrung in einer Werkstatt für Beschäftigungstherapie und einem Sozialpflegeheim. Ich leite eine Holz- und Keramikwerkstatt sowie Selbstständigkeitstrainings und erstelle individuelle Therapiepläne und Fortschrittsberichte. Ich arbeite eng mit Psychologin, Physiotherapeut und Angehörigen zusammen.",
        skills: [
          "Individuelle Therapiepläne und Fortschrittsberichte",
          "Training von Alltagsaktivitäten",
          "Training sozialer Kompetenzen",
          "Leitung einer Keramik- und Holzwerkstatt",
          "Kunst- und Musiktherapie in Gruppen",
          "Bewegungspädagogik nach Veronica Sherborne",
          "Zusammenarbeit mit Angehörigen und Therapieteam"
        ],
        languages: ["Englisch A2"],
        jobs: [
          {
            title: "Ergotherapeut – Werkstattleiter",
            company: "Warsztat Terapii Zajęciowej Stowarzyszenia Krok Dalej",
            period: "06.2020 – heute",
            bullets: [
              "Leitung einer Holz- und Keramikwerkstatt für eine Gruppe von 6 Teilnehmenden.",
              "Erstellung und Aktualisierung individueller Therapiepläne und halbjährlicher Fortschrittsberichte.",
              "Vorbereitung der Teilnehmenden und ihrer Arbeiten auf 3 städtische Basare pro Jahr."
            ]
          },
          {
            title: "Ergotherapeut",
            company: "Dom Pomocy Społecznej Przystań",
            period: "09.2017 – 05.2020",
            bullets: [
              "Gruppenangebote für ältere Bewohner, darunter Gedächtnistraining.",
              "Training von Alltagsaktivitäten mit Schlaganfallpatienten in Zusammenarbeit mit dem Physiotherapeuten.",
              "Organisation von Kulturausflügen und Feiern für rund 60 Bewohner."
            ]
          }
        ],
        education: {
          school: "Medyczna Szkoła Policealna w Elblągu",
          degree: "Ergotherapeut (terapeuta zajęciowy)",
          period: "2015 – 2017"
        }
      },
      faq: [
        {
          q: "Kann ich nach einem kurzen Kurs als Ergotherapeut arbeiten?",
          a: "Anzeigen von Pflegeheimen, Tagesstätten und Werkstätten verlangen meist eine einschlägige Ausbildung, also eine abgeschlossene postsekundäre Schule oder ein Studium der Beschäftigungstherapie. Ein kurzer Kurs kann ein Plus sein, ersetzt diese aber selten. Tragen Sie ihn unter Weiterbildung ein, nicht unter Ausbildung, damit Sie den Recruiter nicht in die Irre führen."
        },
        {
          q: "Wie beschreibe ich die Arbeit mit Teilnehmenden, ohne ihre Privatsphäre zu verletzen?",
          a: "Bleiben Sie allgemein: Altersgruppe, Art der Behinderung, Anzahl der Personen und Ergebnisse. Nennen Sie keine Namen, keine Diagnosen einzelner Personen und keine Fotos aus den Angeboten. Schon diese Haltung zeigt, dass Sie die Regeln der Vertraulichkeit verstehen."
        }
      ]
    },
    "pracownik-biurowy": {
      slugLang: "bueroangestellter",
      name: "Büroangestellter / Büroangestellte",
      title: "Lebenslauf Büroangestellter: Muster und Tipps",
      metaDescription: "Lebenslauf als Büroangestellter passend zur Stellenanzeige. Muster, Schlüsselwörter aus Angeboten und Tipps, wie Sie Dokumentenlauf, Excel und Korrespondenz beschreiben.",
      intro: "Stellenanzeigen für Büroangestellte sind sehr unterschiedlich: vom Sekretariat in einer kleinen Firma bis zur Datenerfassung im Vertrieb oder in der Logistik. Fast immer wiederholen sich aber dieselben Anforderungen: gute Kenntnisse in MS Office, vor allem Excel, Genauigkeit, Bearbeitung der Korrespondenz und Dokumentenlauf. Manche Arbeitgeber verlangen zusätzlich Erfahrung mit einem Fakturierungsprogramm oder einem ERP-System. Im Lebenslauf kommt es deshalb vor allem auf konkrete Aufgaben und Werkzeuge an, nicht auf allgemeine Charaktereigenschaften.",
      keywords: [
        "MS Office",
        "Excel: Pivot-Tabellen und SVERWEIS",
        "Dokumentenlauf",
        "Bearbeitung ein- und ausgehender Korrespondenz",
        "Datenerfassung im System",
        "Rechnungsstellung",
        "Archivierung von Dokumenten",
        "Kundenbetreuung per Telefon und E-Mail",
        "Erstellen von Übersichten und Berichten",
        "Genauigkeit und gute Arbeitsorganisation"
      ],
      tips: [
        "Statt „sehr gute MS-Office-Kenntnisse“ schreiben Sie, was Sie in Excel tun: Pivot-Tabellen, SVERWEIS, Filter, einfache Diagramme. Im Gespräch kann eine kurze Praxisaufgabe kommen, also bleiben Sie ehrlich.",
        "Nennen Sie Programme, mit denen Sie gearbeitet haben, etwa Fakturierungssoftware, ERP oder CRM. Selbst wenn die Firma ein anderes System nutzt, verkürzt Erfahrung mit einem ähnlichen Werkzeug die Einarbeitung.",
        "Beschreiben Sie den Umfang Ihrer Aufgaben: wie viele Dokumente pro Tag, wie viele Rechnungen pro Monat, wie viele Geschäftspartner. Zahlen heben Sie von Bewerbern mit allgemein gehaltenem Lebenslauf ab.",
        "Wenn die Anzeige eine bestimmte Abteilung betrifft, zum Beispiel Logistik oder Personal, betonen Sie Aufgaben aus diesem Bereich. Ein Büroangestellter in einer Spedition macht etwas ganz anderes als in einem Steuerbüro."
      ],
      sample: {
        name: "Natalia Zając",
        headline: "Büroangestellte – Dokumente und Kundenbetreuung",
        contact: ["+48 600 000 123", "natalia.zajac@example.com", "Opole", "linkedin.com/in/natalia-zajac-przyklad"],
        summary: "Seit acht Jahren arbeite ich in der Büroverwaltung von Handels- und Dienstleistungsunternehmen. Ich steuere den Dokumentenlauf, stelle Rechnungen aus, erstelle Übersichten in Excel und bearbeite die Kundenkorrespondenz. Ich mag Ordnung in den Unterlagen und lerne neue Systeme schnell.",
        skills: [
          "Excel: Pivot-Tabellen, SVERWEIS, bedingte Formatierung",
          "Word und Outlook",
          "Rechnungen und Rechnungskorrekturen",
          "ERP-System (Vertriebsmodul)",
          "Dokumentenlauf und Archivierung",
          "Kundenbetreuung per Telefon und E-Mail",
          "Führerschein Klasse B"
        ],
        languages: ["Englisch B1"],
        jobs: [
          {
            title: "Büroangestellte",
            company: "Hurtownia Materiałów Budowlanych Opal-Bud Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Ausstellen von rund 350 Rechnungen pro Monat und Erstellen von Korrekturen.",
              "Führen des Vertragsregisters und Archivierung der Vertriebsunterlagen.",
              "Wöchentliche Verkaufsübersichten in Excel für die Niederlassungsleitung."
            ]
          },
          {
            title: "Büroassistentin",
            company: "Biuro Rachunkowe Bilans-Plus s.c.",
            period: "03.2018 – 05.2020",
            bullets: [
              "Annahme und Erfassung von Belegen von rund 40 Mandanten.",
              "Betreuung der Telefonzentrale und des E-Mail-Postfachs.",
              "Datenerfassung im Buchhaltungsprogramm unter Aufsicht einer Buchhalterin."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Opolski",
          degree: "Verwaltung (Bachelor)",
          period: "2014 – 2017"
        }
      },
      faq: [
        {
          q: "Kann ich ohne Erfahrung einen guten Lebenslauf als Büroangestellter schreiben?",
          a: "Ja. Beschreiben Sie Praktika, Studentenvertretung oder Ehrenamt, wenn dabei Dokumente, Excel oder Kontakt mit Menschen eine Rolle spielten. Ergänzen Sie Kurse, etwa in Excel, und schreiben Sie konkret, was Sie gelernt haben. Für Bürostellen suchen Arbeitgeber oft genaue und lernbereite Menschen, nicht nur Bewerber mit langer Erfahrung."
        },
        {
          q: "Wie beschreibe ich Excel-Kenntnisse, ohne zu übertreiben?",
          a: "Nennen Sie konkrete Funktionen und Aufgaben, die Sie ohne Hilfe erledigen, statt eines allgemeinen Niveaus. Wenn Sie Makros oder Power Query nur aus einem Kurs kennen, schreiben Sie „Grundkenntnisse“. Recruiter prüfen Excel immer öfter mit einem kurzen Test."
        }
      ]
    },
    "office-manager": {
      slugLang: "bueroleiter",
      name: "Office Manager / Büroleiterin",
      title: "Lebenslauf Office Manager: Muster und Tipps",
      metaDescription: "Lebenslauf als Office Manager passend zur Stellenanzeige: Muster, Schlüsselwörter aus Angeboten und Tipps zu Bürobudget, Zusammenarbeit mit Lieferanten und Firmenevents.",
      intro: "Ein Office Manager sorgt dafür, dass das Büro einfach funktioniert: von Bestellungen und Lieferantenverträgen über Empfang und Dienstreisen bis zur Organisation von Meetings und Firmenevents. In den Anzeigen verbinden Arbeitgeber das oft mit Aufgaben der Personalverwaltung, Unterstützung der Geschäftsführung und Kontrolle der Bürokosten. Sehr häufig werden Englischkenntnisse auf kommunikativem Niveau oder höher verlangt, weil viele dieser Angebote von internationalen Unternehmen stammen. Ein guter Lebenslauf zeigt Verantwortungsbereich und Einsparungen, nicht nur eine Liste von Tätigkeiten.",
      keywords: [
        "Büromanagement",
        "Zusammenarbeit mit Lieferanten und Vertragsverhandlungen",
        "Kontrolle des Bürobudgets",
        "Organisation von Firmenevents",
        "Organisation von Dienstreisen",
        "Unterstützung der Geschäftsführung",
        "Empfang",
        "Einarbeitung neuer Mitarbeiter (Onboarding)",
        "Bestellung von Büromaterial",
        "kommunikative Englischkenntnisse"
      ],
      tips: [
        "Nennen Sie die Größe des Büros und Teams, das Sie betreuen, etwa „Büro für 80 Personen, zwei Etagen, Empfang und Konferenzraum“. Das zeigt sofort das Niveau der Stelle.",
        "Zeigen Sie Zahlen: welches Budget Sie verwalten und was Sie eingespart haben, zum Beispiel nach dem Wechsel der Reinigungsfirma oder der Neuverhandlung des Catering-Vertrags. Ein Office Manager mit finanziellen Ergebnissen hebt sich von anderen ab.",
        "Beschreiben Sie Events, die Sie organisiert haben: Teilnehmerzahl, Budget, Ort. Ein Teamausflug für 120 Personen ist echte Projekterfahrung.",
        "Wenn Sie einen Büroumzug, ein Raumbuchungssystem oder einen Onboarding-Prozess umgesetzt haben, führen Sie das separat auf. Solche Projekte belegen Ihre Selbstständigkeit."
      ],
      sample: {
        name: "Agnieszka Kubiak",
        headline: "Office Managerin – Büro eines IT-Unternehmens mit 90 Personen",
        contact: ["+48 600 000 124", "agnieszka.kubiak@example.com", "Wrocław", "linkedin.com/in/agnieszka-kubiak-przyklad"],
        summary: "Seit neun Jahren arbeite ich in der Büroverwaltung, davon sechs Jahre als Office Managerin in einem Technologieunternehmen. Ich verantworte das Verwaltungsbudget, Lieferantenverträge, den Empfang und die Organisation von Events. Ich habe einen Büroumzug geleitet und einen Onboarding-Prozess eingeführt, den die gesamte Personalabteilung nutzt.",
        skills: [
          "Verwaltung des Bürobudgets",
          "Verhandlungen mit Dienstleistern",
          "Organisation von Firmenevents und Ausflügen",
          "Buchung von Dienstreisen",
          "Onboarding neuer Mitarbeiter",
          "MS Office und Google Workspace",
          "Englisch im Arbeitsalltag"
        ],
        languages: ["Englisch C1", "Deutsch A2"],
        jobs: [
          {
            title: "Office Managerin",
            company: "Codera Solutions Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Leitung eines Büros für 90 Personen mit einem jährlichen Verwaltungsbudget von rund 600.000 PLN.",
              "Neuverhandlung der Reinigungs- und Catering-Verträge, wodurch diese Kosten jährlich um 14 % sanken.",
              "Organisation von 2 Teamausflügen pro Jahr für über 100 Teilnehmende."
            ]
          },
          {
            title: "Assistentin der Geschäftsführung",
            company: "Fiskus-Pro Doradztwo Podatkowe Sp. z o.o.",
            period: "02.2017 – 05.2020",
            bullets: [
              "Kalenderführung für zwei Vorstandsmitglieder und Organisation von Kundenterminen.",
              "Empfang, Post und Buchung der Konferenzräume.",
              "Bestellung von Büromaterial und Prüfung von Lieferantenrechnungen."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny we Wrocławiu",
          degree: "Management (Master)",
          period: "2012 – 2017"
        }
      },
      faq: [
        {
          q: "Worin unterscheidet sich der Lebenslauf eines Office Managers von dem einer Assistentin?",
          a: "Im Lebenslauf eines Office Managers muss Verantwortung sichtbar sein: Budget, Entscheidungen über Lieferanten, Projekte und Menschen, für die Sie zuständig sind. Eine Assistentin beschreibt vor allem die Unterstützung einer bestimmten Person. Wenn Sie aus der Assistenz in das Office Management wechseln, stellen Sie Aufgaben in den Vordergrund, bei denen Sie selbst entschieden haben."
        },
        {
          q: "Sollte ich den Lebenslauf auf Englisch schreiben, wenn die Anzeige auf Englisch ist?",
          a: "Meist ja. Eine englische Anzeige signalisiert, dass die Sprache im Büro täglich genutzt wird und der Recruiter womöglich kein Polnisch spricht. Ist die Anzeige auf Polnisch, verlangt aber Englisch, genügt ein polnischer Lebenslauf mit klar angegebenem Sprachniveau."
        }
      ]
    },
    "analityk-finansowy": {
      slugLang: "finanzanalyst",
      name: "Finanzanalyst / Finanzanalystin",
      title: "Lebenslauf Finanzanalyst: Muster und Tipps",
      metaDescription: "Lebenslauf als Finanzanalyst passend zur Stellenanzeige. Muster, Schlüsselwörter aus Angeboten und Tipps zu Finanzmodellen, Excel, SQL, Power BI und dem CFA.",
      intro: "Ein Finanzanalyst erstellt Budgets, Prognosen und Analysen, auf deren Grundlage die Geschäftsführung entscheidet. In Anzeigen von Industrieunternehmen, Shared-Service-Centern und Banken wiederholen sich dieselben Anforderungen: fortgeschrittenes Excel, Finanzmodellierung, Ergebnisreporting und gutes Englisch. Immer häufiger kommen SQL und BI-Werkzeuge wie Power BI hinzu. CFA oder ACCA sind meist keine Pflicht, steigern aber deutlich den Wert eines Bewerbers.",
      keywords: [
        "Finanzanalyse",
        "Budgetierung und Forecasting",
        "Finanzmodellierung",
        "fortgeschrittene Excel-Kenntnisse",
        "Management-Reporting",
        "Abweichungsanalyse",
        "Power BI",
        "SQL",
        "SAP-Kenntnisse",
        "fließendes Englisch"
      ],
      tips: [
        "Beschreiben Sie die Analysen, die Sie erstellen, und wofür sie dienen: Cashflow-Prognose, Produktrentabilität, Investitionsrechnung. Die Stellenbezeichnung allein sagt dem Recruiter nicht, was Sie tatsächlich gemacht haben.",
        "Zeigen Sie die Wirkung Ihrer Arbeit: kürzeres Reporting, ein automatisierter Bericht, eine Entscheidung der Geschäftsführung auf Basis Ihrer Analyse. Zahlen und Prozente sind hier ganz natürlich.",
        "Nennen Sie Werkzeuge zusammen mit dem, was Sie damit tun: Excel (Modelle, Power Query), SQL (Abfragen, Joins), Power BI (Dashboards). Finanzanzeigen werden genau nach diesen Begriffen gefiltert.",
        "Wenn Sie CFA oder ACCA ablegen, nennen Sie bestandene Level oder Prüfungen und den geplanten Termin der nächsten. Das zeigt systematische Weiterentwicklung."
      ],
      sample: {
        name: "Michał Sobczak",
        headline: "Finanzanalyst – FP&A",
        contact: ["+48 600 000 125", "michal.sobczak@example.com", "Kraków", "linkedin.com/in/michal-sobczak-przyklad"],
        summary: "Finanzanalyst mit acht Jahren Erfahrung, davon sechs im FP&A-Team eines Industrieunternehmens. Ich erstelle Budgets, Quartalsprognosen und Rentabilitätsanalysen, baue Modelle in Excel und Dashboards in Power BI. Ich habe CFA Level II bestanden.",
        skills: [
          "Budgetierung und Forecasting",
          "Finanzmodellierung in Excel",
          "Power Query und Power BI",
          "SQL: Abfragen und Joins",
          "SAP FI/CO (Berichte)",
          "Rentabilitätsanalyse von Produkten und Kunden",
          "Präsentation von Ergebnissen vor dem Management"
        ],
        languages: ["Englisch C1"],
        jobs: [
          {
            title: "Finanzanalyst (FP&A)",
            company: "Kartonex Opakowania Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Erstellung des Jahresbudgets und der Quartalsprognosen für 3 Produktionswerke.",
              "Aufbau eines Power-BI-Dashboards, das das Monatsreporting von 4 auf 2 Tage verkürzte.",
              "Rentabilitätsanalyse von 200 Artikelnummern als Grundlage für Preislistenänderungen."
            ]
          },
          {
            title: "Junior-Finanzanalyst",
            company: "Finexa Centrum Usług Księgowych Sp. z o.o.",
            period: "07.2018 – 05.2020",
            bullets: [
              "Erstellung monatlicher Ergebnisberichte für Kunden aus Großbritannien und Deutschland.",
              "Analyse von Kostenabweichungen gegenüber dem Budget und Kommentare für den Controller.",
              "Abstimmung der Daten zwischen SAP und Excel-Berichten."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny w Krakowie",
          degree: "Finanzen und Rechnungswesen (Master)",
          period: "2013 – 2018"
        }
      },
      faq: [
        {
          q: "Habe ich ohne CFA Chancen als Finanzanalyst?",
          a: "Ja, die meisten Anzeigen sehen CFA oder ACCA als Plus, nicht als Voraussetzung. Wichtiger sind praktische Fähigkeiten: Excel, Verständnis von Jahresabschlüssen und die Fähigkeit, Zahlen Nicht-Finanzleuten zu erklären. Wenn Sie über ein Zertifikat nachdenken, schreiben Sie in den Lebenslauf, dass Sie sich auf die Prüfung vorbereiten."
        },
        {
          q: "Wie zeige ich Ergebnisse, wenn ich an Geschäftsgeheimnisse gebunden bin?",
          a: "Geben Sie Umfang und Wirkung ungefähr oder in Prozent an statt genauer Beträge und Kundennamen. Zum Beispiel: „Kostenbudget im Umfang mehrerer Dutzend Millionen Złoty“ oder „Reporting um die Hälfte verkürzt“. Das reicht, um Ihre Verantwortung zu zeigen."
        }
      ]
    },
    "kontroler-finansowy": {
      slugLang: "finanzcontroller",
      name: "Finanzcontroller / Finanzcontrollerin",
      title: "Lebenslauf Finanzcontroller: Muster und Tipps",
      metaDescription: "Lebenslauf als Finanzcontroller passend zur Stellenanzeige. Muster, Schlüsselwörter aus Angeboten und Tipps zu Controlling, Monatsabschluss, Budgets und ACCA oder CIMA.",
      intro: "Ein Finanzcontroller sorgt dafür, dass die Zahlen im Unternehmen verlässlich sind und die Geschäftsführung weiß, woher Abweichungen vom Plan kommen. In Anzeigen tauchen meist Kostenkontrolle, Monatsabschluss, Budgetierung, Reporting an die Zentrale und die Zusammenarbeit mit Buchhaltung und Wirtschaftsprüfern auf. Arbeitgeber fragen nach Kenntnissen des polnischen Rechnungslegungsgesetzes und, wenn das Unternehmen zu einer ausländischen Gruppe gehört, auch nach IFRS oder US GAAP. Für eigenverantwortliche Stellen werden oft mehrere Jahre Erfahrung im Controlling oder in der Prüfung sowie ACCA oder CIMA erwartet.",
      keywords: [
        "Finanzcontrolling",
        "Monats- und Jahresabschluss",
        "Budgetierung und Kostenkontrolle",
        "Plan-Ist-Abweichungsanalyse",
        "Konzernreporting",
        "IFRS-Kenntnisse",
        "polnisches Rechnungslegungsgesetz",
        "Zusammenarbeit mit dem Wirtschaftsprüfer",
        "Produktionskostencontrolling",
        "ACCA oder CIMA"
      ],
      tips: [
        "Schreiben Sie, in welchem Umfeld Sie arbeiten: polnisches Unternehmen oder Teil einer ausländischen Gruppe, welche Rechnungslegungsstandards, welches ERP-System. Controller mit Konzernreporting-Erfahrung sind gefragter als solche, die nur polnische Vorschriften kennen.",
        "Beschreiben Sie Ihren Anteil am Monatsabschluss: Termin, Ihre Bereiche, die Abstimmungen, die Sie erstellen. Eine Verkürzung von zehn auf fünf Arbeitstage ist ein starkes Argument.",
        "Zeigen Sie Ihren Einfluss auf die Kosten: eingeführte Kontrollen, aufgedeckte Unregelmäßigkeiten, Änderungen im Einkaufsprozess. Controller werden daran gemessen, ob ihre Analysen zu Entscheidungen führen.",
        "Wenn Sie aus der Wirtschaftsprüfung kommen, nennen Sie die Branchen und Unternehmenstypen, die Sie geprüft haben. Das zeigt, dass Sie verschiedene Geschäftsmodelle kennen und wissen, was der Abschlussprüfer erwartet."
      ],
      sample: {
        name: "Joanna Mazurek",
        headline: "Finanzcontrollerin – Konzernreporting und Kostencontrolling",
        contact: ["+48 600 000 126", "joanna.mazurek@example.com", "Bielsko-Biała", "linkedin.com/in/joanna-mazurek-przyklad"],
        summary: "Finanzcontrollerin mit elf Jahren Erfahrung, davon fast fünf in der Wirtschaftsprüfung. Ich verantworte den Monatsabschluss, das Konzernreporting nach IFRS und das Produktionskostencontrolling in einem Unternehmen mit deutschem Kapital. Ich habe die ACCA-Qualifikation.",
        skills: [
          "Monats- und Jahresabschluss",
          "Reporting nach IFRS und polnischem Rechnungslegungsgesetz",
          "Produktionskostencontrolling",
          "Budgetierung und Abweichungsanalyse",
          "SAP FI/CO",
          "Zusammenarbeit mit dem Abschlussprüfer",
          "Fortgeschrittenes Excel und Power Query"
        ],
        languages: ["Englisch C1", "Deutsch B1"],
        jobs: [
          {
            title: "Finanzcontrollerin",
            company: "Beskid Komponenty Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Koordination des Monatsabschlusses und Verkürzung von 8 auf 5 Arbeitstage.",
              "Erstellung der IFRS-Reporting-Packages für die deutsche Muttergesellschaft.",
              "Einführung einer monatlichen Materialverbrauchsanalyse, die Abweichungen von den Normen um 18 % senkte."
            ]
          },
          {
            title: "Senior-Prüfungsassistentin",
            company: "Rewident-Konsult Sp. z o.o.",
            period: "09.2015 – 05.2020",
            bullets: [
              "Prüfung von Jahresabschlüssen von Produktions- und Handelsunternehmen.",
              "Leitung eines Teams von 2–3 Assistenten bei Prüfungen vor Ort.",
              "Erstellung von Management Letters mit Empfehlungen zum internen Kontrollsystem."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Ekonomiczny w Katowicach",
          degree: "Finanzen und Rechnungswesen (Master)",
          period: "2010 – 2015"
        }
      },
      faq: [
        {
          q: "Braucht ein Finanzcontroller eine Buchhaltungsqualifikation?",
          a: "Gesetzlich ist das nicht vorgeschrieben, aber Arbeitgeber erwarten solide Kenntnisse der Rechnungslegung und oft Erfahrung in Buchhaltung oder Prüfung. ACCA, CIMA oder ein polnisches Buchhalterzertifikat sind gern gesehen. Nennen Sie sie im Lebenslauf mit dem Jahr des Erwerbs oder den bestandenen Prüfungen."
        },
        {
          q: "Wie beschreibe ich den Wechsel von der Prüfung ins Controlling?",
          a: "Zeigen Sie, dass Sie Prozesse von innen kennen: Nennen Sie die Bereiche, die Sie am häufigsten geprüft haben, etwa Vorräte, Umsatzerlöse oder Anlagevermögen. Ergänzen Sie Beratungsprojekte oder Unterstützung bei Abschlüssen von Mandanten. Schreiben Sie im Profil direkt, warum Sie auf die Unternehmensseite wechseln möchten."
        }
      ]
    },
    "agent-ubezpieczeniowy": {
      slugLang: "versicherungsvertreter",
      name: "Versicherungsvertreter / Versicherungsvertreterin",
      title: "Lebenslauf Versicherungsvertreter: Muster und Tipps",
      metaDescription: "Lebenslauf als Versicherungsvertreter passend zur Stellenanzeige. Muster, Schlüsselwörter aus Angeboten und Tipps zu Verkaufsergebnissen, Kundenbestand und KNF-Register.",
      intro: "Versicherungsvertreter werden sowohl von Versicherungsgesellschaften als auch von Mehrfachagenturen gesucht, und die meisten Angebote betreffen den Verkauf von Kfz-, Sach- und Lebensversicherungen. Bewerber ohne Erfahrung absolvieren meist eine Schulung und eine Prüfung und werden anschließend in das Vermittlerregister der polnischen Finanzaufsicht (KNF) eingetragen. Arbeitgeber fragen nach Vertriebserfahrung, eigenem Kundenstamm und der Bereitschaft, auf Provisionsbasis oder als Selbstständiger (B2B) zu arbeiten. Im Lebenslauf wirken konkrete Ergebnisse am besten: Anzahl der Policen, Beitragsvolumen und Kundenbindung.",
      keywords: [
        "Verkauf von Kfz-Versicherungen (OC und AC)",
        "Lebensversicherungen",
        "Sachversicherungen",
        "Eintrag im Register der Versicherungsvertreter",
        "Neukundengewinnung",
        "Betreuung des Kundenbestands",
        "Bedarfsanalyse",
        "Erreichen von Verkaufszielen",
        "Zusammenarbeit auf Basis eines Agenturvertrags",
        "Führerschein Klasse B"
      ],
      tips: [
        "Nennen Sie Ergebnisse: Anzahl verkaufter Policen, Jahresbeitragsvolumen, Platz im Ranking des Vertriebsnetzes. Vertreter werden an Zahlen gemessen und Recruiter erwarten sie im Lebenslauf.",
        "Schreiben Sie, ob Sie als Ausschließlichkeitsvertreter einer Gesellschaft oder in einer Mehrfachagentur gearbeitet haben und welche Produkte Sie verkaufen. Erfahrung mit Lebens- und Firmenversicherungen wird höher bewertet als reiner Kfz-Haftpflicht-Verkauf.",
        "Geben Sie an, dass Sie aktuell im Vermittlerregister eingetragen sind und die vorgeschriebenen jährlichen Weiterbildungen absolvieren. Wenn Sie noch nicht eingetragen sind, schreiben Sie, dass Sie bereit sind, Schulung und Prüfung zu absolvieren.",
        "Zeigen Sie, wie Sie Kunden betreuen: Verlängerungsquote, Empfehlungen, Hilfe bei Schadenfällen. Ein Vertreter, der seinen Bestand hält, ist für eine Agentur wertvoller als jemand, der nur neue Policen verkauft."
      ],
      sample: {
        name: "Robert Kaczmarczyk",
        headline: "Versicherungsvertreter – Kfz- und Lebensversicherungen",
        contact: ["+48 600 000 127", "robert.kaczmarczyk@example.com", "Siedlce", "linkedin.com/in/robert-kaczmarczyk-przyklad"],
        summary: "Seit acht Jahren verkaufe ich Kfz-, Sach- und Lebensversicherungen, zuerst als Ausschließlichkeitsvertreter, heute in einer Mehrfachagentur. Ich betreue einen Bestand von über 900 Privatkunden und Kleinunternehmen, von denen jedes Jahr über 80 % ihre Policen bei mir verlängern. Ich bin aktuell im Register der Versicherungsvertreter eingetragen.",
        skills: [
          "Verkauf von OC-, AC- und Unfallversicherungen",
          "Lebens- und Risikoversicherungen",
          "Wohngebäude- und Gewerbeversicherungen für Kleinbetriebe",
          "Bedarfsanalyse und Angebotsvergleich",
          "Tarifrechner mehrerer Versicherer",
          "Kundengewinnung über Empfehlungen",
          "Führerschein Klasse B"
        ],
        languages: ["Englisch A2"],
        jobs: [
          {
            title: "Versicherungsvertreter",
            company: "Multiagencja Ubezpieczeniowa Bezpieczny Dom s.c.",
            period: "06.2020 – heute",
            bullets: [
              "Verkauf von durchschnittlich 70 Policen pro Monat, vor allem Kfz- und Wohnungsversicherungen.",
              "Steigerung des Anteils der Lebensversicherungen in meinem Bestand von 5 % auf 22 % des Beitragsvolumens.",
              "Unterstützung der Kunden bei Schadenmeldungen und Kontakt mit den Schadenregulierern."
            ]
          },
          {
            title: "Ausschließlichkeitsvertreter",
            company: "Polisa-Serwis Agencja Ubezpieczeniowa Sp. z o.o.",
            period: "04.2018 – 05.2020",
            bullets: [
              "Gewinnung von Privatkunden für Lebensversicherungen.",
              "Erfüllung der Quartalsziele mit durchschnittlich 110 %.",
              "Kundentermine im Büro und vor Ort im gesamten Landkreis."
            ]
          }
        ],
        education: {
          school: "Uniwersytet w Siedlcach",
          degree: "Volkswirtschaft (Bachelor)",
          period: "2013 – 2016"
        }
      },
      faq: [
        {
          q: "Brauche ich Versicherungserfahrung, um Vertreter zu werden?",
          a: "Nein, viele Agenturen schulen Menschen mit Erfahrung in anderem Vertrieb oder im Kundenservice. Vor Arbeitsbeginn müssen Sie eine Schulung absolvieren, eine Prüfung bestehen und in das Vermittlerregister eingetragen werden. Zeigen Sie im Lebenslauf Ihre bisherigen Verkaufsergebnisse und wie leicht Sie Kontakte knüpfen."
        },
        {
          q: "Soll ich Verkaufsergebnisse angeben, wenn sie nicht die besten waren?",
          a: "Nennen Sie die Daten, die Ihre Arbeit gut zeigen, etwa Kundenbindung oder Wachstum bei einem bestimmten Produkt. Sie müssen nicht jeden Monat aufführen. Denken Sie daran, dass im Gespräch nach Details gefragt werden kann, die Zahlen müssen also stimmen."
        }
      ]
    },
    "specjalista-ds-windykacji": {
      slugLang: "inkasso-sachbearbeiter",
      name: "Inkasso-Sachbearbeiter / Inkasso-Sachbearbeiterin",
      title: "Lebenslauf Inkasso-Sachbearbeiter: Muster und Tipps",
      metaDescription: "Lebenslauf als Inkasso-Sachbearbeiter passend zur Stellenanzeige. Muster, Schlüsselwörter und Tipps zu außergerichtlichem und gerichtlichem Inkasso, Vergleichen und Realisierungsquote.",
      intro: "Inkasso-Sachbearbeiter arbeiten bei Inkassounternehmen, Banken, Leasinggesellschaften, Versorgern und in den Finanzabteilungen gewöhnlicher Unternehmen. Die Anzeigen unterscheiden zwischen außergerichtlichem Inkasso per Telefon und Brief, Außendienst-Inkasso sowie gerichtlichem Inkasso und Zwangsvollstreckung. Arbeitgeber fragen nach Belastbarkeit, Verhandlungsgeschick und Kenntnis der Verfahren: Zahlungsaufforderungen, Vergleiche, Mahnverfahren und Zusammenarbeit mit dem Gerichtsvollzieher. Im Lebenslauf zählen vor allem die Realisierungsquote und die Größe des betreuten Portfolios.",
      keywords: [
        "außergerichtliches Inkasso",
        "Telefoninkasso",
        "Verhandlung von Vergleichen und Ratenplänen",
        "Zahlungsaufforderungen",
        "Forderungsüberwachung",
        "gerichtliches Inkasso und Zwangsvollstreckung",
        "elektronisches Mahnverfahren (EPU)",
        "Zusammenarbeit mit Kanzleien und Gerichtsvollziehern",
        "Erreichen von Realisierungszielen",
        "Belastbarkeit"
      ],
      tips: [
        "Schreiben Sie, welche Art von Inkasso Sie betreiben: Verbraucher oder B2B, außergerichtlich oder gerichtlich. Das sind völlig verschiedene Stellen und der Recruiter muss sofort sehen, wozu Sie passen.",
        "Nennen Sie Umfang und Wirksamkeit: Anzahl der Fälle im Portfolio, Forderungsvolumen, Realisierungsquote oder Zielerreichung. Diese Zahlen sind die Grundlage für die Bewertung im Inkasso.",
        "Zählen Sie Verfahren auf, die Sie aus der Praxis kennen: Zahlungsaufforderungen, Vergleiche, Klagen im EPU, Vollstreckungsanträge, Einträge bei Wirtschaftsauskunfteien. Wer den ganzen Prozess kennt, arbeitet sich schneller ein.",
        "Zeigen Sie Ihre Gesprächskultur mit Schuldnern: keine Beschwerden, Verhandlungstrainings, Arbeit mit Kunden in schwierigen Lagen. Unternehmen achten auf ihren Ruf und wählen Menschen, die Geld zurückholen, ohne Konflikte eskalieren zu lassen."
      ],
      sample: {
        name: "Ewelina Górska",
        headline: "Inkasso-Sachbearbeiterin – B2B-Forderungen",
        contact: ["+48 600 000 128", "ewelina.gorska@example.com", "Gorzów Wielkopolski", "linkedin.com/in/ewelina-gorska-przyklad"],
        summary: "Seit acht Jahren arbeite ich im Forderungsmanagement, zunächst bei Verbraucherforderungen, heute bei Forderungen gegenüber Unternehmen. Ich bearbeite Fälle von der ersten Mahnung bis zur Klage, verhandle Vergleiche und Ratenpläne und arbeite mit der Kanzlei und Gerichtsvollziehern zusammen. Das Realisierungsziel der Abteilung übertreffe ich regelmäßig.",
        skills: [
          "Außergerichtliches B2B- und Verbraucherinkasso",
          "Verhandlung von Vergleichen und Ratenplänen",
          "Zahlungsaufforderungen und Zinsrechnungen",
          "Klagen im elektronischen Mahnverfahren",
          "Forderungsüberwachung im ERP-System",
          "Zusammenarbeit mit Kanzlei und Gerichtsvollziehern",
          "Excel: Altersstrukturberichte für Forderungen"
        ],
        languages: ["Englisch B1"],
        jobs: [
          {
            title: "Inkasso-Sachbearbeiterin",
            company: "Lubuskie Smaki Hurtownia Spożywcza Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Betreuung eines Portfolios von rund 450 Geschäftspartnern mit Forderungen von insgesamt etwa 6 Mio. PLN.",
              "Senkung des Anteils der über 60 Tage überfälligen Forderungen von 11 % auf 6 %.",
              "Vorbereitung der Unterlagen für rund 30 Klagen pro Jahr und Zusammenarbeit mit der Kanzlei."
            ]
          },
          {
            title: "Mitarbeiterin Telefoninkasso",
            company: "Spłata-Plus Windykacja Sp. z o.o.",
            period: "02.2018 – 05.2020",
            bullets: [
              "Durchschnittlich 80 Gespräche pro Tag mit Verbraucherschuldnern.",
              "Abschluss von Ratenvergleichen und Erfüllung des monatlichen Realisierungsziels mit durchschnittlich 105 %.",
              "Aktualisierung der Schuldnerdaten und Dokumentation der Vereinbarungen im System."
            ]
          }
        ],
        education: {
          school: "Akademia im. Jakuba z Paradyża w Gorzowie Wielkopolskim",
          degree: "Volkswirtschaft (Bachelor)",
          period: "2013 – 2016"
        }
      },
      faq: [
        {
          q: "Brauche ich für die Arbeit im Inkasso eine Lizenz?",
          a: "Für eine Stelle als Inkasso-Sachbearbeiter in Polen ist keine gesonderte staatliche Lizenz erforderlich. Arbeitgeber schätzen dagegen Grundkenntnisse im Zivilrecht und in den Verfahren sowie Verhandlungstrainings. Wenn Sie solche Kurse haben, tragen Sie sie mit Namen und Jahr in den Lebenslauf ein."
        },
        {
          q: "Wie beschreibe ich die Arbeit in einem Inkasso-Callcenter?",
          a: "Nennen Sie die Anzahl der Gespräche pro Tag, die Art des Portfolios und Ihr Ergebnis im Verhältnis zum Ziel. Ergänzen Sie, ob Sie selbstständig verhandelt haben und welche Vergleiche Sie schließen durften. Das ist eine gute Grundlage für den Wechsel in das B2B- oder gerichtliche Inkasso."
        }
      ]
    },
    "prawnik": {
      slugLang: "jurist",
      name: "Jurist / Rechtsreferendar",
      title: "Lebenslauf Jurist: Muster und Tipps",
      metaDescription: "Lebenslauf als Jurist oder Referendar passend zur Anzeige einer Kanzlei. Muster, Schlüsselwörter und Tipps zu Referendariat (aplikacja), Spezialisierung, Schriftsätzen und Englisch.",
      intro: "Kanzleien und Rechtsabteilungen geben in Anzeigen vor allem an, ob sie einen Referendar der Rechtsanwalts- oder Rechtsberaterausbildung (aplikacja adwokacka bzw. radcowska) suchen oder eine bereits zugelassene Person. Zu den Anforderungen gehören meist ein abgeschlossenes Jurastudium, Erfahrung in einem bestimmten Bereich wie Wirtschaftsrecht, Arbeitsrecht oder Zivilprozess, die Fähigkeit, Schriftsätze zu verfassen, und sehr gutes Englisch. Kanzleien mit ausländischen Mandanten erwarten oft juristisches Englisch. Im Lebenslauf zählt Konkretes: Arten von Fällen, Verträgen und Verfahren, nicht ein allgemeines „Interesse am Recht“.",
      keywords: [
        "Referendariat zum Rechtsberater oder Rechtsanwalt",
        "Verfassen von Schriftsätzen",
        "Erstellung und Prüfung von Verträgen",
        "Wirtschafts- und Handelsrecht",
        "Zivilprozess",
        "Arbeitsrecht",
        "Vertretung von Mandanten vor Gericht",
        "Recherche in juristischen Datenbanken",
        "juristisches Englisch",
        "Datenschutz (DSGVO)"
      ],
      tips: [
        "Schreiben Sie klar, wo Sie stehen: Jahr des Referendariats und Kammer, nach dem Berufsexamen die Eintragung in die Liste der Rechtsberater (radca prawny) oder Rechtsanwälte. Damit beginnt die Kanzlei die Bewertung.",
        "Nennen Sie die Arten von Fällen und Dokumenten, mit denen Sie arbeiten: Klagen, Berufungen, Vertriebsverträge, Due Diligence von Gesellschaften, Arbeitsrechtsfälle. Eine Spezialisierung ist für Kanzleien wichtiger als eine allgemeine Liste von Rechtsgebieten.",
        "Zeigen Sie Selbstständigkeit: wie viele Verhandlungen Sie in Vertretung wahrgenommen haben, ob Sie Entwürfe zur Freigabe vorbereiten, ob Sie direkten Mandantenkontakt haben. Solche Angaben unterscheiden Referendare desselben Jahrgangs.",
        "Geben Sie Ihr Englischniveau an und, falls vorhanden, ein Zertifikat in juristischem Englisch wie TOLES. Ergänzen Sie Veröffentlichungen, Moot Courts und Studienkreise, wenn sie zur Spezialisierung passen."
      ],
      sample: {
        name: "Piotr Malinowski",
        headline: "Rechtsreferendar (aplikant radcowski) – Wirtschaftsrecht und Prozessführung",
        contact: ["+48 600 000 129", "piotr.malinowski@example.com", "Toruń", "linkedin.com/in/piotr-malinowski-przyklad"],
        summary: "Rechtsreferendar im dritten Jahr der Rechtsberaterausbildung, seit 2018 in Kanzleien tätig, die Unternehmen betreuen. Ich entwerfe Schriftsätze und Verträge, recherchiere und nehme Verhandlungstermine in Vertretung eines Rechtsberaters wahr. Mein Schwerpunkt sind Wirtschaftsstreitigkeiten und Vertragsrecht.",
        skills: [
          "Schriftsätze in Handelssachen",
          "Entwurf und Prüfung von Handelsverträgen",
          "Terminsvertretung für einen Rechtsberater",
          "Recherche in juristischen Datenbanken",
          "Due Diligence von GmbHs (Sp. z o.o.)",
          "Arbeitsrecht in der Unternehmensberatung",
          "Juristisches Englisch"
        ],
        languages: ["Englisch C1", "Deutsch A2"],
        jobs: [
          {
            title: "Rechtsreferendar (zuvor juristischer Assistent)",
            company: "Kancelaria Prawna Nowicki i Wspólnicy sp.k.",
            period: "06.2020 – heute",
            bullets: [
              "Entwurf von Klagen, Klageerwiderungen und Berufungen in Wirtschaftsstreitigkeiten.",
              "Wahrnehmung von rund 10 Verhandlungsterminen pro Monat in Vertretung eines Rechtsberaters.",
              "Mitarbeit an 6 Due-Diligence-Prüfungen von Gesellschaften vor Übernahmen."
            ]
          },
          {
            title: "Juristischer Assistent",
            company: "Kancelaria Adwokacka Kowal i Partnerzy",
            period: "10.2018 – 05.2020",
            bullets: [
              "Recherche von Rechtsprechung und Literatur für Zivil- und Familiensachen.",
              "Entwurf einfacher Schriftstücke und Korrespondenz mit Mandanten.",
              "Führung des Fristenkalenders für 3 Rechtsanwälte."
            ]
          }
        ],
        education: {
          school: "Uniwersytet Mikołaja Kopernika w Toruniu",
          degree: "Rechtswissenschaft (einheitlicher Masterstudiengang)",
          period: "2015 – 2020"
        }
      },
      faq: [
        {
          q: "Soll ein Referendar das Ergebnis der Aufnahmeprüfung in den Lebenslauf schreiben?",
          a: "Das ist nicht nötig, aber ein hohes Ergebnis kann zu Beginn des Referendariats ein Vorteil sein, wenn Sie noch wenig Praxis haben. Wichtiger sind Ausbildungsjahr, Kammer und Kanzleierfahrung. Nach einigen Jahren verliert das Ergebnis der Aufnahmeprüfung an Bedeutung."
        },
        {
          q: "Wie beschreibe ich Fälle, wenn ich an die Schweigepflicht gebunden bin?",
          a: "Nennen Sie keine Mandantennamen und keine Falldetails. Beschreiben Sie Art des Falls, Branche, ungefähren Streitwert und Ihre Rolle, etwa „Streitigkeiten aus Bauverträgen mit einem Wert von bis zu mehreren Millionen Złoty“. Die Kanzlei wird schätzen, dass Sie die Vertraulichkeit von Anfang an wahren."
        },
        {
          q: "Sollte ich für eine internationale Kanzlei einen englischen Lebenslauf schreiben?",
          a: "Wenn die Anzeige auf Englisch ist oder die Kanzlei vor allem für ausländische Mandanten arbeitet, bereiten Sie einen englischen Lebenslauf oder zwei Versionen vor. Achten Sie auf die korrekte Übersetzung der Ausbildungs- und Berufsbezeichnungen, zum Beispiel „trainee attorney-at-law (aplikant radcowski)“."
        }
      ]
    },
    "specjalista-bhp": {
      slugLang: "fachkraft-arbeitssicherheit",
      name: "Fachkraft für Arbeitssicherheit",
      title: "Lebenslauf Fachkraft für Arbeitssicherheit: Muster und Tipps",
      metaDescription: "Lebenslauf als Fachkraft für Arbeitssicherheit (BHP) passend zur Anzeige. Muster, Schlüsselwörter und Tipps zu Qualifikation, Gefährdungsbeurteilung, Unterweisungen und Arbeitsunfällen.",
      intro: "Die Anforderungen an den Arbeitsschutzdienst (BHP) sind in Polen gesetzlich geregelt, deshalb nennen Arbeitgeber sie in Anzeigen oft sehr genau: ein Hochschulstudium im Bereich Arbeitssicherheit oder ein entsprechendes Aufbaustudium sowie eine der Position entsprechende Berufserfahrung im Arbeitsschutzdienst. Für eine Inspektorenstelle reicht oft ein Abschluss als Techniker für Arbeitssicherheit. Zu den Aufgaben gehören meist Begehungen, Gefährdungsbeurteilungen, Erst- und Wiederholungsunterweisungen sowie die Untersuchung von Arbeitsunfällen. In Industriebetrieben kommen Kenntnisse der ISO 45001 und die Mitwirkung an Audits hinzu.",
      keywords: [
        "Hochschulabschluss im Bereich Arbeitssicherheit",
        "Gefährdungsbeurteilung",
        "Erst- und Wiederholungsunterweisungen",
        "Untersuchung von Arbeitsunfällen",
        "Begehungen und Kontrollen der Arbeitsbedingungen",
        "Arbeitsplatzanweisungen",
        "ISO 45001",
        "Brandschutz",
        "Zusammenarbeit mit Arbeitsinspektion (PIP) und Sanepid",
        "Reporting von Sicherheitskennzahlen"
      ],
      tips: [
        "Beschreiben Sie Ihre Qualifikation so, wie die Vorschriften sie definieren: Studienrichtung oder Aufbaustudium im Arbeitsschutz und Jahre im Arbeitsschutzdienst. Davon hängt ab, ob Sie als Inspektor, Fachkraft oder leitende Fachkraft eingestellt werden können.",
        "Schreiben Sie, in welchen Branchen und mit welchen Gefährdungen Sie gearbeitet haben: Lärm, Arbeiten in der Höhe, Maschinen, Gefahrstoffe, Lager mit Gabelstaplern. Ein Produktionsbetrieb sucht jemanden, der seine realen Risiken kennt.",
        "Zeigen Sie Ergebnisse: weniger Unfälle, Zahl der unterwiesenen Personen, aktualisierte Gefährdungsbeurteilungen, abgeschlossene Abweichungen nach Audits. Eine reine Aufgabenliste hebt Sie nicht hervor.",
        "Nennen Sie zusätzliche Qualifikationen und Kurse: Brandschutzinspektor, Schulungsmethodik, interner Auditor ISO 45001, Erste-Hilfe-Ausbilder. In vielen Firmen übernimmt die Fachkraft für Arbeitssicherheit auch diese Aufgaben."
      ],
      sample: {
        name: "Sebastian Wawrzyniak",
        headline: "Fachkraft für Arbeitssicherheit – Produktionsbetrieb",
        contact: ["+48 600 000 130", "sebastian.wawrzyniak@example.com", "Płock", "linkedin.com/in/sebastian-wawrzyniak-przyklad"],
        summary: "Fachkraft für Arbeitssicherheit mit acht Jahren Erfahrung im Arbeitsschutzdienst in Produktions- und Logistikbetrieben. Ich erstelle Gefährdungsbeurteilungen, führe Unterweisungen, Arbeitsplatzbegehungen und Unfalluntersuchungen durch. Ich bin interner Auditor ISO 45001 und Brandschutzinspektor.",
        skills: [
          "Gefährdungsbeurteilung",
          "Erst- und Wiederholungsunterweisungen",
          "Unfalluntersuchung und Dokumentation",
          "Internes Audit ISO 45001",
          "Brandschutzinspektor",
          "Prüfung von Maschinen auf Mindestanforderungen",
          "Führerschein Klasse B"
        ],
        languages: ["Englisch B1"],
        jobs: [
          {
            title: "Fachkraft für Arbeitssicherheit",
            company: "Zakłady Tworzyw Mazowsze Sp. z o.o.",
            period: "06.2020 – heute",
            bullets: [
              "Verantwortung für die Arbeitssicherheit in einem Werk mit rund 450 Beschäftigten im Dreischichtbetrieb.",
              "Aktualisierung von 60 Gefährdungsbeurteilungen und Arbeitsplatzanweisungen nach der Modernisierung von Produktionslinien.",
              "Senkung der Arbeitsunfälle von 9 auf 3 pro Jahr durch ein verhaltensorientiertes Sicherheitsprogramm."
            ]
          },
          {
            title: "Sicherheitsinspektor",
            company: "Wisła-Log Centrum Logistyczne Sp. z o.o.",
            period: "04.2018 – 05.2020",
            bullets: [
              "Allgemeine Erstunterweisung für rund 300 neue Mitarbeiter pro Jahr.",
              "Kontrollen des Zustands der Regale und der Verkehrsregeln für Gabelstapler.",
              "Mitarbeit im Unfalluntersuchungsteam und Erstellung der Dokumentation."
            ]
          }
        ],
        education: {
          school: "Politechnika Łódzka",
          degree: "Sicherheitstechnik (Ingenieur)",
          period: "2013 – 2017"
        }
      },
      faq: [
        {
          q: "Kann ich direkt nach einem Aufbaustudium Arbeitssicherheit als Fachkraft arbeiten?",
          a: "Ein Aufbaustudium im Arbeitsschutz ist ein Weg zur Qualifikation, für die Stelle als Fachkraft verlangen die Vorschriften aber zusätzlich Berufserfahrung im Arbeitsschutzdienst. Wenn Ihnen diese fehlt, suchen Sie Stellen als Inspektor oder in einer Firma, in der Sie die nötige Erfahrung sammeln. Nennen Sie im Lebenslauf das Abschlussdatum und jeden Zeitraum im Arbeitsschutzdienst."
        },
        {
          q: "Wie trage ich die Arbeit für einen externen Arbeitsschutzdienstleister ein?",
          a: "Beschreiben Sie sie wie jede andere Stelle und nennen Sie Branchen und Größe der betreuten Betriebe, ohne Kundennamen, wenn Sie keine Zustimmung haben. Geben Sie an, wie viele Betriebe Sie betreut und welche Aufgaben Sie übernommen haben. Für Arbeitgeber ist das ein Beleg, dass Sie viele verschiedene Arbeitsumfelder kennen."
        }
      ]
    }
  }
};
