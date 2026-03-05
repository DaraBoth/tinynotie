import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { pool, handleError, sanitizeIntegerField } from "../utils/db.js";
import moment from "moment";
import { getBot, notifyGroup } from "../services/telegramBotService.js";
import { generateGroupExcelBuffer } from "../utils/excelGenerator.js";

const router = express.Router();

const safeText = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatAmount = (value) => safeNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseTripMemberIds = (memId) => {
  try {
    if (Array.isArray(memId)) return memId.map((id) => Number(id)).filter(Number.isFinite);
    if (typeof memId === 'string') {
      const trimmed = memId.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [];
      }
      return trimmed.split(',').map((id) => Number(id.trim())).filter(Number.isFinite);
    }
    const asNum = Number(memId);
    return Number.isFinite(asNum) ? [asNum] : [];
  } catch {
    return [];
  }
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safeText(value);
  return date.toLocaleString();
};

/**
 * @swagger
 * /trips/addTripByGroupId:
 *   post:
 *     summary: Add a trip by group ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trp_name:
 *                 type: string
 *               spend:
 *                 type: number
 *               mem_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Trip added successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /trips/addMultipleTripsByGroupId:
 *   post:
 *     summary: Add multiple trips by group ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trips:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     trp_name:
 *                       type: string
 *                     spend:
 *                       type: number
 *                     mem_id:
 *                       type: integer
 *                     description:
 *                       type: string
 *                     group_id:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Trips added successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /trips/editTripByGroupId:
 *   post:
 *     summary: Edit trip by group ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trp_name:
 *                 type: string
 *               spend:
 *                 type: number
 *               group_id:
 *                 type: integer
 *               type:
 *                 type: string
 *               update_dttm:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip edited successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /trips/getAllTrip:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all trips
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /trips/getTripByGroupId:
 *   get:
 *     summary: Get trips by group ID
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: List of trips for the group
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /trips/deleteTripById:
 *   delete:
 *     summary: Delete trip by ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trip_id:
 *                 type: integer
 *               group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       500:
 *         description: Internal server error
 */

