## Why

Seis fricciones de UX identificadas tras el primer ciclo de uso real del sistema: validaciones tardías que solo se detectan al enviar formularios, controles numéricos sin formato visual, flujos de navegación post-creación poco intuitivos, y campos obligatorios incorrectamente marcados como opcionales. Estas fricciones aumentan el tiempo de registro y producen errores que el usuario no detecta hasta el último paso.

## What Changes

- **Validación de cédula en tiempo real (formulario inline)**: al escribir en el campo Identificación del mini-formulario de nuevo cliente dentro del modal de préstamo, el sistema verifica en memoria si la cédula ya existe y bloquea el botón "Guardar" inmediatamente — sin esperar al submit.
- **Formato de moneda en controles numéricos**: los campos Valor Prestado y Valor Total del modal de registro de préstamo muestran formato de moneda (puntos de miles, prefijo `$`) mientras el usuario escribe.
- **Filtro automático al crear préstamo**: al registrar un préstamo exitosamente, el sistema aplica automáticamente el filtro de cliente al cliente del préstamo recién creado, mostrando solo sus préstamos en la lista.
- **Teléfono obligatorio en registro de clientes**: el campo Teléfono pasa de opcional a requerido tanto en Gestión de Clientes como en el formulario inline de préstamo.
- **Alias visible en formulario inline**: el mini-formulario de nuevo cliente dentro del modal de préstamo incluye el campo Alias (opcional), actualmente ausente.
- **Fix: mensaje de error visible en modal de clientes**: el área de mensaje de error en el formulario de Gestión de Clientes no se muestra correctamente cuando ocurre un error; se corrige el binding.

## Capabilities

### New Capabilities
- `formato-moneda-inputs`: formateo visual de moneda en los campos numéricos del modal de registro de préstamo.

### Modified Capabilities
- `creacion-cliente-inline`: teléfono pasa a requerido; se agrega campo Alias; validación de cédula en tiempo real bloquea el botón antes del submit; fix de visibilidad del mensaje de error.
- `ux-filtro-prestamos`: tras crear un préstamo, en lugar de limpiar el filtro de cliente, se establece el filtro al cliente del préstamo recién creado.

## Impact

- **Frontend únicamente** — sin cambios en backend ni migraciones.
- `registro-prestamo-modal.component.ts / .html / .scss`: formato de moneda, validación en tiempo real, campo alias, teléfono requerido, lógica de filtro post-creación.
- `prestamos.component.ts`: cambiar `onPrestamoRegistrado` para setear `filtroClienteId` al cliente del préstamo (en lugar de limpiar).
- `clientes.component.html`: fix de visibilidad del mensaje de error.
