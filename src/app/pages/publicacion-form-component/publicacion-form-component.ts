import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion-service';
import { MascotaService } from '../../services/mascota-service';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TipoMascota } from '../../models/publicacion';
import { EstadoMascota } from '../../models/publicacion';
import { Publicacion } from '../../models/publicacion';
import { PublicacionRequestDTO } from '../../models/publicacion-request-dto';
import { PublicacionRequestUpdateDTO } from '../../models/publicacion-request-update-dto';
import { UbicacionRequestDTO } from '../../models/ubicacion-request-dto';
import { MascotaRequestDTO } from '../../models/mascota-request-dto';
import { ToastService } from '../../services/toast-service';
import { GeocodingService } from '../../services/geocoding-service';
import { NgOptionTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { Subject, Observable, of, forkJoin } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { NominatimSearchResult } from '../../models/nominatim';
import { formatUbicacion, estadoMascotaAConstante, tipoMascotaAConstante } from '../../utils';

@Component({
  selector: 'app-publicacion-form-component',
  imports: [ReactiveFormsModule, NgClass, RouterLink, NgOptionTemplateDirective, NgSelectComponent],
  templateUrl: './publicacion-form-component.html',
})
export class PublicacionFormComponent implements OnInit, OnDestroy {
  // Inyeccion de dependencias
  private formBuilder = inject(FormBuilder);
  private publicacionService = inject(PublicacionService);
  private mascotaService = inject(MascotaService);
  private toastService = inject(ToastService);
  private geoService = inject(GeocodingService);

  route = inject(ActivatedRoute);
  router = inject(Router);

  // Signal para estado en edicion y id editado
  esEdicion = signal(false);
  publicacionId = signal<number | undefined>(undefined);
  mascotaId = signal<number | undefined>(undefined);

  // Signals para resultados de busqueda y estado de busqueda
  resultadoBusquedaUbicacion = signal<NominatimSearchResult[]>([]);
  isBuscandoUbicacion = signal<boolean>(false);

  // Subject para manejar las búsquedas
  private ubicacionSearchTerms = new Subject<string>();

  constructor() {
    this.ubicacionSearchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isBuscandoUbicacion.set(true)),
        switchMap((term: string) => this.buscarUbicacion(term)),
      )
      .subscribe((data) => {
        this.resultadoBusquedaUbicacion.set(data);
      });
  }

  estadosMascota: { value: EstadoMascota; label: string }[] = [
    { value: 'perdido', label: 'Perdido' },
    { value: 'encontrado', label: 'Encontrado' },
    { value: 'reencontrado', label: 'Reencontrado' },
  ];

  tiposMascota: { value: TipoMascota; label: string }[] = [
    { value: 'perro', label: 'Perro' },
    { value: 'gato', label: 'Gato' },
  ];

  get estadosMascotaFiltrados() {
    if (this.esEdicion()) {
      return this.estadosMascota;
    }
    return this.estadosMascota.filter((e) => e.value !== 'reencontrado');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];

    if (id) {
      this.esEdicion.set(true);
      this.publicacionId.set(Number(id));
      this.cargarFormulario(Number(id));
    }
  }

  ngOnDestroy() {
    this.ubicacionSearchTerms.complete();
  }

  cargarFormulario(id: number) {
    this.publicacionService.getPublicacionById(id).subscribe({
      next: (publicacion) => {
        this.mascotaId.set(publicacion.idMascota);
        this.publicacionForm.patchValue(this.mappearPublicacionAForm(publicacion));
        this.buscarUbicacion(formatUbicacion(publicacion.ubicacion)).subscribe({
          next: (data) => {
            this.resultadoBusquedaUbicacion.set(data);
            this.publicacionForm
              .get('ubicacionQuery')
              ?.setValue(this.resultadoBusquedaUbicacion()[0]);
          },
        });

        this.publicacionForm.markAsPristine();
      },
      error: (error) => {
        console.log('Error cargando el formulario.', error);
        this.router.navigate(['/publicaciones']);
      },
    });
  }

  get puedeGuardar(): boolean {
    return this.publicacionForm.valid && this.publicacionForm.dirty;
  }

  mappearPublicacionAForm(publicacion: Publicacion) {
    return {
      mascota: {
        nombreMascota: publicacion.nombreMascota,
        tipoMascota: publicacion.tipoMascota,
        estadoMascota: publicacion.estadoMascota,
        urlFoto: publicacion.urlFoto,
      },
      descripcion: publicacion.descripcion,
    };
  }

  publicacionForm = this.formBuilder.nonNullable.group({
    mascota: this.formBuilder.nonNullable.group({
      nombreMascota: '',
      tipoMascota: ['' as TipoMascota, Validators.required],
      estadoMascota: ['' as EstadoMascota, Validators.required],
      urlFoto: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    }),
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    ubicacionQuery: [{} as NominatimSearchResult, Validators.required],
  });

  // arma el objeto de ubicacion que espera el backend a partir del resultado de Nominatim
  private mapearUbicacion(resultado: NominatimSearchResult): UbicacionRequestDTO {
    const altura = resultado.address?.house_number
      ? Number(resultado.address.house_number)
      : undefined;

    return {
      direccion: resultado.address?.road ?? resultado.display_name,
      altura,
      latitud: Number(resultado.lat),
      longitud: Number(resultado.lon),
    };
  }

  private mapearMascota(mascotaForm: {
    nombreMascota: string;
    tipoMascota: TipoMascota;
    estadoMascota: EstadoMascota;
    urlFoto: string;
  }): MascotaRequestDTO {
    return {
      nombre: mascotaForm.nombreMascota,
      tipoMascota: tipoMascotaAConstante(mascotaForm.tipoMascota),
      estadoMascota: estadoMascotaAConstante(mascotaForm.estadoMascota),
      urlFoto: mascotaForm.urlFoto,
    };
  }

  onSubmit() {
    if (this.publicacionForm.invalid) {
      this.publicacionForm.markAllAsTouched();
      return;
    }

    const formValue = this.publicacionForm.getRawValue();
    const ubicacion = this.mapearUbicacion(formValue.ubicacionQuery);
    const mascotaDto = this.mapearMascota(formValue.mascota);

    if (this.esEdicion()) {
      const cambiosPublicacion: PublicacionRequestUpdateDTO = {
        descripcion: formValue.descripcion,
        ubicacion,
      };

      forkJoin({
        publicacion: this.publicacionService.updatePublicacion(
          this.publicacionId()!,
          cambiosPublicacion,
        ),
        mascota: this.mascotaService.updateMascota(this.mascotaId()!, mascotaDto),
      }).subscribe({
        next: () => {
          this.toastService.showToast('¡Publicación actualizada!', 'success', 5000);
          this.publicacionForm.reset();
          this.router.navigate(['/publicaciones', this.publicacionId()]);
        },
        error: (error) => {
          console.error('Error actualizando:', error);
          alert('Error al actualizar la publicación');
        },
      });
    } else {
      this.mascotaService.postMascota(mascotaDto).subscribe({
        next: (mascotaCreada) => {
          const nuevaPublicacion: PublicacionRequestDTO = {
            descripcion: formValue.descripcion,
            mascotaId: mascotaCreada.id,
            ubicacion,
          };

          this.publicacionService.postPublicacion(nuevaPublicacion).subscribe({
            next: (pub) => {
              this.toastService.showToast('¡Publicación creada!', 'success', 5000);
              this.publicacionForm.reset();
              this.router.navigate(['/publicaciones', pub.id]);
            },
            error: (error) => {
              console.error('Error creando la publicación:', error);
              alert('Error al crear la publicación');
            },
          });
        },
        error: (error) => {
          console.error('Error creando la mascota:', error);
          alert('Error al crear la mascota');
        },
      });
    }
  }

  onSearchUbicacion(terms: string) {
    this.ubicacionSearchTerms.next(terms);
  }

  returnTrue() {
    return true;
  }

  buscarUbicacion(query: string): Observable<NominatimSearchResult[]> {
    if (!query.trim()) {
      this.isBuscandoUbicacion.set(false);
      return of([]);
    }
    return this.geoService.searchAddress(query).pipe(
      tap(() => this.isBuscandoUbicacion.set(false)),
      catchError((error) => {
        this.isBuscandoUbicacion.set(false);
        console.error(error);
        return of([]);
      }),
    );
  }
}
