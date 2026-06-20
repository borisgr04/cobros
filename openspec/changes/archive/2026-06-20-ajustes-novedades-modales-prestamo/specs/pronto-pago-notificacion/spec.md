## ADDED Requirements

### Requirement: CTA de guardado en descuento por pronto pago
En el formulario de pronto pago, el sistema SHALL usar un boton primario con texto de accion final de guardado/aplicacion y MUST ejecutar la operacion al hacer click, sin depender de un paso adicional de confirmacion.

#### Scenario: CTA visible y ejecutable en pronto pago
- **WHEN** el usuario completa un valor negociado valido en el modal de pronto pago
- **THEN** el boton primario muestra texto de accion final de guardado/aplicacion
- **AND** al hacer click se ejecuta `confirmarProntoPago`
- **AND** el boton muestra estado de procesamiento mientras se completa la solicitud
