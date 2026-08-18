import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DATABASE_BASE_URL } from '../constants';
import { ConversacionDetailDTO, MensajeDetailDTO, MensajeRequestDTO } from '../models/chat';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/mensajes`;

  private http = inject(HttpClient);

  // Devuelve el Observable en vez de suscribirse acá porque el chat necesita
  // la respuesta (201 + MensajeDetailDTO) para reemplazar la burbuja optimista por el mensaje real.
  enviarMensaje(request: MensajeRequestDTO): Observable<MensajeDetailDTO> {
    return this.http.post<MensajeDetailDTO>(this.apiUrl, request);
  }

  // desdeId es el corte incremental del backend (@RequestParam con defaultValue "0"): en 0 trae
  // la conversación completa. Queda expuesto para la capa de polling que se agrega después.
  obtenerConversacion(idMiembro: number, desdeId = 0): Observable<MensajeDetailDTO[]> {
    return this.http.get<MensajeDetailDTO[]>(`${this.apiUrl}/conversacion/${idMiembro}`, {
      params: { desdeId },
    });
  }

  // Responde 204 No Content
  marcarLeidos(idMiembro: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/conversacion/${idMiembro}/leidos`, null);
  }

  listarConversaciones(): Observable<ConversacionDetailDTO[]> {
    return this.http.get<ConversacionDetailDTO[]>(`${this.apiUrl}/conversaciones`);
  }
}
