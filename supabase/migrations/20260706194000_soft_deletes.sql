-- ============================================================
-- Migración: Implementación de Soft Deletes (Eliminación Lógica)
-- Evita la pérdida permanente de datos históricos añadiendo
-- la columna deleted_at a las tablas principales.
-- ============================================================

ALTER TABLE public.actividades ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.inscripciones ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.materiales_educativos ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Crear índices para optimizar las consultas que filtran por deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_actividades_deleted_at ON public.actividades (deleted_at);
CREATE INDEX IF NOT EXISTS idx_inscripciones_deleted_at ON public.inscripciones (deleted_at);
CREATE INDEX IF NOT EXISTS idx_reportes_deleted_at ON public.reportes (deleted_at);
