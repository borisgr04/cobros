## ADDED Requirements

### Requirement: Operación "Recoger Préstamo" disponible para préstamos activos
El sistema SHALL ofrecer la acción "Recoger Préstamo" únicamente cuando el préstamo está en estado `activo`. La acción SHALL estar oculta o deshabilitada para préstamos en estado `completado`, `cerrado_pronto_pago`, `refinanciado` o `anulado`.

#### Scenario: Acción visible solo para préstamos activos
- **WHEN** el usuario consulta el detalle de un préstamo con estado `activo`
- **THEN** el menú de novedades muestra la opción "Recoger Préstamo"

#### Scenario: Acción no disponible para préstamo no activo
- **WHEN** el usuario consulta el detalle de un préstamo con estado distinto de `activo`
- **THEN** la opción "Recoger Préstamo" no aparece en el menú de novedades

### Requirement: Formulario de "Recoger Préstamo" con saldo pendiente pre-cargado
El sistema SHALL mostrar un formulario con los siguientes campos:
- **Saldo pendiente** (solo lectura, calculado como `valorTotal - sumaPagosNoAnulados`)
- **Dinero adicional** (numérico, requerido, > 0)
- **Intereses** (numérico, requerido, >= 0)
- **Cantidad de cuotas** (entero, requerido, >= 1)
- **Frecuencia de pago** (selector: diario/semanal/quincenal/mensual, requerido)
- **Fecha de inicio** (fecha, requerido, por defecto hoy)
- **Observación** (texto libre, opcional)

#### Scenario: Saldo pendiente se calcula y muestra automáticamente
- **WHEN** el usuario abre el modal "Recoger Préstamo" desde el detalle del préstamo
- **THEN** el campo "Saldo pendiente" muestra `valorTotal - sumaPagosNoAnulados` del préstamo origen
- **AND** el campo no es editable

#### Scenario: Validación de dinero adicional
- **WHEN** el usuario intenta confirmar con dinero adicional <= 0 o vacío
- **THEN** el sistema muestra error "El dinero adicional debe ser mayor a cero"

#### Scenario: Validación de intereses
- **WHEN** el usuario intenta confirmar con intereses < 0
- **THEN** el sistema muestra error "Los intereses no pueden ser negativos"

#### Scenario: Fecha de inicio por defecto
- **WHEN** el usuario abre el modal "Recoger Préstamo"
- **THEN** la fecha de inicio se prellena con la fecha del día actual

### Requirement: Resumen del nuevo préstamo antes de confirmar
El sistema SHALL mostrar un resumen calculado en tiempo real mientras el usuario llena el formulario:

```
Saldo trasladado:   $X
+ Dinero adicional: $Y
= Capital nuevo:    $Z

Capital nuevo:      $Z
+ Intereses:        $I
= Total a cobrar:   $T
```

#### Scenario: Resumen actualiza en tiempo real
- **WHEN** el usuario modifica cualquier campo numérico del formulario
- **THEN** el resumen se recalcula instantáneamente sin requerir envío del formulario

#### Scenario: Confirmación explícita con mensaje de advertencia
- **WHEN** el usuario hace clic en "Confirmar"
- **THEN** el sistema muestra el mensaje: "Se creará un nuevo préstamo y el actual quedará marcado como REFINANCIADO. Esta acción no se puede deshacer."
- **AND** requiere una segunda confirmación (botón "Sí, recoger préstamo") para ejecutar

### Requirement: Ejecución atómica de la operación "Recoger Préstamo"
El sistema SHALL ejecutar los siguientes pasos en una única transacción de base de datos:
1. Calcular el saldo pendiente del préstamo origen.
2. Crear un nuevo `Prestamo` con `ClienteId` del origen, capital = saldo + dinero adicional, intereses, cuotas y fecha de inicio provistos.
3. Generar las `Cuota[]` del nuevo préstamo con las fechas calculadas según la frecuencia.
4. Insertar una `NovedadPrestamo` tipo `recoger_prestamo` en el préstamo origen con: `PrestamoDestinoId`, `SaldoTrasladado`, `DineroAdicional`, `UsuarioId`, `Notas`.
5. Marcar el préstamo origen con estado `refinanciado`.

Si cualquier paso falla, SHALL revertir todos los cambios.

#### Scenario: Ejecución exitosa redirige al nuevo préstamo
- **WHEN** la operación se completa sin errores
- **THEN** el sistema cierra el modal y navega automáticamente al detalle del nuevo préstamo creado
- **AND** muestra notificación de éxito: "Préstamo recogido exitosamente. Nuevo préstamo #N creado."

#### Scenario: Error de base de datos revierte todo
- **WHEN** ocurre un error durante la persistencia
- **THEN** el sistema no modifica ninguna entidad (préstamo origen permanece `activo`, no se crea préstamo destino)
- **AND** muestra mensaje de error al usuario

#### Scenario: Intento de recoger préstamo no activo (validación backend)
- **WHEN** el endpoint recibe una solicitud para un préstamo con estado distinto de `activo`
- **THEN** responde HTTP 400 con mensaje descriptivo del motivo de rechazo

### Requirement: Estado "refinanciado" en el préstamo origen
El sistema SHALL marcar el préstamo origen con estado `refinanciado` al completar la operación. Un préstamo `refinanciado` SHALL ser tratado como cerrado a efectos de cartera activa.

#### Scenario: Préstamo refinanciado excluido de la cartera activa
- **WHEN** el sistema calcula totales de cartera activa (dashboard, reportes)
- **THEN** los préstamos con estado `refinanciado` NO se incluyen en el total de cartera activa

#### Scenario: Préstamo refinanciado muestra indicador visual
- **WHEN** el usuario ve el listado de préstamos o el detalle de un préstamo `refinanciado`
- **THEN** el sistema muestra un distintivo/badge "Refinanciado" junto al estado
- **AND** muestra un enlace al préstamo destino con el texto "Ver nuevo préstamo #N"

### Requirement: Trazabilidad completa entre préstamo origen y destino
El sistema SHALL registrar en `NovedadPrestamo` los campos: `PrestamoDestinoId`, `SaldoTrasladado`, `DineroAdicional`, `UsuarioId`, `FechaNovedad`, `Notas`. El nuevo préstamo SHALL almacenar `PrestamoOrigenId` como FK hacia el préstamo origen.

#### Scenario: Novedad visible en el historial del préstamo origen
- **WHEN** el usuario consulta el historial de novedades del préstamo origen
- **THEN** aparece una entrada tipo `recoger_prestamo` con el saldo trasladado, dinero adicional, fecha, usuario y enlace al préstamo destino

#### Scenario: Préstamo destino muestra su origen
- **WHEN** el usuario consulta el detalle del nuevo préstamo
- **THEN** el sistema muestra "Originado por refinanciación del préstamo #N" con enlace al préstamo origen

### Requirement: Impacto en caja solo por dinero adicional
El sistema SHALL registrar una salida de caja únicamente por el valor de `DineroAdicional`. El `SaldoTrasladado` no genera movimiento de caja.

#### Scenario: Solo dinero adicional afecta caja
- **WHEN** se completa la operación con saldo_trasladado=1.400.000 y dinero_adicional=2.000.000
- **THEN** el movimiento de caja registrado es una salida de 2.000.000
- **AND** no se registra movimiento adicional por 1.400.000
