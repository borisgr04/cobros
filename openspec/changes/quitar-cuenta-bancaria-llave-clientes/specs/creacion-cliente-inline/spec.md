## ADDED Requirements

### Requirement: Formulario de cliente sin campos cuenta bancaria y llave
El formulario de creación/edición de cliente SHALL ocultar los campos `cuentaBancaria` y `llave` en la interfaz principal.

#### Scenario: Alta de cliente sin campos removidos
- **WHEN** el usuario abre el formulario de cliente
- **THEN** no visualiza campos `cuentaBancaria` ni `llave`
- **AND** puede completar y guardar el cliente con los campos operativos restantes

### Requirement: Persistencia sin dependencia de campos removidos
La operación de guardar cliente SHALL completarse sin requerir `cuentaBancaria` ni `llave` en el payload de UI.

#### Scenario: Guardado exitoso sin cuenta bancaria ni llave
- **WHEN** el usuario guarda un cliente desde el formulario simplificado
- **THEN** la API acepta el payload sin esos campos
- **AND** retorna cliente creado/actualizado correctamente
