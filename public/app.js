const state = {
  user: null,
  menu: [],
  filter: "all",
  cart: new Map(),
  chatHistory: [],
  operatorMode: false,
  operatorPoll: null,
  operatorLastCount: 0,
  recognition: null,
  listening: false,
  page: "home",
  lang: localStorage.getItem("sakura-lang") || "ru",
  promoCode: localStorage.getItem("sakura-promo") || "",
  quizScore: Number(localStorage.getItem("sakura-quiz-score") || 0),
  registrationMetrics: {
    startedAt: 0,
    actions: 0,
    fittsSeconds: 0,
    hickSeconds: 0,
    lastPoint: null,
    timer: null
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const PROMO_CODE = "SAKURA5";
const PROMO_DISCOUNT = 0.05;
const money = (value) => `${Number(value || 0).toLocaleString(state.lang === "en" ? "en-US" : "ru-RU")} ₸`;

const menuImages = {
  sets: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=725&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  rolls: "https://plus.unsplash.com/premium_photo-1723874570807-570c56b41e4e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  drinks: "https://images.unsplash.com/photo-1719464455071-71364721466a?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  sides: "https://images.unsplash.com/photo-1592180387432-d735c59eee1a?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  sauces: "https://images.unsplash.com/photo-1599253334613-90aaa517759c?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
};

const dishImages = {
  "Omakase Set": "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=725&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Akami Nigiri": "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=900&q=80",
  "Salmon Yuzu Roll": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
  "Unagi Dragon Roll": "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
  "Sake Junmai": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
  "Edamame Shio": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Bowl_of_Edamame.jpg/960px-Bowl_of_Edamame.jpg",
  "Sauce Flight": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Soy_sauce_with_wasabi.jpg/960px-Soy_sauce_with_wasabi.jpg",
  "Wasabi & Gari Set": "https://images.unsplash.com/photo-1592180387432-d735c59eee1a?auto=format&fit=crop&w=900&q=80"
};

const dishImagesByName = Object.fromEntries(
  Object.entries(dishImages).map(([name, url]) => [name.trim().toLowerCase(), url])
);

const TEXT = {
  ru: {
    navHome: "Главная", navCatalog: "Каталог", navDelivery: "Доставка", navBooking: "Бронь", navQuiz: "Викторина", navAbout: "О нас",
    navMenu: "Меню", brandSmall: "Суши. Роллы. Саке.", login: "Войти", logout: "Выйти", profile: "Профиль", cartOpen: "Открыть корзину",
    heroEyebrow: "Сезонное японское меню", heroTitle: "Суши-бар с горячей кухней, саке и доставкой в один клик.",
    heroText: "Роллы, нигири, сеты, васаби, гари, соусы и теплые гарниры. Забронируйте столик или соберите доставку после входа в аккаунт.",
    bookTable: "Забронировать стол", chooseMenu: "Выбрать из меню",
    bandOneTitle: "Роллы готовятся под заказ", bandOneText: "Рис держим теплым, рыбу нарезаем перед подачей, соусы подбираем под конкретный сет.",
    bandTwoTitle: "Вечерний sushi counter", bandTwoText: "Можно прийти на ужин, дегустацию саке или быстро забрать заказ с собой.",
    homeEyebrow: "Вечер в Sakura Table", homeTitle: "Соберите ужин под настроение",
    homeText: "Легкие нигири, теплые роллы, сет на компанию, саке к рыбе и соусы с разным характером. Можно прийти в зал, забронировать столик заранее или оформить доставку домой.",
    hubSetTitle: "Сеты для компании", hubSetText: "Большие наборы с нигири, роллами, васаби, гари и фирменными соусами.",
    hubDeliveryTitle: "Доставка к ужину", hubDeliveryText: "Соберите корзину, выберите время и способ оплаты, а заказ уйдет на кухню.",
    hubBookingTitle: "Столик в зале", hubBookingText: "Для свидания, встречи с друзьями или спокойной дегустации саке.",
    hubFindTitle: "Как нас найти", hubFindText: "Адрес, часы работы, телефон и карта ресторана в центре Алматы.",
    hubQuizTitle: "Викторина с промокодом", hubQuizText: "Ответьте на вопросы о суши и получите скидку 5% на доставку.",
    menuEyebrow: "Меню", menuTitle: "Суши, роллы, саке, гарниры и соусы", menuText: "Добавляйте позиции в корзину. Количество и состав заказа редактируются в корзине в шапке.", menuPdf: "Скачать PDF меню",
    filterAll: "Все", filterSets: "Сеты", filterSushi: "Суши", filterRolls: "Роллы", filterDrinks: "Саке", filterSides: "Гарниры", filterSauces: "Соусы",
    bookingEyebrow: "Бронирование", bookingTitle: "Столик для ужина, дегустации или встречи", bookingText: "Бронь сохраняется в базе и появляется в отдельной админ-панели. Для отправки заявки нужен аккаунт гостя.",
    name: "Имя", phone: "Телефон", date: "Дата", time: "Время", guests: "Гостей", occasion: "Повод", notes: "Пожелания", sendBooking: "Отправить бронь",
    deliveryEyebrow: "Доставка", deliveryTitle: "Заказ суши домой или в офис", deliveryText: "Выберите блюда из меню, затем откройте корзину в шапке. Там можно изменить количество и отправить заказ.",
    deliveryStep1: "Войдите или зарегистрируйтесь.", deliveryStep2: "Добавьте суши, роллы, саке и соусы в корзину.", deliveryStep3: "Откройте корзину и отправьте доставку.",
    cartEyebrow: "Корзина", cartTitle: "Проверьте заказ перед доставкой", cartText: "Количество блюд можно менять здесь. Корзина сохраняется в браузере, поэтому позиции не пропадают при переходе между страницами сайта.",
    subtotal: "Сумма:", discount: "Скидка:", total: "Итого:", backCatalog: "Вернуться в каталог", address: "Адрес", payment: "Оплата", promo: "Промокод", apply: "Применить", comment: "Комментарий", callDelivery: "Вызвать доставку",
    asap: "Как можно скорее", cardPay: "Картой курьеру", cashPay: "Наличными", onlinePay: "Онлайн",
    onlineSafety: "Для безопасности сайт не хранит полный номер карты и CVV. Для онлайн-оплаты укажите данные перевода, чтобы администратор сверил платеж.",
    onlineMethod: "Способ онлайн-оплаты", transferPhone: "Телефон для перевода", payerName: "Имя плательщика", cardLast4: "Последние 4 цифры карты", paymentComment: "Комментарий к оплате",
    profileEyebrow: "Личный кабинет", profileTitle: "Профиль гостя", profilePhotoText: "Фото можно вставить ссылкой или выбрать с устройства. При выборе файла картинка сохранится в базе как изображение профиля.",
    email: "Email", avatarUrl: "Фото профиля", avatarFile: "Загрузить фото", newPassword: "Новый пароль", saveProfile: "Сохранить профиль",
    quizEyebrow: "Викторина", quizTitle: "Проверьте знание суши и получите промокод", quizText: "В викторине 10 вопросов. Если ответить правильно минимум на 7, появится промокод на скидку 5% для доставки.",
    promoWon: "Ваш промокод:", promoHint: "Введите его в корзине при оформлении доставки.", quizSubmit: "Проверить ответы", quizAgain: "Пройти заново",
    chatEyebrow: "AI-консьерж", chatTitle: "Спросите про меню, соусы, саке или бронь", chatText: "Чат работает через сервер. Для голосового ввода нажмите микрофон в чате и разрешите доступ к микрофону в браузере.",
    aboutEyebrow: "О нас", aboutTitle: "Sakura Table - ресторан суши, роллов и саке", aboutText: "Мы соединяем спокойную японскую подачу, свежие продукты и удобный онлайн-сервис: каталог, бронь, доставка, личный кабинет и поддержка оператора работают из одной системы.",
    kitchenTitle: "Кухня под заказ", kitchenText: "Роллы собираются после заказа, рис остается теплым, а соусы подбираются под рыбу, гарниры и саке.",
    aboutDeliveryTitle: "Доставка и бронь", aboutDeliveryText: "Заявки сразу сохраняются в базе Django, поэтому администратор видит заказы, брони и данные гостей в панели управления.",
    whereEyebrow: "Где мы", mapTitle: "Карта и контакты", mapText: "Приходите на ужин, дегустацию саке или забирайте заказ с собой. Точка на карте открывается и масштабируется прямо на сайте.",
    schedule: "Пн-Вс: 11:00-23:00", footerText: "С 2010 года готовим суши, роллы и горячие японские закуски для ужинов, броней и доставки по городу.", links: "Ссылки", contact: "Связь", rights: "© 2026 Sakura Table. Все права защищены.",
    authLogin: "Вход", authRegister: "Регистрация", password: "Пароль", passwordRules: "Минимум 8 символов и хотя бы один спецсимвол.", generatePassword: "Сгенерировать пароль", createAccount: "Создать аккаунт",
    registrationTempo: "Темп регистрации", registrationTime: "Время:", registrationActions: "Действий:", close: "×",
    chatGreeting: "Здравствуйте. Подскажу по меню, саке, соусам, брони и доставке.", chatPlaceholder: "Спросите про сет, доставку или бронь", voiceInput: "Голосовой ввод", operator: "Оператор", send: "Отправить", chatNote: "AI работает через сервер, ключ не попадает в браузер."
  },
  en: {
    navHome: "Home", navCatalog: "Catalog", navDelivery: "Delivery", navBooking: "Booking", navQuiz: "Quiz", navAbout: "About",
    navMenu: "Menu", brandSmall: "Sushi. Rolls. Sake.", login: "Sign in", logout: "Log out", profile: "Profile", cartOpen: "Open cart",
    heroEyebrow: "Seasonal Japanese menu", heroTitle: "A sushi bar with hot dishes, sake and delivery in one click.",
    heroText: "Rolls, nigiri, sets, wasabi, gari, sauces and warm sides. Book a table or build a delivery order after signing in.",
    bookTable: "Book a table", chooseMenu: "Choose from menu",
    bandOneTitle: "Rolls made to order", bandOneText: "Rice stays warm, fish is sliced before serving, and sauces are paired for each set.",
    bandTwoTitle: "Evening sushi counter", bandTwoText: "Come for dinner, sake tasting, or pick up your order quickly.",
    homeEyebrow: "An Evening at Sakura Table", homeTitle: "Build dinner around your mood",
    homeText: "Light nigiri, warm rolls, a set for friends, sake for fish and sauces with different character. Dine in, book ahead or order delivery.",
    hubSetTitle: "Sets for friends", hubSetText: "Large assortments with nigiri, rolls, wasabi, gari and house sauces.",
    hubDeliveryTitle: "Dinner delivery", hubDeliveryText: "Build a cart, choose time and payment, and your order goes to the kitchen.",
    hubBookingTitle: "A table in the dining room", hubBookingText: "For a date, a friends' night or a calm sake tasting.",
    hubFindTitle: "Find us", hubFindText: "Address, opening hours, phone and map in central Almaty.",
    hubQuizTitle: "Quiz with promo code", hubQuizText: "Answer sushi questions and get 5% off delivery.",
    menuEyebrow: "Menu", menuTitle: "Sushi, rolls, sake, sides and sauces", menuText: "Add items to your cart. You can edit quantities and order contents in the cart.", menuPdf: "Download PDF menu",
    filterAll: "All", filterSets: "Sets", filterSushi: "Sushi", filterRolls: "Rolls", filterDrinks: "Sake", filterSides: "Sides", filterSauces: "Sauces",
    bookingEyebrow: "Booking", bookingTitle: "A table for dinner, tasting or a meeting", bookingText: "Bookings are saved to the database and shown in the admin panel. A guest account is required.",
    name: "Name", phone: "Phone", date: "Date", time: "Time", guests: "Guests", occasion: "Occasion", notes: "Preferences", sendBooking: "Send booking",
    deliveryEyebrow: "Delivery", deliveryTitle: "Order sushi home or to the office", deliveryText: "Choose dishes from the menu, then open the cart. There you can edit quantities and send the order.",
    deliveryStep1: "Sign in or create an account.", deliveryStep2: "Add sushi, rolls, sake and sauces to the cart.", deliveryStep3: "Open the cart and submit delivery.",
    cartEyebrow: "Cart", cartTitle: "Check your order before delivery", cartText: "You can change quantities here. The cart is saved in your browser between pages.",
    subtotal: "Subtotal:", discount: "Discount:", total: "Total:", backCatalog: "Back to catalog", address: "Address", payment: "Payment", promo: "Promo code", apply: "Apply", comment: "Comment", callDelivery: "Request delivery",
    asap: "As soon as possible", cardPay: "Card to courier", cashPay: "Cash", onlinePay: "Online",
    onlineSafety: "For safety, the site does not store full card numbers or CVV. For online payment, enter transfer details so the admin can verify it.",
    onlineMethod: "Online payment method", transferPhone: "Transfer phone", payerName: "Payer name", cardLast4: "Last 4 card digits", paymentComment: "Payment comment",
    profileEyebrow: "Account", profileTitle: "Guest profile", profilePhotoText: "Add a photo by URL or choose a file. The selected image is saved in the profile database.",
    email: "Email", avatarUrl: "Profile photo", avatarFile: "Upload photo", newPassword: "New password", saveProfile: "Save profile",
    quizEyebrow: "Quiz", quizTitle: "Test your sushi knowledge and get a promo code", quizText: "There are 10 questions. Answer at least 7 correctly to get a 5% delivery promo code.",
    promoWon: "Your promo code:", promoHint: "Enter it in the cart when ordering delivery.", quizSubmit: "Check answers", quizAgain: "Try again",
    chatEyebrow: "AI concierge", chatTitle: "Ask about the menu, sauces, sake or booking", chatText: "Chat runs through the server. For voice input, press the microphone and allow browser access.",
    aboutEyebrow: "About", aboutTitle: "Sakura Table - sushi, rolls and sake restaurant", aboutText: "We combine calm Japanese serving, fresh products and convenient online service: catalog, booking, delivery, account and operator support work together.",
    kitchenTitle: "Made to order", kitchenText: "Rolls are assembled after the order, rice stays warm, and sauces are paired with fish, sides and sake.",
    aboutDeliveryTitle: "Delivery and booking", aboutDeliveryText: "Requests are saved in Django, so the admin sees orders, bookings and guest data in the control panel.",
    whereEyebrow: "Where we are", mapTitle: "Map and contacts", mapText: "Come for dinner, sake tasting or pickup. The map is interactive on the site.",
    schedule: "Mon-Sun: 11:00-23:00", footerText: "Since 2010, we have prepared sushi, rolls and hot Japanese snacks for dinners, bookings and city delivery.", links: "Links", contact: "Contact", rights: "© 2026 Sakura Table. All rights reserved.",
    authLogin: "Sign in", authRegister: "Sign up", password: "Password", passwordRules: "At least 8 characters and one special character.", generatePassword: "Generate password", createAccount: "Create account",
    registrationTempo: "Registration pace", registrationTime: "Time:", registrationActions: "Actions:", close: "×",
    chatGreeting: "Hello. I can help with menu, sake, sauces, booking and delivery.", chatPlaceholder: "Ask about a set, delivery or booking", voiceInput: "Voice input", operator: "Operator", send: "Send", chatNote: "AI runs through the server; the key never reaches the browser."
  },
  kk: {
    navHome: "Басты бет", navCatalog: "Каталог", navDelivery: "Жеткізу", navBooking: "Бронь", navQuiz: "Викторина", navAbout: "Біз туралы",
    navMenu: "Мәзір", brandSmall: "Суши. Роллдар. Саке.", login: "Кіру", logout: "Шығу", profile: "Профиль", cartOpen: "Себетті ашу",
    heroEyebrow: "Маусымдық жапон мәзірі", heroTitle: "Ыстық тағамдары, сакесі және жеткізуі бар суши-бар.",
    heroText: "Роллдар, нигири, сеттер, васаби, гари, соустар және жылы гарнирлер. Аккаунтқа кіріп, үстел брондаңыз немесе жеткізуге тапсырыс беріңіз.",
    bookTable: "Үстел брондау", chooseMenu: "Мәзірден таңдау",
    bandOneTitle: "Роллдар тапсырыс бойынша дайындалады", bandOneText: "Күріш жылы, балық беру алдында кесіледі, соустар әр сетке сай таңдалады.",
    bandTwoTitle: "Кешкі sushi counter", bandTwoText: "Кешкі асқа, саке дегустациясына келуге немесе тапсырысты алып кетуге болады.",
    homeEyebrow: "Sakura Table кеші", homeTitle: "Көңіл-күйіңізге сай кешкі ас жинаңыз",
    homeText: "Жеңіл нигири, жылы роллдар, компанияға сет, балыққа саке және мінезі бөлек соустар. Залда отыруға, алдын ала брондауға немесе жеткізуге тапсырыс беруге болады.",
    hubSetTitle: "Компанияға сеттер", hubSetText: "Нигири, ролл, васаби, гари және фирмалық соустары бар үлкен жинақтар.",
    hubDeliveryTitle: "Кешкі асқа жеткізу", hubDeliveryText: "Себет жинаңыз, уақыт пен төлемді таңдаңыз, тапсырыс асүйге кетеді.",
    hubBookingTitle: "Залдағы үстел", hubBookingText: "Кездесуге, достармен отыруға немесе тыныш саке дегустациясына.",
    hubFindTitle: "Бізді табу", hubFindText: "Алматы орталығындағы мекенжай, жұмыс уақыты, телефон және карта.",
    hubQuizTitle: "Промокод викторинасы", hubQuizText: "Суши туралы сұрақтарға жауап беріп, жеткізуге 5% жеңілдік алыңыз.",
    menuEyebrow: "Мәзір", menuTitle: "Суши, роллдар, саке, гарнирлер және соустар", menuText: "Позицияларды себетке қосыңыз. Санын және құрамын себетте өзгертуге болады.", menuPdf: "PDF мәзірді жүктеу",
    filterAll: "Барлығы", filterSets: "Сеттер", filterSushi: "Суши", filterRolls: "Роллдар", filterDrinks: "Саке", filterSides: "Гарнирлер", filterSauces: "Соустар",
    bookingEyebrow: "Брондау", bookingTitle: "Кешкі асқа, дегустацияға немесе кездесуге үстел", bookingText: "Бронь базаға сақталады және админ-панельде көрінеді. Жіберу үшін аккаунт керек.",
    name: "Аты", phone: "Телефон", date: "Күні", time: "Уақыты", guests: "Қонақтар", occasion: "Себеп", notes: "Тілектер", sendBooking: "Бронь жіберу",
    deliveryEyebrow: "Жеткізу", deliveryTitle: "Сушиге үйге немесе кеңсеге тапсырыс", deliveryText: "Мәзірден тағам таңдаңыз, кейін себетті ашыңыз. Сол жерде санын өзгертіп, тапсырыс жібере аласыз.",
    deliveryStep1: "Кіріңіз немесе тіркеліңіз.", deliveryStep2: "Суши, ролл, саке және соустарды себетке қосыңыз.", deliveryStep3: "Себетті ашып, жеткізуге жіберіңіз.",
    cartEyebrow: "Себет", cartTitle: "Жеткізу алдында тапсырысты тексеріңіз", cartText: "Тағам санын осы жерде өзгертуге болады. Себет браузерде сақталады.",
    subtotal: "Сома:", discount: "Жеңілдік:", total: "Барлығы:", backCatalog: "Каталогқа оралу", address: "Мекенжай", payment: "Төлем", promo: "Промокод", apply: "Қолдану", comment: "Пікір", callDelivery: "Жеткізуді шақыру",
    asap: "Мүмкіндігінше тез", cardPay: "Курьерге картамен", cashPay: "Қолма-қол", onlinePay: "Онлайн",
    onlineSafety: "Қауіпсіздік үшін сайт карта нөмірін толық және CVV сақтамайды. Онлайн төлем үшін тексеруге керек деректерді енгізіңіз.",
    onlineMethod: "Онлайн төлем түрі", transferPhone: "Аударым телефоны", payerName: "Төлеуші аты", cardLast4: "Картаның соңғы 4 саны", paymentComment: "Төлем пікірі",
    profileEyebrow: "Жеке кабинет", profileTitle: "Қонақ профилі", profilePhotoText: "Фотоны сілтемемен қоюға немесе құрылғыдан таңдауға болады. Таңдалған сурет профиль базасына сақталады.",
    email: "Email", avatarUrl: "Профиль фотосы", avatarFile: "Фото жүктеу", newPassword: "Жаңа құпиясөз", saveProfile: "Профильді сақтау",
    quizEyebrow: "Викторина", quizTitle: "Суши білімін тексеріп, промокод алыңыз", quizText: "10 сұрақ бар. Кемінде 7 дұрыс жауап берсеңіз, жеткізуге 5% промокод беріледі.",
    promoWon: "Сіздің промокодыңыз:", promoHint: "Оны жеткізу рәсімдегенде себетке енгізіңіз.", quizSubmit: "Жауаптарды тексеру", quizAgain: "Қайта өту",
    chatEyebrow: "AI-консьерж", chatTitle: "Мәзір, соус, саке немесе бронь туралы сұраңыз", chatText: "Чат сервер арқылы жұмыс істейді. Дауыспен енгізу үшін микрофонды басып, браузерге рұқсат беріңіз.",
    aboutEyebrow: "Біз туралы", aboutTitle: "Sakura Table - суши, ролл және саке мейрамханасы", aboutText: "Біз жапондық тыныш ұсынуды, балғын өнімдерді және ыңғайлы онлайн-сервисті біріктіреміз: каталог, бронь, жеткізу, жеке кабинет және оператор қолдауы.",
    kitchenTitle: "Тапсырыс бойынша асүй", kitchenText: "Роллдар тапсырыстан кейін жиналады, күріш жылы, соустар балыққа, гарнирге және сакеге сай таңдалады.",
    aboutDeliveryTitle: "Жеткізу және бронь", aboutDeliveryText: "Өтінімдер Django базасына сақталады, сондықтан админ тапсырыстарды, броньдарды және қонақ деректерін көреді.",
    whereEyebrow: "Қайдамыз", mapTitle: "Карта және байланыс", mapText: "Кешкі асқа, саке дегустациясына немесе алып кетуге келіңіз. Карта сайтта интерактивті.",
    schedule: "Дс-Жс: 11:00-23:00", footerText: "2010 жылдан бері кешкі асқа, броньға және қала бойынша жеткізуге суши, ролл және ыстық жапон тіскебасарларын дайындаймыз.", links: "Сілтемелер", contact: "Байланыс", rights: "© 2026 Sakura Table. Барлық құқықтар қорғалған.",
    authLogin: "Кіру", authRegister: "Тіркелу", password: "Құпиясөз", passwordRules: "Кемінде 8 таңба және бір арнайы таңба.", generatePassword: "Құпиясөз жасау", createAccount: "Аккаунт жасау",
    registrationTempo: "Тіркелу қарқыны", registrationTime: "Уақыт:", registrationActions: "Әрекет:", close: "×",
    chatGreeting: "Сәлеметсіз бе. Мәзір, саке, соустар, бронь және жеткізу бойынша көмектесемін.", chatPlaceholder: "Сет, жеткізу немесе бронь туралы сұраңыз", voiceInput: "Дауыспен енгізу", operator: "Оператор", send: "Жіберу", chatNote: "AI сервер арқылы жұмыс істейді, кілт браузерге түспейді."
  }
};

function tr(key) {
  return TEXT[state.lang]?.[key] || TEXT.ru[key] || key;
}

const MESSAGE = {
  ru: {
    addCart: "В корзину",
    unavailable: "нет в наличии",
    cartEmpty: "Корзина пуста. Добавьте позиции из меню.",
    portion: "за порцию",
    remove: "Убрать",
    quantity: "Количество",
    itemAdded: "Позиция добавлена в корзину.",
    loginNeeded: "Сначала войдите или зарегистрируйтесь.",
    deliveryLogin: "Для доставки нужен аккаунт.",
    bookingLogin: "Для бронирования нужен аккаунт.",
    profileLogin: "Для редактирования профиля нужен аккаунт.",
    cartNeedItems: "Добавьте хотя бы одну позицию в корзину.",
    onlinePayNeedDetails: "Для онлайн-оплаты укажите телефон перевода или последние 4 цифры карты.",
    deliveryDone: "Заказ принят. Статус можно менять в админ-панели.",
    deliveryToast: "Доставка оформлена.",
    bookingDone: "Бронь отправлена. Администратор увидит ее в панели.",
    accountCreated: "Аккаунт создан.",
    loggedIn: "Вы вошли в аккаунт.",
    loggedOut: "Вы вышли.",
    profileUpdated: "Профиль обновлен.",
    profileSaved: "Профиль сохранен.",
    passwordGenerated: "Пароль сгенерирован.",
    passwordHint: "Пароль должен быть от 8 символов и содержать спецсимвол.",
    promoApplied: "Промокод применен: скидка 5%.",
    promoInvalid: "Такой промокод не найден.",
    promoCleared: "Промокод очищен.",
    quizNeedAll: "Ответьте на все 10 вопросов.",
    quizWin: "Правильных ответов: {score}/10. Промокод SAKURA5 добавлен в корзину.",
    quizLose: "Правильных ответов: {score}/10. Для промокода нужно минимум 7.",
    quizResult: "Результат викторины",
    thinking: "Думаю...",
    localFallback: "Сейчас могу ответить на базовые вопросы: адрес, время работы, доставка, бронь, оплата, меню и оператор.",
    operatorLogin: "Чтобы вызвать оператора, войдите или зарегистрируйтесь.",
    operatorCalled: "Оператор вызван. Ответ администратора появится здесь автоматически.",
    operatorSoon: "Оператор скоро подключится в этом чате.",
    speechUnsupported: "Голосовой ввод не поддерживается этим браузером.",
    speechReady: "Речь распознана. Нажмите отправить или отредактируйте текст.",
    speechError: "Не удалось распознать речь. Проверьте доступ к микрофону.",
    listening: "Слушаю..."
  },
  en: {
    addCart: "Add to cart",
    unavailable: "unavailable",
    cartEmpty: "The cart is empty. Add dishes from the menu.",
    portion: "per portion",
    remove: "Remove",
    quantity: "Quantity",
    itemAdded: "Item added to cart.",
    loginNeeded: "Sign in or create an account first.",
    deliveryLogin: "An account is required for delivery.",
    bookingLogin: "An account is required for booking.",
    profileLogin: "An account is required to edit the profile.",
    cartNeedItems: "Add at least one item to the cart.",
    onlinePayNeedDetails: "For online payment, enter a transfer phone or the last 4 card digits.",
    deliveryDone: "Order accepted. Status can be changed in the admin panel.",
    deliveryToast: "Delivery order placed.",
    bookingDone: "Booking sent. The administrator will see it in the panel.",
    accountCreated: "Account created.",
    loggedIn: "You are signed in.",
    loggedOut: "You are signed out.",
    profileUpdated: "Profile updated.",
    profileSaved: "Profile saved.",
    passwordGenerated: "Password generated.",
    passwordHint: "Password must be at least 8 characters and include a special character.",
    promoApplied: "Promo code applied: 5% discount.",
    promoInvalid: "Promo code not found.",
    promoCleared: "Promo code cleared.",
    quizNeedAll: "Answer all 10 questions.",
    quizWin: "Correct answers: {score}/10. Promo code SAKURA5 was added to the cart.",
    quizLose: "Correct answers: {score}/10. You need at least 7 for a promo code.",
    quizResult: "Quiz result",
    thinking: "Thinking...",
    localFallback: "I can answer basic questions now: address, hours, delivery, booking, payment, menu and operator.",
    operatorLogin: "Sign in or create an account to call an operator.",
    operatorCalled: "Operator called. The administrator's reply will appear here automatically.",
    operatorSoon: "An operator will join this chat soon.",
    speechUnsupported: "Voice input is not supported by this browser.",
    speechReady: "Speech recognized. Press send or edit the text.",
    speechError: "Could not recognize speech. Check microphone access.",
    listening: "Listening..."
  },
  kk: {
    addCart: "Себетке",
    unavailable: "қазір жоқ",
    cartEmpty: "Себет бос. Мәзірден позиция қосыңыз.",
    portion: "порция үшін",
    remove: "Алу",
    quantity: "Саны",
    itemAdded: "Позиция себетке қосылды.",
    loginNeeded: "Алдымен кіріңіз немесе тіркеліңіз.",
    deliveryLogin: "Жеткізу үшін аккаунт керек.",
    bookingLogin: "Брондау үшін аккаунт керек.",
    profileLogin: "Профильді өңдеу үшін аккаунт керек.",
    cartNeedItems: "Себетке кемінде бір позиция қосыңыз.",
    onlinePayNeedDetails: "Онлайн төлем үшін аударым телефонын немесе картаның соңғы 4 санын көрсетіңіз.",
    deliveryDone: "Тапсырыс қабылданды. Статусты админ панельде өзгертуге болады.",
    deliveryToast: "Жеткізу рәсімделді.",
    bookingDone: "Бронь жіберілді. Әкімші оны панельде көреді.",
    accountCreated: "Аккаунт жасалды.",
    loggedIn: "Аккаунтқа кірдіңіз.",
    loggedOut: "Сіз шықтыңыз.",
    profileUpdated: "Профиль жаңартылды.",
    profileSaved: "Профиль сақталды.",
    passwordGenerated: "Құпиясөз жасалды.",
    passwordHint: "Құпиясөз кемінде 8 таңбадан және арнайы таңбадан тұруы керек.",
    promoApplied: "Промокод қолданылды: 5% жеңілдік.",
    promoInvalid: "Мұндай промокод табылмады.",
    promoCleared: "Промокод тазартылды.",
    quizNeedAll: "10 сұрақтың бәріне жауап беріңіз.",
    quizWin: "Дұрыс жауаптар: {score}/10. SAKURA5 промокоды себетке қосылды.",
    quizLose: "Дұрыс жауаптар: {score}/10. Промокод үшін кемінде 7 керек.",
    quizResult: "Викторина нәтижесі",
    thinking: "Ойланып тұрмын...",
    localFallback: "Қазір негізгі сұрақтарға жауап бере аламын: мекенжай, жұмыс уақыты, жеткізу, бронь, төлем, мәзір және оператор.",
    operatorLogin: "Оператор шақыру үшін кіріңіз немесе тіркеліңіз.",
    operatorCalled: "Оператор шақырылды. Әкімшінің жауабы осында автоматты түрде шығады.",
    operatorSoon: "Оператор жақында осы чатқа қосылады.",
    speechUnsupported: "Бұл браузер дауыспен енгізуді қолдамайды.",
    speechReady: "Сөз танылды. Жіберуді басыңыз немесе мәтінді өңдеңіз.",
    speechError: "Сөзді тану мүмкін болмады. Микрофон рұқсатын тексеріңіз.",
    listening: "Тыңдап тұрмын..."
  }
};

function msg(key, params = {}) {
  let value = MESSAGE[state.lang]?.[key] || MESSAGE.ru[key] || key;
  Object.entries(params).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, replacement);
  });
  return value;
}

