# Informe: Funcionalidades Pendientes del Sistema

**Sistema de Gestión de Cobros y Préstamos - CobrosV2**  
**Fecha:** Octubre 17, 2025  
**Versión del Sistema:** 1.0.0  
**Framework:** Angular 19.2.17

---

## 📊 Resumen Ejecutivo

El sistema de gestión de cobros y préstamos ha alcanzado un **62% de completitud funcional** con las siguientes características implementadas:

### ✅ **Módulos Completados:**
- Gestión completa de clientes (CRUD)
- Vista de lista de préstamos con filtros avanzados
- Vista de detalle de préstamo con tabs (Info, Pagos, Proyección)
- Registro de pagos con 3 modalidades
- Registro de nuevos préstamos
- Edición de préstamos (sin pagos)
- Proyección de pagos en tabla
- Cálculos automáticos y validaciones
- **Dashboard completo con KPIs, alertas y acciones rápidas**
- **Navegación al dashboard desde Préstamos y Clientes**

### ❌ **Módulos Pendientes:** 16 funcionalidades

**✅ Prompts Disponibles:**
- `.copilot/prompts/eliminar-prestamo.md` - Funcionalidad de eliminar préstamo con validaciones
- `.copilot/prompts/gestion-zonas.md` - Módulo completo de gestión de zonas geográficas

---

## 🔴 PRIORIDAD CRÍTICA (Sprint 1)

### 1. Eliminar Préstamo 🗑️

**Estado:** Botón visible pero sin funcionalidad  
**Complejidad:** Media  
**Tiempo Estimado:** 4-6 horas  
**Impacto:** Alto

**Descripción:**
Implementar funcionalidad completa para eliminar préstamos del sistema con validaciones estrictas y confirmación reforzada.

**Requisitos Técnicos:**
- ✅ Método `deletePrestamo()` existe en `PrestamoMockService`
- ❌ Crear componente modal de confirmación
- ❌ Implementar validación: solo eliminar si NO tiene pagos
- ❌ Agregar campo de confirmación (usuario debe escribir ID)
- ❌ Conectar con botón en vista de detalle
- ❌ Implementar redirección a lista después de eliminar

**Archivos a Crear:**
1. `confirmacion-eliminar-prestamo-modal.component.ts`
2. `confirmacion-eliminar-prestamo-modal.component.html`
3. `confirmacion-eliminar-prestamo-modal.component.scss`

**Archivos a Modificar:**
1. `prestamo-detalle.component.ts`
2. `prestamo-detalle.component.html`

**Validaciones:**
- Botón deshabilitado si `getTotalPagos() > 0`
- Tooltip explicativo en botón deshabilitado
- Modal de confirmación con advertencia crítica
- Campo de confirmación: usuario escribe ID del préstamo
- Botón "Eliminar" solo habilitado si ID coincide
- Servicio valida pagos antes de eliminar (doble validación)

**Casos de Uso:**
1. Eliminar préstamo sin pagos: ✅ Exitoso
2. Intentar eliminar con pagos: ❌ Botón deshabilitado
3. ID incorrecto en confirmación: ❌ Error visible
4. Cancelar eliminación: ✅ Modal se cierra

**Prompt Disponible:** `.copilot/prompts/eliminar-prestamo.md` ✅  
**Botón Dashboard:** ✅ Agregado en Préstamos y Clientes

---

### 2. Gestión de Zonas 🗺️

**Estado:** No existe  
**Complejidad:** Media-Alta  
**Tiempo Estimado:** 8-12 horas  
**Impacto:** Alto

**Descripción:**
Crear módulo completo para gestionar zonas geográficas donde se organizan los clientes.

**Requisitos Técnicos:**
- ✅ Modelo `IZona` existe en `core/models`
- ✅ Servicio `ZonaService` existe
- ✅ Servicio mock `ZonaMockService` existe con datos de ejemplo
- ❌ Crear componente de lista de zonas
- ❌ Crear formulario de creación/edición (modal)
- ❌ Implementar CRUD completo
- ❌ Agregar contador de clientes por zona
- ❌ Implementar activar/desactivar zona
- ❌ Agregar navegación desde zona a clientes filtrados

