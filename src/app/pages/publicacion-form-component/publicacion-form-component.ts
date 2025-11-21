import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion-service';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TipoMascota } from '../../models/publicacion';
import { EstadoMascota } from '../../models/publicacion';
import { Publicacion } from '../../models/publicacion';
import { MiembroService } from '../../services/miembro-service';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-publicacion-form-component',
  imports: [ReactiveFormsModule, NgClass, RouterLink],
  templateUrl: './publicacion-form-component.html',
})
export class PublicacionFormComponent implements OnInit {
  // Inyeccion de dependencias
  private formBuilder = inject(FormBuilder);
  private publicacionService = inject(PublicacionService);
  private miembroService = inject(MiembroService);
  private toastService = inject(ToastService);

  route = inject(ActivatedRoute);
  router = inject(Router);

  // input para saber si estamos editando CAMBIAR POR SIGNAL
  esEdicion = signal(false);
  publicacionId = signal<number | undefined>(undefined);

  // Arrays para las opciones
  estadosMascota: { value: EstadoMascota; label: string }[] = [
    { value: 'perdido', label: 'Perdido' },
    { value: 'encontrado', label: 'Encontrado' },
    { value: 'reencontrado', label: 'Reencontrado' },
  ];

  tiposMascota: { value: TipoMascota; label: string }[] = [
    { value: 'perro', label: 'Perro' },
    { value: 'gato', label: 'Gato' },
  ];

  // filtra el estado "reencontrado" si estamos creando una publicacion
  get estadosMascotaFiltrados() {
    if (this.esEdicion()) {
      return this.estadosMascota;
    }
    return this.estadosMascota.filter((e) => e.value !== 'reencontrado');
  }

  ngOnInit(): void {
    // se fija si en la URL existe un id
    const id = this.route.snapshot.params['id'];

    if (id) {
      // si existe significa que se esta editando una publicacion
      this.esEdicion.set(true);
      this.publicacionId.set(Number(id));
      this.cargarFormulario(Number(id));
    }
  }

  cargarFormulario(id: number) {
    this.publicacionService.getPublicacionById(id).subscribe({
      next: (publicacion) => {
        // se cargan los datos con lo retornado por el mappeo de la publicacion plana, a una estructura anidada
        this.publicacionForm.patchValue(this.mappearPublicacionAForm(publicacion));
      },
      error: (error) => {
        console.log('Error cargando el formulario.', error);
        // si no existe la publicacion redirigir
        this.router.navigate(['/publicaciones']);
      },
    });
  }

  // metodo helper para convertir la estructura plana de la interfaz, a una anidada como la que requiere el formulario
  mappearPublicacionAForm(publicacion: Publicacion) {
    return {
      mascota: {
        nombreMascota: publicacion.nombreMascota,
        tipoMascota: publicacion.tipoMascota,
        estadoMascota: publicacion.estadoMascota,
        urlFoto: publicacion.urlFoto,
      },
      descripcion: publicacion.descripcion,
      ubicacion: {
        calle: publicacion.calle,
        altura: publicacion.altura,
      },
    };
  }

  // Creacion del formulario
  publicacionForm = this.formBuilder.nonNullable.group({
    mascota: this.formBuilder.nonNullable.group({
      nombreMascota: '',
      tipoMascota: ['' as TipoMascota, Validators.required],
      estadoMascota: ['' as EstadoMascota, Validators.required],
      urlFoto: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    }),
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    ubicacion: this.formBuilder.nonNullable.group({
      calle: ['', [Validators.required, Validators.minLength(3)]],
      altura: [0, [Validators.required, Validators.min(2)]],
    }),
  });

  onSubmit() {
    if (this.publicacionForm.invalid) {
      // marcar todos los campos como touched, incluyendo los anidados
      this.publicacionForm.markAllAsTouched();
      return;
    }

    // obtener el miembro loggeado
    const miembroActual$ = this.miembroService.cargarMiembroActual();
    if (!miembroActual$) {
      alert('Debes iniciar sesión para publicar');
      this.router.navigate(['/login']);
      return;
    }

    // se obtienen los datos cargados en el formulario
    const formValue = this.publicacionForm.getRawValue();

    //  toda la lógica de editar y crear esta dentro del subscribe
    miembroActual$.subscribe({
      next: (miembro) => {
        const publicacionBase: Omit<Publicacion, 'id'> = {
          idMiembro: miembro.id,
          // mascota
          nombreMascota: formValue.mascota.nombreMascota,
          tipoMascota: formValue.mascota.tipoMascota,
          estadoMascota: formValue.mascota.estadoMascota,
          urlFoto: formValue.mascota.urlFoto,
          // descripcion
          descripcion: formValue.descripcion,
          calle: formValue.ubicacion.calle,
          altura: formValue.ubicacion.altura,
          // datos que no vienen del formulario
          fecha: new Date().toISOString(),
          activo: true,
        };

        // esto se tiene que cambiar en la integracion con spring boot
        if (this.esEdicion()) {
          // se extraen solo los campos que pueden llegar a cambiar, no se incluye fecha, estado ni idMiembro
          const cambios = {
            nombreMascota: publicacionBase.nombreMascota,
            tipoMascota: publicacionBase.tipoMascota,
            estadoMascota: publicacionBase.estadoMascota,
            urlFoto: publicacionBase.urlFoto,
            descripcion: publicacionBase.descripcion,
            calle: publicacionBase.calle,
            altura: publicacionBase.altura,
          };

          // EDITAR
          this.publicacionService.updatePublicacion(this.publicacionId()!, cambios).subscribe({
            next: () => {
              console.log('Publicación actualizada');
              this.toastService.showToast('¡Publicación actualizada!', 'success', 5000);
              this.publicacionForm.reset();
              this.router.navigate(['/publicaciones', this.publicacionId()]);
            },
            error: (error) => {
              console.error('Error actualizando:', error);
              alert('Error al actualizar la publicación');
            },
          });
        } else {
          // CREAR
          this.publicacionService.postPublicacion(publicacionBase).subscribe({
            next: (pub) => {
              console.log('Publicación creada', pub);
              this.toastService.showToast('¡Publicación creada!', 'success', 5000);
              this.publicacionForm.reset();
              this.router.navigate(['/publicaciones', pub.id]);
            },
            error: (error) => {
              console.error('Error creando:', error);
              alert('Error al crear la publicación');
            },
          });
        }
      },
      // este error correspone el subscribe de cargarmiembrologeado
      error: (error) => {
        console.error('Error al cargar miembro:', error);
        alert('Error al obtener datos del usuario');
        this.router.navigate(['/login']);
      },
    });
  }
}
