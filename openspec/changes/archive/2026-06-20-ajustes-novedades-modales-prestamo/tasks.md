## 1. Ajustes de flujo y semantica en modales de novedades

- [x] 1.1 Revisar y actualizar CTA primario en `pronto-pago-modal` para que represente accion final de guardado/aplicacion.
- [x] 1.2 Revisar y actualizar CTA primario en `recoger-prestamo-modal` y `ampliar-plazo-modal` para evitar etiqueta "Continuar" cuando ejecuta accion final.
- [x] 1.3 Alinear estados de `procesando` en los tres modales para deshabilitar acciones solo durante ejecucion.

## 2. Editabilidad de fecha operativa

- [x] 2.1 Verificar bindings de fecha en Pronto Pago y eliminar cualquier condicion de solo lectura fuera de `procesando`.
- [x] 2.2 Verificar bindings de fecha en Recoger Prestamo y eliminar cualquier condicion de solo lectura fuera de `procesando`.
- [x] 2.3 Verificar bindings de fecha en Ampliar Plazo y eliminar cualquier condicion de solo lectura fuera de `procesando`.

## 3. Recoger prestamo: defaults y calculos

- [x] 3.1 Inicializar la frecuencia por defecto con `prestamo.frecuenciaPago` al abrir el modal de recoger.
- [x] 3.2 Mantener selector editable de frecuencia y recalculo de proyecciones cuando cambie.
- [x] 3.3 Validar que la cantidad de cuotas se proyecte desde `valorCuota` usando `ceil(totalACobrar / valorCuota)` y que el resumen muestre ultimo pago cuando aplique.

## 4. Pruebas y validacion funcional

- [x] 4.1 Agregar/ajustar pruebas unitarias de componentes para CTA y estado de fecha editable en los tres modales.
- [x] 4.2 Ejecutar pruebas frontend y validar manualmente flujos de Pronto Pago, Recoger y Ampliar con casos de fecha editable.
- [x] 4.3 Verificar que no haya regresiones en notificaciones WhatsApp y resultado de operaciones de novedades.
