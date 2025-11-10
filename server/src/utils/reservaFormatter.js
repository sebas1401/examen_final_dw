const dayjs = require('dayjs');

function formatReservaDate(fechaHora) {
  if (!fechaHora) return null;
  return dayjs(fechaHora).format('YYYY-MM-DDTHH:mm:ss');
}

function normalizeReserva(reserva) {
  if (!reserva) return reserva;
  return {
    ...reserva,
    fechaHora: formatReservaDate(reserva.fechaHora),
  };
}

module.exports = {
  formatReservaDate,
  normalizeReserva,
};
