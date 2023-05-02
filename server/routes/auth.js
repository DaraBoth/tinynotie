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

router.post("/login", async (req, res) => {
  const { usernm , passwd } = req.body;
  try {
    let sql = `SELECT id FROM user_infm where usernm = '${usernm}' and passwd = '${passwd}';`
    pool.query(sql.toString(),(error,results)=>{
      if(error) {
        res.status(500).json({ status:false,error: error.message });
        throw error;
      }
      if(results.rows.length>0){
        res.send({status:true,usernm:usernm,_id:results.rows[0].id});
      }else{
        res.send({status:false,message:`username ${usernm} doesn't exist please try register instead!`})
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status:false,error: error.message });
  }
});

router.get("/register", async (req, res) => {
  const { usernm , passwd } = req.body;
  try {
    let sql = `SELECT usernm FROM user_infm where usernm = '${usernm}';`
    pool.query(sql.toString(),(error,results)=>{
      if(error) {
        res.status(500).json({ status:false,error: error.message });
        throw error;
      }
      if(!results.rows.length > 0) {
        let sql2 = `INSERT INTO user_infm( usernm, passwd ) VALUES('${usernm}', '${passwd}');`
        pool.query(sql2.toString(),(error,results)=>{
          if(error) {
            res.status(500).json({ status:false,error: error.message });
            throw error;
          }
          res.send({status:true,message:"Registered success!"});
        })
      }else {
        res.send({status:false,message:"User name is already existed!"});
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status:false,error: error.message });
  }
});

module.exports = router;