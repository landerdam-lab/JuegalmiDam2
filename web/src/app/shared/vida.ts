import { Component, computed, input } from '@angular/core';

/**
 * Barra de vida segmentada: la segunda firma del sistema «Cartucho» para el progreso
 * (3 segmentos el pedido, 4 la reparación, 5 las copias de alquiler). Clase .ja-vida de cartucho.scss.
 * Lleva su texto para lectores de pantalla: el estado nunca va solo con color.
 */
@Component({
  selector: 'ja-vida',
  styles: `
    :host {
      display: block;
      min-width: var(--ancho, var(--ja-espacio-16));
    }
  `,
  template: `
    <div
      class="ja-vida"
      role="progressbar"
      [attr.aria-valuenow]="llenos()"
      aria-valuemin="0"
      [attr.aria-valuemax]="total()"
      [attr.aria-label]="etiqueta() || null"
      [style.--color]="color()"
    >
      @for (s of segmentos(); track $index) {
        <span [class.lleno]="s"></span>
      }
    </div>
  `,
})
export class Vida {
  readonly llenos = input.required<number>();
  readonly total = input.required<number>();
  readonly color = input('var(--ja-marca)');
  readonly etiqueta = input('');
  protected readonly segmentos = computed(() =>
    Array.from({ length: this.total() }, (_, i) => i < this.llenos()),
  );
}
