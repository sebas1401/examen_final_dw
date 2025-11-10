const express = require('express');
const {
  register,
  login,
  logout,
  verificarEmail,
  solicitarRecuperacion,
  resetearPassword,
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/registro', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/verificar/:token', verificarEmail);
router.post('/recuperar-password', solicitarRecuperacion);
router.post('/resetear-password', resetearPassword);

module.exports = router;

