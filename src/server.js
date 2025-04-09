const app = require('./app');
const { processarMovimentacoesAutomaticamente } = require('./services/movimentacao-service.js');

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Função para executar movimentações e registrar data/hora
function executarMovimentacao() {
  const dataHoraAtual = new Date().toLocaleString(); // Formato local de data e hora
  console.log(`[${dataHoraAtual}] Executando movimentações...`);
  processarMovimentacoesAutomaticamente();
}

// Executa imediatamente ao iniciar
executarMovimentacao();

// Agendamento para rodar a cada 1 minuto
setInterval(executarMovimentacao, 600000);
