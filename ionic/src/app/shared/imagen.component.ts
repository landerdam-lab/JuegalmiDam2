import { Component, effect, input, signal } from '@angular/core';

import { Icono } from './icono.component';

/**
 * Imagen con placeholder (requisito innegociable): mientras carga se ve el icono «image»
 * sobre superficie-2 y, si falla, «broken_image». loading=lazy: solo se descarga al acercarse a la pantalla.
 */
@Component({
  selector: 'ja-imagen',
  imports: [Icono],
  styles: `
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      background: var(--ja-superficie-2);
      aspect-ratio: var(--proporcion, 1);
    }
    .marca {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ja-borde-campo);
    }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: var(--ajuste, cover);
    }
    img.oculta {
      opacity: 0;
    }
  `,
  template: `
    @if (estado() !== 'lista') {
      <div class="marca"><ja-icono [nombre]="estado() === 'error' ? 'broken_image' : 'image'" /></div>
    }
    @if (src()) {
      <img
        [src]="src()"
        [alt]="alt()"
        loading="lazy"
        decoding="async"
        [class.oculta]="estado() !== 'lista'"
        (load)="estado.set('lista')"
        (error)="estado.set('error')"
      />
    }
  `,
})
export class Imagen {
  readonly src = input<string | null | undefined>();
  readonly alt = input('');
  readonly estado = signal<'cargando' | 'lista' | 'error'>('cargando');

  constructor() {
    // Al reutilizar la tarjeta con otra imagen vuelve a verse el placeholder
    effect(() => this.estado.set(this.src() ? 'cargando' : 'error'));
  }
}
