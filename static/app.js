/** ========= ПАРСЕР БАНКА A) B) C) D) E) ========= */
function norm(s){
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")  // ← убирает ВСЕ пробелы/таб/переносы
    .trim();
}

function stripSlashes(s){
  return String(s).replace(/^\/+|\/+$/g, "");
}
function isManagePyAnswer(expected){
  const e = norm(expected);
  return e.startsWith("python manage.py ");
}
function acceptText(user, expected){
  const u = norm(user), e = norm(expected);
  if (!u) return false;
  if (u === e) return true;
  if (stripSlashes(u) === stripSlashes(e)) return true;

  if (isManagePyAnswer(expected)){
    const stripped = e.replace(/^python manage\.py\s+/, "");
    if (u === stripped) return true;
    if (u === ("manage.py " + stripped)) return true;
    return false;
  }

  const commandLike = /^[a-z_]+$/.test(e) || e.includes("manage.py") || e.includes("django-admin");
  if (commandLike){
    if (u === norm("python manage.py " + expected)) return true;
    if (u === norm("manage.py " + expected)) return true;
  }
  return false;
}

function parseBank(raw, answerKey){
  const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const items = [];

  let i = 0;
  while (i < lines.length){
    const m = lines[i].match(/^(\d+)\.\s*(.*)$/);
    if (!m){ i++; continue; }

    const n = parseInt(m[1], 10);
    let qText = (m[2] || "").trim();
    i++;

    // если после "110." вопрос на следующей строке
    if (!qText && i < lines.length && !/^[ABCDE]\)/.test(lines[i]) && !/^\d+\./.test(lines[i])){
      qText = lines[i].trim();
      i++;
    }

    const opts = { A:null, B:null, C:null, D:null, E:null };
    while (i < lines.length && !/^\d+\./.test(lines[i])){
      const om = lines[i].match(/^([ABCDE])\)\s*(.+)$/);
      if (om) opts[om[1]] = om[2].trim();
      i++;
      if (opts.A && opts.B && opts.C && opts.D && opts.E) break;
    }

    const options = [opts.A, opts.B, opts.C, opts.D, opts.E];
    const correctText = answerKey[n - 1] ?? "";
    const correctIndex = options.findIndex(x => norm(x) === norm(correctText));

    items.push({
      n,
      q: qText,
      options,
      correctIndex,      // 0..4 или -1 если не найдено
      correctText
    });
  }

  // сортируем по номеру
  items.sort((a,b)=>a.n-b.n);
  return items;
}

/** ========= ИНИЦИАЛИЗАЦИЯ БАНКА ========= */
let RAW_BANK = "";
let ANSWER_TEXT = [];

let ALL = parseBank(RAW_BANK, ANSWER_TEXT);

/** ========= НАСТРОЙКИ ========= */
const LETTERS = ["A","B","C","D","E"];
const DEFAULT_BANK_KEY = "moo_web_technologies_ws";
const SIMPLE_BANK_KEY = "pm07_content_management_systems";
const BANK_LABELS = {
  [DEFAULT_BANK_KEY]: "MOO Web-технологии (WS)",
  [SIMPLE_BANK_KEY]: "PM 07 · CMS"
};
const BANK_MAX_SIZES = {
  [DEFAULT_BANK_KEY]: 234,
  [SIMPLE_BANK_KEY]: 266
};

const elQuiz = document.getElementById("quiz");
const elOut = document.getElementById("out");
const startBtn = document.getElementById("startBtn");
const finishBtn = document.getElementById("finishBtn");
const abortBtn = document.getElementById("abortBtn");
const learnBtn = document.getElementById("learnBtn");
const backBtn = document.getElementById("backBtn");
const hardBtn = document.getElementById("hardBtn");
const restartBtn = document.getElementById("restartBtn");
const clearFlagsBtn = document.getElementById("clearFlagsBtn");
const statusPill = document.getElementById("statusPill");
const meta = document.getElementById("meta");
const maxTestSizeDisplay = document.getElementById("maxTestSizeDisplay");
const startDashboard = document.getElementById("startDashboard");
const dashTitle = document.getElementById("dashTitle");
const dashBankCount = document.getElementById("dashBankCount");
const dashMode = document.getElementById("dashMode");
const dashHardCount = document.getElementById("dashHardCount");
const dashExp = document.getElementById("dashExp");
const dashRankMini = document.getElementById("dashRankMini");
const dashTests = document.getElementById("dashTests");
const dashTime = document.getElementById("dashTime");
const dashPreview = document.getElementById("dashPreview");
const quickStartBtn = document.getElementById("quickStartBtn");
const quickHardBtn = document.getElementById("quickHardBtn");
const coachToggle = document.getElementById("coachToggle");

const timerText = document.getElementById("timerText");
const appEl = document.querySelector(".app");
const translateBtn = document.getElementById("translateBtn");

let currentUser = null;
let leaderboardRowsCache = [];

async function apiJson(url, options = {}){
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.data = data;
    throw error;
  }
  return data;
}

const TRANSLATE_DEFAULT_RESET_KEY = "quiz_translate_default_en_v1";
if (localStorage.getItem(TRANSLATE_DEFAULT_RESET_KEY) !== "1"){
  localStorage.setItem("quiz_translate_ru", "0");
  localStorage.setItem(TRANSLATE_DEFAULT_RESET_KEY, "1");
}
let translateRu = localStorage.getItem("quiz_translate_ru") === "1";
const RU_TRANSLATION_CACHE_KEY = "quiz_ru_translation_cache_v1";
let ruTranslationCache = {};
let ruTranslationSaveTimer = null;
let ruTranslationRefreshTimer = null;
const ruTranslationPending = new Set();
const ruTranslationFailed = new Set();

try {
  ruTranslationCache = JSON.parse(localStorage.getItem(RU_TRANSLATION_CACHE_KEY) || "{}") || {};
} catch {
  ruTranslationCache = {};
}

const RU_TOPICS = {
  "python syntax and runtime": "синтаксис и выполнение Python",
  "python data structures": "структуры данных Python",
  "python control flow and functions": "управление потоком и функции Python",
  "python oop, files, and errors": "ООП, файлы и ошибки Python",
  "devops practices": "практики DevOps",
  "linux and source control": "Linux и контроль версий",
  "containers and kubernetes": "контейнеры и Kubernetes",
  "cloud and system design": "облака и системный дизайн",
  "network layers and models": "сетевые уровни и модели",
  "addressing and subnetting": "адресация и подсети",
  "network protocols": "сетевые протоколы",
  "switching, security, and performance": "коммутация, безопасность и производительность",
  "advanced python": "продвинутый Python",
  "application layer": "прикладной уровень",
  "application layer protocols": "протоколы прикладного уровня",
  "automation": "автоматизация",
  "ci/cd": "CI/CD",
  "cloud computing": "облачные вычисления",
  "container orchestration": "оркестрация контейнеров",
  "containers": "контейнеры",
  "containers and networking": "контейнеры и сети",
  "control flow": "управление потоком",
  "data link layer": "канальный уровень",
  "data science": "наука о данных",
  "deep learning": "глубокое обучение",
  "devops basics": "основы DevOps",
  "error handling": "обработка ошибок",
  "expressions": "выражения",
  "file and system operations": "файловые и системные операции",
  "file handling": "работа с файлами",
  "functional programming": "функциональное программирование",
  "functions": "функции",
  "functions and loops": "функции и циклы",
  "input and output": "ввод и вывод",
  "linux": "Linux",
  "linux and networking": "Linux и сети",
  "machine learning": "машинное обучение",
  "network benefits": "преимущества сетей",
  "network fundamentals": "основы сетей",
  "network layer": "сетевой уровень",
  "network layer protocols": "протоколы сетевого уровня",
  "network models": "сетевые модели",
  "network performance": "производительность сети",
  "networking": "сети",
  "networking security": "сетевая безопасность",
  "object-oriented programming": "объектно-ориентированное программирование",
  "operations": "операции",
  "packages and libraries": "пакеты и библиотеки",
  "physical layer": "физический уровень",
  "presentation layer": "уровень представления",
  "presentation layer and application protocols": "уровень представления и прикладные протоколы",
  "presentation layer security": "безопасность уровня представления",
  "programming language basics": "основы языка программирования",
  "python basics": "основы Python",
  "python fundamentals": "фундаментальные основы Python",
  "routing": "маршрутизация",
  "routing protocols": "протоколы маршрутизации",
  "scripting": "скриптинг",
  "scripting and configuration": "скриптинг и конфигурация",
  "security and networking": "безопасность и сети",
  "session layer": "сеансовый уровень",
  "session layer and vpn": "сеансовый уровень и VPN",
  "subnetting": "разбиение на подсети",
  "system design": "системный дизайн",
  "system design and networking": "системный дизайн и сети",
  "transport layer": "транспортный уровень",
  "transport layer and performance": "транспортный уровень и производительность",
  "types of networks": "типы сетей",
  "version control": "контроль версий",
  "web development": "веб-разработка"
};

