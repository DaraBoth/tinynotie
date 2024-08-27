import pg from "pg";
import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./middleware/auth.js"; // Assuming you have a middleware for JWT

const router = express.Router();
const Pool = pg.Pool;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Helper function to format dates
function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper function for centralized error handling
const handleError = (error, res) => {
  console.error("error", error);
  res.status(500).json({ error: error.message });
};

// Test DB Connection
router.get("/test_db_online", async (req, res) => {
  const { user, host, database, password, port, sql, isDaraboth } = req.query;
  let testPool;

  if (isDaraboth) {
    testPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
  } else {
    testPool = new Pool({
      user: user,
      host: host,
      database: database,
      password: password,
      port: port,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  let client;
  try {
    client = await testPool.connect();
    const results = await client.query(sql);
    res.send({ results });
  } catch (error) {
    console.error("Connection error", error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) {
      client.release();
    }
    testPool.end();
  }
});

// List All Users
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

// Get Group by User ID
router.get("/getGroupByUserId", authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  try {
    const sql = `SELECT g.id, g.grp_name, g.status, g.currency, g.admin_id, g.create_date 
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

// Get Group Details by Group ID and User ID
router.get("/getGroupDetail", async (req, res) => {
  const { group_id, user_id } = req.query;

  try {
    // First, check if the group is public
    const publicCheckSql = `
      SELECT id, grp_name, currency, visibility
      FROM grp_infm
      WHERE id = $1::int AND visibility = 'public';
    `;
    const publicResult = await pool.query(publicCheckSql, [group_id]);

    // If the group is public, respond with the group data
    if (publicResult.rows.length > 0) {
      return res.json({ status: true, data: { ...publicResult.rows[0], isAuthorized: true } });
    }

    // If the group is not public, check if the user is authenticated and authorized
    if (user_id) {
      const authCheckSql = `
        SELECT g.id, g.grp_name, g.currency, g.visibility,
              CASE 
                WHEN g.admin_id = $2::int THEN TRUE
                WHEN gu.user_id IS NOT NULL THEN TRUE
                ELSE FALSE
              END AS "isAuthorized",
              CASE 
                WHEN g.admin_id = $2::int THEN TRUE
                ELSE FALSE
              END AS "isAdmin"
        FROM grp_infm g
        LEFT JOIN grp_users gu ON g.id = gu.group_id AND gu.user_id = $2::int
        WHERE g.id = $1::int;
      `;
      const authResult = await pool.query(authCheckSql, [group_id, user_id]);

      // If the user is authorized, respond with the group data
      if (authResult.rows.length > 0 && authResult.rows[0].isAuthorized) {
        return res.json({ status: true, data: authResult.rows[0] });
      } else {
        // If the user is not authorized, return a custom JSON response
        return res.json({ status: false, message: "You are not authorized to view this group." });
      }
    } else {
      // If no user_id is provided and the group is not public, return a custom JSON response
      return res.json({ status: false, message: "Authentication required to view this group." });
    }
  } catch (error) {
    console.error("error", error);
    res.json({ error: error.message });
  }
});

// Update Group Visibility and Access Control
router.post("/updateGroupVisibility", authenticateToken, async (req, res) => {
  const { group_id, visibility, allowed_users } = req.body; // allowed_users is an array of user IDs
  const { _id:user_id } = req.user; // Assuming authenticateToken middleware attaches user_id to req.user

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
      return res.json({ status: false, message: "You are not authorized to update this group." });
    }

    // Update the group's visibility
    const updateVisibilitySql = `
      UPDATE grp_infm 
      SET visibility = $2 
      WHERE id = $1::int;
    `;
    await pool.query(updateVisibilitySql, [group_id, visibility]);

    // If the group is set to private, update the allowed users
    if (visibility === 'private' && Array.isArray(allowed_users)) {
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
        allowed_users.map(userId => pool.query(insertUserSql, [group_id, userId]))
      );
    }

    res.json({ status: true, message: "Group visibility updated successfully." });
  } catch (error) {
    console.error("error", error);
    res.json({ status: false, error: error.message });
  }
});

// Add Group by User ID
router.post("/addGroupByUserId", authenticateToken, async (req, res) => {
  const { user_id, grp_name, status = 1, description, currency = 'W', member } = req.body;
  let create_date;
  if(!req.body.create_date){
    create_date = format(new Date())
  }else {
    create_date = req.body.create_date;
  }
  const newMember = JSON.parse(member);

  const client = await pool.connect(); // Get a connection client

  try {
    await client.query('BEGIN'); // Start a transaction

    // Insert into grp_infm and return the inserted group_id
    const insertGroupQuery = `
      INSERT INTO grp_infm (grp_name, status, description, currency, admin_id, create_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const result = await client.query(insertGroupQuery, [grp_name, status, description, currency, user_id, create_date]);
    const group_id = result.rows[0].id;

    // Insert each member into member_infm with the returned group_id
    const insertMemberQuery = `
      INSERT INTO member_infm (mem_name, paid, group_id)
      VALUES ($1, $2, $3);
    `;
    for (const mem_name of newMember) {
      await client.query(insertMemberQuery, [mem_name, 0, group_id]);
    }

    await client.query('COMMIT'); // Commit the transaction

    res.send({ status: true, data: { id: group_id } });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on error
    console.error("error", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
});


// Add Trip by Group ID
router.post("/addTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, mem_id, description, group_id , update_dttm } = req.body;
  let create_date = req.body?.create_date || format(new Date());
  try {
    const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length === 0) {
      const sql2 = `
        INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date , update_dttm)
        VALUES ($1, $2, $3, $4, $5, $6 , $7);`;
      await pool.query(sql2, [trp_name, spend, mem_id, description, group_id, create_date, update_dttm]);
      res.send({ status: true, message: "Add trip success!" });
    } else {
      res.status(409).json({ status: false, message: `Trip ${trp_name} already exists!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit Trip Members by Trip ID
router.post("/editTripMem", authenticateToken, async (req, res) => {
  const { trp_id, trp_name, mem_id } = req.body;

  try {
    const sql = `UPDATE trp_infm SET mem_id = $1 WHERE id = $2;`;
    await pool.query(sql, [mem_id, trp_id]);
    res.send({ status: true, message: `Edit ${trp_name} success!` });
  } catch (error) {
    handleError(error, res);
  }
});

// Edit Trip by Group ID
router.post("/editTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, group_id, type, update_dttm } = req.body;

  try {
    // Fetch the current spend value for the trip
    const sql = `SELECT id, spend FROM trp_infm WHERE group_id = $1 AND trp_name = $2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length === 0) {
      return res.json({ status: false, message: `Trip ${trp_name} not found!` });
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
        return res.json({ status: false, message: "Cannot reduce spend below 0" });
      }
    } else if(type === "UPDATE") {
      newSpend = spend
    } else {
      return res.json({ status: false, message: "Invalid type specified. Use 'ADD' or 'REDUCE'." });
    }

    // Update the spend value in the database
    const sql2 = `UPDATE trp_infm SET spend = $1 , update_dttm = $2 WHERE id = $3;`;
    await pool.query(sql2, [newSpend, update_dttm ,results.rows[0].id]);

    res.send({ status: true, message: `Edit ${trp_name} success!` });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status: false, message: "An error occurred while updating the trip", error: error.message });
  }
});


// Get All Trips
router.get("/getAllTrip", authenticateToken, async (req, res) => {
  try {
    const sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date FROM trp_infm;`;
    const results = await pool.query(sql);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    handleError(error, res);
  }
});

// Get Trip by Group ID
router.get("/getTripByGroupId", authenticateToken, async (req, res) => {
  const { group_id } = req.query;

  try {
    const sql = `SELECT * FROM trp_infm WHERE group_id = $1 ORDER BY id;`;
    const results = await pool.query(sql, [group_id]);

    res.send({ status: true, data: results.rows.length > 0 ? results.rows : [] });
  } catch (error) {
    handleError(error, res);
  }
});

// Get All Members
router.get("/getAllMember", authenticateToken, async (req, res) => {
  try {
    const sql = `SELECT DISTINCT mem_name FROM member_infm WHERE mem_name NOT LIKE '%test%' AND mem_name NOT LIKE '%asd%' ORDER BY mem_name;`;
    const results = await pool.query(sql);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    handleError(error, res);
  }
});

// Get Members by Group ID
router.get("/getMemberByGroupId", authenticateToken, async (req, res) => {
  const { group_id } = req.query;

  try {
    const sql = `SELECT id, mem_name, paid, group_id FROM member_infm WHERE group_id = $1 ORDER BY id;`;
    const results = await pool.query(sql, [group_id]);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    handleError(error, res);
  }
});

// Delete Member by ID
router.delete("/members/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `DELETE FROM member_infm WHERE id = $1;`;
    await pool.query(sql, [id]);
    res.send({ status: true, message: "Delete success!" });
  } catch (error) {
    handleError(error, res);
  }
});

// Add Member by Group ID
router.post("/addMemberByGroupId", authenticateToken, async (req, res) => {
  const { group_id, paid, mem_name } = req.body;

  try {
    const sql = `INSERT INTO member_infm (mem_name, paid, group_id) VALUES ($1, $2, $3) RETURNING id;`;
    const results = await pool.query(sql, [mem_name, paid, group_id]);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    handleError(error, res);
  }
});

// Edit Member by Member ID
router.post("/editMemberByMemberId", authenticateToken, async (req, res) => {
  const { user_id, paid, type } = req.body;
  const client = await pool.connect(); // Get a connection client

  try {
    await client.query('BEGIN'); // Start a transaction

    // Lock the row for the member to prevent concurrent updates
    const selectForUpdateSql = `SELECT paid FROM member_infm WHERE id = $1 FOR UPDATE;`;
    const result = await client.query(selectForUpdateSql, [user_id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ status: false, message: "Member not found!" });
    }

    const currentPaid = result.rows[0].paid;
    let newPaid;

    // Determine the new paid value based on the type
    if (type === "ADD") {
      newPaid = currentPaid + paid;
    } else if (type === "REDUCE") {
      newPaid = currentPaid - paid;

      // Ensure the new paid value is not below zero
      if (newPaid < 0) {
        await client.query('ROLLBACK');
        return res.json({ status: false, message: "Cannot reduce paid amount below 0" });
      }
    } else if(type === "UPDATE") {
      newPaid = paid
    } else {
      await client.query('ROLLBACK');
      return res.json({ status: false, message: "Invalid type specified. Use 'ADD' or 'REDUCE'." });
    }

    // Update the paid value in the database
    const updateSql = `UPDATE member_infm SET paid = $1 WHERE id = $2;`;
    await client.query(updateSql, [newPaid, user_id]);

    await client.query('COMMIT'); // Commit the transaction
    res.send({ status: true, message: "Update successful!" });

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on error
    console.error("error", error);
    res.json({ status: false, message: "An error occurred while updating the member", error: error.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

// Delete Group by ID
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
      return res.json({ status: false, message: "You do not have permission to delete this group" });
    }

    // Check if the group is older than 24 hours
    const groupCreationTime = new Date(create_date);
    const currentTime = new Date();
    const timeDifference = currentTime - groupCreationTime;

    if (timeDifference < 24 * 60 * 60 * 1000) {
      return res.json({ status: false, message: "Group cannot be deleted within 24 hours of creation" });
    }

    await client.query('BEGIN');

    // Delete the group itself
    const deleteTripQuery = `
      DELETE FROM trp_infm CASCADE WHERE group_id = $1;
    `;
    await client.query(deleteTripQuery, [group_id]);

    // Delete the group itself
    const deleteGroupQuery = `
      DELETE FROM grp_infm CASCADE WHERE id = $1;
    `;
    await client.query(deleteGroupQuery, [group_id]);

    await client.query('COMMIT');
    
    res.json({ status: true, message: "Group deleted successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("error", error);
    res.json({ status: false, message: "Failed to delete group", error: error.message });
  } finally {
    client.release();
  }
});

// External API: Get Post List
router.get("/post/list", authenticateToken, async (req, res) => {
  const { companyId, projectId, categoryId, status, size, sort } = req.query;
  let baseURL = `https://eboard-api.kosign.dev/api/v1/openapi/post/list?`;

  const queryParams = new URLSearchParams({
    companyId,
    projectId,
    categoryId,
    status,
    size,
    sort,
  });

  baseURL += queryParams.toString();

  try {
    const response = await axios.get(baseURL);
    res.send(response.data);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;