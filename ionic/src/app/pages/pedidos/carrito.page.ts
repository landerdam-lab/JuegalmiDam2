import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonCard, IonContent, IonFooter, IonRadio, IonRadioGroup } from '@ionic/angular';

import { AvisosService } from '../../core/avisos.service';
import type { LineaCarrito} from '../../core/carrito.service';
import { CarritoService, subtotal } from '../../core/carrito.service';
import { dentroDe, precio } from '../../core/formato';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';

/** PT-11 Carrito: líneas con cantidad, método de pago y resumen. Los precios finales los confirma la API. */
@Component({
  imports: [FormsModule, RouterLink, IonContent, IonFooter, IonCard, IonButton, IonRadioGroup, IonRadio, Barra, Estado, Icono, Imagen],
  styles: `
    .linea { display: flex; gap: var(--ja-espacio-3); padding: var(--ja-espacio-3); }
    ja-imagen { flex: none; width: 72px; border-radius: var(--ja-radio-s); }
    .datos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--ja-espacio-1); }
    .pasos { display: inline-flex; align-items: center; gap: var(--ja-espacio-2); }
    .pasos ion-button { margin: 0; --padding-start: var(--ja-espacio-1); --padding-end: var(--ja-espacio-1); min-height: auto; }
    ion-radio { display: block; padding: var(--ja-espacio-2) 0; }
  `,
  template: `
    <ja-barra titulo="Tu carrito" />
    <ion-content>
      @if (!carrito.lineas().length) {
        <ja-estado tipo="vacio" icono="shopping_cart" titulo="Tu carrito está vacío" texto="Añade videojuegos, consolas o móviles desde el catálogo.">
          <ion-button fill="outline" color="secondary" routerLink="/inicio" routerDirection="root">Ir al catálogo</ion-button>
        </ja-estado>
      } @else {
        <div class="ja-pagina ja-columna">
          @for (l of carrito.lineas(); track l.producto.id + l.tipo) {
            <ion-card class="ja-tarjeta">
              <div class="linea">
                <ja-imagen [src]="l.producto.imagen" [alt]="l.producto.nombre" />
                <div class="datos">
                  <div class="ja-subtitulo">{{ l.producto.nombre }}</div>
                  @if (l.tipo === 'compra') {
                    <div class="ja-etiqueta-s ja-t2">Compra · {{ formato(l.producto.precio) }}/ud.</div>
                    <div class="pasos">
                      <ion-button fill="clear" color="secondary" aria-label="Uno menos" [disabled]="l.cantidad <= 1" (click)="carrito.cambiarCantidad(l, l.cantidad - 1)"><ja-icono nombre="remove" /></ion-button>
                      <span class="ja-codigo">{{ l.cantidad }}</span>
                      <ion-button fill="clear" color="secondary" aria-label="Uno más" [disabled]="l.cantidad >= l.producto.stock" (click)="carrito.cambiarCantidad(l, l.cantidad + 1)"><ja-icono nombre="add" /></ion-button>
                    </div>
                  } @else {
                    <span class="ja-chip-alquiler">Alquiler · {{ l.dias }} días, hasta {{ hasta(l.dias) }}</span>
                  }
                </div>
                <div class="ja-fila" style="flex-direction:column;align-items:flex-end">
                  <ion-button fill="clear" color="medium" aria-label="Quitar del carrito" (click)="quitar(l)"><ja-icono nombre="delete" /></ion-button>
                  <span class="ja-precio-s">{{ formato(sub(l)) }}</span>
                </div>
              </div>
            </ion-card>
          }

          <div class="ja-caja ja-muesca">
            <div class="ja-titulo">Método de pago</div>
            <ion-radio-group [(ngModel)]="metodo">
              @for (m of metodos; track m.valor) {
                <ion-radio color="secondary" [value]="m.valor" labelPlacement="end" justify="start">{{ m.texto }}</ion-radio>
              }
            </ion-radio-group>
          </div>

          <div class="ja-caja ja-muesca">
            <div class="ja-titulo">Resumen del pedido</div>
            <div class="ja-ticket-fila"><span class="ja-t2">Entrega (tienda o domicilio)</span><span>Gratis</span></div>
            <div class="ja-separador"></div>
            <div class="ja-ticket-fila"><span class="ja-subtitulo">Total</span><span class="ja-precio">{{ formato(carrito.total()) }}</span></div>
            <div class="ja-etiqueta-s ja-t2">El precio final lo confirma la tienda al hacer el pedido.</div>
          </div>
          <div class="ja-etiqueta-s ja-t2">En el siguiente paso eliges si lo recoges en la tienda o te lo enviamos a casa. Las dos opciones son gratis.</div>
        </div>
      }
    </ion-content>
    @if (carrito.lineas().length) {
      <ion-footer class="ion-no-border">
        <div class="ja-pie">
          <div class="ja-columna">
            <ion-button class="ja-boton-ancho" color="primary" (click)="continuar()">Continuar · {{ formato(carrito.total()) }}</ion-button>
          </div>
        </div>
      </ion-footer>
    }
  `,
})
export class CarritoPage {
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  readonly carrito = inject(CarritoService);

  readonly formato = precio;
  readonly sub = subtotal;
  readonly hasta = dentroDe;
  metodo = 'tarjeta';
  readonly metodos = [
    { valor: 'tarjeta', texto: 'Tarjeta' },
    { valor: 'bizum', texto: 'Bizum' },
    { valor: 'paypal', texto: 'PayPal' },
    { valor: 'en_tienda', texto: 'En tienda' },
  ];

  quitar(l: LineaCarrito): void {
    const posicion = this.carrito.quitar(l);
    void this.avisos.mensaje('Producto quitado del carrito', { texto: 'Deshacer', hacer: () => this.carrito.reponer(l, posicion) });
  }

  continuar(): void {
    void this.router.navigate(['/pedido/confirmar'], { queryParams: { metodo: this.metodo } });
  }
}
