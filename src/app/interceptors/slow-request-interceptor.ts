import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ToastService } from '../services/toast-service';
import { DATABASE_BASE_URL } from '../constants';

// Backend en un free tier de Render: la primera request tras un rato de inactividad puede tardar
// hasta un minuto en "despertar" al servidor. Si una request al backend tarda más de este umbral,
// avisamos que no está roto, solo arrancando.
const UMBRAL_MS = 10_000;

// Cooldown para no superponer varios toasts: un cold start dispara varias requests en paralelo
// (p. ej. el muro), y ToastService no apila los toasts entre sí.
const COOLDOWN_MS = 60_000;
let ultimoAvisoEn = 0;

export const slowRequestInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(DATABASE_BASE_URL)) {
    return next(req);
  }

  const toastService = inject(ToastService);

  const timeoutId = setTimeout(() => {
    const ahora = Date.now();
    if (ahora - ultimoAvisoEn < COOLDOWN_MS) return;

    ultimoAvisoEn = ahora;
    toastService.showToast(
      'El servidor está iniciando, puede tardar hasta un minuto',
      'info',
      8000,
    );
  }, UMBRAL_MS);

  return next(req).pipe(finalize(() => clearTimeout(timeoutId)));
};
