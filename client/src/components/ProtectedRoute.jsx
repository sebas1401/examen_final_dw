import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // o un spinner de carga
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

