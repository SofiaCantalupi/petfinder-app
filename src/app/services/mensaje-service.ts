import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DATABASE_BASE_URL } from '../constants';
import { ConversacionDetailDTO, MensajeDetailDTO } from '../models/chat';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/mensajes`;

  private http = inject(HttpClient);

  enviarMensaje(request: MensajeDetailDTO, idEmisor: number) {
    this.http.post(`${this.apiUrl}/${idEmisor}`, request).subscribe({
      next: (data) => {
        console.log('Mensaje enviado', data);
      },
      error: (error) => {
        console.log('Error al enviar mensaje', error);
      },
    });
  }

  obtenerConversacion(desdeId = 0): Observable<MensajeDetailDTO[]> {
    return this.http.get<MensajeDetailDTO[]>('${this.apiUrl}/conversacion/${idMiembro}',{params: {desdeId}})
  }

  marcarLeidos(idMiembro:number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/conversacion/${idMiembro}/leidos`, null);
  }

  listarConversaciones(): Observable<ConversacionDetailDTO[]> {
    return this.http.get<ConversacionDetailDTO[]>(`${this.apiUrl}/conversaciones`);
  }
}
