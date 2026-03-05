import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { pool, handleError } from "../utils/db.js";
import moment from "moment";
import { getBot, notifyGroup } from "../services/telegramBotService.js";

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

const parseTripMemberIds = (memId) => {
  try {
    if (Array.isArray(memId)) return memId.map((id) => Number(id)).filter(Number.isFinite);
    if (typeof memId === "string") {
      const trimmed = memId.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [];
      }
      return trimmed.split(",").map((id) => Number(id.trim())).filter(Number.isFinite);
    }
    const asNum = Number(memId);
    return Number.isFinite(asNum) ? [asNum] : [];
  } catch {
    return [];
  }
};

const formatAmount = (value) => safeNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * @swagger
 * /groups/getGroupByUserId:
 *   get:
 *     summary: Get groups by user ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of groups
 *       500:
 *         description: Internal server error
 */
router.get("/getGroupByUserId", authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  try {
    const sql = `
      SELECT g.id, g.grp_name, g.status, g.currency, g.admin_id, g.create_date,
             CASE
               WHEN g.admin_id = $1::int THEN TRUE
               ELSE FALSE
             END AS "isAdmin",
             CASE 
               WHEN gu.user_id IS NOT NULL THEN TRUE
               ELSE FALSE
             END AS "isMember"
      FROM grp_infm g
      LEFT JOIN grp_users gu ON g.id = gu.group_id AND gu.user_id = $1::int
      WHERE g.visibility = 'public'
         OR g.admin_id = $1::int
         OR gu.user_id IS NOT NULL
      ORDER BY g.id ASC;
    `;
    const results = await pool.query(sql, [user_id]);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /groups/getGroupListWithDetails:
 *   get:
 *     summary: Get groups with member count and full details
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of groups with member count and details
 *       500:
 *         description: Internal server error
 */
router.get("/getGroupListWithDetails", authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  try {
    const sql = `
      SELECT
        g.id,
        g.grp_name,
        g.status,
        g.currency,
        g.admin_id,
        g.create_date,
        g.description,
        g.visibility,
        CASE
          WHEN g.admin_id = $1::int THEN TRUE
          ELSE FALSE
        END AS "isAdmin",
        CASE
          WHEN gu.user_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS "isMember",
        COUNT(DISTINCT m.id) AS member_count,
        COUNT(DISTINCT t.id) AS trip_count,
        COALESCE((SELECT SUM(tr.spend) FROM trp_infm tr WHERE tr.group_id = g.id), 0) AS total_spend,
        COALESCE((SELECT SUM(mi.paid) FROM member_infm mi WHERE mi.group_id = g.id), 0) AS total_paid
      FROM grp_infm g
      LEFT JOIN grp_users gu ON g.id = gu.group_id AND gu.user_id = $1::int
      LEFT JOIN member_infm m ON m.group_id = g.id
      LEFT JOIN trp_infm t ON t.group_id = g.id
      WHERE g.visibility = 'public'
         OR g.admin_id = $1::int
         OR gu.user_id IS NOT NULL
      GROUP BY g.id, g.grp_name, g.status, g.currency, g.admin_id, g.create_date, g.description, g.visibility, gu.user_id
      ORDER BY g.create_date DESC;
    `;
    const results = await pool.query(sql, [user_id]);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /groups/addGroupByUserId:
 *   post:
 *     summary: Add a group by user ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               grp_name:
 *                 type: string
 *               status:
 *                 type: integer
 *               description:
 *                 type: string
 *               currency:
 *                 type: string
 *               member:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group added successfully
 *       500:
 *         description: Internal server error
 */
router.post("/addGroupByUserId", authenticateToken, async (req, res) => {
  const {
    user_id,
    grp_name,
    status = 1,
    description,
    currency = "W",
    member,
  } = req.body;
  let create_date;
  if (!req.body.create_date) {
    create_date = moment().format("YYYY-MM-DD HH:mm:ss");
  } else {
    create_date = req.body.create_date;
  }
  const newMember = JSON.parse(member);

  const client = await pool.connect(); // Get a connection client

  try {
    await client.query("BEGIN"); // Start a transaction

    // Insert into grp_infm and return the inserted group_id
    const insertGroupQuery = `
      INSERT INTO grp_infm (grp_name, status, description, currency, admin_id, create_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const result = await client.query(insertGroupQuery, [
      grp_name,
      status,
      description,
      currency,
      user_id,
      create_date,
    ]);
    const group_id = result.rows[0].id;

    // Insert each member into member_infm with the returned group_id
    const insertMemberQuery = `
      INSERT INTO member_infm (mem_name, paid, group_id)
      VALUES ($1, $2, $3);
    `;
    for (const mem_name of newMember) {
      await client.query(insertMemberQuery, [mem_name, 0, group_id]);
    }

    await client.query("COMMIT"); // Commit the transaction

    res.send({ status: true, data: { id: group_id } });
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback the transaction on error
    console.error("error", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

/**
 * @swagger
 * /groups/createGroup:
 *   post:
 *     summary: Create a new group (Next.js client endpoint)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grp_name, currency]
 *             properties:
 *               grp_name:
 *                 type: string
 *                 description: Group name
 *               currency:
 *                 type: string
 *                 description: Currency symbol (e.g. $, W, R)
 *               description:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of member names to add
 *     responses:
 *       200:
 *         description: Group created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/createGroup", authenticateToken, async (req, res) => {
  const { _id: user_id } = req.user;
  const { grp_name, currency = "$", description = "", members = [] } = req.body;

  // Validate required fields
  if (!grp_name || !grp_name.trim()) {
    return res.status(400).json({ status: false, error: "Group name is required." });
  }
  if (!currency || !currency.trim()) {
    return res.status(400).json({ status: false, error: "Currency is required." });
  }

  // Always generate create_date server-side to avoid VARCHAR(20) overflow
  const create_date = moment().format("YYYY-MM-DD HH:mm:ss");

  // Parse members: accept either an array or a JSON string (for legacy callers)
  let memberList = [];
  if (Array.isArray(members)) {
    memberList = members.map((m) => String(m).trim()).filter(Boolean);
  } else if (typeof members === "string" && members.trim()) {
    try {
      const parsed = JSON.parse(members);
      memberList = Array.isArray(parsed)
        ? parsed.map((m) => String(m).trim()).filter(Boolean)
        : [];
    } catch {
      // treat as single member name
      memberList = [members.trim()];
    }
  }

  // Remove duplicate names (case-insensitive)
  const seen = new Set();
  memberList = memberList.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create the group
    const insertGroupSql = `
      INSERT INTO grp_infm (grp_name, status, description, currency, admin_id, create_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, grp_name, currency, description, create_date;
    `;
    const groupResult = await client.query(insertGroupSql, [
      grp_name.trim(),
      1,
      description.trim(),
      currency.trim(),
      user_id,
      create_date,
    ]);
    const group = groupResult.rows[0];
    const group_id = group.id;

    // 2. Insert members
    if (memberList.length > 0) {
      const insertMemberSql = `
        INSERT INTO member_infm (mem_name, paid, group_id)
        VALUES ($1, 0, $2);
      `;
      for (const mem_name of memberList) {
        await client.query(insertMemberSql, [mem_name, group_id]);
      }
    }

    await client.query("COMMIT");

    res.json({
      status: true,
      data: {
        id: group_id,
        grp_name: group.grp_name,
        currency: group.currency,
        description: group.description,
        create_date: group.create_date,
        member_count: memberList.length,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createGroup error:", error);
    res.status(500).json({ status: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /groups/updateGroupVisibility:
 *   post:
 *     summary: Update group visibility
 *     tags: [Groups]
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
 *               visibility:
 *                 type: string
 *               allowed_users:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Group visibility updated successfully
 *       500:
 *         description: Internal server error
 */
router.post("/updateGroupVisibility", authenticateToken, async (req, res) => {
  const { group_id, visibility, allowed_users, grp_name, description } = req.body; // allowed_users is an array of user IDs
  const { _id: user_id } = req.user; // Assuming authenticateToken middleware attaches user_id to req.user

  try {
    // First, check if the user is the admin of the group
    const adminCheckSql = `
      SELECT admin_id FROM grp_infm WHERE id = $1::int;
    `;
    const adminCheckResult = await pool.query(adminCheckSql, [group_id]);

    if (adminCheckResult.rows.length === 0) {
      return res.json({ status: false, message: "Group not found." });
    }

    if (adminCheckResult.rows[0].admin_id != user_id) {
      return res.json({
        status: false,
        message: "You are not authorized to update this group.",
      });
    }

    // Update visibility, name, and description together
    const updateSql = `
      UPDATE grp_infm
      SET visibility = $2,
          grp_name   = COALESCE(NULLIF($3, ''), grp_name),
          description = COALESCE($4, description)
      WHERE id = $1::int;
    `;
    await pool.query(updateSql, [group_id, visibility, grp_name || null, description ?? null]);

    // If the group is set to private, update the allowed users
    if (visibility === "private" && Array.isArray(allowed_users)) {
      // Remove all existing entries for the group in grp_users
      const deleteExistingUsersSql = `
        DELETE FROM grp_users WHERE group_id = $1::int;
      `;
      await pool.query(deleteExistingUsersSql, [group_id]);

      // Add new allowed users
      const insertUserSql = `
        INSERT INTO grp_users (group_id, user_id)
        VALUES ($1::int, $2::int);
      `;

      // Use Promise.all to handle multiple inserts asynchronously
      await Promise.all(
        allowed_users.map((userId) =>
          pool.query(insertUserSql, [group_id, userId])
        )
      );
    }

    res.json({
      status: true,
      message: "Group visibility updated successfully.",
    });
  } catch (error) {
    console.error("error", error);
    res.json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /groups/deleteGroupById:
 *   delete:
 *     summary: Delete group by ID
 *     tags: [Groups]
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
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       500:
 *         description: Internal server error
 */

// Delete group by ID
router.delete("/deleteGroupById", authenticateToken, async (req, res) => {
  const { group_id } = req.body;
  const user_id = req.user._id;

  const client = await pool.connect();

  try {
    // Check if the user is the admin and retrieve the group's creation date
    const checkAdminQuery = `
      SELECT admin_id, create_date
      FROM grp_infm
      WHERE id = $1;
    `;
    const checkAdminResult = await client.query(checkAdminQuery, [group_id]);

    if (checkAdminResult.rows.length === 0) {
      return res.json({ status: false, message: "Group not found" });
    }

    const { admin_id, create_date } = checkAdminResult.rows[0];

    if (admin_id !== user_id) {
      return res.json({
        status: false,
        message: "You do not have permission to delete this group",
      });
    }

    // Check if the group is older than 30 minutes or less than a day
    const groupCreationTime = new Date(create_date);
    const currentTime = new Date();
    const timeDifference = currentTime - groupCreationTime;

    if (
      timeDifference > 30 * 60 * 1000 &&
      timeDifference < 24 * 60 * 1000
    ) {
      return res.json({
        status: false,
        message:
          "Group cannot be deleted between 30 minutes and 24 hours of creation",
      });
    }

    await client.query("BEGIN");

    // Delete related trips in the group
    const deleteGroupUserQuery = `
     DELETE FROM grp_users WHERE group_id = $1;
   `;
    await client.query(deleteGroupUserQuery, [group_id]);

    // Delete related trips in the group
    const deleteTripQuery = `
      DELETE FROM trp_infm WHERE group_id = $1;
    `;
    await client.query(deleteTripQuery, [group_id]);

    // Delete the group itself
    const deleteGroupQuery = `
      DELETE FROM grp_infm WHERE id = $1;
    `;
    await client.query(deleteGroupQuery, [group_id]);

    await client.query("COMMIT");

    res.json({ status: true, message: "Group deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("error", error);
    res.json({
      status: false,
      message: "Failed to delete group",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /groups/getGroupDetail:
 *   get:
 *     summary: Get group details
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 *       500:
 *         description: Internal server error
 */

// Get group details
router.get("/getGroupDetail", async (req, res) => {
  const { group_id, user_id } = req.query;

  try {
    let groupCheckSql;
    let params = [group_id]; // Start with group_id as the first parameter

    // Convert user_id to an integer or undefined if it's not provided
    const userIdInt = user_id ? parseInt(user_id, 10) : undefined;

    if (userIdInt) {
      // If user_id is provided and is a valid integer, include it in the query and parameters
      groupCheckSql = `
        SELECT
          g.id,
          g.grp_name,
          g.currency,
          g.visibility,
          CASE
            WHEN g.admin_id = $2 THEN TRUE  -- Check if user is admin
            ELSE FALSE
          END AS "isAdmin",
          CASE
            WHEN g.visibility = 'public' THEN TRUE  -- Public groups are always authorized
            WHEN (g.admin_id = $2 OR gu.user_id IS NOT NULL) THEN TRUE  -- Check if user is admin or in group
            ELSE FALSE
          END AS "isAuthorized"
        FROM grp_infm g
        LEFT JOIN grp_users gu ON g.id = gu.group_id AND gu.user_id = $2
        WHERE g.id = $1;
      `;
      params.push(userIdInt); // Add user_id as the second parameter
    } else {
      // If user_id is not provided, exclude user-specific checks
      groupCheckSql = `
        SELECT
          g.id,
          g.grp_name,
          g.currency,
          g.visibility,
          FALSE AS "isAdmin",  -- No user_id provided, so not admin
          CASE
            WHEN g.visibility = 'public' THEN TRUE  -- Public groups are always authorized
            ELSE FALSE
          END AS "isAuthorized"
        FROM grp_infm g
        WHERE g.id = $1;
      `;
    }

    const groupResult = await pool.query(groupCheckSql, params);

    // If the group exists, respond with the group data
    if (groupResult.rows.length > 0) {
      const groupData = groupResult.rows[0];
      return res.json({
        status: true,
        data: {
          id: groupData.id,
          grp_name: groupData.grp_name,
          currency: groupData.currency,
          visibility: groupData.visibility,
          isAuthorized: groupData.isAuthorized,
          isAdmin: groupData.isAdmin,
        },
      });
    } else {
      // If the group is not found or the user is not authorized, return a custom JSON response
      return res.json({
        status: false,
        message:
          "You are not authorized to view this group or the group does not exist.",
      });
    }
  } catch (error) {
    console.error("error", error);
    res.json({ error: error.message });
  }
});

/**
 * @swagger
 * /groups/addMemberByGroupId:
 *   post:
 *     summary: Add a member to a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mem_name:
 *                 type: string
 *                 description: Name of the member
 *               paid:
 *                 type: number
 *                 description: Amount paid by the member
 *               group_id:
 *                 type: integer
 *                 description: ID of the group
 *     responses:
 *       200:
 *         description: Member added successfully
 *       500:
 *         description: Internal server error
 */
// Add member by group ID
router.post("/addMemberByGroupId", authenticateToken, async (req, res) => {
  const { mem_name, paid, group_id, user_id } = req.body;

  console.log('[AddMember] Request:', { mem_name, paid, group_id, user_id });

  try {
    // Check if the member already exists in the group
    // If user_id is provided, check by user_id (prevents duplicate user accounts)
    // Otherwise, check by mem_name (for manual member creation)
    let checkSql, checkParams;
    if (user_id) {
      checkSql = `SELECT id FROM member_infm WHERE user_id = $1 AND group_id = $2;`;
      checkParams = [user_id, group_id];
    } else {
      checkSql = `SELECT id FROM member_infm WHERE mem_name = $1 AND group_id = $2;`;
      checkParams = [mem_name, group_id];
    }
    
    const checkResult = await pool.query(checkSql, checkParams);
    console.log('[AddMember] Check result:', checkResult.rows);

    if (checkResult.rows.length > 0) {
      const errorMsg = user_id 
        ? `This user is already a member of this group!`
        : `Member ${mem_name} already exists in this group!`;
      console.log('[AddMember] Duplicate found:', errorMsg);
      return res.json({
        status: false,
        message: errorMsg
      });
    }

    // Insert the new member (with optional user_id for linking to user_infm)
    const insertSql = `
      INSERT INTO member_infm (mem_name, paid, group_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const result = await pool.query(insertSql, [mem_name, paid || 0, group_id, user_id || null]);
    console.log('[AddMember] Success:', result.rows[0]);

    res.json({
      status: true,
      message: "Member added successfully",
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error("[AddMember] Error:", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /groups/editMemberByMemberId:
 *   post:
 *     summary: Edit a member's information
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the member to edit
 *               paid:
 *                 type: number
 *                 description: New amount paid by the member
 *               group_id:
 *                 type: integer
 *                 description: ID of the group
 *               type:
 *                 type: string
 *                 description: Type of edit (ADD, REDUCE, UPDATE)
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       500:
 *         description: Internal server error
 */
// Edit member by member ID
router.post("/editMemberByMemberId", authenticateToken, async (req, res) => {
  const { user_id, paid, group_id, type } = req.body;

  try {
    // Fetch the current paid value for the member
    const sql = `SELECT id, paid, mem_name FROM member_infm WHERE id = $1 AND group_id = $2;`;
    const results = await pool.query(sql, [user_id, group_id]);

    if (results.rows.length === 0) {
      return res.json({
        status: false,
        message: "Member not found in this group!"
      });
    }

    const currentPaid = results.rows[0].paid;
    const memberName = results.rows[0].mem_name;
    let newPaid;

    // Determine the new paid value based on the type
    if (type === "ADD") {
      newPaid = currentPaid + paid;
    } else if (type === "REDUCE") {
      newPaid = currentPaid - paid;

      // Ensure the new paid value is not below zero
      if (newPaid < 0) {
        return res.json({
          status: false,
          message: "Cannot reduce paid amount below 0"
        });
      }
    } else if (type === "UPDATE") {
      newPaid = paid;
    } else {
      return res.json({
        status: false,
        message: "Invalid type specified. Use 'ADD', 'REDUCE', or 'UPDATE'."
      });
    }

    // Update the paid value in the database
    const updateSql = `UPDATE member_infm SET paid = $1 WHERE id = $2;`;
    await pool.query(updateSql, [newPaid, user_id]);

    res.json({
      status: true,
      message: `${memberName}'s payment updated successfully!`
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /groups/getAllMember:
 *   get:
 *     summary: Get all members across all groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all members
 *       500:
 *         description: Internal server error
 */
// Get all members
router.get("/getAllMember", authenticateToken, async (_, res) => {
  try {
    const sql = `
      SELECT m.id, m.mem_name, m.paid, m.group_id, g.grp_name
      FROM member_infm m
      JOIN grp_infm g ON m.group_id = g.id
      ORDER BY m.id;
    `;
    const results = await pool.query(sql);

    res.json({
      status: true,
      data: results.rows
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /groups/members/{id}:
 *   delete:
 *     summary: Delete a member by ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete("/members/:id", authenticateToken, async (req, res) => {
  const memberId = req.params.id;

  try {
    // Get member info before deletion for the response message
    const getMemberSql = `SELECT mem_name, group_id FROM member_infm WHERE id = $1;`;
    const memberResult = await pool.query(getMemberSql, [memberId]);

    if (memberResult.rows.length === 0) {
      return res.json({
        status: false,
        message: "Member not found"
      });
    }

    const { mem_name, group_id } = memberResult.rows[0];

    // Delete the member
    const deleteSql = `DELETE FROM member_infm WHERE id = $1;`;
    await pool.query(deleteSql, [memberId]);

    res.json({
      status: true,
      message: `Member ${mem_name} deleted successfully`,
      data: { group_id }
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});


/**
 * @swagger
 * /groups/getMemberByGroupId:
 *   get:
 *     summary: Get members by group ID
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: List of members in the group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.get("/getMemberByGroupId", async (req, res) => {
  const { group_id } = req.query;

  try {
    // Check if the group exists
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
          // Fetch members for the authenticated user
          const sql = `SELECT * FROM member_infm WHERE group_id = $1 ORDER BY id;`;
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
      // If the group is public, fetch members without authentication
      const sql = `SELECT * FROM member_infm WHERE group_id = $1 ORDER BY id;`;
      const results = await pool.query(sql, [group_id]);

      res.send({
        status: true,
        data: results.rows.length > 0 ? results.rows : [],
      });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * @swagger
 * /groups/getGroupVisibility:
 *   get:
 *     summary: Get group visibility settings
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: group_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group visibility settings retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/getGroupVisibility", authenticateToken, async (req, res) => {
  const { group_id } = req.query;
  const { _id: user_id } = req.user;

  try {
    // First, check if the group exists and get its visibility
    const groupCheckSql = `
      SELECT
        g.id,
        g.visibility,
        g.admin_id,
        CASE WHEN g.admin_id = $2 THEN TRUE ELSE FALSE END AS is_admin
      FROM grp_infm g
      WHERE g.id = $1;
    `;
    const groupCheckResult = await pool.query(groupCheckSql, [group_id, user_id]);

    if (groupCheckResult.rows.length === 0) {
      return res.json({
        status: false,
        message: "Group not found"
      });
    }

    const groupData = groupCheckResult.rows[0];

    // Get the list of allowed users if the group is private
    let allowedUsers = [];
    if (groupData.visibility === 'private') {
      const allowedUsersSql = `
        SELECT u.id, u.usernm, u.email, u.profile_url
        FROM user_infm u
        JOIN grp_users gu ON u.id = gu.user_id
        WHERE gu.group_id = $1;
      `;
      const allowedUsersResult = await pool.query(allowedUsersSql, [group_id]);
      allowedUsers = allowedUsersResult.rows;
    }

    res.json({
      status: true,
      data: {
        group_id: groupData.id,
        visibility: groupData.visibility,
        is_admin: groupData.is_admin,
        allowed_users: allowedUsers
      }
    });
  } catch (error) {
    console.error("error", error);
    res.json({ status: false, error: error.message });
  }
});
// AI Chat with group database
router.post("/askDatabase", authenticateToken, async (req, res) => {
  const { groupId, message } = req.body;

  if (!groupId || !message) {
    return res.status(400).json({ status: false, message: "groupId and message are required." });
  }

  try {
    const { runAiAgent } = await import("../services/aiAgentService.js");
    const response = await runAiAgent({
      message,
      groupId,
      history: [],
    });

    res.json({ status: true, response });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ status: false, message: "Failed to get AI response.", error: error.message });
  }
});

// Get Telegram link status for a TinyNotie group + current user
router.get("/getTelegramLinkStatus", authenticateToken, async (req, res) => {
  const { group_id } = req.query;
  const { _id: user_id } = req.user;

  if (!group_id) {
    return res.status(400).json({ status: false, message: "group_id is required." });
  }

  try {
    const accessSql = `
      SELECT g.id, g.telegram_chat_id,
             (g.admin_id = $2 OR EXISTS(
                SELECT 1 FROM grp_users gu WHERE gu.group_id = g.id AND gu.user_id = $2
             )) AS has_access
      FROM grp_infm g
      WHERE g.id = $1
    `;
    const accessRes = await pool.query(accessSql, [group_id, user_id]);

    if (accessRes.rows.length === 0 || !accessRes.rows[0].has_access) {
      return res.status(403).json({ status: false, message: "Forbidden: No access to this group." });
    }

    const userRes = await pool.query(
      "SELECT telegram_id FROM user_infm WHERE id = $1",
      [user_id]
    );

    let linkedChat = null;
    const chatId = accessRes.rows[0].telegram_chat_id;
    if (chatId) {
      const bot = getBot();
      if (bot) {
        try {
          const chat = await bot.telegram.getChat(chatId);
          linkedChat = {
            id: chat.id,
            title: chat.title || chat.username || null,
            type: chat.type,
          };
        } catch {
          linkedChat = { id: chatId, title: null, type: null };
        }
      } else {
        linkedChat = { id: chatId, title: null, type: null };
      }
    }

    return res.json({
      status: true,
      data: {
        personal_chat_linked: !!userRes.rows?.[0]?.telegram_id,
        personal_chat_id: userRes.rows?.[0]?.telegram_id || null,
        group_chat_linked: !!chatId,
        linked_group_chat: linkedChat,
      },
    });
  } catch (error) {
    console.error("getTelegramLinkStatus error:", error);
    return res.status(500).json({ status: false, message: "Server error.", error: error.message });
  }
});

// Link a TinyNotie group with a Telegram group chat ID entered by user
router.post("/linkTelegramGroupChat", authenticateToken, async (req, res) => {
  const { group_id, group_chat_id } = req.body;
  const { _id: user_id } = req.user;

  if (!group_id || group_chat_id === undefined || group_chat_id === null) {
    return res.status(400).json({ status: false, message: "group_id and group_chat_id are required." });
  }

  const parsedChatId = Number(group_chat_id);
  if (!Number.isFinite(parsedChatId)) {
    return res.status(400).json({ status: false, message: "group_chat_id must be a valid number." });
  }

  try {
    const accessSql = `
      SELECT g.id,
             (g.admin_id = $2 OR EXISTS(
                SELECT 1 FROM grp_users gu WHERE gu.group_id = g.id AND gu.user_id = $2
             )) AS has_access
      FROM grp_infm g
      WHERE g.id = $1
    `;
    const accessRes = await pool.query(accessSql, [group_id, user_id]);

    if (accessRes.rows.length === 0 || !accessRes.rows[0].has_access) {
      return res.status(403).json({ status: false, message: "Forbidden: No access to this group." });
    }

    const userRes = await pool.query(
      "SELECT telegram_id FROM user_infm WHERE id = $1",
      [user_id]
    );
    const userTelegramId = Number(userRes.rows?.[0]?.telegram_id);

    if (!Number.isFinite(userTelegramId)) {
      return res.status(400).json({
        status: false,
        message: "Your personal Telegram account is not linked yet. Please link it first from TinyNotie.",
      });
    }

    const bot = getBot();
    if (!bot) {
      return res.status(500).json({ status: false, message: "Telegram bot is not initialized." });
    }

    let chat;
    try {
      chat = await bot.telegram.getChat(parsedChatId);
    } catch {
      return res.status(400).json({
        status: false,
        message: "Bot cannot access this chat ID. Add bot to that group and send /chat_id there first.",
      });
    }

    if (!['group', 'supergroup'].includes(chat.type)) {
      return res.status(400).json({ status: false, message: "Provided chat ID is not a Telegram group chat." });
    }

    try {
      const member = await bot.telegram.getChatMember(parsedChatId, userTelegramId);
      const allowed = ['creator', 'administrator', 'member'];
      if (!allowed.includes(member.status)) {
        return res.status(403).json({
          status: false,
          message: "Your Telegram account is not a member of that group.",
        });
      }
    } catch {
      return res.status(403).json({
        status: false,
        message: "Unable to verify your membership in that Telegram group.",
      });
    }

    await pool.query(
      "UPDATE grp_infm SET telegram_chat_id = $1 WHERE id = $2",
      [parsedChatId, group_id]
    );

    return res.json({
      status: true,
      message: "Telegram group chat linked successfully.",
      data: {
        telegram_chat_id: parsedChatId,
        chat_title: chat.title || null,
        chat_type: chat.type,
      },
    });
  } catch (error) {
    console.error("linkTelegramGroupChat error:", error);
    return res.status(500).json({ status: false, message: "Server error during linking.", error: error.message });
  }
});


// Share member summary to linked Telegram group
router.post("/shareMembersToTelegram", authenticateToken, async (req, res) => {
  const { groupId, group_id, targetType = 'group', member_ids = [] } = req.body;
  const { _id: user_id } = req.user;

  if (!groupId && !group_id) {
    return res.status(400).json({ status: false, message: "groupId is required." });
  }

  const groupid = groupId || group_id;

  try {
    // 1. Double check access
    const accessSql = `
      SELECT g.grp_name, g.currency,
             (g.admin_id = $2 OR EXISTS(SELECT 1 FROM grp_users gu WHERE gu.group_id = g.id AND gu.user_id = $2)) as has_access
      FROM grp_infm g
      WHERE g.id = $1;
    `;
    const accessRes = await pool.query(accessSql, [groupid, user_id]);

    if (accessRes.rows.length === 0 || !accessRes.rows[0].has_access) {
      return res.status(403).json({ status: false, message: "Forbidden: No access to this group." });
    }

    const group = accessRes.rows[0];

    // 2. Resolve sharer name from DB (token may not contain usernm in older tokens)
    const actorRes = await pool.query('SELECT usernm FROM user_infm WHERE id = $1', [user_id]);
    const actorName = safeText(actorRes.rows?.[0]?.usernm, 'Unknown User');

    // 3. Fetch members and trip details
    const selectedMemberIds = Array.isArray(member_ids)
      ? member_ids.map((id) => Number(id)).filter(Number.isFinite)
      : [];

    const membersSql = `
      SELECT m.id, m.mem_name, m.paid
      FROM member_infm m
      WHERE m.group_id = $1
        AND ($2::int[] IS NULL OR array_length($2::int[], 1) IS NULL OR m.id = ANY($2::int[]))
      ORDER BY m.id;
    `;
    const tripsSql = `
      SELECT id, trp_name, spend, mem_id
      FROM trp_infm
      WHERE group_id = $1
      ORDER BY id DESC;
    `;

    const [membersRes, tripsRes] = await Promise.all([
      pool.query(membersSql, [groupid, selectedMemberIds.length > 0 ? selectedMemberIds : null]),
      pool.query(tripsSql, [groupid]),
    ]);

    const members = membersRes.rows;
    const trips = tripsRes.rows;

    if (members.length === 0) {
      return res.json({ status: true, message: "No members to share." });
    }

    // 4. Format message
    const groupName = safeText(group.grp_name, `Group ${groupid}`);
    const currency = safeText(group.currency, '$');
    let message = `📊 *Member Settlement Status: ${groupName}*\n\n`;

    members.forEach((member) => {
      const paid = safeNumber(member.paid);
      const joinedTrips = [];
      let spent = 0;

      trips.forEach((trip) => {
        const participantIds = parseTripMemberIds(trip.mem_id);
        if (participantIds.length === 0) return;
        if (!participantIds.includes(Number(member.id))) return;

        const perMemberCost = safeNumber(trip.spend) / participantIds.length;
        spent += perMemberCost;
        joinedTrips.push({
          name: safeText(trip.trp_name, 'Untitled Expense'),
          cost: perMemberCost,
        });
      });

      const balance = paid - spent;
      const remain = balance > 0 ? balance : 0;
      const unpaid = balance < 0 ? Math.abs(balance) : 0;

      message += `👤 *${safeText(member.mem_name, 'Unknown Member')}*\n`;
      message += `• Paid: ${currency}${formatAmount(paid)}\n`;
      message += `• Spent: ${currency}${formatAmount(spent)}\n`;
      message += `• Remain: ${currency}${formatAmount(remain)}\n`;
      message += `• Unpaid: ${currency}${formatAmount(unpaid)}\n`;

      if (joinedTrips.length > 0) {
        message += `• Joined Trips:\n`;
        joinedTrips.forEach((trip) => {
          message += `   - ${safeText(trip.name)}: ${currency}${formatAmount(trip.cost)}\n`;
        });
      } else {
        message += `• Joined Trips: -\n`;
      }

      message += `\n`;
    });

    message += `👤 Shared by: *${actorName}*\n_Generated via TinyNotie Portal_`;

    // 5. Send to Telegram (group or personal)
    let sent = false;
    if (targetType === 'personal') {
      const userRes = await pool.query('SELECT telegram_id FROM user_infm WHERE id = $1', [user_id]);
      const personalChatId = userRes.rows?.[0]?.telegram_id;
      if (!personalChatId) {
        return res.status(400).json({ status: false, message: 'Your personal Telegram is not linked yet. Link your Telegram account first.' });
      }
      const bot = getBot();
      if (!bot) {
        return res.status(500).json({ status: false, message: 'Telegram bot is not initialized.' });
      }
      try {
        await bot.telegram.sendMessage(personalChatId, message, { parse_mode: 'Markdown' });
        sent = true;
      } catch (err) {
        console.error('shareMembersToTelegram personal send error:', err.message);
      }
    } else {
      sent = await notifyGroup(groupid, message);
    }

    if (sent) {
      res.json({ status: true, message: targetType === 'personal' ? 'Summary sent to your personal Telegram chat!' : 'Summary shared to Telegram group!' });
    } else {
      res.status(400).json({ status: false, message: targetType === 'personal' ? 'Failed to send to your personal Telegram chat.' : 'Failed to share. Is this group linked to an active Telegram chat? Use /chat_id then link by group chat ID in app settings.' });
    }

  } catch (error) {
    console.error("shareMembersToTelegram error:", error);
    res.status(500).json({ status: false, message: "Server error during sharing.", error: error.message });
  }
});

export default router;

