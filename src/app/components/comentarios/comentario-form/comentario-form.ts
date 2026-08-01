import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComentarioRequestDTO } from '../../../models/comentario-request-dto';
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
  comentarioCreado = output<ComentarioRequestDTO>();

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

    //Chequeo de UX: si no hay sesión, avisamos antes de mandar el request (el backend igual lo rechazaría con 401)
    if (!this.authService.getCurrentUser()) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    const nuevoComentario: ComentarioRequestDTO = {
      texto: this.comentarioForm.getRawValue().texto,
      idPublicacion: this.publicacionId(),
    };

    //emit(): envia el comentario al componente padre
    this.comentarioCreado.emit(nuevoComentario);
    this.comentarioForm.reset();
  }
}
