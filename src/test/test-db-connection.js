const askCredentials = require('../utils/cli-auth.js');
const { getConnection } = require('../config/db-connection');

(async () => {
  const { user, password } = await askCredentials();

  try {
    const connection = await getConnection(user, password);
    const result = await connection.execute(`SELECT SYSDATE FROM DUAL`);
    console.log('Data atual do banco:', result.rows[0][0]);
    await connection.close();
  } catch (queryError) {
    console.error('Erro ao executar a query de teste:', queryError.message);
  }
})();
