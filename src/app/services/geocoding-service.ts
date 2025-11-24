import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { NominatimSearchResult } from '../models/nominatim';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private baseUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  searchAddress(query: string): Observable<NominatimSearchResult[]> {
    const params = new HttpParams()
      .set('q', `${query}, Mar del Plata, Buenos Aires, Argentina`)
      .set('format', 'json')
      .set('limit', '10');

    return this.http.get<any[]>(this.baseUrl, { params }).pipe(
      map((results) => {
        if (results.length === 0) {
          return [];
        }
        return results;
      })
    );
  }
}
