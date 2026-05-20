# Sistema de Gestión de Cobros - CobrosV2

Sistema moderno de gestión de cobros y préstamos desarrollado con Angular 19 y Bootstrap 5.

## 🚀 Características

- **Arquitectura Moderna**: Angular 19 con Standalone Components y Signals
- **Diseño Mobile-First**: Interfaz totalmente responsive optimizada para dispositivos móviles
- **UI Moderna**: Bootstrap 5.3.3 con diseño personalizado y gradientes
- **Gestión de Clientes**: CRUD completo con búsqueda y filtros
- **TypeScript Estricto**: Tipado completo para mayor seguridad
- **Mock Backend**: Simulación de API REST para desarrollo

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm (v9 o superior)

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd cobrosv2

# Instalar dependencias
npm install
```

## 🏃‍♂️ Ejecución

```bash
# Servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── features/
│   │   ├── core/
│   │   │   ├── models/          # Modelos de dominio (TypeScript interfaces)
│   │   │   │   ├── cliente.model.ts
│   │   │   │   ├── zona.model.ts
│   │   │   │   ├── prestamo.model.ts
│   │   │   │   ├── pago.model.ts
│   │   │   │   └── types.ts     # Tipos compartidos (Estado, FrecuenciaPago)
│   │   │   └── services/        # Servicios de API REST
│   │   │       ├── base.service.ts
│   │   │       ├── cliente.service.ts
│   │   │       ├── zona.service.ts
│   │   │       ├── prestamo.service.ts
│   │   │       └── pago.service.ts
│   │   └── clientes/
│   │       ├── components/      # Componente de gestión de clientes
│   │       │   ├── clientes.component.ts
│   │       │   ├── clientes.component.html
│   │       │   └── clientes.component.scss
│   │       └── services/
│   │           └── cliente-mock.service.ts  # Mock backend
│   ├── app.component.*
│   ├── app.config.ts
│   └── app.routes.ts
├── index.html
├── main.ts
└── styles.scss
```

## 🎨 Diseño Mobile-First

### Breakpoints Responsivos

```scss
- Mobile: < 640px (1 columna)
- Tablet: 640px - 1024px (2-3 columnas)
- Desktop: > 1024px (4 columnas)
```

### Características del Diseño

- **Cards Modernas**: Con sombras, bordes redondeados y efectos hover
- **Gradientes**: Botones y elementos con gradientes suaves
- **Animaciones**: Transiciones suaves en todas las interacciones
- **Iconos**: Bootstrap Icons integrados
- **Modal Forms**: Formularios en overlay con backdrop
- **Search Bar**: Búsqueda en tiempo real con indicador visual

## 📦 Modelos de Dominio

### ICliente
```typescript
interface ICliente {
  id: string;
  nombre: string;
  alias?: string;
  identificacion: string;
  direccion?: string;
  zonaId: string;
  telefono?: string;
  cuentaBancaria?: string;
  llave?: string;
  estado?: Estado; // 'activo' | 'inactivo'
}
```

### IZona
```typescript
interface IZona {
  id: string;
  nombre: string;
  estado: Estado;
}
```

### IPrestamo
```typescript
interface IPrestamo {
  id: string;
  clienteId: string;
  fechaPrestamo: string;
  fechaFinal: string;
  valorPrestado: number;
  valorTotal: number;
  interesProyectado: number;
  frecuenciaPago: FrecuenciaPago; // 'diario' | 'semanal' | 'quincenal' | 'mensual'
}
```

### IPago
```typescript
interface IPago {
  id: string;
  prestamoId: string;
  valor: number;
  fechaPago: string;
}
```

## 🔧 Servicios

### BaseService<T>
Servicio base genérico con operaciones CRUD:
- `getAll(): Observable<T[]>`
- `getById(id: string): Observable<T>`
- `create(entity: T): Observable<T>`
- `update(id: string, entity: T): Observable<T>`
- `delete(id: string): Observable<void>`

### ClienteService
Extiende BaseService y agrega:
- `getByZona(zonaId: string): Observable<ICliente[]>`

### PrestamoService
Extiende BaseService y agrega:
- `getByCliente(clienteId: string): Observable<IPrestamo[]>`
- `getActivos(): Observable<IPrestamo[]>`
- `calcularCuotas(prestamo: IPrestamo): number`

### PagoService
Extiende BaseService y agrega:
- `getByPrestamo(prestamoId: string): Observable<IPago[]>`
- `getTotalByPrestamo(prestamoId: string): Observable<number>`

## 💾 Mock Backend

El `ClienteMockService` simula un backend REST con:
- Almacenamiento en memoria
- Delay de 500ms para simular latencia
- 5 clientes de ejemplo pre-cargados
- Auto-incremento de IDs

## 🎯 Características del Componente de Clientes

### Vista Principal
- **Header con Stats**: Total de clientes y clientes activos
- **Barra de Búsqueda**: Filtrado en tiempo real por nombre, identificación, alias o teléfono
- **Grid de Cards**: Vista responsive con información del cliente
- **Badges**: Estados y zonas con colores distintivos

### Formulario (Modal)
- **Campos**: Nombre*, Alias, Identificación*, Zona*, Dirección, Teléfono, Cuenta Bancaria, Llave, Estado
- **Validación**: Campos obligatorios marcados con *
- **Modos**: Crear nuevo / Editar existente
- **Estados**: Activo / Inactivo

### Operaciones
- ✅ Crear cliente
- ✅ Editar cliente
- ✅ Eliminar cliente (con confirmación)
- ✅ Búsqueda en tiempo real
- ✅ Mensajes de éxito/error

## 🎨 Paleta de Colores

```scss
--primary-color: #6366f1 (Indigo)
--primary-hover: #4f46e5
--danger-color: #ef4444 (Red)
--danger-hover: #dc2626
--success-color: #10b981 (Green)
--text-color: #1f2937 (Gray 800)
--text-light: #6b7280 (Gray 500)
--bg-color: #f9fafb (Gray 50)
--card-bg: #ffffff
--border-color: #e5e7eb
```

## 📱 Componentes Visuales

### Cards de Cliente
- Avatar con icono de usuario
- Nombre y alias
- Badges de estado y zona
- Información de contacto (identificación, teléfono, dirección)
- Botones de acción (Editar, Eliminar)

### Animaciones
- `fadeIn`: Aparición suave de elementos
- `slideDown`: Deslizamiento desde arriba
- `slideUp`: Deslizamiento hacia arriba
- `spin`: Rotación para loading spinner

## 🔜 Próximas Funcionalidades

- [ ] Componente de Zonas
- [ ] Componente de Préstamos
- [ ] Componente de Pagos
- [ ] Dashboard con estadísticas
- [ ] Integración con backend real
- [ ] Paginación y ordenamiento
- [ ] Exportación a Excel/PDF
- [ ] Gráficos y reportes

## 🛠️ Tecnologías Utilizadas

- **Angular** 19.2.17
- **TypeScript** 5.7+
- **Bootstrap** 5.3.3
- **Bootstrap Icons** 1.11.3
- **RxJS** 7.8+
- **Vite** (Dev Server)
- **SCSS** para estilos

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👨‍💻 Desarrollo

### Scripts Disponibles

```bash
npm start          # Servidor de desarrollo
npm test           # Ejecutar tests
npm run build      # Build de producción
npm run watch      # Build en modo watch
```

### Convenciones de Código

- **Componentes**: PascalCase
- **Servicios**: PascalCase + Service
- **Interfaces**: PascalCase con prefijo I
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Archivos**: kebab-case

## 📞 Contacto

Para más información sobre el proyecto, contactar al equipo de desarrollo.

