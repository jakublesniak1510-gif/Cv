// Wersje językowe darmowych narzędzi: /<język>/<segment>/<slugLang>, powiązane z polską wersją przez hreflang.
// Same narzędzia działają w przeglądarce (public/app.js); tu są teksty na stronę: tytuł, opis, wstęp, „o narzędziu” i FAQ.
// Tytuły do 60 znaków, opisy do 155 (Google ucina dłuższe). Generowane dokumenty (podziękowanie, wypowiedzenie) zostają po polsku.
export const TOOL_LANGS = {
  en: {
    seg: 'tools',
    data: {
      'skaner-cv': {
        slugLang: 'cv-scanner',
        title: 'Free CV scanner: does your CV match the job ad?',
        metaDescription: 'Free online CV scanner, no sign-up: upload your CV, paste the job ad and see the match score, missing requirements and the keywords an ATS looks for.',
        lead: 'Upload your current CV (PDF, Word or TXT) and paste a link to the job ad or its text. In a few seconds you will see which requirements you meet, what is missing from your CV and what to improve. We do not store the file or the CV text.',
        about: [
          'Recruiters and ATS systems that pre-screen applications look for the words from the job ad in your CV: job titles, software, licences and duties. If you have the experience but describe it in different words than the employer, your CV may be skipped. The scanner compares your CV with a specific ad and shows what matches and what is missing.',
          'The result is a match percentage, the list of requirements you meet, the list of requirements not visible in your CV and three concrete tips. Each gap comes with a short hint on how to fill it, if you really have that experience. We never add anything for you.',
          'The scanner works with ads in Polish, English, German and Ukrainian from most job boards (Pracuj.pl, OLX, Indeed, LinkedIn and others). If the link cannot be fetched, paste the ad text yourself.',
          'If you then want a CV written for that ad, one click moves the data from your file and the ad text into the form. A tailored CV costs from 39 PLN, no subscription, with a free revision.',
        ],
        faq: [
          { q: 'Is the CV scanner really free?', a: 'Yes. No sign-up, account or email needed. There is a limit of a few checks per hour so the tool stays fast for everyone.' },
          { q: 'What happens to my file?', a: 'The file is used once to compare it with the ad. We do not store the file or the CV text. Only the result (percentage, keywords and tips) is kept in server memory for up to an hour and then deleted; if you ask, we email it to you. If you later order a CV, the data goes into the form and the order is deleted after 30 days.' },
          { q: 'Is this an ATS test?', a: 'The scanner checks what ATS systems and recruiters check: whether the requirements and keywords from the ad appear in your CV. It does not replicate a specific company system, so treat the result as a guide to what to add.' },
          { q: 'Which files does it accept?', a: 'PDF, Word (.docx) and plain text (.txt), up to 5 MB. Scans and photos of a CV will not work because the text cannot be read from them.' },
        ],
      },
      'klauzula-rodo': {
        slugLang: 'gdpr-clause-cv',
        title: 'GDPR clause for a CV in Poland: free generator',
        metaDescription: 'Free generator of the GDPR consent clause for a CV in Poland: current wording in Polish, English and German, with an option for future recruitments.',
        lead: 'Choose a version and copy the ready clause to the end of your CV. If the employer gives their own wording in the ad, use theirs.',
        about: [
          'The GDPR clause is a short consent to processing personal data for recruitment. Since 2019 a Polish employer may process basic CV data without consent, but many companies still ask for it in the ad, especially when the CV contains extra information such as a photo or interests.',
          'The generator gives the current wording in Polish, English and German. You can add the company name and consent to future recruitments if you want the employer to come back to your CV for other openings.',
          'Paste the clause at the very bottom of your CV in a smaller font. If the ad gives its own wording, use exactly that one.',
        ],
        faq: [
          { q: 'Is the GDPR clause mandatory in a CV in Poland?', a: 'Not always. The employer may process basic CV data without consent, but if the ad requires the clause, add it, otherwise your CV may be skipped.' },
          { q: 'Where do I put the GDPR clause?', a: 'At the very bottom of the last page, in a smaller font than the rest of the text.' },
          { q: 'Do I add the clause to an English CV too?', a: 'When applying to a Polish company, yes, in the English version. For jobs abroad it is usually not needed unless the ad asks for it.' },
        ],
      },
      'kalkulator-wynagrodzen': {
        slugLang: 'net-salary-calculator-poland',
        title: 'Net salary calculator Poland: gross to net (2026)',
        metaDescription: 'Free gross-to-net salary calculator for an employment contract in Poland: social security, health insurance, income tax, under-26 relief, commuting costs.',
        lead: 'Check how much of a job offer you will actually receive in Poland before you discuss pay. The result is an estimate for a typical employment contract (umowa o pracę).',
        about: [
          'The calculator converts gross pay into net pay for an employment contract in Poland. It deducts pension, disability and sickness contributions, the health insurance contribution and the income tax advance, taking the tax-free amount into account.',
          'You can tick the under-26 relief (no income tax up to a limit) and increased deductible costs if you commute from another town. The result is an estimate for a standard full-time job without extra pay components.',
          'Knowing the net amount matters before a salary talk: job ads and interviews in Poland usually quote gross pay, while what counts for you is what lands in your account.',
        ],
        faq: [
          { q: 'How much is net from gross in Poland?', a: 'On an employment contract the net amount is usually about 70–75% of gross. The exact figure depends on the salary, reliefs and deductible costs, so it is worth checking in the calculator.' },
          { q: 'Does the calculator include the under-26 relief?', a: 'Yes. Tick it if you are under 26. Up to the relief limit no income tax advance is deducted.' },
          { q: 'Does it work for B2B or a contract of mandate?', a: 'No. It calculates pay for an employment contract. Other contracts have different contributions and tax rules.' },
        ],
      },
      'podziekowanie-po-rozmowie': {
        slugLang: 'thank-you-email-after-interview',
        title: 'Thank-you email after an interview in Poland (free)',
        metaDescription: 'Free generator of a thank-you email after an interview with a Polish employer. Enter the position and company and get a short, polite message in Polish.',
        lead: 'A short thank-you sent within a day of the interview reminds the recruiter of you and shows you care about the job. The message is generated in Polish, ready to send to a Polish employer.',
        about: [
          'A short thank-you email after an interview is a simple way to stand out from other candidates. It reminds the recruiter of you and shows that you care about the job.',
          'The generator writes a polite message in Polish based on the position, company name and the name of the person you spoke to. You can add one topic from the interview that interested you so the message does not sound like a template.',
          'Send the thank-you within 24 hours of the interview. Three or four sentences are enough.',
        ],
        faq: [
          { q: 'Is it appropriate to send a thank-you after an interview in Poland?', a: 'Yes. It is a polite gesture that recruiters receive well, and many candidates skip it.' },
          { q: 'When should I send it?', a: 'Ideally the same day or the next, during working hours.' },
          { q: 'Who should I send it to?', a: 'To the person who led the interview or arranged it. If several people took part, one message to the main recruiter is enough.' },
        ],
      },
      'wypowiedzenie-umowy-o-prace': {
        slugLang: 'resignation-letter-poland',
        title: 'Resignation letter in Poland: free template generator',
        metaDescription: 'Free resignation letter generator for an employment contract in Poland: notice period calculated automatically, mutual-agreement version, ready to print.',
        lead: 'Enter your details and get a ready letter in Polish to print and sign. We calculate the notice period from your length of service with the employer and the type of contract.',
        about: [
          'The generator prepares the letter with which an employee terminates an employment contract in Poland. You enter your details, the employer details and the start date, and the notice period is calculated automatically from your length of service with that employer.',
          'Under the Polish Labour Code the notice period for permanent and fixed-term contracts is 2 weeks for less than 6 months of employment, 1 month for at least 6 months and 3 months for at least 3 years. You can also choose a version proposing termination by mutual agreement on an earlier date.',
          'Print the letter in two copies, sign it and ask the employer to confirm receipt on your copy.',
        ],
        faq: [
          { q: 'From when does the notice period count?', a: 'A period counted in weeks ends on a Saturday, one counted in months on the last day of the month. So it runs from the day the employer received the letter to the nearest such end.' },
          { q: 'Do I have to give a reason?', a: 'No. An employee does not have to give a reason for terminating the contract.' },
          { q: 'Can I leave earlier than the notice period?', a: 'Yes, if the employer agrees. Then the contract ends by mutual agreement on the agreed date.' },
        ],
      },
      'zdjecie-do-cv': {
        slugLang: 'cv-photo-check',
        title: 'CV photo check: is your photo good enough? (free)',
        metaDescription: 'Upload a photo and AI will tell you whether it suits a CV: framing, background, light, outfit and expression, with concrete tips. We do not store photos.',
        lead: 'Upload the photo you want to put in your CV. We will assess the framing, background, light, outfit and expression and suggest what to improve. We do not store photos.',
        about: [
          'A photo in a CV is not mandatory, but if you add one it should work in your favour. The tool assesses the uploaded photo for framing, background, lighting, outfit and expression, then suggests what to improve.',
          'A good CV photo shows the face and shoulders, has a bright, calm background and even light, and the outfit fits the job. It does not need a studio: a phone, a window with soft light and a plain wall are enough.',
          'We do not store photos. The assessment is for you only and disappears when you close the page.',
        ],
        faq: [
          { q: 'Is a photo required in a CV?', a: 'No. In Poland a photo is optional. For applications to the UK or USA it is better to leave it out, while in Germany it is common.' },
          { q: 'What background should I choose?', a: 'Bright and plain, without patterns or objects in the frame. A white or light grey wall works best.' },
          { q: 'Can I use a holiday photo?', a: 'Better not. A CV photo should be neutral, with the face turned to the camera and an outfit that fits the job.' },
        ],
      },
      'jaki-zawod-dla-mnie': {
        slugLang: 'which-job-suits-me',
        title: 'Which job suits me? Free 10-question quiz',
        metaDescription: 'Answer 10 short questions and see 3 jobs that match how you like to work, with tips on how to write a CV for each of them.',
        lead: 'Answer 10 short questions about how you like to work. We will show 3 jobs that may suit you and tell you how to write a CV for each of them.',
        about: [
          'The quiz helps when you do not know which kind of work you would feel good in. You answer 10 short questions, for example whether you prefer people or data, moving around or a desk, a fixed plan or flexibility.',
          'At the end we show three jobs that match your answers, with links to tips on writing a CV for each of them and to sample CVs.',
          'The quiz will not replace a career adviser, but it works well as a starting point, for example when choosing a first job or changing industry.',
        ],
        faq: [
          { q: 'Is the quiz free?', a: 'Yes, no sign-up. Answers are not stored.' },
          { q: 'How long does it take?', a: 'About two minutes: 10 questions with ready answers to choose from.' },
          { q: 'What next after picking a job?', a: 'Open the job page, read the keywords and CV tips, then look for ads and prepare a CV for a specific offer.' },
        ],
      },
      'odpowiedzi-na-pytania-rekrutera': {
        slugLang: 'interview-questions-answers',
        title: 'Interview questions: sample answers for your job (free)',
        metaDescription: 'Pick a typical interview question, enter the position and a few facts about yourself, and get a sample answer with tips on what to avoid.',
        lead: 'Pick a question, enter the position and a few facts about yourself. You will get a sample answer based on your experience and tips on what to avoid.',
        about: [
          'The same dozen or so questions come up in most interviews, for example “Tell me about yourself” or “What are your weaknesses?”. A good answer is based on your real experience, not a memorised formula.',
          'Pick a question, enter the position and a few facts about yourself. You will get a sample answer based on what you entered and tips on what to avoid. Practise it out loud and adapt it to your own style.',
          'For questions about specific situations the STAR method works well: situation, task, action and result.',
        ],
        faq: [
          { q: 'How do I answer the question about weaknesses?', a: 'Give a real weakness that is not key for the job and say what you are doing to improve it.' },
          { q: 'How long should “Tell me about yourself” take?', a: 'About a minute: your current job, the most relevant experience for the position and why you are applying.' },
          { q: 'Can I learn the answers by heart?', a: 'Better to remember the main points, not whole sentences. An answer said naturally sounds more credible.' },
        ],
      },
      'oferty-pracy-na-maila': {
        slugLang: 'job-alerts-email',
        title: 'Job alerts by email: new offers in Poland every week',
        metaDescription: 'Enter a job and city in Poland and every Monday get an email with links to new job offers on Pracuj.pl, OLX and Indeed plus a CV tip. Free for 12 weeks.',
        lead: 'Enter a job and city, and every Monday you will get an email with links to the latest offers on Pracuj.pl, OLX and Indeed plus a short CV tip. Free for 12 weeks, unsubscribe with one click.',
        about: [
          'Instead of browsing job boards every day, enter a job and city, and every Monday you will get an email with links to the newest ads on Pracuj.pl, OLX and Indeed.',
          'Each email also includes a short tip on tailoring your CV to an ad. The emails run for 12 weeks and you can stop them with one click in any message.',
          'When you find an interesting ad, paste it into the form and we will prepare a CV written for that offer.',
        ],
        faq: [
          { q: 'Are the job alerts paid?', a: 'No, the emails are free.' },
          { q: 'How do I unsubscribe?', a: 'Click the unsubscribe link at the bottom of any email.' },
          { q: 'Which job boards do the offers come from?', a: 'The links lead to search results on Pracuj.pl, OLX and Indeed for the job and city you entered.' },
        ],
      },
    },
  },
  uk: {
    seg: 'instrumenty',
    data: {
      'skaner-cv': {
        slugLang: 'skaner-rezyume',
        title: 'Безкоштовний сканер резюме: чи підходить до вакансії',
        metaDescription: 'Безкоштовний сканер резюме без реєстрації: завантажте резюме, вставте оголошення і побачите відсоток відповідності, відсутні вимоги та ключові слова ATS.',
        lead: 'Завантажте своє резюме (PDF, Word або TXT) і вставте посилання на оголошення або його текст. За кілька секунд побачите, яким вимогам відповідаєте, чого не видно в резюме і що покращити. Файл і текст резюме не зберігаємо.',
        about: [
          'Рекрутер і система ATS, яка попередньо переглядає заявки, шукають у резюме слова з оголошення: назви посад, програми, посвідчення й обов’язки. Якщо у вас є досвід, але ви описуєте його іншими словами, ніж роботодавець, резюме можуть пропустити. Сканер порівнює ваше резюме з конкретним оголошенням і показує, що збігається, а чого бракує.',
          'Результат: відсоток відповідності, список виконаних вимог, список вимог, яких не видно в резюме, і три конкретні поради. Кожна прогалина має підказку, як її заповнити, якщо такий досвід у вас справді є. Ми нічого не дописуємо за вас.',
          'Сканер працює з оголошеннями польською, англійською, німецькою та українською з більшості порталів (Pracuj.pl, OLX, Indeed, LinkedIn та інших). Якщо посилання не вдається завантажити, вставте текст оголошення самостійно.',
          'Якщо після перевірки хочете резюме, написане під це оголошення, одним натисканням перенесете дані з файлу і текст оголошення у форму. Резюме під оголошення коштує від 39 зл, без підписки, з безкоштовною правкою.',
        ],
        faq: [
          { q: 'Чи сканер резюме справді безкоштовний?', a: 'Так. Без реєстрації, акаунта та e-mail. Є ліміт кількох перевірок на годину, щоб інструмент працював швидко для всіх.' },
          { q: 'Що відбувається з моїм файлом?', a: 'Файл використовується один раз для порівняння з оголошенням. Ми не зберігаємо ні файл, ні текст резюме. Лише результат (відсоток, ключові слова й поради) зберігається в пам’яті сервера до години, потім видаляється; на ваше прохання надсилаємо його e-mailом. Якщо потім замовите резюме, дані з файлу потраплять у форму, а замовлення видаляємо через 30 днів.' },
          { q: 'Це тест ATS?', a: 'Сканер перевіряє те, що перевіряють системи ATS і рекрутери: чи є в резюме вимоги та ключові слова з оголошення. Він не відтворює конкретну систему компанії, тож результат — це підказка, що доповнити.' },
          { q: 'Які файли приймає сканер?', a: 'PDF, Word (.docx) і звичайний текст (.txt), до 5 МБ. Скани та фото резюме не спрацюють, бо з них не можна прочитати текст.' },
        ],
      },
      'klauzula-rodo': {
        slugLang: 'klauzula-rodo',
        title: 'Клаузула RODO для резюме в Польщі: генератор',
        metaDescription: 'Безкоштовний генератор клаузули RODO (згоди на обробку даних) для резюме в Польщі: актуальне формулювання польською, англійською та німецькою.',
        lead: 'Оберіть версію і скопіюйте готову клаузулу в кінець резюме. Якщо роботодавець подає власне формулювання в оголошенні, використайте його.',
        about: [
          'Клаузула RODO — це коротка згода на обробку персональних даних для рекрутингу. З 2019 року польський роботодавець може обробляти основні дані з резюме без згоди, але багато компаній досі просять про неї в оголошенні, особливо коли резюме містить додаткову інформацію, наприклад фото чи інтереси.',
          'Генератор подає актуальне формулювання польською, англійською та німецькою. Можна додати назву компанії та згоду на участь у майбутніх рекрутингах, якщо хочете, щоб роботодавець міг повернутися до вашого резюме при наступних вакансіях.',
          'Готову клаузулу вставте в самий низ резюме меншим шрифтом. Якщо оголошення подає власний текст згоди, використайте саме його.',
        ],
        faq: [
          { q: 'Чи клаузула RODO в резюме обов’язкова?', a: 'Не завжди. Роботодавець може обробляти основні дані з резюме без згоди, але якщо оголошення вимагає клаузули, додайте її, інакше резюме можуть пропустити.' },
          { q: 'Де розмістити клаузулу RODO в резюме?', a: 'У самому низу останньої сторінки, меншим шрифтом, ніж решта тексту.' },
          { q: 'Чи в резюме англійською теж додають клаузулу?', a: 'При заявці до польської компанії — так, в англійській версії. Для роботи за кордоном зазвичай не потрібна, якщо не просить оголошення.' },
        ],
      },
      'kalkulator-wynagrodzen': {
        slugLang: 'kalkulyator-zarplaty-polshcha',
        title: 'Калькулятор зарплати в Польщі: брутто → нетто',
        metaDescription: 'Безкоштовний калькулятор брутто-нетто для трудового договору в Польщі: внески ZUS, медичний внесок, аванс PIT, пільга до 26 років, витрати на проїзд.',
        lead: 'Перевірте, скільки отримаєте «на руки» з пропозиції в Польщі, перш ніж говорити про зарплату. Результат орієнтовний, для типового трудового договору.',
        about: [
          'Калькулятор перераховує зарплату брутто в нетто для трудового договору в Польщі. Він віднімає пенсійний, рентний і лікарняний внески, медичний внесок і аванс податку на доходи з урахуванням неоподатковуваної суми.',
          'Можна позначити пільгу для молодих (звільнення від PIT до 26 років) і підвищені витрати на отримання доходу, якщо їздите на роботу з іншого населеного пункту. Результат орієнтовний і стосується типової повної ставки без додаткових складових зарплати.',
          'Суму нетто варто знати перед розмовою про зарплату: в оголошеннях і на співбесідах у Польщі зазвичай говорять про брутто, а для вас важливо те, що надійде на рахунок.',
        ],
        faq: [
          { q: 'Скільки це нетто з брутто?', a: 'За трудовим договором нетто — це зазвичай близько 70–75% брутто. Точний результат залежить від зарплати, пільг і витрат, тому варто порахувати в калькуляторі.' },
          { q: 'Чи калькулятор враховує пільгу до 26 років?', a: 'Так. Позначте її, якщо вам менше 26 років. До ліміту пільги аванс PIT не утримується.' },
          { q: 'Чи працює для umowa zlecenie або B2B?', a: 'Ні. Він рахує зарплату для трудового договору. За іншими договорами внески й податок рахуються інакше.' },
        ],
      },
      'podziekowanie-po-rozmowie': {
        slugLang: 'lyst-podyaky-pislya-spivbesidy',
        title: 'Лист-подяка після співбесіди польською: генератор',
        metaDescription: 'Безкоштовний генератор листа-подяки після співбесіди для польського роботодавця. Впишіть посаду та компанію і отримайте коротке повідомлення польською.',
        lead: 'Коротка подяка, надіслана протягом доби після співбесіди, нагадує про вас і показує, що ця робота для вас важлива. Повідомлення створюється польською, готове до надсилання польському роботодавцю.',
        about: [
          'Короткий e-mail з подякою після співбесіди — простий спосіб виділитися серед інших кандидатів. Він нагадує рекрутеру про вас і показує, що робота вам важлива.',
          'Генератор створює ввічливе повідомлення польською на основі посади, назви компанії та імені людини, з якою ви розмовляли. Можна додати одну тему зі співбесіди, яка вас зацікавила, щоб повідомлення не звучало як шаблон.',
          'Надішліть подяку протягом 24 годин після співбесіди. Достатньо трьох-чотирьох речень.',
        ],
        faq: [
          { q: 'Чи доречно надсилати подяку після співбесіди в Польщі?', a: 'Так. Це ввічливий жест, який рекрутери сприймають добре, а багато кандидатів його пропускають.' },
          { q: 'Коли надіслати подяку?', a: 'Найкраще того самого дня або наступного, в робочі години.' },
          { q: 'Кому надіслати подяку?', a: 'Людині, яка проводила співбесіду або домовилася про неї. Якщо розмовляло кілька осіб, достатньо одного повідомлення головному рекрутеру.' },
        ],
      },
      'wypowiedzenie-umowy-o-prace': {
        slugLang: 'zayava-pro-zvilnennya-polshcha',
        title: 'Заява про звільнення в Польщі: генератор зразка',
        metaDescription: 'Безкоштовний генератор заяви про звільнення в Польщі: термін попередження рахується автоматично, версія за згодою сторін, документ готовий до друку.',
        lead: 'Впишіть дані й отримайте готовий документ польською для друку та підпису. Термін попередження порахуємо на основі стажу в роботодавця і типу договору.',
        about: [
          'Генератор готує документ, яким працівник розриває трудовий договір у Польщі. Ви вписуєте свої дані, дані роботодавця та дату початку роботи, а термін попередження рахується автоматично на основі стажу в цього роботодавця.',
          'Згідно з польським Кодексом праці термін попередження для безстрокового та строкового договору становить 2 тижні при стажі менше 6 місяців, 1 місяць при щонайменше 6 місяцях і 3 місяці при щонайменше 3 роках. Можна також обрати версію з пропозицією розірвання за згодою сторін у раніший термін.',
          'Документ роздрукуйте у двох примірниках, підпишіть і попросіть роботодавця підтвердити отримання на вашій копії.',
        ],
        faq: [
          { q: 'Від коли рахується термін попередження?', a: 'Термін у тижнях закінчується в суботу, а в місяцях — в останній день місяця. Тому він рахується від дня, коли роботодавець отримав заяву, до найближчого такого кінця.' },
          { q: 'Чи треба вказувати причину?', a: 'Ні. Працівник не мусить подавати причину розірвання договору.' },
          { q: 'Чи можна піти раніше, ніж після терміну попередження?', a: 'Так, якщо роботодавець погодиться. Тоді договір розривається за згодою сторін в узгоджену дату.' },
        ],
      },
      'zdjecie-do-cv': {
        slugLang: 'foto-dlya-rezyume',
        title: 'Фото для резюме: безкоштовна перевірка AI',
        metaDescription: 'Завантажте фото, і AI оцінить, чи підходить воно для резюме: кадр, фон, світло, одяг і вираз обличчя. Конкретні поради. Фото не зберігаємо.',
        lead: 'Завантажте фото, яке хочете додати до резюме. Оцінимо кадр, фон, світло, одяг і вираз обличчя та підкажемо, що покращити. Фото не зберігаємо.',
        about: [
          'Фото в резюме не обов’язкове, але якщо його додаєте, воно має працювати на вашу користь. Інструмент оцінює завантажене фото за кадром, фоном, освітленням, одягом і виразом обличчя, а потім підказує, що покращити.',
          'Гарне фото для резюме показує обличчя і плечі, має світлий спокійний фон і рівне світло, а одяг відповідає посаді. Студія не потрібна: достатньо телефона, вікна з розсіяним світлом і світлої стіни.',
          'Фото не зберігаємо. Оцінка лише для вас і зникає після закриття сторінки.',
        ],
        faq: [
          { q: 'Чи фото в резюме обов’язкове?', a: 'Ні. У Польщі фото добровільне. Для заявки до Великої Британії чи США краще його не додавати, а в Німеччині воно поширене.' },
          { q: 'Який фон обрати?', a: 'Світлий і однорідний, без візерунків і предметів у кадрі. Біла або світло-сіра стіна підійде найкраще.' },
          { q: 'Чи можна використати фото з відпустки?', a: 'Краще ні. Фото для резюме має бути нейтральним, з обличчям до камери та одягом, що відповідає роботі.' },
        ],
      },
      'jaki-zawod-dla-mnie': {
        slugLang: 'yaka-profesiya-meni-pidkhodyt',
        title: 'Яка професія мені підходить? Безкоштовний тест',
        metaDescription: 'Дайте відповідь на 10 коротких запитань і побачите 3 професії, які відповідають вашим уподобанням, з порадами, як написати резюме під кожну з них.',
        lead: 'Дайте відповідь на 10 коротких запитань про те, як вам подобається працювати. Покажемо 3 професії, які можуть вам підійти, і підкажемо, як написати резюме під кожну з них.',
        about: [
          'Тест допомагає, коли не знаєте, в якій роботі почувалися б добре. Ви відповідаєте на 10 коротких запитань, наприклад, чи віддаєте перевагу роботі з людьми чи з даними, в русі чи за столом, за планом чи гнучко.',
          'Наприкінці показуємо три професії, які відповідають вашим відповідям, з посиланнями на поради, як написати резюме під кожну з них, і на приклади резюме.',
          'Тест не замінить розмову з кар’єрним консультантом, але добре працює як відправна точка, наприклад при виборі першої роботи чи зміні галузі.',
        ],
        faq: [
          { q: 'Чи тест безкоштовний?', a: 'Так, без реєстрації. Відповіді не зберігаються.' },
          { q: 'Скільки триває тест?', a: 'Близько двох хвилин: 10 запитань із готовими варіантами відповідей.' },
          { q: 'Що робити після вибору професії?', a: 'Відкрийте сторінку професії, прочитайте ключові слова та поради до резюме, а потім пошукайте оголошення і підготуйте резюме під конкретну пропозицію.' },
        ],
      },
      'odpowiedzi-na-pytania-rekrutera': {
        slugLang: 'vidpovidi-na-pytannya-rekrutera',
        title: 'Питання рекрутера: приклади відповідей під вашу посаду',
        metaDescription: 'Оберіть типове питання зі співбесіди, впишіть посаду та кілька фактів про себе і отримайте приклад відповіді та поради, чого уникати.',
        lead: 'Оберіть питання, впишіть посаду та кілька фактів про себе. Отримаєте приклад відповіді на основі вашого досвіду та поради, чого уникати.',
        about: [
          'На співбесіді повторюється кільканадцять тих самих питань, наприклад «Розкажіть про себе» або «Які ваші слабкі сторони?». Добра відповідь спирається на ваш справжній досвід, а не на завчену формулу.',
          'Оберіть питання, впишіть посаду та кілька фактів про себе. Отримаєте приклад відповіді на основі того, що вказали, і поради, чого уникати. Відповідь потренуйте вголос і пристосуйте до власного стилю.',
          'Для питань про конкретні ситуації добре працює метод STAR: ситуація, завдання, дія та результат.',
        ],
        faq: [
          { q: 'Як відповісти на питання про слабкі сторони?', a: 'Назвіть справжню, але не ключову для посади слабкість і скажіть, що робите, щоб її виправити.' },
          { q: 'Скільки має тривати відповідь на «Розкажіть про себе»?', a: 'Близько хвилини: поточна робота, найважливіший досвід, пов’язаний із посадою, і причина, чому подаєтеся.' },
          { q: 'Чи можна вивчити відповіді напам’ять?', a: 'Краще запам’ятати головні пункти, а не цілі речення. Відповідь, сказана природно, звучить переконливіше.' },
        ],
      },
      'oferty-pracy-na-maila': {
        slugLang: 'vakansii-na-email',
        title: 'Вакансії в Польщі на e-mail щотижня: безкоштовно',
        metaDescription: 'Впишіть професію та місто в Польщі, і щопонеділка отримуватимете e-mail з посиланнями на нові вакансії на Pracuj.pl, OLX та Indeed. Безкоштовно, 12 тижнів.',
        lead: 'Впишіть професію та місто, і щопонеділка отримуватимете e-mail з посиланнями на найновіші вакансії на Pracuj.pl, OLX та Indeed і коротку пораду щодо резюме. Безкоштовно, 12 тижнів, відписка одним натисканням.',
        about: [
          'Замість щодня переглядати портали з вакансіями, впишіть професію та місто, і щопонеділка отримуватимете e-mail з посиланнями на найновіші оголошення на Pracuj.pl, OLX та Indeed.',
          'У кожному листі є також коротка порада, як пристосувати резюме до оголошення. Розсилка триває 12 тижнів, і її можна зупинити одним натисканням у будь-якому листі.',
          'Коли знайдете цікаве оголошення, вставте його у форму, і ми підготуємо резюме саме під цю пропозицію.',
        ],
        faq: [
          { q: 'Чи вакансії на e-mail платні?', a: 'Ні, розсилка безкоштовна.' },
          { q: 'Як відмовитися від розсилки?', a: 'Натисніть посилання для відписки внизу будь-якого листа.' },
          { q: 'З яких порталів вакансії?', a: 'Посилання ведуть на результати пошуку на Pracuj.pl, OLX та Indeed для вказаної професії та міста.' },
        ],
      },
    },
  },
  de: {
    seg: 'tools',
    data: {
      'skaner-cv': {
        slugLang: 'lebenslauf-scanner',
        title: 'Lebenslauf-Scanner: passt Ihr CV zur Stellenanzeige?',
        metaDescription: 'Kostenloser Lebenslauf-Scanner ohne Registrierung: Lebenslauf hochladen, Anzeige einfügen, Übereinstimmung und fehlende ATS-Schlüsselwörter sehen.',
        lead: 'Laden Sie Ihren aktuellen Lebenslauf hoch (PDF, Word oder TXT) und fügen Sie den Link zur Stellenanzeige oder ihren Text ein. In wenigen Sekunden sehen Sie, welche Anforderungen Sie erfüllen, was im Lebenslauf fehlt und was Sie verbessern sollten. Datei und Lebenslauftext speichern wir nicht.',
        about: [
          'Recruiter und ATS-Systeme, die Bewerbungen vorsortieren, suchen im Lebenslauf nach den Wörtern aus der Anzeige: Stellenbezeichnungen, Programme, Berechtigungen und Aufgaben. Wenn Sie die Erfahrung haben, sie aber anders beschreiben als der Arbeitgeber, kann Ihr Lebenslauf übersehen werden. Der Scanner vergleicht Ihren Lebenslauf mit einer konkreten Anzeige und zeigt, was passt und was fehlt.',
          'Das Ergebnis: ein Prozentwert der Übereinstimmung, die Liste der erfüllten Anforderungen, die Liste der im Lebenslauf nicht sichtbaren Anforderungen und drei konkrete Tipps. Jede Lücke hat einen kurzen Hinweis, wie Sie sie füllen, wenn Sie diese Erfahrung wirklich haben. Wir erfinden nichts für Sie.',
          'Der Scanner funktioniert mit Anzeigen auf Polnisch, Englisch, Deutsch und Ukrainisch von den meisten Jobportalen (Pracuj.pl, OLX, Indeed, LinkedIn und andere). Lässt sich der Link nicht laden, fügen Sie den Anzeigentext selbst ein.',
          'Wenn Sie danach einen Lebenslauf für genau diese Anzeige möchten, übernehmen Sie Daten aus der Datei und den Anzeigentext mit einem Klick ins Formular. Ein passender Lebenslauf kostet ab 39 PLN, ohne Abo, mit kostenloser Korrektur.',
        ],
        faq: [
          { q: 'Ist der Lebenslauf-Scanner wirklich kostenlos?', a: 'Ja. Keine Registrierung, kein Konto, keine E-Mail. Es gibt ein Limit von einigen Prüfungen pro Stunde, damit das Tool für alle schnell bleibt.' },
          { q: 'Was passiert mit meiner Datei?', a: 'Die Datei dient nur dem einmaligen Vergleich mit der Anzeige. Wir speichern weder die Datei noch den Text des Lebenslaufs. Nur das Ergebnis (Prozentwert, Schlüsselwörter und Hinweise) bleibt bis zu einer Stunde im Serverspeicher und wird dann gelöscht; auf Wunsch senden wir es Ihnen per E-Mail. Bestellen Sie danach einen Lebenslauf, gehen die Daten ins Formular, und die Bestellung wird nach 30 Tagen gelöscht.' },
          { q: 'Ist das ein ATS-Test?', a: 'Der Scanner prüft, was ATS-Systeme und Recruiter prüfen: ob Anforderungen und Schlüsselwörter aus der Anzeige im Lebenslauf stehen. Er bildet kein konkretes Firmensystem nach; sehen Sie das Ergebnis als Hinweis, was zu ergänzen ist.' },
          { q: 'Welche Dateien akzeptiert der Scanner?', a: 'PDF, Word (.docx) und reinen Text (.txt), bis 5 MB. Scans und Fotos eines Lebenslaufs funktionieren nicht, weil daraus kein Text gelesen werden kann.' },
        ],
      },
      'klauzula-rodo': {
        slugLang: 'dsgvo-klausel-lebenslauf',
        title: 'DSGVO-Klausel für den Lebenslauf in Polen: Generator',
        seoTitle: 'DSGVO-Klausel im Lebenslauf (Polen) kostenlos erstellen',
        metaDescription: 'Kostenloser Generator der DSGVO-Klausel (RODO) für den Lebenslauf in Polen: aktueller Wortlaut auf Polnisch, Englisch und Deutsch.',
        lead: 'Wählen Sie eine Version und kopieren Sie die fertige Klausel ans Ende Ihres Lebenslaufs. Gibt der Arbeitgeber in der Anzeige einen eigenen Wortlaut vor, verwenden Sie diesen.',
        about: [
          'Die RODO-Klausel ist eine kurze Einwilligung in die Verarbeitung personenbezogener Daten für die Bewerbung. Seit 2019 darf ein polnischer Arbeitgeber grundlegende Daten aus dem Lebenslauf ohne Einwilligung verarbeiten, viele Firmen verlangen sie aber weiterhin in der Anzeige, vor allem wenn der Lebenslauf zusätzliche Angaben wie Foto oder Interessen enthält.',
          'Der Generator liefert den aktuellen Wortlaut auf Polnisch, Englisch und Deutsch. Sie können den Firmennamen und die Einwilligung für künftige Bewerbungsverfahren ergänzen, wenn der Arbeitgeber bei anderen Stellen auf Ihren Lebenslauf zurückkommen darf.',
          'Fügen Sie die fertige Klausel ganz unten im Lebenslauf in kleinerer Schrift ein. Gibt die Anzeige einen eigenen Text vor, verwenden Sie genau diesen.',
        ],
        faq: [
          { q: 'Ist die DSGVO-Klausel im Lebenslauf in Polen Pflicht?', a: 'Nicht immer. Der Arbeitgeber darf grundlegende Daten ohne Einwilligung verarbeiten; verlangt die Anzeige die Klausel, fügen Sie sie hinzu, sonst kann Ihr Lebenslauf übergangen werden.' },
          { q: 'Wo kommt die Klausel hin?', a: 'Ganz unten auf der letzten Seite, in kleinerer Schrift als der übrige Text.' },
          { q: 'Gehört die Klausel auch in einen englischen Lebenslauf?', a: 'Bei einer Bewerbung bei einer polnischen Firma ja, in der englischen Fassung. Für Jobs im Ausland ist sie meist nicht nötig, außer die Anzeige verlangt sie.' },
        ],
      },
      'kalkulator-wynagrodzen': {
        slugLang: 'netto-gehaltsrechner-polen',
        title: 'Netto-Gehaltsrechner Polen: brutto zu netto (2026)',
        metaDescription: 'Kostenloser Brutto-Netto-Rechner für einen Arbeitsvertrag in Polen: Sozial- und Krankenversicherung, Steuer, Steuerfreiheit unter 26, Pendlerkosten.',
        lead: 'Prüfen Sie, wie viel von einem Stellenangebot in Polen tatsächlich bei Ihnen ankommt, bevor Sie über das Gehalt sprechen. Das Ergebnis ist eine Schätzung für einen typischen Arbeitsvertrag (umowa o pracę).',
        about: [
          'Der Rechner wandelt das Bruttogehalt für einen Arbeitsvertrag in Polen in netto um. Er zieht Renten-, Erwerbsunfähigkeits- und Krankengeldbeiträge, den Krankenversicherungsbeitrag und die Einkommensteuervorauszahlung unter Berücksichtigung des Grundfreibetrags ab.',
          'Sie können die Steuerbefreiung unter 26 Jahren (keine Einkommensteuer bis zu einer Grenze) und erhöhte Werbungskosten ankreuzen, wenn Sie aus einem anderen Ort pendeln. Das Ergebnis ist eine Schätzung für eine normale Vollzeitstelle ohne zusätzliche Gehaltsbestandteile.',
          'Den Nettobetrag sollte man vor dem Gehaltsgespräch kennen: In Anzeigen und Gesprächen in Polen wird meist brutto genannt, für Sie zählt aber, was auf dem Konto ankommt.',
        ],
        faq: [
          { q: 'Wie viel netto bleibt vom brutto in Polen?', a: 'Beim Arbeitsvertrag sind es meist etwa 70–75 % des Bruttogehalts. Der genaue Wert hängt von Gehalt, Vergünstigungen und Werbungskosten ab, deshalb lohnt sich der Rechner.' },
          { q: 'Berücksichtigt der Rechner die Steuerbefreiung unter 26?', a: 'Ja. Kreuzen Sie sie an, wenn Sie unter 26 sind. Bis zur Grenze wird keine Steuervorauszahlung abgezogen.' },
          { q: 'Funktioniert er für B2B oder einen Werkvertrag?', a: 'Nein. Er rechnet für einen Arbeitsvertrag. Bei anderen Verträgen werden Beiträge und Steuer anders berechnet.' },
        ],
      },
      'podziekowanie-po-rozmowie': {
        slugLang: 'dankesmail-nach-vorstellungsgespraech',
        title: 'Dankesmail nach dem Vorstellungsgespräch in Polen',
        metaDescription: 'Kostenloser Generator einer Dankesmail nach dem Vorstellungsgespräch in Polen: Stelle und Firma eingeben, kurze Nachricht auf Polnisch erhalten.',
        lead: 'Ein kurzes Dankeschön innerhalb eines Tages nach dem Gespräch erinnert den Recruiter an Sie und zeigt, dass Ihnen die Stelle wichtig ist. Die Nachricht wird auf Polnisch erstellt, fertig zum Versand an einen polnischen Arbeitgeber.',
        about: [
          'Eine kurze Dankesmail nach dem Vorstellungsgespräch ist ein einfacher Weg, sich von anderen Bewerbern abzuheben. Sie erinnert den Recruiter an Sie und zeigt, dass Ihnen die Stelle wichtig ist.',
          'Der Generator erstellt eine höfliche Nachricht auf Polnisch aus Stelle, Firmenname und dem Namen Ihrer Gesprächspartnerin oder Ihres Gesprächspartners. Sie können ein Thema aus dem Gespräch ergänzen, das Sie interessiert hat, damit die Nachricht nicht wie eine Vorlage klingt.',
          'Senden Sie das Dankeschön innerhalb von 24 Stunden nach dem Gespräch. Drei, vier Sätze reichen.',
        ],
        faq: [
          { q: 'Ist eine Dankesmail nach dem Gespräch in Polen angebracht?', a: 'Ja. Es ist eine höfliche Geste, die Recruiter gut aufnehmen und die viele Bewerber auslassen.' },
          { q: 'Wann sollte ich sie senden?', a: 'Am besten am selben oder am nächsten Tag, während der Arbeitszeit.' },
          { q: 'An wen sende ich sie?', a: 'An die Person, die das Gespräch geführt oder vereinbart hat. Haben mehrere Personen teilgenommen, reicht eine Nachricht an den Hauptrecruiter.' },
        ],
      },
      'wypowiedzenie-umowy-o-prace': {
        slugLang: 'kuendigungsschreiben-polen',
        title: 'Kündigungsschreiben in Polen: kostenloser Generator',
        metaDescription: 'Kostenloser Generator eines Kündigungsschreibens für einen Arbeitsvertrag in Polen: Kündigungsfrist automatisch berechnet, Aufhebungsvariante, druckfertig.',
        lead: 'Geben Sie Ihre Daten ein und erhalten Sie ein fertiges Schreiben auf Polnisch zum Drucken und Unterschreiben. Die Kündigungsfrist berechnen wir aus Ihrer Betriebszugehörigkeit und der Vertragsart.',
        about: [
          'Der Generator erstellt das Schreiben, mit dem ein Arbeitnehmer einen Arbeitsvertrag in Polen kündigt. Sie geben Ihre Daten, die Daten des Arbeitgebers und das Eintrittsdatum ein; die Kündigungsfrist wird automatisch aus der Betriebszugehörigkeit bei diesem Arbeitgeber berechnet.',
          'Nach dem polnischen Arbeitsgesetzbuch beträgt die Kündigungsfrist bei unbefristeten und befristeten Verträgen 2 Wochen bei weniger als 6 Monaten Beschäftigung, 1 Monat ab 6 Monaten und 3 Monate ab 3 Jahren. Sie können auch eine Variante mit dem Vorschlag einer Aufhebung im gegenseitigen Einvernehmen zu einem früheren Termin wählen.',
          'Drucken Sie das Schreiben zweimal aus, unterschreiben Sie es und lassen Sie sich den Empfang vom Arbeitgeber auf Ihrer Kopie bestätigen.',
        ],
        faq: [
          { q: 'Ab wann läuft die Kündigungsfrist?', a: 'Eine Frist in Wochen endet an einem Samstag, eine in Monaten am letzten Tag des Monats. Sie läuft also vom Tag, an dem der Arbeitgeber das Schreiben erhalten hat, bis zum nächsten solchen Ende.' },
          { q: 'Muss ich einen Grund angeben?', a: 'Nein. Ein Arbeitnehmer muss keinen Grund für die Kündigung angeben.' },
          { q: 'Kann ich früher gehen als nach der Kündigungsfrist?', a: 'Ja, wenn der Arbeitgeber zustimmt. Dann endet der Vertrag im gegenseitigen Einvernehmen zum vereinbarten Termin.' },
        ],
      },
      'zdjecie-do-cv': {
        slugLang: 'bewerbungsfoto-check',
        title: 'Bewerbungsfoto-Check: Passt Ihr Foto in den Lebenslauf?',
        metaDescription: 'Foto hochladen, und die KI bewertet, ob es in den Lebenslauf passt: Ausschnitt, Hintergrund, Licht, Kleidung, Mimik, mit Tipps. Fotos speichern wir nicht.',
        lead: 'Laden Sie das Foto hoch, das Sie in den Lebenslauf setzen möchten. Wir bewerten Ausschnitt, Hintergrund, Licht, Kleidung und Mimik und sagen Ihnen, was Sie verbessern können. Fotos speichern wir nicht.',
        about: [
          'Ein Foto im Lebenslauf ist nicht Pflicht, aber wenn Sie eines verwenden, sollte es für Sie sprechen. Das Tool bewertet das hochgeladene Foto nach Ausschnitt, Hintergrund, Beleuchtung, Kleidung und Mimik und schlägt vor, was zu verbessern ist.',
          'Ein gutes Bewerbungsfoto zeigt Gesicht und Schultern, hat einen hellen, ruhigen Hintergrund und gleichmäßiges Licht, und die Kleidung passt zur Stelle. Ein Studio ist nicht nötig: Smartphone, Fenster mit weichem Licht und eine helle Wand reichen.',
          'Fotos speichern wir nicht. Die Bewertung ist nur für Sie und verschwindet beim Schließen der Seite.',
        ],
        faq: [
          { q: 'Ist ein Foto im Lebenslauf Pflicht?', a: 'Nein. In Polen ist das Foto freiwillig. Bei Bewerbungen nach Großbritannien oder in die USA lässt man es besser weg, in Deutschland ist es verbreitet.' },
          { q: 'Welchen Hintergrund wählen?', a: 'Hell und einfarbig, ohne Muster oder Gegenstände im Bild. Eine weiße oder hellgraue Wand eignet sich am besten.' },
          { q: 'Kann ich ein Urlaubsfoto nehmen?', a: 'Besser nicht. Ein Bewerbungsfoto sollte neutral sein, mit dem Gesicht zur Kamera und zur Stelle passender Kleidung.' },
        ],
      },
      'jaki-zawod-dla-mnie': {
        slugLang: 'welcher-beruf-passt-zu-mir',
        title: 'Welcher Beruf passt zu mir? Kostenloser Test',
        metaDescription: 'Beantworten Sie 10 kurze Fragen und sehen Sie 3 Berufe, die zu Ihren Vorlieben passen, mit Tipps, wie Sie den Lebenslauf für jeden davon schreiben.',
        lead: 'Beantworten Sie 10 kurze Fragen dazu, wie Sie gern arbeiten. Wir zeigen 3 Berufe, die zu Ihnen passen könnten, und sagen Ihnen, wie Sie den Lebenslauf für jeden davon schreiben.',
        about: [
          'Der Test hilft, wenn Sie nicht wissen, in welcher Arbeit Sie sich wohlfühlen würden. Sie beantworten 10 kurze Fragen, zum Beispiel ob Sie lieber mit Menschen oder mit Daten arbeiten, in Bewegung oder am Schreibtisch, nach Plan oder flexibel.',
          'Am Ende zeigen wir drei Berufe, die zu Ihren Antworten passen, mit Links zu Tipps für den Lebenslauf in jedem davon und zu Beispiel-Lebensläufen.',
          'Der Test ersetzt keine Berufsberatung, eignet sich aber gut als Ausgangspunkt, etwa bei der Wahl des ersten Jobs oder beim Branchenwechsel.',
        ],
        faq: [
          { q: 'Ist der Test kostenlos?', a: 'Ja, ohne Registrierung. Antworten werden nicht gespeichert.' },
          { q: 'Wie lange dauert er?', a: 'Etwa zwei Minuten: 10 Fragen mit vorgegebenen Antworten zur Auswahl.' },
          { q: 'Was tun nach der Berufswahl?', a: 'Öffnen Sie die Berufsseite, lesen Sie Schlüsselwörter und Lebenslauf-Tipps, suchen Sie dann Anzeigen und erstellen Sie einen Lebenslauf für ein konkretes Angebot.' },
        ],
      },
      'odpowiedzi-na-pytania-rekrutera': {
        slugLang: 'antworten-auf-interviewfragen',
        title: 'Interviewfragen: Beispielantworten für Ihre Stelle',
        metaDescription: 'Typische Interviewfrage wählen, Stelle und einige Fakten zu sich eingeben und eine Beispielantwort mit Tipps erhalten, was Sie vermeiden sollten.',
        lead: 'Wählen Sie eine Frage, geben Sie die Stelle und einige Fakten zu sich ein. Sie erhalten eine Beispielantwort auf Grundlage Ihrer Erfahrung und Tipps, was Sie vermeiden sollten.',
        about: [
          'Im Vorstellungsgespräch wiederholen sich gut ein Dutzend Fragen, etwa „Erzählen Sie etwas über sich“ oder „Was sind Ihre Schwächen?“. Eine gute Antwort beruht auf Ihrer echten Erfahrung, nicht auf einer auswendig gelernten Formel.',
          'Wählen Sie eine Frage, geben Sie Stelle und einige Fakten zu sich ein. Sie erhalten eine Beispielantwort auf Grundlage Ihrer Angaben und Tipps, was zu vermeiden ist. Üben Sie die Antwort laut und passen Sie sie Ihrem Stil an.',
          'Bei Fragen zu konkreten Situationen bewährt sich die STAR-Methode: Situation, Aufgabe, Handlung und Ergebnis.',
        ],
        faq: [
          { q: 'Wie antworte ich auf die Frage nach Schwächen?', a: 'Nennen Sie eine echte, für die Stelle aber nicht entscheidende Schwäche und sagen Sie, was Sie dagegen tun.' },
          { q: 'Wie lang sollte „Erzählen Sie etwas über sich“ dauern?', a: 'Etwa eine Minute: aktuelle Tätigkeit, die wichtigste Erfahrung für die Stelle und der Grund Ihrer Bewerbung.' },
          { q: 'Kann ich Antworten auswendig lernen?', a: 'Besser die Hauptpunkte merken, nicht ganze Sätze. Eine natürlich gesprochene Antwort wirkt glaubwürdiger.' },
        ],
      },
      'oferty-pracy-na-maila': {
        slugLang: 'jobangebote-per-email',
        title: 'Jobangebote per E-Mail: neue Stellen in Polen wöchentlich',
        metaDescription: 'Beruf und Stadt in Polen eingeben und jeden Montag eine E-Mail mit Links zu neuen Stellen auf Pracuj.pl, OLX und Indeed erhalten. 12 Wochen kostenlos.',
        lead: 'Geben Sie Beruf und Stadt ein, und jeden Montag erhalten Sie eine E-Mail mit Links zu den neuesten Angeboten auf Pracuj.pl, OLX und Indeed sowie einen kurzen Lebenslauf-Tipp. Kostenlos, 12 Wochen, Abmeldung mit einem Klick.',
        about: [
          'Statt täglich Jobportale zu durchsuchen, geben Sie Beruf und Stadt ein, und jeden Montag kommt eine E-Mail mit Links zu den neuesten Anzeigen auf Pracuj.pl, OLX und Indeed.',
          'Jede Nachricht enthält auch einen kurzen Tipp, wie Sie den Lebenslauf an eine Anzeige anpassen. Der Versand läuft 12 Wochen, und Sie können ihn in jeder E-Mail mit einem Klick beenden.',
          'Finden Sie eine interessante Anzeige, fügen Sie sie ins Formular ein, und wir erstellen einen Lebenslauf genau für dieses Angebot.',
        ],
        faq: [
          { q: 'Sind die Jobangebote per E-Mail kostenpflichtig?', a: 'Nein, der Versand ist kostenlos.' },
          { q: 'Wie melde ich mich ab?', a: 'Klicken Sie auf den Abmeldelink am Ende jeder Nachricht.' },
          { q: 'Von welchen Portalen stammen die Angebote?', a: 'Die Links führen zu den Suchergebnissen auf Pracuj.pl, OLX und Indeed für den angegebenen Beruf und die Stadt.' },
        ],
      },
    },
  },
};

// Odwrotne mapy: slugLang → polski slug, oraz dla każdego narzędzia adresy we wszystkich językach.
// Narzędzia „Sprawdź CV” i „Test CV pod ATS” (EN/UK/DE) w osobnym pliku JSON.
import ATS from './tools-i18n-ats.json' with { type: 'json' };
for (const [l, data] of Object.entries(ATS)) Object.assign(TOOL_LANGS[l].data, data);

export const TOOL_BY = Object.fromEntries(Object.entries(TOOL_LANGS).map(([l, { data }]) => [l, Object.fromEntries(Object.entries(data).map(([pl, d]) => [d.slugLang, pl]))]));
export const toolUrl = (l, pl) => `${l}/${TOOL_LANGS[l].seg}/${TOOL_LANGS[l].data[pl].slugLang}`;
export const toolSlugs = (pl) => Object.fromEntries(Object.keys(TOOL_LANGS).map((l) => [l, TOOL_LANGS[l].data[pl]?.slugLang]));
