import { Routes } from '@angular/router';
import { organizationRoleGuard } from '@domain/organizations/guards/organization-role.guard';
import { STUDENT_MANAGER_ROLES } from '@domain/organizations/models/organization.model';

const studentManagerGuard = organizationRoleGuard(STUDENT_MANAGER_ROLES);

export const ACADEMY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./students/organization-students.component').then((m) => m.OrganizationStudentsComponent),
    canActivate: [studentManagerGuard],
  },
  // Alumnos demo en localStorage, necesarios para clases, matrículas, asistencia y pagos.
  {
    path: 'students/local',
    loadComponent: () => import('./students-local/students.component').then((m) => m.StudentsComponent),
  },
  {
    path: 'join-requests',
    loadComponent: () =>
      import('./join-requests/join-requests.component').then((m) => m.JoinRequestsComponent),
    canActivate: [studentManagerGuard],
  },
  {
    path: 'classes',
    loadComponent: () => import('./classes/classes.component').then((m) => m.ClassesComponent),
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/calendar.component').then((m) => m.CalendarComponent),
  },
  {
    path: 'attendance',
    loadComponent: () => import('./attendance/attendance.component').then((m) => m.AttendanceComponent),
  },
  {
    path: 'payments',
    loadComponent: () => import('./payments/payments.component').then((m) => m.PaymentsComponent),
  },
  {
    path: 'validations',
    loadComponent: () =>
      import('./validations/validations.component').then((m) => m.ValidationsComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
];
