import { CanActivateFn, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { inject } from '@angular/core';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.estaLogeado()) {
    router.navigate(['/yaLogeado']);
    return false;
  }
  return true;
};
