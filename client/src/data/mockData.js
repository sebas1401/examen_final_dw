export const stats = {
  reservasDia: 18,
  ocupacion: 72,
  mesasDisponibles: 6,
  capacidadReservada: 54,
};

export const timeSlots = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export const calendarData = [
  {
    mesa: 'Mesa 1',
    slots: [
      { hora: '12:00 PM', estado: 'full', cliente: 'Ana · Mesa 1' },
      { hora: '1:00 PM', estado: 'medium', cliente: 'Libre 1PM' },
      { hora: '2:00 PM', estado: 'available', cliente: 'Libre' },
      { hora: '3:00 PM', estado: 'available', cliente: '' },
      { hora: '4:00 PM', estado: 'full', cliente: 'Carlos · Mesa 1' },
    ],
  },
  {
    mesa: 'Mesa 2',
    slots: [
      { hora: '12:00 PM', estado: 'medium', cliente: 'Lucía' },
      { hora: '1:00 PM', estado: 'medium', cliente: 'Reservada' },
      { hora: '2:00 PM', estado: 'full', cliente: 'Equipo 4 pax' },
      { hora: '3:00 PM', estado: 'available', cliente: '' },
      { hora: '4:00 PM', estado: 'available', cliente: '' },
    ],
  },
  {
    mesa: 'Mesa 3',
    slots: [
      { hora: '12:00 PM', estado: 'available', cliente: '' },
      { hora: '1:00 PM', estado: 'available', cliente: '' },
      { hora: '2:00 PM', estado: 'medium', cliente: 'Mesa compartida' },
      { hora: '3:00 PM', estado: 'full', cliente: 'Evento familiar' },
      { hora: '4:00 PM', estado: 'full', cliente: 'Evento familiar' },
    ],
  },
];

export const reservasHoy = [
  { hora: '12:30 PM', cliente: 'María Ruiz', mesa: 'Mesa 4', pax: 2, estado: 'CONFIRMADA' },
  { hora: '1:00 PM', cliente: 'Juan López', mesa: 'Mesa 6', pax: 4, estado: 'PENDIENTE' },
  { hora: '2:15 PM', cliente: 'Familia Chávez', mesa: 'Mesa 8', pax: 5, estado: 'CONFIRMADA' },
];

export const mesasData = [
  { numero: 'Mesa 1', capacidad: 2, ubicacion: 'Ventana', estado: 'Disponible' },
  { numero: 'Mesa 2', capacidad: 4, ubicacion: 'Interior', estado: 'Ocupada' },
  { numero: 'Mesa 3', capacidad: 6, ubicacion: 'Terraza', estado: 'Mantenimiento' },
  { numero: 'Mesa 4', capacidad: 4, ubicacion: 'VIP', estado: 'Disponible' },
];

export const reservasTabla = [
  { hora: '12:00 PM', cliente: 'Ana Pérez', mesa: 'Mesa 1', personas: 2, estado: 'Confirmada' },
  { hora: '1:00 PM', cliente: 'Luis Torres', mesa: 'Mesa 5', personas: 4, estado: 'Pendiente' },
  { hora: '2:00 PM', cliente: 'Elena Díaz', mesa: 'Mesa 2', personas: 3, estado: 'Cancelada' },
  { hora: '3:00 PM', cliente: 'Grupo Empresa', mesa: 'Mesa 7', personas: 6, estado: 'Confirmada' },
];

export const historialCliente = {
  nombre: 'Valeria Contreras',
  telefono: '+52 55 1234 5678',
  email: 'valeria@example.com',
  stats: {
    visitas: 15,
    ultimaVisita: '01/11/2025',
    cancelaciones: 2,
    puntos: 150,
  },
  reservas: [
    { fecha: '08 Nov 2025', hora: '13:00', mesa: 'Mesa 4', personas: 3, estado: 'Completada' },
    { fecha: '29 Oct 2025', hora: '14:30', mesa: 'Mesa 2', personas: 2, estado: 'Cancelada' },
    { fecha: '11 Oct 2025', hora: '12:00', mesa: 'Mesa 6', personas: 5, estado: 'Completada' },
  ],
};
