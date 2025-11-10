import { AuthService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const token = AuthService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await AuthService.logout();
    throw new Error('Sesion expirada');
  }

  if (!response.ok) {
    const message = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (err) {
      parsed = null;
    }
    const errorMsg = parsed?.error || parsed?.message || message || 'Error de servidor';
    throw new Error(errorMsg);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Admin
  getMesas: () => request('/mesas'),
  createMesa: (data) => request('/mesas', { method: 'POST', body: JSON.stringify(data) }),
  updateMesa: (id, data) => request(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMesa: (id) => request(`/mesas/${id}`, { method: 'DELETE' }),

  getAvailability: (fecha) => request(`/reservas/disponibilidad?fecha=${fecha}`),
  getReservasPorFecha: (fecha) => request(`/reservas/fecha/${fecha}`),
  getReservasHoy: () => request('/reservas/hoy'),
  createReserva: (data) => request('/reservas', { method: 'POST', body: JSON.stringify(data) }),
  updateReserva: (id, data) => request(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReserva: (id, motivo) =>
    request(`/reservas/${id}`, {
      method: 'DELETE',
      body: motivo ? JSON.stringify({ motivo }) : undefined,
    }),
  getClientes: () => request('/clientes'),
  getClienteHistorialAdmin: (id) => request(`/clientes/${id}/historial`),

  // Cliente autenticado
  getMiPerfil: () => request('/clientes/mi-perfil'),
  updateMiPerfil: (data) => request('/clientes/mi-perfil', { method: 'PUT', body: JSON.stringify(data) }),
  getMisReservas: (estado) => request(`/clientes/mis-reservas${estado ? `?estado=${estado}` : ''}`),
  crearReservaCliente: (data) => request('/clientes/reservas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarReservaCliente: (id, data) => request(`/clientes/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelarReservaCliente: (id) => request(`/clientes/reservas/${id}`, { method: 'DELETE' }),
  historialCliente: () => request('/clientes/historial'),
  disponibilidadCliente: (fecha) => request(`/clientes/disponibilidad?fecha=${fecha}`),
};
