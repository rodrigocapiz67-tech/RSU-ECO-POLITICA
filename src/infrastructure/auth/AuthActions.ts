'use server';

import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/**
 * Registro con email/contraseña. El profile se crea automáticamente vía el
 * trigger `handle_new_user` en la base de datos.
 */
export async function SignUp(
  email: string,
  password: string,
  nombre: string,
): Promise<AuthResult> {
  const supabase = await CreateSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function SignIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await CreateSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function SignOut(): Promise<AuthResult> {
  const supabase = await CreateSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
