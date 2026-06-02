## Context

Tres correcciones de UX menores detectadas en uso real. No hay cambios en el backend ni en la API. El patrón de notificación WhatsApp (computed signal `whatsappLink` + botón `btn-whatsapp` en pantalla de éxito) ya existe implementado en `registro-pago-modal` y `registro-prestamo-modal`; solo se replica en `pronto-pago-modal`.

## Goals / Non-Goals

**Goals:**
- La card de zona navega a `/clientes?zona=X` al hacer click.
- El botón "Ver Clientes" dentro de la card se elimina (redundante).
- El input de valor negociado en pronto pago usa el mismo wrapper visual que registro pago.
- Al completar un pronto pago aparece el botón "Notificar por WhatsApp" si el cliente tiene teléfono.

**Non-Goals:**
- No se modifica el backend.
- No se cambia el comportamiento de los botones de editar/eliminar zona.
- No se crea un servicio genérico de notificaciones.

## Decisions

**Reutilizar patrón WhatsApp sin abstraer**  
No se crea un componente ni servicio compartido. La lógica del computed `whatsappLink` se copia directamente en `pronto-pago-modal.component.ts`, igual que ocurre en los dos modales existentes. Alternativa descartada: componente `<app-whatsapp-btn>` — sobreingeniería para 3 ocurrencias con contextos distintos.

**Zona card: click principal → clientes**  
El comportamiento semántico principal de una zona es gestionar sus clientes, no ver sus préstamos. El acceso a préstamos por zona se puede obtener desde la vista de clientes (filtrado). Alternativa descartada: mantener dos botones (uno para clientes, otro para préstamos) — genera confusión sobre cuál es la acción primaria.

## Risks / Trade-offs

- [Zona ya no navega directo a préstamos desde la card] → Los préstamos de una zona se alcanzan desde `/clientes?zona=X` → click en cliente → sus préstamos. Camino ligeramente más largo para ese flujo.
