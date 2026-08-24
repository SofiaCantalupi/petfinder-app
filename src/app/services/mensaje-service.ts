import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DATABASE_BASE_URL } from '../constants';
import { ConversacionDetailDTO, MensajeDetailDTO, MensajeRequestDTO } from '../models/chat';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/mensajes`;

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Estado compartido: lo consumen el listado y el badge del header, que son componentes
  // distintos y tienen que ver siempre el mismo conteo.
  private conversacionesState = signal<ConversacionDetailDTO[]>([]);
  public conversaciones = this.conversacionesState.asReadonly();

  // Distingue "todavia no se pidio la lista" de "se pidio y vino vacia": mirando solo el largo
  // de conversaciones() las dos situaciones son identicas, y el chat dibujaria el estado vacio
  // durante la carga.
  private listaCargadaState = signal(false);
  public listaCargada = this.listaCargadaState.asReadonly();

  // Total de mensajes sin leer para el badge. Va derivado de la lista y no como un signal
  // aparte (a diferencia de NotificacionService) porque el backend no tiene un endpoint de
  // conteo tipo /notificaciones/no-leidas/cantidad: el único dato es mensajesNoLeidos por
  // conversación. Al ser computed no puede quedar desincronizado de la lista.
  public noLeidos = computed(() =>
    this.conversacionesState().reduce(
      (total, conversacion) => total + conversacion.mensajesNoLeidos,
      0,
    ),
  );

  // El estado es por usuario. Sin esto, al cerrar sesion y entrar con otra cuenta el badge del
  // header muestra el conteo del usuario anterior hasta que resuelve el primer fetch. Se mira el
  // id y no solo el logout, asi tambien cubre la sesion vencida y el login con otra cuenta.
  private idUsuarioEnEstado = this.authService.usuarioId();

  constructor() {
    effect(() => {
      const id = this.authService.usuarioId();
      if (id === this.idUsuarioEnEstado) return;

      this.idUsuarioEnEstado = id;
      this.limpiar();
    });
  }

  limpiar(): void {
    this.conversacionesState.set([]);
    this.listaCargadaState.set(false);
  }

  // Devuelve el Observable en vez de suscribirse acá porque el chat necesita
  // la respuesta (201 + MensajeDetailDTO) para reemplazar la burbuja optimista por el mensaje real.
  enviarMensaje(request: MensajeRequestDTO): Observable<MensajeDetailDTO> {
    return this.http.post<MensajeDetailDTO>(this.apiUrl, request);
  }

  // desdeId es el corte incremental del backend (@RequestParam con defaultValue "0"): en 0 trae
  // la conversación completa. Queda expuesto para la capa de polling que se agrega después.
  obtenerConversacion(idMiembro: number, desdeId = 0): Observable<MensajeDetailDTO[]> {
    return this.http.get<MensajeDetailDTO[]>(`${this.apiUrl}/conversacion/${idMiembro}`, {
      params: { desdeId },
    });
  }

  // Responde 204 No Content
  marcarLeidos(idMiembro: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/conversacion/${idMiembro}/leidos`, null).pipe(
      // Se descuenta en el estado local igual que marcarComoLeida en NotificacionService: el
      // badge baja apenas responde el PUT, sin esperar a que vuelva a pedirse la lista.
      tap(() => {
        this.conversacionesState.update((conversaciones) =>
          conversaciones.map((conversacion) =>
            conversacion.idMiembro === idMiembro
              ? { ...conversacion, mensajesNoLeidos: 0 }
              : conversacion,
          ),
        );
      }),
    );
  }

  listarConversaciones(): Observable<ConversacionDetailDTO[]> {
    return this.http.get<ConversacionDetailDTO[]>(`${this.apiUrl}/conversaciones`).pipe(
      tap((data) => {
        this.conversacionesState.set(data);
        this.listaCargadaState.set(true);
      }),
    );
  }
}
