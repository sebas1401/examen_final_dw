const prisma = require('../prisma');
const dayjs = require('dayjs');
const { reservaCreateSchema, reservaUpdateSchema } = require('../validators/schemas');
const { getAvailabilityByDate, isTableAvailable, isWithinWorkingHours } = require('../services/availabilityService');
const { combineDateTime } = require('../utils/datetime');

async function listReservas(req, res, next) {
  try {
    const reservas = await prisma.reserva.findMany({
      orderBy: { fechaHora: 'asc' },
      include: { cliente: true, mesa: true },
    });
    res.json(reservas);
  } catch (err) { next(err); }
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
      include: { cliente: true, mesa: true },
    });
    res.json(reservas);
  } catch (err) { next(err); }
}

async function disponibilidad(req, res, next) {
  try {
    const { fecha, hora } = req.query;
    if (!fecha) return res.status(400).json({ error: 'Parámetro fecha requerido (YYYY-MM-DD)' });
    const data = await getAvailabilityByDate(fecha);
    if (hora) {
      data.forEach((mesa) => {
        mesa.slots = mesa.slots.filter((s) => s.hora === hora);
      });
    }
    res.json(data);
  } catch (err) { next(err); }
}

async function createReserva(req, res, next) {
  try {
    const body = reservaCreateSchema.parse(req.body);
    const { cliente, clienteId, mesaId, fecha, hora, numeroPersonas } = body;

    if (!isWithinWorkingHours(hora)) {
      return res.status(400).json({ error: 'Hora fuera del horario laboral' });
    }

    const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    if (numeroPersonas > mesa.capacidad) {
      return res.status(400).json({ error: 'La capacidad de la mesa no es suficiente' });
    }

    const disponible = await isTableAvailable(mesaId, fecha, hora);
    if (!disponible) return res.status(400).json({ error: 'La mesa ya está reservada en ese horario' });

    let cid = clienteId;
    if (!cid && cliente) {
      if (cliente.email) {
        const upserted = await prisma.cliente.upsert({
          where: { email: cliente.email },
          update: { nombre: cliente.nombre, telefono: cliente.telefono },
          create: cliente,
        });
        cid = upserted.id;
      } else {
        const createdCliente = await prisma.cliente.create({ data: cliente });
        cid = createdCliente.id;
      }
    }
    if (!cid) return res.status(400).json({ error: 'Debe especificar clienteId o datos de cliente' });

    const fechaHora = combineDateTime(fecha, hora).toDate();
    const created = await prisma.reserva.create({
      data: { clienteId: cid, mesaId, fechaHora, numeroPersonas },
      include: { cliente: true, mesa: true },
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
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

    if (body.fecha || body.hora) {
      // Need current other part
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
      if (conflict) return res.status(400).json({ error: 'La mesa ya está reservada en ese horario' });
      data.fechaHora = targetFechaHora;
    }

    const updated = await prisma.reserva.update({ where: { id }, data, include: { cliente: true, mesa: true } });
    res.json(updated);
  } catch (err) { next(err); }
}

async function deleteReserva(req, res, next) {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.reserva.update({ where: { id }, data: { estado: 'CANCELADA' } });
    res.json(updated);
  } catch (err) { next(err); }
}

async function reservasDelDia(req, res, next) {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    req.params.fecha = today;
    return reservasPorFecha(req, res, next);
  } catch (err) { next(err); }
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
