// server.js — переписанный backend (монолитный, но структурированный)
require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const axios = require("axios");
const QRCode = require("qrcode");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const crypto = require('crypto');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// простой rate limiter для защиты публичных эндпоинтов
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  max: 300, // max 300 запросов с одного IP за window
});
app.use(limiter);

// Postgres pool
const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "ShortLinks",
  password: process.env.PG_PASSWORD || "motherlode",
  port: Number(process.env.PG_PORT || 5432),
});

// --- Утилиты ---
function generateShort(longUrl, len = 6) {
  const hash = crypto.createHash('md5').update(longUrl).digest('hex');
  const base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let short = '';
  let num = parseInt(hash.substr(0, 8), 16);
  while (short.length < len && num > 0) {
    short = base62[num % 62] + short;
    num = Math.floor(num / 62);
  }
  return short.padStart(len, base62[0]);
}


async function safePost(url, body) {
  try {
    return await axios.post(url, body);
  } catch (e) {
    return null;
  }
}

async function checkUrlExists(url) {
  if (!url) return false;
  try {
    const r = await axios.head(url, { timeout: 5000, maxRedirects: 3 });
    return r.status >= 200 && r.status < 400;
  } catch (err) {
    try {
      const r = await axios.get(url, { timeout: 5000, maxRedirects: 3 });
      return r.status >= 200 && r.status < 400;
    } catch {
      return false;
    }
  }
}

// Альтернативная проверка через second API (ipapi.co для проверки доступности)
async function checkUrlWithAlternative(url) {
  if (!url) return { isValid: false, method: 'none' };
  try {
    // Используем ipapi.co для проверки URL через их endpoint
    const encodedUrl = encodeURIComponent(url);
    const res = await axios.get(`https://api.ipapi.co/json/?url=${encodedUrl}`, { timeout: 10000 });
    // ipapi.co возвращает информацию о URL, если он валидный
    if (res.data && res.data.valid === true) {
      return { isValid: true, method: 'ipapi' };
    }
    return { isValid: false, method: 'ipapi' };
  } catch (e) {
    // Fallback: пробуем через другой метод - просто GET запрос
    try {
      const r = await axios.get(url, { timeout: 8000, maxRedirects: 5, validateStatus: () => true });
      const isValid = r.status >= 200 && r.status < 500;
      return { isValid, method: 'axios' };
    } catch (err) {
      return { isValid: false, method: 'axios' };
    }
  }
}

// Фоновая проверка всех ссылок
async function checkAllLinks() {
  console.log(`[${new Date().toISOString()}] Начало фоновой проверки ссылок...`);
  try {
    const linksResult = await pool.query("SELECT id, long, short FROM links WHERE is_active = true");
    const links = linksResult.rows;
    
    let checked = 0;
    let active = 0;
    let inactive = 0;
    
    for (const link of links) {
      try {
        // Проверяем через основной метод
        const primaryValid = await checkUrlExists(link.long);
        
        // Проверяем через альтернативный метод
        const altResult = await checkUrlWithAlternative(link.long);
        
        // Считаем ссылку активной если хотя бы один метод подтвердил
        const isActive = primaryValid || altResult.isValid;
        
        await pool.query(
          "UPDATE links SET is_active = $1, last_checked = NOW(), check_status = $2 WHERE id = $3",
          [isActive, isActive ? 'active' : 'inactive', link.id]
        );
        
        if (isActive) active++;
        else inactive++;
        
        checked++;
        
        // Небольшая задержка между проверками чтобы не нагружать API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Ошибка проверки ссылки ${link.short}:`, err.message);
        await pool.query(
          "UPDATE links SET check_status = $1 WHERE id = $2",
          ['error', link.id]
        );
      }
    }
    
    console.log(`[${new Date().toISOString()}] Проверка завершена: проверено ${checked}, активных ${active}, неактивных ${inactive}`);
  } catch (err) {
    console.error("Ошибка фоновой проверки ссылок:", err);
  }
}

// Запуск фоновой проверки каждые 30 минут (2 раза в час)
function startBackgroundLinkChecker() {
  // Запускаем первую проверку через 1 минуту после старта
  setTimeout(() => {
    checkAllLinks();
  }, 60000);
  
  // Затем каждые 30 минут
  setInterval(() => {
    checkAllLinks();
  }, 30 * 60 * 1000); // 30 минут = 1800000 мс
  
  console.log("Фоновая проверка ссылок запущена (каждые 30 минут)");
}

