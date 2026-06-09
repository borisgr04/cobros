## ADDED Requirements

### Requirement: Endpoint de cierre del día
El sistema SHALL exponer `GET /api/reportes/cierre-dia?fecha=YYYY-MM-DD` que devuelve `CierreDiaDto` con los bloques Ganancia, Préstamos del día y Cobros del día calculados para la fecha indicada.

#### Scenario: Respuesta exitosa con datos del día
- **WHEN** se llama `GET /api/reportes/cierre-dia?fecha=2026-06-05`
- **THEN** el servidor responde HTTP 200 con un `CierreDiaDto`
- **AND** `Ganancia.InteresesPactadosTotal` = suma de `InteresProyectado` de todos los préstamos con `FechaPrestamo = 2026-06-05`
- **AND** `Ganancia.DescuentosProntoPagoTotal` = suma de `DescuentoAplicado` de novedades tipo `pronto_pago` con `FechaNovedad = 2026-06-05`
- **AND** `Ganancia.GananciaNeta` = `InteresesPactadosTotal - DescuentosProntoPagoTotal`

#### Scenario: Fecha sin actividad retorna ceros
- **WHEN** se llama con una fecha sin ningún préstamo, pago ni novedad
- **THEN** el servidor responde HTTP 200 con todos los contadores en 0 y listas vacías

#### Scenario: Fecha inválida retorna 400
- **WHEN** se llama con `fecha=abc`
- **THEN** el servidor responde HTTP 400

### Requirement: Bloque Préstamos del día en cierre diario
El `CierreDiaDto` SHALL incluir el bloque `PrestamosDia` con los siguientes campos calculados para la fecha indicada.

#### Scenario: Separación de nuevos vs recogidos
- **WHEN** existen 2 préstamos nuevos (PrestamoOrigenId IS NULL) y 1 recogido (IS NOT NULL) con FechaPrestamo = fecha
- **THEN** `NuevosCount = 2` y `RenovadosCount = 1`

#### Scenario: Capital entregado excluye saldo trasladado
- **WHEN** un préstamo recogido tiene ValorPrestado = 500.000 y DineroAdicional = 80.000
- **AND** un préstamo nuevo tiene ValorPrestado = 200.000
- **THEN** `CapitalEntregadoTotal = 80.000 + 200.000 = 280.000`

#### Scenario: ProntoPagoCount del día
- **WHEN** hay 3 novedades tipo `pronto_pago` con `FechaNovedad = fecha`
- **THEN** `ProntoPagoCount = 3`

#### Scenario: NuevosPorFrecuencia agrupa correctamente
- **WHEN** hay 3 préstamos diarios y 2 semanales del día
- **THEN** `NuevosPorFrecuencia` contiene `[{Frecuencia: "diario", Count: 3}, {Frecuencia: "semanal", Count: 2}]`
- **AND** frecuencias con 0 préstamos NO aparecen en la lista

### Requirement: Bloque Cobros del día en cierre diario
El `CierreDiaDto` SHALL incluir el bloque `Cobros` con los datos de recaudo del día.

#### Scenario: RecaudadoTotal excluye pagos anulados
- **WHEN** hay 3 pagos de $100 y 1 anulado de $50 con FechaPago = fecha
- **THEN** `RecaudadoTotal = 300`

#### Scenario: PrestamosActivosCount es la cartera total
- **WHEN** hay 50 préstamos con estado "activo" en el sistema
- **THEN** `PrestamosActivosCount = 50` independientemente de la fecha consultada

#### Scenario: PorZona muestra CobrosProgramados y PagaronCount
- **WHEN** en Zona A hay 10 cuotas con FechaEsperada = fecha y 7 préstamos distintos recibieron algún pago ese día
- **THEN** la entrada de Zona A tiene `CobrosProgramados = 10`, `PagaronCount = 7`, `Total = suma de pagos de esa zona`

#### Scenario: Zonas sin actividad no aparecen en PorZona
- **WHEN** una zona no tiene cuotas programadas ni pagos el día consultado
- **THEN** esa zona no aparece en el listado `PorZona`

### Requirement: Pantalla Cierre del Día en Angular
El sistema SHALL proveer `CierreDiaComponent` accesible en `/reportes/cierre-dia`, standalone, mobile-first, que consuma `GET /api/reportes/cierre-dia`.

#### Scenario: Loading skeleton mientras carga
- **WHEN** el componente inicia la carga del reporte
- **THEN** se muestran placeholders animados en lugar de los valores reales
- **AND** los skeletons tienen la misma estructura visual que los bloques de datos

#### Scenario: Error visible si el endpoint falla
- **WHEN** el endpoint responde con error o hay fallo de red
- **THEN** se muestra un mensaje de error descriptivo con opción de reintentar

#### Scenario: Valores monetarios abreviados a K
- **WHEN** un valor monetario es mayor o igual a 1.000
- **THEN** se muestra como `$NNNk` (ej: $582.000 → $582k, $1.500.000 → $1.500k)

#### Scenario: 4 bloques en orden correcto
- **WHEN** el componente muestra datos cargados
- **THEN** los bloques aparecen en este orden: 1) Ganancia del día, 2) Préstamos del día, 3) Cobros del día
- **AND** cada bloque usa variables SCSS del proyecto para colores (no colores inline)

#### Scenario: Selector de fecha
- **WHEN** el usuario abre la pantalla de cierre del día
- **THEN** la fecha por defecto es hoy
- **AND** el usuario puede cambiarla para consultar días anteriores
- **AND** al cambiar la fecha se recarga el reporte automáticamente
