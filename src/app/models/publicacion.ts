//Union type
export type EstadoMascota = 'perdido' | 'encontrado' | 'reencontrado' | 'en_adopcion' | 'adoptado';
export type TipoMascota = 'perro' | 'gato';

export interface Publicacion{
    id: number,
    idMiembro: number,
    activo: boolean,
    nombreMascota: string,
    tipoMascota: TipoMascota,
    estadoMascota: EstadoMascota,
    urlFoto: string,
    fecha: string,
    descripcion: string,
    ubicacion: string,
    latitud: string,
    longitud: string,
}
