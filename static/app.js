/** ========= РџРђР РЎР•Р  Р‘РђРќРљРђ A) B) C) D) E) ========= */
function norm(s){
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")  // в†ђ СѓР±РёСЂР°РµС‚ Р’РЎР• РїСЂРѕР±РµР»С‹/С‚Р°Р±/РїРµСЂРµРЅРѕСЃС‹
    .trim();
}

function stripSlashes(s){
  return String(s).replace(/^\/+|\/+$/g, "");
}

const mojibakeByteMap = (() => {
  if (typeof TextDecoder === "undefined") return null;
  try {
    const bytes = Uint8Array.from({ length: 128 }, (_, i) => i + 128);
    const decoded = new TextDecoder("windows-1251").decode(bytes);
    const map = new Map();
    for (let i = 0; i < decoded.length; i++) map.set(decoded[i], i + 128);
    return map;
  } catch {
    return null;
  }
})();

function looksLikeCp1251Mojibake(text){
  return /(?:Р[^\sA-Za-zА-Яа-я]|С[^\sA-Za-zА-Яа-я]|вЂ|В·|В |Рќ|Р°|Рµ|Рё|СЃ|С‚|СЏ|С‡|С€|С‹|СЊ)/.test(String(text || ""));
}

function repairMojibakeText(text){
  const source = String(text ?? "");
  if (!mojibakeByteMap || !looksLikeCp1251Mojibake(source)) return source;
  let current = source;

  for (let pass = 0; pass < 3; pass++){
    if (!looksLikeCp1251Mojibake(current)) break;
    const repaired = repairMojibakePass(current);
    if (repaired === current) break;
    current = repaired;
  }

  return current;
}

function repairMojibakePass(source){
  const bytes = [];
  for (const char of source){
    const code = char.codePointAt(0);
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (mojibakeByteMap.has(char)) {
      bytes.push(mojibakeByteMap.get(char));
    } else {
      return source;
    }
  }

  try {
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(Uint8Array.from(bytes));
    return /[А-Яа-яЁё]/.test(repaired) ? repaired : source;
  } catch {
    return source;
  }
}

function repairElementMojibake(root){
  const attrNames = ["title", "placeholder", "aria-label", "value"];
  const fixNode = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const fixed = repairMojibakeText(node.nodeValue);
      if (fixed !== node.nodeValue) node.nodeValue = fixed;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    for (const attr of attrNames){
      if (!node.hasAttribute(attr)) continue;
      const value = node.getAttribute(attr);
      const fixed = repairMojibakeText(value);
      if (fixed !== value) node.setAttribute(attr, fixed);
    }
  };

  fixNode(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) fixNode(walker.currentNode);
}

function installMojibakeRepair(){
  if (!document.body || !mojibakeByteMap) return;
  repairElementMojibake(document.body);
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations){
      mutation.addedNodes.forEach(node => repairElementMojibake(node));
      if (mutation.type === "characterData") repairElementMojibake(mutation.target);
      if (mutation.type === "attributes") repairElementMojibake(mutation.target);
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["title", "placeholder", "aria-label", "value"],
  });
}

installMojibakeRepair();

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

    // РµСЃР»Рё РїРѕСЃР»Рµ "110." РІРѕРїСЂРѕСЃ РЅР° СЃР»РµРґСѓСЋС‰РµР№ СЃС‚СЂРѕРєРµ
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
      correctIndex,      // 0..4 РёР»Рё -1 РµСЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ
      correctText
    });
  }

  // СЃРѕСЂС‚РёСЂСѓРµРј РїРѕ РЅРѕРјРµСЂСѓ
  items.sort((a,b)=>a.n-b.n);
  return items;
}

/** ========= РРќРР¦РРђР›РР—РђР¦РРЇ Р‘РђРќРљРђ ========= */
let RAW_BANK = "";
let ANSWER_TEXT = [];

let ALL = parseBank(RAW_BANK, ANSWER_TEXT);

/** ========= РќРђРЎРўР РћР™РљР ========= */
const LETTERS = ["A","B","C","D","E"];
const DEFAULT_BANK_KEY = "moo_web_technologies_ws";
const SIMPLE_BANK_KEY = "pm07_content_management_systems";
const BANK_LABELS = {
  [DEFAULT_BANK_KEY]: "MOO Web-С‚РµС…РЅРѕР»РѕРіРёРё (WS)",
  [SIMPLE_BANK_KEY]: "PM 07 В· CMS"
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
let microphoneAccessGranted = false;
const COACH_THEME_NAMES = ["crimson", "frost", "venom", "ash", "royal", "ember"];
const COACH_THEME_COOLDOWN_MS = 8 * 60 * 1000;
const liveCoachHintUsed = new Set();
let liveCoachHintsLocked = false;
let coachMemory = {
  recent: [],
  disrespectCount: 0
};
let coachMemorySyncTimer = null;

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
  "python syntax and runtime": "СЃРёРЅС‚Р°РєСЃРёСЃ Рё РІС‹РїРѕР»РЅРµРЅРёРµ Python",
  "python data structures": "СЃС‚СЂСѓРєС‚СѓСЂС‹ РґР°РЅРЅС‹С… Python",
  "python control flow and functions": "СѓРїСЂР°РІР»РµРЅРёРµ РїРѕС‚РѕРєРѕРј Рё С„СѓРЅРєС†РёРё Python",
  "python oop, files, and errors": "РћРћРџ, С„Р°Р№Р»С‹ Рё РѕС€РёР±РєРё Python",
  "devops practices": "РїСЂР°РєС‚РёРєРё DevOps",
  "linux and source control": "Linux Рё РєРѕРЅС‚СЂРѕР»СЊ РІРµСЂСЃРёР№",
  "containers and kubernetes": "РєРѕРЅС‚РµР№РЅРµСЂС‹ Рё Kubernetes",
  "cloud and system design": "РѕР±Р»Р°РєР° Рё СЃРёСЃС‚РµРјРЅС‹Р№ РґРёР·Р°Р№РЅ",
  "network layers and models": "СЃРµС‚РµРІС‹Рµ СѓСЂРѕРІРЅРё Рё РјРѕРґРµР»Рё",
  "addressing and subnetting": "Р°РґСЂРµСЃР°С†РёСЏ Рё РїРѕРґСЃРµС‚Рё",
  "network protocols": "СЃРµС‚РµРІС‹Рµ РїСЂРѕС‚РѕРєРѕР»С‹",
  "switching, security, and performance": "РєРѕРјРјСѓС‚Р°С†РёСЏ, Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ Рё РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ",
  "advanced python": "РїСЂРѕРґРІРёРЅСѓС‚С‹Р№ Python",
  "application layer": "РїСЂРёРєР»Р°РґРЅРѕР№ СѓСЂРѕРІРµРЅСЊ",
  "application layer protocols": "РїСЂРѕС‚РѕРєРѕР»С‹ РїСЂРёРєР»Р°РґРЅРѕРіРѕ СѓСЂРѕРІРЅСЏ",
  "automation": "Р°РІС‚РѕРјР°С‚РёР·Р°С†РёСЏ",
  "ci/cd": "CI/CD",
  "cloud computing": "РѕР±Р»Р°С‡РЅС‹Рµ РІС‹С‡РёСЃР»РµРЅРёСЏ",
  "container orchestration": "РѕСЂРєРµСЃС‚СЂР°С†РёСЏ РєРѕРЅС‚РµР№РЅРµСЂРѕРІ",
  "containers": "РєРѕРЅС‚РµР№РЅРµСЂС‹",
  "containers and networking": "РєРѕРЅС‚РµР№РЅРµСЂС‹ Рё СЃРµС‚Рё",
  "control flow": "СѓРїСЂР°РІР»РµРЅРёРµ РїРѕС‚РѕРєРѕРј",
  "data link layer": "РєР°РЅР°Р»СЊРЅС‹Р№ СѓСЂРѕРІРµРЅСЊ",
  "data science": "РЅР°СѓРєР° Рѕ РґР°РЅРЅС‹С…",
  "deep learning": "РіР»СѓР±РѕРєРѕРµ РѕР±СѓС‡РµРЅРёРµ",
  "devops basics": "РѕСЃРЅРѕРІС‹ DevOps",
  "error handling": "РѕР±СЂР°Р±РѕС‚РєР° РѕС€РёР±РѕРє",
  "expressions": "РІС‹СЂР°Р¶РµРЅРёСЏ",
  "file and system operations": "С„Р°Р№Р»РѕРІС‹Рµ Рё СЃРёСЃС‚РµРјРЅС‹Рµ РѕРїРµСЂР°С†РёРё",
  "file handling": "СЂР°Р±РѕС‚Р° СЃ С„Р°Р№Р»Р°РјРё",
  "functional programming": "С„СѓРЅРєС†РёРѕРЅР°Р»СЊРЅРѕРµ РїСЂРѕРіСЂР°РјРјРёСЂРѕРІР°РЅРёРµ",
  "functions": "С„СѓРЅРєС†РёРё",
  "functions and loops": "С„СѓРЅРєС†РёРё Рё С†РёРєР»С‹",
  "input and output": "РІРІРѕРґ Рё РІС‹РІРѕРґ",
  "linux": "Linux",
  "linux and networking": "Linux Рё СЃРµС‚Рё",
  "machine learning": "РјР°С€РёРЅРЅРѕРµ РѕР±СѓС‡РµРЅРёРµ",
  "network benefits": "РїСЂРµРёРјСѓС‰РµСЃС‚РІР° СЃРµС‚РµР№",
  "network fundamentals": "РѕСЃРЅРѕРІС‹ СЃРµС‚РµР№",
  "network layer": "СЃРµС‚РµРІРѕР№ СѓСЂРѕРІРµРЅСЊ",
  "network layer protocols": "РїСЂРѕС‚РѕРєРѕР»С‹ СЃРµС‚РµРІРѕРіРѕ СѓСЂРѕРІРЅСЏ",
  "network models": "СЃРµС‚РµРІС‹Рµ РјРѕРґРµР»Рё",
  "network performance": "РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ СЃРµС‚Рё",
  "networking": "СЃРµС‚Рё",
  "networking security": "СЃРµС‚РµРІР°СЏ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ",
  "object-oriented programming": "РѕР±СЉРµРєС‚РЅРѕ-РѕСЂРёРµРЅС‚РёСЂРѕРІР°РЅРЅРѕРµ РїСЂРѕРіСЂР°РјРјРёСЂРѕРІР°РЅРёРµ",
  "operations": "РѕРїРµСЂР°С†РёРё",
  "packages and libraries": "РїР°РєРµС‚С‹ Рё Р±РёР±Р»РёРѕС‚РµРєРё",
  "physical layer": "С„РёР·РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ",
  "presentation layer": "СѓСЂРѕРІРµРЅСЊ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏ",
  "presentation layer and application protocols": "СѓСЂРѕРІРµРЅСЊ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏ Рё РїСЂРёРєР»Р°РґРЅС‹Рµ РїСЂРѕС‚РѕРєРѕР»С‹",
  "presentation layer security": "Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ СѓСЂРѕРІРЅСЏ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏ",
  "programming language basics": "РѕСЃРЅРѕРІС‹ СЏР·С‹РєР° РїСЂРѕРіСЂР°РјРјРёСЂРѕРІР°РЅРёСЏ",
  "python basics": "РѕСЃРЅРѕРІС‹ Python",
  "python fundamentals": "С„СѓРЅРґР°РјРµРЅС‚Р°Р»СЊРЅС‹Рµ РѕСЃРЅРѕРІС‹ Python",
  "routing": "РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ",
  "routing protocols": "РїСЂРѕС‚РѕРєРѕР»С‹ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёРё",
  "scripting": "СЃРєСЂРёРїС‚РёРЅРі",
  "scripting and configuration": "СЃРєСЂРёРїС‚РёРЅРі Рё РєРѕРЅС„РёРіСѓСЂР°С†РёСЏ",
  "security and networking": "Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ Рё СЃРµС‚Рё",
  "session layer": "СЃРµР°РЅСЃРѕРІС‹Р№ СѓСЂРѕРІРµРЅСЊ",
  "session layer and vpn": "СЃРµР°РЅСЃРѕРІС‹Р№ СѓСЂРѕРІРµРЅСЊ Рё VPN",
  "subnetting": "СЂР°Р·Р±РёРµРЅРёРµ РЅР° РїРѕРґСЃРµС‚Рё",
  "system design": "СЃРёСЃС‚РµРјРЅС‹Р№ РґРёР·Р°Р№РЅ",
  "system design and networking": "СЃРёСЃС‚РµРјРЅС‹Р№ РґРёР·Р°Р№РЅ Рё СЃРµС‚Рё",
  "transport layer": "С‚СЂР°РЅСЃРїРѕСЂС‚РЅС‹Р№ СѓСЂРѕРІРµРЅСЊ",
  "transport layer and performance": "С‚СЂР°РЅСЃРїРѕСЂС‚РЅС‹Р№ СѓСЂРѕРІРµРЅСЊ Рё РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ",
  "types of networks": "С‚РёРїС‹ СЃРµС‚РµР№",
  "version control": "РєРѕРЅС‚СЂРѕР»СЊ РІРµСЂСЃРёР№",
  "web development": "РІРµР±-СЂР°Р·СЂР°Р±РѕС‚РєР°"
};