function setLanguage(lang) {
  state.lang = ["ru", "en", "kk"].includes(lang) ? lang : "ru";
  localStorage.setItem("sakura-lang", state.lang);
  applyTranslations();
}

const QUIZ = [
  {
    question: { ru: "Что обычно подают рядом с суши для очищения вкуса?", en: "What is commonly served with sushi to cleanse the palate?", kk: "Сушимен бірге дәмді тазарту үшін не беріледі?" },
    options: { ru: ["Гари", "Кетчуп", "Сливки"], en: ["Gari", "Ketchup", "Cream"], kk: ["Гари", "Кетчуп", "Кілегей"] },
    answer: 0
  },
  {
    question: { ru: "Как называется рисовая основа с кусочком рыбы сверху?", en: "What is rice topped with a slice of fish called?", kk: "Үстінде балық тілімі бар күріш қалай аталады?" },
    options: { ru: ["Нигири", "Темпура", "Рамен"], en: ["Nigiri", "Tempura", "Ramen"], kk: ["Нигири", "Темпура", "Рамен"] },
    answer: 0
  },
  {
    question: { ru: "Что такое васаби?", en: "What is wasabi?", kk: "Васаби деген не?" },
    options: { ru: ["Острая японская приправа", "Сладкий рис", "Сорт саке"], en: ["A spicy Japanese condiment", "Sweet rice", "A sake type"], kk: ["Ащы жапон дәмдеуіші", "Тәтті күріш", "Саке түрі"] },
    answer: 0
  },
  {
    question: { ru: "С чем чаще всего сочетают саке в суши-баре?", en: "What is sake often paired with in a sushi bar?", kk: "Суши-барда саке көбіне немен үйлеседі?" },
    options: { ru: ["Рыбой и роллами", "Мороженым", "Кофе"], en: ["Fish and rolls", "Ice cream", "Coffee"], kk: ["Балық және роллдармен", "Балмұздақпен", "Кофемен"] },
    answer: 0
  },
  {
    question: { ru: "Что означает слово 'сет' в меню суши?", en: "What does 'set' mean on a sushi menu?", kk: "Суши мәзіріндегі 'сет' нені білдіреді?" },
    options: { ru: ["Набор разных позиций", "Один соус", "Только напиток"], en: ["A selection of different items", "One sauce", "Only a drink"], kk: ["Әртүрлі позициялар жинағы", "Бір соус", "Тек сусын"] },
    answer: 0
  },
  {
    question: { ru: "Какой соус часто бывает цитрусово-соевым?", en: "Which sauce is often citrus-soy based?", kk: "Қай соус көбіне цитрус-соя негізінде болады?" },
    options: { ru: ["Понзу", "Карамель", "Ваниль"], en: ["Ponzu", "Caramel", "Vanilla"], kk: ["Понзу", "Карамель", "Ваниль"] },
    answer: 0
  },
  {
    question: { ru: "Что лучше сделать перед оформлением доставки?", en: "What should you do before placing a delivery order?", kk: "Жеткізуге тапсырыс берер алдында не істеген дұрыс?" },
    options: { ru: ["Проверить корзину", "Закрыть сайт", "Удалить адрес"], en: ["Check the cart", "Close the site", "Delete the address"], kk: ["Себетті тексеру", "Сайтты жабу", "Мекенжайды өшіру"] },
    answer: 0
  },
  {
    question: { ru: "Какой ингредиент часто используют в роллах для свежести?", en: "Which ingredient is often used in rolls for freshness?", kk: "Роллдарға балғындық үшін қандай ингредиент жиі қосылады?" },
    options: { ru: ["Огурец", "Шоколад", "Картофель"], en: ["Cucumber", "Chocolate", "Potato"], kk: ["Қияр", "Шоколад", "Картоп"] },
    answer: 0
  },
  {
    question: { ru: "Где на сайте можно найти карту ресторана?", en: "Where can you find the restaurant map?", kk: "Сайтта мейрамхана картасын қайдан табуға болады?" },
    options: { ru: ["На странице О нас", "В поле пароля", "В PDF меню"], en: ["On the About page", "In the password field", "In the PDF menu"], kk: ["Біз туралы бетінде", "Құпиясөз өрісінде", "PDF мәзірде"] },
    answer: 0
  },
  {
    question: { ru: "Сколько правильных ответов нужно для промокода?", en: "How many correct answers are needed for a promo code?", kk: "Промокод алу үшін қанша дұрыс жауап керек?" },
    options: { ru: ["7", "3", "10"], en: ["7", "3", "10"], kk: ["7", "3", "10"] },
    answer: 0
  }
];

