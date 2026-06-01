## 1. Modelo de dominio y migraciones

- [ ] 1.1 Agregar campo `PrestamoOrigenId int?` (FK self-referencial) y propiedad de navegación `PrestamoOrigen` a la entidad `Prestamo`
- [ ] 1.2 Documentar en el comentario XML de `Estado` el nuevo valor `refinanciado`
- [ ] 1.3 Agregar campos `PrestamoDestinoId int?`, `DineroAdicional decimal?` y `SaldoTrasladado decimal?` a `NovedadPrestamo`
- [ ] 1.4 Agregar FK de navegación `PrestamoDestino` en `NovedadPrestamo`
- [ ] 1.5 Registrar la FK self-referencial en `CobrosDbContext` (fluent API `OnDelete(DeleteBehavior.Restrict)`)
- [ ] 1.6 Generar migración EF Core: `dotnet ef migrations add AddRecogerPrestamo`
- [ ] 1.7 Verificar el SQL generado y aplicar en desarrollo: `dotnet ef database update`

## 2. DTOs

- [ ] 2.1 Crear `RecogerPrestamoInputDto` con campos: `DineroAdicional`, `Intereses`, `CantidadCuotas`, `FrecuenciaPago`, `FechaInicio`, `Observacion`
- [ ] 2.2 Crear `RecogerPrestamoResultadoDto` con campos: `PrestamoOrigenId`, `PrestamoDestinoId`, `NovedadId`, `SaldoTrasladado`, `DineroAdicional`, `CapitalNuevo`, `TotalACobrar`
- [ ] 2.3 Agregar anotaciones de validación a `RecogerPrestamoInputDto` (`[Required]`, `[Range]`)

## 3. Endpoint backend

- [ ] 3.1 Agregar método `POST /api/prestamos/{id}/recoger` en `PrestamosController`
- [ ] 3.2 Implementar validación de estado `activo` (retornar HTTP 400 si no aplica)
- [ ] 3.3 Calcular `saldoPendiente = valorTotal - sumaPagosNoAnulados`
- [ ] 3.4 Crear nuevo `Prestamo` con `ClienteId`, `PrestamoOrigenId`, capital compuesto, intereses, cuotas y fecha de inicio
- [ ] 3.5 Generar `Cuota[]` para el nuevo préstamo usando `CalcularFechaCuota` (con Kind=Utc)
- [ ] 3.6 Insertar `NovedadPrestamo` tipo `recoger_prestamo` con `PrestamoDestinoId`, `SaldoTrasladado`, `DineroAdicional`, `UsuarioId`, `Notas`
- [ ] 3.7 Actualizar estado del préstamo origen a `refinanciado`
- [ ] 3.8 Ejecutar todo dentro de una transacción (`BeginTransactionAsync` / `CommitAsync` / rollback en catch)
- [ ] 3.9 Retornar `RecogerPrestamoResultadoDto` con HTTP 200 en éxito
- [ ] 3.10 Actualizar `openapi-spec.yaml` con el nuevo endpoint

## 4. Reportes y queries

- [ ] 4.1 Actualizar la query del dashboard para excluir estado `refinanciado` de la cartera activa
- [ ] 4.2 Revisar `ReportesController` y excluir `refinanciado` de totales de préstamos activos
- [ ] 4.3 Verificar que el listado de préstamos del cliente muestre préstamos `refinanciados` con el badge correcto

## 5. Frontend — servicio Angular

- [ ] 5.1 Agregar método `recogerPrestamo(id, input)` a `PrestamosApiService` que llame al nuevo endpoint
- [ ] 5.2 Actualizar los tipos/interfaces de préstamo para incluir `prestamoOrigenId`, `estado: 'refinanciado'`
- [ ] 5.3 Actualizar tipos de `NovedadPrestamo` para incluir `prestamoDestinoId`, `dineroAdicional`, `saldoTrasladado`

## 6. Frontend — componente RecogerPrestamo

- [ ] 6.1 Crear componente `RecogerPrestamoComponent` (modal / bottom sheet) con el formulario especificado
- [ ] 6.2 Pre-cargar y mostrar `saldoPendiente` como campo de solo lectura
- [ ] 6.3 Implementar resumen reactivo en tiempo real (saldo trasladado + dinero adicional = capital; capital + intereses = total)
- [ ] 6.4 Implementar la confirmación en dos pasos con mensaje de advertencia
- [ ] 6.5 Al confirmar, llamar al servicio y redirigir al detalle del nuevo préstamo (`/prestamos/:nuevoId`)
- [ ] 6.6 Manejar errores del API y mostrar mensajes descriptivos al usuario
- [ ] 6.7 Aplicar directiva de formato moneda a los campos numéricos del formulario

## 7. Frontend — integración en detalle de préstamo

- [ ] 7.1 Agregar la opción "Recoger Préstamo" al menú de novedades del componente `PrestamoDetalleComponent`
- [ ] 7.2 Mostrar la opción solo cuando el estado del préstamo es `activo` (guard en template)
- [ ] 7.3 Mostrar badge "Refinanciado" en el encabezado cuando `estado === 'refinanciado'`
- [ ] 7.4 Mostrar enlace "Ver nuevo préstamo #N" en el detalle del préstamo refinanciado (usando `novedades` de tipo `recoger_prestamo`)
- [ ] 7.5 Mostrar banner "Originado por refinanciación del préstamo #N" en el detalle del préstamo nuevo (si `prestamoOrigenId` existe)

## 8. Pruebas

- [ ] 8.1 Test unitario backend: operación exitosa crea préstamo nuevo, novedad y marca origen como `refinanciado`
- [ ] 8.2 Test unitario backend: intento sobre préstamo no activo retorna HTTP 400
- [ ] 8.3 Test unitario backend: saldo pendiente cero retorna HTTP 400
- [ ] 8.4 Prueba manual end-to-end en local: flujo completo desde UI hasta verificación en BD
- [ ] 8.5 Verificar que los reportes de cartera excluyen correctamente los préstamos `refinanciados`
