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

// User login
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
        const token = jwt.sign({ _id: user.id, usernm: usernm }, JWT_SECRET, { expiresIn: "1h" });
        res.send({ status: true, token, usernm, _id: user.id });
      } else {
        res.status(401).send({ status: false, message: "Invalid username or password." });
      }
    } else {
      res.status(404).send({ status: false, message: `Username ${usernm} doesn't exist. Please register instead!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

// User registration
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
      res.status(409).send({ status: false, message: `Username ${usernm} is already taken!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

export default router;