function setText(selector, key, root = document) {
  $$(selector, root).forEach((node) => {
    node.textContent = tr(key);
  });
}

function setPlaceholder(selector, key) {
  $$(selector).forEach((node) => {
    node.placeholder = tr(key);
  });
}

function setLabel(selector, key) {
  $$(selector).forEach((label) => {
    const textNode = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (textNode) textNode.textContent = tr(key) + " ";
  });
}

function applyTranslations() {
  document.documentElement.lang = state.lang === "kk" ? "kk" : state.lang;
  const switcher = $("[data-language-switch]");
  if (switcher) switcher.value = state.lang;
  $(".brand small").textContent = tr("brandSmall");
  setText(".nav-toggle", "navMenu");
  const navKeys = ["navHome", "navCatalog", "navDelivery", "navBooking", "navQuiz", "navAbout"];
  $$("#site-nav a").forEach((link, index) => link.textContent = tr(navKeys[index]));
  $$(".footer-links a").forEach((link, index) => link.textContent = tr(["navHome", "navCatalog", "navBooking", "navDelivery", "navQuiz", "navAbout"][index]));
  setText("[data-open-auth]", "login");
  setText("[data-logout]", "logout");
  setText("[data-open-profile]", "profile");
  $("[data-open-cart]")?.setAttribute("aria-label", tr("cartOpen"));

  setText("#home .eyebrow", "heroEyebrow");
  setText("#home h1", "heroTitle");
  setText(".hero-text", "heroText");
  setText(".hero-actions .primary-btn", "bookTable");
  setText(".hero-actions .secondary-btn", "chooseMenu");
  setText(".photo-band article:nth-child(1) h2", "bandOneTitle");
  setText(".photo-band article:nth-child(1) p", "bandOneText");
  setText(".photo-band article:nth-child(2) h2", "bandTwoTitle");
  setText(".photo-band article:nth-child(2) p", "bandTwoText");
  setText(".home-hub .eyebrow", "homeEyebrow");
  setText(".home-hub h2", "homeTitle");
  setText(".home-hub .section-heading p:not(.eyebrow)", "homeText");
  ["hubSet", "hubDelivery", "hubBooking", "hubFind", "hubQuiz"].forEach((base, index) => {
    const card = $(`.hub-card:nth-child(${index + 1})`);
    if (!card) return;
    $("h3", card).textContent = tr(`${base}Title`);
    $("p", card).textContent = tr(`${base}Text`);
  });

  setText("#menu .eyebrow", "menuEyebrow");
  setText("#menu h2", "menuTitle");
  setText("#menu .section-heading p:not(.eyebrow)", "menuText");
  setText(".menu-download", "menuPdf");
  $$("[data-filter]").forEach((button) => {
    const key = {
      all: "filterAll", sets: "filterSets", sushi: "filterSushi", rolls: "filterRolls", drinks: "filterDrinks", sides: "filterSides", sauces: "filterSauces"
    }[button.dataset.filter];
    button.textContent = tr(key);
  });

  setText("#booking .eyebrow", "bookingEyebrow");
  setText("#booking h2", "bookingTitle");
  setText("#booking .section-heading p:not(.eyebrow)", "bookingText");
  setLabel("[data-reservation-form] label:has(input[name='name'])", "name");
  setLabel("[data-reservation-form] label:has(input[name='phone'])", "phone");
  setLabel("[data-reservation-form] label:has(input[name='date'])", "date");
  setLabel("[data-reservation-form] label:has(input[name='time'])", "time");
  setLabel("[data-reservation-form] label:has(input[name='guests'])", "guests");
  setLabel("[data-reservation-form] label:has(input[name='occasion'])", "occasion");
  setLabel("[data-reservation-form] label:has(textarea[name='notes'])", "notes");
  setText("[data-reservation-form] button[type='submit']", "sendBooking");
  setText("#delivery .eyebrow", "deliveryEyebrow");
  setText("#delivery h2", "deliveryTitle");
  setText("#delivery .section-heading p:not(.eyebrow)", "deliveryText");
  setText(".delivery-card li:nth-child(1)", "deliveryStep1");
  setText(".delivery-card li:nth-child(2)", "deliveryStep2");
  setText(".delivery-card li:nth-child(3)", "deliveryStep3");
  setText(".delivery-card [data-open-cart]", "cartOpen");

  setText("#cart-page .eyebrow", "cartEyebrow");
  setText("#cart-page h2", "cartTitle");
  setText("#cart-page .section-heading > p", "cartText");
  setText("#cart-page .secondary-btn", "backCatalog");
  setLabel("[data-delivery-form] label:has(input[name='name'])", "name");
  setLabel("[data-delivery-form] label:has(input[name='phone'])", "phone");
  setLabel("[data-delivery-form] label:has(input[name='address'])", "address");
  setLabel("[data-delivery-form] label:has(select[name='timeWindow'])", "time");
  setLabel("[data-delivery-form] label:has(select[name='payment'])", "payment");
  setLabel("[data-delivery-form] label:has(input[name='promoCode'])", "promo");
  setText("[data-apply-promo]", "apply");
  setText("[data-delivery-form] button[type='submit']", "callDelivery");
  setText("[data-payment-details] p", "onlineSafety");
  setLabel("[data-payment-details] label:has(select[name='onlineMethod'])", "onlineMethod");
  setLabel("[data-payment-details] label:has(input[name='payerName'])", "payerName");
  setLabel("[data-payment-details] label:has(input[name='transferPhone'])", "transferPhone");
  setLabel("[data-payment-details] label:has(input[name='cardLast4'])", "cardLast4");
  setLabel("[data-payment-details] label:has(input[name='paymentComment'])", "paymentComment");
  setLabel("[data-delivery-form] label:has(textarea[name='notes'])", "comment");
  $$("select[name='timeWindow'] option[value='asap']").forEach((node) => node.textContent = tr("asap"));
  $$("select[name='payment'] option[value='card']").forEach((node) => node.textContent = tr("cardPay"));
  $$("select[name='payment'] option[value='cash']").forEach((node) => node.textContent = tr("cashPay"));
  $$("select[name='payment'] option[value='online']").forEach((node) => node.textContent = tr("onlinePay"));
  $$("select[name='onlineMethod'] option[value='transfer_phone']").forEach((node) => node.textContent = tr("transferPhone"));
  $$("select[name='onlineMethod'] option[value='card_last4']").forEach((node) => node.textContent = tr("cardLast4"));

  setText("#profile-page .eyebrow", "profileEyebrow");
  setText("#profile-page h2", "profileTitle");
  setText(".profile-avatar-card p", "profilePhotoText");
  setLabel("[data-profile-form] label:has(input[name='name'])", "name");
  setLabel("[data-profile-form] label:has(input[name='phone'])", "phone");
  setLabel("[data-profile-form] label:has(input[name='email'])", "email");
  setLabel("[data-profile-form] label:has(input[name='avatarUrl'])", "avatarUrl");
  setLabel("[data-profile-form] label:has(input[name='avatarFile'])", "avatarFile");
  setLabel("[data-profile-form] label:has(input[name='password'])", "newPassword");
  setText("[data-profile-form] button[type='submit']", "saveProfile");

  setText("#quiz-page .eyebrow", "quizEyebrow");
  setText("#quiz-page h2", "quizTitle");
  setText("#quiz-page .section-heading > p", "quizText");
  const rewardTitle = $("[data-quiz-reward] strong");
  if (rewardTitle) rewardTitle.innerHTML = `${tr("promoWon")} <span data-promo-code>${PROMO_CODE}</span>`;
  setText("[data-quiz-reward] p", "promoHint");

  setText("#chat .eyebrow", "chatEyebrow");
  setText("#chat h2", "chatTitle");
  setText("#chat .section-heading p:not(.eyebrow)", "chatText");
  setText("#about > .section-heading .eyebrow", "aboutEyebrow");
  setText("#about > .section-heading h2", "aboutTitle");
  setText("#about > .section-heading p:not(.eyebrow)", "aboutText");
  setText(".about-grid article:nth-child(1) h3", "kitchenTitle");
  setText(".about-grid article:nth-child(1) p", "kitchenText");
  setText(".about-grid article:nth-child(2) h3", "aboutDeliveryTitle");
  setText(".about-grid article:nth-child(2) p", "aboutDeliveryText");
  setText(".location-heading .eyebrow", "whereEyebrow");
  setText(".location-heading h2", "mapTitle");
  setText(".location-heading p:not(.eyebrow)", "mapText");
  setText(".location-card p:nth-of-type(2)", "schedule");
  setText(".footer-brand p", "footerText");
  setText(".site-footer h3:nth-of-type(1)", "links");
  $$(".site-footer h3").forEach((node, index) => node.textContent = index === 0 ? tr("links") : tr("contact"));
  setText(".footer-bottom", "rights");

  setText("[data-auth-mode='login']", "authLogin");
  setText("[data-auth-mode='register']", "authRegister");
  setLabel("[data-login-form] label:has(input[name='password'])", "password");
  setLabel("[data-register-form] label:has(input[name='name'])", "name");
  setLabel("[data-register-form] label:has(input[name='phone'])", "phone");
  setLabel("[data-register-form] label:has(input[name='email'])", "email");
  setLabel("[data-register-form] label:has(input[name='password'])", "password");
  setText("#password-rules", "passwordRules");
  setText("[data-generate-password]", "generatePassword");
  setText("[data-register-form] button[type='submit']", "createAccount");
  setText("[data-register-metrics] strong", "registrationTempo");
  setText("[data-login-form] button[type='submit']", "login");
  setText(".chat-head strong", "chatEyebrow");
  setText(".chat-log .assistant-msg:first-child", "chatGreeting");
  setPlaceholder("#chat-message", "chatPlaceholder");
  setText("[data-call-operator]", "operator");
  setText("[data-chat-form] button[type='submit']", "send");
  setText("[data-chat-note]", "chatNote");

  renderMenu();
  renderCart();
  renderQuiz();
  updateRegistrationMetrics();
}

