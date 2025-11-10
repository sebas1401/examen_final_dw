const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const prisma = require('../prisma');
const { reservaCreateSchema, reservaUpdateSchema } = require('../validators/schemas');
const { getAvailabilityByDate, isTableAvailable, isWithinWorkingHours } = require('../services/availabilityService');
const { combineDateTime, isDateTimeInPast } = require('../utils/datetime');
const { sendReservationConfirmation, sendCancellationNotice, PLACEHOLDER_EMAIL_DOMAIN } = require('../utils/emailService');

const PLACEHOLDER_EMAIL_PREFIX = 'cliente';

function mapReserva(reserva) {
  const usuario = reserva.cliente?.usuario;
  const fechaHoraLocal = dayjs(reserva.fechaHora).format('YYYY-MM-DDTHH:mm:ss');
  return {
    ...reserva,
    fechaHora: fechaHoraLocal,
    motivoCancelacion: reserva.motivoCancelacion,
    cliente: {
      ...reserva.cliente,
      nombre: usuario?.nombre || reserva.cliente?.nombre,
      telefono: usuario?.telefono || reserva.cliente?.telefono,
      email: usuario?.email || reserva.cliente?.email,
    },
  };
}

async function ensureClienteRecord(clientePayload) {
  if (!clientePayload) return null;
  const nombre = clientePayload.nombre?.trim() || 'Cliente restaurante';
  const telefono = clientePayload.telefono?.trim() || '';
  let email = clientePayload.email?.trim();

  let usuario = email ? await prisma.usuario.findUnique({ where: { email } }) : null;

  if (!usuario) {
    if (!email) {
      const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      email = `${PLACEHOLDER_EMAIL_PREFIX}-${uniqueId}@${PLACEHOLDER_EMAIL_DOMAIN}`;
    }
    const randomPassword = crypto.randomBytes(10).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        telefono,
        password: hashedPassword,
        rol: 'CLIENTE',
        emailVerificado: Boolean(clientePayload.email),
      },
    });
  } else {
    const updates = {};
    if (clientePayload.nombre && clientePayload.nombre !== usuario.nombre) updates.nombre = clientePayload.nombre;
    if (clientePayload.telefono && clientePayload.telefono !== usuario.telefono) updates.telefono = clientePayload.telefono;
    if (Object.keys(updates).length) {
      usuario = await prisma.usuario.update({ where: { id: usuario.id }, data: updates });
    }
  }

  let cliente = await prisma.cliente.findUnique({ where: { usuarioId: usuario.id } });
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        usuarioId: usuario.id,
        nombre,
        telefono,
        email: clientePayload.email || usuario.email,
      },
    });
  } else {
    const clienteUpdates = {};
    if (clientePayload.nombre && clientePayload.nombre !== cliente.nombre) clienteUpdates.nombre = clientePayload.nombre;
    if (clientePayload.telefono && clientePayload.telefono !== cliente.telefono) clienteUpdates.telefono = clientePayload.telefono;
    if (clientePayload.email && clientePayload.email !== cliente.email) clienteUpdates.email = clientePayload.email;
    if (Object.keys(clienteUpdates).length) {
      cliente = await prisma.cliente.update({ where: { id: cliente.id }, data: clienteUpdates });
    }
  }
  return cliente;
}

async function notifyReservaConfirmada(reserva) {
  const correo = reserva.cliente?.usuario?.email || reserva.cliente?.email;
  if (!correo) return;
  try {
    await sendReservationConfirmation({
      to: correo,
      nombre: reserva.cliente?.usuario?.nombre || reserva.cliente?.nombre,
      fechaHora: reserva.fechaHora,
      mesa: reserva.mesa?.numero,
      personas: reserva.numeroPersonas,
      comentarios: reserva.comentarios,
      preferenciaZona: reserva.preferenciaZona,
    });
  } catch (err) {
    console.error('[email] Error al enviar confirmación de reserva', err);
  }
}

async function listReservas(req, res, next) {
  try {
    const reservas = await prisma.reserva.findMany({
      orderBy: { fechaHora: 'asc' },
      include: { cliente: { include: { usuario: true } }, mesa: true },
    });
    res.json(reservas.map(mapReserva));
  } catch (err) {
    next(err);
  }
}

async function reservasPorFecha(req, res, next) {
  try {
    const fecha = req.params.fecha;
    const from = dayjs(`${fecha}T00:00:00`).toDate();
    const to = dayjs(`${fecha}T23:59:59`).toDate();
    const reservas = await prisma.reserva.findMany({
      where: {
        fechaHora: { gte: from, lte: to },
        estado: { not: 'CANCELADA' },
      },
      orderBy: { fechaHora: 'asc' },
      include: { cliente: { include: { usuario: true } }, mesa: true },
    });
    res.json(reservas.map(mapReserva));
  } catch (err) {
    next(err);
  }
}

