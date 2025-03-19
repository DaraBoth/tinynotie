import express from "express";
import { authenticateToken } from "./middleware/auth.js";
import { pool, handleError } from "../utils/db.js";

const router = express.Router();

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

// Get groups by user ID
router.get("/getGroupByUserId", authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  try {
    const sql = `
      SELECT g.id, g.grp_name, g.status, g.currency, g.admin_id, g.create_date,
             CASE 
               WHEN g.admin_id = $1::int THEN TRUE
               ELSE FALSE
             END AS "isAdmin"
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

// Add group by user ID
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
    create_date = format(new Date());
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

// Update group visibility
router.post("/updateGroupVisibility", authenticateToken, async (req, res) => {
  const { group_id, visibility, allowed_users } = req.body; // allowed_users is an array of user IDs
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

    // Update the group's visibility
    const updateVisibilitySql = `
      UPDATE grp_infm 
      SET visibility = $2 
      WHERE id = $1::int;
    `;
    await pool.query(updateVisibilitySql, [group_id, visibility]);

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

export default router;