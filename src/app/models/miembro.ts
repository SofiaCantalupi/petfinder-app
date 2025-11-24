//Sacamos la contraseña para que esta sea manejada por DTOS y así no exponerla.
//De esta manera podemos usar este modelo en el LocalStorage tambien sin exponer datos sensibles.
export interface Miembro {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'administrador' | 'usuario';
  activo: boolean;
}
