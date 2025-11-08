const dayjs = require('dayjs');

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(total) {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function buildTimeSlots({ start = '12:00', end = '22:00', stepMinutes = 30 }) {
  const slots = [];
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  for (let t = startMin; t <= endMin - stepMinutes; t += stepMinutes) {
    slots.push(minutesToTimeStr(t));
  }
  return slots;
}

function combineDateTime(dateStr, timeStr) {
  return dayjs(`${dateStr}T${timeStr}:00`).second(0).millisecond(0);
}

module.exports = {
  parseTimeToMinutes,
  minutesToTimeStr,
  buildTimeSlots,
  combineDateTime,
};

