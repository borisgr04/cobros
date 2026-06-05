# pronto-pago-notificacion

## Purpose

Define the UX behavior after a successful pronto pago execution: WhatsApp notification link for the client and consistent input styling for the negotiated value field.

## Requirements

### Requirement: Notificación WhatsApp tras pronto pago
Tras ejecutar un pronto pago exitoso, el sistema SHALL presentar al usuario un enlace para notificar al cliente por WhatsApp si el cliente tiene teléfono registrado.

El mensaje SHALL incluir: nombre del cliente, valor negociado pagado, descuento aplicado y enlace de consulta pública.

Si el cliente no tiene teléfono, el sistema SHALL mostrar un aviso informativo en lugar del botón.

#### Scenario: Cliente con teléfono — botón WhatsApp visible
- **WHEN** el pronto pago se ejecuta con éxito
- **AND** el cliente tiene teléfono registrado
- **THEN** la pantalla de éxito muestra el botón "Notificar al cliente por WhatsApp"
- **AND** el enlace abre `https://wa.me/<telefono>?text=<mensaje>` en pestaña nueva

#### Scenario: Cliente sin teléfono — botón no disponible
- **WHEN** el pronto pago se ejecuta con éxito
- **AND** el cliente no tiene teléfono registrado
- **THEN** la pantalla de éxito muestra un aviso "El cliente no tiene teléfono registrado"
- **AND** no aparece el botón de WhatsApp

### Requirement: URL de consulta pública en notificación de pronto pago
La URL de consulta pública compartida por WhatsApp SHALL construirse usando exclusivamente `prestamo.cliente.id` como identificador.

#### Scenario: Generación de URL de consulta sin campo llave
- **WHEN** el sistema genera la URL de consulta pública para el cliente de un préstamo con pronto pago
- **THEN** la URL SHALL tener la forma `{baseUrl}/consulta/{cliente.id}`

### Requirement: Input de valor negociado con estilo consistente
El campo "Valor negociado para cerrar el préstamo" SHALL usar el mismo estilo visual (wrapper, botón clear) que el campo "Valor a pagar" de `registro-pago-modal`.

#### Scenario: Botón clear en input de valor negociado
- **WHEN** el usuario abre el modal de pronto pago
- **THEN** el input del valor negociado muestra un botón de limpiar (×) al lado
- **AND** al presionarlo el valor se resetea a 0
