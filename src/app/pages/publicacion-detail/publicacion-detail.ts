import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../models/publicacion';
import { MiembroService } from '../../services/miembro-service';
import { Miembro } from '../../models/miembro';
import { ComentarioList } from '../../components/comentarios/comentario-list/comentario-list';

@Component({
  selector: 'app-publicacion-detail',
  imports: [ComentarioList, RouterLink],
  templateUrl: './publicacion-detail.html',
  styleUrl: './publicacion-detail.css',
})
export class PublicacionDetail implements OnInit {
  // injeccion de dependencias
  private publicacionService = inject(PublicacionService);
  private miembroService = inject(MiembroService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // signals
  publicacion = signal<Publicacion | null>(null);
  miembroCreador = signal<Miembro | null>(null);
  miembroActual = signal<Miembro | null>(null);
  cargando = signal<boolean>(true);

  // nombre completo del miembro creado
  nombreCreador = computed(() => {
    const miembro = this.miembroCreador();
    return miembro ? `${miembro.nombre} ${miembro.apellido}` : `Cargando...`;
  });

  esDuenio = computed(() => {
    const pub = this.publicacion();
    const miembro = this.miembroActual();
    return pub && miembro && pub.idMiembro === miembro.id; // la publicacion y el miembro existen, y los ids son iguales
  });

  ngOnInit(): void {
    const idPublicacion = this.route.snapshot.params['id'];

    // cargar publicacion
    this.publicacionService.getPublicacionById(idPublicacion).subscribe({
      next: (pub) => {
        this.publicacion.set(pub);
        this.cargarMiembroCreador(pub.idMiembro);
        this.cargando.set(false);
      },
      error: (error) => {
        console.log('Error al obtener la publicacion por ID', error);
        this.cargando.set(false);
      },
    });

    // se carga el miembro que esta logeado actualmente para luego saber si es duenio de la publicacion. la nomenclatura $ indica que es un observable
    const miembroActual$ = this.miembroService.cargarMiembroActual();

    if (miembroActual$) {
      miembroActual$.subscribe({
        next: (miembro) => this.miembroActual.set(miembro),
        error: (error) => console.error('Error cargando miembro actual:', error),
      });
    }
  }

  cargarMiembroCreador(idMiembro: number) {
    this.miembroService.getMiembroById(idMiembro).subscribe({
      next: (miembro) => {
        this.miembroCreador.set(miembro);
      },
      error: (error) => {
        console.log('Error cargando el miembro que creó la publicación.', error);
      },
    });
  }

  navigateToUpdate() {
    if (this.esDuenio()) {
      const id = this.publicacion()?.id;
      this.router.navigate(['/publicaciones', id, 'editar']);
    }
  }

  deletePublicacion() {
    const publicacion = this.publicacion();

    if (!publicacion) {
      return;
    }

    if (this.esDuenio() && confirm('¿Estás seguro de eliminar esta publicación?')) {
      this.publicacionService.deletePublicacion(publicacion.id).subscribe({
        next: () => {
          console.log('Publicación eliminada.');
          this.router.navigate(['/publicaciones']); // volver al muro de publicaciones
        },
        error: (error) => {
          console.log('Error al eliminar la publicación.', error);
        },
      });
    }
  }
}
