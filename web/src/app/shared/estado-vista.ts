import { Component, input, output } from '@angular/core';

import { Icono } from './icono';

/**
 * Los tres estados de cualquier lista o ficha: cargando (esqueleto), vacío y error con «Reintentar».
 * Vacío y error usan la baldosa de 96 con muesca (amarilla / roja suave) de DESIGN.md §6.
 */
@Component({
  selector: 'ja-estado-vista',
  imports: [Icono],
  styles: `
    :host {
      display: block;
    }
    .caja {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ja-espacio-3);
      padding: var(--ja-espacio-12) var(--ja-espacio-4);
      text-align: center;
    }
    .baldosa {
      width: 96px;
      height: 96px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ja-primario);
      color: var(--ja-sobre-primario);
      --tam: var(--ja-espacio-10);
    }
    .baldosa.error {
      background: var(--ja-error-suave);
      color: var(--ja-error);
    }
    .texto {
      max-width: 46ch;
    }
    .esqueletos {
      display: grid;
      gap: var(--ja-espacio-3);
    }
    .ja-esqueleto {
      height: var(--alto-esqueleto, var(--ja-espacio-16));
    }
  `,
  template: `
    @switch (tipo()) {
      @case ('cargando') {
        <div class="esqueletos" aria-busy="true" aria-label="Cargando">
          @for (i of filas; track i) {
            <span class="ja-esqueleto"></span>
          }
        </div>
      }
      @case ('error') {
        <div class="caja" role="alert">
          <div class="baldosa error ja-muesca"><ja-icono nombre="wifi_off" /></div>
          <h2 class="ja-titulo">{{ titulo() || 'No se ha podido cargar' }}</h2>
          <p class="ja-cuerpo ja-t2 texto">{{ texto() }}</p>
          <button type="button" class="ja-boton ja-boton--secundario" (click)="reintentar.emit()">
            <ja-icono nombre="refresh" /> Reintentar
          </button>
        </div>
      }
      @default {
        <div class="caja">
          <div class="baldosa ja-muesca"><ja-icono [nombre]="icono()" /></div>
          <h2 class="ja-titulo">{{ titulo() }}</h2>
          <p class="ja-cuerpo ja-t2 texto">{{ texto() }}</p>
          <ng-content />
        </div>
      }
    }
  `,
})
export class EstadoVista {
  readonly tipo = input.required<'cargando' | 'vacio' | 'error'>();
  readonly titulo = input('');
  readonly texto = input('');
  readonly icono = input('inventory_2');
  protected readonly filas = [1, 2, 3, 4];
  readonly reintentar = output<void>();
}
