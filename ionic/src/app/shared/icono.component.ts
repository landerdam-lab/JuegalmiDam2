import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** Iconos Material Symbols Rounded, los mismos que Android (no Ionicons). Están en assets/iconos. */
@Component({
  selector: 'ja-icono',
  imports: [IonIcon],
  styles: `:host { display: inline-flex; font-size: var(--tam, var(--ja-tamano-icono)); }`,
  template: `<ion-icon [src]="ruta()" aria-hidden="true" />`,
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly ruta = computed(() => `assets/iconos/${this.nombre()}.svg`);
}
