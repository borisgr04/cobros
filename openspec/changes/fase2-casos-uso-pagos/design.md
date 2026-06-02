## Context

Tras la Fase 1, `PagosController` tiene la lógica de distribución correcta (con `Estado` actualizado). El objetivo ahora es mover esa lógica fuera del controlador hacia handlers independientes, siguiendo el patrón `one-class-per-operation` del `config.yaml`. El controlador pasa a ser solo HTTP: deserializa el request, llama al handler, mapea el `Result<T>` a una respuesta HTTP.

Los handlers recibirán `CobrosDbContext` directamente vía primary constructor (patrón aprobado — sin repositorio genérico, sin IUnitOfWork).

## Goals / Non-Goals

**Goals:**
- Extraer `AplicarPago` y `AnularPago` como casos de uso testables sin HTTP
- `PagosController` queda con < 20 líneas de lógica real por acción
- Definir `Result<T>` como tipo de retorno unificado para todos los handlers del proyecto
- `PagosRules` centraliza las validaciones de negocio de pagos

**Non-Goals:**
- Modificar la lógica de distribución de abono (ya corregida en Fase 1)
- Extraer `EjecutarProntoPago` ni `EjecutarAmpliacionPlazo` (Fase 3)
- Agregar nuevas validaciones de negocio no existentes hoy

## Decisions

### 1. Patrón primary constructor para inyección de DbContext

```csharp
public class AplicarPago(CobrosDbContext db)
{
    public async Task<Result<Pago>> ExecuteAsync(AplicarPagoDto dto) { ... }
}
```

Registrado en DI como `builder.Services.AddScoped<AplicarPago>()`. El controlador lo recibe en su constructor.

**Alternativa descartada**: static class — no testeable con DbContext mock.

### 2. Tipo `Result<T>` propio mínimo

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public int StatusCode { get; }  // HTTP status sugerido (400, 404, 200...)

    public static Result<T> Ok(T value) => ...;
    public static Result<T> Fail(string error, int statusCode = 400) => ...;
    public static Result<T> NotFound(string error) => ...;
}
```

**Alternativa descartada**: FluentResults / ErrorOr — dependencias externas; el patrón es simple.

### 3. `PagosRules` con métodos estáticos

```csharp
public static class PagosRules
{
    public static bool PrestamoAceptaPagos(string estado) =>
        estado != PrestamoEstados.Prestamo.CerradoProntoPago &&
        estado != PrestamoEstados.Prestamo.Completado &&
        estado != PrestamoEstados.Prestamo.Refinanciado;

    public static bool EsUltimoPagoActivo(Pago pago, Pago? ultimoActivo) =>
        ultimoActivo?.Id == pago.Id;
}
```

Método estático porque las reglas no tienen estado — no necesitan DI.

### 4. `AplicarPagoDto` interno al handler

```csharp
public record AplicarPagoDto(int PrestamoId, decimal Valor, DateTime FechaPago);
```

El controlador mapea `PagoInputDto` → `AplicarPagoDto` antes de llamar al handler. Así el handler es agnóstico del formato HTTP.

### 5. Migración gradual: sin romper tests existentes

Los tests actuales pasan por la capa HTTP (`WebApplicationFactory`). No cambian — el controlador sigue exponiendo los mismos endpoints. Se agregan tests unitarios directos al handler como complemento.

## Risks / Trade-offs

- **[Trade-off] Doble capa de DTOs** → `PagoInputDto` (HTTP) + `AplicarPagoDto` (handler). Leve overhead pero aísla al handler del formato del wire. Aceptable.
- **[Risk] Registrar handlers en DI** → Si se olvida el `AddScoped`, el controlador falla en runtime con DI exception. Mitigación: tests de integración existentes cubren el endpoint end-to-end.

## Migration Plan

1. Crear `Result.cs`, compilar
2. Crear `PagosRules.cs`, compilar
3. Crear `AplicarPago.cs` con la lógica extraída de `PagosController.Create`
4. Crear `AnularPago.cs` con la lógica extraída de `PagosController.Anular`
5. Registrar handlers en `Program.cs`
6. Modificar `PagosController.Create` para delegar en `AplicarPago`
7. Modificar `PagosController.Anular` para delegar en `AnularPago`
8. Ejecutar `dotnet test` — todos los tests deben pasar (sin cambios de comportamiento)
9. Agregar tests unitarios directos a los handlers (sin HTTP)

## Open Questions

- ¿`Result<T>` vive en `Features/Shared/` o en la raíz de `CobrosApi/`? (Recomendado: `Features/Shared/`, consistente con la estructura planificada)
