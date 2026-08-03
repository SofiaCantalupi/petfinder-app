import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SolicitudAdopcionService } from '../../services/solicitud-adopcion-service';
import { ToastService } from '../../services/toast-service';
import { ActivatedRoute } from '@angular/router';
import { Location, NgClass } from '@angular/common';
import {
  SolicitudAdopcionRequestDTO,
  TipoHogar,
  TipoMascotasEnHogar,
} from '../../models/solicitud-adopcion';
import { tipoHogarAConstante, tipoMascotasEnHogarAConstante } from '../../utils';
import { extraerMensajeError } from '../../utils/http-error';

@Component({
  selector: 'app-solicitud-form-component',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './solicitud-form-component.html',
})
export class SolicitudFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private solicitudService = inject(SolicitudAdopcionService);
  private toastService = inject(ToastService);

  private route = inject(ActivatedRoute);
  private location = inject(Location);

  idPublicacion!: number;
  enviando = signal(false);
  errorMensaje = signal<string | null>(null);

  solicitudForm: FormGroup = this.formBuilder.group({
    celular: ['', [Validators.required]],
    tipoHogar: ['' as TipoHogar, [Validators.required]],
    hayMascotaEnHogar: [false, [Validators.required]],
    tipoMascotasEnHogar: [null],
    tienePatio: [false, [Validators.required]],
    aceptaCondiciones: [false, [Validators.requiredTrue]],
    motivoAdopcion: [''],
  });

  ngOnInit(): void {
    this.idPublicacion = Number(this.route.snapshot.paramMap.get('idPublicacion'));

    // Si hay un cambio en el control "hayMascotaEnHogar", se actualiza la validez del control "tipoMascotasEnHogar", que pasa a ser required si es true
    this.solicitudForm.get('hayMascotaEnHogar')?.valueChanges.subscribe((hayMascotaEnHogar) => {
      this.actualizarValidezTipoMascotasEnHogar(hayMascotaEnHogar);
    });
  }

  // Cambia si "tipoMascotasEnHogar" es required o no, dependiendo del valor de "hayMascotaEnHogar"
  private actualizarValidezTipoMascotasEnHogar(hayMascotaEnHogar: boolean): void {
    const control = this.solicitudForm.get('tipoMascotasEnHogar');

    if (hayMascotaEnHogar) {
      control?.setValidators([Validators.required]);
    } else {
      control?.clearValidators();
      control?.setValue(null); //limpia el valor si no es relevante
    }
    control?.updateValueAndValidity();
  }

  // Los enums tipados del backend se deserializan por nombre de constante y en mayuscula,
  // asi que el value del form no se puede mandar tal cual.
  private construirDto(): SolicitudAdopcionRequestDTO {
    const valores = this.solicitudForm.getRawValue();
    const hayMascotaEnHogar: boolean = valores.hayMascotaEnHogar;
    // '' es el value del <option> "Seleccione...": se normaliza a null.
    const tipoMascotas = (valores.tipoMascotasEnHogar || null) as TipoMascotasEnHogar | null;
    const motivoAdopcion = (valores.motivoAdopcion ?? '').trim();

    return {
      idPublicacion: this.idPublicacion,
      celular: valores.celular.trim(),
      tipoHogar: tipoHogarAConstante(valores.tipoHogar as TipoHogar),
      hayMascotaEnHogar,
      // El backend valida por @AssertTrue que ambos campos sean consistentes entre si.
      tipoMascotasEnHogar: hayMascotaEnHogar ? tipoMascotasEnHogarAConstante(tipoMascotas) : null,
      tienePatio: valores.tienePatio,
      aceptaCondiciones: valores.aceptaCondiciones,
      motivoAdopcion: motivoAdopcion.length > 0 ? motivoAdopcion : null,
    };
  }

  onSubmit(): void {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched(); // fuerza a mostrar errores en todos los campos
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set(null);

    this.solicitudService.crear(this.construirDto()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.toastService.showToast('Solicitud de adopción enviada', 'success');
        this.goBack();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // El backend explica por que rechazo la solicitud (mascota no disponible, publicacion
        // propia, solicitud duplicada); conviene mostrarlo tal cual.
        this.errorMensaje.set(extraerMensajeError(err));
        console.error('Error al crear solicitud:', err);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
