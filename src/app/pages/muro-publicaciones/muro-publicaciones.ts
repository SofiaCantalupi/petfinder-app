import { Component, inject, OnInit } from '@angular/core';
import { PublicacionService } from '../../services/publicacion-service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-muro-publicaciones',
  imports: [RouterLink],
  templateUrl: './muro-publicaciones.html',
  styleUrl: './muro-publicaciones.css',
})
export class MuroPublicaciones implements OnInit {
  private publicacionService = inject(PublicacionService);

  listaPublicaciones = this.publicacionService.publicaciones;

  ngOnInit(): void{
    this.publicacionService.getPublicaciones();
  }
}
