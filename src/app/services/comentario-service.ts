import { Injectable, signal } from '@angular/core';
import { Comentario } from '../models/comentario';
import { ComentarioRequestDTO } from '../models/comentario-request-dto';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { DATABASE_BASE_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/comentarios`;
  private comentariosState = signal<Comentario[]>([]);
  public comentarios = this.comentariosState.asReadonly();

  constructor(private http: HttpClient) {}

  // el backend ya devuelve solo los comentarios activos de la publicación
  getComentariosByPublicacion(idPublicacion: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}/publicacion/${idPublicacion}`).pipe(
      tap((data) => {
        this.comentariosState.set(data);
      }),
    );
  }

  postComentario(nuevoComentario: ComentarioRequestDTO): Observable<Comentario> {
    return this.http.post<Comentario>(this.apiUrl, nuevoComentario).pipe(
      tap((data) => {
        this.comentariosState.update((comentarios) => [...comentarios, data]);
      }),
    );
  }

  deleteComentario(id: number): Observable<void> {
    return this.http.delete(`${this.apiUrl}/propio/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.comentariosState.update((comentarios) => comentarios.filter((com) => com.id !== id));
      }),
      map(() => undefined),
    );
  }
}
