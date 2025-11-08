export function StatsCards({ stats }) {
  const cards = [
    { label: 'Reservas del día', value: stats.totalReservas },
    { label: 'Ocupación', value: `${stats.ocupacion}%` },
    { label: 'Mesas disponibles', value: stats.mesasDisponibles },
    { label: 'Capacidad reservada', value: `${stats.capacidadReservada} pax` },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <article key={card.label} className="stat-card">
          <p>{card.label}</p>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  );
}
