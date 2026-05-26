## ADDED Requirements

### Requirement: Visibilidad automática de acción post-pago
El sistema SHALL desplazar automáticamente la vista hasta el bloque de acciones post-pago cuando un pago de préstamo se registre exitosamente y el botón de envío por WhatsApp no sea visible en el viewport actual.

#### Scenario: Botón fuera de viewport al finalizar pago
- **WHEN** el usuario registra un pago exitoso de un préstamo
- **AND** el botón de envío por WhatsApp queda fuera del viewport
- **THEN** el sistema desplaza la vista automáticamente hasta mostrar dicho botón

#### Scenario: Botón ya visible al finalizar pago
- **WHEN** el usuario registra un pago exitoso de un préstamo
- **AND** el botón de envío por WhatsApp ya es visible en el viewport
- **THEN** el sistema no realiza desplazamiento adicional

### Requirement: Desplazamiento acotado al flujo de confirmación
El sistema MUST ejecutar el desplazamiento automático únicamente durante el estado de confirmación posterior al registro de pago, sin alterar otros flujos de navegación o pantallas.

#### Scenario: Navegación fuera del flujo de pago
- **WHEN** el usuario navega por otras vistas del sistema
- **THEN** no se dispara desplazamiento automático relacionado con el botón de WhatsApp
