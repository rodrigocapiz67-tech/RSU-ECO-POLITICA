import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceClientInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase con la service-role key: solo se invoca desde código
 * server-side (repositorios, route handlers). Salta RLS, por eso la
 * autorización (rol/dueño del recurso) se valida antes en la capa de
 * aplicación (ver `GetCurrentUser` + checks en cada route handler).
 */
export function CreateServerSupabaseClient(): SupabaseClient {
  if (!serviceClientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !serviceKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas en el entorno');
    }

    serviceClientInstance = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  return serviceClientInstance;
}