const RU_PHRASES = [
  ["Which statement most accurately describes", "РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ РЅР°РёР±РѕР»РµРµ С‚РѕС‡РЅРѕ РѕРїРёСЃС‹РІР°РµС‚"],
  ["Which statement about", "РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ Рѕ"],
  ["is technically correct", "С‚РµС…РЅРёС‡РµСЃРєРё РІРµСЂРЅРѕ"],
  ["is correct", "РІРµСЂРЅРѕ"],
  ["What exactly is printed by", "Р§С‚Рѕ РёРјРµРЅРЅРѕ РЅР°РїРµС‡Р°С‚Р°РµС‚"],
  ["What is printed by", "Р§С‚Рѕ РЅР°РїРµС‡Р°С‚Р°РµС‚"],
  ["What is printed after", "Р§С‚Рѕ Р±СѓРґРµС‚ РЅР°РїРµС‡Р°С‚Р°РЅРѕ РїРѕСЃР»Рµ"],
  ["is mainly related to which area", "Рє РєР°РєРѕР№ РѕР±Р»Р°СЃС‚Рё СЌС‚Рѕ РІ РѕСЃРЅРѕРІРЅРѕРј РѕС‚РЅРѕСЃРёС‚СЃСЏ"],
  ["What is the result of", "РљР°РєРѕРІ СЂРµР·СѓР»СЊС‚Р°С‚"],
  ["What is the effect of", "РљР°РєРѕР№ СЌС„С„РµРєС‚ Сѓ"],
  ["What is the main trap in", "Р’ С‡РµРј РіР»Р°РІРЅР°СЏ Р»РѕРІСѓС€РєР° РІ"],
  ["What is true about", "Р§С‚Рѕ РІРµСЂРЅРѕ Рѕ"],
  ["What is the safest interpretation of", "РљР°Рє Р±РµР·РѕРїР°СЃРЅРµРµ РІСЃРµРіРѕ РїРѕРЅРёРјР°С‚СЊ"],
  ["What is the role of", "РљР°РєРѕРІР° СЂРѕР»СЊ"],
  ["Which statement best separates", "РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ Р»СѓС‡С€Рµ РІСЃРµРіРѕ СЂР°Р·РґРµР»СЏРµС‚"],
  ["Which statement best describes the difference between", "РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ Р»СѓС‡С€Рµ РІСЃРµРіРѕ РѕРїРёСЃС‹РІР°РµС‚ СЂР°Р·РЅРёС†Сѓ РјРµР¶РґСѓ"],
  ["Which answer best distinguishes", "РљР°РєРѕР№ РѕС‚РІРµС‚ Р»СѓС‡С€Рµ РІСЃРµРіРѕ РѕС‚Р»РёС‡Р°РµС‚"],
  ["Which answer best explains why", "РљР°РєРѕР№ РѕС‚РІРµС‚ Р»СѓС‡С€Рµ РІСЃРµРіРѕ РѕР±СЉСЏСЃРЅСЏРµС‚, РїРѕС‡РµРјСѓ"],
  ["What is a practical difference between", "Р’ С‡РµРј РїСЂР°РєС‚РёС‡РµСЃРєР°СЏ СЂР°Р·РЅРёС†Р° РјРµР¶РґСѓ"],
  ["What is the most likely effect of", "РљР°РєРѕРІ РЅР°РёР±РѕР»РµРµ РІРµСЂРѕСЏС‚РЅС‹Р№ СЌС„С„РµРєС‚"],
  ["What is the most accurate reason", "РљР°РєРѕРІР° СЃР°РјР°СЏ С‚РѕС‡РЅР°СЏ РїСЂРёС‡РёРЅР°"],
  ["What is the most direct fix", "РљР°РєРѕРµ СЃР°РјРѕРµ РїСЂСЏРјРѕРµ РёСЃРїСЂР°РІР»РµРЅРёРµ"],
  ["Which signal best helps trace", "РљР°РєРѕР№ СЃРёРіРЅР°Р» Р»СѓС‡С€Рµ РІСЃРµРіРѕ РїРѕРјРѕРіР°РµС‚ РѕС‚СЃР»РµРґРёС‚СЊ"],
  ["in Python", "РІ Python"],
  ["in DevOps practices", "РІ РїСЂР°РєС‚РёРєР°С… DevOps"],
  ["in Linux and source control", "РІ Linux Рё РєРѕРЅС‚СЂРѕР»Рµ РІРµСЂСЃРёР№"],
  ["in containers and Kubernetes", "РІ РєРѕРЅС‚РµР№РЅРµСЂР°С… Рё Kubernetes"],
  ["in cloud and system design", "РІ РѕР±Р»Р°РєР°С… Рё СЃРёСЃС‚РµРјРЅРѕРј РґРёР·Р°Р№РЅРµ"],
  ["in network layers and models", "РІ СЃРµС‚РµРІС‹С… СѓСЂРѕРІРЅСЏС… Рё РјРѕРґРµР»СЏС…"],
  ["in addressing and subnetting", "РІ Р°РґСЂРµСЃР°С†РёРё Рё РїРѕРґСЃРµС‚СЏС…"],
  ["in network protocols", "РІ СЃРµС‚РµРІС‹С… РїСЂРѕС‚РѕРєРѕР»Р°С…"],
  ["in switching, security, and performance", "РІ РєРѕРјРјСѓС‚Р°С†РёРё, Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё Рё РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё"],
  ["It immediately returns", "РЎСЂР°Р·Сѓ РІРѕР·РІСЂР°С‰Р°РµС‚"],
  ["It writes", "Р—Р°РїРёСЃС‹РІР°РµС‚"],
  ["It serializes", "РЎРµСЂРёР°Р»РёР·СѓРµС‚"],
  ["It sends", "РћС‚РїСЂР°РІР»СЏРµС‚"],
  ["It builds", "РЎРѕР±РёСЂР°РµС‚"],
  ["It reads", "Р§РёС‚Р°РµС‚"],
  ["It returns", "Р’РѕР·РІСЂР°С‰Р°РµС‚"],
  ["It creates", "РЎРѕР·РґР°РµС‚"],
  ["It checks", "РџСЂРѕРІРµСЂСЏРµС‚"],
  ["It represents", "РџСЂРµРґСЃС‚Р°РІР»СЏРµС‚"],
  ["It determines", "РћРїСЂРµРґРµР»СЏРµС‚"],
  ["It binds", "РџСЂРёРІСЏР·С‹РІР°РµС‚"],
  ["It stores", "РҐСЂР°РЅРёС‚"],
  ["It pauses", "РџСЂРёРѕСЃС‚Р°РЅР°РІР»РёРІР°РµС‚"],
  ["It exits", "Р’С‹С…РѕРґРёС‚"],
  ["It skips", "РџСЂРѕРїСѓСЃРєР°РµС‚"],
  ["It accepts", "РџСЂРёРЅРёРјР°РµС‚"],
  ["It applies", "РџСЂРёРјРµРЅСЏРµС‚"],
  ["name binding", "РїСЂРёРІСЏР·РєСѓ РёРјРµРЅРё"],
  ["import statement", "РѕРїРµСЂР°С‚РѕСЂ import"],
  ["global statement", "РѕРїРµСЂР°С‚РѕСЂ global"],
  ["nonlocal statement", "РѕРїРµСЂР°С‚РѕСЂ nonlocal"],
  ["identity comparison", "СЃСЂР°РІРЅРµРЅРёРµ РёРґРµРЅС‚РёС‡РЅРѕСЃС‚Рё"],
  ["equality comparison", "СЃСЂР°РІРЅРµРЅРёРµ СЂР°РІРµРЅСЃС‚РІР°"],
  ["PEP 8 naming", "РёРјРµРЅРѕРІР°РЅРёРµ РїРѕ PEP 8"],
  ["list comprehension", "РіРµРЅРµСЂР°С‚РѕСЂ СЃРїРёСЃРєР°"],
  ["generator expression", "РіРµРЅРµСЂР°С‚РѕСЂРЅРѕРµ РІС‹СЂР°Р¶РµРЅРёРµ"],
  ["function definition", "РѕРїСЂРµРґРµР»РµРЅРёРµ С„СѓРЅРєС†РёРё"],
  ["return statement", "РѕРїРµСЂР°С‚РѕСЂ return"],
  ["yield statement", "РѕРїРµСЂР°С‚РѕСЂ yield"],
  ["lambda expression", "lambda-РІС‹СЂР°Р¶РµРЅРёРµ"],
  ["default argument", "Р°СЂРіСѓРјРµРЅС‚ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ"],
  ["higher-order function", "С„СѓРЅРєС†РёСЏ РІС‹СЃС€РµРіРѕ РїРѕСЂСЏРґРєР°"],
  ["instance attribute", "Р°С‚СЂРёР±СѓС‚ СЌРєР·РµРјРїР»СЏСЂР°"],
  ["class attribute", "Р°С‚СЂРёР±СѓС‚ РєР»Р°СЃСЃР°"],
  ["try / except", "try / except"],
  ["finally block", "Р±Р»РѕРє finally"],
  ["raise statement", "РѕРїРµСЂР°С‚РѕСЂ raise"],
  ["context manager", "РєРѕРЅС‚РµРєСЃС‚РЅС‹Р№ РјРµРЅРµРґР¶РµСЂ"],
  ["local scope", "Р»РѕРєР°Р»СЊРЅСѓСЋ РѕР±Р»Р°СЃС‚СЊ РІРёРґРёРјРѕСЃС‚Рё"],
  ["docstring", "docstring"],
  ["truthiness", "РёСЃС‚РёРЅРЅРѕСЃС‚СЊ"],
  ["indentation", "РѕС‚СЃС‚СѓРїС‹"],
  ["Conditional statement", "СѓСЃР»РѕРІРЅС‹Р№ РѕРїРµСЂР°С‚РѕСЂ"],
  ["Data type", "С‚РёРї РґР°РЅРЅС‹С…"],
  ["Return value", "РІРѕР·РІСЂР°С‰Р°РµРјРѕРµ Р·РЅР°С‡РµРЅРёРµ"],
  ["lambda function", "lambda-С„СѓРЅРєС†РёСЏ"],
  ["Exception handling", "РѕР±СЂР°Р±РѕС‚РєР° РёСЃРєР»СЋС‡РµРЅРёР№"],
  ["Built-in exception", "РІСЃС‚СЂРѕРµРЅРЅРѕРµ РёСЃРєР»СЋС‡РµРЅРёРµ"],
  ["User-defined exception", "РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ РёСЃРєР»СЋС‡РµРЅРёРµ"],
  ["File handling", "СЂР°Р±РѕС‚Р° СЃ С„Р°Р№Р»Р°РјРё"],
  ["OS module", "РјРѕРґСѓР»СЊ OS"],
  ["pathlib module", "РјРѕРґСѓР»СЊ pathlib"],
  ["Built-in module", "РІСЃС‚СЂРѕРµРЅРЅС‹Р№ РјРѕРґСѓР»СЊ"],
  ["Linux permissions", "РїСЂР°РІР° РґРѕСЃС‚СѓРїР° Linux"],
  ["System monitoring", "РјРѕРЅРёС‚РѕСЂРёРЅРі СЃРёСЃС‚РµРјС‹"],
  ["Linux firewall", "РјРµР¶СЃРµС‚РµРІРѕР№ СЌРєСЂР°РЅ Linux"],
  ["Network interface", "СЃРµС‚РµРІРѕР№ РёРЅС‚РµСЂС„РµР№СЃ"],
  ["OSI Model", "РјРѕРґРµР»СЊ OSI"],
  ["TCP/IP Model", "РјРѕРґРµР»СЊ TCP/IP"],
  ["Network protocol", "СЃРµС‚РµРІРѕР№ РїСЂРѕС‚РѕРєРѕР»"],
  ["Monolithic architecture", "РјРѕРЅРѕР»РёС‚РЅР°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР°"],
  ["Event-driven architecture", "СЃРѕР±С‹С‚РёР№РЅР°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР°"],
  ["Load balancing", "Р±Р°Р»Р°РЅСЃРёСЂРѕРІРєР° РЅР°РіСЂСѓР·РєРё"],
  ["Proxy server", "РїСЂРѕРєСЃРё-СЃРµСЂРІРµСЂ"],
  ["Source code management", "СѓРїСЂР°РІР»РµРЅРёРµ РёСЃС…РѕРґРЅС‹Рј РєРѕРґРѕРј"],
  ["Branching strategy", "СЃС‚СЂР°С‚РµРіРёСЏ РІРµС‚РІР»РµРЅРёСЏ"],
  ["Merge strategy", "СЃС‚СЂР°С‚РµРіРёСЏ СЃР»РёСЏРЅРёСЏ"],
  ["Shell scripting", "shell-СЃРєСЂРёРїС‚РёРЅРі"],
  ["Scheduled task", "Р·Р°РїР»Р°РЅРёСЂРѕРІР°РЅРЅР°СЏ Р·Р°РґР°С‡Р°"],
  ["Cloud platform", "РѕР±Р»Р°С‡РЅР°СЏ РїР»Р°С‚С„РѕСЂРјР°"],
  ["Google Cloud Platform", "Google Cloud Platform"],
  ["Docker architecture", "Р°СЂС…РёС‚РµРєС‚СѓСЂР° Docker"],
  ["Docker image", "РѕР±СЂР°Р· Docker"],
  ["Docker volume", "С‚РѕРј Docker"],
  ["Docker networking", "СЃРµС‚Рё Docker"],
  ["Docker registry", "СЂРµРµСЃС‚СЂ Docker"],
  ["Kubernetes pod", "pod Kubernetes"],
  ["Kubernetes deployment", "СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёРµ Kubernetes"],
  ["Computer network", "РєРѕРјРїСЊСЋС‚РµСЂРЅР°СЏ СЃРµС‚СЊ"],
  ["Resource sharing", "СЃРѕРІРјРµСЃС‚РЅРѕРµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ СЂРµСЃСѓСЂСЃРѕРІ"],
  ["Data sharing", "РѕР±РјРµРЅ РґР°РЅРЅС‹РјРё"],
  ["Remote access", "СѓРґР°Р»РµРЅРЅС‹Р№ РґРѕСЃС‚СѓРї"],
  ["Network device", "СЃРµС‚РµРІРѕРµ СѓСЃС‚СЂРѕР№СЃС‚РІРѕ"],
  ["Network topology", "С‚РѕРїРѕР»РѕРіРёСЏ СЃРµС‚Рё"],
  ["Transmission media", "СЃСЂРµРґР° РїРµСЂРµРґР°С‡Рё"],
  ["Transmission mode", "СЂРµР¶РёРј РїРµСЂРµРґР°С‡Рё"],
  ["Physical layer", "С„РёР·РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ"],
  ["Data link layer", "РєР°РЅР°Р»СЊРЅС‹Р№ СѓСЂРѕРІРµРЅСЊ"],
  ["Network layer", "СЃРµС‚РµРІРѕР№ СѓСЂРѕРІРµРЅСЊ"],
  ["Transport layer", "С‚СЂР°РЅСЃРїРѕСЂС‚РЅС‹Р№ СѓСЂРѕРІРµРЅСЊ"],
  ["Session layer", "СЃРµР°РЅСЃРѕРІС‹Р№ СѓСЂРѕРІРµРЅСЊ"],
  ["Presentation layer", "СѓСЂРѕРІРµРЅСЊ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏ"],
  ["Application layer", "РїСЂРёРєР»Р°РґРЅРѕР№ СѓСЂРѕРІРµРЅСЊ"],
  ["Error detection", "РѕР±РЅР°СЂСѓР¶РµРЅРёРµ РѕС€РёР±РѕРє"],
  ["Error correction", "РёСЃРїСЂР°РІР»РµРЅРёРµ РѕС€РёР±РѕРє"],
  ["Flow control", "СѓРїСЂР°РІР»РµРЅРёРµ РїРѕС‚РѕРєРѕРј"],
  ["Stop-and-wait ARQ", "Stop-and-wait ARQ"],
  ["Sliding window protocol", "РїСЂРѕС‚РѕРєРѕР» СЃРєРѕР»СЊР·СЏС‰РµРіРѕ РѕРєРЅР°"],
  ["IP addressing", "IP-Р°РґСЂРµСЃР°С†РёСЏ"],
  ["Private IP address", "С‡Р°СЃС‚РЅС‹Р№ IP-Р°РґСЂРµСЃ"],
  ["Public IP address", "РїСѓР±Р»РёС‡РЅС‹Р№ IP-Р°РґСЂРµСЃ"],
  ["Subnet mask", "РјР°СЃРєР° РїРѕРґСЃРµС‚Рё"],
  ["Static routing", "СЃС‚Р°С‚РёС‡РµСЃРєР°СЏ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ"],
  ["Dynamic routing", "РґРёРЅР°РјРёС‡РµСЃРєР°СЏ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ"],
  ["TCP three-way handshake", "С‚СЂРµС…СЃС‚РѕСЂРѕРЅРЅРµРµ СЂСѓРєРѕРїРѕР¶Р°С‚РёРµ TCP"],
  ["Congestion control", "СѓРїСЂР°РІР»РµРЅРёРµ РїРµСЂРµРіСЂСѓР·РєРѕР№"],
  ["Client-server model", "РєР»РёРµРЅС‚-СЃРµСЂРІРµСЂРЅР°СЏ РјРѕРґРµР»СЊ"],
  ["Application layer protocols", "РїСЂРѕС‚РѕРєРѕР»С‹ РїСЂРёРєР»Р°РґРЅРѕРіРѕ СѓСЂРѕРІРЅСЏ"],
  ["while hiding details that callers do not need", "СЃРєСЂС‹РІР°СЏ РґРµС‚Р°Р»Рё, РєРѕС‚РѕСЂС‹Рµ РІС‹Р·С‹РІР°СЋС‰РµРјСѓ РєРѕРґСѓ РЅРµ РЅСѓР¶РЅС‹"],
  ["Lets one class reuse and specialize behavior from another class", "РџРѕР·РІРѕР»СЏРµС‚ РѕРґРЅРѕРјСѓ РєР»Р°СЃСЃСѓ РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Рё СѓС‚РѕС‡РЅСЏС‚СЊ РїРѕРІРµРґРµРЅРёРµ РґСЂСѓРіРѕРіРѕ РєР»Р°СЃСЃР°"],
  ["Stores data on the class and is shared through instances unless shadowed", "РҐСЂР°РЅРёС‚ РґР°РЅРЅС‹Рµ РЅР° РєР»Р°СЃСЃРµ Рё СЂР°Р·РґРµР»СЏРµС‚СЃСЏ СЌРєР·РµРјРїР»СЏСЂР°РјРё, РїРѕРєР° РЅРµ РїРµСЂРµРѕРїСЂРµРґРµР»РµРЅРѕ"],
  ["Defines a template for creating objects with shared attributes and behavior", "РћРїСЂРµРґРµР»СЏРµС‚ С€Р°Р±Р»РѕРЅ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РѕР±СЉРµРєС‚РѕРІ СЃ РѕР±С‰РёРјРё Р°С‚СЂРёР±СѓС‚Р°РјРё Рё РїРѕРІРµРґРµРЅРёРµРј"],
  ["Stores data on a particular object rather than on the class itself", "РҐСЂР°РЅРёС‚ РґР°РЅРЅС‹Рµ РЅР° РєРѕРЅРєСЂРµС‚РЅРѕРј РѕР±СЉРµРєС‚Рµ, Р° РЅРµ РЅР° СЃР°РјРѕРј РєР»Р°СЃСЃРµ"],
  ["Defines setup and cleanup behavior around a block, often used with with", "РћРїСЂРµРґРµР»СЏРµС‚ РїРѕРґРіРѕС‚РѕРІРєСѓ Рё РѕС‡РёСЃС‚РєСѓ РІРѕРєСЂСѓРі Р±Р»РѕРєР°, С‡Р°СЃС‚Рѕ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ СЃ with"],
  ["Initializes a newly created instance after it has been allocated", "РРЅРёС†РёР°Р»РёР·РёСЂСѓРµС‚ РЅРѕРІС‹Р№ СЌРєР·РµРјРїР»СЏСЂ РїРѕСЃР»Рµ РµРіРѕ РІС‹РґРµР»РµРЅРёСЏ"],
  ["Groups state and related behavior while controlling how outside code interacts with it", "Р“СЂСѓРїРїРёСЂСѓРµС‚ СЃРѕСЃС‚РѕСЏРЅРёРµ Рё СЃРІСЏР·Р°РЅРЅРѕРµ РїРѕРІРµРґРµРЅРёРµ, РєРѕРЅС‚СЂРѕР»РёСЂСѓСЏ РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёРµ РІРЅРµС€РЅРµРіРѕ РєРѕРґР°"],
  ["Refers to the current instance passed explicitly as the first method parameter by convention", "РЎСЃС‹Р»Р°РµС‚СЃСЏ РЅР° С‚РµРєСѓС‰РёР№ СЌРєР·РµРјРїР»СЏСЂ, РєРѕС‚РѕСЂС‹Р№ РїРѕ СЃРѕРіР»Р°С€РµРЅРёСЋ РїРµСЂРµРґР°РµС‚СЃСЏ РїРµСЂРІС‹Рј РїР°СЂР°РјРµС‚СЂРѕРј РјРµС‚РѕРґР°"],
  ["Handles selected runtime exceptions so the program can recover or respond", "РћР±СЂР°Р±Р°С‚С‹РІР°РµС‚ РІС‹Р±СЂР°РЅРЅС‹Рµ РёСЃРєР»СЋС‡РµРЅРёСЏ РІСЂРµРјРµРЅРё РІС‹РїРѕР»РЅРµРЅРёСЏ, С‡С‚РѕР±С‹ РїСЂРѕРіСЂР°РјРјР° РјРѕРіР»Р° РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊСЃСЏ РёР»Рё РѕС‚РІРµС‚РёС‚СЊ"],
  ["Belongs in a class namespace but receives neither instance nor class automatically", "РќР°С…РѕРґРёС‚СЃСЏ РІ РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРµ РёРјРµРЅ РєР»Р°СЃСЃР°, РЅРѕ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РЅРµ РїРѕР»СѓС‡Р°РµС‚ РЅРё СЌРєР·РµРјРїР»СЏСЂ, РЅРё РєР»Р°СЃСЃ"],
  ["Allows different object types to be used through a shared interface or method name", "РџРѕР·РІРѕР»СЏРµС‚ СЂР°Р·РЅС‹Рј С‚РёРїР°Рј РѕР±СЉРµРєС‚РѕРІ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊСЃСЏ С‡РµСЂРµР· РѕР±С‰РёР№ РёРЅС‚РµСЂС„РµР№СЃ РёР»Рё РёРјСЏ РјРµС‚РѕРґР°"],
  ["Receives the class as its first argument and is often used for alternate constructors", "РџРѕР»СѓС‡Р°РµС‚ РєР»Р°СЃСЃ РїРµСЂРІС‹Рј Р°СЂРіСѓРјРµРЅС‚РѕРј Рё С‡Р°СЃС‚Рѕ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹С… РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂРѕРІ"],
  ["Provides operating-system interfaces such as environment variables and process-related utilities", "РџСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ РёРЅС‚РµСЂС„РµР№СЃС‹ РћРЎ: РїРµСЂРµРјРµРЅРЅС‹Рµ РѕРєСЂСѓР¶РµРЅРёСЏ Рё СѓС‚РёР»РёС‚С‹, СЃРІСЏР·Р°РЅРЅС‹Рµ СЃ РїСЂРѕС†РµСЃСЃР°РјРё"],
  ["Exposes method-controlled access through attribute-style syntax", "РџСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ РґРѕСЃС‚СѓРї, СѓРїСЂР°РІР»СЏРµРјС‹Р№ РјРµС‚РѕРґРѕРј, С‡РµСЂРµР· СЃРёРЅС‚Р°РєСЃРёСЃ Р°С‚СЂРёР±СѓС‚Р°"],
  ["Runs cleanup code whether an exception was raised or not", "Р—Р°РїСѓСЃРєР°РµС‚ РєРѕРґ РѕС‡РёСЃС‚РєРё РЅРµР·Р°РІРёСЃРёРјРѕ РѕС‚ С‚РѕРіРѕ, Р±С‹Р»Рѕ РёСЃРєР»СЋС‡РµРЅРёРµ РёР»Рё РЅРµС‚"],
  ["Stores ordered mutable items and supports in-place changes such as append and item assignment", "РҐСЂР°РЅРёС‚ СѓРїРѕСЂСЏРґРѕС‡РµРЅРЅС‹Рµ РёР·РјРµРЅСЏРµРјС‹Рµ СЌР»РµРјРµРЅС‚С‹ Рё РїРѕРґРґРµСЂР¶РёРІР°РµС‚ РёР·РјРµРЅРµРЅРёСЏ РЅР° РјРµСЃС‚Рµ, РЅР°РїСЂРёРјРµСЂ append Рё РїСЂРёСЃРІР°РёРІР°РЅРёРµ РїРѕ РёРЅРґРµРєСЃСѓ"],
  ["Copies the outer container while keeping references to nested mutable objects", "РљРѕРїРёСЂСѓРµС‚ РІРЅРµС€РЅРёР№ РєРѕРЅС‚РµР№РЅРµСЂ, СЃРѕС…СЂР°РЅСЏСЏ СЃСЃС‹Р»РєРё РЅР° РІР»РѕР¶РµРЅРЅС‹Рµ РёР·РјРµРЅСЏРµРјС‹Рµ РѕР±СЉРµРєС‚С‹"],
  ["Stores unique hashable elements without a meaningful positional index", "РҐСЂР°РЅРёС‚ СѓРЅРёРєР°Р»СЊРЅС‹Рµ С…РµС€РёСЂСѓРµРјС‹Рµ СЌР»РµРјРµРЅС‚С‹ Р±РµР· Р·РЅР°С‡РёРјРѕРіРѕ РїРѕР·РёС†РёРѕРЅРЅРѕРіРѕ РёРЅРґРµРєСЃР°"],
  ["Recursively copies nested objects so inner mutable structures are duplicated when possible", "Р РµРєСѓСЂСЃРёРІРЅРѕ РєРѕРїРёСЂСѓРµС‚ РІР»РѕР¶РµРЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹, С‡С‚РѕР±С‹ РІРЅСѓС‚СЂРµРЅРЅРёРµ РёР·РјРµРЅСЏРµРјС‹Рµ СЃС‚СЂСѓРєС‚СѓСЂС‹ С‚РѕР¶Рµ РґСѓР±Р»РёСЂРѕРІР°Р»РёСЃСЊ, РєРѕРіРґР° РІРѕР·РјРѕР¶РЅРѕ"],
  ["Selects a subsequence using start, stop, and step without including the stop index", "Р’С‹Р±РёСЂР°РµС‚ РїРѕРґРїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚СЊ С‡РµСЂРµР· start, stop Рё step, РЅРµ РІРєР»СЋС‡Р°СЏ РєРѕРЅРµС‡РЅС‹Р№ РёРЅРґРµРєСЃ"],
  ["Stores ordered items in an immutable container, though contained mutable objects may still change", "РҐСЂР°РЅРёС‚ СѓРїРѕСЂСЏРґРѕС‡РµРЅРЅС‹Рµ СЌР»РµРјРµРЅС‚С‹ РІ РЅРµРёР·РјРµРЅСЏРµРјРѕРј РєРѕРЅС‚РµР№РЅРµСЂРµ, С…РѕС‚СЏ РІР»РѕР¶РµРЅРЅС‹Рµ РёР·РјРµРЅСЏРµРјС‹Рµ РѕР±СЉРµРєС‚С‹ РјРѕРіСѓС‚ РјРµРЅСЏС‚СЊСЃСЏ"],
  ["Returns a value for a key or a default without raising KeyError when the key is absent", "Р’РѕР·РІСЂР°С‰Р°РµС‚ Р·РЅР°С‡РµРЅРёРµ РїРѕ РєР»СЋС‡Сѓ РёР»Рё Р·РЅР°С‡РµРЅРёРµ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ Р±РµР· KeyError, РµСЃР»Рё РєР»СЋС‡ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚"],
  ["Produces values one at a time through the iterator protocol until exhausted", "Р’С‹РґР°РµС‚ Р·РЅР°С‡РµРЅРёСЏ РїРѕ РѕРґРЅРѕРјСѓ С‡РµСЂРµР· РїСЂРѕС‚РѕРєРѕР» РёС‚РµСЂР°С‚РѕСЂР°, РїРѕРєР° РѕРЅРё РЅРµ Р·Р°РєРѕРЅС‡Р°С‚СЃСЏ"],
  ["Maps hashable keys to values and preserves insertion order in modern Python", "РЎРѕРїРѕСЃС‚Р°РІР»СЏРµС‚ С…РµС€РёСЂСѓРµРјС‹Рµ РєР»СЋС‡Рё СЃРѕ Р·РЅР°С‡РµРЅРёСЏРјРё Рё СЃРѕС…СЂР°РЅСЏРµС‚ РїРѕСЂСЏРґРѕРє РІСЃС‚Р°РІРєРё РІ СЃРѕРІСЂРµРјРµРЅРЅРѕРј Python"],
  ["Prevents changing the object itself after creation, though names can be rebound", "Р—Р°РїСЂРµС‰Р°РµС‚ РјРµРЅСЏС‚СЊ СЃР°Рј РѕР±СЉРµРєС‚ РїРѕСЃР»Рµ СЃРѕР·РґР°РЅРёСЏ, С…РѕС‚СЏ РёРјРµРЅР° РјРѕР¶РЅРѕ РїРµСЂРµРїСЂРёРІСЏР·Р°С‚СЊ"],
  ["Builds a list from an iterable using compact loop and optional filter syntax", "РЎРѕР·РґР°РµС‚ СЃРїРёСЃРѕРє РёР· РёС‚РµСЂРёСЂСѓРµРјРѕРіРѕ РѕР±СЉРµРєС‚Р° С‡РµСЂРµР· РєРѕРјРїР°РєС‚РЅС‹Р№ С†РёРєР» Рё РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ С„РёР»СЊС‚СЂ"],
  ["Adds one object as a single new element at the end of a list", "Р”РѕР±Р°РІР»СЏРµС‚ РѕРґРёРЅ РѕР±СЉРµРєС‚ РєР°Рє РЅРѕРІС‹Р№ СЌР»РµРјРµРЅС‚ РІ РєРѕРЅРµС† СЃРїРёСЃРєР°"],
  ["Retrieves an item by position or key using square brackets", "РџРѕР»СѓС‡Р°РµС‚ СЌР»РµРјРµРЅС‚ РїРѕ РїРѕР·РёС†РёРё РёР»Рё РєР»СЋС‡Сѓ С‡РµСЂРµР· РєРІР°РґСЂР°С‚РЅС‹Рµ СЃРєРѕР±РєРё"],
  ["Stores immutable text as a sequence of Unicode characters", "РҐСЂР°РЅРёС‚ РЅРµРёР·РјРµРЅСЏРµРјС‹Р№ С‚РµРєСЃС‚ РєР°Рє РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚СЊ Unicode-СЃРёРјРІРѕР»РѕРІ"],
  ["Creates a lazy iterator using comprehension-like syntax without building a list immediately", "РЎРѕР·РґР°РµС‚ Р»РµРЅРёРІС‹Р№ РёС‚РµСЂР°С‚РѕСЂ С‡РµСЂРµР· СЃРёРЅС‚Р°РєСЃРёСЃ, РїРѕС…РѕР¶РёР№ РЅР° comprehension, Р±РµР· РЅРµРјРµРґР»РµРЅРЅРѕРіРѕ СЃРѕР·РґР°РЅРёСЏ СЃРїРёСЃРєР°"],
  ["Allows an object to be used as a dictionary key or set element when its hash is stable", "РџРѕР·РІРѕР»СЏРµС‚ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РѕР±СЉРµРєС‚ РєР°Рє РєР»СЋС‡ СЃР»РѕРІР°СЂСЏ РёР»Рё СЌР»РµРјРµРЅС‚ РјРЅРѕР¶РµСЃС‚РІР°, РµСЃР»Рё РµРіРѕ С…РµС€ СЃС‚Р°Р±РёР»РµРЅ"],
  ["Combines elements from sets while keeping only unique values", "РћР±СЉРµРґРёРЅСЏРµС‚ СЌР»РµРјРµРЅС‚С‹ РјРЅРѕР¶РµСЃС‚РІ, РѕСЃС‚Р°РІР»СЏСЏ С‚РѕР»СЊРєРѕ СѓРЅРёРєР°Р»СЊРЅС‹Рµ Р·РЅР°С‡РµРЅРёСЏ"],
  ["Can return an iterator, allowing it to be used in a for loop", "РњРѕР¶РµС‚ РІРѕР·РІСЂР°С‰Р°С‚СЊ РёС‚РµСЂР°С‚РѕСЂ, РїРѕР·РІРѕР»СЏСЏ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РѕР±СЉРµРєС‚ РІ С†РёРєР»Рµ for"],
  ["Adds each item from an iterable to the end of a list", "Р”РѕР±Р°РІР»СЏРµС‚ РєР°Р¶РґС‹Р№ СЌР»РµРјРµРЅС‚ РёС‚РµСЂРёСЂСѓРµРјРѕРіРѕ РѕР±СЉРµРєС‚Р° РІ РєРѕРЅРµС† СЃРїРёСЃРєР°"],
  ["Keeps only elements that are present in both sets", "РћСЃС‚Р°РІР»СЏРµС‚ С‚РѕР»СЊРєРѕ СЌР»РµРјРµРЅС‚С‹, РєРѕС‚РѕСЂС‹Рµ РµСЃС‚СЊ РІ РѕР±РѕРёС… РјРЅРѕР¶РµСЃС‚РІР°С…"],
  ["Defines ordered automated stages such as build, test, scan, package, and deploy", "РћРїСЂРµРґРµР»СЏРµС‚ СѓРїРѕСЂСЏРґРѕС‡РµРЅРЅС‹Рµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРµ СЌС‚Р°РїС‹: СЃР±РѕСЂРєР°, С‚РµСЃС‚, СЃРєР°РЅРёСЂРѕРІР°РЅРёРµ, СѓРїР°РєРѕРІРєР° Рё РґРµРїР»РѕР№"],
  ["Keeps changes in a releasable state while requiring a deliberate production release step", "Р”РµСЂР¶РёС‚ РёР·РјРµРЅРµРЅРёСЏ РіРѕС‚РѕРІС‹РјРё Рє СЂРµР»РёР·Сѓ, РЅРѕ С‚СЂРµР±СѓРµС‚ РѕС‚РґРµР»СЊРЅРѕРіРѕ С€Р°РіР° РІС‹РїСѓСЃРєР° РІ РїСЂРѕРґР°РєС€РµРЅ"],
  ["Separates deploying code from enabling behavior for selected users or environments", "РћС‚РґРµР»СЏРµС‚ РґРµРїР»РѕР№ РєРѕРґР° РѕС‚ РІРєР»СЋС‡РµРЅРёСЏ РїРѕРІРµРґРµРЅРёСЏ РґР»СЏ РІС‹Р±СЂР°РЅРЅС‹С… РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№ РёР»Рё РѕРєСЂСѓР¶РµРЅРёР№"],
  ["Manages infrastructure definitions as versioned files reviewed like application code", "РЈРїСЂР°РІР»СЏРµС‚ РѕРїРёСЃР°РЅРёСЏРјРё РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂС‹ РєР°Рє РІРµСЂСЃРёРѕРЅРёСЂРѕРІР°РЅРЅС‹РјРё С„Р°Р№Р»Р°РјРё, РєРѕС‚РѕСЂС‹Рµ СЂРµРІСЊСЋСЏС‚СЃСЏ РєР°Рє РєРѕРґ РїСЂРёР»РѕР¶РµРЅРёСЏ"],
  ["Switches traffic between two production-ready environments to reduce cutover risk", "РџРµСЂРµРєР»СЋС‡Р°РµС‚ С‚СЂР°С„РёРє РјРµР¶РґСѓ РґРІСѓРјСЏ РіРѕС‚РѕРІС‹РјРё РїСЂРѕРґР°РєС€РµРЅ-РѕРєСЂСѓР¶РµРЅРёСЏРјРё, СЃРЅРёР¶Р°СЏ СЂРёСЃРє РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ"],
  ["Prioritizes or manages traffic to meet performance requirements", "РџСЂРёРѕСЂРёС‚РёР·РёСЂСѓРµС‚ РёР»Рё СѓРїСЂР°РІР»СЏРµС‚ С‚СЂР°С„РёРєРѕРј, С‡С‚РѕР±С‹ РІС‹РїРѕР»РЅРёС‚СЊ С‚СЂРµР±РѕРІР°РЅРёСЏ РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё"],
  ["Allows or blocks traffic according to configured security rules", "Р Р°Р·СЂРµС€Р°РµС‚ РёР»Рё Р±Р»РѕРєРёСЂСѓРµС‚ С‚СЂР°С„РёРє СЃРѕРіР»Р°СЃРЅРѕ РЅР°СЃС‚СЂРѕРµРЅРЅС‹Рј РїСЂР°РІРёР»Р°Рј Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё"],
  ["Separates network control logic from packet forwarding hardware", "РћС‚РґРµР»СЏРµС‚ Р»РѕРіРёРєСѓ СѓРїСЂР°РІР»РµРЅРёСЏ СЃРµС‚СЊСЋ РѕС‚ РѕР±РѕСЂСѓРґРѕРІР°РЅРёСЏ РїРµСЂРµСЃС‹Р»РєРё РїР°РєРµС‚РѕРІ"],
  ["Runs network functions as software rather than dedicated appliances", "Р—Р°РїСѓСЃРєР°РµС‚ СЃРµС‚РµРІС‹Рµ С„СѓРЅРєС†РёРё РєР°Рє РїСЂРѕРіСЂР°РјРјРЅРѕРµ РѕР±РµСЃРїРµС‡РµРЅРёРµ РІРјРµСЃС‚Рѕ РІС‹РґРµР»РµРЅРЅС‹С… СѓСЃС‚СЂРѕР№СЃС‚РІ"],
  ["Provides wireless local-area networking based on IEEE 802.11 standards", "РџСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ Р±РµСЃРїСЂРѕРІРѕРґРЅСѓСЋ Р»РѕРєР°Р»СЊРЅСѓСЋ СЃРµС‚СЊ РЅР° РѕСЃРЅРѕРІРµ СЃС‚Р°РЅРґР°СЂС‚РѕРІ IEEE 802.11"],
  ["Spreads client traffic across multiple servers to improve capacity or availability", "Р Р°СЃРїСЂРµРґРµР»СЏРµС‚ РєР»РёРµРЅС‚СЃРєРёР№ С‚СЂР°С„РёРє РїРѕ РЅРµСЃРєРѕР»СЊРєРёРј СЃРµСЂРІРµСЂР°Рј, С‡С‚РѕР±С‹ СѓР»СѓС‡С€РёС‚СЊ РµРјРєРѕСЃС‚СЊ РёР»Рё РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ"],
  ["Forwards frames based on learned MAC address tables", "РџРµСЂРµСЃС‹Р»Р°РµС‚ РєР°РґСЂС‹ РЅР° РѕСЃРЅРѕРІРµ РёР·СѓС‡РµРЅРЅС‹С… С‚Р°Р±Р»РёС† MAC-Р°РґСЂРµСЃРѕРІ"],
  ["Forwards packets between IP networks using routing decisions", "РџРµСЂРµСЃС‹Р»Р°РµС‚ РїР°РєРµС‚С‹ РјРµР¶РґСѓ IP-СЃРµС‚СЏРјРё РЅР° РѕСЃРЅРѕРІРµ СЂРµС€РµРЅРёР№ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёРё"],
  ["Repeats incoming bits out all ports without learning MAC addresses", "РџРѕРІС‚РѕСЂСЏРµС‚ РІС…РѕРґСЏС‰РёРµ Р±РёС‚С‹ РЅР° РІСЃРµ РїРѕСЂС‚С‹, РЅРµ РёР·СѓС‡Р°СЏ MAC-Р°РґСЂРµСЃР°"],
  ["Prevents a fast sender from overwhelming a slower receiver", "РќРµ РґР°РµС‚ Р±С‹СЃС‚СЂРѕРјСѓ РѕС‚РїСЂР°РІРёС‚РµР»СЋ РїРµСЂРµРіСЂСѓР·РёС‚СЊ Р±РѕР»РµРµ РјРµРґР»РµРЅРЅРѕРіРѕ РїРѕР»СѓС‡Р°С‚РµР»СЏ"],
  ["Detects suspicious activity and alerts without necessarily blocking it", "РћР±РЅР°СЂСѓР¶РёРІР°РµС‚ РїРѕРґРѕР·СЂРёС‚РµР»СЊРЅСѓСЋ Р°РєС‚РёРІРЅРѕСЃС‚СЊ Рё РѕС‚РїСЂР°РІР»СЏРµС‚ РѕРїРѕРІРµС‰РµРЅРёСЏ, РЅРµ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ Р±Р»РѕРєРёСЂСѓСЏ РµРµ"],
  ["Detects suspicious activity and can actively block or prevent it", "РћР±РЅР°СЂСѓР¶РёРІР°РµС‚ РїРѕРґРѕР·СЂРёС‚РµР»СЊРЅСѓСЋ Р°РєС‚РёРІРЅРѕСЃС‚СЊ Рё РјРѕР¶РµС‚ Р°РєС‚РёРІРЅРѕ Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РёР»Рё РїСЂРµРґРѕС‚РІСЂР°С‰Р°С‚СЊ РµРµ"],
  ["Chooses among branches by testing conditions in order until one branch is selected", "Р’С‹Р±РёСЂР°РµС‚ РѕРґРЅСѓ РёР· РІРµС‚РѕРє, РїСЂРѕРІРµСЂСЏСЏ СѓСЃР»РѕРІРёСЏ РїРѕ РїРѕСЂСЏРґРєСѓ, РїРѕРєР° РѕРґРЅР° РІРµС‚РєР° РЅРµ Р±СѓРґРµС‚ РІС‹Р±СЂР°РЅР°"],
  ["Combines iterable items into one accumulated result using a two-argument callable", "РћР±СЉРµРґРёРЅСЏРµС‚ СЌР»РµРјРµРЅС‚С‹ РёС‚РµСЂРёСЂСѓРµРјРѕРіРѕ РѕР±СЉРµРєС‚Р° РІ РѕРґРёРЅ РЅР°РєРѕРїР»РµРЅРЅС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ С‡РµСЂРµР· С„СѓРЅРєС†РёСЋ СЃ РґРІСѓРјСЏ Р°СЂРіСѓРјРµРЅС‚Р°РјРё"],
  ["Supplies a value used when a caller omits an argument, evaluated at function definition time", "Р—Р°РґР°РµС‚ Р·РЅР°С‡РµРЅРёРµ, РёСЃРїРѕР»СЊР·СѓРµРјРѕРµ РїСЂРё РїСЂРѕРїСѓС‰РµРЅРЅРѕРј Р°СЂРіСѓРјРµРЅС‚Рµ; РІС‹С‡РёСЃР»СЏРµС‚СЃСЏ РїСЂРё РѕРїСЂРµРґРµР»РµРЅРёРё С„СѓРЅРєС†РёРё"],
  ["Accepts a function as an argument or returns a function as a result", "РџСЂРёРЅРёРјР°РµС‚ С„СѓРЅРєС†РёСЋ РєР°Рє Р°СЂРіСѓРјРµРЅС‚ РёР»Рё РІРѕР·РІСЂР°С‰Р°РµС‚ С„СѓРЅРєС†РёСЋ РєР°Рє СЂРµР·СѓР»СЊС‚Р°С‚"],
  ["Skips the rest of the current loop iteration and moves to the next iteration", "РџСЂРѕРїСѓСЃРєР°РµС‚ РѕСЃС‚Р°С‚РѕРє С‚РµРєСѓС‰РµР№ РёС‚РµСЂР°С†РёРё С†РёРєР»Р° Рё РїРµСЂРµС…РѕРґРёС‚ Рє СЃР»РµРґСѓСЋС‰РµР№"],
  ["Remembers variables from an enclosing scope after that scope has finished executing", "РџРѕРјРЅРёС‚ РїРµСЂРµРјРµРЅРЅС‹Рµ РёР· РІРЅРµС€РЅРµР№ РѕР±Р»Р°СЃС‚Рё РІРёРґРёРјРѕСЃС‚Рё РїРѕСЃР»Рµ Р·Р°РІРµСЂС€РµРЅРёСЏ СЌС‚РѕР№ РѕР±Р»Р°СЃС‚Рё"],
  ["Iterates over values produced by an iterable rather than counting by default", "РџРµСЂРµР±РёСЂР°РµС‚ Р·РЅР°С‡РµРЅРёСЏ, СЃРѕР·РґР°РІР°РµРјС‹Рµ РёС‚РµСЂРёСЂСѓРµРјС‹Рј РѕР±СЉРµРєС‚РѕРј, Р° РЅРµ СЃС‡РёС‚Р°РµС‚ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ"],
  ["Creates a callable object and binds it to a name using def", "РЎРѕР·РґР°РµС‚ РІС‹Р·С‹РІР°РµРјС‹Р№ РѕР±СЉРµРєС‚ Рё РїСЂРёРІСЏР·С‹РІР°РµС‚ РµРіРѕ Рє РёРјРµРЅРё С‡РµСЂРµР· def"],
  ["Creates a small anonymous function from a single expression", "РЎРѕР·РґР°РµС‚ РЅРµР±РѕР»СЊС€СѓСЋ Р°РЅРѕРЅРёРјРЅСѓСЋ С„СѓРЅРєС†РёСЋ РёР· РѕРґРЅРѕРіРѕ РІС‹СЂР°Р¶РµРЅРёСЏ"],
  ["Repeats a block while a condition remains truthy", "РџРѕРІС‚РѕСЂСЏРµС‚ Р±Р»РѕРє, РїРѕРєР° СѓСЃР»РѕРІРёРµ РѕСЃС‚Р°РµС‚СЃСЏ РёСЃС‚РёРЅРЅС‹Рј"],
  ["Collects extra keyword arguments into a dictionary inside a function", "РЎРѕР±РёСЂР°РµС‚ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РёРјРµРЅРѕРІР°РЅРЅС‹Рµ Р°СЂРіСѓРјРµРЅС‚С‹ РІ СЃР»РѕРІР°СЂСЊ РІРЅСѓС‚СЂРё С„СѓРЅРєС†РёРё"],
  ["Terminates the nearest enclosing loop immediately", "РќРµРјРµРґР»РµРЅРЅРѕ Р·Р°РІРµСЂС€Р°РµС‚ Р±Р»РёР¶Р°Р№С€РёР№ РІРЅРµС€РЅРёР№ С†РёРєР»"],
  ["Pauses a generator function and produces the next value lazily", "РџСЂРёРѕСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ С„СѓРЅРєС†РёСЋ-РіРµРЅРµСЂР°С‚РѕСЂ Рё Р»РµРЅРёРІРѕ РІС‹РґР°РµС‚ СЃР»РµРґСѓСЋС‰РµРµ Р·РЅР°С‡РµРЅРёРµ"],
  ["Solves a problem by having a function call itself with a smaller or simpler case", "Р РµС€Р°РµС‚ Р·Р°РґР°С‡Сѓ С‚РµРј, С‡С‚Рѕ С„СѓРЅРєС†РёСЏ РІС‹Р·С‹РІР°РµС‚ СЃР°РјСѓ СЃРµР±СЏ СЃ РјРµРЅСЊС€РёРј РёР»Рё Р±РѕР»РµРµ РїСЂРѕСЃС‚С‹Рј СЃР»СѓС‡Р°РµРј"],
  ["Wraps or replaces a function or class at definition time using callable syntax", "РћР±РѕСЂР°С‡РёРІР°РµС‚ РёР»Рё Р·Р°РјРµРЅСЏРµС‚ С„СѓРЅРєС†РёСЋ Р»РёР±Рѕ РєР»Р°СЃСЃ РїСЂРё РѕРїСЂРµРґРµР»РµРЅРёРё С‡РµСЂРµР· РІС‹Р·С‹РІР°РµРјС‹Р№ СЃРёРЅС‚Р°РєСЃРёСЃ"],
  ["Keeps items from an iterable for which a callable returns a truthy value", "РћСЃС‚Р°РІР»СЏРµС‚ СЌР»РµРјРµРЅС‚С‹ РёС‚РµСЂРёСЂСѓРµРјРѕРіРѕ РѕР±СЉРµРєС‚Р°, РґР»СЏ РєРѕС‚РѕСЂС‹С… С„СѓРЅРєС†РёСЏ РІРѕР·РІСЂР°С‰Р°РµС‚ РёСЃС‚РёРЅРЅРѕРµ Р·РЅР°С‡РµРЅРёРµ"],
  ["Acts as a syntactic placeholder that performs no operation", "Р Р°Р±РѕС‚Р°РµС‚ РєР°Рє СЃРёРЅС‚Р°РєСЃРёС‡РµСЃРєР°СЏ Р·Р°РіР»СѓС€РєР°, РєРѕС‚РѕСЂР°СЏ РЅРёС‡РµРіРѕ РЅРµ РґРµР»Р°РµС‚"],
  ["Collects extra positional arguments into a tuple inside a function", "РЎРѕР±РёСЂР°РµС‚ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїРѕР·РёС†РёРѕРЅРЅС‹Рµ Р°СЂРіСѓРјРµРЅС‚С‹ РІ РєРѕСЂС‚РµР¶ РІРЅСѓС‚СЂРё С„СѓРЅРєС†РёРё"],
  ["Exits a function call and sends a value back to the caller", "Р’С‹С…РѕРґРёС‚ РёР· РІС‹Р·РѕРІР° С„СѓРЅРєС†РёРё Рё РІРѕР·РІСЂР°С‰Р°РµС‚ Р·РЅР°С‡РµРЅРёРµ РІС‹Р·С‹РІР°СЋС‰РµРјСѓ РєРѕРґСѓ"],
  ["Applies a callable to items from one or more iterables and returns a lazy iterator", "РџСЂРёРјРµРЅСЏРµС‚ С„СѓРЅРєС†РёСЋ Рє СЌР»РµРјРµРЅС‚Р°Рј РѕРґРЅРѕРіРѕ РёР»Рё РЅРµСЃРєРѕР»СЊРєРёС… РёС‚РµСЂРёСЂСѓРµРјС‹С… РѕР±СЉРµРєС‚РѕРІ Рё РІРѕР·РІСЂР°С‰Р°РµС‚ Р»РµРЅРёРІС‹Р№ РёС‚РµСЂР°С‚РѕСЂ"],
  ["such as", "С‚Р°РєРёРµ РєР°Рє"],
  ["do not need", "РЅРµ РЅСѓР¶РЅС‹"],
  ["can share", "РјРѕРіСѓС‚ СЂР°Р·РґРµР»СЏС‚СЊ"],
  ["can be", "РјРѕР¶РµС‚ Р±С‹С‚СЊ"],
  ["as versioned files", "РєР°Рє РІРµСЂСЃРёРѕРЅРёСЂРѕРІР°РЅРЅС‹Рµ С„Р°Р№Р»С‹"],
  ["like application code", "РєР°Рє РєРѕРґ РїСЂРёР»РѕР¶РµРЅРёСЏ"],
  ["without necessarily blocking it", "РЅРµ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ Р±Р»РѕРєРёСЂСѓСЏ РµРµ"],
  ["text representations of its arguments", "С‚РµРєСЃС‚РѕРІС‹Рµ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏ СЃРІРѕРёС… Р°СЂРіСѓРјРµРЅС‚РѕРІ"],
  ["file-like stream", "РїРѕС‚РѕРє, РїРѕС…РѕР¶РёР№ РЅР° С„Р°Р№Р»"],
  ["standard input", "СЃС‚Р°РЅРґР°СЂС‚РЅС‹Р№ РІРІРѕРґ"],
  ["structured log record", "СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅРЅСѓСЋ Р·Р°РїРёСЃСЊ Р»РѕРіР°"],
  ["configured logging handlers", "РЅР°СЃС‚СЂРѕРµРЅРЅС‹Рµ РѕР±СЂР°Р±РѕС‚С‡РёРєРё Р»РѕРіРёСЂРѕРІР°РЅРёСЏ"],
  ["final output string", "РёС‚РѕРіРѕРІСѓСЋ СЃС‚СЂРѕРєСѓ РІС‹РІРѕРґР°"],
  ["Reads one line", "Р§РёС‚Р°РµС‚ РѕРґРЅСѓ СЃС‚СЂРѕРєСѓ"],
  ["after showing a prompt", "РїРѕСЃР»Рµ РїРѕРєР°Р·Р° РїСЂРёРіР»Р°С€РµРЅРёСЏ"],
  ["returns a string", "РІРѕР·РІСЂР°С‰Р°РµС‚ СЃС‚СЂРѕРєСѓ"],
  ["Returns an implementation-level identity value", "Р’РѕР·РІСЂР°С‰Р°РµС‚ Р·РЅР°С‡РµРЅРёРµ РёРґРµРЅС‚РёС‡РЅРѕСЃС‚Рё РЅР° СѓСЂРѕРІРЅРµ СЂРµР°Р»РёР·Р°С†РёРё"],
  ["during its lifetime", "РЅР° РІСЂРµРјСЏ Р¶РёР·РЅРё РѕР±СЉРµРєС‚Р°"],
  ["runtime class of an object", "РєР»Р°СЃСЃ РѕР±СЉРµРєС‚Р° РІРѕ РІСЂРµРјСЏ РІС‹РїРѕР»РЅРµРЅРёСЏ"],
  ["called with three arguments", "РІС‹Р·РѕРІРµ СЃ С‚СЂРµРјСЏ Р°СЂРіСѓРјРµРЅС‚Р°РјРё"],
  ["number of items", "РєРѕР»РёС‡РµСЃС‚РІРѕ СЌР»РµРјРµРЅС‚РѕРІ"],
  ["sized object", "РѕР±СЉРµРєС‚Рµ СЃ СЂР°Р·РјРµСЂРѕРј"],
  ["without iterating over every value manually", "Р±РµР· СЂСѓС‡РЅРѕРіРѕ РїРµСЂРµР±РѕСЂР° РєР°Р¶РґРѕРіРѕ Р·РЅР°С‡РµРЅРёСЏ"],
  ["numeric values from an iterable", "С‡РёСЃР»РѕРІС‹Рµ Р·РЅР°С‡РµРЅРёСЏ РёР· РёС‚РµСЂРёСЂСѓРµРјРѕРіРѕ РѕР±СЉРµРєС‚Р°"],
  ["supplied start value", "Р·Р°РґР°РЅРЅРѕРіРѕ СЃС‚Р°СЂС‚РѕРІРѕРіРѕ Р·РЅР°С‡РµРЅРёСЏ"],
  ["every element in an iterable is truthy", "РєР°Р¶РґС‹Р№ СЌР»РµРјРµРЅС‚ РёС‚РµСЂРёСЂСѓРµРјРѕРіРѕ РѕР±СЉРµРєС‚Р° РёСЃС‚РёРЅРЅС‹Р№"],
  ["including an empty iterable", "РІРєР»СЋС‡Р°СЏ РїСѓСЃС‚РѕР№ РёС‚РµСЂРёСЂСѓРµРјС‹Р№ РѕР±СЉРµРєС‚"],
  ["belongs to a class", "РїСЂРёРЅР°РґР»РµР¶РёС‚ РєР»Р°СЃСЃСѓ"],
  ["one of the classes in a tuple", "РѕРґРЅРѕРјСѓ РёР· РєР»Р°СЃСЃРѕРІ РІ РєРѕСЂС‚РµР¶Рµ"],
  ["new sorted list", "РЅРѕРІС‹Р№ РѕС‚СЃРѕСЂС‚РёСЂРѕРІР°РЅРЅС‹Р№ СЃРїРёСЃРѕРє"],
  ["leaving the original object unchanged", "РѕСЃС‚Р°РІР»СЏСЏ РёСЃС…РѕРґРЅС‹Р№ РѕР±СЉРµРєС‚ Р±РµР· РёР·РјРµРЅРµРЅРёР№"],
  ["natural ordering or a key function", "РµСЃС‚РµСЃС‚РІРµРЅРЅРѕРјСѓ РїРѕСЂСЏРґРєСѓ РёР»Рё РєР»СЋС‡РµРІРѕР№ С„СѓРЅРєС†РёРё"],
  ["human-readable string representation", "С‡РµР»РѕРІРµРєРѕС‡РёС‚Р°РµРјРѕРµ СЃС‚СЂРѕРєРѕРІРѕРµ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёРµ"],
  ["normal display", "РѕР±С‹С‡РЅРѕРіРѕ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ"],
  ["developer-oriented representation", "РїСЂРµРґСЃС‚Р°РІР»РµРЅРёРµ РґР»СЏ СЂР°Р·СЂР°Р±РѕС‚С‡РёРєР°"],
  ["unambiguous when possible", "РїРѕ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё РѕРґРЅРѕР·РЅР°С‡РЅС‹Рј"],
  ["arithmetic progression of integers", "Р°СЂРёС„РјРµС‚РёС‡РµСЃРєСѓСЋ РїСЂРѕРіСЂРµСЃСЃРёСЋ С†РµР»С‹С… С‡РёСЃРµР»"],
  ["without storing the whole sequence", "Р±РµР· С…СЂР°РЅРµРЅРёСЏ РІСЃРµР№ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚Рё"],
  ["multiple iterables element by element", "РЅРµСЃРєРѕР»СЊРєРѕ РёС‚РµСЂРёСЂСѓРµРјС‹С… РѕР±СЉРµРєС‚РѕРІ РїРѕСЌР»РµРјРµРЅС‚РЅРѕ"],
  ["stops at the shortest input", "РѕСЃС‚Р°РЅР°РІР»РёРІР°РµС‚СЃСЏ РЅР° СЃР°РјРѕРј РєРѕСЂРѕС‚РєРѕРј РІС…РѕРґРµ"],
  ["reverse order", "РѕР±СЂР°С‚РЅРѕРј РїРѕСЂСЏРґРєРµ"],
  ["supports reverse iteration", "РїРѕРґРґРµСЂР¶РёРІР°РµС‚ РѕР±СЂР°С‚РЅСѓСЋ РёС‚РµСЂР°С†РёСЋ"],
  ["counter that can start from a chosen value", "СЃС‡РµС‚С‡РёРєРѕРј, РєРѕС‚РѕСЂС‹Р№ РјРѕР¶РµС‚ РЅР°С‡РёРЅР°С‚СЊСЃСЏ СЃ РІС‹Р±СЂР°РЅРЅРѕРіРѕ Р·РЅР°С‡РµРЅРёСЏ"],
  ["file object for reading, writing, appending, or binary access depending on mode", "С„Р°Р№Р»РѕРІС‹Р№ РѕР±СЉРµРєС‚ РґР»СЏ С‡С‚РµРЅРёСЏ, Р·Р°РїРёСЃРё, РґРѕР±Р°РІР»РµРЅРёСЏ РёР»Рё Р±РёРЅР°СЂРЅРѕРіРѕ РґРѕСЃС‚СѓРїР° РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ СЂРµР¶РёРјР°"],
  ["RРѕunds a number", "РћРєСЂСѓРіР»СЏРµС‚ С‡РёСЃР»Рѕ"],
  ["Rounds a number", "РћРєСЂСѓРіР»СЏРµС‚ С‡РёСЃР»Рѕ"],
  ["requested precision", "Р·Р°РґР°РЅРЅРѕР№ С‚РѕС‡РЅРѕСЃС‚Рё"],
  ["ties rounded to the nearest even value", "РїРѕР»РѕРІРёРЅС‹ РѕРєСЂСѓРіР»СЏСЋС‚СЃСЏ Рє Р±Р»РёР¶Р°Р№С€РµРјСѓ С‡РµС‚РЅРѕРјСѓ Р·РЅР°С‡РµРЅРёСЋ"],
  ["name with an object", "РёРјСЏ СЃ РѕР±СЉРµРєС‚РѕРј"],
  ["assignment does not copy the object by itself", "РїСЂРёСЃРІР°РёРІР°РЅРёРµ СЃР°РјРѕ РїРѕ СЃРµР±Рµ РЅРµ РєРѕРїРёСЂСѓРµС‚ РѕР±СЉРµРєС‚"],
  ["Boolean contexts", "Р±СѓР»РµРІС‹С… РєРѕРЅС‚РµРєСЃС‚Р°С…"],
  ["ignored by the interpreter", "РёРіРЅРѕСЂРёСЂСѓРµРјС‹Р№ РёРЅС‚РµСЂРїСЂРµС‚Р°С‚РѕСЂРѕРј"],
  ["explaining code to humans", "РѕР±СЉСЏСЃРЅРµРЅРёСЏ РєРѕРґР° Р»СЋРґСЏРј"],
  ["local, global, or built-ins", "Р»РѕРєР°Р»СЊРЅС‹Р№, РіР»РѕР±Р°Р»СЊРЅС‹Р№ РёР»Рё РІСЃС‚СЂРѕРµРЅРЅС‹Р№"],
  ["module or package", "РјРѕРґСѓР»СЏ РёР»Рё РїР°РєРµС‚Р°"],
  ["external definitions", "РІРЅРµС€РЅРёРµ РѕРїСЂРµРґРµР»РµРЅРёСЏ"],
  ["reserved word", "Р·Р°СЂРµР·РµСЂРІРёСЂРѕРІР°РЅРЅРѕРµ СЃР»РѕРІРѕ"],
  ["syntactic meaning", "СЃРёРЅС‚Р°РєСЃРёС‡РµСЃРєРѕРµ Р·РЅР°С‡РµРЅРёРµ"],
  ["normal identifier", "РѕР±С‹С‡РЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ"],
  ["fixed value directly in source code", "С„РёРєСЃРёСЂРѕРІР°РЅРЅРѕРµ Р·РЅР°С‡РµРЅРёРµ РїСЂСЏРјРѕ РІ РёСЃС…РѕРґРЅРѕРј РєРѕРґРµ"],
  ["block structure", "СЃС‚СЂСѓРєС‚СѓСЂСѓ Р±Р»РѕРєРѕРІ"],
  ["instead of braces", "РІРјРµСЃС‚Рѕ С„РёРіСѓСЂРЅС‹С… СЃРєРѕР±РѕРє"],
  ["values, names, calls, and operators", "Р·РЅР°С‡РµРЅРёСЏ, РёРјРµРЅР°, РІС‹Р·РѕРІС‹ Рё РѕРїРµСЂР°С‚РѕСЂС‹"],
  ["to produce a value", "С‡С‚РѕР±С‹ РїРѕР»СѓС‡РёС‚СЊ Р·РЅР°С‡РµРЅРёРµ"],
  ["two references point to the same object", "РґРІРµ СЃСЃС‹Р»РєРё СѓРєР°Р·С‹РІР°СЋС‚ РЅР° РѕРґРёРЅ Рё С‚РѕС‚ Р¶Рµ РѕР±СЉРµРєС‚"],
  ["not merely equal values", "Р° РЅРµ РїСЂРѕСЃС‚Рѕ СЂР°РІРЅС‹Рµ Р·РЅР°С‡РµРЅРёСЏ"],
  ["action such as assignment, import, return", "РґРµР№СЃС‚РІРёРµ РІСЂРѕРґРµ РїСЂРёСЃРІР°РёРІР°РЅРёСЏ, РёРјРїРѕСЂС‚Р° РёР»Рё РІРѕР·РІСЂР°С‚Р°"],
  ["compound control structure", "СЃРѕСЃС‚Р°РІРЅРѕР№ СѓРїСЂР°РІР»СЏСЋС‰РµР№ РєРѕРЅСЃС‚СЂСѓРєС†РёРё"],
  ["string literal at the start", "СЃС‚СЂРѕРєРѕРІС‹Р№ Р»РёС‚РµСЂР°Р» РІ РЅР°С‡Р°Р»Рµ"],
  ["for documentation", "РґР»СЏ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё"],
  ["absence of a value", "РѕС‚СЃСѓС‚СЃС‚РІРёРµ Р·РЅР°С‡РµРЅРёСЏ"],
  ["compared by identity", "СЃСЂР°РІРЅРёРІР°РµС‚СЃСЏ РїРѕ РёРґРµРЅС‚РёС‡РЅРѕСЃС‚Рё"],
  ["conventional naming", "РїСЂРёРЅСЏС‚РѕРµ РёРјРµРЅРѕРІР°РЅРёРµ"],
  ["functions and variables", "С„СѓРЅРєС†РёР№ Рё РїРµСЂРµРјРµРЅРЅС‹С…"],
  ["current function call", "С‚РµРєСѓС‰РµРіРѕ РІС‹Р·РѕРІР° С„СѓРЅРєС†РёРё"],
  ["before outer scopes", "РґРѕ РІРЅРµС€РЅРёС… РѕР±Р»Р°СЃС‚РµР№ РІРёРґРёРјРѕСЃС‚Рё"],
  ["enclosing function scope", "РѕС…РІР°С‚С‹РІР°СЋС‰РµР№ РѕР±Р»Р°СЃС‚Рё РІРёРґРёРјРѕСЃС‚Рё С„СѓРЅРєС†РёРё"],
  ["not global", "РєРѕС‚РѕСЂР°СЏ РЅРµ СЏРІР»СЏРµС‚СЃСЏ РіР»РѕР±Р°Р»СЊРЅРѕР№"],
  ["mutable sequence", "РёР·РјРµРЅСЏРµРјР°СЏ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚СЊ"],
  ["ordered collection", "СѓРїРѕСЂСЏРґРѕС‡РµРЅРЅР°СЏ РєРѕР»Р»РµРєС†РёСЏ"],
  ["immutable sequence", "РЅРµРёР·РјРµРЅСЏРµРјР°СЏ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚СЊ"],
  ["key-value pairs", "РїР°СЂС‹ РєР»СЋС‡-Р·РЅР°С‡РµРЅРёРµ"],
  ["hashable keys", "С…РµС€РёСЂСѓРµРјС‹Рµ РєР»СЋС‡Рё"],
  ["preserves insertion order", "СЃРѕС…СЂР°РЅСЏРµС‚ РїРѕСЂСЏРґРѕРє РІСЃС‚Р°РІРєРё"],
  ["unique hashable elements", "СѓРЅРёРєР°Р»СЊРЅС‹Рµ С…РµС€РёСЂСѓРµРјС‹Рµ СЌР»РµРјРµРЅС‚С‹"],
  ["text sequence", "С‚РµРєСЃС‚РѕРІР°СЏ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚СЊ"],
  ["extracts part of a sequence", "РёР·РІР»РµРєР°РµС‚ С‡Р°СЃС‚СЊ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚Рё"],
  ["compact way to build a list", "РєРѕСЂРѕС‚РєРёР№ СЃРїРѕСЃРѕР± СЃРѕР·РґР°С‚СЊ СЃРїРёСЃРѕРє"],
  ["lazy iterator", "Р»РµРЅРёРІС‹Р№ РёС‚РµСЂР°С‚РѕСЂ"],
  ["shallow copy", "РїРѕРІРµСЂС…РЅРѕСЃС‚РЅР°СЏ РєРѕРїРёСЏ"],
  ["deep copy", "РіР»СѓР±РѕРєР°СЏ РєРѕРїРёСЏ"],
  ["same nested objects", "С‚Рµ Р¶Рµ РІР»РѕР¶РµРЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹"],
  ["recursively copies nested objects", "СЂРµРєСѓСЂСЃРёРІРЅРѕ РєРѕРїРёСЂСѓРµС‚ РІР»РѕР¶РµРЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹"],
  ["next value", "СЃР»РµРґСѓСЋС‰РµРµ Р·РЅР°С‡РµРЅРёРµ"],
  ["can be looped over", "РјРѕР¶РЅРѕ РїРµСЂРµР±РёСЂР°С‚СЊ РІ С†РёРєР»Рµ"],
  ["by position", "РїРѕ РїРѕР·РёС†РёРё"],
  ["adds one item", "РґРѕР±Р°РІР»СЏРµС‚ РѕРґРёРЅ СЌР»РµРјРµРЅС‚"],
  ["adds all items", "РґРѕР±Р°РІР»СЏРµС‚ РІСЃРµ СЌР»РµРјРµРЅС‚С‹"],
  ["default value", "Р·РЅР°С‡РµРЅРёРµ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ"],
  ["set union", "РѕР±СЉРµРґРёРЅРµРЅРёРµ РјРЅРѕР¶РµСЃС‚РІ"],
  ["set intersection", "РїРµСЂРµСЃРµС‡РµРЅРёРµ РјРЅРѕР¶РµСЃС‚РІ"],
  ["cannot be changed after creation", "РЅРµР»СЊР·СЏ РёР·РјРµРЅРёС‚СЊ РїРѕСЃР»Рµ СЃРѕР·РґР°РЅРёСЏ"],
  ["can be used as a dict key", "РјРѕР¶РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РєР°Рє РєР»СЋС‡ СЃР»РѕРІР°СЂСЏ"],
  ["conditional branches", "СѓСЃР»РѕРІРЅС‹Рµ РІРµС‚РєРё"],
  ["repeats for each item", "РїРѕРІС‚РѕСЂСЏРµС‚СЃСЏ РґР»СЏ РєР°Р¶РґРѕРіРѕ СЌР»РµРјРµРЅС‚Р°"],
  ["repeats while a condition is true", "РїРѕРІС‚РѕСЂСЏРµС‚СЃСЏ, РїРѕРєР° СѓСЃР»РѕРІРёРµ РёСЃС‚РёРЅРЅРѕ"],
  ["exits the nearest loop", "РІС‹С…РѕРґРёС‚ РёР· Р±Р»РёР¶Р°Р№С€РµРіРѕ С†РёРєР»Р°"],
  ["skips to the next iteration", "РїРµСЂРµС…РѕРґРёС‚ Рє СЃР»РµРґСѓСЋС‰РµР№ РёС‚РµСЂР°С†РёРё"],
  ["does nothing", "РЅРёС‡РµРіРѕ РЅРµ РґРµР»Р°РµС‚"],
  ["defines reusable code", "РѕРїСЂРµРґРµР»СЏРµС‚ РїРµСЂРµРёСЃРїРѕР»СЊР·СѓРµРјС‹Р№ РєРѕРґ"],
  ["sends a value back to the caller", "РѕС‚РїСЂР°РІР»СЏРµС‚ Р·РЅР°С‡РµРЅРёРµ РІС‹Р·С‹РІР°СЋС‰РµРјСѓ РєРѕРґСѓ"],
  ["pauses execution", "РїСЂРёРѕСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ РІС‹РїРѕР»РЅРµРЅРёРµ"],
  ["anonymous function", "Р°РЅРѕРЅРёРјРЅР°СЏ С„СѓРЅРєС†РёСЏ"],
  ["positional arguments", "РїРѕР·РёС†РёРѕРЅРЅС‹Рµ Р°СЂРіСѓРјРµРЅС‚С‹"],
  ["keyword arguments", "РёРјРµРЅРѕРІР°РЅРЅС‹Рµ Р°СЂРіСѓРјРµРЅС‚С‹"],
  ["evaluated once when the function is defined", "РІС‹С‡РёСЃР»СЏРµС‚СЃСЏ РѕРґРёРЅ СЂР°Р· РїСЂРё РѕРїСЂРµРґРµР»РµРЅРёРё С„СѓРЅРєС†РёРё"],
  ["function calls itself", "С„СѓРЅРєС†РёСЏ РІС‹Р·С‹РІР°РµС‚ СЃР°РјСѓ СЃРµР±СЏ"],
  ["wraps or modifies another function", "РѕР±РѕСЂР°С‡РёРІР°РµС‚ РёР»Рё РёР·РјРµРЅСЏРµС‚ РґСЂСѓРіСѓСЋ С„СѓРЅРєС†РёСЋ"],
  ["function as an argument", "С„СѓРЅРєС†РёСЋ РєР°Рє Р°СЂРіСѓРјРµРЅС‚"],
  ["returns a function as a result", "РІРѕР·РІСЂР°С‰Р°РµС‚ С„СѓРЅРєС†РёСЋ РєР°Рє СЂРµР·СѓР»СЊС‚Р°С‚"],
  ["captures variables from an enclosing scope", "Р·Р°С…РІР°С‚С‹РІР°РµС‚ РїРµСЂРµРјРµРЅРЅС‹Рµ РёР· РІРЅРµС€РЅРµР№ РѕР±Р»Р°СЃС‚Рё РІРёРґРёРјРѕСЃС‚Рё"],
  ["Applies a callable", "РџСЂРёРјРµРЅСЏРµС‚ РІС‹Р·С‹РІР°РµРјС‹Р№ РѕР±СЉРµРєС‚"],
  ["Keeps items", "РћСЃС‚Р°РІР»СЏРµС‚ СЌР»РµРјРµРЅС‚С‹"],
  ["class is a blueprint", "РєР»Р°СЃСЃ СЏРІР»СЏРµС‚СЃСЏ С‡РµСЂС‚РµР¶РѕРј"],
  ["object is an instance", "РѕР±СЉРµРєС‚ СЏРІР»СЏРµС‚СЃСЏ СЌРєР·РµРјРїР»СЏСЂРѕРј"],
  ["constructor-like initializer", "РёРЅРёС†РёР°Р»РёР·Р°С‚РѕСЂ, РїРѕС…РѕР¶РёР№ РЅР° РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ"],
  ["current instance", "С‚РµРєСѓС‰РёР№ СЌРєР·РµРјРїР»СЏСЂ"],
  ["shared by all instances", "РѕР±С‰РёР№ РґР»СЏ РІСЃРµС… СЌРєР·РµРјРїР»СЏСЂРѕРІ"],
  ["reuse behavior from a parent class", "РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РїРѕРІРµРґРµРЅРёРµ СЂРѕРґРёС‚РµР»СЊСЃРєРѕРіРѕ РєР»Р°СЃСЃР°"],
  ["same interface", "РѕРґРёРЅ Рё С‚РѕС‚ Р¶Рµ РёРЅС‚РµСЂС„РµР№СЃ"],
  ["hide implementation details", "СЃРєСЂС‹РІР°С‚СЊ РґРµС‚Р°Р»Рё СЂРµР°Р»РёР·Р°С†РёРё"],
  ["essential behavior", "СЃСѓС‰РµСЃС‚РІРµРЅРЅРѕРµ РїРѕРІРµРґРµРЅРёРµ"],
  ["method bound to the class", "РјРµС‚РѕРґ, РїСЂРёРІСЏР·Р°РЅРЅС‹Р№ Рє РєР»Р°СЃСЃСѓ"],
  ["method that does not receive self or cls automatically", "РјРµС‚РѕРґ, РєРѕС‚РѕСЂС‹Р№ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РЅРµ РїРѕР»СѓС‡Р°РµС‚ self РёР»Рё cls"],
  ["handles exceptions", "РѕР±СЂР°Р±Р°С‚С‹РІР°РµС‚ РёСЃРєР»СЋС‡РµРЅРёСЏ"],
  ["always runs after try/except", "РІСЃРµРіРґР° РІС‹РїРѕР»РЅСЏРµС‚СЃСЏ РїРѕСЃР»Рµ try/except"],
  ["raises an exception", "СЃРѕР·РґР°РµС‚ РёСЃРєР»СЋС‡РµРЅРёРµ"],
  ["manages setup and cleanup", "СѓРїСЂР°РІР»СЏРµС‚ РїРѕРґРіРѕС‚РѕРІРєРѕР№ Рё РѕС‡РёСЃС‚РєРѕР№"],
  ["object-oriented paths", "РѕР±СЉРµРєС‚РЅРѕ-РѕСЂРёРµРЅС‚РёСЂРѕРІР°РЅРЅС‹Рµ РїСѓС‚Рё"],
  ["operating-system functions", "С„СѓРЅРєС†РёРё РѕРїРµСЂР°С†РёРѕРЅРЅРѕР№ СЃРёСЃС‚РµРјС‹"],
  ["installs and manages Python packages", "СѓСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ Рё СѓРїСЂР°РІР»СЏРµС‚ РїР°РєРµС‚Р°РјРё Python"],
  ["continuous integration", "РЅРµРїСЂРµСЂС‹РІРЅР°СЏ РёРЅС‚РµРіСЂР°С†РёСЏ"],
  ["continuous delivery", "РЅРµРїСЂРµСЂС‹РІРЅР°СЏ РґРѕСЃС‚Р°РІРєР°"],
  ["continuous deployment", "РЅРµРїСЂРµСЂС‹РІРЅРѕРµ СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёРµ"],
  ["blue-green deployment", "blue-green СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёРµ"],
  ["canary deployment", "canary СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёРµ"],
  ["feature flag", "С„РёС‡Р°-С„Р»Р°Рі"],
  ["infrastructure as code", "РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР° РєР°Рє РєРѕРґ"],
  ["configuration drift", "РґСЂРµР№С„ РєРѕРЅС„РёРіСѓСЂР°С†РёРё"],
  ["immutable infrastructure", "РЅРµРёР·РјРµРЅСЏРµРјР°СЏ РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°"],
  ["source control", "РєРѕРЅС‚СЂРѕР»СЊ РІРµСЂСЃРёР№"],
  ["environment variable", "РїРµСЂРµРјРµРЅРЅР°СЏ РѕРєСЂСѓР¶РµРЅРёСЏ"],
  ["merge conflict", "РєРѕРЅС„Р»РёРєС‚ СЃР»РёСЏРЅРёСЏ"],
  ["semantic versioning", "СЃРµРјР°РЅС‚РёС‡РµСЃРєРѕРµ РІРµСЂСЃРёРѕРЅРёСЂРѕРІР°РЅРёРµ"],
  ["pull request", "pull request"],
  ["image layer", "СЃР»РѕР№ РѕР±СЂР°Р·Р°"],
  ["bind mount", "bind mount"],
  ["Docker Compose", "Docker Compose"],
  ["Kubernetes pod", "pod Kubernetes"],
  ["liveness probe", "liveness probe"],
  ["readiness probe", "readiness probe"],
  ["rolling update", "rolling update"],
  ["load balancer", "Р±Р°Р»Р°РЅСЃРёСЂРѕРІС‰РёРє РЅР°РіСЂСѓР·РєРё"],
  ["reverse proxy", "РѕР±СЂР°С‚РЅС‹Р№ РїСЂРѕРєСЃРё"],
  ["horizontal scaling", "РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРµ РјР°СЃС€С‚Р°Р±РёСЂРѕРІР°РЅРёРµ"],
  ["vertical scaling", "РІРµСЂС‚РёРєР°Р»СЊРЅРѕРµ РјР°СЃС€С‚Р°Р±РёСЂРѕРІР°РЅРёРµ"],
  ["availability zone", "Р·РѕРЅР° РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё"],
  ["object storage", "РѕР±СЉРµРєС‚РЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ"],
  ["message queue", "РѕС‡РµСЂРµРґСЊ СЃРѕРѕР±С‰РµРЅРёР№"],
  ["event-driven architecture", "СЃРѕР±С‹С‚РёР№РЅР°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР°"],
  ["health check", "РїСЂРѕРІРµСЂРєР° Р·РґРѕСЂРѕРІСЊСЏ"],
  ["computer network", "РєРѕРјРїСЊСЋС‚РµСЂРЅР°СЏ СЃРµС‚СЊ"],
  ["OSI model", "РјРѕРґРµР»СЊ OSI"],
  ["TCP/IP model", "РјРѕРґРµР»СЊ TCP/IP"],
  ["physical layer", "С„РёР·РёС‡РµСЃРєРёР№ СѓСЂРѕРІРµРЅСЊ"],
  ["data link layer", "РєР°РЅР°Р»СЊРЅС‹Р№ СѓСЂРѕРІРµРЅСЊ"],
  ["network layer", "СЃРµС‚РµРІРѕР№ СѓСЂРѕРІРµРЅСЊ"],
  ["transport layer", "С‚СЂР°РЅСЃРїРѕСЂС‚РЅС‹Р№ СѓСЂРѕРІРµРЅСЊ"],
  ["session layer", "СЃРµР°РЅСЃРѕРІС‹Р№ СѓСЂРѕРІРµРЅСЊ"],
  ["presentation layer", "СѓСЂРѕРІРµРЅСЊ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёСЏ"],
  ["application layer", "РїСЂРёРєР»Р°РґРЅРѕР№ СѓСЂРѕРІРµРЅСЊ"],
  ["MAC address", "MAC-Р°РґСЂРµСЃ"],
  ["IP address", "IP-Р°РґСЂРµСЃ"],
  ["port number", "РЅРѕРјРµСЂ РїРѕСЂС‚Р°"],
  ["subnet mask", "РјР°СЃРєР° РїРѕРґСЃРµС‚Рё"],
  ["CIDR notation", "CIDR-РЅРѕС‚Р°С†РёСЏ"],
  ["network address", "Р°РґСЂРµСЃ СЃРµС‚Рё"],
  ["broadcast address", "С€РёСЂРѕРєРѕРІРµС‰Р°С‚РµР»СЊРЅС‹Р№ Р°РґСЂРµСЃ"],
  ["default gateway", "С€Р»СЋР· РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ"],
  ["private IPv4 address", "С‡Р°СЃС‚РЅС‹Р№ IPv4-Р°РґСЂРµСЃ"],
  ["public IP address", "РїСѓР±Р»РёС‡РЅС‹Р№ IP-Р°РґСЂРµСЃ"],
  ["loopback address", "loopback-Р°РґСЂРµСЃ"],
  ["ARP cache", "ARP-РєРµС€"],
  ["proxy server", "РїСЂРѕРєСЃРё-СЃРµСЂРІРµСЂ"],
  ["collision domain", "РґРѕРјРµРЅ РєРѕР»Р»РёР·РёР№"],
  ["broadcast domain", "С€РёСЂРѕРєРѕРІРµС‰Р°С‚РµР»СЊРЅС‹Р№ РґРѕРјРµРЅ"],
  ["sliding window", "СЃРєРѕР»СЊР·СЏС‰РµРµ РѕРєРЅРѕ"],
  ["selective repeat", "РІС‹Р±РѕСЂРѕС‡РЅРѕРµ РїРѕРІС‚РѕСЂРµРЅРёРµ"],
  ["token bucket", "token bucket"],
  ["leaky bucket", "leaky bucket"],
  ["flow control", "СѓРїСЂР°РІР»РµРЅРёРµ РїРѕС‚РѕРєРѕРј"],
  ["link aggregation", "Р°РіСЂРµРіР°С†РёСЏ РєР°РЅР°Р»РѕРІ"],
  ["authentication", "Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ"],
  ["encryption", "С€РёС„СЂРѕРІР°РЅРёРµ"]
].sort((a, b) => b[0].length - a[0].length);

