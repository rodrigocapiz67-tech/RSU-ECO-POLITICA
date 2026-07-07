import { z } from 'zod';

// Zod Schema para la creación de reportes.
// Define estrictamente los tipos de datos, los enums permitidos en la BD y las longitudes.
export const CreateReporteSchema = z.object({
  titulo: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder los 100 caracteres'),
  
  descripcion: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción es demasiado larga'),
  
  categoria: z.enum(['residuos', 'agua', 'energia', 'ruido', 'area_verde', 'movilidad', 'otro'], {
    message: 'La categoría seleccionada no es válida',
  }),

  prioridad: z.enum(['baja', 'media', 'alta', 'critica'], {
    message: 'Prioridad inválida',
  }).optional(),
  
  ubicacion: z.string().min(3, 'Debes especificar una ubicación válida'),
  
  esAnonimo: z.boolean().optional().default(false),
  
  fotoUrl: z.string().url('El formato de la URL de la foto no es válido').optional(),
});
