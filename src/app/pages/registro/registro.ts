import { Component } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';


@Component({
  selector: 'app-registro',
  imports: [RouterLink,NgClass,FormsModule,ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private formBuilder = inject(FormBuilder);

  route = inject(ActivatedRoute);
  router = inject(Router);

  // Creacion del formulario
  registerForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    contrasenia: ['', [Validators.required, Validators.minLength(8)]],
    confirmarContrasenia: ['', [Validators.required]],
  }, {
    validators: this.validadorDeContrasenia
  });

    //AbstractControl es una clase abstracta de la cual hereda FormGroup. Angular espera este tipo para
    //validaciones personalizadas.
    validadorDeContrasenia(control: AbstractControl): ValidationErrors | null {

    const contrasenia = control.get('contrasenia')?.value;
    const confirmarContrasenia = control.get('confirmarContrasenia')?.value;
    
    if (contrasenia !== confirmarContrasenia) {
      //En el caso de que las contraseñas no coincidan le seteamos un error al campo especifico confirmarContraseña 
      control.get('confirmarContrasenia')?.setErrors({ mismatch: true });
      return { mismatch: true };  //Con esto, el formulario entero se marca como invalido.
    } else {

      const errors = control.get('confirmarContrasenia')?.errors;
      if (errors) {
        //Cuando coinciden las contraseñas, le quitamos el error manualmente (Al ser seteado por nosotros, angular no lo puede sacar por si mismo.)
        delete errors['mismatch'];  //Eliminamos el mismatch.
        if (Object.keys(errors).length === 0) {
          control.get('confirmarContrasenia')?.setErrors(null);
          //Nos aseguramos de que no haya errores dejandolo en nulo.
        }
      }
      return null;
    }
  }

    onSubmit() {}

    //Todavía no hace nada...Falta miembroService
}
