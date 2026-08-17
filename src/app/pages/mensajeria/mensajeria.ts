import { Component, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ListadoConversaciones } from '../../components/listado-conversaciones/listado-conversaciones';
import { Chat } from '../../components/chat/chat';
import { ConversacionDetailDTO } from '../../models/chat';

@Component({
  selector: 'app-mensajeria',
  imports: [ListadoConversaciones, Chat, NgClass],
  templateUrl: './mensajeria.html',
})
export class Mensajeria {
  // No hay entidad Conversacion: lo unico que se guarda es el id del otro miembro.
  idSeleccionado = signal<number | null>(null);
  nombreContacto = signal<string>('');

  seleccionarConversacion(idContacto: number): void {
    this.idSeleccionado.set(idContacto);
  }

  guardarContacto(contacto: ConversacionDetailDTO): void {
    this.nombreContacto.set(`${contacto.nombre} ${contacto.apellido}`);
  }

  // Solo se usa en mobile, donde las dos columnas no entran juntas.
  volverAlListado(): void {
    this.idSeleccionado.set(null);
    this.nombreContacto.set('');
  }
}
