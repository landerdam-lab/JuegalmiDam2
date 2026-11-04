import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { precio, subtituloProducto } from '../core/formato';
import type { Producto } from '../core/modelos';
import { Imagen } from './imagen';

/**
 * Tarjeta de producto (DESIGN.md §9): muesca 16, imagen con la misma muesca, nombre en Bricolage,
 * marca · plataforma, precio en mono y chip cian de alquiler. Agotado: opacidad 60 % + pastilla.
 * Es la misma pieza en la portada y en el catálogo (principio 4: la misma pieza en todas partes).
 */
@Component({
  selector: 'ja-tarjeta-producto',
  imports: [RouterLink, Imagen],
  styles: `
    :host {
      display: block;
    }
    a {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: inherit;
      text-decoration: none;
      transition: transform var(--ja-duracion-base) var(--ja-curva-estandar);
    }
    a:hover {
      transform: translateY(calc(var(--ja-espacio-1) * -1));
    }
    a:hover .nombre {
      color: var(--ja-marca);
    }
    a:focus-visible {
      outline-offset: var(--ja-espacio-1);
    }
    .ja-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    ja-imagen {
      --proporcion: var(--proporcion-tarjeta, 4 / 3);
    }
    .agotado ja-imagen {
      opacity: 0.6;
    }
    .datos {
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-1);
      flex: 1;
      padding: var(--ja-espacio-3) var(--ja-espacio-4) var(--ja-espacio-4);
    }
    .nombre {
      font: var(--ja-tipo-titulo);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color var(--ja-duracion-rapida) var(--ja-curva-estandar);
    }
    .sub {
      font: var(--ja-tipo-cuerpo);
      color: var(--ja-texto-2);
    }
    .pie {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ja-espacio-2);
      margin-top: auto;
      padding-top: var(--ja-espacio-2);
    }
    .ja-estado {
      font: var(--ja-tipo-etiqueta-s);
    }
  `,
  template: `
    <a
      [routerLink]="['/producto', producto().id]"
      [attr.aria-label]="producto().nombre + ', ' + precioTexto()"
    >
      <article class="ja-panel" [class.agotado]="!producto().disponible">
        <ja-imagen [src]="producto().imagen" [alt]="producto().nombre" />
        <div class="datos">
          <h3 class="nombre">{{ producto().nombre }}</h3>
          <p class="sub">{{ subtitulo() }}</p>
          <div class="pie">
            <span class="ja-precio">{{ precioTexto() }}</span>
            @if (!producto().disponible) {
              <span class="ja-estado ja-estado--stock-agotado">Agotado</span>
            } @else if (producto().tipo === 'videojuego' && producto().precioAlquiler) {
              <span class="ja-chip-alquiler">Alquiler {{ alquiler() }}/día</span>
            }
          </div>
        </div>
      </article>
    </a>
  `,
})
export class TarjetaProducto {
  readonly producto = input.required<Producto>();
  protected readonly precioTexto = computed(() => precio(this.producto().precio));
  protected readonly alquiler = computed(() => precio(this.producto().precioAlquiler));
  protected readonly subtitulo = computed(() => subtituloProducto(this.producto()));
}
