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

router.post("/login", async (req, res) => {
  const { usernm , passwd } = req.body;
  try {
    let sql = `SELECT id FROM user_infm where usernm = '${usernm.toLowerCase()}' and passwd = '${passwd}';`
    pool.query(sql.toString(),(error,results)=>{
      if(error) {
        res.status(500).json({ status:false,error: error.message });
        throw error;
      }
      if(results.rows.length>0){
        res.send({status:true,usernm:usernm,_id:results.rows[0].id});
      }else{
        res.send({status:false,message:`Username ${usernm} doesn't exist please try register instead!`})
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status:false,error: error.message });
  }
});

router.get("/register", async (req, res) => {
  const { usernm , passwd } = req.query;
  try {
    let sql = `SELECT usernm FROM user_infm where usernm = '${usernm.toLowerCase()}';`
    pool.query(sql.toString(),(error,results)=>{
      if(error) {
        res.status(500).json({ status:false,error: error.message });
        throw error;
      }
      if(!results.rows.length > 0) {
        let sql2 = `INSERT INTO user_infm( usernm, passwd ) VALUES('${usernm.toLowerCase()}', '${passwd}');`
        pool.query(sql2.toString(),(error,results)=>{
          if(error) {
            res.status(500).json({ status:false,error: error.message });
            throw error;
          }
          res.send({status:true,message:"Registered success!"});
        })
      }else {
        res.send({status:false,message:"Username "+usernm+" is already existed!"});
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ status:false,error: error.message });
  }
});

module.exports = router;