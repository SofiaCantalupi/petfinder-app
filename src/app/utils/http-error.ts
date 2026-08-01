import { HttpErrorResponse } from '@angular/common/http';

// El envelope del backend es { timestamp, estado, error, mensaje }, y "mensaje" puede ser
// un string o un mapa campo->mensaje (@Valid). También hay errores sin ese envelope (403 vacío, texto plano).
export function extraerMensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }

  const body = err.error;

  if (body && typeof body === 'object' && 'mensaje' in body) {
    const mensaje = (body as { mensaje: unknown }).mensaje;

    if (typeof mensaje === 'string') {
      return mensaje;
    }
    if (mensaje && typeof mensaje === 'object') {
      return Object.values(mensaje as Record<string, string>).join(' ');
    }
  }

  if (typeof body === 'string' && body.trim().length > 0) {
    return body;
  }

  return 'Ocurrió un error inesperado.';
}