function imageFor(item) {
  const customImage = String(item.imageUrl || "").trim();
  return customImage || fallbackImageFor(item);
}

function fallbackImageFor(item) {
  return dishImagesByName[String(item.name || "").trim().toLowerCase()] || menuImages[item.category] || menuImages.rolls;
}

function handleMenuImageError(event) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = img.dataset.fallback || menuImages.rolls;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    cache: "no-store",
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formData(form) {
  const data = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (value instanceof File) continue;
    data[key] = value;
  }
  return data;
}

function pageFromPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return pageFromHref(path);
}

function pageFromHref(href) {
  const path = (href || "/").replace(/\/+$/, "") || "/";
  return {
    "/": "home",
    "/catalog": "catalog",
    "/delivery": "delivery",
    "/booking": "booking",
    "/cart": "cart",
    "/profile": "profile",
    "/quiz": "quiz",
    "/about": "about"
  }[path] || "home";
}

function applyPage() {
  state.page = pageFromPath();
  document.body.dataset.page = state.page;
  const titles = {
    home: "Sakura Table - суши, роллы, саке и доставка",
    catalog: "Каталог - Sakura Table",
    delivery: "Доставка - Sakura Table",
    booking: "Бронь столика - Sakura Table",
    cart: "Корзина - Sakura Table",
    profile: "Личный кабинет - Sakura Table",
    quiz: "Викторина - Sakura Table",
    about: "О нас - Sakura Table"
  };
  document.title = titles[state.page] || titles.home;
  $$(".site-nav a, .footer-links a").forEach((link) => {
    const linkPage = pageFromHref(link.getAttribute("href"));
    link.classList.toggle("active", linkPage === state.page);
  });
}

