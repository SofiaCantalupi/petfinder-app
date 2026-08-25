import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MensajeService } from '../../services/mensaje-service';
import { AuthService } from '../../services/auth-service';
import { GrupoDia, MensajeDetailDTO, MensajeVM } from '../../models/chat';
import { claveDia, formatearDiaSeparador, formatearHora } from '../../utils/fecha-chat';

// Solo corre con la conversacion abierta y la pestaña visible: el intervalo de 12s es por el free tier de Render
const INTERVALO_POLL_MS = 12_000;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [],
  templateUrl: './chat.html',
})
export class Chat {
  private mensajeService = inject(MensajeService);
  private authService = inject(AuthService);

  // No hay entidad Conversacion: la conversacion se identifica por el id del otro miembro.
  idMiembro = input<number | null>(null);
  // Lo pasa la pagina desde ConversacionDetailDTO: MensajeDetailDTO solo trae el nombre de pila.
  nombreContacto = input<string>('');

  private contenedorMensajes = viewChild<ElementRef<HTMLDivElement>>('contenedorMensajes');

  // Sin ninguna conversacion no hay nada que elegir: el listado ya avisa que no hay ninguna, asi
  // que el panel del chat no puede seguir pidiendo que se seleccione un contacto.
  sinConversaciones = computed(
    () => this.mensajeService.listaCargada() && this.mensajeService.conversaciones().length === 0,
  );

  mensajes = signal<MensajeVM[]>([]);
  cargando = signal(false);
  error = signal(false);
  borrador = signal('');

  // Contador propio para las burbujas: el id real recien llega en la respuesta del POST, y las
  // que fallan no tienen id nunca. Sirve de track estable en el @for.
  private proximoIdLocal = 0;

  // Estado del polling
  private ultimoId = 0; // corte incremental que se manda como desdeId
  private timerId: ReturnType<typeof setInterval> | null = null;
  // La subscription hace de flag de "hay un GET ocurriendo" y ademas permite cancelarlo de verdad al cambiar de contacto
  private pollSub: Subscription | null = null;
  private cargaSub: Subscription | null = null;

  // Los mensajes vienen ordenados por fecha, asi que alcanza con abrir un grupo nuevo cada vez
  // que cambia el dia respecto del mensaje anterior. De ahi sale un solo separador por dia.
  grupos = computed<GrupoDia[]>(() => {
    const grupos: GrupoDia[] = [];

    for (const mensaje of this.mensajes()) {
      const clave = claveDia(mensaje.fechaEnvio);
      const ultimo = grupos.at(-1);

      if (ultimo && ultimo.clave === clave) {
        ultimo.mensajes.push(mensaje);
      } else {
        grupos.push({
          clave,
          etiqueta: formatearDiaSeparador(mensaje.fechaEnvio),
          mensajes: [mensaje],
        });
      }
    }

    return grupos;
  });

  constructor() {
    effect(() => {
      const id = this.idMiembro();

      if (id === null) {
        this.detenerPolling();
        this.mensajes.set([]);
        return;
      }

      this.cargarConversacion(id);
    });

    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        this.detenerPolling();
        return;
      }

