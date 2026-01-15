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

const elQuiz = document.getElementById("quiz");
const elOut = document.getElementById("out");
const startBtn = document.getElementById("startBtn");
const finishBtn = document.getElementById("finishBtn");
const learnBtn = document.getElementById("learnBtn");
const backBtn = document.getElementById("backBtn");
const hardBtn = document.getElementById("hardBtn");
const restartBtn = document.getElementById("restartBtn");
const clearFlagsBtn = document.getElementById("clearFlagsBtn");
const statusPill = document.getElementById("statusPill");
const meta = document.getElementById("meta");
const maxTestSizeDisplay = document.getElementById("maxTestSizeDisplay");

const timerText = document.getElementById("timerText");
const appEl = document.querySelector(".app");

let startTs = 0;
let timerId = null;

/** Focus mode controller */
function setRunning(isRunning){
  if (isRunning) {
    appEl.classList.add("is-running");
    if (hardMode) appEl.classList.add("hardmode-active");
  } else {
    appEl.classList.remove("is-running");
    appEl.classList.remove("hardmode-active");
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


// === HARD AUTO (ошибка -> добавить, 2 подряд верно -> снять) ===
const HARD_KEY = "hard_questions_bankN";
const HARD_STATS_KEY = "hard_stats_bankN";

let hardQuestions = new Set(JSON.parse(localStorage.getItem(HARD_KEY) || "[]")); // bankN
let hardStats = JSON.parse(localStorage.getItem(HARD_STATS_KEY) || "{}");        // { [bankN]: { streak, wrong } }

function saveHard(){
  localStorage.setItem(HARD_KEY, JSON.stringify([...hardQuestions]));
}
function saveHardStats(){
  localStorage.setItem(HARD_STATS_KEY, JSON.stringify(hardStats));
}

function clearAllFlags(){
  hardQuestions.clear();
  hardStats = {};
  saveHard();
  saveHardStats();
  hardBtn.disabled = true;
  // Перерисовать тест только если он действительно запущен (кнопка "Начать" отключена)
  if (TEST.length > 0 && startBtn.disabled) {
    renderTest();
  }
}

let mode = localStorage.getItem("quiz_mode") || "mcq";
let isHardMode = false; // флаг - находимся ли в режиме сложных вопросов
modeSelect.value = mode;

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildTest(){
  answers.clear();
  const picked = shuffle([...ALL]).slice(0, Math.min(TEST_SIZE, ALL.length));
  TEST = picked.map((x, idx) => ({
    id: (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + idx),
    n: idx + 1,
    bankN: x.n, // стабильный номер вопроса
    q: x.q,
    options: x.options,
    correctIndex: x.correctIndex,
    correctText: x.correctText
  }));
}

function buildTestHard(){
  answers.clear();

  const hardItems = ALL.filter(x => hardQuestions.has(x.n));
  if (hardItems.length === 0){
    alert("Нет помеченных сложных вопросов.");
    return false;
  }

  const picked = shuffle([...hardItems]).slice(0, Math.min(TEST_SIZE, hardItems.length));
  TEST = picked.map((x, idx) => ({
    id: (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + idx),
    n: idx + 1,
    bankN: x.n,
    q: x.q,
    options: x.options,
    correctIndex: x.correctIndex,
    correctText: x.correctText
  }));

  isHardMode = true;
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


function renderTest(){
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
  elOut.innerHTML = "";

  const frag = document.createDocumentFragment();

  // В Hardmode показываем только текущий вопрос
  const itemsToShow = hardMode ? [TEST[curIdx]] : TEST;

  for (const item of itemsToShow){
    const card = document.createElement("div");
    card.className = "card";
    if (hardMode) card.id = "activeQuestionCard";

    // Создаём структуру qhead с флажком
    const qhead = document.createElement("div");
    qhead.className = "qhead";

    const title = document.createElement("div");
    title.className = "qtitle";
    title.textContent = `${item.n}) ${item.q}`;

    const flagLabel = document.createElement("label");
    flagLabel.className = "flagToggle";
    flagLabel.title = "Отметить как сложный";

    const flagInput = document.createElement("input");
    flagInput.type = "checkbox";
    flagInput.className = "flagInput";
    flagInput.checked = hardQuestions.has(item.bankN);
    flagInput.addEventListener("change", (e) => {
      e.stopPropagation();
      if (flagInput.checked) {
        hardQuestions.add(item.bankN);
      } else {
        hardQuestions.delete(item.bankN);
      }
      saveHard();
      hardBtn.disabled = (hardQuestions.size === 0);
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

    if (mode === "text"){
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "Введите ответ…";
      inp.value = answers.get(item.id) ?? "";
      inp.addEventListener("input", () => {
  answers.set(item.id, inp.value);
  setSkipUI(card, inp.value.trim() === "");
  if (hardMode && inp.value.trim() !== "") {
    stopQuestionTimer();
    // Небольшая задержка для проверки ответа
    setTimeout(() => breakAndNext(false), 100);
  }
});

      card.appendChild(inp);

      const hint = document.createElement("div");
      hint.className = "muted small";
      hint.textContent = "Проверка: без регистра, лишние пробелы игнорируются.";
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
    // Небольшая задержка для проверки ответа
    setTimeout(() => breakAndNext(false), 100);
  }
});


        const txt = document.createElement("div");
        txt.innerHTML = `<div><span class="kbd">${LETTERS[i]}</span> ${escapeHtml(optText)}</div>`;

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
  statusPill.textContent = "Тест запущен";
  meta.textContent =
    `Вопросов: ${TEST.length} (из ${ALL.length}). Режим: ${mode === "mcq" ? "A–E" : "текст"}.` +
    (notFound ? ` ⚠️ Не найден ключ для: ${notFound}` : "");
  finishBtn.disabled = false;
  learnBtn.disabled = hardMode;  // недоступна в hardmode
  restartBtn.disabled = false;
}

function finish(){
  stopQuestionTimer();
  stopHardmodeMusic();
  stopTimer();
  const elapsedMs = getElapsedMs();
  const avgMs = TEST.length ? (elapsedMs / TEST.length) : 0;

  let correct = 0;
  const wrong = [];

  for (const item of TEST){
    const user = answers.get(item.id);

    let ok = false;
    if (mode === "mcq"){
      if (item.correctIndex === -1){
        ok = false; // если ключ не нашли
      } else {
        ok = (user === item.correctIndex);
      }
    } else {
      ok = acceptText(user ?? "", item.correctText);
    }

    // Авто-логика для сложных вопросов
    const k = String(item.bankN);
    hardStats[k] ??= { streak: 0, wrong: 0 };
    if (ok) {
      hardStats[k].streak = (hardStats[k].streak || 0) + 1;
      if (hardStats[k].streak >= 2) {
        hardQuestions.delete(item.bankN);
      }
    } else {
      hardStats[k].streak = 0;
      hardStats[k].wrong = (hardStats[k].wrong || 0) + 1;
      hardQuestions.add(item.bankN);
    }

    if (ok) correct++;
    else {
      const yourText = (mode === "mcq")
        ? (typeof user === "number" ? item.options[user] : "(пусто)")
        : (user || "(пусто)");

      wrong.push({
        n: item.n,
        q: item.q,
        your: yourText,
        expected: item.correctText
      });
    }
  }

const percent = Math.floor((correct / TEST.length) * 100);

// === HARDMODE ACHIEVEMENT (только если 100% и тест >= 50) ===
const hardModePassed = hardMode && TEST.length >= 50 && percent === 100;
let achievedTier = 0;
if (hardModePassed) {
  achievedTier = 1;                 // 50–99  -> +
  if (TEST.length >= 200) achievedTier = 3;      // +++
  else if (TEST.length >= 100) achievedTier = 2; // ++

  giveHardAchievement(achievedTier, TEST.length);
}


  const parts = [];
  // Add tabindex="-1" to result title for accessibility + focus
  if (hardModePassed) {
    const tierMarks = ["", "+", "++", "+++"][achievedTier];
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
        <div><b>${w.n})</b> ${escapeHtml(w.q)}</div>
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
  statusPill.textContent = "Тест завершён";
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;
  setRunning(false);
  
  // Сохраняем обновленные сложные вопросы и статистику
  saveHard();
  saveHardStats();
  hardBtn.disabled = (hardQuestions.size === 0);

const passed = (startBtn.disabled && TEST.length >= 30) && (percent >= 95);

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
const BASE = "/" + location.pathname.split("/")[1]; // "/SessionTester-Version-1.4"
const HARDMODE_PLAYLIST = [
  `${BASE}/static/music/01.mp3`,
  `${BASE}/static/music/02.mp3`,
  `${BASE}/static/music/03.mp3`,
  `${BASE}/static/music/04.mp3`,
];


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

  // мигание за 1.5 сек до конца (5.0 - 1.5 = 3.5)
  qWarnTimer = setTimeout(() => {
    const card = document.getElementById("activeQuestionCard");
    if (card) card.classList.add("time-low");
  }, 3500);

  qTimer = setTimeout(timeUp, 5000);
}

function stopQuestionTimer(){
  clearQuestionTimers();
  const card = document.getElementById("activeQuestionCard");
  if (card) card.classList.remove("time-low");
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
    isCorrect = acceptText(userAnswer ?? "", item.correctText);
  }
  
  return isCorrect;
}

function showHardModeFail(){
  stopQuestionTimer();
  stopHardmodeMusic();
  stopTimer();
  
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
  const marks = ["", "+", "++", "+++"][tier];
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
  if (hardMode && selectedName === "azamat") return "azamat";
  return selectedName;
}

function setBank(name) {
  const key = resolveBankKey(name);
  const bank = window.QUIZ_BANKS[key];
  if (!bank) {
    alert("Банк не найден: " + key);
    return;
  }

  // Устанавливаем данные банка
  RAW_BANK = bank.raw;
  ANSWER_TEXT = bank.answers;
  ALL = parseBank(RAW_BANK, ANSWER_TEXT);

  // Обновляем максимальное количество вопросов в зависимости от банка
  const maxByBank = {
    gaziz: 150,
    azamat: 210,
    kundyz: 140
  };
  const maxSize = maxByBank[key] || 150;
  if (maxTestSizeDisplay) maxTestSizeDisplay.textContent = maxSize;

  // Отключаем опции которые больше максимума
  Array.from(testSizeSelect.options).forEach(option => {
    const val = parseInt(option.value, 10);
    option.disabled = (val > maxSize);
  });

  // Сохраняем выбор
  localStorage.setItem("quiz_bank", name);

  // Полностью сбрасываем состояние текущего теста
  TEST = [];
  answers.clear();
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
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
  if (hardBtn) hardBtn.disabled = true;

  // Сбрасываем информационные поля
  statusPill.textContent = "Тест не запущен";
  meta.textContent = "";

  // Только подготовить тест, не отрисовывать (отрисовка только после "Начать")
  buildTest();
}

const saved = localStorage.getItem("quiz_bank") || "gaziz";
bankSelect.value = saved;
setBank(saved);

bankSelect.addEventListener("change", () => setBank(bankSelect.value));

/** ========= UI ========= */
modeSelect.addEventListener("change", () => {
  mode = modeSelect.value;
  localStorage.setItem("quiz_mode", mode);
  renderTest();
});

testSizeSelect.addEventListener("change", () => {
  TEST_SIZE = parseInt(testSizeSelect.value, 10);
  localStorage.setItem("quiz_test_size", String(TEST_SIZE));
  testSizeDisplay.textContent = TEST_SIZE;
});

startBtn.addEventListener("click", () => {
  buildTest();
  curIdx = 0;
  renderTest();
  startTimer();
  if (hardMode) startQuestionTimer();
  if (hardMode) startHardmodeMusic();
  else stopHardmodeMusic();
  setRunning(true);
  startBtn.disabled = true;
  learnBtn.disabled = hardMode;  // недоступна в hardmode
  restartBtn.disabled = true;
});

restartBtn.addEventListener("click", () => {
  buildTest();
  renderTest();
  startTimer();
  if (hardMode) startHardmodeMusic();
  else stopHardmodeMusic();
  setRunning(true);
  startBtn.disabled = true;
  learnBtn.disabled = hardMode;  // недоступна в hardmode
  restartBtn.disabled = true;
});

finishBtn.addEventListener("click", finish);

clearFlagsBtn.addEventListener("click", clearAllFlags);

function showAnswers(){
  elQuiz.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const item of TEST){
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "qtitle";
    title.textContent = `${item.n}) ${item.q}`;
    card.appendChild(title);

    if (mode === "text"){
      const correctDiv = document.createElement("div");
      correctDiv.className = "ok";
      correctDiv.textContent = "✓ Ответ: " + item.correctText;
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
        const indicator = isCorrect ? "✓" : " ";
        const color = isCorrect ? "color: #6ee7a8; font-weight: bold;" : "";
        label.innerHTML = `<span class="kbd" style="${color}">${LETTERS[i]}</span> <span style="${color}">${escapeHtml(optText)}</span>`;

        row.appendChild(label);
        card.appendChild(row);
      });
    }

    frag.appendChild(card);
  }

  elQuiz.appendChild(frag);
  statusPill.textContent = "Режим обучения";
  meta.textContent = `Вопросов: ${TEST.length} (из ${ALL.length}). Показаны правильные ответы.`;
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  backBtn.disabled = false;
  restartBtn.disabled = true;
}

