import { Component, ViewChild, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonCheckbox, IonContent, IonFooter, IonSpinner } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { AvisosService } from '../../core/avisos.service';
import { CarritoService, subtotal } from '../../core/carrito.service';
import { metodoPago, precio } from '../../core/formato';
import { PedidosService } from '../../core/pedidos.service';
import { UbicacionService } from '../../core/ubicacion.service';
import { Barra } from '../../shared/barra.component';
import { Icono } from '../../shared/icono.component';
import { Vida } from '../../shared/vida.component';

import { EntregaCaja } from './entrega.component';

@Component({
  imports: [FormsModule, IonContent, IonFooter, IonButton, IonCheckbox, IonSpinner, Barra, Icono, Vida, EntregaCaja],
  template: `
    <ja-barra titulo="Confirmar pedido" atras="/carrito" />
    <ion-content>
      <div class="ja-pagina ja-columna">
        <div>
          <div class="ja-etiqueta-s ja-t2">Paso 2 de 3 · Confirmar</div>
          <ja-vida [llenos]="2" [total]="3" />
        </div>
        <div class="ja-caja ja-muesca">
          <div class="ja-titulo">Resumen del pedido</div>
          @for (l of carrito.lineas(); track l.producto.id + l.tipo) {
            <div class="ja-ticket-fila">
              <span
                >{{ l.producto.nombre }}
                <span class="ja-t2">{{
                  l.tipo === 'compra' ? 'Cantidad: ' + l.cantidad : 'Alquiler · ' + l.dias + ' días'
                }}</span></span
              >
              <span class="ja-precio-s">{{ formato(sub(l)) }}</span>
            </div>
          }
          <div class="ja-separador"></div>
          <div class="ja-ticket-fila">
            <span class="ja-t2">Método de pago: {{ nombreMetodo() }}</span>
          </div>
          <div class="ja-ticket-fila">
            <span class="ja-subtitulo">Total a pagar</span><span class="ja-precio">{{ formato(carrito.total()) }}</span>
          </div>
        </div>

        <ja-entrega #entrega />

        <div class="ja-caja ja-muesca">
          <div class="ja-fila">
            <ja-icono nombre="my_location" /><span class="ja-subtitulo">Necesitamos tu ubicación</span>
          </div>
          <div class="ja-etiqueta-s ja-t2">
            La guardamos con el pedido para saber desde dónde compras. Solo se usa al confirmar.
          </div>
          @switch (ubicacion.estado()) {
            @case ('obtenida') {
              <div class="ja-etiqueta">Ubicación obtenida ({{ coordenadas() }})</div>
            }
            @case ('buscando') {
              <div class="ja-etiqueta">Buscando tu ubicación…</div>
            }
            @default {
              <div class="ja-error-t">Sin permiso de ubicación: no se puede confirmar el pedido</div>
              <ion-button fill="outline" color="secondary" (click)="ubicacion.actualizar()"
                >Activar ubicación</ion-button
              >
            }
          }
        </div>

        <ion-checkbox color="secondary" labelPlacement="end" justify="start" [(ngModel)]="acepto"
          >He revisado mi pedido y los datos de entrega</ion-checkbox
        >
        <div class="ja-etiqueta-s ja-t2">Puedes cancelarlo mientras esté pendiente</div>
        @if (errorForm()) {
          <div class="ja-error-t">{{ errorForm() }}</div>
        }
      </div>
    </ion-content>
    <ion-footer class="ion-no-border">
      <div class="ja-pie">
        <div class="ja-columna">
          <ion-button
            class="ja-boton-ancho ja-boton-cargando"
            color="primary"
            [disabled]="enviando()"
            (click)="confirmar()"
          >
            @if (enviando()) {
              <ion-spinner />
            } @else {
              Confirmar y pagar ({{ formato(carrito.total()) }})
            }
          </ion-button>
        </div>
      </div>
    </ion-footer>
  `,
})
export class ConfirmarPage {
  private readonly pedidos = inject(PedidosService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  readonly carrito = inject(CarritoService);
  readonly ubicacion = inject(UbicacionService);

  @ViewChild('entrega') entrega!: EntregaCaja;

  readonly metodo = input<string>('tarjeta');
  readonly formato = precio;
  readonly sub = subtotal;
  acepto = false;
  readonly errorForm = signal('');
  readonly enviando = signal(false);

  nombreMetodo(): string {
    return metodoPago(this.metodo());
  }

  coordenadas(): string {
    const p = this.ubicacion.punto();
    return p ? `${p.latitud.toFixed(4)}, ${p.longitud.toFixed(4)}` : '';
  }

  ionViewWillEnter(): void {
    void this.ubicacion.actualizar();
  }

  confirmar(): void {
    this.errorForm.set('');
    const entrega = this.entrega.datos();
    if (!entrega) {
      this.errorForm.set(this.entrega.mensajeFalta());
      return;
    }
    if (!this.ubicacion.punto()) {
      this.errorForm.set('Activa la ubicación para continuar');
      return;
    }
    if (!this.acepto) {
      this.errorForm.set('Marca la casilla para confirmar el pedido');
      return;
    }
    this.enviando.set(true);
    this.pedidos.crear(this.carrito.paraLaApi(), this.metodo(), entrega).subscribe({
      next: (p) => {
        this.enviando.set(false);
        this.carrito.vaciar();
        void this.router.navigate(['/pedido', p.id, 'hecho'], { replaceUrl: true });
      },
      error: (e: ApiError) => {
        this.enviando.set(false);
        this.entrega.errores(e);
        void this.avisos.informar(
          e.status === 409 ? 'Falta stock o copias' : 'No se ha podido hacer el pedido',
          e.mensaje,
        );
      },
    });
  }
}
