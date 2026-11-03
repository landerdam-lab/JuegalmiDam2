import { inject } from '@angular/core';
import type { CanActivateFn} from '@angular/router';
import { Router } from '@angular/router';

import { SesionService } from './sesion.service';

/** Las páginas de la app necesitan sesión; sin ella, al login. */
export const conSesion: CanActivateFn = () =>
  inject(SesionService).haySesion() || inject(Router).createUrlTree(['/login']);
