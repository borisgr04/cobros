## 1. Identificación del punto de scroll

- [ ] 1.1 Ubicar el componente/vista del flujo post-registro de pago donde se renderiza el botón de envío por WhatsApp.
- [ ] 1.2 Definir y exponer una referencia estable al bloque objetivo para realizar el desplazamiento automático.

## 2. Implementación del desplazamiento automático

- [ ] 2.1 Disparar la lógica de auto-scroll al confirmar registro exitoso del pago y tras renderizar las acciones post-pago.
- [ ] 2.2 Agregar validación de visibilidad en viewport para evitar scroll cuando el botón de WhatsApp ya está visible.
- [ ] 2.3 Limitar la ejecución del auto-scroll al flujo de confirmación de pago para no afectar otras pantallas.

## 3. Validación del comportamiento

- [ ] 3.1 Verificar en vista móvil que, tras registrar pago, el botón de WhatsApp quede visible automáticamente.
- [ ] 3.2 Verificar en escritorio y casos donde el botón ya es visible que no se produzcan desplazamientos innecesarios.
