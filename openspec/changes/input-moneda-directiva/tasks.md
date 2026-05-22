
## 1. Crear directiva appMoneda

- [x] 1.1 Crear carpeta `cobros-iu/src/app/shared/directives/` y archivo `moneda-input.directive.ts` con la directiva standalone `MonedaInputDirective`
- [x] 1.2 Implementar `model<number>()` para two-way binding con el componente
- [x] 1.3 Implementar formateo en tiempo real: `HostListener('input')` formatea el valor mientras el usuario escribe, manteniendo el número puro en el model.
- [x] 1.4 Implementar `HostListener('focus')`: mostrar número puro en el input nativo; si valor es 0, limpiar el campo
- [x] 1.5 Implementar `HostListener('blur')`: mantener el valor formateado
- [x] 1.6 Agregar `HostBinding('attr.inputmode') inputmode = 'numeric'` para activar teclado numérico en mobile
- [x] 1.7 Inicializar el display formateado en `ngOnInit`: si el model tiene valor > 0, mostrar formateado; si es 0, dejar vacío (placeholder)
- [x] 1.8 Crear `cobros-iu/src/app/shared/directives/index.ts` exportando `MonedaInputDirective`

## 2. Actualizar registro-prestamo-modal

- [x] 2.1 En `registro-prestamo-modal.component.ts`: eliminar los computeds `valorPrestadoFormateado` y `valorTotalFormateado`
- [x] 2.2 En `registro-prestamo-modal.component.html`: reemplazar el bloque `<div class="input-moneda-wrapper">` + `<span class="input-moneda-preview">` de Valor Prestado por `<input appMoneda [(appMoneda)]="valorPrestado" ... />`
- [x] 2.3 En `registro-prestamo-modal.component.html`: hacer lo mismo para Valor Total
- [x] 2.4 Agregar `MonedaInputDirective` a los `imports` del componente
- [x] 2.5 En `registro-prestamo-modal.component.scss`: eliminar los estilos `.input-moneda-preview` (ya no necesarios)

## 3. Actualizar edicion-prestamo-modal

- [x] 3.1 En `edicion-prestamo-modal.component.html`: reemplazar el bloque `<div class="input-moneda-wrapper">` de Valor Prestado por `<input appMoneda [(appMoneda)]="valorPrestado" ... />`
- [x] 3.2 En `edicion-prestamo-modal.component.html`: hacer lo mismo para Valor Total
- [x] 3.3 Agregar `MonedaInputDirective` a los `imports` del componente

## 4. Actualizar registro-pago-modal

- [x] 4.1 Inspeccionar `registro-pago-modal.component.ts` para entender cómo se gestiona `montoPersonalizado` (signal, valor inicial, validaciones)
- [x] 4.2 En `registro-pago-modal.component.html`: reemplazar el bloque `<div class="monto-libre-row">` con el input de monto libre para usar `appMoneda`
- [x] 4.3 Verificar que el `[max]="saldoPendiente()"` siga funcionando o adaptarlo (la directiva no conoce `max`, la validación queda en el componente)
- [x] 4.4 Agregar `MonedaInputDirective` a los `imports` del componente

## 5. Verificación

- [ ] 5.1 registro-prestamo-modal: ingresar valor → al salir del campo muestra `$ 1.500.000`; al hacer foco muestra `1500000`
- [ ] 5.2 edicion-prestamo-modal: mismo comportamiento
- [ ] 5.3 registro-pago-modal: monto libre → mismo comportamiento; límite `saldoPendiente` sigue aplicando
- [ ] 5.4 Pegar valor con formato (`$ 1.500.000`) → se parsea correctamente al salir del campo
- [ ] 5.5 Dejar campo en 0 → muestra placeholder, no `$ 0`
- [ ] 5.6 Los cálculos que dependen de `valorPrestado`/`valorTotal` (interés, cuotas) siguen funcionando correctamente
