import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EstadoVista } from '../shared/estado-vista';

/** Página 404: una salida clara en vez de una pantalla en blanco. */
@Component({
  selector: 'ja-no-encontrada',
  imports: [RouterLink, EstadoVista],
  template: `
    <div class="ja-contenedor" style="padding-top: var(--ja-espacio-12)">
      <ja-estado-vista
        tipo="vacio"
        icono="search"
        titulo="Esta página no existe"
        texto="Puede que el enlace esté mal escrito o que la página se haya movido."
      >
        <a class="ja-boton" routerLink="/">Volver al inicio</a>
      </ja-estado-vista>
    </div>
  `,
})
export class NoEncontrada {}
