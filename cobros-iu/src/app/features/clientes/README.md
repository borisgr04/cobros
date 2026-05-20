# Componente de Gestión de Clientes

Este componente proporciona una interfaz CRUD completa para gestionar clientes en el sistema de préstamos.

## 📁 Estructura

```
src/app/features/clientes/
├── components/
│   ├── clientes.component.ts       # Lógica del componente
│   ├── clientes.component.html     # Template HTML con Bootstrap
│   └── clientes.component.scss     # Estilos personalizados
└── services/
    └── cliente-mock.service.ts     # Servicio mock con datos en memoria
```

## ✨ Características

### Funcionalidades CRUD
- ✅ **Crear** - Formulario para agregar nuevos clientes
- ✅ **Leer** - Tabla responsive con lista de clientes
- ✅ **Actualizar** - Edición de clientes existentes
- ✅ **Eliminar** - Eliminación con confirmación

### Características adicionales
- 🔍 **Búsqueda en tiempo real** - Filtrado por nombre, identificación, alias o teléfono
- 🎨 **UI moderna con Bootstrap 5.3.3** - Diseño responsive y accesible
- 🔄 **Estados de carga** - Indicadores visuales durante operaciones
- ✉️ **Notificaciones** - Mensajes de éxito/error temporales
- 📱 **Responsive** - Adaptado para móviles, tablets y desktop
- 🎯 **Signals de Angular** - Gestión reactiva del estado

## 🎨 Diseño

El componente usa:
- **Bootstrap 5.3.3** para el framework CSS
- **Bootstrap Icons 1.11.3** para iconografía
- **Signals** de Angular para reactividad
- **Standalone component** sin módulos

## 🔧 Mock Backend

El servicio `ClienteMockService` simula un backend con:
- 5 clientes de ejemplo precargados
- Delay de 500ms para simular latencia de red
- Persistencia en memoria durante la sesión
- Operaciones CRUD completas

### Datos de ejemplo

```typescript
{
  id: '1',
  nombre: 'Juan Pérez García',
  alias: 'Juanito',
  identificacion: '12345678',
  direccion: 'Calle Principal #123, Centro',
  zonaId: 'zona-1',
  telefono: '555-0101',
  cuentaBancaria: '1234567890',
  estado: 'activo'
}
```

## 🚀 Uso

### Acceso directo
```
http://localhost:4200/clientes
```

### Importación en otros componentes
```typescript
import { ClientesComponent } from './features/clientes/components/clientes.component';
```

## 🔄 Flujo de trabajo

1. **Carga inicial**: Se cargan todos los clientes al inicializar el componente
2. **Búsqueda**: El filtro se aplica reactivamente conforme se escribe
3. **Crear/Editar**: Se abre el formulario en la parte superior de la tabla
4. **Guardar**: Valida campos requeridos antes de enviar
5. **Eliminar**: Solicita confirmación antes de proceder
6. **Notificaciones**: Muestra mensajes por 4 segundos

## 📋 Campos del formulario

### Obligatorios (*)
- Nombre completo
- Identificación
- Zona

### Opcionales
- Alias
- Dirección
- Teléfono
- Cuenta bancaria
- Llave
- Estado (activo/inactivo)

## 🎯 Próximos pasos

Para integrar con un backend real:

1. Reemplazar `ClienteMockService` por `ClienteService` en el constructor
2. Configurar la URL base del API en `environment.ts`
3. Agregar interceptores HTTP para manejo de errores
4. Implementar paginación para grandes volúmenes de datos
5. Agregar validaciones más complejas (ej: DNI válido)

## 💡 Notas técnicas

- Usa `signal()` para gestión de estado reactiva
- FormsModule para template-driven forms
- CommonModule para directivas estructurales (@if, @for)
- Standalone component (no requiere NgModule)
