import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { NotificacionCampana } from '../notificaciones/notificacion-campana/notificacion-campana';
import { MensajeService } from '../../services/mensaje-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NotificacionCampana],
  templateUrl: './header.html',
})
export class Header implements OnInit {
  authService = inject(AuthService);
  private mensajeService = inject(MensajeService);

  // Total de mensajes sin leer para el badge del icono de mensajeria.
  mensajesNoLeidos = this.mensajeService.noLeidos;

  // Iniciales del avatar. Se derivan de nombreCompleto() porque es el unico signal publico de
  // AuthService con los datos del miembro (currentUserSignal es privado). Toma la primera y la
  // ultima palabra, asi un nombre compuesto no devuelve tres letras.
  iniciales = computed(() => {
    const partes = this.authService
      .nombreCompleto()
      .trim()
      .split(/\s+/)
      .filter((parte) => parte.length > 0);

    if (partes.length === 0) return '';

    const primera = partes[0].charAt(0);
    const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';

    return (primera + ultima).toUpperCase();
  });

  ngOnInit(): void {
    // Mismo criterio que la campana de notificaciones: se cuenta una vez al montar el header,
    // sin polling. Despues el contador baja solo, porque marcarLeidos actualiza el estado del
    // servicio. Solo para MIEMBRO: el backend responde 403 al admin en todo /mensajes.
    if (!this.authService.isUsuario()) return;

    this.mensajeService.listarConversaciones().subscribe({
      error: (err) => console.error('Error al contar los mensajes no leidos:', err),
    });
  }
}
