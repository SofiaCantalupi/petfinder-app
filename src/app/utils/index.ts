import { EstadoMascota, TipoMascota } from '../models/publicacion';
import { EstadoMascotaConstante, TipoMascotaConstante } from '../models/mascota-request-dto';

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
