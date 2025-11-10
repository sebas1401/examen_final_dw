import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function TopNav({ links = [], action, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const half = Math.ceil(links.length / 2);
  const primaryLinks = links.slice(0, half);
  const secondaryLinks = links.slice(half);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const userInitials = user?.nombre ? user.nombre[0].toUpperCase() : 'RF';

  return (
    <div className="top-nav">
      <div className="topnav-head">
        {onToggleSidebar && (
          <button type="button" className="sidebar-toggle-btn" onClick={onToggleSidebar} aria-label="Mostrar menú">
            ☰
          </button>
        )}
        <Link to={links?.[0]?.to || '/'} className="brand">
          <div className="brand-mark">RF</div>
          <div>
            <p className="eyebrow">Restaurante Familiar</p>
            <strong>Reservas y Operaciones</strong>
          </div>
        </Link>
      </div>

      <div className="nav-scroll">
        <div className="top-nav_menu">
          <div className="nav-row">
            {primaryLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ))}
          </div>
          {secondaryLinks.length > 0 && (
            <div className="nav-row secondary">
              {secondaryLinks.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="topnav-footer">
        {action && (
          <Link className="btn btn-ghost full" to={action.to}>
            {action.label}
          </Link>
        )}
        {user && (
          <div className="topnav-user-inline">
            <button type="button" className="btn-logout-inline" onClick={handleLogout}>
              <span className="item-icon">🚪</span>
              <span>Salir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
