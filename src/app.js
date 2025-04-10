const express = require('express');
const movRoutes = require('./routes/movimentacao-routes');

const app = express();
app.use(express.json());
app.use('/api/mov', movRoutes);
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

module.exports = app;