export const CITIES = [
  {
    slug: 'warszawa',
    name: 'Warszawa',
    loc: 'w Warszawie',
    gen: 'Warszawy',
    region: 'województwo mazowieckie',
    intro: 'Warszawa to największy rynek pracy w Polsce, z dużą liczbą biur, centrów usług dla biznesu, firm IT, instytucji publicznych i siedzib firm. Wokół miasta działa wiele parków logistycznych i magazynów, a do stolicy codziennie dojeżdżają mieszkańcy okolicznych miejscowości. Konkurencja o atrakcyjne oferty jest duża, dlatego CV dopasowane do ogłoszenia ma tu szczególne znaczenie.',
    tips: [
      'Jeśli mieszkasz poza Warszawą, dopisz w CV, skąd dojeżdżasz i czy masz dobry dojazd koleją, metrem lub samochodem. Rekruter od razu widzi, że codzienny dojazd nie będzie problemem.',
      'W firmach międzynarodowych i centrach usług znajomość angielskiego często jest wymagana już na start. Podaj realny poziom języka i przykłady, gdzie go używasz.',
      'Oferty w magazynach pod Warszawą zwykle dotyczą pracy zmianowej. Napisz wprost, czy możesz pracować na zmiany i czy masz uprawnienia, na przykład na wózki widłowe.'
    ],
    near: ['Pruszków', 'Piaseczno', 'Legionowo', 'Grodzisk Mazowiecki']
  },
  {
    slug: 'krakow',
    name: 'Kraków',
    loc: 'w Krakowie',
    gen: 'Krakowa',
    region: 'województwo małopolskie',
    intro: 'Kraków jest znany z wielu centrów usług dla biznesu i firm IT, a także z dużego ośrodka akademickiego. Ważną część rynku pracy tworzą turystyka, gastronomia i hotelarstwo. Pracodawcy często szukają osób znających języki obce.',
    tips: [
      'W centrach usług i firmach IT liczy się znajomość angielskiego, a często także drugiego języka. Wpisz w CV każdy język, którym posługujesz się w pracy.',
      'W turystyce i gastronomii ruch jest większy w sezonie letnim i przed świętami. Zaznacz dostępność w weekendy i w okresach wzmożonego ruchu.',
      'Jeśli dojeżdżasz z okolic, na przykład z Wieliczki lub Skawiny, podaj to w CV razem z informacją o sposobie dojazdu.'
    ],
    near: ['Wieliczka', 'Skawina', 'Niepołomice']
  },
  {
    slug: 'wroclaw',
    name: 'Wrocław',
    loc: 'we Wrocławiu',
    gen: 'Wrocławia',
    region: 'województwo dolnośląskie',
    intro: 'Wrocław ma wiele firm IT i centrów usług dla biznesu, a w okolicy miasta działają zakłady produkcyjne i centra logistyczne. Miasto jest też dużym ośrodkiem akademickim. Ofert jest dużo zarówno dla specjalistów, jak i dla osób szukających pracy fizycznej.',
    tips: [
      'W zakładach i magazynach wokół Wrocławia praca często odbywa się w systemie zmianowym. Napisz, czy możesz pracować na trzy zmiany i czy masz własny dojazd.',
      'W międzynarodowych firmach przydaje się angielski, a w części z nich także niemiecki. Podaj poziom każdego języka.',
      'Jeśli mieszkasz poza miastem, wpisz miejscowość i sposób dojazdu. Dla pracodawcy z podmiejskiej strefy przemysłowej to ważna informacja.'
    ],
    near: ['Oława', 'Oleśnica', 'Środa Śląska']
  },
  {
    slug: 'lodz',
    name: 'Łódź',
    loc: 'w Łodzi',
    gen: 'Łodzi',
    region: 'województwo łódzkie',
    intro: 'Łódź ma silny sektor logistyczny i centra usług dla biznesu. Dzięki położeniu w centrum kraju i przy ważnych autostradach wokół miasta powstało wiele magazynów i centrów dystrybucyjnych. Działają tu też uczelnie i firmy produkcyjne.',
    tips: [
      'W parkach logistycznych pod Łodzią, na przykład w okolicy Strykowa, praca jest zwykle zmianowa. Zaznacz w CV dyspozycyjność i uprawnienia na wózki widłowe, jeśli je masz.',
      'W centrach usług dla biznesu liczy się znajomość języków obcych i obsługa programów biurowych. Opisz konkretnie, w jakim języku i z jakimi narzędziami pracowałeś.',
      'Jeśli dojeżdżasz ze Zgierza, Pabianic lub innej pobliskiej miejscowości, podaj to w CV. Pokazujesz w ten sposób, że dojazd masz przemyślany.'
    ],
    near: ['Zgierz', 'Pabianice', 'Aleksandrów Łódzki', 'Stryków']
  },
  {
    slug: 'poznan',
    name: 'Poznań',
    loc: 'w Poznaniu',
    gen: 'Poznania',
    region: 'województwo wielkopolskie',
    intro: 'Poznań to ważny ośrodek handlu, usług i przemysłu w zachodniej Polsce. Wokół miasta działa wiele magazynów, centrów logistycznych i zakładów produkcyjnych, a w samym mieście są centra usług dla biznesu i uczelnie. Miasto jest też znane z targów.',
    tips: [
      'W magazynach i zakładach pod Poznaniem często pracuje się na zmiany. Napisz w CV, czy możesz pracować w nocy i w weekendy.',
      'Jeśli mieszkasz w gminie podmiejskiej, na przykład w Swarzędzu lub Luboniu, podaj miejscowość i sposób dojazdu.',
      'W firmach międzynarodowych przydaje się angielski lub niemiecki. Wpisz poziom języka i sytuacje, w których z niego korzystasz.'
    ],
    near: ['Swarzędz', 'Luboń', 'Komorniki', 'Tarnowo Podgórne']
  },
  {
    slug: 'gdansk',
    name: 'Gdańsk',
    loc: 'w Gdańsku',
    gen: 'Gdańska',
    region: 'województwo pomorskie',
    intro: 'Gdańsk razem z Gdynią i Sopotem tworzy Trójmiasto. Ważną rolę odgrywają tu port, branża morska, logistyka, a także firmy IT i centra usług dla biznesu. W sezonie letnim rośnie liczba ofert w turystyce i gastronomii.',
    tips: [
      'W Trójmieście wiele osób pracuje w innym mieście niż mieszka. Napisz w CV, skąd dojeżdżasz, na przykład koleją SKM.',
      'W firmach związanych z portem, logistyką i w centrach usług przydaje się angielski. Podaj poziom języka i przykłady jego użycia.',
      'Oferty w turystyce i gastronomii są często sezonowe. Zaznacz, w jakich miesiącach jesteś dostępny i czy możesz pracować w weekendy.'
    ],
    near: ['Gdynia', 'Sopot', 'Pruszcz Gdański']
  },
  {
    slug: 'szczecin',
    name: 'Szczecin',
    loc: 'w Szczecinie',
    gen: 'Szczecina',
    region: 'województwo zachodniopomorskie',
    intro: 'Szczecin to miasto portowe położone blisko granicy z Niemcami. Rynek pracy tworzą tu port, logistyka, przemysł, usługi i uczelnie. Bliskość Niemiec sprawia, że znajomość języka niemieckiego jest często dodatkowym atutem.',
    tips: [
      'Jeśli znasz niemiecki, wpisz go w CV wysoko i podaj poziom. W wielu firmach w regionie to realna przewaga.',
      'W portach, magazynach i zakładach praca bywa zmianowa. Napisz, czy możesz pracować na zmiany i jakie masz uprawnienia.',
      'Jeśli dojeżdżasz z Polic, Stargardu lub Goleniowa, podaj miejscowość i sposób dojazdu.'
    ],
    near: ['Police', 'Stargard', 'Goleniów']
  },
  {
    slug: 'bydgoszcz',
    name: 'Bydgoszcz',
    loc: 'w Bydgoszczy',
    gen: 'Bydgoszczy',
    region: 'województwo kujawsko-pomorskie',
    intro: 'Bydgoszcz razem z Toruniem tworzy dwubiegunowy ośrodek regionu kujawsko-pomorskiego. Rynek pracy opiera się na przemyśle, usługach, logistyce i centrach usług dla biznesu. W mieście działają także uczelnie.',
    tips: [
      'Jeśli możesz pracować zarówno w Bydgoszczy, jak i w Toruniu, napisz to w CV. Poszerzasz w ten sposób liczbę ofert, które do Ciebie pasują.',
      'W zakładach produkcyjnych liczy się gotowość do pracy zmianowej i uprawnienia. Wymień je konkretnie.',
      'W centrach usług dla biznesu przydaje się angielski. Podaj poziom języka i opisz, do czego go używałeś.'
    ],
    near: ['Toruń', 'Solec Kujawski', 'Nakło nad Notecią']
  },
  {
    slug: 'lublin',
    name: 'Lublin',
    loc: 'w Lublinie',
    gen: 'Lublina',
    region: 'województwo lubelskie',
    intro: 'Lublin to największe miasto we wschodniej Polsce i duży ośrodek akademicki. Rośnie tu znaczenie firm IT i centrów usług dla biznesu, a ważnymi pracodawcami są też instytucje publiczne, ochrona zdrowia i handel.',
    tips: [
      'Jeśli dopiero zaczynasz karierę, opisz w CV praktyki, staże i projekty z uczelni. W mieście akademickim to częsta droga do pierwszej pracy.',
      'W firmach IT i centrach usług liczy się angielski. Podaj realny poziom języka i przykłady jego użycia.',
      'Jeśli dojeżdżasz ze Świdnika lub innej pobliskiej miejscowości, wpisz to w CV razem z informacją o dojeździe.'
    ],
    near: ['Świdnik', 'Lubartów', 'Łęczna']
  },
  {
    slug: 'bialystok',
    name: 'Białystok',
    loc: 'w Białymstoku',
    gen: 'Białegostoku',
    region: 'województwo podlaskie',
    intro: 'Białystok jest największym miastem północno-wschodniej Polski i leży niedaleko wschodniej granicy. Rynek pracy tworzą przemysł, handel, usługi, uczelnie i instytucje publiczne. Coraz więcej ofert pojawia się też w branży IT.',
    tips: [
      'Jeśli znasz rosyjski, białoruski lub litewski, wpisz to w CV. W handlu i transporcie w regionie bywa to przydatne.',
      'W zakładach produkcyjnych często pracuje się na zmiany. Zaznacz dyspozycyjność i posiadane uprawnienia.',
      'Jeśli dojeżdżasz z Wasilkowa, Choroszczy lub Łap, podaj miejscowość i sposób dojazdu.'
    ],
    near: ['Wasilków', 'Choroszcz', 'Łapy']
  },
  {
    slug: 'katowice',
    name: 'Katowice',
    loc: 'w Katowicach',
    gen: 'Katowic',
    region: 'województwo śląskie',
    intro: 'Katowice są centrum Górnośląsko-Zagłębiowskiej Metropolii, czyli dużej aglomeracji wielu sąsiadujących miast. Rynek pracy tworzą przemysł, logistyka, handel, centra usług dla biznesu i firmy IT. Wiele osób mieszka w jednym mieście metropolii, a pracuje w innym.',
    tips: [
      'Napisz w CV, w jakich miastach metropolii możesz pracować i czy masz samochód. Dzięki temu pasujesz do większej liczby ofert.',
      'W zakładach przemysłowych i magazynach praca jest często zmianowa. Wymień uprawnienia, na przykład na wózki widłowe lub suwnice.',
      'W centrach usług dla biznesu liczy się angielski, a czasem drugi język. Podaj poziom każdego z nich.'
    ],
    near: ['Chorzów', 'Sosnowiec', 'Gliwice', 'Tychy']
  },
  {
    slug: 'gdynia',
    name: 'Gdynia',
    loc: 'w Gdyni',
    gen: 'Gdyni',
    region: 'województwo pomorskie',
    intro: 'Gdynia jest miastem portowym i częścią Trójmiasta. Ważne miejsce na rynku pracy zajmują port, branża morska, logistyka i usługi. Wielu mieszkańców pracuje też w Gdańsku lub Sopocie.',
    tips: [
      'Jeśli pracowałeś w porcie, logistyce lub branży morskiej, opisz konkretne zadania i uprawnienia. Pracodawcy z tej branży zwracają na nie uwagę.',
      'Podaj w CV, czy możesz pracować w całym Trójmieście i jak dojeżdżasz, na przykład koleją SKM.',
      'W firmach związanych z handlem morskim przydaje się angielski. Wpisz poziom języka.'
    ],
    near: ['Gdańsk', 'Sopot', 'Rumia', 'Reda']
  },
  {
    slug: 'czestochowa',
    name: 'Częstochowa',
    loc: 'w Częstochowie',
    gen: 'Częstochowy',
    region: 'województwo śląskie',
    intro: 'Częstochowa to miasto z tradycją przemysłową, a także ważny ośrodek ruchu pielgrzymkowego. Rynek pracy tworzą przemysł, handel, usługi oraz turystyka związana z Jasną Górą.',
    tips: [
      'W zakładach produkcyjnych liczy się gotowość do pracy zmianowej i uprawnienia techniczne. Wymień je w CV konkretnie.',
      'W hotelarstwie i gastronomii ruch rośnie w okresach pielgrzymek. Zaznacz dostępność w weekendy i święta.',
      'Jeśli dojeżdżasz z Kłobucka, Myszkowa lub Blachowni, podaj miejscowość i sposób dojazdu.'
    ],
    near: ['Kłobuck', 'Myszków', 'Blachownia']
  },
  {
    slug: 'radom',
    name: 'Radom',
    loc: 'w Radomiu',
    gen: 'Radomia',
    region: 'województwo mazowieckie',
    intro: 'Radom to duże miasto na południu Mazowsza. Rynek pracy tworzą przemysł, handel, usługi i instytucje publiczne. Część mieszkańców szuka też pracy w Warszawie lub w okolicy stolicy.',
    tips: [
      'Jeśli rozważasz pracę w Warszawie, napisz w CV, że jesteś gotów dojeżdżać, i podaj sposób dojazdu.',
      'W zakładach produkcyjnych liczy się dyspozycyjność do pracy zmianowej. Zaznacz ją wprost.',
      'Wymień uprawnienia, które masz, na przykład prawo jazdy, uprawnienia SEP czy na wózki widłowe. W ofertach lokalnych firm często są wymagane.'
    ],
    near: ['Pionki', 'Kozienice', 'Jedlińsk']
  },
  {
    slug: 'rzeszow',
    name: 'Rzeszów',
    loc: 'w Rzeszowie',
    gen: 'Rzeszowa',
    region: 'województwo podkarpackie',
    intro: 'Rzeszów jest centrum Doliny Lotniczej, czyli skupiska firm z branży lotniczej. Rynek pracy tworzą tu przemysł, firmy IT, usługi i uczelnie. W okolicy działają też strefy przemysłowe.',
    tips: [
      'Jeśli masz doświadczenie w produkcji, obróbce metali lub kontroli jakości, opisz je szczegółowo. W firmach z branży lotniczej to ważne.',
      'Wymień kursy i uprawnienia techniczne, na przykład obsługę maszyn CNC czy czytanie rysunku technicznego.',
      'Jeśli dojeżdżasz z Łańcuta, Strzyżowa lub Boguchwały, podaj miejscowość i sposób dojazdu.'
    ],
    near: ['Łańcut', 'Strzyżów', 'Boguchwała']
  },
  {
    slug: 'torun',
    name: 'Toruń',
    loc: 'w Toruniu',
    gen: 'Torunia',
    region: 'województwo kujawsko-pomorskie',
    intro: 'Toruń razem z Bydgoszczą tworzy dwubiegunowy ośrodek regionu kujawsko-pomorskiego. Jest dużym ośrodkiem akademickim, a rynek pracy tworzą przemysł, usługi, handel i turystyka związana z zabytkowym Starym Miastem.',
    tips: [
      'Jeśli możesz pracować także w Bydgoszczy, napisz to w CV. Masz wtedy do wyboru więcej ofert.',
      'W turystyce i gastronomii ruch jest większy w sezonie. Zaznacz dostępność w weekendy i w miesiącach letnich.',
      'Studenci i absolwenci powinni opisać praktyki, staże i projekty z uczelni. W mieście akademickim pracodawcy często zatrudniają młodych ludzi.'
    ],
    near: ['Bydgoszcz', 'Chełmża', 'Ciechocinek']
  },
  {
    slug: 'kielce',
    name: 'Kielce',
    loc: 'w Kielcach',
    gen: 'Kielc',
    region: 'województwo świętokrzyskie',
    intro: 'Kielce to stolica województwa świętokrzyskiego, znana z Targów Kielce. Rynek pracy tworzą przemysł, budownictwo, handel, usługi i instytucje publiczne.',
    tips: [
      'Jeśli masz doświadczenie w organizacji wydarzeń, obsłudze klienta lub montażu stoisk, wpisz je w CV. Przy targach takie umiejętności są przydatne.',
      'W budownictwie i przemyśle liczą się uprawnienia. Wymień je konkretnie, razem z datą ważności.',
      'Jeśli dojeżdżasz z Chęcin, Morawicy lub Masłowa, podaj miejscowość i sposób dojazdu.'
    ],
    near: ['Chęciny', 'Morawica', 'Masłów']
  },
  {
    slug: 'olsztyn',
    name: 'Olsztyn',
    loc: 'w Olsztynie',
    gen: 'Olsztyna',
    region: 'województwo warmińsko-mazurskie',
    intro: 'Olsztyn to stolica Warmii i Mazur, regionu znanego z jezior i turystyki. Rynek pracy tworzą usługi, handel, przemysł, uczelnie i instytucje publiczne. W sezonie letnim przybywa ofert w turystyce i gastronomii.',
    tips: [
      'Oferty w turystyce i gastronomii są często sezonowe. Zaznacz w CV, w jakich miesiącach możesz pracować.',
      'Jeśli znasz języki obce, wpisz je. W obsłudze turystów to dodatkowy atut.',
      'Jeśli dojeżdżasz z Barczewa, Olsztynka lub Dywit, podaj miejscowość i sposób dojazdu.'
    ],
    near: ['Barczewo', 'Olsztynek', 'Dywity']
  }
];
