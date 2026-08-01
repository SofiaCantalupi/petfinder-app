import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Miembro } from '../models/miembro';
import { Observable, map, tap } from 'rxjs';
import { DATABASE_BASE_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class MiembroService {
  private http = inject(HttpClient);

  private readonly urlApi = `${DATABASE_BASE_URL}/miembros`;

  private miembrosState = signal<Miembro[]>([]);
  public readonly miembros = this.miembrosState.asReadonly();

  // obtener todos los miembros activos (para admin) - el backend ya filtra activo=true solo
  getAllMiembros(): Observable<Miembro[]> {
    return this.http
      .get<Miembro[]>(this.urlApi)
      .pipe(tap((miembros) => this.miembrosState.set(miembros)));
  }

  // el propio usuario actualiza su nombre/apellido (el id sale del JWT, no se manda)
  actualizarMiembro(cambios: { nombre: string; apellido: string }): Observable<Miembro> {
    return this.http.put<Miembro>(`${this.urlApi}/modificar-datos`, cambios);
  }

  // baja logica de la cuenta propia. El backend cascadea publicaciones, mascotas y comentarios solo.
  eliminarCuentaPropia(): Observable<void> {
    return this.http
      .delete(`${this.urlApi}/cuenta`, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  // uso exclusivo de administrador: baja logica de OTRO miembro por id
  eliminarMiembroPorId(id: number): Observable<void> {
    return this.http.delete(`${this.urlApi}/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        this.miembrosState.update((miembros) => miembros.filter((m) => m.id !== id));
      }),
      map(() => undefined),
    );
  }
}
