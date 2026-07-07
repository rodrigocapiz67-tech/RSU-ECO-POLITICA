import { z } from 'zod';

// Validamos que las variables de entorno existan y tengan el formato correcto
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Debe ser una URL válida (ej. https://xxx.supabase.co)'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, 'La clave anónima es requerida y debe ser larga'),
});

export const getEnv = () => {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    console.error('❌ FATAL ERROR: Variables de entorno inválidas o faltantes:', parsed.error.format());
    throw new Error('El sistema no puede iniciar porque las variables de entorno son incorrectas.');
  }
  
  return parsed.data;
};
