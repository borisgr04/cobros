## 1. Frontend — TS: convertir cantidadCuotas a computed

- [x] 1.1 Convertir `cantidadCuotas` de `signal<number>` a `computed(() => Math.ceil(valorTotal() / valorCuota()))` — retorna 0 si alguno es 0
- [x] 1.2 Agregar guardia: si `valorCuota() > valorTotal()`, retornar 0 (evitar resultado negativo en última cuota)
- [x] 1.3 Agregar `computed` `valorUltimaCuota = valorTotal - (cantidadCuotas - 1) × valorCuota` (0 si cantidadCuotas ≤ 0)
- [x] 1.4 Agregar `computed` `descuadreExacto = cantidadCuotas > 0 && valorUltimaCuota() !== valorCuota()`
- [x] 1.5 Actualizar `resetearFormulario()`: eliminar `cantidadCuotas.set(0)` (ahora es computed)
- [x] 1.6 Actualizar `errorCuotas` para validar `cantidadCuotas() <= 0` sin mensaje de "ingrese la cantidad"
- [x] 1.7 Actualizar `errorValores` para agregar validación `valorCuota() > valorTotal()`
- [x] 1.8 Actualizar `esFormularioValido` para reflejar las nuevas condiciones

## 2. Frontend — HTML: reorganizar secciones y reemplazar campo cantidad

- [x] 2.1 Mover la sección "Frecuencia de Pago" (cards) para que quede inmediatamente después del campo "Fecha de Préstamo", dentro de la misma sección "Plan de Pago"
- [x] 2.2 Renombrar sección "Fechas del Préstamo" a "Plan de Pago" e incluir en ella: fecha inicio + frecuencia
- [x] 2.3 Eliminar campo input de "Cantidad de Períodos" del HTML
- [x] 2.4 Reemplazar la sección "Resumen de Cuotas" al final por el resultado derivado: mostrar cantidad y fecha final junto al campo de cuota (inline)
- [x] 2.5 Agregar advertencia de último pago diferente: `@if (descuadreExacto()) { "⚠ el último pago será de $X" }`
- [x] 2.6 Reemplazar advertencia de "descuadre" actual por la nueva advertencia de último pago diferente
- [x] 2.7 Remover campo "Fecha Final (calculada)" de la sección Plan de Pago — ahora aparece solo en el resumen derivado junto a los valores
- [x] 2.8 Reemplazar `.frecuencia-opciones` + `.frecuencia-card` por segmented control: un `<div class="frecuencia-segmented">` con 4 botones `<button>` en línea
- [x] 2.9 Agregar CSS del segmented control: 1 fila, borde unificado, fondo sólido en el opción activa, `min-height: 44px` para touch

## 3. Backend — última cuota con valor ajustado

- [x] 3.1 En `PrestamosController.cs`, modificar la generación de cuotas: si `i == prestamo.CantidadCuotas`, usar `prestamo.ValorTotal - (prestamo.CantidadCuotas - 1) * prestamo.ValorCuota` como `ValorCuota`
- [x] 3.2 Verificar que cuando divide exacto el resultado es igual a `prestamo.ValorCuota` (sin efecto secundario)

## 4. Verificación

- [ ] 4.1 Ingresar prestado=$1.000.000, interés=$180.000, cuota=$100.000 → sistema muestra "12 pagos, el último de $80.000"
- [ ] 4.2 Ingresar prestado=$1.000.000, interés=$200.000, cuota=$100.000 → sistema muestra "12 pagos de $100.000" sin advertencia
- [ ] 4.3 Confirmar que frecuencia aparece junto a fecha inicio (antes de valores)
- [ ] 4.4 Confirmar que no hay campo editable de "Cantidad de períodos"
- [ ] 4.5 Registrar un préstamo con división no exacta → verificar en BD que la última cuota tiene valor diferente
