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
const DEFAULT_BANK_KEY = "python_devops_networks_no_guess";
const BANK_LABELS = {
  [DEFAULT_BANK_KEY]: "Gaziz 2.0"
};
const BANK_MAX_SIZES = {
  [DEFAULT_BANK_KEY]: 350
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

const timerText = document.getElementById("timerText");
const appEl = document.querySelector(".app");

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
  const bankName = selectedOption?.textContent || "Банк";
  if (dashTitle) dashTitle.textContent = `${bankName} · ${TEST_SIZE} вопросов`;
  if (dashBankCount) dashBankCount.textContent = String(ALL.length || 0);
  if (dashMode) dashMode.textContent = mode === "mcq" ? "A–E" : "Текст";
  if (dashHardCount) dashHardCount.textContent = String(hardQuestions.size);

  document.querySelectorAll("[data-bank-tile]").forEach(tile => {
    tile.classList.toggle("is-active", tile.dataset.bankTile === currentBankKey);
  });

  if (dashPreview){
    dashPreview.innerHTML = "";
    const previewItems = ALL.slice(0, 3);
    previewItems.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "session-preview__item";

      const num = document.createElement("span");
      num.textContent = String(idx + 1).padStart(2, "0");

      const text = document.createElement("p");
      text.textContent = item.q;

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
  const disabled = (hardQuestions.size === 0 || startBtn.disabled);
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
      bankStats[bankN] = { shown: 0, correct: 0, wrong: 0, streak: 0, lastSeen: "", lastResult: "" };
    }
    
    const stat = bankStats[bankN];
    stat.shown++;
    stat.lastSeen = now;
    
    let ok = false;
    if (mode === "mcq"){
      ok = (item.correctIndex !== -1 && user === item.correctIndex);
    } else {
      ok = acceptText(user ?? "", item.correctText);
    }
    
    if (ok){
      stat.correct++;
      stat.streak++;
      stat.lastResult = "ok";
    } else {
      stat.wrong++;
      stat.streak = 0;
      stat.lastResult = "bad";
    }
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
    card.dataset.qid = item.id;
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
        ok = acceptText(user ?? "", item.correctText);
      }
      if (ok && user !== undefined && user !== -1){
        hardmodeStreakQuestions++;
      } else {
        break; // прерываем на первой ошибке
      }
    }
  }

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
      ok = acceptText(user ?? "", item.correctText);
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
const passed = (TEST.length >= 30 && percent >= 95);

// Обновляем статистику по вопросам
updateQStatsOnFinish(TEST, answers, mode, bankKey);

// === HARDMODE ACHIEVEMENT (только если 100% и тест >= 50) ===
const hardModePassed = hardMode && TEST.length >= 50 && percent === 100;
let achievedTier = 0;
if (hardModePassed) {
  achievedTier = 1;                 // 50–99  -> +
  if (TEST.length >= 290) achievedTier = 4;      // ⭐
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
    isCorrect = acceptText(userAnswer ?? "", item.correctText);
  }
  
  return isCorrect;
}

function showHardModeFail(){
  stopQuestionTimer();
  stopHardmodeMusic();
  stopTimer();
  
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
      ok = acceptText(user ?? "", item.correctText);
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
bankSelect.value = saved;
setBank(saved);

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

let lastStartWasHardOnly = false;

function startQuiz({ hardOnly = false } = {}){
  const built = hardOnly ? buildTestHard() : buildTest();
  if (built === false) return;

  appEl.classList.remove("has-output");
  lastStartWasHardOnly = hardOnly;
  curIdx = 0;
  isInLearningMode = false;
  backBtn.disabled = true;
  setRunning(true);
  renderTest();
  startTimer();
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
        const color = isCorrect ? "color: #6ee7a8; font-weight: bold;" : "";
        label.innerHTML = `<span class="kbd" style="${color}">${LETTERS[i]}</span> <span style="${color}">${escapeHtml(optText)}</span>`;

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
startPresenceTimer();
updateStatsUI();
updateAchievementDisplay();

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