function toast(message) {
  const node = $("[data-toast]");
  node.textContent = message;
  node.classList.add("show");
  node.setAttribute("aria-hidden", "false");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    node.classList.remove("show");
    node.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (!node.classList.contains("show")) node.textContent = "";
    }, 220);
  }, 2000);
}

function setMessage(selector, message, isError = false) {
  const node = $(selector);
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function isStrongPassword(password) {
  return password.length >= 8 && /[^A-Za-z0-9]/.test(password);
}

function passwordHint() {
  return msg("passwordHint");
}

function generatePassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%&*?";
  const all = letters + digits + specials;
  const chars = [specials[Math.floor(Math.random() * specials.length)], digits[Math.floor(Math.random() * digits.length)]];
  while (chars.length < 12) chars.push(all[Math.floor(Math.random() * all.length)]);
  return chars.sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2147483648).join("");
}

function visibleRegisterControls() {
  const form = $("[data-register-form]");
  if (!form || form.hidden) return [];
  return $$("input, button, select, textarea", form).filter((node) => !node.disabled && node.type !== "hidden");
}

function startRegistrationMetrics(reset = false) {
  const metrics = state.registrationMetrics;
  if (reset || !metrics.startedAt) {
    metrics.startedAt = performance.now();
    metrics.actions = 0;
    metrics.fittsSeconds = 0;
    metrics.lastPoint = null;
  }
  const choices = Math.max(1, visibleRegisterControls().length);
  metrics.hickSeconds = 0.18 * Math.log2(choices + 1);
  clearInterval(metrics.timer);
  metrics.timer = setInterval(updateRegistrationMetrics, 250);
  updateRegistrationMetrics();
}

function stopRegistrationMetrics() {
  clearInterval(state.registrationMetrics.timer);
  state.registrationMetrics.timer = null;
  updateRegistrationMetrics();
}

function trackRegistrationAction(event) {
  const form = event.target.closest?.("[data-register-form]");
  if (!form || form.hidden) return;
  startRegistrationMetrics(false);
  const metrics = state.registrationMetrics;
  metrics.actions += 1;

  const targetRect = event.target.getBoundingClientRect?.();
  if (targetRect && targetRect.width && targetRect.height) {
    const targetPoint = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2
    };
    const fromPoint = metrics.lastPoint || {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
    const distance = Math.hypot(targetPoint.x - fromPoint.x, targetPoint.y - fromPoint.y);
    const width = Math.max(24, Math.min(targetRect.width, targetRect.height));
    metrics.fittsSeconds += 0.1 + 0.12 * Math.log2(distance / width + 1);
    metrics.lastPoint = targetPoint;
  } else {
    metrics.fittsSeconds += 0.12;
  }
  updateRegistrationMetrics();
}

function updateRegistrationMetrics() {
  const holder = $("[data-register-metrics]");
  if (!holder) return;
  const metrics = state.registrationMetrics;
  const elapsed = metrics.startedAt ? Math.max(0, (performance.now() - metrics.startedAt) / 1000) : 0;
  const time = $("[data-register-time]", holder);
  const actions = $("[data-register-actions]", holder);
  const models = $("[data-register-models]", holder);
  if (time) time.textContent = `${tr("registrationTime")} ${elapsed.toFixed(1)} s`;
  if (actions) actions.textContent = `${tr("registrationActions")} ${metrics.actions}`;
  if (models) models.textContent = `Fitts: ${metrics.fittsSeconds.toFixed(2)} s · Hick-Hyman: ${metrics.hickSeconds.toFixed(2)} s`;
}

function openDialog(selector) {
  const dialog = $(selector);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
}

function closeDialog(selector) {
  const dialog = $(selector);
  if (dialog?.open) dialog.close();
}

function ensureLogin(message = msg("loginNeeded")) {
  if (state.user) return true;
  toast(message);
  openAuth("login");
  return false;
}

