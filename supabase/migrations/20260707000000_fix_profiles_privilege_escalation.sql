-- ============================================================
-- Migración: Cierre de brechas en `profiles` y RPC de brigadistas
--
-- 1. `profiles_update_own` permitía a cualquier usuario autenticado
--    cambiar su propio `rol`/`estado_brigadista` vía un UPDATE directo
--    (p.ej. desde el cliente browser con la clave publishable),
--    saltándose por completo los checks de admin/coordinador de las
--    API routes. Se añade un trigger que bloquea ese cambio salvo
--    que provenga de un contexto con privilegios elevados
--    (RPC `SECURITY DEFINER` o `service_role`).
--
-- 2. `inscribir_brigadista` aceptaba `p_usuario_id` sin verificar que
--    coincidiera con el usuario autenticado, permitiendo inscribir
--    (o consumir el cupo de 90) a cualquier otro usuario. Ahora se
--    valida contra `auth.uid()` y se fija `search_path` (hardening
--    estándar para funciones `SECURITY DEFINER`).
--
-- 3. `profiles_select_all` exponía `email` (PII) de todos los
--    usuarios a cualquiera con la anon key. Se restringe la lectura
--    de la tabla base a la propia fila y se crea una vista pública
--    `profiles_public` sin columnas sensibles para los usos que sí
--    necesiten listar nombre/rol de otros usuarios.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Trigger anti-escalado de privilegios en profiles
-- ------------------------------------------------------------
create or replace function public.prevent_rol_privilege_escalation()
returns trigger
language plpgsql
security definer
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

drop trigger if exists trg_profiles_prevent_rol_escalation on public.profiles;
create trigger trg_profiles_prevent_rol_escalation
  before update on public.profiles
  for each row execute function public.prevent_rol_privilege_escalation();

-- ------------------------------------------------------------
-- 2. RPC inscribir_brigadista: forzar auth.uid() y fijar search_path
-- ------------------------------------------------------------
create or replace function public.inscribir_brigadista(p_usuario_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_count integer;
  v_ya_es_brigadista boolean;
BEGIN
  -- Nadie puede inscribir a otro usuario; solo a sí mismo.
  IF p_usuario_id IS DISTINCT FROM auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'No puedes inscribir a otro usuario en la brigada.');
  END IF;

  -- 1. ADVISORY LOCK: Bloqueo a nivel de transacción
  PERFORM pg_advisory_xact_lock(1001);

  -- 2. Validar si el usuario ya es brigadista activo
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'brigadista' AND estado_brigadista = 'activo'
  ) INTO v_ya_es_brigadista;

  IF v_ya_es_brigadista THEN
    RETURN json_build_object('success', false, 'error', 'El usuario ya es un brigadista activo.');
  END IF;

  -- 3. Contar brigadistas activos actuales
  SELECT count(*) INTO v_count
  FROM public.profiles
  WHERE rol = 'brigadista' AND estado_brigadista = 'activo';

  -- 4. Validar Regla de Negocio (Límite 90)
  IF v_count >= 90 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CUPO_LLENO: La brigada ambiental ha alcanzado el límite máximo de 90 estudiantes activos.'
    );
  END IF;

  -- 5. Efectuar la inscripción (siempre sobre el propio usuario autenticado)
  UPDATE public.profiles
  SET
    rol = 'brigadista',
    estado_brigadista = 'activo',
    updated_at = now()
  WHERE id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'message', 'Inscripción a la brigada exitosa.',
    'cupos_restantes', 90 - (v_count + 1)
  );
END;
$$;

-- ------------------------------------------------------------
-- 3. profiles: dejar de exponer email públicamente
-- ------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

-- Vista pública sin columnas sensibles (sin email), para listar
-- nombre/rol de otros usuarios cuando la app lo necesite.
create or replace view public.profiles_public as
  select id, nombre, rol, created_at
  from public.profiles;

grant select on public.profiles_public to anon, authenticated;
