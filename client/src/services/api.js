const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error de servidor');
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getMesas: () => request('/mesas'),
  createMesa: (data) => request('/mesas', { method: 'POST', body: JSON.stringify(data) }),
  updateMesa: (id, data) => request(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMesa: (id) => request(`/mesas/${id}`, { method: 'DELETE' }),
  getAvailability: (fecha) => request(`/reservas/disponibilidad?fecha=${fecha}`),
  getReservasPorFecha: (fecha) => request(`/reservas/fecha/${fecha}`),
  getReservasHoy: () => request('/reservas/hoy'),
  createReserva: (data) => request('/reservas', { method: 'POST', body: JSON.stringify(data) }),
  updateReserva: (id, data) => request(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReserva: (id) => request(`/reservas/${id}`, { method: 'DELETE' }),
  getClientes: () => request('/clientes'),
  getClienteHistorial: (id) => request(`/clientes/${id}/historial`),
};
