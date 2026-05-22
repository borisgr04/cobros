## 1. Refactorizar registro-prestamo-modal (TS)

- [x] 1.1 Convertir `cantidadCuotas` de `computed` a `signal<number>(0)` (entrada directa del usuario)
- [x] 1.2 Agregar signal `valorInteres = signal<number>(0)`
- [x] 1.3 Convertir `valorCuota` de `computed` a `signal<number>(0)` (entrada directa del usuario)
- [x] 1.4 Convertir `valorTotal` a `computed(() => valorPrestado() + valorInteres())`
- [x] 1.5 Eliminar el signal de entrada `fechaFinal` y convertirlo a `computed` que derive `fechaInicio + cantidad * periodicidad`
- [x] 1.6 Crear helper `calcularFechaFinal(fechaInicio, cantidad, frecuencia): Date` usando la lógica inversa de `calcularCantidadCuotas`
- [x] 1.7 Actualizar `errorValores` para validar también `valorInteres >= 0` y `valorCuota > 0`
- [x] 1.8 Actualizar `errorCuotas` para validar `cantidadCuotas() > 0` (ahora es signal de entrada)
- [x] 1.9 Actualizar `errorFechaFinal` para validar desde el `computed` (no input directo)
- [x] 1.10 Actualizar `esFormularioValido` con las nuevas condiciones
- [x] 1.11 Agregar `MonedaInputDirective` a imports si no está (para campo valorInteres y valorCuota)

## 2. Actualizar template registro-prestamo-modal (HTML)

- [x] 2.1 Reemplazar campo `Valor Total` (input) por campo `Valor Interés` con directiva `appMoneda`
- [x] 2.2 Agregar campo `Valor de Cuota` con directiva `appMoneda`
- [x] 2.3 Reemplazar input `Fecha Final` por campo de texto `Cantidad de períodos` (`<input type="number">` con `[(ngModel)]="cantidadCuotas"`)
- [x] 2.4 Mostrar resumen calculado: `Valor Total = valorPrestado + valorInteres` y `Fecha Final` derivada
- [x] 2.5 Agregar advertencia cuando `valorCuota * cantidadCuotas !== valorTotal` (descuadre)

## 3. Auto-select en modal de pago (TS + HTML)

- [x] 3.1 En `registro-pago-modal.component.html`: agregar `(focus)="$any($event.target).select()"` al input de cantidad de cuotas

## 4. Verificación

- [ ] 4.1 Registro de préstamo: ingresar prestado=1.000.000, interés=200.000, cuota=100.000, cantidad=12 → total muestra 1.200.000 y fecha final correcta
- [ ] 4.2 Registro de préstamo: fecha inicio predeterminada a hoy
- [ ] 4.3 Modal de pago: al abrir, el campo de cuotas muestra 1 y el monto refleja el valor de la cuota
- [ ] 4.4 Modal de pago: al hacer clic en el campo de cantidad de cuotas, el valor queda seleccionado
