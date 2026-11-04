import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';

/** Logo y marca Almi Companion (ADR-036): «Almi» en violeta + «Companion» en tinta, como en las apps. */
@Component({
  selector: 'ja-logo',
  imports: [NgOptimizedImage],
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ja-espacio-2);
      color: var(--ja-texto);
    }
    img {
      width: var(--alto, var(--ja-espacio-8));
      height: var(--alto, var(--ja-espacio-8));
    }
    .texto {
      font: var(--ja-tipo-titulo);
      letter-spacing: var(--ja-tipo-titular-m-espaciado);
      white-space: nowrap;
    }
    .almi {
      color: var(--ja-marca);
    }
  `,
  template: `
    <img ngSrc="logo.png" width="64" height="64" alt="" priority />
    @if (conTexto()) {
      <span class="texto"><span class="almi">Almi</span> Companion</span>
    }
  `,
})
export class Logo {
  readonly conTexto = input(true);
}
