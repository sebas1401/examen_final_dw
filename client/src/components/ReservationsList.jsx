import dayjs from 'dayjs';

const zonaLabels = {
  SIN_PREFERENCIA: 'Sin preferencia',
  TERRAZA: 'Terraza',
  INTERIOR: 'Interior',
  VIP: 'VIP',
};

export function ReservationsList({ reservations, onCancel, onUpdateEstado }) {
  if (!reservations.length) {
    return <p className="empty-state">No hay reservas registradas para esta fecha.</p>;
  }

  return (
    <ul className="reservations-list">
      {reservations.map((reserva) => {
        const preferencia = zonaLabels[reserva.preferenciaZona] || reserva.mesa?.ubicacion;
        return (
          <li key={reserva.id} className={reserva.estado.toLowerCase()}>
            <div>
              <strong>
                {dayjs(reserva.fechaHora).format('h:mm A')} - Mesa {reserva.mesa.numero}
              </strong>
              <p>
                {reserva.cliente.nombre} ({reserva.numeroPersonas} pax)
              </p>
              {preferencia && <p className="reserva-preferencia">Ubicación: {preferencia}</p>}
            </div>
          <div className="list-actions">
            <span className="pill estado">{reserva.estado}</span>
            <button type="button" className="icon-btn" title="Confirmar" onClick={() => onUpdateEstado?.(reserva.id, 'CONFIRMADA')}>
              ?
            </button>
            <button type="button" className="icon-btn" title="Completar" onClick={() => onUpdateEstado?.(reserva.id, 'COMPLETADA')}>
              ??
            </button>
            <button type="button" className="icon-btn danger" title="Cancelar" onClick={() => onCancel?.(reserva.id)}>
              ??
            </button>
          </div>
          </li>
        );
      })}
    </ul>
  );
}
