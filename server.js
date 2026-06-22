const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const SESSION_COOKIE = "session_tester_sid";
const DATABASE_URL = process.env.DATABASE_URL || "";
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
    createdAt: user.createdAt,
    stats: user.stats || defaultUserStats(),
  };
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

function safeCoachPayload(input){
  const text = value => String(value ?? "").slice(0, 900);
  return {
    event: text(input.event).slice(0, 40),
    tone: text(input.tone).slice(0, 20),
    localMessage: text(input.localMessage),
    question: text(input.question),
    userAnswer: text(input.userAnswer),
    correctAnswer: text(input.correctAnswer),
    stats: input.stats && typeof input.stats === "object" ? input.stats : {},
    problemMode: Boolean(input.problemMode),
  };
}

async function handleCoachMessage(req, res){
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  if (!OPENAI_API_KEY) {
    sendJson(res, 503, {
      error: "missing_openai_api_key",
      message: null,
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

  const prompt = {
    role: "user",
    content: JSON.stringify(payload),
  };

  try {
    const apiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_output_tokens: 120,
        input: [
          {
            role: "system",
            content:
              "You are a quiz drill general. Reply in Russian. " +
              "Be cinematic and strict when tone is drill or danger, but do not insult, humiliate, use slurs, or profanity. " +
              "Never reveal the correct answer during an active question unless the event is finish or problemCleared. " +
              "Return only one short coach line, 1-2 sentences, no markdown.",
          },
          prompt,
        ],
      }),
    });

    const data = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok) {
      sendJson(res, apiRes.status, {
        error: "openai_error",
        detail: data?.error?.message || apiRes.statusText,
      });
      return;
    }

    const message = extractOutputText(data).replace(/\s+/g, " ").trim().slice(0, 320);
    sendJson(res, 200, { message });
  } catch (error) {
    sendJson(res, 502, {
      error: "openai_request_failed",
      detail: error.message,
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
  if (req.url === "/api/submit-score") return runApi(handleSubmitScore, req, res);
  serveStatic(req, res);
});

initDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`SessionTester running at http://127.0.0.1:${PORT}/`);
      console.log(pgPool ? "Postgres leaderboard enabled" : "JSON leaderboard enabled (local fallback)");
      console.log(OPENAI_API_KEY ? `OpenAI coach enabled (${OPENAI_MODEL})` : "OpenAI coach disabled: set OPENAI_API_KEY");
    });
  })
  .catch(error => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
