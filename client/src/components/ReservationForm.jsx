import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const emptyForm = {
  fecha: '',
  hora: '',
  mesaId: '',
  numeroPersonas: 2,
  nombre: '',
  telefono: '',
  email: '',
  comentarios: '',
  preferenciaZona: 'SIN_PREFERENCIA',
};

const zonaOptions = [
  { id: 'SIN_PREFERENCIA', label: 'Sin preferencia' },
  { id: 'TERRAZA', label: 'Terraza' },
  { id: 'INTERIOR', label: 'Interior' },
  { id: 'VIP', label: 'VIP' },
];

const formatSlotLabel = (value) => {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  return dayjs().startOf('day').hour(h).minute(m).format('h:mm A');
};

const isPastSlot = (selectedDate, slot) => {
  return dayjs(`${selectedDate}T${slot}`).isBefore(dayjs(), 'minute');
};

const normalizeInput = (value) =>
  value
    ?.toString()
    .normalize?.('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function ReservationForm({
  selectedDate,
  mesas,
  timeSlots,
  loading,
  onSubmit,
  prefillSlot,
  onClearSlot,
  formRef,
  prefillCliente,
  defaultPreference = 'SIN_PREFERENCIA',
  onSuccess,
  clientes = [],
}) {
  const [form, setForm] = useState({ ...emptyForm, fecha: selectedDate, preferenciaZona: defaultPreference });

  useEffect(() => {
    setForm((prev) => ({ ...prev, fecha: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    if (!defaultPreference) return;
    setForm((prev) => {
      if (prev.preferenciaZona !== 'SIN_PREFERENCIA') return prev;
      return { ...prev, preferenciaZona: defaultPreference };
    });
  }, [defaultPreference]);

  useEffect(() => {
    if (prefillSlot?.hora) {
      setForm((prev) => ({
        ...prev,
        hora: prefillSlot.hora,
        mesaId: prefillSlot.mesaId ? String(prefillSlot.mesaId) : prev.mesaId,
        numeroPersonas: prefillSlot.personas || prev.numeroPersonas,
        preferenciaZona: prefillSlot.preferenciaZona || prev.preferenciaZona,
      }));
    }
  }, [prefillSlot]);

  useEffect(() => {
    if (prefillCliente) {
      setForm((prev) => ({
        ...prev,
        nombre: prefillCliente.nombre || prev.nombre,
        telefono: prefillCliente.telefono || prev.telefono,
        email: prefillCliente.email || prev.email,
        numeroPersonas: prefillCliente.personas || prev.numeroPersonas,
      }));
    }
  }, [prefillCliente]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'nombre' && clientes.length) {
        const normalizedName = normalizeInput(value);
        if (!normalizedName) return next;
        const normalizeCliente = (cliente) =>
          normalizeInput(cliente.usuario?.nombre || cliente.nombre || '');
        const matchExact = clientes.find((cliente) => normalizeCliente(cliente) === normalizedName);
        const matchPartial =
          matchExact ||
          clientes.find((cliente) => normalizeCliente(cliente).includes(normalizedName));
        if (matchPartial) {
          next.email = matchPartial.usuario?.email || matchPartial.email || next.email;
          next.telefono =
            matchPartial.usuario?.telefono || matchPartial.telefono || next.telefono;
        }
      }
      return next;
    });
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
      comentarios: form.comentarios || undefined,
      preferenciaZona: form.preferenciaZona || 'SIN_PREFERENCIA',
    };
    try {
      await onSubmit(payload);
      setForm({ ...emptyForm, fecha: selectedDate, preferenciaZona: defaultPreference });
      onClearSlot?.();
      onSuccess?.('Reserva creada exitosamente');
    } catch (err) {
      console.error(err);
    }
  }

  function handleCancel() {
    setForm({ ...emptyForm, fecha: selectedDate, preferenciaZona: defaultPreference });
    onClearSlot?.();
  }

  function handlePeopleStep(delta) {
    setForm((prev) => {
      const next = Math.max(1, Number(prev.numeroPersonas) + delta);
      return { ...prev, numeroPersonas: next };
    });
  }

  return (
    <form className="reservation-form enhanced" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-header">
        <div>
          <p className="eyebrow">Organiza la experiencia</p>
          <h3>Nueva reserva</h3>
        </div>
        {prefillSlot?.hora && (
          <div className="selection-chip">
            <div>
              <strong>{formatSlotLabel(prefillSlot.hora)}</strong>
              <span>{prefillSlot.mesaLabel ? `Mesa ${prefillSlot.mesaLabel}` : 'Mesa auto-asignada'}</span>
            </div>
            <button type="button" onClick={onClearSlot} aria-label="Quitar selección">
              ×
            </button>
          </div>
        )}
      </div>

      <section className="form-section">
        <h3 className="section-header">📅 Detalles de la reserva</h3>
        <div className="form-row three">
          <label className="field">
            <span className="label-title">
              <span className="icon">📅</span> Fecha <span className="required">*</span>
            </span>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              placeholder="Selecciona fecha"
              required
            />
          </label>
      <label className="field">
        <span className="label-title">
          <span className="icon">🕐</span> Hora <span className="required">*</span>
        </span>
        <select name="hora" value={form.hora} onChange={handleChange} required>
          <option value="">Selecciona hora disponible</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot} disabled={isPastSlot(selectedDate, slot)}>
                {formatSlotLabel(slot)}
              </option>
            ))}
            </select>
          </label>
          <label className="field">
            <span className="label-title">
              <span className="icon">👥</span> Número de personas <span className="required">*</span>
            </span>
            <div className="input-stepper">
              <button type="button" onClick={() => handlePeopleStep(-1)}>-</button>
              <input
                type="number"
                name="numeroPersonas"
                min="1"
                value={form.numeroPersonas}
                onChange={handleChange}
                placeholder="Selecciona cantidad"
              />
              <button type="button" onClick={() => handlePeopleStep(1)}>+</button>
            </div>
          </label>
        </div>
        <div className="form-row two">
          <label className="field">
            <span className="label-title">
              <span className="icon">🍽️</span> Mesa
            </span>
            <select name="mesaId" value={form.mesaId} onChange={handleChange} required>
              <option value="">Elige mesa o auto-asignar</option>
              {mesas.map((mesa) => (
                <option key={mesa.mesaId ?? mesa.numero} value={mesa.mesaId ?? mesa.numero}>
                  Mesa {mesa.numero} · Capacidad {mesa.capacidad} personas
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label-title">
              <span className="icon">👤</span> Nombre del cliente <span className="required">*</span>
            </span>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez García"
              required
            />
          </label>
        </div>
        <label className="field full-width">
          <span className="label-title">
            <span className="icon">🍷</span> Ubicación preferida
          </span>
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
        </label>
      </section>

      <section className="form-section">
        <h3 className="section-header">👤 Información del cliente</h3>
        <div className="form-row two">
          <label className="field">
            <span className="label-title">
              <span className="icon">📞</span> Teléfono <span className="required">*</span>
            </span>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Ej: +52 999 123 4567"
              required
            />
          </label>
          <label className="field">
            <span className="label-title">
              <span className="icon">✉️</span> Email
            </span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-header">💬 Comentarios adicionales</h3>
        <label className="field full-width">
          <span className="label-title">
            <span className="icon">💬</span> Comentarios
          </span>
          <textarea
            name="comentarios"
            className="comentarios-field"
            value={form.comentarios}
            onChange={handleChange}
            placeholder="Alergias, ocasión especial, peticiones..."
          />
        </label>
      </section>

      <div className="btn-container">
        <button type="button" className="btn-cancelar" onClick={handleCancel}>
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-confirmar">
          {loading ? 'Guardando...' : 'Confirmar reserva →'}
        </button>
      </div>
    </form>
  );
}
