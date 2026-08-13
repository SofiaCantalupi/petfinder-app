import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DATABASE_BASE_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly apiUrl = `${DATABASE_BASE_URL}/mensajes`;

  private http = inject(HttpClient);
}
