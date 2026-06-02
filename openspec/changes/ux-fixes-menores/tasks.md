## 1. Zonas — navegación a clientes

- [x] 1.1 En `zonas.component.html`: cambiar el handler del click en `.zona-card` de `verPrestamosZona(zona)` a `verClientesZona(zona)` y actualizar `title` a "Ver clientes de esta zona"
- [x] 1.2 En `zonas.component.html`: eliminar el botón `btn-accion btn-ver` "Ver Clientes" del bloque `.zona-acciones`
- [x] 1.3 En `zonas.component.html`: limpiar el atributo `title` de la card eliminando mención a préstamos

## 2. ProntoPago — input consistente

- [x] 2.1 En `pronto-pago-modal.component.html`: envolver el `input.input-moneda` en un `div.monto-libre-row` con botón clear (×) igual al de `registro-pago-modal`
- [x] 2.2 En `pronto-pago-modal.component.scss`: agregar estilos `.monto-libre-row`, `.monto-libre-input` y `.monto-libre-clear` copiados del modal de registro de pago

## 3. ProntoPago — notificación WhatsApp

- [x] 3.1 En `pronto-pago-modal.component.ts`: inyectar `DomSanitizer` y agregar computed signal `whatsappLink` que construye el URL con nombre, valor negociado, descuento y link de consulta pública
- [x] 3.2 En `pronto-pago-modal.component.html`: en la pantalla de éxito (`paso() === 'exito'`), agregar bloque `@if (whatsappLink())` con el botón `btn-whatsapp` y el fallback de sin teléfono
- [x] 3.3 En `pronto-pago-modal.component.scss`: agregar estilos `.btn-whatsapp` copiados del modal de registro de pago
