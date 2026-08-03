import { EstadoMascota, TipoMascota } from '../models/publicacion';
import { EstadoMascotaConstante, TipoMascotaConstante } from '../models/mascota-request-dto';
import {
  EstadoSolicitud,
  EstadoSolicitudConstante,
  MotivoRechazo,
  TipoHogar,
  TipoHogarConstante,
  TipoMascotasEnHogar,
  TipoMascotasEnHogarConstante,
} from '../models/solicitud-adopcion';

const ESTADO_MASCOTA_A_CONSTANTE: Record<EstadoMascota, EstadoMascotaConstante> = {
  perdido: 'PERDIDA',
  encontrado: 'ENCONTRADA',
  reencontrado: 'REENCONTRADA',
  en_adopcion: 'EN_ADOPCION',
  adoptado: 'ADOPTADA',
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

const TIPO_HOGAR_A_CONSTANTE: Record<TipoHogar, TipoHogarConstante> = {
  casa: 'CASA',
  departamento: 'DEPARTAMENTO',
};

const TIPO_MASCOTAS_EN_HOGAR_A_CONSTANTE: Record<
  TipoMascotasEnHogar,
  TipoMascotasEnHogarConstante
> = {
  perro: 'PERRO',
  gato: 'GATO',
  perro_y_gato: 'PERRO_Y_GATO',
};

const ESTADO_SOLICITUD_A_CONSTANTE: Record<EstadoSolicitud, EstadoSolicitudConstante> = {
  pendiente: 'PENDIENTE',
  aprobada: 'APROBADA',
  rechazada: 'RECHAZADA',
  cancelada: 'CANCELADA',
};

export function tipoHogarAConstante(tipo: TipoHogar): TipoHogarConstante {
  return TIPO_HOGAR_A_CONSTANTE[tipo];
}

// Acepta vacio/null porque el campo es opcional: nunca hay que mandar '' (el value del
// <option> "Seleccione...") a un enum tipado — Jackson no puede deserializarlo y el error
// resultante no esta mapeado en GlobalHandlerException, asi que sale 500 en vez de 400.
export function tipoMascotasEnHogarAConstante(
  tipo: TipoMascotasEnHogar | null | undefined,
): TipoMascotasEnHogarConstante | null {
  if (!tipo) return null;
  return TIPO_MASCOTAS_EN_HOGAR_A_CONSTANTE[tipo];
}

export function estadoSolicitudAConstante(estado: EstadoSolicitud): EstadoSolicitudConstante {
  return ESTADO_SOLICITUD_A_CONSTANTE[estado];
}

// MANUAL no tiene texto: ese rechazo ya lo explica comentarioResolucion, no hace falta mostrarlo.
const MOTIVO_RECHAZO_A_TEXTO: Record<MotivoRechazo, string | null> = {
  MANUAL: null,
  AUTO_POR_OTRA_APROBADA: 'La mascota fue adoptada por otro miembro.',
  AUTO_POR_PUBLICACION_ELIMINADA: 'La publicación ha sido eliminada.',
  AUTO_CAMBIO_ESTADO_MASCOTA: 'La mascota ha dejado de estar en adopción.',
};

export function motivoRechazoATexto(motivo: MotivoRechazo): string | null {
  return MOTIVO_RECHAZO_A_TEXTO[motivo];
}
