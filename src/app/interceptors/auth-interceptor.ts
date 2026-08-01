import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token-service';
import { DATABASE_BASE_URL } from '../constants';

// Adjunta el JWT a cada request al backend propio. Excluye terceros (geocoding) y las rutas públicas.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(DATABASE_BASE_URL)) {
    return next(req);
  }

  if (req.url.includes('/auth/login') || req.url.includes('/auth/registro')) {
    return next(req);
  }

  const token = inject(TokenService).getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
