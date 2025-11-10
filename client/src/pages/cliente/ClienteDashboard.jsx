import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { api } from '../../services/api';

const formatReserva = (fecha) => dayjs(fecha).format('ddd DD MMM · h:mm A');

export function ClienteDashboard() {
  const [perfil, setPerfil] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([api.getMiPerfil(), api.getMisReservas('CONFIRMADA')]);
        setPerfil(p);
        setReservas(r.slice(0, 3));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  if (!perfil && !error) return <div className="loading">Cargando...</div>;

  return (
    <div className="cliente-page">
      {error && <div className="alert error">{error}</div>}
      {perfil && (
        <section className="cliente-summary">
          <article className="cliente-summary-card">
            <p>Hola,</p>
            <h2>{perfil.usuario.nombre}</h2>
            <small>Miembro desde {dayjs(perfil.usuario.fechaRegistro || new Date()).format('MMMM YYYY')}</small>
          </article>
          <div className="cliente-stat-grid">
            <div className="cliente-stat">
              <p>Puntos</p>
              <strong>{perfil.cliente.puntosFidelidad}</strong>
            </div>
            <div className="cliente-stat">
              <p>Nivel</p>
              <strong>{perfil.cliente.nivelCliente}</strong>
            </div>
            <div className="cliente-stat">
              <p>Total reservas</p>
              <strong>{perfil.cliente.totalReservas}</strong>
            </div>
            <div className="cliente-stat">
              <p>Canceladas</p>
              <strong>{perfil.cliente.reservasCanceladas}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="cliente-card">
        <div className="cliente-card-header">
          <div>
            <p className="eyebrow">Agenda</p>
            <h3>Próximas reservas</h3>
          </div>
        </div>
        {reservas.length === 0 ? (
          <p className="empty-state">No tienes reservas programadas.</p>
        ) : (
          <div className="cliente-reservas-grid">
            {reservas.map((reserva) => (
              <article key={reserva.id} className="cliente-reserva-card">
                <div className="reserva-time">{formatReserva(reserva.fechaHora)}</div>
                <div className="reserva-body">
                  <p>Mesa {reserva.mesa.numero}</p>
                  <small>{reserva.numeroPersonas} personas · {reserva.estado.toLowerCase()}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
