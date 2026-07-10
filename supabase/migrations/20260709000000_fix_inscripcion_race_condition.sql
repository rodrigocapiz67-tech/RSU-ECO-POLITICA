-- ============================================================
-- Migración: Cierre de Race Condition en Inscripción a Actividades
--
-- PROBLEMA: InscribirUsuarioHandler hace check-then-act sin atomicidad.
-- Dos requests concurrentes pueden leer el mismo cupo disponible y
-- ambos inscribirse, violando el límite.
--
-- SOLUCIÓN: RPC con advisory lock para serializar inscripciones.
-- ============================================================

CREATE OR REPLACE FUNCTION public.inscribir_en_actividad(
  p_actividad_id uuid,
  p_usuario_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cupo_maximo integer;
  v_inscritos integer;
  v_ya_inscrito boolean;
BEGIN
  -- 1. ADVISORY LOCK: Evita race condition
  PERFORM pg_advisory_xact_lock(hashtext(p_actividad_id::text));

  -- 2. Verificar que actividad existe
  SELECT cupo_maximo INTO v_cupo_maximo
  FROM public.actividades
  WHERE id = p_actividad_id AND deleted_at IS NULL;

  IF v_cupo_maximo IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Actividad no encontrada');
  END IF;

  -- 3. Verificar si ya está inscrito
  SELECT EXISTS (
    SELECT 1 FROM public.inscripciones
    WHERE actividad_id = p_actividad_id
      AND usuario_id = p_usuario_id
      AND deleted_at IS NULL
  ) INTO v_ya_inscrito;

  IF v_ya_inscrito THEN
    RETURN json_build_object('success', false, 'error', 'El usuario ya está inscrito en esta actividad');
  END IF;

  -- 4. Contar inscritos actuales
  SELECT count(*) INTO v_inscritos
  FROM public.inscripciones
  WHERE actividad_id = p_actividad_id AND deleted_at IS NULL;

  -- 5. Verificar cupo
  IF v_inscritos >= v_cupo_maximo THEN
    RETURN json_build_object('success', false, 'error', 'La actividad ya alcanzó su cupo máximo');
  END IF;

  -- 6. Crear inscripción (bajo el lock)
  INSERT INTO public.inscripciones (id, actividad_id, usuario_id)
  VALUES (gen_random_uuid(), p_actividad_id, p_usuario_id);

  RETURN json_build_object(
    'success', true,
    'message', 'Inscripción exitosa',
    'cupos_restantes', v_cupo_maximo - (v_inscritos + 1)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inscribir_en_actividad(uuid, uuid) TO authenticated, anon;
