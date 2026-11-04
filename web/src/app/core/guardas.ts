import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { Sesion } from './sesion';

/**
 * Guardas de las rutas /admin. Son solo comodidad: quien decide de verdad es la API,
 * que vuelve a comprobar el rol en cada endpoint (403 si no puede).
 */

/** Hay que haber iniciado sesión como trabajador. */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const sesion = inject(Sesion);
  if (sesion.haySesion() && sesion.usuario()?.tipo === 'trabajador') {
    return true;
  }
  sesion.cerrar();
  return inject(Router).createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
};

/** Solo el admin. Un técnico que escribe otra ruta a mano acaba en sus reparaciones. */
export const adminGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  return sesion.esAdmin() ? true : inject(Router).createUrlTree(['/admin/reparaciones']);
};

/** /acceso con la sesión abierta lleva directamente al backoffice. */
export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  if (!sesion.haySesion()) {
    return true;
  }
  return inject(Router).createUrlTree([sesion.esAdmin() ? '/admin' : '/admin/reparaciones']);
};
