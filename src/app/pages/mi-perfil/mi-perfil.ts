import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';

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

  ngOnInit(): void {
    const miembro$ = this.miembroService.cargarMiembroActual();

    if (!miembro$) {
      // No hay miembro cargado, volvemos al login
      this.router.navigate(['/login']);
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
          rol: miembro.rol,
        });
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.router.navigate(['/login']);
      },
    });
    this.inicializarForm();
  }

  //Metodo para inicializar el form con valores deshabilitados para mostrar la info del miembro logeado.
  private inicializarForm(): void {
    this.perfilForm = this.fb.group({
      nombre: [{ value: '', disabled: true }],
      apellido: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      rol: [{ value: '', disabled: true }],
    });
  }
}
