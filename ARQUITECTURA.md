# Guía de Arquitectura Angular - Basada en MaxiDancer (React)

## 📋 Resumen de la Migración

Se ha replicado la arquitectura del proyecto React (MaxiDancer) en Angular con la siguiente estructura:

```
src/app/
├── core/                          # Servicios y guards globales
│   ├── services/
│   │   ├── supabase-client.service.ts  # Cliente Supabase
│   │   └── auth.service.ts             # AuthService (equivalente a AuthProvider)
│   └── guards/
│       ├── auth.guard.ts               # ProtectedRoute
│       └── admin.guard.ts              # AdminRoute
├── shared/                        # Componentes y layouts compartidos
│   ├── components/
│   │   ├── sidebar/                    # Sidebar con navegación
│   │   └── topbar/                     # Topbar con menú móvil
│   ├── layouts/
│   │   ├── auth-layout/                # AuthLayout (páginas de login)
│   │   └── admin-layout/               # AdminLayout (panel admin)
│   └── interfaces/                    # Interfaces compartidas
│       ├── role.interface.ts
│       ├── profile.interface.ts
│       └── level.interface.ts
├── auth/                          # Autenticación
│   ├── login/                         # LoginPage
│   └── unauthorized/                  # UnauthorizedPage
├── pages/                         # Páginas funcionales (features)
│   ├── dashboard/                     # DashboardPage
│   ├── students/                      # StudentsPage
│   │   └── interfaces/                # Interfaces específicas de students
│   │       ├── student.interface.ts
│   │       └── student-status.type.ts
│   ├── classes/                       # ClassesPage
│   ├── calendar/                      # CalendarPage
│   ├── attendance/                    # AttendancePage
│   ├── payments/                      # PaymentsPage
│   │   └── interfaces/                # Interfaces específicas de payments
│   │       └── payment-method.interface.ts
│   ├── validations/                   # ValidationsPage
│   └── settings/                      # SettingsPage
└── environments/                   # Configuración de entorno
    ├── environment.ts
    └── environment.prod.ts
```

## 🔄 Convenciones de Código

### Naming
- **CamelCase** para variables, propiedades y métodos: `firstName`, `userEmail`, `getUserById()`
- **PascalCase** para clases, interfaces y componentes: `Student`, `DashboardComponent`, `StudentService`
- **kebab-case** para rutas URL: `/admin/students`, `/admin/payments`
- **Archivos separados**: Cada componente tiene `.ts`, `.html`, `.css` separados

### Estructura de Componentes
Cada componente sigue esta estructura:
```
feature-name/
├── feature-name.component.ts       # Lógica del componente
├── feature-name.component.html     # Template
├── feature-name.component.css      # Estilos
└── interfaces/                     # Interfaces específicas (si aplica)
    └── feature.interface.ts
```

## 🔄 Mapeo de Conceptos React → Angular

| React (MaxiDancer) | Angular (danzi-front-app) |
|-------------------|---------------------------|
| `AuthProvider` (Context) | `AuthService` (@Injectable) |
| `useAuth()` hook | Inyectar `AuthService` en constructor |
| `ProtectedRoute` | `authGuard` (CanActivateFn) |
| `AdminRoute` | `adminGuard` (CanActivateFn) |
| `Outlet` en layouts | `<router-outlet>` |
| `studentsService.ts` | `StudentsService` (@Injectable) |
| `types/database.ts` | `interfaces/` por feature |
| `lucide-react` | SVG inline o `lucide-angular` |
| `react-router-dom` | `@angular/router` |
| `useState` | Angular Signals (`signal()`) |
| `useEffect` | Constructor + ngOnInit o Signals |

### Rutas (URL)
| React (MaxiDancer) | Angular (danzi-front-app) |
|-------------------|---------------------------|
| `/admin/alumnos` | `/admin/students` |
| `/admin/clases` | `/admin/classes` |
| `/admin/calendario` | `/admin/calendar` |
| `/admin/asistencia` | `/admin/attendance` |
| `/admin/pagos` | `/admin/payments` |
| `/admin/validaciones` | `/admin/validations` |
| `/admin/ajustes` | `/admin/settings` |

## 🚀 Pasos Siguientes para Completar la Implementación

### 1. Configurar Supabase

Edita los archivos de entorno con tus credenciales de Supabase:

**`src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'TU_SUPABASE_URL',
    anonKey: 'TU_SUPABASE_ANON_KEY'
  }
};
```

**`src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'TU_SUPABASE_URL_PRODUCCION',
    anonKey: 'TU_SUPABASE_ANON_KEY_PRODUCCION'
  }
};
```

### 2. Implementar LoginPage Completo

