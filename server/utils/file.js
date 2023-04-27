const fs = require('fs');
const config_db = process.env.CONFIG_DERECTORY_DB

const getDBConfig = ()=>{
    let rawdata = fs.readFileSync(config_db);
    let data = JSON.parse(rawdata);
    return data;
}

module.exports = {
    getDBConfig,
}