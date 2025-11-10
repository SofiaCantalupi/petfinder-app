import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion-service';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-publicacion-form-component',
  imports: [ReactiveFormsModule, NgClass, RouterLink],
  templateUrl: './publicacion-form-component.html',
  styleUrl: './publicacion-form-component.css',
})
export class PublicacionFormComponent implements OnInit {
  // Inyeccion de dependencias
  private formBuilder = inject(FormBuilder);
  private publicacionService = inject(PublicacionService);

  route = inject(ActivatedRoute);
  router = inject(Router);

  // input para saber si estamos editando CAMBIAR POR SIGNAL
  esEdicion = signal(false);
  publicacionId = signal<number | undefined>(undefined);

  // Arrays para las opciones
  estadosMascota = [
    { value: 'perdido', label: 'Perdido' },
    { value: 'encontrado', label: 'Encontrado' },
    { value: 'reencontrado', label: 'Reencontrado' },
  ];

  tiposMascota = [
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

  //
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
        this.publicacionForm.patchValue(publicacion);
      },
      error: (error) => {
        console.log('Error cargando el formulario.');
        // si no existe la publicacion redirigir
        this.router.navigate(['/publicaciones']);
      },
    });
  }

  // Creacion del formulario
  publicacionForm = this.formBuilder.nonNullable.group({
    nombreMascota: ['', [Validators.required, Validators.minLength(3)]],
    tipoMascota: ['', Validators.required],
    estadoMascota: ['', Validators.required],
    urlFoto: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    calle: ['', [Validators.required, Validators.minLength(3)]],
    altura: [0, [Validators.required, Validators.min(2)]],
  });

  onSubmit() {
    if (this.publicacionForm.valid) {
      const publicacion = {
        ...this.publicacionForm.getRawValue(),
        fecha: new Date(),
      };

      if (this.esEdicion()) {
        // EDITAR
        this.publicacionService.putPublicacion(this.publicacionId()!, publicacion).subscribe({
          next: () => {
            console.log('Publicación actualizada');
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
        this.publicacionService.postPublicacion(publicacion).subscribe({
          next: () => {
            console.log('Publicación creada');
            this.publicacionForm.reset();
            this.router.navigate(['/publicaciones']);
          },
          error: (error) => {
            console.error('Error creando:', error);
            alert('Error al crear la publicación');
          },
        });
      }
    } else {
      // Marcar campos como touched para mostrar errores
      Object.keys(this.publicacionForm.controls).forEach((key) => {
        this.publicacionForm.get(key)?.markAsTouched();
      });
    }
  }
}
