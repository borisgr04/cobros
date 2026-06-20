## Context

La UI de novedades de prestamos (Pronto Pago, Recoger Prestamo y Ampliar Plazo) fue simplificada eliminando un paso intermedio, pero quedaron inconsistencias funcionales en etiquetas de accion, editabilidad de fecha y defaults del formulario de recoger. El backend ya soporta los casos de uso; el problema es de comportamiento y estado en frontend Angular standalone.

Restricciones:
- Mantener contratos API actuales.
- Evitar cambios de persistencia o migraciones.
- Corregir sin reintroducir pasos redundantes de confirmacion.

Stakeholders:
- Operacion/caja (flujo rapido y sin ambiguedad en guardado)
- Cobradores (fecha operativa editable en novedades)
- Equipo de soporte (menos errores por defaults incorrectos)

## Goals / Non-Goals

**Goals:**
- Alinear el texto de accion primaria con la operacion real en cada modal de novedad.
- Garantizar que los campos de fecha en novedades no esten en modo solo lectura.
- En recoger prestamo, heredar por defecto la frecuencia del prestamo origen.
- Recalcular cantidad de cuotas al capturar valor de cuota en recoger, con comportamiento equivalente a crear prestamo.
- Conservar la posibilidad de ajustar manualmente frecuencia y cuota antes de ejecutar.

**Non-Goals:**
- Cambiar reglas de negocio de liquidacion en backend.
- Cambiar endpoints o DTOs.
- Reintroducir doble confirmacion con checkbox.
- Rediseñar estilos globales fuera de los modales impactados.

## Decisions

### D1: Corregir semantica de CTA por estado del modal
Se usara un mapeo explicito por paso (`formulario`, `resumen`, `resultado`) para definir label y accion del boton principal.

Rationale:
- Evita que "Continuar" dispare una accion irreversible sin comunicacion clara.
- Reduce regresiones al centralizar criterio semantico por modal.

Alternativas:
- Mantener "Continuar" en todos los formularios: descartado por ambiguedad operativa.
- Restaurar paso de confirmacion: descartado por redundancia y friccion.

### D2: Fecha siempre editable en novedades
Los inputs de fecha se mantendran habilitados y vinculados al estado del formulario; solo se deshabilitan durante `procesando`.

Rationale:
- La fecha operativa puede requerir ajuste manual por cierre de caja.
- Evita bloqueos funcionales reportados por usuarios.

Alternativas:
- Fecha fija de sistema (`today`): descartado por no cubrir carga retroactiva.
- Solo editable en un modal: descartado por inconsistencia de UX.

### D3: Recoger Prestamo hereda frecuencia del origen
Al abrir el modal de recoger, `frecuenciaPago` inicia con `prestamo.frecuenciaPago` del origen; el usuario puede modificarla.

Rationale:
- Preserva continuidad contractual del prestamo original.
- Evita default incorrecto en diaria, reportado como error operativo.

Alternativas:
- Mantener default `diario`: descartado por comportamiento no esperado.
- Forzar frecuencia inmutable: descartado porque operacion requiere flexibilidad.

### D4: Proyeccion de cuotas desde valor de cuota en Recoger
El calculo de cuotas se mantiene derivado de `ceil(totalACobrar/valorCuota)` y se recalcula en cada cambio de cuota, alineado a Crear Prestamo.

Rationale:
- Consistencia mental entre formularios de prestamo nuevo y renovado.
- Minimiza errores de digitacion al mostrar inmediatamente el plan resultante.

Alternativas:
- Campo manual de cantidad de cuotas: descartado por mayor riesgo de inconsistencia.
- Calculo solo al guardar: descartado por feedback tardio.

## Risks / Trade-offs

- [Riesgo] Cambio de etiquetas puede romper tests visuales/e2e existentes.
  Mitigacion: actualizar selectores por data-attributes o por accion en lugar de texto literal.

- [Riesgo] Diferencias entre modal de pronto pago y ampliar plazo en estados de carga.
  Mitigacion: validar que `procesando` deshabilite acciones de forma uniforme.

- [Trade-off] Mayor logica de estado en frontend para mantener semantica precisa.
  Mitigacion: encapsular helpers de etiqueta/accion por modal y agregar pruebas unitarias basicas.

## Migration Plan

1. Actualizar specs delta para capacidades impactadas y nueva capacidad transversal.
2. Implementar ajustes en componentes TS/HTML de los tres modales.
3. Ejecutar pruebas unitarias de frontend y smoke manual de flujos de novedades.
4. Desplegar frontend sin cambios de backend.

Rollback:
- Revertir commit del frontend; no hay cambios de datos ni migraciones.

## Open Questions

- Confirmar texto final del CTA en Pronto Pago cuando ejecuta directamente: "Guardar Pronto Pago" vs "Aplicar Pronto Pago".
- Confirmar si la fecha por defecto en novedades debe ser hoy local o la del ultimo movimiento del prestamo.
