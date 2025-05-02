import express from "express";
import multer from "multer"; // Import multer for file uploads
import path from "path"; // Import path for file handling
import { authenticateToken } from "./middleware/auth.js";
import { pool, handleError } from "../utils/db.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage }); // Initialize multer with memory storage

/** 
 * @swagger
 * /api/listUsers:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       usernm:
 *                         type: string
 *                       email:
 *                         type: string
 *                       profile_url:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get("/listUsers", authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT id, usernm, email, profile_url 
      FROM user_infm
      ORDER BY usernm ASC;
    `;
    const results = await pool.query(sql);
    res.json({ status: true, data: results.rows });
  } catch (error) {
    console.error("error", error);
    res.json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/userSearch:
 *   get:
 *     summary: Search users by specific fields
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filterBy
 *         schema:
 *           type: string
 *         description: Field to filter by (ID, NAME, EMAIL, PHONE, PROFILE, ALL)
 *       - in: query
 *         name: searchWords
 *         schema:
 *           type: string
 *         description: Search keywords
 *       - in: query
 *         name: excludeIds
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: IDs to exclude from the search
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       usernm:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone_number:
 *                         type: string
 *                       profile_url:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get("/userSearch", authenticateToken, async (req, res) => {
  const { filterBy, searchWords, excludeIds } = req.query;
  const { _id: user_id } = req.user; // Assuming authenticateToken middleware attaches user_id to req.user

  try {
    // Map filterBy to the actual database columns
    const filterMap = {
      ID: "id",
      NAME: "usernm",
      EMAIL: "email",
      PHONE: "phone_number",
      PROFILE: "profile_url",
      ALL: "ALL",
    };

    // Validate the filterBy parameter
    const filterColumn = filterMap[filterBy?.toUpperCase()];
    if (!filterColumn) {
      return res.json({
        status: false,
        message:
          "Invalid filterBy value. Allowed values are: ID, NAME, EMAIL, PHONE, PROFILE, ALL.",
      });
    }

    // Start building the SQL query
    let sql = `
      SELECT id, usernm, email, phone_number, profile_url 
      FROM user_infm
      WHERE id != $1  -- Exclude the searcher
    `;

    // Apply exclusion logic if excludeIds are provided
    let values = [user_id]; // Start with the searcher's ID for exclusion
    if (excludeIds) {
      const excludedIdsArray = Array.isArray(excludeIds)
        ? excludeIds
        : [excludeIds];
      sql += ` AND id NOT IN (${excludedIdsArray
        .map((_, idx) => `$${idx + 2}`)
        .join(", ")})`;
      values = values.concat(excludedIdsArray);
    }

    // Apply filtering based on filterBy value
    if (filterColumn === "ALL") {
      let searchConditions = [];

      // Loop through filterMap to dynamically add search conditions
      for (let key in filterMap) {
        if (key !== "ALL") {
          if (filterMap[key] === "id") {
            searchConditions.push(
              `CAST(${filterMap[key]} AS TEXT) ILIKE '%' || $${
                values.length + 1
              } || '%'`
            );
          } else {
            searchConditions.push(
              `${filterMap[key]} ILIKE '%' || $${values.length + 1} || '%'`
            );
          }
        }
      }

      sql += ` AND (${searchConditions.join(" OR ")})`;
    } else {
      sql += ` AND ${filterColumn} ILIKE '%' || $${values.length + 1} || '%'`;
    }

    sql += " ORDER BY usernm ASC"; // Optionally order by username

    // Add the searchWords parameter to values
    values.push(searchWords);

    // Execute the query with the searchWords and excluded IDs (if any)
    const results = await pool.query(sql, values);

    res.json({ status: true, data: results.rows });
  } catch (error) {
    console.error("error", error);
    res.json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/updateUserInfo:
 *   put:
 *     summary: Update user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               profile_url:
 *                 type: string
 *               device_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: User information updated successfully
 *       400:
 *         description: No valid fields to update
 *       500:
 *         description: Internal server error
 */
router.put("/updateUserInfo", authenticateToken, async (req, res) => {
  const { _id: user_id } = req.user; // Assuming authenticateToken middleware attaches user_id to req.user
  const fields = req.body;

  // Whitelist of allowed fields to update
  const allowedFields = ["phone_number", "email", "first_name", "last_name","profile_url", "device_id"];

  // Filter out any fields that are not in the allowed list
  const updateFields = Object.keys(fields).filter(key => allowedFields.includes(key));

  if (updateFields.length === 0) {
    return res.status(400).json({ status: false, message: "No valid fields to update." });
  }

  try {
    // Build the SET clause dynamically
    const setClause = updateFields.map((key, index) => `${key} = $${index + 1}`).join(", ");
    const values = updateFields.map(key => fields[key]);

    const sql = `
      UPDATE user_infm
      SET ${setClause}
      WHERE id = $${values.length + 1};
    `;
    values.push(user_id);

    await pool.query(sql, values);
    res.json({ status: true, message: "User information updated successfully." });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/getUserProfile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     phone_number:
 *                       type: string
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     usernm:
 *                       type: string
 *                     profile_url:
 *                       type: string
 *                     device_id:
 *                       type: string
 *                     telegram_chat_id:
 *                       type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/getUserProfile", authenticateToken, async (req, res) => {
  const { _id: user_id } = req.user; // Assuming authenticateToken middleware attaches user_id to req.user

  try {
    const sql = `
      SELECT phone_number, email, first_name, last_name, usernm, profile_url, device_id, telegram_chat_id
      FROM user_infm
      WHERE id = $1;
    `;
    const result = await pool.query(sql, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: false, message: "User not found." });
    }

    res.json({ status: true, data: result.rows[0] });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/uploadImage:
 *   post:
 *     summary: Upload user profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Image file is required
 *       413:
 *         description: Image is too large
 *       500:
 *         description: Internal server error
 */
router.post("/uploadImage", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: "Image file is required." });
    }

    const { originalname, mimetype, buffer } = req.file;
    const { _id: user_id } = req.user;
    const sql = `
      SELECT phone_number, email, first_name, last_name, usernm, profile_url, device_id, telegram_chat_id
      FROM user_infm
      WHERE id = $1;
    `;
    const result = await pool.query(sql, [user_id]);

    // Ensure file size is within limits (50MB)
    const imageSizeInMB = buffer.length / (1024 * 1024);
    if (imageSizeInMB > 50) {
      return res.status(413).json({
        status: false,
        message: "Image is too large. Please upload an image smaller than 50 MB.",
      });
    }

    // Generate a timestamp-based unique filename
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14); // YYYYMMDDHHMMSS
    const extension = path.extname(originalname); // File extension
    const basename = path.basename(originalname, extension); // Filename without extension
    const uniqueFilename = `${basename}_${timestamp}${extension}`;

    // Define the storage path for the user
    const filePath = `profile/${result.rows[0].usernm}/${uniqueFilename}`;

    // Upload the image to Vercel Blob
    const { url } = await put(filePath, buffer, {
      contentType: mimetype,
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.json({
      status: true,
      message: "Image uploaded successfully.",
      data: { url, uniqueFilename, path: filePath },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while uploading the image.",
      error: error.message,
    });
  }
});

export default router;