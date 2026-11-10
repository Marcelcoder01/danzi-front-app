# DANZI V1 — Frontend Refactor & Supabase Integration

## Rol

Actúa como un Senior Frontend Software Engineer especializado en Angular 21, TypeScript, Supabase y desarrollo de productos SaaS multi-tenant.

Necesito realizar un refactor incremental del frontend de Danzi para adaptarlo al backend que ya está implementado en Supabase.

El objetivo NO es reescribir la aplicación desde cero, sino evolucionar su arquitectura actual para integrar correctamente los usuarios, academias, alumnos y solicitudes de incorporación.

Implementa los cambios funcionales, no te limites a entregar una propuesta teórica.

---

## 1. Contexto del producto

Danzi es una plataforma de gestión para academias y profesores de baile que también ofrece un espacio personal para alumnos.

Tiene dos experiencias principales en V1:

**Danzi Academy**
- Registro de academias.
- Gestión de alumnos.
- Gestión de miembros según sus permisos.
- Recepción, aprobación y rechazo de solicitudes de alumnos.

**Danzi Students**
- Acceso con una cuenta personal de Danzi.
- Consulta de las academias en las que es alumno, sujeto a los permisos disponibles.
- Solicitud de incorporación a una academia.
- Consulta del estado de sus solicitudes.
- Consulta de sus fichas de alumno vinculadas.

Un usuario puede ser propietario de una academia, profesor en otra y alumno en una tercera.

Por tanto, **no existe un único rol global que determine qué tipo de usuario es una persona**.

Los roles dependen de su relación con una organización.

---

## 2. Stack y convenciones

Conserva el stack existente:

- Angular 21 y Standalone Components.
- TypeScript con tipado estricto.
- Angular Signals y Reactive Forms.
- Supabase JS v2.
- Tailwind CSS 3 y daisyUI 4.
- Font Awesome.
- Arquitectura actual de componentes, servicios y rutas.

Antes de implementar, lee `package.json`, las rutas, los servicios, las interfaces y los componentes afectados.

Prioriza:
- Separación de responsabilidades.
- Componentes de presentación ligeros.
- Servicios responsables de acceso a datos.
- Modelo de datos basado en las tablas existentes.
- Interfaces del front en camelCase, las de supabase son en snake_case pero debemos mapearlas.
- Estados de carga, error y vacío.
- Código reutilizable, sin sobreingeniería.
- Conservación del diseño visual actual.

No instales nuevas librerías salvo que exista una necesidad técnica justificada.

---

## 3. Alcance permitido

Implementar exclusivamente las funcionalidades relacionadas con las siguientes tablas existentes:

- `public.users`
- `public.organizations`
- `public.organization_members`
- `public.dance_styles`
- `public.organization_dance_styles`
- `public.students`
- `public.join_requests`

Y las siguientes funciones RPC existentes:

- `create_organization`
- `create_student`
- `request_join_organization`
- `review_join_request`

No inventes otras RPC ni asumas que existen.

No modifiques el esquema de Supabase ni las políticas RLS. Si detectas una operación imposible con los permisos actuales, documenta el contrato backend que necesitamos añadir posteriormente.

No implementes todavía invitaciones de vinculación de fichas manuales.

### Fuera del alcance

NO refactorizar ni migrar a Supabase:

- Clases.
- Horarios.
- Calendario.
- Asistencia.
- Matrículas en clases.
- Eventos.
- Gestión de pagos.
- Historial de pagos.

Estos módulos continúan utilizando su implementación local actual hasta fases posteriores.

Evita romper sus componentes, servicios e interfaces.

---

## 4. Refactor de usuarios y autenticación

### Situación actual

Existe una interfaz `User` en:

`src/app/shared/interfaces/user.interface.ts`

Su modelo actual incluye propiedades como `roleId`, `name`, `surname`, `email`, `isActive` y `lastLogin`.

No corresponde al esquema real de Supabase.

### Modelo backend real

`public.users` contiene:

