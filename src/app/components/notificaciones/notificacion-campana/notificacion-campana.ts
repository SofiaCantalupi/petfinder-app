import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificacionService } from '../../../services/notificacion-service';
import { Notificacion } from '../../../models/notificacion';
import { NotificacionItem } from '../notificacion-item/notificacion-item';

@Component({
  selector: 'app-notificacion-campana',
  standalone: true,
  imports: [NotificacionItem, RouterLink],
  templateUrl: './notificacion-campana.html',
})
export class NotificacionCampana implements OnInit {
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);

  abierto = signal(false);

  notificaciones = this.notificacionService.notificaciones;
  noLeidas = this.notificacionService.noLeidas;

  ngOnInit(): void {
    this.notificacionService.contarNoLeidas().subscribe();
  }

  alternar(): void {
    this.abierto.update((valor) => !valor);

    if (this.abierto()) {
      this.notificacionService.getNotificaciones().subscribe();
    }
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasComoLeidas().subscribe();
  }

  eliminar(id: number): void {
    this.notificacionService.eliminarNotificacion(id).subscribe();
  }

  verNotificacion(notificacion: Notificacion): void {
    if (!notificacion.leida) {
      this.notificacionService.marcarComoLeida(notificacion.id).subscribe();
    }

    this.notificacionService.resolverRuta(notificacion).subscribe((ruta) => {
      this.router.navigate(ruta);
    });

    this.cerrar();
  }
}