const RU_WORDS = [
  ["statement", "СѓС‚РІРµСЂР¶РґРµРЅРёРµ"],
  ["technically", "С‚РµС…РЅРёС‡РµСЃРєРё"],
  ["correct", "РІРµСЂРЅРѕ"],
  ["accurately", "С‚РѕС‡РЅРѕ"],
  ["describes", "РѕРїРёСЃС‹РІР°РµС‚"],
  ["about", "Рѕ"],
  ["best", "Р»СѓС‡С€Рµ РІСЃРµРіРѕ"],
  ["difference", "СЂР°Р·РЅРёС†Р°"],
  ["printed", "РЅР°РїРµС‡Р°С‚Р°РЅРѕ"],
  ["returns", "РІРѕР·РІСЂР°С‰Р°РµС‚"],
  ["return", "РІРѕР·РІСЂР°С‰Р°РµС‚"],
  ["writes", "Р·Р°РїРёСЃС‹РІР°РµС‚"],
  ["reads", "С‡РёС‚Р°РµС‚"],
  ["creates", "СЃРѕР·РґР°РµС‚"],
  ["checks", "РїСЂРѕРІРµСЂСЏРµС‚"],
  ["adds", "РґРѕР±Р°РІР»СЏРµС‚"],
  ["represents", "РїСЂРµРґСЃС‚Р°РІР»СЏРµС‚"],
  ["combines", "РѕР±СЉРµРґРёРЅСЏРµС‚"],
  ["produces", "СЃРѕР·РґР°РµС‚"],
  ["defines", "РѕРїСЂРµРґРµР»СЏРµС‚"],
  ["exposes", "РїРѕРєР°Р·С‹РІР°РµС‚"],
  ["lets", "РїРѕР·РІРѕР»СЏРµС‚"],
  ["stores", "С…СЂР°РЅРёС‚"],
  ["keeps", "РґРµСЂР¶РёС‚"],
  ["separates", "СЂР°Р·РґРµР»СЏРµС‚"],
  ["manages", "СѓРїСЂР°РІР»СЏРµС‚"],
  ["switches", "РїРµСЂРµРєР»СЋС‡Р°РµС‚"],
  ["prioritizes", "РїСЂРёРѕСЂРёС‚РёР·РёСЂСѓРµС‚"],
  ["detects", "РѕР±РЅР°СЂСѓР¶РёРІР°РµС‚"],
  ["forwards", "РїРµСЂРµСЃС‹Р»Р°РµС‚"],
  ["routes", "РјР°СЂС€СЂСѓС‚РёР·РёСЂСѓРµС‚"],
  ["transfers", "РїРµСЂРµРґР°РµС‚"],
  ["connects", "СЃРѕРµРґРёРЅСЏРµС‚"],
  ["identifies", "РёРґРµРЅС‚РёС„РёС†РёСЂСѓРµС‚"],
  ["provides", "РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚"],
  ["allows", "РїРѕР·РІРѕР»СЏРµС‚"],
  ["prevents", "РїСЂРµРґРѕС‚РІСЂР°С‰Р°РµС‚"],
  ["contains", "СЃРѕРґРµСЂР¶РёС‚"],
  ["groups", "РіСЂСѓРїРїРёСЂСѓРµС‚"],
  ["controls", "РєРѕРЅС‚СЂРѕР»РёСЂСѓРµС‚"],
  ["replaces", "Р·Р°РјРµРЅСЏРµС‚"],
  ["distributes", "СЂР°СЃРїСЂРµРґРµР»СЏРµС‚"],
  ["caches", "РєРµС€РёСЂСѓРµС‚"],
  ["buffers", "Р±СѓС„РµСЂРёР·СѓРµС‚"],
  ["specifies", "Р·Р°РґР°РµС‚"],
  ["monitors", "РјРѕРЅРёС‚РѕСЂРёС‚"],
  ["synchronizes", "СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓРµС‚"],
  ["retrieves", "РїРѕР»СѓС‡Р°РµС‚"],
  ["resolves", "СЂР°Р·СЂРµС€Р°РµС‚"],
  ["retransmits", "РїРѕРІС‚РѕСЂРЅРѕ РїРµСЂРµРґР°РµС‚"],
  ["transforms", "РїСЂРµРѕР±СЂР°Р·СѓРµС‚"],
  ["verifies", "РїСЂРѕРІРµСЂСЏРµС‚"],
  ["encrypts", "С€РёС„СЂСѓРµС‚"],
  ["pairs", "СЃРІСЏР·С‹РІР°РµС‚"],
  ["while", "РїСЂРё СЌС‚РѕРј"],
  ["and", "Рё"],
  ["or", "РёР»Рё"],
  ["with", "СЃ"],
  ["without", "Р±РµР·"],
  ["using", "РёСЃРїРѕР»СЊР·СѓСЏ"],
  ["according", "СЃРѕРіР»Р°СЃРЅРѕ"],
  ["based", "РѕСЃРЅРѕРІР°РЅРЅС‹Р№"],
  ["across", "С‡РµСЂРµР·"],
  ["within", "РІРЅСѓС‚СЂРё"],
  ["toward", "Рє"],
  ["instead", "РІРјРµСЃС‚Рѕ"],
  ["all", "РІСЃРµ"],
  ["every", "РєР°Р¶РґС‹Р№"],
  ["many", "РјРЅРѕРіРёРµ"],
  ["more", "Р±РѕР»СЊС€Рµ"],
  ["less", "РјРµРЅСЊС€Рµ"],
  ["no", "РЅРµС‚"],
  ["blocks", "Р±Р»РѕРєРёСЂСѓРµС‚"],
  ["configured", "РЅР°СЃС‚СЂРѕРµРЅРЅС‹Р№"],
  ["learned", "РёР·СѓС‡РµРЅРЅС‹Р№"],
  ["dedicated", "РІС‹РґРµР»РµРЅРЅС‹Р№"],
  ["activity", "Р°РєС‚РёРІРЅРѕСЃС‚СЊ"],
  ["alerts", "РѕРїРѕРІРµС‰Р°РµС‚"],
  ["actively", "Р°РєС‚РёРІРЅРѕ"],
  ["necessarily", "РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ"],
  ["sender", "РѕС‚РїСЂР°РІРёС‚РµР»СЊ"],
  ["receiver", "РїРѕР»СѓС‡Р°С‚РµР»СЊ"],
  ["host", "С…РѕСЃС‚"],
  ["hosts", "С…РѕСЃС‚С‹"],
  ["through", "С‡РµСЂРµР·"],
  ["between", "РјРµР¶РґСѓ"],
  ["inside", "РІРЅСѓС‚СЂРё"],
  ["outside", "СЃРЅР°СЂСѓР¶Рё"],
  ["before", "РґРѕ"],
  ["after", "РїРѕСЃР»Рµ"],
  ["during", "РІРѕ РІСЂРµРјСЏ"],
  ["rather", "Р° РЅРµ"],
  ["only", "С‚РѕР»СЊРєРѕ"],
  ["same", "С‚РѕС‚ Р¶Рµ"],
  ["different", "СЂР°Р·РЅС‹Р№"],
  ["selected", "РІС‹Р±СЂР°РЅРЅС‹С…"],
  ["known", "РёР·РІРµСЃС‚РЅС‹С…"],
  ["unknown", "РЅРµРёР·РІРµСЃС‚РЅС‹С…"],
  ["remote", "СѓРґР°Р»РµРЅРЅС‹Р№"],
  ["local", "Р»РѕРєР°Р»СЊРЅС‹Р№"],
  ["shared", "РѕР±С‰РёР№"],
  ["stable", "СЃС‚Р°Р±РёР»СЊРЅС‹Р№"],
  ["logical", "Р»РѕРіРёС‡РµСЃРєРёР№"],
  ["physical", "С„РёР·РёС‡РµСЃРєРёР№"],
  ["virtual", "РІРёСЂС‚СѓР°Р»СЊРЅС‹Р№"],
  ["external", "РІРЅРµС€РЅРёР№"],
  ["internal", "РІРЅСѓС‚СЂРµРЅРЅРёР№"],
  ["automated", "Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°РЅРЅС‹Р№"],
  ["ordered", "СѓРїРѕСЂСЏРґРѕС‡РµРЅРЅС‹Р№"],
  ["releasable", "РіРѕС‚РѕРІС‹Р№ Рє СЂРµР»РёР·Сѓ"],
  ["manual", "СЂСѓС‡РЅРѕР№"],
  ["faulty", "РѕС€РёР±РѕС‡РЅС‹Р№"],
  ["sensitive", "С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹Р№"],
  ["incoming", "РІС…РѕРґСЏС‰РёР№"],
  ["outgoing", "РёСЃС…РѕРґСЏС‰РёР№"],
  ["redundant", "СЂРµР·РµСЂРІРЅС‹Р№"],
  ["missing", "РѕС‚СЃСѓС‚СЃС‚РІСѓСЋС‰РёР№"],
  ["damaged", "РїРѕРІСЂРµР¶РґРµРЅРЅС‹Р№"],
  ["suspicious", "РїРѕРґРѕР·СЂРёС‚РµР»СЊРЅС‹Р№"],
  ["nearby", "Р±Р»РёР·Р»РµР¶Р°С‰РёР№"],
  ["wireless", "Р±РµСЃРїСЂРѕРІРѕРґРЅРѕР№"],
  ["wired", "РїСЂРѕРІРѕРґРЅРѕР№"],
  ["larger", "Р±РѕР»СЊС€РёР№"],
  ["smaller", "РјРµРЅСЊС€РёР№"],
  ["greater", "Р±РѕР»СЊС€РёР№"],
  ["newer", "Р±РѕР»РµРµ РЅРѕРІС‹Р№"],
  ["older", "Р±РѕР»РµРµ СЃС‚Р°СЂС‹Р№"],
  ["current", "С‚РµРєСѓС‰РёР№"],
  ["previous", "РїСЂРµРґС‹РґСѓС‰РёР№"],
  ["final", "РёС‚РѕРіРѕРІС‹Р№"],
  ["average", "СЃСЂРµРґРЅРёР№"],
  ["traffic", "С‚СЂР°С„РёРє"],
  ["users", "РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№"],
  ["environments", "РѕРєСЂСѓР¶РµРЅРёР№"],
  ["environment", "РѕРєСЂСѓР¶РµРЅРёРµ"],
  ["details", "РґРµС‚Р°Р»Рё"],
  ["callers", "РІС‹Р·С‹РІР°СЋС‰РµРјСѓ РєРѕРґСѓ"],
  ["requirements", "С‚СЂРµР±РѕРІР°РЅРёСЏ"],
  ["stages", "СЌС‚Р°РїС‹"],
  ["signals", "СЃРёРіРЅР°Р»С‹"],
  ["logs", "Р»РѕРіРё"],
  ["metrics", "РјРµС‚СЂРёРєРё"],
  ["traces", "С‚СЂРµР№СЃС‹"],
  ["telemetry", "С‚РµР»РµРјРµС‚СЂРёСЏ"],
  ["behavior", "РїРѕРІРµРґРµРЅРёРµ"],
  ["release", "СЂРµР»РёР·"],
  ["version", "РІРµСЂСЃРёСЏ"],
  ["versions", "РІРµСЂСЃРёРё"],
  ["server", "СЃРµСЂРІРµСЂ"],
  ["servers", "СЃРµСЂРІРµСЂС‹"],
  ["client", "РєР»РёРµРЅС‚"],
  ["clients", "РєР»РёРµРЅС‚С‹"],
  ["request", "Р·Р°РїСЂРѕСЃ"],
  ["requests", "Р·Р°РїСЂРѕСЃС‹"],
  ["response", "РѕС‚РІРµС‚"],
  ["addresses", "Р°РґСЂРµСЃР°"],
  ["address", "Р°РґСЂРµСЃ"],
  ["ports", "РїРѕСЂС‚С‹"],
  ["rules", "РїСЂР°РІРёР»Р°"],
  ["headers", "Р·Р°РіРѕР»РѕРІРєРё"],
  ["trailers", "С‚СЂРµР№Р»РµСЂС‹"],
  ["bits", "Р±РёС‚С‹"],
  ["bytes", "Р±Р°Р№С‚С‹"],
  ["frames", "РєР°РґСЂС‹"],
  ["packets", "РїР°РєРµС‚С‹"],
  ["segments", "СЃРµРіРјРµРЅС‚С‹"],
  ["acknowledgement", "РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ"],
  ["acknowledgements", "РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ"],
  ["throughput", "РїСЂРѕРїСѓСЃРєРЅР°СЏ СЃРїРѕСЃРѕР±РЅРѕСЃС‚СЊ"],
  ["latency", "Р·Р°РґРµСЂР¶РєР°"],
  ["capacity", "РµРјРєРѕСЃС‚СЊ"],
  ["availability", "РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ"],
  ["consistency", "СЃРѕРіР»Р°СЃРѕРІР°РЅРЅРѕСЃС‚СЊ"],
  ["durability", "РґРѕР»РіРѕРІРµС‡РЅРѕСЃС‚СЊ"],
  ["confidentiality", "РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚СЊ"],
  ["reliability", "РЅР°РґРµР¶РЅРѕСЃС‚СЊ"],
  ["compatibility", "СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚СЊ"],
  ["routing", "РјР°СЂС€СЂСѓС‚РёР·Р°С†РёСЏ"],
  ["switching", "РєРѕРјРјСѓС‚Р°С†РёСЏ"],
  ["forwarding", "РїРµСЂРµСЃС‹Р»РєР°"],
  ["blocking", "Р±Р»РѕРєРёСЂРѕРІРєР°"],
  ["delivery", "РґРѕСЃС‚Р°РІРєР°"],
  ["upload", "Р·Р°РіСЂСѓР·РєР°"],
  ["download", "СЃРєР°С‡РёРІР°РЅРёРµ"],
  ["build", "СЃР±РѕСЂРєР°"],
  ["scan", "СЃРєР°РЅРёСЂРѕРІР°РЅРёРµ"],
  ["deploy", "РґРµРїР»РѕР№"],
  ["package", "РїР°РєРµС‚"],
  ["production", "РїСЂРѕРґР°РєС€РµРЅ"],
  ["review", "СЂРµРІСЊСЋ"],
  ["discussion", "РѕР±СЃСѓР¶РґРµРЅРёРµ"],
  ["approval", "РѕРґРѕР±СЂРµРЅРёРµ"],
  ["gate", "С€Р»СЋР·"],
  ["subset", "РїРѕРґРјРЅРѕР¶РµСЃС‚РІРѕ"],
  ["rollout", "СЂР°СЃРєР°С‚РєР°"],
  ["risk", "СЂРёСЃРє"],
  ["blame", "РІРёРЅР°"],
  ["incident", "РёРЅС†РёРґРµРЅС‚"],
  ["object", "РѕР±СЉРµРєС‚"],
  ["objects", "РѕР±СЉРµРєС‚С‹"],
  ["class", "РєР»Р°СЃСЃ"],
  ["classes", "РєР»Р°СЃСЃС‹"],
  ["tuple", "РєРѕСЂС‚РµР¶"],
  ["list", "СЃРїРёСЃРѕРє"],
  ["dict", "СЃР»РѕРІР°СЂСЊ"],
  ["dictionary", "СЃР»РѕРІР°СЂСЊ"],
  ["set", "РјРЅРѕР¶РµСЃС‚РІРѕ"],
  ["string", "СЃС‚СЂРѕРєР°"],
  ["iterable", "РёС‚РµСЂРёСЂСѓРµРјС‹Р№ РѕР±СЉРµРєС‚"],
  ["iterator", "РёС‚РµСЂР°С‚РѕСЂ"],
  ["value", "Р·РЅР°С‡РµРЅРёРµ"],
  ["values", "Р·РЅР°С‡РµРЅРёСЏ"],
  ["item", "СЌР»РµРјРµРЅС‚"],
  ["items", "СЌР»РµРјРµРЅС‚С‹"],
  ["key", "РєР»СЋС‡"],
  ["function", "С„СѓРЅРєС†РёСЏ"],
  ["callable", "РІС‹Р·С‹РІР°РµРјС‹Р№ РѕР±СЉРµРєС‚"],
  ["argument", "Р°СЂРіСѓРјРµРЅС‚"],
  ["arguments", "Р°СЂРіСѓРјРµРЅС‚С‹"],
  ["variable", "РїРµСЂРµРјРµРЅРЅР°СЏ"],
  ["variables", "РїРµСЂРµРјРµРЅРЅС‹Рµ"],
  ["scope", "РѕР±Р»Р°СЃС‚СЊ РІРёРґРёРјРѕСЃС‚Рё"],
  ["module", "РјРѕРґСѓР»СЊ"],
  ["package", "РїР°РєРµС‚"],
  ["namespace", "РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРѕ РёРјРµРЅ"],
  ["assignment", "РїСЂРёСЃРІР°РёРІР°РЅРёРµ"],
  ["identity", "РёРґРµРЅС‚РёС‡РЅРѕСЃС‚СЊ"],
  ["equality", "СЂР°РІРµРЅСЃС‚РІРѕ"],
  ["truthy", "РёСЃС‚РёРЅРЅС‹Р№"],
  ["falsey", "Р»РѕР¶РЅС‹Р№"],
  ["mutable", "РёР·РјРµРЅСЏРµРјС‹Р№"],
  ["immutable", "РЅРµРёР·РјРµРЅСЏРµРјС‹Р№"],
  ["hashable", "С…РµС€РёСЂСѓРµРјС‹Р№"],
  ["indexing", "РёРЅРґРµРєСЃР°С†РёСЏ"],
  ["slice", "СЃСЂРµР·"],
  ["loop", "С†РёРєР»"],
  ["condition", "СѓСЃР»РѕРІРёРµ"],
  ["execution", "РІС‹РїРѕР»РЅРµРЅРёРµ"],
  ["error", "РѕС€РёР±РєР°"],
  ["errors", "РѕС€РёР±РєРё"],
  ["exception", "РёСЃРєР»СЋС‡РµРЅРёРµ"],
  ["file", "С„Р°Р№Р»"],
  ["files", "С„Р°Р№Р»С‹"],
  ["pipeline", "РїР°Р№РїР»Р°Р№РЅ"],
  ["artifact", "Р°СЂС‚РµС„Р°РєС‚"],
  ["rollback", "РѕС‚РєР°С‚"],
  ["automation", "Р°РІС‚РѕРјР°С‚РёР·Р°С†РёСЏ"],
  ["observability", "РЅР°Р±Р»СЋРґР°РµРјРѕСЃС‚СЊ"],
  ["monitoring", "РјРѕРЅРёС‚РѕСЂРёРЅРі"],
  ["postmortem", "РїРѕСЃС‚РјРѕСЂС‚РµРј"],
  ["container", "РєРѕРЅС‚РµР№РЅРµСЂ"],
  ["containers", "РєРѕРЅС‚РµР№РЅРµСЂС‹"],
  ["image", "РѕР±СЂР°Р·"],
  ["registry", "СЂРµРµСЃС‚СЂ"],
  ["volume", "С‚РѕРј"],
  ["deployment", "СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёРµ"],
  ["service", "СЃРµСЂРІРёСЃ"],
  ["ingress", "ingress"],
  ["namespace", "РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРѕ РёРјРµРЅ"],
  ["secret", "СЃРµРєСЂРµС‚"],
  ["cluster", "РєР»Р°СЃС‚РµСЂ"],
  ["region", "СЂРµРіРёРѕРЅ"],
  ["subnet", "РїРѕРґСЃРµС‚СЊ"],
  ["cache", "РєРµС€"],
  ["microservices", "РјРёРєСЂРѕСЃРµСЂРІРёСЃС‹"],
  ["monolith", "РјРѕРЅРѕР»РёС‚"],
  ["network", "СЃРµС‚СЊ"],
  ["frame", "РєР°РґСЂ"],
  ["packet", "РїР°РєРµС‚"],
  ["segment", "СЃРµРіРјРµРЅС‚"],
  ["datagram", "РґР°С‚Р°РіСЂР°РјРјР°"],
  ["router", "РјР°СЂС€СЂСѓС‚РёР·Р°С‚РѕСЂ"],
  ["switch", "РєРѕРјРјСѓС‚Р°С‚РѕСЂ"],
  ["bridge", "РјРѕСЃС‚"],
  ["hub", "С…Р°Р±"],
  ["firewall", "РјРµР¶СЃРµС‚РµРІРѕР№ СЌРєСЂР°РЅ"],
  ["performance", "РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ"],
  ["security", "Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ"]
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
  if (m) return `РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ РЅР°РёР±РѕР»РµРµ С‚РѕС‡РЅРѕ РѕРїРёСЃС‹РІР°РµС‚ ${applyRuDictionary(m[1])} РІ С‚РµРјРµ "${translateTopicRu(m[2])}"?`;

  m = source.match(/^Which statement most accurately describes (.+?)\?$/i);
  if (m) return `РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ РЅР°РёР±РѕР»РµРµ С‚РѕС‡РЅРѕ РѕРїРёСЃС‹РІР°РµС‚ ${applyRuDictionary(m[1])}?`;

  m = source.match(/^Which statement about (.+?) is technically correct\?$/i);
  if (m) return `РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ Рѕ ${applyRuDictionary(m[1])} С‚РµС…РЅРёС‡РµСЃРєРё РІРµСЂРЅРѕ?`;

  m = source.match(/^Which statement about (.+?) is correct\?$/i);
  if (m) return `РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ Рѕ ${applyRuDictionary(m[1])} РІРµСЂРЅРѕ?`;

  m = source.match(/^(.+?) is mainly related to which area\?$/i);
  if (m) return `${applyRuDictionary(m[1])}: Рє РєР°РєРѕР№ РѕР±Р»Р°СЃС‚Рё СЌС‚Рѕ РІ РѕСЃРЅРѕРІРЅРѕРј РѕС‚РЅРѕСЃРёС‚СЃСЏ?`;

  m = source.match(/^What is (?!printed by|printed after|the result of|the effect of|the main trap in|true about|the safest interpretation of|the role of|a practical difference between|the most)(.+?)\?$/i);
  if (m) return `Р§С‚Рѕ С‚Р°РєРѕРµ ${applyRuDictionary(m[1])}?`;

  m = source.match(/^What exactly is printed by (.+?)\?$/i);
  if (m) return `Р§С‚Рѕ РёРјРµРЅРЅРѕ РЅР°РїРµС‡Р°С‚Р°РµС‚ ${m[1]}?`;

  m = source.match(/^What is printed by (.+?)\?$/i);
  if (m) return `Р§С‚Рѕ РЅР°РїРµС‡Р°С‚Р°РµС‚ ${m[1]}?`;

  m = source.match(/^What is printed after (.+?)\?$/i);
  if (m) return `Р§С‚Рѕ Р±СѓРґРµС‚ РЅР°РїРµС‡Р°С‚Р°РЅРѕ РїРѕСЃР»Рµ ${m[1]}?`;

  m = source.match(/^What is the result of (.+?)\?$/i);
  if (m) return `РљР°РєРѕРІ СЂРµР·СѓР»СЊС‚Р°С‚ ${m[1]}?`;

  m = source.match(/^What is the effect of (.+?)\?$/i);
  if (m) return `РљР°РєРѕР№ СЌС„С„РµРєС‚ Сѓ ${m[1]}?`;

  m = source.match(/^What is the main trap in (.+?)\?$/i);
  if (m) return `Р’ С‡РµРј РіР»Р°РІРЅР°СЏ Р»РѕРІСѓС€РєР° РІ ${m[1]}?`;

  m = source.match(/^What is true about (.+?)\?$/i);
  if (m) return `Р§С‚Рѕ РІРµСЂРЅРѕ Рѕ ${m[1]}?`;

  m = source.match(/^What is the safest interpretation of (.+?)\?$/i);
  if (m) return `РљР°Рє Р±РµР·РѕРїР°СЃРЅРµРµ РІСЃРµРіРѕ РїРѕРЅРёРјР°С‚СЊ ${m[1]}?`;

  m = source.match(/^What is the role of (.+?)\?$/i);
  if (m) return `РљР°РєРѕРІР° СЂРѕР»СЊ ${m[1]}?`;

  m = source.match(/^Which answer best explains why (.+?)\?$/i);
  if (m) return `РљР°РєРѕР№ РѕС‚РІРµС‚ Р»СѓС‡С€Рµ РІСЃРµРіРѕ РѕР±СЉСЏСЃРЅСЏРµС‚, РїРѕС‡РµРјСѓ ${applyRuDictionary(m[1])}?`;

  m = source.match(/^Which answer best distinguishes (.+?) from (.+?)\?$/i);
  if (m) return `РљР°РєРѕР№ РѕС‚РІРµС‚ Р»СѓС‡С€Рµ РІСЃРµРіРѕ РѕС‚Р»РёС‡Р°РµС‚ ${applyRuDictionary(m[1])} РѕС‚ ${applyRuDictionary(m[2])}?`;

  m = source.match(/^Which statement best describes the difference between (.+?) and (.+?)\?$/i);
  if (m) return `РљР°РєРѕРµ СѓС‚РІРµСЂР¶РґРµРЅРёРµ Р»СѓС‡С€Рµ РІСЃРµРіРѕ РѕРїРёСЃС‹РІР°РµС‚ СЂР°Р·РЅРёС†Сѓ РјРµР¶РґСѓ ${applyRuDictionary(m[1])} Рё ${applyRuDictionary(m[2])}?`;

  m = source.match(/^What is a practical difference between (.+?) and (.+?)\?$/i);
  if (m) return `Р’ С‡РµРј РїСЂР°РєС‚РёС‡РµСЃРєР°СЏ СЂР°Р·РЅРёС†Р° РјРµР¶РґСѓ ${applyRuDictionary(m[1])} Рё ${applyRuDictionary(m[2])}?`;

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
  translateBtn.textContent = translateRu ? "RU: РІРєР»" : "RU: РІС‹РєР»";
  translateBtn.title = translateRu
    ? "РџРѕРєР°Р·С‹РІР°РµС‚СЃСЏ СЂСѓСЃСЃРєРёР№ РїРµСЂРµРІРѕРґ СЃ РєРµС€РµРј. РџСЂРѕРІРµСЂРєР° РѕС‚РІРµС‚РѕРІ РёРґРµС‚ РїРѕ РѕСЂРёРіРёРЅР°Р»Сѓ."
    : "Р’РєР»СЋС‡РёС‚СЊ СЂСѓСЃСЃРєРёР№ РІР°СЂРёР°РЅС‚ РІРѕРїСЂРѕСЃРѕРІ Рё РѕС‚РІРµС‚РѕРІ.";
}

