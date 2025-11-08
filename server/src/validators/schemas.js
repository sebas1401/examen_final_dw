const { z } = require('zod');

const mesaSchema = z.object({
  numero: z.number().int().positive(),
  capacidad: z.number().int().positive(),
  ubicacion: z.string().min(1),
});

const clienteSchema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().min(7),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
});

const reservaCreateSchema = z.object({
  cliente: clienteSchema.optional(),
  clienteId: z.number().int().positive().optional(),
  mesaId: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  numeroPersonas: z.number().int().positive(),
});

const reservaUpdateSchema = z.object({
  mesaId: z.number().int().positive().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  numeroPersonas: z.number().int().positive().optional(),
  estado: z.enum(['CONFIRMADA', 'CANCELADA', 'COMPLETADA']).optional(),
});

module.exports = {
  mesaSchema,
  clienteSchema,
  reservaCreateSchema,
  reservaUpdateSchema,
};