**Estructura Esperada:**
```
src/app/features/zonas/
  components/
    zonas.component.ts
    zonas.component.html
    zonas.component.scss
    zona-modal/
      zona-modal.component.ts
      zona-modal.component.html
      zona-modal.component.scss
  services/
    (ya existen)
```

**Funcionalidades:**
1. **Vista de Lista:**
   - Grid/tabla de zonas
   - Badge de estado (activo/inactivo)
   - Contador de clientes por zona
   - Botón "Nueva Zona"
   - Búsqueda en tiempo real

2. **Modal de Formulario:**
   - Campos: Nombre*, Estado
   - Validación de nombre único
   - Modos: Crear / Editar

3. **Operaciones:**
   - Crear zona
   - Editar zona
   - Activar/Desactivar zona
   - Ver clientes de la zona (navegación)

**Diseño:**
- Cards similares a clientes
- Colores: Verde (activo), Gris (inactivo)
- Iconos: `bi-geo-alt` para zonas

**Ruta:** `/zonas`

**Menú:** Agregar item "Zonas" en navegación principal

**Prompt Disponible:** `.copilot/prompts/gestion-zonas.md` ✅

---

### 3. Dashboard / Home 📊

**Estado:** No existe  
**Complejidad:** Alta  
**Tiempo Estimado:** 12-16 horas  
**Impacto:** Muy Alto

**Descripción:**
Crear página principal con KPIs, estadísticas y resumen del negocio.

**Requisitos Técnicos:**
- ❌ Crear componente Dashboard
- ❌ Implementar cálculos de estadísticas
- ❌ Agregar widgets de KPIs
- ❌ Implementar lista de alertas
- ❌ Agregar accesos rápidos

**Estructura Esperada:**
```
src/app/features/dashboard/
  components/
    dashboard.component.ts
    dashboard.component.html
    dashboard.component.scss
  widgets/
    kpi-card.component.ts
    alerta-card.component.ts
    quick-action-card.component.ts
```

**KPIs Principales:**
1. **Métricas Financieras:**
   - Total Prestado (suma de todos los préstamos activos)
   - Total a Cobrar (suma de valores totales)
   - Total Cobrado (suma de todos los pagos)
   - Pendiente por Cobrar (Total a Cobrar - Total Cobrado)
   - Interés Proyectado Total
   - Tasa de Cobro (% cobrado vs proyectado)

2. **Métricas Operativas:**
   - Total de Préstamos Activos
   - Total de Préstamos Completados
   - Total de Préstamos Vencidos
   - Total de Clientes Activos
   - Préstamos Creados Hoy
   - Pagos Registrados Hoy

3. **Métricas de Riesgo:**
   - Clientes con Mora (>5 días)
   - Préstamos en Riesgo
   - Porcentaje de Mora
   - Pérdida Proyectada

**Secciones del Dashboard:**

1. **Header con KPIs (4 cards):**
   ```
   [💰 Total Prestado]  [📈 Por Cobrar]  [✅ Cobrado]  [⏰ Pendiente]
   ```

2. **Alertas y Recordatorios:**
   - Préstamos que vencen hoy (badge rojo con contador)
   - Préstamos que vencen esta semana
   - Clientes con mora (>5 días)
   - Nuevos clientes registrados

3. **Accesos Rápidos:**
   - Botón: "Nuevo Préstamo"
   - Botón: "Registrar Pago"
   - Botón: "Nuevo Cliente"
   - Botón: "Ver Clientes con Mora"

4. **Resumen por Zona:**
   - Tabla con zonas
   - Total prestado por zona
   - Total cobrado por zona
   - % completitud

5. **Últimas Actividades:**
   - Últimos 5 préstamos creados
   - Últimos 5 pagos registrados
   - Link para ver todo

