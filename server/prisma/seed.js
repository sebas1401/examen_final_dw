/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../src/prisma');
const { initSqliteSchema } = require('../src/dbInit');

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
  console.log('Mesas iniciales creadas/actualizadas');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
