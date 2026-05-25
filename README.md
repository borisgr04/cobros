# Cobros

Este repositorio contiene una solución completa para la gestión de cobros, préstamos y pagos, compuesta por un backend en .NET y un frontend en Angular.

## Estructura del repositorio

- **backend/**
  - `Cobros.sln`: Solución principal de .NET.
  - `CobrosApi/`: API RESTful en ASP.NET Core para la gestión de clientes, préstamos, pagos, zonas y autenticación.
    - `Controllers/`: Controladores de la API.
    - `Data/`: Contexto de base de datos y factoría de diseño.
    - `DTOs/`: Objetos de transferencia de datos.
    - `Migrations/`: Migraciones de Entity Framework.
    - `Models/`: Modelos de datos.
    - `Services/`: Servicios auxiliares (ej. generación de tokens).
    - `appsettings.json`: Configuración de la aplicación.
    - `Dockerfile` y `docker-compose.yml`: Archivos para despliegue en contenedores.
  - `CobrosApi.Tests/`: Pruebas unitarias y de integración para la API.

- **cobros-iu/**
  - Frontend en Angular para la gestión visual de cobros.
  - `src/`: Código fuente de la aplicación Angular.
  - `infra/`: Scripts y archivos de infraestructura como Bicep para despliegue en Azure.
  - `mockup-*.html`: Mockups de pantallas de la aplicación.
  - `openapi-spec.yaml`: Especificación OpenAPI de la API.

- **infra/**
  - Archivos de infraestructura para despliegue independiente.

- **migrations_supabase.sql**
  - Script SQL para migraciones en Supabase.

## Despliegue

- El backend puede ejecutarse localmente con .NET 8 y Docker.
- El frontend puede ejecutarse con Angular CLI.
- Hay scripts y archivos de infraestructura listos para despliegue en Azure.

## Licencia

Este proyecto es de uso privado.

---

## Configuración de variables de entorno

### Backend (`backend/CobrosApi/appsettings.json`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | Cadena de conexión PostgreSQL | `Host=...;Database=cobros;Username=...;Password=...` |
| `Jwt:Key` | Clave secreta para firmar JWT (mínimo 32 chars) | `mi-clave-super-secreta-32-caracteres` |
| `Jwt:Issuer` | Emisor del token JWT | `CobrosApi` |
| `Jwt:Audience` | Audiencia del token JWT | `CobrosApp` |
| `Jwt:ExpiresInMinutes` | Duración del access token en minutos | `30` |
| `Jwt:RefreshTokenExpiryDays` | Duración de la cookie de refresh token en días | `30` |
| `AllowedOrigins` | Orígenes permitidos para CORS (array) | `["https://cobrosfront.onrender.com"]` |
| `Fido2:ServerDomain` | Dominio raíz del frontend (rpId de WebAuthn) | `cobrosfront.onrender.com` |
| `Fido2:ServerName` | Nombre de la aplicación mostrado en el autenticador | `Cobros` |
| `Fido2:Origin` | URL completa del frontend (origin de WebAuthn) | `https://cobrosfront.onrender.com` |
| `Google:ClientId` | Client ID de Google OAuth para login con Google | `852221...apps.googleusercontent.com` |

> **Nota de seguridad**: En producción usa variables de entorno o un gestor de secretos. Nunca subas `Jwt:Key` ni credenciales al repositorio.

### Cookie de refresh token

La cookie `cobros_refresh` se configura automáticamente según el entorno:
- **Desarrollo** (`ASPNETCORE_ENVIRONMENT=Development`): `SameSite=Strict`
- **Producción**: `SameSite=None; Secure` — necesario cuando frontend y backend están en dominios distintos (ej. Render.com)

### Frontend (`cobros-iu/src/environments/`)

| Variable | Descripción |
|---|---|
| `apiUrl` | URL base del backend | 
| `production` | `true` en producción, `false` en desarrollo |

En desarrollo el frontend usa un proxy (`proxy.conf.json`) que redirige `/api/*` a `http://localhost:5010`.