**Diseño:**
- Layout de dashboard moderno
- Cards con gradientes
- Gráficos simples (sin librerías por ahora)
- Colores: Verde (positivo), Rojo (alertas), Azul (info)

**Ruta:** `/` (home) o `/dashboard`

**Prioridad:** Muy alta - Es la primera vista que ven los usuarios

---

## 🟡 PRIORIDAD MEDIA (Sprint 2-3)

### 4. Imprimir Recibos/Reportes 🖨️

**Estado:** Botón visible sin funcionalidad  
**Complejidad:** Media-Alta  
**Tiempo Estimado:** 10-14 horas  
**Impacto:** Alto

**Descripción:**
Generar documentos PDF para contratos, recibos y reportes.

**Requisitos:**
- ❌ Integrar librería de PDF (jsPDF o pdfMake)
- ❌ Crear plantillas de documentos
- ❌ Implementar generación de PDFs
- ❌ Agregar opciones de descarga/impresión

**Documentos a Implementar:**

1. **Contrato de Préstamo:**
   - Logo del negocio (configurable)
   - Datos del cliente (nombre, identificación, dirección)
   - Datos del préstamo (ID, fecha, monto, interés, cuotas)
   - Tabla de plan de pagos proyectado
   - Términos y condiciones
   - Firmas (cliente y prestamista)
   - Fecha de impresión

2. **Recibo de Pago:**
   - Número de recibo
   - Datos del cliente
   - ID del préstamo
   - Monto del pago
   - Fecha del pago
   - Saldo pendiente
   - Próxima cuota
   - Firma del cobrador

3. **Reporte de Cuenta del Cliente:**
   - Resumen del cliente
   - Lista de préstamos (activos y completados)
   - Total prestado histórico
   - Total pagado
   - Saldo pendiente
   - Historial de pagos

4. **Reporte de Cartera:**
   - Fecha del reporte
   - Lista de todos los préstamos activos
   - Total por cobrar
   - Total en mora
   - Desglose por zona
   - Resumen ejecutivo

**Tecnologías Sugeridas:**
- **jsPDF:** Más simple, para documentos básicos
- **pdfMake:** Más potente, para documentos complejos
- **html2canvas:** Para convertir HTML a imagen y luego PDF

**Ubicación Botones:**
- Vista de detalle de préstamo: "Imprimir Contrato", "Imprimir Plan de Pagos"
- Modal de registro de pago: "Imprimir Recibo"
- Vista de cliente: "Imprimir Reporte de Cuenta"
- Dashboard: "Generar Reporte de Cartera"

---

### 5. Eliminar Pago ❌💰

**Estado:** No implementado  
**Complejidad:** Media  
**Tiempo Estimado:** 4-6 horas  
**Impacto:** Medio-Alto

**Descripción:**
Permitir eliminar pagos registrados por error.

**Requisitos:**
- ✅ Método `deletePago()` existe en `PrestamoMockService`
- ❌ Agregar botón/icono de eliminar en cada pago
- ❌ Modal de confirmación
- ❌ Recalcular proyección después de eliminar
- ❌ Actualizar estadísticas del préstamo

**Diseño:**
- Icono de papelera (🗑️) en cada fila de pago
- Modal simple: "¿Eliminar pago de $50,000?"
- Advertencia si es el último pago vs pago intermedio

**Validaciones:**
- Confirmación obligatoria
- ¿Permitir eliminar solo el último pago? (decisión de negocio)
- ¿Permitir eliminar cualquier pago? (más flexible pero complejo)

**Recalculos Necesarios:**
- Total pagado
- Cuotas pagadas
- Estado del préstamo (si estaba completado, volver a activo)
- Proyección de cuotas pendientes

---

### 6. Editar Pago ✏️💰

**Estado:** No implementado  
**Complejidad:** Media  
**Tiempo Estimado:** 6-8 horas  
**Impacto:** Medio

