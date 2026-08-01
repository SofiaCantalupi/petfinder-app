import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Miembro } from '../../models/miembro';
import { ToastService } from '../../services/toast-service';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-borrar-cuenta',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './borrar-cuenta.html',
  styleUrl: './borrar-cuenta.css',
})
export class BorrarCuenta {
  router = inject(Router);
  miembroService = inject(MiembroService);
  authService = inject(AuthService);
  formBuilder = inject(FormBuilder);
  toastService = inject(ToastService);
  miembroActual!: Miembro;
  confirmarError = signal<true | false>(false);

  borrarGroup = this.formBuilder.nonNullable.group({
    confirmar: [''],
  });

  eliminarCuenta(confirm: string | undefined): void {
    if (confirm?.toLowerCase() === 'confirmar') {
      // Cargar miembro desde localStorage
      const miembro = localStorage.getItem('currentUser');
      if (miembro) {
        this.miembroActual = JSON.parse(miembro);
        this.miembroService.eliminarMiembro(this.miembroActual).subscribe({
          next: () => this.authService.logout(),
        });
      } else {
        this.toastService.showToast('No se pudo identificar al usuario.', 'error', 5000);
        this.router.navigate(['/login']);
        return;
      }
    } else {
      this.toastService.showToast('Debes escribir "confirmar" exactamente.', 'error', 5000);
      this.confirmarError.set(true);
    }
  }
}
