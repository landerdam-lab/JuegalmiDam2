import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard } from '@ionic/angular';

import { precio } from '../core/formato';
import type { Producto } from '../core/modelos';

import { Imagen } from './imagen.component';
import { estadoStock, Pastilla } from './pastilla.component';

/** Tarjeta de producto del catálogo (TP), con la muesca del sistema Cartucho. Igual que ProductoAdapter en Android. */
@Component({
  selector: 'ja-producto-tarjeta',
  imports: [IonCard, RouterLink, Imagen, Pastilla],
  styles: `
    ion-card {
      display: block;
      cursor: pointer;
    }
    .interior {
      display: flex;
      gap: var(--ja-espacio-3);
      padding: var(--ja-espacio-3);
    }
    ja-imagen {
      flex: none;
      width: calc(var(--ja-espacio-16) * 1.5);
      border-radius: var(--ja-radio-m);
    }
    .datos {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-1);
      align-items: flex-start;
    }
    .nombre {
      font: var(--ja-tipo-subtitulo);
      font-family: var(--ja-fuente-titulos);
      color: var(--ja-texto);
      display: block;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .apagada {
      opacity: 0.6;
    }
    .precios {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ja-espacio-2);
    }
  `,
  template: `
    <ion-card
      class="ja-tarjeta"
      [class.apagada]="producto().stock <= 0"
      [routerLink]="['/producto', producto().tipo, producto().id]"
    >
      <div class="interior">
        <ja-imagen [src]="producto().imagen" [alt]="'Imagen de ' + producto().nombre" />
        <div class="datos">
          <span class="nombre">{{ producto().nombre }}</span>
          <span class="ja-etiqueta-s ja-t2">{{ detalle() }}</span>
          <div class="precios">
            <span class="ja-precio-s ja-t1">{{ precioTexto() }}</span>
            @if (producto().tipo === 'videojuego' && producto().alquilable) {
              <span class="ja-chip-alquiler">Alquiler {{ alquiler() }}/día</span>
            }
          </div>
          <ja-pastilla [estado]="stock().estado" [texto]="stock().texto" />
        </div>
      </div>
    </ion-card>
  `,
})
export class ProductoTarjeta {
  readonly producto = input.required<Producto>();

  readonly precioTexto = computed(() => precio(this.producto().precio));
  readonly alquiler = computed(() => precio(this.producto().precioAlquiler));
  readonly stock = computed(() => estadoStock(this.producto().stock));
  readonly detalle = computed(() => {
    const p = this.producto();
    const partes = [p.marca?.nombre, p.plataforma?.nombre, p.pegi ? `PEGI ${p.pegi}` : null];
    return partes.filter(Boolean).join(' · ');
  });
}