function ensureMicGateUI(){
  let overlay = document.getElementById("micGate");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "micGate";
  overlay.className = "auth-gate mic-gate is-visible";
  overlay.innerHTML = `
    <section class="auth-card mic-gate__card">
      <div>
        <p class="eyebrow">\u0413\u0435\u043d\u0435\u0440\u0430\u043b\u044c\u0441\u043a\u0430\u044f \u0441\u0432\u044f\u0437\u044c</p>
        <h2>\u041d\u0443\u0436\u0435\u043d \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d</h2>
        <p class="muted small">\u0411\u0435\u0437 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443 \u0432\u0445\u043e\u0434 \u043d\u0430 \u0441\u0430\u0439\u0442 \u0437\u0430\u043a\u0440\u044b\u0442: \u0433\u0435\u043d\u0435\u0440\u0430\u043b \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043b\u044b\u0448\u0430\u0442\u044c \u0442\u0432\u043e\u0438 \u043e\u0442\u0432\u0435\u0442\u044b.</p>
      </div>
      <button id="micGateAllow" type="button">\u0414\u0430\u0442\u044c \u0434\u043e\u0441\u0442\u0443\u043f</button>
      <div id="micGateError" class="auth-error" role="alert"></div>
      <div class="auth-rules">\u0415\u0441\u043b\u0438 \u0443\u0436\u0435 \u0437\u0430\u043f\u0440\u0435\u0442\u0438\u043b, \u043e\u0442\u043a\u0440\u043e\u0439 \u0437\u0430\u043c\u043e\u043a \u0432 \u0430\u0434\u0440\u0435\u0441\u043d\u043e\u0439 \u0441\u0442\u0440\u043e\u043a\u0435 \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0438 \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d.</div>
    </section>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

async function getMicrophonePermissionState(){
  try {
    if (!navigator.permissions?.query) return "";
    const status = await navigator.permissions.query({ name: "microphone" });
    return status?.state || "";
  } catch {
    return "";
  }
}

async function requireMicrophoneAccess(){
  if (microphoneAccessGranted) return true;
  const overlay = ensureMicGateUI();
  const button = overlay.querySelector("#micGateAllow");
  const errorBox = overlay.querySelector("#micGateError");

  if (!navigator.mediaDevices?.getUserMedia) {
    if (errorBox) {
      errorBox.textContent = "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043d\u0435 \u0434\u0430\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443. \u041d\u0443\u0436\u0435\u043d HTTPS \u0438\u043b\u0438 localhost.";
    }
    return false;
  }

  const state = await getMicrophonePermissionState();
  if (state === "granted") {
    microphoneAccessGranted = true;
    overlay.classList.remove("is-visible");
    return true;
  }

  return new Promise(resolve => {
    const requestAccess = async () => {
      if (errorBox) errorBox.textContent = "";
      if (button) button.disabled = true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        microphoneAccessGranted = true;
        overlay.classList.remove("is-visible");
        resolve(true);
      } catch (error) {
        console.warn("[mic] permission denied:", error);
        if (errorBox) {
          errorBox.textContent = "\u0414\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443 \u043d\u0435 \u0434\u0430\u043d. \u0411\u0435\u0437 \u043d\u0435\u0433\u043e \u0441\u0430\u0439\u0442 \u043d\u0435 \u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0441\u044f.";
        }
      } finally {
        if (button) button.disabled = false;
      }
    };
    button?.addEventListener("click", requestAccess);
  });
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
        <h2>Р’С…РѕРґ РѕР±СЏР·Р°С‚РµР»РµРЅ</h2>
        <p class="muted small">Р—Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№СЃСЏ РёР»Рё РІРѕР№РґРё, С‡С‚РѕР±С‹ СЂРµР·СѓР»СЊС‚Р°С‚С‹ С€Р»Рё РІ Р»РёРґРµСЂР±РѕСЂРґ.</p>
      </div>
      <div class="auth-tabs">
        <button type="button" class="is-active" data-auth-mode="login">Р’С…РѕРґ</button>
        <button type="button" data-auth-mode="register">Р РµРіРёСЃС‚СЂР°С†РёСЏ</button>
      </div>
      <form id="authForm" class="auth-form">
        <label>
          <span>Р›РѕРіРёРЅ</span>
          <input id="authUsername" autocomplete="username" required minlength="3" maxlength="20" placeholder="user_01">
        </label>
        <label>
          <span>РџР°СЂРѕР»СЊ</span>
          <input id="authPassword" type="password" autocomplete="current-password" required minlength="4" placeholder="РјРёРЅРёРјСѓРј 4 СЃРёРјРІРѕР»Р°">
        </label>
        <button id="authSubmit" type="submit">Р’РѕР№С‚Рё</button>
        <div id="authError" class="auth-error" role="alert"></div>
      </form>
      <div class="auth-rules">Р›РѕРіРёРЅ: 3-20 СЃРёРјРІРѕР»РѕРІ, Р»Р°С‚РёРЅРёС†Р°/С†РёС„СЂС‹/_/-.</div>
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
      submit.textContent = mode === "login" ? "Р’РѕР№С‚Рё" : "РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚";
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
        username_invalid: "Р›РѕРіРёРЅ: 3-20 СЃРёРјРІРѕР»РѕРІ, Р»Р°С‚РёРЅРёС†Р°/С†РёС„СЂС‹/_/-.",
        password_invalid: "РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РѕС‚ 4 РґРѕ 80 СЃРёРјРІРѕР»РѕРІ.",
        username_taken: "РўР°РєРѕР№ Р»РѕРіРёРЅ СѓР¶Рµ Р·Р°РЅСЏС‚.",
        invalid_login: "РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ.",
      };
      errorBox.textContent = map[error.message] || "РќРµ РїРѕР»СѓС‡РёР»РѕСЃСЊ РІРѕР№С‚Рё. РџСЂРѕРІРµСЂСЊ РґР°РЅРЅС‹Рµ.";
    } finally {
      submit.disabled = false;
    }
  });

  return overlay;
}

function applyAuthState(data){
  currentUser = data?.user || null;
  leaderboardRowsCache = Array.isArray(data?.leaderboard) ? data.leaderboard : leaderboardRowsCache;
  loadCoachTheme();
  loadServerCoachMemory();
  restoreActiveTest();
  renderUserBadge();
  renderLeaderboard();
  updateCoachToggleUI();
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
        <h2>Р›РёРґРµСЂР±РѕСЂРґ</h2>
        <button id="leaderboardClose" type="button" class="analytics-modal__close">Г—</button>
      </div>
      <div id="leaderboardUser" class="leaderboard-user"></div>
      <div id="leaderboardRows" class="leaderboard-rows"></div>
      <button id="logoutBtn" type="button" class="secondary" style="width:100%;margin-top:12px;">Р’С‹Р№С‚Рё</button>
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
      ? `<strong>${escapeHtml(currentUser.username)}</strong><span>EXP: ${Number(userStats.exp || 0)} В· РўРµСЃС‚РѕРІ: ${Number(userStats.testsCompleted || 0)} В· Best: ${Number(userStats.bestPercent || 0)}%</span>`
      : "";
  }

  if (!rowsBox) return;
  if (!leaderboardRowsCache.length){
    rowsBox.innerHTML = `<div class="muted small">РџРѕРєР° РїСѓСЃС‚Рѕ. РџСЂРѕР№РґРё С‚РµСЃС‚ РїРµСЂРІС‹Рј.</div>`;
    return;
  }

  rowsBox.innerHTML = leaderboardRowsCache.map(row => `
    <div class="leaderboard-row ${currentUser?.username === row.username ? "is-me" : ""}">
      <span>${row.rank}</span>
      <strong>${escapeHtml(row.username)}</strong>
      <em>${row.exp} EXP</em>
      <small>${row.testsCompleted} С‚РµСЃС‚РѕРІ В· best ${row.bestPercent}%</small>
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
  syncCoachMemorySoon(0);
  try {
    await apiJson("/api/logout", { method: "POST", body: "{}" });
  } catch {}
  currentUser = null;
  leaderboardRowsCache = [];
  loadLocalCoachMemory();
  clearCoachTheme();
  hideLeaderboard();
  ensureAuthUI().classList.add("is-visible");
}

async function requireAuth(){
  const micReady = await requireMicrophoneAccess();
  if (!micReady) return;
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
      ? `Problem review В· ${problemStatus.pending || PROBLEM_REVIEW_SIZE} questions`
      : `${bankName} В· ${TEST_SIZE} questions`;
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
const GENERAL_CHAOS_VARIANTS = ["topbar", "sidebar", "cards", "panel", "tilt"];
let activeGeneralChaosVariant = "";

function getGeneralPunishmentKey(){
  return `quiz_general_punishment_v1_${currentUser?.id || "guest"}`;
}

function saveGeneralPunishment(variant){
  if (!GENERAL_CHAOS_VARIANTS.includes(variant)) return;
  localStorage.setItem(getGeneralPunishmentKey(), JSON.stringify({
    active: true,
    variant,
    savedAt: Date.now(),
  }));
}

function loadGeneralPunishment(){
  const saved = readJson(getGeneralPunishmentKey(), null);
  if (!saved || saved.active !== true) return null;
  if (!GENERAL_CHAOS_VARIANTS.includes(saved.variant)) return null;
  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - Number(saved.savedAt || 0) > maxAgeMs) {
    clearGeneralPunishment();
    return null;
  }
  return saved;
}

function clearGeneralPunishment(){
  localStorage.removeItem(getGeneralPunishmentKey());
}

function setGeneralChaosMode(on, variant = ""){
  document.body.classList.remove(
    "general-chaos",
    ...GENERAL_CHAOS_VARIANTS.map(name => `general-chaos--${name}`)
  );
  activeGeneralChaosVariant = "";
  if (!on) {
    clearGeneralPunishment();
    return;
  }
  const nextVariant = GENERAL_CHAOS_VARIANTS.includes(variant)
    ? variant
    : GENERAL_CHAOS_VARIANTS[Math.floor(Math.random() * GENERAL_CHAOS_VARIANTS.length)];
  activeGeneralChaosVariant = nextVariant;
  saveGeneralPunishment(nextVariant);
  document.body.classList.add("general-chaos", `general-chaos--${nextVariant}`);
}

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

function startTimer(existingStartTs = Date.now()){
  startTs = Number(existingStartTs) || Date.now();
  if (floatingTimer) floatingTimer.style.display = "block";
  if (timerId) clearInterval(timerId);
  const initial = fmt(Date.now() - startTs);
  if (timerText) timerText.textContent = initial;
  if (floatingTimerDisplay) floatingTimerDisplay.textContent = initial;
  timerId = setInterval(() => {
    const formatted = fmt(Date.now() - startTs);
    if (timerText) timerText.textContent = formatted;
    if (floatingTimerDisplay) floatingTimerDisplay.textContent = formatted;
  }, 250);
}

function stopTimer(){
  if (timerId) clearInterval(timerId);
  timerId = null;
  if (timerText) timerText.textContent = "вЂ”";
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
let activeTestRestoring = false;
let skipObserver = null;
let isProblemReviewMode = false;
let activeProblemReviewBank = null;

const PROBLEM_REVIEW_SIZE = 10;
const PROBLEM_CLEAR_STREAK = 2;
const PROBLEM_ATTEMPT_LIMIT = 12;
const PROBLEM_REVIEW_VERSION = 1;
const COACH_STATE_KEY = "quiz_general_coach_v1";
const AI_ACTION_LOG_KEY = "quiz_ai_coach_actions_v1";
const COACH_DEFAULT_AVATAR = "static/img/general-avatar.jpg";
const COACH_AVATAR_MOODS = new Set(["kind", "strict", "drill", "danger", "offended", "thinking", "command"]);
const COACH_REMOTE_AVATAR_STYLES = {
  veteran: "General-Veteran",
  iron: "Iron-Commander",
  ghost: "Ghost-Staff",
  red: "Red-Zone-Marshal",
  cold: "Cold-Front-Colonel",
  storm: "Storm-Drillmaster",
  warden: "Quiz-Warden",
  joker: "Barracks-Joker"
};
const AI_COACH_UNAVAILABLE_MESSAGE =
  "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u0431\u0435\u0437 \u0441\u0432\u044f\u0437\u0438: AI-\u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d. \u041f\u0440\u043e\u0432\u0435\u0440\u044c \u043a\u043b\u044e\u0447 \u0438\u043b\u0438 \u043b\u043e\u0433\u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u0430.";
let aiCoachEnabled = true;
let coachState = null;


// === HARD AUTO (РѕС€РёР±РєР° -> РґРѕР±Р°РІРёС‚СЊ, 2 РїРѕРґСЂСЏРґ РІРµСЂРЅРѕ -> СЃРЅСЏС‚СЊ) ===
const LEGACY_HARD_KEY = "hard_questions_bankN";
const LEGACY_HARD_STATS_KEY = "hard_stats_bankN";
let currentBankKey = DEFAULT_BANK_KEY;

let hardQuestions = new Set(); // bank-local question ids
let hardStats = {};            // { [bankN]: { streak, wrong } }

function getActiveTestKey(){
  return `quiz_active_test_v2_${currentUser?.id || "guest"}`;
}

function clearActiveTest(){
  localStorage.removeItem(getActiveTestKey());
  clearGeneralPunishment();
}

function saveActiveTest(){
  if (activeTestRestoring || !TEST.length || isInLearningMode) return;
  const payload = {
    version: 2,
    userId: currentUser?.id || "guest",
    savedAt: Date.now(),
    startedAt: startTs || Date.now(),
    bankKey: currentBankKey,
    mode,
    hardMode,
    lastStartWasHardOnly,
    testSize: TEST_SIZE,
    curIdx,
    isProblemReviewMode,
    activeProblemReviewBank,
    liveCoachHintsLocked,
    activeGeneralChaosVariant,
    liveCoachHintUsed: Array.from(liveCoachHintUsed),
    test: TEST,
    answers: Array.from(answers.entries()),
  };
  localStorage.setItem(getActiveTestKey(), JSON.stringify(payload));
}

function restoreActiveTest(){
  if (TEST.length && startBtn.disabled) return false;
  const saved = readJson(getActiveTestKey(), null);
  if (!saved || saved.version !== 2 || !Array.isArray(saved.test) || !saved.test.length) return false;
  if (saved.userId !== (currentUser?.id || "guest")) {
    clearActiveTest();
    return false;
  }
  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - Number(saved.savedAt || 0) > maxAgeMs) {
    clearActiveTest();
    return false;
  }

  activeTestRestoring = true;
  try {
    const bankKey = resolveBankKey(saved.bankKey || currentBankKey);
    if (bankKey !== currentBankKey && bankSelect) {
      bankSelect.value = bankKey;
      setBank(bankKey, { clearActive: false });
    }
    currentBankKey = bankKey;
    mode = saved.mode === "text" ? "text" : "mcq";
    if (modeSelect) modeSelect.value = mode;
    TEST_SIZE = Math.max(1, Number(saved.testSize || saved.test.length || TEST_SIZE));
    if (testSizeSelect) testSizeSelect.value = String(TEST_SIZE);
    if (testSizeDisplay) testSizeDisplay.textContent = TEST_SIZE;
    hardMode = Boolean(saved.hardMode);
    if (hardModeToggle) hardModeToggle.checked = hardMode;
    localStorage.setItem("quiz_hardmode", hardMode ? "1" : "0");
    lastStartWasHardOnly = Boolean(saved.lastStartWasHardOnly);
    isProblemReviewMode = Boolean(saved.isProblemReviewMode);
    activeProblemReviewBank = saved.activeProblemReviewBank || null;
    const savedPunishment = loadGeneralPunishment();
    liveCoachHintsLocked = Boolean(saved.liveCoachHintsLocked || savedPunishment?.active);
    activeGeneralChaosVariant = GENERAL_CHAOS_VARIANTS.includes(saved.activeGeneralChaosVariant)
      ? saved.activeGeneralChaosVariant
      : (savedPunishment?.variant || "");
    liveCoachHintUsed.clear();
    if (Array.isArray(saved.liveCoachHintUsed)) {
      saved.liveCoachHintUsed.forEach(key => liveCoachHintUsed.add(String(key)));
    }
    TEST = saved.test;
    answers = new Map(Array.isArray(saved.answers) ? saved.answers : []);
    curIdx = Math.max(0, Math.min(TEST.length - 1, Number(saved.curIdx || 0)));
    isInLearningMode = false;

    appEl.classList.remove("has-output");
    elOut.style.display = "none";
    elOut.innerHTML = "";
    setRunning(true);
    if (liveCoachHintsLocked && activeGeneralChaosVariant) {
      setGeneralChaosMode(true, activeGeneralChaosVariant);
    } else {
      setGeneralChaosMode(false);
    }
    renderTest();
    startTimer(Number(saved.startedAt || Date.now()));
    startBtn.disabled = true;
    learnBtn.disabled = hardMode;
    restartBtn.disabled = true;
    finishBtn.disabled = false;
    if (abortBtn) abortBtn.disabled = false;
    updateHardButton();
    if (hardMode) {
      startQuestionTimer();
      startHardmodeMusic();
    }
    setStatusPill("\u0422\u0435\u0441\u0442 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d");
    saveActiveTest();
    return true;
  } finally {
    activeTestRestoring = false;
  }
}

function readJson(key, fallback){
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch(e){
    console.warn("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё localStorage:", key, e);
    return fallback;
  }
}

function defaultCoachMemory(){
  return { recent: [], disrespectCount: 0 };
}

function normalizeCoachMemory(memory){
  const source = memory && typeof memory === "object" ? memory : {};
  const recent = Array.isArray(source.recent) ? source.recent : [];
  return {
    disrespectCount: Math.max(0, Math.min(1000, Number(source.disrespectCount || 0))),
    recent: recent.slice(-20).map(item => ({
      kind: String(item?.kind || "").slice(0, 20),
      text: String(item?.text || "").replace(/\s+/g, " ").trim().slice(0, 220),
      at: Math.max(0, Number(item?.at || Date.now())),
      disrespectful: Boolean(item?.disrespectful),
    })).filter(item => item.kind || item.text),
  };
}

function getCoachMemoryKey(){
  return `quiz_general_coach_memory_v1_${currentUser?.id || "guest"}`;
}

function getCoachThemeKey(){
  return `quiz_general_theme_v1_${currentUser?.id || "guest"}`;
}

