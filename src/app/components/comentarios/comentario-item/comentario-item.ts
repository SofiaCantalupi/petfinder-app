import { Component, inject, input, output } from '@angular/core';
import { Comentario } from '../../../models/comentario';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-comentario-item',
  standalone: true,
  imports: [],
  templateUrl: './comentario-item.html',
  styleUrl: './comentario-item.css',
})
export class ComentarioItem {
  //para saber quien esta logueado (asi sabae si puede eliminar comentarios propios)
  private authService = inject(AuthService);

  comentario = input.required<Comentario>();
  comentarioEliminado = output<number>();

  puedeEliminar(): boolean {
    const miembroActual = this.authService.getCurrentUser();

    if (!miembroActual) return false;

    return (
      miembroActual.id === this.comentario().miembroId || miembroActual.rol === 'administrador'
    );
  }

  eliminar(): void {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      this.comentarioEliminado.emit(this.comentario().id);
    }
  }

  //sirve para mostrar el tiempo desde que se hizo el comentario hasta la fecha actual
  //muestra cada segundo, minuto, hora y dia que pasa puntualmente
  tiempoTranscurrido(): string {
    const fecha = new Date(this.comentario().fechaPublicacion);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();

    const segundos = Math.floor(diffMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const meses = Math.floor(dias / 30);
    const años = Math.floor(dias / 365);

    if (segundos < 60) {
      return segundos <= 1 ? 'Hace 1 segundo' : `Hace ${segundos} segundos`;
    }

    if (minutos < 60) {
      return minutos === 1 ? 'Hace 1 minuto' : `Hace ${minutos} minutos`;
    }

    if (horas < 24) {
      return horas === 1 ? 'Hace 1 hora' : `Hace ${horas} horas`;
    }

    if (dias < 30) {
      return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
    }

    if (meses < 12) {
      return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
    }

    return años === 1 ? 'Hace 1 año' : `Hace ${años} años`;
  }
}
