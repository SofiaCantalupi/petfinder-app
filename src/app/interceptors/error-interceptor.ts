import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast-service';
import { AuthService } from '../services/auth-service';
import { DATABASE_BASE_URL } from '../constants';

// El backend usa 403 tanto para "sesión inválida" (filtro de seguridad) como para errores de
// negocio (OperacionNoPermitidaException). Se distinguen por el body: los de negocio pasan por
// GlobalHandlerException y traen el envelope { mensaje, ... }; los del filtro vienen vacíos.
function esRechazoDeSesion(error: HttpErrorResponse): boolean {
  if (error.status === 401) return true;
  if (error.status !== 403) return false;

  const body = error.error;
  const esEnvelopeDeNegocio = !!body && typeof body === 'object' && 'mensaje' in body;
  return !esEnvelopeDeNegocio;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(DATABASE_BASE_URL)) {
    return next(req);
  }

  if (req.url.includes('/auth/login') || req.url.includes('/auth/registro')) {
    return next(req);
  }

  // Lookup diferido: AuthService inyecta HttpClient, así que injector.get() se llama
  // recién dentro de catchError, cuando HttpClient ya terminó de construirse.
  const injector = inject(Injector);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && esRechazoDeSesion(error)) {
        injector.get(AuthService).cerrarSesionPorExpiracion();
        injector.get(ToastService).showToast(
          'Tu sesión expiró. Volvé a iniciar sesión.',
          'warning',
          5000
        );
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