```typescript
interface UserProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}
```

El email y las credenciales se gestionan en Supabase Auth, no en `public.users`.

### Implementación

1. Redefinir el modelo de usuario para alinearlo con este esquema.
2. Diferenciar claramente `User` de Supabase Auth y el perfil de dominio de Danzi.
3. Eliminar la dependencia de un único `roleId` global.
4. Crear un servicio de perfil que permita consultar y actualizar los campos autorizados de `public.users`.
5. Mantener la autenticación existente en `AuthService`.
6. No crear nuevos perfiles manualmente al registrarse: Supabase ya tiene un trigger que crea `public.users` al registrar una cuenta en Auth.
7. Conservar la compatibilidad con los usuarios existentes que solo tienen `display_name`, porque el formulario de registro actual envía `full_name` como metadata.
8. Permitir completar `first_name` y `last_name` desde una pantalla de perfil.
9. No duplicar contraseñas ni credenciales.

El frontend debe obtener el usuario autenticado desde Supabase Auth y cargar su perfil desde `public.users`.

---

## 5. Refactor de organizaciones

Crear un módulo o feature de organizaciones.

### Modelo

`organizations`:

```typescript
type OrganizationType = 'academy' | 'independent_teacher';

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country_code: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

`organization_members`:

```typescript
type OrganizationRole = 'owner' | 'admin' | 'teacher';

interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Funcionalidades

Implementar:

**A. Registro de academia**
- Formulario de creación.
- Nombre de academia.
- Slug único y validado.
- Tipo `academy` o `independent_teacher`.
- Validaciones.
- Estado loading.
- Manejo de errores.
- Confirmación de creación.

La creación se realiza exclusivamente con:

```typescript
supabase.rpc('create_organization', {
  p_name: name,
  p_slug: slug,
  p_type: type
});
```

La función crea la organización y asigna el rol `owner` al usuario autenticado.

NO insertar directamente en `organizations` ni en `organization_members`.

**B. Mis academias**

Consultar las organizaciones visibles para el usuario autenticado y sus relaciones en `organization_members`.

**C. Academia activa**

Implementar un contexto de organización activa mediante servicio y Signals.

Debe permitir:
- Seleccionar una academia.
- Mantener su ID disponible para los módulos relacionados.
- Cambiar de academia cuando un usuario pertenezca a varias.
- Revalidar la pertenencia al recuperar un ID guardado localmente.
- Limpiar el contexto al cerrar sesión.

No utilizar IDs de academia hardcodeados.

**D. Estilos de baile**

El catálogo `dance_styles` es consultable públicamente.

Preparar los modelos y la lectura del catálogo.

Existe la relación `organization_dance_styles`, pero todavía no contamos con un contrato completo de escritura y lectura para gestionar asociaciones desde el frontend.

No simular el guardado de estilos ni insertar directamente en esa tabla. Documentar la funcionalidad pendiente y dejar el formulario preparado para incorporarla después.

---

## 6. Sistema de roles y navegación

Actualmente `authGuard` comprueba la sesión, mientras que `adminGuard` no realiza validaciones reales.

Además, el login redirige siempre a `/admin`.

Refactorizar estos comportamientos.

### Reglas

Un usuario puede tener diferentes roles en diferentes academias.

**Owner**
- Acceso al panel de gestión de su academia.
- Consulta de alumnos.
- Alta de alumnos.
- Consulta y revisión de solicitudes.

**Admin**
- Acceso a las mismas operaciones anteriores autorizadas actualmente por backend.

**Teacher**
- Tiene una relación con una academia.
- Todavía no puede consultar todos sus alumnos.
- Los permisos específicos de clases y alumnos asignados quedan para una fase futura.

**Student**
- Accede a la zona Danzi Students.
- Puede consultar sus fichas vinculadas.
- Puede solicitar incorporarse a academias.
- No debe acceder automáticamente al panel administrativo.

### Navegación

Proponer e implementar un flujo coherente:

