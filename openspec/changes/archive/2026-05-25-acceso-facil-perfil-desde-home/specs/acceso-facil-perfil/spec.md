## ADDED Requirements

### Requirement: Acceso fácil al perfil desde el home
La aplicación SHALL mostrar una opción visible y accesible desde el home para que el usuario acceda a su perfil.

#### Scenario: Opción de perfil visible
- **WHEN** el usuario está autenticado y accede al home
- **THEN** se muestra una opción de menú o botón para acceder al perfil

#### Scenario: Acceso directo al registro de biometría
- **WHEN** el usuario accede a su perfil desde el home
- **THEN** puede iniciar el registro o gestión de biometría desde esa vista

### Requirement: Protección de acceso al perfil
El acceso a la vista de perfil MUST estar protegido para usuarios autenticados únicamente.

#### Scenario: Usuario no autenticado intenta acceder
- **WHEN** un usuario no autenticado intenta acceder a la ruta de perfil
- **THEN** el sistema redirige al login
