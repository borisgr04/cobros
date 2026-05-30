## Why

Actualmente, el botón "nueva zona" en el home se sale visualmente del card cuando la pantalla se reduce, afectando la experiencia de usuario en dispositivos móviles o ventanas pequeñas. Además, el reporte de préstamos finalizados no muestra los datos correctamente aunque existan préstamos finalizados, lo que impide a los usuarios acceder a información relevante para la gestión y seguimiento de préstamos.

## What Changes

- Corregir el diseño responsivo del botón "nueva zona" en el home para que siempre permanezca dentro del card, sin importar el tamaño de pantalla.
- Arreglar la lógica y visualización del reporte de préstamos finalizados para que muestre correctamente los datos de préstamos que han sido finalizados.

## Capabilities

### New Capabilities
- `fix-boton-nueva-zona`: Ajuste visual responsivo para el botón "nueva zona" en el home.
- `fix-reporte-prestamos-finalizados`: Corrección de la lógica y visualización del reporte de préstamos finalizados.

### Modified Capabilities


## Impact

- Código del frontend (cobros-iu), especialmente en los componentes y estilos del home y del botón "nueva zona".
- Código del backend y frontend relacionado con la consulta y visualización de préstamos finalizados en reportes.
- Posibles cambios en servicios, controladores y DTOs relacionados con préstamos y reportes.
