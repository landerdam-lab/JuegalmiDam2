import { Component, computed, input, output } from '@angular/core';

import { Icono } from './icono';

/** Paginación de los listados largos (?page&limit de la API): «Anterior · 21–40 de 57 · Siguiente». */
@Component({
  selector: 'ja-paginador',
  imports: [Icono],
  styles: `
    :host {
      display: block;
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ja-espacio-3);
      padding-top: var(--ja-espacio-4);
    }
    .rango {
      font: var(--ja-tipo-codigo);
      letter-spacing: var(--ja-tipo-codigo-espaciado);
      color: var(--ja-texto-2);
    }
    .botones {
      display: flex;
      gap: var(--ja-espacio-2);
    }
  `,
  template: `
    @if (total() > limit()) {
      <nav aria-label="Páginas">
        <span class="rango">{{ desde() }}–{{ hasta() }} de {{ total() }}</span>
        <div class="botones">
          <button
            type="button"
            class="ja-boton ja-boton--secundario ja-boton--peque"
            [disabled]="page() <= 1"
            (click)="cambiar.emit(page() - 1)"
          >
            <ja-icono nombre="chevron_left" /> Anterior
          </button>
          <button
            type="button"
            class="ja-boton ja-boton--secundario ja-boton--peque"
            [disabled]="hasta() >= total()"
            (click)="cambiar.emit(page() + 1)"
          >
            Siguiente <ja-icono nombre="chevron_right" />
          </button>
        </div>
      </nav>
    }
  `,
})
export class Paginador {
  readonly page = input.required<number>();
  readonly limit = input.required<number>();
  readonly total = input.required<number>();
  readonly cambiar = output<number>();

  protected readonly desde = computed(() => (this.page() - 1) * this.limit() + 1);
  protected readonly hasta = computed(() => Math.min(this.page() * this.limit(), this.total()));
}
