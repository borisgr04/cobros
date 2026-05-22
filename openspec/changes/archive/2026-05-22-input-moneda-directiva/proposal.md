## Why

Los inputs de dinero del sistema muestran números crudos (`1500000`) sin formato, lo que dificulta la lectura y propicia errores de digitación. La solución actual (etiqueta de preview debajo del input) crea disociación visual y no aplica en todos los campos monetarios. Se necesita una solución unificada, alineada al formato colombiano (`$1.500.000`), que opere directamente dentro del input.


## What Changes

- **Nueva directiva Angular `appMoneda`** ubicada en `cobros-iu/src/app/shared/directives/moneda-input.directive.ts`: convierte cualquier `<input>` en un campo con formato COP automático **en tiempo real** (cada vez que el usuario escribe, el valor se formatea en el input; el model siempre recibe el número puro). Focus muestra número puro, blur y edición muestran formateado.
- **Reemplazar** los inputs `type="number"` de dinero en `registro-prestamo-modal`, `edicion-prestamo-modal` y `registro-pago-modal` para usar la directiva.
- **Eliminar** los `<span class="input-moneda-preview">` del `registro-prestamo-modal` (ya no necesarios).
- **Eliminar** los computeds `valorPrestadoFormateado` y `valorTotalFormateado` del `registro-prestamo-modal` (reemplazados por la directiva).
- **Actualizar** el spec `formato-moneda-inputs` para reflejar la nueva implementación.

## Capabilities

### New Capabilities
- `moneda-input-directiva`: Directiva Angular reutilizable `appMoneda` que formatea inputs de dinero en COP (formato colombiano) **en tiempo real** mientras el usuario escribe, y alterna entre número puro (focus) y valor formateado (blur/edición).

### Modified Capabilities
- `formato-moneda-inputs`: El mecanismo de formateo cambia de preview externo a formateo dentro del propio input mediante la directiva.

## Impact

- **Frontend únicamente** — sin cambios de backend ni modelo de datos.
- Archivos afectados:
  - `cobros-iu/src/app/shared/directives/moneda-input.directive.ts` — **nuevo**
  - `cobros-iu/src/app/features/prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component.ts` — eliminar computeds de formato
  - `cobros-iu/src/app/features/prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component.html` — usar directiva, eliminar previews
  - `cobros-iu/src/app/features/prestamos/components/edicion-prestamo-modal/edicion-prestamo-modal.component.html` — usar directiva
  - `cobros-iu/src/app/features/prestamos/components/registro-pago-modal/registro-pago-modal.component.html` — usar directiva
- Sin nuevas dependencias externas.
