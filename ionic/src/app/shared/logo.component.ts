import { Component, input } from '@angular/core';

/** Logo y marca Almi Companion (ADR-036): el mismo PNG y los mismos colores del texto que en Android. */
@Component({
  selector: 'ja-logo',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ja-espacio-2);
    }
    img {
      height: var(--alto, var(--ja-espacio-8));
      width: auto;
    }
    .texto {
      font: var(--ja-tipo-titulo);
      color: var(--ja-texto);
    }
    .almi {
      color: var(--ja-marca);
    }
    :host(.grande) {
      flex-direction: column;
      --alto: 96px;
    }
    :host(.grande) .texto {
      font: var(--ja-tipo-titular-l);
    }
  `,
  template: `
    <img src="assets/logo.png" alt="" />
    @if (conTexto()) {
      <span class="texto"><span class="almi">Almi</span> Companion</span>
    }
  `,
})
export class Logo {
  readonly conTexto = input(true);
}
