const prisma = require('../prisma');
const dayjs = require('dayjs');
const { buildTimeSlots, combineDateTime } = require('../utils/datetime');

function getConfig() {
  return {
    start: process.env.WORK_HOURS_START || '12:00',
    end: process.env.WORK_HOURS_END || '22:00',
    stepMinutes: Number(process.env.TIME_SLOT_MINUTES || 30),
  };
}

async function getAvailabilityByDate(fecha) {
  const config = getConfig();
  const slots = buildTimeSlots(config);
  const mesas = await prisma.mesa.findMany({});
  const reservas = await prisma.reserva.findMany({
    where: {
      fechaHora: {
        gte: dayjs(`${fecha}T00:00:00`).toDate(),
        lte: dayjs(`${fecha}T23:59:59`).toDate(),
      },
      estado: { not: 'CANCELADA' },
    },
    select: { mesaId: true, fechaHora: true },
  });

  const reservadas = new Set(
    reservas.map((r) => `${r.mesaId}-${dayjs(r.fechaHora).format('HH:mm')}`)
  );

  const availability = mesas.map((mesa) => ({
    mesaId: mesa.id,
    numero: mesa.numero,
    capacidad: mesa.capacidad,
    slots: slots.map((hora) => ({
      hora,
      disponible: !reservadas.has(`${mesa.id}-${hora}`),
    })),
  }));

  return availability;
}

async function isTableAvailable(mesaId, fecha, hora) {
  const fechaHora = combineDateTime(fecha, hora).toDate();
  const count = await prisma.reserva.count({
    where: {
      mesaId,
      fechaHora,
      estado: { not: 'CANCELADA' },
    },
  });
  return count === 0;
}

function isWithinWorkingHours(hora) {
  const { start, end, stepMinutes } = getConfig();
  const slots = new Set(buildTimeSlots({ start, end, stepMinutes }));
  return slots.has(hora);
}

module.exports = {
  getAvailabilityByDate,
  isTableAvailable,
  isWithinWorkingHours,
};

