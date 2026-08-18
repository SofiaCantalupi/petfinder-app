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
    fechaUltimoMensaje: string; // LocalDateTime -> string
}

// Estado local de una burbuja: el POST tarda en responder, asi que el mensaje se pinta apenas
// se envia ('enviando') y cambia segun el resultado, sin desaparecer nunca de la lista.
export type EstadoMensaje = 'enviando' | 'enviado' | 'error';

// Vista de un mensaje dentro del chat. No viene del backend: MensajeDetailDTO no trae ni
// 'esPropio' (se deriva comparando idEmisor con el usuario logueado) ni 'estado'.
export interface MensajeVM {
    idLocal: number; // clave estable para el @for: el id real recien llega en la respuesta del POST
    id: number | null;
    texto: string;
    fechaEnvio: string;
    esPropio: boolean;
    estado: EstadoMensaje;
}
