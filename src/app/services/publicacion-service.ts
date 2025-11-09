import { Injectable, signal } from '@angular/core';
import { Publicacion } from '../models/publicacion';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicacionService {
  private readonly apiUrl = 'http://localhost:3000/publicaciones';

  private publicacionesState = signal<Publicacion[]>([]);

  public publicaciones = this.publicacionesState.asReadonly();

  constructor(private http: HttpClient) {
    this.getPublicaciones();
  }

  getPublicaciones() {
    this.http.get<Publicacion[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.publicacionesState.set(data);
      },
      error: (error) => {
        console.log('Error al obtener publicaciones', error);
      },
    });
  }

  postPublicacion(nuevaPublicacion: Omit<Publicacion, 'id'>) {
    return this.http
      .post<Publicacion>(this.apiUrl, nuevaPublicacion)
      .pipe(
        tap((data) => {
          this.publicacionesState.update((publicaciones) => [...publicaciones, data]);
        })
      )
  }

  putPublicacion(id: number, nuevaPublicacion: Omit<Publicacion, 'id'>) {
    return this.http.put<Publicacion>(`${this.apiUrl}/${id}`, nuevaPublicacion).pipe(
      tap((data) => {
        this.publicacionesState.update((publicaciones) =>
          publicaciones.map((pub) => (pub.id === id ? data : pub))
        );
      })
    )
  }

  deletePublicacion(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.publicacionesState.update((publicaciones) =>
          publicaciones.filter((pub) => pub.id !== id)
        );
      })
    )
  }

  getPublicacionById(id: number){
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }
}
