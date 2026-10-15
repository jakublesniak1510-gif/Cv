// Darmowe narzędzia (opis do wyszukiwarek; same narzędzia działają w przeglądarce, w public/app.js).
export const TOOLS = {
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
