import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { StatsCards } from '../components/StatsCards';
import { ReservationForm } from '../components/ReservationForm';
import { ReservationsList } from '../components/ReservationsList';

const slotClass = {
  available: 'slot-available',
  medium: 'slot-medium',
  full: 'slot-full',
};

function classifySlot(disponible, ocupadosMesa) {
  if (disponible) return 'available';
  if (ocupadosMesa > 3) return 'full';
  return 'medium';
}

export function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [availability, setAvailability] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function fetchData(date = selectedDate) {
    setLoadingPage(true);
    try {
      const [disponibilidad, reservas] = await Promise.all([
        api.getAvailability(date),
        api.getReservasPorFecha(date),
      ]);
      setAvailability(disponibilidad);
      setReservations(reservas);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información');
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const timeSlots = useMemo(() => {
    const slots = new Set();
    availability.forEach((mesa) => mesa.slots.forEach((slot) => slots.add(slot.hora)));
    return Array.from(slots).sort();
  }, [availability]);

  const stats = useMemo(() => {
    const totalSlots = availability.reduce((acc, mesa) => acc + mesa.slots.length, 0);
    const ocupados = availability.reduce(
      (acc, mesa) => acc + mesa.slots.filter((slot) => !slot.disponible).length,
      0
    );
    const mesasDisponibles = availability.filter((mesa) => mesa.slots.some((slot) => slot.disponible)).length;
    const capacidadReservada = reservations.reduce((acc, reserva) => acc + reserva.numeroPersonas, 0);
    return {
      totalReservas: reservations.length,
      ocupacion: totalSlots ? Math.round((ocupados / totalSlots) * 100) : 0,
      mesasDisponibles,
      capacidadReservada,
    };
  }, [availability, reservations]);

  async function handleCreateReservation(payload) {
    try {
      setFormLoading(true);
      await api.createReserva(payload);
      setNotice('Reserva creada con éxito');
      await fetchData(payload.fecha);
    } catch (err) {
      setError(err.message || 'No se pudo crear la reserva');
    } finally {
      setFormLoading(false);
      setTimeout(() => setNotice(''), 4000);
    }
  }

  async function handleCancelReservation(id) {
    await api.deleteReserva(id);
    fetchData();
  }

  async function handleUpdateState(id, estado) {
    await api.updateReserva(id, { estado });
    fetchData();
  }

  return (
    <section className="screen-card">
      <div className="screen-title">
        <div>
          <p className="eyebrow">Página principal</p>
          <h2>Calendario visual de reservas</h2>
        </div>
        <div className="date-control">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <button className="btn btn-primary" type="button" onClick={() => fetchData(selectedDate)}>
            Actualizar
          </button>
        </div>
      </div>
      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}
      {loadingPage ? (
        <div className="loading">Cargando información...</div>
      ) : (
        <>
          <StatsCards stats={stats} />
          <div className="calendar-layout">
            <div className="calendar-board">
              <div className="calendar-tabs">
                <button className="btn btn-primary" type="button">Semanal</button>
                <button className="btn btn-secondary" type="button">Mensual</button>
                <button className="btn btn-secondary" type="button">Diario</button>
              </div>
              <div className="calendar-grid">
                <div className="calendar-header">
                  <div className="calendar-cell"><strong>Mesa</strong></div>
                  {timeSlots.map((slot) => (
                    <div key={slot} className="calendar-cell">
                      <strong>{slot}</strong>
                    </div>
                  ))}
                </div>
                {availability.map((row) => (
                  <div key={row.mesaId} className="calendar-row">
                    <div className="calendar-cell">
                      <strong>Mesa {row.numero}</strong>
                      <p className="micro-copy">Capacidad {row.capacidad}</p>
                    </div>
                    {timeSlots.map((slot) => {
                      const slotInfo = row.slots.find((s) => s.hora === slot);
                      if (!slotInfo) {
                        return <div key={`${row.mesaId}-${slot}`} className="calendar-cell" />;
                      }
                      const ocupadosMesa = row.slots.filter((s) => !s.disponible).length;
                      const estado = classifySlot(slotInfo.disponible, ocupadosMesa);
                      return (
                        <div key={`${row.mesaId}-${slot}`} className="calendar-cell">
                          <div className={`calendar-slot ${slotClass[estado]}`}>
                            <span>{slot}</span>
                            <strong>{slotInfo.disponible ? 'Disponible' : 'Reservado'}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <aside className="side-panel">
              <div className="card-panel">
                <ReservationForm
                  selectedDate={selectedDate}
                  mesas={availability}
                  timeSlots={timeSlots}
                  loading={formLoading}
                  onSubmit={handleCreateReservation}
                />
              </div>
              <div className="card-panel">
                <h4>Reservas del día</h4>
                <ReservationsList
                  reservations={reservations}
                  onCancel={handleCancelReservation}
                  onUpdateEstado={handleUpdateState}
                />
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
