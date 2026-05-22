## Context

El formulario de registro de préstamos (`registro-prestamo-modal`) tiene actualmente:
- `cantidadCuotas` como signal de entrada directa del usuario
- `frecuenciaPago` en una sección separada al fondo del formulario, después de los campos de valores
- Todas las cuotas generadas en backend con el mismo `ValorCuota`

El cobrador piensa en términos de "¿cuánto le presto, cuánto de interés, cuánto paga por cuota?" — la cantidad de períodos es una consecuencia, no un dato que conoce de antemano.

## Goals / Non-Goals

**Goals:**
- `cantidadCuotas` = `ceil(valorTotal / valorCuota)` — siempre derivado, nunca ingresado
- Frecuencia de pago agrupada con fecha de inicio (sección "Plan de pago")
- Última cuota con valor ajustado cuando `valorTotal % valorCuota ≠ 0`
- Advertencia visual clara cuando la división no es exacta

**Non-Goals:**
- Cambiar el contrato de la API (`PrestamoInputDto` permanece igual)
- Modificar la lógica de distribución de abonos (ya maneja cuotas de valor variable)
- Cambiar otros modales (edición de préstamo, registro de pago)

## Decisions

### D1 — `cantidadCuotas` como computed, no signal

`cantidadCuotas = computed(() => Math.ceil(valorTotal() / valorCuota()))` cuando ambos > 0, sino 0.

**Alternativa descartada**: mantenerlo como signal con validación de coherencia — requiere que el cobrador ingrese un dato redundante y genera la advertencia de "descuadre" que ya existe (confusa).

### D2 — `ceil` en lugar de `floor` para la cantidad de cuotas

Con `ceil`, la cantidad de cuotas incluye el último pago parcial. El cobrador ve "12 pagos, el último de $80.000" — todos los pagos están representados.

Con `floor` (alternativa), el $80k restante quedaría como deuda sin cuota asignada, incompatible con el modelo de distribución por cuotas.

### D3 — Valor de última cuota calculado en frontend y enviado al backend

El frontend calcula:
- `cantidadCuotas = ceil(total / cuota)`
- `valorUltimaCuota = total - (cantidadCuotas - 1) × cuota`

Y envía ambos al backend. El backend usa `cantidadCuotas` enviado (no recalcula).

**Alternativa descartada**: recalcular en backend — introduce duplicación de lógica y requiere que el backend reciba la señal de "última cuota diferente". El modelo actual ya persiste `CantidadCuotas` y `ValorCuota` desde el frontend.

### D4 — Backend: última cuota con valor diferente en generación

En `PrestamosController.cs`, al generar las cuotas:

```
cuota i < N  →  ValorCuota = prestamo.ValorCuota
cuota i = N  →  ValorCuota = prestamo.ValorTotal - (N-1) × prestamo.ValorCuota
```

Cuando divide exacto, la expresión resulta en `prestamo.ValorCuota` — sin efecto secundario.

### D5 — Orden de secciones en el formulario

```
1. Cliente
2. Plan de pago: [Fecha inicio] + [Frecuencia segmented control]
3. Valores: [Prestado] [Interés] → Total derivado
            [Cuota] → Cuotas derivado + Fecha final derivada
```

La frecuencia sube porque contextualiza la "cantidad de períodos" que aparece como resultado. Sin frecuencia visible, "12 períodos" no tiene significado claro.

### D6 — Frecuencia como segmented control (no cards)

Las 4 opciones de frecuencia se presentan como un **segmented control horizontal de 1 fila**, reemplazando las tarjetas verticales actuales (ícono + label apilados).

```
┌──────────────────────────────────────┐
│  Diario │ Semanal │ Quincenal │ Mensual│
│  ██████ │         │           │       │
└──────────────────────────────────────┘
```

**Razón**: el cobrador tiene dificultad con tecnología. El segmented control ofrece el estado seleccionado más legible (fondo sólido en el activo), es 1 sola fila siempre (sin scroll, sin 2 columnas), y es el patrón que ya conoce de apps cotidianas (WhatsApp, banca móvil). Las cards actuales ocupan ~180px en móvil; el segmented control ocupa ~48px.

**Alternativa descartada**: mantener cards — demasiado espacio vertical en móvil, y el estado seleccionado (borde + sombra verde) es menos obvio que un fondo sólido.

## Risks / Trade-offs

- **Rounding edge case**: `ceil(1.000.000 / 333.334) = 3`, última cuota = $−2 (negativa). Mitigación: validar que `valorCuota ≤ valorTotal` antes de mostrar el resultado.
- **Tests de backend**: los tests actuales crean préstamos con cuotas de igual valor. El test `Cuotas_PagoExactoAcumulado_UltimaCuotaEsPagada` usa 3 cuotas de $100 → total $300, divide exacto — no se ve afectado. Revisar si hay tests con división no exacta.
