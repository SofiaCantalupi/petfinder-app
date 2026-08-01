//Union type
export type EstadoMascota = 'perdido' | 'encontrado' | 'reencontrado';
export type TipoMascota = 'perro' | 'gato';

export interface Publicacion {
  id: number;
  idMiembro: number;
  nombreCompleto: string;
  activo: boolean;
  idMascota: number;
  nombreMascota: string;
  tipoMascota: TipoMascota;
  estadoMascota: EstadoMascota;
  urlFoto: string;
  fecha: string;
  descripcion: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
}
