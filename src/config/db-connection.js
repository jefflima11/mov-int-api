const oracledb = require('oracledb');
require('dotenv').config();

// Tenta usar o modo "thick"
try {
  oracledb.initOracleClient({ libDir: 'C:/oracle/instantclient_21_12/' });
  console.log('Modo thick ativado');
} catch (err) {
  console.warn('⚠️ Modo thick não ativado:', err);
}


const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const connectString = process.env.DB_CONNECT_STRING;

console.log('[DEBUG] DB_CONNECT_STRING:', connectString);

const dbConfig = {
  user,
  password,
  connectString,
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1,
};

let connectionPool;

async function createPool(customUser, customPassword) {
  try {
    connectionPool = await oracledb.createPool({
      ...dbConfig,
      user: customUser || dbConfig.user,
      password: customPassword || dbConfig.password,
    });
    console.log('✅ Pool de conexões criado com sucesso');
  } catch (err) {
    console.error('❌ Erro ao criar o pool de conexões:', err);
    throw err;
  }
}

async function getConnection(user, password) {
  if (!connectionPool) {
    await createPool(user, password);
  }
  return await connectionPool.getConnection();
}


module.exports = {
  getConnection,
};
