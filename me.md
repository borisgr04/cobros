Para alguien que se le dificulta aprender tecnología, el criterio es uno: **que el estado seleccionado sea imposible de ignorar**, y que no haya ambigüedad sobre si "tocó" algo o no.

---

## La B gana, con una razón extra

```
OPCIÓN B — Segmented control
┌────────────────────────────────────┐
│  Diario │ Semanal │ Quince │ Mensual│
│  ██████ │         │        │        │  ← seleccionado es obvio
└────────────────────────────────────┘
```

**Por qué B para este usuario:**

- Es el mismo patrón que usa WhatsApp para "Solo texto / Con foto" — lo conoce aunque no lo sabe nombrar
- Es una **unidad visual completa**: el usuario ve de una sola mirada que hay 4 opciones y cuál está activa
- El fondo sólido en el seleccionado es la señal más fuerte posible de "esto está elegido"
- No requiere scroll, no requiere dos filas

---

## Un ajuste más: los labels

Para este usuario, "Quincenal" puede ser una palabra desconocida:

```
ACTUAL              PROPUESTO
────────────────    ──────────────────
Diario         →    Diario
Semanal        →    Semanal
Quincenal      →    Cada 15 días
Mensual        →    Mensual
```

"Cada 15 días" no necesita ser aprendido — se entiende solo.

---

## ¿Actualizamos el design.md con estas dos decisiones?

- Frecuencia → segmented control (siempre 1 fila)
- Label "Quincenal" → "Cada 15 días"