function setCoachThemeClass(theme){
  document.body.classList.remove(...COACH_THEME_NAMES.map(name => `coach-theme--${name}`));
  if (COACH_THEME_NAMES.includes(theme)) {
    document.body.classList.add(`coach-theme--${theme}`);
  }
}

function loadCoachTheme(){
  const saved = readJson(getCoachThemeKey(), null);
  const theme = COACH_THEME_NAMES.includes(saved?.theme) ? saved.theme : "";
  setCoachThemeClass(theme);
  return { theme, changedAt: Number(saved?.changedAt || 0) };
}

function clearCoachTheme(){
  localStorage.removeItem(getCoachThemeKey());
  setCoachThemeClass("");
}

function applyCoachThemeChoice(theme, context = {}){
  const requested = String(theme || "keep").trim();
  if (requested === "keep" || !COACH_THEME_NAMES.includes(requested)) return false;
  const saved = loadCoachTheme();
  if (saved.theme === requested) return false;
  const now = Date.now();
  const force = context.event === "hardFail" || context.event === "problemCleared" || Boolean(context.disrespectful);
  if (!force && now - saved.changedAt < COACH_THEME_COOLDOWN_MS) return false;
  localStorage.setItem(getCoachThemeKey(), JSON.stringify({ theme: requested, changedAt: now }));
  setCoachThemeClass(requested);
  return true;
}

function loadLocalCoachMemory(){
  coachMemory = normalizeCoachMemory(readJson(getCoachMemoryKey(), defaultCoachMemory()));
}

function saveLocalCoachMemory(){
  localStorage.setItem(getCoachMemoryKey(), JSON.stringify(normalizeCoachMemory(coachMemory)));
}

async function loadServerCoachMemory(){
  if (!currentUser || window.location.protocol === "file:") {
    loadLocalCoachMemory();
    return;
  }
  try {
    const data = await apiJson("/api/coach-memory");
    const local = normalizeCoachMemory(readJson(getCoachMemoryKey(), defaultCoachMemory()));
    const remote = normalizeCoachMemory(data.coachMemory);
    coachMemory = normalizeCoachMemory({
      disrespectCount: Math.max(local.disrespectCount, remote.disrespectCount),
      recent: [...local.recent, ...remote.recent]
        .sort((a, b) => Number(a.at || 0) - Number(b.at || 0))
        .filter((item, index, arr) => arr.findIndex(x => x.kind === item.kind && x.text === item.text && x.at === item.at) === index)
        .slice(-20),
    });
    saveLocalCoachMemory();
    syncCoachMemorySoon(50);
  } catch {
    loadLocalCoachMemory();
  }
}

function syncCoachMemorySoon(delay = 900){
  saveLocalCoachMemory();
  if (!currentUser || window.location.protocol === "file:") return;
  if (coachMemorySyncTimer) clearTimeout(coachMemorySyncTimer);
  coachMemorySyncTimer = setTimeout(async () => {
    coachMemorySyncTimer = null;
    try {
      await apiJson("/api/coach-memory", {
        method: "POST",
        body: JSON.stringify({ coachMemory: normalizeCoachMemory(coachMemory) }),
      });
    } catch (error) {
      console.warn("[coach] memory sync failed:", error);
    }
  }, delay);
}

function defaultCoachState(){
  return {
    title: "\u0413\u0435\u043d\u0435\u0440\u0430\u043b",
    avatarStyle: "veteran",
    tone: "kind",
    wrongStreak: 0,
    missedStreak: 0,
    totalWarnings: 0,
    totalPraise: 0,
    lastMessage: "",
    lastEvent: "",
    avatarMood: "kind",
    lastMessageAt: 0
  };
}

function loadCoachState(){
  const saved = readJson(COACH_STATE_KEY, null);
  const state = Object.assign(defaultCoachState(), saved && typeof saved === "object" ? saved : {});
  const message = String(state.lastMessage || "");
  const looksEnglishDefault = /General online|Work calmly|Read calmly|Sir, yes sir/i.test(message);
  const looksBroken = /\?{2,}/.test(message) || message.includes("\u00d0") || message.includes("\u00d1");
  if (looksBroken || looksEnglishDefault){
    state.lastMessage = "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043d\u0430 \u0441\u0432\u044f\u0437\u0438. \u0420\u0430\u0431\u043e\u0442\u0430\u0435\u043c \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u043e \u0438 \u0442\u043e\u0447\u043d\u043e.";
    state.lastMessageAt = 0;
    localStorage.setItem(COACH_STATE_KEY, JSON.stringify(state));
  }
  return state;
}

function saveCoachState(){
  if (!coachState) return;
  localStorage.setItem(COACH_STATE_KEY, JSON.stringify(coachState));
}

function getCoachAvatarMood(event = "", tone = coachState?.tone || "kind", actionType = ""){
  if (actionType === "discipline_penalty") return "offended";
  if (actionType === "start_micro_drill") return "command";
  if (event === "liveHint") return "thinking";
  if (event === "commandReply") return "command";
  if (event === "problemRound" || event === "hardFail") return "drill";
  if (tone === "danger") return "danger";
  if (tone === "drill") return "drill";
  if (tone === "strict") return "strict";
  return "kind";
}

function getDisciplineAvatarMood(action = {}){
  const visual = String(action.visual || "");
  if (visual === "topbar") return "danger";
  if (visual === "sidebar") return "strict";
  if (visual === "cards") return "offended";
  if (visual === "panel") return "kind";
  if (visual === "tilt") return "drill";
  return ["offended", "danger", "strict", "drill", "kind"][Math.floor(Math.random() * 5)];
}

function randomCoachDisciplineAction(reason = "first disrespectful message"){
  const scenes = [
    { visual: "cards", reason: "cards scattered after disrespect" },
    { visual: "topbar", reason: "topbar relocated after disrespect" },
    { visual: "sidebar", reason: "sidebar drift after disrespect" },
    { visual: "panel", reason: "coach panel taunt after disrespect" },
    { visual: "tilt", reason: "interface tilted after disrespect" },
  ];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  return {
    type: "discipline_penalty",
    reason: scene.reason || reason,
    visual: scene.visual,
  };
}

function setCoachAvatarMood(mood){
  if (!coachState) coachState = loadCoachState();
  const nextMood = COACH_AVATAR_MOODS.has(mood) ? mood : "kind";
  coachState.avatarMood = nextMood;
  saveCoachState();
  document.querySelectorAll("[data-coach-avatar]").forEach(img => setCoachAvatarImage(img, nextMood));
}

