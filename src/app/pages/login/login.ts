import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService } from '../../services/auth-service';

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
    password: ['', [Validators.required]],
  });

  onSubmit() {}

  //Todavía no hace nada...Falta miembroService
}
