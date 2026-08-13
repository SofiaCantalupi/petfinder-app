import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import Swiper from 'swiper';
import { Publicacion } from '../../models/publicacion';
import { Navigation, Autoplay } from 'swiper/modules';

Swiper.use([Navigation, Autoplay]); // ACTIVACION  MODULOS

@Component({
  selector: 'app-carrusel-publicaciones',
  standalone: true, // swipper no es un componente angular, es JS, por eso no se importa
  templateUrl: './carrusel-publicaciones.html',
})
export class CarruselPublicaciones {
  publicaciones = input.required<Publicacion[]>();

  // se obtiene el contenedor con clase swiper (query de signal: se reevalua sola)
  private swiperContainer = viewChild<ElementRef<HTMLElement>>('swiperContainer');

  private swiper?: Swiper;

  constructor() {
    // Las publicaciones llegan por HTTP despues del primer render: si swiper se creara ahi (como
    // hacia ngAfterViewInit) arrancaria con cero slides y nunca registraria los que Angular
    // renderiza despues. Por eso se instancia recien cuando hay slides en el DOM, y en los cambios
    // siguientes alcanza con update() en vez de rehacer el carrusel.
    afterRenderEffect(() => {
      const hayPublicaciones = this.publicaciones().length > 0;
      const contenedor = this.swiperContainer()?.nativeElement;

      if (!contenedor || !hayPublicaciones) return;

      if (this.swiper) {
        this.swiper.update();
        return;
      }

      this.swiper = new Swiper(contenedor, {
        modules: [Navigation, Autoplay],

        slidesPerView: 1,
        spaceBetween: 10,
        loop: true,

        //autoplat
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
        },

        // botones: swiper los busca dentro de este contenedor (uniqueNavElements), asi que varios
        // carruseles en la misma pagina no se pisan entre si
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },

        // responsive
        breakpoints: {
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
      });
    });

    // el autoplay deja un timer corriendo: sin esto queda vivo despues de salir del muro
    inject(DestroyRef).onDestroy(() => this.swiper?.destroy());
  }
}