const RU_PHRASES = [
  ["Which statement most accurately describes", "Какое утверждение наиболее точно описывает"],
  ["Which statement about", "Какое утверждение о"],
  ["is technically correct", "технически верно"],
  ["is correct", "верно"],
  ["What exactly is printed by", "Что именно напечатает"],
  ["What is printed by", "Что напечатает"],
  ["What is printed after", "Что будет напечатано после"],
  ["is mainly related to which area", "к какой области это в основном относится"],
  ["What is the result of", "Каков результат"],
  ["What is the effect of", "Какой эффект у"],
  ["What is the main trap in", "В чем главная ловушка в"],
  ["What is true about", "Что верно о"],
  ["What is the safest interpretation of", "Как безопаснее всего понимать"],
  ["What is the role of", "Какова роль"],
  ["Which statement best separates", "Какое утверждение лучше всего разделяет"],
  ["Which statement best describes the difference between", "Какое утверждение лучше всего описывает разницу между"],
  ["Which answer best distinguishes", "Какой ответ лучше всего отличает"],
  ["Which answer best explains why", "Какой ответ лучше всего объясняет, почему"],
  ["What is a practical difference between", "В чем практическая разница между"],
  ["What is the most likely effect of", "Каков наиболее вероятный эффект"],
  ["What is the most accurate reason", "Какова самая точная причина"],
  ["What is the most direct fix", "Какое самое прямое исправление"],
  ["Which signal best helps trace", "Какой сигнал лучше всего помогает отследить"],
  ["in Python", "в Python"],
  ["in DevOps practices", "в практиках DevOps"],
  ["in Linux and source control", "в Linux и контроле версий"],
  ["in containers and Kubernetes", "в контейнерах и Kubernetes"],
  ["in cloud and system design", "в облаках и системном дизайне"],
  ["in network layers and models", "в сетевых уровнях и моделях"],
  ["in addressing and subnetting", "в адресации и подсетях"],
  ["in network protocols", "в сетевых протоколах"],
  ["in switching, security, and performance", "в коммутации, безопасности и производительности"],
  ["It immediately returns", "Сразу возвращает"],
  ["It writes", "Записывает"],
  ["It serializes", "Сериализует"],
  ["It sends", "Отправляет"],
  ["It builds", "Собирает"],
  ["It reads", "Читает"],
  ["It returns", "Возвращает"],
  ["It creates", "Создает"],
  ["It checks", "Проверяет"],
  ["It represents", "Представляет"],
  ["It determines", "Определяет"],
  ["It binds", "Привязывает"],
  ["It stores", "Хранит"],
  ["It pauses", "Приостанавливает"],
  ["It exits", "Выходит"],
  ["It skips", "Пропускает"],
  ["It accepts", "Принимает"],
  ["It applies", "Применяет"],
  ["name binding", "привязку имени"],
  ["import statement", "оператор import"],
  ["global statement", "оператор global"],
  ["nonlocal statement", "оператор nonlocal"],
  ["identity comparison", "сравнение идентичности"],
  ["equality comparison", "сравнение равенства"],
  ["PEP 8 naming", "именование по PEP 8"],
  ["list comprehension", "генератор списка"],
  ["generator expression", "генераторное выражение"],
  ["function definition", "определение функции"],
  ["return statement", "оператор return"],
  ["yield statement", "оператор yield"],
  ["lambda expression", "lambda-выражение"],
  ["default argument", "аргумент по умолчанию"],
  ["higher-order function", "функция высшего порядка"],
  ["instance attribute", "атрибут экземпляра"],
  ["class attribute", "атрибут класса"],
  ["try / except", "try / except"],
  ["finally block", "блок finally"],
  ["raise statement", "оператор raise"],
  ["context manager", "контекстный менеджер"],
  ["local scope", "локальную область видимости"],
  ["docstring", "docstring"],
  ["truthiness", "истинность"],
  ["indentation", "отступы"],
  ["Conditional statement", "условный оператор"],
  ["Data type", "тип данных"],
  ["Return value", "возвращаемое значение"],
  ["lambda function", "lambda-функция"],
  ["Exception handling", "обработка исключений"],
  ["Built-in exception", "встроенное исключение"],
  ["User-defined exception", "пользовательское исключение"],
  ["File handling", "работа с файлами"],
  ["OS module", "модуль OS"],
  ["pathlib module", "модуль pathlib"],
  ["Built-in module", "встроенный модуль"],
  ["Linux permissions", "права доступа Linux"],
  ["System monitoring", "мониторинг системы"],
  ["Linux firewall", "межсетевой экран Linux"],
  ["Network interface", "сетевой интерфейс"],
  ["OSI Model", "модель OSI"],
  ["TCP/IP Model", "модель TCP/IP"],
  ["Network protocol", "сетевой протокол"],
  ["Monolithic architecture", "монолитная архитектура"],
  ["Event-driven architecture", "событийная архитектура"],
  ["Load balancing", "балансировка нагрузки"],
  ["Proxy server", "прокси-сервер"],
  ["Source code management", "управление исходным кодом"],
  ["Branching strategy", "стратегия ветвления"],
  ["Merge strategy", "стратегия слияния"],
  ["Shell scripting", "shell-скриптинг"],
  ["Scheduled task", "запланированная задача"],
  ["Cloud platform", "облачная платформа"],
  ["Google Cloud Platform", "Google Cloud Platform"],
  ["Docker architecture", "архитектура Docker"],
  ["Docker image", "образ Docker"],
  ["Docker volume", "том Docker"],
  ["Docker networking", "сети Docker"],
  ["Docker registry", "реестр Docker"],
  ["Kubernetes pod", "pod Kubernetes"],
  ["Kubernetes deployment", "развертывание Kubernetes"],
  ["Computer network", "компьютерная сеть"],
  ["Resource sharing", "совместное использование ресурсов"],
  ["Data sharing", "обмен данными"],
  ["Remote access", "удаленный доступ"],
  ["Network device", "сетевое устройство"],
  ["Network topology", "топология сети"],
  ["Transmission media", "среда передачи"],
  ["Transmission mode", "режим передачи"],
  ["Physical layer", "физический уровень"],
  ["Data link layer", "канальный уровень"],
  ["Network layer", "сетевой уровень"],
  ["Transport layer", "транспортный уровень"],
  ["Session layer", "сеансовый уровень"],
  ["Presentation layer", "уровень представления"],
  ["Application layer", "прикладной уровень"],
  ["Error detection", "обнаружение ошибок"],
  ["Error correction", "исправление ошибок"],
  ["Flow control", "управление потоком"],
  ["Stop-and-wait ARQ", "Stop-and-wait ARQ"],
  ["Sliding window protocol", "протокол скользящего окна"],
  ["IP addressing", "IP-адресация"],
  ["Private IP address", "частный IP-адрес"],
  ["Public IP address", "публичный IP-адрес"],
  ["Subnet mask", "маска подсети"],
  ["Static routing", "статическая маршрутизация"],
  ["Dynamic routing", "динамическая маршрутизация"],
  ["TCP three-way handshake", "трехстороннее рукопожатие TCP"],
  ["Congestion control", "управление перегрузкой"],
  ["Client-server model", "клиент-серверная модель"],
  ["Application layer protocols", "протоколы прикладного уровня"],
  ["while hiding details that callers do not need", "скрывая детали, которые вызывающему коду не нужны"],
  ["Lets one class reuse and specialize behavior from another class", "Позволяет одному классу переиспользовать и уточнять поведение другого класса"],
  ["Stores data on the class and is shared through instances unless shadowed", "Хранит данные на классе и разделяется экземплярами, пока не переопределено"],
  ["Defines a template for creating objects with shared attributes and behavior", "Определяет шаблон для создания объектов с общими атрибутами и поведением"],
  ["Stores data on a particular object rather than on the class itself", "Хранит данные на конкретном объекте, а не на самом классе"],
  ["Defines setup and cleanup behavior around a block, often used with with", "Определяет подготовку и очистку вокруг блока, часто используется с with"],
  ["Initializes a newly created instance after it has been allocated", "Инициализирует новый экземпляр после его выделения"],
  ["Groups state and related behavior while controlling how outside code interacts with it", "Группирует состояние и связанное поведение, контролируя взаимодействие внешнего кода"],
  ["Refers to the current instance passed explicitly as the first method parameter by convention", "Ссылается на текущий экземпляр, который по соглашению передается первым параметром метода"],
  ["Handles selected runtime exceptions so the program can recover or respond", "Обрабатывает выбранные исключения времени выполнения, чтобы программа могла восстановиться или ответить"],
  ["Belongs in a class namespace but receives neither instance nor class automatically", "Находится в пространстве имен класса, но автоматически не получает ни экземпляр, ни класс"],
  ["Allows different object types to be used through a shared interface or method name", "Позволяет разным типам объектов использоваться через общий интерфейс или имя метода"],
  ["Receives the class as its first argument and is often used for alternate constructors", "Получает класс первым аргументом и часто используется для альтернативных конструкторов"],
  ["Provides operating-system interfaces such as environment variables and process-related utilities", "Предоставляет интерфейсы ОС: переменные окружения и утилиты, связанные с процессами"],
  ["Exposes method-controlled access through attribute-style syntax", "Предоставляет доступ, управляемый методом, через синтаксис атрибута"],
  ["Runs cleanup code whether an exception was raised or not", "Запускает код очистки независимо от того, было исключение или нет"],
  ["Stores ordered mutable items and supports in-place changes such as append and item assignment", "Хранит упорядоченные изменяемые элементы и поддерживает изменения на месте, например append и присваивание по индексу"],
  ["Copies the outer container while keeping references to nested mutable objects", "Копирует внешний контейнер, сохраняя ссылки на вложенные изменяемые объекты"],
  ["Stores unique hashable elements without a meaningful positional index", "Хранит уникальные хешируемые элементы без значимого позиционного индекса"],
  ["Recursively copies nested objects so inner mutable structures are duplicated when possible", "Рекурсивно копирует вложенные объекты, чтобы внутренние изменяемые структуры тоже дублировались, когда возможно"],
  ["Selects a subsequence using start, stop, and step without including the stop index", "Выбирает подпоследовательность через start, stop и step, не включая конечный индекс"],
  ["Stores ordered items in an immutable container, though contained mutable objects may still change", "Хранит упорядоченные элементы в неизменяемом контейнере, хотя вложенные изменяемые объекты могут меняться"],
  ["Returns a value for a key or a default without raising KeyError when the key is absent", "Возвращает значение по ключу или значение по умолчанию без KeyError, если ключ отсутствует"],
  ["Produces values one at a time through the iterator protocol until exhausted", "Выдает значения по одному через протокол итератора, пока они не закончатся"],
  ["Maps hashable keys to values and preserves insertion order in modern Python", "Сопоставляет хешируемые ключи со значениями и сохраняет порядок вставки в современном Python"],
  ["Prevents changing the object itself after creation, though names can be rebound", "Запрещает менять сам объект после создания, хотя имена можно перепривязать"],
  ["Builds a list from an iterable using compact loop and optional filter syntax", "Создает список из итерируемого объекта через компактный цикл и необязательный фильтр"],
  ["Adds one object as a single new element at the end of a list", "Добавляет один объект как новый элемент в конец списка"],
  ["Retrieves an item by position or key using square brackets", "Получает элемент по позиции или ключу через квадратные скобки"],
  ["Stores immutable text as a sequence of Unicode characters", "Хранит неизменяемый текст как последовательность Unicode-символов"],
  ["Creates a lazy iterator using comprehension-like syntax without building a list immediately", "Создает ленивый итератор через синтаксис, похожий на comprehension, без немедленного создания списка"],
  ["Allows an object to be used as a dictionary key or set element when its hash is stable", "Позволяет использовать объект как ключ словаря или элемент множества, если его хеш стабилен"],
  ["Combines elements from sets while keeping only unique values", "Объединяет элементы множеств, оставляя только уникальные значения"],
  ["Can return an iterator, allowing it to be used in a for loop", "Может возвращать итератор, позволяя использовать объект в цикле for"],
  ["Adds each item from an iterable to the end of a list", "Добавляет каждый элемент итерируемого объекта в конец списка"],
  ["Keeps only elements that are present in both sets", "Оставляет только элементы, которые есть в обоих множествах"],
  ["Defines ordered automated stages such as build, test, scan, package, and deploy", "Определяет упорядоченные автоматические этапы: сборка, тест, сканирование, упаковка и деплой"],
  ["Keeps changes in a releasable state while requiring a deliberate production release step", "Держит изменения готовыми к релизу, но требует отдельного шага выпуска в продакшен"],
  ["Separates deploying code from enabling behavior for selected users or environments", "Отделяет деплой кода от включения поведения для выбранных пользователей или окружений"],
  ["Manages infrastructure definitions as versioned files reviewed like application code", "Управляет описаниями инфраструктуры как версионированными файлами, которые ревьюятся как код приложения"],
  ["Switches traffic between two production-ready environments to reduce cutover risk", "Переключает трафик между двумя готовыми продакшен-окружениями, снижая риск переключения"],
  ["Prioritizes or manages traffic to meet performance requirements", "Приоритизирует или управляет трафиком, чтобы выполнить требования производительности"],
  ["Allows or blocks traffic according to configured security rules", "Разрешает или блокирует трафик согласно настроенным правилам безопасности"],
  ["Separates network control logic from packet forwarding hardware", "Отделяет логику управления сетью от оборудования пересылки пакетов"],
  ["Runs network functions as software rather than dedicated appliances", "Запускает сетевые функции как программное обеспечение вместо выделенных устройств"],
  ["Provides wireless local-area networking based on IEEE 802.11 standards", "Предоставляет беспроводную локальную сеть на основе стандартов IEEE 802.11"],
  ["Spreads client traffic across multiple servers to improve capacity or availability", "Распределяет клиентский трафик по нескольким серверам, чтобы улучшить емкость или доступность"],
  ["Forwards frames based on learned MAC address tables", "Пересылает кадры на основе изученных таблиц MAC-адресов"],
  ["Forwards packets between IP networks using routing decisions", "Пересылает пакеты между IP-сетями на основе решений маршрутизации"],
  ["Repeats incoming bits out all ports without learning MAC addresses", "Повторяет входящие биты на все порты, не изучая MAC-адреса"],
  ["Prevents a fast sender from overwhelming a slower receiver", "Не дает быстрому отправителю перегрузить более медленного получателя"],
  ["Detects suspicious activity and alerts without necessarily blocking it", "Обнаруживает подозрительную активность и отправляет оповещения, не обязательно блокируя ее"],
  ["Detects suspicious activity and can actively block or prevent it", "Обнаруживает подозрительную активность и может активно блокировать или предотвращать ее"],
  ["Chooses among branches by testing conditions in order until one branch is selected", "Выбирает одну из веток, проверяя условия по порядку, пока одна ветка не будет выбрана"],
  ["Combines iterable items into one accumulated result using a two-argument callable", "Объединяет элементы итерируемого объекта в один накопленный результат через функцию с двумя аргументами"],
  ["Supplies a value used when a caller omits an argument, evaluated at function definition time", "Задает значение, используемое при пропущенном аргументе; вычисляется при определении функции"],
  ["Accepts a function as an argument or returns a function as a result", "Принимает функцию как аргумент или возвращает функцию как результат"],
  ["Skips the rest of the current loop iteration and moves to the next iteration", "Пропускает остаток текущей итерации цикла и переходит к следующей"],
  ["Remembers variables from an enclosing scope after that scope has finished executing", "Помнит переменные из внешней области видимости после завершения этой области"],
  ["Iterates over values produced by an iterable rather than counting by default", "Перебирает значения, создаваемые итерируемым объектом, а не считает по умолчанию"],
  ["Creates a callable object and binds it to a name using def", "Создает вызываемый объект и привязывает его к имени через def"],
  ["Creates a small anonymous function from a single expression", "Создает небольшую анонимную функцию из одного выражения"],
  ["Repeats a block while a condition remains truthy", "Повторяет блок, пока условие остается истинным"],
  ["Collects extra keyword arguments into a dictionary inside a function", "Собирает дополнительные именованные аргументы в словарь внутри функции"],
  ["Terminates the nearest enclosing loop immediately", "Немедленно завершает ближайший внешний цикл"],
  ["Pauses a generator function and produces the next value lazily", "Приостанавливает функцию-генератор и лениво выдает следующее значение"],
  ["Solves a problem by having a function call itself with a smaller or simpler case", "Решает задачу тем, что функция вызывает саму себя с меньшим или более простым случаем"],
  ["Wraps or replaces a function or class at definition time using callable syntax", "Оборачивает или заменяет функцию либо класс при определении через вызываемый синтаксис"],
  ["Keeps items from an iterable for which a callable returns a truthy value", "Оставляет элементы итерируемого объекта, для которых функция возвращает истинное значение"],
  ["Acts as a syntactic placeholder that performs no operation", "Работает как синтаксическая заглушка, которая ничего не делает"],
  ["Collects extra positional arguments into a tuple inside a function", "Собирает дополнительные позиционные аргументы в кортеж внутри функции"],
  ["Exits a function call and sends a value back to the caller", "Выходит из вызова функции и возвращает значение вызывающему коду"],
  ["Applies a callable to items from one or more iterables and returns a lazy iterator", "Применяет функцию к элементам одного или нескольких итерируемых объектов и возвращает ленивый итератор"],
  ["such as", "такие как"],
  ["do not need", "не нужны"],
  ["can share", "могут разделять"],
  ["can be", "может быть"],
  ["as versioned files", "как версионированные файлы"],
  ["like application code", "как код приложения"],
  ["without necessarily blocking it", "не обязательно блокируя ее"],
  ["text representations of its arguments", "текстовые представления своих аргументов"],
  ["file-like stream", "поток, похожий на файл"],
  ["standard input", "стандартный ввод"],
  ["structured log record", "структурированную запись лога"],
  ["configured logging handlers", "настроенные обработчики логирования"],
  ["final output string", "итоговую строку вывода"],
  ["Reads one line", "Читает одну строку"],
  ["after showing a prompt", "после показа приглашения"],
  ["returns a string", "возвращает строку"],
  ["Returns an implementation-level identity value", "Возвращает значение идентичности на уровне реализации"],
  ["during its lifetime", "на время жизни объекта"],
  ["runtime class of an object", "класс объекта во время выполнения"],
  ["called with three arguments", "вызове с тремя аргументами"],
  ["number of items", "количество элементов"],
  ["sized object", "объекте с размером"],
  ["without iterating over every value manually", "без ручного перебора каждого значения"],
  ["numeric values from an iterable", "числовые значения из итерируемого объекта"],
  ["supplied start value", "заданного стартового значения"],
  ["every element in an iterable is truthy", "каждый элемент итерируемого объекта истинный"],
  ["including an empty iterable", "включая пустой итерируемый объект"],
  ["belongs to a class", "принадлежит классу"],
  ["one of the classes in a tuple", "одному из классов в кортеже"],
  ["new sorted list", "новый отсортированный список"],
  ["leaving the original object unchanged", "оставляя исходный объект без изменений"],
  ["natural ordering or a key function", "естественному порядку или ключевой функции"],
  ["human-readable string representation", "человекочитаемое строковое представление"],
  ["normal display", "обычного отображения"],
  ["developer-oriented representation", "представление для разработчика"],
  ["unambiguous when possible", "по возможности однозначным"],
  ["arithmetic progression of integers", "арифметическую прогрессию целых чисел"],
  ["without storing the whole sequence", "без хранения всей последовательности"],
  ["multiple iterables element by element", "несколько итерируемых объектов поэлементно"],
  ["stops at the shortest input", "останавливается на самом коротком входе"],
  ["reverse order", "обратном порядке"],
  ["supports reverse iteration", "поддерживает обратную итерацию"],
  ["counter that can start from a chosen value", "счетчиком, который может начинаться с выбранного значения"],
  ["file object for reading, writing, appending, or binary access depending on mode", "файловый объект для чтения, записи, добавления или бинарного доступа в зависимости от режима"],
  ["Rоunds a number", "Округляет число"],
  ["Rounds a number", "Округляет число"],
  ["requested precision", "заданной точности"],
  ["ties rounded to the nearest even value", "половины округляются к ближайшему четному значению"],
  ["name with an object", "имя с объектом"],
  ["assignment does not copy the object by itself", "присваивание само по себе не копирует объект"],
  ["Boolean contexts", "булевых контекстах"],
  ["ignored by the interpreter", "игнорируемый интерпретатором"],
  ["explaining code to humans", "объяснения кода людям"],
  ["local, global, or built-ins", "локальный, глобальный или встроенный"],
  ["module or package", "модуля или пакета"],
  ["external definitions", "внешние определения"],
  ["reserved word", "зарезервированное слово"],
  ["syntactic meaning", "синтаксическое значение"],
  ["normal identifier", "обычный идентификатор"],
  ["fixed value directly in source code", "фиксированное значение прямо в исходном коде"],
  ["block structure", "структуру блоков"],
  ["instead of braces", "вместо фигурных скобок"],
  ["values, names, calls, and operators", "значения, имена, вызовы и операторы"],
  ["to produce a value", "чтобы получить значение"],
  ["two references point to the same object", "две ссылки указывают на один и тот же объект"],
  ["not merely equal values", "а не просто равные значения"],
  ["action such as assignment, import, return", "действие вроде присваивания, импорта или возврата"],
  ["compound control structure", "составной управляющей конструкции"],
  ["string literal at the start", "строковый литерал в начале"],
  ["for documentation", "для документации"],
  ["absence of a value", "отсутствие значения"],
  ["compared by identity", "сравнивается по идентичности"],
  ["conventional naming", "принятое именование"],
  ["functions and variables", "функций и переменных"],
  ["current function call", "текущего вызова функции"],
  ["before outer scopes", "до внешних областей видимости"],
  ["enclosing function scope", "охватывающей области видимости функции"],
  ["not global", "которая не является глобальной"],
  ["mutable sequence", "изменяемая последовательность"],
  ["ordered collection", "упорядоченная коллекция"],
  ["immutable sequence", "неизменяемая последовательность"],
  ["key-value pairs", "пары ключ-значение"],
  ["hashable keys", "хешируемые ключи"],
  ["preserves insertion order", "сохраняет порядок вставки"],
  ["unique hashable elements", "уникальные хешируемые элементы"],
  ["text sequence", "текстовая последовательность"],
  ["extracts part of a sequence", "извлекает часть последовательности"],
  ["compact way to build a list", "короткий способ создать список"],
  ["lazy iterator", "ленивый итератор"],
  ["shallow copy", "поверхностная копия"],
  ["deep copy", "глубокая копия"],
  ["same nested objects", "те же вложенные объекты"],
  ["recursively copies nested objects", "рекурсивно копирует вложенные объекты"],
  ["next value", "следующее значение"],
  ["can be looped over", "можно перебирать в цикле"],
  ["by position", "по позиции"],
  ["adds one item", "добавляет один элемент"],
  ["adds all items", "добавляет все элементы"],
  ["default value", "значение по умолчанию"],
  ["set union", "объединение множеств"],
  ["set intersection", "пересечение множеств"],
  ["cannot be changed after creation", "нельзя изменить после создания"],
  ["can be used as a dict key", "можно использовать как ключ словаря"],
  ["conditional branches", "условные ветки"],
  ["repeats for each item", "повторяется для каждого элемента"],
  ["repeats while a condition is true", "повторяется, пока условие истинно"],
  ["exits the nearest loop", "выходит из ближайшего цикла"],
  ["skips to the next iteration", "переходит к следующей итерации"],
  ["does nothing", "ничего не делает"],
  ["defines reusable code", "определяет переиспользуемый код"],
  ["sends a value back to the caller", "отправляет значение вызывающему коду"],
  ["pauses execution", "приостанавливает выполнение"],
  ["anonymous function", "анонимная функция"],
  ["positional arguments", "позиционные аргументы"],
  ["keyword arguments", "именованные аргументы"],
  ["evaluated once when the function is defined", "вычисляется один раз при определении функции"],
  ["function calls itself", "функция вызывает саму себя"],
  ["wraps or modifies another function", "оборачивает или изменяет другую функцию"],
  ["function as an argument", "функцию как аргумент"],
  ["returns a function as a result", "возвращает функцию как результат"],
  ["captures variables from an enclosing scope", "захватывает переменные из внешней области видимости"],
  ["Applies a callable", "Применяет вызываемый объект"],
  ["Keeps items", "Оставляет элементы"],
  ["class is a blueprint", "класс является чертежом"],
  ["object is an instance", "объект является экземпляром"],
  ["constructor-like initializer", "инициализатор, похожий на конструктор"],
  ["current instance", "текущий экземпляр"],
  ["shared by all instances", "общий для всех экземпляров"],
  ["reuse behavior from a parent class", "переиспользовать поведение родительского класса"],
  ["same interface", "один и тот же интерфейс"],
  ["hide implementation details", "скрывать детали реализации"],
  ["essential behavior", "существенное поведение"],
  ["method bound to the class", "метод, привязанный к классу"],
  ["method that does not receive self or cls automatically", "метод, который автоматически не получает self или cls"],
  ["handles exceptions", "обрабатывает исключения"],
  ["always runs after try/except", "всегда выполняется после try/except"],
  ["raises an exception", "создает исключение"],
  ["manages setup and cleanup", "управляет подготовкой и очисткой"],
  ["object-oriented paths", "объектно-ориентированные пути"],
  ["operating-system functions", "функции операционной системы"],
  ["installs and manages Python packages", "устанавливает и управляет пакетами Python"],
  ["continuous integration", "непрерывная интеграция"],
  ["continuous delivery", "непрерывная доставка"],
  ["continuous deployment", "непрерывное развертывание"],
  ["blue-green deployment", "blue-green развертывание"],
  ["canary deployment", "canary развертывание"],
  ["feature flag", "фича-флаг"],
  ["infrastructure as code", "инфраструктура как код"],
  ["configuration drift", "дрейф конфигурации"],
  ["immutable infrastructure", "неизменяемая инфраструктура"],
  ["source control", "контроль версий"],
  ["environment variable", "переменная окружения"],
  ["merge conflict", "конфликт слияния"],
  ["semantic versioning", "семантическое версионирование"],
  ["pull request", "pull request"],
  ["image layer", "слой образа"],
  ["bind mount", "bind mount"],
  ["Docker Compose", "Docker Compose"],
  ["Kubernetes pod", "pod Kubernetes"],
  ["liveness probe", "liveness probe"],
  ["readiness probe", "readiness probe"],
  ["rolling update", "rolling update"],
  ["load balancer", "балансировщик нагрузки"],
  ["reverse proxy", "обратный прокси"],
  ["horizontal scaling", "горизонтальное масштабирование"],
  ["vertical scaling", "вертикальное масштабирование"],
  ["availability zone", "зона доступности"],
  ["object storage", "объектное хранилище"],
  ["message queue", "очередь сообщений"],
  ["event-driven architecture", "событийная архитектура"],
  ["health check", "проверка здоровья"],
  ["computer network", "компьютерная сеть"],
  ["OSI model", "модель OSI"],
  ["TCP/IP model", "модель TCP/IP"],
  ["physical layer", "физический уровень"],
  ["data link layer", "канальный уровень"],
  ["network layer", "сетевой уровень"],
  ["transport layer", "транспортный уровень"],
  ["session layer", "сеансовый уровень"],
  ["presentation layer", "уровень представления"],
  ["application layer", "прикладной уровень"],
  ["MAC address", "MAC-адрес"],
  ["IP address", "IP-адрес"],
  ["port number", "номер порта"],
  ["subnet mask", "маска подсети"],
  ["CIDR notation", "CIDR-нотация"],
  ["network address", "адрес сети"],
  ["broadcast address", "широковещательный адрес"],
  ["default gateway", "шлюз по умолчанию"],
  ["private IPv4 address", "частный IPv4-адрес"],
  ["public IP address", "публичный IP-адрес"],
  ["loopback address", "loopback-адрес"],
  ["ARP cache", "ARP-кеш"],
  ["proxy server", "прокси-сервер"],
  ["collision domain", "домен коллизий"],
  ["broadcast domain", "широковещательный домен"],
  ["sliding window", "скользящее окно"],
  ["selective repeat", "выборочное повторение"],
  ["token bucket", "token bucket"],
  ["leaky bucket", "leaky bucket"],
  ["flow control", "управление потоком"],
  ["link aggregation", "агрегация каналов"],
  ["authentication", "аутентификация"],
  ["encryption", "шифрование"]
].sort((a, b) => b[0].length - a[0].length);

const RU_WORDS = [
  ["statement", "утверждение"],
  ["technically", "технически"],
  ["correct", "верно"],
  ["accurately", "точно"],
  ["describes", "описывает"],
  ["about", "о"],
  ["best", "лучше всего"],
  ["difference", "разница"],
  ["printed", "напечатано"],
  ["returns", "возвращает"],
  ["return", "возвращает"],
  ["writes", "записывает"],
  ["reads", "читает"],
  ["creates", "создает"],
  ["checks", "проверяет"],
  ["adds", "добавляет"],
  ["represents", "представляет"],
  ["combines", "объединяет"],
  ["produces", "создает"],
  ["defines", "определяет"],
  ["exposes", "показывает"],
  ["lets", "позволяет"],
  ["stores", "хранит"],
  ["keeps", "держит"],
  ["separates", "разделяет"],
  ["manages", "управляет"],
  ["switches", "переключает"],
  ["prioritizes", "приоритизирует"],
  ["detects", "обнаруживает"],
  ["forwards", "пересылает"],
  ["routes", "маршрутизирует"],
  ["transfers", "передает"],
  ["connects", "соединяет"],
  ["identifies", "идентифицирует"],
  ["provides", "предоставляет"],
  ["allows", "позволяет"],
  ["prevents", "предотвращает"],
  ["contains", "содержит"],
  ["groups", "группирует"],
  ["controls", "контролирует"],
  ["replaces", "заменяет"],
  ["distributes", "распределяет"],
  ["caches", "кеширует"],
  ["buffers", "буферизует"],
  ["specifies", "задает"],
  ["monitors", "мониторит"],
  ["synchronizes", "синхронизирует"],
  ["retrieves", "получает"],
  ["resolves", "разрешает"],
  ["retransmits", "повторно передает"],
  ["transforms", "преобразует"],
  ["verifies", "проверяет"],
  ["encrypts", "шифрует"],
  ["pairs", "связывает"],
  ["while", "при этом"],
  ["and", "и"],
  ["or", "или"],
  ["with", "с"],
  ["without", "без"],
  ["using", "используя"],
  ["according", "согласно"],
  ["based", "основанный"],
  ["across", "через"],
  ["within", "внутри"],
  ["toward", "к"],
  ["instead", "вместо"],
  ["all", "все"],
  ["every", "каждый"],
  ["many", "многие"],
  ["more", "больше"],
  ["less", "меньше"],
  ["no", "нет"],
  ["blocks", "блокирует"],
  ["configured", "настроенный"],
  ["learned", "изученный"],
  ["dedicated", "выделенный"],
  ["activity", "активность"],
  ["alerts", "оповещает"],
  ["actively", "активно"],
  ["necessarily", "обязательно"],
  ["sender", "отправитель"],
  ["receiver", "получатель"],
  ["host", "хост"],
  ["hosts", "хосты"],
  ["through", "через"],
  ["between", "между"],
  ["inside", "внутри"],
  ["outside", "снаружи"],
  ["before", "до"],
  ["after", "после"],
  ["during", "во время"],
  ["rather", "а не"],
  ["only", "только"],
  ["same", "тот же"],
  ["different", "разный"],
  ["selected", "выбранных"],
  ["known", "известных"],
  ["unknown", "неизвестных"],
  ["remote", "удаленный"],
  ["local", "локальный"],
  ["shared", "общий"],
  ["stable", "стабильный"],
  ["logical", "логический"],
  ["physical", "физический"],
  ["virtual", "виртуальный"],
  ["external", "внешний"],
  ["internal", "внутренний"],
  ["automated", "автоматизированный"],
  ["ordered", "упорядоченный"],
  ["releasable", "готовый к релизу"],
  ["manual", "ручной"],
  ["faulty", "ошибочный"],
  ["sensitive", "чувствительный"],
  ["incoming", "входящий"],
  ["outgoing", "исходящий"],
  ["redundant", "резервный"],
  ["missing", "отсутствующий"],
  ["damaged", "поврежденный"],
  ["suspicious", "подозрительный"],
  ["nearby", "близлежащий"],
  ["wireless", "беспроводной"],
  ["wired", "проводной"],
  ["larger", "больший"],
  ["smaller", "меньший"],
  ["greater", "больший"],
  ["newer", "более новый"],
  ["older", "более старый"],
  ["current", "текущий"],
  ["previous", "предыдущий"],
  ["final", "итоговый"],
  ["average", "средний"],
  ["traffic", "трафик"],
  ["users", "пользователей"],
  ["environments", "окружений"],
  ["environment", "окружение"],
  ["details", "детали"],
  ["callers", "вызывающему коду"],
  ["requirements", "требования"],
  ["stages", "этапы"],
  ["signals", "сигналы"],
  ["logs", "логи"],
  ["metrics", "метрики"],
  ["traces", "трейсы"],
  ["telemetry", "телеметрия"],
  ["behavior", "поведение"],
  ["release", "релиз"],
  ["version", "версия"],
  ["versions", "версии"],
  ["server", "сервер"],
  ["servers", "серверы"],
  ["client", "клиент"],
  ["clients", "клиенты"],
  ["request", "запрос"],
  ["requests", "запросы"],
  ["response", "ответ"],
  ["addresses", "адреса"],
  ["address", "адрес"],
  ["ports", "порты"],
  ["rules", "правила"],
  ["headers", "заголовки"],
  ["trailers", "трейлеры"],
  ["bits", "биты"],
  ["bytes", "байты"],
  ["frames", "кадры"],
  ["packets", "пакеты"],
  ["segments", "сегменты"],
  ["acknowledgement", "подтверждение"],
  ["acknowledgements", "подтверждения"],
  ["throughput", "пропускная способность"],
  ["latency", "задержка"],
  ["capacity", "емкость"],
  ["availability", "доступность"],
  ["consistency", "согласованность"],
  ["durability", "долговечность"],
  ["confidentiality", "конфиденциальность"],
  ["reliability", "надежность"],
  ["compatibility", "совместимость"],
  ["routing", "маршрутизация"],
  ["switching", "коммутация"],
  ["forwarding", "пересылка"],
  ["blocking", "блокировка"],
  ["delivery", "доставка"],
  ["upload", "загрузка"],
  ["download", "скачивание"],
  ["build", "сборка"],
  ["scan", "сканирование"],
  ["deploy", "деплой"],
  ["package", "пакет"],
  ["production", "продакшен"],
  ["review", "ревью"],
  ["discussion", "обсуждение"],
  ["approval", "одобрение"],
  ["gate", "шлюз"],
  ["subset", "подмножество"],
  ["rollout", "раскатка"],
  ["risk", "риск"],
  ["blame", "вина"],
  ["incident", "инцидент"],
  ["object", "объект"],
  ["objects", "объекты"],
  ["class", "класс"],
  ["classes", "классы"],
  ["tuple", "кортеж"],
  ["list", "список"],
  ["dict", "словарь"],
  ["dictionary", "словарь"],
  ["set", "множество"],
  ["string", "строка"],
  ["iterable", "итерируемый объект"],
  ["iterator", "итератор"],
  ["value", "значение"],
  ["values", "значения"],
  ["item", "элемент"],
  ["items", "элементы"],
  ["key", "ключ"],
  ["function", "функция"],
  ["callable", "вызываемый объект"],
  ["argument", "аргумент"],
  ["arguments", "аргументы"],
  ["variable", "переменная"],
  ["variables", "переменные"],
  ["scope", "область видимости"],
  ["module", "модуль"],
  ["package", "пакет"],
  ["namespace", "пространство имен"],
  ["assignment", "присваивание"],
  ["identity", "идентичность"],
  ["equality", "равенство"],
  ["truthy", "истинный"],
  ["falsey", "ложный"],
  ["mutable", "изменяемый"],
  ["immutable", "неизменяемый"],
  ["hashable", "хешируемый"],
  ["indexing", "индексация"],
  ["slice", "срез"],
  ["loop", "цикл"],
  ["condition", "условие"],
  ["execution", "выполнение"],
  ["error", "ошибка"],
  ["errors", "ошибки"],
  ["exception", "исключение"],
  ["file", "файл"],
  ["files", "файлы"],
  ["pipeline", "пайплайн"],
  ["artifact", "артефакт"],
  ["rollback", "откат"],
  ["automation", "автоматизация"],
  ["observability", "наблюдаемость"],
  ["monitoring", "мониторинг"],
  ["postmortem", "постмортем"],
  ["container", "контейнер"],
  ["containers", "контейнеры"],
  ["image", "образ"],
  ["registry", "реестр"],
  ["volume", "том"],
  ["deployment", "развертывание"],
  ["service", "сервис"],
  ["ingress", "ingress"],
  ["namespace", "пространство имен"],
  ["secret", "секрет"],
  ["cluster", "кластер"],
  ["region", "регион"],
  ["subnet", "подсеть"],
  ["cache", "кеш"],
  ["microservices", "микросервисы"],
  ["monolith", "монолит"],
  ["network", "сеть"],
  ["frame", "кадр"],
  ["packet", "пакет"],
  ["segment", "сегмент"],
  ["datagram", "датаграмма"],
  ["router", "маршрутизатор"],
  ["switch", "коммутатор"],
  ["bridge", "мост"],
  ["hub", "хаб"],
  ["firewall", "межсетевой экран"],
  ["performance", "производительность"],
  ["security", "безопасность"]
];

