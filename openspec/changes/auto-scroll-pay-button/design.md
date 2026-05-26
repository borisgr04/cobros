## Context

En el flujo de registro de pago, después de confirmar el abono se renderiza la acción de envío por WhatsApp, pero en pantallas móviles queda por debajo del viewport inicial. Esto obliga al usuario a hacer scroll manual para completar la acción siguiente del flujo.

## Goals / Non-Goals

**Goals:**
- Mostrar automáticamente en pantalla la zona de acciones posterior al pago cuando se complete el registro.
- Priorizar la visibilidad del botón de WhatsApp sin depender del tamaño de pantalla.
- Evitar comportamientos bruscos cuando la acción ya está visible.

**Non-Goals:**
- Cambiar textos, estilos o ubicación funcional del botón de WhatsApp.
- Modificar reglas de negocio del registro de pago o integración con backend.
- Alterar otros flujos distintos al post-registro de pago.

## Decisions

- Detectar el momento en que el pago fue registrado exitosamente y, en ese estado, disparar desplazamiento automático hacia el contenedor de acciones finales.
- Usar scroll programático sobre el contenedor objetivo (o fallback al documento) con comportamiento suave para mejorar percepción en móvil.
- Condicionar el desplazamiento para ejecutar solo cuando el elemento objetivo no esté actualmente visible en viewport.
- Mantener el disparo acotado al flujo de pago para no impactar otras pantallas o estados.

## Risks / Trade-offs

- [Disparo antes de que el DOM termine de renderizar] → Mitigación: ejecutar el scroll después de confirmar render del bloque de acciones.
- [Saltos visuales en dispositivos rápidos/lentos] → Mitigación: validar visibilidad previa y aplicar scroll suave.
- [Regresiones en UX de escritorio] → Mitigación: mantener condición de no desplazar si el botón ya está visible.