      // Al volver se pide enseguida en vez de esperar el intervalo entero: si la pestania estuvo
      // en segundo plano media hora, lo ultimo que se ve es de media hora atras. El orden importa:
      // iniciarPolling arranca cortando una consula existente, asi que llamarlo despues del tick
      // cancelaria la request que el tick acaba de comenzar 
      this.iniciarPolling();
      this.tick();
    };

    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    // Mismo criterio que el carrusel: al salir de la vista el timer quedaria vivo para siempre.
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      this.detenerPolling();
      this.cargaSub?.unsubscribe();
    });
  }

  private cargarConversacion(idMiembro: number): void {
    this.detenerPolling();
    // Sin esto, una carga anterior todavia ocurriendo pisaria la conversacion nueva al responder
    this.cargaSub?.unsubscribe();
    this.ultimoId = 0;

    this.cargando.set(true);
    this.error.set(false);
    this.mensajes.set([]);
    this.borrador.set('');

    this.cargaSub = this.mensajeService.obtenerConversacion(idMiembro).subscribe({
      next: (data) => {
        this.mensajes.set(data.map((mensaje) => this.aVista(mensaje)));
        this.registrarUltimoId(data);
        this.cargando.set(false);
        this.scrollAlFondo();
        this.iniciarPolling();
      },
      error: (err) => {
        console.error('Error al cargar la conversación:', err);
        this.error.set(true);
        this.cargando.set(false);
        // Se arranca igual: con ultimoId en 0 el proximo tick vuelve a pedir la conversacion
        // entera, asi un cold start de Render que freno la primera request se recupera solo.
        this.iniciarPolling();
      },
    });
  }

  private iniciarPolling(): void {
    // Limpia primero. no pueden quedar dos timers vivos.
    this.detenerPolling();
    if (this.idMiembro() === null || document.hidden) return;

    this.timerId = setInterval(() => this.tick(), INTERVALO_POLL_MS);
  }

  private detenerPolling(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  private tick(): void {
    const id = this.idMiembro();
    // El cold start de Render puede tardar unos 40s: si el GET anterior sigue sucediendo, este tick se
    // saltea en vez de encimar otra request
    if (id === null || this.pollSub !== null || this.cargando()) return;

    this.pollSub = this.mensajeService.obtenerConversacion(id, this.ultimoId).subscribe({
      next: (data) => {
        this.pollSub = null;
        // Si la carga inicial habia fallado, este es el intento que recupera la vista.
        this.error.set(false);
        this.fusionar(data);
      },
      error: (err) => {
        // Silencioso a proposito: un tick que falla no puede romper una conversacion que ya se
        // esta viendo. El proximo tick reintenta.
        console.error('Error al actualizar la conversación:', err);
        this.pollSub = null;
      },
    });
  }

  // El scroll no se toca: si el usuario esta leyendo mensajes viejos mas arriba, un mensaje que
  // entra por polling no puede moverle la vista de golpe.
  private fusionar(entrantes: MensajeDetailDTO[]): void {
    if (entrantes.length === 0) return;

    this.mensajes.update((actuales) => {
      const idsPresentes = new Set(actuales.map((mensaje) => mensaje.id));
      let resultado = actuales;
      const nuevos: MensajeVM[] = [];

      for (const entrante of entrantes) {
        // Si el backend ignorara el desdeId y devolviera la conversacion entera en cada tick,
        // esto solo gasta ancho de banda: duplicar, no duplica.
        if (idsPresentes.has(entrante.id)) continue;
        idsPresentes.add(entrante.id);

        // Carrera con el POST: la burbuja optimista todavia no tiene id, asi que el mensaje que
        // vuelve del poll es el mismo que ya se esta viendo. Se adopta en vez de duplicar.
        const optimista = resultado.find(
          (mensaje) =>
            mensaje.id === null && mensaje.estado === 'enviando' && mensaje.texto === entrante.texto,
        );

        if (optimista) {
          resultado = resultado.map((mensaje) =>
            mensaje.idLocal === optimista.idLocal
              ? {
                  ...mensaje,
                  id: entrante.id,
                  fechaEnvio: entrante.fechaEnvio,
                  estado: 'enviado' as const,
                }
              : mensaje,
          );
          continue;
        }

        nuevos.push(this.aVista(entrante));
      }

      return nuevos.length > 0 ? [...resultado, ...nuevos] : resultado;
    });

    this.registrarUltimoId(entrantes);
  }

  // Se toma el maximo y no el ultimo del array: el contrato del backend no garantiza el orden.
  private registrarUltimoId(mensajes: MensajeDetailDTO[]): void {
    for (const mensaje of mensajes) {
      if (mensaje.id > this.ultimoId) this.ultimoId = mensaje.id;
    }
  }

  // MensajeDetailDTO no trae esPropio: se deriva comparando el emisor con el usuario logueado.
  private aVista(mensaje: MensajeDetailDTO): MensajeVM {
    return {
      idLocal: this.proximoIdLocal++,
      id: mensaje.id,
      texto: mensaje.texto,
      fechaEnvio: mensaje.fechaEnvio,
      esPropio: mensaje.idEmisor === this.authService.usuarioId(),
      estado: 'enviado',
    };
  }

  enviar(): void {
    const texto = this.borrador().trim();
    const idReceptor = this.idMiembro();
    if (!texto || idReceptor === null) return;

    // Optimistic update: la burbuja aparece antes de que responda el POST.
    const idLocal = this.proximoIdLocal++;
    this.mensajes.update((mensajes) => [
      ...mensajes,
      {
        idLocal,
        id: null,
        texto,
        fechaEnvio: new Date().toISOString(),
        esPropio: true,
        estado: 'enviando',
      },
    ]);

    this.borrador.set('');
    this.scrollAlFondo();

    this.postear(idLocal, texto, idReceptor);
  }

  reintentar(mensaje: MensajeVM): void {
    const idReceptor = this.idMiembro();
    if (idReceptor === null) return;

    this.actualizar(mensaje.idLocal, (actual) => ({ ...actual, estado: 'enviando' }));
    this.postear(mensaje.idLocal, mensaje.texto, idReceptor);
  }

  private postear(idLocal: number, texto: string, idReceptor: number): void {
    this.mensajeService.enviarMensaje({ texto, idReceptor }).subscribe({
      next: (enviado) => {
        // Se reemplaza por el mensaje real: interesan el id y la fechaEnvio del servidor.
        this.actualizar(idLocal, (actual) => ({
          ...actual,
          id: enviado.id,
          texto: enviado.texto,
          fechaEnvio: enviado.fechaEnvio,
          estado: 'enviado',
        }));
        // Corre el corte tambien con lo propio, asi el mensaje recien enviado no vuelve en el
        // proximo tick.
        this.registrarUltimoId([enviado]);
      },
      error: (err) => {
        console.error('Error al enviar el mensaje:', err);
        // La burbuja no se borra: queda con el texto escrito y el boton de reintentar.
        this.actualizar(idLocal, (actual) => ({ ...actual, estado: 'error' }));
      },
    });
  }

  private actualizar(idLocal: number, cambio: (mensaje: MensajeVM) => MensajeVM): void {
    this.mensajes.update((mensajes) =>
      mensajes.map((mensaje) => (mensaje.idLocal === idLocal ? cambio(mensaje) : mensaje)),
    );
  }

  // Angular solo dispara este binding con Enter sin modificadores, asi que Shift+Enter cae en
  // el comportamiento por defecto del textarea (salto de linea). El preventDefault evita que
  // ademas del envio quede un salto de linea suelto en el input.
  alPresionarEnter(evento: Event): void {
    evento.preventDefault();
    this.enviar();
  }

  // Despues del render: cuando termina el subscribe, el signal recien actualizado todavia no
  // se reflejo en el DOM y scrollHeight seria el viejo.
  private scrollAlFondo(): void {
    setTimeout(() => {
      const elemento = this.contenedorMensajes()?.nativeElement;
      if (elemento) {
        elemento.scrollTop = elemento.scrollHeight;
      }
    });
  }

  hora(iso: string): string {
    return formatearHora(iso);
  }
}