function escapeRegExp(s){
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyRuDictionary(text){
  let out = String(text ?? "");

  for (const [from, to] of RU_PHRASES){
    out = out.replace(new RegExp(escapeRegExp(from), "gi"), to);
  }

  for (const [from, to] of RU_WORDS){
    out = out.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), to);
  }

  return out
    .replace(/\s+([,.?!:;])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function translateTopicRu(topic){
  const key = String(topic ?? "").toLowerCase();
  return RU_TOPICS[key] || applyRuDictionary(topic);
}

function translateQuestionPattern(text){
  const source = String(text ?? "");
  let m = source.match(/^Which statement most accurately describes (.+?) in (.+?)\?$/i);
  if (m) return `Какое утверждение наиболее точно описывает ${applyRuDictionary(m[1])} в теме "${translateTopicRu(m[2])}"?`;

  m = source.match(/^Which statement most accurately describes (.+?)\?$/i);
  if (m) return `Какое утверждение наиболее точно описывает ${applyRuDictionary(m[1])}?`;

  m = source.match(/^Which statement about (.+?) is technically correct\?$/i);
  if (m) return `Какое утверждение о ${applyRuDictionary(m[1])} технически верно?`;

  m = source.match(/^Which statement about (.+?) is correct\?$/i);
  if (m) return `Какое утверждение о ${applyRuDictionary(m[1])} верно?`;

  m = source.match(/^(.+?) is mainly related to which area\?$/i);
  if (m) return `${applyRuDictionary(m[1])}: к какой области это в основном относится?`;

  m = source.match(/^What is (?!printed by|printed after|the result of|the effect of|the main trap in|true about|the safest interpretation of|the role of|a practical difference between|the most)(.+?)\?$/i);
  if (m) return `Что такое ${applyRuDictionary(m[1])}?`;

  m = source.match(/^What exactly is printed by (.+?)\?$/i);
  if (m) return `Что именно напечатает ${m[1]}?`;

  m = source.match(/^What is printed by (.+?)\?$/i);
  if (m) return `Что напечатает ${m[1]}?`;

  m = source.match(/^What is printed after (.+?)\?$/i);
  if (m) return `Что будет напечатано после ${m[1]}?`;

  m = source.match(/^What is the result of (.+?)\?$/i);
  if (m) return `Каков результат ${m[1]}?`;

  m = source.match(/^What is the effect of (.+?)\?$/i);
  if (m) return `Какой эффект у ${m[1]}?`;

  m = source.match(/^What is the main trap in (.+?)\?$/i);
  if (m) return `В чем главная ловушка в ${m[1]}?`;

  m = source.match(/^What is true about (.+?)\?$/i);
  if (m) return `Что верно о ${m[1]}?`;

  m = source.match(/^What is the safest interpretation of (.+?)\?$/i);
  if (m) return `Как безопаснее всего понимать ${m[1]}?`;

  m = source.match(/^What is the role of (.+?)\?$/i);
  if (m) return `Какова роль ${m[1]}?`;

  m = source.match(/^Which answer best explains why (.+?)\?$/i);
  if (m) return `Какой ответ лучше всего объясняет, почему ${applyRuDictionary(m[1])}?`;

  m = source.match(/^Which answer best distinguishes (.+?) from (.+?)\?$/i);
  if (m) return `Какой ответ лучше всего отличает ${applyRuDictionary(m[1])} от ${applyRuDictionary(m[2])}?`;

  m = source.match(/^Which statement best describes the difference between (.+?) and (.+?)\?$/i);
  if (m) return `Какое утверждение лучше всего описывает разницу между ${applyRuDictionary(m[1])} и ${applyRuDictionary(m[2])}?`;

  m = source.match(/^What is a practical difference between (.+?) and (.+?)\?$/i);
  if (m) return `В чем практическая разница между ${applyRuDictionary(m[1])} и ${applyRuDictionary(m[2])}?`;

  return "";
}

function translateTextRu(input){
  const codeParts = [];
  const protectedText = String(input ?? "").replace(/`[^`]*`/g, (match) => {
    const token = `__CODE_${codeParts.length}__`;
    codeParts.push(match);
    return token;
  });

  let out = translateQuestionPattern(protectedText) || applyRuDictionary(protectedText);
  codeParts.forEach((code, idx) => {
    out = out.replaceAll(`__CODE_${idx}__`, code);
  });
  return out;
}

function saveRuTranslationCacheSoon(){
  clearTimeout(ruTranslationSaveTimer);
  ruTranslationSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(RU_TRANSLATION_CACHE_KEY, JSON.stringify(ruTranslationCache));
    } catch (err) {
      console.warn("RU translation cache save failed:", err);
    }
  }, 300);
}

function requestTranslationRefresh(){
  if (!translateRu) return;
  clearTimeout(ruTranslationRefreshTimer);
  ruTranslationRefreshTimer = setTimeout(() => {
    updateStartDashboard();
    if (isInLearningMode && TEST.length){
      showAnswers();
    } else if (TEST.length && startBtn.disabled && !hardMode){
      renderTest();
    }
  }, 650);
}

async function fetchRuTranslation(raw){
  const codeParts = [];
  const protectedText = String(raw).replace(/`[^`]*`/g, (match) => {
    const token = `ZXQCODE${codeParts.length}ZXQ`;
    codeParts.push({ token, value: match });
    return token;
  });

  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=" + encodeURIComponent(protectedText);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`translate ${response.status}`);
  const data = await response.json();
  let translated = Array.isArray(data?.[0])
    ? data[0].map(part => part?.[0] || "").join("")
    : "";

  for (const { token, value } of codeParts){
    const spacedToken = token.replace(/^ZXQ/, "ZXQ ").replace(/ZXQ$/, " ZXQ");
    translated = translated
      .replaceAll(token, value)
      .replaceAll(token.toLowerCase(), value)
      .replaceAll(spacedToken, value)
      .replaceAll(spacedToken.toLowerCase(), value);
  }

  return translated.trim();
}

function ensureRuTranslation(text){
  if (!translateRu) return;
  const raw = String(text ?? "");
  if (!raw || ruTranslationCache[raw] || ruTranslationPending.has(raw) || ruTranslationFailed.has(raw)) return;

  ruTranslationPending.add(raw);
  fetchRuTranslation(raw)
    .then(translated => {
      if (translated) {
        ruTranslationCache[raw] = translated;
        saveRuTranslationCacheSoon();
        requestTranslationRefresh();
      }
    })
    .catch(err => {
      ruTranslationFailed.add(raw);
      console.warn("RU translation failed:", err);
    })
    .finally(() => {
      ruTranslationPending.delete(raw);
    });
}

function displayText(text){
  const raw = String(text ?? "");
  if (!translateRu) return raw;
  ensureRuTranslation(raw);
  return ruTranslationCache[raw] || RU_TOPICS[raw.toLowerCase()] || translateTextRu(raw);
}

function acceptDisplayText(user, expected){
  const translatedExpected = ruTranslationCache[String(expected ?? "")] || translateTextRu(expected);
  return acceptText(user, expected) || (translateRu && acceptText(user, translatedExpected));
}

function updateTranslationUI(){
  if (!translateBtn) return;
  translateBtn.classList.toggle("is-on", translateRu);
  translateBtn.setAttribute("aria-pressed", translateRu ? "true" : "false");
  translateBtn.textContent = translateRu ? "RU: вкл" : "RU: выкл";
  translateBtn.title = translateRu
    ? "Показывается русский перевод с кешем. Проверка ответов идет по оригиналу."
    : "Включить русский вариант вопросов и ответов.";
}

function ensureAuthUI(){
  let overlay = document.getElementById("authGate");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "authGate";
  overlay.className = "auth-gate";
  overlay.innerHTML = `
    <section class="auth-card">
      <div>
        <p class="eyebrow">SessionTester</p>
        <h2>Вход обязателен</h2>
        <p class="muted small">Зарегистрируйся или войди, чтобы результаты шли в лидерборд.</p>
      </div>
      <div class="auth-tabs">
        <button type="button" class="is-active" data-auth-mode="login">Вход</button>
        <button type="button" data-auth-mode="register">Регистрация</button>
      </div>
      <form id="authForm" class="auth-form">
        <label>
          <span>Логин</span>
          <input id="authUsername" autocomplete="username" required minlength="3" maxlength="20" placeholder="user_01">
        </label>
        <label>
          <span>Пароль</span>
          <input id="authPassword" type="password" autocomplete="current-password" required minlength="4" placeholder="минимум 4 символа">
        </label>
        <button id="authSubmit" type="submit">Войти</button>
        <div id="authError" class="auth-error" role="alert"></div>
      </form>
      <div class="auth-rules">Логин: 3-20 символов, латиница/цифры/_/-.</div>
    </section>
  `;
  document.body.appendChild(overlay);

  let mode = "login";
  const form = overlay.querySelector("#authForm");
  const submit = overlay.querySelector("#authSubmit");
  const errorBox = overlay.querySelector("#authError");
  const password = overlay.querySelector("#authPassword");

  overlay.querySelectorAll("[data-auth-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.authMode;
      overlay.querySelectorAll("[data-auth-mode]").forEach(x => x.classList.toggle("is-active", x === btn));
      submit.textContent = mode === "login" ? "Войти" : "Создать аккаунт";
      password.autocomplete = mode === "login" ? "current-password" : "new-password";
      errorBox.textContent = "";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    submit.disabled = true;
    try {
      const username = overlay.querySelector("#authUsername").value;
      const pass = password.value;
      const data = await apiJson(mode === "login" ? "/api/login" : "/api/register", {
        method: "POST",
        body: JSON.stringify({ username, password: pass }),
      });
      applyAuthState(data);
      overlay.classList.remove("is-visible");
    } catch (error) {
      const map = {
        username_invalid: "Логин: 3-20 символов, латиница/цифры/_/-.",
        password_invalid: "Пароль должен быть от 4 до 80 символов.",
        username_taken: "Такой логин уже занят.",
        invalid_login: "Неверный логин или пароль.",
      };
      errorBox.textContent = map[error.message] || "Не получилось войти. Проверь данные.";
    } finally {
      submit.disabled = false;
    }
  });

  return overlay;
}

function applyAuthState(data){
  currentUser = data?.user || null;
  leaderboardRowsCache = Array.isArray(data?.leaderboard) ? data.leaderboard : leaderboardRowsCache;
  renderUserBadge();
  renderLeaderboard();
}

function renderUserBadge(){
  let badge = document.getElementById("userBadge");
  if (!badge){
    badge = document.createElement("button");
    badge.id = "userBadge";
    badge.type = "button";
    badge.className = "translate-btn user-badge";
    document.querySelector(".topstats")?.appendChild(badge);
    badge.addEventListener("click", showLeaderboard);
  }
  badge.textContent = currentUser ? `USER: ${currentUser.username}` : "USER: ?";
}

