-- ============================================================
-- Migración: RPC para inscripción segura de brigadistas
-- Evita condiciones de carrera (Race Conditions) y valida el 
-- límite estricto de 90 brigadistas a nivel transaccional.
-- ============================================================

CREATE OR REPLACE FUNCTION public.inscribir_brigadista(p_usuario_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del creador para asegurar que puede hacer el Lock
AS $$
DECLARE
  v_count integer;
  v_ya_es_brigadista boolean;
BEGIN
  -- 1. ADVISORY LOCK: Bloqueo a nivel de transacción
  -- Evita que dos peticiones concurrentes lean el mismo 'count' simultáneamente.
  -- 1001 es un ID arbitrario único para la operación de la "Brigada".
  PERFORM pg_advisory_xact_lock(1001);

  -- 2. Validar si el usuario ya es brigadista activo
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_usuario_id AND rol = 'brigadista' AND estado_brigadista = 'activo'
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

  -- 5. Efectuar la inscripción
  UPDATE public.profiles
  SET 
    rol = 'brigadista',
    estado_brigadista = 'activo',
    updated_at = now()
  WHERE id = p_usuario_id;

  -- Retornar éxito y cupos restantes
  RETURN json_build_object(
    'success', true, 
    'message', 'Inscripción a la brigada exitosa.', 
    'cupos_restantes', 90 - (v_count + 1)
  );
END;
$$;
