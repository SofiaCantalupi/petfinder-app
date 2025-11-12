import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  miembroService = inject(MiembroService);
  public authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const miembro$ = this.miembroService.cargarMiembroActual();

    if (!miembro$) {
      // No hay miembro cargado, volvemos al login
      this.router.navigate(['/login']);
      return;
    }

    miembro$.subscribe({
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.router.navigate(['/login']);
      },
    });
  }
}
