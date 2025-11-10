import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RecoveryPage } from './pages/auth/RecoveryPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { ClienteLayout } from './layouts/ClienteLayout';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { ReservationFormScreen } from './screens/ReservationFormScreen';
import { MesasScreen } from './screens/MesasScreen';
import { ClienteHistorialScreen } from './screens/ClienteHistorialScreen';
import { AdminProfileScreen } from './screens/AdminProfileScreen';
import { AdminSettingsScreen } from './screens/AdminSettingsScreen';
import { ClienteDashboard } from './pages/cliente/ClienteDashboard';
import { ClienteReservas } from './pages/cliente/ClienteReservas';
import { ClienteNuevaReserva } from './pages/cliente/ClienteNuevaReserva';
import { ClientePerfil } from './pages/cliente/ClientePerfil';

function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-root">
      <div className="bg-layer gradient-layer" />
      <div className="bg-layer orbs-layer">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="bg-layer pattern-layer" />
      <div className={`app-shell ${scrolled ? 'is-scrolled' : ''}`}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar" element={<RecoveryPage />} />
              <Route path="/resetear/:token" element={<ResetPasswordPage />} />

              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboardScreen />} />
                  <Route path="calendario" element={<CalendarScreen />} />
                  <Route path="nueva" element={<ReservationFormScreen />} />
                  <Route path="mesas" element={<MesasScreen />} />
                  <Route path="clientes" element={<ClienteHistorialScreen />} />
                  <Route path="perfil" element={<AdminProfileScreen />} />
                  <Route path="configuracion" element={<AdminSettingsScreen />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute requiredRole="CLIENTE" />}>
                <Route path="/cliente" element={<ClienteLayout />}>
                  <Route path="inicio" element={<ClienteDashboard />} />
                  <Route path="reservas" element={<ClienteReservas />} />
                  <Route path="nueva" element={<ClienteNuevaReserva />} />
                  <Route path="perfil" element={<ClientePerfil />} />
                  <Route index element={<Navigate to="inicio" replace />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
