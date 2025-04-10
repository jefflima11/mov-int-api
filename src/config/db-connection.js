const oracledb = require('oracledb');
require('dotenv').config();

let connection;

try {
  if (process.env.ORACLE_CLIENT_LIB_DIR) {
    oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
    console.log('Oracle Instant Client iniciado (modo Thick)');
    console.log('Modo atual do OracleDB:', oracledb.thin ? 'Thin' : 'Thick');
  }
} catch (err) {
  console.warn('initOracleClient falhou (possivelmente desnecessário no seu ambiente):', err.message);
}

async function connectOracle(user, password) {
  try {
    connection = await oracledb.getConnection({
      user,
      password,
      connectString: process.env.DB_CONNECT_STRING,
    });
    console.log('Conectado ao banco de dados Oracle com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar o banco de dados:', error.message);
    process.exit(1);
  }
}

function getConnection() {
  if (!connection) {
    throw new Error('Conexão ainda não foi estabelecida.');
  }
  return connection;
}

module.exports = {
  connectOracle,
  getConnection,
};