// Проверка через Google Safe Browsing (опционально)
async function checkUrlGoogle(url) {
  if (!process.env.GOOGLE_API_KEY) return false;
  const body = {
    client: { clientId: "short_links_app", clientVersion: "1.0.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };
  try {
    const res = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
      body,
      { timeout: 5000 }
    );
    return Boolean(res.data && res.data.matches && res.data.matches.length);
  } catch (e) {
    console.warn("SafeBrowsing error:", e.message);
    return false;
  }
}

// Проверка через VirusTotal (опционально)
async function checkUrlVirusTotal(url) {
  if (!process.env.VIRUSTOTAL_API_KEY) return false;
  try {
    const res = await axios.post(
      "https://www.virustotal.com/api/v3/urls",
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
          "content-type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );
    const urlId = res.data.data.id;
    // опрос результата анализа (может быть моментально)
    const analysis = await axios.get(`https://www.virustotal.com/api/v3/analyses/${urlId}`, {
      headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY },
      timeout: 10000,
    });
    const stats = analysis.data?.data?.attributes?.stats || {};
    return (stats.malicious || 0) > 0 || (stats.suspicious || 0) > 0;
  } catch (e) {
    console.warn("VirusTotal error:", e.message);
    return false;
  }
}

async function isUnsafeUrl(url) {
  // комбинируем проверки, если ключи не заданы — пропускаем
  const googleUnsafe = await checkUrlGoogle(url).catch(() => false);
  const vtUnsafe = await checkUrlVirusTotal(url).catch(() => false);
  return googleUnsafe || vtUnsafe;
}

// Получение гео по IP (ipapi.co)
async function geoFromIp(ip) {
  if (!ip) return { country: null, city: null };

  // удаляем подстановку 8.8.8.8
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
    return {
      country: res.data.country_name || null,
      city: res.data.city || null,
    };
  } catch (e) {
    return { country: null, city: null };
  }
}

// --- API: Пользователи ---
app.post("/register", async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ success: false, message: "login и password обязательны" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (login, password_hash) VALUES ($1, $2) RETURNING id, login",
      [login, hashed]
    );
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("register error:", err.message);
    return res.status(200).json({ success: false, message: "Пользователь может уже существовать" });
  }
});

app.post("/login", async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ success: false, message: "login и password обязательны" });
  try {
    const result = await pool.query("SELECT * FROM users WHERE login=$1", [login]);
    if (!result.rows.length) return res.status(200).json({ success: false, message: "Пользователь не найден" });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(200).json({ success: false, message: "Неверный пароль" });
    return res.json({ success: true, user: { id: user.id, login: user.login } });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

// --- API: Links ---
// Создание ссылки
app.post("/links", async (req, res) => {
  const { long, userId = null, type = false, valid_from = null, valid_until = null } = req.body;
  if (!long || String(long).trim() === "") return res.status(400).json({ success: false, message: "URL не может быть пустым" });

  // проверка доступности URL
  const exists = await checkUrlExists(long);
  if (!exists) return res.status(200).json({ success: false, message: "Ссылка недоступна или не существует" });

  try {
    // проверка на подозрительность (опционально)
    const unsafe = await isUnsafeUrl(long);
    if (unsafe) {
      // сохраняем в unsafe_links (если такая таблица есть) и возвращаем отказ
      try {
        await pool.query("INSERT INTO unsafe_links (long) VALUES ($1) ON CONFLICT (long) DO NOTHING", [long]);
      } catch (e) {
        console.warn("Could not insert into unsafe_links:", e.message);
      }
      return res.status(200).json({ success: false, message: "Ссылка признана подозрительной" });
    }

    // для публичных ссылок — пробуем найти уже существующую
    let link;
    if (type === true) {
      const existing = await pool.query("SELECT * FROM links WHERE long=$1 AND type=true LIMIT 1", [long]);
      if (existing.rows.length > 0) {
        link = existing.rows[0];
        // связываем с пользователем, если userId указан
        if (userId) {
          await pool.query(
            "INSERT INTO user_links (user_id, link_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [userId, link.id]
          );
        }
        return res.json({ success: true, link });
      }
    }

    // создаём новую запись
    const short = generateShort(long);
    const shortUrl = `http://localhost:5000/r/${short}`;
    const qrDataUrl = await QRCode.toDataURL(shortUrl);

    const insertResult = await pool.query(
      "INSERT INTO links (long, short, type, qr, valid_from, valid_until) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [long, short, type, qrDataUrl, valid_from || null, valid_until || null]
    );
    link = insertResult.rows[0];

    if (userId) {
      await pool.query("INSERT INTO user_links (user_id, link_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [userId, link.id]);
    }

    return res.json({ success: true, link });
  } catch (err) {
    console.error("create link error:", err);
    return res.status(500).json({ success: false, message: "Ошибка сервера: " + (err.message || "") });
  }
});

// Получение ссылок пользователя (или все для админа)
app.get("/links/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userResult = await pool.query("SELECT login FROM users WHERE id=$1", [userId]);
    const user = userResult.rows[0];
    if (user?.login === "admin") {
      const result = await pool.query(`
        SELECT l.*, u.login AS owner_login, ul.title, ul.is_favorite,
        (SELECT COUNT(*)::int FROM click_stats WHERE link_id = l.id) AS clicks
        FROM links l
        LEFT JOIN user_links ul ON ul.link_id = l.id
        LEFT JOIN users u ON ul.user_id = u.id
        ORDER BY l.id DESC
      `);
      return res.json({ success: true, links: result.rows, admin: true });
    }
    const result = await pool.query(
      `SELECT l.*, ul.title, ul.is_favorite,
      (SELECT COUNT(*)::int FROM click_stats WHERE link_id = l.id) AS clicks
       FROM links l
       JOIN user_links ul ON ul.link_id = l.id
       WHERE ul.user_id = $1
       ORDER BY l.id DESC`,
      [userId]
    );
    return res.json({ success: true, links: result.rows, admin: false });
  } catch (err) {
    console.error("get links error:", err);
    return res.status(500).json({ success: false, message: "Ошибка загрузки ссылок" });
  }
});

