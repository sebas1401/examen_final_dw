const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../prisma');
const {
  registroSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} = require('../validators/schemas');
const { createSession, invalidateSession } = require('../utils/token');
const { sendEmail, buildUrl } = require('../utils/emailService');

function sanitizeUser(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

async function register(req, res, next) {
  try {
    const data = registroSchema.parse(req.body);
    const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'El correo ya esta registrado' });

    const hashed = await bcrypt.hash(data.password, 10);
    const verificationToken = `VERIFY:${crypto.randomUUID()}`;
    const usuario = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashed,
        telefono: data.telefono,
        rol: 'CLIENTE',
        tokenRecuperacion: verificationToken,
      },
    });
    await prisma.cliente.create({
      data: {
        usuarioId: usuario.id,
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email,
      },
    });
    const verificationCode = verificationToken.split(':')[1];
    await sendEmail({
      to: data.email,
      subject: 'Verifica tu cuenta',
      html: `<p>Hola ${data.nombre},</p><p>Gracias por registrarte. Haz clic en el siguiente enlace para verificar tu correo:</p><p><a href="${buildUrl(`/verificar/${verificationCode}`)}">Verificar correo</a></p>`,
    });
    const { token } = await createSession(usuario);
    res.status(201).json({
      token,
      usuario: sanitizeUser(usuario),
      mensaje: 'Registro exitoso. Revisa tu correo para verificar la cuenta.',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const usuario = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales invalidas' });
    const valid = await bcrypt.compare(data.password, usuario.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales invalidas' });
    if (!usuario.activo) return res.status(403).json({ error: 'Cuenta desactivada' });
    const { token } = await createSession(usuario);
    res.json({ token, usuario: sanitizeUser(usuario) });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.token) await invalidateSession(req.token);
    res.json({ message: 'Sesion cerrada' });
  } catch (err) {
    next(err);
  }
}

async function verificarEmail(req, res, next) {
  try {
    const { token } = req.params;
    const usuario = await prisma.usuario.findFirst({
      where: { tokenRecuperacion: `VERIFY:${token}` },
    });
    if (!usuario) return res.status(400).json({ error: 'Token invalido' });
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { emailVerificado: true, tokenRecuperacion: null },
    });
    res.json({ message: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
}

async function solicitarRecuperacion(req, res, next) {
  try {
    const { email } = passwordResetRequestSchema.parse(req.body);
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.json({ message: 'Si el correo existe recibirás instrucciones' });
    const token = crypto.randomUUID();
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tokenRecuperacion: `RESET:${token}` },
    });
    await sendEmail({
      to: email,
      subject: 'Recuperación de contraseña',
      html: `<p>Hola ${usuario.nombre},</p>
             <p>Recibimos una solicitud para restablecer tu contraseña. Sigue este enlace:</p>
             <p><a href="${buildUrl(`/resetear/${token}`)}">Restablecer contraseña</a></p>
             <p>Si no solicitaste este cambio, ignora el mensaje.</p>`,
    });
    res.json({ message: 'Hemos enviado instrucciones a tu correo' });
  } catch (err) {
    next(err);
  }
}

async function resetearPassword(req, res, next) {
  try {
    const { token, nuevaPassword } = passwordResetSchema.parse(req.body);
    const usuario = await prisma.usuario.findFirst({ where: { tokenRecuperacion: `RESET:${token}` } });
    if (!usuario) return res.status(400).json({ error: 'Token no valido' });
    const hashed = await bcrypt.hash(nuevaPassword, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashed, tokenRecuperacion: null },
    });
    res.json({ message: 'Password actualizado' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  verificarEmail,
  solicitarRecuperacion,
  resetearPassword,
};
