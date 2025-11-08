const app = require('./app');
const { initSqliteSchema } = require('./dbInit');
const prisma = require('./prisma');

async function start() {
  try {
    await initSqliteSchema();
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API corriendo en http://localhost:${port}`);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error inicializando BD', e);
  } finally {
    // do not disconnect prisma here because server needs it
  }
}

start();
