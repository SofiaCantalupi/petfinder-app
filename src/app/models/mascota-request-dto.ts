// Nombres de las constantes del enum Java (EstadoMascota/TipoMascota), tal como los
// espera POST/PUT /mascotas — distinto del "valorFront" que devuelven las respuestas.
export type EstadoMascotaConstante =
  | 'PERDIDA'
  | 'ENCONTRADA'
  | 'REENCONTRADA'
  | 'EN_ADOPCION'
  | 'ADOPTADA';
export type TipoMascotaConstante = 'PERRO' | 'GATO';

export interface MascotaRequestDTO {
  nombre?: string;
  estadoMascota: EstadoMascotaConstante;
  tipoMascota: TipoMascotaConstante;
  urlFoto?: string;
}
