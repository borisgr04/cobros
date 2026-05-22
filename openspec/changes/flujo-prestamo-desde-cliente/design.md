## Context

El modal de registro de préstamo actualmente requiere que el usuario seleccione el cliente desde un `<select>` con todos los clientes activos. Con 100+ clientes, esto es inusable en mobile. El cobrador siempre llega al modal con un cliente en mente — ya sea desde la gestión de clientes o desde los préstamos de un cliente específico.

El componente `ClientesComponent` ya tiene un método `crearPrestamoConClientePreseleccionado()` que navega a `/prestamos?cliente=X&nuevo=true` y usa `setTimeout(1000)` para abrir el modal. Es una race condition: si los datos tardan más de 1 segundo, el modal no se abre con el cliente correcto.

El modal tiene un mecanismo `abrir(clienteIdPreseleccionado?: string)` que acepta el ID pero sigue dependiendo de la lista cargada para resolver nombre/identificación.

Todos los modales usan `(click)="cerrar()"` en el overlay, lo que causa cierres accidentales en mobile donde un toque errado fuera del modal lo cierra y borra el formulario.

## Goals / Non-Goals

**Goals:**
- El modal de préstamo acepta `ICliente` completo (no solo ID) para mostrar en readonly sin necesitar cargar la lista.
- Botón "Nuevo Préstamo" en cada fila de clientes abre el modal sin navegación.
- Botón "Otro préstamo" en tarjeta de préstamo reutiliza el mismo cliente.
- Todos los modales cierran solo con ESC o botón explícito.
- Eliminar el flujo frágil de `setTimeout + queryParam nuevo=true`.

**Non-Goals:**
- No se elimina el selector de cliente del modal (se mantiene como fallback para cuando se abre sin cliente preseleccionado).
- No se construye un combobox de búsqueda de clientes — fuera del scope de este cambio.
- No hay cambios en backend ni base de datos.

## Decisions

### D1: `Input()` de `ICliente` completo — sin fallback de selector
**Decisión**: El modal recibe `Input() clientePreseleccionado = input.required<ICliente>()` — siempre requerido. Se elimina el `<select>` y todo el código de carga de clientes del modal.  
**Rationale**: No existe ningún flujo de entrada al modal sin cliente. Mantener el selector como "fallback" sería código muerto que complica el componente. El modal se simplifica notablemente: desaparecen los signals `clienteId`, `clientes[]`, `cargandoClientes`, `mostrarFormNuevoCliente` y todos los signals del mini-form inline.  
**Alternativa descartada**: `input<ICliente | null>(null)` con renderizado condicional — innecesario, agrega complejidad sin valor.

### D2: `RegistroPrestamoModalComponent` se importa en `ClientesComponent`
**Decisión**: En lugar de navegar a `/prestamos`, el modal de préstamo se abre in-situ dentro de la página de clientes.  
**Rationale**: Evita la navegación y el `setTimeout`. La UX es más fluida — el cobrador no pierde el contexto de la lista de clientes.  
**Alternativa descartada**: Servicio de modal global — más complejidad para un caso específico.

### D3: `@HostListener('document:keydown.escape')` para cerrar modales
**Decisión**: Cada modal escucha el evento `keydown.escape` a nivel documento para cerrar.  
**Rationale**: Patrón estándar Angular. No requiere librería externa. El overlay pierde su handler `(click)="cerrar()"`.  
**Consideración**: Si hay modales anidados (ej. modal de préstamo con mini-form de cliente), el ESC cierra el modal externo. Aceptable por ahora — el mini-form de cliente tiene su propio botón cancelar.

### D4: Botón "Otro préstamo" en tarjeta de préstamo
**Decisión**: El botón llama directamente a `this.modalPrestamo().abrir(prestamo.cliente)` donde `prestamo.cliente` es el `ICliente` ya hidratado en el `PrestamoConCliente`.  
**Rationale**: Los préstamos ya cargan con el cliente embebido (`PrestamoConCliente`). No hay llamada extra.

## Risks / Trade-offs

- **[Riesgo] ESC cierra modal con formulario lleno** → El usuario puede perder datos si presiona ESC accidentalmente. Mitigación: comportamiento estándar de modales en la web; documentar que ESC descarta cambios.
- **[Riesgo] Modal de préstamo abierto desde clientes no tiene contexto del filtro de préstamos** → El `ux-filtro-prestamos` spec dice que tras crear un préstamo se filtra la lista. Desde clientes, no hay lista de préstamos visible. Mitigación: el filtro aplica solo en `prestamos.component`; tras crear desde clientes, navegar a préstamos con filtro activo OR simplemente cerrar el modal y quedar en clientes.
- **[Trade-off] `ClientesComponent` crece con la importación del modal de préstamo** → Añade una dependencia entre features. Aceptable dado que el flujo es explícito y cohesivo.

## Migration Plan

1. Modificar `registro-prestamo-modal.component.ts`: nuevo `Input()`, lógica de renderizado condicional de sección cliente.
2. Modificar todos los modales: quitar `(click)="cerrar()"` del overlay, agregar `@HostListener`.
3. Modificar `clientes.component`: importar modal, botón "Nuevo Préstamo".
4. Modificar `prestamos.component`: botón "Otro préstamo", eliminar setTimeout.
5. Sin migraciones de datos ni rollback de backend.
