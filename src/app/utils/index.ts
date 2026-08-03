import { EstadoMascota, TipoMascota } from '../models/publicacion';
import { EstadoMascotaConstante, TipoMascotaConstante } from '../models/mascota-request-dto';
import { MotivoRechazo } from '../models/solicitud-adopcion';

const ESTADO_MASCOTA_A_CONSTANTE: Record<EstadoMascota, EstadoMascotaConstante> = {
  perdido: 'PERDIDA',
  encontrado: 'ENCONTRADA',
  reencontrado: 'REENCONTRADA',
};

const TIPO_MASCOTA_A_CONSTANTE: Record<TipoMascota, TipoMascotaConstante> = {
  perro: 'PERRO',
  gato: 'GATO',
};

export function estadoMascotaAConstante(estado: EstadoMascota): EstadoMascotaConstante {
  return ESTADO_MASCOTA_A_CONSTANTE[estado];
}

export function tipoMascotaAConstante(tipo: TipoMascota): TipoMascotaConstante {
  return TIPO_MASCOTA_A_CONSTANTE[tipo];
}

const MOTIVO_RECHAZO_A_TEXTO: Record<MotivoRechazo, string> = {
  manual: 'Rechazada por el publicador',
  auto_otra_aprobada: 'Se aprobó otra solicitud para esta mascota',
  auto_publicacion_eliminada: 'La publicación fue eliminada',
  auto_cambio_estado_mascota: 'El estado de la mascota cambió',
};

export function motivoRechazoATexto(motivo: MotivoRechazo): string {
  return MOTIVO_RECHAZO_A_TEXTO[motivo];
}
