import { Component, input } from '@angular/core';
import { Publicacion } from '../../models/publicacion';
import { PublicacionCard } from '../publicacion-card/publicacion-card';

@Component({
  selector: 'app-publicacion-list',
  imports: [PublicacionCard],
  templateUrl: './publicacion-list.html',
  styleUrl: './publicacion-list.css',
})
export class PublicacionList {
  publicaciones = input.required<Publicacion[]>();
}
