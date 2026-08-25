import { Component, input, output } from '@angular/core';
import { Notificacion, TipoNotificacion } from '../../../models/notificacion';

@Component({
  selector: 'app-notificacion-item',
  standalone: true,
  imports: [],
  templateUrl: './notificacion-item.html',
})
export class NotificacionItem {
  notificacion = input.required<Notificacion>();

  notificacionClick = output<Notificacion>();
  notificacionEliminada = output<number>();

  private readonly mensajesPorTipo: Record<TipoNotificacion, string> = {
    NUEVO_COMENTARIO: 'Alguien comentó en tu publicación',
    SOLICITUD_ADOPCION: 'Recibiste una nueva solicitud de adopción',
    RESPUESTA_ADOPCION: 'Tu solicitud de adopción tiene una respuesta',
    ADOPCION_DISPONIBLE_NUEVAMENTE: 'Una publicación que te interesaba volvió a estar disponible',
  };

  mensaje(): string {
    return this.mensajesPorTipo[this.notificacion().tipo];
  }

  // fecha es un LocalDate (sin hora), por eso se compara a nivel de día y no de segundos/minutos
  tiempoTranscurrido(): string {
    const [anio, mes, dia] = this.notificacion().fecha.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    const hoy = new Date();

    const diffDias = Math.floor(
      (Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) -
        Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())) /
        (1000 * 60 * 60 * 24),
    );

    if (diffDias <= 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 30) return `Hace ${diffDias} días`;

    const meses = Math.floor(diffDias / 30);
    if (meses < 12) return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;

    const años = Math.floor(diffDias / 365);
    return años === 1 ? 'Hace 1 año' : `Hace ${años} años`;
  }

  click(): void {
    this.notificacionClick.emit(this.notificacion());
  }

  eliminar(event: Event): void {
    event.stopPropagation();
    this.notificacionEliminada.emit(this.notificacion().id);
  }
}