**Descripción:**
Permitir corregir datos de pagos registrados.

**Requisitos:**
- ❌ Agregar método `updatePago()` en `PrestamoMockService`
- ❌ Modal de edición de pago
- ❌ Validaciones de datos
- ❌ Recalcular estadísticas

**Campos Editables:**
- Monto del pago (validar que sea > 0)
- Fecha del pago (validar que esté en rango válido)

**Modal de Edición:**
- Similar a registro de pago
- Pre-cargar datos actuales
- Botón "Guardar Cambios"

**Validaciones:**
- Fecha no puede ser anterior a fecha de préstamo
- Fecha no puede ser futura
- Monto debe ser > 0
- Advertencia si el nuevo monto afecta el estado

---

### 7. Búsqueda y Filtros Avanzados 🔍

**Estado:** Filtros básicos implementados  
**Complejidad:** Media  
**Tiempo Estimado:** 6-8 horas  
**Impacto:** Medio-Alto

**Descripción:**
Mejorar capacidades de búsqueda y filtrado en la lista de préstamos.

**Filtros Actuales:**
- ✅ Por estado (todos, activo, vencido, completado)
- ✅ Por cliente (dropdown)
- ✅ Por zona (dropdown)

**Filtros a Agregar:**

1. **Rango de Fechas:**
   - Fecha de creación (desde - hasta)
   - Fecha de vencimiento (desde - hasta)
   - Componente: Date picker doble

2. **Rango de Montos:**
   - Valor prestado (min - max)
   - Valor total (min - max)
   - Componente: Input numérico doble

3. **Frecuencia de Pago:**
   - Diario
   - Semanal
   - Quincenal
   - Mensual
   - Componente: Checkbox múltiple

4. **Búsqueda por ID:**
   - Input para escribir ID completo o parcial
   - Búsqueda exacta o por coincidencia

5. **Ordenamiento:**
   - Por fecha (más reciente / más antiguo)
   - Por monto (mayor / menor)
   - Por estado
   - Por cliente (alfabético)

**UI/UX:**
- Panel de filtros colapsable
- Chip para cada filtro activo
- Botón "Limpiar filtros"
- Contador: "Mostrando 5 de 50 préstamos"

---

### 8. Notificaciones y Alertas 🔔

**Estado:** No implementado  
**Complejidad:** Media-Alta  
**Tiempo Estimado:** 8-12 horas  
**Impacto:** Alto

**Descripción:**
Sistema de notificaciones para recordatorios y alertas.

**Tipos de Notificaciones:**

1. **Préstamos Vencidos:**
   - Préstamos con fecha final < hoy
   - Badge rojo en icono de campana
   - Listado en panel lateral

2. **Cobros Pendientes Hoy:**
   - Cuotas proyectadas para hoy
   - Recordatorio al iniciar sesión

3. **Préstamos por Vencer:**
   - Préstamos que vencen en 7 días
   - Notificación temprana

4. **Clientes con Mora:**
   - Pagos atrasados >5 días
   - Listado priorizado

**Componentes:**
1. **Icono de Campana en Header:**
   - Badge con contador de alertas
   - Click abre panel lateral

2. **Panel Lateral de Notificaciones:**
   - Lista de alertas
   - Clasificadas por tipo
   - Click navega a detalle
   - Opción para marcar como visto

3. **Banner de Alertas en Dashboard:**
   - Alertas críticas en la parte superior
   - Colores diferenciados por severidad

**Persistencia:**
- Guardar estado de "visto/no visto"
- LocalStorage o backend

---

## 🟢 PRIORIDAD BAJA (Sprint 4+)

### 9. Historial de Cambios / Auditoría 📜

**Tiempo Estimado:** 10-14 horas  
**Impacto:** Medio (seguridad y trazabilidad)

**Descripción:**
Registro completo de todas las operaciones del sistema.

