-- ============================================================
-- Migración: Cierre de Brecha de Seguridad (RLS)
-- Se eliminan las políticas MVP permisivas y se aplican 
-- políticas estrictas basadas en roles.
-- ============================================================

-- 1. Eliminar las políticas inseguras antiguas
DROP POLICY IF EXISTS "actividades_write_mvp" ON public.actividades;
DROP POLICY IF EXISTS "inscripciones_all_mvp" ON public.inscripciones;
DROP POLICY IF EXISTS "reportes_all_mvp" ON public.reportes;

-- 2. Políticas Estrictas para ACTIVIDADES
-- Solo coordinadores y admins pueden crear/editar/borrar actividades
CREATE POLICY "actividades_insert_admin" ON public.actividades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('coordinador', 'admin'))
);
CREATE POLICY "actividades_update_admin" ON public.actividades FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('coordinador', 'admin'))
);
CREATE POLICY "actividades_delete_admin" ON public.actividades FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('coordinador', 'admin'))
);

-- 3. Políticas Estrictas para INSCRIPCIONES
-- Un estudiante solo puede inscribirse a sí mismo. Lectura pública.
CREATE POLICY "inscripciones_insert_self" ON public.inscripciones FOR INSERT WITH CHECK (
  auth.uid() = usuario_id
);
CREATE POLICY "inscripciones_delete_self" ON public.inscripciones FOR DELETE USING (
  auth.uid() = usuario_id
);
CREATE POLICY "inscripciones_select_all" ON public.inscripciones FOR SELECT USING (true);

-- 4. Políticas Estrictas para REPORTES
-- Cualquiera puede reportar (incluso anónimo), pero solo el autor o un admin puede editar su estado.
CREATE POLICY "reportes_insert_all" ON public.reportes FOR INSERT WITH CHECK (true);
CREATE POLICY "reportes_update_admin" ON public.reportes FOR UPDATE USING (
  auth.uid() = autor_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('coordinador', 'admin'))
);
CREATE POLICY "reportes_select_all" ON public.reportes FOR SELECT USING (true);
