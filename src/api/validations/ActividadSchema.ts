import { z } from 'zod';

export const CreateActividadSchema = z.object({
  titulo: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150, 'El título no puede exceder los 150 caracteres'),

  descripcion: z.string()
    .max(2000, 'La descripción es demasiado larga')
    .optional()
    .default(''),

  fecha: z.iso.datetime({ message: 'La fecha debe ser un ISO 8601 válido (ej. 2026-08-01T10:00:00.000Z)' }),

  ubicacion: z.string()
    .max(200, 'La ubicación es demasiado larga')
    .optional()
    .default(''),

  cupoMaximo: z.number()
    .int('El cupo máximo debe ser un número entero')
    .positive('El cupo máximo debe ser mayor a 0')
    .max(10000, 'El cupo máximo no es razonable')
    .optional()
    .default(30),
});
