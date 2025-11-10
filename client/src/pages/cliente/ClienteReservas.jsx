import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../../services/api';

const tabs = ['CONFIRMADA', 'COMPLETADA', 'CANCELADA'];
const formatReserva = (fecha) => dayjs(fecha).format('DD MMM YYYY · h:mm A');

export function ClienteReservas() {
  const [reservas, setReservas] = useState([]);
  const [estado, setEstado] = useState('CONFIRMADA');
  const [mensaje, setMensaje] = useState('');

  async function load() {
    const data = await api.getMisReservas(estado);
    setReservas(data);
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function cancelar(id) {
    await api.cancelarReservaCliente(id);
    setMensaje('Reserva cancelada');
    load();
  }

  return (
    <div className="cliente-page">
      <div className="cliente-card reservas">
        <div className="cliente-tabs">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={estado === tab ? 'active' : ''} onClick={() => setEstado(tab)}>
              {tab.toLowerCase()}
            </button>
          ))}
        </div>
        {mensaje && <div className="alert success">{mensaje}</div>}
        {reservas.length === 0 ? (
          <p className="empty-state">Sin reservas en este estado.</p>
        ) : (
            <div className="cliente-reservas-grid">
              {reservas.map((reserva) => (
                <article key={reserva.id} className="cliente-reserva-card">
                  <div className="reserva-time">{formatReserva(reserva.fechaHora)}</div>
                  <div className="reserva-body">
                    <strong>Mesa {reserva.mesa.numero}</strong>
                    <small>{reserva.numeroPersonas} personas</small>
                  </div>
                  <div className="reserva-status">
                    <span className={`pill ${reserva.estado.toLowerCase()}`}>{reserva.estado}</span>
                    {estado === 'CONFIRMADA' && (
                      <button type="button" className="btn-link danger" onClick={() => cancelar(reserva.id)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                  {reserva.estado === 'CANCELADA' && reserva.motivoCancelacion && (
                    <p className="cliente-reserva-reason">Motivo: {reserva.motivoCancelacion}</p>
                  )}
                </article>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}
