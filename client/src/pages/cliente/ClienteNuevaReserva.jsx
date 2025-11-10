import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../../services/api';
import { Portal } from '../../components/Portal';

const OPERATING_START = 8 * 60;
const OPERATING_END = 22 * 60;
const SLOT_INTERVAL = 30;

const periods = [
  { id: 'breakfast', label: 'Desayuno', emoji: '🍳', range: [8 * 60, 12 * 60] },
  { id: 'lunch', label: 'Almuerzo', emoji: '🥗', range: [12 * 60, 16 * 60] },
  { id: 'dinner', label: 'Cena', emoji: '🍷', range: [16 * 60, 22 * 60] },
];

const zonaOptions = [
  { id: 'SIN_PREFERENCIA', label: 'Sin preferencia', emoji: '✨' },
  { id: 'TERRAZA', label: 'Terraza', emoji: '🌿' },
  { id: 'INTERIOR', label: 'Interior', emoji: '🏠' },
  { id: 'VIP', label: 'VIP', emoji: '👑' },
];

const toMinutes = (time) => {
  if (typeof time === 'number') return time;
  if (!time) return NaN;
  const [h, m] = time.split(':');
  const hours = Number(h);
  const minutes = Number(m);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
};

const formatSlotLabel = (time) => {
  const minutes = toMinutes(time);
  if (Number.isNaN(minutes)) return '';
  return dayjs().startOf('day').add(minutes, 'minute').format('h:mm A');
};

const generateSlots = () => {
  const slots = [];
  for (let minutes = OPERATING_START; minutes < OPERATING_END; minutes += SLOT_INTERVAL) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    slots.push(`${hours}:${mins}`);
  }
  return slots;
};

const DAILY_SLOTS = generateSlots();

