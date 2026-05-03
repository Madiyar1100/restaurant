const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const COOKIE_NAME = "sakura_session";
const ADMIN_COOKIE_NAME = "sakura_admin_session";

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "manager";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "manager#2026";

function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
}

function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8 && /[^A-Za-z0-9]/.test(password);
}

function passwordMessage() {
  return "Пароль должен быть от 8 символов и содержать хотя бы один спецсимвол";
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

const seedMenu = [
  {
    id: uid("menu"),
    name: "Omakase Set",
    category: "sets",
    price: 18900,
    description: "12 нигири, 8 роллов, мисо-бульон, гари, васаби и три фирменных соуса.",
    tags: ["шеф", "премиум"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Akami Nigiri",
    category: "sushi",
    price: 2100,
    description: "Постный тунец на теплом рисе с легкой кистью никири-соуса.",
    tags: ["тунец", "классика"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Salmon Yuzu Roll",
    category: "rolls",
    price: 4200,
    description: "Лосось, огурец, авокадо, юдзу-косе, кунжут и тобико.",
    tags: ["лосось", "цитрус"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Unagi Dragon Roll",
    category: "rolls",
    price: 5200,
    description: "Угорь на гриле, авокадо, огурец, глазурь таре и хрустящий рис.",
    tags: ["угорь", "теплый"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Sake Junmai",
    category: "drinks",
    price: 3900,
    description: "Сухое саке джунмай, подаем охлажденным или теплым, 180 мл.",
    tags: ["саке", "сухое"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Edamame Shio",
    category: "sides",
    price: 1600,
    description: "Эдамаме на пару с морской солью и цитрусовой цедрой.",
    tags: ["гарнир", "вегетарианское"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Sauce Flight",
    category: "sauces",
    price: 1200,
    description: "Понзу, спайси-майо, никири-соя и копченый кунжутный соус.",
    tags: ["соусы", "дегустация"],
    available: true
  },
  {
    id: uid("menu"),
    name: "Wasabi & Gari Set",
    category: "sides",
    price: 900,
    description: "Свежий васаби, маринованный имбирь и соевый соус к суши-сетам.",
    tags: ["пейринг", "классика"],
    available: true
  }
];

function defaultDb() {
  return {
    meta: {
      createdAt: nowIso(),
      updatedAt: nowIso(),
      restaurantName: "Sakura Table"
    },
    users: [],
    sessions: [],
    adminSessions: [],
    menu: seedMenu,
    reservations: [],
    deliveries: []
  };
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (!Array.isArray(db.sessions)) db.sessions = [];
  if (!Array.isArray(db.adminSessions)) db.adminSessions = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.menu)) db.menu = [];
  if (!Array.isArray(db.reservations)) db.reservations = [];
  if (!Array.isArray(db.deliveries)) db.deliveries = [];
  if (!db.meta) db.meta = { createdAt: nowIso(), updatedAt: nowIso(), restaurantName: "Sakura Table" };
  return db;
}

function writeDb(db) {
  db.meta.updatedAt = nowIso();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function updateUserProfile(user, body, allowRole = false) {
  user.name = asText(body.name, user.name);
  user.phone = asText(body.phone, user.phone);
  if (asText(body.email)) user.email = asText(body.email, user.email).toLowerCase();
  if (allowRole && ["admin", "guest"].includes(body.role)) user.role = body.role;
  const password = asText(body.password);
  if (password) {
    if (!isStrongPassword(password)) {
      const error = new Error(passwordMessage());
      error.status = 400;
      throw error;
    }
    user.passwordHash = hashPassword(password);
  }
  return user;
}

function restaurantContext(db) {
  const menu = db.menu
    .filter((item) => item.available)
    .slice(0, 18)
    .map((item) => `${item.name}: ${item.description} Цена ${item.price} KZT. Категория ${item.category}.`)
    .join("\n");
  return [
    "Ты AI-ассистент ресторана Sakura Table.",
    "Отвечай по-русски, кратко, вежливо и практично.",
    "Помогай с меню, суши, роллами, саке, соусами, васаби, бронированием и доставкой.",
    "Не придумывай юридические, медицинские или финансовые обещания.",
    "Если вопрос про действие на сайте, объясни: для брони и доставки нужен вход в аккаунт; админ редактирует данные в админ-панели.",
    "Актуальные позиции меню:",
    menu || "Меню пока пустое."
  ].join("\n");
}

async function askGroq(db, messages) {
  if (!GROQ_API_KEY) {
    const error = new Error("AI-чат не настроен. Укажите GROQ_API_KEY в .env или переменных окружения хостинга.");
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 500,
      messages: [
        { role: "system", content: restaurantContext(db) },
        ...messages.slice(-8)
      ]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Запрос к AI-провайдеру не выполнен");
    error.status = response.status;
    throw error;
  }
  return data.choices?.[0]?.message?.content?.trim() || "Я рядом. Уточните вопрос по меню, брони или доставке.";
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function createAdminSession(db) {
  const session = {
    id: uid("adm"),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  };
  db.adminSessions = db.adminSessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
  db.adminSessions.push(session);
  return session;
}

function getAdminSession(req, db) {
  const cookies = parseCookies(req);
  const sessionId = cookies[ADMIN_COOKIE_NAME];
  if (!sessionId) return null;
  const session = db.adminSessions.find((item) => item.id === sessionId);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
  return session;
}

function getSessionUser(req, db) {
  const cookies = parseCookies(req);
  const sessionId = cookies[COOKIE_NAME];
  if (!sessionId) return null;
  const session = db.sessions.find((item) => item.id === sessionId);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Слишком большой запрос"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Некорректный JSON"));
      }
    });
  });
}

