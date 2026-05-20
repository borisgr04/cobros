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