export function ClienteNuevaReserva() {
  const [fecha, setFecha] = useState(dayjs().format('YYYY-MM-DD'));
  const [mesas, setMesas] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [form, setForm] = useState({
    hora: '',
    mesaId: '',
    numeroPersonas: 2,
    comentarios: '',
    preferenciaZona: 'SIN_PREFERENCIA',
  });
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  useEffect(() => {
    api.getMesas().then(setMesas);
  }, []);

  useEffect(() => {
    api
      .disponibilidadCliente(fecha)
      .then(setDisponibilidad)
      .catch(() => setDisponibilidad([]));
  }, [fecha]);

  const slotSummary = useMemo(() => {
    const map = new Map();
    disponibilidad.forEach((mesa) => {
      mesa.slots?.forEach((slot) => {
        if (!map.has(slot.hora)) map.set(slot.hora, { total: 0, available: 0 });
        const entry = map.get(slot.hora);
        entry.total += 1;
        if (slot.disponible) entry.available += 1;
      });
    });
    return DAILY_SLOTS.map((hora) => {
      const entry = map.get(hora);
      const disponible = entry ? entry.available > 0 : true;
      const past = dayjs(`${fecha}T${hora}`).isBefore(dayjs(), 'minute');
      return {
        hora,
        disponible: disponible && !past,
        past,
      };
    });
  }, [disponibilidad]);

  const slotsInPeriod = (period) => {
    const [start, end] = period.range;
    return slotSummary.filter((slot) => {
      const minutes = toMinutes(slot.hora);
      return minutes >= start && minutes < end;
    });
  };

  const handleSlotSelect = (hora) => {
    setForm((prev) => ({ ...prev, hora }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.crearReservaCliente({
        fecha,
        hora: form.hora,
        numeroPersonas: Number(form.numeroPersonas),
        mesaId: Number(form.mesaId),
        comentarios: form.comentarios,
        preferenciaZona: form.preferenciaZona,
      });
      setFeedback({ text: 'Reserva creada exitosamente', type: 'success' });
    } catch (err) {
      const conflictMessage =
        err.message && err.message.includes('Unique constraint')
          ? 'Esa mesa ya está reservada en ese horario. Selecciona otro o elige otra mesa.'
          : err.message || 'No se pudo crear la reserva';
      setFeedback({ text: conflictMessage, type: 'error' });
    }
  };

  return (
    <div className="cliente-card cliente-reserva">
      <div className="cliente-card-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h3>Nueva reserva</h3>
        </div>
      </div>
      {/* feedback modal replaces inline message */}
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>

        <section className="slot-periods">
          <header>
            <p className="eyebrow">Horarios disponibles</p>
            <strong>{form.hora ? `Seleccionaste ${formatSlotLabel(form.hora)}` : 'Elige un horario'}</strong>
          </header>
          {periods.map((period) => {
            const slots = slotsInPeriod(period);
            return (
              <div key={period.id} className="slot-period">
                <div className="slot-period-header">
                  <span>
                    {period.emoji} {period.label}
                  </span>
                  <small>
                    {formatSlotLabel(period.range[0])} - {formatSlotLabel(period.range[1])}
                  </small>
                </div>
                <div className="slot-chip-grid">
                  {slots.length ? (
                    slots.map((slot) => (
                      <button
                        type="button"
                        key={slot.hora}
                        className={`slot-chip ${form.hora === slot.hora ? 'active' : ''} ${slot.past ? 'slot-past' : ''}`}
                        disabled={!slot.disponible}
                        onClick={() => handleSlotSelect(slot.hora)}
                      >
                        {formatSlotLabel(slot.hora)}
                        {!slot.disponible && <small> ocupado</small>}
                      </button>
                    ))
                  ) : (
                    <p className="micro-copy">Sin horarios en esta franja.</p>
                  )}
                </div>
              </div>
            );
          })}
          <select
            className="sr-only"
            value={form.hora}
            onChange={(e) => setForm((prev) => ({ ...prev, hora: e.target.value }))}
            required
          >
            <option value="">Selecciona hora</option>
            {slotSummary.map((slot) => (
              <option key={slot.hora} value={slot.hora} disabled={!slot.disponible}>
                {formatSlotLabel(slot.hora)}
              </option>
            ))}
          </select>
        </section>

        <label className="field">
          Mesa
          <select value={form.mesaId} onChange={(e) => setForm((prev) => ({ ...prev, mesaId: e.target.value }))} required>
            <option value="">Selecciona mesa</option>
            {mesas.map((mesa) => (
              <option key={mesa.id} value={mesa.id}>
                Mesa {mesa.numero} - {mesa.capacidad} pax
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          Preferencia de ubicación
          <div className="preference-toggle compact">
            {zonaOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={form.preferenciaZona === option.id ? 'active' : ''}
                onClick={() => setForm((prev) => ({ ...prev, preferenciaZona: option.id }))}
              >
                <span className="icon">{option.emoji}</span> {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          Número de personas
          <input
            type="number"
            min="1"
            value={form.numeroPersonas}
            onChange={(e) => setForm((prev) => ({ ...prev, numeroPersonas: e.target.value }))}
          />
        </label>

        <label className="field">
          Comentarios
          <textarea value={form.comentarios} onChange={(e) => setForm((prev) => ({ ...prev, comentarios: e.target.value }))} />
        </label>

        <button type="submit" className="btn btn-primary">
          Confirmar reserva
        </button>
      </form>
      {feedback.text && (
        <Portal>
          <div className="modal-overlay" onClick={() => setFeedback({ text: '', type: '' })}>
            <div className={`feedback-modal ${feedback.type}`} onClick={(e) => e.stopPropagation()}>
              <h3>{feedback.type === 'success' ? '¡Reserva confirmada!' : 'Ups...'}</h3>
              <p>{feedback.text}</p>
              <button type="button" className="btn btn-primary" onClick={() => setFeedback({ text: '', type: '' })}>
                Cerrar
              </button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
