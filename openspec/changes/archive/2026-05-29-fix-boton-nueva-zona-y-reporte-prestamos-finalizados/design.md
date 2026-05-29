## Context

Actualmente, el botón "nueva zona" en el home presenta problemas de diseño responsivo, saliéndose del card en pantallas pequeñas. Además, el reporte de préstamos finalizados no muestra datos aunque existan préstamos finalizados, lo que afecta la gestión y visibilidad de información clave para los usuarios.

## Goals / Non-Goals

**Goals:**
- Garantizar que el botón "nueva zona" permanezca correctamente alineado y dentro del card en cualquier tamaño de pantalla.
- Corregir la lógica y visualización del reporte de préstamos finalizados para mostrar correctamente los datos.

**Non-Goals:**
- No se modificarán otras funcionalidades del home o de reportes que no estén relacionadas con estos problemas específicos.
- No se agregarán nuevas funcionalidades fuera de los alcances mencionados.

## Decisions

- Se ajustarán los estilos CSS/SCSS del botón "nueva zona" usando flexbox o grid para asegurar su correcta ubicación y responsividad.
- Se revisará la lógica de consulta y filtrado de préstamos finalizados en el backend y frontend, asegurando que los datos se obtengan y muestren correctamente.
- Se agregarán pruebas manuales y automáticas para validar ambos casos.

## Risks / Trade-offs

- [Riesgo] Cambios en estilos pueden afectar otros elementos visuales del home → Mitigación: Validar visualmente en diferentes resoluciones y navegadores.
- [Riesgo] Cambios en la lógica de reportes pueden impactar otros filtros o reportes → Mitigación: Revisar dependencias y realizar pruebas de regresión.
