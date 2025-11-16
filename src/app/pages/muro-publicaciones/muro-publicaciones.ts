import { Component, inject } from '@angular/core';
import { PublicacionService } from '../../services/publicacion-service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-muro-publicaciones',
  imports: [RouterLink],
  templateUrl: './muro-publicaciones.html',
  styleUrl: './muro-publicaciones.css',
})
export class MuroPublicaciones{
  private publicacionService = inject(PublicacionService);

  publicacionActivas = this.publicacionService.publicacionesActivas;
}
