import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { Notificacion } from '../models/notificacion';
import { DATABASE_BASE_URL } from '../constants';
import { ComentarioService } from './comentario-service';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/notificaciones`;
  private comentarioService = inject(ComentarioService);

  private notificacionesState = signal<Notificacion[]>([]);
  public notificaciones = this.notificacionesState.asReadonly();

  private noLeidasState = signal<number>(0);
  public noLeidas = this.noLeidasState.asReadonly();

  constructor(private http: HttpClient) {}

  getNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.apiUrl).pipe(
      tap((data) => {
        this.notificacionesState.set(data);
      }),
    );
  }

  contarNoLeidas(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/no-leidas/cantidad`).pipe(
      tap((cantidad) => {
        this.noLeidasState.set(cantidad);
      }),
    );
  }

  marcarComoLeida(id: number): Observable<Notificacion> {
    return this.http.put<Notificacion>(`${this.apiUrl}/${id}/leida`, {}).pipe(
      tap((actualizada) => {
        this.notificacionesState.update((notificaciones) =>
          notificaciones.map((n) => (n.id === id ? actualizada : n)),
        );
        this.noLeidasState.update((cantidad) => Math.max(0, cantidad - 1));
      }),
    );
  }

  marcarTodasComoLeidas(): Observable<string> {
    return this.http.put(`${this.apiUrl}/leidas`, {}, { responseType: 'text' }).pipe(
      tap(() => {
        this.notificacionesState.update((notificaciones) =>
          notificaciones.map((n) => ({ ...n, leida: true })),
        );
        this.noLeidasState.set(0);
      }),
    );
  }

  eliminarNotificacion(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.notificacionesState.update((notificaciones) =>
          notificaciones.filter((n) => n.id !== id),
        );
      }),
    );
  }

  resolverRuta(notificacion: Notificacion): Observable<(string | number)[]> {
    if (notificacion.tipo === 'NUEVO_COMENTARIO') {
      return this.comentarioService
        .getComentarioById(notificacion.entidadReferenciaId)
        .pipe(map((comentario) => ['/publicaciones', comentario.idPublicacion]));
    }

    return of(['/solicitudes-adopcion', notificacion.entidadReferenciaId]);
  }
}
