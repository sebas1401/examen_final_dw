const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const prisma = require('../prisma');
const {
  clienteSchema,
  perfilClienteUpdateSchema,
  reservaClienteSchema,
} = require('../validators/schemas');
const { combineDateTime, isDateTimeInPast } = require('../utils/datetime');
const { isTableAvailable, isWithinWorkingHours, getAvailabilityByDate } = require('../services/availabilityService');
const { sendReservationConfirmation } = require('../utils/emailService');
const { normalizeReserva } = require('../utils/reservaFormatter');

async function listClientes(req, res, next) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: { usuario: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clientes);
  } catch (err) {
    next(err);
  }
}

async function createCliente(req, res, next) {
  try {
    const data = clienteSchema.parse(req.body);
    const existing = await prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'El correo ya existe' });
    const hashed = await bcrypt.hash(data.password || 'Cliente123*', 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashed,
        telefono: data.telefono,
        rol: 'CLIENTE',
        emailVerificado: true,
      },
    });
    const cliente = await prisma.cliente.create({ data: { usuarioId: usuario.id, nombre: data.nombre, telefono: data.telefono, email: data.email } });
    res.status(201).json({ usuario, cliente });
  } catch (err) {
    next(err);
  }
}

async function getHistorial(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { usuario: true, reservas: { orderBy: { fechaHora: 'desc' }, include: { mesa: true } } },
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (err) {
    next(err);
  }
}

async function fetchClienteByUsuarioId(usuarioId) {
  return prisma.cliente.findUnique({ where: { usuarioId }, include: { usuario: true } });
}

