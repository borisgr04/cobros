## ADDED Requirements

### Requirement: App instalable como PWA
La aplicación SHALL ser instalable como Progressive Web App en dispositivos Android e iOS.

#### Scenario: Manifest disponible y válido
- **WHEN** el navegador carga la app
- **THEN** encuentra un `manifest.webmanifest` válido enlazado en el `<head>`
- **AND** el manifest incluye `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color` e íconos en al menos 192x192 y 512x512 px

#### Scenario: App se puede instalar en Android
- **WHEN** el usuario visita la app en Chrome para Android que cumple los criterios de instalabilidad
- **THEN** el navegador muestra el banner "Agregar a pantalla de inicio"
- **AND** al instalar, la app se abre en modo standalone sin barra de navegador

#### Scenario: App se puede instalar en iOS (Add to Home Screen)
- **WHEN** el usuario visita la app en Safari para iOS
- **THEN** puede agregar la app al home screen usando el menú de compartir
- **AND** la app se abre en modo standalone

### Requirement: Service Worker registrado y activo
La app SHALL registrar un service worker para habilitar caché de assets y comportamiento offline básico.

#### Scenario: Service worker se registra en producción
- **WHEN** la app carga en un entorno de producción (HTTPS)
- **THEN** el service worker de Angular (`ngsw-worker.js`) se registra correctamente
- **AND** los assets estáticos se sirven desde caché en visitas subsecuentes

#### Scenario: App muestra pantalla básica sin conexión
- **WHEN** el usuario abre la app sin conexión a internet
- **AND** la app fue previamente cargada
- **THEN** el shell de la app (HTML/CSS/JS) carga desde caché
- **AND** se muestra un mensaje indicando que no hay conexión en lugar de un error de red

#### Scenario: Service worker no se registra en desarrollo
- **WHEN** la app corre en modo desarrollo (`ng serve`)
- **THEN** el service worker NO se registra para no interferir con el hot-reload

### Requirement: Íconos y tema visual de la PWA
La PWA SHALL tener íconos e identidad visual apropiados.

#### Scenario: Íconos en tamaños requeridos
- **WHEN** se construye la app
- **THEN** existen íconos PNG en al menos los tamaños 192x192 y 512x512 referenciados en el manifest

#### Scenario: Splash screen en iOS
- **WHEN** la app instalada se abre en iOS
- **THEN** muestra una splash screen usando `apple-touch-icon` definido en el `<head>`
