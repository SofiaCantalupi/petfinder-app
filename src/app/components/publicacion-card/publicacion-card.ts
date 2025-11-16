import { Component, input } from '@angular/core';
import { Publicacion } from '../../models/publicacion';

@Component({
  selector: 'app-publicacion-card',
  imports: [],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard {
  publicacion = input.required<Publicacion>();
}