- Usuario no autenticado → `/login`.
- Usuario autenticado sin academia administrativa → Danzi Students u onboarding.
- Usuario autenticado con academia → acceso al panel Academy.
- Usuario con varias academias → selector de academia.
- Usuario con roles mixtos → puede cambiar entre experiencias.
- Usuario sin permisos → acceso denegado o redirección adecuada.

Conservar las rutas existentes `/admin` y `/admin/students` cuando sea posible.

Crear rutas nuevas para onboarding y Danzi Students con nombres consistentes y sin colisiones.

Los guards frontend son solo una capa de navegación. La autorización real depende de RLS y de las RPC de Supabase.

---

## 7. Refactor de alumnos

### Modelo real en Supabase

```typescript
type DanceRole = 'leader' | 'follower' | 'both';
type StudentStatus = 'active' | 'inactive' | 'pending';

interface StudentRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  dance_role: DanceRole;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}
```

### Problema actual

El modelo frontend `Student` contiene propiedades que aún no existen en Supabase:

- level
- alias
- instagram
- hasPaid
- monthlyFee
- paymentHistory
- paymentPeriod
- nextPaymentDate
- startDate
- etc.

También existen diferencias entre enums:
- Angular usa `mixed`; Supabase utiliza `both`.
- Angular usa `paused`; Supabase utiliza `pending`.

### Implementación

Separar los modelos legacy/locales de las entidades persistidas en Supabase.

Crear un servicio de alumnos conectado a Supabase para:

**Consultar alumnos**
- Obtener los alumnos de la organización activa.
- Mostrar únicamente los datos disponibles en la base de datos.
- Manejar errores, carga y lista vacía.
- Mantener los resultados aislados por organización.

**Crear alumno manualmente**

Utilizar exclusivamente:

```typescript
supabase.rpc('create_student', {
  p_organization_id: organizationId,
  p_first_name: firstName,
  p_last_name: lastName,
  p_email: email,
  p_phone: phone,
  p_dance_role: danceRole
});
```

La función crea una ficha con `user_id = null`.

No permitir asignar arbitrariamente `user_id` desde Angular.

**Adaptar la pantalla existente de alumnos**

Reutilizar en lo posible:
- `students.component`
- `student-dialog.component`
- Estilos y componentes visuales.

Pero no enviar a Supabase campos inexistentes.

Las opciones de niveles, pagos y matrículas pueden mantenerse exclusivamente en los módulos legacy donde proceda, sin mezclarse con el modelo persistido.

No mostrar como funcionalidades operativas la edición o eliminación de alumnos Supabase: actualmente no tenemos RPCs ni políticas de escritura para esas operaciones.

Evitar falsos mensajes de éxito y modificaciones que solo afecten a localStorage mientras el usuario cree que está editando datos reales.

Especialmente importante: `AcademyDataService` está acoplado a alumnos, clases, matrículas y pagos. Refactorizar de forma incremental, sin sustituir indiscriminadamente sus datos ni romper referencias entre entidades locales.

---

## 8. Join Requests

### Modelo

