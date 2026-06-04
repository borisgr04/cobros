## ADDED Requirements

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
- **AND** permite al usuario continuar al paso de confirmación sin corregir

#### Scenario: División exacta muestra resumen limpio
- **WHEN** `totalACobrar % valorCuota = 0`
- **THEN** el sistema muestra en el resultado calculado: "N pagos de $X"
- **AND** no se muestra advertencia de descuadre

#### Scenario: Resultado calculado no visible hasta tener valor de cuota válido
- **WHEN** el valor de cuota es 0 o no está ingresado
- **THEN** el bloque de resumen calculado no se muestra
- **AND** el botón de continuar permanece deshabilitado

#### Scenario: Confirmación muestra valor de cuota exacto
- **WHEN** el usuario avanza al paso de confirmación
- **THEN** la sección "Plan de pagos" muestra el valor de cuota ingresado (no un estimado)
- **AND** si hay descuadre, se muestra también el valor del último pago

### Requirement: Botones del footer de Crear Préstamo en orden convencional
En el footer del modal de registro de préstamo, los botones SHALL seguir la convención de acción primaria a la derecha: "Cancelar" a la izquierda y "Crear Préstamo" a la derecha.

#### Scenario: Orden de botones en footer de Crear Préstamo
- **WHEN** el usuario abre el modal de registro de préstamo
- **THEN** el botón "Cancelar" aparece a la izquierda en el footer
- **AND** el botón "Crear Préstamo" aparece a la derecha del "Cancelar"
