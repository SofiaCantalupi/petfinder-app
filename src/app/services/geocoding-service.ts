import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  validateAddress(calle: string, altura: number): Observable<{
    latitud: number;
    longitud: number;
    isValid: boolean;
  }> {
    const query = `${calle} ${altura}, Mar del Plata, Buenos Aires, Argentina`;

    const params = new HttpParams()
      .set('q', query)
      .set('format', 'json')
      .set('limit', '1');

    return this.http.get<any[]>(this.baseUrl, { params }).pipe(
      map((results) => {
        const result = results[0];

        if (!result) {
          return {
            latitud: 0,
            longitud: 0,
            isValid: false,
          };
        }

        return {
          latitud: parseFloat(result.lat), 
          longitud: parseFloat(result.lon),   
          isValid: true,
        };
      })
    );
  }
}