El componente actual en `src/app/features/login/login.component.ts` es un placeholder. Debes implementar:

- Formulario de login con email y password
- Validación de formulario
- Llamada a `authService.signIn()`
- Redirección al dashboard después del login exitoso
- Manejo de errores

### 3. Crear Servicios de Datos

Crea servicios en `src/app/core/services/` o `src/app/features/*/services/`:

**Ejemplo - StudentsService:**
```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseClientService } from '../../core/services/supabase-client.service';
import { Student, StudentWithRelations, StudentInput, StudentUpdateInput } from '../../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class StudentsService {
  private supabase = this.supabaseClientService.getClient();

  constructor(private supabaseClientService: SupabaseClientService) {}

  getStudents(params?: any): Observable<{ students: StudentWithRelations[]; count: number }> {
    // Implementar lógica similar a studentsService.ts de React
  }

  createStudent(data: StudentInput): Observable<StudentWithRelations> {
    // Implementar creación
  }

  updateStudent(id: string, data: StudentUpdateInput): Observable<StudentWithRelations> {
    // Implementar actualización
  }
}
```

### 4. Implementar Páginas de Features

Cada componente en `src/app/features/*/` debe implementar:

- **DashboardComponent:** Métricas generales, tarjetas de resumen
- **StudentsComponent:** Tabla de alumnos, búsqueda, filtros, CRUD
- **ClassesComponent:** Gestión de clases
- **CalendarComponent:** Calendario de eventos
- **AttendanceComponent:** Registro de asistencia
- **PaymentsComponent:** Gestión de pagos
- **ValidationsComponent:** Validaciones administrativas
- **SettingsComponent:** Configuración del sistema

### 5. Estilos Globales

Crea o actualiza los estilos globales en `src/styles.css` o `src/app/styles/` para replicar el diseño del proyecto React. Puedes copiar los estilos de `src/styles/global.css` del proyecto React.

### 6. Iconos

El proyecto React usa `lucide-react`. En Angular tienes opciones:

- **Opción A:** Usar SVG inline (como en los componentes actuales)
- **Opción B:** Instalar `lucide-angular`:
  ```bash
  npm install lucide-angular
  ```
- **Opción C:** Usar Angular Material Icons

### 7. Estado Global y Reactividad

Angular 17+ usa **Signals** para reactividad (similar a useState):

```typescript
// React
const [loading, setLoading] = useState(false);

// Angular
loading = signal(false);
loading.set(true); // setLoading(true)
loading.update(v => !v); // setLoading(prev => !prev)
```

### 8. Manejo de Errores de Supabase

El proyecto React tiene lógica especial para manejar campos sociales (alias, instagram) que pueden no existir. Debes replicar esta lógica en los servicios Angular:

```typescript
function isMissingSocialFieldError(error: any): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  const mentionsSocialField = message.includes('alias') || message.includes('instagram');
  return mentionsSocialField && (
    error?.code === '42703' ||
    error?.code === 'PGRST204' ||
    message.includes('schema cache')
  );
}
```

### 9. Audit Logs y Level History

Si necesitas funcionalidad de auditoría, implementa servicios similares a:

- `writeAudit()` - Registrar cambios en `audit_logs`
- `writeLevelHistory()` - Registrar cambios de nivel en `student_level_history`

### 10. Testing

El proyecto ya tiene `vitest` configurado. Crea tests para:

- Guards (`authGuard`, `adminGuard`)
- Services (`AuthService`, `StudentsService`)
- Components

## 📝 Notas Importantes

1. **Signals vs Observables:** Angular usa Signals para estado local y Observables (RxJS) para operaciones asíncronas como llamadas API.

2. **Standalone Components:** Todos los componentes creados son standalone (no requieren NgModule). Importa los componentes que necesites directamente.

3. **Lazy Loading:** Para optimizar, puedes convertir las features en lazy-loaded modules usando `loadComponent` en el routing.

4. **Environment Variables:** Asegúrate de agregar `src/environments/` a `.gitignore` si contiene credenciales reales.

5. **Type Safety:** Los modelos en `models/database.models.ts` ya proporcionan type safety equivalente al proyecto React.

## 🎯 Próximos Pasos Recomendados

1. Configurar credenciales de Supabase
2. Implementar LoginPage completo
3. Crear StudentsService con todas las operaciones CRUD
4. Implementar StudentsComponent con tabla y formularios
5. Repetir para las demás features
6. Agregar estilos globales
7. Implementar manejo de errores y loading states
8. Agregar tests unitarios

## 📚 Recursos Útiles

- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Router](https://angular.dev/guide/routing)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [RxJS Operators](https://rxjs.dev/guide/operators)
