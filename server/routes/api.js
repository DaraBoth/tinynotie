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
    let sql = `SELECT id, grp_name, status, discription, admin_id, create_date FROM grp_infm where admin_id='${user_id}' order by id;`
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

router.post("/addGroupByUserId", async (req, res) => {
  const { user_id, grp_name, status = 1, discription, member } = req.body;
  const create_date = format(new Date());
  const newMember = JSON.parse(member);
  try {
    let sql = '';
    sql += `DO $$`;
    sql += `DECLARE`;
    sql += `  group_id INT;`;
    sql += `BEGIN`;
    sql += `  INSERT INTO grp_infm (`;
    sql += `    grp_name,`;
    sql += `    status,`;
    sql += `    discription,`;
    sql += `    admin_id,`;
    sql += `    create_date`;
    sql += `  ) VALUES('${grp_name}', ${status}, '${discription}', ${user_id}, '${create_date}') RETURNING id INTO group_id; `;
    for (let i in newMember) {
      sql += `INSERT INTO member_infm (`
      sql += `    mem_name,`
      sql += `    paid,`
      sql += `    group_id,`
      sql += `    trp_id`
      sql += `) VALUES('${newMember[i]}', 0, group_id, null);`;
    }
    sql += `END $$;`;
    sql += `SELECT MAX(id) as id from grp_infm; `;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results[1].rows[0] });
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }

});

router.post("/addTripByGroupId", async (req, res) => {
  const { trp_name, spend, admn_id, mem_id, discription, group_id } = req.body;
  const create_date = format(new Date());
  try {
    let sql = `SELECT id, trp_name, spend, admn_id, mem_id, discription, group_id, create_date FROM trp_infm where group_id='${group_id}' and trp_name='${trp_name}';`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      if (!results.rows.length > 0) {
        let sql2 = `INSERT INTO trp_infm
        (trp_name, spend, admn_id, mem_id, discription, group_id, create_date)
        VALUES('${trp_name}', ${spend}, ${admn_id}, '${mem_id}', '${discription}', ${group_id}, '${create_date}');`
        pool.query(sql2.toString(), (error, results) => {
          if (error) {
            res.status(500).json({ status: false, error: error.message });
            throw error;
          }
          res.send({ status: true, message: "Add trip success!" });
        })
      } else {
        res.send({ status: false, message: "Trip " + trp_name + " is already existed!" });
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/editTripByGroupId", async (req, res) => {
  const { trp_name, spend, group_id } = req.body;
  try {
    let sql = `SELECT id FROM trp_infm where group_id='${group_id}' and trp_name='${trp_name}';`
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      if(results.rows[0]?.id) {
        let sql2 = `UPDATE trp_infm SET spend=${spend} WHERE id=${results.rows[0].id};`
        pool.query(sql2.toString(),(error,results)=>{
          if(error) {
            res.status(500).json({ status:false,error: error.message });
            throw error;
          }
          res.send({status:true,message:"Edit "+trp_name+" success!"});
        })
      }else {
        res.send({status:false,message:"Username "+usernm+" is already existed!"});
      }
    })
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getAllTrip", async (req, res) => {
  try {
    let sql = `SELECT id, trp_name, spend, admn_id, mem_id, discription, group_id, create_date
    FROM trp_infm;`
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
    let sql = `SELECT id, trp_name, spend, admn_id, mem_id, discription, group_id, create_date FROM trp_infm where group_id='${group_id}';`
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

router.get("/getAllMember", async (req, res) => {
  try {
    let sql = `SELECT DISTINCT mem_name FROM member_infm order by mem_name;`
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
    let sql = `SELECT id, mem_name, paid, group_id, trp_id FROM member_infm where group_id='${group_id}' order by id;`
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
  const { group_id, paid, mem_name } = req.body;
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
  const { user_id, paid } = req.body;
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

function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}