import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../models/publicacion';
import { MiembroService } from '../../services/miembro-service';
import { Miembro } from '../../models/miembro';
import { ComentarioList } from '../../components/comentarios/comentario-list/comentario-list';
import { AuthService } from '../../services/auth-service';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-publicacion-detail',
  imports: [ComentarioList, DatePipe, RouterLink, NgClass],
  templateUrl: './publicacion-detail.html',
  styleUrl: './publicacion-detail.css',
})
export class PublicacionDetail implements OnInit {
  // injeccion de dependencias
  private publicacionService = inject(PublicacionService);
  private miembroService = inject(MiembroService);
  authService = inject(AuthService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // signals
  publicacion = signal<Publicacion | null>(null);
  miembroCreador = signal<Miembro | null>(null);
  cargando = signal<boolean>(true);

  // nombre completo del miembro creador
  nombreCreador = computed(() => {
    const miembro = this.miembroCreador();
    return miembro ? `${miembro.nombre} ${miembro.apellido}` : `Cargando...`;
  });

  // verificar si el usuario loggeado puede editar o eliminar la publicacion
  puedeEditar = computed(() => {
    const pub = this.publicacion();
    return pub ? this.authService.puedeEditar(pub.idMiembro) : false;
  });

  puedeEliminar = computed(() => {
    const pub = this.publicacion();
    return pub ? this.authService.puedeEliminar(pub.idMiembro) : false;
  });

  isAdmin = computed(() => {
    const pub = this.publicacion();
    return pub ? this.authService.isAdmin() : false;
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
        this.router.navigate(['/publicaciones']);
      },
    });
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
    if (this.puedeEditar()) {
      const id = this.publicacion()?.id;
      this.router.navigate(['/publicaciones', id, 'editar']);
    }
  }

  deletePublicacion() {
    const publicacion = this.publicacion();

    if (!publicacion) {
      return;
    }

    if (this.puedeEliminar() && confirm('¿Estás seguro de eliminar esta publicación?')) {
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

  irAComentarios() {
    const element = document.getElementById('formComentario');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element?.focus({ preventScroll: true });
  }
}
