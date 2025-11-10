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
    CREATE TABLE IF NOT EXISTS Usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      telefono TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'CLIENTE',
      fechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      activo INTEGER NOT NULL DEFAULT 1,
      tokenRecuperacion TEXT,
      emailVerificado INTEGER NOT NULL DEFAULT 0,
      avatarUrl TEXT
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL UNIQUE,
      puntosFidelidad INTEGER NOT NULL DEFAULT 0,
      nivelCliente TEXT NOT NULL DEFAULT 'NUEVO',
      preferencias TEXT,
      ultimaVisita DATETIME,
      totalReservas INTEGER NOT NULL DEFAULT 0,
      reservasCanceladas INTEGER NOT NULL DEFAULT 0,
      nombre TEXT,
      telefono TEXT,
      email TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuarioId) REFERENCES Usuario(id)
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
      comentarios TEXT,
      preferenciaZona TEXT NOT NULL DEFAULT 'SIN_PREFERENCIA',
      motivoCancelacion TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clienteId) REFERENCES Cliente(id),
      FOREIGN KEY (mesaId) REFERENCES Mesa(id)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS Sesion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fechaExpiracion DATETIME NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      FOREIGN KEY (usuarioId) REFERENCES Usuario(id)
    );
  `);

  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_mesa_fecha ON Reserva(mesaId, fechaHora);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_reserva_fecha ON Reserva(fechaHora);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_reserva_cliente ON Reserva(clienteId);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_usuario_email ON Usuario(email);');

  const reservaColumns = await prisma.$queryRawUnsafe('PRAGMA table_info(Reserva);');
  const columnNames = Array.isArray(reservaColumns) ? reservaColumns.map((col) => col.name) : [];
  if (!columnNames.includes('preferenciaZona')) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE Reserva ADD COLUMN preferenciaZona TEXT NOT NULL DEFAULT 'SIN_PREFERENCIA';",
    );
  }
  if (!columnNames.includes('motivoCancelacion')) {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE Reserva ADD COLUMN motivoCancelacion TEXT;",
    );
  }
}

module.exports = { initSqliteSchema };
