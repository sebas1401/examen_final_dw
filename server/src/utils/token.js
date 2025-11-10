const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function expirationForRole(rol) {
  return rol === 'ADMIN' ? 8 : 24;
}

async function createSession(usuario) {
  const hours = expirationForRole(usuario.rol);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: `${hours}h` }
  );
  await prisma.sesion.create({
    data: {
      usuarioId: usuario.id,
      token,
      fechaExpiracion: expiresAt,
    },
  });
  return { token, expira: expiresAt };
}

async function invalidateSession(token) {
  await prisma.sesion.deleteMany({ where: { token } });
}

module.exports = {
  JWT_SECRET,
  createSession,
  invalidateSession,
};
