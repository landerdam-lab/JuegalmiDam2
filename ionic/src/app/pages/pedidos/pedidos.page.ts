import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  IonCard,
  IonChip,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular';

import { AgitarService } from '../../core/agitar.service';
import type { ApiError } from '../../core/api-error';
import { fechaHora, metodoPago, precio, referenciaPedido } from '../../core/formato';
import type { EstadoPedido, Pedido, ProductoCorto } from '../../core/modelos';
import { PedidosService } from '../../core/pedidos.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';
import { Pastilla } from '../../shared/pastilla.component';
import { Vida } from '../../shared/vida.component';

const PASOS: Record<EstadoPedido, number> = { pendiente: 1, preparado: 2, entregado: 3, cancelado: 0 };

/** PT-13 Mis pedidos, con filtro por estado (lo aplica la API). */
@Component({
  imports: [
    RouterLink,
    IonContent,
    IonCard,
    IonChip,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    Barra,
    Estado,
    Icono,
    Imagen,
    Pastilla,
    Vida,
  ],
  styles: `
    .interior {
      padding: var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-2);
    }
    ion-card {
      cursor: pointer;
    }
    .lista {
      padding: 0 var(--ja-espacio-4) var(--ja-espacio-4);
    }
    .contador {
      padding: 0 0 var(--ja-espacio-3);
    }
    .codigo {
      padding: calc(var(--ja-espacio-1) / 2) var(--ja-espacio-2);
      border-radius: var(--ja-radio-completo);
      background: var(--ja-superficie-2);
    }
    .miniaturas {
      display: flex;
      gap: var(--ja-espacio-2);
    }
    .miniaturas ja-imagen {
      width: calc(var(--ja-espacio-12) + var(--ja-espacio-2));
      border-radius: var(--ja-radio-s);
    }
    .fecha {
      flex: 1;
    }
    .pago {
      padding: var(--ja-espacio-1) var(--ja-espacio-2);
      border-radius: var(--ja-radio-completo);
      background: var(--ja-superficie-2);
    }
  `,
  template: `
    <ja-barra titulo="Mis pedidos" />
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content /></ion-refresher>
      <div class="ja-chips">
        @for (f of filtros; track f.texto) {
          <ion-chip [class.activo]="estado() === f.valor" (click)="filtrar(f.valor)">{{ f.texto }}</ion-chip>
        }
      </div>
      <div class="lista">
        @if (cargando() && !pedidos().length) {
          <ja-estado tipo="cargando" />
        } @else if (error()) {
          <ja-estado
            tipo="error"
            titulo="No hemos podido cargar tus pedidos"
            [texto]="error()"
            (reintentar)="cargar(1)"
          />
        } @else if (!pedidos().length) {
          <ja-estado
            tipo="vacio"
            icono="receipt_long"
            titulo="Aún no tienes pedidos"
            texto="Cuando compres o alquiles algo, aparecerá aquí."
          />
        } @else {
          <div class="contador ja-contador">{{ total() }} {{ total() === 1 ? 'pedido' : 'pedidos' }}</div>
          <div class="ja-lista">
            @for (p of pedidos(); track p.id) {
              <ion-card class="ja-tarjeta" [routerLink]="['/pedidos', p.id]">
                <div class="interior">
                  <div class="ja-fila">
                    <span class="ja-codigo codigo">{{ ref(p.id) }}</span>
                    <span class="ja-cuerpo ja-t2 fecha">{{ fecha(p.fecha) }}</span>
                    <ja-icono nombre="chevron_right" />
                  </div>
                  <div class="ja-entre">
                    <ja-pastilla [estado]="'pedido-' + p.estado" />
                    <span class="ja-codigo ja-t2">{{ pasos[p.estado] }} / 3</span>
                  </div>
                  <ja-vida [llenos]="pasos[p.estado]" [total]="3" />
                  <div class="miniaturas">
                    @for (m of miniaturas(p); track $index) {
                      <ja-imagen [src]="m.imagen" [alt]="m.nombre" />
                    }
                  </div>
                  <div class="ja-entre">
                    <span class="ja-etiqueta pago">{{ pago(p.metodoPago) }}</span>
                    <span class="ja-precio">{{ formato(p.total) }}</span>
                  </div>
                </div>
              </ion-card>
            }
          </div>
        }
      </div>
      <ion-infinite-scroll [disabled]="!hayMas()" (ionInfinite)="mas($event)"
        ><ion-infinite-scroll-content
      /></ion-infinite-scroll>
    </ion-content>
  `,
})
export class PedidosPage implements OnInit {
  private readonly servicio = inject(PedidosService);
  private readonly agitar = inject(AgitarService);
  private readonly destruir = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly filtros: { texto: string; valor: string | null }[] = [
    { texto: 'Todos', valor: null },
    { texto: 'Pendientes', valor: 'pendiente' },
    { texto: 'Preparados', valor: 'preparado' },
    { texto: 'Entregados', valor: 'entregado' },
    { texto: 'Cancelados', valor: 'cancelado' },
  ];
  readonly pasos = PASOS;
  readonly formato = precio;
  readonly ref = referenciaPedido;
  readonly fecha = fechaHora;
  readonly pago = metodoPago;

  readonly estado = signal<string | null>(null);
  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly hayMas = signal(false);
  readonly total = signal(0);
  private pagina = 1;

  ngOnInit(): void {
    this.agitar.agitado$.pipe(takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (this.router.url.startsWith('/pedidos')) {
        this.cargar(1);
      }
    });
  }

  // Ionic mantiene viva la página: al volver de un detalle (quizá cancelado) se recarga
  ionViewWillEnter(): void {
    this.cargar(1);
  }

  /** Hasta cuatro imágenes de lo que lleva el pedido. */
  miniaturas(p: Pedido): ProductoCorto[] {
    return [...p.compras.map((c) => c.producto), ...p.alquileres.map((a) => a.videojuego)].slice(0, 4);
  }

  filtrar(valor: string | null): void {
    this.estado.set(valor);
    this.pedidos.set([]);
    this.cargar(1);
  }

  cargar(pagina: number, fin?: () => void): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar(this.estado(), pagina).subscribe({
      next: (r) => {
        this.pagina = pagina;
        this.pedidos.set(pagina === 1 ? r.items : [...this.pedidos(), ...r.items]);
        this.hayMas.set(r.page * r.limit < r.total);
        this.total.set(r.total);
        this.cargando.set(false);
        fin?.();
      },
      error: (e: ApiError) => {
        this.cargando.set(false);
        this.error.set(e.mensaje);
        fin?.();
      },
    });
  }

  refrescar(e: Event): void {
    this.cargar(1, () => void (e.target as HTMLIonRefresherElement).complete());
  }

  mas(e: Event): void {
    this.cargar(this.pagina + 1, () => void (e.target as HTMLIonInfiniteScrollElement).complete());
  }
}