function ensureLeaderboardUI(){
  let modal = document.getElementById("leaderboardModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "leaderboardModal";
  modal.className = "leaderboard-modal";
  modal.innerHTML = `
    <div class="leaderboard-modal__overlay"></div>
    <section class="leaderboard-modal__content">
      <div class="leaderboard-modal__head">
        <h2>Лидерборд</h2>
        <button id="leaderboardClose" type="button" class="analytics-modal__close">×</button>
      </div>
      <div id="leaderboardUser" class="leaderboard-user"></div>
      <div id="leaderboardRows" class="leaderboard-rows"></div>
      <button id="logoutBtn" type="button" class="secondary" style="width:100%;margin-top:12px;">Выйти</button>
    </section>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".leaderboard-modal__overlay").addEventListener("click", hideLeaderboard);
  modal.querySelector("#leaderboardClose").addEventListener("click", hideLeaderboard);
  modal.querySelector("#logoutBtn").addEventListener("click", logoutUser);
  return modal;
}

function renderLeaderboard(){
  const modal = ensureLeaderboardUI();
  const userBox = modal.querySelector("#leaderboardUser");
  const rowsBox = modal.querySelector("#leaderboardRows");
  const userStats = currentUser?.stats || {};

  if (userBox){
    userBox.innerHTML = currentUser
      ? `<strong>${escapeHtml(currentUser.username)}</strong><span>EXP: ${Number(userStats.exp || 0)} · Тестов: ${Number(userStats.testsCompleted || 0)} · Best: ${Number(userStats.bestPercent || 0)}%</span>`
      : "";
  }

  if (!rowsBox) return;
  if (!leaderboardRowsCache.length){
    rowsBox.innerHTML = `<div class="muted small">Пока пусто. Пройди тест первым.</div>`;
    return;
  }

  rowsBox.innerHTML = leaderboardRowsCache.map(row => `
    <div class="leaderboard-row ${currentUser?.username === row.username ? "is-me" : ""}">
      <span>${row.rank}</span>
      <strong>${escapeHtml(row.username)}</strong>
      <em>${row.exp} EXP</em>
      <small>${row.testsCompleted} тестов · best ${row.bestPercent}%</small>
    </div>
  `).join("");
}

async function showLeaderboard(){
  try {
    const data = await apiJson("/api/leaderboard");
    leaderboardRowsCache = Array.isArray(data.leaderboard) ? data.leaderboard : [];
  } catch {}
  renderLeaderboard();
  ensureLeaderboardUI().classList.add("is-visible");
}

function hideLeaderboard(){
  ensureLeaderboardUI().classList.remove("is-visible");
}

async function logoutUser(){
  try {
    await apiJson("/api/logout", { method: "POST", body: "{}" });
  } catch {}
  currentUser = null;
  leaderboardRowsCache = [];
  hideLeaderboard();
  ensureAuthUI().classList.add("is-visible");
}

async function requireAuth(){
  ensureAuthUI();
  ensureLeaderboardUI();
  try {
    const data = await apiJson("/api/me");
    applyAuthState(data);
    ensureAuthUI().classList.remove("is-visible");
  } catch {
    ensureAuthUI().classList.add("is-visible");
  }
}

async function submitLeaderboardScore(payload){
  if (!currentUser) return;
  try {
    const data = await apiJson("/api/submit-score", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    applyAuthState(data);
  } catch (error) {
    if (error.message === "not_authenticated") {
      currentUser = null;
      ensureAuthUI().classList.add("is-visible");
    }
  }
}

function setStatusPill(text){
  if (!statusPill) return;
  let dot = statusPill.querySelector(".dot");
  if (!dot) {
    dot = document.createElement("span");
    dot.className = "dot";
  }
  statusPill.textContent = "";
  statusPill.appendChild(dot);
  statusPill.appendChild(document.createTextNode(text));
}

function setMetaText(text){
  if (!meta) return;
  meta.textContent = text;
  const pill = meta.closest(".pill");
  if (pill) pill.style.display = text ? "inline-flex" : "none";
}

function updateStartDashboard(){
  if (!startDashboard) return;

  const selectedOption = bankSelect?.options[bankSelect.selectedIndex];
  const bankName = selectedOption?.textContent || "Bank";
  const forcedProblemBank = getForcedProblemBank();
  const problemStatus = getProblemReviewStatus(currentBankKey);
  const problemLocked = forcedProblemBank === currentBankKey;

  if (dashTitle) {
    dashTitle.textContent = problemLocked
      ? `Problem review · ${problemStatus.pending || PROBLEM_REVIEW_SIZE} questions`
      : `${bankName} · ${TEST_SIZE} questions`;
  }
  if (dashBankCount) dashBankCount.textContent = String(ALL.length || 0);
  if (dashMode) dashMode.textContent = mode === "mcq" ? "A-E" : "Text";
  if (dashHardCount) dashHardCount.textContent = String(problemLocked ? problemStatus.pending : hardQuestions.size);
  if (quickStartBtn) quickStartBtn.textContent = problemLocked ? "Problem review" : "Start test";
  if (startBtn) startBtn.textContent = problemLocked ? "Review" : "Start";
  if (quickHardBtn && problemLocked) quickHardBtn.disabled = true;

  document.querySelectorAll("[data-bank-tile]").forEach(tile => {
    tile.classList.toggle("is-active", tile.dataset.bankTile === currentBankKey);
    tile.classList.remove("is-locked");
  });

  if (dashPreview){
    dashPreview.innerHTML = "";
    let previewItems = ALL.slice(0, 3);

    if (problemLocked){
      const review = loadProblemReview(currentBankKey);
      const ids = review?.questionIds || getProblemCandidates(currentBankKey).slice(0, PROBLEM_REVIEW_SIZE).map(x => x.bankN);
      const idSet = new Set(ids.map(String));
      previewItems = ALL.filter(item => idSet.has(String(item.n))).slice(0, 3);
    }

    previewItems.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "session-preview__item";

      const num = document.createElement("span");
      num.textContent = problemLocked ? "!" : String(idx + 1).padStart(2, "0");

      const text = document.createElement("p");
      text.textContent = problemLocked
        ? `Review: ${displayText(item.q)}`
        : displayText(item.q);
      if (translateRu) text.title = item.q;

      row.appendChild(num);
      row.appendChild(text);
      dashPreview.appendChild(row);
    });
  }
}

let startTs = 0;
let timerId = null;

/** Focus mode controller */
function setRunning(isRunning){
  if (isRunning) {
    appEl.classList.add("is-running");
    if (hardMode) appEl.classList.add("hardmode-active");
    if (isProblemReviewMode) appEl.classList.add("problem-review-active");
  } else {
    appEl.classList.remove("is-running");
    appEl.classList.remove("hardmode-active");
    appEl.classList.remove("problem-review-active");
  }
}

function fmt(ms){
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function startTimer(){
  startTs = Date.now();
  if (floatingTimer) floatingTimer.style.display = "block";
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    const formatted = fmt(Date.now() - startTs);
    if (timerText) timerText.textContent = formatted;
    if (floatingTimerDisplay) floatingTimerDisplay.textContent = formatted;
  }, 250);
}

function stopTimer(){
  if (timerId) clearInterval(timerId);
  timerId = null;
  if (timerText) timerText.textContent = "—";
  if (floatingTimer) floatingTimer.style.display = "none";
}

function getElapsedMs(){
  return startTs ? (Date.now() - startTs) : 0;
}

const modeSelect = document.getElementById("modeSelect");
const testSizeSelect = document.getElementById("testSizeSelect");
const testSizeDisplay = document.getElementById("testSizeDisplay");
const floatingTimer = document.getElementById("floatingTimer");
const floatingTimerDisplay = document.getElementById("floatingTimerDisplay");

let TEST = [];
let TEST_SIZE = parseInt(localStorage.getItem("quiz_test_size") || "10", 10);
testSizeSelect.value = String(TEST_SIZE);
testSizeDisplay.textContent = TEST_SIZE;
let answers = new Map(); // id -> (mcq: index 0..4) | (text: string)
let skipObserver = null;
let isProblemReviewMode = false;
let activeProblemReviewBank = null;

const PROBLEM_REVIEW_SIZE = 10;
const PROBLEM_CLEAR_STREAK = 2;
const PROBLEM_ATTEMPT_LIMIT = 12;
const PROBLEM_REVIEW_VERSION = 1;
const COACH_STATE_KEY = "quiz_general_coach_v1";
const AI_ACTION_LOG_KEY = "quiz_ai_coach_actions_v1";
const AI_COACH_ENABLED_KEY = "quiz_ai_coach_enabled";
const AI_COACH_UNAVAILABLE_MESSAGE =
  "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u0431\u0435\u0437 \u0441\u0432\u044f\u0437\u0438: OpenAI \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d. \u041f\u0440\u043e\u0432\u0435\u0440\u044c \u043a\u043b\u044e\u0447 \u0438\u043b\u0438 \u043b\u043e\u0433\u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u0430.";
let aiCoachEnabled = localStorage.getItem(AI_COACH_ENABLED_KEY) !== "0";
let coachState = null;


// === HARD AUTO (ошибка -> добавить, 2 подряд верно -> снять) ===
const LEGACY_HARD_KEY = "hard_questions_bankN";
const LEGACY_HARD_STATS_KEY = "hard_stats_bankN";
let currentBankKey = DEFAULT_BANK_KEY;

let hardQuestions = new Set(); // bank-local question ids
let hardStats = {};            // { [bankN]: { streak, wrong } }

function readJson(key, fallback){
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch(e){
    console.warn("Ошибка загрузки localStorage:", key, e);
    return fallback;
  }
}

function defaultCoachState(){
  return {
    tone: "kind",
    wrongStreak: 0,
    missedStreak: 0,
    totalWarnings: 0,
    totalPraise: 0,
    lastMessage: "",
    lastEvent: "",
    lastMessageAt: 0
  };
}

function loadCoachState(){
  const saved = readJson(COACH_STATE_KEY, null);
  const state = Object.assign(defaultCoachState(), saved && typeof saved === "object" ? saved : {});
  const message = String(state.lastMessage || "");
  const looksEnglishDefault = /General online|Work calmly|Read calmly|Sir, yes sir/i.test(message);
  const looksBroken = /(?:Р[ђ-џ]|С[Ѐ-џ]|вЂ|вњ|вљ|\?{2,})/.test(message);
  if (looksBroken || looksEnglishDefault){
    state.lastMessage = "Генерал на связи. Работаем спокойно и точно.";
    state.lastEvent = "";
    state.lastMessageAt = 0;
    localStorage.setItem(COACH_STATE_KEY, JSON.stringify(state));
  }
  return state;
}

function saveCoachState(){
  if (!coachState) return;
  localStorage.setItem(COACH_STATE_KEY, JSON.stringify(coachState));
}

function isAiCoachEnabled(){
  return aiCoachEnabled;
}

function updateCoachToggleUI(){
  if (coachToggle) coachToggle.checked = aiCoachEnabled;
  document.body.classList.toggle("ai-coach-disabled", !aiCoachEnabled);
  const panel = document.getElementById("coachPanel");
  if (panel) panel.hidden = !aiCoachEnabled;
}

function getCoachTone(){
  if (!coachState) coachState = loadCoachState();
  if (coachState.missedStreak >= 3 || coachState.wrongStreak >= 5) return "danger";
  if (coachState.missedStreak >= 2 || coachState.wrongStreak >= 3 || isProblemReviewMode) return "drill";
  if (coachState.wrongStreak >= 1 || coachState.missedStreak >= 1) return "strict";
  return "kind";
}

function coachPick(list){
  if (!Array.isArray(list) || !list.length) return "";
  return list[Math.floor(Math.random() * list.length)];
}

function getCoachMessage(event, tone, data = {}){
  const pending = Number(data.pending || 0);
  const wrong = Number(data.wrong || 0);
  const percent = Number(data.percent || 0);

  const messages = {
    start: {
      kind: [
        "Генерал на связи. Читай спокойно, отсекай шум и выбирай осознанно.",
        "Работаем ровно. Ошибаться можно, угадывать нельзя."
      ],
      strict: [
        "Темп держим, фокус усиливаем. Сначала докажи ответ себе, потом нажимай.",
        "Сначала формулировка вопроса, потом варианты."
      ],
      drill: [
        "Курсант, режим тренировки активен. Обходных путей нет, есть только ответы.",
        "Никаких случайных кликов. Закрываем слабое место."
      ],
      danger: [
        "Красная зона. Каждый обходной маневр вернет тебя к вопросу.",
        "Смирно. Сначала думай, потом нажимай."
      ]
    },
    unanswered: {
      strict: [
        "Пустой ответ? Не принято. Вернись к вопросу и выбери позицию.",
        "Курсант, если игнорировать вопрос, он никуда не исчезнет."
      ],
      drill: [
        "Без пропусков. Прочитай, убери два слабых варианта и отвечай.",
        "Пустые ответы остаются на плацу до полной отработки."
      ],
      danger: [
        "Это не пропуск, это отступление. Развернулся и ответил.",
        "Уклонение отклонено. Нет ответа - нет допуска дальше."
      ]
    },
    wrong: {
      strict: [
        "Неверный ответ записан. Теперь найди слово, которое решает смысл.",
        "Неверно. Убери отвлекающие варианты и свяжи термин с определением."
      ],
      drill: [
        "Курсант, промах внесен в журнал. Следующая попытка должна быть осознанной.",
        "Один неверный ответ - это данные. Повторять его - уже проблема дисциплины."
      ],
      danger: [
        "Нет. Случайные клики - не тренировка. Остановись и прочитай вопрос.",
        "Красная зона. Пока не поймешь ответ, вопрос будет возвращаться."
      ]
    },
    correct: {
      kind: [
        "Чистое попадание. Спокойно, четко, в цель.",
        "Принято. Уверенный ответ, двигаемся дальше."
      ],
      strict: [
        "Хорошо. Видишь, что происходит, когда читаешь внимательно?",
        "Верно. Держи этот темп, курсант."
      ],
      drill: [
        "Есть попадание. Еще один шаг к свободе.",
        "Попадание подтверждено. Закрепи и не расслабляйся."
      ],
      danger: [
        "Наконец-то порядок. Продолжай так и выйдешь из красной зоны.",
        "Вот это похоже на работу. Больше точности, меньше хаоса."
      ]
    },
    finish: {
      kind: [
        `Сессия завершена: ${percent}%. Ошибок: ${wrong}. Есть материал для тренировки.`,
        `Финиш: ${percent}%. Теперь зачищаем слабые места.`
      ],
      strict: [
        `Финиш: ${percent}%. Ошибок: ${wrong}. Повторение обязательно.`,
        "Сессия завершена. Ошибки записаны, дисциплина начинается с повторения."
      ],
      drill: [
        `Результат ${percent}%. Проблемные вопросы уходят на отработку.`,
        `Ошибок: ${wrong}. План простой: повторить и закрыть.`
      ],
      danger: [
        `Красная зона: ${percent}%. Повторение - единственный выход.`,
        "Слишком много провалов. Эти вопросы будут возвращаться, пока не станут твоими."
      ]
    },
    problemStart: {
      drill: [
        `Отработка проблемных вопросов началась. Осталось: ${pending}. По два верных подряд на каждый.`,
        `Режим повторения включен. Целей: ${pending}. Отступать некуда.`
      ],
      danger: [
        `Генерал принимает командование. Проблемных вопросов: ${pending}, по два чистых попадания на каждый.`,
        `Зона зачистки активна. Целей: ${pending}. Одна ошибка сбрасывает серию.`
      ]
    },
    problemRound: {
      drill: [
        `Раунд не закрыт. Осталось: ${pending}. Промахи возвращаются в строй.`,
        `Продолжаем. Еще ${pending} вопросов сопротивляются.`
      ],
      danger: [
        `Выхода пока нет. Осталось вопросов: ${pending}. Работаем до зачистки.`,
        `Попытка записана, но зачистка не завершена. Целей осталось: ${pending}.`
      ]
    },
    problemCleared: {
      kind: [
        "Проблемный набор закрыт. Вот это дисциплина.",
        "Повторение завершено. Генерал одобряет. Двигай дальше."
      ],
      strict: [
        "Десять проблемных вопросов закрыты. Запомни: побеждают два верных подряд.",
        "Зачищено. Слабые места сняты с активного контроля."
      ]
    },
    hardFail: {
      drill: [
        "Hardmode провален. Жестко, но справедливо.",
        "Один шанс потрачен. В следующий раз думай до клика."
      ],
      danger: [
        "Провал. Генерал видел этот клик. Повтори, вернись, выполни.",
        "Hardmode - это не удача. Вернись после повторения."
      ]
    }
  };

  const humanMessages = {
    start: {
      kind: [
        "Я рядом. Без суеты: читаешь вопрос, ловишь смысл, потом жмешь.",
        "Начали спокойно. Тут не надо геройствовать, надо внимательно читать."
      ],
      strict: [
        "Так, соберись. Не летим мышкой вперед головы.",
        "Темп нормальный, но глаза включи. Варианты любят подставлять."
      ],
      drill: [
        "Окей, режим тренировки. Сейчас без угадаек, я за этим прослежу.",
        "Слабые места сами не уйдут. Достаем их и спокойно добиваем."
      ],
      danger: [
        "Стоп. Ты уже на тонком льду, поэтому каждый клик только после мысли.",
        "Красная зона. Сейчас я буду громче, потому что иначе ты опять проскочишь мимо смысла."
      ]
    },
    unanswered: {
      strict: [
        "Эй, пустой ответ не считается планом. Вернись и выбери нормально.",
        "Не прячься от вопроса. Он все равно тебя догонит."
      ],
      drill: [
        "Нет, так не играем. Прочитал, отбросил лишнее, ответил.",
        "Пропуск не принимаю. Дай хотя бы честную попытку."
      ],
      danger: [
        "Серьезно? Ты даже не попробовал. Назад к вопросу.",
        "Уклонение вижу. Пока не ответишь, дальше не идем."
      ]
    },
    wrong: {
      strict: [
        "Мимо. Не страшно, но ты явно поспешил. Найди ключевое слово в вопросе.",
        "Неверно. Давай без паники: что именно спрашивали?"
      ],
      drill: [
        "Вот это был тык, и мы оба это видели. Еще раз, уже головой.",
        "Промах. Не кликай на знакомое слово, сначала проверь смысл."
      ],
      danger: [
        "Нет. Это уже не ошибка, это автопилот. Остановись и прочитай заново.",
        "Так, хватит разбрасываться ответами. Сейчас работаешь медленнее и точнее."
      ]
    },
    correct: {
      kind: [
        "Вот, хорошо. Спокойно разобрал и попал.",
        "Да, это оно. Видишь, когда не спешишь, все складывается."
      ],
      strict: [
        "Нормально. Держи этот темп и не расслабляйся.",
        "Верно. Вот так и надо: меньше шума, больше смысла."
      ],
      drill: [
        "Есть. Один гвоздь забили, идем дальше.",
        "Попал. Запомни ощущение: ты не угадал, ты понял."
      ],
      danger: [
        "Наконец-то. Вот так выглядит включенная голова.",
        "Да. Еще несколько таких ответов, и я перестану сверлить тебя взглядом."
      ]
    },
    finish: {
      kind: [
        `Закончили на ${percent}%. Ошибок: ${wrong}. Ничего, теперь видно, что подтянуть.`,
        `Финиш: ${percent}%. Есть слабые места, но это уже конкретная карта, не туман.`
      ],
      strict: [
        `Итог ${percent}%, ошибок ${wrong}. Отдыхать рано, повторение само себя не сделает.`,
        "Сессия закрыта. Теперь не делаем вид, что ошибок не было."
      ],
      drill: [
        `Результат ${percent}%. Проблемные вопросы идут в отработку, без торга.`,
        `Ошибок: ${wrong}. Значит, берем их отдельно и дожимаем.`
      ],
      danger: [
        `Красная зона: ${percent}%. Сейчас спасает только повторение, без красивых оправданий.`,
        "Провалов многовато. Эти вопросы будут возвращаться, пока ты их не приручишь."
      ]
    },
    problemStart: {
      drill: [
        `Так, вот они: ${pending} проблемных вопросов. Два верных подряд, и отпущу.`,
        `Отработка началась. ${pending} целей, работаем без нытья и пропусков.`
      ],
      danger: [
        `Я забираю управление. ${pending} вопросов, и каждый придется закрыть честно.`,
        `Зона зачистки. ${pending} вопросов. Ошибка - начинаешь закрепление заново.`
      ]
    },
    problemRound: {
      drill: [
        `Пока не чисто. Осталось ${pending}. Ничего, дожмем.`,
        `Не все сдались. ${pending} вопросов еще держатся.`
      ],
      danger: [
        `Нет, выход еще закрыт. Осталось ${pending}, работаем дальше.`,
        `Попытка была, но не победа. ${pending} вопросов все еще смотрят на тебя.`
      ]
    },
    problemCleared: {
      kind: [
        "Вот теперь красиво. Проблемный блок закрыт.",
        "Отлично, ты это вытащил. Генерал доволен, но виду почти не подает."
      ],
      strict: [
        "Закрыто. Запомни: не магия, а повторение.",
        "Слабое место снято с контроля. Так и надо работать."
      ]
    },
    hardFail: {
      drill: [
        "Hardmode не простил. Бывает, но второй раз так не кликай.",
        "Один шанс сгорел. В следующий заход сначала думаешь, потом жмешь."
      ],
      danger: [
        "Провал. Я прям видел этот поспешный клик. На повторение.",
        "Hardmode не лотерея. Вернешься, когда ответ будет в голове, а не на удачу."
      ]
    }
  };

  const humanByEvent = humanMessages[event];
  const humanLine = coachPick(humanByEvent && (humanByEvent[tone] || humanByEvent.drill || humanByEvent.strict || humanByEvent.kind));
  if (humanLine) return humanLine;

  const byEvent = messages[event] || messages.start;
  return coachPick(byEvent[tone] || byEvent.drill || byEvent.strict || byEvent.kind);
}

function ensureCoachPanel(){
  let panel = document.getElementById("coachPanel");
  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = "coachPanel";
  panel.className = "coach-panel";
  panel.innerHTML = `
    <div class="coach-panel__badge" aria-hidden="true">
      <img src="img/general-avatar.jpg" alt="">
    </div>
    <div class="coach-panel__body">
      <div class="coach-panel__top">
        <strong id="coachTitle">Режим генерала</strong>
        <span id="coachTone">kind</span>
      </div>
      <p id="coachMessage">Генерал на связи. Работаем спокойно и точно.</p>
    </div>
  `;

  const hero = document.querySelector(".hero");
  if (hero && hero.parentNode) {
    hero.insertAdjacentElement("afterend", panel);
  } else {
    document.querySelector(".main")?.prepend(panel);
  }
  return panel;
}

function renderCoachPanel(message){
  if (!isAiCoachEnabled()){
    updateCoachToggleUI();
    return;
  }
  if (!coachState) coachState = loadCoachState();
  const panel = ensureCoachPanel();
  panel.hidden = false;
  const title = panel.querySelector("#coachTitle");
  const tone = panel.querySelector("#coachTone");
  const msg = panel.querySelector("#coachMessage");
  const toneLabels = {
    kind: "мягко",
    strict: "строго",
    drill: "тренировка",
    danger: "красная зона"
  };

  panel.dataset.tone = coachState.tone;
  if (title) title.textContent = coachState.tone === "kind" ? "Режим генерала" : "Генерал-тренировка";
  if (tone) tone.textContent = toneLabels[coachState.tone] || coachState.tone;
  if (msg) msg.textContent = message || coachState.lastMessage || "Генерал на связи. Работаем спокойно и точно.";

  panel.classList.remove("is-pulsing");
  void panel.offsetWidth;
  panel.classList.add("is-pulsing");
}

function getAnswerTextForCoach(item, user){
  if (!item) return "";
  if (mode === "mcq"){
    return typeof user === "number" && item.options?.[user] ? item.options[user] : "";
  }
  return String(user ?? "");
}

function showAiCoachUnavailable(reason, details = null, localMessage = ""){
  console.warn("[coach] OpenAI unavailable:", reason, details || "");
  if (!coachState || (localMessage && coachState.lastMessage !== localMessage)) return;
  coachState.lastMessage = AI_COACH_UNAVAILABLE_MESSAGE;
  coachState.lastMessageAt = Date.now();
  saveCoachState();
  renderCoachPanel(AI_COACH_UNAVAILABLE_MESSAGE);
}

function getAiCoachActionLabel(type){
  const labels = {
    boost_problem_question: "\u041f\u0440\u0438\u043a\u0430\u0437: \u0432\u043e\u043f\u0440\u043e\u0441 \u0432 \u0443\u0441\u0438\u043b\u0435\u043d\u043d\u0443\u044e \u043e\u0442\u0440\u0430\u0431\u043e\u0442\u043a\u0443",
    suggest_break: "\u041f\u0440\u0438\u043a\u0430\u0437: \u043a\u043e\u0440\u043e\u0442\u043a\u0430\u044f \u043f\u0430\u0443\u0437\u0430",
    start_micro_drill: "\u041f\u0440\u0438\u043a\u0430\u0437: \u043c\u0438\u043a\u0440\u043e-\u043e\u0442\u0440\u0430\u0431\u043e\u0442\u043a\u0430"
  };
  return labels[type] || "\u041f\u0440\u0438\u043a\u0430\u0437 \u0433\u0435\u043d\u0435\u0440\u0430\u043b\u0430";
}

function ensureGeneralCommandDialog(){
  let dialog = document.getElementById("generalCommandDialog");
  if (dialog) return dialog;

  dialog = document.createElement("div");
  dialog.id = "generalCommandDialog";
  dialog.className = "general-command";
  dialog.innerHTML = `
    <div class="general-command__backdrop"></div>
    <section class="general-command__box" role="dialog" aria-modal="true" aria-labelledby="generalCommandTitle">
      <div class="general-command__portrait">
        <img src="img/general-avatar.jpg" alt="">
      </div>
      <div class="general-command__content">
        <p class="general-command__eyebrow">\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0432\u0437\u044f\u043b \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435</p>
        <h2 id="generalCommandTitle">\u041f\u0440\u0438\u043a\u0430\u0437</h2>
        <p id="generalCommandMessage" class="general-command__message"></p>
        <p id="generalCommandReason" class="general-command__reason"></p>
        <button id="generalCommandOk" type="button">\u041f\u0440\u0438\u043d\u044f\u043b</button>
      </div>
    </section>
  `;
  document.body.appendChild(dialog);
  return dialog;
}

function showGeneralCommandDialog(action, context = {}){
  const dialog = ensureGeneralCommandDialog();
  const title = dialog.querySelector("#generalCommandTitle");
  const message = dialog.querySelector("#generalCommandMessage");
  const reason = dialog.querySelector("#generalCommandReason");
  const ok = dialog.querySelector("#generalCommandOk");

  const type = String(action?.type || "none");
  const cleanReason = String(action?.reason || "").trim();
  if (title) title.textContent = getAiCoachActionLabel(type);
  if (message) message.textContent = context.message || coachState?.lastMessage || "";
  if (reason) {
    reason.textContent = cleanReason
      ? `\u0420\u0435\u0448\u0435\u043d\u0438\u0435: ${cleanReason}`
      : "\u0420\u0435\u0448\u0435\u043d\u0438\u0435: \u0441\u043c\u0435\u043d\u0430 \u043f\u043b\u0430\u043d\u0430 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438.";
  }

  return new Promise(resolve => {
    const close = () => {
      dialog.classList.remove("is-visible");
      document.body.classList.remove("general-command-open");
      ok?.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
      setTimeout(() => resolve(), 180);
    };
    const onKey = event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        close();
      }
    };

    ok?.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("general-command-open");
    dialog.classList.add("is-visible");
    setTimeout(() => ok?.focus(), 60);
  });
}

async function applyAiCoachAction(action, context = {}){
  if (!isAiCoachEnabled()) return;
  if (!action || typeof action !== "object") return;
  const type = String(action.type || "none");
  if (type === "none") return;

  const reason = String(action.reason || "");
  const item = context.data?.item || TEST[curIdx] || null;
  const allowed = new Set(["boost_problem_question", "suggest_break", "start_micro_drill"]);
  if (!allowed.has(type)) {
    logAiCoachAction({ type, skipped: true, reason: "unknown_action" });
    return;
  }

  if (type === "boost_problem_question") {
    if (!["wrong", "unanswered", "hardFail"].includes(context.event)) {
      logAiCoachAction({ type, skipped: true, reason: "event_not_allowed" });
      return;
    }
    if (!item || item.bankN == null) {
      logAiCoachAction({ type, skipped: true, reason: "missing_question" });
      return;
    }
    await showGeneralCommandDialog(action, context);
    boostProblemQuestionPriority(item, reason);
    return;
  }

  if (type === "suggest_break") {
    await showGeneralCommandDialog(action, context);
    logAiCoachAction({ type, reason });
    showAiActionToast("\u041f\u0430\u0443\u0437\u0430 \u043e\u0442 \u0433\u0435\u043d\u0435\u0440\u0430\u043b\u0430: 30 \u0441\u0435\u043a\u0443\u043d\u0434 \u0431\u0435\u0437 \u043a\u043b\u0438\u043a\u043e\u0432, \u043f\u043e\u0442\u043e\u043c \u0434\u043e\u0436\u0438\u043c\u0430\u0435\u043c.");
    return;
  }

  if (type === "start_micro_drill") {
    if (!["finish", "problemRound"].includes(context.event)) {
      logAiCoachAction({ type, skipped: true, reason: "event_not_allowed" });
      return;
    }
    await showGeneralCommandDialog(action, context);
    startAiMicroDrill(action.size, reason);
  }
}

async function requestAiCoachMessage(event, tone, data = {}, localMessage = ""){
  if (!isAiCoachEnabled()) return;
  if (window.location.protocol === "file:") return;

  try {
    const item = data.item || null;
    const response = await fetch("/api/coach-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        tone,
        localMessage,
        question: item?.q || data.question || "",
        userAnswer: data.userAnswer || getAnswerTextForCoach(item, data.user),
        correctAnswer: data.correctAnswer || (event === "finish" || event === "problemCleared" ? item?.correctText || "" : ""),
        problemMode: isProblemReviewMode,
        stats: {
          wrongStreak: coachState?.wrongStreak || 0,
          missedStreak: coachState?.missedStreak || 0,
          pending: data.pending || 0,
          wrong: data.wrong || 0,
          percent: data.percent || 0,
          problemCandidates: getProblemCandidates(currentBankKey).length,
          canStartMicroDrill: !startBtn.disabled || !TEST.length,
        },
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      showAiCoachUnavailable(json.error || `http_${response.status}`, json.detail || json, localMessage);
      return;
    }
    const message = String(json.message || "").trim();
    if (!message) {
      showAiCoachUnavailable("empty_message", json, localMessage);
      return;
    }
    if (!coachState || coachState.lastMessage !== localMessage) return;

    coachState.lastMessage = message;
    coachState.lastMessageAt = Date.now();
    saveCoachState();
    renderCoachPanel(message);
    applyAiCoachAction(json.action, { event, tone, data, localMessage, message });
  } catch (error) {
    showAiCoachUnavailable("request_failed", error, localMessage);
  }
}

function coachReact(event, data = {}){
  if (!isAiCoachEnabled()) return;
  if (!coachState) coachState = loadCoachState();

  if (event === "correct"){
    coachState.totalPraise++;
    coachState.wrongStreak = Math.max(0, coachState.wrongStreak - 1);
    coachState.missedStreak = Math.max(0, coachState.missedStreak - 1);
  } else if (event === "unanswered"){
    coachState.totalWarnings++;
    coachState.wrongStreak++;
    coachState.missedStreak++;
  } else if (event === "wrong" || event === "hardFail"){
    coachState.totalWarnings++;
    coachState.wrongStreak++;
    if (data.empty) coachState.missedStreak++;
  } else if (event === "finish"){
    const wrongCount = Number(data.wrong || 0);
    if (wrongCount > 0){
      coachState.totalWarnings += wrongCount;
      coachState.wrongStreak += Math.min(2, wrongCount);
    } else {
      coachState.totalPraise++;
      coachState.wrongStreak = Math.max(0, coachState.wrongStreak - 1);
      coachState.missedStreak = Math.max(0, coachState.missedStreak - 1);
    }
  } else if (event === "problemRound"){
    coachState.totalWarnings++;
    coachState.wrongStreak += 2;
  } else if (event === "problemCleared"){
    coachState.wrongStreak = 0;
    coachState.missedStreak = 0;
  }

  coachState.tone = getCoachTone();
  const message = getCoachMessage(event, coachState.tone, data);
  coachState.lastMessage = message;
  coachState.lastEvent = event;
  coachState.lastMessageAt = Date.now();
  saveCoachState();
  renderCoachPanel(message);
  requestAiCoachMessage(event, coachState.tone, data, message);
}

coachState = loadCoachState();

function getHardKey(bankKey = currentBankKey){
  return `hard_questions_${bankKey}_v2`;
}

function getHardStatsKey(bankKey = currentBankKey){
  return `hard_stats_${bankKey}_v2`;
}

function hardId(bankN){
  return String(bankN);
}

function loadHardState(bankKey = currentBankKey){
  const hardKey = getHardKey(bankKey);
  const statsKey = getHardStatsKey(bankKey);

  let savedQuestions = readJson(hardKey, null);
  let savedStats = readJson(statsKey, null);

  // One-time soft migration for old global storage.
  if (savedQuestions === null) savedQuestions = readJson(LEGACY_HARD_KEY, []);
  if (savedStats === null) savedStats = readJson(LEGACY_HARD_STATS_KEY, {});

  hardQuestions = new Set((Array.isArray(savedQuestions) ? savedQuestions : []).map(hardId));
  hardStats = (savedStats && typeof savedStats === "object" && !Array.isArray(savedStats)) ? savedStats : {};
}

function saveHard(){
  localStorage.setItem(getHardKey(), JSON.stringify([...hardQuestions]));
}
function saveHardStats(){
  localStorage.setItem(getHardStatsKey(), JSON.stringify(hardStats));
}

function hasHardQuestion(bankN){
  return hardQuestions.has(hardId(bankN));
}

function addHardQuestion(bankN){
  hardQuestions.add(hardId(bankN));
}

function deleteHardQuestion(bankN){
  hardQuestions.delete(hardId(bankN));
}

function updateHardButton(){
  if (!hardBtn) return;
  const forcedProblemBank = getForcedProblemBank(currentBankKey);
  const disabled = Boolean(forcedProblemBank) || (hardQuestions.size === 0 || startBtn.disabled);
  hardBtn.disabled = disabled;
  if (quickHardBtn) quickHardBtn.disabled = disabled;
  updateStartDashboard();
}

function clearAllFlags(){
  hardQuestions.clear();
  hardStats = {};
  saveHard();
  saveHardStats();
  updateHardButton();
  // Перерисовать тест только если он действительно запущен (кнопка "Начать" отключена)
  if (TEST.length > 0 && startBtn.disabled) {
    renderTest();
  }
}

let mode = localStorage.getItem("quiz_mode") || "mcq";
modeSelect.value = mode;

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeQuestionId(idx){
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`;
}

function buildTestItem(source, idx){
  const shuffledOptions = shuffle(source.options.map((text, originalIndex) => ({
    text,
    isCorrect: originalIndex === source.correctIndex
  })));

  let correctIndex = shuffledOptions.findIndex(option => option.isCorrect);
  if (correctIndex === -1){
    correctIndex = shuffledOptions.findIndex(option => norm(option.text) === norm(source.correctText));
  }

  return {
    id: makeQuestionId(idx),
    n: idx + 1,
    bankN: source.n,
    q: source.q,
    options: shuffledOptions.map(option => option.text),
    correctIndex,
    correctText: source.correctText
  };
}

function buildTest(){
  answers.clear();
  const picked = shuffle([...ALL]).slice(0, Math.min(TEST_SIZE, ALL.length));
  TEST = picked.map(buildTestItem);
}

function buildTestHard(){
  answers.clear();

  const hardItems = ALL.filter(x => hasHardQuestion(x.n));
  if (hardItems.length === 0){
    alert("Нет помеченных сложных вопросов.");
    return false;
  }

  const picked = shuffle([...hardItems]).slice(0, Math.min(TEST_SIZE, hardItems.length));
  TEST = picked.map(buildTestItem);

  return true;
}

function buildProblemReviewTest(review){
  answers.clear();
  if (!review || !Array.isArray(review.questionIds)) return false;

  const pendingIds = review.questionIds
    .map(String)
    .filter(id => (review.progress?.[id]?.streak || 0) < PROBLEM_CLEAR_STREAK);

  if (!pendingIds.length) return false;

  const pendingSet = new Set(pendingIds);
  const picked = ALL.filter(x => pendingSet.has(String(x.n)));
  if (!picked.length) return false;

  TEST = picked.map(buildTestItem);
  return true;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function isCardAnswered(card){
  // режим текста: есть input[type=text] и он не пустой
  const txt = card.querySelector('input[type="text"]');
  if (txt) return txt.value.trim().length > 0;

  // режим вариантов: есть выбранный radio
  return !!card.querySelector('input[type="radio"]:checked');
}

function setSkipUI(card, on){
  card.classList.toggle("needs-answer", on);

  const qhead = card.querySelector(".qhead");
  if (!qhead) return;

  let badge = qhead.querySelector(".skipBadge");
  if (on){
    if (!badge){
      badge = document.createElement("span");
      badge.className = "skipBadge";
      badge.textContent = "Ответить!";
      // вставим перед флажком "Сложный", чтобы не ломать верстку
      qhead.appendChild(badge);
    }
  } else {
    if (badge) badge.remove();
  }
}

function setupSkipHighlighter(){
  // убрать старый observer при перерисовке
  if (skipObserver){
    skipObserver.disconnect();
    skipObserver = null;
  }

  const cards = Array.from(elQuiz.querySelectorAll(".card"));
  if (!cards.length) return;

  skipObserver = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (!e.isIntersecting) continue;

      const card = e.target;

      // если уже отвечено — ничего не подсвечиваем
      const unanswered = !isCardAnswered(card);
      setSkipUI(card, unanswered);
    }
  }, {
    root: null,
    threshold: 0.65,         // считаем "дошел", когда видно большую часть карточки
  });

  cards.forEach(c => skipObserver.observe(c));
}

