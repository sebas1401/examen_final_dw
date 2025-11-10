const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../utils/token');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const session = await prisma.sesion.findUnique({ where: { token } });
    if (!session) return res.status(401).json({ error: 'Sesion invalida' });
    if (new Date(session.fechaExpiracion) < new Date()) {
      await prisma.sesion.deleteMany({ where: { token } });
      return res.status(401).json({ error: 'Sesion expirada' });
    }
    req.usuario = payload;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario || (roles.length && !roles.includes(req.usuario.rol))) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRole,
};
