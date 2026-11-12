import type { OnInit } from '@angular/core';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonFooter } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { decimal } from '../../core/formato';
import type { Tienda } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { UbicacionService } from '../../core/ubicacion.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import type { MarcaMapa } from '../../shared/mapa.component';
import { Mapa } from '../../shared/mapa.component';

export function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Component({
  imports: [IonContent, IonFooter, IonButton, Barra, Estado, Icono, Mapa],
  styles: `
    .todo {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    ja-mapa {
      flex: 1;
      --alto: 100%;
      border-radius: 0;
      min-height: 240px;
    }
    .datos {
      padding: var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-2);
    }
    .chip {
      padding: calc(var(--ja-espacio-1) / 2) var(--ja-espacio-2);
      border-radius: var(--ja-radio-completo);
      background: var(--ja-superficie-2);
    }
    .chip.marca {
      background: var(--ja-marca-suave);
      color: var(--ja-marca);
    }
  `,
  template: `
    <ja-barra titulo="Ubicación" atras="/tienda" [sinAcciones]="true" />
    <ion-content [scrollY]="false">
      @if (tienda(); as t) {
        <div class="todo">
          <ja-mapa #mapa [marcas]="marcas()" />
          <div class="datos ja-columna">
            <div class="ja-entre">
              <div class="ja-titular-m">{{ t.nombre }}</div>
              <ion-button
                fill="clear"
                color="secondary"
                aria-label="Centrar el mapa en la tienda"
                (click)="mapa.centrar()"
                ><ja-icono nombre="my_location"
              /></ion-button>
            </div>
            <div class="ja-fila ja-cuerpo"><ja-icono class="ja-marca-t" nombre="location_on" />{{ t.direccion }}</div>
            <div class="ja-fila">
              @if (distancia()) {
                <span class="ja-etiqueta-s chip marca">{{ distancia() }}</span>
              }
              <span class="ja-codigo chip">{{ t.latitud }}, {{ t.longitud }}</span>
            </div>
          </div>
        </div>
      } @else if (error()) {
        <ja-estado tipo="error" titulo="No hemos podido cargar la tienda" [texto]="error()" (reintentar)="cargar()" />
      } @else {
        <div class="ja-pagina"><ja-estado tipo="cargando" /></div>
      }
    </ion-content>
    <ion-footer class="ion-no-border">
      <div class="ja-pie">
        <div class="ja-columna">
          <ion-button class="ja-boton-ancho" color="primary" (click)="comoLlegar()"
            ><ja-icono slot="start" nombre="directions" />Cómo llegar</ion-button
          >
        </div>
      </div>
    </ion-footer>
  `,
})
export class UbicacionPage implements OnInit {
  private readonly servicio = inject(TiendaService);
  private readonly ubicacion = inject(UbicacionService);

  @ViewChild('mapa') mapa!: Mapa;

  readonly tienda = signal<Tienda | null>(null);
  readonly error = signal('');

  readonly marcas = computed<MarcaMapa[]>(() => {
    const t = this.tienda();
    if (!t) {
      return [];
    }
    const lista: MarcaMapa[] = [{ latitud: t.latitud, longitud: t.longitud, tipo: 'tienda', titulo: t.nombre }];
    const p = this.ubicacion.punto();
    if (p) {
      lista.push({ ...p, tipo: 'cliente', titulo: 'Estás aquí' });
    }
    return lista;
  });

  readonly distancia = computed(() => {
    const t = this.tienda();
    const p = this.ubicacion.punto();
    if (!t || !p) {
      return '';
    }
    const m = distanciaMetros(p.latitud, p.longitud, t.latitud, t.longitud);
    return m < 1000 ? `Estás a ${Math.round(m)} m` : `Estás a ${decimal(m / 1000)} km`;
  });

  ngOnInit(): void {
    this.cargar();
    void this.ubicacion.actualizar();
  }

  cargar(): void {
    this.error.set('');
    this.servicio
      .tienda()
      .subscribe({ next: (t) => this.tienda.set(t), error: (e: ApiError) => this.error.set(e.mensaje) });
  }

  comoLlegar(): void {
    const t = this.tienda();
    if (t) {
      window.open(
        `geo:${t.latitud},${t.longitud}?q=${t.latitud},${t.longitud}(${encodeURIComponent(t.nombre)})`,
        '_system',
      );
    }
  }
}
