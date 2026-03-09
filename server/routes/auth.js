import pg from "pg";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const Pool = pg.Pool;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Secret key for JWT (use a strong secret key in production)
const JWT_SECRET = process.env.JWT_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_NEW || process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_AUTH_MAX_AGE_SECONDS = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 86400);

const timingSafeHexEqual = (left = "", right = "") => {
  const a = Buffer.from(String(left), "hex");
  const b = Buffer.from(String(right), "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const parseTelegramInitData = (initDataRaw = "") => {
  const params = new URLSearchParams(String(initDataRaw || ""));
  const hash = params.get("hash") || "";

  const pairs = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const authDate = Number(params.get("auth_date") || 0);
  let user = null;
  try {
    const userRaw = params.get("user");
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  return { hash, dataCheckString, authDate, user };
};

const verifyTelegramInitData = ({ initDataRaw, botToken }) => {
  if (!initDataRaw || !botToken) return { ok: false, reason: "missing_init_data_or_token" };

  const { hash, dataCheckString, authDate, user } = parseTelegramInitData(initDataRaw);
  if (!hash || !dataCheckString || !authDate || !user?.id) {
    return { ok: false, reason: "invalid_payload" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - authDate) > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    return { ok: false, reason: "expired_auth_date" };
  }

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (!timingSafeHexEqual(calculatedHash, hash)) {
    return { ok: false, reason: "hash_mismatch" };
  }

  return { ok: true, telegramUser: user };
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usernm:
 *                 type: string
 *               passwd:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 usernm:
 *                   type: string
 *                 token:
 *                   type: string
 *                 _id:
 *                   type: integer
 *         headers:
 *           Authorization:
 *             description: Bearer token for authentication
 *             schema:
 *               type: string
 *               example: Bearer <JWT_TOKEN>
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 *     description: |
 *       After logging in, copy the `token` from the response and click the "Authorize" button in the Swagger UI.
 *       Paste the token in the "Value" field as `Bearer <JWT_TOKEN>` to authenticate subsequent requests.
 */
router.post("/login", async (req, res) => {
  const { usernm, passwd } = req.body;
  try {
    const sql = `SELECT id, passwd, telegram_id FROM user_infm WHERE usernm = $1;`;
    const values = [usernm];

    const { rows } = await pool.query(sql, values);
    if (rows.length > 0) {
      const user = rows[0];

      if (!user.telegram_id) {
        return res.status(403).send({
          status: false,
          message: "This account is not linked to Telegram. Please complete registration via TinyNotie Telegram bot.",
        });
      }

      // Compare the hashed password
      const match = await bcrypt.compare(passwd, user.passwd);
      if (match) {
        // Generate JWT token
        const token = jwt.sign({ ...user, _id: user.id }, JWT_SECRET, { expiresIn: "1d" });
        res.send({ status: true, usernm, token, _id: user.id }); res
      } else {
        res.status(401).send({ status: false, message: `Your password is inncorrect!` });
      }
    } else {
      res.status(404).send({ status: false, message: `Your username is not found!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usernm:
 *                 type: string
 *               passwd:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 _id:
 *                   type: integer
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", async (req, res) => {
  return res.status(410).json({
    status: false,
    message: "Web registration is disabled. Please register via TinyNotie Telegram bot using /register.",
  });
});

/**
 * @swagger
 * /auth/telegram-link:
 *   get:
 *     summary: Generate a Telegram linking link
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Link generated successfully
 */
router.get("/telegram-link", authenticateToken, async (req, res) => {
  try {
    const botUsername = process.env.BOT_USER_NAME || 'tinynotie_bot';
    const clean = String(botUsername).replace(/^@/, '');
    const link = `https://t.me/${clean}`;
    res.json({ status: true, link });
  } catch (error) {
    console.error("Telegram link generation error:", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * Telegram Mini App login
 * Verifies Telegram WebApp initData signature and returns JWT for linked users.
 */
router.post("/telegram-miniapp-login", async (req, res) => {
  try {
    const initData = req.body?.initData || "";
    const verification = verifyTelegramInitData({
      initDataRaw: initData,
      botToken: TELEGRAM_BOT_TOKEN,
    });

    if (!verification.ok) {
      return res.status(401).json({
        status: false,
        message: "Invalid Telegram mini app authentication.",
        reason: verification.reason,
      });
    }

    const telegramId = Number(verification.telegramUser.id);
    const { rows } = await pool.query(
      "SELECT id, usernm, telegram_id FROM user_infm WHERE telegram_id = $1 LIMIT 1",
      [telegramId]
    );

    if (rows.length === 0) {
      return res.status(403).json({
        status: false,
        message: "Telegram account is not linked to TinyNotie yet. Please use /register in bot first.",
      });
    }

    const appUser = rows[0];
    const token = jwt.sign({ ...appUser, _id: appUser.id }, JWT_SECRET, { expiresIn: "1d" });

    return res.json({
      status: true,
      token,
      usernm: appUser.usernm,
      _id: appUser.id,
      source: "telegram_miniapp",
    });
  } catch (error) {
    console.error("telegram miniapp login error", error);
    return res.status(500).json({ status: false, error: error.message });
  }
});

export default router;
