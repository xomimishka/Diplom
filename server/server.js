require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ShortLinks",
  password: "motherlode",
  port: 5432,
});
const QRCode = require("qrcode");

// ======= Пользователи =======
// Регистрация
app.post("/register", async (req, res) => {
  const { login, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (login, password_hash) VALUES ($1, $2) RETURNING id, login",
      [login, hashed]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Ошибка регистрации:", err);
    res.status(200).json({ success: false, message: "Пользователь уже существует" });
  }
});

// Авторизация
app.post("/login", async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE login=$1", [login]);
    if (result.rows.length === 0) {
      return res.status(200).json({ success: false, message: "Пользователь не найден" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(200).json({ success: false, message: "Неверный пароль" });
    }

    res.json({ success: true, user: { id: user.id, login: user.login } });
  } catch (err) {
    console.error("Ошибка входа:", err);
    res.status(200).json({ success: false, message: "Ошибка сервера" });
  }
});

// ======= Утилиты =======
function generateShort() {
  return Math.random().toString(36).substring(2, 8);
}

// Проверка Google Safe Browsing
async function checkUrlGoogle(url) {
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
      body
    );
    return res.data.matches ? true : false;
  } catch (err) {
    console.error("Ошибка Safe Browsing:", err.message);
    return false;
  }
}

// Проверка VirusTotal
async function checkUrlVirusTotal(url) {
  try {
    const res = await axios.post(
      "https://www.virustotal.com/api/v3/urls",
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );

    const urlId = res.data.data.id;
    const analysis = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${urlId}`,
      { headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY } }
    );

    const stats = analysis.data.data.attributes.stats;
    return stats.malicious > 0 || stats.suspicious > 0;
  } catch (err) {
    console.error("Ошибка VirusTotal:", err.message);
    return false;
  }
}

// Общая проверка
async function isUnsafeUrl(url) {
  const googleUnsafe = await checkUrlGoogle(url);
  const vtUnsafe = await checkUrlVirusTotal(url);
  return googleUnsafe || vtUnsafe;
}

// ======= Ссылки =======
app.post("/links", async (req, res) => {
  const { long, userId, type } = req.body;

  if (!long || long.trim() === "") {
    return res.status(200).json({ success: false, message: "URL не может быть пустым" });
  }

  // Проверка существования ссылки
  const exists = await checkUrlExists(long);
  if (!exists) {
    return res.status(200).json({ success: false, message: "Ссылка не существует или недоступна" });
  }

  try {
    // Проверка безопасности
    const unsafe = await isUnsafeUrl(long);
    if (unsafe) {
      await pool.query(
        "INSERT INTO unsafe_links (long) VALUES ($1) ON CONFLICT (long) DO NOTHING",
        [long]
      );
      return res.status(200).json({ success: false, message: "Ссылка признана подозрительной" });
    }

    // ... остальной код без изменений ...


    let link;

    if (type === false) {
      // Приватная
      const short = generateShort();
      const shortUrl = `http://localhost:5000/r/${short}`;
      const qrDataUrl = await QRCode.toDataURL(shortUrl);

      const result = await pool.query(
        "INSERT INTO links (long, short, type, qr) VALUES ($1, $2, $3, $4) RETURNING *",
        [long, short, false, qrDataUrl]
      );
      link = result.rows[0];

      if (userId) {
        await pool.query("INSERT INTO user_links (user_id, link_id) VALUES ($1, $2)", [userId, link.id]);
      }
    } else {
      // Публичная
      const existing = await pool.query("SELECT * FROM links WHERE long=$1 AND type=true", [long]);
      if (existing.rows.length > 0) {
        link = existing.rows[0];
        if (userId) {
          await pool.query(
            "INSERT INTO user_links (user_id, link_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [userId, link.id]
          );
        }
      } else {
        const short = generateShort();
        const shortUrl = `http://localhost:5000/r/${short}`;
        const qrDataUrl = await QRCode.toDataURL(shortUrl);

        const result = await pool.query(
          "INSERT INTO links (long, short, type, qr) VALUES ($1, $2, $3, $4) RETURNING *",
          [long, short, true, qrDataUrl]
        );
        link = result.rows[0];

        if (userId) {
          await pool.query("INSERT INTO user_links (user_id, link_id) VALUES ($1, $2)", [userId, link.id]);
        }
      }
    }

    res.json({ success: true, link });
  } catch (err) {
    console.error("Ошибка добавления ссылки:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Ошибка сервера: " + err.message });
  }
});

