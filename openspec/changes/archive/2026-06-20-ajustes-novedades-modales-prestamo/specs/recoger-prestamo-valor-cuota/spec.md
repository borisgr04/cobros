## MODIFIED Requirements

### Requirement: Formulario de recoger préstamo con entrada de valor de cuota
En el formulario de recoger préstamo, el usuario SHALL ingresar el valor de cuota deseado (campo moneda). El sistema SHALL derivar la cantidad de cuotas como `⌈totalACobrar / valorCuota⌉`. La cantidad de cuotas NO es un campo de entrada.

#### Scenario: Sistema deriva cantidad de cuotas desde valor de cuota ingresado
- **WHEN** el usuario ingresa un valor de cuota mayor a 0
- **AND** el totalACobrar (saldo pendiente + dinero adicional + intereses) es mayor a 0
- **THEN** el sistema calcula `cantidadCuotas = ⌈totalACobrar / valorCuota⌉`
- **AND** muestra la cantidad de cuotas como resultado derivado, no como campo editable

#### Scenario: Advertencia cuando el total no divide exacto en la cuota
- **WHEN** `totalACobrar % valorCuota ≠ 0`
- **THEN** el sistema muestra en el resultado calculado: "N pagos · el último de $Y"
- **AND** donde Y es `totalACobrar - (cantidadCuotas - 1) × valorCuota`
- **AND** permite al usuario ejecutar la operacion sin paso adicional de confirmacion

#### Scenario: División exacta muestra resumen limpio
- **WHEN** `totalACobrar % valorCuota = 0`
- **THEN** el sistema muestra en el resultado calculado: "N pagos de $X"
- **AND** no se muestra advertencia de descuadre

#### Scenario: Resultado calculado no visible hasta tener valor de cuota válido
- **WHEN** el valor de cuota es 0 o no está ingresado
- **THEN** el bloque de resumen calculado no se muestra
- **AND** el botón de accion principal permanece deshabilitado

#### Scenario: Confirmación muestra valor de cuota exacto
- **WHEN** el usuario revisa el resumen de la operación en el mismo formulario
- **THEN** la sección "Plan de pagos" muestra el valor de cuota ingresado (no un estimado)
- **AND** si hay descuadre, se muestra también el valor del último pago

## ADDED Requirements

### Requirement: Frecuencia por defecto heredada del préstamo origen en recoger
Al abrir el modal de recoger préstamo, el sistema SHALL inicializar la frecuencia de pago con la frecuencia del préstamo origen. El usuario MUST poder cambiarla antes de ejecutar la operación.

#### Scenario: Modal abre con frecuencia heredada
- **WHEN** el usuario abre el modal de recoger para un préstamo origen con frecuencia definida
- **THEN** el selector de frecuencia aparece preseleccionado con esa misma frecuencia

#### Scenario: Usuario puede ajustar frecuencia heredada
- **WHEN** el usuario cambia manualmente la frecuencia en el formulario de recoger
- **THEN** el sistema recalcula proyecciones derivadas con la nueva frecuencia
- **AND** mantiene habilitada la ejecución si el formulario sigue siendo válido
