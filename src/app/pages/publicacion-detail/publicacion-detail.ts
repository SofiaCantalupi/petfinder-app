import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router'; // ← Agregar RouterLink
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../models/publicacion';
import { ComentarioList } from '../../components/comentarios/comentario-list/comentario-list';

@Component({
  selector: 'app-publicacion-detail',
  imports: [ComentarioList, RouterLink], // ← Agregar RouterLink
  templateUrl: './publicacion-detail.html',
  styleUrl: './publicacion-detail.css',
})
export class PublicacionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private publicacionService = inject(PublicacionService);

  publicacion = signal<Publicacion | null>(null);
  cargando = signal<boolean>(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.publicacionService.getPublicacionById(Number(id)).subscribe({
        next: (data) => {
          this.publicacion.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar publicación:', err);
          this.cargando.set(false);
        },
      });
    }
  }
}
