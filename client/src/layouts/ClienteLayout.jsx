import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TopNav } from '../components/TopNav';

const links = [
  { to: '/cliente/inicio', label: 'Inicio' },
  { to: '/cliente/reservas', label: 'Mis reservas' },
  { to: '/cliente/nueva', label: 'Nueva reserva' },
  { to: '/cliente/perfil', label: 'Mi perfil' },
];

export function ClienteLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="cliente-shell">
      <TopNav links={links} />
      <header className="cliente-header">
        <div>
          <p className="eyebrow">Bienvenido</p>
          <h1>{user?.nombre || 'Cliente'}</h1>
        </div>
        <div className="cliente-actions">
          <div className="cliente-puntos">
            <span>{user?.rol === 'CLIENTE' ? 'Cliente' : user?.rol}</span>
            <small>{user?.email}</small>
          </div>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
