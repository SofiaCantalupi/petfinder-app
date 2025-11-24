import { Injectable, signal } from '@angular/core';
import { Comentario } from '../models/comentario';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ComentarioService {
  //readonly: no se puede cambiar despues de definirlo
  private readonly apiUrl = 'http://localhost:3000/comentarios';
  private comentariosState = signal<Comentario[]>([]);
  //asReadonly(): los componentes no pueden modificarlo directamente, solo leerlo.
  public comentarios = this.comentariosState.asReadonly();

  constructor(private http: HttpClient) {}

  //solo muestra los comentarios activos
  getComentariosByPublicacion(publicacionId: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}?publicacionId=${publicacionId}`).pipe(
      map((comentarios) => comentarios.filter((c) => c.activo === true)),
      tap((dataFiltrada) => {
        this.comentariosState.set(dataFiltrada);
      })
    );
  }

  //Omit<Comentario, 'id'>: recibe un comentario sin el id (porque JSON server lo genera automaticamente) y luego devuelve un observable con el comentario ya creado y ya con el id
  postComentario(nuevoComentario: Omit<Comentario, 'id'>): Observable<Comentario> {
    return this.http.post<Comentario>(this.apiUrl, nuevoComentario).pipe(
      tap((data) => {
        this.comentariosState.update((comentarios) => [...comentarios, data]); //[...comentarios, data]: crea un nuevo array con todos los anteriores comentarios más el nuevo
      })
    );
  }

  deleteComentario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.comentariosState.update((comentarios) => comentarios.filter((com) => com.id !== id));
      }) //Aca tambien con filter se crea un nuevo array y con "com.id !== id" le dice que le de todos los comentarios excepto el que acaba de ser eliminado
    );
  }

  //elimina todos los comentarios asociados a un Miembro en particular
  deleteComentariosByMiembro(idMiembro: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}?miembroId=${idMiembro}`).pipe(
      switchMap((comentarios) => {
        if (comentarios.length === 0) {
          return of([]);
        }

        // baja logica en cada comentario
        const updateObservables = comentarios.map((com) =>
          this.http.patch<Comentario>(`${this.apiUrl}/${com.id}`, { activo: false })
        );

        return forkJoin(updateObservables).pipe(
          tap(() => {
            this.comentariosState.update((coms) => coms.filter((c) => c.miembroId !== idMiembro));
          }),
          map(() => comentarios)
        );
      })
    );
  }
}
