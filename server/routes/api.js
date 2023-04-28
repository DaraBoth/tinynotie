const express = require('express');
const router = express.Router();
const Pool = require("pg").Pool
const pool = new Pool({
  user : "postgres",
  host : "34.142.197.251",
  database : "daraboth",
  password : "both123",
  port : 5432
})

router.get("/getGroupByUserId", async (req, res) => {
    const { user_id } = req.query;
    try {
      let sql = `SELECT "data" FROM public.members where user_id='${user_id}';`
      pool.query(sql.toString(),(error,results)=>{
        if(error) {
          res.status(500).json({ error: error.message });
          throw error;
        }
        let newData = JSON.parse(results.rows[0].data)
        res.send(newData);
      })
    } catch (error) {
      console.error("error", error);
      res.status(500).json({ error: error.message });
    }
     
  });

module.exports = router;