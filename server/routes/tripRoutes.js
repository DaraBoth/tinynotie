import express from "express";
import { authenticateToken } from "./middleware/auth.js";
import { pool, handleError } from "../utils/db.js";
import moment from "moment";

const router = express.Router();

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
        payer_id,
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
          payer_id,
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
});

// Edit trip by group ID
router.post("/editTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, group_id, type, update_dttm, payer_id } = req.body;

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
    await pool.query(sql2, [newSpend, update_dttm, payer_id, results.rows[0].id]);

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
    await pool.query(updateSql, [mem_id, new Date().toISOString(), payer_id || null, trp_id]);

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
    res.json({
      status: false,
      message: "Failed to delete trip",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

export default router;