require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const mesasRoutes = require('./routes/mesas');
const reservasRoutes = require('./routes/reservas');
const clientesRoutes = require('./routes/clientes');

const app = express();

app.use(express.json());

const origin = process.env.FRONTEND_ORIGIN || '*';
app.use(
  cors({
    origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/mesas', mesasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/clientes', clientesRoutes);

app.use(errorHandler);

module.exports = app;