async function getMiPerfil(req, res, next) {
  try {
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({
      usuario: {
        nombre: cliente.usuario.nombre,
        email: cliente.usuario.email,
        telefono: cliente.usuario.telefono,
        fechaRegistro: cliente.usuario.fechaRegistro,
        rol: cliente.usuario.rol,
      },
      cliente: {
        puntosFidelidad: cliente.puntosFidelidad,
        nivelCliente: cliente.nivelCliente,
        preferencias: cliente.preferencias,
        totalReservas: cliente.totalReservas,
        reservasCanceladas: cliente.reservasCanceladas,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function actualizarMiPerfil(req, res, next) {
  try {
    const payload = perfilClienteUpdateSchema.parse(req.body);
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    if (payload.nombre || payload.telefono) {
      await prisma.usuario.update({
        where: { id: cliente.usuarioId },
        data: {
          nombre: payload.nombre || cliente.usuario.nombre,
          telefono: payload.telefono || cliente.usuario.telefono,
        },
      });
    }
    const updated = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        preferencias: payload.preferencias || cliente.preferencias,
        nombre: payload.nombre || cliente.nombre,
        telefono: payload.telefono || cliente.telefono,
      },
      include: { usuario: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getMisReservas(req, res, next) {
  try {
    const { estado } = req.query;
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    const where = { clienteId: cliente.id };
    if (estado) where.estado = estado.toUpperCase();
    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: { fechaHora: 'desc' },
      include: { mesa: true },
    });
    res.json(reservas.map(normalizeReserva));
  } catch (err) {
    next(err);
  }
}

async function crearReservaCliente(req, res, next) {
  try {
    const body = reservaClienteSchema.parse(req.body);
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    if (!body.mesaId) return res.status(400).json({ error: 'Debe seleccionar una mesa disponible' });
    if (!isWithinWorkingHours(body.hora)) return res.status(400).json({ error: 'Hora fuera del horario laboral' });
    if (isDateTimeInPast(body.fecha, body.hora)) return res.status(400).json({ error: 'No se pueden reservar horarios pasados' });
    const mesa = await prisma.mesa.findUnique({ where: { id: body.mesaId } });
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    if (body.numeroPersonas > mesa.capacidad) return res.status(400).json({ error: 'Capacidad insuficiente' });
    const disponible = await isTableAvailable(body.mesaId, body.fecha, body.hora);
    if (!disponible) return res.status(400).json({ error: 'La mesa ya esta reservada' });
    const fechaHora = combineDateTime(body.fecha, body.hora).toDate();
    const reserva = await prisma.reserva.create({
      data: {
        clienteId: cliente.id,
        mesaId: body.mesaId,
        fechaHora,
        numeroPersonas: body.numeroPersonas,
        comentarios: body.comentarios,
        preferenciaZona: body.preferenciaZona || 'SIN_PREFERENCIA',
      },
      include: { mesa: true, cliente: { include: { usuario: true } } },
    });
    await prisma.cliente.update({ where: { id: cliente.id }, data: { puntosFidelidad: cliente.puntosFidelidad + 10 } });
    try {
      await sendReservationConfirmation({
        to: reserva.cliente?.usuario?.email,
        nombre: reserva.cliente?.usuario?.nombre,
        fechaHora: reserva.fechaHora,
        mesa: reserva.mesa?.numero,
        personas: reserva.numeroPersonas,
        comentarios: reserva.comentarios,
        preferenciaZona: reserva.preferenciaZona,
      });
    } catch (err) {
      console.error('[email] Error al enviar confirmación de reserva de cliente', err);
    }
    res.status(201).json(reserva);
  } catch (err) {
    next(err);
  }
}

async function actualizarReservaCliente(req, res, next) {
  try {
    const body = reservaClienteSchema.partial().parse(req.body);
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    const reserva = await prisma.reserva.findUnique({ where: { id: Number(req.params.id) } });
    if (!reserva || reserva.clienteId !== cliente.id) return res.status(404).json({ error: 'Reserva no encontrada' });

    const data = {};
    if (body.numeroPersonas) data.numeroPersonas = body.numeroPersonas;
    if (body.comentarios !== undefined) data.comentarios = body.comentarios;
    if (body.preferenciaZona) data.preferenciaZona = body.preferenciaZona;

    if (body.mesaId || body.fecha || body.hora) {
      const mesaId = body.mesaId || reserva.mesaId;
      const fecha = body.fecha || dayjs(reserva.fechaHora).format('YYYY-MM-DD');
      const hora = body.hora || dayjs(reserva.fechaHora).format('HH:mm');
      if (!isWithinWorkingHours(hora)) return res.status(400).json({ error: 'Hora fuera del horario laboral' });
      const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
      if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
      if (data.numeroPersonas && data.numeroPersonas > mesa.capacidad) {
        return res.status(400).json({ error: 'Capacidad insuficiente' });
      }
      const targetFechaHora = combineDateTime(fecha, hora).toDate();
      const disponible = await prisma.reserva.findFirst({
        where: {
          id: { not: reserva.id },
          mesaId,
          fechaHora: targetFechaHora,
          estado: { not: 'CANCELADA' },
        },
      });
      if (disponible) return res.status(400).json({ error: 'La mesa ya esta reservada' });
      data.mesaId = mesaId;
      data.fechaHora = targetFechaHora;
    }

    const updated = await prisma.reserva.update({ where: { id: reserva.id }, data, include: { mesa: true } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function cancelarReservaCliente(req, res, next) {
  try {
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    const reserva = await prisma.reserva.findUnique({ where: { id: Number(req.params.id) } });
    if (!reserva || reserva.clienteId !== cliente.id) return res.status(404).json({ error: 'Reserva no encontrada' });
    const updated = await prisma.reserva.update({ where: { id: reserva.id }, data: { estado: 'CANCELADA' } });
    await prisma.cliente.update({ where: { id: cliente.id }, data: { reservasCanceladas: cliente.reservasCanceladas + 1 } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function historialCliente(req, res, next) {
  try {
    const cliente = await fetchClienteByUsuarioId(req.usuario.id);
    if (!cliente) return res.status(404).json({ error: 'Perfil no encontrado' });
    const now = new Date();
    const reservas = await prisma.reserva.findMany({
      where: { clienteId: cliente.id },
      orderBy: { fechaHora: 'desc' },
      include: { mesa: true },
    });
    res.json({
      reservasPasadas: reservas.filter((r) => r.fechaHora < now),
      reservasFuturas: reservas.filter((r) => r.fechaHora >= now),
      estadisticas: {
        totalVisitas: cliente.totalReservas,
        ultimaVisita: cliente.ultimaVisita,
        puntosAcumulados: cliente.puntosFidelidad,
        canceladas: cliente.reservasCanceladas,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function disponibilidadCliente(req, res, next) {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: 'Fecha requerida' });
    const data = await getAvailabilityByDate(fecha);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
