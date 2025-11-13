//DTO que va a leer los datos del registroDTO y lo va a transformar a un miembro de la base de datos.
//No incluye ID porque este es generado por JsonServer
export interface CrearMiembroDTO {
  nombre: string;
  apellido: string;
  email: string;
  contrasenia: string;
  rol: 'administrador' | 'usuario';
  activo: boolean;
}
