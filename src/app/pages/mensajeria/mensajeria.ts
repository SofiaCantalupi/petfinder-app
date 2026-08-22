import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListadoConversaciones } from '../../components/listado-conversaciones/listado-conversaciones';
import { Chat } from '../../components/chat/chat';
import { MensajeService } from '../../services/mensaje-service';
import { ConversacionDetailDTO } from '../../models/chat';

@Component({
  selector: 'app-mensajeria',
  imports: [ListadoConversaciones, Chat, NgClass],
  templateUrl: './mensajeria.html',
})
export class Mensajeria {
  private route = inject(ActivatedRoute);
  private mensajeService = inject(MensajeService);

  // No hay entidad Conversacion: lo unico que se guarda es el id del otro miembro.
  idSeleccionado = signal<number | null>(null);

  // Nombre que emite el listado al elegir un contacto. Entrando por link directo todavia no
  // hubo click, asi que puede estar vacio y lo resuelve el computed de abajo.
  private nombreEmitido = signal<string>('');

  // El header del chat muestra nombre + apellido y MensajeDetailDTO no trae apellido: por link
  // directo el dato sale de la lista compartida del servicio, que carga el propio listado.
  nombreContacto = computed(() => {
    const emitido = this.nombreEmitido();
    if (emitido) return emitido;

    const id = this.idSeleccionado();
    const contacto = this.mensajeService.conversaciones().find((c) => c.idMiembro === id);
    return contacto ? `${contacto.nombre} ${contacto.apellido}` : '';
  });

  constructor() {
    // Link directo desde el detalle de una publicacion: /mensajes?contacto=<idMiembro>
    const contacto = Number(this.route.snapshot.queryParamMap.get('contacto'));
    if (Number.isInteger(contacto) && contacto > 0) {
      this.idSeleccionado.set(contacto);
    }
  }

  seleccionarConversacion(idContacto: number): void {
    this.idSeleccionado.set(idContacto);
    // Se limpia el anterior para que el header no muestre el contacto viejo si el listado
    // todavia no emitio el nuevo.
    this.nombreEmitido.set('');
  }

  guardarContacto(contacto: ConversacionDetailDTO): void {
    this.nombreEmitido.set(`${contacto.nombre} ${contacto.apellido}`);
  }

  // Solo se usa en mobile, donde las dos columnas no entran juntas.
  volverAlListado(): void {
    this.idSeleccionado.set(null);
    this.nombreEmitido.set('');
  }
}
