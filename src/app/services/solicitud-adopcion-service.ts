import { signal, Injectable, inject, computed } from '@angular/core';
import {
  SolicitudAdopcion,
  CrearSolicitudDto,
  ResolverSolicitudDto,
  EstadoSolicitud,
} from '../models/solicitud-adopcion';
import { HttpClient } from '@angular/common/http';
import { PublicacionService } from './publicacion-service';
import { MiembroService } from './miembro-service';
import { AuthService } from './auth-service';
import { map, of, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SolicitudAdopcionService {
  //CAMBIAR por la URL real del backend (http://localhost:8080/solicitudes)
  private readonly apiUrl = 'http://localhost:3000/solicitudes';

  private publicacionService = inject(PublicacionService);
  private miembroService = inject(MiembroService);
  private authService = inject(AuthService);

  // Simula el GET
  private solicitudesState = signal<SolicitudAdopcion[]>([]);
  public solicitudes = this.solicitudesState.asReadonly();

  // Enviadas: solicitudes que fueron enviadas por el miembro loggeado.
  public enviadas = computed(() => {
    const idMiembro = this.authService.usuarioId();
    if (idMiembro === null) return [];

    return this.solicitudesState().filter((s) => s.idMiembroSolicitante === idMiembro);
  });

  // Recibidas: solicitudes que corresponden al miembro loggeado.
  public recibidas = computed(() => {
    const idMiembro = this.authService.usuarioId();
    if (idMiembro === null) return [];

    const idsPublicacionesPropias = new Set(
      this.publicacionService
        .publicaciones()
        .filter((p) => p.idMiembro === idMiembro)
        .map((p) => p.id),
    );

    return this.solicitudesState().filter((s) => idsPublicacionesPropias.has(s.idPublicacion));
  });

  constructor(private http: HttpClient) {
    this.getSolicitudes();
  }

  // BORRAR - no existe un GET publicaciones, el backend real obtiene por listarenviadas y listarrecibidas
  getSolicitudes() {
    this.http.get<SolicitudAdopcion[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.solicitudesState.set(data);
      },
      error: (error) => {
        console.log('Error al obtener solicitudes de adopcion', error);
      },
    });
  }

  getSolicitudById(id: number) {
    return this.http.get<SolicitudAdopcion>(`${this.apiUrl}/${id}`);
  }

  // Backend real: GET /solicitudes/recibidas?estado=...
  listarRecibidas(estado?: EstadoSolicitud) {
    const url = estado ? `${this.apiUrl}/recibidas?estado=${estado}` : `${this.apiUrl}/recibidas`;

    return this.http.get<SolicitudAdopcion[]>(url);
  }

  // Backend real: GET /solicitudes/enviadas?estado
  listarEnviadas(estado?: EstadoSolicitud) {
    const url = estado ? `${this.apiUrl}/enviadas?estado=${estado}` : `${this.apiUrl}/enviadas`;
    return this.http.get<SolicitudAdopcion[]>(url);
  }

  // BORRAR BLOQUE MOCK ->  se borra al integrar con el backend real.
  // El backend real recibe solo el CrearSolicitudDto y calcula estos campos  POST /solicitudes, body = SolicitudAdopcionRequestDTO
  // a partir de la Publicacion y el Miembro que ya tiene en la base de datos.
  crear(dto: CrearSolicitudDto) {
    const miembro = this.authService.getCurrentUser();
    if (!miembro) {
      throw new Error('No hay un miembro logueado.');
    }

    // --- INICIO BLOQUE MOCK ---
    const publicacion = this.publicacionService
      .publicaciones()
      .find((p) => p.id === dto.idPublicacion);
    if (!publicacion) {
      throw new Error('No se encontró la publicación con el id proporcionado.');
    }

    // --- FIN BLOQUE MOCK ---

    // CAMBIAR Backend real: return this.http.post<SolicitudAdopcion>(this.apiUrl, dto)

    // se busca el miembro dueño de la publicacion para completar 'nombreCompletoMiembroPublicacion' (BLOQUE MOCK)
    return this.miembroService.getMiembroById(publicacion.idMiembro).pipe(
      switchMap((miembroPublicacion) => {
        const datosMock = {
          estado: 'pendiente' as EstadoSolicitud,
          fecha: new Date().toISOString(),
          idMiembroSolicitante: miembro.id,
          nombreCompletoSolicitante: `${miembro.nombre} ${miembro.apellido}`,
          nombreCompletoMiembroPublicacion: `${miembroPublicacion.nombre} ${miembroPublicacion.apellido}`,
          fechaResolucion: null,
          comentarioResolucion: null,
          motivoRechazo: null,
          nombreMascota: publicacion.nombreMascota,
          estadoMascota: publicacion.estadoMascota,
          tipoMascota: publicacion.tipoMascota,
          celular: dto.celular,
        };

        const payload = { ...dto, ...datosMock };

        return this.http.post<SolicitudAdopcion>(this.apiUrl, payload);
      }),
      tap((data) => {
        this.solicitudesState.update((solicitudes) => [...solicitudes, data]);
      }),
    );
  }

  // Backend real: PUT /solicitudes/estado/{id}, body = ResolucionSolicitudRequestDTO
  resolver(id: number, resolucion: ResolverSolicitudDto) {
    // CAMBIAR se usa PATCH con json-server para no pisar el resto de campos del recurso.
    const payload = {
      ...resolucion,
      fechaResolucion: new Date().toISOString(), // MOCK: el backend real la calcula solo
    };

    // CAMBIAR return this.http.put<SolicitudAdopcion>(`${this.apiUrl}/estado/${id}`, resolucion).pipe(...)
    return this.http.patch<SolicitudAdopcion>(`${this.apiUrl}/${id}`, payload).pipe(
      // si se aprueba la solicitud, la mascota de la publicacion pasa a estado "adoptado" (BLOQUE MOCK)
      switchMap((data) => {
        if (data.estado === 'aprobada') {
          return this.publicacionService
            .updateEstadoMascota(data.idPublicacion, 'adoptado')
            .pipe(map(() => data));
        }
        return of(data);
      }),
      tap((data) => {
        this.solicitudesState.update((solicitudes) =>
          solicitudes.map((s) => (s.id === id ? data : s))
        );
      })
    );
  }

  // Backend real: PUT /solicitudes/cancelar/{id}, sin body
  cancelar(id: number) {
    // CAMBIAR: se manda el campo a cambiar porque json-server no tiene lógica propia,
    // solo persiste lo que le llega.
    const payload = { estado: 'cancelada' as EstadoSolicitud };

    // CAMBIAR return this.http.put<SolicitudAdopcion>(`${this.apiUrl}/cancelar/${id}`, {}).pipe(...)
    return this.http.patch<SolicitudAdopcion>(`${this.apiUrl}/${id}`, payload).pipe(
      tap((data) => {
        this.solicitudesState.update((solicitudes) =>
          solicitudes.map((s) => (s.id === id ? data : s))
        );
      })
    );
  }
}
