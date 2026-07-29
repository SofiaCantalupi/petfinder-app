// Union types
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
export type MotivoRechazo = 'manual' | 'auto_otra_aprobada' | 'auto_publicacion_eliminada' | 'auto_cambio_estado_mascota';
export type TipoMascotasEnHogar = 'perro' | 'gato' | 'perro_y_gato';
export type TipoHogar = 'casa' | 'departamento';

export interface SolicitudAdopcion {
    id: number;
  estado: EstadoSolicitud;
  fecha: string; // LocalDateTime -> string

  idPublicacion: number;
  nombreMascota: string;
  estadoMascota: string; 
  tipoMascota: string;   

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
  motivoRechazo: string | null;
}

// DTO para crear una nueva solicitud
export interface CrearSolicitudDto {
  idPublicacion: number;
  celular: string;
  tipoHogar: TipoHogar;
  hayMascotaEnHogar: boolean;
  tipoMascotaEnHogar?: TipoMascotasEnHogar; 
  tienePatio: boolean;
  aceptaCondiciones: boolean; 
  motivoAdopcion?: string;
}

// DTO para resolver una solicitud (aprobar o rechazar)
export interface ResolverSolicitudDto {
  estado: EstadoSolicitud; 
  comentarioResolucion?: string;
}