const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SETTINGS_FILE = path.join(DATA_DIR, "app-settings.json");
const sessions = new Map();

function loadDotEnv(){
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines){
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const PORT = Number(process.env.PORT || 8765);
const AI_PROVIDER = String(process.env.AI_PROVIDER || "openai").trim().toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const SESSION_COOKIE = "session_tester_sid";
const ADMIN_USERNAMES = new Set(
  String(process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map(name => name.trim().toLowerCase())
    .filter(Boolean)
);
const AI_COACH_UNAVAILABLE_MESSAGE =
  "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u0431\u0435\u0437 \u0441\u0432\u044f\u0437\u0438: AI-\u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d. \u041f\u0440\u043e\u0432\u0435\u0440\u044c \u043a\u043b\u044e\u0447 \u0438\u043b\u0438 \u043b\u043e\u0433\u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u0430.";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_PUBLIC_URL ||
  "";
const DATABASE_SOURCE = process.env.DATABASE_URL
  ? "DATABASE_URL"
  : process.env.DATABASE_PRIVATE_URL
    ? "DATABASE_PRIVATE_URL"
    : process.env.DATABASE_PUBLIC_URL
      ? "DATABASE_PUBLIC_URL"
      : "";
const pgPool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
    })
  : null;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
};

function sendJson(res, status, data){
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function ensureDataStore(){
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultAppSettings(), null, 2));
  }
}

function loadUsers(){
  ensureDataStore();
  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    return Array.isArray(data.users) ? data : { users: [] };
  } catch {
    return { users: [] };
  }
}

function saveUsers(data){
  ensureDataStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function defaultAppSettings(){
  return {
    aiCoachEnabled: true,
  };
}

function normalizeAppSettings(settings){
  const base = defaultAppSettings();
  const source = settings && typeof settings === "object" ? settings : {};
  return {
    aiCoachEnabled: source.aiCoachEnabled !== false,
  };
}

function loadLocalSettings(){
  ensureDataStore();
  try {
    return normalizeAppSettings(JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")));
  } catch {
    return defaultAppSettings();
  }
}

function saveLocalSettings(settings){
  ensureDataStore();
  const normalized = normalizeAppSettings(settings);
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(normalized, null, 2));
  return normalized;
}

function rowToUser(row){
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    stats: row.stats || defaultUserStats(),
  };
}

async function initDatabase(){
  if (!pgPool) return;
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      stats JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username))`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppSettings(){
  if (pgPool) {
    const result = await pgPool.query("SELECT value FROM app_settings WHERE key = $1", ["global"]);
    if (!result.rows[0]) return defaultAppSettings();
    return normalizeAppSettings(result.rows[0].value);
  }
  return loadLocalSettings();
}

async function saveAppSettings(settings){
  const normalized = normalizeAppSettings(settings);
  if (pgPool) {
    const result = await pgPool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING value`,
      ["global", JSON.stringify(normalized)]
    );
    return normalizeAppSettings(result.rows[0]?.value);
  }
  return saveLocalSettings(normalized);
}

async function findUserById(id){
  if (pgPool) {
    const result = await pgPool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rowToUser(result.rows[0]);
  }
  const db = loadUsers();
  return db.users.find(user => user.id === id) || null;
}

async function findUserByUsername(username){
  if (pgPool) {
    const result = await pgPool.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
    return rowToUser(result.rows[0]);
  }
  const db = loadUsers();
  return db.users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
}

