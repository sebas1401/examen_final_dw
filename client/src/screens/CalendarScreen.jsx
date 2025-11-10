import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import { api } from '../services/api';
import { StatsCards } from '../components/StatsCards';
import { ReservationForm } from '../components/ReservationForm';
import { ReservationsList } from '../components/ReservationsList';
import { Portal } from '../components/Portal';
import { mockAvailability, mockReservas, mockStats } from '../data/mockData';

const OPERATING_START = 8 * 60;
const OPERATING_END = 22 * 60;
const SLOT_INTERVAL = 30;

const periods = [
  { id: 'breakfast', label: 'Desayuno', emoji: '☕', range: [8 * 60, 12 * 60] },
  { id: 'lunch', label: 'Almuerzo', emoji: '🥗', range: [12 * 60, 16 * 60] },
  { id: 'dinner', label: 'Cena', emoji: '🍷', range: [16 * 60, 22 * 60] },
];

const statusPalette = [
  { id: 'perfect', threshold: 1, className: 'slot-perfect', text: 'Todas disponibles' },
  { id: 'high', threshold: 0.75, className: 'slot-high', text: 'Mayoría disponibles' },
  { id: 'medium', threshold: 0.5, className: 'slot-medium', text: 'Pocas mesas' },
  { id: 'low', threshold: 0.17, className: 'slot-low', text: 'Muy pocas' },
  { id: 'none', threshold: 0, className: 'slot-none', text: 'Sin disponibilidad' },
];

const preferenceOptions = [
  { id: 'any', label: 'Sin preferencia' },
  { id: 'terraza', label: 'Terraza' },
  { id: 'interior', label: 'Interior' },
  { id: 'vip', label: 'VIP' },
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

const generateDailySlots = () => {
  const slots = [];
  for (let minutes = OPERATING_START; minutes < OPERATING_END; minutes += SLOT_INTERVAL) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    slots.push(`${hours}:${mins}`);
  }
  return slots;
};

const DAILY_SLOTS = generateDailySlots();

const minutesToDayjs = (minutes) => dayjs().startOf('day').add(minutes, 'minute');
const formatTimeDisplay = (time) => {
  const minutes = toMinutes(time);
  if (Number.isNaN(minutes)) return '—';
  return minutesToDayjs(minutes).format('h:mm A');
};
const formatMinutesDisplay = (minutes) => minutesToDayjs(minutes).format('h:mm A');

