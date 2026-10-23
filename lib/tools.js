// Darmowe narzędzia (opis do wyszukiwarek; same narzędzia działają w przeglądarce, w public/app.js).
export const TOOLS = {
  'skaner-cv': {
    title: 'Skaner CV: sprawdź za darmo, czy CV pasuje do ogłoszenia',
    seoTitle: 'Skaner CV za darmo: sprawdź dopasowanie w kilkanaście sekund',
    metaDescription: 'Darmowy skaner CV online, bez rejestracji: wgraj CV, wklej ogłoszenie i zobacz wynik dopasowania, brakujące wymagania i słowa kluczowe, których szuka ATS.',
    lead: 'Wgraj obecne CV (PDF, Word lub TXT) i wklej link do ogłoszenia albo jego treść. W kilkanaście sekund zobaczysz, które wymagania spełniasz, czego nie widać w CV i co poprawić. Nie zapisujemy pliku ani treści CV.',
    about: [
      'Rekruter i system ATS, który wstępnie przegląda zgłoszenia, szukają w CV słów z ogłoszenia: nazw stanowisk, programów, uprawnień i obowiązków. Jeśli masz dane doświadczenie, ale opisujesz je innymi słowami niż pracodawca, CV może zostać pominięte. Skaner porównuje treść Twojego CV z konkretnym ogłoszeniem i pokazuje, co się zgadza, a czego brakuje.',
      'Wynik to procent dopasowania, lista spełnionych wymagań, lista wymagań, których nie widać w CV, oraz trzy konkretne rady, co zmienić. Każdy brak ma krótką podpowiedź, jak go uzupełnić, jeśli faktycznie masz takie doświadczenie. Niczego nie dopisujemy za Ciebie.',
      'Skaner działa dla ogłoszeń po polsku, angielsku, niemiecku i ukraińsku, z większości portali z ofertami pracy (Pracuj.pl, OLX, Indeed, LinkedIn i inne). Gdy link nie da się pobrać, wklej treść ogłoszenia samodzielnie.',
      'Jeśli po sprawdzeniu chcesz mieć CV napisane pod to ogłoszenie, jednym kliknięciem przeniesiesz dane z pliku i treść ogłoszenia do kreatora. CV pod ogłoszenie kosztuje od 39 zł, bez abonamentu, z darmową poprawką.',
    ],
    faq: [
      { q: 'Czy skaner CV jest naprawdę darmowy?', a: 'Tak. Nie wymaga rejestracji, konta ani podania e-maila. Masz limit kilku sprawdzeń na godzinę, żeby narzędzie działało sprawnie dla wszystkich.' },
      { q: 'Co się dzieje z moim plikiem?', a: 'Plik służy tylko do jednorazowego porównania z ogłoszeniem. Nie zapisujemy pliku ani treści CV. Sam wynik (procent, słowa kluczowe i wskazówki) jest w pamięci serwera do godziny, potem jest usuwany; na Twoją prośbę wysyłamy go e-mailem. Jeśli potem zamówisz CV, dane z pliku trafią do kreatora, a zamówienie usuwamy po 30 dniach.' },
      { q: 'Czy to jest test ATS?', a: 'Skaner sprawdza to, co sprawdzają systemy ATS i rekruterzy: czy w CV są wymagania i słowa kluczowe z ogłoszenia. Nie odtwarza jednak konkretnego systemu danej firmy, bo każdy działa trochę inaczej. Wynik traktuj jako wskazówkę, co uzupełnić.' },
      { q: 'Jaki wynik jest dobry?', a: 'Nie ma jednego progu. Ważniejsze od procentu są brakujące wymagania: jeśli masz dane doświadczenie, a w CV go nie widać, dopisz je swoimi słowami. Jeśli go nie masz, nie dopisuj. Lepiej wysłać uczciwe CV z 70% dopasowania niż naciągane ze 100%.' },
      { q: 'Jakie pliki przyjmuje skaner?', a: 'PDF, Word (.docx) i zwykły tekst (.txt), do 5 MB. Skany i zdjęcia CV nie zadziałają, bo nie da się z nich odczytać tekstu.' },
    ],
  },
  'sprawdz-cv': {
    title: 'Sprawdź swoje CV online: darmowa analiza bez rejestracji',
    seoTitle: 'Sprawdź CV online za darmo – analiza bez rejestracji',
    metaDescription: 'Wgraj CV i sprawdź za darmo: czy tekst da się odczytać, jakie sekcje są w CV, czy są dane kontaktowe i klauzula RODO. Bez ogłoszenia i bez rejestracji.',
    lead: 'Wgraj CV (PDF, Word lub TXT). Bez wklejania ogłoszenia sprawdzisz, czy tekst da się odczytać, jakie sekcje rozpoznajemy, czy są dane kontaktowe, klauzula RODO i daty. Pliku ani wyniku nie zapisujemy.',
    about: [
      'To sprawdzenie nie ocenia, czy CV pasuje do konkretnej pracy, tylko czy jest kompletne i czytelne dla programów, które przeglądają zgłoszenia. Pokazujemy, ile słów ma CV, które typowe sekcje udało się rozpoznać (podsumowanie, doświadczenie, wykształcenie, umiejętności, języki), czy w tekście jest e-mail i telefon, czy przy stanowiskach są daty i czy na końcu jest klauzula RODO, której wiele polskich firm oczekuje.',
      'Ważna część to test kopiowania: pokazujemy czysty tekst, który udało się wyciągnąć z pliku, w takiej kolejności, w jakiej odczyta go program. Jeśli brakuje w nim e-maila, nazw firm albo całych sekcji, prawdopodobnie są w grafice, w nagłówku pliku albo w tabeli, której program nie odczytał.',
      'Gdy masz już konkretne ogłoszenie, przejdź do skanera dopasowania: porówna CV z wymaganiami z oferty i pokaże, czego w nim nie widać. Jeśli chcesz CV napisane pod to ogłoszenie, przygotujemy je od 39 zł, bez abonamentu.',
    ],
    faq: [
      { q: 'Czy muszę wklejać ogłoszenie?', a: 'Nie. To sprawdzenie działa bez ogłoszenia i dotyczy samego CV: czytelności, sekcji, danych kontaktowych i klauzuli RODO. Dopasowanie do konkretnej oferty sprawdzisz w skanerze CV.' },
      { q: 'Czy moje CV jest gdzieś zapisywane?', a: 'Nie. Plik służy tylko do odczytania tekstu i przygotowania wyniku. Nie zapisujemy ani pliku, ani tekstu, ani wyniku.' },
      { q: 'Dlaczego nie widać części mojego CV w podglądzie tekstu?', a: 'Najczęściej te informacje są w grafice, w ikonach albo w nagłówku i stopce pliku. Program do rekrutacji też może ich nie odczytać, więc warto przenieść je do zwykłego tekstu.' },
      { q: 'Czy to sprawdzenie ocenia treść CV?', a: 'Ocenia budowę i kompletność, nie jakość opisów. Czy opisy pasują do oferty, pokaże skaner dopasowania po wklejeniu ogłoszenia.' },
    ],
  },
  'test-cv-ats': {
    title: 'Test CV pod ATS: sprawdź, czy system odczyta Twoje CV',
    seoTitle: 'Test CV pod ATS za darmo: czy system odczyta Twoje CV?',
    metaDescription: 'Zobacz CV oczami systemu ATS: czysty tekst z pliku, rozpoznane sekcje, ostrzeżenia o kolumnach i grafice, a z ogłoszeniem – wykryte słowa kluczowe.',
    lead: 'Wgraj CV, a pokażemy je tak, jak widzi je program do rekrutacji: sam tekst, bez układu i grafiki. Możesz też wkleić ogłoszenie, żeby zobaczyć, które słowa z oferty program znajdzie w CV.',
    about: [
      'Systemy ATS (programy, w których firmy zbierają i przeglądają zgłoszenia) najpierw wyciągają z pliku tekst, a potem dzielą go na sekcje i szukają w nim słów z ogłoszenia. Ten test pokazuje pierwszy krok: tekst odczytany z Twojego pliku i sekcje, które da się w nim rozpoznać. Jeśli coś ginie już tutaj, nie zobaczy tego ani program, ani rekruter, który przegląda wyniki wyszukiwania.',
      'Dostaniesz ostrzeżenia o typowych problemach: tekst rozbity na wiele krótkich linii (zwykle kolumny lub tabele), brak e-maila w odczytanym tekście, mało tekstu w stosunku do rozmiaru pliku (często skan albo CV zrobione z obrazków) i znaki, które zastępują słowa, jak ikony telefonu czy gwiazdki ocen.',
      'Nie ma jednego „wyniku ATS”. Każda firma używa innego systemu i innych ustawień, a decyzję zwykle podejmuje człowiek. Dlatego nie podajemy punktacji, tylko konkretne rzeczy do poprawienia. Po wklejeniu ogłoszenia porównamy CV z wymaganiami tak jak skaner dopasowania.',
    ],
    faq: [
      { q: 'Czy ATS odrzuca CV automatycznie?', a: 'To zależy od firmy i ustawień systemu. Często ATS służy do przeszukiwania i sortowania zgłoszeń, a decyzję podejmuje rekruter. Dlatego ważne jest, żeby tekst dało się odczytać, a słowa z ogłoszenia były w CV.' },
      { q: 'Czy PDF jest dobry dla ATS?', a: 'PDF z prawdziwym tekstem (zapisany z edytora, a nie zeskanowany) zwykle odczytuje się dobrze. Test pokaże, czy tekst z Twojego pliku da się wyciągnąć i w jakiej kolejności.' },
      { q: 'Czy zdjęcie i tabele przeszkadzają ATS?', a: 'Samo zdjęcie zwykle nie, ale tekst w grafice, ikonach i złożonych tabelach bywa pomijany albo czytany w złej kolejności. Test kopiowania pokazuje, czy to dotyczy Twojego CV.' },
      { q: 'Czy moje CV jest gdzieś zapisywane?', a: 'Nie zapisujemy ani pliku, ani tekstu CV. Jeśli wkleisz ogłoszenie, skaner trzyma w pamięci serwera przez godzinę sam wynik porównania: procent, słowa kluczowe i wskazówki, bez treści CV. Dzięki temu można udostępnić kartę wyniku albo wysłać go na e-mail. Potem wynik jest usuwany.' },
      { q: 'Czy ukryty tekst ze słowami kluczowymi pomaga?', a: 'Nie warto. Biały tekst albo ukryte polecenia pojawiają się w odczytanym tekście i rekruter je zobaczy. Lepiej opisać prawdziwe doświadczenie słowami z ogłoszenia.' },
    ],
  },
  'klauzula-rodo': {
    title: 'Generator klauzuli RODO do CV',
    metaDescription: 'Darmowy generator klauzuli RODO do CV: aktualne brzmienie zgody na przetwarzanie danych, wersja na przyszłe rekrutacje oraz po angielsku i niemiecku.',
    lead: 'Wybierz wersję i skopiuj gotową klauzulę na koniec CV. Jeśli pracodawca podaje własne brzmienie w ogłoszeniu, użyj jego wersji.',
  },
  'kalkulator-wynagrodzen': {
    title: 'Kalkulator wynagrodzeń brutto netto (umowa o pracę)',
    metaDescription: 'Darmowy kalkulator brutto na netto dla umowy o pracę: składki ZUS, składka zdrowotna, zaliczka na PIT, ulga dla młodych i podwyższone koszty dojazdu.',
    lead: 'Sprawdź, ile dostaniesz „na rękę” z oferty, zanim zaczniesz rozmowę o wynagrodzeniu. Wynik jest szacunkowy, dla typowej umowy o pracę.',
  },
  'podziekowanie-po-rozmowie': {
    title: 'Generator podziękowania po rozmowie kwalifikacyjnej',
    seoTitle: 'Napisz podziękowanie po rozmowie kwalifikacyjnej – generator',
    metaDescription: 'Darmowy generator e-maila z podziękowaniem po rozmowie kwalifikacyjnej. Wpisz stanowisko i firmę, a dostaniesz krótką, uprzejmą wiadomość do wysłania.',
    lead: 'Krótkie podziękowanie wysłane w ciągu doby po rozmowie przypomina o Tobie i pokazuje, że zależy Ci na tej pracy.',
  },
  'wypowiedzenie-umowy-o-prace': {
    title: 'Wypowiedzenie umowy o pracę – generator wzoru',
    metaDescription: 'Darmowy generator wypowiedzenia umowy o pracę przez pracownika: okres wypowiedzenia liczony automatycznie, wersja za porozumieniem stron, gotowe do wydruku.',
    lead: 'Wpisz dane, a dostaniesz gotowe pismo do wydruku i podpisania. Okres wypowiedzenia policzymy na podstawie stażu u pracodawcy i rodzaju umowy.',
  },
  'zdjecie-do-cv': {
    title: 'Zdjęcie do CV – sprawdź je za darmo',
    metaDescription: 'Wgraj zdjęcie, a AI oceni, czy nadaje się do CV: kadr, tło, światło, strój i mimika. Dostaniesz konkretne wskazówki. Zdjęcia nie zapisujemy.',
    lead: 'Wgraj zdjęcie, które chcesz dać do CV. Ocenimy kadr, tło, światło, strój i mimikę oraz podpowiemy, co poprawić. Zdjęcia nie zapisujemy.',
  },
  'jaki-zawod-dla-mnie': {
    title: 'Jaki zawód do mnie pasuje? Darmowy quiz',
    metaDescription: 'Odpowiedz na 10 krótkich pytań i zobacz 3 zawody, które pasują do Twoich preferencji, z poradami, jak napisać CV pod każdy z nich.',
    lead: 'Odpowiedz na 10 krótkich pytań o to, jak lubisz pracować. Pokażemy 3 zawody, które mogą do Ciebie pasować, i podpowiemy, jak napisać CV pod każdy z nich.',
  },
  'odpowiedzi-na-pytania-rekrutera': {
    title: 'Pytania rekrutera – przykładowe odpowiedzi pod Twoje stanowisko',
    seoTitle: 'Odpowiedzi na pytania rekrutera – przykłady pod stanowisko',
    metaDescription: 'Wybierz typowe pytanie z rozmowy kwalifikacyjnej, wpisz stanowisko i kilka faktów o sobie, a dostaniesz przykładową odpowiedź i wskazówki, czego unikać.',
    lead: 'Wybierz pytanie, wpisz stanowisko i kilka faktów o sobie. Dostaniesz przykładową odpowiedź opartą na Twoim doświadczeniu i wskazówki, czego unikać.',
  },
  'oferty-pracy-na-maila': {
    title: 'Oferty pracy na e-mail co tydzień',
    metaDescription: 'Wpisz zawód i miasto, a co poniedziałek dostaniesz e-mail z linkami do nowych ofert pracy na Pracuj.pl, OLX i Indeed oraz poradę o CV. Za darmo, przez 12 tygodni.',
    lead: 'Wpisz zawód i miasto, a co poniedziałek dostaniesz e-mail z linkami do najnowszych ofert na Pracuj.pl, OLX i Indeed oraz krótką poradę o CV. Za darmo, przez 12 tygodni, z wypisaniem jednym kliknięciem.',
  },
};

