import { Injectable, signal, computed } from '@angular/core';
import { EstadoMascota, Publicacion } from '../models/publicacion';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicacionService {
  private readonly apiUrl = 'http://localhost:3000/publicaciones';

  private publicacionesState = signal<Publicacion[]>([]);

  public publicaciones = this.publicacionesState.asReadonly();

  // computed usado para filtrar publicaciones activas, filtra solo cuando hay cambios
  public publicacionesActivas = computed(() =>
    this.publicacionesState().filter((publicacion) => publicacion.activo === true)
  );

  public publicacionesReencontrados = computed(() =>
    this.publicacionesState().filter(
      (publicacion) => publicacion.activo === true && publicacion.estadoMascota === 'reencontrado'
    )
  );

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
    return this.http.post<Publicacion>(this.apiUrl, nuevaPublicacion).pipe(
      tap((data) => {
        this.publicacionesState.update((publicaciones) => [...publicaciones, data]);
      })
    );
  }

  putPublicacion(id: number, nuevaPublicacion: Omit<Publicacion, 'id'>) {
    return this.http.put<Publicacion>(`${this.apiUrl}/${id}`, nuevaPublicacion).pipe(
      tap((data) => {
        this.publicacionesState.update((publicaciones) =>
          publicaciones.map((pub) => (pub.id === id ? data : pub))
        );
      })
    );
  }

  deletePublicacion(id: number) {
    return this.getPublicacionById(id).pipe(
      switchMap((publicacion) => {
        // cambia el estado activo a false (baja pasiva)
        const publicacionActualizada = {
          ...publicacion,
          activo: false,
        };

        // PUT con la publicacion actualizada
        return this.http.put<Publicacion>(`${this.apiUrl}/${id}`, publicacionActualizada);
      }),
      tap(() => {
        // actualizar el state removiendo la publicacion eliminada
        this.publicacionesState.update((publicaciones) =>
          publicaciones.filter((pub) => pub.id !== id)
        );
      })
    );
  }

  getPublicacionById(id: number) {
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }

  // Actualiza el estado de la mascota en el backend y luego actualiza el estado local (signal).
  updateEstadoMascota(id: number, estadoNuevo: EstadoMascota){
    // constante con solo que se modifica
    const payload = { estadoMascota: estadoNuevo };

    return this.http.patch<Publicacion>(`${this.apiUrl}/${id}`, payload).pipe(
      // se actualiza el signal (estado local)
      tap((publicacionActualizada) => {
        // la API devuelve la publicacion completa actualizada
        this.publicacionesState.update((publicacionesActuales) => {
          return publicacionesActuales.map((p) => {
            // si el ID coincide, reemplazamos el objeto con la version recibida del servidor
            if (p.id === id) {
              return publicacionActualizada;
            }
            // sino se devuelve la publicacion origianl
            return p;
          });
        });
      })
    );
  }
}
