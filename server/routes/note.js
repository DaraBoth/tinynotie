import pg from "pg"
import express from "express"

const router = express.Router();
const Pool = pg.Pool
const pool = new Pool({
  user : "kjjelxjh",
  host : "chunee.db.elephantsql.com",
  database : "kjjelxjh",
  password : "lfrM5dzzIODpETfrSmRskIGZ-W8kAeg-",
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
    if(!name || !money || !user_id){
      res.status(200).json({status:false,message:'Error name = '+name+' money = '+money})
      return;
    }
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
      let sql2 = `UPDATE public.members SET "data"='${text}' where "user_id" = '${user_id}';`;
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

router.get("/editMember", async (req, res) => {
  const { user_id } = req.query;
  const {editName , editMoney} = JSON.parse(req.query.member);
  try {
    if(!editName || !editMoney || !user_id){
      res.status(200).json({status:false,message:'Error name = '+editName+' money = '+editMoney})
      return;
    }
    let sql = `SELECT "data" FROM public.members where user_id='${user_id}';`
      pool.query(sql.toString(),(error,results)=>{
        if(error) {
          res.status(500).json({ error: error.message });
          throw error;
        }
      let newData = JSON.parse(results.rows[0].data)
      let deleted = false;
      for(let i in newData){ 
        if(newData[i].name === editName){
          newData[i].money = editMoney;
          deleted = true;
        }
      }
      if(deleted){
        let text=JSON.stringify(newData);
        let sql2 = `UPDATE public.members SET "data"='${text}' where "user_id" = '${user_id}';`;
        pool.query(sql2.toString(),(error,results)=>{
          if(error) {
            res.status(500).json({ error: error.message });
            throw error;
          }
          res.send({results:results.affectedRows,status:true});
        })
      }else{
        res.status(200).json({status:false,message:'Could not found member name '+editName+'. Are you sure this member is exist?'})
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
  
});

router.get("/deleteMember", async (req, res) => {
  const { user_id , name } = req.query;
  try {
    let sql = `SELECT "data" FROM public.members where user_id='${user_id}';`
      pool.query(sql.toString(),(error,results)=>{
        if(error) {
          res.status(500).json({ error: error.message });
          throw error;
        }
      let newData = JSON.parse(results.rows[0].data)
      let deleted = false;
      for(let i in newData){ 
        if(newData[i].name === name){
          newData.splice(i,1);
          deleted = true;
        }
      }
      if(deleted){
        let text=JSON.stringify(newData);
        let sql2 = `UPDATE public.members SET "data"='${text}' where "user_id" = '${user_id}';`;
        pool.query(sql2.toString(),(error,results)=>{
          if(error) {
            res.status(500).json({ error: error.message });
            throw error;
          }
          res.send({results:results.affectedRows,status:true});
        })
      }else{
        res.status(200).json({status:false,message:'Could not found member name '+name+'. Are you sure this member is exist?'})
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
  
});

module.exports = router;
