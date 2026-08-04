import { Component, inject, signal } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast-service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { finalize } from 'rxjs';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-borrar-cuenta',
  imports: [ReactiveFormsModule, CommonModule, Spinner],
  templateUrl: './borrar-cuenta.html',
  styleUrl: './borrar-cuenta.css',
})
export class BorrarCuenta {
  router = inject(Router);
  miembroService = inject(MiembroService);
  authService = inject(AuthService);
  formBuilder = inject(FormBuilder);
  toastService = inject(ToastService);
  confirmarError = signal<true | false>(false);
  isEliminando = signal(false);

  borrarGroup = this.formBuilder.nonNullable.group({
    confirmar: [''],
  });

  eliminarCuenta(confirm: string | undefined): void {
    if (confirm?.toLowerCase() !== 'confirmar') {
      this.toastService.showToast('Debes escribir "confirmar" exactamente.', 'error', 5000);
      this.confirmarError.set(true);
      return;
    }

    this.isEliminando.set(true);
    this.miembroService
      .eliminarCuentaPropia()
      .pipe(finalize(() => this.isEliminando.set(false)))
      .subscribe({
        next: () => {
          this.toastService.showToast('Tu cuenta fue eliminada correctamente.', 'success', 5000);
          this.authService.logout();
        },
        error: (error) => {
          console.error('Error al eliminar la cuenta:', error);
          this.toastService.showToast('Error al eliminar la cuenta.', 'error', 5000);
        },
      });
  }
}
