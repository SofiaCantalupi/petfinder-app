export interface MensajeRequestDTO{
    texto: string;
    idReceptor: number
}

export interface MensajeDetailDTO {
    id: number;
    texto: string;
    fechaEnvio: string; // LocalDateTime -> string
    leido: boolean;
    idEmisor: number;
    nombreEmisor: string;
    idReceptor: number;
    nombreReceptor: string
}

export interface ConversacionDetailDTO{
    idMiembro: number,
    nombre: string,
    apellido: string,
    mensajesNoLeidos: number,
    ultimoMensaje: string;
    LocalDateTime: string; // LocalDateTime -> string
}
