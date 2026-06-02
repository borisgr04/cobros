## ADDED Requirements

### Requirement: Notificación WhatsApp al completar recoger préstamo
Tras ejecutar recoger préstamo con éxito, el sistema SHALL presentar al usuario un enlace para notificar al cliente por WhatsApp si el cliente tiene teléfono registrado.

El mensaje SHALL incluir: nombre del cliente, total a cobrar del nuevo préstamo, cantidad y valor de cuota, fecha final estimada y enlace de consulta pública.

Si el cliente no tiene teléfono, el sistema SHALL mostrar un aviso informativo en lugar del botón.

#### Scenario: Cliente con teléfono — botón WhatsApp visible
- **WHEN** el flujo de recoger préstamo se completa con éxito
- **AND** el cliente tiene teléfono registrado
- **THEN** la pantalla de resultado muestra el botón "Notificar al cliente por WhatsApp"
- **AND** el enlace abre `https://wa.me/<telefono>?text=<mensaje>` en pestaña nueva

#### Scenario: Cliente sin teléfono — botón no disponible
- **WHEN** el flujo de recoger préstamo se completa con éxito
- **AND** el cliente no tiene teléfono registrado
- **THEN** la pantalla de resultado muestra un aviso "El cliente no tiene teléfono registrado"
- **AND** no aparece el botón de WhatsApp

### Requirement: Selector de frecuencia con segmented buttons
En el formulario de recoger préstamo, la frecuencia de pago SHALL seleccionarse mediante botones segmentados (diario / semanal / quincenal / mensual), idénticos a los del modal de registro de préstamo.

#### Scenario: Selección de frecuencia con botones
- **WHEN** el usuario abre el formulario de recoger préstamo
- **THEN** el campo de frecuencia muestra 4 botones: Diario, Semanal, Quincenal, Mensual
- **AND** el botón activo se diferencia visualmente del resto
- **AND** al tocar un botón la frecuencia queda seleccionada

### Requirement: Advertencia de confirmación legible
El texto de advertencia en el paso de confirmación de recoger préstamo SHALL mostrarse completamente sin truncamiento ni encogimiento.

#### Scenario: Advertencia visible en confirmación
- **WHEN** el usuario avanza al paso de confirmación
- **THEN** el bloque de advertencia (préstamo actual se cerrará) se muestra completo y legible sin scroll ni texto cortado

### Requirement: Label de cuota recogida muestra "Recogida"
Las cuotas con estado `"reemplazada_por_ampliacion"` SHALL mostrarse en la UI con el label **"Recogida"** en el detalle del préstamo.

#### Scenario: Cuota reemplazada muestra label correcto
- **WHEN** el usuario ve el historial de cuotas de un préstamo recogido
- **THEN** las cuotas reemplazadas muestran el badge "Recogida" (no "Ampliada")

### Requirement: Links entre préstamos navegan correctamente
Al navegar desde la pantalla de detalle de un préstamo a otro préstamo (nuevo préstamo creado al recoger, o préstamo origen), la vista SHALL actualizarse con los datos del nuevo préstamo.

#### Scenario: Link a nuevo préstamo recarga la vista
- **WHEN** el usuario hace click en el link "Ver préstamo #X" en el resultado de recoger
- **THEN** la vista de detalle se recarga con los datos del préstamo X
- **AND** el componente no queda mostrando datos del préstamo anterior

#### Scenario: Link al préstamo origen recarga la vista
- **WHEN** el usuario hace click en el link "Originado por refinanciación del préstamo #Y" en el detalle
- **THEN** la vista de detalle se recarga con los datos del préstamo Y
