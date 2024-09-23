// routes/daraboth.js

import express from "express";
import pg from "pg";
const Pool = pg.Pool;
import { handleError } from "../helpers/errorHandler.js"; // Ensure this helper exists

const router = express.Router();

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20, // Adjust based on your PostgreSQL connection limits
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// ========================
// Rate Limiting Configuration (Using PostgreSQL)
// ========================

// Define rate limit parameters
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 20; // Max submissions
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 3600; // Window in seconds (default 1 hour)

// ========================
// Helper Functions
// ========================

// Sanitize input to prevent XSS
const sanitize = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// ========================
// Testimonial Routes
// ========================

/**
 * @route   POST /testimonials
 * @desc    Submit a new testimonial
 * @access  Public
 */
router.post("/testimonials", async (req, res) => {
  const { name, title, email, message, photo_url, company } = req.body;

  // Basic input validation
  if (!name || !message) {
    return res
      .status(400)
      .json({ status: false, message: "Name and message are required." });
  }

  // Optional: Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid email format." });
    }
  }

  // Optional: Validate photo_url format if provided
  if (photo_url) {
    try {
      new URL(photo_url);
    } catch (_) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid photo URL." });
    }
  }

  // Extract client IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",").shift().trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  try {
    // Rate Limiting: Check number of submissions from this IP within the window
    const rateLimitQuery = `
      SELECT COUNT(*) 
      FROM testimonials_infm 
      WHERE ip_address = $1 
        AND created_at >= NOW() - INTERVAL '${RATE_LIMIT_WINDOW} seconds';
    `;
    const rateLimitResult = await pool.query(rateLimitQuery, [ip]);
    const submissionCount = parseInt(rateLimitResult.rows[0].count, 10);

    if (submissionCount >= RATE_LIMIT_MAX) {
      return res.status(429).json({
        status: false,
        message: `Rate limit exceeded. You can submit up to ${RATE_LIMIT_MAX} testimonials every ${Math.floor(
          RATE_LIMIT_WINDOW / 60
        )} minutes.`,
      });
    }

    // Insert the testimonial into the database and auto-approve
    const insertQuery = `
      INSERT INTO testimonials_infm (name, title, email, message, photo_url, ip_address, company, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      RETURNING id;
    `;
    const values = [
      name,
      title || "",
      email || "",
      message,
      photo_url || "",
      ip,
      company || "",
    ];
    const insertResult = await pool.query(insertQuery, values);

    res.status(201).json({
      status: true,
      message: "Testimonial submitted successfully and is approved.",
      testimonialId: insertResult.rows[0].id,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route   GET /testimonials
 * @desc    Get all approved testimonials
 * @access  Public
 */
router.get("/testimonials", async (req, res) => {
  try {
    const selectQuery = `
      SELECT id, name, title, message, photo_url, created_at 
      FROM testimonials_infm 
      WHERE is_approved = TRUE 
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(selectQuery);

    // Sanitize the data before sending
    const sanitizedData = result.rows.map((testimonial) => ({
      id: testimonial.id,
      name: sanitize(testimonial.name),
      title: sanitize(testimonial.title),
      message: sanitize(testimonial.message),
      photo_url: testimonial.photo_url, // Assuming URLs are safe; sanitize if necessary
      created_at: testimonial.created_at,
    }));

    res.status(200).json({ status: true, data: sanitizedData });
  } catch (error) {
    handleError(error, res);
  }
});

// ========================
// Admin Routes (Protected by Secret Token)
// ========================

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/**
 * @route   PUT /testimonials/:id/approve
 * @desc    Approve a testimonial
 * @access  Admin
 */
router.put("/testimonials/:id/approve", async (req, res) => {
  const { id } = req.params;
  const adminSecret = req.headers["x-admin-secret"];

  if (adminSecret !== ADMIN_SECRET) {
    return res
      .status(403)
      .json({ status: false, message: "Forbidden: Invalid admin secret." });
  }

  try {
    const updateQuery = `
      UPDATE testimonials_infm 
      SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Testimonial not found." });
    }

    res.status(200).json({
      status: true,
      message: "Testimonial approved successfully.",
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route   DELETE /testimonials/:id
 * @desc    Delete a testimonial
 * @access  Admin
 */
router.delete("/testimonials/:id", async (req, res) => {
  const { id } = req.params;
  const adminSecret = req.headers["x-admin-secret"];

  if (adminSecret !== ADMIN_SECRET) {
    return res
      .status(403)
      .json({ status: false, message: "Forbidden: Invalid admin secret." });
  }

  try {
    const deleteQuery = `
      DELETE FROM testimonials_infm 
      WHERE id = $1 
      RETURNING *;
    `;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Testimonial not found." });
    }

    res.status(200).json({
      status: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    handleError(error, res);
  }
});

// ========================
// Track Visitors Routes
// ========================

/**
 * @route   POST /track-visitor
 * @desc    Add a new visitor (no duplicate visitors)
 * @access  Public
 */
router.post("/track-visitor", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",").shift().trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    const userAgent = req.headers["user-agent"] || "Unknown";
    const { visitedRoute } = req.body;

    const checkDuplicateQuery = `
      SELECT * FROM visitors_infm
      WHERE ip_address = $1 AND user_agent = $2 AND visited_route = $3;
    `;
    const duplicateCheck = await pool.query(checkDuplicateQuery, [
      ip,
      userAgent,
      visitedRoute || "Unknown",
    ]);

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        status: false,
        message: "Visitor already tracked.",
      });
    }

    const insertQuery = `
      INSERT INTO visitors_infm (ip_address, user_agent, visited_route)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const values = [ip, userAgent, visitedRoute || "Unknown"];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      status: true,
      message: "Visitor tracked successfully.",
      visitorId: result.rows[0].id,
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route   GET /track-visitor
 * @desc    Get all visitors (with optional filters)
 * @access  Public
 */
router.get("/track-visitor", async (req, res) => {
  const { visitedRoute } = req.query;

  try {
    let query = `
      SELECT count(*) as visitor_count
      FROM visitors_infm
      WHERE 1=1
    `;
    const params = [];

    if (visitedRoute) {
      query += ` AND visited_route = $${params.length + 1} ;`;
      params.push(visitedRoute);
    }

    const result = await pool.query(query, params);

    res.status(200).json({
      status: true,
      data: result.rows,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
