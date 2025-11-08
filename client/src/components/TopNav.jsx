const navItems = [
  { id: 'admin', label: 'Dashboard' },
  { id: 'calendario', label: 'Calendario' },
  { id: 'formulario', label: 'Nueva reserva' },
  { id: 'mesas', label: 'Mesas' },
  { id: 'cliente', label: 'Clientes' },
];

export function TopNav({ activeView, onNavigate }) {
  return (
    <div className="top-nav">
      <div className="brand">
        <div className="brand-mark">RF</div>
        <div>
          <p className="eyebrow">Restaurante Familiar</p>
          <strong>Reservas y Operaciones</strong>
        </div>
      </div>
      <div className="nav-links">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeView ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button className="btn btn-secondary" type="button" onClick={() => onNavigate('calendario')}>
        Agenda
      </button>
    </div>
  );
}

