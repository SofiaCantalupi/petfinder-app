export interface Comentario {
  id: number;
  texto: string;
  fechaPublicacion: string; // ISO string format: "2024-11-13"
  activo: boolean;
  publicacionId: number;
  miembroId: number;
  miembroNombre: string;
  miembroApellido: string;
}
