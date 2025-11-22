import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PublicacionService } from '../services/publicacion-service';
import { AuthService } from '../services/auth-service';
import { ToastService } from '../services/toast-service';
import { catchError, map, of } from 'rxjs';

export const publicacionActivaGuard: CanActivateFn = (route) => {
  const publicacionesService = inject(PublicacionService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const id = Number(route.paramMap.get('id'));

  return publicacionesService.getPublicacionById(id).pipe(
    map((publicacion) => {
      if (!publicacion) {
        //Si no hay publicación con ese ID, te devuelve al muro
        toastService.showToast('No tenes acceso a esta publicación', 'error', 5000);
        router.navigate(['/publicaciones']);
        return false;
      }

      // Si la publicación es activa, te deja verla.
      if (publicacion.activo) {
        return true;
      }

      //Si es inactiva, solo te deja verla si es dueño.
      if (authService.esDueno(publicacion.idMiembro)) {
        return true;
      }

      //Si no se cumplen los casos de arriba, vuelta al muro.
      router.navigate(['/publicaciones']);
      toastService.showToast('No tenes acceso a esta publicación', 'error', 5000);

      return false;
    }),
    catchError(() => {
      router.navigate(['/publicaciones']);
      toastService.showToast('No tenes acceso a esta publicación', 'error', 5000);

      return of(false);
    })
  );
};
