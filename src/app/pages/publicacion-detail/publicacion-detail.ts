import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicacionService } from '../../services/publicacion-service';
import { EstadoMascota, Publicacion } from '../../models/publicacion';
import { ComentarioList } from '../../components/comentarios/comentario-list/comentario-list';
import { AuthService } from '../../services/auth-service';
import { DatePipe, NgClass } from '@angular/common';
import { ToastService } from '../../services/toast-service';
import { Map } from '../../components/map/map';
import { Location } from '@angular/common';
import { finalize } from 'rxjs';
import { Spinner } from '../../components/spinner/spinner';

@Component({
  selector: 'app-publicacion-detail',
  imports: [ComentarioList, DatePipe, NgClass, Map, Spinner],
  templateUrl: './publicacion-detail.html',
})
export class PublicacionDetail implements OnInit {
  // injeccion de dependencias
  private publicacionService = inject(PublicacionService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // signals
  publicacion = signal<Publicacion | null>(null);
  cargando = signal<boolean>(true);
  // un solo signal para los 3 botones de accion: nunca estan visibles a la vez
  accionEnCurso = signal(false);

  ubicacionFormateada: string = '';

  // nombre completo del autor: ya viene armado en la propia publicacion (evita pegarle a
  // GET /miembros/{id}, que en el backend real es solo para ADMINISTRADOR)
  nombreCreador = computed(() => {
    return this.publicacion()?.nombreCompleto ?? 'Cargando...';
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

  // visible solo si la mascota esta en adopcion y el usuario loggeado no es el duenio de la publicacion y no es admin.
  puedeSolicitarAdopcion = computed(() => {
    const pub = this.publicacion();
    return pub
      ? pub.estadoMascota === 'en_adopcion' && !this.puedeEditar() && !this.authService.isAdmin()
      : false;
  });

  // visible solo si la mascota fue encontrada y el usuario loggeado es el duenio de la publicacion
  puedePonerEnAdopcion = computed(() => {
    const pub = this.publicacion();
    return pub ? pub.estadoMascota === 'encontrado' && this.puedeEditar() : false;
  });

  ngOnInit(): void {
    const idPublicacion = this.route.snapshot.params['id'];

    this.publicacionService.getPublicacionById(idPublicacion).subscribe({
      next: (pub) => {
        this.publicacion.set(pub);
        this.ubicacionFormateada = pub.ubicacion;
        this.cargando.set(false);
      },
      error: (error) => {
        console.log('Error al obtener la publicacion por ID', error);
        this.cargando.set(false);
        this.router.navigate(['/publicaciones']);
      },
    });
  }

  navigateToUpdate() {
    if (this.puedeEditar() && this.publicacion()?.activo) {
      const id = this.publicacion()?.id;
      this.router.navigate(['/publicaciones', id, 'editar']);
    }
  }

  irASolicitudAdopcion() {
    if (!this.puedeSolicitarAdopcion()) return;
    const id = this.publicacion()?.id;
    this.router.navigate(['/publicaciones', id, 'solicitud-adopcion']);
  }

  deletePublicacion() {
    if (!this.publicacion()?.activo) return;

    const publicacion = this.publicacion();

    if (!publicacion) {
      return;
    }

    if (this.puedeEliminar() && confirm('¿Estás seguro de eliminar esta publicación?')) {
      this.accionEnCurso.set(true);
      this.publicacionService
        .deletePublicacion(publicacion.id)
        .pipe(finalize(() => this.accionEnCurso.set(false)))
        .subscribe({
          next: () => {
            console.log('Publicación eliminada.');
            this.toastService.showToast('Publicación eliminada', 'success');
            this.router.navigate(['/publicaciones']);
          },
          error: (error) => {
            console.log('Error al eliminar la publicación.', error);
          },
        });
    }
  }

  irAComentarios() {
    if (!this.publicacion()?.activo) return;
    const element = document.getElementById('formComentario');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element?.focus({ preventScroll: true });
  }

  cambiarEstadoAReencontrado() {
    if (!this.publicacion()?.activo) return;

    const estado: EstadoMascota = 'reencontrado';
    const id = this.publicacion()?.id;

    if (!id) return;

    if (confirm('¿Estás seguro de querer cambiar el estado de esta mascota a REENCONTRADO?')) {
      this.accionEnCurso.set(true);
      this.publicacionService
        .updateEstadoMascota(id, estado)
        .pipe(finalize(() => this.accionEnCurso.set(false)))
        .subscribe({
          next: (pub) => {
            console.log('Estado Actualizado');
            this.toastService.showToast('Estado de la mascota ctualizado', 'success');
            this.publicacion.set(pub);
          },
          error: (error) => {
            console.log('No se ha podido actualizar el estado', error);
            this.toastService.showToast('Error al actualizar el estado', 'error');
          },
        });
    }
  }

  // metodo que cambia el estadoMascota de 'encontrado' a 'en_adopcion'
  ponerEnAdopcion() {
    if (!this.puedePonerEnAdopcion() || !this.publicacion()?.activo) return;

    const estado: EstadoMascota = 'en_adopcion';
    const id = this.publicacion()?.id;

    if (!id) return;

    if (confirm('¿Estás seguro de querer poner en adopción a esta mascota?')) {
      this.accionEnCurso.set(true);
      this.publicacionService
        .updateEstadoMascota(id, estado)
        .pipe(finalize(() => this.accionEnCurso.set(false)))
        .subscribe({
          next: (pub) => {
            console.log('Estado Actualizado');
            this.toastService.showToast('Estado de la mascota actualizado', 'success');
            this.publicacion.set(pub);
          },
          error: (error) => {
            console.log('No se ha podido actualizar el estado', error);
            this.toastService.showToast('Error al actualizar el estado', 'error');
          },
        });
    }
  }

  goBack() {
    this.location.back();
  }
}
