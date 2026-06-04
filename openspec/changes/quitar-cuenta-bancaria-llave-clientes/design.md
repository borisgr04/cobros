## Context

El alta/edición de clientes hoy expone los campos `cuentaBancaria` y `llave` en UI. La operación reporta que estos campos agregan fricción y no forman parte del flujo mínimo para registrar clientes. A la vez, la consulta pública depende de una llave en la ruta (`/consulta/:llave`), por lo que eliminar captura manual no debe eliminar la capacidad de consulta.

## Goals / Non-Goals

**Goals:**
- Quitar `cuentaBancaria` y `llave` del formulario visible de clientes.
- Mantener consulta pública operativa con una llave generada automáticamente por sistema.
- Asegurar que create/update de cliente no falle por ausencia de esos campos en payload UI.

**Non-Goals:**
- Rediseñar por completo el flujo de consulta pública.
- Exponer al usuario final edición manual de la llave pública.
- Cambiar el modelo de seguridad o autorización de la consulta pública.

## Decisions

1. Generación automática de llave pública
- Decisión: la llave de consulta se genera en backend al crear cliente cuando no se provee manualmente.
- Alternativa descartada: generar llave en frontend. Se descarta por riesgo de colisión/manipulación y por acoplar seguridad a cliente.

2. Remoción de campos en UI sin ruptura de API
- Decisión: el frontend deja de enviar `cuentaBancaria` y `llave` desde formulario; backend acepta payload sin esos campos.
- Alternativa descartada: mantener campos ocultos con valores vacíos. Se descarta por deuda técnica y ruido en contratos.

3. Compatibilidad de clientes existentes
- Decisión: conservar llaves existentes, solo aplicar autogeneración para nuevos registros o registros sin llave.
- Alternativa descartada: regenerar llaves masivamente. Se descarta por romper enlaces compartidos.

## Risks / Trade-offs

- [Riesgo] Colisión de llave generada automaticamente -> Mitigación: usar algoritmo con alta entropía y validación de unicidad en persistencia.
- [Riesgo] Clientes antiguos sin llave -> Mitigación: backfill bajo demanda al primer acceso de consulta pública.
- [Trade-off] Menos campos visibles simplifica captura pero reduce flexibilidad administrativa -> Mitigación: dejar administración avanzada solo en backoffice (fuera de este cambio).

## Migration Plan

1. Ajustar backend para autogenerar llave cuando falta.
2. Ajustar frontend y remover campos del formulario.
3. Ejecutar script de verificación de clientes sin llave.
4. Publicar cambios sin downtime (compatible con datos existentes).

## Open Questions

- ¿La llave pública debe tener formato amigable (alfanumérico corto) o UUID?
- ¿Se requiere endpoint administrativo para regenerar llave en casos excepcionales?
