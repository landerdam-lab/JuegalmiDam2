import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

type Parametros = Record<string, string | number | boolean | null | undefined>;

/** Cliente HTTP de la app: los demás servicios le piden rutas relativas («videojuegos», «me»…). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(ruta: string, parametros: Parametros = {}): Observable<T> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<T>(this.url(ruta), { params });
  }

  post<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.url(ruta), cuerpo);
  }

  private url(ruta: string): string {
    return `${environment.apiUrl}/${ruta}`;
  }
}
