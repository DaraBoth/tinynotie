const express = require('express');
const router = express.Router();
const Pool = require("pg").Pool
const pool = new Pool({
  user: "postgres",
  host: "34.142.197.251",
  database: "daraboth",
  password: "both123",
  port: 5432
})

router.get("/getGroupByUserId", async (req, res) => {
  const { user_id } = req.query;
  try {
    let sql = `SELECT id, grp_name, status, discription, admin_id, create_date FROM grp_infm where id='${user_id}';`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }

});

router.get("/getTripByGroupId", async (req, res) => {
  const { group_id } = req.query;
  try {
    let sql = `SELECT id, trp_name, spend, admn_id, mem_id, discription, group_id, create_date FROM public.trp_infm where group_id='${group_id}';`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getMemberByGroupId", async (req, res) => {
  const { group_id } = req.query;
  try {
    let sql = `SELECT id, mem_name, paid, group_id, trp_id FROM member_infm where group_id='${group_id}';`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/addMemberByGroupId", async (req, res) => {
  const { group_id , paid ,mem_name } = req.body;
  try {
    let sql = `INSERT INTO member_infm (mem_name, paid, group_id, trp_id) VALUES('${mem_name}', ${paid}, ${group_id}, 1);`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});
router.post("/editMemberByMemberId", async (req, res) => {
  const { user_id , paid } = req.body;
  try {
    let sql = `UPDATE member_infm
    SET paid=${paid} WHERE id='${user_id}';`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;