import { Publicacion } from './publicacion';

export interface paginatedResponse {
  data: Publicacion[];
  total: number;
}