function getRemoteCoachAvatarUrl(style = coachState?.avatarStyle || "veteran", mood = coachState?.avatarMood || "kind"){
  const seed = COACH_REMOTE_AVATAR_STYLES[style] || COACH_REMOTE_AVATAR_STYLES.veteran;
  const background = mood === "danger" || mood === "offended" ? "3b0b18" : mood === "thinking" ? "111827" : "1f2937";
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}&radius=8`;
}

function setCoachAvatarImage(img, mood = coachState?.avatarMood || "kind"){
  if (!img) return;
  const src = getRemoteCoachAvatarUrl(coachState?.avatarStyle, mood);
  img.dataset.coachAvatar = mood;
  img.onerror = () => {
    if (img.src.endsWith("/general-avatar.jpg")) return;
    img.onerror = null;
    img.src = COACH_DEFAULT_AVATAR;
  };
  img.src = src;
}

function isAiCoachEnabled(){
  return aiCoachEnabled;
}

function updateCoachToggleUI(){
  const isAdmin = Boolean(currentUser?.isAdmin);
  if (coachToggle) {
    coachToggle.checked = aiCoachEnabled;
    coachToggle.disabled = !isAdmin;
    coachToggle.closest(".coach-toggle")?.classList.toggle("is-disabled", !isAdmin);
    coachToggle.title = isAdmin
      ? ""
      : "\u0422\u043e\u043b\u044c\u043a\u043e \u0430\u0434\u043c\u0438\u043d \u043c\u043e\u0436\u0435\u0442 \u043c\u0435\u043d\u044f\u0442\u044c \u044d\u0442\u0443 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0443.";
  }
  document.body.classList.toggle("ai-coach-disabled", !aiCoachEnabled);
  const panel = document.getElementById("coachPanel");
  if (panel) panel.hidden = !aiCoachEnabled;
}

async function loadAppSettings(){
  try {
    const data = await apiJson("/api/settings");
    aiCoachEnabled = data?.settings?.aiCoachEnabled !== false;
  } catch (error) {
    console.warn("[settings] failed to load app settings:", error);
  }
  updateCoachToggleUI();
  renderCoachPanel(coachState?.lastMessage || "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043d\u0430 \u0441\u0432\u044f\u0437\u0438. \u0420\u0430\u0431\u043e\u0442\u0430\u0435\u043c \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u043e \u0438 \u0442\u043e\u0447\u043d\u043e.");
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
        "Р“РµРЅРµСЂР°Р» РЅР° СЃРІСЏР·Рё. Р§РёС‚Р°Р№ СЃРїРѕРєРѕР№РЅРѕ, РѕС‚СЃРµРєР°Р№ С€СѓРј Рё РІС‹Р±РёСЂР°Р№ РѕСЃРѕР·РЅР°РЅРЅРѕ.",
        "Р Р°Р±РѕС‚Р°РµРј СЂРѕРІРЅРѕ. РћС€РёР±Р°С‚СЊСЃСЏ РјРѕР¶РЅРѕ, СѓРіР°РґС‹РІР°С‚СЊ РЅРµР»СЊР·СЏ."
      ],
      strict: [
        "РўРµРјРї РґРµСЂР¶РёРј, С„РѕРєСѓСЃ СѓСЃРёР»РёРІР°РµРј. РЎРЅР°С‡Р°Р»Р° РґРѕРєР°Р¶Рё РѕС‚РІРµС‚ СЃРµР±Рµ, РїРѕС‚РѕРј РЅР°Р¶РёРјР°Р№.",
        "РЎРЅР°С‡Р°Р»Р° С„РѕСЂРјСѓР»РёСЂРѕРІРєР° РІРѕРїСЂРѕСЃР°, РїРѕС‚РѕРј РІР°СЂРёР°РЅС‚С‹."
      ],
      drill: [
        "РљСѓСЂСЃР°РЅС‚, СЂРµР¶РёРј С‚СЂРµРЅРёСЂРѕРІРєРё Р°РєС‚РёРІРµРЅ. РћР±С…РѕРґРЅС‹С… РїСѓС‚РµР№ РЅРµС‚, РµСЃС‚СЊ С‚РѕР»СЊРєРѕ РѕС‚РІРµС‚С‹.",
        "РќРёРєР°РєРёС… СЃР»СѓС‡Р°Р№РЅС‹С… РєР»РёРєРѕРІ. Р—Р°РєСЂС‹РІР°РµРј СЃР»Р°Р±РѕРµ РјРµСЃС‚Рѕ."
      ],
      danger: [
        "РљСЂР°СЃРЅР°СЏ Р·РѕРЅР°. РљР°Р¶РґС‹Р№ РѕР±С…РѕРґРЅРѕР№ РјР°РЅРµРІСЂ РІРµСЂРЅРµС‚ С‚РµР±СЏ Рє РІРѕРїСЂРѕСЃСѓ.",
        "РЎРјРёСЂРЅРѕ. РЎРЅР°С‡Р°Р»Р° РґСѓРјР°Р№, РїРѕС‚РѕРј РЅР°Р¶РёРјР°Р№."
      ]
    },
    unanswered: {
      strict: [
        "РџСѓСЃС‚РѕР№ РѕС‚РІРµС‚? РќРµ РїСЂРёРЅСЏС‚Рѕ. Р’РµСЂРЅРёСЃСЊ Рє РІРѕРїСЂРѕСЃСѓ Рё РІС‹Р±РµСЂРё РїРѕР·РёС†РёСЋ.",
        "РљСѓСЂСЃР°РЅС‚, РµСЃР»Рё РёРіРЅРѕСЂРёСЂРѕРІР°С‚СЊ РІРѕРїСЂРѕСЃ, РѕРЅ РЅРёРєСѓРґР° РЅРµ РёСЃС‡РµР·РЅРµС‚."
      ],
      drill: [
        "Р‘РµР· РїСЂРѕРїСѓСЃРєРѕРІ. РџСЂРѕС‡РёС‚Р°Р№, СѓР±РµСЂРё РґРІР° СЃР»Р°Р±С‹С… РІР°СЂРёР°РЅС‚Р° Рё РѕС‚РІРµС‡Р°Р№.",
        "РџСѓСЃС‚С‹Рµ РѕС‚РІРµС‚С‹ РѕСЃС‚Р°СЋС‚СЃСЏ РЅР° РїР»Р°С†Сѓ РґРѕ РїРѕР»РЅРѕР№ РѕС‚СЂР°Р±РѕС‚РєРё."
      ],
      danger: [
        "Р­С‚Рѕ РЅРµ РїСЂРѕРїСѓСЃРє, СЌС‚Рѕ РѕС‚СЃС‚СѓРїР»РµРЅРёРµ. Р Р°Р·РІРµСЂРЅСѓР»СЃСЏ Рё РѕС‚РІРµС‚РёР».",
        "РЈРєР»РѕРЅРµРЅРёРµ РѕС‚РєР»РѕРЅРµРЅРѕ. РќРµС‚ РѕС‚РІРµС‚Р° - РЅРµС‚ РґРѕРїСѓСЃРєР° РґР°Р»СЊС€Рµ."
      ]
    },
    wrong: {
      strict: [
        "РќРµРІРµСЂРЅС‹Р№ РѕС‚РІРµС‚ Р·Р°РїРёСЃР°РЅ. РўРµРїРµСЂСЊ РЅР°Р№РґРё СЃР»РѕРІРѕ, РєРѕС‚РѕСЂРѕРµ СЂРµС€Р°РµС‚ СЃРјС‹СЃР».",
        "РќРµРІРµСЂРЅРѕ. РЈР±РµСЂРё РѕС‚РІР»РµРєР°СЋС‰РёРµ РІР°СЂРёР°РЅС‚С‹ Рё СЃРІСЏР¶Рё С‚РµСЂРјРёРЅ СЃ РѕРїСЂРµРґРµР»РµРЅРёРµРј."
      ],
      drill: [
        "РљСѓСЂСЃР°РЅС‚, РїСЂРѕРјР°С… РІРЅРµСЃРµРЅ РІ Р¶СѓСЂРЅР°Р». РЎР»РµРґСѓСЋС‰Р°СЏ РїРѕРїС‹С‚РєР° РґРѕР»Р¶РЅР° Р±С‹С‚СЊ РѕСЃРѕР·РЅР°РЅРЅРѕР№.",
        "РћРґРёРЅ РЅРµРІРµСЂРЅС‹Р№ РѕС‚РІРµС‚ - СЌС‚Рѕ РґР°РЅРЅС‹Рµ. РџРѕРІС‚РѕСЂСЏС‚СЊ РµРіРѕ - СѓР¶Рµ РїСЂРѕР±Р»РµРјР° РґРёСЃС†РёРїР»РёРЅС‹."
      ],
      danger: [
        "РќРµС‚. РЎР»СѓС‡Р°Р№РЅС‹Рµ РєР»РёРєРё - РЅРµ С‚СЂРµРЅРёСЂРѕРІРєР°. РћСЃС‚Р°РЅРѕРІРёСЃСЊ Рё РїСЂРѕС‡РёС‚Р°Р№ РІРѕРїСЂРѕСЃ.",
        "РљСЂР°СЃРЅР°СЏ Р·РѕРЅР°. РџРѕРєР° РЅРµ РїРѕР№РјРµС€СЊ РѕС‚РІРµС‚, РІРѕРїСЂРѕСЃ Р±СѓРґРµС‚ РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ."
      ]
    },
    correct: {
      kind: [
        "Р§РёСЃС‚РѕРµ РїРѕРїР°РґР°РЅРёРµ. РЎРїРѕРєРѕР№РЅРѕ, С‡РµС‚РєРѕ, РІ С†РµР»СЊ.",
        "РџСЂРёРЅСЏС‚Рѕ. РЈРІРµСЂРµРЅРЅС‹Р№ РѕС‚РІРµС‚, РґРІРёРіР°РµРјСЃСЏ РґР°Р»СЊС€Рµ."
      ],
      strict: [
        "РҐРѕСЂРѕС€Рѕ. Р’РёРґРёС€СЊ, С‡С‚Рѕ РїСЂРѕРёСЃС…РѕРґРёС‚, РєРѕРіРґР° С‡РёС‚Р°РµС€СЊ РІРЅРёРјР°С‚РµР»СЊРЅРѕ?",
        "Р’РµСЂРЅРѕ. Р”РµСЂР¶Рё СЌС‚РѕС‚ С‚РµРјРї, РєСѓСЂСЃР°РЅС‚."
      ],
      drill: [
        "Р•СЃС‚СЊ РїРѕРїР°РґР°РЅРёРµ. Р•С‰Рµ РѕРґРёРЅ С€Р°Рі Рє СЃРІРѕР±РѕРґРµ.",
        "РџРѕРїР°РґР°РЅРёРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРѕ. Р—Р°РєСЂРµРїРё Рё РЅРµ СЂР°СЃСЃР»Р°Р±Р»СЏР№СЃСЏ."
      ],
      danger: [
        "РќР°РєРѕРЅРµС†-С‚Рѕ РїРѕСЂСЏРґРѕРє. РџСЂРѕРґРѕР»Р¶Р°Р№ С‚Р°Рє Рё РІС‹Р№РґРµС€СЊ РёР· РєСЂР°СЃРЅРѕР№ Р·РѕРЅС‹.",
        "Р’РѕС‚ СЌС‚Рѕ РїРѕС…РѕР¶Рµ РЅР° СЂР°Р±РѕС‚Сѓ. Р‘РѕР»СЊС€Рµ С‚РѕС‡РЅРѕСЃС‚Рё, РјРµРЅСЊС€Рµ С…Р°РѕСЃР°."
      ]
    },
    finish: {
      kind: [
        `РЎРµСЃСЃРёСЏ Р·Р°РІРµСЂС€РµРЅР°: ${percent}%. РћС€РёР±РѕРє: ${wrong}. Р•СЃС‚СЊ РјР°С‚РµСЂРёР°Р» РґР»СЏ С‚СЂРµРЅРёСЂРѕРІРєРё.`,
        `Р¤РёРЅРёС€: ${percent}%. РўРµРїРµСЂСЊ Р·Р°С‡РёС‰Р°РµРј СЃР»Р°Р±С‹Рµ РјРµСЃС‚Р°.`
      ],
      strict: [
        `Р¤РёРЅРёС€: ${percent}%. РћС€РёР±РѕРє: ${wrong}. РџРѕРІС‚РѕСЂРµРЅРёРµ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ.`,
        "РЎРµСЃСЃРёСЏ Р·Р°РІРµСЂС€РµРЅР°. РћС€РёР±РєРё Р·Р°РїРёСЃР°РЅС‹, РґРёСЃС†РёРїР»РёРЅР° РЅР°С‡РёРЅР°РµС‚СЃСЏ СЃ РїРѕРІС‚РѕСЂРµРЅРёСЏ."
      ],
      drill: [
        `Р РµР·СѓР»СЊС‚Р°С‚ ${percent}%. РџСЂРѕР±Р»РµРјРЅС‹Рµ РІРѕРїСЂРѕСЃС‹ СѓС…РѕРґСЏС‚ РЅР° РѕС‚СЂР°Р±РѕС‚РєСѓ.`,
        `РћС€РёР±РѕРє: ${wrong}. РџР»Р°РЅ РїСЂРѕСЃС‚РѕР№: РїРѕРІС‚РѕСЂРёС‚СЊ Рё Р·Р°РєСЂС‹С‚СЊ.`
      ],
      danger: [
        `РљСЂР°СЃРЅР°СЏ Р·РѕРЅР°: ${percent}%. РџРѕРІС‚РѕСЂРµРЅРёРµ - РµРґРёРЅСЃС‚РІРµРЅРЅС‹Р№ РІС‹С…РѕРґ.`,
        "РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ РїСЂРѕРІР°Р»РѕРІ. Р­С‚Рё РІРѕРїСЂРѕСЃС‹ Р±СѓРґСѓС‚ РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ, РїРѕРєР° РЅРµ СЃС‚Р°РЅСѓС‚ С‚РІРѕРёРјРё."
      ]
    },
    problemStart: {
      drill: [
        `РћС‚СЂР°Р±РѕС‚РєР° РїСЂРѕР±Р»РµРјРЅС‹С… РІРѕРїСЂРѕСЃРѕРІ РЅР°С‡Р°Р»Р°СЃСЊ. РћСЃС‚Р°Р»РѕСЃСЊ: ${pending}. РџРѕ РґРІР° РІРµСЂРЅС‹С… РїРѕРґСЂСЏРґ РЅР° РєР°Р¶РґС‹Р№.`,
        `Р РµР¶РёРј РїРѕРІС‚РѕСЂРµРЅРёСЏ РІРєР»СЋС‡РµРЅ. Р¦РµР»РµР№: ${pending}. РћС‚СЃС‚СѓРїР°С‚СЊ РЅРµРєСѓРґР°.`
      ],
      danger: [
        `Р“РµРЅРµСЂР°Р» РїСЂРёРЅРёРјР°РµС‚ РєРѕРјР°РЅРґРѕРІР°РЅРёРµ. РџСЂРѕР±Р»РµРјРЅС‹С… РІРѕРїСЂРѕСЃРѕРІ: ${pending}, РїРѕ РґРІР° С‡РёСЃС‚С‹С… РїРѕРїР°РґР°РЅРёСЏ РЅР° РєР°Р¶РґС‹Р№.`,
        `Р—РѕРЅР° Р·Р°С‡РёСЃС‚РєРё Р°РєС‚РёРІРЅР°. Р¦РµР»РµР№: ${pending}. РћРґРЅР° РѕС€РёР±РєР° СЃР±СЂР°СЃС‹РІР°РµС‚ СЃРµСЂРёСЋ.`
      ]
    },
    problemRound: {
      drill: [
        `Р Р°СѓРЅРґ РЅРµ Р·Р°РєСЂС‹С‚. РћСЃС‚Р°Р»РѕСЃСЊ: ${pending}. РџСЂРѕРјР°С…Рё РІРѕР·РІСЂР°С‰Р°СЋС‚СЃСЏ РІ СЃС‚СЂРѕР№.`,
        `РџСЂРѕРґРѕР»Р¶Р°РµРј. Р•С‰Рµ ${pending} РІРѕРїСЂРѕСЃРѕРІ СЃРѕРїСЂРѕС‚РёРІР»СЏСЋС‚СЃСЏ.`
      ],
      danger: [
        `Р’С‹С…РѕРґР° РїРѕРєР° РЅРµС‚. РћСЃС‚Р°Р»РѕСЃСЊ РІРѕРїСЂРѕСЃРѕРІ: ${pending}. Р Р°Р±РѕС‚Р°РµРј РґРѕ Р·Р°С‡РёСЃС‚РєРё.`,
        `РџРѕРїС‹С‚РєР° Р·Р°РїРёСЃР°РЅР°, РЅРѕ Р·Р°С‡РёСЃС‚РєР° РЅРµ Р·Р°РІРµСЂС€РµРЅР°. Р¦РµР»РµР№ РѕСЃС‚Р°Р»РѕСЃСЊ: ${pending}.`
      ]
    },
    problemCleared: {
      kind: [
        "РџСЂРѕР±Р»РµРјРЅС‹Р№ РЅР°Р±РѕСЂ Р·Р°РєСЂС‹С‚. Р’РѕС‚ СЌС‚Рѕ РґРёСЃС†РёРїР»РёРЅР°.",
        "РџРѕРІС‚РѕСЂРµРЅРёРµ Р·Р°РІРµСЂС€РµРЅРѕ. Р“РµРЅРµСЂР°Р» РѕРґРѕР±СЂСЏРµС‚. Р”РІРёРіР°Р№ РґР°Р»СЊС€Рµ."
      ],
      strict: [
        "Р”РµСЃСЏС‚СЊ РїСЂРѕР±Р»РµРјРЅС‹С… РІРѕРїСЂРѕСЃРѕРІ Р·Р°РєСЂС‹С‚С‹. Р—Р°РїРѕРјРЅРё: РїРѕР±РµР¶РґР°СЋС‚ РґРІР° РІРµСЂРЅС‹С… РїРѕРґСЂСЏРґ.",
        "Р—Р°С‡РёС‰РµРЅРѕ. РЎР»Р°Р±С‹Рµ РјРµСЃС‚Р° СЃРЅСЏС‚С‹ СЃ Р°РєС‚РёРІРЅРѕРіРѕ РєРѕРЅС‚СЂРѕР»СЏ."
      ]
    },
    hardFail: {
      drill: [
        "Hardmode РїСЂРѕРІР°Р»РµРЅ. Р–РµСЃС‚РєРѕ, РЅРѕ СЃРїСЂР°РІРµРґР»РёРІРѕ.",
        "РћРґРёРЅ С€Р°РЅСЃ РїРѕС‚СЂР°С‡РµРЅ. Р’ СЃР»РµРґСѓСЋС‰РёР№ СЂР°Р· РґСѓРјР°Р№ РґРѕ РєР»РёРєР°."
      ],
      danger: [
        "РџСЂРѕРІР°Р». Р“РµРЅРµСЂР°Р» РІРёРґРµР» СЌС‚РѕС‚ РєР»РёРє. РџРѕРІС‚РѕСЂРё, РІРµСЂРЅРёСЃСЊ, РІС‹РїРѕР»РЅРё.",
        "Hardmode - СЌС‚Рѕ РЅРµ СѓРґР°С‡Р°. Р’РµСЂРЅРёСЃСЊ РїРѕСЃР»Рµ РїРѕРІС‚РѕСЂРµРЅРёСЏ."
      ]
    }
  };

  const humanMessages = {
    start: {
      kind: [
        "РЇ СЂСЏРґРѕРј. Р‘РµР· СЃСѓРµС‚С‹: С‡РёС‚Р°РµС€СЊ РІРѕРїСЂРѕСЃ, Р»РѕРІРёС€СЊ СЃРјС‹СЃР», РїРѕС‚РѕРј Р¶РјРµС€СЊ.",
        "РќР°С‡Р°Р»Рё СЃРїРѕРєРѕР№РЅРѕ. РўСѓС‚ РЅРµ РЅР°РґРѕ РіРµСЂРѕР№СЃС‚РІРѕРІР°С‚СЊ, РЅР°РґРѕ РІРЅРёРјР°С‚РµР»СЊРЅРѕ С‡РёС‚Р°С‚СЊ."
      ],
      strict: [
        "РўР°Рє, СЃРѕР±РµСЂРёСЃСЊ. РќРµ Р»РµС‚РёРј РјС‹С€РєРѕР№ РІРїРµСЂРµРґ РіРѕР»РѕРІС‹.",
        "РўРµРјРї РЅРѕСЂРјР°Р»СЊРЅС‹Р№, РЅРѕ РіР»Р°Р·Р° РІРєР»СЋС‡Рё. Р’Р°СЂРёР°РЅС‚С‹ Р»СЋР±СЏС‚ РїРѕРґСЃС‚Р°РІР»СЏС‚СЊ."
      ],
      drill: [
        "РћРєРµР№, СЂРµР¶РёРј С‚СЂРµРЅРёСЂРѕРІРєРё. РЎРµР№С‡Р°СЃ Р±РµР· СѓРіР°РґР°РµРє, СЏ Р·Р° СЌС‚РёРј РїСЂРѕСЃР»РµР¶Сѓ.",
        "РЎР»Р°Р±С‹Рµ РјРµСЃС‚Р° СЃР°РјРё РЅРµ СѓР№РґСѓС‚. Р”РѕСЃС‚Р°РµРј РёС… Рё СЃРїРѕРєРѕР№РЅРѕ РґРѕР±РёРІР°РµРј."
      ],
      danger: [
        "РЎС‚РѕРї. РўС‹ СѓР¶Рµ РЅР° С‚РѕРЅРєРѕРј Р»СЊРґСѓ, РїРѕСЌС‚РѕРјСѓ РєР°Р¶РґС‹Р№ РєР»РёРє С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РјС‹СЃР»Рё.",
        "РљСЂР°СЃРЅР°СЏ Р·РѕРЅР°. РЎРµР№С‡Р°СЃ СЏ Р±СѓРґСѓ РіСЂРѕРјС‡Рµ, РїРѕС‚РѕРјСѓ С‡С‚Рѕ РёРЅР°С‡Рµ С‚С‹ РѕРїСЏС‚СЊ РїСЂРѕСЃРєРѕС‡РёС€СЊ РјРёРјРѕ СЃРјС‹СЃР»Р°."
      ]
    },
    unanswered: {
      strict: [
        "Р­Р№, РїСѓСЃС‚РѕР№ РѕС‚РІРµС‚ РЅРµ СЃС‡РёС‚Р°РµС‚СЃСЏ РїР»Р°РЅРѕРј. Р’РµСЂРЅРёСЃСЊ Рё РІС‹Р±РµСЂРё РЅРѕСЂРјР°Р»СЊРЅРѕ.",
        "РќРµ РїСЂСЏС‡СЊСЃСЏ РѕС‚ РІРѕРїСЂРѕСЃР°. РћРЅ РІСЃРµ СЂР°РІРЅРѕ С‚РµР±СЏ РґРѕРіРѕРЅРёС‚."
      ],
      drill: [
        "РќРµС‚, С‚Р°Рє РЅРµ РёРіСЂР°РµРј. РџСЂРѕС‡РёС‚Р°Р», РѕС‚Р±СЂРѕСЃРёР» Р»РёС€РЅРµРµ, РѕС‚РІРµС‚РёР».",
        "РџСЂРѕРїСѓСЃРє РЅРµ РїСЂРёРЅРёРјР°СЋ. Р”Р°Р№ С…РѕС‚СЏ Р±С‹ С‡РµСЃС‚РЅСѓСЋ РїРѕРїС‹С‚РєСѓ."
      ],
      danger: [
        "РЎРµСЂСЊРµР·РЅРѕ? РўС‹ РґР°Р¶Рµ РЅРµ РїРѕРїСЂРѕР±РѕРІР°Р». РќР°Р·Р°Рґ Рє РІРѕРїСЂРѕСЃСѓ.",
        "РЈРєР»РѕРЅРµРЅРёРµ РІРёР¶Сѓ. РџРѕРєР° РЅРµ РѕС‚РІРµС‚РёС€СЊ, РґР°Р»СЊС€Рµ РЅРµ РёРґРµРј."
      ]
    },
    wrong: {
      strict: [
        "РњРёРјРѕ. РќРµ СЃС‚СЂР°С€РЅРѕ, РЅРѕ С‚С‹ СЏРІРЅРѕ РїРѕСЃРїРµС€РёР». РќР°Р№РґРё РєР»СЋС‡РµРІРѕРµ СЃР»РѕРІРѕ РІ РІРѕРїСЂРѕСЃРµ.",
        "РќРµРІРµСЂРЅРѕ. Р”Р°РІР°Р№ Р±РµР· РїР°РЅРёРєРё: С‡С‚Рѕ РёРјРµРЅРЅРѕ СЃРїСЂР°С€РёРІР°Р»Рё?"
      ],
      drill: [
        "Р’РѕС‚ СЌС‚Рѕ Р±С‹Р» С‚С‹Рє, Рё РјС‹ РѕР±Р° СЌС‚Рѕ РІРёРґРµР»Рё. Р•С‰Рµ СЂР°Р·, СѓР¶Рµ РіРѕР»РѕРІРѕР№.",
        "РџСЂРѕРјР°С…. РќРµ РєР»РёРєР°Р№ РЅР° Р·РЅР°РєРѕРјРѕРµ СЃР»РѕРІРѕ, СЃРЅР°С‡Р°Р»Р° РїСЂРѕРІРµСЂСЊ СЃРјС‹СЃР»."
      ],
      danger: [
        "РќРµС‚. Р­С‚Рѕ СѓР¶Рµ РЅРµ РѕС€РёР±РєР°, СЌС‚Рѕ Р°РІС‚РѕРїРёР»РѕС‚. РћСЃС‚Р°РЅРѕРІРёСЃСЊ Рё РїСЂРѕС‡РёС‚Р°Р№ Р·Р°РЅРѕРІРѕ.",
        "РўР°Рє, С…РІР°С‚РёС‚ СЂР°Р·Р±СЂР°СЃС‹РІР°С‚СЊСЃСЏ РѕС‚РІРµС‚Р°РјРё. РЎРµР№С‡Р°СЃ СЂР°Р±РѕС‚Р°РµС€СЊ РјРµРґР»РµРЅРЅРµРµ Рё С‚РѕС‡РЅРµРµ."
      ]
    },
    correct: {
      kind: [
        "Р’РѕС‚, С…РѕСЂРѕС€Рѕ. РЎРїРѕРєРѕР№РЅРѕ СЂР°Р·РѕР±СЂР°Р» Рё РїРѕРїР°Р».",
        "Р”Р°, СЌС‚Рѕ РѕРЅРѕ. Р’РёРґРёС€СЊ, РєРѕРіРґР° РЅРµ СЃРїРµС€РёС€СЊ, РІСЃРµ СЃРєР»Р°РґС‹РІР°РµС‚СЃСЏ."
      ],
      strict: [
        "РќРѕСЂРјР°Р»СЊРЅРѕ. Р”РµСЂР¶Рё СЌС‚РѕС‚ С‚РµРјРї Рё РЅРµ СЂР°СЃСЃР»Р°Р±Р»СЏР№СЃСЏ.",
        "Р’РµСЂРЅРѕ. Р’РѕС‚ С‚Р°Рє Рё РЅР°РґРѕ: РјРµРЅСЊС€Рµ С€СѓРјР°, Р±РѕР»СЊС€Рµ СЃРјС‹СЃР»Р°."
      ],
      drill: [
        "Р•СЃС‚СЊ. РћРґРёРЅ РіРІРѕР·РґСЊ Р·Р°Р±РёР»Рё, РёРґРµРј РґР°Р»СЊС€Рµ.",
        "РџРѕРїР°Р». Р—Р°РїРѕРјРЅРё РѕС‰СѓС‰РµРЅРёРµ: С‚С‹ РЅРµ СѓРіР°РґР°Р», С‚С‹ РїРѕРЅСЏР»."
      ],
      danger: [
        "РќР°РєРѕРЅРµС†-С‚Рѕ. Р’РѕС‚ С‚Р°Рє РІС‹РіР»СЏРґРёС‚ РІРєР»СЋС‡РµРЅРЅР°СЏ РіРѕР»РѕРІР°.",
        "Р”Р°. Р•С‰Рµ РЅРµСЃРєРѕР»СЊРєРѕ С‚Р°РєРёС… РѕС‚РІРµС‚РѕРІ, Рё СЏ РїРµСЂРµСЃС‚Р°РЅСѓ СЃРІРµСЂР»РёС‚СЊ С‚РµР±СЏ РІР·РіР»СЏРґРѕРј."
      ]
    },
    finish: {
      kind: [
        `Р—Р°РєРѕРЅС‡РёР»Рё РЅР° ${percent}%. РћС€РёР±РѕРє: ${wrong}. РќРёС‡РµРіРѕ, С‚РµРїРµСЂСЊ РІРёРґРЅРѕ, С‡С‚Рѕ РїРѕРґС‚СЏРЅСѓС‚СЊ.`,
        `Р¤РёРЅРёС€: ${percent}%. Р•СЃС‚СЊ СЃР»Р°Р±С‹Рµ РјРµСЃС‚Р°, РЅРѕ СЌС‚Рѕ СѓР¶Рµ РєРѕРЅРєСЂРµС‚РЅР°СЏ РєР°СЂС‚Р°, РЅРµ С‚СѓРјР°РЅ.`
      ],
      strict: [
        `РС‚РѕРі ${percent}%, РѕС€РёР±РѕРє ${wrong}. РћС‚РґС‹С…Р°С‚СЊ СЂР°РЅРѕ, РїРѕРІС‚РѕСЂРµРЅРёРµ СЃР°РјРѕ СЃРµР±СЏ РЅРµ СЃРґРµР»Р°РµС‚.`,
        "РЎРµСЃСЃРёСЏ Р·Р°РєСЂС‹С‚Р°. РўРµРїРµСЂСЊ РЅРµ РґРµР»Р°РµРј РІРёРґ, С‡С‚Рѕ РѕС€РёР±РѕРє РЅРµ Р±С‹Р»Рѕ."
      ],
      drill: [
        `Р РµР·СѓР»СЊС‚Р°С‚ ${percent}%. РџСЂРѕР±Р»РµРјРЅС‹Рµ РІРѕРїСЂРѕСЃС‹ РёРґСѓС‚ РІ РѕС‚СЂР°Р±РѕС‚РєСѓ, Р±РµР· С‚РѕСЂРіР°.`,
        `РћС€РёР±РѕРє: ${wrong}. Р—РЅР°С‡РёС‚, Р±РµСЂРµРј РёС… РѕС‚РґРµР»СЊРЅРѕ Рё РґРѕР¶РёРјР°РµРј.`
      ],
      danger: [
        `РљСЂР°СЃРЅР°СЏ Р·РѕРЅР°: ${percent}%. РЎРµР№С‡Р°СЃ СЃРїР°СЃР°РµС‚ С‚РѕР»СЊРєРѕ РїРѕРІС‚РѕСЂРµРЅРёРµ, Р±РµР· РєСЂР°СЃРёРІС‹С… РѕРїСЂР°РІРґР°РЅРёР№.`,
        "РџСЂРѕРІР°Р»РѕРІ РјРЅРѕРіРѕРІР°С‚Рѕ. Р­С‚Рё РІРѕРїСЂРѕСЃС‹ Р±СѓРґСѓС‚ РІРѕР·РІСЂР°С‰Р°С‚СЊСЃСЏ, РїРѕРєР° С‚С‹ РёС… РЅРµ РїСЂРёСЂСѓС‡РёС€СЊ."
      ]
    },
    problemStart: {
      drill: [
        `РўР°Рє, РІРѕС‚ РѕРЅРё: ${pending} РїСЂРѕР±Р»РµРјРЅС‹С… РІРѕРїСЂРѕСЃРѕРІ. Р”РІР° РІРµСЂРЅС‹С… РїРѕРґСЂСЏРґ, Рё РѕС‚РїСѓС‰Сѓ.`,
        `РћС‚СЂР°Р±РѕС‚РєР° РЅР°С‡Р°Р»Р°СЃСЊ. ${pending} С†РµР»РµР№, СЂР°Р±РѕС‚Р°РµРј Р±РµР· РЅС‹С‚СЊСЏ Рё РїСЂРѕРїСѓСЃРєРѕРІ.`
      ],
      danger: [
        `РЇ Р·Р°Р±РёСЂР°СЋ СѓРїСЂР°РІР»РµРЅРёРµ. ${pending} РІРѕРїСЂРѕСЃРѕРІ, Рё РєР°Р¶РґС‹Р№ РїСЂРёРґРµС‚СЃСЏ Р·Р°РєСЂС‹С‚СЊ С‡РµСЃС‚РЅРѕ.`,
        `Р—РѕРЅР° Р·Р°С‡РёСЃС‚РєРё. ${pending} РІРѕРїСЂРѕСЃРѕРІ. РћС€РёР±РєР° - РЅР°С‡РёРЅР°РµС€СЊ Р·Р°РєСЂРµРїР»РµРЅРёРµ Р·Р°РЅРѕРІРѕ.`
      ]
    },
    problemRound: {
      drill: [
        `РџРѕРєР° РЅРµ С‡РёСЃС‚Рѕ. РћСЃС‚Р°Р»РѕСЃСЊ ${pending}. РќРёС‡РµРіРѕ, РґРѕР¶РјРµРј.`,
        `РќРµ РІСЃРµ СЃРґР°Р»РёСЃСЊ. ${pending} РІРѕРїСЂРѕСЃРѕРІ РµС‰Рµ РґРµСЂР¶Р°С‚СЃСЏ.`
      ],
      danger: [
        `РќРµС‚, РІС‹С…РѕРґ РµС‰Рµ Р·Р°РєСЂС‹С‚. РћСЃС‚Р°Р»РѕСЃСЊ ${pending}, СЂР°Р±РѕС‚Р°РµРј РґР°Р»СЊС€Рµ.`,
        `РџРѕРїС‹С‚РєР° Р±С‹Р»Р°, РЅРѕ РЅРµ РїРѕР±РµРґР°. ${pending} РІРѕРїСЂРѕСЃРѕРІ РІСЃРµ РµС‰Рµ СЃРјРѕС‚СЂСЏС‚ РЅР° С‚РµР±СЏ.`
      ]
    },
    problemCleared: {
      kind: [
        "Р’РѕС‚ С‚РµРїРµСЂСЊ РєСЂР°СЃРёРІРѕ. РџСЂРѕР±Р»РµРјРЅС‹Р№ Р±Р»РѕРє Р·Р°РєСЂС‹С‚.",
        "РћС‚Р»РёС‡РЅРѕ, С‚С‹ СЌС‚Рѕ РІС‹С‚Р°С‰РёР». Р“РµРЅРµСЂР°Р» РґРѕРІРѕР»РµРЅ, РЅРѕ РІРёРґСѓ РїРѕС‡С‚Рё РЅРµ РїРѕРґР°РµС‚."
      ],
      strict: [
        "Р—Р°РєСЂС‹С‚Рѕ. Р—Р°РїРѕРјРЅРё: РЅРµ РјР°РіРёСЏ, Р° РїРѕРІС‚РѕСЂРµРЅРёРµ.",
        "РЎР»Р°Р±РѕРµ РјРµСЃС‚Рѕ СЃРЅСЏС‚Рѕ СЃ РєРѕРЅС‚СЂРѕР»СЏ. РўР°Рє Рё РЅР°РґРѕ СЂР°Р±РѕС‚Р°С‚СЊ."
      ]
    },
    hardFail: {
      drill: [
        "Hardmode РЅРµ РїСЂРѕСЃС‚РёР». Р‘С‹РІР°РµС‚, РЅРѕ РІС‚РѕСЂРѕР№ СЂР°Р· С‚Р°Рє РЅРµ РєР»РёРєР°Р№.",
        "РћРґРёРЅ С€Р°РЅСЃ СЃРіРѕСЂРµР». Р’ СЃР»РµРґСѓСЋС‰РёР№ Р·Р°С…РѕРґ СЃРЅР°С‡Р°Р»Р° РґСѓРјР°РµС€СЊ, РїРѕС‚РѕРј Р¶РјРµС€СЊ."
      ],
      danger: [
        "РџСЂРѕРІР°Р». РЇ РїСЂСЏРј РІРёРґРµР» СЌС‚РѕС‚ РїРѕСЃРїРµС€РЅС‹Р№ РєР»РёРє. РќР° РїРѕРІС‚РѕСЂРµРЅРёРµ.",
        "Hardmode РЅРµ Р»РѕС‚РµСЂРµСЏ. Р’РµСЂРЅРµС€СЊСЃСЏ, РєРѕРіРґР° РѕС‚РІРµС‚ Р±СѓРґРµС‚ РІ РіРѕР»РѕРІРµ, Р° РЅРµ РЅР° СѓРґР°С‡Сѓ."
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
      <img data-coach-avatar src="static/img/general-avatar.jpg" alt="">
    </div>
    <div class="coach-panel__body">
      <div class="coach-panel__top">
        <strong id="coachTitle">Р РµР¶РёРј РіРµРЅРµСЂР°Р»Р°</strong>
        <span id="coachTone">kind</span>
      </div>
      <p id="coachMessage">Р“РµРЅРµСЂР°Р» РЅР° СЃРІСЏР·Рё. Р Р°Р±РѕС‚Р°РµРј СЃРїРѕРєРѕР№РЅРѕ Рё С‚РѕС‡РЅРѕ.</p>
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

function normalizeCoachDisplayMessage(value){
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.message === "string") {
      return parsed.message.replace(/\s+/g, " ").trim();
    }
  } catch {}
  const match = raw.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (match) {
    try {
      return JSON.parse(`"${match[1]}"`).replace(/\s+/g, " ").trim();
    } catch {
      return match[1].replace(/\s+/g, " ").trim();
    }
  }
  return raw;
}

function applyCoachPersona(data = {}, context = {}){
  if (!coachState) coachState = loadCoachState();
  const title = String(data.title || "").replace(/\s+/g, " ").trim().slice(0, 34);
  const avatarStyle = String(data.avatarStyle || "").trim();
  if (title) coachState.title = title;
  if (COACH_REMOTE_AVATAR_STYLES[avatarStyle]) coachState.avatarStyle = avatarStyle;
  applyCoachThemeChoice(data.theme, context);
  saveCoachState();
  document.querySelectorAll("[data-coach-avatar]").forEach(img => setCoachAvatarImage(img, coachState.avatarMood));
}

function escapeRegExp(value){
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeLiveHintMessage(message, item, selectedIsCorrect){
  const raw = String(message || "").trim();
  if (!raw || !item) return raw;
  const correct = String(item.correctText || "").trim();
  const mentionsCorrect = correct
    ? new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(correct)}([^\\p{L}\\p{N}_]|$)`, "iu").test(raw)
    : false;
  const wronglyApproved = selectedIsCorrect === false && /^(да|верно|правильно|yes|correct)\b/i.test(raw);
  if (selectedIsCorrect === false && (mentionsCorrect || wronglyApproved)) {
    return "\u041d\u0435\u0442, \u0432\u044b\u0431\u043e\u0440 \u043d\u0435 \u0442\u043e\u0442. \u0421\u043c\u043e\u0442\u0440\u0438 \u043d\u0430 \u0441\u043c\u044b\u0441\u043b: \u0447\u0442\u043e \u0438\u043c\u0435\u043d\u043d\u043e \u0434\u043e\u043b\u0436\u043d\u043e \u043f\u043e\u0432\u0442\u043e\u0440\u044f\u0442\u044c\u0441\u044f \u043f\u043e \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u0430\u043c.";
  }
  if (selectedIsCorrect === true && mentionsCorrect) {
    return "\u0414\u0430, \u0432\u044b\u0431\u043e\u0440 \u0432\u0435\u0440\u043d\u044b\u0439. \u041d\u0435 \u0440\u0430\u0441\u0441\u043b\u0430\u0431\u043b\u044f\u0439\u0441\u044f, \u0434\u0430\u043b\u044c\u0448\u0435.";
  }
  return raw;
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
  setCoachAvatarImage(panel.querySelector("[data-coach-avatar]"), coachState.avatarMood || getCoachAvatarMood("", coachState.tone));
  message = normalizeCoachDisplayMessage(message || coachState.lastMessage || "");
  if (message && message !== coachState.lastMessage) {
    coachState.lastMessage = message;
    saveCoachState();
  }
  const toneLabels = {
    kind: "РјСЏРіРєРѕ",
    strict: "СЃС‚СЂРѕРіРѕ",
    drill: "С‚СЂРµРЅРёСЂРѕРІРєР°",
    danger: "РєСЂР°СЃРЅР°СЏ Р·РѕРЅР°"
  };

  panel.dataset.tone = coachState.tone;
  if (title) title.textContent = coachState.title || "\u0413\u0435\u043d\u0435\u0440\u0430\u043b";
  if (tone) tone.textContent = toneLabels[coachState.tone] || coachState.tone;
  if (msg) msg.textContent = message || coachState.lastMessage || "Р“РµРЅРµСЂР°Р» РЅР° СЃРІСЏР·Рё. Р Р°Р±РѕС‚Р°РµРј СЃРїРѕРєРѕР№РЅРѕ Рё С‚РѕС‡РЅРѕ.";

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
        <img data-coach-avatar src="static/img/general-avatar.jpg" alt="">
      </div>
      <div class="general-command__content">
        <p class="general-command__eyebrow">\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0432\u0437\u044f\u043b \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435</p>
        <h2 id="generalCommandTitle">\u041f\u0440\u0438\u043a\u0430\u0437</h2>
        <p id="generalCommandMessage" class="general-command__message"></p>
        <p id="generalCommandReason" class="general-command__reason"></p>
        <div class="general-command__reply">
          <button id="generalCommandMic" type="button" class="secondary">\u041e\u0442\u0432\u0435\u0442\u0438\u0442\u044c \u0433\u043e\u043b\u043e\u0441\u043e\u043c</button>
          <p id="generalCommandTranscript">\u041c\u043e\u0436\u0435\u0448\u044c \u0441\u043a\u0430\u0437\u0430\u0442\u044c: \u00ab\u043f\u0440\u0438\u043d\u044f\u043b\u00bb, \u00ab\u043d\u0430\u0447\u0430\u0442\u044c\u00bb \u0438\u043b\u0438 \u00ab\u0434\u0430\u00bb.</p>
        </div>
        <button id="generalCommandOk" type="button">\u041f\u0440\u0438\u043d\u044f\u043b</button>
      </div>
    </section>
  `;
  document.body.appendChild(dialog);
  return dialog;
}

function getSpeechRecognitionCtor(){
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isDisrespectfulCoachText(text){
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;
  return [
    "идиот",
    "дебил",
    "тупой",
    "тупица",
    "дурак",
    "лох",
    "чмо",
    "убог",
    "мраз",
    "гандон",
    "уеб",
    "хуй",
    "хуе",
    "пизд",
    "ебан",
    "ебло",
    "соси",
    "заткнись",
    "shut up",
    "stupid",
    "idiot",
    "dumb"
  ].some(token => normalized.includes(token));
}

function isDisrespectfulCoachText(text){
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/\u0451/g, "\u0435")
    .replace(/[^a-z\u0430-\u044f0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return false;
  return [
    "\u0438\u0434\u0438\u043e\u0442",
    "\u0434\u0435\u0431\u0438\u043b",
    "\u0442\u0443\u043f\u043e\u0439",
    "\u0442\u0443\u043f\u0438\u0446",
    "\u0434\u0443\u0440\u0430\u043a",
    "\u043b\u043e\u0445",
    "\u0447\u043c\u043e",
    "\u0443\u0431\u043e\u0433",
    "\u043c\u0440\u0430\u0437",
    "\u0433\u0430\u043d\u0434\u043e\u043d",
    "\u0443\u0435\u0431",
    "\u0445\u0443\u0439",
    "\u0445\u0443\u0435",
    "\u043f\u0438\u0437\u0434",
    "\u0435\u0431\u0430\u043d",
    "\u0435\u0431\u043b",
    "\u0441\u043e\u0441\u0438",
    "\u0437\u0430\u0442\u043a\u043d\u0438\u0441\u044c",
    "\u0448\u043b\u044e\u0445",
    "\u0431\u043b\u044f\u0434",
    "\u043c\u0430\u0442\u044c",
    "\u043c\u0430\u043c\u043a",
    "\u043c\u0430\u043c\u0430",
    "\u043c\u0430\u043c\u0430\u0448",
    "shut up",
    "stupid",
    "idiot",
    "dumb"
  ].some(token => normalized.includes(token));
}

function rememberCoachExchange(kind, text, extra = {}){
  const entry = {
    kind,
    text: String(text || "").slice(0, 220),
    at: Date.now(),
    disrespectful: Boolean(extra.disrespectful),
  };
  coachMemory.recent.push(entry);
  while (coachMemory.recent.length > 20) coachMemory.recent.shift();
  if (entry.disrespectful) coachMemory.disrespectCount++;
  syncCoachMemorySoon();
}

function getCoachMemoryPayload(){
  return {
    disrespectCount: coachMemory.disrespectCount,
    recent: coachMemory.recent.slice(-10),
  };
}

function getCoachThemePayload(){
  const saved = loadCoachTheme();
  return {
    currentTheme: saved.theme || "default",
    changedSecondsAgo: saved.changedAt ? Math.floor((Date.now() - saved.changedAt) / 1000) : null,
    cooldownSeconds: Math.floor(COACH_THEME_COOLDOWN_MS / 1000),
  };
}

function setCoachHelpControlsLocked(card, locked, text = ""){
  const box = card?.querySelector?.(".coach-help");
  if (!box) return;
  box.querySelector(".coach-help__input")?.toggleAttribute("disabled", locked);
  box.querySelector(".coach-help__ask")?.toggleAttribute("disabled", locked);
  box.querySelector(".coach-help__mic")?.toggleAttribute("disabled", locked);
  box.classList.toggle("is-locked", locked);
  const answer = box.querySelector(".coach-help__answer");
  if (answer && text) answer.textContent = text;
}

function refreshCoachHelpLocks(){
  const bodyClass = document.body.className;
  const text = bodyClass.includes("general-chaos--topbar")
    ? "\u0428\u0442\u0430\u0431 \u043f\u0435\u0440\u0435\u0435\u0445\u0430\u043b. \u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0437\u0430\u043a\u0440\u044b\u0442\u044b, \u0438\u0449\u0438 \u0434\u043e\u0440\u043e\u0433\u0443 \u043c\u044b\u0441\u043b\u044f\u043c\u0438."
    : bodyClass.includes("general-chaos--sidebar")
      ? "\u0421\u0430\u0439\u0434\u0431\u0430\u0440 \u0443\u0448\u0435\u043b \u0432 \u0441\u0430\u043c\u043e\u0432\u043e\u043b\u043a\u0443. \u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0442\u043e\u0436\u0435."
      : bodyClass.includes("general-chaos--panel")
        ? "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0441\u043c\u0435\u0435\u0442\u0441\u044f \u0438 \u043c\u043e\u043b\u0447\u0438\u0442. \u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043e\u043a \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0435\u0442."
        : "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043e\u0431\u0438\u0434\u0435\u043b\u0441\u044f: \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0434\u043e \u043d\u043e\u0432\u043e\u0433\u043e \u0442\u0435\u0441\u0442\u0430 \u0437\u0430\u043a\u0440\u044b\u0442\u044b. \u041c\u0430\u0440\u0448 \u0434\u0443\u043c\u0430\u0442\u044c \u0441\u0430\u043c\u043e\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u043d\u043e.";
  document.querySelectorAll(".card").forEach(card => setCoachHelpControlsLocked(card, liveCoachHintsLocked, liveCoachHintsLocked ? text : ""));
}

function applyCoachDisciplinePenalty(action = {}, context = {}){
  liveCoachHintsLocked = true;
  if (!action.visual) action = Object.assign({}, action, { visual: "panel" });
  setGeneralChaosMode(true, action.visual);
  setCoachAvatarMood(getDisciplineAvatarMood(action));
  const reason = String(action.reason || "").trim();
  showAiActionToast(reason
    ? `\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0443\u0440\u0435\u0437\u0430\u043b \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438: ${reason}`
    : "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0443\u0440\u0435\u0437\u0430\u043b \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0437\u0430 \u043a\u0440\u0438\u0432\u043e\u0439 \u0431\u0430\u0437\u0430\u0440."
  );
  refreshCoachHelpLocks();
  saveActiveTest();
  logAiCoachAction({ type: "discipline_penalty", event: context.event || "", reason });
}

function askLiveCoachHint(item, card, initialText = ""){
  if (!item || !card || !isAiCoachEnabled()) return;
  if (liveCoachHintsLocked) {
    setCoachHelpControlsLocked(card, true, "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043e\u0431\u0438\u0434\u0435\u043b\u0441\u044f: \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0434\u043e \u043d\u043e\u0432\u043e\u0433\u043e \u0442\u0435\u0441\u0442\u0430 \u0437\u0430\u043a\u0440\u044b\u0442\u044b.");
    return;
  }
  const hintKey = String(item.id || item.bankN || "");
  const box = card.querySelector(".coach-help");
  const input = box?.querySelector(".coach-help__input");
  const answer = box?.querySelector(".coach-help__answer");
  const askBtn = box?.querySelector(".coach-help__ask");
  const micBtn = box?.querySelector(".coach-help__mic");
  if (hintKey && liveCoachHintUsed.has(hintKey)) {
    if (answer) answer.textContent = "\u041b\u0438\u043c\u0438\u0442: \u0433\u0435\u043d\u0435\u0440\u0430\u043b \u0443\u0436\u0435 \u0434\u0430\u043b \u043e\u0434\u043d\u0443 \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0443 \u043f\u043e \u044d\u0442\u043e\u043c\u0443 \u0432\u043e\u043f\u0440\u043e\u0441\u0443.";
    return;
  }
  const text = String(initialText || input?.value || "").trim();
  if (!text) {
    if (answer) answer.textContent = "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u043f\u0440\u043e\u0441\u0438 \u0447\u0442\u043e-\u043d\u0438\u0431\u0443\u0434\u044c. \u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043c\u044b\u0441\u043b\u0438 \u043d\u0435 \u0447\u0438\u0442\u0430\u0435\u0442.";
    return;
  }
  const disrespectful = isDisrespectfulCoachText(text);
  rememberCoachExchange("liveHintUser", text, { disrespectful });
  const selectedAnswer = answers.get(item.id);
  const hasSelectedAnswer = selectedAnswer !== undefined && selectedAnswer !== "";
  const selectedIsCorrect = hasSelectedAnswer ? evaluateAnswerForItem(item, selectedAnswer, mode) : null;

  if (answer) answer.textContent = "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0434\u0443\u043c\u0430\u0435\u0442...";
  if (askBtn) askBtn.disabled = true;
  if (micBtn) micBtn.disabled = true;
  setCoachAvatarMood("thinking");
  apiJson("/api/coach-message", {
    method: "POST",
    body: JSON.stringify({
      event: "liveHint",
      tone: coachState?.tone || "strict",
      localMessage: coachState?.lastMessage || "",
      question: item.q || "",
      options: Array.isArray(item.options) ? item.options : [],
      userQuestion: text,
      userAnswer: getAnswerTextForCoach(item, selectedAnswer),
      problemMode: Boolean(isProblemReviewMode),
      stats: {
        wrongStreak: coachState?.wrongStreak || 0,
        missedStreak: coachState?.missedStreak || 0,
        questionNumber: item.n,
        selectedIsCorrect,
        hasSelectedAnswer,
        problemCandidates: getProblemCandidates(currentBankKey).length,
        userDisrespectedGeneral: disrespectful,
        coachMemory: getCoachMemoryPayload(),
        coachTheme: getCoachThemePayload(),
      },
    }),
  }).then(data => {
    applyCoachPersona(data, { event: "liveHint", disrespectful });
    const message = sanitizeLiveHintMessage(
      normalizeCoachDisplayMessage(data?.message || ""),
      item,
      selectedIsCorrect
    );
    if (answer) answer.textContent = message || "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043f\u0440\u043e\u043c\u043e\u043b\u0447\u0430\u043b. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0441\u0444\u043e\u0440\u043c\u0443\u043b\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0438\u043d\u0430\u0447\u0435.";
    if (message) rememberCoachExchange("coach", message);
    if (data?.action) applyAiCoachAction(data.action, { event: "liveHint", data: { item }, message });
    if (message) {
      if (hintKey) liveCoachHintUsed.add(hintKey);
      saveActiveTest();
      if (input) input.disabled = true;
      if (askBtn) askBtn.disabled = true;
      if (micBtn) micBtn.disabled = true;
      coachState.lastMessage = message;
      coachState.lastEvent = "liveHint";
      coachState.lastMessageAt = Date.now();
      if (!liveCoachHintsLocked) coachState.avatarMood = getCoachAvatarMood("liveHint", coachState.tone);
      saveCoachState();
      renderCoachPanel(message);
    }
  }).catch(error => {
    console.warn("[coach] live hint failed:", error);
    if (disrespectful) {
      applyCoachDisciplinePenalty(randomCoachDisciplineAction("fallback after disrespectful hint request"), { event: "liveHint", data: { item } });
    }
    if (answer) answer.textContent = error?.message || "\u0421\u0432\u044f\u0437\u044c \u0441 \u0433\u0435\u043d\u0435\u0440\u0430\u043b\u043e\u043c \u0443\u043f\u0430\u043b\u0430.";
  }).finally(() => {
    const used = hintKey && liveCoachHintUsed.has(hintKey);
    if (askBtn) askBtn.disabled = used;
    if (micBtn) micBtn.disabled = used;
  });
}

function addCoachHelp(card, item){
  const help = document.createElement("div");
  help.className = "coach-help";
  help.innerHTML = `
    <div class="coach-help__row">
      <input class="coach-help__input" type="text" placeholder="\u0421\u043f\u0440\u043e\u0441\u0438 \u0433\u0435\u043d\u0435\u0440\u0430\u043b\u0430: \u00ab\u043a\u0430\u043a \u044d\u0442\u043e \u043f\u043e\u043d\u044f\u0442\u044c?\u00bb">
      <button class="coach-help__ask secondary" type="button">\u0421\u043f\u0440\u043e\u0441\u0438\u0442\u044c</button>
      <button class="coach-help__mic secondary" type="button">\u0413\u043e\u043b\u043e\u0441</button>
    </div>
    <div class="coach-help__answer"></div>
  `;
  const input = help.querySelector(".coach-help__input");
  const askBtn = help.querySelector(".coach-help__ask");
  const micBtn = help.querySelector(".coach-help__mic");
  const answer = help.querySelector(".coach-help__answer");
  const Recognition = getSpeechRecognitionCtor();
  const hintKey = String(item?.id || item?.bankN || "");
  const alreadyUsed = hintKey && liveCoachHintUsed.has(hintKey);

  askBtn?.addEventListener("click", () => askLiveCoachHint(item, card));
  input?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    askLiveCoachHint(item, card);
  });

  if (liveCoachHintsLocked) {
    setCoachHelpControlsLocked(card, true, "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043e\u0431\u0438\u0434\u0435\u043b\u0441\u044f: \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0434\u043e \u043d\u043e\u0432\u043e\u0433\u043e \u0442\u0435\u0441\u0442\u0430 \u0437\u0430\u043a\u0440\u044b\u0442\u044b.");
  } else if (alreadyUsed) {
    if (input) input.disabled = true;
    if (askBtn) askBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;
    if (answer) answer.textContent = "\u041b\u0438\u043c\u0438\u0442: \u043e\u0434\u043d\u0430 \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0430 \u043d\u0430 \u0432\u043e\u043f\u0440\u043e\u0441.";
  } else if (!Recognition) {
    if (micBtn) {
      micBtn.disabled = true;
      micBtn.textContent = "\u041d\u0435\u0442 \u043c\u0438\u043a\u0440\u043e";
    }
  } else {
    micBtn?.addEventListener("click", () => {
      const recognition = new Recognition();
      recognition.lang = "ru-RU";
      recognition.interimResults = true;
      recognition.continuous = false;
      let transcript = "";
      recognition.onstart = () => {
        micBtn.classList.add("is-listening");
        micBtn.textContent = "\u0421\u043b\u0443\u0448\u0430\u044e";
        if (answer) answer.textContent = "\u0413\u043e\u0432\u043e\u0440\u0438, \u043d\u043e \u043d\u0435 \u043f\u0440\u043e\u0441\u0438 \u0433\u043e\u0442\u043e\u0432\u044b\u0439 \u043e\u0442\u0432\u0435\u0442.";
      };
      recognition.onresult = event => {
        transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || "")
          .join(" ")
          .trim();
        if (input) input.value = transcript;
      };
      recognition.onerror = () => {
        if (answer) answer.textContent = "\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u043d\u0435 \u0441\u0440\u0430\u0431\u043e\u0442\u0430\u043b.";
      };
      recognition.onend = () => {
        micBtn.classList.remove("is-listening");
        micBtn.textContent = "\u0413\u043e\u043b\u043e\u0441";
        if (transcript) askLiveCoachHint(item, card, transcript);
      };
      try {
        recognition.start();
      } catch {
        if (answer) answer.textContent = "\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u0443\u0436\u0435 \u0437\u0430\u043d\u044f\u0442.";
      }
    });
  }
  card.appendChild(help);
}

function isAffirmativeVoiceReply(text){
  const normalized = String(text || "").toLowerCase().replace(/[.,!?;:]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  return [
    "принял",
    "понял",
    "начать",
    "начинаем",
    "да",
    "есть",
    "согласен",
    "запускай",
    "погнали",
    "готов",
    "ок",
    "okay",
    "yes",
  ].some(phrase => normalized === phrase || normalized.includes(` ${phrase} `) || normalized.startsWith(`${phrase} `) || normalized.endsWith(` ${phrase}`));
}

function showGeneralCommandDialog(action, context = {}){
  const dialog = ensureGeneralCommandDialog();
  const title = dialog.querySelector("#generalCommandTitle");
  const message = dialog.querySelector("#generalCommandMessage");
  const reason = dialog.querySelector("#generalCommandReason");
  const ok = dialog.querySelector("#generalCommandOk");
  const mic = dialog.querySelector("#generalCommandMic");
  const transcript = dialog.querySelector("#generalCommandTranscript");
  const Recognition = getSpeechRecognitionCtor();

  const type = String(action?.type || "none");
  setCoachAvatarMood(getCoachAvatarMood(context.event || "", coachState?.tone || "strict", type));
  setCoachAvatarImage(dialog.querySelector("[data-coach-avatar]"), coachState?.avatarMood || "command");
  const cleanReason = String(action?.reason || "").trim();
  if (title) title.textContent = getAiCoachActionLabel(type);
  if (message) message.textContent = context.message || coachState?.lastMessage || "";
  if (ok) ok.textContent = type === "start_micro_drill"
    ? "\u041d\u0430\u0447\u0430\u0442\u044c \u043e\u0442\u0440\u0430\u0431\u043e\u0442\u043a\u0443"
    : "\u041f\u0440\u0438\u043d\u044f\u043b";
  if (reason) {
    reason.textContent = cleanReason
      ? `\u0420\u0435\u0448\u0435\u043d\u0438\u0435: ${cleanReason}`
      : "\u0420\u0435\u0448\u0435\u043d\u0438\u0435: \u0441\u043c\u0435\u043d\u0430 \u043f\u043b\u0430\u043d\u0430 \u0442\u0440\u0435\u043d\u0438\u0440\u043e\u0432\u043a\u0438.";
  }

  return new Promise(resolve => {
    let recognition = null;
    let listening = false;
    let closeResult = true;
    let finalTranscript = "";
    let waitingForAi = false;
    let closing = false;

    const close = (result = closeResult) => {
      closing = true;
      if (recognition && listening) {
        try { recognition.stop(); } catch {}
      }
      listening = false;
      dialog.classList.remove("is-visible");
      document.body.classList.remove("general-command-open");
      ok?.removeEventListener("click", onOkClick);
      mic?.removeEventListener("click", onMicClick);
      document.removeEventListener("keydown", onKey);
      setTimeout(() => resolve(result), 180);
    };
    const setTranscript = text => {
      if (transcript) transcript.textContent = text;
    };
    const setWaiting = value => {
      waitingForAi = value;
      if (mic) mic.disabled = value || !Recognition;
      if (ok) ok.disabled = value;
    };
    const askGeneralAboutReply = async text => {
      const reply = String(text || "").trim();
      if (!reply || waitingForAi || closing) return;
      const disrespectful = isDisrespectfulCoachText(reply);
      rememberCoachExchange("commandReplyUser", reply, { disrespectful });
      setWaiting(true);
      setTranscript("\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0434\u0443\u043c\u0430\u0435\u0442 \u043d\u0430\u0434 \u043e\u0442\u0432\u0435\u0442\u043e\u043c...");
      try {
        const data = await apiJson("/api/coach-message", {
          method: "POST",
          body: JSON.stringify({
            event: "commandReply",
            tone: "strict",
            localMessage: context.message || coachState?.lastMessage || "",
            userReply: reply,
            proposedAction: {
              type,
              size: Number(action?.size || 3) || 3,
              reason: cleanReason,
            },
            stats: Object.assign({}, getAiCoachStats(), {
              proposedSize: Number(action?.size || 3) || 3,
              userDisrespectedGeneral: disrespectful,
              coachMemory: getCoachMemoryPayload(),
              coachTheme: getCoachThemePayload(),
            }),
            problemMode: Boolean(state.problemReview?.active || state.problemReview?.locked),
          }),
        });
        applyCoachPersona(data, { event: "commandReply", disrespectful });
        if (data?.message && message) message.textContent = normalizeCoachDisplayMessage(data.message);
        if (data?.message) rememberCoachExchange("coach", normalizeCoachDisplayMessage(data.message));
        const nextAction = data?.action && typeof data.action === "object" ? data.action : { type: "none" };
        if (String(nextAction.type || "none") === "discipline_penalty") {
          applyCoachDisciplinePenalty(nextAction, { event: "commandReply" });
          closeResult = false;
          if (ok) {
            ok.textContent = "\u0417\u0430\u043a\u0440\u044b\u0442\u044c";
            ok.disabled = false;
          }
          setTranscript("\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0441\u0430\u043c \u0432\u044b\u0431\u0440\u0430\u043b \u043d\u0430\u043a\u0430\u0437\u0430\u043d\u0438\u0435. \u0421\u0442\u0440\u043e\u0439 \u0434\u0440\u043e\u0433\u043d\u0443\u043b.");
          return;
        }
        if (String(nextAction.type || "none") === "start_micro_drill") {
          closeResult = true;
          setTranscript("\u041f\u0440\u0438\u043a\u0430\u0437 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d. \u0417\u0430\u043f\u0443\u0441\u043a\u0430\u044e \u043e\u0442\u0440\u0430\u0431\u043e\u0442\u043a\u0443.");
          setTimeout(() => close(true), 650);
          return;
        }
        closeResult = false;
        if (ok) {
          ok.textContent = "\u0417\u0430\u043a\u0440\u044b\u0442\u044c";
          ok.disabled = false;
        }
        setTranscript("\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043f\u0440\u0438\u043d\u044f\u043b \u043e\u0442\u0432\u0435\u0442. \u041e\u0442\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u043d\u0435 \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0435\u0442\u0441\u044f.");
      } catch (error) {
        console.warn("[coach] voice reply failed:", error);
        if (disrespectful) {
          applyCoachDisciplinePenalty(randomCoachDisciplineAction("fallback after disrespectful voice reply"), { event: "commandReply" });
        }
        closeResult = false;
        if (message) message.textContent = error?.message || "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043d\u0435 \u0434\u043e\u0441\u0442\u0443\u0447\u0430\u043b\u0441\u044f \u0434\u043e \u0448\u0442\u0430\u0431\u0430.";
        if (ok) {
          ok.textContent = "\u0417\u0430\u043a\u0440\u044b\u0442\u044c";
          ok.disabled = false;
        }
        setTranscript("\u041e\u0442\u0432\u0435\u0442 \u043d\u0435 \u0443\u0448\u0435\u043b \u0432 OpenAI. \u0421\u043c\u043e\u0442\u0440\u0438 \u043a\u043e\u043d\u0441\u043e\u043b\u044c \u0438 \u043b\u043e\u0433\u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u0430.");
      } finally {
        setWaiting(false);
      }
    };
    const onMicClick = () => {
      if (!Recognition || listening) return;
      recognition = new Recognition();
      recognition.lang = "ru-RU";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        listening = true;
        mic?.classList.add("is-listening");
        if (mic) mic.textContent = "\u0421\u043b\u0443\u0448\u0430\u044e...";
        setTranscript("\u0413\u043e\u0432\u043e\u0440\u0438. \u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0441\u043b\u0443\u0448\u0430\u0435\u0442.");
      };
      recognition.onresult = event => {
        const text = Array.from(event.results)
          .map(result => result[0]?.transcript || "")
          .join(" ")
          .trim();
        if (!text) return;
        finalTranscript = text;
        setTranscript(text);
      };
      recognition.onerror = () => {
        setTranscript("\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u043d\u0435 \u0441\u0440\u0430\u0431\u043e\u0442\u0430\u043b. \u041c\u043e\u0436\u043d\u043e \u043d\u0430\u0436\u0430\u0442\u044c \u043a\u043d\u043e\u043f\u043a\u0443.");
      };
      recognition.onend = () => {
        listening = false;
        mic?.classList.remove("is-listening");
        if (mic) mic.textContent = "\u041e\u0442\u0432\u0435\u0442\u0438\u0442\u044c \u0433\u043e\u043b\u043e\u0441\u043e\u043c";
        if (finalTranscript && !closing) {
          const reply = finalTranscript;
          finalTranscript = "";
          askGeneralAboutReply(reply);
        }
      };
      try {
        recognition.start();
      } catch {
        setTranscript("\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u0443\u0436\u0435 \u0437\u0430\u043d\u044f\u0442. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0435 \u0440\u0430\u0437.");
      }
    };
    const onKey = event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        close(true);
      }
    };
    const onOkClick = () => close(closeResult);

    ok?.addEventListener("click", onOkClick);
    mic?.addEventListener("click", onMicClick);
    document.addEventListener("keydown", onKey);
    if (mic) {
      mic.disabled = !Recognition;
      mic.textContent = Recognition
        ? "\u041e\u0442\u0432\u0435\u0442\u0438\u0442\u044c \u0433\u043e\u043b\u043e\u0441\u043e\u043c"
        : "\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d";
    }
    setTranscript(Recognition
      ? "\u041e\u0442\u0432\u0435\u0442\u044c \u0433\u043e\u043b\u043e\u0441\u043e\u043c: \u0433\u0435\u043d\u0435\u0440\u0430\u043b \u0441\u0430\u043c \u0440\u0435\u0448\u0438\u0442, \u0447\u0442\u043e \u0434\u0435\u043b\u0430\u0442\u044c."
      : "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043d\u0435 \u0434\u0430\u043b \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u0432\u0430\u043d\u0438\u0435 \u0440\u0435\u0447\u0438. \u041e\u0442\u0432\u0435\u0442\u044c \u043a\u043d\u043e\u043f\u043a\u043e\u0439."
    );
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
  const allowed = new Set(["boost_problem_question", "start_micro_drill", "discipline_penalty"]);
  if (!allowed.has(type)) {
    logAiCoachAction({ type, skipped: true, reason: "unknown_action" });
    return;
  }

  if (type === "discipline_penalty") {
    applyCoachDisciplinePenalty(action, context);
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
    boostProblemQuestionPriority(item, reason);
    return;
  }

  if (type === "start_micro_drill") {
    if (!["finish", "problemRound"].includes(context.event)) {
      logAiCoachAction({ type, skipped: true, reason: "event_not_allowed" });
      return;
    }
    const review = prepareAiMicroDrill(action.size, reason);
    if (!review) return;
    const shouldStart = await showGeneralCommandDialog(
      Object.assign({}, action, { size: review.questionIds.length }),
      context
    );
    if (!shouldStart) {
      logAiCoachAction({ type, skipped: true, reason: "voice_reply_declined" });
      return;
    }
    startAiMicroDrill(review, reason);
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
          severeReviewRecommended: event === "finish" && (Number(data.percent || 0) <= 60 || Number(coachState?.wrongStreak || 0) >= 8),
          canStartMicroDrill: !startBtn.disabled || !TEST.length,
          coachMemory: getCoachMemoryPayload(),
          coachTheme: getCoachThemePayload(),
        },
      }),
    });

    const json = await response.json();
    if (!response.ok) {
      showAiCoachUnavailable(json.error || `http_${response.status}`, json.detail || json, localMessage);
      return;
    }
    const message = normalizeCoachDisplayMessage(json.message || "");
    if (!message) {
      showAiCoachUnavailable("empty_message", json, localMessage);
      return;
    }
    if (!coachState || coachState.lastMessage !== localMessage) return;

    applyCoachPersona(json, { event, data });
    coachState.lastMessage = message;
    rememberCoachExchange("coach", message);
    coachState.lastMessageAt = Date.now();
    saveCoachState();
    renderCoachPanel(message);
    let action = json.action;
    if (shouldForceAiMicroDrill(event, data, action)) {
      const candidateCount = getProblemCandidates(currentBankKey).length;
      action = {
        type: "start_micro_drill",
        size: Math.min(10, Math.max(3, candidateCount)),
        reason: "severe weak-spot review"
      };
    }
    coachState.avatarMood = getCoachAvatarMood(event, coachState.tone, action?.type || "");
    saveCoachState();
    renderCoachPanel(message);
    applyAiCoachAction(action, { event, tone, data, localMessage, message });
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
  coachState.avatarMood = getCoachAvatarMood(event, coachState.tone);
  const message = getCoachMessage(event, coachState.tone, data);
  coachState.lastMessage = message;
  coachState.lastEvent = event;
  coachState.lastMessageAt = Date.now();
  saveCoachState();
  renderCoachPanel(message);
  requestAiCoachMessage(event, coachState.tone, data, message);
}

coachState = loadCoachState();

function shouldForceAiMicroDrill(event, data = {}, action = null){
  const actionType = String(action?.type || "none");
  if (actionType === "start_micro_drill") return false;
  if (!["finish", "problemRound"].includes(event)) return false;

  const candidates = getProblemCandidates(currentBankKey).length;
  if (candidates < 3) return false;
  if (startBtn.disabled && TEST.length && !isInLearningMode) return false;

  const percent = Number(data.percent || 0);
  const wrong = Number(data.wrong || 0);
  const wrongStreak = Number(coachState?.wrongStreak || 0);
  const missedStreak = Number(coachState?.missedStreak || 0);
  return event === "problemRound"
    || percent <= 60
    || wrong >= 3
    || wrongStreak >= 8
    || missedStreak >= 4;
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
  // РџРµСЂРµСЂРёСЃРѕРІР°С‚СЊ С‚РµСЃС‚ С‚РѕР»СЊРєРѕ РµСЃР»Рё РѕРЅ РґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕ Р·Р°РїСѓС‰РµРЅ (РєРЅРѕРїРєР° "РќР°С‡Р°С‚СЊ" РѕС‚РєР»СЋС‡РµРЅР°)
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
  liveCoachHintUsed.clear();
  liveCoachHintsLocked = false;
  const picked = shuffle([...ALL]).slice(0, Math.min(TEST_SIZE, ALL.length));
  TEST = picked.map(buildTestItem);
}

function buildTestHard(){
  answers.clear();
  liveCoachHintUsed.clear();
  liveCoachHintsLocked = false;

  const hardItems = ALL.filter(x => hasHardQuestion(x.n));
  if (hardItems.length === 0){
    alert("\u041d\u0435\u0442 \u043f\u043e\u043c\u0435\u0447\u0435\u043d\u043d\u044b\u0445 \u0441\u043b\u043e\u0436\u043d\u044b\u0445 \u0432\u043e\u043f\u0440\u043e\u0441\u043e\u0432.");
    return false;
  }

  const picked = shuffle([...hardItems]).slice(0, Math.min(TEST_SIZE, hardItems.length));
  TEST = picked.map(buildTestItem);

  return true;
}

function buildProblemReviewTest(review){
  answers.clear();
  liveCoachHintUsed.clear();
  liveCoachHintsLocked = false;
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
  // СЂРµР¶РёРј С‚РµРєСЃС‚Р°: РµСЃС‚СЊ input[type=text] Рё РѕРЅ РЅРµ РїСѓСЃС‚РѕР№
  const txt = card.querySelector('input[type="text"]');
  if (txt) return txt.value.trim().length > 0;

  // СЂРµР¶РёРј РІР°СЂРёР°РЅС‚РѕРІ: РµСЃС‚СЊ РІС‹Р±СЂР°РЅРЅС‹Р№ radio
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
      badge.textContent = "РћС‚РІРµС‚РёС‚СЊ!";
      // РІСЃС‚Р°РІРёРј РїРµСЂРµРґ С„Р»Р°Р¶РєРѕРј "РЎР»РѕР¶РЅС‹Р№", С‡С‚РѕР±С‹ РЅРµ Р»РѕРјР°С‚СЊ РІРµСЂСЃС‚РєСѓ
      qhead.appendChild(badge);
    }
  } else {
    if (badge) badge.remove();
  }
}

function setupSkipHighlighter(){
  // СѓР±СЂР°С‚СЊ СЃС‚Р°СЂС‹Р№ observer РїСЂРё РїРµСЂРµСЂРёСЃРѕРІРєРµ
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

      // РµСЃР»Рё СѓР¶Рµ РѕС‚РІРµС‡РµРЅРѕ вЂ” РЅРёС‡РµРіРѕ РЅРµ РїРѕРґСЃРІРµС‡РёРІР°РµРј
      const unanswered = !isCardAnswered(card);
      setSkipUI(card, unanswered);
    }
  }, {
    root: null,
    threshold: 0.65,         // СЃС‡РёС‚Р°РµРј "РґРѕС€РµР»", РєРѕРіРґР° РІРёРґРЅРѕ Р±РѕР»СЊС€СѓСЋ С‡Р°СЃС‚СЊ РєР°СЂС‚РѕС‡РєРё
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

  // РµСЃР»Рё hardMode вЂ” С‚Р°Рј РѕРґРёРЅ РІРѕРїСЂРѕСЃ РЅР° СЌРєСЂР°РЅРµ, РїСЂРѕСЃС‚Рѕ РїРѕРґСЃРІРµС‚РёРј
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
  // РµСЃР»Рё СѓР¶Рµ РµСЃС‚СЊ вЂ” РЅРµ РїР»РѕРґРёРј
  if (document.getElementById("finishBlockedModal")) return;

  const el = document.createElement("div");
  el.id = "finishBlockedModal";
  el.className = "hardmode-fail-overlay show";
  el.innerHTML = `
    <div class="hardmode-fail-content">
      <div class="hardmode-fail-icon">\u26a0\ufe0f</div>
      <div class="hardmode-fail-title">\u0415\u0441\u0442\u044c \u043f\u0440\u043e\u043f\u0443\u0449\u0435\u043d\u043d\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b</div>
      <div class="hardmode-fail-sub">\u041d\u0443\u0436\u043d\u043e \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c, \u0438\u043d\u0430\u0447\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u043d\u0435\u043b\u044c\u0437\u044f</div>
      <div style="display:flex; gap:10px; justify-content:center; margin-top:16px">
        <button id="goMissBtn">\u041f\u0435\u0440\u0435\u0439\u0442\u0438</button>
        <button class="secondary" id="cancelMissBtn">\u041e\u0442\u043c\u0435\u043d\u0430</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  document.getElementById("goMissBtn").onclick = () => {
    scrollToQuestion(idx);
    el.remove();
  };
  document.getElementById("cancelMissBtn").onclick = () => el.remove();
  return;
  el.innerHTML = `
    <div class="hardmode-fail-content">
      <div class="hardmode-fail-icon">вљ пёЏ</div>
      <div class="hardmode-fail-title">Р•СЃС‚СЊ РїСЂРѕРїСѓС‰РµРЅРЅС‹Рµ РІРѕРїСЂРѕСЃС‹</div>
      <div class="hardmode-fail-sub">РќСѓР¶РЅРѕ РѕС‚РІРµС‚РёС‚СЊ, РёРЅР°С‡Рµ Р·Р°РІРµСЂС€РёС‚СЊ РЅРµР»СЊР·СЏ</div>
      <div style="display:flex; gap:10px; justify-content:center; margin-top:16px">
        <button id="goMissBtn">РџРµСЂРµР№С‚Рё</button>
        <button class="secondary" id="cancelMissBtn">РћС‚РјРµРЅР°</button>
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

// ===== РЎС‚Р°С‚РёСЃС‚РёРєР° РїРѕ РІРѕРїСЂРѕСЃР°Рј (per bankN) =====
const QSTATS_KEY = "quiz_qstats_v1";

function loadQStats(){
  try {
    const saved = localStorage.getItem(QSTATS_KEY);
    if (!saved) return {};
    return JSON.parse(saved);
  } catch(e){
    console.warn("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃС‚Р°С‚РёСЃС‚РёРєРё РІРѕРїСЂРѕСЃРѕРІ:", e);
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

function prepareAiMicroDrill(size = 3, reason = ""){
  const key = resolveBankKey(currentBankKey);
  const limit = Math.max(3, Math.min(10, Number(size || 3)));
  const candidates = getProblemCandidates(key).slice(0, limit);
  if (candidates.length < 3) {
    logAiCoachAction({ type: "start_micro_drill", skipped: true, reason: "not_enough_candidates" });
    return null;
  }
  if (startBtn.disabled && TEST.length && !isInLearningMode) {
    logAiCoachAction({ type: "start_micro_drill", skipped: true, reason: "test_is_running" });
    return null;
  }

  return {
    active: true,
    aiMicro: true,
    bankKey: key,
    startedAt: new Date().toISOString(),
    questionIds: candidates.map(x => String(x.bankN)),
    progress: {},
    reason
  };
}

function startAiMicroDrill(review, reason = ""){
  const key = resolveBankKey(review?.bankKey || currentBankKey);
  if (!review || !Array.isArray(review.questionIds) || review.questionIds.length < 3) return false;
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
    <div class="result" tabindex="-1">Р—Р°РєСЂРµРїР»РµРЅРёРµ РїСЂРѕРґРѕР»Р¶Р°РµС‚СЃСЏ</div>
    <div class="muted">РћСЃС‚Р°Р»РѕСЃСЊ Р·Р°РєСЂС‹С‚СЊ: <b>${result.pending.length}</b>. РћС€РёР±РєР° СЃР±СЂР°СЃС‹РІР°РµС‚ СЃРµСЂРёСЋ, РїСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚ РґРѕР±Р°РІР»СЏРµС‚ +1.</div>
  `;
  elOut.style.display = "block";
  startTimer();
  saveActiveTest();
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
    console.warn("updateQStatsOnFinish: TEST РїСѓСЃС‚РѕР№");
    return;
  }
  
  if (!bankKey) {
    console.warn("updateQStatsOnFinish: bankKey РЅРµ СѓРєР°Р·Р°РЅ");
    return;
  }
  
  const allStats = loadQStats();
  if (!allStats[bankKey]) allStats[bankKey] = {};
  const bankStats = allStats[bankKey];
  const now = new Date().toISOString();
  
  let updatedCount = 0;
  for (const item of TEST){
    if (!item || !item.bankN) {
      console.warn("updateQStatsOnFinish: РїСЂРѕРїСѓС‰РµРЅ РІРѕРїСЂРѕСЃ Р±РµР· bankN", item);
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

// ===== РЎРµСЃСЃРёРё/РёСЃС‚РѕСЂРёСЏ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ =====
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
    console.warn("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРµСЃСЃРёР№:", e);
  }
  
  sessions.unshift(sessionData);
  sessions = sessions.slice(0, 50); // РїРѕСЃР»РµРґРЅРёРµ 50
  
  localStorage.setItem(key, JSON.stringify(sessions));
}

