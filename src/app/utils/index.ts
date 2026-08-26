import { EstadoMascota, Publicacion, TipoMascota } from '../models/publicacion';
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

// El backend devuelve las publicaciones en orden de insercion (findAllByActivoTrue, sin ORDER BY),
// asi que las mas viejas quedaban primero en el muro. Se ordenan aca y no en cada template,
// por id descendente, que es el orden real de creacion. Se copia el array porque sort muta.
export function ordenarPublicacionesRecientesPrimero(publicaciones: Publicacion[]): Publicacion[] {
  return [...publicaciones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
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

// Es el unico valorFront de mas de una palabra, asi que es el unico que no se puede mostrar tal
// cual: la clase capitalize del template no toca el guion bajo y se leia "Perro_y_gato". Los
// textos ya vienen capitalizados y son los mismos que muestra el <select> del formulario.
const TIPO_MASCOTAS_EN_HOGAR_A_TEXTO: Record<TipoMascotasEnHogar, string> = {
  perro: 'Perro',
  gato: 'Gato',
  perro_y_gato: 'Perro y gato',
};

export function tipoMascotasEnHogarATexto(
  tipo: TipoMascotasEnHogar | null | undefined,
): string | null {
  if (!tipo) return null;

  // Se pasa a minusculas antes de buscar porque el campo puede llegar como nombre de constante
  // ("PERRO_Y_GATO") en vez de valorFront; sin esto el lookup daria undefined y el dato se veria
  // en blanco, que es peor que verlo feo. El replace cubre lo mismo para un valor no mapeado.
  const clave = tipo.toLowerCase() as TipoMascotasEnHogar;

  return TIPO_MASCOTAS_EN_HOGAR_A_TEXTO[clave] ?? clave.replace(/_/g, ' ');
}

// MANUAL no tiene texto: ese rechazo ya lo explica comentarioResolucion, no hace falta mostrarlo.
const MOTIVO_RECHAZO_A_TEXTO: Record<MotivoRechazo, string | null> = {
  manual: null,
  auto_otra_aprobada: 'La mascota fue adoptada por otro miembro.',
  auto_publicacion_eliminada: 'La publicación ha sido eliminada.',
  auto_cambio_estado_mascota: 'La mascota ha dejado de estar en adopción.',
  auto_baja_cuenta: 'La cuenta del publicador fue dada de baja.',
};

export function motivoRechazoATexto(motivo: MotivoRechazo): string | null {
  return MOTIVO_RECHAZO_A_TEXTO[motivo];
}
