import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MensajeService } from '../../services/mensaje-service';
import { ConversacionDetailDTO } from '../../models/chat';
import { formatearFechaResumen } from '../../utils/fecha-chat';

// Compara sin distinguir mayusculas ni acentos: buscar "pena" tiene que encontrar "Peña".
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

@Component({
  selector: 'app-listado-conversaciones',
  standalone: true,
  imports: [NgClass],
  templateUrl: './listado-conversaciones.html',
})
export class ListadoConversaciones implements OnInit {
  private mensajeService = inject(MensajeService);

  // Lo maneja la pagina contenedora: el listado no decide cual esta abierta, solo la resalta.
  idSeleccionado = input<number | null>(null);

  conversacionSeleccionada = output<number>();
  // El id alcanza para cargar el chat, pero el header del chat muestra nombre + apellido y
  // MensajeDetailDTO no trae apellido: por eso el DTO completo viaja aparte.
  contactoSeleccionado = output<ConversacionDetailDTO>();

  // La lista vive en el servicio: el badge del header consume el mismo estado, asi que no puede
  // haber dos copias. 'cargando' y 'error' si son locales, son estado de esta vista.
  conversaciones = this.mensajeService.conversaciones;
  cargando = signal(true);
  error = signal(false);

  filtro = signal('');

  // Filtra sobre la lista del servicio contra nombre + apellido juntos, asi "franco can" tambien
  // matchea. El filtro es solo de vista: no se pide nada al backend.
  conversacionesFiltradas = computed(() => {
    const termino = normalizar(this.filtro().trim());
    if (!termino) return this.conversaciones();

    return this.conversaciones().filter((conversacion) =>
      normalizar(`${conversacion.nombre} ${conversacion.apellido}`).includes(termino),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    // Skeleton solo si no hay nada para mostrar: el header ya pudo haber traido la lista al
    // arrancar la app, y taparla con el skeleton seria un parpadeo al pedo.
    this.cargando.set(this.conversaciones().length === 0);
    this.error.set(false);

    this.mensajeService.listarConversaciones().subscribe({
      next: () => {
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las conversaciones:', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  seleccionar(conversacion: ConversacionDetailDTO): void {
    this.conversacionSeleccionada.emit(conversacion.idMiembro);
    this.contactoSeleccionado.emit(conversacion);

    if (conversacion.mensajesNoLeidos > 0) {
      // Se refresca en las dos ramas para que la lista muestre siempre el estado real del
      // backend: si el PUT falla, el badge tiene que seguir ahi, no desaparecer de mentira.
      this.mensajeService.marcarLeidos(conversacion.idMiembro).subscribe({
        next: () => this.refrescar(),
        error: (err) => {
          console.error('Error al marcar los mensajes como leidos:', err);
          this.refrescar();
        },
      });
    }
  }

  // Recarga sin tocar 'cargando': si no, el skeleton parpadea sobre una lista que ya se ve.
  // marcarLeidos ya puso el contador en 0 localmente; esto ademas refresca ultimoMensaje.
  private refrescar(): void {
    this.mensajeService.listarConversaciones().subscribe({
      error: (err) => console.error('Error al refrescar las conversaciones:', err),
    });
  }

  fechaResumen(iso: string): string {
    return formatearFechaResumen(iso);
  }
}
