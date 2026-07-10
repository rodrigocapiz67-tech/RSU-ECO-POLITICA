import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

export interface CurrentUser {
  id: string;
  email?: string;
  rol: string;
}

/**
 * Devuelve el usuario autenticado (con su rol del profile) o null si no hay
 * sesión. Pensado para usarse en Route Handlers y Server Components.
 */
export async function GetCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await CreateSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  // Si falla la query de profile, retornar null (no fallback unsafe a 'usuario')
  if (profileError || !profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? undefined,
    rol: profile.rol,
  };
}
