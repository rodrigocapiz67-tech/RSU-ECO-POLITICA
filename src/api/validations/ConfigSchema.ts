import { z } from 'zod';

export const CreateConfigSchema = z.object({
  key: z.string()
    .min(1, 'La key es obligatoria')
    .max(100, 'La key no puede exceder los 100 caracteres')
    .regex(/^[a-z0-9_.-]+$/i, 'La key solo puede contener letras, números, guiones y puntos'),

  value: z.record(z.string(), z.unknown())
    .refine((value) => JSON.stringify(value).length <= 10_000, 'El value es demasiado grande'),

  scope: z.enum(['global', 'tenant', 'user']).optional(),

  description: z.string().max(500, 'La descripción es demasiado larga').optional(),
});
