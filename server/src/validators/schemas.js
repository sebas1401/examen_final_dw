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
  password: z.string().min(8).optional(),
});

const preferenciaZonaEnum = z.enum(['SIN_PREFERENCIA', 'TERRAZA', 'INTERIOR', 'VIP']);

const reservaCreateSchema = z.object({
  cliente: clienteSchema.optional(),
  clienteId: z.number().int().positive().optional(),
  mesaId: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  numeroPersonas: z.number().int().positive(),
  comentarios: z.string().max(500).optional(),
  preferenciaZona: preferenciaZonaEnum.optional(),
});

const reservaUpdateSchema = z.object({
  mesaId: z.number().int().positive().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  numeroPersonas: z.number().int().positive().optional(),
  estado: z.enum(['CONFIRMADA', 'CANCELADA', 'COMPLETADA']).optional(),
  preferenciaZona: preferenciaZonaEnum.optional(),
});

const registroSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  telefono: z.string().min(7),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const perfilClienteUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  telefono: z.string().min(7).optional(),
  preferencias: z.any().optional(),
});

const reservaClienteSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  numeroPersonas: z.number().int().positive(),
  mesaId: z.number().int().positive().optional(),
  comentarios: z.string().max(500).optional(),
  preferenciaZona: preferenciaZonaEnum.optional(),
});

const passwordResetRequestSchema = z.object({ email: z.string().email() });

const passwordResetSchema = z.object({
  token: z.string().min(10),
  nuevaPassword: z.string().min(8),
});

module.exports = {
  mesaSchema,
  clienteSchema,
  reservaCreateSchema,
  reservaUpdateSchema,
  registroSchema,
  loginSchema,
  perfilClienteUpdateSchema,
  reservaClienteSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
};
