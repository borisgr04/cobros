## Context

La propuesta agrupa mejoras de UX y consistencia en varias áreas del producto: reportes mobile, experiencia de cliente/préstamo, consulta pública, mensajería WhatsApp y verificación de seguridad en APIs operativas. Son cambios transversales entre frontend Angular y backend .NET.

## Goals / Non-Goals

**Goals:**
- Mejorar comprensión en mobile mostrando labels de tabs en reportes.
- Separar visualmente préstamos activos y cerrados en contexto de cliente.
- Añadir acciones post-éxito claras (crear préstamo tras crear cliente, eliminar doble cerrar tras crear préstamo).
- Incorporar detalle de pagos en consulta pública.
- Homologar mensajes WhatsApp para incluir enlace de consulta.
- Validar enforcement de autenticación/autorización en APIs operativas.

**Non-Goals:**
- Rediseño completo del módulo de reportes.
- Cambio del dominio financiero de estados de préstamo.
- Reemplazo de proveedor de mensajería.

## Decisions

1. Tabs mobile con label visible
- Decisión: mantener icono + texto siempre visible en mobile (posible abreviación controlada).
- Alternativa descartada: solo iconos con tooltip, por baja descubrilidad en touch.

2. Separación activos/cerrados en cliente
- Decisión: mostrar activos por defecto y exponer acceso explícito a cerrados ordenados descendentemente por fecha de cierre/último movimiento.
- Alternativa descartada: mostrar todo mezclado con filtros complejos en la tarjeta principal.

3. Continuidad post-creación
- Decisión: en éxito de crear cliente mostrar CTA directo a crear préstamo; en éxito de crear préstamo dejar un único botón cerrar.
- Alternativa descartada: depender solo de navegación manual posterior.

4. Consulta pública con detalle de pagos
- Decisión: expandir detalle por préstamo para listar pagos con fecha, valor y referencia.
- Alternativa descartada: mantener solo resumen agregado.

5. Homologación WhatsApp
- Decisión: plantilla base única que inyecte link de consulta cuando exista llave/ruta disponible.
- Alternativa descartada: mantener plantillas independientes por componente.

6. Verificación de seguridad API
- Decisión: checklist de controllers operativos con pruebas de acceso autenticado/no autenticado.
- Alternativa descartada: revisión manual ad hoc sin evidencia ejecutable.

## Risks / Trade-offs

- [Riesgo] Sobrecarga visual en mobile por labels de tabs -> Mitigación: truncar/abreviar labels y validar breakpoints.
- [Riesgo] Inconsistencia de orden por falta de fecha de cierre explícita -> Mitigación: definir campo de ordenamiento prioritario y fallback documentado.
- [Riesgo] Exponer pagos en consulta pública con datos sensibles -> Mitigación: limitar columnas al mínimo necesario y omitir información interna.
- [Trade-off] Unificar mensajes WhatsApp reduce flexibilidad local -> Mitigación: permitir segmentos opcionales por contexto sobre plantilla base.

## Migration Plan

1. Implementar cambios de UI de bajo riesgo (tabs mobile, botón duplicado).
2. Implementar separación activos/cerrados en cliente y CTA post-creación.
3. Exponer y consumir detalle de pagos en consulta pública.
4. Homologar composición de mensajes WhatsApp y pruebas.
5. Ejecutar auditoría de autorización sobre APIs operativas.

## Open Questions

- ¿Qué fecha define oficialmente el orden de cerrados: última cuota pagada, fecha de estado cerrado o fecha de novedad?
- ¿El detalle de pagos en consulta pública debe paginarse para históricos largos?
- ¿El enlace de consulta en WhatsApp debe incluir tracking/código de campaña?
