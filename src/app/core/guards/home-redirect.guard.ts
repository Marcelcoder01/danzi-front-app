import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HomeRouteService } from '../services/home-route.service';

/** Redirige a la experiencia adecuada según las relaciones del usuario. */
export const homeRedirectGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const target = await inject(HomeRouteService).resolve();
  return router.parseUrl(target);
};
