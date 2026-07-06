# RSU Eco Política

Plataforma de participación ciudadana para la gestión de reportes ambientales y actividades ecológicas, construida con **Clean Architecture + DDD + Supabase**.

## Stack

- **Framework:** Next.js 16 + React 19
- **Lenguaje:** TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Arquitectura:** Clean Architecture + Domain-Driven Design

## Modelo de datos

| Tabla          | Descripción                                         |
|----------------|-----------------------------------------------------|
| `profiles`     | Extiende `auth.users` con rol (usuario/coordinador/admin) |
| `actividades`  | Actividades ecológicas con fecha, ubicación y cupo  |
| `inscripciones`| Pivote usuario ↔ actividad (evita duplicados)       |
| `reportes`     | Reportes ambientales ciudadanos con categoría, prioridad y estado |

**Categorías de reportes:** residuos, agua, energia, ruido, area_verde, movilidad, otro

## Arquitectura

```
src/
├── app/                    # Next.js App Router (páginas y API routes)
│   ├── api/reportes/       # Endpoints REST para reportes
│   └── layout.tsx          # Layout raíz
├── domain/
│   ├── interfaces/         # Contratos de repositorios
│   └── common/             # Tipos compartidos (Result<T>, etc.)
└── infrastructure/
    ├── persistence/        # Implementaciones de repositorios (Supabase)
    ├── auth/               # Lógica de autenticación
    ├── supabase/           # Clientes Supabase (browser + server)
    └── DependencyInjection.ts  # Service provider
```

## Requisitos

- Node.js >= 18
- Supabase CLI (`npx supabase --version`)
- Proyecto Supabase activo

## Configuración

1. Copia `.env.example` a `.env` y completa las variables (panel de Supabase > Project Settings > API):

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Los repositorios (`src/infrastructure/persistence/`) usan la `service_role` key server-side para saltar RLS; la autorización (rol del usuario, dueño del recurso) se valida en cada API route (`GetCurrentUser` + checks de rol). **Nunca** expongas `SUPABASE_SERVICE_ROLE_KEY` al cliente.

2. Enlaza el proyecto local con tu proyecto Supabase remoto y aplica las migraciones:

```bash
npx supabase link --project-ref tu-proyecto-ref
npx supabase db push
```

Para desarrollo local con Supabase corriendo en Docker:

```bash
npx supabase start   # levanta Postgres/Auth/Studio local
npx supabase db reset  # aplica migrations/ + seed.sql
```

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # Build de producción
npm run lint      # ESLint
npm run typecheck # TypeScript check
```

## Licencia

ISC
