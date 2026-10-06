import { Routes } from '@angular/router';
import { HomeLayoutComponent } from './shared/layouts/home-layout/home-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentsComponent } from './pages/students/students.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ValidationsComponent } from './pages/validations/validations.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    children: [
      { path: '', component: LoginComponent }
    ]
  },
  {
    path: 'admin',
    component: HomeLayoutComponent,
    // canActivate: [authGuard, adminGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'students', component: StudentsComponent },
      { path: 'classes', component: ClassesComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'attendance', component: AttendanceComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'validations', component: ValidationsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '/admin' }
];
