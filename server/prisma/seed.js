/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../src/prisma');
const { initSqliteSchema } = require('../src/dbInit');
const bcrypt = require('bcryptjs');

async function main() {
  await initSqliteSchema();
  const mesasData = [
    { numero: 1, capacidad: 2, ubicacion: 'Ventana' },
    { numero: 2, capacidad: 2, ubicacion: 'Central' },
    { numero: 3, capacidad: 4, ubicacion: 'Terraza' },
    { numero: 4, capacidad: 4, ubicacion: 'Esquina' },
    { numero: 5, capacidad: 6, ubicacion: 'Privada' },
  ];
  for (const m of mesasData) {
    await prisma.mesa.upsert({
      where: { numero: m.numero },
      update: {},
      create: m,
    });
  }
  console.log('Mesas iniciales listas');

  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin123*', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@restaurante.com',
      password: adminPassword,
      telefono: '0000000000',
      rol: 'ADMIN',
      activo: true,
      emailVerificado: true,
    },
  });

  const clientePassword = await bcrypt.hash('Cliente123*', 10);
  const usuarioCliente = await prisma.usuario.upsert({
    where: { email: 'cliente@restaurante.com' },
    update: {},
    create: {
      nombre: 'Cliente Demo',
      email: 'cliente@restaurante.com',
      password: clientePassword,
      telefono: '5551234567',
      rol: 'CLIENTE',
      emailVerificado: true,
    },
  });

  await prisma.cliente.upsert({
    where: { usuarioId: usuarioCliente.id },
    update: {},
    create: {
      usuarioId: usuarioCliente.id,
      nivelCliente: 'FRECUENTE',
      puntosFidelidad: 80,
      preferencias: { mesa_preferida: 'Ventana' },
      totalReservas: 3,
    },
  });
  console.log('Usuarios semilla creados');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