// Получить ссылки пользователя (или все, если админ)
app.get("/links/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Проверяем, админ ли это
    const userResult = await pool.query("SELECT login FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    if (user?.login === "admin") {
      // Админ — получает все ссылки
      const result = await pool.query(`
        SELECT l.*, u.login AS owner_login, ul.title, ul.is_favorite
        FROM links l
        LEFT JOIN user_links ul ON ul.link_id = l.id
        LEFT JOIN users u ON ul.user_id = u.id
      `);
      return res.json({ success: true, links: result.rows, admin: true });
    }

    // Обычный пользователь — только свои
    const result = await pool.query(
      `SELECT l.*, ul.title, ul.is_favorite
       FROM links l
       JOIN user_links ul ON ul.link_id = l.id
       WHERE ul.user_id = $1`,
      [userId]
    );
    res.json({ success: true, links: result.rows, admin: false });
  } catch (err) {
    console.error("Ошибка загрузки ссылок:", err);
    res.status(500).json({ success: false, message: "Ошибка загрузки ссылок" });
  }
});

// Удаление ссылки
app.delete("/links/:userId/:linkId", async (req, res) => {
  const { userId, linkId } = req.params;

  try {
    // Проверяем, админ ли это
    const userResult = await pool.query("SELECT login FROM users WHERE id=$1", [userId]);
    const user = userResult.rows[0];

    // Если админ → удалить полностью
    if (user?.login === "admin") {
      await pool.query("DELETE FROM links WHERE id=$1", [linkId]);
      await pool.query("DELETE FROM user_links WHERE link_id=$1", [linkId]);
      return res.json({ success: true, message: "Ссылка удалена администратором" });
    }

    // Если не админ — старая логика
    const result = await pool.query("SELECT * FROM links WHERE id=$1", [linkId]);
    if (result.rows.length === 0) return res.json({ success: false, message: "Ссылка не найдена" });

    const link = result.rows[0];
    if (link.type === false) {
      await pool.query("DELETE FROM links WHERE id=$1", [linkId]);
    } else {
      await pool.query("DELETE FROM user_links WHERE user_id=$1 AND link_id=$2", [userId, linkId]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка удаления ссылки:", err);
    res.status(500).json({ success: false, message: "Ошибка удаления" });
  }
});

// Переход по короткой ссылке
app.get("/r/:short", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM links WHERE short=$1", [req.params.short]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Ссылка не найдена" });
    }

    const link = result.rows[0];

    // обновляем статистику
    await pool.query(
      `INSERT INTO statistics (link_id, counter)
       VALUES ($1, 1)
       ON CONFLICT (link_id) DO UPDATE
       SET counter = statistics.counter + 1`,
      [link.id]
    );

    // редиректим на длинный URL
    res.redirect(link.long);
  } catch (err) {
    console.error("Ошибка перехода:", err);
    res.status(500).json({ success: false, message: "Ошибка перехода" });
  }
});

// Изменение названия ссылки
app.put("/links/:userId/:linkId/title", async (req, res) => {
  const { userId, linkId } = req.params;
  const { title } = req.body;

  try {
    await pool.query(
      `UPDATE user_links SET title=$1 WHERE user_id=$2 AND link_id=$3`,
      [title, userId, linkId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Ошибка обновления названия:", err);
    res.status(500).json({ success: false, message: "Ошибка обновления названия" });
  }
});

// Проверка, существует ли URL
async function checkUrlExists(url) {
  try {
    const response = await axios.head(url, { timeout: 5000, maxRedirects: 3 });
    return response.status >= 200 && response.status < 400;
  } catch (err) {
    try {
      const response = await axios.get(url, { timeout: 5000, maxRedirects: 3 });
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }
}

// Google OAuth callback
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const params = new URLSearchParams();
    params.append("client_id", process.env.GOOGLE_CLIENT_ID);
    params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", "http://localhost:5000/auth/google/callback");

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;
    console.log("Access token получен:", access_token ? "OK" : "нет");

    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const userData = userResponse.data;
    console.log("Google user:", userData);

    let userResult = await pool.query("SELECT * FROM users WHERE login = $1", [userData.email]);
    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        "INSERT INTO users (login, password_hash, auth_provider) VALUES ($1, $2, $3) RETURNING id, login",
        [userData.email, "oauth_user", "google"]
      );
    }

    const user = userResult.rows[0];

    res.redirect(
      `http://localhost:3000?oauth_success=true&user_id=${user.id}&login=${encodeURIComponent(user.login)}`
    );
  } catch (error) {
    console.error("Google OAuth error:", error.response?.data || error.message);
    res.redirect(
      "http://localhost:3000?error=auth_failed&message=" +
        encodeURIComponent(error.message)
    );
  }
});

app.listen(5000, () => {
  console.log("Сервер запущен на http://localhost:5000");
});