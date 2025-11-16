import { Component, inject, input, OnInit } from '@angular/core';
import { ComentarioService } from '../../../services/comentario-service';
import { ComentarioItem } from '../comentario-item/comentario-item';
import { ComentarioForm } from '../comentario-form/comentario-form';
import { Comentario } from '../../../models/comentario';

@Component({
  selector: 'app-comentario-list',
  standalone: true,
  imports: [ComentarioItem, ComentarioForm],
  templateUrl: './comentario-list.html',
  styleUrl: './comentario-list.css',
})
export class ComentarioList implements OnInit {
  private comentarioService = inject(ComentarioService);

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

  guardarComentario(comentario: Omit<Comentario, 'id'>): void {
    this.comentarioService.postComentario(comentario).subscribe({
      next: () => {
        console.log('Comentario creado exitosamente');
      },
      error: (err) => {
        console.error('Error al crear comentario:', err);
        alert('Error al publicar el comentario');
      },
    });
  }

  eliminarComentario(id: number): void {
    this.comentarioService.deleteComentario(id).subscribe({
      next: () => {
        console.log('Comentario eliminado');
      },
      error: (err) => {
        console.error('Error al eliminar comentario:', err);
        alert('Error al eliminar el comentario');
      },
    });
  }
}
