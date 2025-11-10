const express = require('express');
const { listMesas, createMesa, updateMesa, deleteMesa } = require('../controllers/mesaController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listMesas);
router.post('/', authenticateToken, authorizeRole('ADMIN'), createMesa);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), updateMesa);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), deleteMesa);

module.exports = router;
