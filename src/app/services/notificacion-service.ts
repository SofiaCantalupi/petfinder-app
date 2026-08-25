import { computed, Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { Notificacion, TipoNotificacion } from '../models/notificacion';
import { DATABASE_BASE_URL } from '../constants';
import { ComentarioService } from './comentario-service';

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/notificaciones`;
  private comentarioService = inject(ComentarioService);

  private notificacionesState = signal<Notificacion[]>([]);

  // El backend devuelve las notificaciones en orden de insercion, asi
  // que se ordenan aca y no en cada template: por id descendente, que es el orden real de creacion.
  public notificaciones = computed(() =>
    [...this.notificacionesState()].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id),
  );

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

  // Marca como leidas las notificaciones de los tipos pedidos. Se marcan una por una. Se re-pide la lista antes de filtrar
  // porque a esta pantalla se puede llegar sin haber abierto nunca la campana, que es la unica
  // que carga notificacionesState.
  marcarTiposComoLeidas(tipos: TipoNotificacion[]): Observable<Notificacion[]> {
    return this.getNotificaciones().pipe(
      switchMap((notificaciones) => {
        const pendientes = notificaciones.filter((n) => tipos.includes(n.tipo) && !n.leida);

        // forkJoin con array vacio nunca emite: sin este corte el subscribe no se completa.
        if (pendientes.length === 0) return of([]);

        return forkJoin(pendientes.map((n) => this.marcarComoLeida(n.id)));
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
