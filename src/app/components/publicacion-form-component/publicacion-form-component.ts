import { Component, Input, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Validators } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion-service';

@Component({
  selector: 'app-publicacion-form-component',
  imports: [ReactiveFormsModule],
  templateUrl: './publicacion-form-component.html',
  styleUrl: './publicacion-form-component.css',
})
export class PublicacionFormComponent {
  private formBuilder = inject(FormBuilder);
  private publicacionService = inject(PublicacionService);

  // input para saber si estamos editando CAMBIAR POR SIGNAL
  /* @Input() esEdicion = false;
  @Input() publicacionId?: number; // si viene un ID, estamos editando */

  esEdicion = signal(false);
  publicacionId = signal<number | undefined>(undefined);

  // Arrays para las opciones
  estadosMascota = [
    { value: 'perdido', label: 'Perdido' },
    { value: 'encontrado', label: 'Encontrado' },
    { value: 'reencontrado', label: 'Reencontrado' },
  ];

  // filtra el estado "reencontrado" si estamos creando una publicacion
  get estadosMascotaFiltrados() {
    if (this.esEdicion()) {
      return this.estadosMascota;
    }
    return this.estadosMascota.filter((e) => e.value !== 'reencontrado');
  }

  tiposMascota = [
    { value: 'perro', label: 'Perro' },
    { value: 'gato', label: 'Gato' },
  ];

  publicacionForm = this.formBuilder.nonNullable.group({
    nombreMascota: ['', [Validators.required, Validators.minLength(3)]],
    tipoMascota: ['', Validators.required],
    estadoMascota: ['', Validators.required],
    urlFoto: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    calle: ['', [Validators.required, Validators.minLength(3)]],
    altura: [0, [Validators.required, Validators.min(1)]],
  });

  onSubmit() {
    if (this.publicacionForm.valid) {
      const publicacion = {
        ...this.publicacionForm.getRawValue(),
        fecha: new Date(),
      };
      this.publicacionService.postPublicacion(publicacion);
      this.publicacionForm.reset();
    }
  }
}

/*  <!-- Para crear -->
<app-publicacion-form></app-publicacion-form>

<!-- Para editar -->
<app-publicacion-form [esEdicion]="true" [publicacionId]="123"></app-publicacion-form> */
