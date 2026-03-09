import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { pool, handleError } from "../utils/db.js";
import moment from "moment";
import { getBot, notifyGroup } from "../services/telegramBotService.js";
import { buildGroupReportData } from "../utils/groupReportData.js";

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

const getGroupAccess = async (groupId, userId) => {
  const parsedGroupId = Number(groupId);
  const parsedUserId = Number(userId);

  if (!Number.isFinite(parsedGroupId) || !Number.isFinite(parsedUserId)) {
    return null;
  }

  const sql = `
    SELECT
      g.id,
      g.visibility,
      g.admin_id,
      (g.admin_id = $2::int) AS is_admin,
      COALESCE(gu.can_edit, FALSE) AS can_edit,
      (gu.user_id IS NOT NULL) AS is_member,
      CASE
        WHEN g.visibility = 'public' THEN TRUE
        WHEN g.admin_id = $2::int THEN TRUE
        WHEN gu.user_id IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS has_access
    FROM grp_infm g
    LEFT JOIN grp_users gu ON gu.group_id = g.id AND gu.user_id = $2::int
    WHERE g.id = $1::int
    LIMIT 1;
  `;

  const result = await pool.query(sql, [parsedGroupId, parsedUserId]);
  return result.rows[0] || null;
};

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
  const user_id = req.user._id;
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
  const user_id = req.user._id;
  try {
    const sql = `
      WITH accessible_groups AS (
        SELECT
          g.id,
          g.grp_name,
          g.status,
          g.currency,
          g.admin_id,
          g.create_date,
          g.description,
          g.visibility,
          (g.admin_id = $1::int) AS "isAdmin",
          EXISTS (
            SELECT 1
            FROM grp_users gu
            WHERE gu.group_id = g.id AND gu.user_id = $1::int
          ) AS "isMember"
        FROM grp_infm g
        WHERE g.visibility = 'public'
           OR g.admin_id = $1::int
           OR EXISTS (
             SELECT 1
             FROM grp_users gu
             WHERE gu.group_id = g.id AND gu.user_id = $1::int
           )
      ),
      member_stats AS (
        SELECT group_id, COUNT(*)::int AS member_count, COALESCE(SUM(paid), 0) AS total_paid
        FROM member_infm
        GROUP BY group_id
      ),
      trip_stats AS (
        SELECT group_id, COUNT(*)::int AS trip_count, COALESCE(SUM(spend), 0) AS total_spend
        FROM trp_infm
        GROUP BY group_id
      )
      SELECT
        ag.id,
        ag.grp_name,
        ag.status,
        ag.currency,
        ag.admin_id,
        ag.create_date,
        ag.description,
        ag.visibility,
        ag."isAdmin",
        ag."isMember",
        COALESCE(ms.member_count, 0) AS member_count,
        COALESCE(ts.trip_count, 0) AS trip_count,
        COALESCE(ts.total_spend, 0) AS total_spend,
        COALESCE(ms.total_paid, 0) AS total_paid
      FROM accessible_groups ag
      LEFT JOIN member_stats ms ON ms.group_id = ag.id
      LEFT JOIN trip_stats ts ON ts.group_id = ag.id
      ORDER BY ag.create_date DESC;
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
        INSERT INTO grp_users (group_id, user_id, can_edit)
        VALUES ($1::int, $2::int, TRUE);
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
router.get("/getGroupDetail", authenticateToken, async (req, res) => {
  const { group_id } = req.query;
  const { _id: user_id } = req.user;

  try {
    const groupDataSql = `
      SELECT id, grp_name, currency, visibility
      FROM grp_infm
      WHERE id = $1
      LIMIT 1;
    `;
    const groupResult = await pool.query(groupDataSql, [group_id]);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }

    const access = await getGroupAccess(group_id, user_id);
    if (!access?.has_access) {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to view this group.",
      });
    }

    const groupData = groupResult.rows[0];
    return res.json({
      status: true,
      data: {
        id: groupData.id,
        grp_name: groupData.grp_name,
        currency: groupData.currency,
        visibility: groupData.visibility,
        isAuthorized: true,
        isAdmin: !!access.is_admin,
        isMember: !!access.is_member,
        canEdit: !!(access.is_admin || access.can_edit || access.is_member),
      },
    });
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
  const actorId = req.user._id;

  console.log('[AddMember] Request:', { mem_name, paid, group_id, user_id });

  try {
    const access = await getGroupAccess(group_id, actorId);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!(access.is_admin || access.can_edit || access.is_member)) {
      return res.status(403).json({ status: false, message: "Forbidden: You do not have edit access to this group." });
    }

    if (user_id) {
      return res.status(400).json({
        status: false,
        message: "For existing app users, use /api/addUserToGroup instead.",
      });
    }

    const normalizedName = String(mem_name || '').trim();
    if (!normalizedName) {
      return res.status(400).json({ status: false, message: "Member name is required." });
    }

    // Check if the member already exists in the group
    const checkSql = `SELECT id FROM member_infm WHERE LOWER(TRIM(mem_name)) = LOWER(TRIM($1)) AND group_id = $2;`;
    const checkParams = [normalizedName, group_id];
    
    const checkResult = await pool.query(checkSql, checkParams);
    console.log('[AddMember] Check result:', checkResult.rows);

    if (checkResult.rows.length > 0) {
      const errorMsg = `Member ${normalizedName} already exists in this group!`;
      console.log('[AddMember] Duplicate found:', errorMsg);
      return res.json({
        status: false,
        message: errorMsg
      });
    }

    // Insert manual member row only.
    const insertSql = `
      INSERT INTO member_infm (mem_name, paid, group_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const result = await pool.query(insertSql, [normalizedName, paid || 0, group_id]);
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

router.post("/addUserToGroup", authenticateToken, async (req, res) => {
  const { group_id, user_id, can_edit = false, auto_create_member = false } = req.body;
  const actorId = req.user._id;

  try {
    const access = await getGroupAccess(group_id, actorId);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!(access.is_admin || access.can_edit || access.is_member)) {
      return res.status(403).json({ status: false, message: "Forbidden: You do not have edit access to this group." });
    }

    const targetId = Number(user_id);
    if (!Number.isFinite(targetId)) {
      return res.status(400).json({ status: false, message: "user_id must be a valid number." });
    }

    const userRes = await pool.query(
      "SELECT id, usernm FROM user_infm WHERE id = $1 LIMIT 1",
      [targetId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Target user not found." });
    }

    const targetUser = userRes.rows[0];

    const existingGroupUser = await pool.query(
      "SELECT 1 FROM grp_users WHERE group_id = $1 AND user_id = $2 LIMIT 1",
      [group_id, targetId]
    );
    if (existingGroupUser.rows.length > 0) {
      return res.json({ status: false, message: "This user is already invited to this group." });
    }

    // Only admin can decide collaborator edit permission explicitly.
    const resolvedCanEdit = access.is_admin ? !!can_edit : false;

    await pool.query(
      `
        INSERT INTO grp_users (group_id, user_id, can_edit)
        VALUES ($1, $2, $3)
      `,
      [group_id, targetId, resolvedCanEdit]
    );

    // Optional admin/editor-controlled behavior: create participant member row.
    const shouldCreateMember = !!auto_create_member;
    if (shouldCreateMember) {
      const existingMemberByName = await pool.query(
        "SELECT 1 FROM member_infm WHERE group_id = $1 AND LOWER(TRIM(mem_name)) = LOWER(TRIM($2)) LIMIT 1",
        [group_id, targetUser.usernm]
      );

      if (existingMemberByName.rows.length === 0) {
        await pool.query(
          "INSERT INTO member_infm (mem_name, paid, group_id) VALUES ($1, 0, $2)",
          [targetUser.usernm, group_id]
        );
      }
    }

    return res.json({
      status: true,
      message: shouldCreateMember
        ? "User added to group access list and member list successfully."
        : "User added to group access list successfully.",
    });
  } catch (error) {
    console.error("addUserToGroup error", error);
    return res.status(500).json({ status: false, error: error.message });
  }
});

router.get("/getGroupUsers", authenticateToken, async (req, res) => {
  const { group_id } = req.query;
  const actorId = Number(req.user._id);
  const parsedGroupId = Number(group_id);

  if (!Number.isFinite(parsedGroupId) || !Number.isFinite(actorId)) {
    return res.status(400).json({ status: false, message: "group_id and actor user ID must be valid numbers." });
  }

  try {
    const access = await getGroupAccess(parsedGroupId, actorId);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!access.has_access) {
      return res.status(403).json({ status: false, message: "Forbidden: No access to this group." });
    }

    const usersSql = `
      SELECT
        u.id,
        u.usernm,
        u.email,
        u.profile_url,
        gu.can_edit,
        CASE WHEN g.admin_id = u.id THEN TRUE ELSE FALSE END AS is_admin
      FROM grp_users gu
      JOIN user_infm u ON u.id = gu.user_id
      JOIN grp_infm g ON g.id = gu.group_id
      WHERE gu.group_id = $1
      ORDER BY u.usernm ASC;
    `;
    const result = await pool.query(usersSql, [parsedGroupId]);

    return res.json({
      status: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("getGroupUsers error", error);
    return res.status(500).json({ status: false, error: error.message });
  }
});

router.post("/updateGroupUserPermission", authenticateToken, async (req, res) => {
  const { group_id, target_user_id, can_edit } = req.body;
  const actorId = req.user._id;

  try {
    const access = await getGroupAccess(group_id, actorId);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!access.is_admin) {
      return res.status(403).json({ status: false, message: "Only admin can update collaborator permissions." });
    }

    const targetId = Number(target_user_id);
    if (!Number.isFinite(targetId)) {
      return res.status(400).json({ status: false, message: "target_user_id must be a valid number." });
    }

    const groupAdminSql = "SELECT admin_id FROM grp_infm WHERE id = $1 LIMIT 1";
    const groupAdminRes = await pool.query(groupAdminSql, [group_id]);
    if (groupAdminRes.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }

    if (Number(groupAdminRes.rows[0].admin_id) === targetId) {
      return res.status(400).json({ status: false, message: "Admin permission is fixed. Transfer admin instead." });
    }

    const updateSql = `
      UPDATE grp_users
      SET can_edit = $3
      WHERE group_id = $1 AND user_id = $2
      RETURNING group_id, user_id, can_edit;
    `;
    const updateRes = await pool.query(updateSql, [group_id, targetId, !!can_edit]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Target user is not in this group." });
    }

    return res.json({ status: true, data: updateRes.rows[0] });
  } catch (error) {
    console.error("updateGroupUserPermission error", error);
    return res.status(500).json({ status: false, error: error.message });
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
    const access = await getGroupAccess(group_id, req.user._id);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!(access.is_admin || access.can_edit || access.is_member)) {
      return res.status(403).json({ status: false, message: "Forbidden: You do not have edit access to this group." });
    }

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

    const access = await getGroupAccess(group_id, req.user._id);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!(access.is_admin || access.can_edit || access.is_member)) {
      return res.status(403).json({ status: false, message: "Forbidden: You do not have edit access to this group." });
    }

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
router.get("/getMemberByGroupId", authenticateToken, async (req, res) => {
  const { group_id } = req.query;
  const { _id: user_id } = req.user;

  try {
    const access = await getGroupAccess(group_id, user_id);
    if (!access) {
      return res.status(404).send({ status: false, message: "Group not found" });
    }
    if (!access.has_access) {
      return res.status(403).send({ status: false, message: "Forbidden: No access to this group." });
    }

    const sql = `
      SELECT m.*
      FROM member_infm m
      WHERE m.group_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM grp_users gu
          JOIN user_infm u ON u.id = gu.user_id
          WHERE gu.group_id = m.group_id
            AND LOWER(TRIM(u.usernm)) = LOWER(TRIM(m.mem_name))
            AND COALESCE(m.paid, 0) = 0
        )
      ORDER BY m.id;
    `;
    const results = await pool.query(sql, [group_id]);

    res.send({
      status: true,
      data: results.rows.length > 0 ? results.rows : [],
    });
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
    const access = await getGroupAccess(group_id, user_id);
    if (!access?.has_access) {
      return res.status(403).json({ status: false, message: "Forbidden: No access to this group." });
    }

    // Get the list of allowed users if the group is private
    let allowedUsers = [];
    if (groupData.visibility === 'private') {
      const allowedUsersSql = `
        SELECT u.id, u.usernm, u.email, u.profile_url, gu.can_edit
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

router.post("/transferGroupAdmin", authenticateToken, async (req, res) => {
  const { group_id, new_admin_user_id } = req.body;
  const currentUserId = req.user._id;

  const client = await pool.connect();
  try {
    const access = await getGroupAccess(group_id, currentUserId);
    if (!access) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }
    if (!access.is_admin) {
      return res.status(403).json({ status: false, message: "Only current admin can transfer admin rights." });
    }

    const targetUserId = Number(new_admin_user_id);
    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ status: false, message: "new_admin_user_id must be a valid number." });
    }

    const userExists = await client.query("SELECT id FROM user_infm WHERE id = $1 LIMIT 1", [targetUserId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Target user does not exist." });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ status: false, message: "Target user is already admin." });
    }

    const targetIsGroupUser = await client.query(
      "SELECT 1 FROM grp_users WHERE group_id = $1 AND user_id = $2 LIMIT 1",
      [group_id, targetUserId]
    );
    if (targetIsGroupUser.rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: "New admin must already be an invited user in this group.",
      });
    }

    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO grp_users (group_id, user_id, can_edit)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (group_id, user_id)
        DO UPDATE SET can_edit = TRUE
      `,
      [group_id, currentUserId]
    );

    await client.query("UPDATE grp_infm SET admin_id = $1 WHERE id = $2", [targetUserId, group_id]);

    await client.query("COMMIT");
    return res.json({ status: true, message: "Group admin transferred successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("transferGroupAdmin error", error);
    return res.status(500).json({ status: false, error: error.message });
  } finally {
    client.release();
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
  const user_id = Number(req.user._id);
  const parsedGroupId = Number(group_id);

  if (!group_id) {
    return res.status(400).json({ status: false, message: "group_id is required." });
  }

  if (!Number.isFinite(parsedGroupId) || !Number.isFinite(user_id)) {
    return res.status(400).json({ status: false, message: "group_id and user ID must be valid numbers." });
  }

  try {
    const accessSql = `
      SELECT g.id, g.telegram_chat_id,
             (g.admin_id = $2 OR EXISTS(
                SELECT 1 FROM grp_users gu WHERE gu.group_id = g.id AND gu.user_id = $2
             )) AS has_access
      FROM grp_infm g
      WHERE g.id = $1::int
    `;
    const accessRes = await pool.query(accessSql, [parsedGroupId, user_id]);

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
  const user_id = Number(req.user._id);
  const parsedGroupId = Number(group_id);

  if (!group_id || group_chat_id === undefined || group_chat_id === null) {
    return res.status(400).json({ status: false, message: "group_id and group_chat_id are required." });
  }

  if (!Number.isFinite(parsedGroupId) || !Number.isFinite(user_id)) {
    return res.status(400).json({ status: false, message: "group_id and user ID must be valid numbers." });
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
      WHERE g.id = $1::int
    `;
    const accessRes = await pool.query(accessSql, [parsedGroupId, user_id]);

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
      [parsedChatId, parsedGroupId]
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

    const selectedMemberIds = Array.isArray(member_ids)
      ? member_ids.map((id) => Number(id)).filter(Number.isFinite)
      : [];

    const reportData = await buildGroupReportData(groupid, {
      memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : null,
    });

    if (!reportData) {
      return res.status(404).json({ status: false, message: 'Group not found.' });
    }

    if (reportData.members.length === 0) {
      return res.json({ status: true, message: "No members to share." });
    }

    const groupName = safeText(reportData.groupName, safeText(group.grp_name, `Group ${groupid}`));
    const currency = safeText(reportData.currency, safeText(group.currency, '$'));
    let message = `📊 *Member Settlement Status: ${groupName}*\n\n`;

    reportData.members.forEach((member) => {
      message += `👤 *${safeText(member.name, 'Unknown Member')}*\n`;
      message += `• Paid: ${currency}${formatAmount(member.paid)}\n`;
      message += `• Spent: ${currency}${formatAmount(member.spent)}\n`;
      message += `• Remain: ${currency}${formatAmount(member.remain)}\n`;
      message += `• Unpaid: ${currency}${formatAmount(member.unpaid)}\n`;

      if (member.joinedTrips.length > 0) {
        message += `• Joined Trips:\n`;
        member.joinedTrips.forEach((trip) => {
          message += `   - ${safeText(trip.name)}: ${currency}${formatAmount(trip.cost)}\n`;
        });
      } else {
        message += `• Joined Trips: -\n`;
      }

      message += `\n`;
    });

    message += `👤 Shared by: *${actorName}*\n_Generated via TinyNotie Portal_`;

    const userRes = await pool.query('SELECT telegram_id FROM user_infm WHERE id = $1', [user_id]);
    const personalChatId = userRes.rows?.[0]?.telegram_id;
    const hasPersonal = !!personalChatId;
    const hasGroup = !!group.telegram_chat_id;

    let resolvedTarget = targetType;
    if (resolvedTarget === 'group' && !hasGroup && hasPersonal) resolvedTarget = 'personal';
    if (resolvedTarget === 'personal' && !hasPersonal && hasGroup) resolvedTarget = 'group';

    if (!hasGroup && !hasPersonal) {
      return res.status(400).json({ status: false, message: 'No Telegram destination is linked. Register via bot and/or link a Telegram group chat first.' });
    }

    // 5. Send to Telegram (group or personal)
    let sent = false;
    if (resolvedTarget === 'personal') {
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
      res.json({ status: true, message: resolvedTarget === 'personal' ? 'Summary sent to your personal Telegram chat!' : 'Summary shared to Telegram group!' });
    } else {
      res.status(400).json({ status: false, message: resolvedTarget === 'personal' ? 'Failed to send to your personal Telegram chat.' : 'Failed to share. Is this group linked to an active Telegram chat? Use /chat_id then link by group chat ID in app settings.' });
    }

  } catch (error) {
    console.error("shareMembersToTelegram error:", error);
    res.status(500).json({ status: false, message: "Server error during sharing.", error: error.message });
  }
});

export default router;

