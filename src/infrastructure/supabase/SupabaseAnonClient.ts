import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../../config/env';

let anonClientInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase Anónimo (solo lectura de datos públicos).
 * Al NO leer cookies(), es perfectamente seguro usarlo dentro de `unstable_cache`
 * en Next.js para lograr tiempos de respuesta hiper-rápidos (Global Server Cache).
 */
export function CreateSupabaseAnonClient(): SupabaseClient {
  if (!anonClientInstance) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getEnv();

    // Instancia limpia y sin estado (no guarda sesión local)
    anonClientInstance = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
  }

  return anonClientInstance;
}
