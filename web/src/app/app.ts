import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Temas } from './core/tema';
import { AvisosRaiz } from './shared/avisos-raiz';
import { DialogosRaiz } from './shared/dialogos';

/** Raíz: la ruta activa + los avisos y los diálogos de confirmación, que sirven a toda la web. */
@Component({
  selector: 'ja-root',
  imports: [RouterOutlet, AvisosRaiz, DialogosRaiz],
  template: `
    <router-outlet />
    <ja-avisos />
    <ja-dialogos />
  `,
})
export class App {
  // Se inyecta aquí para que el modo oscuro se aplique desde el primer instante
  private readonly temas = inject(Temas);
}
