import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MensajeService } from '../../services/mensaje-service';
import { ConversacionDetailDTO } from '../../models/chat';
import { formatearFechaResumen } from '../../utils/fecha-chat';

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

  conversaciones = signal<ConversacionDetailDTO[]>([]);
  cargando = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.mensajeService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones.set(data);
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
      // Se refresca en las dos ramas: aunque marcarLeidos falle, el GET de la conversacion que
      // dispara el chat ya deja los mensajes como leidos del lado del backend, asi que la lista
      // vuelve igual sin el badge.
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
  private refrescar(): void {
    this.mensajeService.listarConversaciones().subscribe({
      next: (data) => this.conversaciones.set(data),
      error: (err) => console.error('Error al refrescar las conversaciones:', err),
    });
  }

  fechaResumen(iso: string): string {
    return formatearFechaResumen(iso);
  }
}
