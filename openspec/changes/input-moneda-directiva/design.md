## Context

Actualmente los inputs de dinero del sistema usan `type="number"` con un prefijo `$` visual. El cambio `ux-mejoras-formularios` agregó un `<span>` de preview debajo del input (etiqueta separada). Esta solución es funcional pero visualmente desconectada — el usuario escribe en un lugar y la confirmación aparece en otro. Además no cubre `edicion-prestamo-modal` ni `registro-pago-modal`.

Hay 3 componentes con inputs de dinero editable, todos con el mismo patrón. Una directiva Angular standalone centraliza la lógica y elimina duplicación.

## Goals / Non-Goals

**Goals:**
- Directiva `appMoneda` que formatea el valor dentro del input **en tiempo real** mientras el usuario escribe, y muestra número puro al enfocar.
- Parsing robusto alineado a Colombia: punto = separador de miles, sin decimales.
- Aplicar en los 3 componentes afectados reemplazando el patrón actual.
- Eliminar `valorPrestadoFormateado` y `valorTotalFormateado` de `registro-prestamo-modal`.

**Non-Goals:**
- No se formatean campos de solo lectura (ya usan pipe `currency` de Angular).
- No se agrega soporte a decimales (los montos del sistema son enteros).
- No se usa ninguna librería externa.
- No se cambia el modelo de datos ni el backend.

## Decisions

### Decisión 1: Directiva standalone con `model()` de Angular 19

La directiva usa `model<number>()` (signal two-way binding de Angular 19) en lugar de `@Input/@Output` tradicional. Esto permite binding idiomático con signals del componente:

```html
<input appMoneda [(appMoneda)]="valorPrestado" />
```

La directiva mantiene internamente el `displayValue` (string formateado) separado del valor numérico que emite al componente. El `<input>` nativo tiene `type="text"` — el componente solo ve números.

**Alternativa descartada:** `@Input() value + @Output() valueChange` — más verboso, no aprovecha signals de Angular 19.

### Decisión 2: Estrategia focus/blur sin overlays

- **On input**: cada vez que el usuario escribe, el valor se parsea y se muestra formateado en el input (`$ 1.500.000`). El model siempre recibe el número puro (`1500000`).
- **On focus**: mostrar número puro (e.g., `1500000`) para facilitar edición.
- **On blur**: mantener el valor formateado.

**Alternativa descartada:** overlay CSS (div encima del input) — más frágil, problemas de accesibilidad y z-index.

### Decisión 3: Algoritmo de parsing para Colombia (sin decimales)

```
rawString → strip "$" y espacios → strip "." → strip "," → parseInt → validar > 0
```

Casos manejados:
- `"$ 1.500.000"` → `1500000` ✓
- `"1500000"` → `1500000` ✓
- `"1.500"` → `1500` ✓ (miles colombiano, no decimal)
- `""` o `"0"` → `0` (no se emite si min > 0)
- `NaN` → `0`

### Decisión 4: Formato de salida

`Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` — produce `$ 1.500.000` (con espacio después de `$`, separador de miles `.`, sin decimales). Consistente con el resto del sistema que ya usa este formato.

### Decisión 5: Ubicación en `shared/directives/`

La directiva no pertenece a ninguna feature. Se crea el módulo `cobros-iu/src/app/shared/directives/` y se exporta desde `index.ts`. Cada componente standalone la importa directamente.

## Risks / Trade-offs

- **Copy/paste con formato:** Si el usuario copia `$1.500.000` de otro lugar y lo pega en el input, el parsing lo maneja correctamente (strip puntos y $). ✓
- **Valor cero en placeholder:** Si el componente tiene `signal(0)`, al abrir el formulario el input mostraría `$ 0`. Se controla con un input opcional `appMonedaPlaceholder` que reemplaza el display cuando el valor es 0. Alternativa simple: el componente inicia con `null` en lugar de `0` y la directiva muestra placeholder nativo.
- **Compatibilidad `ngModel` vs directiva:** Los componentes actuales usan `[(ngModel)]` para los valores. Al cambiar a la directiva, se elimina `[(ngModel)]` en estos inputs y se usa `[(appMoneda)]`. El componente debe cambiar el signal de `signal<number>` a acceso directo (ya lo hace mediante signals).
- **Accesibilidad:** `type="text"` en lugar de `type="number"` pierde el teclado numérico en mobile. Mitigado: agregar `inputmode="numeric"` a la directiva via `HostBinding`.

## Open Questions

- ¿El input de `registro-pago-modal` (`montoPersonalizado`) puede ser `0` como estado válido, o siempre empieza vacío? → Revisar el componente al implementar (probablemente usa `signal<number>(0)` con `|| null` en el template).
