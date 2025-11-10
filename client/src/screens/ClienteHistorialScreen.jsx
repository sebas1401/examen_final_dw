import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { mockClientes, mockHistorial } from '../data/mockData';

const zonaLabels = {
  SIN_PREFERENCIA: 'Sin preferencia',
  TERRAZA: 'Terraza',
  INTERIOR: 'Interior',
  VIP: 'VIP',
};

export function ClienteHistorialScreen() {
  const [clientes, setClientes] = useState([]);
  const [clienteActivo, setClienteActivo] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [error, setError] = useState('');
  const [detalleReserva, setDetalleReserva] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getClientes();
        setClientes(data);
        if (data.length) setClienteActivo(data[0].id);
      } catch (err) {
        setError('Mostrando datos de ejemplo');
        setClientes(mockClientes);
        setClienteActivo(mockClientes[0]?.id ?? null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!clienteActivo) return;
    (async () => {
      try {
        const data = await api.getClienteHistorialAdmin(clienteActivo);
        setHistorial(data);
      } catch (err) {
        setError('No se pudo cargar el historial real');
        setHistorial(mockHistorial);
      }
    })();
  }, [clienteActivo]);

  const stats = useMemo(() => {
    if (!historial) return [];
    const reservas = historial.reservas ?? [];
    const totalReservas = reservas.length;
    const totalCanceladas = reservas.filter((r) => r.estado === 'CANCELADA').length;
    const ultima = reservas[0]?.fechaHora;

    return [
      { label: 'Visitas totales', value: totalReservas },
      { label: 'Última reserva', value: ultima ? dayjs(ultima).format('DD MMM YY') : 'N/A' },
      { label: 'Cancelaciones', value: totalCanceladas },
      { label: 'Puntos acumulados', value: historial.puntosFidelidad ?? historial.puntos ?? 0 },
    ];
  }, [historial]);

  if (!historial) {
    return <div className="loading">Selecciona un cliente...</div>;
  }

  const memberSince = dayjs(historial.usuario?.fechaRegistro || historial.createdAt || new Date()).format('MMM YYYY');
  const clientInitial = (historial.nombre || '?').charAt(0).toUpperCase();

  const handleNuevaReserva = () => {
    const params = new URLSearchParams({
      nueva_reserva: 'true',
      cliente_id: clienteActivo,
      nombre: historial.nombre || '',
      telefono: historial.telefono || '',
      email: historial.email || '',
      personas: '2',
    });
    navigate(`/admin/calendario?${params.toString()}`);
  };

  const handleRepetirReserva = (reserva) => {
    const params = new URLSearchParams({
      nueva_reserva: 'true',
      cliente_id: clienteActivo,
      nombre: historial.nombre || '',
      telefono: historial.telefono || '',
      email: historial.email || '',
      personas: reserva.numeroPersonas?.toString() || '2',
    });
    if (reserva.preferenciaZona) {
      params.set('preferenciaZona', reserva.preferenciaZona);
    }
    navigate(`/admin/calendario?${params.toString()}`);
  };

  const statusClass = (estado) => {
    if (estado === 'CANCELADA') return 'cancelled';
    if (estado === 'PENDIENTE') return 'pending';
    return 'confirmed';
  };

  const copyToClipboard = (value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
  };

  const abrirDetalle = (reserva) => setDetalleReserva(reserva);
  const cerrarDetalle = () => setDetalleReserva(null);

  return (
    <section className="screen-card client-profile" data-cliente-id={clienteActivo}>
      <div className="client-header-card">
        <div className="client-avatar">
          <span className="initial">{clientInitial}</span>
        </div>
        <div className="client-info">
          <div className="client-info-row">
            <div>
              <p className="eyebrow">Cliente</p>
              <h2 className="client-name">{historial.nombre}</h2>
              <p className="client-email">📧 {historial.email || 'No registrado'}</p>
              <p className="client-phone">📞 {historial.telefono || 'Sin teléfono'}</p>
              <p className="client-since">📅 Miembro desde: {memberSince}</p>
            </div>
          </div>
          <div className="client-contact-info">
            <div className="info-item">
              <span className="icon">📞</span>
              <span className="label">Teléfono:</span>
              <span className="value">{historial.telefono || 'N/A'}</span>
              {historial.telefono && (
                <button type="button" className="btn-icon" onClick={() => copyToClipboard(historial.telefono)}>
                  📋
                </button>
              )}
            </div>
            <div className="info-item">
              <span className="icon">📧</span>
              <span className="label">Email:</span>
              <span className="value">{historial.email || 'N/A'}</span>
              {historial.email && (
                <button type="button" className="btn-icon" onClick={() => copyToClipboard(historial.email)}>
                  📋
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="client-actions">
          <div className="client-selector">
            <label htmlFor="cliente-select">Selecciona cliente</label>
            <select
              id="cliente-select"
              value={clienteActivo ?? ''}
              onChange={(e) => setClienteActivo(Number(e.target.value))}
            >
              {clientes.map((cliente) => (
                <option key={cliente.id ?? cliente.nombre} value={cliente.id ?? cliente.nombre}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="action-buttons">
            <button type="button" className="btn btn-primary" onClick={handleNuevaReserva}>
              + Nueva reserva
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="client-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="client-stat-card">
            <p className="stat-label">{stat.label}</p>
            <span className="stat-value">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="reservations-history">
        <h3 className="section-header">Historial de reservas</h3>
        {(historial.reservas ?? []).map((reserva) => {
          const preferencia = zonaLabels[reserva.preferenciaZona] || reserva.mesa?.ubicacion;
          return (
            <div key={reserva.id} className="reservation-item">
              <div>
                <div className="reservation-date">
                  <span className={`status-dot ${statusClass(reserva.estado)}`} />
                  <span className="datetime">
                    {dayjs(reserva.fechaHora).format('DD MMM YYYY')} · {dayjs(reserva.fechaHora).format('h:mm A')}
                  </span>
                </div>
                <p className="table-info">
                  Mesa {reserva.mesa?.numero ?? '-'} · {reserva.numeroPersonas} personas
                </p>
                {preferencia && <p className="table-info preference">Ubicación: {preferencia}</p>}
              </div>
              <div className="reservation-actions">
                <span className={`badge ${statusClass(reserva.estado)}`}>{reserva.estado}</span>
                <button type="button" className="btn-link" onClick={() => abrirDetalle(reserva)}>
                  Ver detalles
                </button>
                <button type="button" className="btn-link" onClick={() => handleRepetirReserva(reserva)}>
                  Repetir reserva
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {detalleReserva && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-card reservation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Detalle de la reserva</h4>
              <button type="button" className="modal-close" onClick={cerrarDetalle} aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Fecha:</strong> {dayjs(detalleReserva.fechaHora).format('DD MMM YYYY · h:mm A')}
              </p>
              <p>
                <strong>Mesa:</strong> {detalleReserva.mesa?.numero ?? '-'}
              </p>
              <p>
                <strong>Personas:</strong> {detalleReserva.numeroPersonas}
              </p>
              <p>
                <strong>Estado:</strong> {detalleReserva.estado}
              </p>
              {(detalleReserva.preferenciaZona || detalleReserva.mesa?.ubicacion) && (
                <p>
                  <strong>Ubicación:</strong> {zonaLabels[detalleReserva.preferenciaZona] || detalleReserva.mesa?.ubicacion || 'Sin preferencia'}
                </p>
              )}
              {detalleReserva.comentarios && (
                <p>
                  <strong>Comentarios:</strong> {detalleReserva.comentarios}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary ghost" onClick={cerrarDetalle}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
