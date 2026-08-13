import { Injectable, signal, computed } from '@angular/core';
import { EstadoMascota, Publicacion } from '../models/publicacion';
import { PublicacionRequestDTO } from '../models/publicacion-request-dto';
import { PublicacionRequestUpdateDTO } from '../models/publicacion-request-update-dto';
import { HttpClient } from '@angular/common/http';
import { finalize, map, tap } from 'rxjs';
import { DATABASE_BASE_URL } from '../constants';
import { estadoMascotaAConstante } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class PublicacionService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/publicaciones`;

  // al actualizar publicacionesState cada vez que se realiza una baja pasiva o una actualizacion, este contiene solo las publicaciones ACTIVAS
  private publicacionesState = signal<Publicacion[]>([]);

  public publicaciones = this.publicacionesState.asReadonly();

  // true mientras se resuelve el GET inicial de publicaciones (util para mostrar loading/skeletons)
  private loadingState = signal<boolean>(true);

  public isLoading = this.loadingState.asReadonly();

  // computed usado para filtrar publicaciones activas, filtra solo cuando hay cambios
  public publicacionesActivas = computed(() =>
    this.publicacionesState().filter((publicacion) => publicacion.activo === true),
  );

  public publicacionesReencontrados = computed(() =>
    this.publicacionesState().filter(
      (publicacion) => publicacion.activo === true && publicacion.estadoMascota === 'reencontrado',
    ),
  );

  public publicacionesAdoptados = computed(() =>
    this.publicacionesState().filter(
      (publicacion) => publicacion.activo === true && publicacion.estadoMascota === 'adoptado',
    ),
  );

  constructor(private http: HttpClient) {
    this.getPublicaciones();
  }

  getPublicaciones() {
    this.loadingState.set(true);
    this.http
      .get<Publicacion[]>(this.apiUrl)
      .pipe(finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: (data) => {
          this.publicacionesState.set(data);
        },
        error: (error) => {
          console.log('Error al obtener publicaciones', error);
        },
      });
  }

  // publicaciones del usuario logueado (incluye inactivas). El id sale del JWT, no se manda por parametro.
  getPublicacionesByMiembro() {
    return this.http.get<Publicacion[]>(`${this.apiUrl}/propias`);
  }

  postPublicacion(nuevaPublicacion: PublicacionRequestDTO) {
    return this.http.post<Publicacion>(this.apiUrl, nuevaPublicacion).pipe(
      tap((data) => {
        this.publicacionesState.update((publicaciones) => [...publicaciones, data]);
      }),
    );
  }

  updatePublicacion(id: number, cambios: PublicacionRequestUpdateDTO) {
    return this.http.put<Publicacion>(`${this.apiUrl}/${id}`, cambios).pipe(
      tap((data) => {
        this.publicacionesState.update((publicaciones) =>
          publicaciones.map((pub) => (pub.id === id ? data : pub)),
        );
      }),
    );
  }

  // Baja logica de una publicacion propia (el backend cascadea mascota, ubicacion y comentarios)
  deletePublicacion(id: number) {
    return this.http.delete(`${this.apiUrl}/propia/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.publicacionesState.update((publicaciones) =>
          publicaciones.filter((pub) => pub.id !== id),
        );
      }),
      map(() => undefined),
    );
  }

  getPublicacionById(id: number) {
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }

  // Actualiza el estado de la mascota. El estado va en la URL como constante del backend
  // (PERDIDA/ENCONTRADA/REENCONTRADA), sin body.
  updateEstadoMascota(id: number, estadoNuevo: EstadoMascota) {
    const estadoConstante = estadoMascotaAConstante(estadoNuevo);

    return this.http.put<Publicacion>(`${this.apiUrl}/${id}/estado/${estadoConstante}`, null).pipe(
      tap((publicacionActualizada) => {
        this.publicacionesState.update((publicacionesActuales) =>
          publicacionesActuales.map((p) => (p.id === id ? publicacionActualizada : p)),
        );
      }),
    );
  }
}
