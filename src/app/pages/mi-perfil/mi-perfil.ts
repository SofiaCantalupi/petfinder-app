import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { Miembro } from '../../models/miembro';
import { Validator } from '@angular/forms';
import { CambiarContraseniaDTO } from '../../models/auth/cambiar-contrasenia-dto';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  miembroService = inject(MiembroService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  perfilForm!: FormGroup;

  modoEditar = signal(false);
  modoContrasenia = signal(false);

  miembroActual!: Miembro;

  ngOnInit(): void {
    this.inicializarForm();
    this.cargarMiembro();

    this.perfilForm.get('nombre')?.disable();
    this.perfilForm.get('apellido')?.disable();
  }

  private cargarMiembro(): void {
    const miembro$ = this.miembroService.cargarMiembroActual();

    if (!miembro$) {
      return;
    }

    miembro$.subscribe({
      //Si hay un miembro...
      next: (miembro) => {
        // Se rellena el form con los datos del miembro logeado.
        this.perfilForm.patchValue({
          nombre: miembro.nombre,
          apellido: miembro.apellido,
          email: miembro.email,
        });
        this.miembroActual = miembro;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.router.navigate(['/login']);
      },
    });
  }

  //Metodo para inicializar el form con valores deshabilitados para mostrar la info del miembro logeado.
  private inicializarForm(): void {
    this.perfilForm = this.fb.group({
      nombre: [{ value: '' }, [Validators.required, Validators.minLength(2)]],
      apellido: [{ value: '' }, [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],

      actual: [{ value: '', disabled: true }, [Validators.required]],
      nueva: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(8)]],
      confirmar: [{ value: '', disabled: true }, [Validators.required]],
    });
  }

  activarModoEditar(): void {
    //Nos aseguramos de que no este editando la contraseña para evitar errores.
    this.modoContrasenia.set(false);
    this.modoEditar.set(true);

    this.perfilForm.get('nombre')?.enable();
    this.perfilForm.get('apellido')?.enable();
  }

  activarEditarContrasenia(): void {
    this.modoEditar.set(false);
    this.modoContrasenia.set(true);

    // Habilitar inputs de password
    this.perfilForm.get('actual')?.enable();
    this.perfilForm.get('nueva')?.enable();
    this.perfilForm.get('confirmar')?.enable();
  }

  cancelarEdicion() {
    if (!this.modoContrasenia()) {
      this.modoEditar.set(false);

      // Deshabilitar inputs otra vez
      this.perfilForm.get('nombre')?.disable();
      this.perfilForm.get('apellido')?.disable();

      this.perfilForm.patchValue({
        nombre: this.miembroActual.nombre,
        apellido: this.miembroActual.apellido,
        email: this.miembroActual.email,
      });

      return;
    } else {
      this.modoContrasenia.set(false);

      // Limpiar campos
      this.perfilForm.patchValue({
        actual: '',
        nueva: '',
        confirmar: '',
      });

      // Deshabilitar los campos password
      this.perfilForm.get('actual')?.disable();
      this.perfilForm.get('nueva')?.disable();
      this.perfilForm.get('confirmar')?.disable();

      // re-habilitar vista original
      this.perfilForm.patchValue({
        nombre: this.miembroActual.nombre,
        apellido: this.miembroActual.apellido,
        email: this.miembroActual.email,
      });
    }
  }

  guardarCambios() {
    if (!this.modoContrasenia()) {
      if (this.perfilForm.invalid) return;

      const { nombre, apellido } = this.perfilForm.getRawValue();

      this.miembroService
        .actualizarMiembro(this.miembroActual.id, {
          ...this.miembroActual,
          nombre,
          apellido,
        })
        .subscribe({
          next: (actualizado) => {
            this.miembroActual = actualizado; // actualizamos el local
            this.modoEditar.set(false);

            this.perfilForm.get('nombre')?.disable();
            this.perfilForm.get('apellido')?.disable();
          },
          error: (err) => console.error('Error al actualizar:', err),
        });

      return;
    } else {
      const dto: CambiarContraseniaDTO = {
        actual: this.perfilForm.get('actual')?.value,
        nueva: this.perfilForm.get('nueva')?.value,
      };

      this.authService.cambiarPassword(dto).subscribe({
        next: () => {
          this.modoContrasenia.set(false);

          this.perfilForm.get('actual')?.disable();
          this.perfilForm.get('nueva')?.disable();
          this.perfilForm.get('confirmar')?.disable();
        },
        error: (err) => alert(err.message),
      });
    }
  }
}
