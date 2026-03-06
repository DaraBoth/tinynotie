import jwt from "jsonwebtoken";
import { pool } from "../utils/db.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token is missing or invalid." });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const userId = Number(user?._id || user?.id);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    const { rows } = await pool.query(
      "SELECT id FROM user_infm WHERE id = $1 LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Account not found. Please login again." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};
