const express = require('express');
const movRoutes = require('./routes/movimentacao-routes');

const app = express();
app.use(express.json());
app.use('/api/mov', movRoutes);

module.exports = app;