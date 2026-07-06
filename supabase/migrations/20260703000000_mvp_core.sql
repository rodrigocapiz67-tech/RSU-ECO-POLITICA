-- ============================================================
-- RSU Eco Política — Migración MVP Core
-- Tablas: profiles, actividades, inscripciones, reportes
-- ============================================================

-- ------------------------------------------------------------
-- Helper: trigger para mantener updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- profiles  (extiende auth.users con datos de la app)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text,
  email       text unique not null,
  rol         text not null default 'usuario'
              check (rol in ('usuario', 'coordinador', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el profile automáticamente al registrarse un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, new.raw_user_meta_data ->> 'nombre')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- actividades
-- ------------------------------------------------------------
create table if not exists public.actividades (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descripcion    text not null,
  fecha          timestamptz not null,
  ubicacion      text not null,
  cupo_maximo    integer not null default 30 check (cupo_maximo > 0),
  organizador_id uuid not null references public.profiles (id) on delete restrict,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_actividades_fecha on public.actividades (fecha);
create index if not exists idx_actividades_organizador on public.actividades (organizador_id);

create trigger trg_actividades_updated_at
  before update on public.actividades
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- inscripciones  (pivote usuario <-> actividad)
-- ------------------------------------------------------------
create table if not exists public.inscripciones (
  id           uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.actividades (id) on delete cascade,
  usuario_id   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (actividad_id, usuario_id)   -- impide inscripción duplicada
);

create index if not exists idx_inscripciones_actividad on public.inscripciones (actividad_id);
create index if not exists idx_inscripciones_usuario on public.inscripciones (usuario_id);

create trigger trg_inscripciones_updated_at
  before update on public.inscripciones
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- reportes
-- ------------------------------------------------------------
create table if not exists public.reportes (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text not null,
  categoria   text not null
              check (categoria in ('residuos','agua','energia','ruido','area_verde','movilidad','otro')),
  prioridad   text not null default 'media'
              check (prioridad in ('baja','media','alta','critica')),
  estado      text not null default 'enviado'
              check (estado in ('enviado','en_revision','en_proceso','resuelto','cerrado')),
  ubicacion   text not null,
  foto_url    text,
  es_anonimo  boolean not null default false,
  autor_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_reportes_estado on public.reportes (estado);
create index if not exists idx_reportes_categoria on public.reportes (categoria);
create index if not exists idx_reportes_autor on public.reportes (autor_id);

create trigger trg_reportes_updated_at
  before update on public.reportes
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- NOTA: los repositorios (src/infrastructure/persistence/) usan
-- la service-role key server-side, que SIEMPRE salta RLS. Estas
-- políticas solo protegen accesos futuros vía clave anon/cliente
-- (p.ej. Realtime o un cliente browser directo); la autorización
-- real (rol, dueño del recurso) se valida en cada API route con
-- `GetCurrentUser()`. No asumas que endurecer esto añade
-- seguridad a los endpoints actuales.
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.actividades   enable row level security;
alter table public.inscripciones enable row level security;
alter table public.reportes      enable row level security;

-- profiles: lectura pública, escritura del propio usuario (cuando haya sesión)
create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);

-- actividades: lectura pública; escritura permisiva en MVP
create policy "actividades_select_all" on public.actividades for select using (true);
create policy "actividades_write_mvp"  on public.actividades for all using (true) with check (true);

-- inscripciones: lectura y escritura permisivas en MVP
create policy "inscripciones_all_mvp" on public.inscripciones for all using (true) with check (true);

-- reportes: creación pública (permite reporte anónimo); lectura y update permisivos en MVP
create policy "reportes_all_mvp" on public.reportes for all using (true) with check (true);