// Typowe pytania rekrutera (narzędzie „Pytania rekrutera”; serwer przyjmuje tylko pytania z tej listy).
export const QUESTIONS = [
  'Proszę opowiedzieć coś o sobie.',
  'Dlaczego chce Pan/Pani u nas pracować?',
  'Dlaczego chce Pan/Pani zmienić pracę?',
  'Jakie są Pana/Pani mocne strony?',
  'Jakie są Pana/Pani słabe strony?',
  'Gdzie widzi się Pan/Pani za 5 lat?',
  'Jakie są Pana/Pani oczekiwania finansowe?',
  'Proszę opowiedzieć o sytuacji, w której popełnił/a Pan/Pani błąd.',
  'Proszę opisać trudną sytuację z klientem lub współpracownikiem.',
  'Dlaczego mamy zatrudnić właśnie Pana/Panią?',
  'Skąd przerwa w zatrudnieniu?',
];
TOOLS['odpowiedzi-na-pytania-rekrutera'].questions = QUESTIONS;

// Opis i pytania pod każdym narzędziem: treść dla czytelnika i wyszukiwarek (FAQ trafia też do danych strukturalnych).
const ABOUT = {
  'klauzula-rodo': {
    about: [
      'Klauzula RODO to krótka zgoda na przetwarzanie danych osobowych w celu rekrutacji. Od 2019 roku pracodawca może przetwarzać podstawowe dane z CV bez zgody, ale wiele firm nadal prosi o nią w ogłoszeniu, zwłaszcza gdy CV zawiera dodatkowe informacje, np. zdjęcie lub zainteresowania.',
      'Generator podaje aktualne brzmienie po polsku, angielsku i niemiecku. Możesz dodać nazwę firmy oraz zgodę na udział w przyszłych rekrutacjach, jeśli chcesz, żeby pracodawca mógł wrócić do Twojego CV przy kolejnych ofertach.',
      'Gotową klauzulę wklej na sam dół CV, mniejszą czcionką. Jeśli ogłoszenie podaje własną treść zgody, użyj dokładnie tej z ogłoszenia.',
    ],
    faq: [
      { q: 'Czy klauzula RODO w CV jest obowiązkowa?', a: 'Nie zawsze. Pracodawca może przetwarzać podstawowe dane z CV bez zgody, ale jeśli ogłoszenie wymaga klauzuli, dodaj ją, bo inaczej Twoje CV może zostać pominięte.' },
      { q: 'Gdzie umieścić klauzulę RODO w CV?', a: 'Na samym dole ostatniej strony, mniejszą czcionką niż reszta tekstu.' },
      { q: 'Czy w CV po angielsku też dodaje się klauzulę?', a: 'Przy aplikacji do polskiej firmy tak, w wersji angielskiej. Przy pracy za granicą zwykle nie jest potrzebna, chyba że prosi o nią ogłoszenie.' },
    ],
  },
  'kalkulator-wynagrodzen': {
    about: [
      'Kalkulator przelicza wynagrodzenie brutto na netto dla umowy o pracę. Odejmuje składki na ubezpieczenie emerytalne, rentowe i chorobowe, składkę zdrowotną oraz zaliczkę na podatek dochodowy z uwzględnieniem kwoty wolnej.',
      'Możesz zaznaczyć ulgę dla młodych (zwolnienie z PIT do 26. roku życia) i podwyższone koszty uzyskania przychodu, jeśli dojeżdżasz do pracy z innej miejscowości. Wynik jest szacunkowy i dotyczy typowego etatu bez dodatkowych składników pensji.',
      'Kwotę netto warto znać przed rozmową o wynagrodzeniu: w ogłoszeniach i na rozmowach zwykle mówi się o brutto, a dla Ciebie liczy się to, co dostaniesz na konto.',
    ],
    faq: [
      { q: 'Ile to jest netto z brutto?', a: 'Przy umowie o pracę netto to zwykle około 70–75% kwoty brutto. Dokładny wynik zależy od wysokości pensji, ulg i kosztów uzyskania przychodu, dlatego warto policzyć go w kalkulatorze.' },
      { q: 'Czy kalkulator uwzględnia ulgę dla młodych?', a: 'Tak. Zaznacz ją, jeśli masz mniej niż 26 lat. Wtedy do limitu ulgi nie płacisz zaliczki na PIT.' },
      { q: 'Czy kalkulator działa dla umowy zlecenia lub B2B?', a: 'Nie. Liczy wynagrodzenie dla umowy o pracę. Przy innych umowach składki i podatek liczy się inaczej.' },
    ],
  },
  'podziekowanie-po-rozmowie': {
    about: [
      'Krótki e-mail z podziękowaniem po rozmowie kwalifikacyjnej to prosty sposób, żeby wyróżnić się spośród innych kandydatów. Przypomina rekruterowi o Tobie i pokazuje, że zależy Ci na tej pracy.',
      'Generator tworzy uprzejmą wiadomość na podstawie stanowiska, nazwy firmy i imienia osoby, z którą rozmawiałeś. Możesz dopisać jedną rzecz z rozmowy, która Cię zainteresowała, żeby wiadomość nie brzmiała jak szablon.',
      'Wyślij podziękowanie w ciągu 24 godzin od rozmowy. Wystarczą trzy, cztery zdania.',
    ],
    faq: [
      { q: 'Czy wypada wysłać podziękowanie po rozmowie kwalifikacyjnej?', a: 'Tak. To uprzejmy gest, który rekruterzy dobrze odbierają, a wielu kandydatów go pomija.' },
      { q: 'Kiedy wysłać podziękowanie?', a: 'Najlepiej tego samego dnia albo następnego, w godzinach pracy.' },
      { q: 'Do kogo wysłać podziękowanie?', a: 'Do osoby, która prowadziła rozmowę albo umówiła Cię na nią. Jeśli rozmawiało kilka osób, wystarczy jedna wiadomość do głównego rekrutera.' },
    ],
  },
  'wypowiedzenie-umowy-o-prace': {
    about: [
      'Generator przygotowuje pismo, którym pracownik wypowiada umowę o pracę. Wpisujesz swoje dane, dane pracodawcy i datę zatrudnienia, a okres wypowiedzenia liczy się automatycznie na podstawie stażu u tego pracodawcy.',
      'Zgodnie z Kodeksem pracy okres wypowiedzenia umowy na czas nieokreślony i określony wynosi 2 tygodnie przy zatrudnieniu krótszym niż 6 miesięcy, 1 miesiąc przy co najmniej 6 miesiącach i 3 miesiące przy co najmniej 3 latach. Możesz też wybrać wersję z propozycją rozwiązania umowy za porozumieniem stron.',
      'Pismo wydrukuj w dwóch egzemplarzach, podpisz i poproś pracodawcę o potwierdzenie odbioru na Twojej kopii.',
    ],
    faq: [
      { q: 'Od kiedy liczy się okres wypowiedzenia?', a: 'Okres liczony w tygodniach kończy się w sobotę, a liczony w miesiącach w ostatnim dniu miesiąca. Dlatego liczy się od dnia, w którym pracodawca otrzymał wypowiedzenie, do najbliższego takiego końca.' },
      { q: 'Czy wypowiedzenie musi mieć uzasadnienie?', a: 'Nie. Pracownik nie musi podawać powodu wypowiedzenia umowy.' },
      { q: 'Czy mogę odejść szybciej niż po okresie wypowiedzenia?', a: 'Tak, jeśli pracodawca się zgodzi. Wtedy umowę rozwiązuje się za porozumieniem stron, w uzgodnionym terminie.' },
    ],
  },
  'zdjecie-do-cv': {
    about: [
      'Zdjęcie w CV nie jest obowiązkowe, ale jeśli je dodajesz, powinno działać na Twoją korzyść. Narzędzie ocenia wgrane zdjęcie pod kątem kadru, tła, oświetlenia, stroju i mimiki, a potem podpowiada, co poprawić.',
      'Dobre zdjęcie do CV pokazuje twarz i ramiona, ma jasne, spokojne tło i równe światło, a strój pasuje do stanowiska. Nie musi być zrobione w studiu: wystarczy telefon, okno z rozproszonym światłem i jasna ściana.',
      'Zdjęcia nie zapisujemy. Ocena służy tylko Tobie i znika po zamknięciu strony.',
    ],
    faq: [
      { q: 'Czy zdjęcie w CV jest wymagane?', a: 'Nie. W Polsce zdjęcie jest dobrowolne. Przy aplikacji do Wielkiej Brytanii czy USA lepiej go nie dodawać, a w Niemczech jest często spotykane.' },
      { q: 'Jakie tło wybrać do zdjęcia do CV?', a: 'Jasne i jednolite, bez wzorów i przedmiotów w kadrze. Biała lub jasnoszara ściana sprawdzi się najlepiej.' },
      { q: 'Czy mogę użyć zdjęcia z wakacji?', a: 'Lepiej nie. Zdjęcie do CV powinno być neutralne, z twarzą zwróconą do aparatu i strojem pasującym do pracy.' },
    ],
  },
  'jaki-zawod-dla-mnie': {
    about: [
      'Quiz pomaga, gdy nie wiesz, w jakiej pracy dobrze byś się czuł. Odpowiadasz na 10 krótkich pytań, np. czy wolisz pracę z ludźmi czy z danymi, w ruchu czy przy biurku, według planu czy elastycznie.',
      'Na końcu pokazujemy trzy zawody, które pasują do Twoich odpowiedzi, z linkami do wskazówek, jak napisać CV pod każdy z nich, i do przykładowych CV.',
      'Quiz nie zastąpi rozmowy z doradcą zawodowym, ale dobrze sprawdza się jako punkt wyjścia, np. przy wyborze pierwszej pracy albo zmianie branży.',
    ],
    faq: [
      { q: 'Czy quiz jest darmowy?', a: 'Tak, bez rejestracji. Odpowiedzi nie są zapisywane.' },
      { q: 'Ile trwa quiz?', a: 'Około dwóch minut: 10 pytań z gotowymi odpowiedziami do wyboru.' },
      { q: 'Co zrobić po wyborze zawodu?', a: 'Otwórz stronę zawodu, przeczytaj słowa kluczowe i wskazówki do CV, a potem poszukaj ogłoszeń i przygotuj CV pod konkretną ofertę.' },
    ],
  },
  'odpowiedzi-na-pytania-rekrutera': {
    about: [
      'Na rozmowie kwalifikacyjnej powtarza się kilkanaście tych samych pytań, np. „Proszę opowiedzieć o sobie” albo „Jakie są Pana/Pani słabe strony?”. Dobra odpowiedź opiera się na Twoim prawdziwym doświadczeniu, a nie na wyuczonej formułce.',
      'Wybierz pytanie, wpisz stanowisko i kilka faktów o sobie. Dostaniesz przykładową odpowiedź opartą na tym, co podałeś, i wskazówki, czego unikać. Odpowiedź przećwicz na głos i dopasuj do własnego stylu.',
      'Przy pytaniach o konkretne sytuacje sprawdza się metoda STAR: sytuacja, zadanie, działanie i rezultat.',
    ],
    faq: [
      { q: 'Jak odpowiedzieć na pytanie o słabe strony?', a: 'Podaj prawdziwą, ale nie kluczową dla stanowiska słabość i powiedz, co robisz, żeby ją poprawić.' },
      { q: 'Jak długo powinna trwać odpowiedź na „Proszę opowiedzieć o sobie”?', a: 'Około minuty: obecna praca, najważniejsze doświadczenie związane ze stanowiskiem i powód, dla którego aplikujesz.' },
      { q: 'Czy mogę nauczyć się odpowiedzi na pamięć?', a: 'Lepiej zapamiętać główne punkty, a nie całe zdania. Odpowiedź wypowiedziana naturalnie brzmi bardziej wiarygodnie.' },
    ],
  },
  'oferty-pracy-na-maila': {
    about: [
      'Zamiast codziennie przeglądać portale z ofertami, wpisz zawód i miasto, a co poniedziałek dostaniesz e-mail z linkami do najnowszych ogłoszeń na Pracuj.pl, OLX i Indeed.',
      'W każdej wiadomości jest też krótka porada, jak dopasować CV do ogłoszenia. Wysyłka trwa 12 tygodni i możesz ją przerwać jednym kliknięciem w każdym e-mailu.',
      'Gdy znajdziesz ciekawe ogłoszenie, wklej je do kreatora, a przygotujemy CV pisane właśnie pod tę ofertę.',
    ],
    faq: [
      { q: 'Czy oferty pracy na e-mail są płatne?', a: 'Nie, wysyłka jest bezpłatna.' },
      { q: 'Jak zrezygnować z ofert na e-mail?', a: 'Kliknij link do wypisania na dole każdej wiadomości.' },
      { q: 'Z jakich portali pochodzą oferty?', a: 'Linki prowadzą do wyników wyszukiwania na Pracuj.pl, OLX i Indeed dla podanego zawodu i miasta.' },
    ],
  },
};
for (const [k, v] of Object.entries(ABOUT)) if (TOOLS[k]) Object.assign(TOOLS[k], v);
