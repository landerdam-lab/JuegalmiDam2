import { Component, input, output } from '@angular/core';
import { IonButton, IonSkeletonText } from '@ionic/angular';

import { Icono } from './icono.component';

/** Los tres estados de cualquier lista o ficha: cargando (esqueleto), vacío y error con «Reintentar». */
@Component({
  selector: 'ja-estado',
  imports: [IonButton, IonSkeletonText, Icono],
  styles: `
    :host { display: block; }
    .caja { display: flex; flex-direction: column; align-items: center; gap: var(--ja-espacio-3); padding: var(--ja-espacio-8) var(--ja-espacio-4); text-align: center; }
    .baldosa { width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; background: var(--ja-superficie-2); color: var(--ja-marca); --tam: var(--ja-espacio-10); }
    .baldosa.error { background: var(--ja-error-suave); color: var(--ja-error); }
    ion-skeleton-text { height: var(--ja-tamano-portada-tarjeta); margin: 0 0 var(--ja-espacio-3); border-radius: var(--ja-radio-l); }
  `,
  template: `
    @switch (tipo()) {
      @case ('cargando') {
        <ion-skeleton-text animated /><ion-skeleton-text animated /><ion-skeleton-text animated />
      }
      @case ('error') {
        <div class="caja">
          <div class="baldosa error ja-muesca"><ja-icono nombre="error" /></div>
          <div class="ja-titulo">{{ titulo() }}</div>
          <div class="ja-cuerpo ja-t2">{{ texto() }}</div>
          <ion-button fill="outline" color="secondary" (click)="reintentar.emit()">Reintentar</ion-button>
        </div>
      }
      @default {
        <div class="caja">
          <div class="baldosa ja-muesca"><ja-icono [nombre]="icono()" /></div>
          <div class="ja-titulo">{{ titulo() }}</div>
          <div class="ja-cuerpo ja-t2">{{ texto() }}</div>
          <ng-content />
        </div>
      }
    }
  `,
})
export class Estado {
  readonly tipo = input.required<'cargando' | 'vacio' | 'error'>();
  readonly titulo = input('');
  readonly texto = input('');
  readonly icono = input('inventory_2');
  readonly reintentar = output<void>();
}
