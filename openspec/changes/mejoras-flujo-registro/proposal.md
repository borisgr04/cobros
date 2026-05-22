## Why

Las pruebas de UX con usuarios revelaron dos fricciones concretas: en el registro de préstamos, los usuarios no entienden por qué deben ingresar "Valor Total" en lugar de los valores que ellos conocen (interés y cuota); y en el registro de pago, el campo de monto no tiene un valor por defecto útil, obligando al usuario a calcular y tipear manualmente la cuota.

## What Changes

- **Formulario de registro de préstamos**: reemplazar los campos `valorTotal` y el cálculo automático de cuotas por un modelo de entrada directa donde el usuario ingresa `valorPrestado`, `valorInteres`, `valorCuota`, `fechaInicio` (predeterminado hoy) y `cantidad` (número de períodos según la frecuencia). El sistema calcula `valorTotal = valorPrestado + valorInteres` y `fechaFinal` derivada de `fechaInicio + cantidad * frecuencia`.
- **Registro de pago**: el campo de cantidad de cuotas se pre-rellena con el valor de la cuota del préstamo al abrir el modal; al hacer foco sobre el campo, el contenido queda seleccionado para facilitar el borrado y reemplazo.

## Capabilities

### New Capabilities
- `registro-prestamo-campos-manuales`: Nuevo modelo de entrada del formulario de registro de préstamos — el usuario ingresa interés, cuota y cantidad de períodos directamente; el sistema deriva valores calculados.

### Modified Capabilities
- `registro-pago`: El monto a pagar se pre-rellena con el valor de una cuota al abrir el modal; el campo queda auto-seleccionado al recibir foco.

## Impact

- **Frontend únicamente** — sin cambios en el backend ni en el modelo de datos (los campos guardados son los mismos: `valorPrestado`, `valorTotal`, `cantidadCuotas`, `valorCuota`, `fechaInicio`, `fechaFinal`).
- Archivos afectados:
  - `cobros-iu/src/app/features/prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component.ts` — nuevos signals de entrada, nuevos computeds
  - `cobros-iu/src/app/features/prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component.html` — nuevo layout de campos
  - `cobros-iu/src/app/features/prestamos/components/registro-pago-modal/registro-pago-modal.component.ts` — inicializar con valor cuota, auto-select
  - `cobros-iu/src/app/features/prestamos/components/registro-pago-modal/registro-pago-modal.component.html` — foco con selección
- Sin nuevas dependencias.