**Información a Registrar:**
- Entidad afectada (cliente, préstamo, pago, zona)
- Tipo de operación (crear, editar, eliminar)
- Usuario que ejecutó (cuando haya login)
- Timestamp
- Datos anteriores y nuevos (para ediciones)
- IP del cliente (opcional)

**Modelo:**
```typescript
interface IAuditLog {
  id: string;
  entidad: 'cliente' | 'prestamo' | 'pago' | 'zona';
  entidadId: string;
  operacion: 'crear' | 'editar' | 'eliminar';
  usuario: string;
  timestamp: Date;
  datosAnteriores?: any;
  datosNuevos?: any;
  ip?: string;
}
```

**Vista:**
- Tabla de historial por entidad
- Filtros por fecha, usuario, operación
- Detalles expandibles

---

### 10. Exportar Datos 📤

**Tiempo Estimado:** 8-10 horas  
**Impacto:** Medio

**Descripción:**
Exportar datos a Excel para análisis externo.

**Formatos:**
- Excel (.xlsx)
- CSV
- JSON (para desarrolladores)

**Datos Exportables:**
1. Clientes (todos o filtrados)
2. Préstamos (todos o filtrados)
3. Pagos (todos o por préstamo)
4. Zonas
5. Reportes personalizados

**Librería Sugerida:**
- **xlsx** o **ExcelJS**

**Ubicación:**
- Botón "Exportar a Excel" en cada vista de lista
- Modal para seleccionar columnas
- Progreso de exportación

---

### 11. Gestión de Usuarios y Roles 👥

**Tiempo Estimado:** 20-30 horas  
**Impacto:** Alto (seguridad)

**Descripción:**
Sistema de autenticación y autorización.

**Roles:**
1. **Administrador:**
   - Acceso total
   - Gestión de usuarios
   - Configuración del sistema

2. **Cobrador:**
   - Ver préstamos
   - Registrar pagos
   - Ver clientes
   - NO puede editar/eliminar

3. **Visor:**
   - Solo lectura
   - Reportes
   - NO puede crear/editar/eliminar

**Funcionalidades:**
- Login / Logout
- Registro de usuarios
- Asignación de roles
- Permisos granulares
- Sesiones con tokens (JWT)
- Recuperación de contraseña

**Pantallas:**
- Login
- Gestión de usuarios (admin)
- Perfil de usuario
- Cambio de contraseña

---

### 12. Configuración del Sistema ⚙️

**Tiempo Estimado:** 6-8 horas  
**Impacto:** Medio

**Descripción:**
Panel de configuración para personalizar el sistema.

**Configuraciones:**

1. **Negocio:**
   - Nombre del negocio
   - Logo
   - Información de contacto
   - NIT / RUT

2. **Préstamos:**
   - Tasa de interés por defecto
   - Frecuencias disponibles
   - Límite de días para editar
   - Días para considerar mora

3. **Notificaciones:**
   - Habilitar/deshabilitar alertas
   - Días de anticipación para vencimientos
   - Días para definir mora

4. **Apariencia:**
   - Tema claro / oscuro
   - Colores principales
   - Densidad de información

5. **Backups:**
   - Frecuencia de backups automáticos
   - Ubicación de backups

**Storage:**
- LocalStorage (para configuración local)
- Backend (para configuración compartida)

---

### 13-18. Otras Funcionalidades

**13. Calculadora de Préstamos:** Simular préstamos antes de crear (6-8h)  
**14. Paginación en Listas:** Performance con muchos registros (4-6h)  
**15. Gráficos y Estadísticas:** Visualización con Chart.js (10-12h)  
**16. Backup y Restauración:** Seguridad de datos (8-10h)  
**17. Modo Offline:** Service Worker y cache (12-16h)  
**18. Recordatorios y Calendario:** Organización de cobros (10-14h)

---

## 📊 Estadísticas del Proyecto

