import { Component, OnInit, signal } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { PublicacionList } from '../../components/publicacion-list/publicacion-list';
import { PublicacionService } from '../../services/publicacion-service';
import { Publicacion } from '../../models/publicacion';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule, ReactiveFormsModule, PublicacionList, RouterLink],
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  miembroService = inject(MiembroService);
  publicacionService = inject(PublicacionService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  perfilForm!: FormGroup;

  misPublicaciones = signal<Publicacion[]>([]);
  cargandoPublicaciones = signal<boolean>(true);

  ngOnInit(): void {
    this.inicializarForm();
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

        this.cargarPublicacionesDelMiembro(miembro.id);
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
      nombre: [{ value: '', disabled: true }],
      apellido: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      rol: [{ value: '', disabled: true }],
    });
  }

  private cargarPublicacionesDelMiembro(idMiembro: number): void {
    this.cargandoPublicaciones.set(true);

    this.publicacionService.getPublicacionesByMiembro(idMiembro).subscribe({
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
}
