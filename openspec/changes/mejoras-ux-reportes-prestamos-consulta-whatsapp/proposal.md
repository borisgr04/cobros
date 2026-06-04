## Why

Hay varios puntos de UX y consistencia funcional que afectan comprensión y fluidez: tabs móviles sin texto en reportes, exceso de información en tarjeta de cliente, falta de continuidad de acciones después de crear cliente/préstamo, detalle limitado en consulta pública y mensajes de WhatsApp inconsistentes. Además, se requiere confirmar que las APIs operativas permanezcan protegidas por autenticación.

## What Changes

- Reportes mobile: asegurar texto visible en tabs (o labels abreviados) para que cada pestaña sea entendible.
- Tarjeta de cliente: ocultar préstamos cerrados/pagados en la vista principal y agregar acceso explícito para ver historial cerrado ordenado por fecha más reciente.
- Post-creación de cliente: mostrar acción directa para crear préstamo con contexto del cliente recién creado.
- Post-creación de préstamo: eliminar duplicidad del botón "Cerrar" en estado exitoso.
- Consulta pública: al abrir detalle de un préstamo, mostrar listado de pagos para ampliar trazabilidad.
- WhatsApp: homologar plantillas para incluir siempre enlace de consulta pública cuando exista clave/ruta de consulta.
- Seguridad API: validar y reforzar cobertura de autenticación/autorización en endpoints operativos logueados.

## Capabilities

### New Capabilities
- `consulta-publica-detalle-pagos`: Detalle expandible con historial de pagos en consulta pública.
- `cliente-historial-prestamos-cerrados`: Vista separada para préstamos cerrados con ordenamiento por fecha descendente.

### Modified Capabilities
- `reporte-finalizados`: Ajustes de usabilidad en tabs para mobile con label visible.
- `prestamo-contexto-cliente`: Cambios en tarjeta de cliente para separar activos vs cerrados y acceso al historial.
- `creacion-cliente-inline`: Acción contextual de "Crear préstamo" al completar alta de cliente.
- `registro-prestamo-campos-manuales`: Corrección de estado exitoso para evitar doble botón "Cerrar".
- `recoger-prestamo-notificacion`: Revisión/homologación de mensajes WhatsApp para asegurar inclusión de link de consulta.
- `infraestructura`: Verificación de enforcement de autenticación/autorización en APIs operativas.

## Impact

- Frontend Angular: reportes, clientes, préstamos y consulta pública (componentes, estilos, estados de éxito y navegación).
- Backend .NET: endpoints y DTOs para exponer historial de pagos en consulta pública; revisión de políticas de autorización.
- Mensajería WhatsApp: funciones de composición de texto y enlaces en múltiples componentes.
- Pruebas E2E y unitarias de seguridad y UX móvil.
