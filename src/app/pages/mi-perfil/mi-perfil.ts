import { Component, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { MiembroService } from '../../services/miembro-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Miembro } from '../../models/miembro';
import { CambiarContraseniaDTO } from '../../models/auth/cambiar-contrasenia-dto';
import { ToastService } from '../../services/toast-service';
import { PublicacionList } from '../../components/publicacion-list/publicacion-list';
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../models/publicacion';
import { PublicacionCardSkeleton } from '../../components/publicacion-card-skeleton/publicacion-card-skeleton';
import { Spinner } from '../../components/spinner/spinner';
import { PasswordToggleIcon } from '../../components/password-toggle-icon/password-toggle-icon';
import { PasswordRequisito } from '../../components/password-requisito/password-requisito';

@Component({
  selector: 'app-mi-perfil',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PublicacionList,
    PublicacionCardSkeleton,
    Spinner,
    PasswordToggleIcon,
    PasswordRequisito,
  ],
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  miembroService = inject(MiembroService);
  publicacionService = inject(PublicacionService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  perfilForm!: FormGroup;

  misPublicaciones = signal<Publicacion[]>([]);
  cargandoPublicaciones = signal<boolean>(true);
  modoEditar = signal(false);
  modoContrasenia = signal(false);
  errorPassword = signal<string>('');
  isGuardando = signal(false);
  miembroActual!: Miembro;

  mostrarContraseniaActual = signal(false);
  mostrarContraseniaNueva = signal(false);
  mostrarContraseniaConfirmar = signal(false);

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

      this.perfilForm.get('nombre')?.disable();
      this.perfilForm.get('apellido')?.disable();

      this.cargarPublicacionesDelMiembro();
    }

    this.perfilForm.get('nombre')?.disable();
    this.perfilForm.get('apellido')?.disable();
  }

  //Metodo para inicializar el form con valores deshabilitados para mostrar la info del miembro logeado.
  private inicializarForm(): void {
    this.perfilForm = this.fb.group({
      nombre: [
        { value: '' },
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      ],
      apellido: [
        { value: '' },
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
      ],
      email: [{ value: '', disabled: true }],

      actual: [{ value: '', disabled: true }, [Validators.required]],
      nueva: [
        { value: '', disabled: true },
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).{8,}$/,
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

    // sirve para deshabilitar el buton de aceptar cambios hasta que se haya cambiado un valor
    this.perfilForm.get('nombre')?.markAsPristine();
    this.perfilForm.get('apellido')?.markAsPristine();
  }

  activarEditarContrasenia(): void {
    this.modoEditar.set(false);
    this.modoContrasenia.set(true);

    // Habilitar inputs de password
    this.perfilForm.get('actual')?.enable();
    this.perfilForm.get('nueva')?.enable();
    this.perfilForm.get('confirmar')?.enable();

    // Marcar como pristine al activar edición de contraseña
    this.perfilForm.get('actual')?.markAsPristine();
    this.perfilForm.get('nueva')?.markAsPristine();
    this.perfilForm.get('confirmar')?.markAsPristine();
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

      this.isGuardando.set(true);
      this.miembroService
        .actualizarMiembro({
          nombre,
          apellido,
        })
        .pipe(finalize(() => this.isGuardando.set(false)))
        .subscribe({
          next: (actualizado) => {
            this.miembroActual = actualizado; // guardamos el cambio
            this.authService.actualizarUsuarioLocal(actualizado); //Tmb en el localStorage.
            this.modoEditar.set(false);

            this.perfilForm.get('nombre')?.disable();
            this.perfilForm.get('apellido')?.disable();
            this.toastService.showToast('¡Perfil actualizado con éxito!', 'success', 5000);

            //Marcar como pristine después de guardar
            this.perfilForm.get('nombre')?.markAsPristine();
            this.perfilForm.get('apellido')?.markAsPristine();
          },
          error: (err) => console.error('Error al actualizar:', err),
        });

      return;
    } else {
      const dto: CambiarContraseniaDTO = {
        actual: this.perfilForm.get('actual')?.value,
        nueva: this.perfilForm.get('nueva')?.value,
      };

      this.isGuardando.set(true);
      this.authService
        .cambiarPassword(dto)
        .pipe(finalize(() => this.isGuardando.set(false)))
        .subscribe({
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

  //Valor actual de la contraseña nueva, usado para ir marcando los requisitos que se van cumpliendo.
  private get nuevaContraseniaValue(): string {
    return this.perfilForm.get('nueva')?.value ?? '';
  }

  cumpleLongitud(): boolean {
    return this.nuevaContraseniaValue.length >= 8;
  }

  cumpleMayuscula(): boolean {
    return /[A-Z]/.test(this.nuevaContraseniaValue);
  }

  cumpleMinuscula(): boolean {
    return /[a-z]/.test(this.nuevaContraseniaValue);
  }

  cumpleNumero(): boolean {
    return /\d/.test(this.nuevaContraseniaValue);
  }

  cumpleEspecial(): boolean {
    return /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/.test(this.nuevaContraseniaValue);
  }

  private cargarPublicacionesDelMiembro(): void {
    this.cargandoPublicaciones.set(true);

    this.publicacionService.getPublicacionesByMiembro().subscribe({
      next: (publicaciones) => {
        // muestra todas las publicaciones (activas e inactivas)
        this.misPublicaciones.set(publicaciones);
        this.cargandoPublicaciones.set(false);
      },
      error: (error) => {
        console.error('Error al cargar publicaciones del miembro:', error);
        this.cargandoPublicaciones.set(false);
      },
    });
  }

  get puedaGuardarPerfil(): boolean | undefined {
    const nombreControl = this.perfilForm.get('nombre');
    const apellidoControl = this.perfilForm.get('apellido');

    return this.perfilForm.valid && (nombreControl?.dirty || apellidoControl?.dirty);
  }
}
