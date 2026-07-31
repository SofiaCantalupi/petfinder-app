import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { SolicitudAdopcionService} from '../../services/solicitud-adopcion-service';
import { ToastService} from '../../services/toast-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TipoHogar } from '../../models/solicitud-adopcion';
import { CrearSolicitudDto } from '../../models/solicitud-adopcion';

@Component({
  selector: 'app-solicitud-form-component',
  imports: [ReactiveFormsModule, NgClass, RouterLink],
  templateUrl: './solicitud-form-component.html',
})
export class SolicitudFormComponent {
  private formBuilder = inject(FormBuilder);
  private solicitudService = inject(SolicitudAdopcionService);
  private toastService = inject(ToastService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  idPublicacion!: number;
  enviando: boolean = false;
  errorMensaje: string | null = null;


  solicitudForm: FormGroup = this.formBuilder.group({
    celular: ['', [Validators.required]],
    tipoHogar: ['' as TipoHogar,[Validators.required]],
    hayMascotaEnHogar: [false, [Validators.required]],
    tipoMascotaEnHogar: [null],
    tienePatio: [false, [Validators.required]],
    aceptaCondiciones: [false, [Validators.requiredTrue]],
    motivoAdopcion: ['']
  })

  ngOnInit(): void{
    this.idPublicacion = Number(this.route.snapshot.paramMap.get('idPublicacion'));

    // Si hay un cambio en el control "hayMascotaEnHogar", se actualiza la validez del contrl "tipoMascota", que pasa a ser required si es true
    this.solicitudForm.get("hayMascotaEnHogar")?.valueChanges.subscribe((hayMascotaEnHogar)=>
    {this.actualizarValidezTipoMascotaEnHogar(hayMascotaEnHogar)})
  }

  // Cambia si "tipoMascotaEnHogar" es requeried o no, dependiendo del valor de "hayMascotaEnHogar"
  private actualizarValidezTipoMascotaEnHogar(hayMascotaEnHogar: boolean): void{
    const control = this.solicitudForm.get('tipoMascotaEnHogar');

    if(hayMascotaEnHogar){
      control?.setValidators([Validators.required]);
    }else{
      control?.clearValidators();
      control?.setValue(null); //limpia el valor si no es relevante
    }
    control?.updateValueAndValidity();
  }

  
  onSubmit(): void {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched(); // fuerza a mostrar errores en todos los campos
      return;
    }

    this.enviando = true;
    this.errorMensaje = null;

    const dto: CrearSolicitudDto = {
      idPublicacion: this.idPublicacion,
      ...this.solicitudForm.value,
    };

    this.solicitudService.crear(dto).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/solicitudes/enviadas']); 
      },
      error: (err) => {
        this.enviando = false;
        this.errorMensaje = 'No se pudo enviar la solicitud. Intentalo de nuevo.';
        console.error('Error al crear solicitud:', err);
      },
    });
  }

}
