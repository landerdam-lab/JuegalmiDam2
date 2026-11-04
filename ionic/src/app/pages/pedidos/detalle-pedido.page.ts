import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonSpinner } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { AvisosService } from '../../core/avisos.service';
import { fechaCorta, fechaHora, metodoPago, precio, referenciaPedido } from '../../core/formato';
import type { Pedido } from '../../core/modelos';
import { PedidosService } from '../../core/pedidos.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Imagen } from '../../shared/imagen.component';
import { Pastilla } from '../../shared/pastilla.component';
import { Vida } from '../../shared/vida.component';

import { EntregaCaja } from './entrega.component';

const TEXTOS = {
  tienda: {
    pendiente: 'Estamos preparando tu pedido.',
    preparado: 'Tu pedido está listo. Recógelo en la tienda.',
    entregado: 'Pedido entregado. ¡Que lo disfrutes!',
    cancelado: 'Este pedido se canceló.',
  },
  domicilio: {
    pendiente: 'Estamos preparando tu pedido.',
    preparado: 'Tu pedido está preparado y sale hacia tu casa.',
    entregado: 'Pedido entregado en tu casa. ¡Que lo disfrutes!',
    cancelado: 'Este pedido se canceló.',
  },
};

/** PT-14 Detalle de pedido: estado, productos, resumen, entrega y cancelar (solo si está pendiente). */
@Component({
  imports: [
    RouterLink,
    IonContent,
    IonFooter,
    IonButton,
    IonSpinner,
    Barra,
    Estado,
    Imagen,
    Pastilla,
    Vida,
    EntregaCaja,
  ],
  styles: `
    .linea {
      display: flex;
      gap: var(--ja-espacio-3);
      align-items: center;
      cursor: pointer;
    }
    ja-imagen {
      flex: none;
      width: 56px;
      border-radius: var(--ja-radio-s);
    }
    .datos {
      flex: 1;
      min-width: 0;
    }
  `,
  template: `
    <ja-barra [titulo]="titulo()" atras="/pedidos" />
    <ion-content>
      @if (pedido(); as p) {
        <div class="ja-pagina ja-columna">
          <div class="ja-caja ja-muesca">
            <div class="ja-entre">
              <span class="ja-etiqueta-s ja-t2">{{ fecha(p.fecha) }}</span>
              <ja-pastilla [estado]="'pedido-' + p.estado" />
            </div>
            <ja-vida [llenos]="pasos()" [total]="3" />
            <div class="ja-cuerpo">{{ textoEstado() }}</div>
          </div>
          <div class="ja-caja ja-muesca">
            <div class="ja-titulo">Productos</div>
            @for (c of p.compras; track c.id) {
              <div class="linea" [routerLink]="['/producto', c.producto.tipo, c.producto.id]">
                <ja-imagen [src]="c.producto.imagen" [alt]="c.producto.nombre" />
                <div class="datos">
                  <div class="ja-subtitulo">{{ c.producto.nombre }}</div>
                  <div class="ja-etiqueta-s ja-t2">×{{ c.cantidad }} · {{ formato(c.precioUnitario) }}/ud.</div>
                </div>
                <span class="ja-precio-s">{{ formato(c.subtotal) }}</span>
              </div>
            }
            @for (a of p.alquileres; track a.id) {
              <div class="linea" [routerLink]="['/producto', a.videojuego.tipo, a.videojuego.id]">
                <ja-imagen [src]="a.videojuego.imagen" [alt]="a.videojuego.nombre" />
                <div class="datos">
                  <div class="ja-subtitulo">{{ a.videojuego.nombre }}</div>
                  <div class="ja-etiqueta-s ja-t2">
                    Alquiler {{ corta(a.fechaInicio) }} → {{ corta(a.fechaFin) }} · {{ formato(a.precioDia) }}/día
                  </div>
                </div>
                <span class="ja-precio-s">{{ formato(a.subtotal) }}</span>
              </div>
            }
          </div>
          <div class="ja-caja ja-muesca">
            <div class="ja-titulo">Resumen</div>
            <div class="ja-ticket-fila">
              <span class="ja-t2">Método de pago</span><span>{{ metodo(p.metodoPago) }}</span>
            </div>
            <div class="ja-separador"></div>
            <div class="ja-ticket-fila">
              <span class="ja-subtitulo">Total</span><span class="ja-precio">{{ formato(p.total) }}</span>
            </div>
          </div>
          <ja-entrega [pedido]="p" />
        </div>
      } @else if (error()) {
        <ja-estado tipo="error" titulo="No hemos podido cargar el pedido" [texto]="error()" (reintentar)="cargar()" />
      } @else {
        <div class="ja-pagina"><ja-estado tipo="cargando" /></div>
      }
    </ion-content>
    @if (pedido(); as p) {
      <ion-footer class="ion-no-border">
        <div class="ja-pie">
          <div class="ja-columna">
            <div class="ja-etiqueta-s ja-t2 ja-centrado">
              {{
                p.estado === 'pendiente'
                  ? 'Puedes cancelarlo mientras esté pendiente'
                  : 'Ya no se puede cancelar: el pedido está ' + p.estado
              }}
            </div>
            <ion-button
              class="ja-boton-ancho ja-boton-cargando"
              fill="outline"
              color="danger"
              [disabled]="p.estado !== 'pendiente' || cancelando()"
              (click)="cancelar(p)"
            >
              @if (cancelando()) {
                <ion-spinner />
              } @else {
                Cancelar pedido
              }
            </ion-button>
          </div>
        </div>
      </ion-footer>
    }
  `,
})
export class DetallePedidoPage {
  private readonly servicio = inject(PedidosService);
  private readonly avisos = inject(AvisosService);

  readonly id = input.required<string>();
  readonly pedido = signal<Pedido | null>(null);
  readonly error = signal('');
  readonly cancelando = signal(false);
  readonly formato = precio;
  readonly fecha = fechaHora;
  readonly corta = fechaCorta;
  readonly metodo = metodoPago;

  readonly titulo = computed(() => `Pedido ${referenciaPedido(Number(this.id()))}`);
  readonly pasos = computed(
    () => ({ pendiente: 1, preparado: 2, entregado: 3, cancelado: 0 })[this.pedido()?.estado ?? 'cancelado'],
  );
  readonly textoEstado = computed(() => {
    const p = this.pedido();
    return p ? TEXTOS[p.entrega][p.estado] : '';
  });

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.servicio.detalle(Number(this.id())).subscribe({
      next: (p) => this.pedido.set(p),
      error: (e: ApiError) => this.error.set(e.mensaje),
    });
  }

  async cancelar(p: Pedido): Promise<void> {
    const si = await this.avisos.confirmarDestructivo(
      `¿Cancelar el pedido ${referenciaPedido(p.id)}?`,
      'Se anulará el pedido y se liberarán los productos y las copias de alquiler. No se puede deshacer.',
      'Cancelar pedido',
    );
    if (!si) {
      return;
    }
    this.cancelando.set(true);
    this.servicio.cancelar(p.id).subscribe({
      next: (actualizado) => {
        this.cancelando.set(false);
        this.pedido.set(actualizado);
        void this.avisos.mensaje('Pedido cancelado');
      },
      error: (e: ApiError) => {
        this.cancelando.set(false);
        void this.avisos.mensaje(e.mensaje);
      },
    });
  }
}
