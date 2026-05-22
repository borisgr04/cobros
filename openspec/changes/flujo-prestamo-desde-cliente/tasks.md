## 1. Modal de registro — simplificación: eliminar sección cliente, recibir ICliente

- [x] 1.1 Cambiar firma del método `abrir()` a `abrir(cliente: ICliente): void` — requerido, sin valor por defecto
- [x] 1.2 Agregar `clienteActual = signal<ICliente | null>(null)` y asignarlo en `abrir()`
- [x] 1.3 Eliminar los signals: `clienteId`, `clientes`, `cargandoClientes`, `mostrarFormNuevoCliente`, `nuevoNombre`, `nuevoAlias`, `nuevoIdentificacion`, `nuevoZonaId`, `nuevoTelefono`, `guardandoCliente`, `errorNuevoCliente`, `cedulaDuplicada`
- [x] 1.4 Eliminar la inyección de `AbstractClienteService` y `AbstractZonaService` del modal (ya no carga clientes)
- [x] 1.5 Actualizar `errorCliente` computed: retornar `''` siempre (cliente viene garantizado)
- [x] 1.6 Actualizar `registrarPrestamo()`: usar `clienteActual()!.id` como `clienteId` en el payload
- [x] 1.7 Actualizar `resetearFormulario()`: limpiar valores del préstamo pero NO limpiar `clienteActual` (se limpia al cerrar)

## 2. Modal de registro — HTML: reemplazar sección cliente por banda readonly

- [x] 2.1 Eliminar del HTML toda la sección de cliente: `<select>`, botón "+ Nuevo cliente", mini-form inline (`div.form-nuevo-cliente`) y mensajes de error de cliente
- [x] 2.2 Reemplazar la sección con una banda `.cliente-preseleccionado-band`: icono de persona, nombre en negrita, identificación y zona en texto secundario
- [x] 2.3 Agregar CSS `.cliente-preseleccionado-band`: fondo `var(--bg-secondary)`, borde izquierdo `3px solid var(--color-primary)`, padding `0.75rem 1rem`, mostrar como flex row con gap

## 3. Cierre seguro — todos los modales

- [x] 3.1 `registro-prestamo-modal`: quitar `(click)="cerrar()"` del `div.modal-overlay`; agregar `@HostListener('document:keydown.escape') onEscape() { if (this.visible()) this.cerrar(); }`
- [x] 3.2 `edicion-prestamo-modal`: ídem — quitar click en overlay, agregar HostListener ESC
- [x] 3.3 `registro-pago-modal`: ídem — quitar click en overlay, agregar HostListener ESC
- [x] 3.4 `clientes.component` (form modal `form-modal-overlay`): quitar `(click)="cancelarFormulario()"` del overlay si existe; agregar HostListener ESC en el componente
- [x] 3.5 `prestamos.component` (modal de filtros `modal-overlay`): quitar `(click)="cerrarModalFiltros()"` del overlay; agregar HostListener ESC

## 4. Clientes — botón Nuevo Préstamo

- [x] 4.1 Importar `RegistroPrestamoModalComponent` en `clientes.component.ts` e incluir en `imports[]`
- [x] 4.2 Agregar `modalPrestamo = viewChild(RegistroPrestamoModalComponent)` en `clientes.component.ts`
- [x] 4.3 Agregar método `nuevoPrestamo(cliente: ICliente): void { this.modalPrestamo()?.abrir(cliente); }`
- [x] 4.4 Agregar `<app-registro-prestamo-modal ...>` al HTML de `clientes.component`
- [x] 4.5 Agregar botón "Nuevo Préstamo" en cada fila/card de cliente en `clientes.component.html` que llame `nuevoPrestamo(cliente)`
- [x] 4.6 Eliminar o dejar inactivo el método `crearPrestamoConClientePreseleccionado()` que navega con `setTimeout`

## 5. Préstamos — botón Otro préstamo

- [x] 5.1 Agregar botón "Otro préstamo" en la tarjeta de préstamo (`prestamos.component.html`) que llame `abrirModalPrestamo(prestamo.cliente)`
- [x] 5.2 Actualizar `abrirModalPrestamo()` para aceptar `ICliente | string` — si recibe `ICliente`, pasar directo; si recibe string (ID), mantener flujo actual como fallback
- [x] 5.3 Eliminar el bloque `setTimeout(() => this.abrirModalPrestamo(...), 1000)` del `ngOnInit`
- [x] 5.4 Eliminar el botón "Nuevo Préstamo" de `prestamos.component.html` (el que no tiene cliente preseleccionado)

## 6. Verificación

- [ ] 6.1 Desde Clientes → "Nuevo Préstamo" en un cliente → modal abre con banda readonly del cliente, sin selector
- [ ] 6.2 Desde Préstamos → "Otro préstamo" → modal abre con el mismo cliente preseleccionado
- [ ] 6.3 Clic en overlay de cualquier modal → modal no se cierra
- [ ] 6.4 Tecla ESC con modal abierto → modal se cierra
- [ ] 6.5 Registrar préstamo desde Clientes → préstamo creado con el cliente correcto
