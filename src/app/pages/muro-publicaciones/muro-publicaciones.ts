import { Component, inject, signal, computed } from '@angular/core';
import { PublicacionService } from '../../services/publicacion-service';
import { PublicacionList } from '../../components/publicacion-list/publicacion-list';
import { EstadoMascota, TipoMascota } from '../../models/publicacion';
import { NgClass } from '@angular/common';
import { Hero } from '../../components/hero/hero';
import { CarruselPublicaciones } from '../../components/carrusel-publicaciones/carrusel-publicaciones';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-muro-publicaciones',
  imports: [PublicacionList, NgClass, Hero, CarruselPublicaciones, NgxPaginationModule],
  templateUrl: './muro-publicaciones.html',
  styleUrl: './muro-publicaciones.css',
})
export class MuroPublicaciones {
  private publicacionService = inject(PublicacionService);

  publicacionesReencontrados = this.publicacionService.publicacionesReencontrados;

  filtroEstadoMascota = signal<EstadoMascota | null>(null);
  filtroTipoMascota = signal<TipoMascota | null>(null);

  currentPage = signal<number>(1);
  itemsPerPage = 8;

  publicacionesActivas = computed(() =>
    this.publicacionService.publicaciones().filter((pub) => pub.activo)
  );

  // si existe un cambio en los signlas de filtros, se ejecuta computed, que va a filtrar las publicaciones
  publicacionesFiltradas = computed(() => {
    // primero se filtran las publicaciones que tiene estado como reencontrado
    let pubs = this.publicacionesActivas().filter((pub) => pub.estadoMascota !== 'reencontrado');

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
    this.currentPage.set(1); //Al cambiar los filtros, se vuelve a la página 1
  }

  toggleTipoMascota(tipo: TipoMascota) {
    if (this.filtroTipoMascota() === tipo) {
      this.filtroTipoMascota.set(null);
    } else {
      this.filtroTipoMascota.set(tipo);
    }
    this.currentPage.set(1); //Al cambiar los filtros, se vuelve a la página 1
  }

  cambioDePagina(page: number): void {
    this.currentPage.set(page);

    //scroll al iniio de publiciones
    const publicacionesElement = document.querySelector('app-hero');
    if (publicacionesElement) {
      publicacionesElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      //si no encuentra el elemento, va arriba de todo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
