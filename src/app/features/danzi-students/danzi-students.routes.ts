import { Routes } from '@angular/router';

export const DANZI_STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/student-home.component').then((m) => m.StudentHomeComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
];
