import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  IonCard,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';

import { AgitarService } from '../../core/agitar.service';
import type { ApiError } from '../../core/api-error';
import { diasHasta, fecha, fechaCorta, precio } from '../../core/formato';
import type { Alquiler } from '../../core/modelos';
import { PedidosService } from '../../core/pedidos.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Imagen } from '../../shared/imagen.component';
import { Pastilla } from '../../shared/pastilla.component';
import { Vida } from '../../shared/vida.component';

/** PT-16 Mis alquileres: Activos · Retrasados · Devueltos. Las devoluciones se registran en la tienda. */
@Component({
  imports: [
    RouterLink,
    IonContent,
    IonCard,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    Barra,
    Estado,
    Imagen,
    Pastilla,
    Vida,
  ],
  styles: `
    .interior {
      display: flex;
      gap: var(--ja-espacio-3);
      padding: var(--ja-espacio-3);
    }
    ja-imagen {
      flex: none;
      width: 72px;
      border-radius: var(--ja-radio-s);
    }
    .datos {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-1);
    }
    ion-card {
      cursor: pointer;
    }
  `,
  template: `
    <ja-barra titulo="Mis alquileres" />
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content /></ion-refresher>
      <ion-segment [value]="estado()" (ionChange)="cambiar($any($event).detail.value)">
        <ion-segment-button value="activo"><ion-label>Activos</ion-label></ion-segment-button>
        <ion-segment-button value="retrasado"><ion-label>Retrasados</ion-label></ion-segment-button>
        <ion-segment-button value="devuelto"><ion-label>Devueltos</ion-label></ion-segment-button>
      </ion-segment>
      <div class="ja-pagina">
        <div class="ja-etiqueta-s ja-t2">Las devoluciones se registran en la tienda</div>
        @if (cargando() && !alquileres().length) {
          <ja-estado tipo="cargando" />
        } @else if (error()) {
          <ja-estado
            tipo="error"
            titulo="No hemos podido cargar tus alquileres"
            [texto]="error()"
            (reintentar)="cargar(1)"
          />
        } @else if (!alquileres().length) {
          <ja-estado
            tipo="vacio"
            icono="event"
            titulo="No hay alquileres aquí"
            texto="Alquila un videojuego desde su ficha y lo verás en esta lista."
          />
        } @else {
          <div class="ja-lista">
            @for (a of alquileres(); track a.id) {
              <ion-card class="ja-tarjeta" [routerLink]="['/pedidos', a.pedidoId]">
                <div class="interior">
                  <ja-imagen [src]="a.videojuego.imagen" [alt]="a.videojuego.nombre" />
                  <div class="datos">
                    <div class="ja-entre">
                      <span class="ja-subtitulo">{{ a.videojuego.nombre }}</span>
                      <ja-pastilla [estado]="'alquiler-' + a.estado" />
                    </div>
                    <div class="ja-etiqueta-s ja-t2">
                      {{ corta(a.fechaInicio) }} → {{ corta(a.fechaFin) }} · {{ formato(a.subtotal) }}
                    </div>
                    <div class="ja-codigo">{{ cuenta(a) }}</div>
                    @if (a.estado === 'activo' || a.estado === 'retrasado') {
                      <ja-vida
                        [llenos]="vidaRestante(a)"
                        [total]="5"
                        [color]="a.estado === 'retrasado' ? 'var(--ja-error)' : 'var(--ja-alquiler)'"
                      />
                    }
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
export class AlquileresPage implements OnInit {
  private readonly servicio = inject(PedidosService);
  private readonly agitar = inject(AgitarService);
  private readonly destruir = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly estado = signal('activo');
  readonly alquileres = signal<Alquiler[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly hayMas = signal(false);
  readonly formato = precio;
  readonly corta = fechaCorta;
  private pagina = 1;

  ngOnInit(): void {
    this.agitar.agitado$.pipe(takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (this.router.url.startsWith('/alquileres')) {
        this.cargar(1);
      }
    });
  }

  ionViewWillEnter(): void {
    this.cargar(1);
  }

  cambiar(estado: string): void {
    this.estado.set(estado);
    this.alquileres.set([]);
    this.cargar(1);
  }

  /** La barra de vida se vacía a medida que se acerca la fecha de devolución. */
  vidaRestante(a: Alquiler): number {
    return Math.max(0, Math.min(5, Math.ceil((diasHasta(a.fechaFin) / Math.max(a.dias, 1)) * 5)));
  }

  cuenta(a: Alquiler): string {
    if (a.fechaDevolucion) {
      return `Devuelto el ${fecha(a.fechaDevolucion)}`;
    }
    const dias = diasHasta(a.fechaFin);
    if (dias === 0) {
      return 'Devuélvelo hoy';
    }
    return dias > 0 ? `Quedan ${dias} días` : `Retrasado ${-dias} días`;
  }

  cargar(pagina: number, fin?: () => void): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.alquileres(this.estado(), pagina).subscribe({
      next: (r) => {
        this.pagina = pagina;
        this.alquileres.set(pagina === 1 ? r.items : [...this.alquileres(), ...r.items]);
        this.hayMas.set(r.page * r.limit < r.total);
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
