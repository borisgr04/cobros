## Context

Seis cambios de UX sobre los formularios de registro de préstamo y gestión de clientes. Todos son frontend-only. Los componentes afectados son:

- `registro-prestamo-modal.component.ts/html/scss` — modal de nuevo préstamo con mini-formulario inline de cliente
- `prestamos.component.ts` — lógica de filtro post-creación
- `clientes.component.html` — visibilidad del mensaje de error

Estado actual de las áreas relevantes:
- Validación de cédula: solo se ejecuta en `guardarNuevoCliente()` al hacer submit. No hay feedback mientras el usuario escribe.
- Controles numéricos: inputs type="number" sin formato visual. El usuario ve `1500000` en lugar de `$1.500.000`.
- Filtro post-creación: `onPrestamoRegistrado()` llama a `limpiarFiltroCliente()` si el cliente difiere — el nuevo préstamo puede quedar invisible si no hay filtro activo.
- Teléfono en inline: el campo existe pero no está marcado como requerido.
- Alias en inline: campo ausente del mini-formulario.
- Mensaje de error en clientes: el componente usa `mensaje()` signal pero el template puede tener condición incorrecta.

## Goals / Non-Goals

**Goals:**
- Validación visual inmediata de cédula duplicada al escribir (sin esperar submit).
- Formato de moneda en Valor Prestado y Valor Total del modal.
- Al crear préstamo, establecer filtro al cliente del préstamo (para ver el resultado inmediatamente).
- Teléfono requerido en ambos formularios de cliente.
- Alias visible en formulario inline.
- Mensaje de error visible en modal de Gestión de Clientes.

**Non-Goals:**
- No se agrega formato de moneda en otros lugares del sistema (resumen, detalle, etc.).
- No se cambia el backend ni el modelo de datos.
- No se agrega formateo de moneda en campos de solo lectura (esos ya tienen pipe currency).

## Decisions

### Decisión 1: Validación de cédula en tiempo real vía `computed`

Se agrega un `computed` `cedulaDuplicada` que observa `nuevoIdentificacion()` y `clientes()`. El botón "Guardar" se deshabilita cuando `cedulaDuplicada()` es `true`. Se muestra un hint debajo del campo (no un error modal) para indicar la colisión mientras el usuario escribe. Esto elimina el submit fallido y da feedback inmediato.

Alternativa descartada: `(input)` event handler + signal manual — más verboso, mismo resultado.

### Decisión 2: Formato de moneda con `Intl.NumberFormat`

Se usa `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` para formatear el valor mostrado. Los inputs siguen siendo `type="number"` para el binding de Angular, pero se muestran con un campo `type="text"` formateado visualmente encima; al editar el usuario escribe número puro y al salir (`blur`) se muestra el valor formateado en un `<span>` adyacente.

Alternativa más simple adoptada: agregar un `<span class="input-moneda-preview">` debajo del input que muestra el valor formateado en tiempo real via `computed`. Sin librerías externas, sin romper el binding Angular.

### Decisión 3: Filtro post-creación → setear al cliente del préstamo

En `onPrestamoRegistrado(prestamo)` se cambia la lógica: en lugar de limpiar el filtro si el cliente difiere, siempre se setea `filtroClienteId(prestamo.clienteId)`. Esto garantiza que el préstamo recién creado siempre sea visible y el usuario ve el contexto correcto.

### Decisión 4: Alias en formulario inline

Se agrega `nuevoAlias = signal<string>('')` y el campo correspondiente en el HTML entre Nombre e Identificación. Es opcional (no bloquea el guardado). Se incluye en el objeto `nuevoCliente` al llamar `clienteService.create()`.

### Decisión 5: Fix mensaje de error en Gestión de Clientes

Se verifica el binding del mensaje en `clientes.component.html`. El error probablemente está en que el bloque `@if (mensaje())` usa clase CSS que no tiene visibilidad o el z-index/position lo oculta dentro del panel lateral. Se corrige el template y/o SCSS.

## Risks / Trade-offs

- **Formato moneda en input**: cambiar `type="number"` a `type="text"` con valor formateado puede afectar el binding si no se gestiona bien. Mitigado — se mantiene el input original `type="number"` oculto para el binding y se agrega solo el preview visual.
- **Computed cedulaDuplicada**: si la lista `clientes()` no ha cargado aún, podría no detectar duplicados. Mitigado — el botón también se deshabilita si `cargandoClientes()` es true.
- **Filtro post-creación siempre activo**: si el usuario crea préstamos para varios clientes en secuencia, el filtro cambiará con cada creación. Aceptable — el chip de filtro con "×" permite limpiar fácilmente.
