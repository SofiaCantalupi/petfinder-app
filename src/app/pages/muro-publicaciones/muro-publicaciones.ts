import { Component, inject } from '@angular/core';
import { PublicacionService } from '../../services/publicacion-service';
import { RouterLink } from "@angular/router";
import { PublicacionList } from '../../components/publicacion-list/publicacion-list';

@Component({
  selector: 'app-muro-publicaciones',
  imports: [RouterLink, PublicacionList],
  templateUrl: './muro-publicaciones.html',
  styleUrl: './muro-publicaciones.css',
})
export class MuroPublicaciones{
  private publicacionService = inject(PublicacionService);

  publicacionActivas = this.publicacionService.publicacionesActivas;
}
