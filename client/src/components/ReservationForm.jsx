import { useEffect, useState } from 'react';

const emptyForm = {
  fecha: '',
  hora: '',
  mesaId: '',
  numeroPersonas: 2,
  nombre: '',
  telefono: '',
  email: '',
};

export function ReservationForm({ selectedDate, mesas, timeSlots, loading, onSubmit }) {
  const [form, setForm] = useState({ ...emptyForm, fecha: selectedDate });

  useEffect(() => {
    setForm((prev) => ({ ...prev, fecha: selectedDate }));
  }, [selectedDate]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.mesaId || !form.hora) return;
    const payload = {
      mesaId: Number(form.mesaId),
      fecha: form.fecha,
      hora: form.hora,
      numeroPersonas: Number(form.numeroPersonas),
      cliente: {
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email || undefined,
      },
    };
    await onSubmit(payload);
    setForm({ ...emptyForm, fecha: selectedDate });
  }

  return (
    <form className="reservation-form" onSubmit={handleSubmit}>
      <h3>Nueva reserva</h3>
      <label>
        Fecha
        <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
      </label>
      <label>
        Hora
        <select name="hora" value={form.hora} onChange={handleChange} required>
          <option value="">Selecciona hora</option>
          {timeSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mesa
        <select name="mesaId" value={form.mesaId} onChange={handleChange} required>
          <option value="">Selecciona mesa</option>
          {mesas.map((mesa) => (
            <option key={mesa.mesaId} value={mesa.mesaId}>
              Mesa {mesa.numero} · {mesa.capacidad} pax
            </option>
          ))}
        </select>
      </label>
      <label>
        Número de personas
        <input type="number" name="numeroPersonas" min="1" value={form.numeroPersonas} onChange={handleChange} required />
      </label>
      <label>
        Nombre del cliente
        <input name="nombre" value={form.nombre} onChange={handleChange} required />
      </label>
      <label>
        Teléfono
        <input name="telefono" value={form.telefono} onChange={handleChange} required />
      </label>
      <label>
        Email (opcional)
        <input name="email" type="email" value={form.email} onChange={handleChange} />
      </label>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? 'Guardando...' : 'Confirmar reserva'}
      </button>
    </form>
  );
}
