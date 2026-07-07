import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceClientInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase con la service-role key: salta RLS por completo.
 * NO USADO ACTUALMENTE por los repositorios (ver `SupabaseServerClient.ts`,
 * que usan el cliente atado a cookies del usuario y por lo tanto SÍ respeta
 * RLS). Este cliente queda disponible para tareas server-side que
 * deliberadamente necesiten saltarse RLS (jobs, migraciones de datos, admin
 * tooling); si lo usas en una API route, la autorización deja de depender
 * de las políticas RLS y pasa a ser responsabilidad exclusiva del código
 * que la invoque.
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
