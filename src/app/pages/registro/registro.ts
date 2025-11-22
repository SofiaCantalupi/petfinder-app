import { Component } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { RegistroRequestDTO } from '../../models/auth/registro-request-dto';
import { ToastService } from '../../services/toast-service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './registro.html',
})
export class Registro {
  private formBuilder = inject(FormBuilder);

  private authService = inject(AuthService);
  private router = inject(Router);
  toastService = inject(ToastService);
  errorMessage = signal<string | null>(null);

  // Creacion del formulario
  registerForm = this.formBuilder.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      //Este regex asegura 1 mayuscula, 1 miniscula, 1 letra, un caracter especial y minimo 8 caracteres.
      contrasenia: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).{8,}$/
          ),
        ],
      ],
      confirmarContrasenia: ['', [Validators.required]],
    },
    {
      validators: this.validadorDeContrasenia,
    }
  );

  //AbstractControl es una clase abstracta de la cual hereda FormGroup. Angular espera este tipo para
  //validaciones personalizadas.
  validadorDeContrasenia(control: AbstractControl): ValidationErrors | null {
    const contrasenia = control.get('contrasenia')?.value;
    const confirmarContrasenia = control.get('confirmarContrasenia')?.value;

    if (contrasenia !== confirmarContrasenia) {
      //En el caso de que las contraseñas no coincidan le seteamos un error al campo especifico confirmarContraseña
      control.get('confirmarContrasenia')?.setErrors({ mismatch: true });
      return { mismatch: true }; //Con esto, el formulario entero se marca como invalido.
    } else {
      const errors = control.get('confirmarContrasenia')?.errors;
      if (errors) {
        //Cuando coinciden las contraseñas, le quitamos el error manualmente (Al ser seteado por nosotros, angular no lo puede sacar por si mismo.)
        delete errors['mismatch']; //Eliminamos el mismatch.
        if (Object.keys(errors).length === 0) {
          control.get('confirmarContrasenia')?.setErrors(null);
          //Nos aseguramos de que no haya errores dejandolo en nulo.
        }
      }
      return null;
    }
  }

  onSubmit(): void {
    //Se guardan los inputs del formulario
    //Uso getRawValue para evitar usar "non-null assertion" en los campos, me aseguro de que no van a ser nulos (El formBuilder es NonNullable)
    // (!) non-null assertion -> Poner un ! al lado de un campo para decirle a TypeScript que el valor no es nulo y evitar errores.
    const { nombre, apellido, email, contrasenia } = this.registerForm.getRawValue();

    //Uso los campos para armar el registroRequestDTO.
    const registroDto: RegistroRequestDTO = {
      nombre: nombre,
      apellido: apellido,
      email: email,
      contrasenia: contrasenia,
    };

    //Registro a través del authService.
    this.authService.register(registroDto).subscribe({
      next: (miembro) => {
        this.toastService.showToast('¡Registro con éxito!', 'success', 5000);
        this.router.navigate(['/publicaciones']);
      },
      error: (error) => {
        this.errorMessage.set(error.message);
      },
    });
  }
}
