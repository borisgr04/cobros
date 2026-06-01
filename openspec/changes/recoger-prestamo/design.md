## Context

El sistema Cobros gestiona préstamos con cuotas para una cartera de clientes. Existe la operación "Ampliar Plazo" que *modifica* un préstamo activo. La nueva operación "Recoger Préstamo" es conceptualmente diferente: **crea un préstamo nuevo** absorbiendo el saldo pendiente del original, entregando dinero adicional al cliente.

El modelo actual de `Prestamo` no tiene FK a sí mismo ni estado `refinanciado`. `NovedadPrestamo` cubre "pronto_pago" y "ampliacion_plazo"; necesita extenderse para vincular dos préstamos.

## Goals / Non-Goals

**Goals:**
- Agregar estado `refinanciado` al préstamo origen (inmutable una vez aplicado).
- Agregar FK auto-referencial `PrestamoOrigenId` al préstamo destino.
- Agregar campos `PrestamoDestinoId` y `DineroAdicional` / `SaldoTrasladado` a `NovedadPrestamo`.
- Nuevo endpoint `POST /api/prestamos/{id}/recoger` que ejecuta la operación en una transacción.
- Nuevo formulario Angular + resumen previo a la confirmación.
- Registrar salida de caja solo por `dinero_adicional`.

**Non-Goals:**
- Modificar pagos o cuotas históricas del préstamo origen.
- Permitir refinanciar préstamos ya refinanciados, completados o anulados.
- Cadenas de refinanciación (múltiples niveles en esta iteración).
- Impacto en el cálculo de intereses (los intereses del nuevo préstamo los ingresa el usuario manualmente, igual que en registro-prestamo-campos-manuales).

## Decisions

### D1: Nuevo préstamo vs. mutación del original

**Decisión**: Crear un préstamo nuevo con `PrestamoOrigenId` apuntando al original, y marcar el original como `refinanciado`.

**Alternativa descartada**: Modificar el préstamo original (como hace "Ampliar Plazo"). Descartado porque la operación semánticamente crea un nuevo contrato con capital compuesto; mezclar los períodos históricos y nuevos en un solo préstamo dificulta reportes y auditoría.

### D2: Cómo registrar la trazabilidad

**Decisión**: Reutilizar `NovedadPrestamo` extendida con dos nuevos campos nullable:
- `PrestamoDestinoId int?` — FK al nuevo préstamo.
- `DineroAdicional decimal?` — efectivo adicional entregado.
- `SaldoTrasladado decimal?` — saldo absorbido del préstamo origen.

La novedad se registra en el préstamo **origen** (tipo `recoger_prestamo`).

**Alternativa descartada**: Tabla separada `RefinanciacionPrestamo`. Descartado para evitar proliferación de tablas; el patrón de novedades nullable ya existe y es coherente.

### D3: Estado del préstamo origen

**Decisión**: Nuevo valor de estado `refinanciado` (string, MaxLength 30, compatible con la columna existente). El endpoint valida que el estado sea `activo` antes de ejecutar.

### D4: Transaccionalidad

**Decisión**: Todo en una sola transacción de base de datos:
1. Calcular saldo pendiente.
2. Crear nuevo `Prestamo` con `PrestamoOrigenId`.
3. Generar `Cuota[]` para el nuevo préstamo.
4. Insertar `NovedadPrestamo` tipo `recoger_prestamo` en préstamo origen.
5. Actualizar estado del préstamo origen a `refinanciado`.
6. `SaveChangesAsync`.

Si cualquier paso falla, rollback completo.

### D5: Impacto en caja

**Decisión**: Solo registrar movimiento de caja por `DineroAdicional`. El `SaldoTrasladado` es capital contable sin flujo de efectivo. El módulo de caja existente (si lo hay) debe filtrar por tipo `recoger_prestamo` y tomar solo `DineroAdicional`.

### D6: Frontend — flujo de invocación

**Decisión**: El botón "Recoger Préstamo" en el menú de novedades del detalle del préstamo abre un modal dedicado (`RecogerPrestamoComponent`). Al confirmar, el modal llama a `POST /api/prestamos/{id}/recoger` y redirige al detalle del **nuevo** préstamo creado.

No se reutiliza el modal de "Nuevo Préstamo" para evitar mezclar flujos; el contexto y las validaciones son distintos.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| La columna `Estado` acepta strings libres — posible valor inesperado | Validar en endpoint y en guard Angular; documentar los valores válidos en el modelo |
| Préstamos refinanciados aparecen en listados activos | Actualizar queries del dashboard/reportes para excluir estado `refinanciado` |
| El nuevo préstamo queda sin cliente visible si se navega directamente | `PrestamoOrigenId` permite trazar el cliente; el endpoint retorna el ID del nuevo préstamo para redireccion inmediata |
| Migraciones EF en producción con columnas nullable | Sin breaking change; columnas nullable no rompen filas existentes |

## Migration Plan

1. Agregar columnas en `Prestamo` (`PrestamoOrigenId`) y `NovedadPrestamo` (`PrestamoDestinoId`, `DineroAdicional`, `SaldoTrasladado`) como nullable.
2. Generar y aplicar migración EF Core (`AddRecogerPrestamo`).
3. Desplegar backend con el nuevo endpoint.
4. Desplegar frontend con el nuevo componente.
5. Verificar en staging con un préstamo de prueba end-to-end.

**Rollback**: Las columnas nullable no afectan el comportamiento existente. Si hay que revertir, basta con desplegar la versión anterior del código (las columnas vacías son inocuas).
