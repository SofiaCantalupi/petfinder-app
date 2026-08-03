import { Component, input } from '@angular/core';
import { Publicacion } from '../../models/publicacion';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-publicacion-card',
  imports: [RouterLink, DatePipe, NgClass],
  templateUrl: './publicacion-card.html',
})
export class PublicacionCard {
  publicacion = input.required<Publicacion>();
}
