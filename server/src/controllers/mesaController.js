const prisma = require('../prisma');
const { mesaSchema } = require('../validators/schemas');

async function listMesas(req, res, next) {
  try {
    const mesas = await prisma.mesa.findMany({ orderBy: { numero: 'asc' } });
    res.json(mesas);
  } catch (err) { next(err); }
}

async function createMesa(req, res, next) {
  try {
    const data = mesaSchema.parse(req.body);
    const created = await prisma.mesa.create({ data });
    res.status(201).json(created);
  } catch (err) { next(err); }
}

async function updateMesa(req, res, next) {
  try {
    const id = Number(req.params.id);
    const data = mesaSchema.partial().parse(req.body);
    const updated = await prisma.mesa.update({ where: { id }, data });
    res.json(updated);
  } catch (err) { next(err); }
}

async function deleteMesa(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.mesa.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listMesas, createMesa, updateMesa, deleteMesa };

