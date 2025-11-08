const prisma = require('../prisma');
const { clienteSchema } = require('../validators/schemas');

async function listClientes(req, res, next) {
  try {
    const clientes = await prisma.cliente.findMany({ orderBy: { nombre: 'asc' } });
    res.json(clientes);
  } catch (err) { next(err); }
}

async function createCliente(req, res, next) {
  try {
    const data = clienteSchema.parse(req.body);
    const created = await prisma.cliente.create({ data });
    res.status(201).json(created);
  } catch (err) { next(err); }
}

async function getHistorial(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { reservas: { orderBy: { fechaHora: 'desc' }, include: { mesa: true } } },
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (err) { next(err); }
}

module.exports = { listClientes, createCliente, getHistorial };

