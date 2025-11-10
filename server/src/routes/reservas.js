const express = require('express');
const {
  listReservas,
  reservasPorFecha,
  disponibilidad,
  createReserva,
  updateReserva,
  deleteReserva,
  reservasDelDia,
} = require('../controllers/reservaController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/', listReservas);
router.get('/fecha/:fecha', reservasPorFecha);
router.get('/disponibilidad', disponibilidad);
router.get('/hoy', reservasDelDia);
router.post('/', createReserva);
router.put('/:id', updateReserva);
router.delete('/:id', deleteReserva);

module.exports = router;
