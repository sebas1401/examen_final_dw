import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TopNav } from '../components/TopNav';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/calendario', label: 'Calendario' },
  { to: '/admin/nueva', label: 'Nueva reserva' },
  { to: '/admin/mesas', label: 'Mesas' },
  { to: '/admin/clientes', label: 'Clientes' },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('nav-visible', sidebarOpen);
    return () => document.body.classList.remove('nav-visible');
  }, [sidebarOpen]);

  return (
    <div className="admin-layout-shell">
      <button
        type="button"
        className="mobile-nav-trigger"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Abrir menú"
      >
        ☰
      </button>
      <TopNav links={adminLinks} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="admin-main">
        <Outlet />
      </div>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
