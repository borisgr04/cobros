# Prompt para aplicar estilo en una app Angular existente

## Objetivo
Aplicar un estilo visual consistente y moderno a una app Angular ya existente, sin crear la app desde cero y sin cambiar la logica de negocio.

## Prompt (copiar y pegar)
Quiero que apliques un sistema visual completo sobre mi app Angular actual.
No crees una app nueva. No cambies flujos de negocio. Solo refactoriza la capa visual (layout, componentes, estilos, estados UI) para que toda la app quede consistente.

Direccion visual obligatoria:
- Estetica elegante, alto contraste, base neutra gris/negro con acentos vibrantes.
- Look profesional, limpio y escalable para cualquier tipo de proyecto.
- Evitar apariencia generica de boilerplate.
- No usar morado como color dominante.

Paleta obligatoria:
- Negro profundo: #0D0D0D
- Negro carbon: #1A1A1A
- Gris oscuro principal: #2D2D2D
- Gris medio: #4A4A4A
- Fondo general claro: #F5F5F5
- Blanco: #FFFFFF
- Acento azul electrico: #3D5AFE
- Exito: #00E676
- Peligro: #FF5252
- Advertencia: #FFC107

Lineamientos de estilo:
- Fondo de app con gradiente suave diagonal entre #F5F5F5 y #E0E0E0.
- Tarjetas y superficies en blanco, con sombras suaves y modernas.
- Radios consistentes de 8px, 12px y 16px segun jerarquia.
- Boton primario con gradiente de #2D2D2D a #1A1A1A y texto blanco.
- Acento azul solo para acciones clave, foco y estados activos.
- Estados de exito, error y advertencia con los colores funcionales definidos.

Tipografia y layout:
- Fuente sans-serif tipo Segoe UI o equivalente.
- Jerarquia clara: titulos solidos, subtitulos en gris, cuerpo legible.
- Espaciado consistente y sistema mobile-first.
- Debe verse bien en movil, tablet y desktop.

Microinteracciones y UX:
- Animaciones sutiles: fade-in y slide-up.
- Transiciones entre 200ms y 300ms.
- Estados hover, active, disabled y focus claramente visibles.
- Focus accesible para teclado.

Alcance tecnico esperado:
1. Crear tokens de diseno (colores, sombras, radios, spacing, tipografia).
2. Unificar estilos globales y estilos de componentes.
3. Normalizar componentes base: boton, input, select, card, modal, badge, tabla y alertas.
4. Mantener la estructura funcional existente y solo ajustar presentacion.
5. Entregar cambios listos para escalar por features.

Restricciones:
- No tocar servicios, modelos, reglas de negocio ni endpoints.
- No romper rutas ni navegacion.
- No introducir dependencias innecesarias.

Resultado esperado:
- La app actual conserva su funcionalidad, pero con una identidad visual coherente, moderna y reutilizable.

## Prompt compacto (copiar y pegar)
Aplica un rediseño visual completo a mi app Angular existente, sin crear una app nueva y sin tocar logica de negocio (servicios, modelos, endpoints, rutas o flujos).

Usa este estilo obligatorio:
- Estetica elegante, alto contraste, base neutra gris/negro con acentos vibrantes.
- No apariencia boilerplate y no morado dominante.

Paleta obligatoria:
- #0D0D0D, #1A1A1A, #2D2D2D, #4A4A4A, #F5F5F5, #FFFFFF, #3D5AFE, #00E676, #FF5252, #FFC107.

Reglas de UI:
- Fondo con gradiente suave diagonal (#F5F5F5 a #E0E0E0).
- Tarjetas blancas con sombras suaves modernas.
- Radios consistentes: 8px, 12px, 16px.
- Boton primario con gradiente #2D2D2D -> #1A1A1A y texto blanco.
- Acento azul para acciones clave, foco y activo.
- Estados success/error/warning con sus colores funcionales.

UX y responsive:
- Tipografia sans-serif tipo Segoe UI o equivalente.
- Mobile-first, consistente en movil/tablet/desktop.
- Animaciones sutiles (fade-in, slide-up) y transiciones 200-300ms.
- Estados hover/active/disabled/focus claros y accesibles por teclado.

Entrega:
1. Tokens de diseno (color, sombra, radio, spacing, tipografia).
2. Unificacion de estilos globales + componentes.
3. Normalizacion visual de boton, input, select, card, modal, badge, tabla y alertas.
4. Mantener funcionalidad actual intacta.
