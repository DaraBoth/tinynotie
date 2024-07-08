import pg from "pg";
import express from "express";
import axios from "axios";

const router = express.Router();
const Pool = pg.Pool;
const pool = new Pool({
  user: "kjjelxjh",
  host: "chunee.db.elephantsql.com",
  database: "kjjelxjh",
  password: "lfrM5dzzIODpETfrSmRskIGZ-W8kAeg-",
  port: 5432,
});


router.get("/test_db_online", async (req, res) => {
  const { user, host, database, password, port, sql } = req.query;
  try {
    const testPool = new Pool({
      user: user,
      host: host,
      database: database,
      password: password,
      port: port,
    })
    testPool.query(sql.toString(), (error, results) => {
      if (error) {
        console.log({error});
        res.status(500).json({ error: error.message });
        throw error;
      }
      console.log({sql});
      console.log({data: results.rows});
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getGroupByUserId", async (req, res) => {
  const { user_id } = req.query;
  try {
    let sql = `SELECT id, grp_name, status, description, admin_id, create_date FROM grp_infm where admin_id=${Number(
      user_id
    )} order by id DESC;`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/addGroupByUserId", async (req, res) => {
  const { user_id, grp_name, status = 1, description, member } = req.body;
  const create_date = format(new Date());
  const newMember = JSON.parse(member);
  try {
    let sql = "";
    sql += `DO $$`;
    sql += `DECLARE`;
    sql += `  group_id INT;`;
    sql += `BEGIN`;
    sql += `  INSERT INTO grp_infm (`;
    sql += `    grp_name,`;
    sql += `    status,`;
    sql += `    description,`;
    sql += `    admin_id,`;
    sql += `    create_date`;
    sql += `  ) VALUES('${grp_name}', ${status}, '${description}', ${user_id}, '${create_date}') RETURNING id INTO group_id; `;
    for (let i in newMember) {
      sql += `INSERT INTO member_infm (`;
      sql += `    mem_name,`;
      sql += `    paid,`;
      sql += `    group_id`;
      sql += `) VALUES('${newMember[i]}', 0, group_id);`;
    }
    sql += `END $$;`;
    sql += `SELECT MAX(id) as id from grp_infm; `;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results[1].rows[0] });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/addTripByGroupId", async (req, res) => {
  const { trp_name, spend, mem_id, description, group_id } = req.body;
  const create_date = format(new Date());
  try {
    let sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date FROM trp_infm where group_id='${group_id}' and trp_name='${trp_name}';`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      if (!results.rows.length > 0) {
        let sql2 = `INSERT INTO trp_infm
        (trp_name, spend, mem_id, description, group_id, create_date)
        VALUES('${trp_name}', ${spend}, '${mem_id}', '${description}', ${group_id}, '${create_date}');`;
        pool.query(sql2.toString(), (error, results) => {
          if (error) {
            res.status(500).json({ status: false, error: error.message });
            throw error;
          }
          res.send({ status: true, message: "Add trip success!" });
        });
      } else {
        res.send({
          status: false,
          message: "Trip " + trp_name + " is already existed!",
        });
      }
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/editTripByGroupId", async (req, res) => {
  const { trp_name, spend, group_id } = req.body;
  try {
    let sql = `SELECT id FROM trp_infm where group_id='${group_id}' and trp_name='${trp_name}';`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      if (results.rows[0]?.id) {
        let sql2 = `UPDATE trp_infm SET spend=${spend} WHERE id=${results.rows[0].id};`;
        pool.query(sql2.toString(), (error, results) => {
          if (error) {
            res.status(500).json({ status: false, error: error.message });
            throw error;
          }
          res.send({ status: true, message: "Edit " + trp_name + " success!" });
        });
      } else {
        res.send({
          status: false,
          message: "Username " + usernm + " is already existed!",
        });
      }
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/editTripMem", async (req, res) => {
  const { trp_id, trp_name, group_id, mem_id } = req.body;
  try {
    let sql = `UPDATE trp_infm SET mem_id='${mem_id}' WHERE id=${trp_id};`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ status: false, error: error.message });
        throw error;
      }
      res.send({ status: true, message: "Edit " + trp_name + " success!" });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});
router.post("/editTripByGroupId", async (req, res) => {
  const { trp_name, spend, group_id } = req.body;
  try {
    let sql = `SELECT id FROM trp_infm where group_id='${group_id}' and trp_name='${trp_name}';`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      if (results.rows[0]?.id) {
        let sql2 = `UPDATE trp_infm SET spend=${spend} WHERE id=${results.rows[0].id};`;
        pool.query(sql2.toString(), (error, results) => {
          if (error) {
            res.status(500).json({ status: false, error: error.message });
            throw error;
          }
          res.send({ status: true, message: "Edit " + trp_name + " success!" });
        });
      } else {
        res.send({
          status: false,
          message: "Username " + usernm + " is already existed!",
        });
      }
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getAllTrip", async (req, res) => {
  try {
    let sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date
    FROM trp_infm;`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getTripByGroupId", async (req, res) => {
  const { group_id } = req.query;
  try {
    let sql = `SELECT id, trp_name, spend, mem_id, description, group_id, create_date FROM trp_infm where group_id='${group_id}' order by id;`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      if (results.rows.length === 0) {
        res.send({ status: true, data: [] });
      } else {
        res.send({ status: true, data: results.rows });
      }
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getAllMember", async (req, res) => {
  try {
    let sql = `SELECT DISTINCT mem_name FROM member_infm where mem_name not like '%test%' and mem_name not like '%asd%' order by mem_name;`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/getMemberByGroupId", async (req, res) => {
  const { group_id } = req.query;
  try {
    let sql = `SELECT id, mem_name, paid, group_id FROM member_infm where group_id='${group_id}' order by id;`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/members/:id", async (req, res) => {
  const id = req.params.id;
  try {
    let sql = `DELETE FROM member_infm WHERE id=${id};`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, message: `Delete success !` });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/addMemberByGroupId", async (req, res) => {
  const { group_id, paid, mem_name } = req.body;
  try {
    let sql = `INSERT INTO member_infm (mem_name, paid, group_id) VALUES('${mem_name}', ${paid}, ${group_id});`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});
router.post("/editMemberByMemberId", async (req, res) => {
  const { user_id, paid } = req.body;
  try {
    let sql = `UPDATE member_infm
    SET paid=${paid} WHERE id='${user_id}';`;
    pool.query(sql.toString(), (error, results) => {
      if (error) {
        res.status(500).json({ error: error.message });
        throw error;
      }
      res.send({ status: true, data: results.rows });
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/post/list", async (req, res) => {
  const { companyId, projectId, categoryId, status, size, sort } = req.query;
  console.log({ companyId, projectId, categoryId, status, size, sort });
  let baseURL = `https://eboard-api.kosign.dev/api/v1/openapi/post/list?`;
  baseURL += `companyId=${companyId}&`;
  baseURL += `&projectId=${projectId}`;
  baseURL += `&categoryId=${categoryId}`;
  baseURL += status ? `&status=${status}` : "";
  baseURL += size ? `&size=${size}` : "";
  baseURL += sort ? `&sort=${sort}` : "";
  try {
    axios.get(baseURL).then((response) => {
      res.send(response.data);
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

function format(date) {
  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument. You must pass a date instance');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
