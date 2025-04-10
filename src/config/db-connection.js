const oracledb = require('oracledb');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
}

let connection 

try {
  if (process.env.ORACLE_CLIENTE_LIB_DIR) {
    oracle.initOracleClient({ libDir: process.env.ORACLE_CLIENTE_LIB_DIR });
  }
} catch (err) {
  console.warn('initOracleCliente falhou (0possivelmente desnecessário no seu ambiente:', err.message);
}

async function connectOracle(user, password) {
  try {
    connection = await oracledb.getConnection({
      user,
      password,
      connectString: process.env.DB_CONNECTION_STRING,
    });
    console.log('Conectado ao banco de dados Oracle com sucesso!')
  } catch (error) {
    console.error('Erro ao conectar o banco de dados', error.message);
    process.exit(1);
  }
};


function getConnection() {
  if(!connection) {
    throw new Error('Conexão ainda não foi estabelecida.');
  }
  return connection;
}
module.exports = {
  connectOracle,
  getConnection
};