function loadSessions(bankKey){
  const key = getSessionsKey(bankKey);
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch(e){
    console.warn("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРµСЃСЃРёР№:", e);
    return [];
  }
}

let isInLearningMode = false;

// ===== Р РµРєРѕСЂРґС‹ hardmode =====
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
    console.warn("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЂРµРєРѕСЂРґРѕРІ hardmode:", e);
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

  // Р’ Hardmode РїРѕРєР°Р·С‹РІР°РµРј С‚РѕР»СЊРєРѕ С‚РµРєСѓС‰РёР№ РІРѕРїСЂРѕСЃ
  const itemsToShow = hardMode ? (TEST[curIdx] ? [TEST[curIdx]] : []) : TEST;

  for (const item of itemsToShow){
    const card = document.createElement("div");
    card.className = "card";
    if (isProblemReviewMode) card.classList.add("problem-review-card");
    card.dataset.qid = item.id;
    if (hardMode) card.id = "activeQuestionCard";

    // РЎРѕР·РґР°С‘Рј СЃС‚СЂСѓРєС‚СѓСЂСѓ qhead СЃ С„Р»Р°Р¶РєРѕРј
    const qhead = document.createElement("div");
    qhead.className = "qhead";

    const title = document.createElement("div");
    title.className = "qtitle";
    title.textContent = `${item.n}) ${displayText(item.q)}`;
    if (translateRu) title.title = item.q;

    const flagLabel = document.createElement("label");
    flagLabel.className = "flagToggle";
    flagLabel.title = "РћС‚РјРµС‚РёС‚СЊ РєР°Рє СЃР»РѕР¶РЅС‹Р№";

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
    flagText.textContent = "РЎР»РѕР¶РЅС‹Р№";

    flagLabel.appendChild(flagInput);
    flagLabel.appendChild(flagIcon);
    flagLabel.appendChild(flagText);

    qhead.appendChild(title);
    qhead.appendChild(flagLabel);
    card.appendChild(qhead);
    addCoachHelp(card, item);

    if (isProblemReviewMode){
      const review = loadProblemReview(activeProblemReviewBank || currentBankKey);
      const streak = review?.progress?.[String(item.bankN)]?.streak || 0;
      const note = document.createElement("div");
      note.className = "problem-review-note";
      note.textContent = `Р—Р°РєСЂРµРїР»РµРЅРёРµ: РЅСѓР¶РЅРѕ ${PROBLEM_CLEAR_STREAK} РїСЂР°РІРёР»СЊРЅС‹С… РїРѕРґСЂСЏРґ. РЎРµР№С‡Р°СЃ: ${streak}/${PROBLEM_CLEAR_STREAK}. РћС€РёР±РєР° СЃР±СЂРѕСЃРёС‚ СЃРµСЂРёСЋ.`;
      card.appendChild(note);
    }
    
    // РџСЂРѕРіСЂРµСЃСЃ-Р±Р°СЂ РґР»СЏ hardmode
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
      inp.placeholder = "Р’РІРµРґРёС‚Рµ РѕС‚РІРµС‚вЂ¦";
      inp.value = answers.get(item.id) ?? "";
      inp.addEventListener("input", () => {
        answers.set(item.id, inp.value);
        setSkipUI(card, inp.value.trim() === "");
        saveActiveTest();
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
        ? "Р’РІРµРґРёС‚Рµ РѕС‚РІРµС‚ Рё РЅР°Р¶РјРёС‚Рµ Enter. Р РµРіРёСЃС‚СЂ Рё Р»РёС€РЅРёРµ РїСЂРѕР±РµР»С‹ РёРіРЅРѕСЂРёСЂСѓСЋС‚СЃСЏ."
        : "РџСЂРѕРІРµСЂРєР°: Р±РµР· СЂРµРіРёСЃС‚СЂР°, Р»РёС€РЅРёРµ РїСЂРѕР±РµР»С‹ РёРіРЅРѕСЂРёСЂСѓСЋС‚СЃСЏ.";
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
          saveActiveTest();
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
      hint.textContent = "Р’С‹Р±РµСЂРё РѕРґРёРЅ РІР°СЂРёР°РЅС‚ (AвЂ“E).";
      card.appendChild(hint);
    }

    frag.appendChild(card);
  }

  elQuiz.appendChild(frag);
  setupSkipHighlighter();

  const notFound = TEST.filter(t => t.correctIndex === -1).length;
  if (isProblemReviewMode){
    const status = getProblemReviewStatus(activeProblemReviewBank || currentBankKey);
    setStatusPill("Р—Р°РєСЂРµРїР»РµРЅРёРµ РїСЂРѕР±Р»РµРјРЅС‹С…");
    setMetaText(
      `РћСЃС‚Р°Р»РѕСЃСЊ Р·Р°РєСЂС‹С‚СЊ: ${status.pending}. РќСѓР¶РЅРѕ ${PROBLEM_CLEAR_STREAK} РїСЂР°РІРёР»СЊРЅС‹С… РїРѕРґСЂСЏРґ РїРѕ РєР°Р¶РґРѕРјСѓ РІРѕРїСЂРѕСЃСѓ.` +
      (notFound ? ` РљР»СЋС‡ РЅРµ РЅР°Р№РґРµРЅ: ${notFound}` : "")
    );
    finishBtn.disabled = false;
    learnBtn.disabled = true;
    restartBtn.disabled = true;
    return;
  }
  setStatusPill("РўРµСЃС‚ Р·Р°РїСѓС‰РµРЅ");
  setMetaText(
    `Р’РѕРїСЂРѕСЃРѕРІ: ${TEST.length} (РёР· ${ALL.length}). Р РµР¶РёРј: ${mode === "mcq" ? "AвЂ“E" : "С‚РµРєСЃС‚"}.` +
    (notFound ? ` вљ пёЏ РќРµ РЅР°Р№РґРµРЅ РєР»СЋС‡ РґР»СЏ: ${notFound}` : "")
  );
  finishBtn.disabled = false;
  learnBtn.disabled = hardMode;  // РЅРµРґРѕСЃС‚СѓРїРЅР° РІ hardmode
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
  
  // РџРѕР»СѓС‡Р°РµРј bankKey РґР»СЏ СЃС‚Р°С‚РёСЃС‚РёРєРё
  const bankKey = resolveBankKey(localStorage.getItem("quiz_bank") || DEFAULT_BANK_KEY);
  
  // Р”Р»СЏ hardmode: СЃС‡РёС‚Р°РµРј streakQuestions (СЃРєРѕР»СЊРєРѕ РІРѕРїСЂРѕСЃРѕРІ РїРѕРґСЂСЏРґ РїСЂРѕР№РґРµРЅРѕ)
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
        break; // РїСЂРµСЂС‹РІР°РµРј РЅР° РїРµСЂРІРѕР№ РѕС€РёР±РєРµ
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
        ok = false; // РµСЃР»Рё РєР»СЋС‡ РЅРµ РЅР°С€Р»Рё
      } else {
        ok = (user === item.correctIndex);
      }
      // Р’ hardmode -1 СЃС‡РёС‚Р°РµС‚СЃСЏ С‚Р°Р№РјР°СѓС‚РѕРј
      if (hardMode && user === -1) isTimeout = true;
    } else {
      ok = acceptDisplayText(user ?? "", item.correctText);
      // Р’ hardmode РїСѓСЃС‚РѕР№ РѕС‚РІРµС‚ СЃС‡РёС‚Р°РµС‚СЃСЏ С‚Р°Р№РјР°СѓС‚РѕРј
      if (hardMode && (!user || String(user).trim() === "")) isTimeout = true;
    }

    // РђРІС‚Рѕ-Р»РѕРіРёРєР° РґР»СЏ СЃР»РѕР¶РЅС‹С… РІРѕРїСЂРѕСЃРѕРІ
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
        ? (typeof user === "number" ? item.options[user] : "(РїСѓСЃС‚Рѕ)")
        : (user || "(РїСѓСЃС‚Рѕ)");

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

// РћР±РЅРѕРІР»СЏРµРј СЃС‚Р°С‚РёСЃС‚РёРєСѓ РїРѕ РІРѕРїСЂРѕСЃР°Рј
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

// === HARDMODE ACHIEVEMENT (С‚РѕР»СЊРєРѕ РµСЃР»Рё 100% Рё С‚РµСЃС‚ >= 50) ===
clearActiveTest();

const hardModePassed = hardMode && TEST.length >= 50 && percent === 100;
let achievedTier = 0;
if (hardModePassed) {
  achievedTier = 1;                 // 50вЂ“99  -> +
  if (TEST.length >= 266) achievedTier = 4;      // в­ђ
  else if (TEST.length >= 200) achievedTier = 3;      // +++
  else if (TEST.length >= 100) achievedTier = 2; // ++

  giveHardAchievement(achievedTier, TEST.length);
}

// РЎРѕС…СЂР°РЅСЏРµРј СЃРµСЃСЃРёСЋ
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

// РћР±РЅРѕРІР»СЏРµРј СЂРµРєРѕСЂРґС‹ hardmode
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
    const tierMarks = ["", "+", "++", "+++", "в­ђ"][achievedTier];
    parts.push(`<div class="result" id="resultTitle" tabindex="-1">рџЏ† <span class="ok">РҐР°СЂРґРјРѕРґ РїСЂРѕР№РґРµРЅ!</span> <span class="${percent >= 60 ? "ok" : "bad"}">${percent}%</span> В· Р”РѕСЃС‚РёР¶РµРЅРёРµ: <span class="ok">${tierMarks}</span></div>`);
    parts.push(`<div class="muted">РџСЂР°РІРёР»СЊРЅС‹С… РѕС‚РІРµС‚РѕРІ: <b>${correct}</b> РёР· <b>${TEST.length}</b>.</div>`);
    parts.push(`<div class="muted">Р’СЂРµРјСЏ РїСЂРѕС…РѕР¶РґРµРЅРёСЏ: <b>${fmt(elapsedMs)}</b> В· РЎСЂРµРґРЅРµРµ РЅР° РІРѕРїСЂРѕСЃ: <b>${fmt(avgMs)}</b></div>`);
  } else {
    parts.push(`<div class="result" id="resultTitle" tabindex="-1">Р РµР·СѓР»СЊС‚Р°С‚: <span class="${percent >= 60 ? "ok" : "bad"}">${percent}%</span></div>`);
    parts.push(`<div class="muted">РџСЂР°РІРёР»СЊРЅС‹С… РѕС‚РІРµС‚РѕРІ: <b>${correct}</b> РёР· <b>${TEST.length}</b>.</div>`);
    parts.push(`<div class="muted">Р’СЂРµРјСЏ РїСЂРѕС…РѕР¶РґРµРЅРёСЏ: <b>${fmt(elapsedMs)}</b> В· РЎСЂРµРґРЅРµРµ РЅР° РІРѕРїСЂРѕСЃ: <b>${fmt(avgMs)}</b></div>`);
  }

  // Compact errors display with collapsible details
  if (wrong.length){
    parts.push(`<div class="divider"></div>`);
    parts.push(`<details open><summary>РћС€РёР±РєРё (${wrong.length})</summary><div class="small">` + wrong.map(w =>
      `<div style="margin:10px 0">
        <div><b>${w.n})</b> ${escapeHtml(displayText(w.q))}</div>
        <div class="bad">РўРІРѕР№ РѕС‚РІРµС‚: ${escapeHtml(w.your)}</div>
        <div class="ok">РџСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚: ${escapeHtml(w.expected)}</div>
      </div>`
    ).join("") + `</div></details>`);
  } else {
    parts.push(`<div class="divider"></div><div class="ok"><b>Р’СЃРµ РѕС‚РІРµС‚С‹ РїСЂР°РІРёР»СЊРЅС‹Рµ</b></div>`);
  }

  elOut.innerHTML = parts.join("");
  elOut.style.display = "block";
  elQuiz.innerHTML = "";
  setStatusPill("РўРµСЃС‚ Р·Р°РІРµСЂС€С‘РЅ");
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  startBtn.disabled = false;
  restartBtn.disabled = false;
  if (abortBtn) abortBtn.disabled = true;
  setRunning(false);
  setGeneralChaosMode(false);
  appEl.classList.add("has-output");
  
  // РЎРѕС…СЂР°РЅСЏРµРј РѕР±РЅРѕРІР»РµРЅРЅС‹Рµ СЃР»РѕР¶РЅС‹Рµ РІРѕРїСЂРѕСЃС‹ Рё СЃС‚Р°С‚РёСЃС‚РёРєСѓ
  saveHard();
  saveHardStats();
  updateHardButton();

