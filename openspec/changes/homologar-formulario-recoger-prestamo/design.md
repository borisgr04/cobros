## Context

El formulario de Recoger Préstamo (`RecogerPrestamoModalComponent`) sigue un modelo de entrada inverso al formulario de Crear Préstamo (`RegistroPrestamoModalComponent`): pide `cantidadCuotas` como input y deriva `valorCuotaEstimado`, mientras que Crear Préstamo pide `valorCuota` y deriva `cantidadCuotas = ⌈total / cuota⌉`. Crear Préstamo está validado y aceptado por el usuario como la experiencia correcta.

Ambos formularios ya comparten el componente `MonedaInputDirective` y el patrón de segmented buttons para frecuencia.

## Goals / Non-Goals

**Goals:**
- Unificar el modelo mental de entrada: en ambos formularios el cobrador ingresa `valorCuota` y el sistema deriva `cantidadCuotas`.
- Agregar advertencia de descuadre (último pago diferente) en Recoger Préstamo, igual que en Crear Préstamo.
- Invertir orden de botones en footer de Crear Préstamo: Cancelar → izquierda, acción primaria → derecha.

**Non-Goals:**
- Cambios en la API backend o en DTOs — el payload ya incluye `valorCuota` y `cantidadCuotas`.
- Cambios en el estilo visual del control de frecuencia — ya es idéntico entre ambos formularios.
- Modificar el flujo de pasos (formulario → confirmación → resultado).

## Decisions

### D1: `cantidadCuotas` pasa de `signal` editable a `computed`

**Decisión**: Reemplazar `cantidadCuotas = signal(10)` por `cantidadCuotas = computed(() => Math.ceil(totalACobrar() / valorCuota()))`, idéntico al patrón de `RegistroPrestamoModalComponent`.

**Alternativa descartada**: Mantener ambos como inputs con sincronización bidireccional. Descartado porque introduce estados inconsistentes y complejidad innecesaria.

### D2: Agregar `valorCuota` como nuevo signal de entrada

**Decisión**: Agregar `valorCuota = signal(0)` y usar `appMoneda` directive como en Crear Préstamo. El campo `cantidadCuotas` en el HTML se reemplaza por este campo.

**Rationale**: Consistencia directa con el componente guía. El cobrador ya conoce el valor de cuota que quiere cobrar (generalmente un valor estándar como $50.000 o $100.000).

### D3: Advertencia de descuadre

**Decisión**: Agregar `valorUltimaCuota = computed(...)` y `descuadreExacto = computed(...)` siguiendo exactamente la misma lógica de `RegistroPrestamoModalComponent`. El bloque de resultado calculado muestra `N pagos de $X` o `N pagos · el último de $Y`.

### D4: Validación de `formularioValido`

**Decisión**: Reemplazar la condición `cantidadCuotas() < 1` por `valorCuota() <= 0` en el computed `formularioValido`. `cantidadCuotas` > 0 queda garantizado cuando `valorCuota` > 0 y `totalACobrar` > 0.

### D5: Confirmación muestra `valorCuota` exacto

**Decisión**: En el paso de confirmación, mostrar el `valorCuota` ingresado (no `valorCuotaEstimado`), y si hay descuadre, mostrar también el valor del último pago. Esto es más preciso que el estimado actual.

## Risks / Trade-offs

- **[Riesgo] Cobradores acostumbrados a ingresar número de cuotas**: Al cambiar el campo de entrada, el flujo mental cambia. → Mitigación: el resultado calculado muestra prominentemente la cantidad de cuotas derivada, dando feedback inmediato.
- **[Trade-off] División no exacta es más visible**: Al derivar `cantidadCuotas`, el descuadre se vuelve visible explícitamente. Es un comportamiento correcto pero nuevo para Recoger. → Ninguna mitigación necesaria; es información útil para el cobrador.
