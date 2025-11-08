import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { StatsCards } from '../components/StatsCards';

const estadoBadge = {
  CONFIRMADA: 'success',
  PENDIENTE: 'pending',
  CANCELADA: 'danger',
  COMPLETADA: 'info',
};

export function AdminDashboardScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [reservas, setReservas] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setError('No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const stats = useMemo(() => {
    const totalSlots = availability.reduce((acc, mesa) => acc + mesa.slots.length, 0);
    const ocupados = availability.reduce(
      (acc, mesa) => acc + mesa.slots.filter((slot) => !slot.disponible).length,
      0
    );
    const mesasDisponibles = availability.filter((mesa) => mesa.slots.some((slot) => slot.disponible)).length;
    const capacidadReservada = reservas.reduce((acc, reserva) => acc + reserva.numeroPersonas, 0);
    return {
      totalReservas: reservas.length,
      ocupacion: totalSlots ? Math.round((ocupados / totalSlots) * 100) : 0,
      mesasDisponibles,
      capacidadReservada,
    };
  }, [availability, reservas]);

  async function handleEstado(id, estado) {
    await api.updateReserva(id, { estado });
    fetchData();
  }

  async function handleCancelar(id) {
    await api.deleteReserva(id);
    fetchData();
  }

  return (
    <section className="admin-layout">
      <aside className="sidebar">
        <div>
          <div className="brand-mark" style={{ background: 'rgba(255,255,255,0.15)' }}>RF</div>
          <p>Restaurante Familiar</p>
        </div>
        <nav>
          <button type="button" className="active">?? Dashboard</button>
          <button type="button">?? Reservas del día</button>
          <button type="button">??? Gestión de mesas</button>
          <button type="button">?? Gestión de clientes</button>
          <button type="button">?? Reportes</button>
        </nav>
      </aside>
      <div className="admin-content">
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
            <div className="table-card">
              <h3>Disponibilidad {dayjs(selectedDate).format('DD MMM')}</h3>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Mesa</th>
                      <th>Personas</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((reserva) => (
                      <tr key={reserva.id}>
                        <td>{dayjs(reserva.fechaHora).format('HH:mm')}</td>
                        <td>{reserva.cliente.nombre}</td>
                        <td>{reserva.mesa.numero}</td>
                        <td>{reserva.numeroPersonas}</td>
                        <td>
                          <span className={`badge ${estadoBadge[reserva.estado] || 'info'}`}>
                            {reserva.estado}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="icon-btn" onClick={() => handleEstado(reserva.id, 'CONFIRMADA')}>
                              ??
                            </button>
                            <button type="button" className="icon-btn danger" onClick={() => handleCancelar(reserva.id)}>
                              ?
                            </button>
                            <button type="button" className="icon-btn" onClick={() => handleEstado(reserva.id, 'COMPLETADA')}>
                              ?
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
