import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../models/publicacion';

@Component({
  selector: 'app-publicacion-detail',
  imports: [RouterLink],
  templateUrl: './publicacion-detail.html',
  styleUrl: './publicacion-detail.css',
})
export class PublicacionDetail implements OnInit {
  publicacionService = inject(PublicacionService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  selectedPublicacion = signal<Publicacion | null>(null);

  ngOnInit(): void {
    const idPublicacion = this.route.snapshot.params['id'];

    this.publicacionService.getPublicacionById(idPublicacion).subscribe({
      next: (data) => {
        this.selectedPublicacion.set(data);
      },
      error: (error) => {
        console.log('Error al obtener la publicacion por ID', error);
      }
    });
  }

  navigateToUpdate(){
    const id = this.selectedPublicacion()?.id;
    this.router.navigate(['/publicaciones', id, 'editar']);
  }

  deletePublicacion(){
    const publicacion = this.selectedPublicacion();

    if(!publicacion){
      return;
    }

    if(confirm('Estas seguro que queres eliminar esta publicación?')){
      this.publicacionService.deletePublicacion(publicacion.id).subscribe({
        next: () => {
          console.log('Publicación eliminada.');
          this.router.navigate(['/publicaciones']); // volver al muro de publicaciones
        }, 
        error: (error) => {
          console.log('Error al eliminar la publicación.', error);
        }
      });
    }
  }
}
