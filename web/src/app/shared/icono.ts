import { Component, computed, input } from '@angular/core';

/**
 * Iconos Material Symbols Rounded (peso 500), los mismos que Android e Ionic (DESIGN.md §6, D-6).
 * Los SVG están en public/iconos. Se pintan con una máscara CSS rellena de currentColor:
 * así el icono toma el color del texto que lo rodea y no hace falta una librería de iconos.
 */
@Component({
  selector: 'ja-icono',
  host: { 'aria-hidden': 'true', '[style.--mascara]': 'mascara()' },
  styles: `
    :host {
      display: inline-block;
      flex: none;
      width: var(--tam, var(--ja-tamano-icono));
      height: var(--tam, var(--ja-tamano-icono));
      background: currentColor;
      mask: var(--mascara) center / contain no-repeat;
      -webkit-mask: var(--mascara) center / contain no-repeat;
    }
  `,
  template: '',
})
export class Icono {
  readonly nombre = input.required<string>();
  protected readonly mascara = computed(() => `url('/iconos/${this.nombre()}.svg')`);
}
