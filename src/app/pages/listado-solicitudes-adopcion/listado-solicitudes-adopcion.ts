import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SolicitudAdopcionService } from '../../services/solicitud-adopcion-service';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-listado-solicitudes-adopcion',
  imports: [DatePipe],
  templateUrl: './listado-solicitudes-adopcion.html',
})
export class ListadoSolicitudesAdopcion implements OnInit {
  solicitudService = inject(SolicitudAdopcionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit(): void {
    // se refresca el listado por si se creo/cancelo una solicitud desde otra sesion
    this.solicitudService.getSolicitudes();
  }

  // navega al detalle de la solicitud
  verDetalle(id: number): void {
    this.router.navigate(['/solicitudes-adopcion', id]);
  }

  // cancela una solicitud enviada, previa confirmacion
  cancelarSolicitud(id: number): void {
    if (!confirm('¿Estás seguro de que querés cancelar esta solicitud de adopción?')) return;

    this.solicitudService.cancelar(id).subscribe({
      next: () => {
        this.toastService.showToast('Solicitud cancelada', 'success');
      },
      error: (error) => {
        console.error('Error al cancelar la solicitud:', error);
        this.toastService.showToast('Error al cancelar la solicitud', 'error');
      },
    });
  }
}
