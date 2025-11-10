import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { FiCheckCircle, FiCheckSquare, FiXCircle } from 'react-icons/fi';
import { api } from '../services/api';
import { StatsCards } from '../components/StatsCards';
import { Portal } from '../components/Portal';
import { mockAvailability, mockReservas, mockStats } from '../data/mockData';

const zonaLabels = {
  SIN_PREFERENCIA: 'Sin preferencia',
  TERRAZA: 'Terraza',
  INTERIOR: 'Interior',
  VIP: 'VIP',
};

const estadoBadge = {
  CONFIRMADA: 'success',
  PENDIENTE: 'pending',
  CANCELADA: 'danger',
  COMPLETADA: 'info',
};

export function AdminDashboardScreen() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [reservas, setReservas] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState({ open: false, reservaId: null });
  const [cancelReason, setCancelReason] = useState('');

  async function fetchData(date = selectedDate) {
    setLoading(true);
    try {
      const [reservasDia, disponibilidad] = await Promise.all([
        api.getReservasPorFecha(date),
        api.getAvailability(date),
      ]);
      setReservas(reservasDia);
      setAvailability(disponibilidad);
      setError('');
    } catch (err) {
      console.error(err);
      setReservas(mockReservas);
      setAvailability(mockAvailability);
      setError('Mostrando datos de ejemplo porque la API no respondió.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(selectedDate);
    const interval = setInterval(() => fetchData(selectedDate), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const stats = useMemo(() => {
    const activeReservas = reservas.filter((reserva) => reserva.estado !== 'CANCELADA');
    if (!availability.length) {
      return {
        totalReservas: mockStats.reservasDia,
        ocupacion: mockStats.ocupacion,
        mesasDisponibles: mockStats.mesasDisponibles,
        capacidadReservada: mockStats.capacidadReservada,
        totalMesas: mockAvailability.length,
      };
    }
    const totalSlots = availability.reduce((acc, mesa) => acc + mesa.slots.length, 0);
    const ocupados = availability.reduce((acc, mesa) => acc + mesa.slots.filter((slot) => !slot.disponible).length, 0);
    const mesasDisponibles = availability.filter((mesa) => mesa.slots.some((slot) => slot.disponible)).length;
    const capacidadReservada = activeReservas.reduce((acc, reserva) => acc + reserva.numeroPersonas, 0);
    return {
      totalReservas: activeReservas.length,
      ocupacion: totalSlots ? Math.round((ocupados / totalSlots) * 100) : 0,
      mesasDisponibles,
      capacidadReservada,
      totalMesas: availability.length,
    };
  }, [availability, reservas]);

  const upcomingReservations = useMemo(() => {
    return [...reservas]
      .sort((a, b) => dayjs(a.fechaHora).diff(b.fechaHora))
      .slice(0, 4);
  }, [reservas]);

  const weekOcupacion = useMemo(() => {
    const base = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const pivot = stats.ocupacion || 35;
    return base.map((label, idx) => {
      const percent = Math.max(5, Math.min(100, pivot + (idx - 3) * 8));
      return { label, percent };
    });
  }, [stats]);

  async function handleEstado(id, estado) {
    try {
      await api.updateReserva(id, { estado });
      fetchData();
    } catch (err) {
      console.error(err);
      setError('No fue posible actualizar el estado.');
    }
  }

  function handleCancelar(id) {
    setCancelReason('');
    setCancelModal({ open: true, reservaId: id });
  }

  async function handleConfirmCancel() {
    try {
      await api.deleteReserva(cancelModal.reservaId, cancelReason.trim() || undefined);
      setCancelModal({ open: false, reservaId: null });
      fetchData();
    } catch (err) {
      console.error(err);
      setError('No fue posible cancelar la reserva.');
    }
  }

  const statusClass = (estado) => estadoBadge[estado] || 'pending';

  return (
    <section className="admin-content">
      <div className="screen-title">
        <div>
          <p className="eyebrow">Panel administrativo</p>
          <h2>Visión general</h2>
        </div>
        <div className="date-control">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <button className="btn btn-primary" type="button" onClick={() => fetchData(selectedDate)}>
            Actualizar
          </button>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          <StatsCards stats={stats} />

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Próximas reservas</h2>
              <button type="button" className="btn-link" onClick={() => navigate('/admin/calendario')}>
                Ver todas →
              </button>
            </div>
            {upcomingReservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No hay reservas para hoy</h3>
                <p>Las próximas reservas aparecerán aquí</p>
                <button className="btn btn-primary" type="button" onClick={() => navigate('/admin/calendario')}>
                  Crear primera reserva
                </button>
              </div>
            ) : (
              <div className="reservations-timeline">
                {upcomingReservations.map((reserva) => (
                  <div key={reserva.id} className="reservation-card">
                    <div className="time-badge">{dayjs(reserva.fechaHora).format('h:mm A')}</div>
                    <div className="reservation-details">
                      <p className="client-name">{reserva.cliente?.nombre || 'Cliente'}</p>
                      <p className="reservation-info">
                        Mesa {reserva.mesa?.numero ?? '-'} · {reserva.numeroPersonas} personas
                      </p>
                      {(reserva.preferenciaZona || reserva.mesa?.ubicacion) && (
                        <p className="reservation-location">
                          Ubicación: {zonaLabels[reserva.preferenciaZona] || reserva.mesa?.ubicacion || 'Sin preferencia'}
                        </p>
                      )}
                      {reserva.estado === 'CANCELADA' && reserva.motivoCancelacion && (
                        <p className="reservation-reason">Motivo: {reserva.motivoCancelacion}</p>
                      )}
                    </div>
                    <span className={`status-badge ${statusClass(reserva.estado)}`}>{reserva.estado}</span>
                    <div className="reservation-actions compact">
                      {reserva.estado !== 'CANCELADA' && (
                        <button type="button" className="btn-icon success" onClick={() => handleEstado(reserva.id, 'CONFIRMADA')}>
                          <FiCheckCircle />
                        </button>
                      )}
                      {reserva.estado !== 'CANCELADA' && (
                        <button type="button" className="btn-icon warning" onClick={() => handleEstado(reserva.id, 'PENDIENTE')}>
                          <FiCheckSquare />
                        </button>
                      )}
                      <button type="button" className="btn-icon danger" onClick={() => handleCancelar(reserva.id)}>
                        <FiXCircle />
                      </button>
                      {reserva.motivoCancelacion && (
                        <button type="button" className="btn-link" onClick={() => alert(`Motivo: ${reserva.motivoCancelacion}`)}>
                          Ver detalles
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Ocupación esta semana</h2>
            </div>
            <div className="week-chart">
              {weekOcupacion.map((day) => (
                <div key={day.label} className="day-bar">
                  <div className="bar-fill" style={{ height: `${day.percent}%` }} />
                  <span className="day-label">{day.label}</span>
                  <span className="day-value">{day.percent}%</span>
                </div>
              ))}
            </div>
          </div>
          {cancelModal.open && (
            <Portal>
              <div className="modal-overlay" onClick={() => setCancelModal({ open: false, reservaId: null })}>
                <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Cancelar reserva</h3>
                  <p>¿Motivo de la cancelación (opcional)?</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Escribe un motivo corto..."
                  />
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary ghost"
                      onClick={() => setCancelModal({ open: false, reservaId: null })}
                    >
                      Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleConfirmCancel}>
                      Confirmar cancelación
                    </button>
                  </div>
                </div>
              </div>
            </Portal>
          )}
        </>
      )}
    </section>
  );
}
