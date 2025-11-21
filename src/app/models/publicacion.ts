//Union type
export type EstadoMascota = 'perdido' | 'encontrado' | 'reencontrado';
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
    calle: string,
    altura: number,
    latitud: number,
    longitud: number
}
