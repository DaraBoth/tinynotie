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
    const sql = `SELECT * FROM user_infm WHERE usernm = $1;`;
    const values = [usernm];
    
    const { rows } = await pool.query(sql, values);
    if (rows.length > 0) {
      const user = rows[0];

      // Compare the hashed password
      const match = await bcrypt.compare(passwd, user.passwd);
      if (match) {
        // Generate JWT token
        const token = jwt.sign({ ...user, _id: user.id }, JWT_SECRET, { expiresIn: "1d" });
        res.send({ status: true, userInfo: user, token, _id: user.id }); res
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

// User registration
router.post("/register", async (req, res) => {
  const { usernm, passwd } = req.body;
  try {
    const sql = `SELECT * FROM user_infm WHERE usernm = $1;`;
    const values = [usernm];
    
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(passwd, 10);

      const sql2 = `INSERT INTO user_infm (usernm, passwd) VALUES ($1, $2) RETURNING id;`;
      const values2 = [usernm, hashedPassword];
      
      const result = await pool.query(sql2, values2);
      const newUserId = result.rows[0].id;

      const { rows } = await pool.query(sql, values); // get user again
      // Generate JWT token upon registration
      const token = jwt.sign({ _id: newUserId, userInfo: rows[0] }, JWT_SECRET, { expiresIn: "1h" });
      res.send({ status: true, message: "Registration successful!", token, _id: newUserId, userInfo: rows[0]});
    } else {
      res.status(409).send({ status: false, message: `Username already exists!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

export default router;
