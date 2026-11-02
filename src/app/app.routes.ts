import { Routes } from '@angular/router';
import { HomeLayoutComponent } from './shared/layouts/home-layout/home-layout.component';
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

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    children: [{ path: '', component: LoginComponent }],
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'admin',
    component: HomeLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'students', component: StudentsComponent, canActivate: [authGuard] },
      { path: 'classes', component: ClassesComponent, canActivate: [authGuard] },
      { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./pages/attendance/attendance.component').then(
            (module) => module.AttendanceComponent,
          ),
        canActivate: [authGuard],
      },
      { path: 'payments', component: PaymentsComponent, canActivate: [authGuard] },
      { path: 'validations', component: ValidationsComponent, canActivate: [authGuard] },
      { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
    ],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '/login' },
];
