// FAQ pod poradnikami (PR J, część 1: 10 poradników bez FAQ; część 2: kolejne 5). Krótkie, rzeczowe odpowiedzi zgodne z treścią poradnika;
// widoczne w HTML (faqHtml) i tylko wtedy w JSON-LD FAQPage (lib/seo.js: faqLd). Bez obietnic i liczb bez źródła.
export const ARTICLE_FAQ = {
  'jak-dopasowac-cv-do-ogloszenia': [
    { q: 'Czy trzeba dopasowywać CV do każdego ogłoszenia?', a: 'Warto. Wystarczy przesunąć na górę obowiązki pasujące do oferty, użyć słów z ogłoszenia (jeśli są prawdą o Tobie) i skrócić to, co oferty nie dotyczy. Zapisuj każdą wersję jako osobny plik.' },
    { q: 'Czy mogę skopiować wymagania z ogłoszenia do CV?', a: 'Tylko te, które naprawdę spełniasz, i najlepiej z dowodem: gdzie i kiedy to robiłeś. Przepisanie całej listy wymagań bez pokrycia rekruter szybko zauważy na rozmowie.' },
    { q: 'Co zrobić, gdy nie spełniam wszystkich wymagań?', a: 'Pokaż to, co masz najbliżej, na przykład podobne zadanie w innej branży. Wymagania „mile widziane” nie są konieczne. Nie dopisuj umiejętności, których nie masz.' },
    { q: 'Czy list motywacyjny też trzeba dopasować?', a: 'Tak. List odnosi się do dwóch lub trzech najważniejszych wymagań z ogłoszenia i podaje przykład przy każdym. Ogólny list wysyłany wszędzie mówi rekruterowi niewiele.' },
  ],
  'czym-jest-ats': [
    { q: 'Czy ATS sam odrzuca CV?', a: 'To zależy od systemu i ustawień firmy. Najczęściej rekruterzy przeszukują i filtrują zgłoszenia w systemie, a decyzję podejmuje człowiek. Dlatego CV musi być czytelne zarówno dla systemu, jak i dla osoby.' },
    { q: 'Jaki szablon CV jest najbezpieczniejszy dla ATS?', a: 'Prosty, jednokolumnowy, ze standardowymi nazwami sekcji (Doświadczenie zawodowe, Wykształcenie, Umiejętności). Ważne informacje nie powinny być w tabelach, obrazkach ani nagłówku strony.' },
    { q: 'Czy CV w PDF jest dobre dla ATS?', a: 'Tak, jeśli to PDF z tekstem, który da się zaznaczyć. Skan albo zdjęcie dokumentu system odczyta słabo lub wcale. Gdy pracodawca prosi o plik Word, wyślij Word.' },
    { q: 'Jak sprawdzić, czy moje CV jest czytelne dla systemu?', a: 'Zaznacz cały tekst w PDF i wklej go do notatnika. Jeśli kolejność jest logiczna i nic nie zniknęło, system też powinien go odczytać. Możesz też użyć darmowego testu CV pod ATS.' },
  ],
  'jak-napisac-list-motywacyjny': [
    { q: 'Jak długi powinien być list motywacyjny?', a: 'Na jedną stronę: zwykle trzy lub cztery krótkie akapity. Dłuższe listy rzadko są czytane w całości.' },
    { q: 'Jak zacząć list, gdy nie znam nazwiska rekrutera?', a: 'Użyj formy „Szanowni Państwo”. Jeśli ogłoszenie podaje nazwisko osoby prowadzącej rekrutację, zwróć się do niej bezpośrednio.' },
    { q: 'Co napisać w środku listu?', a: 'Wybierz dwa lub trzy najważniejsze wymagania z ogłoszenia i przy każdym podaj konkretny przykład z pracy: co zrobiłeś i z jakim skutkiem. Nie powtarzaj całego CV.' },
    { q: 'Czy list motywacyjny jest zawsze potrzebny?', a: 'Nie zawsze. Dołącz go, gdy ogłoszenie o niego prosi, gdy zmieniasz branżę albo chcesz wyjaśnić coś, czego nie widać w CV.' },
  ],
  'cv-bez-doswiadczenia': [
    { q: 'Co wpisać w CV, jeśli nie mam doświadczenia zawodowego?', a: 'Praktyki, pracę sezonową, zlecenia, korepetycje, wolontariat, projekty i działalność w organizacjach. Opisz je jak pracę: co robiłeś i czego się nauczyłeś.' },
    { q: 'Od czego zacząć CV bez doświadczenia?', a: 'Od krótkiego podsumowania, a pod nim od wykształcenia, jeśli to Twój najmocniejszy punkt. Dalej praktyki, projekty i aktywności.' },
    { q: 'Ile stron powinno mieć pierwsze CV?', a: 'Zwykle jedną. Lepiej mniej, ale konkretnie, niż wypełniać miejsce ogólnikami lub długą listą zainteresowań.' },
    { q: 'Jak opisać umiejętności, żeby były wiarygodne?', a: 'Podawaj programy, narzędzia i języki z poziomem (np. „angielski B2”) i napisz, do czego ich używałeś. Cechy takie jak praca w zespole pokaż przykładem, nie samym hasłem.' },
  ],
  'cv-po-angielsku': [
    { q: 'Kiedy wysłać CV po angielsku?', a: 'Gdy ogłoszenie jest po angielsku albo pracodawca wprost prosi o CV w tym języku. Przy polskim ogłoszeniu w polskiej firmie zwykle wystarczy CV po polsku.' },
    { q: 'Czy w angielskim CV dodaje się zdjęcie?', a: 'W wielu krajach anglojęzycznych, na przykład w Wielkiej Brytanii i USA, zwykle nie dodaje się zdjęcia ani daty urodzenia. Wystarczą imię, nazwisko i dane kontaktowe.' },
    { q: 'Jak zapisywać daty w CV po angielsku?', a: 'Najbezpieczniej z nazwą miesiąca, np. „Mar 2022 – Jun 2024”, bo zapis liczbowy bywa różnie odczytywany w różnych krajach.' },
    { q: 'Jak nazwać sekcje w angielskim CV?', a: 'Standardowo: Summary lub Profile, Work Experience, Education, Skills, Languages. Porządek jak w polskim CV: od najnowszego stanowiska.' },
  ],
  'przerwa-w-zatrudnieniu-w-cv': [
    { q: 'Czy trzeba tłumaczyć przerwę w zatrudnieniu w CV?', a: 'Krótka przerwa między pracami zwykle nie wymaga komentarza. Dłuższą warto opisać jednym wierszem: okres i powód, bez tłumaczenia się.' },
    { q: 'Jak zapisać przerwę w CV?', a: 'Na przykład „01.2023 – 09.2023: urlop rodzicielski” albo „2022: opieka nad członkiem rodziny”. Nie zmieniaj dat zatrudnienia, żeby zakryć lukę.' },
    { q: 'Co dopisać, jeśli w czasie przerwy się uczyłem?', a: 'Kursy, zlecenia, wolontariat, projekty albo naukę języka. Takie punkty pokazują, że nie straciłeś kontaktu z zawodem.' },
    { q: 'Jak odpowiedzieć na pytanie o przerwę na rozmowie?', a: 'Przygotuj dwa lub trzy zdania: co się działo, czym się zajmowałeś i dlaczego teraz wracasz do pracy. Mów spokojnie i rzeczowo.' },
  ],
  'ile-stron-powinno-miec-cv': [
    { q: 'Czy CV może mieć dwie strony?', a: 'Tak, przy dłuższej karierze i wielu stanowiskach dwie strony są w porządku. Przy kilku latach doświadczenia zwykle wystarcza jedna.' },
    { q: 'Jak skrócić za długie CV?', a: 'Stare stanowiska opisz jedną linijką, usuń powtarzające się punkty i ogólniki, a szczegóły zostaw dla ostatnich lat i prac związanych z ogłoszeniem.' },
    { q: 'Czy zmniejszyć czcionkę, żeby CV zmieściło się na jednej stronie?', a: 'Nie. Mała czcionka i wąskie marginesy utrudniają czytanie. Lepiej skrócić treść pod konkretną ofertę.' },
    { q: 'Co, jeśli na drugiej stronie zostało kilka linijek?', a: 'Skróć CV do jednej strony albo uzupełnij drugą o ważne informacje. Pół linijki na drugiej stronie wygląda na niedopracowanie.' },
  ],
  'zdjecie-w-cv': [
    { q: 'Czy zdjęcie w CV jest obowiązkowe?', a: 'Nie. To dodatkowa informacja, którą możesz podać, ale nie musisz. Pomiń je, gdy ogłoszenie prosi o CV bez zdjęcia.' },
    { q: 'Jakie zdjęcie wybrać do CV?', a: 'Aktualny portret od ramion w górę, na jasnym tle, z wyraźnie oświetloną twarzą. Bez filtrów, selfie z wyciągniętej ręki i zdjęć z innymi osobami.' },
    { q: 'Czy można zrobić zdjęcie do CV telefonem?', a: 'Tak. Dobre zdjęcie da się zrobić telefonem przy oknie, na jasnym tle, w stroju, w jakim poszedłbyś na rozmowę.' },
    { q: 'Czy dodawać zdjęcie do CV za granicę?', a: 'W wielu krajach, na przykład w Wielkiej Brytanii i USA, zdjęć w CV się nie dodaje. Sprawdź zwyczaje kraju i treść ogłoszenia.' },
  ],
  'klauzula-rodo-w-cv': [
    { q: 'Czy klauzula RODO w CV jest obowiązkowa?', a: 'Nie zawsze. Dane z Kodeksu pracy pracodawca może przetwarzać bez zgody. Klauzula ma znaczenie, gdy podajesz więcej danych (np. zdjęcie) albo gdy ogłoszenie o nią prosi.' },
    { q: 'Jakie jest aktualne brzmienie klauzuli?', a: '„Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji zgodnie z art. 6 ust. 1 lit. a Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679.” Starsze wersje odwołujące się do dawnej ustawy o ochronie danych osobowych są nieaktualne.' },
    { q: 'Co, jeśli pracodawca podaje własną klauzulę?', a: 'Użyj dokładnie tej treści, w całości, i sprawdź, czy nazwa firmy się zgadza.' },
    { q: 'Gdzie umieścić klauzulę w CV?', a: 'Na samym dole ostatniej strony, mniejszą czcionką. Nie powinna przesuwać treści na kolejną stronę.' },
  ],
  'jak-przejsc-przez-ats': [
    { q: 'Jak szybko sprawdzić, czy CV przejdzie przez ATS?', a: 'Zaznacz cały tekst w PDF i wklej go do notatnika. Sprawdź, czy kolejność jest logiczna i czy nic nie zniknęło – mniej więcej tak widzi go system.' },
    { q: 'Czy tabele i kolumny przeszkadzają systemom ATS?', a: 'Mogą. Tekst w kilku kolumnach, tabelach i polach tekstowych bywa odczytywany w złej kolejności. Najbezpieczniejszy jest prosty, jednokolumnowy układ.' },
    { q: 'Czy trzeba poprawiać formularz po wgraniu CV?', a: 'Tak, zawsze go przejrzyj. Systemy potrafią źle przypisać daty, nazwy firm i stanowisk.' },
    { q: 'Jak dobrać słowa kluczowe pod ATS?', a: 'Wypisz z ogłoszenia stanowisko, narzędzia, uprawnienia i języki. Te, które naprawdę masz, umieść w CV w takiej samej formie jak w ogłoszeniu.' },
  ],
  'umiejetnosci-miekkie-i-twarde-w-cv': [
    { q: 'Czym różnią się umiejętności twarde od miękkich?', a: 'Twarde da się sprawdzić: program, język obcy, prawo jazdy, obsługa maszyny. Miękkie dotyczą pracy z ludźmi i organizacji, na przykład komunikacja czy planowanie.' },
    { q: 'Jak wpisać poziom języka obcego?', a: 'Podaj język i poziom według skali europejskiej, np. „niemiecki B1”. Paski i gwiazdki są trudne do odczytania i nie mówią rekruterowi, co naprawdę potrafisz.' },
    { q: 'Jak pokazać umiejętności miękkie, żeby były wiarygodne?', a: 'Przykładem w opisie doświadczenia, a nie samym hasłem. Zamiast „praca w zespole” napisz, co konkretnie robiłeś z innymi, na przykład że koordynowałeś grafik zmian.' },
    { q: 'Ile umiejętności wpisać do CV?', a: 'Nie ma sztywnej liczby. Lepiej kilka trafnych pozycji z ogłoszenia niż długa lista. Wpisuj tylko to, o czym swobodnie opowiesz na rozmowie.' },
  ],
  'podsumowanie-zawodowe-w-cv': [
    { q: 'Jak długie powinno być podsumowanie zawodowe?', a: 'Dwa lub trzy zdania. Dłuższy blok tekstu rekruter zwykle przeskakuje.' },
    { q: 'Co napisać w podsumowaniu, jeśli nie mam doświadczenia?', a: 'Kierunek nauki, praktyki lub projekty i jedno lub dwa wymagania z ogłoszenia, które spełniasz. Na końcu napisz, jakiej pracy szukasz.' },
    { q: 'Czy podsumowanie trzeba zmieniać pod każdą ofertę?', a: 'Warto. Wystarczy podmienić nazwę stanowiska i przestawić umiejętności tak, żeby odpowiadały wymaganiom z ogłoszenia.' },
    { q: 'Czego unikać w podsumowaniu?', a: 'Ogólników pasujących do każdego, np. „ambitna, sumienna osoba”, pisania o sobie w trzeciej osobie i powtarzania całego CV.' },
  ],
  'jak-przygotowac-sie-do-rozmowy-kwalifikacyjnej': [
    { q: 'Od czego zacząć przygotowanie do rozmowy?', a: 'Od ogłoszenia i CV, które wysłałeś do tej firmy. Rekruter pyta o to, co w nim jest. Przy każdym wymaganiu zastanów się, jak pokażesz, że je spełniasz.' },
    { q: 'Ile przykładów z pracy przygotować?', a: 'Cztery lub pięć sytuacji: sukces, trudny problem, konflikt i błąd, z którego coś wyniosłeś. Do większości pytań da się dopasować któryś z nich.' },
    { q: 'Jakie pytania zadać rekruterowi na końcu rozmowy?', a: 'Dwa lub trzy, np. o pierwsze tygodnie pracy, zespół albo sposób oceniania wyników. Pytania o firmę pokazują, że myślisz o tej pracy poważnie.' },
    { q: 'Jak przygotować się do rozmowy online?', a: 'Sprawdź wcześniej link, kamerę, mikrofon i połączenie. Usiądź w cichym miejscu z jasnym tłem i miej pod ręką CV oraz notatki.' },
  ],
  'pytania-na-rozmowie-kwalifikacyjnej-metoda-star': [
    { q: 'Na czym polega metoda STAR?', a: 'To sposób układania odpowiedzi w czterech krokach: sytuacja, zadanie, działanie i rezultat. Najwięcej czasu poświęć działaniu, czyli temu, co zrobiłeś Ty.' },
    { q: 'Jak odpowiedzieć na „Proszę opowiedzieć coś o sobie”?', a: 'W minutę lub dwie: czym się zajmujesz, co robiłeś ostatnio i dlaczego aplikujesz na to stanowisko. Nie powtarzaj CV punkt po punkcie.' },
    { q: 'Co powiedzieć o słabych stronach?', a: 'Coś prawdziwego, ale nie kluczowego dla tej pracy, i co z tym robisz. Odpowiedzi w stylu „jestem perfekcjonistą” rekruterzy słyszą bardzo często.' },
    { q: 'Czy uczyć się odpowiedzi na pamięć?', a: 'Lepiej nie. Przygotuj odpowiedzi w punktach i powiedz je kilka razy na głos. Brzmią wtedy naturalnie, a nie jak recytacja.' },
  ],
  'email-z-aplikacja-i-podziekowanie-po-rozmowie': [
    { q: 'Co wpisać w temacie e-maila z CV?', a: 'Nazwę stanowiska oraz imię i nazwisko, np. „Aplikacja: Specjalista ds. zakupów, Anna Kowalska”. Jeśli ogłoszenie ma numer referencyjny, dodaj go.' },
    { q: 'Czy treść maila z aplikacją może być krótka?', a: 'Tak, wystarczy kilka zdań: na jakie stanowisko aplikujesz, gdzie znalazłeś ogłoszenie, dlaczego pasujesz i że CV jest w załączniku.' },
    { q: 'Kiedy wysłać podziękowanie po rozmowie?', a: 'Tego samego dnia albo następnego. Podziękuj za czas, nawiąż do jednej rzeczy z rozmowy i potwierdź, że nadal jesteś zainteresowany.' },
    { q: 'Jak nazwać plik z CV?', a: 'Imieniem i nazwiskiem, np. „Anna_Kowalska_CV.pdf”. Wysyłaj PDF, chyba że pracodawca prosi o inny format.' },
  ],
};
