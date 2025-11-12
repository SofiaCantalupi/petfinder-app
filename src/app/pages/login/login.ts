import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { LoginRequestDTO } from '../../models/auth/login-request-dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgClass, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private formBuilder = inject(FormBuilder);

  private authService = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // Creacion del formulario
  logInForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    contrasenia: ['', [Validators.required]],
  });

  onSubmit(): void {
    //Se guardan los inputs del formulario
    //Uso getRawValue para evitar usar "non-null assertion" en los campos, me aseguro de que no van a ser nulos (El formBuilder es NonNullable)
    // (!) non-null assertion -> Poner un ! al lado de un campo para decirle a TypeScript que el valor no es nulo y evitar errores.
    const { email, contrasenia } = this.logInForm.getRawValue();

    //Uso los campos para armar el LoginRequestDTO.
    const LoginDto: LoginRequestDTO = {
      email: email,
      contrasenia: contrasenia,
    };

    //Login a través del authService.
    this.authService.login(LoginDto).subscribe({
      next: (miembro) => {
        console.log('Inicio de sesión exitoso:', miembro);
        this.router.navigate(['/publicaciones/crear']);
      },
      error: (error) => {
        console.error('Error al Iniciar sesión el miembro', error);
      },
    });
  }
}
