const app = require('./app');
const { processarMovimentacoesAutomaticamente } = require('./services/movimentacao-service.js');

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Agendamento de consulta automatica
setInterval(() => {
  processarMovimentacoesAutomaticamente();
}, 60000); // 1 minuto