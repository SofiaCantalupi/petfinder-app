import { RolUsuario } from './rol-usuario';

//Respuesta de POST /auth/login. No incluye email ni activo (a diferencia de MiembroDetailDTO).
export interface AuthResponseDTO {
  token: string;
  id: number;
  nombre: string;
  apellido: string;
  rol: RolUsuario;
}
