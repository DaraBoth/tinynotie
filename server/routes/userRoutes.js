import express from "express";
import multer from "multer"; // Import multer for file uploads
import path from "path"; // Import path for file handling
import { authenticateToken } from "./middleware/auth.js";
import { pool, handleError } from "../utils/db.js";
import { put } from "@vercel/blob"; // Import the put function from Vercel Blob
import { promisify } from "util";
import dns from "dns";

const dnsLookup = promisify(dns.lookup);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage }); // Initialize multer with memory storage

// Webhook URLs
const WEBHOOK_URL =
  "https://n8n.tonlaysab.com/webhook/142e0e30-4fce-4baa-ac7e-6ead0b16a3a9/chat";
const WEBHOOK_URL_MB =
  "https://n8n.tonlaysab.com/webhook/4a558f06-2c2a-40ef-9a14-43d035c0ba8b/chat";
const MIN_MESSAGE_INTERVAL = 3000;

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
  const allowedFields = [
    "phone_number",
    "email",
    "first_name",
    "last_name",
    "profile_url",
    "device_id",
  ];

  // Filter out any fields that are not in the allowed list
  const updateFields = Object.keys(fields).filter((key) =>
    allowedFields.includes(key)
  );

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ status: false, message: "No valid fields to update." });
  }

  try {
    // Build the SET clause dynamically
    const setClause = updateFields
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");
    const values = updateFields.map((key) => fields[key]);

    const sql = `
      UPDATE user_infm
      SET ${setClause}
      WHERE id = $${values.length + 1};
    `;
    values.push(user_id);

    await pool.query(sql, values);
    res.json({
      status: true,
      message: "User information updated successfully.",
    });
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
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
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
router.post(
  "/uploadImage",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ status: false, message: "Image file is required." });
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
          message:
            "Image is too large. Please upload an image smaller than 50 MB.",
        });
      }

      // Generate a timestamp-based unique filename
      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14); // YYYYMMDDHHMMSS
      const extension = path.extname(originalname); // File extension
      const basename = path.basename(originalname, extension); // Filename without extension
      const uniqueFilename = `${basename}_${timestamp}${extension}`;

      // Define the storage path for the user
      const filePath = `profile/${result.rows[0].usernm}/${uniqueFilename}`;

      let imageUrl = "";

      try {
        // Try to upload the image to Vercel Blob
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const { url } = await put(filePath, buffer, {
            contentType: mimetype,
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          imageUrl = url;
        } else {
          // Fallback: Use a placeholder image URL if Vercel Blob is not configured
          console.warn(
            "BLOB_READ_WRITE_TOKEN not found. Using placeholder image URL."
          );
          imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            result.rows[0].usernm
          )}&background=random&color=fff&size=200`;
        }
      } catch (uploadError) {
        console.error("Error uploading to Vercel Blob:", uploadError);
        // Fallback: Use a placeholder image URL
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          result.rows[0].usernm
        )}&background=random&color=fff&size=200`;
      }

      return res.json({
        status: true,
        message: "Image uploaded successfully.",
        data: { url: imageUrl, uniqueFilename, path: filePath },
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      return res.status(500).json({
        status: false,
        message: "An error occurred while uploading the image.",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/chatMobile:
 *   post:
 *     summary: Chat endpoint for mobile (no stream)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat response
 *       400:
 *         description: Missing userId or message
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/chatMobile", async (req, res) => {
  const { userId, userEmail, message, sessionId, goalId } = req.body;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] ===== NEW REQUEST =====`);
    console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`[${requestId}] Incoming payload:`, JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    console.log(`[${requestId}] Step 1: Validating required fields...`);
    if (!userId || !message) {
      console.log(`[${requestId}] ❌ Validation failed: Missing userId or message`);
      return res.status(400).json({
        status: false,
        message: "userId and message are required.",
      });
    }
    console.log(`[${requestId}] ✓ Validation passed`);

    // Check if user exists in database
    console.log(`[${requestId}] Step 2: Checking user in database...`);
    console.log(`[${requestId}] Query: SELECT id, usernm FROM user_infm WHERE usernm = '${userEmail}'`);
    
    const dbQueryStart = Date.now();
    const userCheckSql = `SELECT id, usernm FROM user_infm WHERE usernm = $1;`;
    const userResult = await pool.query(userCheckSql, [userEmail]);
    const dbQueryDuration = Date.now() - dbQueryStart;
    
    console.log(`[${requestId}] DB query completed in ${dbQueryDuration}ms`);
    console.log(`[${requestId}] User found:`, userResult.rows.length > 0);
    
    if (userResult.rows.length === 0) {
      console.log(`[${requestId}] ❌ User not found in database`);
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }
    console.log(`[${requestId}] ✓ User exists: ${userResult.rows[0].usernm}`);

    // Fire webhook request in background (don't wait for response)
    console.log(`[${requestId}] Step 3: Firing webhook in background...`);
    const finalSessionId = sessionId || `session_${userId}_${Date.now()}`;
    const webhookPayload = {
      action: "sendMessage",
      sessionId: finalSessionId,
      chatInput: message,
      goalId: goalId || null,
      userId: userId,
      mobile: true
    };
    
    console.log(`[${requestId}] Webhook URL: ${WEBHOOK_URL_MB}`);
    
    // Check DNS resolution and IP version
    try {
      const webhookHost = new URL(WEBHOOK_URL_MB).hostname;
      console.log(`[${requestId}] Resolving DNS for: ${webhookHost}`);
      
      // Try IPv4
      try {
        const ipv4Result = await dnsLookup(webhookHost, { family: 4 });
        console.log(`[${requestId}] ✓ IPv4 resolved: ${ipv4Result.address}`);
      } catch (ipv4Error) {
        console.log(`[${requestId}] ❌ IPv4 resolution failed: ${ipv4Error.message}`);
      }
      
      // Try IPv6
      try {
        const ipv6Result = await dnsLookup(webhookHost, { family: 6 });
        console.log(`[${requestId}] ✓ IPv6 resolved: ${ipv6Result.address}`);
      } catch (ipv6Error) {
        console.log(`[${requestId}] ❌ IPv6 resolution failed: ${ipv6Error.message}`);
      }
      
      // Default (system preference)
      const defaultResult = await dnsLookup(webhookHost);
      console.log(`[${requestId}] System default resolved to: ${defaultResult.address} (family: ${defaultResult.family === 4 ? 'IPv4' : 'IPv6'})`);
    } catch (dnsError) {
      console.log(`[${requestId}] DNS lookup error: ${dnsError.message}`);
    }
    
    console.log(`[${requestId}] Webhook payload:`, JSON.stringify(webhookPayload, null, 2));
    console.log(`[${requestId}] Initiating fire-and-forget request at ${new Date().toISOString()}...`);
    
    // Fire the request without awaiting (true background execution)
    fetch(WEBHOOK_URL_MB, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })
    .then(response => {
      console.log(`[${requestId}] 🔥 Background webhook completed with status: ${response.status}`);
    })
    .catch(error => {
      console.error(`[${requestId}] 🔥 Background webhook error:`, error.message);
    });
    
    console.log(`[${requestId}] ✓ Webhook request initiated in background`);
    console.log(`[${requestId}] Sending immediate response to client...`);
    
    // Return immediately without waiting for webhook
    return res.json({
      status: true,
      message: "Request queued for processing.",
      data: {
        userId,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  } catch (err) {
    console.error(`[${requestId}] ❌ FATAL ERROR in chatMobile endpoint`);
    console.error(`[${requestId}] Error type: ${err.name}`);
    console.error(`[${requestId}] Error message: ${err.message}`);
    console.error(`[${requestId}] Error stack:`, err.stack);
    console.error(`[${requestId}] Full error object:`, JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    
    return res.status(500).json({ 
      status: false, 
      error: "Proxy failed", 
      message: err.message,
      requestId
    });
  } finally {
    console.log(`[${requestId}] ===== REQUEST END =====\n`);
  }
});

/**
 * @swagger
 * /api/chatDesktop:
 *   post:
 *     summary: Chat endpoint for desktop (stream)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat stream response
 *       400:
 *         description: Missing userId or message
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post("/chatDesktop", async (req, res) => {
  const { userId, userEmail, message, sessionId, goalId } = req.body;

  try {
    // Set no timeout for this request
    req.setTimeout(0);
    res.setTimeout(0);

    // Validate required fields
    if (!userId || !message) {
      return res.status(400).json({
        status: false,
        message: "userId and message are required.",
      });
    }

    // Check if user exists in database
    const userCheckSql = `SELECT id, usernm FROM user_infm WHERE usernm = $1;`;
    const userResult = await pool.query(userCheckSql, [userEmail]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Set headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering

    // Send initial comment to establish connection
    res.write(": connected\n\n");

    // Set up keep-alive interval to prevent timeout
    const keepAliveInterval = setInterval(() => {
      if (!res.writableEnded) {
        res.write(": keep-alive\n\n");
      }
    }, 15000); // Send keep-alive every 15 seconds

    try {
      // Call the desktop webhook (with stream)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200000); // 20 minutes timeout

      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId: sessionId || `session_${userId}_${Date.now()}`,
          chatInput: message,
          goalId: goalId || null,
          userId: userId,
          mobile: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Stream the response
      const reader = webhookResponse.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!res.writableEnded) {
          res.write(chunk);
        }
      }

      clearInterval(keepAliveInterval);
      res.end();
    } catch (fetchError) {
      clearInterval(keepAliveInterval);
      if (fetchError.name === "AbortError") {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              error: "Request timeout after 20 minutes",
            })}\n\n`
          );
          res.end();
        }
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error("Error in chatDesktop:", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: false,
        error: error.message,
      });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
