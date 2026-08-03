import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SolicitudAdopcionService } from '../../services/solicitud-adopcion-service';
import { PublicacionService } from '../../services/publicacion-service';
import { ToastService } from '../../services/toast-service';
import { SolicitudEnviadaVista } from '../../models/solicitud-adopcion';
import { extraerMensajeError } from '../../utils/http-error';

@Component({
  selector: 'app-listado-solicitudes-adopcion',
  imports: [DatePipe],
  templateUrl: './listado-solicitudes-adopcion.html',
})
export class ListadoSolicitudesAdopcion implements OnInit {
  solicitudService = inject(SolicitudAdopcionService);
  private publicacionService = inject(PublicacionService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  cargando = signal(true);
  errorMensaje = signal<string | null>(null);

  // "Publicado por" no viene en la respuesta del backend: se cruza contra GET /publicaciones,
  // que devuelve solo las activas — exactamente el universo que puede aparecer en /enviadas.
  // Va como computed (y no como map dentro del subscribe) para que se resuelva sola cuando
  // llegue la respuesta de publicaciones, que viaja en paralelo.
  enviadas = computed<SolicitudEnviadaVista[]>(() => {
    const publicaciones = this.publicacionService.publicaciones();

    return this.solicitudService.enviadas().map((solicitud) => ({
      ...solicitud,
      nombreCompletoMiembroPublicacion:
        publicaciones.find((p) => p.id === solicitud.idPublicacion)?.nombreCompleto ?? '—',
    }));
  });

  ngOnInit(): void {
    this.solicitudService.refrescar().subscribe({
      next: () => {
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMensaje.set(extraerMensajeError(error));
        console.error('Error al obtener las solicitudes', error);
      },
    });
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
      error: (error: HttpErrorResponse) => {
        console.error('Error al cancelar la solicitud:', error);
        this.toastService.showToast(extraerMensajeError(error), 'error');
      },
    });
  }
}
