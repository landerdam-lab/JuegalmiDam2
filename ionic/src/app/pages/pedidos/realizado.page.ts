import type { OnInit } from '@angular/core';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

import { fechaHora, metodoPago, precio, referenciaPedido } from '../../core/formato';
import type { Pedido } from '../../core/modelos';
import { PedidosService } from '../../core/pedidos.service';
import { Barra } from '../../shared/barra.component';
import { Icono } from '../../shared/icono.component';
import { Vida } from '../../shared/vida.component';

/** PT-12b ¡Pedido realizado!: el ticket del pedido recién creado. */
@Component({
  imports: [RouterLink, IonContent, IonButton, Barra, Icono, Vida],
  styles: `
    .exito {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--ja-espacio-2);
      color: var(--ja-exito);
      --tam: var(--ja-espacio-16);
    }
    .botones {
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-2);
    }
  `,
  template: `
    <ja-barra titulo="¡Pedido realizado!" [sinAcciones]="true" />
    <ion-content>
      @if (pedido(); as p) {
        <div class="ja-pagina ja-columna">
          <ja-vida [llenos]="3" [total]="3" color="var(--ja-exito)" />
          <div class="exito">
            <ja-icono nombre="check_circle" />
            <div class="ja-display">¡Pedido realizado!</div>
            <div class="ja-cuerpo ja-t2">
              {{
                p.entrega === 'domicilio'
                  ? 'Te avisaremos cuando salga hacia tu casa.'
                  : 'Te avisaremos cuando esté preparado para recoger en la tienda.'
              }}
            </div>
          </div>
          <div class="ja-caja ja-muesca">
            <div class="ja-codigo ja-marca-t">● TICKET</div>
            <div class="ja-ticket-fila">
              <span class="ja-t2">Referencia</span><span class="ja-codigo">{{ ref(p.id) }}</span>
            </div>
            <div class="ja-ticket-fila">
              <span class="ja-t2">Fecha y hora</span><span>{{ fecha(p.fecha) }}</span>
            </div>
            <div class="ja-ticket-fila">
              <span class="ja-t2">Método de pago</span><span>{{ metodo(p.metodoPago) }}</span>
            </div>
            <div class="ja-ticket-fila">
              <span class="ja-t2">Entrega</span
              ><span>{{ p.entrega === 'domicilio' ? 'Envío a domicilio' : 'Recoger en tienda' }}</span>
            </div>
            <div class="ja-separador"></div>
            <div class="ja-ticket-fila">
              <span class="ja-subtitulo">Total pagado</span><span class="ja-precio">{{ formato(p.total) }}</span>
            </div>
            <div class="ja-etiqueta-s ja-t2">Ubicación guardada con el pedido</div>
          </div>
          <div class="botones">
            <ion-button class="ja-boton-ancho" color="primary" [routerLink]="['/pedidos', p.id]" routerDirection="root"
              >Ver mi pedido</ion-button
            >
            <ion-button
              class="ja-boton-ancho"
              fill="clear"
              color="secondary"
              routerLink="/inicio"
              routerDirection="root"
              >Seguir comprando</ion-button
            >
          </div>
        </div>
      }
    </ion-content>
  `,
})
export class RealizadoPage implements OnInit {
  private readonly pedidos = inject(PedidosService);
  readonly id = input.required<string>();
  readonly pedido = signal<Pedido | null>(null);
  readonly formato = precio;
  readonly ref = referenciaPedido;
  readonly fecha = fechaHora;
  readonly metodo = metodoPago;

  ngOnInit(): void {
    this.pedidos.detalle(Number(this.id())).subscribe({ next: (p) => this.pedido.set(p), error: () => undefined });
  }
}
