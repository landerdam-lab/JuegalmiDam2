import { Component, input } from '@angular/core';

import { Icono } from './icono';

/**
 * Pastilla de estado: color + icono + texto (nunca solo color, DESIGN.md §2).
 * [clase] es el sufijo de .ja-estado--… : «pedido-pendiente», «reparacion-lista», «exito»…
 */
@Component({
  selector: 'ja-pastilla',
  imports: [Icono],
  styles: `
    :host {
      display: inline-flex;
    }
    .ja-estado {
      --tam: var(--ja-espacio-4);
      white-space: nowrap;
    }
  `,
  template: `
    <span class="ja-estado ja-estado--{{ clase() }}">
      @if (icono()) {
        <ja-icono [nombre]="icono()" />
      }
      {{ texto() }}
    </span>
  `,
})
export class Pastilla {
  readonly clase = input.required<string>();
  readonly texto = input.required<string>();
  readonly icono = input('');
}
