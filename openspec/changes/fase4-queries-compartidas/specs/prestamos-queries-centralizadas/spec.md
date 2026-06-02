## ADDED Requirements

### Requirement: PrestamosQueries centraliza las queries reutilizables
El sistema SHALL exponer los patrones de consulta sobre préstamos como extension methods en `PrestamosQueries`. Los handlers y controladores SHALL usar estos métodos en lugar de duplicar el LINQ.

#### Scenario: GetActivosConSaldo retorna solo préstamos activos con saldo
- **WHEN** se invoca `db.Prestamos.GetActivosConSaldo()`
- **THEN** retorna solo préstamos con `Estado = "activo"` cuyo `Cuotas.Sum(SaldoPagado) < ValorTotal`
- **AND** la query se ejecuta en la base de datos (no in-memory)

#### Scenario: WithCuotas incluye la colección de cuotas
- **WHEN** se invoca `db.Prestamos.WithCuotas()`
- **THEN** la query resultante incluye `Include(p => p.Cuotas)` para carga eager
