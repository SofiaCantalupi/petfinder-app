import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MensajeService } from '../../services/mensaje-service';
import { AuthService } from '../../services/auth-service';
import { GrupoDia, MensajeDetailDTO, MensajeVM } from '../../models/chat';
import { claveDia, formatearDiaSeparador, formatearHora } from '../../utils/fecha-chat';

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
        this.mensajes.set([]);
        return;
      }

      this.cargarConversacion(id);
    });
  }

  private cargarConversacion(idMiembro: number): void {
    this.cargando.set(true);
    this.error.set(false);
    this.mensajes.set([]);
    this.borrador.set('');

    this.mensajeService.obtenerConversacion(idMiembro).subscribe({
      next: (data) => {
        this.mensajes.set(data.map((mensaje) => this.aVista(mensaje)));
        this.cargando.set(false);
        this.scrollAlFondo();
      },
      error: (err) => {
        console.error('Error al cargar la conversación:', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
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