function initTheme() {
  const saved = localStorage.getItem("sakura-theme") || "light";
  document.documentElement.dataset.theme = saved;
  updateThemeIcon();
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("sakura-theme", next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = $("[data-theme-icon]");
  if (icon) icon.textContent = document.documentElement.dataset.theme === "dark" ? "☀" : "☾";
}

function renderUser() {
  const chip = $("[data-user-chip]");
  const openAuthButton = $("[data-open-auth]");
  const logoutButton = $("[data-logout]");
  const profileButton = $("[data-open-profile]");

  if (state.user) {
    chip.hidden = false;
    chip.innerHTML = `${state.user.avatarUrl ? `<img src="${escapeHtml(state.user.avatarUrl)}" alt="">` : ""}<span>${escapeHtml(state.user.name)}</span>`;
    openAuthButton.hidden = true;
    logoutButton.hidden = false;
    profileButton.hidden = false;
  } else {
    chip.hidden = true;
    openAuthButton.hidden = false;
    logoutButton.hidden = true;
    profileButton.hidden = true;
  }
  prefillPersonalForms();
}

function prefillPersonalForms() {
  if (!state.user) return;
  $$("[data-reservation-form], [data-delivery-form], [data-profile-form]").forEach((form) => {
    const name = $("input[name='name']", form);
    const phone = $("input[name='phone']", form);
    const email = $("input[name='email']", form);
    const avatar = $("input[name='avatarUrl']", form);
    if (name && !name.value) name.value = state.user.name || "";
    if (phone && !phone.value) phone.value = state.user.phone || "";
    if (email && !email.value) email.value = state.user.email || "";
    if (avatar && !avatar.value) avatar.value = state.user.avatarUrl || "";
    if (form.matches("[data-profile-form]")) updateAvatarPreview(form);
  });
}

function updateAvatarPreview(form = document) {
  const img = $("[data-avatar-preview]", form) || $("[data-avatar-preview]");
  const initials = $("[data-avatar-initials]", form) || $("[data-avatar-initials]");
  if (!img || !initials) return;
  const input = $("input[name='avatarUrl']", form);
  const value = input?.value || state.user?.avatarUrl || "";
  img.hidden = !value;
  initials.hidden = Boolean(value);
  if (value) img.src = value;
  initials.textContent = (state.user?.name || "ST").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "ST";
}

function categoryLabel(category) {
  return {
    sets: tr("filterSets"),
    sushi: tr("filterSushi"),
    rolls: tr("filterRolls"),
    drinks: tr("filterDrinks"),
    sides: tr("filterSides"),
    sauces: tr("filterSauces")
  }[category] || category;
}

function tagsFor(item) {
  if (Array.isArray(item.tags)) return item.tags;
  if (typeof item.tags === "string") {
    return item.tags
      .replace(/;/g, ",")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function renderMenu() {
  const grid = $("[data-menu-grid]");
  const items = state.menu.filter((item) => state.filter === "all" || item.category === state.filter);
  grid.innerHTML = items.map((item) => `
    <article class="menu-card">
      <img class="menu-art" src="${imageFor(item)}" data-fallback="${fallbackImageFor(item)}" alt="${escapeHtml(item.name)}" loading="lazy">
      <div>
        <p class="eyebrow">${categoryLabel(item.category)}</p>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="tag-row">
          ${tagsFor(item).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          ${item.available ? "" : `<span class="tag">${msg("unavailable")}</span>`}
        </div>
      </div>
      <div class="menu-meta">
        <span class="price">${money(item.price)}</span>
        <button class="mini-btn" type="button" data-add-cart="${item.id}" ${item.available ? "" : "disabled"}>${msg("addCart")}</button>
      </div>
    </article>
  `).join("");
  $$(".menu-art", grid).forEach((img) => {
    img.addEventListener("error", handleMenuImageError, { once: true });
  });
}

function cartRows() {
  return [...state.cart.values()];
}

function saveCart() {
  const payload = cartRows().map((row) => ({ id: row.item.id, quantity: row.quantity }));
  localStorage.setItem("sakura-cart", JSON.stringify(payload));
}

function hydrateCart() {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem("sakura-cart") || "[]");
  } catch {
    saved = [];
  }
  state.cart.clear();
  if (!Array.isArray(saved)) return;
  saved.forEach((row) => {
    const item = state.menu.find((entry) => entry.id === String(row.id));
    if (item && item.available) state.cart.set(item.id, { item, quantity: Math.max(1, Number(row.quantity || 1)) });
  });
}

function normalizePromo(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function promoIsValid(value = state.promoCode) {
  return normalizePromo(value) === PROMO_CODE;
}

function savePromo(value) {
  const code = normalizePromo(value);
  state.promoCode = code;
  if (code) {
    localStorage.setItem("sakura-promo", code);
  } else {
    localStorage.removeItem("sakura-promo");
  }
  renderCart();
}

function cartTotals() {
  const subtotal = cartRows().reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  const discount = promoIsValid() ? Math.round(subtotal * PROMO_DISCOUNT) : 0;
  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount)
  };
}

function renderCart() {
  const rows = cartRows();
  $$("[data-cart-items]").forEach((holder) => {
    if (!rows.length) {
      holder.innerHTML = `<p>${msg("cartEmpty")}</p>`;
      return;
    }
    holder.innerHTML = rows.map(({ item, quantity }) => `
      <div class="cart-row">
        <span>${escapeHtml(item.name)}<br><small>${money(item.price)} ${msg("portion")}</small></span>
        <input aria-label="${msg("quantity")} ${escapeHtml(item.name)}" type="number" min="1" value="${quantity}" data-cart-qty="${item.id}">
        <button class="mini-btn danger" type="button" data-cart-remove="${item.id}">${msg("remove")}</button>
      </div>
    `).join("");
  });

  const totals = cartTotals();
  $$("[data-cart-subtotal]").forEach((node) => {
    node.textContent = money(totals.subtotal);
  });
  $$("[data-cart-discount]").forEach((node) => {
    node.textContent = `-${money(totals.discount)}`;
  });
  $$("[data-cart-discount-row]").forEach((node) => {
    node.hidden = !totals.discount;
    const label = node.firstChild;
    if (label) label.textContent = `${tr("discount")} `;
  });
  $$("[data-cart-total]").forEach((node) => {
    node.textContent = money(totals.total);
  });
  $$(".cart-summary p:first-child").forEach((node) => {
    const label = node.firstChild;
    if (label) label.textContent = `${tr("subtotal")} `;
  });
  $$(".cart-total").forEach((node) => {
    const label = node.firstChild;
    if (label) label.textContent = `${tr("total")} `;
  });
  $$("[data-promo-input]").forEach((input) => {
    if (!input.value) input.value = state.promoCode;
  });
  const count = rows.reduce((sum, row) => sum + row.quantity, 0);
  $("[data-cart-count]").textContent = String(count);
}

