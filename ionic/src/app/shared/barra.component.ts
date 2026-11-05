import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { CarritoService } from '../core/carrito.service';
import { VozService } from '../core/voz.service';

import { Icono } from './icono.component';
import { Logo } from './logo.component';

/**
 * Barra superior de todas las páginas: menú (o volver), título o logo, micro y carrito con su contador.
 * El micro está en toda la app: el control por voz no depende de la pantalla (PT-29).
 */
@Component({
  selector: 'ja-barra',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonBackButton,
    IonButton,
    IonTitle,
    IonBadge,
    RouterLink,
    Icono,
    Logo,
  ],
  styles: `
    ion-title {
      font: var(--ja-tipo-titular-m);
      padding-inline: var(--ja-espacio-2);
    }
    ion-badge {
      position: absolute;
      top: calc(-1 * var(--ja-espacio-1));
      right: calc(-1 * var(--ja-espacio-1));
      min-width: var(--ja-espacio-4);
      padding: 0 var(--ja-espacio-1);
      --background: var(--ja-primario);
      --color: var(--ja-sobre-primario);
      font: var(--ja-tipo-etiqueta-s);
      border-radius: var(--ja-radio-completo);
    }
    ion-header {
      box-shadow: none;
    }
    ion-toolbar {
      --border-width: 0;
    }
    .titulo-pagina {
      background: var(--ja-fondo);
      padding: 0 var(--ja-espacio-4) var(--ja-espacio-2);
    }
  `,
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          @if (atras()) {
            <ion-back-button [defaultHref]="atras()" text="" icon="assets/iconos/arrow_back.svg" />
          } @else {
            <ion-menu-button aria-label="Abrir el menú"><ja-icono nombre="menu" /></ion-menu-button>
          }
        </ion-buttons>
        @if (!atras()) {
          <ion-title><ja-logo /></ion-title>
        } @else if (titulo()) {
          <ion-title>{{ titulo() }}</ion-title>
        }
        <ion-buttons slot="end">
          @if (!sinAcciones()) {
            <ion-button aria-label="Hablar con la app" (click)="voz.escuchar()"><ja-icono nombre="mic" /></ion-button>
            <ion-button aria-label="Carrito" routerLink="/carrito">
              <ja-icono nombre="shopping_cart" />
              @if (carrito.unidades() > 0) {
                <ion-badge>{{ carrito.unidades() }}</ion-badge>
              }
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
      @if (!atras() && titulo()) {
        <h1 class="titulo-pagina ja-titular-m ja-sin-margen">{{ titulo() }}</h1>
      }
    </ion-header>
  `,
})
export class Barra {
  readonly titulo = input<string>('');
  /** Ruta a la que volver si no hay historial; sin ella se muestra el botón del menú. */
  readonly atras = input<string>('');
  readonly sinAcciones = input(false);

  readonly carrito = inject(CarritoService);
  readonly voz = inject(VozService);
}
