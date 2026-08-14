import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { inject } from '@angular/core';
import { NotificacionCampana } from '../notificaciones/notificacion-campana/notificacion-campana';

@Component({
  selector: 'app-header',
  imports: [RouterLink, NotificacionCampana],
  templateUrl: './header.html',
})
export class Header {
  authService = inject(AuthService);
}