function renderQuiz() {
  const form = $("[data-quiz-form]");
  if (!form) return;
  form.innerHTML = QUIZ.map((item, index) => `
    <fieldset class="quiz-question">
      <legend><span>${index + 1}</span> ${escapeHtml(item.question[state.lang] || item.question.ru)}</legend>
      <div class="quiz-options">
        ${(item.options[state.lang] || item.options.ru).map((option, optionIndex) => `
          <label class="quiz-option">
            <input type="radio" name="quiz-${index}" value="${optionIndex}" required>
            <span>${escapeHtml(option)}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `).join("") + `
    <div class="quiz-actions">
      <button class="primary-btn" type="submit">${tr("quizSubmit")}</button>
      <button class="secondary-btn" type="button" data-reset-quiz>${tr("quizAgain")}</button>
    </div>
    <p class="form-message" data-quiz-result role="status"></p>
  `;

  const reward = $("[data-quiz-reward]");
  if (reward) reward.hidden = !promoIsValid();
}

function updatePaymentDetails(targetForm = null) {
  const forms = targetForm ? [targetForm] : $$("[data-delivery-form]");
  forms.forEach((form) => {
    const details = $("[data-payment-details]", form);
    const payment = $("select[name='payment']", form)?.value;
    if (!details) return;
    details.hidden = payment !== "online";
    $$("input, select", details).forEach((input) => {
      input.disabled = payment !== "online";
    });
  });
}

function addToCart(id) {
  if (!ensureLogin(msg("deliveryLogin"))) return;
  const item = state.menu.find((entry) => entry.id === id);
  if (!item || !item.available) return;
  const current = state.cart.get(id);
  state.cart.set(id, { item, quantity: current ? current.quantity + 1 : 1 });
  saveCart();
  renderCart();
  toast(msg("itemAdded"));
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  setMessage("[data-auth-message]", "");
  openDialog("[data-auth-dialog]");
}

function setAuthMode(mode) {
  const login = $("[data-login-form]");
  const register = $("[data-register-form]");
  login.hidden = mode !== "login";
  register.hidden = mode !== "register";
  $$("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
  if (mode === "register") {
    startRegistrationMetrics(true);
  } else {
    stopRegistrationMetrics();
  }
}

function openProfile() {
  if (!ensureLogin(msg("profileLogin"))) return;
  if (state.page !== "profile") {
    window.location.href = "/profile/";
    return;
  }
  const form = $("[data-profile-form]");
  form.reset();
  $("input[name='name']", form).value = state.user.name || "";
  $("input[name='phone']", form).value = state.user.phone || "";
  $("input[name='email']", form).value = state.user.email || "";
  $("input[name='avatarUrl']", form).value = state.user.avatarUrl || "";
  updateAvatarPreview(form);
  setMessage("[data-profile-message]", "");
}

function openCart() {
  if (!ensureLogin(msg("deliveryLogin"))) return;
  if (state.page !== "cart") {
    window.location.href = "/cart/";
    return;
  }
  prefillPersonalForms();
  setMessage("[data-delivery-message]", "");
  renderCart();
  updatePaymentDetails();
}

async function initData() {
  initTheme();
  const [me, menu] = await Promise.all([api("/api/me"), api("/api/menu")]);
  state.user = me.user;
  state.menu = menu.menu;
  hydrateCart();
  renderUser();
  applyTranslations();
  if ((state.page === "profile" || state.page === "cart") && !state.user) openAuth("login");
}

function attachEvents() {
  $(".nav-toggle").addEventListener("click", (event) => {
    const nav = $("#site-nav");
    const isOpen = nav.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(isOpen));
  });

  $("[data-theme-toggle]").addEventListener("click", toggleTheme);
  $("[data-language-switch]").addEventListener("change", (event) => setLanguage(event.target.value));
  $("[data-open-auth]").addEventListener("click", () => openAuth("login"));
  $("[data-open-profile]").addEventListener("click", openProfile);
  $$("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (dialog.matches("[data-auth-dialog]")) stopRegistrationMetrics();
    });
  });

  const registerForm = $("[data-register-form]");
  registerForm.addEventListener("pointerdown", trackRegistrationAction);
  registerForm.addEventListener("focusin", trackRegistrationAction);

  $$("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-password]");
    if (toggle) {
      const input = toggle.closest(".password-field").querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      toggle.textContent = input.type === "password" ? "◎" : "◌";
    }

    const generate = event.target.closest("[data-generate-password]");
    if (generate) {
      trackRegistrationAction(event);
      const form = generate.closest("form");
      const input = $("input[name='password']", form);
      input.value = generatePassword();
      input.type = "text";
      toast(msg("passwordGenerated"));
    }

    const promoButton = event.target.closest("[data-apply-promo]");
    if (promoButton) {
      const form = promoButton.closest("[data-delivery-form]");
      const input = $("[data-promo-input]", form);
      const code = normalizePromo(input?.value);
      if (!code) {
        savePromo("");
        setMessage("[data-promo-message]", msg("promoCleared"));
      } else if (promoIsValid(code)) {
        savePromo(code);
        setMessage("[data-promo-message]", msg("promoApplied"));
      } else {
        savePromo("");
        setMessage("[data-promo-message]", msg("promoInvalid"), true);
      }
    }

    const resetQuiz = event.target.closest("[data-reset-quiz]");
    if (resetQuiz) {
      const form = resetQuiz.closest("[data-quiz-form]");
      form.reset();
      setMessage("[data-quiz-result]", "");
    }

    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) addToCart(addButton.dataset.addCart);

    const removeButton = event.target.closest("[data-cart-remove]");
    if (removeButton) {
      state.cart.delete(removeButton.dataset.cartRemove);
      saveCart();
      renderCart();
    }
  });

  $("[data-login-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const data = await api("/api/login", { method: "POST", body: JSON.stringify(formData(form)) });
      state.user = data.user;
      closeDialog("[data-auth-dialog]");
      form.reset();
      renderUser();
      toast(msg("loggedIn"));
    } catch (error) {
      setMessage("[data-auth-message]", error.message, true);
    }
  });

  $("[data-register-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $("input[name='password']", form).value;
    if (!isStrongPassword(password)) {
      setMessage("[data-auth-message]", passwordHint(), true);
      return;
    }
    try {
      stopRegistrationMetrics();
      const data = await api("/api/register", { method: "POST", body: JSON.stringify(formData(form)) });
      state.user = data.user;
      closeDialog("[data-auth-dialog]");
      form.reset();
      renderUser();
      toast(msg("accountCreated"));
    } catch (error) {
      setMessage("[data-auth-message]", error.message, true);
    }
  });

  $$("[data-profile-form]").forEach((profileForm) => profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $("input[name='password']", form).value;
    if (password && !isStrongPassword(password)) {
      setMessage("[data-profile-message]", passwordHint(), true);
      return;
    }
    try {
      const data = await api("/api/me", { method: "PATCH", body: JSON.stringify(formData(form)) });
      state.user = data.user;
      $("input[name='password']", form).value = "";
      renderUser();
      setMessage("[data-profile-message]", msg("profileUpdated"));
      toast(msg("profileSaved"));
    } catch (error) {
      setMessage("[data-profile-message]", error.message, true);
    }
  }));

  $("[data-logout]").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    state.user = null;
    state.cart.clear();
    saveCart();
    renderUser();
    renderCart();
    toast(msg("loggedOut"));
  });

  $$("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderMenu();
    });
  });

  $("[data-quiz-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const answers = QUIZ.map((_, index) => form.elements[`quiz-${index}`]?.value);
    if (answers.some((answer) => answer === undefined || answer === "")) {
      setMessage("[data-quiz-result]", msg("quizNeedAll"), true);
      return;
    }
    const score = answers.reduce((sum, answer, index) => sum + (Number(answer) === QUIZ[index].answer ? 1 : 0), 0);
    state.quizScore = score;
    localStorage.setItem("sakura-quiz-score", String(score));
    if (score >= 7) {
      savePromo(PROMO_CODE);
      const reward = $("[data-quiz-reward]");
      if (reward) reward.hidden = false;
      setMessage("[data-quiz-result]", msg("quizWin", { score }));
      toast(msg("promoApplied"));
    } else {
      setMessage("[data-quiz-result]", msg("quizLose", { score }), true);
    }
  });

  document.addEventListener("input", (event) => {
    const qtyInput = event.target.closest("[data-cart-qty]");
    if (!qtyInput) {
      const paymentSelect = event.target.closest("[data-delivery-form] select[name='payment']");
      if (paymentSelect) updatePaymentDetails(paymentSelect.closest("[data-delivery-form]"));
      if (event.target.matches("input[name='avatarUrl']")) updateAvatarPreview(event.target.closest("[data-profile-form]"));
      return;
    }
    const row = state.cart.get(qtyInput.dataset.cartQty);
    if (!row) return;
    row.quantity = Math.max(1, Number(qtyInput.value || 1));
    state.cart.set(row.item.id, row);
    saveCart();
    renderCart();
  });

  document.addEventListener("change", (event) => {
    const paymentSelect = event.target.closest("[data-delivery-form] select[name='payment']");
    if (paymentSelect) updatePaymentDetails(paymentSelect.closest("[data-delivery-form]"));

    const avatarFile = event.target.closest("[data-avatar-file]");
    if (!avatarFile || !avatarFile.files?.[0]) return;
    const form = avatarFile.closest("[data-profile-form]");
    const avatarInput = $("input[name='avatarUrl']", form);
    const reader = new FileReader();
    reader.onload = () => {
      avatarInput.value = reader.result;
      updateAvatarPreview(form);
    };
    reader.readAsDataURL(avatarFile.files[0]);
  });

  $("[data-reservation-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!ensureLogin(msg("bookingLogin"))) return;
    try {
      await api("/api/reservations", { method: "POST", body: JSON.stringify(formData(form)) });
      form.reset();
      prefillPersonalForms();
      setMessage("[data-reservation-message]", msg("bookingDone"));
    } catch (error) {
      setMessage("[data-reservation-message]", error.message, true);
    }
  });

  $$("[data-delivery-form]").forEach((deliveryForm) => deliveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!ensureLogin(msg("deliveryLogin"))) return;
    if (!state.cart.size) {
      setMessage("[data-delivery-message]", msg("cartNeedItems"), true);
      return;
    }
    const data = {
      ...formData(form),
      items: cartRows().map((row) => ({ menuItemId: row.item.id, quantity: row.quantity }))
    };
    data.promoCode = normalizePromo(data.promoCode || state.promoCode);
    if (data.payment === "online" && !data.transferPhone && !data.cardLast4) {
      setMessage("[data-delivery-message]", msg("onlinePayNeedDetails"), true);
      return;
    }
    try {
      await api("/api/deliveries", { method: "POST", body: JSON.stringify(data) });
      form.reset();
      state.cart.clear();
      saveCart();
      savePromo("");
      renderCart();
      prefillPersonalForms();
      setMessage("[data-delivery-message]", msg("deliveryDone"));
      toast(msg("deliveryToast"));
    } catch (error) {
      setMessage("[data-delivery-message]", error.message, true);
    }
  }));

  attachChatEvents();
}

function localChatAnswer(message) {
  const text = message.toLowerCase();
  const hasAny = (...words) => words.some((word) => text.includes(word));
  const basicAnswers = {
    address: {
      ru: "Мы находимся по адресу: Алматы, Абая 150. Карта и контакты есть на странице «О нас».",
      en: "We are at Almaty, Abay 150. The map and contacts are on the About page.",
      kk: "Біздің мекенжай: Алматы, Абай 150. Карта мен байланыс «Біз туралы» бетінде."
    },
    hours: {
      ru: "Sakura Table работает каждый день с 11:00 до 23:00.",
      en: "Sakura Table is open every day from 11:00 to 23:00.",
      kk: "Sakura Table күн сайын 11:00-23:00 аралығында жұмыс істейді."
    },
    delivery: {
      ru: "Доставку можно оформить через каталог и корзину. Добавьте блюда, откройте корзину, укажите адрес, время, оплату и промокод при наличии.",
      en: "Delivery is placed through the catalog and cart. Add dishes, open the cart, enter address, time, payment and a promo code if you have one.",
      kk: "Жеткізу каталог пен себет арқылы рәсімделеді. Тағамдарды қосып, себетті ашыңыз, мекенжай, уақыт, төлем және промокодты енгізіңіз."
    },
    booking: {
      ru: "Столик можно забронировать на странице «Бронь». Для отправки заявки нужно войти или создать аккаунт.",
      en: "You can reserve a table on the Booking page. Sign in or create an account to submit it.",
      kk: "Үстелді «Бронь» бетінде брондауға болады. Өтінім жіберу үшін аккаунтқа кіру керек."
    },
    payment: {
      ru: "Доступна оплата картой курьеру, наличными и онлайн. Для онлайн-оплаты сайт сохраняет только безопасные данные сверки.",
      en: "You can pay by card to the courier, cash, or online. For online payment, the site stores only safe verification details.",
      kk: "Курьерге карта, қолма-қол немесе онлайн төлеуге болады. Онлайн төлемде сайт тек қауіпсіз тексеру деректерін сақтайды."
    },
    menu: {
      ru: "Каталог доступен на странице «Каталог». Там есть фильтры по сетам, суши, роллам, саке, гарнирам и соусам, а также PDF-меню.",
      en: "The catalog is on the Catalog page with filters for sets, sushi, rolls, sake, sides and sauces, plus a PDF menu.",
      kk: "Каталог «Каталог» бетінде. Сет, суши, ролл, саке, гарнир, соус сүзгілері және PDF мәзір бар."
    },
    sake: {
      ru: "В меню есть саке, которое можно подать охлажденным или теплым. Напишите выбранные блюда, и я подскажу пару.",
      en: "The menu includes sake served chilled or warm. Tell me your dishes and I can suggest a pairing.",
      kk: "Мәзірде салқын немесе жылы берілетін саке бар. Таңдаған тағамдарыңызды жазсаңыз, үйлесімін ұсынамын."
    },
    sauces: {
      ru: "К суши и роллам доступны васаби, гари, понзу, спайси-майо, никири-соя и кунжутные соусы.",
      en: "For sushi and rolls we offer wasabi, gari, ponzu, spicy mayo, nikiri soy and sesame sauces.",
      kk: "Суши мен роллдарға васаби, гари, понзу, спайси-майо, никири-соя және күнжіт соустары бар."
    },
    account: {
      ru: "Аккаунт нужен для брони, доставки и личного кабинета. Пароль должен быть от 8 символов и содержать спецсимвол.",
      en: "An account is required for booking, delivery and profile. Password must be at least 8 characters with a special character.",
      kk: "Аккаунт бронь, жеткізу және жеке кабинет үшін керек. Құпиясөз кемінде 8 таңба және арнайы таңба қамтуы керек."
    },
    operator: {
      ru: "Если нужен живой ответ, нажмите кнопку «Оператор» в чате. Администратор сможет ответить в этом же диалоге.",
      en: "If you need a live reply, press Operator in the chat. The administrator can answer in this same dialog.",
      kk: "Тірі жауап керек болса, чаттағы «Оператор» батырмасын басыңыз. Әкімші осы диалогта жауап бере алады."
    },
    hello: {
      ru: "Здравствуйте. Могу подсказать по меню, доставке, брони, оплате, адресу и времени работы.",
      en: "Hello. I can help with the menu, delivery, booking, payment, address and opening hours.",
      kk: "Сәлеметсіз бе. Мәзір, жеткізу, бронь, төлем, мекенжай және жұмыс уақыты бойынша көмектесемін."
    }
  };

  if (hasAny("адрес", "где", "наход", "карта", "локац", "address", "where", "map", "location", "мекен", "қайда", "карта")) return basicAnswers.address[state.lang];
  if (hasAny("время", "работ", "открыт", "закрыт", "график", "hours", "open", "close", "schedule", "уақыт", "жұмыс")) return basicAnswers.hours[state.lang];
  if (hasAny("достав", "курьер", "привез", "delivery", "courier", "жеткізу", "курьер")) return basicAnswers.delivery[state.lang];
  if (hasAny("брон", "стол", "заброни", "booking", "reserve", "table", "бронь", "үстел")) return basicAnswers.booking[state.lang];
  if (hasAny("оплат", "карта", "налич", "онлайн", "kaspi", "каспи", "payment", "pay", "cash", "card", "төлем", "ақша")) return basicAnswers.payment[state.lang];
  if (hasAny("меню", "каталог", "блюд", "цена", "pdf", "menu", "catalog", "price", "мәзір", "баға")) return basicAnswers.menu[state.lang];
  if (hasAny("саке", "напит", "sake", "drink", "сусын")) return basicAnswers.sake[state.lang];
  if (hasAny("васаби", "соус", "соусы", "гари", "имбир", "wasabi", "sauce", "ginger", "тұздық")) return basicAnswers.sauces[state.lang];
  if (hasAny("регистра", "аккаунт", "профиль", "пароль", "account", "register", "profile", "password", "тіркел", "құпия")) return basicAnswers.account[state.lang];
  if (hasAny("оператор", "человек", "админ", "помощ", "operator", "human", "admin", "help", "көмек")) return basicAnswers.operator[state.lang];
  if (hasAny("привет", "здравств", "добрый", "салам", "hello", "hi", "сәлем")) return basicAnswers.hello[state.lang];

  const categories = {
    sets: "сеты",
    sushi: "суши",
    rolls: "роллы",
    drinks: "саке",
    sides: "гарниры",
    sauces: "соусы"
  };

  if (hasAny("адрес", "где", "находит", "карта", "локац")) {
    return "Мы находимся по адресу: Алматы, Абая 150. Карта и контакты есть на странице «О нас».";
  }
  if (hasAny("время", "работ", "открыт", "закрыт", "график")) {
    return "Sakura Table работает каждый день с 11:00 до 23:00.";
  }
  if (hasAny("достав", "курьер", "привез")) {
    return "Доставку можно оформить через каталог и корзину. Добавьте блюда, откройте корзину, укажите адрес, время и способ оплаты.";
  }
  if (hasAny("брон", "стол", "заброни")) {
    return "Столик можно забронировать на странице «Бронь». Для отправки заявки нужно войти или создать аккаунт.";
  }
  if (hasAny("оплат", "карта", "налич", "онлайн", "kaspi", "каспи")) {
    return "Доступны оплата картой курьеру, наличными и онлайн. Для онлайн-оплаты сайт сохраняет только безопасные данные сверки: способ, имя плательщика, телефон перевода или последние 4 цифры карты.";
  }
  if (hasAny("меню", "каталог", "блюд", "цена", "pdf")) {
    return "Каталог доступен на странице «Каталог». Там можно отфильтровать сеты, суши, роллы, саке, гарниры и соусы, а также скачать PDF-меню.";
  }
  if (hasAny("саке", "напит")) {
    return "В меню есть саке, которое можно подать охлажденным или теплым. Если хотите подобрать пару к роллам, напишите, какие блюда выбираете.";
  }
  if (hasAny("васаби", "соус", "соусы", "гари", "имбир")) {
    return "К суши и роллам доступны васаби, гари, понзу, спайси-майо, никири-соя и кунжутные соусы. Их можно добавить как отдельные позиции в каталоге.";
  }
  if (hasAny("регистра", "аккаунт", "профиль", "пароль")) {
    return "Аккаунт нужен для брони, доставки и личного кабинета. Пароль должен быть от 8 символов и содержать хотя бы один спецсимвол.";
  }
  if (hasAny("оператор", "человек", "админ", "помощ")) {
    return "Если нужен живой ответ, нажмите кнопку «Оператор» в чате. После этого администратор сможет ответить в этом же диалоге.";
  }
  if (hasAny("ролл", "роллы", "суши", "сет", "гарнир")) {
    const matchedCategory = Object.entries(categories).find(([, label]) => text.includes(label) || text.includes(label.slice(0, -1)));
    const items = state.menu
      .filter((item) => item.available && (!matchedCategory || item.category === matchedCategory[0]))
      .slice(0, 4)
      .map((item) => `${item.name} - ${money(item.price)}`);
    if (items.length) return `Из актуального меню могу предложить: ${items.join(", ")}. Полный список есть в каталоге.`;
  }
  if (hasAny("привет", "здравств", "добрый", "салам")) {
    return "Здравствуйте. Могу подсказать по меню, доставке, брони, оплате, адресу и времени работы.";
  }
  return "";
}

function attachChatEvents() {
  const panel = $("[data-chat-panel]");
  const toggle = $("[data-chat-toggle]");
  toggle.addEventListener("click", () => {
    const next = panel.hidden;
    panel.hidden = !next;
    toggle.setAttribute("aria-expanded", String(next));
  });

  $("[data-chat-close]").addEventListener("click", () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  });

  $("[data-voice-input]").addEventListener("click", toggleVoiceInput);
  $("[data-call-operator]").addEventListener("click", callOperator);

  $("[data-chat-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = $("input[name='message']", form);
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    pushChat("user", message);
    if (state.operatorMode) {
      try {
        await api("/api/chat/operator/messages", {
          method: "POST",
          body: JSON.stringify({ message })
        });
        await loadOperatorMessages();
      } catch (error) {
        pushChat("assistant", error.message);
      }
      return;
    }
    const localAnswer = localChatAnswer(message);
    if (localAnswer) {
      pushChat("assistant", localAnswer);
      state.chatHistory.push({ role: "user", content: message }, { role: "assistant", content: localAnswer });
      return;
    }
    const pending = pushChat("assistant", msg("thinking"));
    try {
      const data = await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message, history: state.chatHistory })
      });
      pending.textContent = data.answer;
      state.chatHistory.push({ role: "user", content: message }, { role: "assistant", content: data.answer });
    } catch (error) {
      pending.textContent = localChatAnswer(message) || error.message || msg("localFallback");
    }
  });
}

async function callOperator() {
  if (!ensureLogin(msg("operatorLogin"))) return;
  try {
    const data = await api("/api/chat/operator", { method: "POST", body: JSON.stringify({}) });
    state.operatorMode = true;
    state.operatorLastCount = 0;
    $("[data-chat-note]").textContent = msg("operatorCalled");
    pushChat("assistant", msg("operatorSoon"));
    renderOperatorMessages(data.messages || []);
    clearInterval(state.operatorPoll);
    state.operatorPoll = setInterval(loadOperatorMessages, 5000);
  } catch (error) {
    pushChat("assistant", error.message);
  }
}

async function loadOperatorMessages() {
  if (!state.operatorMode) return;
  try {
    const data = await api("/api/chat/operator/messages");
    renderOperatorMessages(data.messages || []);
  } catch (error) {
    $("[data-chat-note]").textContent = error.message;
  }
}

function renderOperatorMessages(messages) {
  if (messages.length <= state.operatorLastCount) return;
  messages.slice(state.operatorLastCount).forEach((message) => {
    if (message.sender === "user") return;
    pushChat(message.sender === "admin" ? "assistant" : "assistant", message.text);
  });
  state.operatorLastCount = messages.length;
}

function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const note = $("[data-chat-note]");
  if (!SpeechRecognition) {
    note.textContent = msg("speechUnsupported");
    return;
  }

  if (!state.recognition) {
    state.recognition = new SpeechRecognition();
    state.recognition.interimResults = false;
    state.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      $("#chat-message").value = transcript;
      note.textContent = msg("speechReady");
    };
    state.recognition.onend = () => {
      state.listening = false;
      $("[data-voice-input]").classList.remove("listening");
    };
    state.recognition.onerror = () => {
      note.textContent = msg("speechError");
    };
  }

  state.recognition.lang = { ru: "ru-RU", en: "en-US", kk: "kk-KZ" }[state.lang] || "ru-RU";
  if (state.listening) {
    state.recognition.stop();
    return;
  }
  state.listening = true;
  $("[data-voice-input]").classList.add("listening");
  note.textContent = msg("listening");
  state.recognition.start();
}

function pushChat(role, content) {
  const log = $("[data-chat-log]");
  const node = document.createElement("p");
  node.className = role === "user" ? "user-msg" : "assistant-msg";
  node.textContent = content;
  log.append(node);
  log.scrollTop = log.scrollHeight;
  return node;
}

applyPage();
applyTranslations();
attachEvents();
initData().catch((error) => toast(error.message));
