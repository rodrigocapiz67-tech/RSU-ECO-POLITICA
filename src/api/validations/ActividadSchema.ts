import { z } from 'zod';

const futureLimit = new Date();
futureLimit.setFullYear(futureLimit.getFullYear() + 2);

export const CreateActividadSchema = z.object({
  titulo: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150, 'El título no puede exceder los 150 caracteres'),

  descripcion: z.string()
    .max(2000, 'La descripción es demasiado larga')
    .optional()
    .default(''),

  fecha: z.coerce.date()
    .min(new Date(), 'La actividad no puede ser en el pasado')
    .max(futureLimit, 'La actividad debe ocurrir dentro de 2 años')
    .refine((date) => {
      const iso = date.toISOString();
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(iso);
    }, 'La fecha debe ser un ISO 8601 válido'),

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
