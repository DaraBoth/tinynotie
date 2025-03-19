import express from "express";
import { authenticateToken } from "./middleware/auth.js";
import { pool, handleError } from "../utils/db.js";

const router = express.Router();

/**
 * @swagger
 * /misc/test_db_online:
 *   get:
 *     summary: Test database connection
 *     tags: [Miscellaneous]
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Database user
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         description: Database host
 *       - in: query
 *         name: database
 *         schema:
 *           type: string
 *         description: Database name
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         description: Database password
 *       - in: query
 *         name: port
 *         schema:
 *           type: integer
 *         description: Database port
 *       - in: query
 *         name: sql
 *         schema:
 *           type: string
 *         description: SQL query to execute
 *     responses:
 *       200:
 *         description: Database connection successful
 *       500:
 *         description: Internal server error
 */

// Test database connection
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

// External API: Get post list
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