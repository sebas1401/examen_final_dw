import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../services/api';

const horas = ['12:00', '12:30', '13:00', '13:30', '14:00'];

export function ReservationFormScreen() {
  const [form, setForm] = useState({
    fecha: dayjs().format('YYYY-MM-DD'),
    hora: '',
    numeroPersonas: 2,
    mesaId: '',
    nombre: '',
    telefono: '',
    email: '',
    comentarios: '',
  });
  const [mesas, setMesas] = useState([]);
  const [estado, setEstado] = useState({ message: '', type: '' });

  useEffect(() => {
    (async () => {
      const data = await api.getMesas();
      setMesas(data);
    })();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
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
      });
      setEstado({ type: 'success', message: '¡Reserva confirmada exitosamente!' });
    } catch (err) {
      setEstado({ type: 'error', message: err.message || 'No se pudo guardar la reserva' });
    }
  }

  return (
    <section className="form-screen">
      <div className="form-section">
        <p className="eyebrow">Formulario detallado</p>
        <h2>Nueva reserva</h2>
        {estado.message && <div className={`alert ${estado.type === 'success' ? 'success' : 'error'}`}>{estado.message}</div>}
        <form className="input-grid" onSubmit={handleSubmit}>
          <label className="input-control">
            Fecha
            <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
          </label>
          <label className="input-control">
            Hora
            <select name="hora" value={form.hora} onChange={handleChange} required>
              <option value="" disabled>
                Selecciona hora
              </option>
              {horas.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
          </label>
          <label className="input-control">
            Número de personas
            <input type="number" name="numeroPersonas" value={form.numeroPersonas} onChange={handleChange} min="1" />
          </label>
          <label className="input-control">
            Mesa
            <select name="mesaId" value={form.mesaId} onChange={handleChange} required>
              <option value="">Elige mesa</option>
              {mesas.map((mesa) => (
                <option key={mesa.id} value={mesa.id}>
                  Mesa {mesa.numero} · {mesa.capacidad} pax
                </option>
              ))}
            </select>
          </label>
          <label className="input-control">
            Nombre del cliente
            <input name="nombre" value={form.nombre} onChange={handleChange} required />
          </label>
          <label className="input-control">
            Teléfono
            <input name="telefono" value={form.telefono} onChange={handleChange} required />
          </label>
          <label className="input-control">
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </label>
          <label className="input-control" style={{ gridColumn: '1 / -1' }}>
            Comentarios
            <textarea name="comentarios" rows="3" value={form.comentarios} onChange={handleChange} />
          </label>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="button" className="btn btn-secondary">
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              Confirmar reserva
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
