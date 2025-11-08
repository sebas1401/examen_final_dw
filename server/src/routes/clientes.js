const express = require('express');
const { listClientes, createCliente, getHistorial } = require('../controllers/clienteController');

const router = express.Router();

router.get('/', listClientes);
router.post('/', createCliente);
router.get('/:id/historial', getHistorial);

module.exports = router;

