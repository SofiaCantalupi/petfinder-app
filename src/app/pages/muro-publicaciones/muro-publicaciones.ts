import { Component, inject, OnInit } from '@angular/core';
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../../models/publicacion.model';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-muro-publicaciones',
  imports: [],
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
