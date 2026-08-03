import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { SolicitudAdopcionService } from '../../services/solicitud-adopcion-service';
import { PublicacionService } from '../../services/publicacion-service';
import { ToastService } from '../../services/toast-service';
import {
  EstadoResolucionConstante,
  ResolucionSolicitudRequestDTO,
  SolicitudAdopcion,
} from '../../models/solicitud-adopcion';
import { estadoSolicitudAConstante, motivoRechazoATexto } from '../../utils';
import { extraerMensajeError } from '../../utils/http-error';

@Component({
  selector: 'app-solicitud-adopcion-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './solicitud-adopcion-detail.html',
})
export class SolicitudAdopcionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private solicitudService = inject(SolicitudAdopcionService);
  private publicacionService = inject(PublicacionService);
  private toastService = inject(ToastService);

  private idSolicitud = signal(0);

  cargando = signal(true);
  resolviendo = signal(false);
  errorMensaje = signal<string | null>(null);

  // No existe GET /solicitudes/{id}: la solicitud se deriva de las dos listas del service.
  // Al ser computed, el refetch que hace resolver() se propaga solo a la vista.
  solicitud = computed<SolicitudAdopcion | null>(
    () => this.solicitudService.solicitudes().find((s) => s.id === this.idSolicitud()) ?? null,
  );

  // El backend no manda al dueño de la publicacion: se cruza contra GET /publicaciones.
  nombrePublicador = computed(() => {
    const s = this.solicitud();
    if (!s) return '';

    return (
      this.publicacionService.publicaciones().find((p) => p.id === s.idPublicacion)
        ?.nombreCompleto ?? '—'
    );
  });

  // Texto legible del motivo de rechazo (el DTO solo trae el enum crudo).
  motivoRechazoTexto = computed(() => {
    const s = this.solicitud();
    if (!s || !s.motivoRechazo) return null;
    return motivoRechazoATexto(s.motivoRechazo);
  });

  // Espeja las tres precondiciones que valida el backend al resolver: que siga pendiente,
  // que la mascota siga en adopcion, y que el usuario sea el dueño de la publicacion
  // (es decir, que la solicitud aparezca entre sus "recibidas").
  puedeResolver = computed(() => {
    const s = this.solicitud();
    if (!s) return false;
    if (s.estado !== 'pendiente') return false;
    if (s.estadoMascota !== 'en_adopcion') return false;

    return this.solicitudService.recibidas().some((r) => r.id === s.id);
  });

  ngOnInit(): void {
    this.idSolicitud.set(Number(this.route.snapshot.paramMap.get('id')));

    this.solicitudService.refrescar().subscribe({
      next: () => {
        this.cargando.set(false);

        // Reemplaza al 404 del viejo GET /solicitudes/{id}: si no esta en ninguna de las dos
        // listas, o no es suya, o su publicacion ya no esta activa.
        if (!this.solicitud()) {
          this.toastService.showToast('No se encontró la solicitud', 'error');
          this.router.navigate(['/solicitudes-adopcion']);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMensaje.set(extraerMensajeError(error));
        console.error('Error al obtener la solicitud', error);
      },
    });
  }

  resolver(estado: 'aprobada' | 'rechazada', comentario: string): void {
    const s = this.solicitud();
    if (!s || this.resolviendo()) return;

    const mensajeConfirmacion =
      estado === 'aprobada'
        ? '¿Estás seguro de que querés aceptar esta solicitud de adopción? El resto de las solicitudes de adopción pendientes relacionadas a esta mascota pasarán de pendientes a rechazadas.'
        : '¿Estás seguro de que querés rechazar esta solicitud de adopción?';

    if (!confirm(mensajeConfirmacion)) return;

    this.resolviendo.set(true);
    this.errorMensaje.set(null);

    const dto: ResolucionSolicitudRequestDTO = {
      estado: estadoSolicitudAConstante(estado) as EstadoResolucionConstante,
      comentarioResolucion: comentario.trim() ? comentario.trim() : null,
    };

    this.solicitudService.resolver(s.id, dto).subscribe({
      next: () => {
        this.resolviendo.set(false);

        // No se setea la solicitud a mano: es un computed sobre el estado del service, que
        // resolver() ya releyo (incluida la cascada de rechazos).
        if (estado === 'aprobada') {
          // El backend paso la mascota a ADOPTADA por su cuenta; se relee el muro para que
          // la publicacion no quede cacheada como "en adopción".
          this.publicacionService.getPublicaciones();
        }

        this.toastService.showToast(
          estado === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada',
          'success',
        );
      },
      error: (error: HttpErrorResponse) => {
        this.resolviendo.set(false);
        const mensaje = extraerMensajeError(error);
        this.errorMensaje.set(mensaje);
        console.error('Error al resolver la solicitud', error);
        this.toastService.showToast(mensaje, 'error');
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
