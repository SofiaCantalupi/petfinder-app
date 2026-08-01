import { UbicacionRequestDTO } from './ubicacion-request-dto';

export interface PublicacionRequestDTO {
  descripcion: string;
  mascotaId: number;
  ubicacion: UbicacionRequestDTO;
}
