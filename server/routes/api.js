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

// Filter Members by Specific Field or Search Across All Fields
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

// Get Group by User ID
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

// Get Groups by User with Advanced Search
router.get("/searchGroups", authenticateToken, async (req, res) => {
  const { _id: user_id } = req.user;
  const { search = "", start_date, end_date } = req.query;
  
  try {
    const sql = `
      SELECT DISTINCT g.id, g.grp_name, g.status, g.currency, g.admin_id, g.create_date,
             CASE 
               WHEN g.admin_id = $1 THEN TRUE
               ELSE FALSE
             END AS "isAdmin"
      FROM grp_infm g
      LEFT JOIN member_infm m ON g.id = m.group_id
      LEFT JOIN grp_users gu ON g.id = gu.group_id AND gu.user_id = $1
      WHERE 
        (LOWER(g.grp_name) LIKE LOWER('%' || $2 || '%') -- Match Group Name
         OR LOWER(m.mem_name) LIKE LOWER('%' || $2 || '%')) -- Match Member Name
        AND g.admin_id = $1
        AND (CAST(g.create_date AS DATE) >= $3::date OR $3::date IS NULL) -- Start Date Filter
        AND (CAST(g.create_date AS DATE) <= $4::date OR $4::date IS NULL) -- End Date Filter
      ORDER BY g.id ASC;
    `;

    const values = [user_id, search, start_date || null, end_date || null]
    
    console.log({ search, start_date, end_date });
    console.log({sql});
    console.log({values});

    const results = await pool.query(sql, values);
    console.log({results});
    res.send({ status: true, data: results.rows });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Group Details by Group ID and User ID
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

// Update Group Visibility and Access Control
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

// Get Group Visibility
router.get("/getGroupVisibility", authenticateToken, async (req, res) => {
  const { group_id } = req.query;

  try {
    // Fetch the group's visibility status
    const groupSql = `
      SELECT id, grp_name, visibility
      FROM grp_infm
      WHERE id = $1::int;
    `;
    const groupResult = await pool.query(groupSql, [group_id]);

    if (groupResult.rows.length === 0) {
      return res.json({ status: false, message: "Group not found." });
    }

    const group = groupResult.rows[0];

    // If the group is private, fetch the list of allowed users
    if (group.visibility === "private") {
      const usersSql = `
        SELECT u.id, u.usernm, u.email, u.profile_url
        FROM grp_users gu
        JOIN user_infm u ON gu.user_id = u.id
        WHERE gu.group_id = $1::int;
      `;
      const usersResult = await pool.query(usersSql, [group_id]);

      return res.json({
        status: true,
        data: {
          id: group.id,
          grp_name: group.grp_name,
          visibility: group.visibility,
          allowed_users: usersResult.rows,
        },
      });
    } else {
      // If the group is public, just return the visibility
      return res.json({
        status: true,
        data: {
          id: group.id,
          grp_name: group.grp_name,
          visibility: group.visibility,
          allowed_users: [], // No specific users for public groups
        },
      });
    }
  } catch (error) {
    console.error("error", error);
    res.json({ status: false, error: error.message });
  }
});

// Add Group by User ID
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

router.post("/addMemberByGroupId", authenticateToken, async (req, res) => {
  const { mem_name, paid, group_id } = req.body;
  const client = await pool.connect(); // Get a connection client

  try {
    await client.query("BEGIN"); 

    const insertMemberQuery = `
      INSERT INTO member_infm (mem_name, paid, group_id)
      VALUES ($1, $2, $3);
    `;
    await client.query(insertMemberQuery, [mem_name, paid || 0, group_id]);
    await client.query("COMMIT"); // Commit the transaction
    res.send({ status: true, message:"Member added successfully!" });
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback the transaction on error
    console.error("error", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

// Add Trip by Group ID
router.post("/addTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, mem_id, description, group_id, update_dttm } =
    req.body;
  let create_date = req.body?.create_date || format(new Date());
  try {
    const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length === 0) {
      const sql2 = `
        INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date , update_dttm)
        VALUES ($1, $2, $3, $4, $5, $6 , $7);`;
      await pool.query(sql2, [
        trp_name,
        spend,
        mem_id,
        description,
        group_id,
        create_date,
        update_dttm,
      ]);
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

// Add Multiple Trips by Group ID
router.post(
  "/addMultipleTripsByGroupId",
  authenticateToken,
  async (req, res) => {
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
        } = trip;
        const createDate = create_date || format(new Date());

        // Check if the trip already exists
        const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
        const results = await pool.query(sql, [group_id, trp_name]);

        if (results.rows.length === 0) {
          // If the trip doesn't exist, insert a new one
          const sql2 = `
          INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date, update_dttm)
          VALUES ($1, $2, $3, $4, $5, $6, $7);`;
          await pool.query(sql2, [
            trp_name,
            spend,
            mem_id,
            description,
            group_id,
            createDate,
            update_dttm,
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

      res.send({ status: true, results });
    } catch (error) {
      console.error("Error adding multiple trips:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

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

    // Update the spend value in the database
    const sql2 = `UPDATE trp_infm SET spend = $1 , update_dttm = $2 WHERE id = $3;`;
    await pool.query(sql2, [newSpend, update_dttm, results.rows[0].id]);

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
          const sql = `SELECT * FROM trp_infm WHERE group_id = $1 ORDER BY id;`;
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
      const sql = `SELECT * FROM trp_infm WHERE group_id = $1 ORDER BY id;`;
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

// Get All Members Created by User's Groups
router.get("/getAllMember", authenticateToken, async (req, res) => {
  const { _id } = req.user; // Assuming the user ID is attached to req.user by authenticateToken

  try {
    // Query to select distinct member names from groups created by the authenticated user
    const sql = `
      SELECT DISTINCT m.mem_name
      FROM member_infm m
      JOIN grp_infm g ON m.group_id = g.id
      WHERE g.admin_id = $1
      ORDER BY m.mem_name;
    `;

    const results = await pool.query(sql, [_id]);
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

// Delete Trip by Trip ID and Group ID
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
    res.json({
      status: false,
      message: "Failed to delete trip",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Get Members by Group ID
router.get("/getMemberByGroupId", async (req, res) => {
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
          // Fetch members for the authenticated user
          const sql = `SELECT id, mem_name, paid, group_id FROM member_infm WHERE group_id = $1 ORDER BY id;`;
          const results = await pool.query(sql, [group_id]);

          res.send({ status: true, data: results.rows });
        } catch (error) {
          handleError(error, res);
        }
      });
    } else {
      // If the group is public, fetch members without authentication
      const sql = `SELECT id, mem_name, paid, group_id FROM member_infm WHERE group_id = $1 ORDER BY id;`;
      const results = await pool.query(sql, [group_id]);

      res.send({ status: true, data: results.rows });
    }
  } catch (error) {
    handleError(error, res);
  }
});

// Edit Member by Member ID
router.post("/editMemberByMemberId", authenticateToken, async (req, res) => {
  const { user_id, paid, type } = req.body;
  const client = await pool.connect(); // Get a connection client

  try {
    await client.query("BEGIN"); // Start a transaction

    // Lock the row for the member to prevent concurrent updates
    const selectForUpdateSql = `SELECT paid FROM member_infm WHERE id = $1 FOR UPDATE;`;
    const result = await client.query(selectForUpdateSql, [user_id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
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
        await client.query("ROLLBACK");
        return res.json({
          status: false,
          message: "Cannot reduce paid amount below 0",
        });
      }
    } else if (type === "UPDATE") {
      newPaid = paid;
    } else {
      await client.query("ROLLBACK");
      return res.json({
        status: false,
        message: "Invalid type specified. Use 'ADD' or 'REDUCE'.",
      });
    }

    // Update the paid value in the database
    const updateSql = `UPDATE member_infm SET paid = $1 WHERE id = $2;`;
    await client.query(updateSql, [newPaid, user_id]);

    await client.query("COMMIT"); // Commit the transaction
    res.send({ status: true, message: "Update successful!" });
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback the transaction on error
    console.error("error", error);
    res.json({
      status: false,
      message: "An error occurred while updating the member",
      error: error.message,
    });
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
      timeDifference < 24 * 60 * 60 * 1000
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

// Update User Information
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

router.post("/uploadImage", authenticateToken, async (req, res) => {
  const { image } = req.body; // Expecting base64-encoded image string in the request body

  if (!image) {
    return res.status(400).json({ status: false, message: "Image is required." });
  }

  try {
    // Calculate the size of the base64-encoded image
    const imageSizeInBytes = (image.length * 3) / 4 - (image.endsWith("==") ? 2 : image.endsWith("=") ? 1 : 0);
    const imageSizeInMB = imageSizeInBytes / (1024 * 1024);

    // Check if the image size exceeds 32 MB
    if (imageSizeInMB > 32) {
      return res.status(413).json({
        status: false,
        message: "Image is too large. Please upload an image smaller than 32 MB.",
      });
    }

    const apiKey = "fced9d0e1fbd474c40b93fa708d3d7ac";
    const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;

    const formData = new URLSearchParams();
    formData.append("image", image);

    const response = await axios.post(url, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data.success) {
      const { url, display_url, delete_url } = response.data.data;
      res.json({
        status: true,
        message: "Image uploaded successfully.",
        data: { url, display_url, delete_url },
      });
    } else {
      res.status(500).json({ status: false, message: "Failed to upload image." });
    }
  } catch (error) {
    if (error.response && error.response.status === 413) {
      // Handle 413 Payload Too Large error from ImgBB
      res.status(413).json({
        status: false,
        message: "Image is too large. Please upload a smaller image.",
      });
    } else {
      console.error("Error uploading image:", error);
      res.status(500).json({
        status: false,
        message: "An error occurred while uploading the image.",
        error: error.message,
      });
    }
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
