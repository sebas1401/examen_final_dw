import { useMemo } from 'react';

export function AvailabilityGrid({ availability }) {
  const timeSlots = useMemo(() => {
    const slots = new Set();
    availability.forEach((mesa) => {
      mesa.slots.forEach((slot) => slots.add(slot.hora));
    });
    return Array.from(slots).sort();
  }, [availability]);

  if (!availability.length) {
    return <p className="empty-state">No hay mesas registradas.</p>;
  }

  return (
    <div className="availability-grid">
      <div className="grid-legend">
        <span className="pill disponible" /> Disponible
        <span className="pill reservado" /> Reservado
      </div>
      <div className="grid-scroll">
        <table>
          <thead>
            <tr>
              <th>Mesa</th>
              {timeSlots.map((slot) => (
                <th key={slot}>{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {availability.map((mesa) => (
              <tr key={mesa.mesaId}>
                <td>
                  <div>
                    <strong>Mesa {mesa.numero}</strong>
                    <small>{mesa.capacidad} personas</small>
                  </div>
                </td>
                {timeSlots.map((slot) => {
                  const slotInfo = mesa.slots.find((s) => s.hora === slot);
                  const disponible = slotInfo?.disponible;
                  return (
                    <td key={`${mesa.mesaId}-${slot}`} className={disponible ? 'disponible' : 'reservado'}>
                      {disponible ? 'Libre' : 'Ocupada'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

