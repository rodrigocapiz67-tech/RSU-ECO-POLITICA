-- ============================================================
-- Migración: corrige el trigger anti-escalado de privilegios
--
-- BUG: `prevent_rol_privilege_escalation` (creada en
-- 20260707000000_fix_profiles_privilege_escalation.sql) se declaró
-- `SECURITY DEFINER`. Dentro de una función SECURITY DEFINER,
-- `current_user` es SIEMPRE el dueño de la función (`postgres`),
-- sin importar quién disparó el UPDATE. Como resultado, el check
-- `current_user not in ('postgres', 'service_role', 'supabase_admin')`
-- nunca era verdadero y el trigger jamás bloqueaba nada: un usuario
-- autenticado seguía pudiendo hacer
--   supabase.from('profiles').update({ rol: 'admin' }).eq('id', uid)
-- y auto-escalar privilegios. La brecha original NO quedó cerrada.
--
-- FIX: quitar `security definer` (queda `security invoker`, el
-- default). Así, cuando el UPDATE lo dispara un usuario autenticado
-- vía PostgREST, current_user dentro del trigger es 'authenticated'
-- (bloqueado). Cuando lo dispara `inscribir_brigadista` (que sigue
-- siendo SECURITY DEFINER), current_user sigue siendo 'postgres'
-- durante toda la ejecución de esa función, incluyendo los triggers
-- que dispara — por lo tanto la inscripción a la brigada sigue
-- funcionando sin cambios.
-- ============================================================

create or replace function public.prevent_rol_privilege_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.rol is distinct from old.rol or new.estado_brigadista is distinct from old.estado_brigadista)
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'No tienes permiso para modificar el rol o el estado de brigadista directamente.';
  end if;
  return new;
end;
$$;
