import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ApiError } from './api-error';
import { SesionService } from './sesion.service';
import { UbicacionService } from './ubicacion.service';

/**
 * Lo que llevan TODAS las peticiones, en un único sitio (igual que CabecerasApi en Android):
 * - Authorization: Bearer <token>, si hay sesión (rúbrica: todo con token salvo login y registro).
 * - X-Latitud / X-Longitud: la última ubicación conocida (ADR-014).
 * Y lo que pasa con TODAS las respuestas: los errores se convierten en ApiError, y ante un 401
 * se cierra la sesión y se vuelve al login.
 */
export const apiInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const ubicacion = inject(UbicacionService);
  const router = inject(Router);

  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  const token = sesion.token;
  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }
  const punto = ubicacion.punto();
  if (punto) {
    // toFixed: siempre con punto decimal y 7 decimales, como DECIMAL(10,7) en la BBDD
    cabeceras['X-Latitud'] = punto.latitud.toFixed(7);
    cabeceras['X-Longitud'] = punto.longitud.toFixed(7);
  }

  return siguiente(peticion.clone({ setHeaders: cabeceras })).pipe(
    catchError((e: HttpErrorResponse) => {
      // El 401 del login es «contraseña incorrecta», no una sesión caducada
      if (e.status === 401 && !peticion.url.endsWith('/login') && sesion.token) {
        sesion.cerrar();
        void router.navigate(['/login'], { queryParams: { caducada: 1 }, replaceUrl: true });
      }
      return throwError(() => (e.status === 0 ? ApiError.sinRed() : ApiError.desdeRespuesta(e.status, e.error)));
    }),
  );
};
