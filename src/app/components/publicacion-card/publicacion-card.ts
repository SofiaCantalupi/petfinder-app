import { Component, input, OnInit } from '@angular/core';
import { Publicacion } from '../../models/publicacion';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { formatUbicacion } from '../../utils';

@Component({
  selector: 'app-publicacion-card',
  imports: [RouterLink, DatePipe, NgClass],
  templateUrl: './publicacion-card.html',
})
export class PublicacionCard implements OnInit {
  publicacion = input.required<Publicacion>();

  ubicacionFormateada: string = '';

  ngOnInit(): void {
    if (this.publicacion().ubicacion) {
      this.ubicacionFormateada = formatUbicacion(this.publicacion().ubicacion);
    }
  }
}