// Удаление ссылки
app.delete("/links/:userId/:linkId", async (req, res) => {
  const { userId, linkId } = req.params;
  try {
    const userResult = await pool.query("SELECT login FROM users WHERE id=$1", [userId]);
    const user = userResult.rows[0];
    if (user?.login === "admin") {
      await pool.query("DELETE FROM links WHERE id=$1", [linkId]);
      await pool.query("DELETE FROM user_links WHERE link_id=$1", [linkId]);
      return res.json({ success: true, message: "Ссылка удалена администратором" });
    }
    const linkRes = await pool.query("SELECT * FROM links WHERE id=$1", [linkId]);
    if (!linkRes.rows.length) return res.status(200).json({ success: false, message: "Ссылка не найдена" });
    const link = linkRes.rows[0];
    if (link.type === false) {
      // приватная — удаляем саму ссылку
      await pool.query("DELETE FROM links WHERE id=$1", [linkId]);
    } else {
      // публичная — удаляем только связь с пользователем
      await pool.query("DELETE FROM user_links WHERE user_id=$1 AND link_id=$2", [userId, linkId]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("delete link error:", err);
    return res.status(500).json({ success: false, message: "Ошибка удаления" });
  }
});

// Редирект по короткой ссылке — и запись клика
app.get("/r/:short", async (req, res) => {
  try {
    const short = req.params.short;
    const linkRes = await pool.query("SELECT * FROM links WHERE short=$1 LIMIT 1", [short]);
    if (!linkRes.rows.length) return res.status(404).send("Ссылка не найдена");
    const link = linkRes.rows[0];

    const now = new Date();
    if (!link.is_active) return res.status(403).send("Ссылка заблокирована как небезопасная");
    if (link.valid_from && new Date(link.valid_from) > now) return res.status(403).send("Эта ссылка ещё не активна");
    if (link.has_end_date && link.valid_until && new Date(link.valid_until) < now) return res.status(403).send("Срок действия ссылки истёк");

    // извлекаем IP
    const ip = (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "").replace("::ffff:", "");

    // получаем гео (без падения при ошибке)
    const { country, city } = await geoFromIp(ip).catch(() => ({ country: null, city: null }));

    // 1) Сохраняем клик в click_stats
    await pool.query(
      `INSERT INTO click_stats (link_id, country, city, created_at)
   VALUES ($1, $2, $3, NOW())`,
      [link.id, country, city]
    );


    // не трогаем statistics — больше её нет


    // 3) Редирект
    return res.redirect(link.long);
  } catch (err) {
    console.error("redirect error:", err);
    return res.status(500).send("Ошибка перехода");
  }
});

// --- Статистика ---
// возвращает подробную статистику по linkId:
// total (считает из click_stats — надёжно), countries([{country, count, pct}]), cities([{city, count, pct}])
app.get("/stats/:linkId", async (req, res) => {
  const { linkId } = req.params;
  try {
    // total кликов (из click_stats — единственный источник правды для детальной разбивки)
    const totalRes = await pool.query("SELECT COUNT(*)::int AS total FROM click_stats WHERE link_id = $1", [linkId]);
    const total = totalRes.rows[0]?.total || 0;

    // агрегация по странам (NULL -> 'Не определено')
    const countriesRes = await pool.query(
      `SELECT COALESCE(country, 'Не определено') as country, COUNT(*)::int AS count
       FROM click_stats
       WHERE link_id = $1
       GROUP BY COALESCE(country, 'Не определено')
       ORDER BY count DESC`,
      [linkId]
    );

    // агрегация по городам
    const citiesRes = await pool.query(
      `SELECT COALESCE(city, 'Не определено') as city, COUNT(*)::int AS count
       FROM click_stats
       WHERE link_id = $1
       GROUP BY COALESCE(city, 'Не определено')
       ORDER BY count DESC`,
      [linkId]
    );

    // Формируем проценты
    const formatWithPct = (rows) =>
      rows.map((r) => ({
        name: r.country || r.city, // caller can use either key
        keyName: r.country ? "country" : "city",
        label: r.country || r.city,
        count: r.count,
        pct: total > 0 ? Number(((r.count / total) * 100).toFixed(1)) : 0,
      }));

    // Но вернём в более удобном виде: countries, cities (каждый: { name, count, pct })
    const countries = countriesRes.rows.map((r) => ({
      name: r.country,
      count: Number(r.count),
      pct: total > 0 ? Number(((r.count / total) * 100).toFixed(1)) : 0,
    }));

    const cities = citiesRes.rows.map((r) => ({
      name: r.city,
      count: Number(r.count),
      pct: total > 0 ? Number(((r.count / total) * 100).toFixed(1)) : 0,
    }));

    return res.json({ success: true, total, countries, cities });
  } catch (err) {
    console.error("stats error:", err);
    return res.status(500).json({ success: false, message: "Ошибка получения статистики" });
  }
});

// --- Обновление ссылки (title, long, даты) ---
// Старый эндпоинт для изменения названия (для совместимости)
app.put("/links/:userId/:linkId/title", async (req, res) => {
  const { userId, linkId } = req.params;
  const { title } = req.body;

  try {
    // Сначала проверим, существует ли запись в user_links
    const checkResult = await pool.query(
      "SELECT * FROM user_links WHERE user_id=$1 AND link_id=$2",
      [userId, linkId]
    );

    if (checkResult.rows.length === 0) {
      // Если записи нет, создаём новую
      await pool.query(
        "INSERT INTO user_links (user_id, link_id, title, is_favorite) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, linkId, title, false]
      );
    } else {
      // Если запись есть, обновляем
      await pool.query(
        "UPDATE user_links SET title=$1 WHERE user_id=$2 AND link_id=$3 RETURNING *",
        [title, userId, linkId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка обновления названия:", err);
    res.status(500).json({ success: false, message: "Ошибка обновления названия" });
  }
});

// PUT /links/:userId/:linkId
app.put("/links/:userId/:linkId", async (req, res) => {
  const { userId, linkId } = req.params;
  const { long, valid_from, has_end_date, valid_until, title } = req.body;

  try {
    const linkRes = await pool.query("SELECT * FROM links WHERE id=$1", [linkId]);
    if (!linkRes.rows.length) return res.status(404).json({ success: false, message: "Ссылка не найдена" });
    const link = linkRes.rows[0];

    // проверка доступа
    const userResult = await pool.query("SELECT login FROM users WHERE id=$1", [userId]);
    const user = userResult.rows[0] || null;

    if (!user) return res.status(403).json({ success: false, message: "Пользователь не найден" });

    if (user.login !== "admin") {
      const access = await pool.query("SELECT * FROM user_links WHERE user_id=$1 AND link_id=$2", [userId, linkId]);
      if (!access.rows.length) return res.status(403).json({ success: false, message: "Нет доступа" });
      // публичные ссылки не позволяют менять long
      if (long && link.type === true) return res.status(200).json({ success: false, message: "У публичных ссылок нельзя менять длинный URL" });
    }

    const updates = [];
    const params = [];
    let idx = 1;

    if (typeof long !== "undefined" && long !== null && String(long).trim() !== "" && long !== link.long) {
      const exists = await checkUrlExists(long);
      if (!exists) return res.status(200).json({ success: false, message: "Новый URL недоступен" });
      updates.push(`long=$${idx++}`);
      params.push(long);
    }

    if (typeof valid_from !== "undefined") { updates.push(`valid_from=$${idx++}`); params.push(valid_from); }
    if (typeof has_end_date !== "undefined") { updates.push(`has_end_date=$${idx++}`); params.push(has_end_date); }
    if (typeof valid_until !== "undefined") { updates.push(`valid_until=$${idx++}`); params.push(valid_until); }

    // title хранится в user_links — обновим если передали (включая пустые строки)
    let titleUpdated = false;
    if (typeof title !== "undefined" && title !== null) {
      await pool.query("UPDATE user_links SET title=$1 WHERE user_id=$2 AND link_id=$3", [title, userId, linkId]);
      titleUpdated = true;
    }

    if (updates.length > 0) {
      params.push(linkId);
      const sql = `UPDATE links SET ${updates.join(", ")} WHERE id=$${idx} RETURNING *`;
      const updated = await pool.query(sql, params);
      return res.json({ success: true, link: updated.rows[0] });
    }

    if (titleUpdated) {
      // если обновлялось только title, вернем ссылку из БД
      const linkRes = await pool.query("SELECT * FROM links WHERE id=$1", [linkId]);
      return res.json({ success: true, link: linkRes.rows[0] });
    }

    return res.json({ success: true, message: "Обновлено успешно" });
  } catch (err) {
    console.error("update link error:", err);
    return res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

// --- Google OAuth callback (оставил как был, с env) ---
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");
    const params = new URLSearchParams();
    params.append("client_id", process.env.GOOGLE_CLIENT_ID);
    params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", process.env.GOOGLE_REDIRECT || "http://localhost:5000/auth/google/callback");

    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = userResponse.data;
    let userResult = await pool.query("SELECT * FROM users WHERE login=$1", [userData.email]);
    if (!userResult.rows.length) {
      userResult = await pool.query(
        "INSERT INTO users (login, password_hash, auth_provider) VALUES ($1, $2, $3) RETURNING id, login",
        [userData.email, "oauth_user", "google"]
      );
    }
    const user = userResult.rows[0];
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}?oauth_success=true&user_id=${user.id}&login=${encodeURIComponent(user.login)}`);
  } catch (err) {
    console.error("google callback error:", err.response?.data || err.message);
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}?error=auth_failed`);
  }
});

// --- старт сервера ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // Запускаем фоновую проверку ссылок
  startBackgroundLinkChecker();
});

// --- API: Статус проверки ссылок ---
// Получение статистики по проверке ссылок
app.get("/links-check-status", async (req, res) => {
  try {
    const totalResult = await pool.query("SELECT COUNT(*)::int as total FROM links");
    const activeResult = await pool.query("SELECT COUNT(*)::int as active FROM links WHERE is_active = true");
    const inactiveResult = await pool.query("SELECT COUNT(*)::int as inactive FROM links WHERE is_active = false");
    const lastCheckResult = await pool.query("SELECT MAX(last_checked) as last_check FROM links");
    
    return res.json({
      success: true,
      stats: {
        total: totalResult.rows[0]?.total || 0,
        active: activeResult.rows[0]?.active || 0,
        inactive: inactiveResult.rows[0]?.inactive || 0,
        lastCheck: lastCheckResult.rows[0]?.last_check || null
      }
    });
  } catch (err) {
    console.error("links-check-status error:", err);
    return res.status(500).json({ success: false, message: "Ошибка получения статуса" });
  }
});

// Ручной запуск проверки (для админа)
app.post("/links-check-run", async (req, res) => {
  try {
    // Запускаем проверку асинхронно
    checkAllLinks().then(() => {
      console.log("Ручная проверка ссылок завершена");
    });
    
    return res.json({ success: true, message: "Проверка ссылок запущена" });
  } catch (err) {
    console.error("links-check-run error:", err);
    return res.status(500).json({ success: false, message: "Ошибка запуска проверки" });
  }
});
