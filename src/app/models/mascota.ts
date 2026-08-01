import { EstadoMascota, TipoMascota } from './publicacion';

export interface Mascota {
  id: number;
  nombre: string | null;
  estadoMascota: EstadoMascota;
  tipoMascota: TipoMascota;
  activo: boolean;
  urlFoto: string | null;
}
