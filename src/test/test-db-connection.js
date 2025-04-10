const askCredentials  = require('../utils/cli-auth.js');
const { connectOracle, getConnection } = require('../config/db-connection');

(async () => {
    const { user, password } = await askCredentials();
    await connectOracle(user, password);

    try {
        const connection = getConnection();
        const result = await connection.execute(`SELECT SYSDATE FROM DUAL`);
        console.log('Data atual do banco:', result.rows[0][0]);
    } catch (queryError) {
        console.error('Erro ao executar a query de teste:', queryError.message);
    }
})();