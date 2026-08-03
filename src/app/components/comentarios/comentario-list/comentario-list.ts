import { Component, inject, input, OnInit } from '@angular/core';
import { ComentarioService } from '../../../services/comentario-service';
import { ComentarioItem } from '../comentario-item/comentario-item';
import { ComentarioForm } from '../comentario-form/comentario-form';
import { ComentarioRequestDTO } from '../../../models/comentario-request-dto';
import { ToastService } from '../../../services/toast-service';

@Component({
  selector: 'app-comentario-list',
  standalone: true,
  imports: [ComentarioItem, ComentarioForm],
  templateUrl: './comentario-list.html',
})
export class ComentarioList implements OnInit {
  private comentarioService = inject(ComentarioService);
  private toastService = inject(ToastService);

  publicacionId = input.required<number>();

  comentarios = this.comentarioService.comentarios;

  ngOnInit(): void {
    this.cargarComentarios();
  }

  cargarComentarios(): void {
    this.comentarioService.getComentariosByPublicacion(this.publicacionId()).subscribe({
      next: () => {
        console.log('Comentarios cargados');
      },
      error: (err) => {
        console.error('Error al cargar comentarios:', err);
      },
    });
  }

  guardarComentario(comentario: ComentarioRequestDTO): void {
    this.comentarioService.postComentario(comentario).subscribe({
      next: () => {
        console.log('Comentario creado exitosamente');
      },
      error: (err) => {
        console.error('Error al crear comentario:', err);
        this.toastService.showToast('Error al publicar el comentario', 'error');
      },
    });
  }

  eliminarComentario(id: number): void {
    this.comentarioService.deleteComentario(id).subscribe({
      next: () => {
        console.log('Comentario eliminado');
        this.toastService.showToast('Comentario eliminado', 'success');
      },
      error: (err) => {
        console.error('Error al eliminar comentario:', err);
        this.toastService.showToast('Error al eliminar el comentario', 'error');
      },
    });
  }
}
