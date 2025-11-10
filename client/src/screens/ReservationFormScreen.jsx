import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { mockMesas } from '../data/mockData';
import { Portal } from '../components/Portal';

const HORARIOS = Array.from({ length: ((22 - 8) * 60) / 30 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
});

const formatSlotLabel = (value) => {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  return dayjs().startOf('day').hour(h).minute(m).format('h:mm A');
};

const zonaOptions = [
  { id: 'SIN_PREFERENCIA', label: 'Sin preferencia' },
  { id: 'TERRAZA', label: 'Terraza' },
  { id: 'INTERIOR', label: 'Interior' },
  { id: 'VIP', label: 'VIP' },
];

export function ReservationFormScreen() {
  const [mesas, setMesas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState({ type: '', message: '' });
  const [feedbackModal, setFeedbackModal] = useState({ text: '', type: '' });
  const [form, setForm] = useState({
    fecha: dayjs().format('YYYY-MM-DD'),
    hora: '',
    numeroPersonas: 2,
    mesaId: '',
    nombre: '',
    telefono: '',
    email: '',
    comentarios: '',
    preferenciaZona: 'SIN_PREFERENCIA',
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMesas();
        setMesas(data);
      } catch (err) {
        console.error(err);
        setMesas(mockMesas);
        setEstado({ type: 'error', message: 'Mostrando mesas de ejemplo, verifica la API.' });
      }
    })();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setGuardando(true);
    try {
      await api.createReserva({
        mesaId: Number(form.mesaId),
        fecha: form.fecha,
        hora: form.hora,
        numeroPersonas: Number(form.numeroPersonas),
        cliente: {
          nombre: form.nombre,
          telefono: form.telefono,
          email: form.email || undefined,
        },
        comentarios: form.comentarios,
        preferenciaZona: form.preferenciaZona,
      });
      setFeedbackModal({ text: 'Reserva confirmada exitosamente.', type: 'success' });
      setEstado({ type: '', message: '' });
    } catch (err) {
      console.error(err);
      setFeedbackModal({ text: err.message || 'No se pudo guardar la reserva.', type: 'error' });
      setEstado({ type: '', message: '' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="form-screen">
      <div className="form-section">
        <p className="eyebrow">Formulario detallado</p>
        <h2>Nueva reserva</h2>
        {estado.message && (
          <div className={`alert ${estado.type === 'success' ? 'success' : 'error'}`}>{estado.message}</div>
        )}

        <form className="reservation-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <h3>Detalles de la reserva</h3>
            <div className="grid grid-3">
              <label className="input-control">
                <span>Fecha</span>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
              </label>
              <label className="input-control">
                <span>Hora</span>
                <select name="hora" value={form.hora} onChange={handleChange} required>
                  <option value="" disabled>
                    Selecciona hora
                  </option>
                  {HORARIOS.map((hora) => (
                    <option key={hora} value={hora}>
                      {formatSlotLabel(hora)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-control">
                <span>Número de personas</span>
                <input type="number" min="1" name="numeroPersonas" value={form.numeroPersonas} onChange={handleChange} />
              </label>
            </div>
            <div className="grid grid-2">
              <label className="input-control">
                <span>Mesa</span>
                <select name="mesaId" value={form.mesaId} onChange={handleChange} required>
                  <option value="">Elige mesa</option>
                  {mesas.map((mesa) => (
                    <option key={mesa.id ?? mesa.numero} value={mesa.id ?? mesa.numero}>
                      Mesa {mesa.numero} · {mesa.capacidad} pax
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-control">
                <span>Nombre del cliente</span>
                <input name="nombre" value={form.nombre} onChange={handleChange} required />
              </label>
            </div>
            <div className="input-control">
              <span>Ubicación preferida</span>
              <div className="preference-toggle compact">
                {zonaOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={form.preferenciaZona === option.id ? 'active' : ''}
                    onClick={() => setForm((prev) => ({ ...prev, preferenciaZona: option.id }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-2">
              <label className="input-control">
                <span>Teléfono</span>
                <input name="telefono" value={form.telefono} onChange={handleChange} required />
              </label>
              <label className="input-control">
                <span>Email</span>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <h3>Comentarios</h3>
            <label className="input-control">
              <span>Notas especiales</span>
              <textarea
                name="comentarios"
                rows={4}
                value={form.comentarios}
                onChange={handleChange}
                placeholder="Ej. alergias, celebración o mesa preferida"
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      </div>
      {feedbackModal.text && (
        <Portal>
          <div className="modal-overlay" onClick={() => setFeedbackModal({ text: '', type: '' })}>
            <div className={`feedback-modal ${feedbackModal.type}`} onClick={(event) => event.stopPropagation()}>
              <h3>{feedbackModal.type === 'success' ? 'Reserva confirmada' : 'Ups...'}</h3>
              <p>{feedbackModal.text}</p>
              <button type="button" className="btn btn-primary" onClick={() => setFeedbackModal({ text: '', type: '' })}>
                Cerrar
              </button>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
}