const normalizeName = (value) =>
  value
    ?.toString()
    .normalize?.('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [viewMode, setViewMode] = useState('day');
  const [peopleCount, setPeopleCount] = useState(2);
  const [preference, setPreference] = useState('any');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState({ text: '', type: '' });
  const [showDetailed, setShowDetailed] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(null);
  const [prefillCliente, setPrefillCliente] = useState(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const [clientes, setClientes] = useState([]);
  const formRef = useRef(null);
  const formWrapperRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

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
      setAvailability(mockAvailability);
      setReservations(mockReservas);
      setError('Mostrando datos de ejemplo porque la API no respondió');
    } finally {
      setLoadingPage(false);
    }
  }

  async function loadClientes() {
    try {
      const data = await api.getClientes();
      setClientes(data);
    } catch (err) {
      console.error('No se pudieron cargar los clientes', err);
    }
  }

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadClientes();
  }, []);

  const timeSlots = DAILY_SLOTS;

  const filteredMesas = useMemo(() => {
    if (!availability.length) return [];
    const normalize = (value) => value?.toString().toLowerCase();
    return availability.filter((mesa) => {
      const capacityOK = mesa.capacidad >= peopleCount;
      const preferenceOK =
        preference === 'any' || normalize(mesa.ubicacion) === normalize(preference);
      return capacityOK && preferenceOK;
    });
  }, [availability, peopleCount, preference]);

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
      totalMesas: availability.length || mockAvailability.length,
    };
  }, [availability, reservations]);

  const isInPast = (date, time) => {
    if (!date || !time) return false;
    const target = dayjs(`${date}T${time}`);
    return target.isValid() && target.isBefore(dayjs(), 'minute');
  };

  async function handleCreateReservation(payload) {
    if (isInPast(payload.fecha, payload.hora)) {
      setFeedbackModal({ text: 'Ya terminó el horario laboral para esa fecha', type: 'error' });
      throw new Error('Horario pasado');
    }

    try {
      setFormLoading(true);
      await api.createReserva(payload);
      setFeedbackModal({ text: 'Reserva creada con éxito', type: 'success' });
      setError('');
      await fetchData(payload.fecha);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo crear la reserva');
      setFeedbackModal({ text: err.message || 'No se pudo crear la reserva', type: 'error' });
      throw err;
    } finally {
      setFormLoading(false);
    }
  }

  async function handleCancelReservation(id) {
    try {
      await api.deleteReserva(id);
      fetchData();
    } catch (err) {
      console.error(err);
      setReservations((prev) => prev.filter((item) => item.id !== id));
      setError('Reserva simulada como cancelada. Revisa la API.');
    }
  }

  async function handleUpdateState(id, estado) {
    try {
      await api.updateReserva(id, { estado });
      fetchData();
    } catch (err) {
      console.error(err);
      setReservations((prev) => prev.map((item) => (item.id === id ? { ...item, estado } : item)));
      setError('Reserva actualizada solo de forma visual.');
    }
  }

  function shiftDate(days) {
    setSelectedDate((prev) => dayjs(prev).add(days, 'day').format('YYYY-MM-DD'));
  }

  const sourceMesas = filteredMesas.length ? filteredMesas : availability;

  const slotSummary = useMemo(() => {
    const map = new Map();
    const pool = sourceMesas.length ? sourceMesas : availability;
    pool.forEach((mesa) => {
      mesa.slots.forEach((slot) => {
        if (!map.has(slot.hora)) map.set(slot.hora, { total: 0, available: 0, capacity: 0 });
        const entry = map.get(slot.hora);
        entry.total += 1;
        if (slot.disponible) {
          entry.available += 1;
          entry.capacity += mesa.capacidad || 0;
        }
      });
    });
    const defaultTotal = pool.length;
    const defaultCapacity = pool.reduce((acc, mesa) => acc + (mesa.capacidad || 0), 0);
    return timeSlots.map((hora) => {
      const entry = { total: 0, available: 0, capacity: 0, ...(map.get(hora) || {}) };
      if (entry.total === 0 && defaultTotal) {
        entry.total = defaultTotal;
        entry.available = defaultTotal;
        entry.capacity = defaultCapacity;
      }
      const ratio = entry.total ? entry.available / entry.total : 0;
      let statusInfo = statusPalette.find((item) => ratio >= item.threshold);
      if (!statusInfo) statusInfo = statusPalette[statusPalette.length - 1];
      return {
        hora,
        status: statusInfo.id,
        className: statusInfo.className,
        text: statusInfo.text,
        available: entry.available,
        total: entry.total,
        capacity: entry.capacity,
        ratio,
      };
    });
  }, [availability, sourceMesas, timeSlots]);

  const recommendedSlots = useMemo(
    () =>
      slotSummary
        .filter((slot) => slot.available > 0)
        .sort((a, b) => b.ratio - a.ratio || b.available - a.available)
        .slice(0, 2),
    [slotSummary]
  );

  const reservasConfirmadas = reservations.filter((r) => r.estado === 'CONFIRMADA').length;
  const reservasPendientes = reservations.filter((r) => r.estado === 'PENDIENTE').length;

  function handlePeopleStep(delta) {
    setPeopleCount((prev) => Math.max(1, prev + delta));
  }

  function handleSlotSelect(hora) {
    const pool = sourceMesas.length ? sourceMesas : availability;
    const candidateMesa = pool.find((mesa) =>
      mesa.slots.some((slot) => slot.hora === hora && slot.disponible)
    );
    if (!candidateMesa) {
      setError('No hay mesas disponibles para ese horario.');
      return;
    }
    setSelectedSlot({
      hora,
      mesaId: candidateMesa.mesaId ?? candidateMesa.numero,
      mesaLabel: candidateMesa.numero,
      personas: peopleCount,
      preferenciaZona: preference,
    });
  }

  function handleRecommendedClick(slot) {
    setRecommendLoading(slot.hora);
    handleSlotSelect(slot.hora);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setRecommendLoading(null);
    }, 500);
  }

  function clearSelection() {
    setSelectedSlot(null);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('nueva_reserva') === 'true') {
      const prefill = {
        nombre: params.get('nombre') || '',
        telefono: params.get('telefono') || '',
        email: params.get('email') || '',
        personas: params.get('personas') ? Number(params.get('personas')) : undefined,
      };
      const prefZona = params.get('preferenciaZona');
      if (prefZona) {
        setPreference(prefZona);
      }
      setPrefillCliente(prefill);
      if (prefill.personas) {
        setPeopleCount(prefill.personas);
      }
      setHighlightForm(true);
      setTimeout(() => setHighlightForm(false), 2200);
      requestAnimationFrame(() => {
        formWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      params.delete('nueva_reserva');
      params.delete('preferenciaZona');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  function slotsInPeriod(range) {
    const [start, end] = range;
    return slotSummary.filter((slot) => {
      const minutes = toMinutes(slot.hora);
      return minutes >= start && minutes < end;
    });
  }

  return (
    <section className="screen-card">
      <div className="calendar-controls">
        <div className="controls-left">
          <button type="button" className="ghost-icon" onClick={() => shiftDate(-1)} aria-label="Día anterior">
            <FiChevronLeft />
          </button>
          <div className="date-display">
            <p>{dayjs(selectedDate).format('dddd')}</p>
            <strong>{dayjs(selectedDate).format('D [de] MMMM [de] YYYY')}</strong>
            <small>
              {reservasConfirmadas} confirmadas · {reservasPendientes} pendientes
            </small>
          </div>
          <button type="button" className="ghost-icon" onClick={() => shiftDate(1)} aria-label="Día siguiente">
            <FiChevronRight />
          </button>
        </div>
        <div className="controls-right">
          <div className="view-switch">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={viewMode === mode ? 'active' : ''}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <div className="date-control compact">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <button className="btn btn-primary" type="button" onClick={() => fetchData(selectedDate)}>
              Actualizar
            </button>
          </div>
        </div>
      </div>
      {feedbackModal.text && (
        <Portal>
          <div className="modal-overlay" onClick={() => setFeedbackModal({ text: '', type: '' })}>
            <div className={`feedback-modal ${feedbackModal.type}`} onClick={(e) => e.stopPropagation()}>
              <h3>{feedbackModal.type === 'success' ? 'Reserva confirmada' : 'Ups...'}</h3>
              <p>{feedbackModal.text}</p>
              <button type="button" className="btn btn-primary" onClick={() => setFeedbackModal({ text: '', type: '' })}>
                Cerrar
              </button>
            </div>
          </div>
        </Portal>
      )}
      {error && <div className="alert error">{error}</div>}
      {loadingPage ? (
        <div className="loading">Cargando información...</div>
      ) : (
        <>
          <StatsCards stats={stats} />
          <div className="filters-panel">
            <div className="filter-card">
              <p>Personas</p>
              <div className="people-stepper">
                <button type="button" onClick={() => handlePeopleStep(-1)}>-</button>
                <span>{peopleCount}</span>
                <button type="button" onClick={() => handlePeopleStep(1)}>+</button>
              </div>
            </div>
            <div className="filter-card">
              <p>Preferencia</p>
              <div className="preference-toggle">
                {preferenceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={preference === option.id ? 'active' : ''}
                    onClick={() => setPreference(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <small className="filter-hint">
              Mostrando horarios para mesas con capacidad ≥ {peopleCount} personas
            </small>
          </div>
          <div className="availability-legend">
            <div className="legend-item">
              <span className="dot available" />
              Disponible
            </div>
            <div className="legend-item">
              <span className="dot medium" />
              Pocas mesas
            </div>
            <div className="legend-item">
              <span className="dot full" />
              Casi lleno
            </div>
          </div>
          <div className="recommendations">
            <h4>⭐ Horarios recomendados</h4>
            <div className="recommendations-grid" key={`rec-${selectedDate}`}>
              {recommendedSlots.length ? (
                recommendedSlots.map((slot, index) => (
                  <div key={slot.hora} className="recommendation-card fade-in">
                    <div className="medal">{index === 0 ? '🥇' : '🥈'}</div>
                    <div className="rec-body">
                      <span className="badge recommended">Recomendado</span>
                      <strong>{formatTimeDisplay(slot.hora)}</strong>
                      <span>{slot.text}</span>
                      <small>{slot.available} mesas · Capacidad {slot.capacity || 0} pax</small>
                    </div>
                    <button type="button" onClick={() => handleRecommendedClick(slot)} disabled={recommendLoading === slot.hora}>
                      {recommendLoading === slot.hora ? <span className="btn-spinner" /> : 'Reservar'}
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay recomendaciones para los filtros actuales.</p>
              )}
            </div>
          </div>
          <div className={`timeline-board fade-in ${selectedSlot ? 'has-selection' : ''}`} key={selectedDate}>
            {periods.map((period) => {
              const slots = slotsInPeriod(period.range);
              return (
                <div key={period.id} className="timeline-section">
                  <div className="timeline-header">
                    <div>
                      <span>{period.emoji} {period.label}</span>
                      <small>
                        {formatMinutesDisplay(period.range[0])} - {formatMinutesDisplay(period.range[1])}
                      </small>
                    </div>
                  </div>
                  <div className="timeline-grid">
                    {slots.length ? (
                      slots.map((slot) => (
                        <button
                          type="button"
                          key={slot.hora}
                          className={`time-slot ${slot.className} ${selectedSlot?.hora === slot.hora ? 'selected' : ''}`}
                          onClick={() => handleSlotSelect(slot.hora)}
                        >
                          <span className="time-slot-time">{formatTimeDisplay(slot.hora)}</span>
                          <span className="time-slot-availability">✅ {slot.available}/{slot.total} mesas</span>
                          <span className="time-slot-text">👥 Capacidad {slot.capacity || 0} pax</span>
                          <span className="time-slot-text">{slot.text}</span>
                        </button>
                      ))
                    ) : (
                      <p className="micro-copy">Sin horarios en esta franja.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="calendar-board">
            <button type="button" className="toggle-detail" onClick={() => setShowDetailed((prev) => !prev)}>
              {showDetailed ? 'Ocultar disponibilidad detallada ↑' : 'Ver disponibilidad detallada por mesa ↓'}
            </button>
            {showDetailed && (
              <div className="calendar-grid fade-in">
                <div className="calendar-header">
                  <div className="calendar-cell"><strong>Mesa</strong></div>
                  {timeSlots.map((slot) => (
                    <div key={slot} className="calendar-cell">
                      <strong>{formatTimeDisplay(slot)}</strong>
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
                      if (!slotInfo) return <div key={`${row.mesaId}-${slot}`} className="calendar-cell" />;
                      const estado = slotInfo.disponible ? 'slot-available' : 'slot-full';
                      return (
                        <div key={`${row.mesaId}-${slot}`} className="calendar-cell">
                          <div className={`calendar-slot ${estado}`}>
                            <span>{formatTimeDisplay(slot)}</span>
                            <strong>{slotInfo.disponible ? 'Disponible' : 'Reservado'}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="calendar-layout">
            <aside className="side-panel">
              <div className={`card-panel ${highlightForm ? 'form-highlight' : ''}`} ref={formWrapperRef}>
                <ReservationForm
                  selectedDate={selectedDate}
                  mesas={availability}
                  timeSlots={timeSlots}
                  loading={formLoading}
                  onSubmit={handleCreateReservation}
                  prefillSlot={selectedSlot}
                  onClearSlot={clearSelection}
                  formRef={formRef}
                  prefillCliente={prefillCliente}
                  defaultPreference={preference}
                  clientes={clientes}
                  onSuccess={(msg) => setFeedbackModal({ text: msg, type: 'success' })}
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
