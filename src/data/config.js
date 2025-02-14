require("dotenv").config();
const oracledb = require("oracledb");

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTIONSTRING,
}

oracledb.initOracleClient({ libDir: '' });

async function getConnection() {
    try {
        const connection= await oracledb.getConnection(config);
        console.log('Banco de dados Oracle conectado com sucesso!');
        return connection;
    } catch (err) {
        console.error('Erro ao conectar com o banco de dados Oracle: ', err);
        throw err;
    }
};

module.exports = { getConnection };