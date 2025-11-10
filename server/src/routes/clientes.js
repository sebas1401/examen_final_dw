const express = require('express');
const {
  listClientes,
  createCliente,
  getHistorial,
  getMiPerfil,
  actualizarMiPerfil,
  getMisReservas,
  crearReservaCliente,
  actualizarReservaCliente,
  cancelarReservaCliente,
  historialCliente,
  disponibilidadCliente,
} = require('../controllers/clienteController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Endpoints cliente autenticado
router.get('/mi-perfil', authenticateToken, authorizeRole('CLIENTE'), getMiPerfil);
router.put('/mi-perfil', authenticateToken, authorizeRole('CLIENTE'), actualizarMiPerfil);
router.get('/mis-reservas', authenticateToken, authorizeRole('CLIENTE'), getMisReservas);
router.post('/reservas', authenticateToken, authorizeRole('CLIENTE'), crearReservaCliente);
router.put('/reservas/:id', authenticateToken, authorizeRole('CLIENTE'), actualizarReservaCliente);
router.delete('/reservas/:id', authenticateToken, authorizeRole('CLIENTE'), cancelarReservaCliente);
router.get('/historial', authenticateToken, authorizeRole('CLIENTE'), historialCliente);
router.get('/disponibilidad', authenticateToken, authorizeRole('CLIENTE'), disponibilidadCliente);

// Admin
router.get('/', authenticateToken, authorizeRole('ADMIN'), listClientes);
router.post('/', authenticateToken, authorizeRole('ADMIN'), createCliente);
router.get('/:id/historial', authenticateToken, authorizeRole('ADMIN'), getHistorial);

module.exports = router;
