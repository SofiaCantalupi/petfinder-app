import { RolUsuario } from './rol-usuario';

//Respuesta de POST /auth/registro y de los endpoints de /miembros. Nunca expone la contraseña.
export interface MiembroDetailDTO {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}
