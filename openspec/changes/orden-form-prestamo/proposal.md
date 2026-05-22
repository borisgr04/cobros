## Why

El formulario de registro de préstamos mezcla conceptos de tiempo y dinero en orden no intuitivo, y obliga al cobrador a ingresar la cantidad de cuotas manualmente cuando ese valor se puede derivar de los montos. Esto genera confusión y errores en el registro.

## What Changes

- La sección **Frecuencia de pago** sube junto a la fecha de inicio (antes de los valores), formando un grupo cohesivo de "plan de pago"
- `cantidadCuotas` deja de ser entrada del usuario y pasa a ser **computado**: `ceil(valorTotal / valorCuota)`
- La **última cuota** recibe el valor restante (`valorTotal - (N-1) × valorCuota`) en lugar del valor estándar, para cuadrar el total exacto
- Se muestra **advertencia** cuando el total no divide exacto en la cuota ingresada, indicando el monto de la última cuota diferente
- Se elimina el campo "Cantidad de períodos" como input y el "Resumen de Cuotas" redundante al final del formulario

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `registro-prestamo-campos-manuales`: La cantidad de períodos ya no es entrada directa — se deriva de `ceil(valorTotal / valorCuota)`. La frecuencia se agrupa con la fecha de inicio. La última cuota puede tener valor diferente cuando no divide exacto.

## Impact

- **Frontend**: `registro-prestamo-modal.component.ts` — `cantidadCuotas` signal → computed; reorganización de secciones en HTML
- **Backend**: `PrestamosController.cs` — generación de cuotas asigna valor diferente a la última cuota cuando hay resto
- **Sin cambios en API**: el contrato `PrestamoInputDto` permanece igual; `cantidadCuotas` y `valorCuota` siguen enviándose al backend (calculados en frontend antes de enviar)
