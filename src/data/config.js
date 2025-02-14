require("dotenv").config();
const oracledb = require("oracledb");

async function getConnection() {
    return await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTIONSTRING,
    });
}

module.exports = { getConnection };