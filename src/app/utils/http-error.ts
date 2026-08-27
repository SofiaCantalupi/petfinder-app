import { HttpErrorResponse } from '@angular/common/http';

// En los requests con responseType: 'text' (los DELETE que devuelven un string), Angular NO
// parsea el body de error: err.error llega como el JSON crudo del envelope en vez de un objeto.
// Sin este parseo, esos errores de negocio se confunden con respuestas sin envelope.
export function cuerpoDeError(err: HttpErrorResponse): unknown {
  const body = err.error;

  if (typeof body !== 'string') return body;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

// El backend usa 403 tanto para "sesión inválida" (filtro de seguridad) como para errores de
// negocio (OperacionNoPermitidaException, rol insuficiente en @PreAuthorize). Se distinguen por
// el body: los de negocio pasan por GlobalHandlerException y traen el envelope { mensaje, ... };
// los del filtro vienen vacíos.
// Vive aca y no en el interceptor porque los componentes tmb la necesitan: cuando es true,
// el interceptor ya aviso y riderigio, asique no corresponde mostrar un segundo toast.
export function esRechazoDeSesion(err: HttpErrorResponse): boolean {
  if (err.status === 401) return true;
  if (err.status !== 403) return false;

  const body = cuerpoDeError(err);
  const esEnvelopeDeNegocio = !!body && typeof body === 'object' && 'mensaje' in body;
  return !esEnvelopeDeNegocio;
}

// El envelope del backend es { timestamp, estado, error, mensaje }, y "mensaje" puede ser
// un string o un mapa campo->mensaje (@Valid). También hay errores sin ese envelope (403 vacío, texto plano).
export function extraerMensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }

  const body = cuerpoDeError(err);

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
