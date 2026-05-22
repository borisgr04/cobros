## Context

El formulario actual de registro de préstamos pide `valorPrestado` y `valorTotal`, y calcula `cantidadCuotas` y `valorCuota` automáticamente a partir del rango de fechas y la frecuencia de pago. Las pruebas de UX mostraron que los prestamistas informales no trabajan con ese modelo: ellos parten del interés que quieren cobrar y de la cuota que acuerdan con el cliente, no del valor total. El modal de pago tampoco pre-rellena ningún valor, forzando al usuario a recordar y tipear la cuota cada vez.

## Goals / Non-Goals

**Goals:**
- Formulario de registro de préstamos que acepte los valores que el usuario conoce: `valorPrestado`, `valorInteres`, `valorCuota`, `fechaInicio`, `cantidad`.
- Calcular `valorTotal = valorPrestado + valorInteres` y `fechaFinal` como campos derivados visibles.
- Modal de registro de pago con `cantidadCuotas = 1` pre-seleccionado y campo auto-selected al foco.

**Non-Goals:**
- No se cambia el modelo de datos ni el backend — los mismos campos se guardan.
- No se modifica el formulario de edición de préstamos (`edicion-prestamo-modal`).
- No se agregan nuevas frecuencias de pago ni validaciones de negocio adicionales.

## Decisions

### Decisión 1: Entradas del formulario y derivación de valores

El usuario ingresa:
| Campo | Tipo | Default |
|---|---|---|
| `valorPrestado` | número (appMoneda) | — |
| `valorInteres` | número (appMoneda) | — |
| `valorCuota` | número (appMoneda) | — |
| `fechaInicio` | fecha | hoy |
| `cantidad` | entero positivo | — |
| `frecuenciaPago` | selector existente | diario |

El sistema deriva:
- `valorTotal = computed(() => valorPrestado() + valorInteres())`
- `fechaFinal = computed(() => fechaInicio + cantidad * periodicidad)` — usando la misma lógica que `calcularCantidadCuotas` pero invertida.
- `cantidadCuotas = cantidad` (ahora es signal de entrada, no computed).

Se elimina el campo `valorTotal` como entrada directa del formulario. Se elimina el input `fechaFinal`.

### Decisión 2: Eliminación de `calcularCantidadCuotas` como computed

Actualmente `cantidadCuotas` es un `computed` que deriva el número de cuotas de `(fechaFinal - fechaInicio) / periodicidad`. En el nuevo modelo, `cantidad` es la entrada del usuario y `fechaFinal` es la salida derivada. Se invertirá esta relación: `cantidad = signal<number>(0)` y `fechaFinal = computed(...)`.

### Decisión 3: Auto-select al foco en campos numéricos del modal de pago

El modal de pago tiene dos campos donde aplica auto-select al foco:
1. El input de cantidad de cuotas (tipo `number`, existente con `ngModel`).
2. El input de monto libre (ahora usa directiva `appMoneda`).

Para el campo de cantidad de cuotas: agregar `(focus)="$any($event.target).select()"` directamente en el template.
Para el monto libre: la directiva `appMoneda` ya tiene lógica de `select()` en `onFocus`.

### Decisión 4: Valor por defecto del modal de pago

Al abrir el modal, `cantidadCuotas` ya inicializa en `1`, lo que corresponde al valor de una cuota. No se requiere cambio en la lógica — solo confirmar que la UI muestra claramente el monto resultante (`valorCuota`) al abrir.

## Risks / Trade-offs

- **Coherencia entre cuota × cantidad ≠ valorTotal**: Si el usuario ingresa `valorCuota × cantidad ≠ valorTotal`, el préstamo quedará con descuadre. Mitigación: mostrar aviso cuando `valorCuota × cantidad ≠ valorTotal` (advertencia, no bloqueo).
- **Eliminación de `fechaFinal` como entrada**: Usuarios que ya conocen la fecha final tendrán que calcular la cantidad. Trade-off aceptable dada la UX más natural para el caso principal.
- **Compatibilidad con edición**: El modal de edición (`edicion-prestamo-modal`) sigue usando el modelo actual (`valorTotal`, `fechaFinal` directos). No hay conflicto.