```typescript
type JoinRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

interface JoinRequestRow {
  id: string;
  organization_id: string;
  user_id: string;
  status: JoinRequestStatus;
  message: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### A. Solicitar incorporación

Desde Danzi Students, permitir que un usuario introduzca el slug de una academia y envíe una solicitud.

Utilizar:

```typescript
supabase.rpc('request_join_organization', {
  p_organization_slug: slug,
  p_message: message
});
```

Mostrar:
- Confirmación de solicitud enviada.
- Solicitud pendiente.
- Errores de academia inexistente.
- Error de solicitud duplicada.
- Error si ya es alumno vinculado.

### B. Mis solicitudes

Consultar `join_requests` mediante Supabase, aprovechando las políticas RLS.

Mostrar estado, fecha y mensaje.

No permitir que el usuario marque una solicitud como aprobada.

### C. Solicitudes recibidas por una academia

Crear una pantalla o sección de gestión para `owner` y `admin`.

Consultar las solicitudes correspondientes a la organización activa.

Mostrar estados y permitir revisar las pendientes.

Ten presente que actualmente RLS no permite leer libremente los perfiles `public.users` de los solicitantes. No introducir consultas privilegiadas ni mostrar nombres inventados. Documentar que necesitaremos un endpoint o una RPC segura para obtener los datos mínimos del solicitante.

### D. Aprobar o rechazar

Utilizar:

```typescript
supabase.rpc('review_join_request', {
  p_request_id: requestId,
  p_decision: 'approved'
});
```

O:

```typescript
supabase.rpc('review_join_request', {
  p_request_id: requestId,
  p_decision: 'rejected'
});
```

La aprobación crea automáticamente la ficha del alumno y la vincula con su cuenta.

El backend obtiene nombre y apellidos de `public.users`. No solicitarlos de nuevo al administrador ni enviarlos en la RPC.

Gestionar los errores:
- Solicitud ya procesada.
- Usuario sin permisos.
- Alumno ya vinculado.
- Posible ficha manual que requiere verificación.

Actualizar las listas y los estados tras cada operación.

---

## 9. Primera experiencia Danzi Students

Crear una experiencia mínima, funcional y visualmente coherente con el producto existente.

No necesitamos todavía un dashboard completo de clases y eventos.

Debe permitir:

- Consultar el perfil global.
- Ver sus fichas vinculadas de `students`.
- Consultar el estado de las solicitudes.
- Solicitar acceso a una academia utilizando su slug.
- Ver estados vacíos y mensajes de onboarding.
- Acceder a la experiencia Academy cuando tenga una relación administrativa autorizada.

Una persona puede tener varias fichas en diferentes academias.

No asumir que tener una cuenta significa pertenecer a una academia.

La lectura de información pública de academias por parte de estudiantes todavía tiene limitaciones RLS. No debilitarlas. Implementar únicamente lo que permitan las consultas actuales y documentar lo pendiente.

---

## 10. Arquitectura frontend propuesta

Adaptar la estructura existente sin hacer una reorganización masiva innecesaria.

Mantener `SupabaseService` como proveedor del cliente:

```typescript
this.supabaseService.client
```

Separar responsabilidades en servicios de dominio como:

- `UserProfileService`
- `OrganizationService`
- `OrganizationContextService`
- `StudentService`
- `JoinRequestService`

Los nombres pueden adaptarse al estilo actual del proyecto.

Los componentes deben concentrarse en presentación, formularios y eventos de usuario.

Las llamadas Supabase deben estar encapsuladas en servicios.

Usar Signals para estado reactivo cuando aporte valor real.

Mantener separados:
1. Datos de Supabase.
2. Estado de presentación.
3. Datos legacy de localStorage.

No introducir NgRx ni otro gestor global de estado.

---

## 11. Seguridad

Requisitos obligatorios:

- No utilizar `service_role` en Angular.
- No saltarse RLS.
- No conceder permisos administrativos desde el cliente.
- No enviar `user_id` arbitrario en RPCs de creación.
- No escribir directamente en tablas que tienen escrituras revocadas.
- No asumir permisos porque una ruta esté visible.
- No guardar tokens ni información sensible en logs.
- Manejar los errores de autorización correctamente.
- No modificar la base de datos ni ejecutar migraciones SQL sin autorización expresa.

Los permisos ya están implementados en el backend. Debes integrarte con ellos, no sustituirlos.

---

## 12. Preservar funcionalidades existentes

Esta condición es muy importante.

No cambiar la lógica actual de:
- Clases.
- Attendance.
- Horarios.
- Pagos.
- Matrículas locales.

No modificar sus modelos y servicios salvo lo estrictamente necesario para mantener compatibilidad y compilación.

Si el nuevo módulo de alumnos entra en conflicto con las dependencias legacy, utiliza adaptadores o separa las experiencias temporalmente.

Nunca mezcles silenciosamente alumnos persistidos en Supabase con matrículas o pagos simulados en localStorage.

No borres datos locales existentes ni implementes migraciones automáticas de esos datos a Supabase.

Los módulos sin backend seguirán identificados como funcionalidades demo/locales.

---

## 13. UX/UI

Mantener la identidad visual actual de Danzi:
- Diseño moderno, premium y mobile-first.
- Tailwind CSS y daisyUI existentes.
- Font Awesome.
- Formularios claros.
- Feedback mediante ToastService.
- Estados de carga y éxito.
- Mensajes de error comprensibles.
- Componentes reutilizables.

Evitar rediseñar desde cero las pantallas que ya funcionan.

Priorizar una experiencia intuitiva tanto para administradores como para alumnos.

---

## 14. Plan de ejecución

Trabajar de manera incremental:

**Fase 1 — Diagnóstico**
- Revisar código y dependencias.
- Leer `AGENTS.md`.
- Comprobar cambios locales sin commitear.
- Identificar componentes y servicios afectados.
- Identificar dependencias con los módulos legacy.
- Informar brevemente del plan.

**Fase 2 — Modelos y servicios**
- Tipos alineados con Supabase.
- Perfil del usuario.
- Organizaciones.
- Contexto de academia activa.
- Alumnos.
- Join requests.

**Fase 3 — Auth y navegación**
- Onboarding.
- Redirecciones por relaciones reales.
- Guards.
- Selector de academia.
- Rutas de Danzi Students.

**Fase 4 — UI funcional**
- Crear academia.
- Listar academias.
- Listar y crear alumnos.
- Solicitar incorporación.
- Revisar y aprobar/rechazar solicitudes.
- Consultar perfil personal del alumno.

**Fase 5 — Validación**
- TypeScript.
- Build.
- Tests relevantes.
- Verificación de rutas.
- Verificación de compatibilidad con los módulos legacy.
- Informe final.

No sobrescribir cambios existentes del usuario ni hacer commits automáticos salvo autorización.

---

## 15. Criterios de aceptación

La implementación estará terminada cuando:

- [ ] Supabase Auth siga funcionando.
- [ ] `User` esté alineado con `public.users`.
- [ ] Una cuenta sin academia no acceda automáticamente a `/admin`.
- [ ] Un usuario pueda crear una academia mediante RPC.
- [ ] El creador quede asociado como `owner`.
- [ ] Se puedan consultar las organizaciones autorizadas.
- [ ] Se pueda seleccionar y cambiar la academia activa.
- [ ] Los alumnos se consulten según la organización activa.
- [ ] Un owner/admin pueda crear una ficha manual de alumno.
- [ ] Un estudiante pueda solicitar incorporarse a una academia.
- [ ] El estudiante pueda consultar el estado de sus solicitudes.
- [ ] El owner/admin pueda revisar solicitudes.
- [ ] Una solicitud aprobada genere una ficha vinculada al usuario correspondiente.
- [ ] El estudiante pueda consultar su propia ficha.
- [ ] No se permitan operaciones de modificación sin autorización backend.
- [ ] No se rompan clases, horarios, asistencia ni pagos legacy.
- [ ] `npm run build` complete correctamente, o se documenten los errores preexistentes y los bloqueos reales.
- [ ] Se añadan o actualicen tests para la lógica modificada.

## 16. Entrega final

Al terminar, proporciona:

1. Resumen de cambios realizados.
2. Archivos creados y modificados.
3. Nueva estructura de servicios y relaciones entre componentes.
4. Flujos implementados.
5. Funcionalidades que han quedado pendientes por limitaciones del backend actual.
6. Resultados de build y tests.
7. Posibles riesgos o incompatibilidades con los módulos legacy.

**Objetivo final:** que Danzi Front refleje el modelo actual de usuarios, academias y alumnos que ya tenemos implementado en Supabase, respetando la arquitectura y la interfaz existentes, sin adelantar funcionalidades cuyo backend todavía no hemos construido.
