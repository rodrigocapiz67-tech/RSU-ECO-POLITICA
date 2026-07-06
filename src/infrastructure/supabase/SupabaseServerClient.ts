import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase ligado a las cookies de la petición (Server Components y
 * Route Handlers). Lee la sesión del usuario autenticado. En Next 16
 * `cookies()` es asíncrono, por eso la fábrica es async.
 */
export async function CreateSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  if (!url || !key) {
    throw new Error('Supabase URL y key deben estar definidas en el entorno');
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Invocado desde un Server Component (cookies de solo lectura).
          // El middleware se encarga de refrescar la sesión.
        }
      },
    },
  });
}
