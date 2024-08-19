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

// Get Group by User ID
router.get("/getGroupByUserId", authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  try {
    const sql = `SELECT id, grp_name, status, currency, admin_id, create_date 
                 FROM grp_infm 
                 WHERE admin_id=$1::int 
                 ORDER BY id ASC;`;
    const results = await pool.query(sql, [user_id]);
    res.send({ status: true, data: results.rows });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

// Add Group by User ID
router.post("/addGroupByUserId", authenticateToken, async (req, res) => {
  const { user_id, grp_name, status = 1, description, currency = 'W', member } = req.body;
  const create_date = format(new Date());
  const newMember = JSON.parse(member);

  try {
    let sql = `
      DO $$
      DECLARE
        group_id INT;
      BEGIN
        INSERT INTO grp_infm (
          grp_name, status, description, currency, admin_id, create_date
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id INTO group_id;
    `;

    const memberInserts = newMember.map(mem_name => `
      INSERT INTO member_infm (mem_name, paid, group_id) 
      VALUES ('${mem_name}', 0, group_id);
    `).join('');

    sql += memberInserts;
    sql += `END $$; SELECT MAX(id) as id FROM grp_infm;`;

    const results = await pool.query(sql, [grp_name, status, description, currency, user_id, create_date]);
    res.send({ status: true, data: results[1].rows[0] });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

// Add Trip by Group ID
router.post("/addTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, mem_id, description, group_id } = req.body;
  const create_date = format(new Date());
  try {
    const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length === 0) {
      const sql2 = `
        INSERT INTO trp_infm (trp_name, spend, mem_id, description, group_id, create_date)
        VALUES ($1, $2, $3, $4, $5, $6);`;
      await pool.query(sql2, [trp_name, spend, mem_id, description, group_id, create_date]);
      res.send({ status: true, message: "Add trip success!" });
    } else {
      res.status(409).json({ status: false, message: `Trip ${trp_name} already exists!` });
    }
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit Trip by Group ID
router.post("/editTripByGroupId", authenticateToken, async (req, res) => {
  const { trp_name, spend, group_id } = req.body;
  try {
    const sql = `SELECT id FROM trp_infm WHERE group_id=$1 AND trp_name=$2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length > 0) {
      const sql2 = `UPDATE trp_infm SET spend=$1 WHERE id=$2;`;
      await pool.query(sql2, [spend, results.rows[0].id]);
      res.send({ status: true, message: `Edit ${trp_name} success!` });
    } else {
      res.status(404).json({ status: false, message: `Trip ${trp_name} not found!` });
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
  const { trp_name, spend, group_id } = req.body;

  try {
    const sql = `SELECT id FROM trp_infm WHERE group_id = $1 AND trp_name = $2;`;
    const results = await pool.query(sql, [group_id, trp_name]);

    if (results.rows.length > 0) {
      const sql2 = `UPDATE trp_infm SET spend = $1 WHERE id = $2;`;
      await pool.query(sql2, [spend, results.rows[0].id]);
      res.send({ status: true, message: `Edit ${trp_name} success!` });
    } else {
      res.status(404).json({ status: false, message: `Trip ${trp_name} not found!` });
    }
  } catch (error) {
    handleError(error, res);
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
    const sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date FROM trp_infm WHERE group_id = $1 ORDER BY id;`;
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
  const { user_id, paid } = req.body;

  try {
    const sql = `UPDATE member_infm SET paid = $1 WHERE id = $2;`;
    await pool.query(sql, [paid, user_id]);
    res.send({ status: true, message: "Update successful!" });
  } catch (error) {
    handleError(error, res);
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