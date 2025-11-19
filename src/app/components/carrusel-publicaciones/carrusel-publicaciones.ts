// AfterViewInit es usado ya que swipper necesita que el html este renderizado antes de inicializarse
import { Component, AfterViewInit, ViewChild, ElementRef, input } from '@angular/core';
import Swiper from 'swiper';
import { Publicacion } from '../../models/publicacion';
import { Navigation, Autoplay } from 'swiper/modules';

Swiper.use([Navigation, Autoplay]); // ACTIVACION  MODULOS

@Component({
  selector: 'app-carrusel-publicaciones',
  standalone: true, // swipper no es un componente angular, es JS, por eso no se importa
  templateUrl: './carrusel-publicaciones.html',
  styleUrl: './carrusel-publicaciones.css',
})
export class CarruselPublicaciones {
  publicaciones = input.required<Publicacion[]>();

  // se obtienme el contenedor con clase swipper
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  // inicializacion del swipper, se crea el carrusel
  ngAfterViewInit() {

    new Swiper(this.swiperContainer.nativeElement, {
      modules: [Navigation, Autoplay],

      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,

      //autoplat
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },

      // botones
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },

      // responsive
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }
    });
  }
}
