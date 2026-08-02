import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { SolicitudAdopcionService } from '../../services/solicitud-adopcion-service';
import { ToastService } from '../../services/toast-service';
import { SolicitudAdopcion, ResolverSolicitudDto } from '../../models/solicitud-adopcion';

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
  private toastService = inject(ToastService);

  solicitud = signal<SolicitudAdopcion | null>(null);
  cargando = signal(true);
  resolviendo = signal(false);

  // el usuario loggeado puede resolver la solicitud si es el dueño de la publicacion asociada
  // (es decir, si esta solicitud aparece en sus "recibidas") y todavia esta pendiente
  puedeResolver = computed(() => {
    const s = this.solicitud();
    if (!s || s.estado !== 'pendiente') return false;

    return this.solicitudService.recibidas().some((r) => r.id === s.id);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // se refresca por si cambio algo desde el listado
    this.solicitudService.getSolicitudes();

    this.solicitudService.getSolicitudById(id).subscribe({
      next: (data) => {
        this.solicitud.set(data);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al obtener la solicitud', error);
        this.cargando.set(false);
        this.router.navigate(['/solicitudes-adopcion']);
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

    const dto: ResolverSolicitudDto = {
      estado,
      comentarioResolucion: comentario.trim() ? comentario.trim() : undefined,
    };

    this.solicitudService.resolver(s.id, dto).subscribe({
      next: (data) => {
        this.resolviendo.set(false);
        this.solicitud.set(data);
        this.toastService.showToast(
          estado === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada',
          'success',
        );
      },
      error: (error) => {
        this.resolviendo.set(false);
        console.error('Error al resolver la solicitud', error);
        this.toastService.showToast('Error al resolver la solicitud', 'error');
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
