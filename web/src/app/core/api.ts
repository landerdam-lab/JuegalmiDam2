import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

export type Parametros = Record<string, string | number | boolean | null | undefined>;

/**
 * Cliente HTTP de la web: los demás servicios le piden rutas relativas («videojuegos», «me»…).
 * Devuelve promesas (firstValueFrom) porque cada petición da una sola respuesta: así las
 * pantallas usan async/await y el código se lee de arriba abajo.
 * Las cabeceras (token) y los errores los pone el interceptor, no este servicio.
 */
@Service()
export class Api {
  private readonly http = inject(HttpClient);

  get<T>(ruta: string, parametros: Parametros = {}): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(ruta), { params: this.params(parametros) }));
  }

  post<T>(ruta: string, cuerpo: unknown = {}): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(ruta), cuerpo));
  }

  put<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(this.url(ruta), cuerpo));
  }

  delete(ruta: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(this.url(ruta)));
  }

  /** multipart/form-data (subida de imágenes): el navegador pone el Content-Type con su separador. */
  enviarFormulario<T>(ruta: string, datos: FormData): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(ruta), datos));
  }

  private url(ruta: string): string {
    return `${environment.apiUrl}/${ruta}`;
  }

  /** Quita los filtros vacíos: ?marca=&q= no se envía. */
  private params(parametros: Parametros): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }
}
