import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mascota } from '../models/mascota';
import { MascotaRequestDTO } from '../models/mascota-request-dto';
import { DATABASE_BASE_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class MascotaService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/mascotas`;

  constructor(private http: HttpClient) {}

  postMascota(nuevaMascota: MascotaRequestDTO): Observable<Mascota> {
    return this.http.post<Mascota>(this.apiUrl, nuevaMascota);
  }

  // actualizacion parcial: solo se mandan los campos que cambiaron
  updateMascota(id: number, cambios: Partial<MascotaRequestDTO>): Observable<Mascota> {
    return this.http.put<Mascota>(`${this.apiUrl}/${id}`, cambios);
  }
}
