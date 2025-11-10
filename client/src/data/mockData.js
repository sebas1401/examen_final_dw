export const mockStats = {
  reservasDia: 18,
  ocupacion: 72,
  mesasDisponibles: 6,
  capacidadReservada: 54,
};

export const mockTimeSlots = Array.from({ length: ((22 - 8) * 60) / 30 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
});

export const mockAvailability = [
  {
    mesaId: 1,
    numero: 1,
    capacidad: 4,
    slots: mockTimeSlots.map((hora, index) => ({
      hora,
      disponible: index % 2 === 0,
    })),
  },
  {
    mesaId: 2,
    numero: 2,
    capacidad: 2,
    slots: mockTimeSlots.map((hora, index) => ({
      hora,
      disponible: index % 3 !== 0,
    })),
  },
];

export const mockReservas = [
  {
    id: 1,
    fechaHora: '2025-11-08T12:30:00',
    numeroPersonas: 2,
    estado: 'CONFIRMADA',
    cliente: { nombre: 'Maria Ruiz' },
    mesa: { numero: 4 },
    preferenciaZona: 'TERRAZA',
  },
  {
    id: 2,
    fechaHora: '2025-11-08T13:00:00',
    numeroPersonas: 4,
    estado: 'PENDIENTE',
    cliente: { nombre: 'Juan Lopez' },
    mesa: { numero: 6 },
    preferenciaZona: 'INTERIOR',
  },
];

export const mockMesas = [
  { id: 1, numero: 1, capacidad: 2, ubicacion: 'Ventana' },
  { id: 2, numero: 2, capacidad: 4, ubicacion: 'Interior' },
  { id: 3, numero: 3, capacidad: 6, ubicacion: 'Terraza' },
];

export const mockClientes = [
  { id: 1, nombre: 'Valeria Contreras' },
  { id: 2, nombre: 'Carlos Perez' },
];

export const mockHistorial = {
  nombre: 'Valeria Contreras',
  telefono: '+52 55 1234 5678',
  email: 'valeria@example.com',
  reservas: [
    {
      id: 11,
      fechaHora: '2025-11-08 13:00',
      mesa: { numero: 4 },
      numeroPersonas: 3,
      estado: 'COMPLETADA',
      preferenciaZona: 'VIP',
    },
  ],
};
