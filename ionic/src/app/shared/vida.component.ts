import { Component, computed, input } from '@angular/core';

/** Barra de vida segmentada: la firma del sistema Cartucho para el progreso (.ja-vida en cartucho.scss). */
@Component({
  selector: 'ja-vida',
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div
      class="ja-vida"
      role="progressbar"
      [attr.aria-valuenow]="llenos()"
      [attr.aria-valuemax]="total()"
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
  readonly segmentos = computed(() => Array.from({ length: this.total() }, (_, i) => i < this.llenos()));
}
