import pg from "pg";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    const sql = `SELECT id, passwd FROM user_infm WHERE usernm = $1;`;
    const values = [usernm.toLowerCase()];
    
    const { rows } = await pool.query(sql, values);
    if (rows.length > 0) {
      const user = rows[0];

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
  const { usernm, passwd } = req.body;
  try {
    const sql = `SELECT usernm FROM user_infm WHERE usernm = $1;`;
    const values = [usernm.toLowerCase()];
    
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(passwd, 10);

      const sql2 = `INSERT INTO user_infm (usernm, passwd) VALUES ($1, $2) RETURNING id;`;
      const values2 = [usernm.toLowerCase(), hashedPassword];
      
      const result = await pool.query(sql2, values2);
      const newUserId = result.rows[0].id;

      // Generate JWT token upon registration
      const token = jwt.sign({ _id: newUserId, usernm: usernm }, JWT_SECRET, { expiresIn: "1h" });

      res.send({ status: true, message: "Registration successful!", token, _id: newUserId });
    } else {
      res.status(409).send({ status: false, message: `Username already exists!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

export default router;
