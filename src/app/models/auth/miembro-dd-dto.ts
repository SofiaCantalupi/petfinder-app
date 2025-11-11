//Estos son los datos que se guardan en la Base de datos.
export interface MiembroDdDTO {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  contrasenia: string;
  rol: 'administrador' | 'usuario';
  activo: boolean;
}