const gained = calcTestExp({ percent, questionsCount: TEST.length, hardMode });
stats.tests_completed++;
stats.exp_tests += gained;

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
    setBank(bankSelect.value); // РїРµСЂРµР·Р°РіСЂСѓР·РёС‚СЊ С‚РµРєСѓС‰РёР№ Р±Р°РЅРє
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
  hmAudio.volume = 0.7;     // РјРѕР¶РЅРѕ РЅР°СЃС‚СЂРѕРёС‚СЊ
  hmAudio.loop = false;
  hmAudio.addEventListener("ended", () => {
    // СЃР»РµРґСѓСЋС‰РёР№ С‚СЂРµРє РїРѕ РєСЂСѓРіСѓ
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
  if (a.src && !a.paused) return; // СѓР¶Рµ РёРіСЂР°РµС‚

  // СЃР»СѓС‡Р°Р№РЅС‹Р№ С‚СЂРµРє РїСЂРё Р·Р°РїСѓСЃРєРµ
  hmIndex = Math.floor(Math.random() * HARDMODE_PLAYLIST.length);
  a.src = HARDMODE_PLAYLIST[hmIndex];

  // Р·Р°РїСѓСЃРє РІРѕР·РјРѕР¶РµРЅ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ РєР»РёРєР° вЂ” Сѓ С‚РµР±СЏ СЌС‚Рѕ РєР°Рє СЂР°Р· "РќР°С‡Р°С‚СЊ"
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
      // РЎР±СЂР°СЃС‹РІР°РµРј Р°РЅРёРјР°С†РёСЋ
      requestAnimationFrame(() => {
        progressBar.style.animation = "q-progress-fill 5s linear forwards";
      });
    }
  }

  // РјРёРіР°РЅРёРµ Р·Р° 1.5 СЃРµРє РґРѕ РєРѕРЅС†Р° (5.0 - 1.5 = 3.5)
  qWarnTimer = setTimeout(() => {
    const card = document.getElementById("activeQuestionCard");
    if (card) {
      card.classList.add("time-low");
      // Р’РёР±СЂР°С†РёСЏ РЅР° РјРѕР±РёР»СЊРЅС‹С… СѓСЃС‚СЂРѕР№СЃС‚РІР°С…
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
  // РЅРµ РѕС‚РІРµС‚РёР» -> СЃС‡РёС‚Р°РµС‚СЃСЏ РЅРµРїСЂР°РІРёР»СЊРЅС‹Рј
  answers.set(TEST[curIdx].id, -1); // -1 = РїСѓСЃС‚Рѕ/РЅРµ РѕС‚РІРµС‡РµРЅРѕ
  saveActiveTest();
  if (hardMode) {
    showHardModeFail();
  } else {
    breakAndNext(true);
  }
}

function checkHardModeAnswer(item, userAnswer){
  if (!hardMode) return true; // РЅРµ С…Р°СЂРґРјРѕРґ - РїСЂРѕРїСѓСЃРєР°РµРј РїСЂРѕРІРµСЂРєСѓ
  
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
  
  // РЎРѕС…СЂР°РЅСЏРµРј СЂРµРєРѕСЂРґС‹ hardmode РїРµСЂРµРґ Р·Р°РІРµСЂС€РµРЅРёРµРј
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
  
  // РџРѕРєР°Р·С‹РІР°РµРј СЃРѕРѕР±С‰РµРЅРёРµ Рѕ РїСЂРѕРІР°Р»Рµ
  const failOverlay = document.createElement("div");
  failOverlay.className = "hardmode-fail-overlay";
  failOverlay.innerHTML = `
    <div class="hardmode-fail-content">
      <div class="hardmode-fail-icon">вќЊ</div>
      <div class="hardmode-fail-title">РҐР°СЂРґРјРѕРґ РїСЂРѕРІР°Р»РµРЅ</div>
      <div class="hardmode-fail-sub">РќРµРїСЂР°РІРёР»СЊРЅС‹Р№ РѕС‚РІРµС‚</div>
    </div>
  `;
  document.body.appendChild(failOverlay);
  
  // Р§РµСЂРµР· 2 СЃРµРєСѓРЅРґС‹ РїРѕРєР°Р·С‹РІР°РµРј СЂРµР·СѓР»СЊС‚Р°С‚С‹
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

  // Р’ С…Р°СЂРґРјРѕРґРµ РїСЂРѕРІРµСЂСЏРµРј РїСЂР°РІРёР»СЊРЅРѕСЃС‚СЊ РѕС‚РІРµС‚Р°
  if (hardMode && !isTimeout) {
    const currentItem = TEST[curIdx];
    const userAnswer = answers.get(currentItem.id);
    const isCorrect = checkHardModeAnswer(currentItem, userAnswer);
    
    if (!isCorrect) {
      showHardModeFail();
      return; // РѕСЃС‚Р°РЅР°РІР»РёРІР°РµРј С‚РµСЃС‚
    }
  }

  // СѓР±РёСЂР°РµРј РјРёРіР°РЅРёРµ РїРµСЂРµРґ Р°РЅРёРјР°С†РёРµР№ СѓР»РµС‚Р°
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
  saveActiveTest();
  renderTest();
  startQuestionTimer();
}

function giveHardAchievement(tier, questionsCount){
  const key = "hard_achv_tier";
  const prev = Number(localStorage.getItem(key) || 0);

  // СЃРѕС…СЂР°РЅСЏРµРј С‚РѕР»СЊРєРѕ РµСЃР»Рё СѓСЂРѕРІРµРЅСЊ РІС‹С€Рµ РїСЂРµРґС‹РґСѓС‰РµРіРѕ
  if (tier > prev) localStorage.setItem(key, String(tier));

  showAchievementToast(tier, questionsCount);
  updateAchievementDisplay();
}

function showAchievementToast(tier, questionsCount){
  const marks = ["", "+", "++", "+++", "в­ђ"][tier];
  const el = document.createElement("div");
  el.className = "achv-toast";
  el.innerHTML = `
    <div class="achv-badge">${marks}</div>
    <div class="achv-text">
      <div class="achv-title">Р”РѕСЃС‚РёР¶РµРЅРёРµ ${marks}</div>
      <div class="achv-sub">Hardmode: 100% В· Р’РѕРїСЂРѕСЃРѕРІ: ${questionsCount}</div>
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
    alert("\u0411\u0430\u043d\u043a \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d: " + resolvedKey);
    return null;
  }

  return parseBank(bank.raw, bank.answers);
}

function getQuestionMapForBank(bankKey){
  const items = getBankItems(resolveBankKey(bankKey));
  return new Map((items || []).map(x => [x.n, x.q]));
}

function setBank(name, options = {}) {
  const shouldClearActive = options.clearActive !== false;
  const key = resolveBankKey(name);
  const items = getBankItems(key);
  if (!items) return;

  currentBankKey = key;
  RAW_BANK = "";
  ANSWER_TEXT = [];
  ALL = items;
  loadHardState(currentBankKey);

  // РћР±РЅРѕРІР»СЏРµРј РјР°РєСЃРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РІРѕРїСЂРѕСЃРѕРІ РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ Р±Р°РЅРєР°
  const maxSize = BANK_MAX_SIZES[key] || ALL.length || 10;
  if (maxTestSizeDisplay) maxTestSizeDisplay.textContent = maxSize;

  // РћС‚РєР»СЋС‡Р°РµРј РѕРїС†РёРё РєРѕС‚РѕСЂС‹Рµ Р±РѕР»СЊС€Рµ РјР°РєСЃРёРјСѓРјР°
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

  // РЎРѕС…СЂР°РЅСЏРµРј РІС‹Р±РѕСЂ
  localStorage.setItem("quiz_bank", name);
  if (shouldClearActive) clearActiveTest();

  // РџРѕР»РЅРѕСЃС‚СЊСЋ СЃР±СЂР°СЃС‹РІР°РµРј СЃРѕСЃС‚РѕСЏРЅРёРµ С‚РµРєСѓС‰РµРіРѕ С‚РµСЃС‚Р°
  TEST = [];
  answers.clear();
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
  appEl.classList.remove("has-output");
  setRunning(false);
  
  // РЎР±СЂР°СЃС‹РІР°РµРј С‚Р°Р№РјРµСЂ Рё РјСѓР·С‹РєСѓ
  stopTimer();
  stopHardmodeMusic();
  startTs = 0;

  // РЎР±СЂР°СЃС‹РІР°РµРј UI РєРЅРѕРїРѕРє
  startBtn.disabled = false;
  restartBtn.disabled = true;
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  if (abortBtn) abortBtn.disabled = true;
  updateHardButton();

  // РЎР±СЂР°СЃС‹РІР°РµРј РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Рµ РїРѕР»СЏ
  setStatusPill("РўРµСЃС‚ РЅРµ Р·Р°РїСѓС‰РµРЅ");
  setMetaText("");

  // РўРѕР»СЊРєРѕ РїРѕРґРіРѕС‚РѕРІРёС‚СЊ С‚РµСЃС‚, РЅРµ РѕС‚СЂРёСЃРѕРІС‹РІР°С‚СЊ (РѕС‚СЂРёСЃРѕРІРєР° С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ "РќР°С‡Р°С‚СЊ")
  buildTest();
}

const saved = resolveBankKey(localStorage.getItem("quiz_bank") || DEFAULT_BANK_KEY);
const initialBank = saved;
bankSelect.value = initialBank;
setBank(initialBank);
renderCoachPanel(coachState?.lastMessage || "Р“РµРЅРµСЂР°Р» РЅР° СЃРІСЏР·Рё. Р Р°Р±РѕС‚Р°РµРј СЃРїРѕРєРѕР№РЅРѕ Рё С‚РѕС‡РЅРѕ.");

updateCoachToggleUI();

if (coachToggle){
  coachToggle.checked = aiCoachEnabled;
  coachToggle.addEventListener("change", async () => {
    if (!currentUser?.isAdmin) {
      updateCoachToggleUI();
      return;
    }
    const nextValue = coachToggle.checked;
    coachToggle.disabled = true;
    try {
      const data = await apiJson("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ aiCoachEnabled: nextValue }),
      });
      aiCoachEnabled = data?.settings?.aiCoachEnabled !== false;
    } catch (error) {
      console.warn("[settings] admin update failed:", error);
    }
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
    saveActiveTest();
  }
});

testSizeSelect.addEventListener("change", () => {
  TEST_SIZE = parseInt(testSizeSelect.value, 10);
  localStorage.setItem("quiz_test_size", String(TEST_SIZE));
  testSizeDisplay.textContent = TEST_SIZE;
  updateStartDashboard();
  if (TEST.length && startBtn.disabled) saveActiveTest();
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
    saveActiveTest();
  }
  });
}

let lastStartWasHardOnly = false;

function startQuiz({ hardOnly = false } = {}){
  setGeneralChaosMode(false);
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
  saveActiveTest();
  coachReact(isProblemReviewMode ? "problemStart" : "start", {
    pending: getProblemReviewStatus(activeProblemReviewBank || currentBankKey).pending
  });
  startBtn.disabled = true;
  learnBtn.disabled = hardMode;  // РЅРµРґРѕСЃС‚СѓРїРЅР° РІ hardmode
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
  clearActiveTest();

  TEST = [];
  answers.clear();
  curIdx = 0;
  isProblemReviewMode = false;
  activeProblemReviewBank = null;
  elQuiz.innerHTML = "";
  elOut.style.display = "none";
  elOut.innerHTML = "";
  appEl.classList.remove("has-output");

  setStatusPill("РўРµСЃС‚ РїСЂРµСЂРІР°РЅ");
  setMetaText("");

  startBtn.disabled = false;
  restartBtn.disabled = true;
  finishBtn.disabled = true;
  learnBtn.disabled = true;
  if (abortBtn) abortBtn.disabled = true;
  updateHardButton();

  setRunning(false);
  setGeneralChaosMode(false);
}

if (abortBtn){
  abortBtn.addEventListener("click", () => {
    if (confirm("\u041f\u0440\u0435\u0440\u0432\u0430\u0442\u044c \u0442\u0435\u0441\u0442 \u0438 \u0432\u044b\u0439\u0442\u0438? \u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043d\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f.")){
      abortTest();
    }
  });
}

finishBtn.addEventListener("click", () => {
  const idx = findFirstUnanswered();
  if (idx !== -1){
    coachReact("unanswered", { pending: TEST.length - idx, item: TEST[idx] });
    // РЅРµ РґР°С‘Рј Р·Р°РІРµСЂС€РёС‚СЊ
    scrollToQuestion(idx);
    showFinishBlockedModal(idx); // РґРѕР±Р°РІРёРј РЅРёР¶Рµ
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
      correctDiv.textContent = "вњ“ РћС‚РІРµС‚: " + item.correctText;
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
  setStatusPill("Р РµР¶РёРј РѕР±СѓС‡РµРЅРёСЏ");
  setMetaText(`Р’РѕРїСЂРѕСЃРѕРІ: ${TEST.length} (РёР· ${ALL.length}). РџРѕРєР°Р·Р°РЅС‹ РїСЂР°РІРёР»СЊРЅС‹Рµ РѕС‚РІРµС‚С‹.`);
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
  setStatusPill("РўРµСЃС‚ Р·Р°РїСѓС‰РµРЅ");
  setMetaText(`Р’РѕРїСЂРѕСЃРѕРІ: ${TEST.length} (РёР· ${ALL.length}). Р РµР¶РёРј: ${mode === "mcq" ? "AвЂ“E" : "С‚РµРєСЃС‚"}.`);
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

const TIME_EXP_EVERY_SECONDS = 600; // 10 РјРёРЅСѓС‚
const TIME_EXP_AMOUNT = 1;          // +1 EXP


// Р­Р»РµРјРµРЅС‚С‹ UI СЃС‚Р°С‚РёСЃС‚РёРєРё
const siteTimeDisplay = document.getElementById("siteTimeDisplay");
const expDisplay = document.getElementById("expDisplay");
const rankDisplay = document.getElementById("rankDisplay");
const testsCompletedDisplay = document.getElementById("testsCompletedDisplay");

let stats = {
  time_seconds: 0,
  exp_time: 0,        // EXP Р·Р° РІСЂРµРјСЏ (в‰€1%)
  exp_tests: 0,       // EXP Р·Р° С‚РµСЃС‚С‹ (в‰€99%)
  tests_completed: 0
};


// РЎРѕСЃС‚РѕСЏРЅРёРµ С‚Р°Р№РјРµСЂР° РїСЂРµР±С‹РІР°РЅРёСЏ
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

    // РЅРѕРІС‹Рµ РїРѕР»СЏ
    const hasNew = ("exp_time" in parsed) || ("exp_tests" in parsed);
    stats.exp_time  = parseInt(parsed.exp_time  || "0", 10);
    stats.exp_tests = parseInt(parsed.exp_tests || "0", 10);

    // РјРёРіСЂР°С†РёСЏ СЃРѕ СЃС‚Р°СЂРѕРіРѕ exp
    if (!hasNew && ("exp" in parsed)) {
      const oldExp = parseInt(parsed.exp || "0", 10);
      stats.exp_tests = oldExp; // РїРµСЂРµРЅРѕСЃРёРј РІ exp Р·Р° С‚РµСЃС‚С‹
      stats.exp_time = 0;
    }

  } catch(e){
    console.warn("РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃС‚Р°С‚РёСЃС‚РёРєРё:", e);
  }
}


// РЎРѕС…СЂР°РЅРµРЅРёРµ СЃС‚Р°С‚РёСЃС‚РёРєРё РІ localStorage
function saveStats(){
localStorage.setItem("quiz_stats", JSON.stringify({
  time_seconds: stats.time_seconds,
  exp_time: stats.exp_time,
  exp_tests: stats.exp_tests,
  tests_completed: stats.tests_completed
}));

}

// Р’С‹С‡РёСЃР»РµРЅРёРµ Р·РІР°РЅРёСЏ РЅР° РѕСЃРЅРѕРІРµ EXP
function calcRank(exp){
  if (exp >= 300) return "РњР°СЃС‚РµСЂ";
  if (exp >= 100) return "РЈС‡РµРЅРёРє";
  return "РќРѕРІРёС‡РѕРє";
}

// РћР±РЅРѕРІР»РµРЅРёРµ UI СЃС‚Р°С‚РёСЃС‚РёРєРё
function updateStatsUI(){
  // Р¤РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ РІСЂРµРјРµРЅРё: X РјРёРЅ Y СЃРµРє
  const totalSeconds = stats.time_seconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (siteTimeDisplay){
    siteTimeDisplay.textContent = `${minutes} РјРёРЅ ${seconds} СЃРµРє`;
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

  // РџСЂРѕР№РґРµРЅРѕ С‚РµСЃС‚РѕРІ
  if (testsCompletedDisplay){
    testsCompletedDisplay.textContent = String(stats.tests_completed);
  }
  if (dashTests){
    dashTests.textContent = String(stats.tests_completed);
  }
}

// РћР±РЅРѕРІР»РµРЅРёРµ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РґРѕСЃС‚РёР¶РµРЅРёР№ РІ РЅР°РІР±Р°СЂРµ (С‚РѕР»СЊРєРѕ С‚РµРєСЃС‚ +/++/+++ СЃ РіСЂР°РґРёРµРЅС‚РѕРј)
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

  const marks = ["", "+", "++", "+++", "в­ђ"][tier];

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

  // РєР°Р¶РґС‹Рµ 10 РјРёРЅСѓС‚ Р°РєС‚РёРІРЅРѕРіРѕ РІСЂРµРјРµРЅРё: +1 exp_time
  const beforeTicks = Math.floor(before / TIME_EXP_EVERY_SECONDS);
  const afterTicks  = Math.floor(stats.time_seconds / TIME_EXP_EVERY_SECONDS);

  if (afterTicks > beforeTicks){
    const gained = (afterTicks - beforeTicks) * TIME_EXP_AMOUNT;
    stats.exp_time += gained;
  }

  saveStats();
  updateStatsUI();
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

function calcTestExp({ percent, questionsCount, hardMode = false }){
  const count = Math.max(1, Number(questionsCount || 0));
  const accuracy = Math.max(0, Math.min(100, Number(percent || 0))) / 100;

  let exp = Math.round(count * (0.6 + accuracy * 1.4));
  if (accuracy >= 0.95) exp += Math.ceil(count * 0.5);
  if (accuracy === 1) exp += Math.ceil(count * 0.5) + 10;
  if (hardMode) exp = Math.round(exp * 1.25);

  return Math.max(1, exp);
}


// Р—Р°РїСѓСЃРє С‚Р°Р№РјРµСЂР° РїСЂРµР±С‹РІР°РЅРёСЏ
function startPresenceTimer(){
  if (presenceTimerId) return; // СѓР¶Рµ Р·Р°РїСѓС‰РµРЅ
  
  isTabVisible = !document.hidden;
  
  // Р—Р°РїСѓСЃРєР°РµРј РёРЅС‚РµСЂРІР°Р» - РєР°Р¶РґСѓСЋ СЃРµРєСѓРЅРґСѓ
  presenceTimerId = setInterval(() => {
    tickPresenceTimer();
  }, 1000);
  
  // РџРµСЂРІРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ СЃСЂР°Р·Сѓ
  updateStatsUI();
}

// РћСЃС‚Р°РЅРѕРІРєР° С‚Р°Р№РјРµСЂР° РїСЂРµР±С‹РІР°РЅРёСЏ (РїСЂРё СЃРєСЂС‹С‚РёРё РІРєР»Р°РґРєРё)
function pausePresenceTimer(){
  if (!presenceTimerId) return; // РЅРµ Р·Р°РїСѓС‰РµРЅ
  
  isTabVisible = false;
  saveStats(); // СЃРѕС…СЂР°РЅСЏРµРј С‚РµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ
}

// РџСЂРѕРґРѕР»Р¶РµРЅРёРµ С‚Р°Р№РјРµСЂР° РїСЂРµР±С‹РІР°РЅРёСЏ (РїСЂРё РІРѕР·РІСЂР°С‰РµРЅРёРё РЅР° РІРєР»Р°РґРєСѓ)
function resumePresenceTimer(){
  if (!presenceTimerId) return; // РЅРµ Р±С‹Р» Р·Р°РїСѓС‰РµРЅ
  
  isTabVisible = true;
  updateStatsUI();
}

// РћР±СЂР°Р±РѕС‚С‡РёРє РёР·РјРµРЅРµРЅРёСЏ РІРёРґРёРјРѕСЃС‚Рё РІРєР»Р°РґРєРё
document.addEventListener("visibilitychange", () => {
  if (document.hidden){
    pausePresenceTimer();
  } else {
    resumePresenceTimer();
  }
});

// ===== Р¤СѓРЅРєС†РёРё Р°РЅР°Р»РёС‚РёРєРё =====
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
  
  // РЎРѕР·РґР°С‘Рј map РІРѕРїСЂРѕСЃРѕРІ РёР· С‚РµРєСѓС‰РµРіРѕ Р±Р°РЅРєР°
  const questionMap = getQuestionMapForBank(currentBankKey);
  
  const parts = [];
  
  // Р¤РёР»СЊС‚СЂС‹
  parts.push(`<div class="analytics-filters">`);
  parts.push(`<div class="analytics-filters__row">`);
  parts.push(`<label class="analytics-filter"><span>Р‘Р°РЅРє:</span><select id="analyticsBankSelect" class="analytics-filter__input">`);
  parts.push(`<option value="${DEFAULT_BANK_KEY}" selected>${getBankLabel(DEFAULT_BANK_KEY)}</option>`);
  parts.push(`</select></label>`);
  
  parts.push(`<label class="analytics-filter"><span>РњРёРЅ. РїРѕРєР°Р·РѕРІ:</span><input type="number" id="analyticsMinShown" class="analytics-filter__input" value="3" min="1"></label>`);
  
  parts.push(`<label class="analytics-filter"><span>РЎРѕСЂС‚РёСЂРѕРІРєР°:</span><select id="analyticsSort" class="analytics-filter__input">`);
  parts.push(`<option value="wrong">РџРѕ РѕС€РёР±РєР°Рј (wrong desc)</option>`);
  parts.push(`<option value="errorRate">РџРѕ % РѕС€РёР±РѕРє (errorRate desc)</option>`);
  parts.push(`<option value="score" selected>РџРѕ РїСЂРѕР±Р»РµРјРЅРѕСЃС‚Рё (score desc)</option>`);
  parts.push(`</select></label>`);
  parts.push(`</div>`);
  
  parts.push(`<label class="analytics-filter-checkbox"><input type="checkbox" id="analyticsFilterMin"><span>РџРѕРєР°Р·С‹РІР°С‚СЊ С‚РѕР»СЊРєРѕ shown >= min</span></label>`);
  parts.push(`</div>`);
  
  // РџРѕР»СѓС‡Р°РµРј СЃС‚Р°С‚РёСЃС‚РёРєСѓ РІС‹Р±СЂР°РЅРЅРѕРіРѕ Р±Р°РЅРєР°
  const selectedBankKey = currentBankKey; // Р±СѓРґРµС‚ РѕР±РЅРѕРІР»СЏС‚СЊСЃСЏ С‡РµСЂРµР· РѕР±СЂР°Р±РѕС‚С‡РёРє
  const bankStats = allStats[selectedBankKey] || {};
  
  // РџРѕРґРіРѕС‚Р°РІР»РёРІР°РµРј РґР°РЅРЅС‹Рµ
  const problemQuestions = [];
  for (const [bankN, stat] of Object.entries(bankStats)){
    if (stat.shown === 0) continue;
    const bankNNum = parseInt(bankN, 10);
    const errorRate = stat.shown > 0 ? (stat.wrong / stat.shown) : 0;
    const score = stat.wrong * 2 + (stat.shown - stat.correct);
    const questionText = questionMap.get(bankNNum) || "(РІРѕРїСЂРѕСЃ РЅРµ РЅР°Р№РґРµРЅ)";
    
    problemQuestions.push({
      bankN: bankNNum,
      questionText,
      ...stat,
      errorRate,
      score
    });
  }
  
  // РџСЂРёРјРµРЅСЏРµРј С„РёР»СЊС‚СЂС‹ Рё СЃРѕСЂС‚РёСЂРѕРІРєСѓ (РїСЂРё РїРµСЂРІРѕРј СЂРµРЅРґРµСЂРµ РёСЃРїРѕР»СЊР·СѓРµРј Р·РЅР°С‡РµРЅРёСЏ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ)
  const minShown = 3;
  const sortBy = "score";
  const filterMin = false; // РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ С„РёР»СЊС‚СЂ РІС‹РєР»СЋС‡РµРЅ, С‡С‚РѕР±С‹ РІРёРґРµС‚СЊ РІСЃРµ РґР°РЅРЅС‹Рµ
  
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
  
  // РџРѕСЏСЃРЅРµРЅРёРµ
  parts.push(`<div class="analytics-info muted small">РџРѕРєР°Р·Р°РЅС‹ РІРѕРїСЂРѕСЃС‹ СЃ shown >= ${minShown}, РёРЅР°С‡Рµ СЃС‚Р°С‚РёСЃС‚РёРєР° РЅРµСЂРµР»РµРІР°РЅС‚РЅР°.</div>`);
  
  // РўР°Р±Р»РёС†Р°
  if (top20.length === 0){
    parts.push(`<div class="muted small" style="margin:20px 0; text-align:center;">РќРµС‚ РґР°РЅРЅС‹С…. РџСЂРѕР№РґРёС‚Рµ С‚РµСЃС‚, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ СЃС‚Р°С‚РёСЃС‚РёРєСѓ.</div>`);
  } else {
    parts.push(`<table class="analytics-table"><thead><tr><th>в„–</th><th>Р’РѕРїСЂРѕСЃ</th><th>РџРѕРєР°Р·Р°РЅ</th><th>РџСЂР°РІРёР»СЊРЅРѕ</th><th>РћС€РёР±РѕРє</th><th>% РѕС€РёР±РѕРє</th><th>РЎРµСЂРёСЏ</th><th>РџРѕСЃР»РµРґРЅРёР№ СЂР°Р·</th><th>Р РµР·СѓР»СЊС‚Р°С‚</th></tr></thead><tbody>`);
    top20.forEach(q => {
      const errorRatePct = q.shown > 0 ? Math.round((q.wrong / q.shown) * 100) : 0;
      const lastSeenDate = q.lastSeen ? new Date(q.lastSeen) : null;
      const lastSeenStr = lastSeenDate ? lastSeenDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "вЂ”";
      const lastResultIcon = q.lastResult === "ok" ? "вњ…" : q.lastResult === "bad" ? "вќЊ" : "вЂ”";
      const questionShort = q.questionText.length > 100 ? q.questionText.substring(0, 100) + "..." : q.questionText;
      const isLowSample = q.shown < minShown;
      const rowClass = isLowSample ? "analytics-row-low-sample" : "";
      
      parts.push(`<tr class="analytics-table-row ${rowClass}" data-bank-n="${q.bankN}" title="РљР»РёРє РґР»СЏ РєРѕРїРёСЂРѕРІР°РЅРёСЏ РЅРѕРјРµСЂР° РІРѕРїСЂРѕСЃР°">`);
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
  
  // РљРЅРѕРїРєР° СЃР±СЂРѕСЃР° СЃС‚Р°С‚РёСЃС‚РёРєРё
  parts.push(`<div style="margin-top:20px;">`);
  parts.push(`<button id="resetAnalyticsBtn" class="secondary" style="width:100%; font-size:12px;">РЎР±СЂРѕСЃРёС‚СЊ СЃС‚Р°С‚РёСЃС‚РёРєСѓ РІС‹Р±СЂР°РЅРЅРѕРіРѕ Р±Р°РЅРєР°</button>`);
  parts.push(`</div>`);
  
  // РСЃС‚РѕСЂРёСЏ СЃРµСЃСЃРёР№
  parts.push(`<div id="analyticsSessionsSection" style="margin-top:32px; padding-top:24px; border-top:2px solid var(--stroke2);">`);
  parts.push(`<div style="margin-bottom:16px;"><strong style="font-size:15px;">РСЃС‚РѕСЂРёСЏ СЃРµСЃСЃРёР№</strong></div>`);
  
  if (sessions.length === 0){
    parts.push(`<div class="muted small" style="margin:20px 0; text-align:center;">РќРµС‚ РґР°РЅРЅС‹С…. РџСЂРѕР№РґРёС‚Рµ С‚РµСЃС‚, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РёСЃС‚РѕСЂРёСЋ.</div>`);
  } else {
    const recentSessions = sessions.slice(0, 10);
    parts.push(`<table class="analytics-table"><thead><tr><th>Р”Р°С‚Р°</th><th>Р‘Р°РЅРє</th><th>Р РµР¶РёРј</th><th>%</th><th>Р’РѕРїСЂРѕСЃРѕРІ</th><th>Р’СЂРµРјСЏ</th><th>Hardmode</th></tr></thead><tbody>`);
    recentSessions.forEach(s => {
      const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const elapsedTime = fmt(s.elapsedMs);
      const modeText = s.mode === "mcq" ? "AвЂ“E" : "РўРµРєСЃС‚";
      const bankName = getBankLabel(s.bankKey);
      const hardmodeMark = s.hardMode ? "вљЎ" : "вЂ”";
      const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
      parts.push(`<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`);
    });
    parts.push(`</tbody></table>`);
    
    if (sessions.length > 10){
      parts.push(`<details style="margin-top:12px;"><summary class="muted small" style="cursor:pointer; padding:8px;">РџРѕРєР°Р·Р°С‚СЊ РІСЃРµ ${sessions.length} СЃРµСЃСЃРёР№</summary>`);
      parts.push(`<table class="analytics-table" style="margin-top:8px;"><thead><tr><th>Р”Р°С‚Р°</th><th>Р‘Р°РЅРє</th><th>Р РµР¶РёРј</th><th>%</th><th>Р’РѕРїСЂРѕСЃРѕРІ</th><th>Р’СЂРµРјСЏ</th><th>Hardmode</th></tr></thead><tbody>`);
      sessions.slice(10).forEach(s => {
        const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
        const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const elapsedTime = fmt(s.elapsedMs);
        const modeText = s.mode === "mcq" ? "AвЂ“E" : "РўРµРєСЃС‚";
        const bankName = getBankLabel(s.bankKey);
        const hardmodeMark = s.hardMode ? "вљЎ" : "вЂ”";
        const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
        parts.push(`<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`);
      });
      parts.push(`</tbody></table></details>`);
    }
    
    parts.push(`<button id="clearSessionsBtn" class="secondary" style="width:100%; margin-top:12px; font-size:12px;">РћС‡РёСЃС‚РёС‚СЊ РёСЃС‚РѕСЂРёСЋ СЃРµСЃСЃРёР№</button>`);
  }
  
  parts.push(`</div>`);
  
  analyticsContent.innerHTML = parts.join("");
  
  // РћР±СЂР°Р±РѕС‚С‡РёРєРё С„РёР»СЊС‚СЂРѕРІ
  const bankSelect = document.getElementById("analyticsBankSelect");
  const minShownInput = document.getElementById("analyticsMinShown");
  const sortSelect = document.getElementById("analyticsSort");
  const filterMinCheckbox = document.getElementById("analyticsFilterMin");
  
  // РћР±СЂР°Р±РѕС‚С‡РёРє РєРЅРѕРїРєРё РѕС‡РёСЃС‚РєРё РёСЃС‚РѕСЂРёРё СЃРµСЃСЃРёР№ (РїСЂРё РїРµСЂРІРѕРЅР°С‡Р°Р»СЊРЅРѕРј СЂРµРЅРґРµСЂРµ)
  const clearSessionsBtnInitial = document.getElementById("clearSessionsBtn");
  if (clearSessionsBtnInitial){
    clearSessionsBtnInitial.onclick = () => {
      const bankKey = bankSelect ? bankSelect.value : currentBankKey;
      const bankName = bankSelect ? bankSelect.options[bankSelect.selectedIndex].text : currentBankKey;
      const confirmed = confirm(`\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0438\u0441\u0442\u043e\u0440\u0438\u044e \u0441\u0435\u0441\u0441\u0438\u0439 \u0434\u043b\u044f \u0431\u0430\u043d\u043a\u0430 "${bankName}"? \u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.`);
      if (confirmed){
        localStorage.setItem(getSessionsKey(bankKey), JSON.stringify([]));
        renderAnalytics(); // РїРµСЂРµСЂРёСЃРѕРІС‹РІР°РµРј РІСЃСЋ Р°РЅР°Р»РёС‚РёРєСѓ
      }
    };
  }
  
  function updateSessions(bankKey){
    const sessions = loadSessions(bankKey);
    const sessionsSection = document.getElementById("analyticsSessionsSection");
    if (!sessionsSection) return;
    
    let sessionsHtml = `<div style="margin-bottom:16px;"><strong style="font-size:15px;">РСЃС‚РѕСЂРёСЏ СЃРµСЃСЃРёР№</strong></div>`;
    
    if (sessions.length === 0){
      sessionsHtml += `<div class="muted small" style="margin:20px 0; text-align:center;">РќРµС‚ РґР°РЅРЅС‹С…. РџСЂРѕР№РґРёС‚Рµ С‚РµСЃС‚, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РёСЃС‚РѕСЂРёСЋ.</div>`;
    } else {
      const recentSessions = sessions.slice(0, 10);
      sessionsHtml += `<table class="analytics-table"><thead><tr><th>Р”Р°С‚Р°</th><th>Р‘Р°РЅРє</th><th>Р РµР¶РёРј</th><th>%</th><th>Р’РѕРїСЂРѕСЃРѕРІ</th><th>Р’СЂРµРјСЏ</th><th>Hardmode</th></tr></thead><tbody>`;
      recentSessions.forEach(s => {
        const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
        const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const elapsedTime = fmt(s.elapsedMs);
        const modeText = s.mode === "mcq" ? "AвЂ“E" : "РўРµРєСЃС‚";
        const bankName = getBankLabel(s.bankKey);
        const hardmodeMark = s.hardMode ? "вљЎ" : "вЂ”";
        const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
        sessionsHtml += `<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`;
      });
      sessionsHtml += `</tbody></table>`;
      
      if (sessions.length > 10){
        sessionsHtml += `<details style="margin-top:12px;"><summary class="muted small" style="cursor:pointer; padding:8px;">РџРѕРєР°Р·Р°С‚СЊ РІСЃРµ ${sessions.length} СЃРµСЃСЃРёР№</summary>`;
        sessionsHtml += `<table class="analytics-table" style="margin-top:8px;"><thead><tr><th>Р”Р°С‚Р°</th><th>Р‘Р°РЅРє</th><th>Р РµР¶РёРј</th><th>%</th><th>Р’РѕРїСЂРѕСЃРѕРІ</th><th>Р’СЂРµРјСЏ</th><th>Hardmode</th></tr></thead><tbody>`;
        sessions.slice(10).forEach(s => {
          const date = new Date(s.ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
          const time = new Date(s.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
          const elapsedTime = fmt(s.elapsedMs);
          const modeText = s.mode === "mcq" ? "AвЂ“E" : "РўРµРєСЃС‚";
          const bankName = getBankLabel(s.bankKey);
          const hardmodeMark = s.hardMode ? "вљЎ" : "вЂ”";
          const percentClass = s.percent >= 95 ? "ok" : s.percent >= 60 ? "" : "bad";
          sessionsHtml += `<tr><td>${date}<br><span class="muted small">${time}</span></td><td>${bankName}</td><td>${modeText}</td><td class="${percentClass}">${s.percent}%</td><td>${s.questionsCount}</td><td>${elapsedTime}</td><td>${hardmodeMark}</td></tr>`;
        });
        sessionsHtml += `</tbody></table></details>`;
      }
      
      sessionsHtml += `<button id="clearSessionsBtn" class="secondary" style="width:100%; margin-top:12px; font-size:12px;">РћС‡РёСЃС‚РёС‚СЊ РёСЃС‚РѕСЂРёСЋ СЃРµСЃСЃРёР№</button>`;
    }
    
    sessionsSection.innerHTML = sessionsHtml;
    
    // РћР±РЅРѕРІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРє РєРЅРѕРїРєРё РѕС‡РёСЃС‚РєРё
    const clearSessionsBtn = document.getElementById("clearSessionsBtn");
    if (clearSessionsBtn){
      clearSessionsBtn.onclick = () => {
        const bankSelectEl = document.getElementById("analyticsBankSelect");
        const currentBankKeyForClear = bankSelectEl ? bankSelectEl.value : bankKey;
        const bankName = bankSelectEl ? bankSelectEl.options[bankSelectEl.selectedIndex].text : bankKey;
        const confirmed = confirm(`\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u0438\u0441\u0442\u043e\u0440\u0438\u044e \u0441\u0435\u0441\u0441\u0438\u0439 \u0434\u043b\u044f \u0431\u0430\u043d\u043a\u0430 "${bankName}"? \u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.`);
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
    
    // РћР±РЅРѕРІР»СЏРµРј РёСЃС‚РѕСЂРёСЋ СЃРµСЃСЃРёР№ РїСЂРё СЃРјРµРЅРµ Р±Р°РЅРєР°
    updateSessions(bankKey);
    
    const questions = [];
    for (const [bankN, stat] of Object.entries(stats)){
      if (stat.shown === 0) continue;
      const bankNNum = parseInt(bankN, 10);
      const errorRate = stat.shown > 0 ? (stat.wrong / stat.shown) : 0;
      const score = stat.wrong * 2 + (stat.shown - stat.correct);
      const questionText = qMap.get(bankNNum) || "(РІРѕРїСЂРѕСЃ РЅРµ РЅР°Р№РґРµРЅ)";
      
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
    
    // РћР±РЅРѕРІР»СЏРµРј РїРѕСЏСЃРЅРµРЅРёРµ
    if (infoEl) infoEl.textContent = `РџРѕРєР°Р·Р°РЅС‹ РІРѕРїСЂРѕСЃС‹ СЃ shown >= ${min}, РёРЅР°С‡Рµ СЃС‚Р°С‚РёСЃС‚РёРєР° РЅРµСЂРµР»РµРІР°РЅС‚РЅР°.`;
    
    if (!tbody) return;
    
    if (top20.length === 0){
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;" class="muted small">РќРµС‚ РґР°РЅРЅС‹С…</td></tr>`;
      return;
    }
    
    // РћР±РЅРѕРІР»СЏРµРј С‚Р°Р±Р»РёС†Сѓ
    tbody.innerHTML = top20.map(q => {
      const errorRatePct = q.shown > 0 ? Math.round((q.wrong / q.shown) * 100) : 0;
      const lastSeenDate = q.lastSeen ? new Date(q.lastSeen) : null;
      const lastSeenStr = lastSeenDate ? lastSeenDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "вЂ”";
      const lastResultIcon = q.lastResult === "ok" ? "вњ…" : q.lastResult === "bad" ? "вќЊ" : "вЂ”";
      const questionShort = q.questionText.length > 100 ? q.questionText.substring(0, 100) + "..." : q.questionText;
      const isLowSample = q.shown < min;
      const rowClass = isLowSample ? "analytics-row-low-sample" : "";
      
      return `<tr class="analytics-table-row ${rowClass}" data-bank-n="${q.bankN}" title="РљР»РёРє РґР»СЏ РєРѕРїРёСЂРѕРІР°РЅРёСЏ РЅРѕРјРµСЂР° РІРѕРїСЂРѕСЃР°">
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
    
    // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё РєР»РёРєР° РЅР° СЃС‚СЂРѕРєРё
    tbody.querySelectorAll(".analytics-table-row").forEach(row => {
      row.addEventListener("click", () => {
        const bankN = row.dataset.bankN;
        navigator.clipboard?.writeText(bankN).then(() => {
          // РњРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ toast СѓРІРµРґРѕРјР»РµРЅРёРµ
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
  
  // РћР±СЂР°Р±РѕС‚С‡РёРє РєРЅРѕРїРєРё СЃР±СЂРѕСЃР°
  const resetBtn = document.getElementById("resetAnalyticsBtn");
  if (resetBtn){
    resetBtn.onclick = () => {
      const bankKey = bankSelect.value;
      const bankName = bankSelect.options[bankSelect.selectedIndex].text;
      const confirmed = confirm(`\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0443 \u0434\u043b\u044f \u0431\u0430\u043d\u043a\u0430 "${bankName}"? \u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.`);
      if (confirmed){
        const currentAllStats = loadQStats();
        delete currentAllStats[bankKey];
        saveQStats(currentAllStats);
        renderAnalytics();
      }
    };
  }
  
  
  // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРєРё РєР»РёРєР° РЅР° СЃС‚СЂРѕРєРё
  setTimeout(() => {
    analyticsContent.querySelectorAll(".analytics-table-row").forEach(row => {
      row.addEventListener("click", () => {
        const bankN = row.dataset.bankN;
        navigator.clipboard?.writeText(bankN).then(() => {
          // РњРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ toast СѓРІРµРґРѕРјР»РµРЅРёРµ
        }).catch(() => {});
      });
    });
  }, 0);
}

// РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ СЃС‚Р°С‚РёСЃС‚РёРєРё РїСЂРё Р·Р°РіСЂСѓР·РєРµ СЃС‚СЂР°РЅРёС†С‹
loadStats();
setupActivityTracking();
startPresenceTimer();
updateStatsUI();
updateAchievementDisplay();
requireAuth();
loadAppSettings();

// РћР±СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РѕРєРЅР° Р°РЅР°Р»РёС‚РёРєРё
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
  
  // Р—Р°РєСЂС‹С‚РёРµ РїРѕ Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && analyticsModal.style.display === "flex"){
      closeAnalyticsModal();
    }
  });
}


// РЈРІРµР»РёС‡РµРЅРёРµ СЃС‡РµС‚С‡РёРєР° С‚РµСЃС‚РѕРІ РїСЂРё Р·Р°РІРµСЂС€РµРЅРёРё С‚РµСЃС‚Р°
// РРЅС‚РµРіСЂР°С†РёСЏ РІ С„СѓРЅРєС†РёСЋ finish() - РґРѕР±Р°РІРёРј РІС‹Р·РѕРІ РІ РєРѕРЅС†Рµ finish()
