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

router.get("/getAllMembers", async (req, res) => {
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

router.get("/getJoinedMembers", async (req, res) => {
  const { user_id } = req.query;
  try {
    let sql = `SELECT "data" FROM public."joinedMembers" where user_id='${user_id}';`
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

router.get("/getTripsByUserId", async (req, res) => {
  const { user_id } = req.query;
  try {
    let sql = `SELECT "data" FROM public.trips where user_id='${user_id}';`
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
 
router.get("/addMember", async (req, res) => {
  const { user_id } = req.query;
  const {name , money} = JSON.parse(req.query.member);
  try {
    let sql = `SELECT "data" FROM public.members where user_id='${user_id}';`
      pool.query(sql.toString(),(error,results)=>{
        if(error) {
          res.status(500).json({ error: error.message });
          throw error;
        }
      let newData = JSON.parse(results.rows[0].data)
      for(let i in newData){
        if(newData[i].name === name){
          res.status(200).json({status:false,message:''+name+' is already exist! Please try another name.'})
          return;
        }
      }
      newData[newData.length] = {name , money:Number(money)};
      let text=JSON.stringify(newData);
      let sql2 = `UPDATE public.members SET "data"='${text}' where "user_id" = '1';`;
      pool.query(sql2.toString(),(error,results)=>{
        if(error) {
          res.status(500).json({ error: error.message });
          throw error;
        }
        res.send({results:results.affectedRows,status:true});
      })
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
  
});

module.exports = router;
