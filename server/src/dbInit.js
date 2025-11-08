const prisma = require('./prisma');

async function initSqliteSchema() {
  // Enable foreign keys
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Mesa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL UNIQUE,
      capacidad INTEGER NOT NULL,
      ubicacion TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT UNIQUE,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Reserva (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER NOT NULL,
      mesaId INTEGER NOT NULL,
      fechaHora DATETIME NOT NULL,
      numeroPersonas INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'CONFIRMADA',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clienteId) REFERENCES Cliente(id),
      FOREIGN KEY (mesaId) REFERENCES Mesa(id)
    );
  `);

  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_mesa_fecha ON Reserva(mesaId, fechaHora);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_reserva_fecha ON Reserva(fechaHora);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_reserva_cliente ON Reserva(clienteId);');
}

module.exports = { initSqliteSchema };

