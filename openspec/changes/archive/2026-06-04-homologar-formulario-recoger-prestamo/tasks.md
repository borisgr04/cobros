## 1. RecogerPrestamoModal — Lógica TypeScript

- [x] 1.1 Reemplazar `cantidadCuotas = signal(10)` por `valorCuota = signal(0)` como nuevo signal de entrada
- [x] 1.2 Convertir `cantidadCuotas` en `computed(() => valorCuota() > 0 && totalACobrar() > 0 ? Math.ceil(totalACobrar() / valorCuota()) : 0)`
- [x] 1.3 Agregar `valorUltimaCuota = computed(() => totalACobrar() - (cantidadCuotas() - 1) * valorCuota())`
- [x] 1.4 Agregar `descuadreExacto = computed(() => cantidadCuotas() > 0 && valorUltimaCuota() !== valorCuota())`
- [x] 1.5 Actualizar `formularioValido`: reemplazar condición `cantidadCuotas() < 1` por `valorCuota() <= 0`
- [x] 1.6 Eliminar `valorCuotaEstimado` computed (ya no se necesita)

## 2. RecogerPrestamoModal — Template HTML

- [x] 2.1 En el paso formulario: reemplazar el campo `<input type="number" ... cantidadCuotas>` por `<input class="input-campo" [(appMoneda)]="valorCuota" placeholder="$ 0">`
- [x] 2.2 Actualizar label del campo reemplazado a "Valor de cuota:" con icono `bi-cash-coin`
- [x] 2.3 Actualizar la validación inline del campo: mostrar error si `valorCuota() <= 0`
- [x] 2.4 En el bloque "Resultado calculado": reemplazar la línea `valorCuotaEstimado` por el patrón de Crear Préstamo — mostrar `N pagos de $X` o `N pagos · el último de $Y` según `descuadreExacto()`
- [x] 2.5 En el paso confirmación: reemplazar `valorCuotaEstimado` por `valorCuota` en la línea "Valor por cuota"
- [x] 2.6 En el paso confirmación: si `descuadreExacto()`, agregar línea adicional mostrando el valor del último pago

## 3. RegistroPrestamoModal — Orden de botones en footer

- [x] 3.1 En `registro-prestamo-modal.component.html`, en el bloque footer (fuera del estado éxito), intercambiar el orden: colocar el botón "Cancelar" antes del botón "Crear Préstamo"