async function disponibilidad(req, res, next) {
  try {
    const { fecha, hora } = req.query;
    if (!fecha) return res.status(400).json({ error: 'Parametro fecha requerido (YYYY-MM-DD)' });
    const data = await getAvailabilityByDate(fecha);
    if (hora) {
      data.forEach((mesa) => {
        mesa.slots = mesa.slots.filter((s) => s.hora === hora);
      });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createReserva(req, res, next) {
  try {
    const body = reservaCreateSchema.parse(req.body);
    const { cliente, clienteId, mesaId, fecha, hora, numeroPersonas, comentarios, preferenciaZona } = body;

    if (!isWithinWorkingHours(hora)) {
      return res.status(400).json({ error: 'Hora fuera del horario laboral' });
    }
    if (isDateTimeInPast(fecha, hora)) {
      return res.status(400).json({ error: 'No se pueden reservar horarios pasados' });
    }

    const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    if (numeroPersonas > mesa.capacidad) {
      return res.status(400).json({ error: 'La capacidad de la mesa no es suficiente' });
    }

    const disponible = await isTableAvailable(mesaId, fecha, hora);
    if (!disponible) {
      return res.status(400).json({
        error: 'Esta mesa ya se encuentra reservada en ese horario. Selecciona otra hora o mesa para continuar.',
      });
    }

    let cid = clienteId;
    if (!cid && cliente) {
      const ensuredCliente = await ensureClienteRecord(cliente);
      cid = ensuredCliente?.id;
    }
    if (!cid) return res.status(400).json({ error: 'Debe especificar clienteId o datos completos del cliente' });

    const fechaHora = combineDateTime(fecha, hora).toDate();
    const created = await prisma.reserva.create({
      data: {
        clienteId: cid,
        mesaId,
        fechaHora,
        numeroPersonas,
        comentarios,
        preferenciaZona: preferenciaZona || 'SIN_PREFERENCIA',
      },
      include: { cliente: { include: { usuario: true } }, mesa: true },
    });
    await notifyReservaConfirmada(created);
    res.status(201).json(mapReserva(created));
  } catch (err) {
    next(err);
  }
}

async function updateReserva(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = reservaUpdateSchema.parse(req.body);

    let data = {};
    if (body.mesaId) {
      const mesa = await prisma.mesa.findUnique({ where: { id: body.mesaId } });
      if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
      data.mesaId = body.mesaId;
      if (body.numeroPersonas && body.numeroPersonas > mesa.capacidad)
        return res.status(400).json({ error: 'La capacidad de la mesa no es suficiente' });
    }
    if (body.numeroPersonas) data.numeroPersonas = body.numeroPersonas;
    if (body.estado) data.estado = body.estado;
    if (body.preferenciaZona) data.preferenciaZona = body.preferenciaZona;

    if (body.fecha || body.hora) {
      const current = await prisma.reserva.findUnique({ where: { id } });
      const fecha = body.fecha || dayjs(current.fechaHora).format('YYYY-MM-DD');
      const hora = body.hora || dayjs(current.fechaHora).format('HH:mm');
      if (!isWithinWorkingHours(hora)) return res.status(400).json({ error: 'Hora fuera del horario laboral' });
      const targetMesaId = data.mesaId || current.mesaId;
      const targetFechaHora = combineDateTime(fecha, hora).toDate();
      const conflict = await prisma.reserva.findFirst({
        where: {
          id: { not: id },
          mesaId: targetMesaId,
          fechaHora: targetFechaHora,
          estado: { not: 'CANCELADA' },
        },
      });
      if (conflict) {
        return res.status(400).json({
          error: 'No fue posible reprogramar: la mesa ya está reservada en ese horario.',
        });
      }
      data.fechaHora = targetFechaHora;
    }

    const updated = await prisma.reserva.update({
      where: { id },
      data,
      include: { cliente: { include: { usuario: true } }, mesa: true },
    });
    res.json(mapReserva(updated));
  } catch (err) {
    next(err);
  }
}

async function deleteReserva(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { motivo } = req.body || {};
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: { cliente: { include: { usuario: true } }, mesa: true },
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    const updated = await prisma.reserva.update({
      where: { id },
      data: {
        estado: 'CANCELADA',
        motivoCancelacion: motivo || null,
      },
      include: { cliente: { include: { usuario: true } }, mesa: true },
    });

    await sendCancellationNotice({
      to: updated.cliente?.usuario?.email || updated.cliente?.email,
      nombre: updated.cliente?.usuario?.nombre || updated.cliente?.nombre,
      fechaHora: updated.fechaHora,
      mesa: updated.mesa?.numero,
      personas: updated.numeroPersonas,
      motivo: motivo,
    });

    res.json(mapReserva(updated));
  } catch (err) {
    next(err);
  }
}

async function reservasDelDia(req, res, next) {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    req.params.fecha = today;
    return reservasPorFecha(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listReservas,
  reservasPorFecha,
  disponibilidad,
  createReserva,
  updateReserva,
  deleteReserva,
  reservasDelDia,
};

