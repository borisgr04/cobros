## Why

La correccion reciente del flujo de novedades dejo inconsistencias de UX y de negocio: en algunos modales el boton principal quedo como "Continuar" cuando realmente ejecuta el guardado, la fecha aparece bloqueada en operaciones donde debe ser editable y el flujo de recoger prestamo no conserva la frecuencia del prestamo origen por defecto. Esto genera errores operativos y confusion en caja al registrar novedades.

## What Changes

- Ajustar el CTA primario en novedades para que refleje la accion real de guardado/ejecucion, validando especificamente el caso de Descuento por pronto pago.
- Asegurar que los campos de fecha en Pronto Pago, Recoger Prestamo y Ampliar Plazo no queden en solo lectura, permitiendo edicion del usuario.
- En Recoger Prestamo, usar por defecto la frecuencia del prestamo origen (manteniendo posibilidad de ajuste manual).
- En Recoger Prestamo, proyectar automaticamente la cantidad de cuotas al definir valor de cuota, con el mismo comportamiento operativo de Crear Prestamo.
- Unificar reglas de formulario/confirmacion para evitar regresiones en los tres modales de novedades.

## Capabilities

### New Capabilities
- `novedades-flujo-operativo`: Reglas transversales de UX operativa para modales de novedades (labels de accion, editabilidad de fecha y consistencia de ejecucion).

### Modified Capabilities
- `pronto-pago-notificacion`: Ajuste del flujo de accion principal para que el boton represente guardado/ejecucion real del descuento por pronto pago.
- `recoger-prestamo-valor-cuota`: Ajuste de defaults y calculos del formulario (frecuencia heredada del prestamo origen y proyeccion de cuotas desde valor de cuota).

## Impact

- Frontend Angular en modales de novedades: pronto pago, recoger prestamo y ampliar plazo.
- Servicios/UI de prestamos relacionados con calculo de cuotas y frecuencia por defecto.
- Specs OpenSpec de pronto pago y recoger prestamo, mas una nueva spec transversal de flujo operativo.
- Sin cambios de contrato API ni migraciones de base de datos.
