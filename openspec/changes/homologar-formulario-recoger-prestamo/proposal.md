## Why

El formulario de "Recoger Préstamo" pide al cobrador que ingrese la **cantidad de cuotas** y luego deriva el valor por cuota, mientras que el formulario de "Crear Préstamo" (validado y aceptado por el usuario) pide el **valor de cuota** y deriva la cantidad. Esta inconsistencia obliga al cobrador a calcular mentalmente cuántas cuotas resultan de un valor de cuota estándar al momento de recoger un préstamo. Adicionalmente, el orden de los botones en el footer de "Crear Préstamo" no sigue la convención de acción primaria a la derecha.

## What Changes

- En **Recoger Préstamo**, el campo `cantidadCuotas` (input numérico) es reemplazado por `valorCuota` (input moneda), haciendo que `cantidadCuotas` pase a ser un valor **derivado** calculado como `⌈totalACobrar / valorCuota⌉`.
- En **Recoger Préstamo**, se agrega advertencia de último pago diferente cuando el total no divide exacto en la cuota (igual que en Crear Préstamo).
- En **Recoger Préstamo**, el control de frecuencia de pagos mantiene el estilo ya existente de segmented buttons (ya es consistente con Crear Préstamo — no requiere cambios visuales).
- En **Crear Préstamo**, se intercambia el orden de los botones en el footer: "Cancelar" queda a la izquierda y "Crear Préstamo" a la derecha (convención de acción primaria).

## Capabilities

### New Capabilities

- `recoger-prestamo-valor-cuota`: Formulario de recoger préstamo con entrada de valor de cuota y cantidad derivada, incluyendo advertencia de descuadre.

### Modified Capabilities

- `recoger-prestamo-notificacion`: Ajuste menor — el campo de entrada del plan de pago cambia de `cantidadCuotas` a `valorCuota`; los campos derivados del resultado (totalACobrar, fechaFinal) no cambian.

## Impact

- `cobros-iu/src/app/features/prestamos/components/recoger-prestamo-modal/recoger-prestamo-modal.component.ts` — lógica de señales y computados
- `cobros-iu/src/app/features/prestamos/components/recoger-prestamo-modal/recoger-prestamo-modal.component.html` — template del formulario y resultado calculado
- `cobros-iu/src/app/features/prestamos/components/registro-prestamo-modal/registro-prestamo-modal.component.html` — orden de botones en el footer
- No hay cambios en la API backend ni en DTOs — el payload que se envía al servidor ya incluye `valorCuota`; `cantidadCuotas` es calculado y enviado igual que antes.