// Add trip by group ID
router.post("/addTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, mem_id, description, group_id, update_dttm, payer_id = null } = req.body;
  let create_date = req.body?.create_date || moment().format("YYYY-MM-DD HH:mm:ss");

  // Sanitize payer_id: convert empty string to null for integer field
  const sanitizedPayerId = sanitizeIntegerField(payer_id);

  try {
    const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length === 0) {
      const sql2 = `
        INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date, update_dttm, payer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
      await pool.query(sql2, [
        trp_name,
        spend,
        mem_id,
        description,
        group_id,
        create_date,
        update_dttm,
        sanitizedPayerId,
      ]);

      // Notify Telegram Group if linked
      notifyGroup(
        group_id,
        `🆕 *New Expense Added*\n\n*${safeText(trp_name, 'Untitled Expense')}*\n💰 Amount: ${formatAmount(spend)}\n📝 Description: ${safeText(description)}`
      );

      res.send({ status: true, message: "Add trip success!" });
    } else {
      res
        .status(409)
        .json({ status: false, message: `Trip ${trp_name} already exists!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

// Add multiple trips by group ID
router.post("/addMultipleTripsByGroupId", authenticateToken, async (req, res) => {
  const { trips } = req.body; // trips should be an array of trip objects

  // Validate that 'trips' is an array
  if (!Array.isArray(trips) || trips.length === 0) {
    return res.status(400).json({
      status: false,
      message: "Trips must be an array of trip objects.",
    });
  }

  try {
    const insertTripPromises = trips.map(async (trip) => {
      const {
        trp_name,
        spend,
        mem_id,
        description,
        group_id,
        create_date,
        update_dttm,
        payer_id = null,
      } = trip;
      const createDate = create_date || moment().format("YYYY-MM-DD HH:mm:ss");

      // Sanitize payer_id: convert empty string to null for integer field
      const sanitizedPayerId = sanitizeIntegerField(payer_id);

      // Check if the trip already exists
      const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
      const results = await pool.query(sql, [group_id, trp_name]);

      if (results.rows.length === 0) {
        // If the trip doesn't exist, insert a new one
        const sql2 = `
        INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date, update_dttm, payer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
        await pool.query(sql2, [
          trp_name,
          spend,
          mem_id,
          description,
          group_id,
          createDate,
          update_dttm,
          sanitizedPayerId,
        ]);
        return {
          status: true,
          trp_name,
          message: `Trip ${trp_name} added successfully.`,
        };
      } else {
        return { status: false, message: `Trip ${trp_name} already exists!` };
      }
    });

    // Execute all the insert queries in parallel
    const results = await Promise.all(insertTripPromises);

    // Notify Telegram if any trips were added successfully
    const successTrips = results.filter(r => r.status);
    if (successTrips.length > 0) {
      const groupId = trips[0].group_id; // Assuming all trips belong to the same group
      const tripList = successTrips.map(r => `• *${safeText(r.trp_name, 'Untitled Expense')}*`).join('\n');
      notifyGroup(groupId, `🆕 *${successTrips.length} New Expenses Added*\n\n${tripList}`);
    }

    res.send({ status: true, results });
  } catch (error) {
    console.error("Error adding multiple trips:", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit trip by group ID
router.post("/editTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, group_id, type, update_dttm, payer_id } = req.body;

  // Sanitize payer_id: convert empty string to null for integer field
  const sanitizedPayerId = sanitizeIntegerField(payer_id);

  try {
    // Fetch the current spend value for the trip
    const sql = `SELECT id, spend FROM trp_infm WHERE group_id = $1 AND trp_name = $2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length === 0) {
      return res.json({
        status: false,
        message: `Trip ${trp_name} not found!`,
      });
    }

    const currentSpend = results.rows[0].spend;
    let newSpend;

    // Determine the new spend value based on the type
    if (type === "ADD") {
      newSpend = currentSpend + spend;
    } else if (type === "REDUCE") {
      newSpend = currentSpend - spend;

      // Ensure the new spend value is not below zero
      if (newSpend < 0) {
        return res.json({
          status: false,
          message: "Cannot reduce spend below 0",
        });
      }
    } else if (type === "UPDATE") {
      newSpend = spend;
    } else {
      return res.json({
        status: false,
        message: "Invalid type specified. Use 'ADD' or 'REDUCE'.",
      });
    }

    // Update the spend value and payer_id in the database
    const sql2 = `UPDATE trp_infm SET spend = $1, update_dttm = $2, payer_id = $3 WHERE id = $4;`;
    await pool.query(sql2, [newSpend, update_dttm, sanitizedPayerId, results.rows[0].id]);

    res.send({ status: true, message: `Edit ${trp_name} success!` });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while updating the trip",
      error: error.message,
    });
  }
});

// Get all trips
router.get("/getAllTrip", authenticateToken, async (_, res) => {
  try {
    const sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date, payer_id FROM trp_infm;`;
    const results = await pool.query(sql);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    handleError(error, res);
  }
});

// Get trips by group ID
router.get("/getTripByGroupId", async (req, res) => {
  const { group_id } = req.query;

  try {
    // Check if the group is public
    const groupCheckSql = `SELECT visibility FROM grp_infm WHERE id = $1;`;
    const groupCheckResult = await pool.query(groupCheckSql, [group_id]);

    if (groupCheckResult.rows.length === 0) {
      // Group not found
      return res
        .status(404)
        .send({ status: false, message: "Group not found" });
    }

    const { visibility } = groupCheckResult.rows[0];

    if (visibility === "private") {
      // If the group is private, authenticate the user
      authenticateToken(req, res, async () => {
        try {
          // Fetch trips for the authenticated user
          const sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date, update_dttm, payer_id FROM trp_infm WHERE group_id = $1 ORDER BY id;`;
          const results = await pool.query(sql, [group_id]);

          res.send({
            status: true,
            data: results.rows.length > 0 ? results.rows : [],
          });
        } catch (error) {
          handleError(error, res);
        }
      });
    } else {
      // If the group is public, fetch trips without authentication
      const sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date, update_dttm, payer_id FROM trp_infm WHERE group_id = $1 ORDER BY id;`;
      const results = await pool.query(sql, [group_id]);

      res.send({
        status: true,
        data: results.rows.length > 0 ? results.rows : [],
      });
    }
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /trips/editTripMem:
 *   post:
 *     summary: Edit trip members and payer
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trp_id:
 *                 type: integer
 *                 description: ID of the trip to edit
 *               group_id:
 *                 type: integer
 *                 description: ID of the group the trip belongs to
 *               trp_name:
 *                 type: string
 *                 description: Name of the trip (for response message)
 *               mem_id:
 *                 type: string
 *                 description: JSON string of member IDs
 *               payer_id:
 *                 type: string
 *                 description: ID of the member who paid for the trip
 *     responses:
 *       200:
 *         description: Trip members updated successfully
 *       500:
 *         description: Internal server error
 */
// Edit trip members
router.post("/editTripMem", authenticateToken, async (req, res) => {
  const { trp_id, group_id, trp_name, mem_id, payer_id } = req.body;

  try {
    // Check if the trip exists
    const checkTripSql = `SELECT id FROM trp_infm WHERE id = $1 AND group_id = $2;`;
    const checkTripResult = await pool.query(checkTripSql, [trp_id, group_id]);

    if (checkTripResult.rows.length === 0) {
      return res.json({
        status: false,
        message: `Trip with ID ${trp_id} not found in group ${group_id}!`,
      });
    }

    // Update the trip's members and payer
    const updateSql = `UPDATE trp_infm SET mem_id = $1, update_dttm = $2, payer_id = $3 WHERE id = $4;`;
    await pool.query(updateSql, [mem_id, moment().format("YYYY-MM-DD HH:mm:ss"), payer_id || null, trp_id]);

    res.send({
      status: true,
      message: `Members for trip "${trp_name}" updated successfully!`
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while updating trip members",
      error: error.message,
    });
  }
});

// Delete trip by ID
router.delete("/deleteTripById", authenticateToken, async (req, res) => {
  const { trip_id, group_id } = req.body;
  const user_id = req.user._id; // Assuming authenticateToken middleware attaches user_id to req.user

  const client = await pool.connect();

  try {
    // Check if the user is the admin of the group
    const checkAdminQuery = `
      SELECT admin_id
      FROM grp_infm
      WHERE id = $1;
    `;
    const checkAdminResult = await client.query(checkAdminQuery, [group_id]);

    if (checkAdminResult.rows.length === 0) {
      return res.json({ status: false, message: "Group not found" });
    }

    const { admin_id } = checkAdminResult.rows[0];

    if (admin_id !== user_id) {
      return res.json({
        status: false,
        message: "You do not have permission to delete trips from this group",
      });
    }

    await client.query("BEGIN");

    // Delete the trip itself
    const deleteTripQuery = `
      DELETE FROM trp_infm WHERE id = $1 AND group_id = $2;
    `;
    const deleteTripResult = await client.query(deleteTripQuery, [
      trip_id,
      group_id,
    ]);

    if (deleteTripResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.json({
        status: false,
        message: "Trip not found in the specified group",
      });
    }

    await client.query("COMMIT");
    res.json({ status: true, message: "Trip deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("error", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete trip",
      error: error.message,
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * @swagger
 * /trips/shareMembersToTelegram:
 *   post:
 *     summary: Share member contribution summary to linked Telegram group
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group_id:
 *                 type: integer
 */
router.post("/shareMembersToTelegram", authenticateToken, async (req, res) => {
  const { group_id, targetType = 'group' } = req.body;
  const userId = req.user._id;

  try {
    const actorRes = await pool.query("SELECT usernm FROM user_infm WHERE id = $1", [userId]);
    const username = safeText(actorRes.rows?.[0]?.usernm, req.user.usernm || 'Unknown User');

    // Get group info
    const groupResult = await pool.query("SELECT grp_name, currency FROM grp_infm WHERE id = $1", [group_id]);
    if (groupResult.rows.length === 0) return res.status(404).json({ status: false, message: "Group not found" });
    const { grp_name, currency } = groupResult.rows[0];

    // Get members and trips to calculate
    const membersResult = await pool.query("SELECT id, mem_name, paid FROM member_infm WHERE group_id = $1", [group_id]);
    const tripsResult = await pool.query("SELECT spend, mem_id FROM trp_infm WHERE group_id = $1", [group_id]);

    const members = membersResult.rows;
    const trips = tripsResult.rows;

    // Basic summary calculation
    let summary = `📊 *Member Contributions: ${grp_name}*\n\n`;

    members.forEach(m => {
      let spent = 0;
      trips.forEach(t => {
        let participants = [];
        try {
          if (typeof t.mem_id === 'string') {
            if (t.mem_id.startsWith('[')) {
              participants = JSON.parse(t.mem_id);
            } else {
              participants = t.mem_id.split(',').map(id => id.trim());
            }
          } else if (Array.isArray(t.mem_id)) {
            participants = t.mem_id;
          } else if (t.mem_id) {
            participants = [String(t.mem_id)];
          }
        } catch (e) {
          participants = [];
        }

        if (participants.includes(String(m.id))) {
          spent += t.spend / (participants.length || 1);
        }
      });
      const paid = safeNumber(m.paid);
      const balance = paid - spent;
      summary += `👤 *${safeText(m.mem_name, 'Unknown Member')}*\n   Paid: ${currency}${formatAmount(paid)}\n   Spent: ${currency}${formatAmount(spent)}\n   Balance: ${balance >= 0 ? '✅' : '🔴'} ${currency}${formatAmount(balance)}\n\n`;
    });

    summary += `👤 Shared by: *${safeText(username, 'Unknown User')}*`;

    let success = false;
    if (targetType === 'personal') {
      const userRes = await pool.query("SELECT telegram_id FROM user_infm WHERE id = $1", [userId]);
      const chatId = userRes.rows?.[0]?.telegram_id;
      if (!chatId) {
        return res.send({ status: false, message: "Your personal Telegram is not linked yet." });
      }
      const bot = getBot();
      if (!bot) {
        return res.status(500).json({ status: false, message: "Telegram bot is not initialized." });
      }
      try {
        await bot.telegram.sendMessage(chatId, summary, { parse_mode: 'Markdown' });
        success = true;
      } catch {
        success = false;
      }
    } else {
      success = await notifyGroup(group_id, summary);
    }

    if (success) {
      res.send({ status: true, message: targetType === 'personal' ? "Member summary sent to your personal Telegram!" : "Member summary shared to Telegram!" });
    } else {
      res.send({ status: false, message: targetType === 'personal' ? "Failed to send to your personal Telegram." : "Failed to share. Is the Telegram group linked?" });
    }
  } catch (error) {
    console.error("Share members error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /trips/shareTripToTelegram:
 *   post:
 *     summary: Share trip details to linked Telegram group
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trip_id:
 *                 type: integer
 *               group_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Trip shared successfully
 */
router.post("/shareTripToTelegram", authenticateToken, async (req, res) => {
  const { trip_id, trip_ids = [], group_id, targetType = 'group' } = req.body;
  const userId = req.user._id;

  try {
    const actorRes = await pool.query("SELECT usernm FROM user_infm WHERE id = $1", [userId]);
    const username = safeText(actorRes.rows?.[0]?.usernm, req.user.usernm || 'Unknown User');

    const normalizedTripIds = [
      ...(Array.isArray(trip_ids) ? trip_ids : []),
      ...(trip_id ? [trip_id] : []),
    ]
      .map((id) => Number(id))
      .filter(Number.isFinite);

    if (normalizedTripIds.length === 0) {
      return res.status(400).json({ status: false, message: "trip_id or trip_ids is required" });
    }

    const [groupRes, membersRes] = await Promise.all([
      pool.query("SELECT grp_name, currency FROM grp_infm WHERE id = $1", [group_id]),
      pool.query("SELECT id, mem_name FROM member_infm WHERE group_id = $1", [group_id]),
    ]);

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Group not found" });
    }

    const groupName = safeText(groupRes.rows[0].grp_name, `Group ${group_id}`);
    const currency = safeText(groupRes.rows[0].currency, '$');
    const memberMap = new Map(membersRes.rows.map((m) => [Number(m.id), safeText(m.mem_name, `Member ${m.id}`)]));

    const tripSql = `
      SELECT id, trp_name, spend, description, mem_id, payer_id, create_date, update_dttm
      FROM trp_infm
      WHERE group_id = $1
        AND id = ANY($2::int[])
      ORDER BY id DESC;
    `;
    const tripResult = await pool.query(tripSql, [group_id, normalizedTripIds]);

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Trip not found" });
    }

    const tripLines = tripResult.rows.map((trip, index) => {
      const participantIds = parseTripMemberIds(trip.mem_id);
      const participantNames = participantIds
        .map((id) => memberMap.get(Number(id)) || `Member ${id}`)
        .filter(Boolean);
      const participantCount = participantNames.length;
      const perPerson = participantCount > 0 ? safeNumber(trip.spend) / participantCount : safeNumber(trip.spend);
      const payerName = trip.payer_id ? (memberMap.get(Number(trip.payer_id)) || `Member ${trip.payer_id}`) : 'N/A';

      const lines = [
        `*${index + 1}. ${safeText(trip.trp_name, 'Untitled Expense')}*`,
        `💵 Total: ${currency}${formatAmount(trip.spend)}`,
        `👤 Paid by: ${safeText(payerName, 'N/A')}`,
        `👥 Participants (${participantCount || 0}): ${participantCount > 0 ? participantNames.join(', ') : 'N/A'}`,
        `🧮 Per person: ${currency}${formatAmount(perPerson)}`,
        `📝 Description: ${safeText(trip.description)}`,
        `🕒 Updated: ${formatDateTime(trip.update_dttm || trip.create_date)}`,
      ];

      return lines.join('\n');
    });

    const message = [
      tripResult.rows.length === 1
        ? `📢 *Trip Detail Shared: ${safeText(groupName)}*`
        : `📢 *${tripResult.rows.length} Trip Details Shared: ${safeText(groupName)}*`,
      '',
      ...tripLines,
      '',
      `👤 Shared by: *${safeText(username, 'Unknown User')}*`,
      `_Generated via TinyNotie Portal_`,
    ].join('\n');

    let success = false;
    if (targetType === 'personal') {
      const userRes = await pool.query("SELECT telegram_id FROM user_infm WHERE id = $1", [userId]);
      const chatId = userRes.rows?.[0]?.telegram_id;
      if (!chatId) {
        return res.send({ status: false, message: "Your personal Telegram is not linked yet." });
      }
      const bot = getBot();
      if (!bot) {
        return res.status(500).json({ status: false, message: "Telegram bot is not initialized." });
      }
      try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        success = true;
      } catch {
        success = false;
      }
    } else {
      success = await notifyGroup(group_id, message);
    }

    if (success) {
      res.send({ status: true, message: targetType === 'personal' ? "Shared to your personal Telegram!" : "Shared to Telegram!" });
    } else {
      res.send({ status: false, message: targetType === 'personal' ? "Failed to share to personal Telegram." : "Failed to share. Is the Telegram group linked?" });
    }
  } catch (error) {
    console.error("Share to Telegram error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/downloadGroupExcelReport", authenticateToken, async (req, res) => {
  const { group_id } = req.query;
  const userId = req.user._id;

  if (!group_id) {
    return res.status(400).json({ status: false, message: "group_id is required." });
  }

  try {
    const accessSql = `
      SELECT g.id, g.grp_name,
             (g.admin_id = $2 OR EXISTS(
               SELECT 1 FROM grp_users gu WHERE gu.group_id = g.id AND gu.user_id = $2
             )) AS has_access
      FROM grp_infm g
      WHERE g.id = $1
    `;
    const accessRes = await pool.query(accessSql, [group_id, userId]);

    if (accessRes.rows.length === 0 || !accessRes.rows[0].has_access) {
      return res.status(403).json({ status: false, message: "Forbidden: No access to this group." });
    }

    const buffer = await generateGroupExcelBuffer(group_id);
    const groupName = safeText(accessRes.rows[0].grp_name, `Group_${group_id}`);
    const fileName = `${groupName.replace(/\s+/g, "_")}_Report.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    console.error("downloadGroupExcelReport error:", error);
    return res.status(500).json({ status: false, message: "Failed to generate report." });
  }
});

export default router;