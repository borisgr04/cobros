# prestamo-contexto-cliente

## Purpose

Enable users to create loans directly from a client context with pre-selected client information and no inline client creation, while ensuring safe modal closure behavior.

## Requirements

### Requirement: Préstamo solo se puede crear desde un cliente
El sistema SHALL únicamente permitir crear un préstamo cuando hay un cliente preseleccionado. No SHALL existir ningún punto de entrada al modal de registro de préstamo sin un cliente ya determinado.

#### Scenario: No existe botón de nuevo préstamo sin cliente
- **WHEN** el usuario está en la página de gestión de préstamos
- **THEN** no hay ningún botón ni acción que abra el modal de nuevo préstamo sin cliente preseleccionado

#### Scenario: Puntos de entrada válidos para crear préstamo
- **WHEN** el usuario quiere registrar un préstamo
- **THEN** debe hacerlo desde la lista de clientes (botón "Nuevo Préstamo" en la fila del cliente) o desde una tarjeta de préstamo existente (botón "Otro préstamo")

### Requirement: Crear préstamo desde lista de clientes
El sistema SHALL permitir al usuario iniciar el registro de un préstamo directamente desde la lista de clientes, con el cliente ya preseleccionado y en modo solo lectura dentro del modal, sin necesidad de navegar a otra sección.

#### Scenario: Botón Nuevo Préstamo en lista de clientes
- **WHEN** el usuario hace clic en "Nuevo Préstamo" en la fila/card de un cliente
- **THEN** el modal de registro de préstamo se abre en la misma página
- **AND** la sección de selección de cliente muestra una banda de solo lectura con nombre, identificación y zona del cliente
- **AND** el selector de cliente (`<select>`) no aparece

#### Scenario: Modal con cliente preseleccionado no permite cambiar el cliente
- **WHEN** el modal de registro de préstamo recibe un cliente preseleccionado (`ICliente`)
- **THEN** el formulario no muestra el campo de selección de cliente
- **AND** el botón "+ Nuevo cliente" no aparece
- **AND** el cliente queda fijo para el préstamo a registrar

### Requirement: Crear otro préstamo desde préstamo existente
El sistema SHALL permitir al usuario iniciar un nuevo préstamo para el mismo cliente desde la tarjeta de un préstamo existente.

#### Scenario: Botón Otro préstamo en tarjeta de préstamo
- **WHEN** el usuario hace clic en "Otro préstamo" en la tarjeta de un préstamo
- **THEN** el modal de registro de préstamo se abre con el mismo cliente del préstamo preseleccionado
- **AND** el modal muestra la banda de solo lectura del cliente

### Requirement: Cierre seguro de modales
Los modales de la aplicación SHALL cerrarse únicamente mediante la tecla Escape o mediante los botones explícitos de cancelar/cerrar. Un clic accidental en el overlay NO SHALL cerrar el modal.

#### Scenario: Clic en overlay no cierra el modal
- **WHEN** el usuario hace clic fuera del contenido del modal (en el overlay oscuro)
- **THEN** el modal permanece abierto
- **AND** el formulario conserva todos los datos ingresados

#### Scenario: Tecla Escape cierra el modal
- **WHEN** el usuario presiona la tecla Escape con un modal abierto
- **THEN** el modal se cierra

#### Scenario: Botón cerrar/cancelar cierra el modal
- **WHEN** el usuario hace clic en el botón "✕" del header o en el botón "Cancelar" del footer
- **THEN** el modal se cierra

### Requirement: Formulario de registro de préstamos con entrada directa de valores
El sistema SHALL proveer un formulario de registro de préstamos donde el usuario ingresa directamente los valores que conoce: valor prestado, valor del interés, valor de la cuota, fecha de inicio y cantidad de períodos. El sistema calcula el valor total y la fecha final como valores derivados. El cliente SHALL ser siempre provisto como parámetro externo y mostrado en modo solo lectura — el modal NO SHALL contener selector de cliente ni formulario de creación de cliente inline.

#### Scenario: Usuario ingresa los campos directos y el sistema deriva el total
- **WHEN** el usuario completa los campos: valor prestado, valor interés, valor cuota, fecha inicio y cantidad de períodos
- **THEN** el sistema calcula automáticamente `valorTotal = valorPrestado + valorInteres`
- **AND** el sistema calcula `fechaFinal = fechaInicio + (cantidad × periodicidad)`
- **AND** el número de cuotas del préstamo queda igual a la cantidad ingresada

#### Scenario: Modal siempre muestra cliente en readonly
- **WHEN** se abre el modal de registro de préstamo
- **THEN** el cliente aparece en una banda informativa con nombre, identificación y zona
- **AND** no hay selector de cliente ni botón para crear cliente inline
