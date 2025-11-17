import { Component, inject, signal, computed } from '@angular/core';
import { PublicacionService } from '../../services/publicacion-service';
import { PublicacionList } from '../../components/publicacion-list/publicacion-list';
import { EstadoMascota, TipoMascota } from '../../models/publicacion';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-muro-publicaciones',
  imports: [PublicacionList, NgClass],
  templateUrl: './muro-publicaciones.html',
  styleUrl: './muro-publicaciones.css',
})
export class MuroPublicaciones {
  private publicacionService = inject(PublicacionService);

  publicacionesActivas = this.publicacionService.publicacionesActivas;

  filtroEstadoMascota = signal<EstadoMascota | null>(null);
  filtroTipoMascota = signal<TipoMascota | null>(null);

  // si existe un cambio en los signlas de filtros, se ejecuta computed, que va a filtrar las publicaciones
  publicacionesFiltradas = computed(() => {
    let pubs = this.publicacionesActivas();

    if (this.filtroEstadoMascota() !== null) {
      pubs = pubs.filter((pub) => pub.estadoMascota === this.filtroEstadoMascota());
    }

    if (this.filtroTipoMascota() !== null) {
      pubs = pubs.filter((pub) => pub.tipoMascota === this.filtroTipoMascota());
    }

    return pubs;
  });

  toggleEstadoMascota(estado: EstadoMascota) {
    if (this.filtroEstadoMascota() === estado) {
      // Si ya esta activo ese estado, desactivar
      this.filtroEstadoMascota.set(null);
    } else {
      // Si esta inactivo o es otro estado, activar el que recibe por parametro
      this.filtroEstadoMascota.set(estado);
    }
  }

  toggleTipoMascota(tipo: TipoMascota) {
    if (this.filtroTipoMascota() === tipo) {
      this.filtroTipoMascota.set(null);
    } else {
      this.filtroTipoMascota.set(tipo);
    }
  }
}
