import { Routes } from '@angular/router';
import { HomeLayoutComponent } from '@app-shell/home-layout/home-layout.component';
import { AccountLayoutComponent } from '@app-shell/account-layout/account-layout.component';
import { homeRedirectGuard } from '@app-shell/guards/home-redirect.guard';
import { LoginComponent } from '@auth/login/login.component';
import { ResetPasswordComponent } from '@auth/reset-password/reset-password.component';
import { UnauthorizedComponent } from '@auth/unauthorized/unauthorized.component';
import { authGuard } from '@core/guards/auth.guard';
import { academyGuard } from '@domain/organizations/guards/academy.guard';

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
    loadChildren: () => import('@academy/academy.routes').then((m) => m.ACADEMY_ROUTES),
  },
  {
    path: '',
    component: AccountLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'onboarding',
        loadComponent: () =>
          import('@academy/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
      },
      {
        path: 'select-academy',
        loadComponent: () =>
          import('@academy/select-academy/select-academy.component').then(
            (m) => m.SelectAcademyComponent,
          ),
      },
      // Danzi Students
      {
        path: 'me',
        loadChildren: () =>
          import('@danzi-students/danzi-students.routes').then((m) => m.DANZI_STUDENTS_ROUTES),
      },
    ],
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: '/login' },
];
