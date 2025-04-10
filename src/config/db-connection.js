const oracledb = require('oracledb');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
}

oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_21_12/' });

async function connectOracle() {
  try {
    const connection = await oracledb.getConnection(config);
    return connection;
  } catch (error) {
    console.error('Erro ao conectar o banco de dados', error);
    throw error;
  }
};

module.exports = connectOracle;