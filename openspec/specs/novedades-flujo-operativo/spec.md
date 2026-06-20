# novedades-flujo-operativo Specification

## Purpose
TBD - created by archiving change ajustes-novedades-modales-prestamo. Update Purpose after archive.
## Requirements
### Requirement: Fecha operativa editable en modales de novedades
El sistema SHALL permitir editar la fecha operativa en los formularios de novedades de prestamo (Pronto Pago, Recoger Prestamo y Ampliar Plazo). Los campos de fecha MUST permanecer habilitados mientras el formulario no este en estado de procesamiento.

#### Scenario: Fecha editable antes de ejecutar
- **WHEN** el usuario abre cualquiera de los modales de novedades
- **AND** el modal esta en estado de formulario
- **THEN** el campo de fecha se muestra habilitado para edicion
- **AND** el usuario puede seleccionar una fecha distinta a la sugerida por defecto

#### Scenario: Fecha bloqueada solo durante procesamiento
- **WHEN** el usuario confirma una novedad y el sistema entra en estado de procesamiento
- **THEN** el campo de fecha puede quedar temporalmente deshabilitado
- **AND** al finalizar el procesamiento el modal retorna a comportamiento editable en siguientes aperturas

### Requirement: Semantica del CTA primario en novedades
El sistema SHALL mostrar en cada modal de novedad un CTA primario cuyo texto represente la accion real que ejecuta (guardar/aplicar), evitando etiquetas ambiguas de navegacion cuando ya no existe paso intermedio.

#### Scenario: Pronto Pago ejecuta con CTA de accion final
- **WHEN** el usuario esta en el formulario de Descuento por pronto pago con datos validos
- **THEN** el boton primario muestra una etiqueta de accion final (por ejemplo, "Aplicar" o "Guardar")
- **AND** al presionarlo el sistema ejecuta directamente la operacion

#### Scenario: Recoger y Ampliar ejecutan con CTA de accion final
- **WHEN** el usuario esta en el formulario de Recoger Prestamo o Ampliar Plazo con datos validos
- **THEN** el boton primario muestra una etiqueta de accion final (no "Continuar")
- **AND** al presionarlo el sistema ejecuta directamente la operacion

