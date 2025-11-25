import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { Miembro } from '../models/miembro';
import { forkJoin, Observable } from 'rxjs';
import { tap } from 'rxjs';
import { computed } from '@angular/core';
import { DATABASE_BASE_URL } from '../constants';
import { PublicacionService } from './publicacion-service';
import { ComentarioService } from './comentario-service';
import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root',
})
export class MiembroService {
  private http = inject(HttpClient);
  private publicacionService = inject(PublicacionService);
  private comentarioService = inject(ComentarioService);
  private toastService = inject(ToastService);

  private readonly urlApi = `${DATABASE_BASE_URL}/miembros`;

  // Señal para muchos miembros
  private miembrosState = signal<Miembro[]>([]);
  public readonly miembros = this.miembrosState.asReadonly();

  // Señal para un miembro individual
  private miembroState = signal<Miembro | null>(null);
  public readonly miembro = this.miembroState.asReadonly();

  //Guarda el miembro presente en la señal MiembroState.
  public readonly isLoaded = computed(() => this.miembro() !== null);
  //Guarda el ID de ese miembro cargado.
  public readonly miembroId = computed(() => this.miembro()?.id);

  // obtener todos los miembros activos (para admin)
  getAllMiembros(): Observable<Miembro[]> {
    return this.http
      .get<Miembro[]>(`${this.urlApi}?activo=true`)
      .pipe(tap((miembros) => this.miembrosState.set(miembros)));
  }
  //Obtiene un miembro por ID y actualiza el state
  getMiembroById(id: number): Observable<Miembro> {
    return this.http
      .get<Miembro>(`${this.urlApi}/${id}`)
      .pipe(tap((miembro) => this.miembroState.set(miembro)));
  }

  //Carga el miembro desde localStorage (sesión activa)
  cargarMiembroActual(): Observable<Miembro> | null {
    const authData = localStorage.getItem('currentUser'); //Trae a una constante los datos que haya en el LocalStorage
    if (!authData) return null; //Si esta vacio, retorna null.

    try {
      const { id } = JSON.parse(authData);
      return this.getMiembroById(id); //Obtiene el miembro por su ID y lo retorna.
    } catch (error) {
      console.error('Error al parsear datos de auth:', error);
      return null;
    }
  }
  actualizarMiembro(id: number, cambios: Partial<Omit<Miembro, 'id'>>) {
    return this.http.patch<Miembro>(`${this.urlApi}/${id}`, cambios).pipe(
      tap((data) => {
        this.miembrosState.update((miembros) => miembros.map((m) => (m.id === id ? data : m)));
      })
    );
  }

  // baja logica del miembro 
  darDeBajaMiembro(id: number): Observable<Miembro> {
    const payload = { activo: false };

    return this.http.patch<Miembro>(`${this.urlApi}/${id}`, payload).pipe(
      tap(() => {
        this.miembrosState.update((miembros) => miembros.filter((m) => m.id !== id));
      })
    );
  }

  eliminarMiembro(miembro: Miembro): void {
      // primero: Eliminar comentarios del miembro
      // segundo: Eliminar publicaciones del miembro
      // tercero: Eliminar el miembro
      forkJoin({
        comentarios: this.comentarioService.deleteComentariosByMiembro(miembro.id),
        publicaciones: this.publicacionService.deletePublicacionesByMiembro(miembro.id),
      }).subscribe({
        next: ({ comentarios, publicaciones }) => {
          console.log(`Eliminados ${comentarios.length} comentarios`);
          console.log(`Eliminadas ${publicaciones.length} publicaciones`);
  
          // aca elimina el miembro
          this.darDeBajaMiembro(miembro.id).subscribe({
            next: () => {
              this.toastService.showToast(
                `Usuario ${miembro.nombre} ${miembro.apellido} eliminado correctamente`,
                'success'
              );
            },
            error: (error) => {
              console.error('Error eliminando miembro:', error);
              this.toastService.showToast('Error al eliminar usuario', 'error');
            },
          });
        },
        error: (error) => {
          console.error('Error eliminando datos relacionados:', error);
          this.toastService.showToast('Error al eliminar datos del usuario', 'error');
        },
      });
    }
}
