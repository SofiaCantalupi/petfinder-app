import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { ToastService } from '../services/toast-service';
import { inject } from '@angular/core';

// Bloquea rutas que son solo para MIEMBRO (el admin modera, no adopta). Se combina con authGuard,
// que es el que se encarga del caso "no logueado".
export const noAdminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  if (authService.isAdmin()) {
    toastService.showToast('Esta sección no está disponible para administradores', 'error', 5000);
    router.navigate(['/publicaciones']);
    return false;
  }

  return true;
};
