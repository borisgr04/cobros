## 1. Backend llave pública automática

- [ ] 1.1 Implementar generación de `llave` única al crear cliente cuando no llega en request
- [ ] 1.2 Agregar validación de unicidad y retry ante colisión
- [ ] 1.3 Añadir pruebas unitarias/integración para creación de cliente sin llave

## 2. Frontend formulario clientes

- [ ] 2.1 Remover campos `cuentaBancaria` y `llave` del formulario de creación/edición
- [ ] 2.2 Ajustar modelo/bindings para que esos campos no sean requeridos en UI
- [ ] 2.3 Validar flujo completo de alta/edición de cliente tras simplificación

## 3. Compatibilidad y verificación

- [ ] 3.1 Verificar que consulta pública siga funcionando con llaves existentes
- [ ] 3.2 Definir manejo de clientes legacy sin llave (backfill o generación bajo demanda)
- [ ] 3.3 Ejecutar pruebas de regresión en flujo de clientes y consulta pública
