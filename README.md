# RSU Eco Política

Plataforma web para la gestión de la Responsabilidad Social Universitaria (RSU) enfocada en temas de Economía Política. El proyecto está construido utilizando **Next.js**, **React** y **Supabase**, e implementa principios de **Clean Architecture** y **Domain-Driven Design (DDD)** para un código altamente escalable, mantenible y robusto.

## 🚀 Tecnologías Principales

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Frontend:** [React](https://react.dev/)
- **Backend/Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security)
- **Arquitectura:** Clean Architecture + Domain-Driven Design (DDD)

## 📁 Estructura del Proyecto

El proyecto sigue una estricta separación de responsabilidades basada en Clean Architecture:

```text
src/
├── domain/           # Entidades, Value Objects y contratos (interfaces) de repositorios. Núcleo de la lógica de negocio.
├── application/      # Casos de uso (Use Cases) que orquestan las operaciones del sistema.
├── infrastructure/   # Implementaciones concretas: Repositorios con Supabase, clientes HTTP, etc.
├── app/              # Next.js App Router (Páginas de la UI y Rutas de la API).
└── api/              # Middlewares y utilidades de la API.
```

### Entidades Principales (Dominio)
1. **Profiles (Usuarios):** Gestión de roles y datos de usuario (Autenticación manejada por Supabase Auth).
2. **Actividades:** Gestión de eventos, talleres o campañas de RSU.
3. **Inscripciones:** Relación entre usuarios y actividades (gestión de cupos y participación).
4. **Reportes:** Sistema de incidencias o sugerencias medioambientales/sociales (permite envíos anónimos).

## 🛠️ Instalación y Configuración Local

### Prerrequisitos
- [Node.js](https://nodejs.org/es/) (Versión 18+ recomendada)
- Cuenta y proyecto configurado en [Supabase](https://supabase.com/)

### Pasos

1. **Clonar el repositorio y acceder a la carpeta del proyecto:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd RSU-ECO-POLITICA
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   - Copia el archivo de ejemplo `.env.example` a `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Abre `.env.local` y completa los valores con la URL y la Key (Anon/Service Role) de tu proyecto de Supabase.

4. **Base de Datos (Supabase):**
   - Asegúrate de ejecutar el código de los esquemas y las políticas de seguridad (RLS) que se encuentran en el archivo inicial de la base de datos dentro de la carpeta `supabase/` (o aplica las migraciones).

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en funcionamiento.

## 📜 Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

- `npm run dev`: Inicia el servidor de desarrollo con Hot-Reloading.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia el servidor de producción.
- `npm run lint`: Ejecuta el linter (ESLint) para buscar problemas en el código.
- `npm run typecheck`: Verifica los tipos de TypeScript sin emitir archivos compilados.

## 🔐 Seguridad y RLS (Row Level Security)

El proyecto utiliza Supabase y aprovecha fuertemente **Row Level Security (RLS)** en PostgreSQL para proteger la base de datos a nivel de fila. Los repositorios dentro de `src/infrastructure` utilizan la validación y autorización del lado del servidor para garantizar que sólo usuarios con los roles correctos puedan realizar ciertas acciones (como crear actividades o modificar reportes).

---
*Este proyecto fue desarrollado bajo los estándares de Clean Architecture para asegurar una larga vida útil y un fácil mantenimiento.*
