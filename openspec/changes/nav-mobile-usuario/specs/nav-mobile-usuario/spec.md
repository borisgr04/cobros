## ADDED Requirements

### Requirement: Menú de usuario accesible desde navegación mobile
El sistema SHALL proveer al usuario en dispositivos móviles un acceso a la información de su cuenta (nombre, email), a la gestión de usuarios (`/usuarios`) y a la opción de cerrar sesión, desde la barra de navegación inferior mediante un panel tipo bottom sheet.

#### Scenario: Abrir panel de usuario desde bottom nav
- **WHEN** el usuario toca el ítem "Más" en el bottom nav
- **THEN** aparece un panel superpuesto desde la parte inferior con: nombre del usuario, email, enlace a "Gestión de Usuarios" y botón "Cerrar sesión"

#### Scenario: Navegar a gestión de usuarios desde mobile
- **WHEN** el usuario toca "Gestión de Usuarios" dentro del panel
- **THEN** el panel se cierra y el usuario navega a `/usuarios`

#### Scenario: Cerrar panel de usuario
- **WHEN** el usuario toca el overlay oscuro fuera del panel, o toca el botón de cerrar dentro del panel
- **THEN** el panel se cierra

#### Scenario: Cerrar sesión desde mobile
- **WHEN** el usuario toca "Cerrar sesión" dentro del panel de usuario
- **THEN** la sesión se termina y el usuario es redirigido al login

#### Scenario: Panel se cierra al navegar
- **WHEN** el usuario navega a otra sección de la app con el panel abierto
- **THEN** el panel se cierra automáticamente

### Requirement: Valores numéricos alineados a la derecha
El sistema SHALL mostrar todos los valores monetarios alineados a la derecha en inputs y en los componentes de visualización (tarjetas, resúmenes, estadísticas), facilitando la comparación visual de cifras.

#### Scenario: Input de dinero alineado a la derecha
- **WHEN** un campo con la directiva `appMoneda` está visible
- **THEN** el texto dentro del input está alineado a la derecha, tanto durante la edición como al mostrar el valor formateado

#### Scenario: Valores en tarjetas alineados a la derecha
- **WHEN** se muestran valores monetarios en tarjetas de estadísticas o resúmenes de préstamos
- **THEN** los valores numéricos aparecen alineados a la derecha de su contenedor
