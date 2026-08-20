import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionService } from '../../services/notificacion-service';
import { Notificacion } from '../../models/notificacion';
import { NotificacionItem } from '../../components/notificaciones/notificacion-item/notificacion-item';

@Component({
  selector: 'app-notificaciones',
  imports: [NotificacionItem],
  templateUrl: './notificaciones.html',
})
export class Notificaciones implements OnInit {
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);

  notificaciones = this.notificacionService.notificaciones;
  noLeidas = this.notificacionService.noLeidas;

  ngOnInit(): void {
    this.notificacionService.getNotificaciones().subscribe();
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
  }
}
