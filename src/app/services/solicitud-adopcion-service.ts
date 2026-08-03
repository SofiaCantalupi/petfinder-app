import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, switchMap, tap } from 'rxjs';
import {
  EstadoSolicitud,
  ResolucionSolicitudRequestDTO,
  SolicitudAdopcion,
  SolicitudAdopcionRequestDTO,
} from '../models/solicitud-adopcion';
import { DATABASE_BASE_URL } from '../constants';
import { estadoSolicitudAConstante } from '../utils';

@Injectable({ providedIn: 'root' })
export class SolicitudAdopcionService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/solicitudes`;

  private http = inject(HttpClient);

  // No hay GET /solicitudes: el backend ya particiona las solicitudes en /enviadas y
  // /recibidas segun el miembro del JWT, asi que el estado local espeja esas dos listas
  // en vez de derivarlas de una sola.
  private enviadasState = signal<SolicitudAdopcion[]>([]);
  private recibidasState = signal<SolicitudAdopcion[]>([]);

  public enviadas = this.enviadasState.asReadonly();
  public recibidas = this.recibidasState.asReadonly();

  // Union sin duplicados (no se puede solicitar la adopcion de la propia publicacion),
  // usada por el detalle para ubicar una solicitud por id sin GET /solicitudes/{id}.
  public solicitudes = computed(() => [...this.enviadasState(), ...this.recibidasState()]);

  getEnviadas(estado?: EstadoSolicitud): Observable<SolicitudAdopcion[]> {
    return this.http
      .get<SolicitudAdopcion[]>(`${this.apiUrl}/enviadas`, { params: this.paramsEstado(estado) })
      .pipe(tap((data) => this.enviadasState.set(data ?? [])));
  }

  getRecibidas(estado?: EstadoSolicitud): Observable<SolicitudAdopcion[]> {
    return this.http
      .get<SolicitudAdopcion[]>(`${this.apiUrl}/recibidas`, { params: this.paramsEstado(estado) })
      .pipe(tap((data) => this.recibidasState.set(data ?? [])));
  }

  // El listado y el detalle necesitan las dos listas: se piden juntas para que el estado
  // quede consistente y un solo subscribe cubra el cargando/error.
  refrescar() {
    return forkJoin({ enviadas: this.getEnviadas(), recibidas: this.getRecibidas() });
  }

  // La solicitud creada siempre es propia, asi que va a "enviadas".
  crear(dto: SolicitudAdopcionRequestDTO): Observable<SolicitudAdopcion> {
    return this.http
      .post<SolicitudAdopcion>(this.apiUrl, dto)
      .pipe(tap((data) => this.enviadasState.update((actuales) => [...actuales, data])));
  }

  // Aprobar tiene efectos de lado en el servidor que NO vienen en la respuesta: la mascota
  // pasa a ADOPTADA y el resto de las solicitudes pendientes de esa publicacion se rechazan
  // en cascada. Por eso se releen las dos listas en vez de parchear el estado local con la
  // unica solicitud que devuelve el endpoint.
  resolver(id: number, resolucion: ResolucionSolicitudRequestDTO): Observable<SolicitudAdopcion> {
    return this.http
      .put<SolicitudAdopcion>(`${this.apiUrl}/estado/${id}`, resolucion)
      .pipe(switchMap((resuelta) => this.refrescar().pipe(map(() => resuelta))));
  }

  // Sin body y sin cascada: solo afecta a la propia solicitud, alcanza con parchear enviadas.
  cancelar(id: number): Observable<SolicitudAdopcion> {
    return this.http.put<SolicitudAdopcion>(`${this.apiUrl}/cancelar/${id}`, null).pipe(
      tap((data) => {
        this.enviadasState.update((actuales) => actuales.map((s) => (s.id === id ? data : s)));
      }),
    );
  }

  // El backend convierte con EstadoSolicitud.valueOf(estado.toUpperCase()): espera el nombre
  // de la constante, no el valorFront.
  private paramsEstado(estado?: EstadoSolicitud) {
    return estado ? new HttpParams().set('estado', estadoSolicitudAConstante(estado)) : undefined;
  }
}
