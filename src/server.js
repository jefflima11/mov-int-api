const app = require('./app');
const { processarMovimentacoesAutomaticamente } = require('./services/movimentacao-service.js');
const askCredentials = require('./utils/cli-auth');
const { getConnection } = require('./config/db-connection');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    const { user, password } = await askCredentials();
    await getConnection(user, password);

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });

    // Executa a movimentação imediatamente e a cada 10 minutos
    executarMovimentacao();
    setInterval(executarMovimentacao, 600000);

  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error.message);
    process.exit(1);
  }
})();

function executarMovimentacao() {
  const dataHoraAtual = new Date().toLocaleString();
  console.log(`[${dataHoraAtual}] Executando movimentações...`);
  processarMovimentacoesAutomaticamente();
}
