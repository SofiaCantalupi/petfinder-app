import { EstadoMascota, TipoMascota } from './publicacion';

// "valorFront" (minusculas) que devuelve SolicitudAdopcionDetailDTO en las respuestas.
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
export type TipoHogar = 'casa' | 'departamento';
export type TipoMascotasEnHogar = 'perro' | 'gato' | 'perro_y_gato';
export type MotivoRechazo =
  | 'manual'
  | 'auto_por_otra_aprobada'
  | 'auto_por_publicacion_eliminada'
  | 'auto_cambio_estado_mascota';

// Nombres de las constantes del enum Java, tal como los espera SolicitudAdopcionRequestDTO
// — distinto del "valorFront" de las respuestas. Jackson deserializa los enums tipados por
// nombre y es case-sensitive.
export type TipoHogarConstante = 'CASA' | 'DEPARTAMENTO';
export type TipoMascotasEnHogarConstante = 'PERRO' | 'GATO' | 'PERRO_Y_GATO';
export type EstadoSolicitudConstante = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
// Resolver solo admite estas dos: con PENDIENTE/CANCELADA el backend responde 400.
export type EstadoResolucionConstante = 'APROBADA' | 'RECHAZADA';

// SolicitudAdopcionDetailDTO: response de los 5 endpoints, con las relaciones aplanadas.
// No trae al dueño de la publicacion; ese dato se resuelve contra PublicacionService.
export interface SolicitudAdopcion {
  id: number;
  estado: EstadoSolicitud;
  fecha: string; // LocalDateTime -> string

  idPublicacion: number;
  nombreMascota: string | null;
  estadoMascota: EstadoMascota;
  tipoMascota: TipoMascota;

  celular: string;
  idMiembroSolicitante: number;
  nombreCompletoSolicitante: string;

  tipoHogar: TipoHogar;
  hayMascotaEnHogar: boolean;
  tipoMascotasEnHogar: TipoMascotasEnHogar | null;
  tienePatio: boolean;
  aceptaCondiciones: boolean;
  motivoAdopcion: string | null;

  fechaResolucion: string | null; // LocalDateTime
  comentarioResolucion: string | null;
  motivoRechazo: MotivoRechazo | null;
}

// Body de POST /solicitudes. El solicitante sale del JWT, no se manda.
export interface SolicitudAdopcionRequestDTO {
  idPublicacion: number;
  celular: string;
  tipoHogar: TipoHogarConstante;
  hayMascotaEnHogar: boolean;
  // El backend valida por @AssertTrue que hayMascotaEnHogar sea true <=> este campo no sea null.
  tipoMascotasEnHogar: TipoMascotasEnHogarConstante | null;
  tienePatio: boolean;
  aceptaCondiciones: boolean;
  motivoAdopcion: string | null;
}

// Body de PUT /solicitudes/estado/{id}
export interface ResolucionSolicitudRequestDTO {
  estado: EstadoResolucionConstante;
  comentarioResolucion: string | null;
}

// Fila del listado de enviadas: la solicitud mas el nombre del dueño de la publicacion,
// que el backend no manda y se completa cruzando contra GET /publicaciones.
export interface SolicitudEnviadaVista extends SolicitudAdopcion {
  nombreCompletoMiembroPublicacion: string;
}
