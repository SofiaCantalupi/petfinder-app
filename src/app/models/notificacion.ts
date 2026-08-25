export type TipoNotificacion =
  | 'NUEVO_COMENTARIO'
  | 'RESPUESTA_ADOPCION'
  | 'SOLICITUD_ADOPCION'
  | 'ADOPCION_DISPONIBLE_NUEVAMENTE';

export interface Notificacion {
  id: number;
  receptorId: number;
  emisorId: number;
  tipo: TipoNotificacion;
  entidadReferenciaId: number;
  leida: boolean;
  fecha: string; //"2024-11-13"
  activa: boolean;
}
