import { useNavigate } from 'react-router-dom';

export function StatsCards({ stats }) {
  const navigate = useNavigate();
  const cards = [
    {
      label: 'Reservas del día',
      value: stats.totalReservas ?? 0,
      icon: '📅',
      bg: '#DBEAFE',
      hint: '+0 desde ayer',
      path: '/admin/calendario',
    },
    {
      label: 'Ocupación',
      value: `${stats.ocupacion ?? 0}%`,
      icon: '📊',
      bg: '#FEF3C7',
      progress: stats.ocupacion ?? 0,
    },
    {
      label: 'Mesas disponibles',
      value: stats.mesasDisponibles ?? 0,
      icon: '🍽️',
      bg: '#D1FAE5',
      sublabel: `de ${stats.totalMesas ?? 6} totales`,
      path: '/admin/mesas',
    },
    {
      label: 'Capacidad reservada',
      value: `${stats.capacidadReservada ?? 0} pax`,
      icon: '👥',
      bg: '#FCE7F3',
      sublabel: 'Objetivo diario: 40 pax',
    },
  ];

  return (
    <div className="stats-grid advanced">
      {cards.map((card) => (
        <article
          key={card.label}
          className="stat-card"
          role={card.path ? 'button' : undefined}
          tabIndex={card.path ? 0 : undefined}
          onClick={() => card.path && navigate(card.path)}
          onKeyDown={(e) => {
            if (card.path && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              navigate(card.path);
            }
          }}
        >
          <div className="stat-icon" style={{ background: card.bg }}>
            <span>{card.icon}</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            {card.hint && <p className="stat-change">{card.hint}</p>}
            {card.sublabel && <p className="stat-sublabel">{card.sublabel}</p>}
            {typeof card.progress === 'number' && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${card.progress}%` }} />
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