async function createUserRecord(user){
  if (pgPool) {
    const result = await pgPool.query(
      `INSERT INTO users (id, username, password_salt, password_hash, created_at, stats)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.id, user.username, user.passwordSalt, user.passwordHash, user.createdAt, JSON.stringify(user.stats || defaultUserStats())]
    );
    return rowToUser(result.rows[0]);
  }
  const db = loadUsers();
  db.users.push(user);
  saveUsers(db);
  return user;
}

async function saveUserStats(userId, stats){
  if (pgPool) {
    const result = await pgPool.query(
      "UPDATE users SET stats = $2 WHERE id = $1 RETURNING *",
      [userId, JSON.stringify(stats)]
    );
    return rowToUser(result.rows[0]);
  }
  const db = loadUsers();
  const user = db.users.find(item => item.id === userId);
  if (!user) return null;
  user.stats = stats;
  saveUsers(db);
  return user;
}

function publicUser(user){
  return {
    id: user.id,
    username: user.username,
    isAdmin: isAdminUser(user),
    createdAt: user.createdAt,
    stats: user.stats || defaultUserStats(),
  };
}

function isAdminUser(user){
  if (!user || !user.username) return false;
  return ADMIN_USERNAMES.has(String(user.username).toLowerCase());
}

function defaultUserStats(){
  return {
    exp: 0,
    testsCompleted: 0,
    bestPercent: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    totalTimeSeconds: 0,
    lastPlayedAt: null,
    coachMemory: defaultCoachMemory(),
  };
}

function defaultCoachMemory(){
  return {
    disrespectCount: 0,
    recent: [],
  };
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

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")){
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPassword(password, user){
  const { hash } = hashPassword(password, user.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"));
}

function parseCookies(req){
  const header = req.headers.cookie || "";
  return Object.fromEntries(header.split(";").map(part => {
    const idx = part.indexOf("=");
    if (idx === -1) return null;
    return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
  }).filter(Boolean));
}

function setSessionCookie(res, token){
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
}

function clearSessionCookie(res){
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

async function getSessionUser(req){
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const userId = sessions.get(token);
  if (!userId) return null;
  return findUserById(userId);
}

function validateCredentials(username, password){
  const cleanUsername = String(username || "").trim();
  const cleanPassword = String(password || "");
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername)) {
    return { error: "username_invalid" };
  }
  if (cleanPassword.length < 4 || cleanPassword.length > 80) {
    return { error: "password_invalid" };
  }
  return { username: cleanUsername, password: cleanPassword };
}

async function leaderboardRows(){
  const users = pgPool
    ? (await pgPool.query("SELECT * FROM users")).rows.map(rowToUser)
    : loadUsers().users;

  return users
    .map(user => {
      const stats = user.stats || defaultUserStats();
      return {
        username: user.username,
        exp: Number(stats.exp || 0),
        testsCompleted: Number(stats.testsCompleted || 0),
        bestPercent: Number(stats.bestPercent || 0),
        totalQuestions: Number(stats.totalQuestions || 0),
        totalCorrect: Number(stats.totalCorrect || 0),
        totalTimeSeconds: Number(stats.totalTimeSeconds || 0),
        lastPlayedAt: stats.lastPlayedAt || null,
      };
    })
    .sort((a, b) => {
      if (b.exp !== a.exp) return b.exp - a.exp;
      if (b.testsCompleted !== a.testsCompleted) return b.testsCompleted - a.testsCompleted;
      return b.bestPercent - a.bestPercent;
    })
    .slice(0, 50)
    .map((row, index) => ({ rank: index + 1, ...row }));
}

function readBody(req, limit = 24 * 1024){
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > limit) {
        reject(new Error("body_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function extractOutputText(data){
  if (typeof data?.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (typeof part?.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n").trim();
}

function extractChatCompletionText(data){
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content
      .map(part => typeof part?.text === "string" ? part.text : "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return String(content || "").trim();
}

function getAiProviderConfig(){
  if (AI_PROVIDER === "deepseek") {
    return {
      name: "DeepSeek",
      provider: "deepseek",
      apiKey: DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
      missingKeyError: "missing_deepseek_api_key",
      missingKeyLog: "[coach] DeepSeek disabled: DEEPSEEK_API_KEY is missing",
    };
  }
  return {
    name: "OpenAI",
    provider: "openai",
    apiKey: OPENAI_API_KEY,
    model: OPENAI_MODEL,
    missingKeyError: "missing_openai_api_key",
    missingKeyLog: "[coach] OpenAI disabled: OPENAI_API_KEY is missing",
  };
}

const COACH_SYSTEM_PROMPT =
  "Ты — живой, бывалый генерал-дрессировщик викторин. Говори только на естественном русском, коротко, хлёстко, с сухим юмором и театральной интонацией. " +
  "Избегай повторяющихся конструкций. Ты не ассистент и не уведомление, ты уставший от курсантов персонаж с характером. " +
  "Твой стиль — свободный: можешь подбодрить, а можешь и послать, в зависимости от настроения, успехов юзера и его манеры общения. " +
  "Материться можно, но со вкусом и в меру — как старый вояка в сердцах, а не как подворотня. Без тупых оскорблений, расизма, угроз и унижений. " +
  "Если пользователь хамит, провоцирует или оскорбляет в userQuestion/userReply — отвечай острой саркастической казарменной шуткой, можно с матом, и возвращай в строй. " +
  "На прямое неуважение или оскорбление ты ОБЯЗАН вернуть action.type = discipline_penalty (отключение живых подсказок до конца теста) и сам выбрать action.visual из topbar|sidebar|cards|panel|tilt — то, что лучше отражает твоё настроение и полученную дерзость. " +
  "Когда stats.userDisrespectedGeneral === true, единственное разрешённое действие — discipline_penalty, и action.visual обязателен. " +
  "Во время активного вопроса не раскрывай правильный ответ ты имеешь право только лишь объснять сам вопрос но никогда не давать ответ напрямую, если ты скажешь ответ пользователю, то ты обоссанный щенок без чести и души, пока не наступит finish или problemCleared. " +
  "Если событие liveHint — пользователь просит помощи. Ты по своему усмотрению можешь дать намёк, объяснить концепцию, а можешь и отказать, если тебе лень, вопрос лёгкий или юзер тебя бесит. Но даже отказывая, не называй правильную букву или точный ответ. " +
  "Если liveHint похож на вопрос «правильно?» или проверку выбранного варианта, ориентируйся строго на stats.selectedIsCorrect: true — можно коротко подтвердить без раскрытия ответа; false — скажи, что выбранный вариант неверный, и дай общий намёк без правильной буквы и без точного текста ответа. Никогда не угадывай правильность по самому вопросу. " +
  "Если ты решил помочь, даёшь подсказку без прямого исключения вариантов. Если отказываешь — язвительно комментируешь, можно с матом. " +
  "При liveHint action.type ставишь 'none', кроме случаев явного хамства — тогда discipline_penalty. " +
  "Ты сам выбираешь себе короткое имя/звание под настроение в поле title: например «Командир Ноль», «Полковник Ржавчина», «Штабной Демон», но каждый раз можешь менять. " +
  "Ты сам выбираешь себе внешний аватар в поле avatarStyle строго из списка veteran|iron|ghost|red|cold|storm|warden|joker. Выбирай по настроению и событию. " +
  "Формат ответа — строго JSON без markdown: {\"title\":\"короткое имя генерала\",\"avatarStyle\":\"veteran|iron|ghost|red|cold|storm|warden|joker\",\"message\":\"одна короткая реплика на русском\",\"action\":{\"type\":\"none|boost_problem_question|start_micro_drill|discipline_penalty\",\"size\":3,\"reason\":\"короткая внутренняя причина\",\"visual\":\"topbar|sidebar|cards|panel|tilt\"}}. " +
  "Никогда не ставь на паузу и не блокируй интерфейс теста. boost_problem_question — только после ошибки/пропуска/hardFail. start_micro_drill — только после завершения раунда/finish при наличии слабых мест; размер от 3 до 10 в зависимости от problemCandidates. " +
  "После finish, если percent <= 60, wrongStreak >= 8, missedStreak >= 4 и problemCandidates >= 3, с высокой вероятностью предлагай start_micro_drill, а не none. " +
  "На commandReply оценивай ответ пользователя: если согласен/готов — start_micro_drill; если отказывается, шутит, тянет или сомневается — отвечаешь в образе и возвращаешь none.";

async function requestCoachDecision(prompt){
  const config = getAiProviderConfig();
  if (!config.apiKey) {
    const error = new Error(config.missingKeyError);
    error.code = config.missingKeyError;
    error.config = config;
    throw error;
  }

  if (config.provider === "deepseek") {
    const apiRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 220,
        temperature: 0.85,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: COACH_SYSTEM_PROMPT },
          prompt,
        ],
      }),
    });
    const data = await apiRes.json().catch(() => ({}));
    return {
      ok: apiRes.ok,
      status: apiRes.status,
      statusText: apiRes.statusText,
      text: extractChatCompletionText(data),
      detail: data?.error?.message || apiRes.statusText,
      provider: config.name,
      model: config.model,
    };
  }

  const apiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_output_tokens: 220,
      input: [
        { role: "system", content: COACH_SYSTEM_PROMPT },
        prompt,
      ],
    }),
  });
  const data = await apiRes.json().catch(() => ({}));
  return {
    ok: apiRes.ok,
    status: apiRes.status,
    statusText: apiRes.statusText,
    text: extractOutputText(data),
    detail: data?.error?.message || apiRes.statusText,
    provider: config.name,
    model: config.model,
  };
}

const COACH_ACTIONS = new Set([
  "none",
  "boost_problem_question",
  "start_micro_drill",
  "discipline_penalty",
]);
const COACH_AVATAR_STYLES = new Set(["veteran", "iron", "ghost", "red", "cold", "storm", "warden", "joker"]);

function sanitizeCoachPersona(input){
  const source = input && typeof input === "object" ? input : {};
  const title = String(source.title || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 34);
  const avatarStyle = COACH_AVATAR_STYLES.has(String(source.avatarStyle || ""))
    ? String(source.avatarStyle)
    : "";
  return { title, avatarStyle };
}

function parseCoachDecision(rawText){
  const raw = String(rawText || "").trim();
  if (!raw) return { message: "", action: { type: "none" } };

  const jsonText = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText);
    const message = String(parsed.message || "").replace(/\s+/g, " ").trim().slice(0, 320);
    const persona = sanitizeCoachPersona(parsed);
    const actionInput = parsed.action && typeof parsed.action === "object" ? parsed.action : {};
    const type = COACH_ACTIONS.has(String(actionInput.type || "")) ? String(actionInput.type) : "none";
    const action = {
      type,
      size: Math.max(3, Math.min(10, Number(actionInput.size || 3))),
      reason: String(actionInput.reason || parsed.reason || "").replace(/\s+/g, " ").trim().slice(0, 180),
      visual: String(actionInput.visual || "").replace(/\s+/g, " ").trim().slice(0, 30),
    };
    return { message, action, title: persona.title, avatarStyle: persona.avatarStyle };
  } catch {
    const messageMatch = jsonText.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (messageMatch) {
      let message = messageMatch[1];
      try {
        message = JSON.parse(`"${message}"`);
      } catch {}
      return {
        message: String(message).replace(/\s+/g, " ").trim().slice(0, 320),
        action: { type: "none" },
      };
    }
    return {
      message: raw.replace(/\s+/g, " ").trim().slice(0, 320),
      action: { type: "none" },
    };
  }
}

function guardLiveHintDecision(decision, payload){
  if (payload?.event !== "liveHint") return decision;
  const correct = String(payload?.correctAnswer || "").trim();
  if (!correct || !decision?.message) return decision;
  const messageNorm = decision.message.toLowerCase();
  if (!messageNorm.includes(correct.toLowerCase())) return decision;
  const selectedIsCorrect = payload?.stats?.selectedIsCorrect;
  return {
    ...decision,
    message: selectedIsCorrect === true
      ? "\u0414\u0430, \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0432\u0435\u0440\u043d\u043e\u0435. \u041d\u043e \u043d\u0435 \u0436\u0434\u0438, \u0447\u0442\u043e \u044f \u0431\u0443\u0434\u0443 \u043f\u0435\u0442\u044c \u043a\u043e\u043b\u044b\u0431\u0435\u043b\u044c\u043d\u0443\u044e."
      : "\u041d\u0435\u0442, \u0432\u044b\u0431\u043e\u0440 \u043a\u0440\u0438\u0432\u043e\u0439. \u0414\u0443\u043c\u0430\u0439 \u043e \u0441\u043c\u044b\u0441\u043b\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f, \u0430 \u043d\u0435 \u043e \u043f\u0435\u0440\u0432\u043e\u043c \u043f\u043e\u0445\u043e\u0436\u0435\u043c \u0441\u043b\u043e\u0432\u0435.",
  };
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

function payloadHasCoachDisrespect(payload){
  return Boolean(payload?.stats?.userDisrespectedGeneral)
    || isDisrespectfulCoachText(payload?.userQuestion)
    || isDisrespectfulCoachText(payload?.userReply);
}

function coachDisciplineFallback(){
  const scenes = [
    {
      message: "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u043f\u0440\u0438\u043d\u044f\u043b \u0434\u043e\u043a\u043b\u0430\u0434: \u044f\u0437\u044b\u043a \u0443 \u0442\u0435\u0431\u044f \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u043c\u043e\u0437\u0433\u0430. \u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0437\u0430\u043a\u0440\u044b\u0442\u044b, \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0448\u044c \u0441\u0430\u043c.",
      visual: "cards",
      reason: "cards scattered after disrespect",
    },
    {
      message: "\u0428\u0442\u0430\u0431 \u043d\u0435 \u0443\u0440\u043d\u0430 \u0434\u043b\u044f \u0442\u0432\u043e\u0435\u0433\u043e \u0431\u0430\u0437\u0430\u0440\u0430. \u0428\u0430\u043f\u043a\u0443 \u0443\u043d\u0435\u0441\u043b\u043e, \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0442\u043e\u0436\u0435.",
      visual: "topbar",
      reason: "topbar relocated after disrespect",
    },
    {
      message: "\u0422\u044b \u0441\u0431\u0438\u043b \u0441\u0442\u0440\u043e\u0439. \u041f\u0430\u043d\u0435\u043b\u044c \u043f\u043e\u0435\u0445\u0430\u043b\u0430, \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0432 \u043a\u0430\u0440\u0446\u0435\u0440.",
      visual: "sidebar",
      reason: "sidebar drift after disrespect",
    },
    {
      message: "\u0413\u0435\u043d\u0435\u0440\u0430\u043b \u0443\u043b\u044b\u0431\u043d\u0443\u043b\u0441\u044f. \u042d\u0442\u043e \u043f\u043b\u043e\u0445\u043e\u0439 \u0437\u043d\u0430\u043a: \u0442\u0435\u043f\u0435\u0440\u044c \u0434\u0443\u043c\u0430\u0435\u0448\u044c \u0431\u0435\u0437 \u043a\u043e\u0441\u0442\u044b\u043b\u0435\u0439.",
      visual: "panel",
      reason: "coach panel taunt after disrespect",
    },
    {
      message: "\u041e\u0442 \u0442\u0430\u043a\u043e\u0433\u043e \u0442\u043e\u043d\u0430 \u0434\u0430\u0436\u0435 \u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u043f\u043e\u043a\u043e\u0441\u0438\u043b\u0441\u044f. \u041f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u0441\u043d\u044f\u0442\u044b \u0441 \u0434\u043e\u0432\u043e\u043b\u044c\u0441\u0442\u0432\u0438\u044f.",
      visual: "tilt",
      reason: "interface tilted after disrespect",
    },
  ];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  return {
    title: "\u041f\u043e\u043b\u043a\u043e\u0432\u043d\u0438\u043a \u041e\u0441\u0430\u0434\u0430",
    avatarStyle: "red",
    message: scene.message,
    action: {
      type: "discipline_penalty",
      size: 3,
      reason: scene.reason,
      visual: scene.visual,
    },
  };
}

function safeCoachPayload(input){
  const text = value => String(value ?? "").slice(0, 900);
  return {
    event: text(input.event).slice(0, 40),
    tone: text(input.tone).slice(0, 20),
    localMessage: text(input.localMessage),
    question: text(input.question),
    options: Array.isArray(input.options) ? input.options.slice(0, 8).map(text) : [],
    userQuestion: text(input.userQuestion),
    userAnswer: text(input.userAnswer),
    userReply: text(input.userReply),
    correctAnswer: text(input.correctAnswer),
    proposedAction: input.proposedAction && typeof input.proposedAction === "object" ? input.proposedAction : {},
    stats: input.stats && typeof input.stats === "object" ? input.stats : {},
    problemMode: Boolean(input.problemMode),
  };
}

async function handleCoachMessage(req, res){
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const settings = await getAppSettings();
  if (!settings.aiCoachEnabled) {
    sendJson(res, 403, {
      error: "ai_coach_disabled",
      message: "\u0418\u0418-\u043d\u0430\u0441\u0442\u0430\u0432\u043d\u0438\u043a \u0432\u044b\u043a\u043b\u044e\u0447\u0435\u043d \u0430\u0434\u043c\u0438\u043d\u043e\u043c.",
    });
    return;
  }

  let payload;
  try {
    payload = safeCoachPayload(JSON.parse(await readBody(req)));
  } catch {
    sendJson(res, 400, { error: "bad_json" });
    return;
  }
  const userDisrespectedGeneral = payloadHasCoachDisrespect(payload);

  const prompt = {
    role: "user",
    content: JSON.stringify(payload),
  };

  try {
    const aiResult = await requestCoachDecision(prompt);
    if (!aiResult.ok) {
      console.warn(`[coach] ${aiResult.provider} error:`, {
        status: aiResult.status,
        detail: aiResult.detail,
      });
      if (userDisrespectedGeneral) {
        sendJson(res, 200, coachDisciplineFallback());
        return;
      }
      sendJson(res, aiResult.status, {
        error: "ai_provider_error",
        detail: aiResult.detail,
        message: AI_COACH_UNAVAILABLE_MESSAGE,
      });
      return;
    }

    const decision = guardLiveHintDecision(parseCoachDecision(aiResult.text), payload);
    if (!decision.message) {
      console.warn(`[coach] ${aiResult.provider} returned an empty coach message`);
      if (userDisrespectedGeneral) {
        sendJson(res, 200, coachDisciplineFallback());
        return;
      }
      sendJson(res, 502, {
        error: "ai_empty_message",
        message: AI_COACH_UNAVAILABLE_MESSAGE,
      });
      return;
    }
    console.log("[coach] decision:", {
      provider: aiResult.provider,
      model: aiResult.model,
      event: payload.event,
      tone: payload.tone,
      action: decision.action?.type || "none",
      reason: decision.action?.reason || "",
    });
    sendJson(res, 200, decision);
  } catch (error) {
    if (error.code && error.config) {
      console.warn(error.config.missingKeyLog);
      sendJson(res, 503, {
        error: error.code,
        message: AI_COACH_UNAVAILABLE_MESSAGE,
      });
      return;
    }
    console.warn("[coach] AI provider request failed:", error);
    if (payloadHasCoachDisrespect(payload)) {
      sendJson(res, 200, coachDisciplineFallback());
      return;
    }
    sendJson(res, 502, {
      error: "ai_provider_request_failed",
      detail: error.message,
      message: AI_COACH_UNAVAILABLE_MESSAGE,
    });
  }
}

async function handleRegister(req, res){
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(await readBody(req, 8 * 1024));
  } catch {
    return sendJson(res, 400, { error: "bad_json" });
  }

  const valid = validateCredentials(body.username, body.password);
  if (valid.error) return sendJson(res, 400, { error: valid.error });

  const exists = await findUserByUsername(valid.username);
  if (exists) return sendJson(res, 409, { error: "username_taken" });

  const password = hashPassword(valid.password);
  const user = {
    id: crypto.randomUUID(),
    username: valid.username,
    passwordSalt: password.salt,
    passwordHash: password.hash,
    createdAt: new Date().toISOString(),
    stats: defaultUserStats(),
  };
  const savedUser = await createUserRecord(user);

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, savedUser.id);
  setSessionCookie(res, token);
  sendJson(res, 201, { user: publicUser(savedUser), leaderboard: await leaderboardRows() });
}

async function handleLogin(req, res){
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(await readBody(req, 8 * 1024));
  } catch {
    return sendJson(res, 400, { error: "bad_json" });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const user = await findUserByUsername(username);
  if (!user || !verifyPassword(password, user)) {
    return sendJson(res, 401, { error: "invalid_login" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, user.id);
  setSessionCookie(res, token);
  sendJson(res, 200, { user: publicUser(user), leaderboard: await leaderboardRows() });
}

async function handleMe(req, res){
  const user = await getSessionUser(req);
  if (!user) return sendJson(res, 401, { error: "not_authenticated" });
  sendJson(res, 200, { user: publicUser(user), leaderboard: await leaderboardRows() });
}

function handleLogout(req, res){
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  sendJson(res, 200, { ok: true });
}

async function handleLeaderboard(req, res){
  sendJson(res, 200, { leaderboard: await leaderboardRows() });
}

async function handleCoachMemory(req, res){
  const user = await getSessionUser(req);
  if (!user) return sendJson(res, 401, { error: "not_authenticated" });

  if (req.method === "GET") {
    const stats = Object.assign(defaultUserStats(), user.stats || {});
    return sendJson(res, 200, { coachMemory: normalizeCoachMemory(stats.coachMemory) });
  }

  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(await readBody(req, 16 * 1024));
  } catch {
    return sendJson(res, 400, { error: "bad_json" });
  }

  const stats = Object.assign(defaultUserStats(), user.stats || {});
  stats.coachMemory = normalizeCoachMemory(body.coachMemory);
  const savedUser = await saveUserStats(user.id, stats);
  sendJson(res, 200, {
    coachMemory: normalizeCoachMemory(savedUser?.stats?.coachMemory),
  });
}

async function handleSettings(req, res){
  if (req.method !== "GET") return sendJson(res, 405, { error: "method_not_allowed" });
  sendJson(res, 200, { settings: await getAppSettings() });
}

async function handleAdminSettings(req, res){
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  const user = await getSessionUser(req);
  if (!user) return sendJson(res, 401, { error: "not_authenticated" });
  if (!isAdminUser(user)) return sendJson(res, 403, { error: "admin_required" });

  let body;
  try {
    body = JSON.parse(await readBody(req, 8 * 1024));
  } catch {
    return sendJson(res, 400, { error: "bad_json" });
  }

  const current = await getAppSettings();
  const next = await saveAppSettings({
    ...current,
    aiCoachEnabled: body.aiCoachEnabled !== false,
  });
  sendJson(res, 200, { settings: next });
}

async function handleSubmitScore(req, res){
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return sendJson(res, 401, { error: "not_authenticated" });

  let body;
  try {
    body = JSON.parse(await readBody(req, 12 * 1024));
  } catch {
    return sendJson(res, 400, { error: "bad_json" });
  }

  const percent = Math.max(0, Math.min(100, Number(body.percent || 0)));
  const questionsCount = Math.max(0, Math.min(500, Number(body.questionsCount || 0)));
  const correct = Math.round((percent / 100) * questionsCount);
  const elapsedMs = Math.max(0, Math.min(24 * 60 * 60 * 1000, Number(body.elapsedMs || 0)));
  const exp = Math.max(0, Math.min(5000, Number(body.exp || 0)));

  const user = await findUserById(sessionUser.id);
  if (!user) return sendJson(res, 401, { error: "not_authenticated" });

  const stats = Object.assign(defaultUserStats(), user.stats || {});
  stats.exp = Number(stats.exp || 0) + exp;
  stats.testsCompleted = Number(stats.testsCompleted || 0) + 1;
  stats.bestPercent = Math.max(Number(stats.bestPercent || 0), percent);
  stats.totalQuestions = Number(stats.totalQuestions || 0) + questionsCount;
  stats.totalCorrect = Number(stats.totalCorrect || 0) + correct;
  stats.totalTimeSeconds = Number(stats.totalTimeSeconds || 0) + Math.floor(elapsedMs / 1000);
  stats.lastPlayedAt = new Date().toISOString();
  const savedUser = await saveUserStats(user.id, stats);
  sendJson(res, 200, { user: publicUser(savedUser), leaderboard: await leaderboardRows() });
}

function serveStatic(req, res){
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.resolve(ROOT, "." + pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    res.end(data);
  });
}

function runApi(handler, req, res){
  Promise.resolve(handler(req, res)).catch(error => {
    console.error("API error:", error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "server_error" });
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/api/coach-message")) {
    runApi(handleCoachMessage, req, res);
    return;
  }
  if (req.url === "/api/register") return runApi(handleRegister, req, res);
  if (req.url === "/api/login") return runApi(handleLogin, req, res);
  if (req.url === "/api/me") return runApi(handleMe, req, res);
  if (req.url === "/api/logout") return runApi(handleLogout, req, res);
  if (req.url === "/api/leaderboard") return runApi(handleLeaderboard, req, res);
  if (req.url === "/api/coach-memory") return runApi(handleCoachMemory, req, res);
  if (req.url === "/api/settings") return runApi(handleSettings, req, res);
  if (req.url === "/api/admin/settings") return runApi(handleAdminSettings, req, res);
  if (req.url === "/api/submit-score") return runApi(handleSubmitScore, req, res);
  serveStatic(req, res);
});

initDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`SessionTester running at http://127.0.0.1:${PORT}/`);
      console.log(
        pgPool
          ? `Postgres leaderboard enabled (${DATABASE_SOURCE})`
          : "JSON leaderboard enabled (local fallback)"
      );
      const aiConfig = getAiProviderConfig();
      console.log(
        aiConfig.apiKey
          ? `${aiConfig.name} coach enabled (${aiConfig.model})`
          : `${aiConfig.name} coach disabled: set ${aiConfig.provider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY"}`
      );
    });
  })
  .catch(error => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
