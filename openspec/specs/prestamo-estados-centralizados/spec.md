### Requirement: Constantes de estado centralizadas en PrestamoEstados
El sistema SHALL mantener todas las cadenas de estado de préstamo y de cuota en una única clase estática `PrestamoEstados`, con nested classes `Prestamo` y `Cuota`. Ningún archivo fuera de esta clase SHALL contener los strings `"activo"`, `"completado"`, `"cerrado_pronto_pago"`, `"refinanciado"`, `"pendiente"`, `"parcial"`, `"pagada"`, `"cerrada_pronto_pago"` o `"reemplazada_por_ampliacion"` como literales.

#### Scenario: Constantes de estado de préstamo existen
- **WHEN** se referencia cualquier estado de préstamo en el código
- **THEN** se usa `PrestamoEstados.Prestamo.Activo`, `.Completado`, `.CerradoProntoPago` o `.Refinanciado`

#### Scenario: Constantes de estado de cuota existen
- **WHEN** se referencia cualquier estado de cuota en el código
- **THEN** se usa `PrestamoEstados.Cuota.Pendiente`, `.Parcial`, `.Pagada`, `.CerradaProntoPago` o `.ReemplazadaAmpliacion`
