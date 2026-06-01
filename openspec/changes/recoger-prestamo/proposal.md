## Why

Los clientes activos necesitan acceder a dinero adicional sin perder el historial de su préstamo en curso. Hoy no existe una operación que permita absorber el saldo pendiente de un préstamo activo y entregarlo como capital de uno nuevo, lo que obliga a cobrar el préstamo antes de gestionar uno nuevo y genera fricciones operativas y pérdida de trazabilidad.

## What Changes

- Nueva operación de negocio **"Recoger Préstamo"**: toma el saldo pendiente de un préstamo activo y lo incorpora como capital de un nuevo préstamo, al que se suma dinero adicional entregado al cliente.
- El préstamo original cambia de estado a **REFINANCIADO** y no se modifica (pagos, cuotas e importes históricos quedan intactos).
- Se crea un nuevo préstamo con capital = saldo_pendiente + dinero_adicional, con sus cuotas generadas.
- Se registra una **novedad de tipo `recoger_prestamo`** que vincula préstamo origen y destino y garantiza trazabilidad completa.
- Solo afecta a caja el dinero adicional entregado (el saldo trasladado es contable, no efectivo).
- Nueva opción en el menú de novedades del detalle de préstamo en la UI.

## Capabilities

### New Capabilities

- `recoger-prestamo`: Operación backend + UI que refinancia un préstamo activo, crea uno nuevo con capital compuesto y registra la novedad de vinculación.

### Modified Capabilities

- `registro-prestamo-campos-manuales`: El formulario de nuevo préstamo debe poder recibir un `prestamoOrigenId` y un `saldoTrasladado` pre-cargados cuando se invoca desde la operación "Recoger Préstamo" (flujo guiado vs. flujo independiente).

## Impact

- **Backend**: nuevo endpoint `POST /api/prestamos/{id}/recoger`; nuevo estado `refinanciado` en la entidad `Prestamo`; campo `PrestamoOrigenId` (FK self-referencial) en `Prestamo`; nueva variante de `NovedadPrestamo` con campos `PrestamoDestinoId`, `SaldoTrasladado`, `DineroAdicional`.
- **Migraciones EF Core**: columna `PrestamoOrigenId` nullable en `Prestamos`; campo `PrestamoDestinoId` nullable en `NovedadesPrestamo`.
- **Frontend Angular**: nuevo componente de formulario `recoger-prestamo`; guardia de validación en el detalle del préstamo; actualización del servicio `PrestamosApiService`.
- **Reportes**: el estado `refinanciado` debe excluirse de la cartera activa y sumarse a una nueva categoría en el dashboard.
- **Caja**: solo registrar salida por el monto de `dinero_adicional`.
