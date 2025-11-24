import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Comentario } from '../../../models/comentario';
import { AuthService } from '../../../services/auth-service';
import { NgClass } from '@angular/common';
import { PublicacionService } from '../../../services/publicacion-service';
import { Publicacion } from '../../../models/publicacion';

@Component({
  selector: 'app-comentario-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './comentario-form.html',
})
export class ComentarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private publicacionService = inject(PublicacionService);

  // Input: id de la publicacion donde se va a comentar
  publicacionId = input.required<number>();
  publicacion = signal<Publicacion | undefined>(undefined);

  // Output: evento cuando se crea un comentario
  comentarioCreado = output<Omit<Comentario, 'id'>>();

  // Formulario reactivo
  comentarioForm = this.fb.nonNullable.group({
    texto: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit() {
    this.publicacionService.getPublicacionById(this.publicacionId()).subscribe({
      next: (pub) => {
        if (pub) {
          this.publicacion.set(pub);
        }
      },
      error: (error) => {
        console.log('Error obteniendo la publicacion', error);
      },
    });
  }

  //si el form es invalido no hace nada
  onSubmit(): void {
    if (this.comentarioForm.invalid) return;

    //Obtiene el usuario logueado del localStorage, si no hay usuario, muestra alerta y sale
    const miembroActual = this.authService.getCurrentUser();

    if (!miembroActual) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    const nuevoComentario: Omit<Comentario, 'id'> = {
      texto: this.comentarioForm.getRawValue().texto,
      fechaPublicacion: new Date().toISOString(),
      activo: true,
      publicacionId: this.publicacionId(),
      miembroId: miembroActual.id,
      miembroNombre: miembroActual.nombre,
      miembroApellido: miembroActual.apellido,
    };

    //emit(): envia el comentario al componente padre
    this.comentarioCreado.emit(nuevoComentario);
    this.comentarioForm.reset();
  }
}