### Estado Actual:
- **Funcionalidades Completadas:** 10 (Dashboard + Navegación)
- **Funcionalidades Pendientes:** 16
- **Completitud:** 62%
- **Prompts Documentados:** 2 (Eliminar Préstamo, Gestión de Zonas)
- **Líneas de Código:** ~17,000 (estimado)
- **Componentes:** 10 (Dashboard + Modales)
- **Servicios:** 7 (Dashboard Service agregado)
- **Modelos:** 5

### Esfuerzo Estimado:
- **Sprint 1 (Crítico):** 12-18 horas (Eliminar + Zonas - Dashboard completado ✅)
- **Sprint 2-3 (Medio):** 44-58 horas
- **Sprint 4+ (Bajo):** 100-130 horas
- **Total Estimado:** 156-206 horas (19-26 días laborales)

---

## 🎯 Roadmap Recomendado

### **Fase 1: Funcionalidad Básica Completa (1-2 semanas)**
1. ✅ Dashboard con KPIs - **COMPLETADO**
2. ⏳ Eliminar Préstamo (Prompt disponible)
3. ⏳ Gestión de Zonas (Prompt disponible)
4. ⏸️ Imprimir Documentos Básicos

**Resultado:** Sistema funcional para uso diario

### **Fase 2: Mejoras Operativas (2-3 semanas)**
5. ✅ Editar/Eliminar Pagos
6. ✅ Filtros Avanzados
7. ✅ Notificaciones
8. ✅ Exportar a Excel

**Resultado:** Sistema optimizado para operación eficiente

### **Fase 3: Seguridad y Escalabilidad (3-4 semanas)**
9. ✅ Usuarios y Roles
10. ✅ Auditoría
11. ✅ Configuración
12. ✅ Paginación

**Resultado:** Sistema seguro y escalable

### **Fase 4: Características Avanzadas (4-5 semanas)**
13. ✅ Gráficos
14. ✅ Calculadora
15. ✅ Backup/Restore
16. ✅ Modo Offline
17. ✅ Calendario
18. ✅ Reportes Avanzados

**Resultado:** Sistema completo y profesional

---

## 💡 Recomendaciones

### Prioridad Inmediata:
1. **Implementar eliminación de préstamo** - Prompt listo en `.copilot/prompts/eliminar-prestamo.md`
2. **Crear módulo de Zonas** - Prompt listo en `.copilot/prompts/gestion-zonas.md`
3. **Imprimir documentos básicos** - Contratos y recibos

### Mejoras Recientes Implementadas:
- ✅ Dashboard completo con KPIs y alertas
- ✅ Navegación al dashboard desde Préstamos y Clientes
- ✅ Iconos consistentes (Bootstrap Icons)
- ✅ Diseño mobile-first responsivo
- ✅ Tarjetas clickeables en dashboard

### Decisiones de Negocio Requeridas:
- ¿Permitir eliminar cualquier pago o solo el último?
- ¿Cuántos días considerar para "mora"?
- ¿Qué permisos debe tener cada rol de usuario?
- ¿Se requiere integración con backend real?
- ¿Se necesita envío de notificaciones por SMS/Email?

### Riesgos Identificados:
- Sin dashboard, difícil tener visibilidad del negocio
- Sin eliminación de préstamos, datos de prueba se acumulan
- Sin zonas, difícil organizar clientes
- Sin roles, cualquiera puede hacer cualquier cosa

---

## 📝 Conclusiones

El sistema ha avanzado significativamente con las funcionalidades core implementadas. Las **3 funcionalidades críticas** pendientes (Eliminar, Zonas, Dashboard) son esenciales para considerar el sistema "completo" para uso básico.

Las funcionalidades de **prioridad media** agregarán eficiencia operativa, mientras que las de **baja prioridad** son características avanzadas para profesionalizar el sistema.

**Próximo Paso Recomendado:** Implementar la funcionalidad de **Eliminar Préstamo** usando el prompt ya creado en `.copilot/prompts/eliminar-prestamo.md`

---

**Documento generado por:** GitHub Copilot  
**Última actualización:** Octubre 17, 2025  
**Versión:** 1.0
