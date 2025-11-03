import { Component, Input, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-publicacion-form-component',
  imports: [ReactiveFormsModule],
  templateUrl: './publicacion-form-component.html',
  styleUrl: './publicacion-form-component.css',
})
export class PublicacionFormComponent {
  private formBuilder = inject(FormBuilder);

  // input para saber si estamos editando CAMBIAR POR SIGNAL
  @Input() esEdicion = false;
  @Input() publicacionId?: number; // si viene un ID, estamos editando

  // Arrays para las opciones
  estadosMascota = [
    { value: 'perdido', label: 'Perdido' },
    { value: 'encontrado', label: 'Encontrado' },
    { value: 'reencontrado', label: 'Reencontrado' },
  ];
  
  // filtra el estado "reencontrado" si estamos creando una publicacion
  get estadosMascotaFiltrados() {
    if (this.esEdicion) {
      return this.estadosMascota;
    }
    return this.estadosMascota.filter((e) => e.value !== 'reencontrado');
  }

  tiposMascota = [
    { value: 'perro', label: 'Perro' },
    { value: 'gato', label: 'Gato' },
  ];

  publicacionForm = this.formBuilder.group({
    mascota: this.formBuilder.group({
      nombreMascota: ['', [Validators.required, Validators.minLength(3)]],
      estadoMascota: ['', Validators.required],
      tipoMascota: ['', Validators.required],
      urlFoto: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    }),
    descripcion: ['', [Validators.required, Validators.minLength(3)]],
    ubicacion: this.formBuilder.group({
      calle: ['', [Validators.required, Validators.minLength(3)]],
      altura: [0, [Validators.required, Validators.min(1)]],
    }),
  });

  onSubmit() {}

  /*  <!-- Para crear -->
<app-publicacion-form></app-publicacion-form>

<!-- Para editar -->
<app-publicacion-form [esEdicion]="true" [publicacionId]="123"></app-publicacion-form> */
}
