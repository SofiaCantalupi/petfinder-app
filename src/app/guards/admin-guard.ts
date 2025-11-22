import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // verificar que este logueado y sea admin
  if (!authService.estaLogeado()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.isAdmin()) {
    // Si está logueado pero no es admin, redirigir al home
    router.navigate(['/publicaciones']);
    return false;
  }

  return true;
};
