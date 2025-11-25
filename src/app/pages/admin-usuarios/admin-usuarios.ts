import { Component, OnInit, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { MiembroService } from '../../services/miembro-service';
import { AuthService } from '../../services/auth-service';
import { ToastService } from '../../services/toast-service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Miembro } from '../../models/miembro';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-usuarios.html',
})
export class AdminUsuarios implements OnInit {
  private miembroService = inject(MiembroService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  miembros = signal<Miembro[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');
  eliminando = signal<number | null>(null); // ID del miembro que se está eliminando

  miembrosFiltrados = computed(() => {
    const searchTerm = this.busqueda().toLowerCase().trim();
    const currentUserId = this.authService.usuarioId();

    if (!searchTerm) {
      // excluir al usuario actual de la lista
      return this.miembros().filter((m) => m.id !== currentUserId);
    }

    return this.miembros().filter((m) => {
      const nombreCompleto = `${m.nombre} ${m.apellido}`.toLowerCase();
      return nombreCompleto.includes(searchTerm) && m.id !== currentUserId;
    });
  });

  ngOnInit(): void {
    this.cargarMiembros();
  }

  cargarMiembros(): void {
    this.cargando.set(true);

    this.miembroService.getAllMiembros().subscribe({
      next: (miembros) => {
        this.miembros.set(miembros);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando miembros:', error);
        this.toastService.showToast('Error al cargar usuarios', 'error');
        this.cargando.set(false);
      },
    });
  }

  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  confirmarEliminacion(miembro: Miembro): void {
    const confirmacion = confirm(
      `¿Estás seguro de eliminar a ${miembro.nombre} ${miembro.apellido}?\n\n` +
        `Esta acción eliminará:\n` +
        `• El usuario\n` +
        `• Todas sus publicaciones\n` +
        `• Todos sus comentarios\n\n` +
        `ESTA ACCIÓN NO SE PUEDE DESHACER.`
    );

    if (confirmacion) {
      this.miembroService.eliminarMiembro(miembro);
      setTimeout(()=> this.cargarMiembros(),100);
    }
  }

  getRolBadgeClass(rol: string): string {
    return rol === 'administrador' ? 'badge-admin' : 'badge-usuario';
  }
}
