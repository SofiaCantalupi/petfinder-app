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
import { MensajeService } from '../../services/mensaje-service';

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
  private mensajeService = inject(MensajeService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // signals
  publicacion = signal<Publicacion | null>(null);
  cargando = signal<boolean>(true);
  // Se marca tanto en (load) como en (error): si la foto no llega a bajar, el skeleton no puede
  // quedar pulsando para siempre.
  imagenLista = signal(false);
  // un solo signal para los 3 botones de accion: nunca estan visibles a la vez
  accionEnCurso = signal(false);

  // Estado del formulario de mensaje al autor. Va aparte de accionEnCurso porque el formulario
  // convive con los botones de accion: bloquear uno no tiene que bloquear el otro.
  borradorMensaje = signal('');
  enviandoMensaje = signal(false);
  mensajeEnviado = signal(false);

  ubicacionFormateada: string = '';

  // nombre completo del autor: ya viene armado en la propia publicacion (evita pegarle a
  // GET /miembros/{id}, que en el backend real es solo para ADMINISTRADOR)
  nombreCreador = computed(() => {
    return this.publicacion()?.nombreCompleto ?? 'Cargando...';
  });

  // El <img> recien tiene src cuando responde el GET, y despues todavia tarda en pintarse: el
  // skeleton cubre los dos tramos y no solo el de la peticion.
  mostrarSkeletonImagen = computed(() => this.cargando() || !this.imagenLista());

  // Mientras carga, publicacion() es null y '!publicacion()?.activo' daba true: sin este corte
  // la tarjeta arranca gris y con el cartel de eliminada antes de saber si lo esta.
  estaEliminada = computed(() => {
    const pub = this.publicacion();
    return pub ? !pub.activo : false;
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

  // misma regla que poner en adopcion, pero con su propio computed: son dos acciones distintas
  // sobre el estado de la mascota y cada una puede cambiar de condicion por separado
  puedeMarcarReencontrado = computed(() => {
    const pub = this.publicacion();
    return pub ? pub.estadoMascota === 'encontrado' && this.puedeEditar() : false;
  });

  // La banda de acciones se dibuja sola: si no hay ninguna accion disponible para este usuario
  // no tiene que quedar una franja vacia entre la foto y la descripcion.
  tieneAcciones = computed(() => {
    return (
      this.puedeMarcarReencontrado() ||
      this.puedePonerEnAdopcion() ||
      this.puedeSolicitarAdopcion() ||
      (this.puedeEliminar() && this.isAdmin())
    );
  });

  // El mensaje privado es para quien NO publico: el autor no se escribe a si mismo, y el admin
  // ni siquiera entra a /mensajes (la ruta tiene noAdminGuard). Sobre una publicacion eliminada
  // tampoco se ofrece, igual que el resto de las acciones.
  puedeEnviarMensaje = computed(() => {
    const pub = this.publicacion();
    return pub ? pub.activo && !this.puedeEditar() && !this.authService.isAdmin() : false;
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

  enviarMensaje() {
    const pub = this.publicacion();
    const texto = this.borradorMensaje().trim();

    if (!pub || !texto || this.enviandoMensaje() || !this.puedeEnviarMensaje()) return;

    this.enviandoMensaje.set(true);
    this.mensajeService
      .enviarMensaje({ texto, idReceptor: pub.idMiembro })
      .pipe(finalize(() => this.enviandoMensaje.set(false)))
      .subscribe({
        next: () => {
          this.borradorMensaje.set('');
          this.mensajeEnviado.set(true);
          this.toastService.showToast('Mensaje enviado', 'success');
        },
        error: (error) => {
          console.log('No se ha podido enviar el mensaje', error);
          this.toastService.showToast('Error al enviar el mensaje', 'error');
        },
      });
  }

  // No hay entidad Conversacion: el chat se identifica por el id del otro miembro, que viaja
  // como query param para que /mensajes abra esa conversacion y no el listado vacio.
  irAlChat() {
    const pub = this.publicacion();
    if (!pub) return;
    this.router.navigate(['/mensajes'], { queryParams: { contacto: pub.idMiembro } });
  }

  goBack() {
    this.location.back();
  }
}
