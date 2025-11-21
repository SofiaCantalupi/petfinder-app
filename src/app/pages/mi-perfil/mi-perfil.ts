import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { Miembro } from '../../models/miembro';
import { Validator } from '@angular/forms';
import { CambiarContraseniaDTO } from '../../models/auth/cambiar-contrasenia-dto';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  miembroService = inject(MiembroService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  perfilForm!: FormGroup;

  modoEditar = signal(false);
  modoContrasenia = signal(false);

  miembroActual!: Miembro;

  errorPassword = signal<string>('');

  ngOnInit(): void {
    this.inicializarForm();

    // Cargar miembro desde localStorage
    const miembro = localStorage.getItem('currentUser');
    if (miembro) {
      this.miembroActual = JSON.parse(miembro);
      this.perfilForm.patchValue({
        nombre: this.miembroActual.nombre,
        apellido: this.miembroActual.apellido,
        email: this.miembroActual.email,
      });
    }

    this.perfilForm.get('nombre')?.disable();
    this.perfilForm.get('apellido')?.disable();
  }

  //Metodo para inicializar el form con valores deshabilitados para mostrar la info del miembro logeado.
  private inicializarForm(): void {
    this.perfilForm = this.fb.group({
      nombre: [{ value: '' }, [Validators.required, Validators.minLength(3)]],
      apellido: [{ value: '' }, [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],

      actual: [{ value: '', disabled: true }, [Validators.required]],
      nueva: [
        { value: '', disabled: true },
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).{8,}$/
          ),
        ],
      ],
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
      this.perfilForm.get('nombre')?.markAsUntouched();
      this.perfilForm.get('apellido')?.disable();
      this.perfilForm.get('apellido')?.markAsUntouched();

      this.perfilForm.patchValue({
        nombre: this.miembroActual.nombre,
        apellido: this.miembroActual.apellido,
        email: this.miembroActual.email,
      });

      return;
    } else {
      this.modoContrasenia.set(false);
      this.errorPassword.set('');

      // Limpiar campos
      this.perfilForm.patchValue({
        actual: '',
        nueva: '',
        confirmar: '',
      });

      // Deshabilitar los campos password
      this.perfilForm.get('actual')?.disable();
      this.perfilForm.get('actual')?.markAsUntouched();

      this.perfilForm.get('nueva')?.disable();
      this.perfilForm.get('nueva')?.markAsUntouched();

      this.perfilForm.get('confirmar')?.disable();
      this.perfilForm.get('confirmar')?.markAsUntouched();

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
          nombre,
          apellido,
        })
        .subscribe({
          next: (actualizado) => {
            this.miembroActual = actualizado; // guardamos el cambio
            this.authService.actualizarUsuarioLocal(actualizado); //Tmb en el localStorage.
            this.modoEditar.set(false);

            this.perfilForm.get('nombre')?.disable();
            this.perfilForm.get('apellido')?.disable();
            this.toastService.showToast('¡Perfil actualizado con éxito!', 'success', 5000);
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
          this.errorPassword.set(''); // Limpiamos errores
          this.toastService.showToast('¡Contraseña actualizada con éxito!', 'success', 5000);
        },
        error: (err: Error) => {
          this.errorPassword.set(err.message);
        },
      });
    }
  }
}