function isAnswered(item){
  const v = answers.get(item.id);

  if (mode === "mcq"){
    return (typeof v === "number" && v >= 0);
  } else {
    return String(v ?? "").trim().length > 0;
  }
}

function findFirstUnanswered(){
  for (let i = 0; i < TEST.length; i++){
    if (!isAnswered(TEST[i])) return i;
  }
  return -1;
}

function scrollToQuestion(idx){
  const item = TEST[idx];
  if (!item) return;

  // если hardMode — там один вопрос на экране, просто подсветим
  if (hardMode){
    const card = document.getElementById("activeQuestionCard");
    if (card){
      card.classList.add("needs-answer");
      card.scrollIntoView({ behavior:"smooth", block:"center" });
    }
    return;
  }

  const card = elQuiz.querySelector(`.card[data-qid="${item.id}"]`);
  if (card){
    card.classList.add("needs-answer");
    card.scrollIntoView({ behavior:"smooth", block:"center" });
  }
}

function showFinishBlockedModal(idx){
  // если уже есть — не плодим
  if (document.getElementById("finishBlockedModal")) return;

  const el = document.createElement("div");
  el.id = "finishBlockedModal";
  el.className = "hardmode-fail-overlay show"; // используем твой готовый оверлей-стиль
  el.innerHTML = `
    <div class="hardmode-fail-content">
      <div class="hardmode-fail-icon">⚠️</div>
      <div class="hardmode-fail-title">Есть пропущенные вопросы</div>
      <div class="hardmode-fail-sub">Нужно ответить, иначе завершить нельзя</div>
      <div style="display:flex; gap:10px; justify-content:center; margin-top:16px">
        <button id="goMissBtn">Перейти</button>
        <button class="secondary" id="cancelMissBtn">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  document.getElementById("goMissBtn").onclick = () => {
    scrollToQuestion(idx);
    el.remove();
  };
  document.getElementById("cancelMissBtn").onclick = () => el.remove();
}

// ===== Статистика по вопросам (per bankN) =====
const QSTATS_KEY = "quiz_qstats_v1";

function loadQStats(){
  try {
    const saved = localStorage.getItem(QSTATS_KEY);
    if (!saved) return {};
    return JSON.parse(saved);
  } catch(e){
    console.warn("Ошибка загрузки статистики вопросов:", e);
    return {};
  }
}

function saveQStats(allStats){
  localStorage.setItem(QSTATS_KEY, JSON.stringify(allStats));
}

function logAiCoachAction(entry){
  const safeEntry = Object.assign({
    ts: new Date().toISOString(),
    bankKey: currentBankKey,
  }, entry || {});
  console.info("[coach] action:", safeEntry);
  const history = readJson(AI_ACTION_LOG_KEY, []);
  const next = Array.isArray(history) ? history.slice(-49) : [];
  next.push(safeEntry);
  localStorage.setItem(AI_ACTION_LOG_KEY, JSON.stringify(next));
}

function showAiActionToast(text){
  const el = document.createElement("div");
  el.className = "ai-action-toast";
  el.textContent = text || "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0441\u043c\u0435\u043d\u0438\u043b \u043f\u043b\u0430\u043d \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438.";
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 320);
  }, 3600);
}

function boostProblemQuestionPriority(item, reason = ""){
  if (!item || item.bankN == null) return false;
  const key = resolveBankKey(currentBankKey);
  const id = String(item.bankN);
  const allStats = loadQStats();
  if (!allStats[key]) allStats[key] = {};
  const stat = normalizeQStat(allStats[key][id]);
  stat.aiBoostCount = Math.min(8, Number(stat.aiBoostCount || 0) + 1);
  stat.lastAiActionAt = new Date().toISOString();
  stat.problemScore = calcProblemScore(stat);
  allStats[key][id] = stat;
  saveQStats(allStats);
  addHardQuestion(item.bankN);
  updateHardButton();
  updateStartDashboard();
  logAiCoachAction({ type: "boost_problem_question", questionId: id, reason, score: stat.problemScore });
  return true;
}

function startAiMicroDrill(size = 3, reason = ""){
  const key = resolveBankKey(currentBankKey);
  const limit = Math.max(3, Math.min(5, Number(size || 3)));
  const candidates = getProblemCandidates(key).slice(0, limit);
  if (candidates.length < 3) {
    logAiCoachAction({ type: "start_micro_drill", skipped: true, reason: "not_enough_candidates" });
    return false;
  }
  if (startBtn.disabled && TEST.length && !isInLearningMode) {
    logAiCoachAction({ type: "start_micro_drill", skipped: true, reason: "test_is_running" });
    return false;
  }

  const review = {
    active: true,
    aiMicro: true,
    bankKey: key,
    startedAt: new Date().toISOString(),
    questionIds: candidates.map(x => String(x.bankN)),
    progress: {}
  };
  review.questionIds.forEach(id => {
    review.progress[id] = { streak: 0 };
  });
  saveProblemReview(key, review);
  logAiCoachAction({ type: "start_micro_drill", size: review.questionIds.length, reason });
  showAiActionToast("\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0435\u0442 \u043c\u0438\u043a\u0440\u043e-\u043e\u0442\u0440\u0430\u0431\u043e\u0442\u043a\u0443: \u0441\u043b\u0430\u0431\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b \u043d\u0430 \u0441\u0442\u043e\u043b.");
  setTimeout(() => startQuiz({ hardOnly: false }), 650);
  return true;
}

function createEmptyQStat(){
  return {
    shown: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    lastSeen: "",
    lastCorrectAt: "",
    lastResult: "",
    attempts: [],
    learnedOnce: false,
    relapseCount: 0,
    aiBoostCount: 0,
    lastAiActionAt: "",
    problemScore: 0,
    problemMasteredAt: ""
  };
}

function normalizeQStat(stat){
  const base = createEmptyQStat();
  const normalized = Object.assign(base, stat && typeof stat === "object" ? stat : {});
  normalized.shown = Number(normalized.shown || 0);
  normalized.correct = Number(normalized.correct || 0);
  normalized.wrong = Number(normalized.wrong || 0);
  normalized.streak = Number(normalized.streak || 0);
  normalized.relapseCount = Number(normalized.relapseCount || 0);
  normalized.aiBoostCount = Number(normalized.aiBoostCount || 0);
  normalized.problemScore = Number(normalized.problemScore || 0);
  normalized.learnedOnce = Boolean(normalized.learnedOnce);
  normalized.attempts = Array.isArray(normalized.attempts)
    ? normalized.attempts.slice(-PROBLEM_ATTEMPT_LIMIT).filter(x => x && typeof x === "object")
    : [];
  return normalized;
}

function hasRecentWrongAfterMastery(stat){
  if (!stat.problemMasteredAt) return true;
  const last = stat.attempts[stat.attempts.length - 1];
  return Boolean(last && last.ok === false);
}

function calcProblemScore(stat){
  stat = normalizeQStat(stat);
  const aiBoost = Math.min(4, Number(stat.aiBoostCount || 0));
  if (stat.shown < 3 || stat.wrong < 1) {
    return stat.wrong >= 1 && aiBoost >= 2 ? aiBoost * 2 : 0;
  }

  const attempts = stat.attempts || [];
  const recent = attempts.slice(-3);
  const recentWrong = recent.filter(x => x && x.ok === false).length;
  const errorRate = stat.shown > 0 ? (stat.wrong / stat.shown) : 0;
  const learned = stat.learnedOnce || stat.streak >= 2 || (stat.shown >= 3 && stat.correct >= 2);

  if (stat.problemMasteredAt && stat.streak >= PROBLEM_CLEAR_STREAK && !hasRecentWrongAfterMastery(stat)){
    return 0;
  }

  let qualifies = false;
  if (learned && stat.relapseCount >= 1) qualifies = true;
  if (stat.shown >= 4 && stat.wrong >= 2 && errorRate >= 0.4) qualifies = true;
  if (stat.shown >= 4 && recentWrong >= 2) qualifies = true;

  if (!qualifies) return 0;

  return Math.round(
    stat.wrong * 2 +
    stat.relapseCount * 6 +
    aiBoost * 2 +
    recentWrong * 4 +
    errorRate * 10 -
    Math.min(stat.streak, 3) * 2
  );
}

function getProblemReviewKey(bankKey){
  return `quiz_problem_review_${resolveBankKey(bankKey)}_v${PROBLEM_REVIEW_VERSION}`;
}

function loadProblemReview(bankKey){
  const review = readJson(getProblemReviewKey(bankKey), null);
  if (!review || typeof review !== "object" || !Array.isArray(review.questionIds)) return null;
  review.bankKey = resolveBankKey(review.bankKey || bankKey);
  review.questionIds = review.questionIds.map(String).slice(0, PROBLEM_REVIEW_SIZE);
  review.progress = (review.progress && typeof review.progress === "object") ? review.progress : {};
  review.active = review.active !== false;
  return review;
}

function saveProblemReview(bankKey, review){
  localStorage.setItem(getProblemReviewKey(bankKey), JSON.stringify(review));
}

function clearProblemReview(bankKey){
  localStorage.removeItem(getProblemReviewKey(bankKey));
}

function getProblemCandidates(bankKey){
  const key = resolveBankKey(bankKey);
  const allStats = loadQStats();
  const bankStats = allStats[key] || {};

  return Object.entries(bankStats)
    .map(([bankN, rawStat]) => {
      const stat = normalizeQStat(rawStat);
      stat.problemScore = calcProblemScore(stat);
      return { bankN: String(bankN), stat, score: stat.problemScore };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.stat.relapseCount || 0) !== (a.stat.relapseCount || 0)) {
        return (b.stat.relapseCount || 0) - (a.stat.relapseCount || 0);
      }
      return (b.stat.wrong || 0) - (a.stat.wrong || 0);
    });
}

function ensureProblemReview(bankKey){
  const key = resolveBankKey(bankKey);
  const existing = loadProblemReview(key);
  if (existing && existing.active && existing.questionIds.length) return existing;

  const candidates = getProblemCandidates(key).slice(0, PROBLEM_REVIEW_SIZE);
  if (candidates.length < PROBLEM_REVIEW_SIZE) return null;

  const review = {
    active: true,
    bankKey: key,
    startedAt: new Date().toISOString(),
    questionIds: candidates.map(x => String(x.bankN)),
    progress: {}
  };
  review.questionIds.forEach(id => {
    review.progress[id] = { streak: 0 };
  });
  saveProblemReview(key, review);
  return review;
}

function getForcedProblemBank(bankKey = currentBankKey){
  const key = resolveBankKey(bankKey);
  const review = loadProblemReview(key);
  if (review && review.active && review.questionIds.length) return key;
  if (getProblemCandidates(key).length >= PROBLEM_REVIEW_SIZE) return key;
  return null;
}

function getProblemReviewStatus(bankKey = currentBankKey){
  const key = resolveBankKey(bankKey);
  const review = loadProblemReview(key);
  if (review && review.active && review.questionIds.length){
    const done = review.questionIds.filter(id => (review.progress?.[id]?.streak || 0) >= PROBLEM_CLEAR_STREAK).length;
    return { bankKey: key, active: true, total: review.questionIds.length, done, pending: review.questionIds.length - done };
  }
  const count = getProblemCandidates(key).length;
  return { bankKey: key, active: false, total: Math.min(count, PROBLEM_REVIEW_SIZE), done: 0, pending: Math.min(count, PROBLEM_REVIEW_SIZE) };
}

function markProblemQuestionsMastered(bankKey, questionIds){
  const key = resolveBankKey(bankKey);
  const allStats = loadQStats();
  if (!allStats[key]) allStats[key] = {};
  const now = new Date().toISOString();
  questionIds.forEach(id => {
    const stat = normalizeQStat(allStats[key][String(id)]);
    stat.problemMasteredAt = now;
    stat.relapseCount = 0;
    stat.problemScore = 0;
    allStats[key][String(id)] = stat;
  });
  saveQStats(allStats);
}

function processProblemReviewRound(bankKey, results){
  const key = resolveBankKey(bankKey);
  const review = loadProblemReview(key);
  if (!review || !review.active) return { active: false, done: true, pending: [] };

  for (const result of results){
    const id = String(result.bankN);
    if (!review.progress[id]) review.progress[id] = { streak: 0 };
    if (result.ok){
      review.progress[id].streak = (review.progress[id].streak || 0) + 1;
    } else {
      review.progress[id].streak = 0;
    }
  }

  const pending = review.questionIds
    .map(String)
    .filter(id => (review.progress?.[id]?.streak || 0) < PROBLEM_CLEAR_STREAK);

  if (pending.length === 0){
    markProblemQuestionsMastered(key, review.questionIds);
    clearProblemReview(key);
    return { active: true, done: true, pending: [] };
  }

  saveProblemReview(key, review);
  return { active: true, done: false, pending };
}

function continueProblemReviewRound(result){
  const review = loadProblemReview(activeProblemReviewBank || currentBankKey);
  if (!review) return false;

  answers.clear();
  const built = buildProblemReviewTest(review);
  if (!built) return false;

  renderTest();
  elOut.innerHTML = `
    <div class="result" tabindex="-1">Закрепление продолжается</div>
    <div class="muted">Осталось закрыть: <b>${result.pending.length}</b>. Ошибка сбрасывает серию, правильный ответ добавляет +1.</div>
  `;
  elOut.style.display = "block";
  startTimer();
  updateStartDashboard();
  return true;
}

function evaluateAnswerForItem(item, user, currentMode = mode){
  if (currentMode === "mcq"){
    return item.correctIndex !== -1 && user === item.correctIndex;
  }
  return acceptDisplayText(user ?? "", item.correctText);
}

function updateQStatsOnFinish(TEST, answers, mode, bankKey){
  if (!TEST || TEST.length === 0) {
    console.warn("updateQStatsOnFinish: TEST пустой");
    return;
  }
  
  if (!bankKey) {
    console.warn("updateQStatsOnFinish: bankKey не указан");
    return;
  }
  
  const allStats = loadQStats();
  if (!allStats[bankKey]) allStats[bankKey] = {};
  const bankStats = allStats[bankKey];
  const now = new Date().toISOString();
  
  let updatedCount = 0;
  for (const item of TEST){
    if (!item || !item.bankN) {
      console.warn("updateQStatsOnFinish: пропущен вопрос без bankN", item);
      continue;
    }
    
    const user = answers.get(item.id);
    const bankN = String(item.bankN);
    
    if (!bankStats[bankN]){
      bankStats[bankN] = createEmptyQStat();
    }
    
    const stat = normalizeQStat(bankStats[bankN]);
    const wasLearned = stat.learnedOnce || stat.streak >= 2 || (stat.shown >= 3 && stat.correct >= 2);
    const previousWasCorrect = stat.lastResult === "ok" || stat.streak > 0;
    stat.shown++;
    stat.lastSeen = now;
    
    const ok = evaluateAnswerForItem(item, user, mode);
    stat.attempts.push({ ts: now, ok });
    stat.attempts = stat.attempts.slice(-PROBLEM_ATTEMPT_LIMIT);
    
    if (ok){
      stat.correct++;
      stat.streak++;
      stat.lastResult = "ok";
      stat.lastCorrectAt = now;
      if (stat.streak >= 2 && stat.correct >= 2){
        stat.learnedOnce = true;
      }
    } else {
      stat.wrong++;
      if (wasLearned && previousWasCorrect){
        stat.relapseCount++;
      }
      stat.streak = 0;
      stat.lastResult = "bad";
    }
    stat.problemScore = calcProblemScore(stat);
    bankStats[bankN] = stat;
    updatedCount++;
  }
  
  saveQStats(allStats);
}

// ===== Сессии/история результатов =====
function getSessionsKey(bankKey){
  return `quiz_sessions_${bankKey}`;
}

function saveSession(bankKey, sessionData){
  const key = getSessionsKey(bankKey);
  let sessions = [];
  try {
    const saved = localStorage.getItem(key);
    if (saved) sessions = JSON.parse(saved);
  } catch(e){
    console.warn("Ошибка загрузки сессий:", e);
  }
  
  sessions.unshift(sessionData);
  sessions = sessions.slice(0, 50); // последние 50
  
  localStorage.setItem(key, JSON.stringify(sessions));
}

function loadSessions(bankKey){
  const key = getSessionsKey(bankKey);
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch(e){
    console.warn("Ошибка загрузки сессий:", e);
    return [];
  }
}

let isInLearningMode = false;

// ===== Рекорды hardmode =====
function getHardmodeRecordsKey(bankKey){
  return `quiz_hardmode_records_${bankKey}`;
}

function loadHardmodeRecords(bankKey){
  const key = getHardmodeRecordsKey(bankKey);
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return { bestStreakQuestions: 0, bestPercent100Plus: 0, bestTime100PlusMs: null };
    return JSON.parse(saved);
  } catch(e){
    console.warn("Ошибка загрузки рекордов hardmode:", e);
    return { bestStreakQuestions: 0, bestPercent100Plus: 0, bestTime100PlusMs: null };
  }
}

function saveHardmodeRecords(bankKey, records){
  const key = getHardmodeRecordsKey(bankKey);
  localStorage.setItem(key, JSON.stringify(records));
}

function updateHardmodeRecords(bankKey, streakQuestions, percent, questionsCount, elapsedMs, isFail){
  const records = loadHardmodeRecords(bankKey);
  
  if (streakQuestions > records.bestStreakQuestions){
    records.bestStreakQuestions = streakQuestions;
  }
  
  if (!isFail && questionsCount >= 100){
    if (percent > records.bestPercent100Plus){
      records.bestPercent100Plus = percent;
    }
    
    if (percent === 100){
      if (records.bestTime100PlusMs === null || elapsedMs < records.bestTime100PlusMs){
        records.bestTime100PlusMs = elapsedMs;
      }
    }
  }
  
  saveHardmodeRecords(bankKey, records);
}

function renderTest(){
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
  elOut.innerHTML = "";

  if (!TEST.length){
    finishBtn.disabled = true;
    learnBtn.disabled = true;
    restartBtn.disabled = true;
    return;
  }

  const frag = document.createDocumentFragment();

  // В Hardmode показываем только текущий вопрос
  const itemsToShow = hardMode ? (TEST[curIdx] ? [TEST[curIdx]] : []) : TEST;

  for (const item of itemsToShow){
    const card = document.createElement("div");
    card.className = "card";
    if (isProblemReviewMode) card.classList.add("problem-review-card");
    card.dataset.qid = item.id;
    if (hardMode) card.id = "activeQuestionCard";

    // Создаём структуру qhead с флажком
    const qhead = document.createElement("div");
    qhead.className = "qhead";

    const title = document.createElement("div");
    title.className = "qtitle";
    title.textContent = `${item.n}) ${displayText(item.q)}`;
    if (translateRu) title.title = item.q;

    const flagLabel = document.createElement("label");
    flagLabel.className = "flagToggle";
    flagLabel.title = "Отметить как сложный";

    const flagInput = document.createElement("input");
    flagInput.type = "checkbox";
    flagInput.className = "flagInput";
    flagInput.checked = hasHardQuestion(item.bankN);
    flagInput.addEventListener("change", (e) => {
      e.stopPropagation();
      if (flagInput.checked) {
        addHardQuestion(item.bankN);
      } else {
        deleteHardQuestion(item.bankN);
      }
      saveHard();
      updateHardButton();
    });

    const flagIcon = document.createElement("span");
    flagIcon.className = "flagIcon";
    flagIcon.setAttribute("aria-hidden", "true");

    const flagText = document.createElement("span");
    flagText.className = "flagText";
    flagText.textContent = "Сложный";

    flagLabel.appendChild(flagInput);
    flagLabel.appendChild(flagIcon);
    flagLabel.appendChild(flagText);

    qhead.appendChild(title);
    qhead.appendChild(flagLabel);
    card.appendChild(qhead);

    if (isProblemReviewMode){
      const review = loadProblemReview(activeProblemReviewBank || currentBankKey);
      const streak = review?.progress?.[String(item.bankN)]?.streak || 0;
      const note = document.createElement("div");
      note.className = "problem-review-note";
      note.textContent = `Закрепление: нужно ${PROBLEM_CLEAR_STREAK} правильных подряд. Сейчас: ${streak}/${PROBLEM_CLEAR_STREAK}. Ошибка сбросит серию.`;
      card.appendChild(note);
    }
    
    // Прогресс-бар для hardmode
    if (hardMode){
      const progressContainer = document.createElement("div");
      progressContainer.className = "q-progress";
      const progressBar = document.createElement("div");
      progressBar.className = "q-progress__bar";
      progressContainer.appendChild(progressBar);
      card.appendChild(progressContainer);
    }

    if (mode === "text"){
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "Введите ответ…";
      inp.value = answers.get(item.id) ?? "";
      inp.addEventListener("input", () => {
        answers.set(item.id, inp.value);
        setSkipUI(card, inp.value.trim() === "");
      });
      inp.addEventListener("keydown", (e) => {
        if (!hardMode || e.key !== "Enter") return;
        if (!inp.value.trim()) return;
        e.preventDefault();
        stopQuestionTimer();
        setTimeout(() => breakAndNext(false), 80);
      });

      card.appendChild(inp);

      const hint = document.createElement("div");
      hint.className = "muted small";
      hint.textContent = hardMode
        ? "Введите ответ и нажмите Enter. Регистр и лишние пробелы игнорируются."
        : "Проверка: без регистра, лишние пробелы игнорируются.";
      card.appendChild(hint);
    } else {
      const saved = answers.get(item.id);
      item.options.forEach((optText, i) => {
        const row = document.createElement("label");
        row.className = "choice";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "q_" + item.id;
        radio.value = String(i);
        radio.checked = (saved === i);
        radio.addEventListener("change", () => {
          answers.set(item.id, Number(radio.value));
          setSkipUI(card, false);
          if (hardMode) {
            stopQuestionTimer();
            setTimeout(() => breakAndNext(false), 100);
          }
        });


        const txt = document.createElement("div");
        txt.innerHTML = `<div><span class="kbd">${LETTERS[i]}</span> ${escapeHtml(displayText(optText))}</div>`;
        if (translateRu) row.title = optText;

        row.appendChild(radio);
        row.appendChild(txt);
        card.appendChild(row);
      });

      const hint = document.createElement("div");
      hint.className = "muted small";
      hint.textContent = "Выбери один вариант (A–E).";
      card.appendChild(hint);
    }

    frag.appendChild(card);
  }

  elQuiz.appendChild(frag);
  setupSkipHighlighter();

  const notFound = TEST.filter(t => t.correctIndex === -1).length;
  if (isProblemReviewMode){
    const status = getProblemReviewStatus(activeProblemReviewBank || currentBankKey);
    setStatusPill("Закрепление проблемных");
    setMetaText(
      `Осталось закрыть: ${status.pending}. Нужно ${PROBLEM_CLEAR_STREAK} правильных подряд по каждому вопросу.` +
      (notFound ? ` Ключ не найден: ${notFound}` : "")
    );
    finishBtn.disabled = false;
    learnBtn.disabled = true;
    restartBtn.disabled = true;
    return;
  }
  setStatusPill("Тест запущен");
  setMetaText(
    `Вопросов: ${TEST.length} (из ${ALL.length}). Режим: ${mode === "mcq" ? "A–E" : "текст"}.` +
    (notFound ? ` ⚠️ Не найден ключ для: ${notFound}` : "")
  );
  finishBtn.disabled = false;
  learnBtn.disabled = hardMode;  // недоступна в hardmode
  restartBtn.disabled = false;
}

function finish(){
  if (!TEST.length) return;

  stopQuestionTimer();
  stopHardmodeMusic();
  stopTimer();
  const elapsedMs = getElapsedMs();
  const avgMs = TEST.length ? (elapsedMs / TEST.length) : 0;
  const wasProblemReviewMode = isProblemReviewMode;

  let correct = 0;
  const wrong = [];
  
  // Получаем bankKey для статистики
  const bankKey = resolveBankKey(localStorage.getItem("quiz_bank") || DEFAULT_BANK_KEY);
  
  // Для hardmode: считаем streakQuestions (сколько вопросов подряд пройдено)
  let hardmodeStreakQuestions = 0;
  if (hardMode){
    for (const item of TEST){
      const user = answers.get(item.id);
      let ok = false;
      if (mode === "mcq"){
        ok = (item.correctIndex !== -1 && user === item.correctIndex);
      } else {
        ok = acceptDisplayText(user ?? "", item.correctText);
      }
      if (ok && user !== undefined && user !== -1){
        hardmodeStreakQuestions++;
      } else {
        break; // прерываем на первой ошибке
      }
    }
  }

  const reviewResults = [];
  for (const item of TEST){
    const user = answers.get(item.id);

    let ok = false;
    let isTimeout = false;
    if (mode === "mcq"){
      if (item.correctIndex === -1){
        ok = false; // если ключ не нашли
      } else {
        ok = (user === item.correctIndex);
      }
      // В hardmode -1 считается таймаутом
      if (hardMode && user === -1) isTimeout = true;
    } else {
      ok = acceptDisplayText(user ?? "", item.correctText);
      // В hardmode пустой ответ считается таймаутом
      if (hardMode && (!user || String(user).trim() === "")) isTimeout = true;
    }

    // Авто-логика для сложных вопросов
    const k = hardId(item.bankN);
    hardStats[k] ??= { streak: 0, wrong: 0 };
    if (ok) {
      hardStats[k].streak = (hardStats[k].streak || 0) + 1;
      if (hardStats[k].streak >= 2) {
        deleteHardQuestion(item.bankN);
      }
    } else {
      hardStats[k].streak = 0;
      hardStats[k].wrong = (hardStats[k].wrong || 0) + 1;
      addHardQuestion(item.bankN);
    }

    reviewResults.push({ bankN: String(item.bankN), ok });
    if (ok) {
      correct++;
    } else {
      const yourText = (mode === "mcq")
        ? (typeof user === "number" ? item.options[user] : "(пусто)")
        : (user || "(пусто)");

      wrong.push({
        n: item.n,
        q: item.q,
        your: displayText(yourText),
        expected: displayText(item.correctText)
      });
    }
  }

const percent = Math.floor((correct / TEST.length) * 100);
const passed = (TEST.length >= 30 && percent >= 95);

// Обновляем статистику по вопросам
updateQStatsOnFinish(TEST, answers, mode, bankKey);

if (isProblemReviewMode){
  const reviewRound = processProblemReviewRound(activeProblemReviewBank || bankKey, reviewResults);
  saveHard();
  saveHardStats();

  if (!reviewRound.done){
    coachReact("problemRound", { pending: reviewRound.pending.length, wrong: wrong.length });
    if (continueProblemReviewRound(reviewRound)) return;
  } else {
    coachReact("problemCleared");
    isProblemReviewMode = false;
    activeProblemReviewBank = null;
    updateStartDashboard();
  }
}

// === HARDMODE ACHIEVEMENT (только если 100% и тест >= 50) ===
const hardModePassed = hardMode && TEST.length >= 50 && percent === 100;
let achievedTier = 0;
if (hardModePassed) {
  achievedTier = 1;                 // 50–99  -> +
  if (TEST.length >= 266) achievedTier = 4;      // ⭐
  else if (TEST.length >= 200) achievedTier = 3;      // +++
  else if (TEST.length >= 100) achievedTier = 2; // ++

  giveHardAchievement(achievedTier, TEST.length);
}

// Сохраняем сессию
saveSession(bankKey, {
  ts: Date.now(),
  bankKey: bankKey,
  questionsCount: TEST.length,
  mode: mode,
  percent: percent,
  elapsedMs: elapsedMs,
  avgMs: avgMs,
  hardMode: hardMode,
  hardModePassed: hardModePassed
});

// Обновляем рекорды hardmode
if (hardMode){
  updateHardmodeRecords(bankKey, hardmodeStreakQuestions, percent, TEST.length, elapsedMs, false);
}

if (!wasProblemReviewMode){
  coachReact(wrong.length ? "finish" : "correct", {
    wrong: wrong.length,
    percent,
    pending: getProblemReviewStatus(bankKey).pending
  });
}

  const parts = [];
  // Add tabindex="-1" to result title for accessibility + focus
  if (hardModePassed) {
    const tierMarks = ["", "+", "++", "+++", "⭐"][achievedTier];
    parts.push(`<div class="result" id="resultTitle" tabindex="-1">🏆 <span class="ok">Хардмод пройден!</span> <span class="${percent >= 60 ? "ok" : "bad"}">${percent}%</span> · Достижение: <span class="ok">${tierMarks}</span></div>`);
    parts.push(`<div class="muted">Правильных ответов: <b>${correct}</b> из <b>${TEST.length}</b>.</div>`);
    parts.push(`<div class="muted">Время прохождения: <b>${fmt(elapsedMs)}</b> · Среднее на вопрос: <b>${fmt(avgMs)}</b></div>`);
  } else {
    parts.push(`<div class="result" id="resultTitle" tabindex="-1">Результат: <span class="${percent >= 60 ? "ok" : "bad"}">${percent}%</span></div>`);
    parts.push(`<div class="muted">Правильных ответов: <b>${correct}</b> из <b>${TEST.length}</b>.</div>`);
    parts.push(`<div class="muted">Время прохождения: <b>${fmt(elapsedMs)}</b> · Среднее на вопрос: <b>${fmt(avgMs)}</b></div>`);
  }

  // Compact errors display with collapsible details
  if (wrong.length){
    parts.push(`<div class="divider"></div>`);
    parts.push(`<details open><summary>Ошибки (${wrong.length})</summary><div class="small">` + wrong.map(w =>
      `<div style="margin:10px 0">
        <div><b>${w.n})</b> ${escapeHtml(displayText(w.q))}</div>
        <div class="bad">Твой ответ: ${escapeHtml(w.your)}</div>
        <div class="ok">Правильный ответ: ${escapeHtml(w.expected)}</div>
      </div>`
    ).join("") + `</div></details>`);
  } else {
    parts.push(`<div class="divider"></div><div class="ok"><b>Все ответы правильные</b></div>`);
  }

  elOut.innerHTML = parts.join("");
  elOut.style.display = "block";
  elQuiz.innerHTML = "";
  setStatusPill("Тест завершён");
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;
  if (abortBtn) abortBtn.disabled = true;
  setRunning(false);
  appEl.classList.add("has-output");
  
  // Сохраняем обновленные сложные вопросы и статистику
  saveHard();
  saveHardStats();
  updateHardButton();

if (passed){
  stats.tests_completed++;

  const gained = calcTestExp({ percent, questionsCount: TEST.length });
  stats.exp_tests += gained;

  saveStats();
  updateStatsUI();
}



  // Scroll to results with smooth behavior
  setTimeout(() => {
    const resultTitle = document.getElementById("resultTitle");
    if (resultTitle) {
      resultTitle.scrollIntoView({ behavior: "smooth", block: "start" });
      resultTitle.focus();
    }
  }, 100);
}

const bankSelect = document.getElementById("bankSelect");
const hardModeToggle = document.getElementById("hardModeToggle");
let hardMode = (localStorage.getItem("quiz_hardmode") === "1");

if (hardModeToggle){
  hardModeToggle.checked = hardMode;
  hardModeToggle.addEventListener("change", () => {
    hardMode = hardModeToggle.checked;
    localStorage.setItem("quiz_hardmode", hardMode ? "1" : "0");
    setBank(bankSelect.value); // перезагрузить текущий банк
  });
}

// ===== Hardmode music =====
const APP_SCRIPT_URL = document.currentScript?.src || window.location.href;
const HARDMODE_PLAYLIST = [
  "music/01.mp3",
  "music/02.mp3",
  "music/03.mp3",
  "music/04.mp3",
].map(path => new URL(path, APP_SCRIPT_URL).href);


let hmAudio = null;
let hmIndex = 0;

function ensureHmAudio(){
  if (hmAudio) return hmAudio;
  hmAudio = new Audio();
  hmAudio.preload = "auto";
  hmAudio.volume = 0.7;     // можно настроить
  hmAudio.loop = false;
  hmAudio.addEventListener("ended", () => {
    // следующий трек по кругу
    if (!HARDMODE_PLAYLIST.length) return;
    hmIndex = (hmIndex + 1) % HARDMODE_PLAYLIST.length;
    hmAudio.src = HARDMODE_PLAYLIST[hmIndex];
    hmAudio.play().catch(()=>{});
  });
  return hmAudio;
}

function startHardmodeMusic(){
  if (!hardMode) return;
  if (!HARDMODE_PLAYLIST.length) return;

  const a = ensureHmAudio();
  if (a.src && !a.paused) return; // уже играет

  // случайный трек при запуске
  hmIndex = Math.floor(Math.random() * HARDMODE_PLAYLIST.length);
  a.src = HARDMODE_PLAYLIST[hmIndex];

  // запуск возможен только после клика — у тебя это как раз "Начать"
  a.play().catch(()=>{});
}

function stopHardmodeMusic(){
  if (!hmAudio) return;
  hmAudio.pause();
  hmAudio.currentTime = 0;
}

// ===== Hardmode question timer =====
let curIdx = 0;
let qTimer = null;
let qWarnTimer = null;

function clearQuestionTimers(){
  clearTimeout(qTimer);
  clearTimeout(qWarnTimer);
  qTimer = null;
  qWarnTimer = null;
}

function startQuestionTimer(){
  clearQuestionTimers();

  const card = document.getElementById("activeQuestionCard");
  if (card){
    const progressBar = card.querySelector(".q-progress__bar");
    if (progressBar){
      progressBar.style.animation = "none";
      // Сбрасываем анимацию
      requestAnimationFrame(() => {
        progressBar.style.animation = "q-progress-fill 5s linear forwards";
      });
    }
  }

  // мигание за 1.5 сек до конца (5.0 - 1.5 = 3.5)
  qWarnTimer = setTimeout(() => {
    const card = document.getElementById("activeQuestionCard");
    if (card) {
      card.classList.add("time-low");
      // Вибрация на мобильных устройствах
      if (navigator.vibrate && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768)){
        navigator.vibrate([80, 40, 80]);
      }
    }
  }, 3500);

  qTimer = setTimeout(timeUp, 5000);
}

function stopQuestionTimer(){
  clearQuestionTimers();
  const card = document.getElementById("activeQuestionCard");
  if (card) {
    card.classList.remove("time-low");
    const progressBar = card.querySelector(".q-progress__bar");
    if (progressBar){
      progressBar.style.animation = "none";
    }
  }
}

function timeUp(){
  // не ответил -> считается неправильным
  answers.set(TEST[curIdx].id, -1); // -1 = пусто/не отвечено
  if (hardMode) {
    showHardModeFail();
  } else {
    breakAndNext(true);
  }
}

function checkHardModeAnswer(item, userAnswer){
  if (!hardMode) return true; // не хардмод - пропускаем проверку
  
  let isCorrect = false;
  if (mode === "mcq"){
    if (item.correctIndex === -1){
      isCorrect = false;
    } else {
      isCorrect = (userAnswer === item.correctIndex);
    }
  } else {
    isCorrect = acceptDisplayText(userAnswer ?? "", item.correctText);
  }
  
  return isCorrect;
}

function showHardModeFail(){
  stopQuestionTimer();
  stopHardmodeMusic();
  stopTimer();
  coachReact("hardFail", { item: TEST[curIdx] });
  
  // Сохраняем рекорды hardmode перед завершением
  const bankKey = resolveBankKey(localStorage.getItem("quiz_bank") || DEFAULT_BANK_KEY);
  let hardmodeStreakQuestions = 0;
  for (let i = 0; i < curIdx; i++){
    const item = TEST[i];
    const user = answers.get(item.id);
    let ok = false;
    if (mode === "mcq"){
      ok = (item.correctIndex !== -1 && user === item.correctIndex);
    } else {
      ok = acceptDisplayText(user ?? "", item.correctText);
    }
    if (ok && user !== undefined && user !== -1){
      hardmodeStreakQuestions++;
    } else {
      break;
    }
  }
  updateHardmodeRecords(bankKey, hardmodeStreakQuestions, 0, TEST.length, getElapsedMs(), true);
  
  const card = document.getElementById("activeQuestionCard");
  if (card) {
    card.classList.remove("time-low");
    card.classList.add("hardmode-fail");
  }
  
  // Показываем сообщение о провале
  const failOverlay = document.createElement("div");
  failOverlay.className = "hardmode-fail-overlay";
  failOverlay.innerHTML = `
    <div class="hardmode-fail-content">
      <div class="hardmode-fail-icon">❌</div>
      <div class="hardmode-fail-title">Хардмод провален</div>
      <div class="hardmode-fail-sub">Неправильный ответ</div>
    </div>
  `;
  document.body.appendChild(failOverlay);
  
  // Через 2 секунды показываем результаты
  setTimeout(() => {
    failOverlay.classList.add("show");
    setTimeout(() => {
      finish();
      failOverlay.remove();
    }, 2000);
  }, 100);
}

function breakAndNext(isTimeout){
  const card = document.getElementById("activeQuestionCard");
  if (!card){ nextQuestion(); return; }

  // В хардмоде проверяем правильность ответа
  if (hardMode && !isTimeout) {
    const currentItem = TEST[curIdx];
    const userAnswer = answers.get(currentItem.id);
    const isCorrect = checkHardModeAnswer(currentItem, userAnswer);
    
    if (!isCorrect) {
      showHardModeFail();
      return; // останавливаем тест
    }
  }

  // убираем мигание перед анимацией улета
  card.classList.remove("time-low");
  card.classList.add("breakOut");
  card.addEventListener("animationend", nextQuestion, { once:true });
}

function nextQuestion(){
  curIdx++;
  if (curIdx >= TEST.length){
    stopQuestionTimer();
    finish();
    return;
  }
  renderTest();
  startQuestionTimer();
}

function giveHardAchievement(tier, questionsCount){
  const key = "hard_achv_tier";
  const prev = Number(localStorage.getItem(key) || 0);

  // сохраняем только если уровень выше предыдущего
  if (tier > prev) localStorage.setItem(key, String(tier));

  showAchievementToast(tier, questionsCount);
  updateAchievementDisplay();
}

function showAchievementToast(tier, questionsCount){
  const marks = ["", "+", "++", "+++", "⭐"][tier];
  const el = document.createElement("div");
  el.className = "achv-toast";
  el.innerHTML = `
    <div class="achv-badge">${marks}</div>
    <div class="achv-text">
      <div class="achv-title">Достижение ${marks}</div>
      <div class="achv-sub">Hardmode: 100% · Вопросов: ${questionsCount}</div>
    </div>
  `;

  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));

  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 400);
  }, 4500);
}
function resolveBankKey(selectedName){
  return window.QUIZ_BANKS[selectedName] ? selectedName : DEFAULT_BANK_KEY;
}

function getBankLabel(bankKey){
  return BANK_LABELS[resolveBankKey(bankKey)] || bankKey;
}

function getBankItems(key){
  const resolvedKey = resolveBankKey(key);
  const bank = window.QUIZ_BANKS[resolvedKey];
  if (!bank) {
    alert("Банк не найден: " + resolvedKey);
    return null;
  }

  return parseBank(bank.raw, bank.answers);
}

function getQuestionMapForBank(bankKey){
  const items = getBankItems(resolveBankKey(bankKey));
  return new Map((items || []).map(x => [x.n, x.q]));
}

function setBank(name) {
  const key = resolveBankKey(name);
  const items = getBankItems(key);
  if (!items) return;

  currentBankKey = key;
  RAW_BANK = "";
  ANSWER_TEXT = [];
  ALL = items;
  loadHardState(currentBankKey);

  // Обновляем максимальное количество вопросов в зависимости от банка
  const maxSize = BANK_MAX_SIZES[key] || ALL.length || 10;
  if (maxTestSizeDisplay) maxTestSizeDisplay.textContent = maxSize;

  // Отключаем опции которые больше максимума
  Array.from(testSizeSelect.options).forEach(option => {
    const val = parseInt(option.value, 10);
    option.disabled = (val > maxSize);
  });

  const enabledSizes = Array.from(testSizeSelect.options)
    .map(option => parseInt(option.value, 10))
    .filter(value => value <= maxSize);
  if (!enabledSizes.includes(TEST_SIZE)){
    TEST_SIZE = enabledSizes.filter(value => value <= TEST_SIZE).pop() || enabledSizes[0] || 10;
    localStorage.setItem("quiz_test_size", String(TEST_SIZE));
  }
  testSizeSelect.value = String(TEST_SIZE);
  testSizeDisplay.textContent = TEST_SIZE;

  // Сохраняем выбор
  localStorage.setItem("quiz_bank", name);

  // Полностью сбрасываем состояние текущего теста
  TEST = [];
  answers.clear();
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
  appEl.classList.remove("has-output");
  setRunning(false);
  
  // Сбрасываем таймер и музыку
  stopTimer();
  stopHardmodeMusic();
  startTs = 0;

  // Сбрасываем UI кнопок
  startBtn.disabled = false;
  restartBtn.disabled = true;
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  if (abortBtn) abortBtn.disabled = true;
  updateHardButton();

  // Сбрасываем информационные поля
  setStatusPill("Тест не запущен");
  setMetaText("");

  // Только подготовить тест, не отрисовывать (отрисовка только после "Начать")
  buildTest();
}

const saved = resolveBankKey(localStorage.getItem("quiz_bank") || DEFAULT_BANK_KEY);
const initialBank = saved;
bankSelect.value = initialBank;
setBank(initialBank);
renderCoachPanel(coachState?.lastMessage || "Генерал на связи. Работаем спокойно и точно.");

updateCoachToggleUI();

if (coachToggle){
  coachToggle.checked = aiCoachEnabled;
  coachToggle.addEventListener("change", () => {
    aiCoachEnabled = coachToggle.checked;
    localStorage.setItem(AI_COACH_ENABLED_KEY, aiCoachEnabled ? "1" : "0");
    updateCoachToggleUI();
    if (aiCoachEnabled){
      if (!coachState) coachState = loadCoachState();
      renderCoachPanel(coachState?.lastMessage || "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043d\u0430 \u0441\u0432\u044f\u0437\u0438. \u0420\u0430\u0431\u043e\u0442\u0430\u0435\u043c \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u043e \u0438 \u0442\u043e\u0447\u043d\u043e.");
    } else {
      document.getElementById("generalCommandDialog")?.classList.remove("is-visible");
      document.body.classList.remove("general-command-open");
    }
  });
}

bankSelect.addEventListener("change", () => {
  setBank(bankSelect.value);
});

document.querySelectorAll("[data-bank-tile]").forEach(tile => {
  tile.addEventListener("click", () => {
    const key = tile.dataset.bankTile;
    if (!key || bankSelect.value === key) return;
    bankSelect.value = key;
    setBank(key);
  });
});

/** ========= UI ========= */
modeSelect.addEventListener("change", () => {
  mode = modeSelect.value;
  localStorage.setItem("quiz_mode", mode);
  updateStartDashboard();
  if (startBtn.disabled && TEST.length && !isInLearningMode) {
    renderTest();
  }
});

testSizeSelect.addEventListener("change", () => {
  TEST_SIZE = parseInt(testSizeSelect.value, 10);
  localStorage.setItem("quiz_test_size", String(TEST_SIZE));
  testSizeDisplay.textContent = TEST_SIZE;
  updateStartDashboard();
});

updateTranslationUI();
if (translateBtn){
  translateBtn.addEventListener("click", () => {
    translateRu = !translateRu;
    localStorage.setItem("quiz_translate_ru", translateRu ? "1" : "0");
    updateTranslationUI();
    updateStartDashboard();

    if (isInLearningMode && TEST.length){
      showAnswers();
    } else if (TEST.length && startBtn.disabled){
      renderTest();
    }
  });
}

let lastStartWasHardOnly = false;

function startQuiz({ hardOnly = false } = {}){
  const forcedProblemBank = getForcedProblemBank();
  let built = false;

  if (forcedProblemBank){
    if (currentBankKey !== forcedProblemBank){
      if (bankSelect) bankSelect.value = forcedProblemBank;
      setBank(forcedProblemBank);
    }

    const review = ensureProblemReview(forcedProblemBank);
    if (!review) return;

    isProblemReviewMode = true;
    activeProblemReviewBank = forcedProblemBank;
    hardOnly = false;
    hardMode = false;
    if (hardModeToggle) hardModeToggle.checked = false;
    localStorage.setItem("quiz_hardmode", "0");
    built = buildProblemReviewTest(review);
  } else {
    isProblemReviewMode = false;
    activeProblemReviewBank = null;
    built = hardOnly ? buildTestHard() : buildTest();
  }

  if (built === false) return;

  appEl.classList.remove("has-output");
  lastStartWasHardOnly = hardOnly;
  curIdx = 0;
  isInLearningMode = false;
  backBtn.disabled = true;
  setRunning(true);
  renderTest();
  startTimer();
  coachReact(isProblemReviewMode ? "problemStart" : "start", {
    pending: getProblemReviewStatus(activeProblemReviewBank || currentBankKey).pending
  });
  startBtn.disabled = true;
  learnBtn.disabled = hardMode;  // недоступна в hardmode
  restartBtn.disabled = true;
  if (abortBtn) abortBtn.disabled = false;
  updateHardButton();

  if (hardMode) {
    startQuestionTimer();
    startHardmodeMusic();
  } else {
    stopHardmodeMusic();
  }
}

startBtn.addEventListener("click", () => {
  startQuiz();
});

if (quickStartBtn){
  quickStartBtn.addEventListener("click", () => startQuiz());
}

if (quickHardBtn){
  quickHardBtn.addEventListener("click", () => startQuiz({ hardOnly: true }));
}

restartBtn.addEventListener("click", () => {
  startQuiz({ hardOnly: lastStartWasHardOnly && hardQuestions.size > 0 });
});

function abortTest(){
  stopQuestionTimer();
  stopHardmodeMusic();
  stopTimer();

  TEST = [];
  answers.clear();
  curIdx = 0;
  isProblemReviewMode = false;
  activeProblemReviewBank = null;
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
  elOut.innerHTML = "";
  appEl.classList.remove("has-output");

  setStatusPill("Тест прерван");
  setMetaText("");

  startBtn.disabled = false;
  restartBtn.disabled = true;
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  if (abortBtn) abortBtn.disabled = true;
  updateHardButton();

  setRunning(false);
}

if (abortBtn){
  abortBtn.addEventListener("click", () => {
    if (confirm("Прервать тест и выйти? Результат не сохранится.")){
      abortTest();
    }
  });
}

finishBtn.addEventListener("click", () => {
  const idx = findFirstUnanswered();
  if (idx !== -1){
    coachReact("unanswered", { pending: TEST.length - idx, item: TEST[idx] });
    // не даём завершить
    scrollToQuestion(idx);
    showFinishBlockedModal(idx); // добавим ниже
    return;
  }
  finish();
});

clearFlagsBtn.addEventListener("click", clearAllFlags);

function showAnswers(){
  isInLearningMode = true;
  elQuiz.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const item of TEST){
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "qtitle";
    title.textContent = `${item.n}) ${displayText(item.q)}`;
    if (translateRu) title.title = item.q;
    card.appendChild(title);

    if (mode === "text"){
      const correctDiv = document.createElement("div");
      correctDiv.className = "ok";
      correctDiv.textContent = "✓ Ответ: " + item.correctText;
      if (translateRu){
        correctDiv.textContent = "\u2713 \u041e\u0442\u0432\u0435\u0442: " + displayText(item.correctText);
        correctDiv.title = item.correctText;
      }
      card.appendChild(correctDiv);
    } else {
      const options = item.options;
      options.forEach((optText, i) => {
        const row = document.createElement("div");
        row.className = "choice";
        if (i === item.correctIndex) row.style.background = "#0d2a1a";

        const label = document.createElement("div");
        label.style.width = "100%";
        const isCorrect = (i === item.correctIndex);
        const color = isCorrect ? "color: #6ee7a8; font-weight: bold;" : "";
        label.innerHTML = `<span class="kbd" style="${color}">${LETTERS[i]}</span> <span style="${color}">${escapeHtml(displayText(optText))}</span>`;
        if (translateRu) row.title = optText;

        row.appendChild(label);
        card.appendChild(row);
      });
    }

    frag.appendChild(card);
  }

  elQuiz.appendChild(frag);
  setStatusPill("Режим обучения");
  setMetaText(`Вопросов: ${TEST.length} (из ${ALL.length}). Показаны правильные ответы.`);
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  backBtn.disabled = false;
  restartBtn.disabled = true;
  if (abortBtn) abortBtn.disabled = true;
}

learnBtn.addEventListener("click", showAnswers);

function backToTest(){
  isInLearningMode = false;
  renderTest();
  setStatusPill("Тест запущен");
  setMetaText(`Вопросов: ${TEST.length} (из ${ALL.length}). Режим: ${mode === "mcq" ? "A–E" : "текст"}.`);
  finishBtn.disabled = false;
  learnBtn.disabled = hardMode;
  backBtn.disabled = true;
  restartBtn.disabled = false;
  if (abortBtn) abortBtn.disabled = false;
}

backBtn.addEventListener("click", backToTest);

hardBtn.addEventListener("click", () => {
  startQuiz({ hardOnly: true });
});

const TIME_EXP_EVERY_SECONDS = 600; // 10 минут
const TIME_EXP_AMOUNT = 1;          // +1 EXP


// Элементы UI статистики
const siteTimeDisplay = document.getElementById("siteTimeDisplay");
const expDisplay = document.getElementById("expDisplay");
const rankDisplay = document.getElementById("rankDisplay");
const testsCompletedDisplay = document.getElementById("testsCompletedDisplay");

let stats = {
  time_seconds: 0,
  exp_time: 0,        // EXP за время (≈1%)
  exp_tests: 0,       // EXP за тесты (≈99%)
  tests_completed: 0
};


// Состояние таймера пребывания
let presenceTimerId = null;
let isTabVisible = true;
const ACTIVE_IDLE_LIMIT_MS = 60000;
let lastUserActivityAt = 0;

function loadStats(){
  const saved = localStorage.getItem("quiz_stats");
  if (!saved) return;

  try{
    const parsed = JSON.parse(saved);

    stats.time_seconds = parseInt(parsed.time_seconds || "0", 10);
    stats.tests_completed = parseInt(parsed.tests_completed || "0", 10);

    // новые поля
    const hasNew = ("exp_time" in parsed) || ("exp_tests" in parsed);
    stats.exp_time  = parseInt(parsed.exp_time  || "0", 10);
    stats.exp_tests = parseInt(parsed.exp_tests || "0", 10);

    // миграция со старого exp
    if (!hasNew && ("exp" in parsed)) {
      const oldExp = parseInt(parsed.exp || "0", 10);
      stats.exp_tests = oldExp; // переносим в exp за тесты
      stats.exp_time = 0;
    }

  } catch(e){
    console.warn("Ошибка загрузки статистики:", e);
  }
}


// Сохранение статистики в localStorage
function saveStats(){
localStorage.setItem("quiz_stats", JSON.stringify({
  time_seconds: stats.time_seconds,
  exp_time: stats.exp_time,
  exp_tests: stats.exp_tests,
  tests_completed: stats.tests_completed
}));

}

// Вычисление звания на основе EXP
function calcRank(exp){
  if (exp >= 300) return "Мастер";
  if (exp >= 100) return "Ученик";
  return "Новичок";
}

// Обновление UI статистики
function updateStatsUI(){
  // Форматирование времени: X мин Y сек
  const totalSeconds = stats.time_seconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (siteTimeDisplay){
    siteTimeDisplay.textContent = `${minutes} мин ${seconds} сек`;
  }

const totalExp = (stats.exp_time || 0) + (stats.exp_tests || 0);

if (expDisplay){
  expDisplay.textContent = String(totalExp);
}

const rank = calcRank(totalExp);
if (rankDisplay){
  rankDisplay.textContent = rank;
}

if (dashExp){
  dashExp.textContent = String(totalExp);
}
if (dashRankMini){
  dashRankMini.textContent = rank;
}
if (dashTime){
  dashTime.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

  // Пройдено тестов
  if (testsCompletedDisplay){
    testsCompletedDisplay.textContent = String(stats.tests_completed);
  }
  if (dashTests){
    dashTests.textContent = String(stats.tests_completed);
  }
}

// Обновление отображения достижений в навбаре (только текст +/++/+++ с градиентом)
function updateAchievementDisplay(){
  const pill = document.getElementById("achievementPill");
  const display = document.getElementById("achievementDisplay");
  const cup = document.getElementById("achievementCup");
  if (!pill || !display || !cup) return;

  const tier = Number(localStorage.getItem("hard_achv_tier") || 0);
  if (!tier){
    pill.style.display = "none";
    return;
  }

  pill.style.display = "inline-flex";

  const marks = ["", "+", "++", "+++", "⭐"][tier];

  display.textContent = marks;
  display.classList.remove("tier-1","tier-2","tier-3","tier-4");
  display.classList.add(`tier-${tier}`);

  cup.classList.remove("tier-1","tier-2","tier-3","tier-4");
  cup.classList.add(`tier-${tier}`);
}

function tickPresenceTimer(){
  if (!isTabVisible) return;
  if (!lastUserActivityAt) return;
  if (Date.now() - lastUserActivityAt > ACTIVE_IDLE_LIMIT_MS) return;

  const before = stats.time_seconds;
  stats.time_seconds += 1;

  // каждые 10 минут активного времени: +1 exp_time
  const beforeTicks = Math.floor(before / TIME_EXP_EVERY_SECONDS);
  const afterTicks  = Math.floor(stats.time_seconds / TIME_EXP_EVERY_SECONDS);

  if (afterTicks > beforeTicks){
    const gained = (afterTicks - beforeTicks) * TIME_EXP_AMOUNT;
    stats.exp_time += gained;
  }

  saveStats();
  updateStatsUI();
  submitLeaderboardScore({
    percent,
    questionsCount: TEST.length,
    elapsedMs,
    mode,
    hardMode,
    exp: gained,
  });
}

function markUserActivity(){
  if (document.hidden) return;
  lastUserActivityAt = Date.now();
}

function setupActivityTracking(){
  ["pointerdown", "keydown", "input", "change", "wheel", "touchstart"].forEach(eventName => {
    document.addEventListener(eventName, markUserActivity, { passive: true });
  });
}

function calcTestExp({ percent, questionsCount }){
  // ты можешь изменить формулу как хочешь
  // базово: чем больше вопросов, тем больше EXP
  // и доп. бонус за 100%
  let exp = questionsCount * 2; // 30 -> 60
  if (percent === 100) exp += 20;
  return exp;
}


// Запуск таймера пребывания
function startPresenceTimer(){
  if (presenceTimerId) return; // уже запущен
  
  isTabVisible = !document.hidden;
  
  // Запускаем интервал - каждую секунду
  presenceTimerId = setInterval(() => {
    tickPresenceTimer();
  }, 1000);
  
  // Первое обновление сразу
  updateStatsUI();
}

// Остановка таймера пребывания (при скрытии вкладки)
function pausePresenceTimer(){
  if (!presenceTimerId) return; // не запущен
  
  isTabVisible = false;
  saveStats(); // сохраняем текущее состояние
}

// Продолжение таймера пребывания (при возвращении на вкладку)
function resumePresenceTimer(){
  if (!presenceTimerId) return; // не был запущен
  
  isTabVisible = true;
  updateStatsUI();
}

// Обработчик изменения видимости вкладки
document.addEventListener("visibilitychange", () => {
  if (document.hidden){
    pausePresenceTimer();
  } else {
    resumePresenceTimer();
  }
});

// ===== Функции аналитики =====
function openAnalyticsModal(){
  const modal = document.getElementById("analyticsModal");
  if (!modal) return;
  renderAnalytics();
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeAnalyticsModal(){
  const modal = document.getElementById("analyticsModal");
  if (!modal) return;
  modal.style.display = "none";
  document.body.style.overflow = "";
}

function renderAnalytics(){
  const currentBankKey = resolveBankKey(localStorage.getItem("quiz_bank") || DEFAULT_BANK_KEY);
  const allStats = loadQStats();
  const sessions = loadSessions(currentBankKey);
  const records = loadHardmodeRecords(currentBankKey);

  const analyticsContent = document.getElementById("analyticsContent");
  if (!analyticsContent) return;
  
  // Создаём map вопросов из текущего банка
  const questionMap = getQuestionMapForBank(currentBankKey);
  
  const parts = [];
  
  // Фильтры
  parts.push(`<div class="analytics-filters">`);
  parts.push(`<div class="analytics-filters__row">`);
  parts.push(`<label class="analytics-filter"><span>Банк:</span><select id="analyticsBankSelect" class="analytics-filter__input">`);
  parts.push(`<option value="${DEFAULT_BANK_KEY}" selected>${getBankLabel(DEFAULT_BANK_KEY)}</option>`);
  parts.push(`</select></label>`);
  
  parts.push(`<label class="analytics-filter"><span>Мин. показов:</span><input type="number" id="analyticsMinShown" class="analytics-filter__input" value="3" min="1"></label>`);
  
  parts.push(`<label class="analytics-filter"><span>Сортировка:</span><select id="analyticsSort" class="analytics-filter__input">`);
  parts.push(`<option value="wrong">По ошибкам (wrong desc)</option>`);
  parts.push(`<option value="errorRate">По % ошибок (errorRate desc)</option>`);
  parts.push(`<option value="score" selected>По проблемности (score desc)</option>`);
  parts.push(`</select></label>`);
  parts.push(`</div>`);
  
  parts.push(`<label class="analytics-filter-checkbox"><input type="checkbox" id="analyticsFilterMin"><span>Показывать только shown >= min</span></label>`);
  parts.push(`</div>`);
  
  // Получаем статистику выбранного банка
  const selectedBankKey = currentBankKey; // будет обновляться через обработчик
  const bankStats = allStats[selectedBankKey] || {};
  
  // Подготавливаем данные
  const problemQuestions = [];
  for (const [bankN, stat] of Object.entries(bankStats)){
    if (stat.shown === 0) continue;
    const bankNNum = parseInt(bankN, 10);
    const errorRate = stat.shown > 0 ? (stat.wrong / stat.shown) : 0;
    const score = stat.wrong * 2 + (stat.shown - stat.correct);
    const questionText = questionMap.get(bankNNum) || "(вопрос не найден)";
    
    problemQuestions.push({
      bankN: bankNNum,
      questionText,
      ...stat,
      errorRate,
      score
    });
  }
  
  // Применяем фильтры и сортировку (при первом рендере используем значения по умолчанию)
  const minShown = 3;
  const sortBy = "score";
  const filterMin = false; // по умолчанию фильтр выключен, чтобы видеть все данные
  
  let filtered = problemQuestions.filter(q => !filterMin || q.shown >= minShown);
  
  filtered.sort((a, b) => {
    if (sortBy === "wrong"){
      if (a.wrong !== b.wrong) return b.wrong - a.wrong;
      return b.shown - a.shown;
    } else if (sortBy === "errorRate"){
      if (Math.abs(a.errorRate - b.errorRate) > 0.001) return b.errorRate - a.errorRate;
      if (a.wrong !== b.wrong) return b.wrong - a.wrong;
      return b.shown - a.shown;
    } else { // score
      if (a.score !== b.score) return b.score - a.score;
      if (a.wrong !== b.wrong) return b.wrong - a.wrong;
      return b.shown - a.shown;
    }
  });
  
  const top20 = filtered.slice(0, 20);
  
  // Пояснение
  parts.push(`<div class="analytics-info muted small">Показаны вопросы с shown >= ${minShown}, иначе статистика нерелевантна.</div>`);
  
  // Таблица
  if (top20.length === 0){
    parts.push(`<div class="muted small" style="margin:20px 0; text-align:center;">Нет данных. Пройдите тест, чтобы увидеть статистику.</div>`);
  } else {
    parts.push(`<table class="analytics-table"><thead><tr><th>№</th><th>Вопрос</th><th>Показан</th><th>Правильно</th><th>Ошибок</th><th>% ошибок</th><th>Серия</th><th>Последний раз</th><th>Результат</th></tr></thead><tbody>`);
    top20.forEach(q => {
      const errorRatePct = q.shown > 0 ? Math.round((q.wrong / q.shown) * 100) : 0;
      const lastSeenDate = q.lastSeen ? new Date(q.lastSeen) : null;
      const lastSeenStr = lastSeenDate ? lastSeenDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
      const lastResultIcon = q.lastResult === "ok" ? "✅" : q.lastResult === "bad" ? "❌" : "—";
      const questionShort = q.questionText.length > 100 ? q.questionText.substring(0, 100) + "..." : q.questionText;
      const isLowSample = q.shown < minShown;
      const rowClass = isLowSample ? "analytics-row-low-sample" : "";
      
      parts.push(`<tr class="analytics-table-row ${rowClass}" data-bank-n="${q.bankN}" title="Клик для копирования номера вопроса">`);
      parts.push(`<td>${q.bankN}</td>`);
      parts.push(`<td class="analytics-question-cell" title="${escapeHtml(q.questionText)}">${escapeHtml(questionShort)}</td>`);
      parts.push(`<td>${q.shown}</td>`);
      parts.push(`<td>${q.correct}</td>`);
      parts.push(`<td>${q.wrong}</td>`);
      parts.push(`<td>${errorRatePct}%</td>`);
      parts.push(`<td>${q.streak}</td>`);
      parts.push(`<td>${lastSeenStr}</td>`);
      parts.push(`<td>${lastResultIcon}</td>`);
      parts.push(`</tr>`);
    });
    parts.push(`</tbody></table>`);
  }
  
  // Кнопка сброса статистики
  parts.push(`<div style="margin-top:20px;">`);
  parts.push(`<button id="resetAnalyticsBtn" class="secondary" style="width:100%; font-size:12px;">Сбросить статистику выбранного банка</button>`);
  parts.push(`</div>`);
  
  // История сессий
  parts.push(`<div id="analyticsSessionsSection" style="margin-top:32px; padding-top:24px; border-top:2px solid var(--stroke2);">`);
  parts.push(`<div style="margin-bottom:16px;"><strong style="font-size:15px;">История сессий</strong></div>`);
  
  if (sessions.length === 0){
    parts.push(`<div class="muted small" style="margin:20px 0; text-align:center;">Нет данных. Пройдите тест, чтобы увидеть историю.</div>`);
  } else {
    const recentSessions = sessions.slice(0, 10);
    parts.push(`<table class="analytics-table"><thead><tr><th>Дата</th><th>Банк</th><th>Режим</th><th>%</th><th>Вопросов</th><th>Время</th><th>Hardmode</th></tr></thead><tbody>`);
    recentSessions.forEach(s => {
      const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const elapsedTime = fmt(s.elapsedMs);
      const modeText = s.mode === "mcq" ? "A–E" : "Текст";
      const bankName = getBankLabel(s.bankKey);
      const hardmodeMark = s.hardMode ? "⚡" : "—";
      const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
      parts.push(`<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`);
    });
    parts.push(`</tbody></table>`);
    
    if (sessions.length > 10){
      parts.push(`<details style="margin-top:12px;"><summary class="muted small" style="cursor:pointer; padding:8px;">Показать все ${sessions.length} сессий</summary>`);
      parts.push(`<table class="analytics-table" style="margin-top:8px;"><thead><tr><th>Дата</th><th>Банк</th><th>Режим</th><th>%</th><th>Вопросов</th><th>Время</th><th>Hardmode</th></tr></thead><tbody>`);
      sessions.slice(10).forEach(s => {
        const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
        const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const elapsedTime = fmt(s.elapsedMs);
        const modeText = s.mode === "mcq" ? "A–E" : "Текст";
        const bankName = getBankLabel(s.bankKey);
        const hardmodeMark = s.hardMode ? "⚡" : "—";
        const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
        parts.push(`<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`);
      });
      parts.push(`</tbody></table></details>`);
    }
    
    parts.push(`<button id="clearSessionsBtn" class="secondary" style="width:100%; margin-top:12px; font-size:12px;">Очистить историю сессий</button>`);
  }
  
  parts.push(`</div>`);
  
  analyticsContent.innerHTML = parts.join("");
  
  // Обработчики фильтров
  const bankSelect = document.getElementById("analyticsBankSelect");
  const minShownInput = document.getElementById("analyticsMinShown");
  const sortSelect = document.getElementById("analyticsSort");
  const filterMinCheckbox = document.getElementById("analyticsFilterMin");
  
  // Обработчик кнопки очистки истории сессий (при первоначальном рендере)
  const clearSessionsBtnInitial = document.getElementById("clearSessionsBtn");
  if (clearSessionsBtnInitial){
    clearSessionsBtnInitial.onclick = () => {
      const bankKey = bankSelect ? bankSelect.value : currentBankKey;
      const bankName = bankSelect ? bankSelect.options[bankSelect.selectedIndex].text : currentBankKey;
      const confirmed = confirm(`Очистить историю сессий для банка "${bankName}"? Это действие нельзя отменить.`);
      if (confirmed){
        localStorage.setItem(getSessionsKey(bankKey), JSON.stringify([]));
        renderAnalytics(); // перерисовываем всю аналитику
      }
    };
  }
  
  function updateSessions(bankKey){
    const sessions = loadSessions(bankKey);
    const sessionsSection = document.getElementById("analyticsSessionsSection");
    if (!sessionsSection) return;
    
    let sessionsHtml = `<div style="margin-bottom:16px;"><strong style="font-size:15px;">История сессий</strong></div>`;
    
    if (sessions.length === 0){
      sessionsHtml += `<div class="muted small" style="margin:20px 0; text-align:center;">Нет данных. Пройдите тест, чтобы увидеть историю.</div>`;
    } else {
      const recentSessions = sessions.slice(0, 10);
      sessionsHtml += `<table class="analytics-table"><thead><tr><th>Дата</th><th>Банк</th><th>Режим</th><th>%</th><th>Вопросов</th><th>Время</th><th>Hardmode</th></tr></thead><tbody>`;
      recentSessions.forEach(s => {
        const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
        const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const elapsedTime = fmt(s.elapsedMs);
        const modeText = s.mode === "mcq" ? "A–E" : "Текст";
        const bankName = getBankLabel(s.bankKey);
        const hardmodeMark = s.hardMode ? "⚡" : "—";
        const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
        sessionsHtml += `<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`;
      });
      sessionsHtml += `</tbody></table>`;
      
      if (sessions.length > 10){
        sessionsHtml += `<details style="margin-top:12px;"><summary class="muted small" style="cursor:pointer; padding:8px;">Показать все ${sessions.length} сессий</summary>`;
        sessionsHtml += `<table class="analytics-table" style="margin-top:8px;"><thead><tr><th>Дата</th><th>Банк</th><th>Режим</th><th>%</th><th>Вопросов</th><th>Время</th><th>Hardmode</th></tr></thead><tbody>`;
        sessions.slice(10).forEach(s => {
          const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
          const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
          const elapsedTime = fmt(s.elapsedMs);
          const modeText = s.mode === "mcq" ? "A–E" : "Текст";
          const bankName = getBankLabel(s.bankKey);
          const hardmodeMark = s.hardMode ? "⚡" : "—";
          const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
          sessionsHtml += `<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`;
        });
        sessionsHtml += `</tbody></table></details>`;
      }
      
      sessionsHtml += `<button id="clearSessionsBtn" class="secondary" style="width:100%; margin-top:12px; font-size:12px;">Очистить историю сессий</button>`;
    }
    
    sessionsSection.innerHTML = sessionsHtml;
    
    // Обновляем обработчик кнопки очистки
    const clearSessionsBtn = document.getElementById("clearSessionsBtn");
    if (clearSessionsBtn){
      clearSessionsBtn.onclick = () => {
        const bankSelectEl = document.getElementById("analyticsBankSelect");
        const currentBankKeyForClear = bankSelectEl ? bankSelectEl.value : bankKey;
        const bankName = bankSelectEl ? bankSelectEl.options[bankSelectEl.selectedIndex].text : bankKey;
        const confirmed = confirm(`Очистить историю сессий для банка "${bankName}"? Это действие нельзя отменить.`);
        if (confirmed){
          localStorage.setItem(getSessionsKey(currentBankKeyForClear), JSON.stringify([]));
          updateSessions(currentBankKeyForClear);
        }
      };
    }
  }
  
  function updateTable(){
    const bankKey = bankSelect.value;
    const min = parseInt(minShownInput.value, 10) || 3;
    const sort = sortSelect.value;
    const filter = filterMinCheckbox.checked;
    
    const currentAllStats = loadQStats();
    const stats = currentAllStats[bankKey] || {};
    const qMap = getQuestionMapForBank(bankKey);
    
    // Обновляем историю сессий при смене банка
    updateSessions(bankKey);
    
    const questions = [];
    for (const [bankN, stat] of Object.entries(stats)){
      if (stat.shown === 0) continue;
      const bankNNum = parseInt(bankN, 10);
      const errorRate = stat.shown > 0 ? (stat.wrong / stat.shown) : 0;
      const score = stat.wrong * 2 + (stat.shown - stat.correct);
      const questionText = qMap.get(bankNNum) || "(вопрос не найден)";
      
      questions.push({
        bankN: bankNNum,
        questionText,
        ...stat,
        errorRate,
        score
      });
    }
    
    let filtered = questions.filter(q => !filter || q.shown >= min);
    
    filtered.sort((a, b) => {
      if (sort === "wrong"){
        if (a.wrong !== b.wrong) return b.wrong - a.wrong;
        return b.shown - a.shown;
      } else if (sort === "errorRate"){
        if (Math.abs(a.errorRate - b.errorRate) > 0.001) return b.errorRate - a.errorRate;
        if (a.wrong !== b.wrong) return b.wrong - a.wrong;
        return b.shown - a.shown;
      } else {
        if (a.score !== b.score) return b.score - a.score;
        if (a.wrong !== b.wrong) return b.wrong - a.wrong;
        return b.shown - a.shown;
      }
    });
    
    const top20 = filtered.slice(0, 20);
    const tbody = analyticsContent.querySelector("tbody");
    const infoEl = analyticsContent.querySelector(".analytics-info");
    
    // Обновляем пояснение
    if (infoEl) infoEl.textContent = `Показаны вопросы с shown >= ${min}, иначе статистика нерелевантна.`;
    
    if (!tbody) return;
    
    if (top20.length === 0){
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;" class="muted small">Нет данных</td></tr>`;
      return;
    }
    
    // Обновляем таблицу
    tbody.innerHTML = top20.map(q => {
      const errorRatePct = q.shown > 0 ? Math.round((q.wrong / q.shown) * 100) : 0;
      const lastSeenDate = q.lastSeen ? new Date(q.lastSeen) : null;
      const lastSeenStr = lastSeenDate ? lastSeenDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
      const lastResultIcon = q.lastResult === "ok" ? "✅" : q.lastResult === "bad" ? "❌" : "—";
      const questionShort = q.questionText.length > 100 ? q.questionText.substring(0, 100) + "..." : q.questionText;
      const isLowSample = q.shown < min;
      const rowClass = isLowSample ? "analytics-row-low-sample" : "";
      
      return `<tr class="analytics-table-row ${rowClass}" data-bank-n="${q.bankN}" title="Клик для копирования номера вопроса">
        <td>${q.bankN}</td>
        <td class="analytics-question-cell" title="${escapeHtml(q.questionText)}">${escapeHtml(questionShort)}</td>
        <td>${q.shown}</td>
        <td>${q.correct}</td>
        <td>${q.wrong}</td>
        <td>${errorRatePct}%</td>
        <td>${q.streak}</td>
        <td>${lastSeenStr}</td>
        <td>${lastResultIcon}</td>
      </tr>`;
    }).join("");
    
    // Добавляем обработчики клика на строки
    tbody.querySelectorAll(".analytics-table-row").forEach(row => {
      row.addEventListener("click", () => {
        const bankN = row.dataset.bankN;
        navigator.clipboard?.writeText(bankN).then(() => {
          // Можно добавить toast уведомление
        }).catch(() => {});
      });
    });
  }
  
  if (bankSelect) bankSelect.addEventListener("change", () => {
    updateTable();
    updateSessions(bankSelect.value);
  });
  if (minShownInput) minShownInput.addEventListener("input", updateTable);
  if (sortSelect) sortSelect.addEventListener("change", updateTable);
  if (filterMinCheckbox) filterMinCheckbox.addEventListener("change", updateTable);
  
  // Обработчик кнопки сброса
  const resetBtn = document.getElementById("resetAnalyticsBtn");
  if (resetBtn){
    resetBtn.onclick = () => {
      const bankKey = bankSelect.value;
      const bankName = bankSelect.options[bankSelect.selectedIndex].text;
      const confirmed = confirm(`Сбросить статистику для банка "${bankName}"? Это действие нельзя отменить.`);
      if (confirmed){
        const currentAllStats = loadQStats();
        delete currentAllStats[bankKey];
        saveQStats(currentAllStats);
        renderAnalytics();
      }
    };
  }
  
  
  // Добавляем обработчики клика на строки
  setTimeout(() => {
    analyticsContent.querySelectorAll(".analytics-table-row").forEach(row => {
      row.addEventListener("click", () => {
        const bankN = row.dataset.bankN;
        navigator.clipboard?.writeText(bankN).then(() => {
          // Можно добавить toast уведомление
        }).catch(() => {});
      });
    });
  }, 0);
}

// Инициализация статистики при загрузке страницы
loadStats();
setupActivityTracking();
startPresenceTimer();
updateStatsUI();
updateAchievementDisplay();
requireAuth();

// Обработчики для модального окна аналитики
const analyticsBtn = document.getElementById("analyticsBtn");
const analyticsModal = document.getElementById("analyticsModal");
const analyticsModalClose = document.getElementById("analyticsModalClose");

if (analyticsBtn){
  analyticsBtn.addEventListener("click", openAnalyticsModal);
}

if (analyticsModalClose){
  analyticsModalClose.addEventListener("click", closeAnalyticsModal);
}

if (analyticsModal){
  const overlay = analyticsModal.querySelector(".analytics-modal__overlay");
  if (overlay){
    overlay.addEventListener("click", closeAnalyticsModal);
  }
  
  // Закрытие по Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && analyticsModal.style.display === "flex"){
      closeAnalyticsModal();
    }
  });
}


// Увеличение счетчика тестов при завершении теста
// Интеграция в функцию finish() - добавим вызов в конце finish()