function requireAuth(req, res, db) {
  const user = getSessionUser(req, db);
  if (!user) sendError(res, 401, "Нужно войти в аккаунт");
  return user;
}

function requireAdmin(req, res, db) {
  const session = getAdminSession(req, db);
  if (!session) {
    sendError(res, 401, "Нужно войти в админ-панель");
    return null;
  }
  return session;
}

function asText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanMenuItem(input, existing = {}) {
  return {
    ...existing,
    name: asText(input.name, existing.name),
    category: asText(input.category, existing.category || "rolls"),
    price: Math.max(0, Math.round(asNumber(input.price, existing.price))),
    description: asText(input.description, existing.description),
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => asText(tag)).filter(Boolean)
      : asText(input.tags, Array.isArray(existing.tags) ? existing.tags.join(", ") : "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    available: Boolean(input.available)
  };
}

function createSession(db, userId) {
  const session = {
    id: uid("ses"),
    userId,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
  db.sessions.push(session);
  return session;
}

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
  }[ext] || "application/octet-stream";
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const safePath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": getMime(filePath) });
    res.end(content);
  });
}

async function handleApi(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = url.pathname;

  try {
    if (req.method === "GET" && route === "/api/health") {
      sendJson(res, 200, { ok: true, service: "Sakura Table", time: nowIso() });
      return;
    }

    if (req.method === "GET" && route === "/api/menu") {
      sendJson(res, 200, { menu: db.menu });
      return;
    }

    if (req.method === "GET" && route === "/api/me") {
      sendJson(res, 200, { user: publicUser(getSessionUser(req, db)) });
      return;
    }

    if (req.method === "GET" && route === "/api/admin/me") {
      sendJson(res, 200, { admin: Boolean(getAdminSession(req, db)), username: getAdminSession(req, db) ? ADMIN_USERNAME : null });
      return;
    }

    if (req.method === "POST" && route === "/api/admin/login") {
      const body = await readBody(req);
      const username = asText(body.username);
      const password = asText(body.password);
      if (!safeEqualText(username, ADMIN_USERNAME) || !safeEqualText(password, ADMIN_PASSWORD)) {
        sendError(res, 401, "Неверный логин или пароль администратора");
        return;
      }
      const session = createAdminSession(db);
      writeDb(db);
      sendJson(res, 200, { admin: true, username: ADMIN_USERNAME }, {
        "Set-Cookie": `${ADMIN_COOKIE_NAME}=${encodeURIComponent(session.id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`
      });
      return;
    }

    if (req.method === "POST" && route === "/api/admin/logout") {
      const cookies = parseCookies(req);
      db.adminSessions = db.adminSessions.filter((item) => item.id !== cookies[ADMIN_COOKIE_NAME]);
      writeDb(db);
      sendJson(res, 200, { ok: true }, {
        "Set-Cookie": `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
      });
      return;
    }

    if (req.method === "PATCH" && route === "/api/me") {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const body = await readBody(req);
      const requestedEmail = asText(body.email, user.email).toLowerCase();
      if (requestedEmail !== user.email.toLowerCase() && db.users.some((item) => item.email.toLowerCase() === requestedEmail)) {
        sendError(res, 409, "Этот email уже зарегистрирован");
        return;
      }
      updateUserProfile(user, body);
      writeDb(db);
      sendJson(res, 200, { user: publicUser(user) });
      return;
    }

    if (req.method === "POST" && route === "/api/register") {
      const body = await readBody(req);
      const email = asText(body.email).toLowerCase();
      const password = asText(body.password);
      if (!asText(body.name) || !email) {
        sendError(res, 400, "Имя и email обязательны");
        return;
      }
      if (!isStrongPassword(password)) {
        sendError(res, 400, passwordMessage());
        return;
      }
      if (db.users.some((user) => user.email.toLowerCase() === email)) {
        sendError(res, 409, "Этот email уже зарегистрирован");
        return;
      }
      const user = {
        id: uid("usr"),
        name: asText(body.name),
        email,
        phone: asText(body.phone),
        role: "guest",
        passwordHash: hashPassword(password),
        createdAt: nowIso()
      };
      db.users.push(user);
      const session = createSession(db, user.id);
      writeDb(db);
      sendJson(res, 201, { user: publicUser(user) }, {
        "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(session.id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
      });
      return;
    }

    if (req.method === "POST" && route === "/api/login") {
      const body = await readBody(req);
      const email = asText(body.email).toLowerCase();
      const user = db.users.find((item) => item.email.toLowerCase() === email);
      if (!user || !verifyPassword(asText(body.password), user.passwordHash)) {
        sendError(res, 401, "Неверный email или пароль");
        return;
      }
      if (user.role === "admin") {
        sendError(res, 403, "Администратор входит через отдельную страницу");
        return;
      }
      const session = createSession(db, user.id);
      writeDb(db);
      sendJson(res, 200, { user: publicUser(user) }, {
        "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(session.id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
      });
      return;
    }

    if (req.method === "POST" && route === "/api/logout") {
      const cookies = parseCookies(req);
      db.sessions = db.sessions.filter((item) => item.id !== cookies[COOKIE_NAME]);
      writeDb(db);
      sendJson(res, 200, { ok: true }, {
        "Set-Cookie": `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
      });
      return;
    }

    if (req.method === "POST" && route === "/api/reservations") {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const body = await readBody(req);
      if (!asText(body.date) || !asText(body.time) || asNumber(body.guests) < 1) {
        sendError(res, 400, "Дата, время и количество гостей обязательны");
        return;
      }
      const reservation = {
        id: uid("res"),
        userId: user.id,
        name: asText(body.name, user.name),
        phone: asText(body.phone, user.phone),
        date: asText(body.date),
        time: asText(body.time),
        guests: Math.max(1, Math.round(asNumber(body.guests, 1))),
        occasion: asText(body.occasion),
        notes: asText(body.notes),
        status: "new",
        createdAt: nowIso()
      };
      db.reservations.push(reservation);
      writeDb(db);
      sendJson(res, 201, { reservation });
      return;
    }

    if (req.method === "POST" && route === "/api/deliveries") {
      const user = requireAuth(req, res, db);
      if (!user) return;
      const body = await readBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      const normalizedItems = items
        .map((item) => {
          const menuItem = db.menu.find((entry) => entry.id === item.menuItemId && entry.available);
          const quantity = Math.max(1, Math.round(asNumber(item.quantity, 1)));
          return menuItem ? { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity } : null;
        })
        .filter(Boolean);
      if (!normalizedItems.length || !asText(body.address) || !asText(body.phone)) {
        sendError(res, 400, "Для доставки нужны позиции, адрес и телефон");
        return;
      }
      const delivery = {
        id: uid("ord"),
        userId: user.id,
        name: asText(body.name, user.name),
        phone: asText(body.phone, user.phone),
        address: asText(body.address),
        timeWindow: asText(body.timeWindow, "asap"),
        payment: asText(body.payment, "card"),
        notes: asText(body.notes),
        items: normalizedItems,
        total: normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status: "new",
        createdAt: nowIso()
      };
      db.deliveries.push(delivery);
      writeDb(db);
      sendJson(res, 201, { delivery });
      return;
    }

    if (req.method === "POST" && route === "/api/chat") {
      const body = await readBody(req);
      const question = asText(body.message);
      const history = Array.isArray(body.history) ? body.history : [];
      if (!question) {
        sendError(res, 400, "Сообщение обязательно");
        return;
      }
      const messages = [
        ...history
          .filter((item) => ["user", "assistant"].includes(item.role) && asText(item.content))
          .map((item) => ({ role: item.role, content: asText(item.content).slice(0, 1200) })),
        { role: "user", content: question.slice(0, 1200) }
      ];
      const answer = await askGroq(db, messages);
      sendJson(res, 200, { answer });
      return;
    }

    if (req.method === "GET" && route === "/api/admin/overview") {
      if (!requireAdmin(req, res, db)) return;
      sendJson(res, 200, {
        users: db.users.map(publicUser),
        menu: db.menu,
        reservations: db.reservations,
        deliveries: db.deliveries,
        meta: db.meta
      });
      return;
    }

    if (req.method === "POST" && route === "/api/admin/menu") {
      if (!requireAdmin(req, res, db)) return;
      const body = await readBody(req);
      const item = {
        id: uid("menu"),
        ...cleanMenuItem(body),
        createdAt: nowIso()
      };
      db.menu.push(item);
      writeDb(db);
      sendJson(res, 201, { item });
      return;
    }

    const adminMatch = route.match(/^\/api\/admin\/(users|menu|reservations|deliveries)\/([^/]+)$/);
    if (adminMatch && ["PATCH", "DELETE"].includes(req.method)) {
      if (!requireAdmin(req, res, db)) return;
      const [, collection, id] = adminMatch;
      const index = db[collection].findIndex((item) => item.id === id);
      if (index < 0) {
        sendError(res, 404, "Запись не найдена");
        return;
      }
      if (req.method === "DELETE") {
        const [removed] = db[collection].splice(index, 1);
        if (collection === "users") {
          db.sessions = db.sessions.filter((session) => session.userId !== removed.id);
        }
        writeDb(db);
        sendJson(res, 200, { removed: collection === "users" ? publicUser(removed) : removed });
        return;
      }

      const body = await readBody(req);
      if (collection === "menu") {
        db.menu[index] = cleanMenuItem(body, db.menu[index]);
      }
      if (collection === "users") {
        const existing = db.users[index];
        const requestedEmail = asText(body.email, existing.email).toLowerCase();
        if (requestedEmail !== existing.email.toLowerCase() && db.users.some((item) => item.id !== existing.id && item.email.toLowerCase() === requestedEmail)) {
          sendError(res, 409, "Этот email уже зарегистрирован");
          return;
        }
        db.users[index] = updateUserProfile(existing, body, true);
      }
      if (collection === "reservations") {
        const existing = db.reservations[index];
        db.reservations[index] = {
          ...existing,
          name: asText(body.name, existing.name),
          phone: asText(body.phone, existing.phone),
          date: asText(body.date, existing.date),
          time: asText(body.time, existing.time),
          guests: Math.max(1, Math.round(asNumber(body.guests, existing.guests))),
          occasion: asText(body.occasion, existing.occasion),
          notes: asText(body.notes, existing.notes),
          status: ["new", "confirmed", "seated", "cancelled"].includes(body.status) ? body.status : existing.status
        };
      }
      if (collection === "deliveries") {
        const existing = db.deliveries[index];
        db.deliveries[index] = {
          ...existing,
          name: asText(body.name, existing.name),
          phone: asText(body.phone, existing.phone),
          address: asText(body.address, existing.address),
          timeWindow: asText(body.timeWindow, existing.timeWindow),
          payment: asText(body.payment, existing.payment),
          notes: asText(body.notes, existing.notes),
          status: ["new", "cooking", "courier", "delivered", "cancelled"].includes(body.status) ? body.status : existing.status
        };
      }
      writeDb(db);
      sendJson(res, 200, { item: collection === "users" ? publicUser(db[collection][index]) : db[collection][index] });
      return;
    }

    sendError(res, 404, "API-маршрут не найден");
  } catch (error) {
    sendError(res, error.status || 500, error.message || "Внутренняя ошибка сервера");
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

ensureDb();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sakura Table is running on port ${PORT}`);
});
