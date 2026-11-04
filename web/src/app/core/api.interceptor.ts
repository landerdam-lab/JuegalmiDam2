import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ApiError } from './api-error';
import { Sesion } from './sesion';

/**
 * Lo que llevan TODAS las peticiones, en un único sitio (igual que en Android e Ionic):
 * - Authorization: Bearer <token>, si hay sesión. La parte pública va sin token (ADR-028).
 * - La web no envía X-Latitud / X-Longitud: P-37 se deja para más adelante (decisión de Oier, 2026-11-04).
 * Y lo que pasa con TODAS las respuestas: los errores se convierten en ApiError, y ante un 401
 * se cierra la sesión y se vuelve al acceso del backoffice.
 */
export const apiInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(Sesion);
  const router = inject(Router);

  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  const token = sesion.token;
  if (token) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }

  return siguiente(peticion.clone({ setHeaders: cabeceras })).pipe(
    catchError((e: HttpErrorResponse) => {
      // El 401 del login es «contraseña incorrecta», no una sesión caducada
      if (e.status === 401 && !peticion.url.endsWith('/login') && sesion.token) {
        sesion.cerrar();
        void router.navigate(['/acceso'], { queryParams: { caducada: 1 }, replaceUrl: true });
      }
      return throwError(() =>
        e.status === 0 ? ApiError.sinRed() : ApiError.desdeRespuesta(e.status, e.error),
      );
    }),
  );
};