learnBtn.addEventListener("click", showAnswers);

function backToTest(){
  renderTest();
  statusPill.textContent = "Тест запущен";
  meta.textContent = `Вопросов: ${TEST.length} (из ${ALL.length}). Режим: ${mode === "mcq" ? "A–E" : "текст"}.`;
  finishBtn.disabled = false;
  learnBtn.disabled = false;
  backBtn.disabled = true;
  restartBtn.disabled = false;
}

backBtn.addEventListener("click", backToTest);

hardBtn.addEventListener("click", () => {
  if (buildTestHard() === false) return;
  renderTest();
  startTimer();
  startBtn.disabled = true;
  learnBtn.disabled = false;
  restartBtn.disabled = true;
  hardBtn.disabled = true;
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
let isTabVisible = true;       // видимость вкладки

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


  // Пройдено тестов
  if (testsCompletedDisplay){
    testsCompletedDisplay.textContent = String(stats.tests_completed);
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

  const marks = ["", "+", "++", "+++"][tier];

  display.textContent = marks;
  display.classList.remove("tier-1","tier-2","tier-3");
  display.classList.add(`tier-${tier}`);

  cup.classList.remove("tier-1","tier-2","tier-3");
  cup.classList.add(`tier-${tier}`);
}

function tickPresenceTimer(){
  if (!isTabVisible) return;

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

// Инициализация статистики при загрузке страницы
loadStats();
startPresenceTimer();
updateStatsUI();
updateAchievementDisplay();

// Увеличение счетчика тестов при завершении теста
// Интеграция в функцию finish() - добавим вызов в конце finish()