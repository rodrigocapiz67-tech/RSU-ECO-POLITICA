-- ============================================================
-- RSU Eco Política — Migración Fase 2: Brigada Ambiental
-- Tablas y modificaciones para soportar los requerimientos de la
-- Facultad de Economía.
-- ============================================================

-- 1. Actualizar roles para incluir 'brigadista' y estado
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check 
  CHECK (rol in ('usuario', 'coordinador', 'admin', 'brigadista'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado_brigadista text 
  CHECK (estado_brigadista in ('activo', 'inactivo'));

-- 2. Tabla para registrar Asistencia real (separada de inscripciones)
-- Permite medir la meta de 130 personas en los Foros.
create table if not exists public.asistencias (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.actividades (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  confirmado_por uuid references public.profiles(id), -- Quién validó la asistencia
  created_at timestamptz not null default now(),
  unique (actividad_id, usuario_id) -- Un usuario solo asiste una vez por evento
);

-- Habilitar RLS para asistencias
alter table public.asistencias enable row level security;
create policy "asistencias_read_all" on public.asistencias for select using (true);
create policy "asistencias_insert_coordinador" on public.asistencias for insert 
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and rol in ('coordinador', 'admin')
    )
  );

-- 3. Tabla para Materiales Educativos (Difusión)
create table if not exists public.materiales_educativos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo_recurso text not null check (tipo_recurso in ('afiche', 'infografia')),
  url_archivo text not null,
  meta_alcance integer not null default 500, -- Meta de 500 estudiantes
  created_at timestamptz not null default now()
);

alter table public.materiales_educativos enable row level security;
create policy "materiales_read_all" on public.materiales_educativos for select using (true);

-- 4. Tabla para Seguimiento del Alcance (Quién vio el material)
create table if not exists public.alcance_difusion (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materiales_educativos (id) on delete cascade,
  estudiante_id uuid not null references public.profiles (id) on delete cascade,
  fecha_visualizacion timestamptz not null default now(),
  unique (material_id, estudiante_id) -- Contabiliza al estudiante solo una vez por material
);

alter table public.alcance_difusion enable row level security;
create policy "alcance_insert_own" on public.alcance_difusion for insert 
  with check (auth.uid() = estudiante_id);
create policy "alcance_read_all" on public.alcance_difusion for select using (true);

-- ============================================================
-- NOTA: Con la regla UNIQUE en alcance_difusion, la base de datos
-- protege automáticamente la integridad de las métricas. Para saber
-- si se llegó a la meta de 500, basta hacer un:
-- SELECT count(*) FROM alcance_difusion WHERE material_id = X;
-- ============================================================
