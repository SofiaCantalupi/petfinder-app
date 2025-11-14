import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ya-logeado',
  imports: [],
  templateUrl: './ya-logeado.html',
  styleUrl: './ya-logeado.css',
})
export class YaLogeado {
  router = inject(Router);
  authService = inject(AuthService);
}
