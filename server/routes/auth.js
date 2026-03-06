import pg from "pg";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const Pool = pg.Pool;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Secret key for JWT (use a strong secret key in production)
const JWT_SECRET = process.env.JWT_SECRET;

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

export default router;
