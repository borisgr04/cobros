## Context

Actualmente, los usuarios deben navegar por rutas no evidentes o realizar pasos adicionales para acceder a su perfil y registrar biometría. El acceso directo desde el home no está disponible, lo que dificulta la experiencia y puede afectar la adopción de la funcionalidad biométrica.

## Goals / Non-Goals

**Goals:**
- Permitir acceso fácil y visible al perfil desde el home.
- Facilitar el registro y gestión de biometría desde el perfil.
- Mejorar la experiencia de usuario reduciendo fricción.

**Non-Goals:**
- No se rediseñará la vista de perfil, solo se facilitará el acceso.
- No se modificarán los flujos de autenticación existentes.

## Decisions

- Se agregará un acceso directo al perfil en el menú principal o en una ubicación visible del home.
- El acceso estará disponible solo para usuarios autenticados.
- Se mantendrá la lógica de guards para proteger la ruta de perfil.

## Risks / Trade-offs

- [Riesgo] El menú puede saturarse si se agregan más accesos directos → [Mitigación] Ubicar el acceso en una sección secundaria o con iconografía clara.
- [Riesgo] Usuarios no autenticados intentan acceder → [Mitigación] Mantener guards y redirección al login.
