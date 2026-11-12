import { Routes } from '@angular/router';
import { HomeLayoutComponent } from './app-shell/home-layout/home-layout.component';
import { AccountLayoutComponent } from './app-shell/account-layout/account-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentsComponent } from './pages/students/students.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ValidationsComponent } from './pages/validations/validations.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
import { authGuard } from './core/guards/auth.guard';
import { academyGuard } from './features/organizations/guards/academy.guard';
import { homeRedirectGuard } from './app-shell/guards/home-redirect.guard';
import { organizationRoleGuard } from './features/organizations/guards/organization-role.guard';
import { STUDENT_MANAGER_ROLES } from './features/organizations/models/organization.model';

const studentManagerGuard = organizationRoleGuard(STUDENT_MANAGER_ROLES);

export const routes: Routes = [
  { path: '', redirectTo: '/start', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    children: [{ path: '', component: LoginComponent }],
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  // Punto de entrada tras iniciar sesión: decide la experiencia según las relaciones reales.
  { path: 'start', canActivate: [authGuard, homeRedirectGuard], children: [] },
  {
    path: 'admin',
    component: HomeLayoutComponent,
    canActivate: [authGuard, academyGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/students/pages/organization-students/organization-students.component').then(
            (m) => m.OrganizationStudentsComponent,
          ),
        canActivate: [studentManagerGuard],
      },
      // Alumnos demo en localStorage, necesarios para clases, matrículas, asistencia y pagos.
      { path: 'students/local', component: StudentsComponent },
      {
        path: 'join-requests',
        loadComponent: () =>
          import('./features/join-requests/pages/join-requests/join-requests.component').then(
            (m) => m.JoinRequestsComponent,
          ),
        canActivate: [studentManagerGuard],
      },
      { path: 'classes', component: ClassesComponent },
      { path: 'calendar', component: CalendarComponent },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./pages/attendance/attendance.component').then(
            (module) => module.AttendanceComponent,
          ),
      },
      { path: 'payments', component: PaymentsComponent },
      { path: 'validations', component: ValidationsComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  {
    path: '',
    component: AccountLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./features/organizations/pages/onboarding/onboarding.component').then(
            (m) => m.OnboardingComponent,
          ),
      },
      {
        path: 'select-academy',
        loadComponent: () =>
          import('./features/organizations/pages/select-academy/select-academy.component').then(
            (m) => m.SelectAcademyComponent,
          ),
      },
      // Danzi Students
      {
        path: 'me',
        loadComponent: () =>
          import('./features/student-space/pages/student-home/student-home.component').then(
            (m) => m.StudentHomeComponent,
          ),
      },
      {
        path: 'me/profile',
        loadComponent: () =>
          import('./features/profile/pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
    ],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '/login' },
];
